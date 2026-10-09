import { createError } from 'h3'

const ROOT = 'https://raw.githubusercontent.com/silasfelinus/conductor/main/'
const CACHE_MS = 5 * 60 * 1000

export type ZuzuLedgerAsset = {
  id: number
  key: string
  entity: string | null
  source: string
  sourceProject: string
  jobIds: number[]
}

type SourceCache = {
  loadedAt: number
  items: Map<number, ZuzuLedgerAsset>
  ledgerCount: number
}

let snapshot: SourceCache | null = null
let loading: Promise<SourceCache> | null = null

async function readJson(path: string): Promise<unknown> {
  const response = await fetch(ROOT + path, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/json' },
  })
  if (!response.ok)
    throw new Error(`Conductor source unavailable (${response.status})`)
  return response.json()
}

async function load(): Promise<SourceCache> {
  const catalog = (await readJson('worlds/zuzu/catalog.json')) as {
    asset_inventory?: { ledger_parts?: unknown }
  }
  const paths = catalog.asset_inventory?.ledger_parts
  if (
    !Array.isArray(paths) ||
    paths.length < 4 ||
    paths.length > 25 ||
    !paths.every(
      (p): p is string =>
        typeof p === 'string' &&
        /^worlds\/zuzu\/assets\/ledger-part-\d{2}\.json$/.test(p),
    )
  ) {
    throw new Error('Conductor Zuzu ledger manifest is invalid.')
  }
  const documents = await Promise.all(paths.map((path) => readJson(path)))
  const items = new Map<number, ZuzuLedgerAsset>()
  for (const document of documents) {
    const shard = document as {
      ledgers?: {
        path: string
        entries: {
          key: string
          entity: string | null
          jobs: number[]
          outputs: { id: number | null; status: string }[]
        }[]
      }[]
    }
    if (!Array.isArray(shard.ledgers)) throw new Error('Invalid art ledger.')
    for (const ledger of shard.ledgers) {
      const sourceProject = /\/MV-(?:FIXES|KEYFRAMES)\.yaml$/.test(ledger.path)
        ? 'music-video'
        : 'comic-creator'
      for (const entry of ledger.entries) {
        for (const output of entry.outputs ?? []) {
          const id = output.id
          if (!Number.isInteger(id) || id === null || id <= 0) continue
          items.set(id, {
            id,
            key: entry.key,
            entity: entry.entity || null,
            source: ledger.path,
            sourceProject,
            jobIds: Array.isArray(entry.jobs)
              ? entry.jobs.filter(Number.isInteger)
              : [],
          })
        }
      }
    }
  }

  const videoBuilds = (await readJson(
    'worlds/zuzu/assets/video-builds.json',
  )) as {
    videos?: {
      id: number
      final_art_image_id?: number | null
      older_exports?: number[]
      art_image_refs?: number[]
      animation_revisions?: {
        clip_art_image_id?: number | null
        status: string
      }[]
    }[]
  }
  for (const video of videoBuilds.videos ?? []) {
    const ids = [
      video.final_art_image_id,
      ...(video.older_exports ?? []),
      ...(video.art_image_refs ?? []),
      ...(video.animation_revisions ?? []).map(
        (revision) => revision.clip_art_image_id,
      ),
    ]
    for (const id of ids) {
      if (!Number.isInteger(id) || !id || items.has(id)) continue
      items.set(id, {
        id,
        key: `Music video #${video.id}: render or animation #${id}`,
        entity: 'music-video',
        source: 'worlds/zuzu/assets/video-builds.json',
        sourceProject: 'music-video',
        jobIds: [],
      })
    }
  }

  return { loadedAt: Date.now(), items, ledgerCount: paths.length }
}

export async function loadZuzuArtLedger(): Promise<SourceCache> {
  if (snapshot && Date.now() - snapshot.loadedAt < CACHE_MS) return snapshot
  if (!loading) {
    loading = load()
      .then((value) => {
        snapshot = value
        return value
      })
      .catch((error: unknown) => {
        if (snapshot) return snapshot
        throw createError({
          statusCode: 503,
          message:
            error instanceof Error
              ? `Unable to read the Zuzu world registry: ${error.message}`
              : 'Unable to read the Zuzu world registry.',
        })
      })
      .finally(() => {
        loading = null
      })
  }
  return loading
}
