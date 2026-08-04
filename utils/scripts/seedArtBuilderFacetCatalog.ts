// /utils/scripts/seedArtBuilderFacetCatalog.ts
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { ART_CARDS } from './../../stores/helpers/artCards'
import type { BuilderChoice } from './../../stores/helpers/builderCards'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'
import { imageSrcToMediaPath, mediaAssetExists } from './mediaContractSource'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

type Taxonomy = 'ART_DIRECTION' | 'STYLE' | 'MOOD'

type FieldDefinition = {
  taxonomy: Taxonomy
  groupKey: string
  groupLabel: string
  sourceRank: number
}

type Candidate = FieldDefinition & {
  fieldKey: string
  title: string
  builderValue: string
  description?: string
  imagePath?: string
  requestedImagePath?: string
  sortOrder: number
  promptHint?: string
  loras: string[]
}

const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  subject: {
    taxonomy: 'ART_DIRECTION',
    groupKey: 'art-subject',
    groupLabel: 'Art Subject Types',
    sourceRank: 8,
  },
  punk: {
    taxonomy: 'STYLE',
    groupKey: 'punk',
    groupLabel: 'Punk Aesthetics',
    sourceRank: 8,
  },
  emotion: {
    taxonomy: 'MOOD',
    groupKey: 'art-mood',
    groupLabel: 'Art Moods',
    sourceRank: 8,
  },
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function metadataStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && Boolean(entry.trim()),
      )
    : []
}

async function existingPublicImagePath(value: unknown): Promise<{
  imagePath?: string
  requestedImagePath?: string
}> {
  const requestedImagePath = clean(value)
  if (!requestedImagePath) return {}
  if (!requestedImagePath.startsWith('/images/')) return { requestedImagePath }
  const exists =
    existsSync(resolve(process.cwd(), 'public', requestedImagePath.slice(1))) ||
    (await mediaAssetExists(imageSrcToMediaPath(requestedImagePath)))
  return exists
    ? { imagePath: requestedImagePath, requestedImagePath }
    : { requestedImagePath }
}

async function candidateFromChoice(
  fieldKey: string,
  definition: FieldDefinition,
  choice: BuilderChoice,
  sortOrder: number,
): Promise<Candidate | null> {
  const builderValue = clean(choice.value)
  const title = clean(choice.label) || builderValue
  if (!builderValue || !title) return null
  const payload = metadataRecord(choice.payload)
  const artwork = await existingPublicImagePath(choice.image)

  return {
    ...definition,
    fieldKey,
    title,
    builderValue,
    description: clean(choice.subtext) || undefined,
    imagePath: artwork.imagePath,
    requestedImagePath: artwork.requestedImagePath,
    sortOrder,
    promptHint: clean(payload.promptHint) || undefined,
    loras: metadataStrings(payload.loras),
  }
}

async function collectCandidates(): Promise<Candidate[]> {
  const candidates = new Map<string, Candidate>()

  for (const card of ART_CARDS) {
    for (const step of card.steps) {
      const fieldKey = clean(step.field) || clean(step.key) || clean(card.key)
      const definition = FIELD_DEFINITIONS[fieldKey]
      if (!definition) continue
      let sortOrder = 0

      for (const choice of step.choices ?? []) {
        if (choice.opensCustom) continue
        if (choice.opensList) {
          for (const option of choice.listOptions ?? []) {
            const builderValue = clean(option)
            if (!builderValue) continue
            const key = `${fieldKey}:${normalizeFacetLookupKey(builderValue)}`
            if (!candidates.has(key)) {
              candidates.set(key, {
                ...definition,
                fieldKey,
                title: builderValue,
                builderValue,
                sortOrder: sortOrder++,
                loras: [],
              })
            }
          }
          continue
        }

        const candidate = await candidateFromChoice(
          fieldKey,
          definition,
          choice,
          sortOrder++,
        )
        if (!candidate) continue
        candidates.set(
          `${fieldKey}:${normalizeFacetLookupKey(candidate.builderValue)}`,
          candidate,
        )
      }

      for (const option of step.listOptions ?? []) {
        const builderValue = clean(option)
        if (!builderValue) continue
        const key = `${fieldKey}:${normalizeFacetLookupKey(builderValue)}`
        if (!candidates.has(key)) {
          candidates.set(key, {
            ...definition,
            fieldKey,
            title: builderValue,
            builderValue,
            sortOrder: sortOrder++,
            loras: [],
          })
        }
      }
    }
  }

  return Array.from(candidates.values())
}

type CatalogState = {
  aliasOwner: Map<string, number>
  facets: Map<
    number,
    {
      id: number
      title: string
      slug: string | null
      description: string | null
      imagePath: string | null
      designer: string | null
    }
  >
  profiles: Map<
    number,
    {
      taxonomy: string
      canonicalValue: string | null
      groupKey: string | null
      groupLabel: string | null
      sortOrder: number
      sourceRank: number
      metadata: string | null
    }
  >
}

async function loadCatalogState(): Promise<CatalogState> {
  const [aliases, facets, profiles] = await Promise.all([
    prisma.facetAlias.findMany({ select: { lookupKey: true, facetId: true } }),
    prisma.facet.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        imagePath: true,
        designer: true,
      },
    }),
    prisma.facetProfile.findMany({
      select: {
        facetId: true,
        taxonomy: true,
        canonicalValue: true,
        groupKey: true,
        groupLabel: true,
        sortOrder: true,
        sourceRank: true,
        metadata: true,
      },
    }),
  ])

  return {
    aliasOwner: new Map(
      aliases.map((alias) => [alias.lookupKey, alias.facetId]),
    ),
    facets: new Map(facets.map((facet) => [facet.id, facet])),
    profiles: new Map(profiles.map((profile) => [profile.facetId, profile])),
  }
}

