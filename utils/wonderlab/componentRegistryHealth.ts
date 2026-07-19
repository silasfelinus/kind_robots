// /utils/wonderlab/componentRegistryHealth.ts
import {
  resolveWonderLabManifestEntry,
  type WonderLabManifestEntry,
} from './componentManifest'

export type WonderLabRegistryRecord = {
  id: number
  componentName: string
  folderName: string
  sourceKey?: string | null
  sourcePath?: string | null
  sourceHash?: string | null
  isDiscovered?: boolean | null
}

export type WonderLabRegistryHealth = {
  manifestCount: number
  recordCount: number
  matchedRecordCount: number
  canonicalMatchCount: number
  legacyFallbackCount: number
  undiscoveredRecordCount: number
  staleRecordCount: number
  missingRecordCount: number
  duplicateNameCount: number
  staleRecords: WonderLabRegistryRecord[]
  legacyFallbackRecords: WonderLabRegistryRecord[]
  undiscoveredRecords: WonderLabRegistryRecord[]
  missingEntries: WonderLabManifestEntry[]
  duplicateNames: string[]
}

function normalizeName(value: string): string {
  return value.trim().replace(/\.vue$/i, '').toLowerCase()
}

function normalizeSource(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function summarizeWonderLabRegistry(
  entries: WonderLabManifestEntry[],
  records: WonderLabRegistryRecord[],
): WonderLabRegistryHealth {
  const entriesBySourceKey = new Map(
    entries.map((entry) => [normalizeSource(entry.sourceKey), entry]),
  )
  const entriesBySourcePath = new Map(
    entries.map((entry) => [normalizeSource(entry.sourcePath), entry]),
  )
  const matchedSourcePaths = new Set<string>()
  const staleRecords: WonderLabRegistryRecord[] = []
  const legacyFallbackRecords: WonderLabRegistryRecord[] = []
  let canonicalMatchCount = 0

  for (const record of records) {
    const sourceKey = normalizeSource(record.sourceKey)
    const sourcePath = normalizeSource(record.sourcePath)
    const canonicalEntry =
      (sourceKey ? entriesBySourceKey.get(sourceKey) : undefined) ||
      (sourcePath ? entriesBySourcePath.get(sourcePath) : undefined)
    const entry =
      canonicalEntry ||
      resolveWonderLabManifestEntry(
        entries,
        record.componentName,
        record.folderName,
      )

    if (entry) {
      matchedSourcePaths.add(normalizeSource(entry.sourcePath))
      if (canonicalEntry) canonicalMatchCount += 1
      else legacyFallbackRecords.push(record)
    } else {
      staleRecords.push(record)
    }
  }

  const missingEntries = entries.filter(
    (entry) => !matchedSourcePaths.has(normalizeSource(entry.sourcePath)),
  )
  const undiscoveredRecords = records.filter(
    (record) => record.isDiscovered !== true,
  )

  const names = new Map<string, number>()
  for (const entry of entries) {
    const name = normalizeName(entry.componentName)
    names.set(name, (names.get(name) || 0) + 1)
  }

  const duplicateNames = [...names.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort()

  const byComponentName = (
    left: WonderLabRegistryRecord,
    right: WonderLabRegistryRecord,
  ) => left.componentName.localeCompare(right.componentName)

  return {
    manifestCount: entries.length,
    recordCount: records.length,
    matchedRecordCount: records.length - staleRecords.length,
    canonicalMatchCount,
    legacyFallbackCount: legacyFallbackRecords.length,
    undiscoveredRecordCount: undiscoveredRecords.length,
    staleRecordCount: staleRecords.length,
    missingRecordCount: missingEntries.length,
    duplicateNameCount: duplicateNames.length,
    staleRecords: [...staleRecords].sort(byComponentName),
    legacyFallbackRecords: [...legacyFallbackRecords].sort(byComponentName),
    undiscoveredRecords: [...undiscoveredRecords].sort(byComponentName),
    missingEntries: [...missingEntries].sort((left, right) =>
      left.sourcePath.localeCompare(right.sourcePath),
    ),
    duplicateNames,
  }
}
