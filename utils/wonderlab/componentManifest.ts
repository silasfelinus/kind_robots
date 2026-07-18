// /utils/wonderlab/componentManifest.ts
export type WonderLabManifestEntry = {
  sourceKey: string
  sourcePath: string
  sourceHash: string
  componentName: string
  slug: string
  folderName: string
}

export type WonderLabComponentManifest = {
  version: number
  generatedAt: string
  componentRoot: string
  count: number
  entries: WonderLabManifestEntry[]
}

let manifestPromise: Promise<WonderLabComponentManifest> | null = null

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\/+/, '')
}

function normalizeComponentName(value: string): string {
  return value.trim().replace(/\.vue$/i, '').toLowerCase()
}

function isManifest(value: unknown): value is WonderLabComponentManifest {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<WonderLabComponentManifest>
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(
      (entry) =>
        entry &&
        typeof entry.sourcePath === 'string' &&
        typeof entry.sourceHash === 'string' &&
        typeof entry.componentName === 'string' &&
        typeof entry.folderName === 'string',
    )
  )
}

export function loadWonderLabComponentManifest(
  fetcher: () => Promise<unknown>,
): Promise<WonderLabComponentManifest> {
  manifestPromise ??= fetcher().then((payload) => {
    if (!isManifest(payload)) {
      throw new Error('WonderLab component manifest has an invalid shape.')
    }

    return payload
  })

  return manifestPromise
}

export function resetWonderLabManifestCacheForTests(): void {
  manifestPromise = null
}

export function resolveWonderLabManifestEntry(
  entries: WonderLabManifestEntry[],
  componentName: string,
  folderName = '',
  sourcePath = '',
): WonderLabManifestEntry | null {
  const normalizedSourcePath = normalizePath(sourcePath).toLowerCase()
  if (normalizedSourcePath) {
    const exactPath = entries.find(
      (entry) => normalizePath(entry.sourcePath).toLowerCase() === normalizedSourcePath,
    )
    if (exactPath) return exactPath
  }

  const normalizedName = normalizeComponentName(componentName)
  const candidates = entries.filter(
    (entry) => normalizeComponentName(entry.componentName) === normalizedName,
  )

  if (!candidates.length) return null
  if (candidates.length === 1) return candidates[0] ?? null

  const normalizedFolder = normalizePath(folderName).toLowerCase()
  if (!normalizedFolder) return null

  return (
    candidates.find(
      (entry) => normalizePath(entry.folderName).toLowerCase() === normalizedFolder,
    ) ??
    candidates.find((entry) => {
      const entryFolder = normalizePath(entry.folderName).toLowerCase()
      return (
        entryFolder.endsWith(`/${normalizedFolder}`) ||
        normalizedFolder.endsWith(`/${entryFolder}`)
      )
    }) ??
    null
  )
}

export function wonderLabSourceUrl(
  entry: WonderLabManifestEntry,
  repository = 'silasfelinus/kind_robots',
  ref = 'main',
): string {
  const safePath = normalizePath(entry.sourcePath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `https://github.com/${repository}/blob/${encodeURIComponent(ref)}/${safePath}`
}