function parseMetadata(value: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    return metadataRecord(JSON.parse(value))
  } catch {
    return {}
  }
}

async function saveCandidate(
  candidate: Candidate,
  state: CatalogState,
): Promise<void> {
  const lookupKey = normalizeFacetLookupKey(candidate.builderValue)
  const aliasFacetId = state.aliasOwner.get(lookupKey)
  const aliasProfile = aliasFacetId
    ? state.profiles.get(aliasFacetId)
    : undefined
  const reusableFacetId =
    aliasFacetId && aliasProfile?.taxonomy === candidate.taxonomy
      ? aliasFacetId
      : undefined
  const slug = `art-${candidate.groupKey}-${slugify(candidate.builderValue)}`
  const existingBySlug = reusableFacetId
    ? null
    : await prisma.facet.findUnique({ where: { slug } })
  const existing = reusableFacetId
    ? state.facets.get(reusableFacetId)
    : existingBySlug

  const facet = existing
    ? await prisma.facet.update({
        where: { id: existing.id },
        data: {
          description: existing.description || candidate.description,
          imagePath: existing.imagePath || candidate.imagePath,
          designer: existing.designer || 'facet-catalog',
          isActive: true,
        },
      })
    : await prisma.facet.create({
        data: {
          title: candidate.title,
          slug,
          description: candidate.description,
          imagePath: candidate.imagePath,
          designer: 'facet-catalog',
          creationSource: 'HUMAN',
          userId: 1,
          isPublic: true,
          isMature: false,
          isActive: true,
        },
      })

  const previousProfile = state.profiles.get(facet.id)
  const previousMetadata = parseMetadata(previousProfile?.metadata ?? null)
  const previousArtBuilder = metadataRecord(previousMetadata.artBuilder)
  const artBuilderFields = new Set([
    ...metadataStrings(previousMetadata.artBuilderFields),
    candidate.fieldKey,
  ])
  const metadata = {
    ...previousMetadata,
    source: previousMetadata.source || 'art-builder',
    artBuilderFields: Array.from(artBuilderFields),
    artBuilder: {
      ...previousArtBuilder,
      [candidate.fieldKey]: {
        builderValue: candidate.builderValue,
        promptHint: candidate.promptHint,
        loras: candidate.loras,
        requestedImagePath: candidate.requestedImagePath,
        artworkStatus: candidate.imagePath ? 'available' : 'missing',
      },
    },
  }
  const preserveExistingGroup =
    previousProfile?.groupKey && previousProfile.groupKey !== candidate.groupKey

  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: candidate.taxonomy,
      canonicalValue: candidate.builderValue,
      groupKey: candidate.groupKey,
      groupLabel: candidate.groupLabel,
      sortOrder: candidate.sortOrder,
      isRandomizable: true,
      randomWeight: 1,
      artRequired: true,
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(metadata),
    },
    update: {
      taxonomy: candidate.taxonomy,
      canonicalValue: previousProfile?.canonicalValue || candidate.builderValue,
      groupKey: preserveExistingGroup
        ? previousProfile.groupKey
        : candidate.groupKey,
      groupLabel: preserveExistingGroup
        ? previousProfile.groupLabel
        : candidate.groupLabel,
      sortOrder: preserveExistingGroup
        ? previousProfile.sortOrder
        : candidate.sortOrder,
      isRandomizable: true,
      artRequired: true,
      sourceRank: preserveExistingGroup
        ? previousProfile.sourceRank
        : Math.min(previousProfile?.sourceRank ?? 100, candidate.sourceRank),
      metadata: JSON.stringify(metadata),
    },
  })

  const aliases = [slug]
  if (!aliasFacetId || aliasFacetId === facet.id) {
    aliases.push(candidate.builderValue, candidate.title)
  }
  for (const alias of prepareUniqueFacetAliases(aliases)) {
    const ownerId = state.aliasOwner.get(alias.lookupKey)
    if (ownerId && ownerId !== facet.id) continue
    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
      update: {
        facetId: facet.id,
        alias: alias.alias,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
    })
    state.aliasOwner.set(alias.lookupKey, facet.id)
  }

  state.facets.set(facet.id, facet)
  state.profiles.set(facet.id, {
    taxonomy: candidate.taxonomy,
    canonicalValue: previousProfile?.canonicalValue || candidate.builderValue,
    groupKey: preserveExistingGroup
      ? previousProfile.groupKey
      : candidate.groupKey,
    groupLabel: preserveExistingGroup
      ? previousProfile.groupLabel
      : candidate.groupLabel,
    sortOrder: preserveExistingGroup
      ? previousProfile.sortOrder
      : candidate.sortOrder,
    sourceRank: preserveExistingGroup
      ? previousProfile.sourceRank
      : Math.min(previousProfile?.sourceRank ?? 100, candidate.sourceRank),
    metadata: JSON.stringify(metadata),
  })
}

async function main(): Promise<void> {
  const candidates = await collectCandidates()
  const byField = candidates.reduce<Record<string, number>>(
    (counts, candidate) => {
      counts[candidate.fieldKey] = (counts[candidate.fieldKey] ?? 0) + 1
      return counts
    },
    {},
  )

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          candidates: candidates.length,
          byField,
          note: 'Art mode, figure count, resources, and negative filters remain operational configuration.',
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  const state = await loadCatalogState()
  for (const candidate of candidates) await saveCandidate(candidate, state)

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        candidates: candidates.length,
        saved: candidates.length,
        byField,
      },
      null,
      2,
    )}\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
