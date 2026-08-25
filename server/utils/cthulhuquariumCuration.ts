import { createError } from 'h3'
import { parse as parseYaml } from 'yaml'
import type {
  CthulhuquariumCurationData,
  CthulhuquariumCurationEntry,
  CthulhuquariumCurationFish,
  CthulhuquariumCurationUpdate,
  CthulhuquariumFish,
  CurationInspiration,
} from '~/types/curationStudio'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'

const SOURCE_REPO = 'silasfelinus/cthulhuquarium'
const SOURCE_REF = 'master'
const FISH_DIRECTORY = 'fish'
const CURATION_PATH = 'projects/cthulhuquarium/curation-studio.json'
const CACHE_TTL_MS = 5 * 60 * 1000

type GithubDirEntry = {
  name: string
  path: string
  type: string
  download_url?: string | null
  html_url?: string | null
}

type CurationLedger = {
  schemaVersion: 1
  sourceRepo: string
  entries: Record<string, CthulhuquariumCurationEntry>
}

type FishYaml = {
  slug?: unknown
  name?: unknown
  species?: unknown
  rarity?: unknown
  field_note?: unknown
  art_prompt?: unknown
}

let fishCache: { expiresAt: number; fish: CthulhuquariumFish[] } | null = null

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function githubToken(): string {
  const runtimeToken = useRuntimeConfig().githubToken
  return (
    process.env.GITHUB_TOKEN ||
    (typeof runtimeToken === 'string' ? runtimeToken : '')
  ).trim()
}

function githubHeaders(): Record<string, string> {
  const token = githubToken()
  return {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function githubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders() })
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub source read failed (${response.status}).`,
    })
  }
  return (await response.json()) as T
}

async function githubText(url: string): Promise<string> {
  const response = await fetch(url, { headers: githubHeaders() })
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub fish read failed (${response.status}).`,
    })
  }
  return await response.text()
}

function fishFromYaml(sourcePath: string, sourceUrl: string, raw: string): CthulhuquariumFish | null {
  const parsed = parseYaml(raw) as FishYaml | null
  if (!parsed || typeof parsed !== 'object') return null
  const slug = text(parsed.slug)
  const name = text(parsed.name)
  if (!slug || !name) return null
  return {
    slug,
    name,
    species: text(parsed.species),
    rarity: text(parsed.rarity) || 'UNKNOWN',
    fieldNote: text(parsed.field_note),
    artPrompt: text(parsed.art_prompt),
    sourcePath,
    sourceUrl,
  }
}

async function loadFishCanon(): Promise<CthulhuquariumFish[]> {
  const now = Date.now()
  if (fishCache && fishCache.expiresAt > now) return fishCache.fish

  const directory = await githubJson<GithubDirEntry[]>(
    `https://api.github.com/repos/${SOURCE_REPO}/contents/${FISH_DIRECTORY}?ref=${SOURCE_REF}`,
  )
  const yamlFiles = directory.filter(
    (entry) => entry.type === 'file' && entry.name.endsWith('.yaml') && entry.download_url,
  )
  const fish = (
    await Promise.all(
      yamlFiles.map(async (entry) => {
        const raw = await githubText(entry.download_url as string)
        return fishFromYaml(entry.path, entry.html_url || '', raw)
      }),
    )
  )
    .filter((entry): entry is CthulhuquariumFish => Boolean(entry))
    .sort((a, b) => a.name.localeCompare(b.name))

  fishCache = { expiresAt: now + CACHE_TTL_MS, fish }
  return fish
}

function blankEntry(): CthulhuquariumCurationEntry {
  return {
    promptOverride: '',
    inspirations: [],
    candidateImageIds: [],
    selectedDesignImageId: null,
    spriteImageIds: [],
    updatedAt: null,
  }
}

function positiveIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
}

function cleanInspirations(value: unknown): CurationInspiration[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const url = text(record.url)
      if (!/^https:\/\//i.test(url)) return null
      return {
        id: text(record.id) || crypto.randomUUID(),
        label: text(record.label) || 'Inspiration',
        url,
      }
    })
    .filter((item): item is CurationInspiration => Boolean(item))
    .slice(0, 20)
}

function normalizeEntry(value: unknown): CthulhuquariumCurationEntry {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const selected = Number(record.selectedDesignImageId)
  return {
    promptOverride: text(record.promptOverride),
    inspirations: cleanInspirations(record.inspirations),
    candidateImageIds: positiveIds(record.candidateImageIds),
    selectedDesignImageId: Number.isInteger(selected) && selected > 0 ? selected : null,
    spriteImageIds: positiveIds(record.spriteImageIds),
    updatedAt: text(record.updatedAt) || null,
  }
}

async function loadLedger(): Promise<{ ledger: CurationLedger; sha?: string }> {
  const source = await conductorGet(CURATION_PATH)
  if (!source) {
    return {
      ledger: { schemaVersion: 1, sourceRepo: SOURCE_REPO, entries: {} },
    }
  }
  try {
    const parsed = JSON.parse(source.content) as Partial<CurationLedger>
    const rawEntries =
      parsed.entries && typeof parsed.entries === 'object' ? parsed.entries : {}
    return {
      sha: source.sha,
      ledger: {
        schemaVersion: 1,
        sourceRepo: SOURCE_REPO,
        entries: Object.fromEntries(
          Object.entries(rawEntries).map(([slug, entry]) => [slug, normalizeEntry(entry)]),
        ),
      },
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: `Invalid JSON in ${CURATION_PATH}.`,
    })
  }
}

export async function getCthulhuquariumCuration(): Promise<CthulhuquariumCurationData> {
  const [fish, { ledger }] = await Promise.all([loadFishCanon(), loadLedger()])
  const merged: CthulhuquariumCurationFish[] = fish.map((entry) => ({
    ...entry,
    curation: ledger.entries[entry.slug] ?? blankEntry(),
  }))
  return {
    fish: merged,
    sourceRepo: SOURCE_REPO,
    sourceRef: SOURCE_REF,
    curationPath: CURATION_PATH,
    fetchedAt: new Date().toISOString(),
  }
}

export async function updateCthulhuquariumCuration(
  update: CthulhuquariumCurationUpdate,
): Promise<CthulhuquariumCurationEntry> {
  const slug = text(update.slug).toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid fish slug.' })
  }
  const fish = await loadFishCanon()
  if (!fish.some((entry) => entry.slug === slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Fish was not found in the current source canon.' })
  }

  const { ledger, sha } = await loadLedger()
  const previous = ledger.entries[slug] ?? blankEntry()
  const next = normalizeEntry({
    ...previous,
    ...(typeof update.promptOverride === 'string'
      ? { promptOverride: update.promptOverride.slice(0, 6000) }
      : {}),
    ...(update.inspirations ? { inspirations: update.inspirations } : {}),
    ...(update.candidateImageIds ? { candidateImageIds: update.candidateImageIds } : {}),
    ...(Object.prototype.hasOwnProperty.call(update, 'selectedDesignImageId')
      ? { selectedDesignImageId: update.selectedDesignImageId }
      : {}),
    ...(update.spriteImageIds ? { spriteImageIds: update.spriteImageIds } : {}),
    updatedAt: new Date().toISOString(),
  })
  ledger.entries[slug] = next

  await conductorPut(
    CURATION_PATH,
    `${JSON.stringify(ledger, null, 2)}\n`,
    `cthulhuquarium: update ${slug} curation state`,
    sha,
  )
  return next
}
