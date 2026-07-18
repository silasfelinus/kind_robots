// /utils/wonderlab/componentRegistryHealth.ts
import {
  resolveWonderLabManifestEntry,
  type WonderLabManifestEntry,
} from './componentManifest'

export type WonderLabRegistryRecord = {
  id: number
  componentName: string
  folderName: string
}

export type WonderLabRegistryHealth = {
  manifestCount: number
  recordCount: number
  matchedRecordCount: number
  staleRecordCount: number
  missingRecordCount: number
  duplicateNameCount: number
  staleRecords: WonderLabRegistryRecord[]
  missingEntries: WonderLabManifestEntry[]
  duplicateNames: string[]
}

function normalizeName(value: string): string {
  return value.trim().replace(/\.vue$/i, '').toLowerCase()
}

export function summarizeWonderLabRegistry(
  entries: WonderLabManifestEntry[],
  records: WonderLabRegistryRecord[],
): WonderLabRegistryHealth {
  const matchedSourcePaths = new Set<string>()
  const staleRecords: WonderLabRegistryRecord[] = []

  for (const record of records) {
    const entry = resolveWonderLabManifestEntry(
      entries,
      record.componentName,
      record.folderName,
    )

    if (entry) {
      matchedSourcePaths.add(entry.sourcePath.toLowerCase())
    } else {
      staleRecords.push(record)
    }
  }

  const missingEntries = entries.filter(
    (entry) => !matchedSourcePaths.has(entry.sourcePath.toLowerCase()),
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

  return {
    manifestCount: entries.length,
    recordCount: records.length,
    matchedRecordCount: records.length - staleRecords.length,
    staleRecordCount: staleRecords.length,
    missingRecordCount: missingEntries.length,
    duplicateNameCount: duplicateNames.length,
    staleRecords: [...staleRecords].sort((left, right) =>
      left.componentName.localeCompare(right.componentName),
    ),
    missingEntries: [...missingEntries].sort((left, right) =>
      left.sourcePath.localeCompare(right.sourcePath),
    ),
    duplicateNames,
  }
}
