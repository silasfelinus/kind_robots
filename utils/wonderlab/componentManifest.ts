// /utils/wonderlab/componentManifest.ts
export type WonderLabComponentSourceEvidence = {
  version: 1
  lineCount: number
  blocks: string[]
  props: string[]
  emits: string[]
  customComponents: string[]
  nativeElements: string[]
  staticText: string[]
  functionNames: string[]
  localImports: string[]
  facts: string[]
}

export type WonderLabManifestEntry = {
  sourceKey: string
  sourcePath: string
  sourceHash: string
  componentName: string
  slug: string
  folderName: string
  sourceEvidence?: WonderLabComponentSourceEvidence | null
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

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isSourceEvidence(value: unknown): value is WonderLabComponentSourceEvidence {
  if (!value || typeof value !== 'object') return false
  const evidence = value as Partial<WonderLabComponentSourceEvidence>
  return (
    evidence.version === 1 &&
    typeof evidence.lineCount === 'number' &&
    stringArray(evidence.blocks) &&
    stringArray(evidence.props) &&
    stringArray(evidence.emits) &&
    stringArray(evidence.customComponents) &&
    stringArray(evidence.nativeElements) &&
    stringArray(evidence.staticText) &&
    stringArray(evidence.functionNames) &&
    stringArray(evidence.localImports) &&
    stringArray(evidence.facts)
  )
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
        typeof entry.folderName === 'string' &&
        (entry.sourceEvidence === undefined ||
          entry.sourceEvidence === null ||
          isSourceEvidence(entry.sourceEvidence)),
    )
  )
}

export function loadWonderLabComponentManifest(
  fetcher: () => Promise<unknown>,
): Promise<WonderLabComponentManifest> {
  manifestPromise ??= fetcher()
    .then((payload) => {
      if (!isManifest(payload)) {
        throw new Error('WonderLab component manifest has an invalid shape.')
      }

      return payload
    })
    .catch((error) => {
      manifestPromise = null
      throw error
    })

  return manifestPromise
}

export function clearWonderLabManifestCache(): void {
  manifestPromise = null
}

export function resetWonderLabManifestCacheForTests(): void {
  clearWonderLabManifestCache()
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
