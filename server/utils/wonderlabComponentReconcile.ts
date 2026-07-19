// /server/utils/wonderlabComponentReconcile.ts
import type { Component } from '~/prisma/generated/prisma/client'

export type WonderLabManifestEntry = {
  sourceKey: string
  sourcePath: string
  sourceHash: string
  componentName: string
  slug: string
  folderName: string
}

export type WonderLabManifest = {
  version: number
  generatedAt: string
  componentRoot: string
  count: number
  entries: WonderLabManifestEntry[]
}

export type ComponentReconcileChanges = {
  componentName?: string
  folderName?: string
  slug?: string
  sourcePath?: string
  sourceKey?: string
  sourceHash?: string
  lastSeenAt?: string
  isDiscovered?: boolean
}

export type ComponentReconcileAction = {
  kind: 'create' | 'update'
  componentName: string
  existingId?: number
  changes: ComponentReconcileChanges
}

export type ComponentReconcileConflict = {
  key: string
  componentNames: string[]
  reason: string
}

export type ComponentReconcilePlan = {
  creates: ComponentReconcileAction[]
  updates: ComponentReconcileAction[]
  unchanged: string[]
  missingFromManifest: Array<
    Pick<Component, 'id' | 'componentName' | 'folderName' | 'sourceKey'>
  >
  conflicts: ComponentReconcileConflict[]
  matchedComponentIds: number[]
}

const MAX_MANIFEST_ENTRIES = 5000

export function normalizeComponentName(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Manifest entry field "${field}" must be a non-empty string.`)
  }

  return value.trim()
}

function normalizeGeneratedAt(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return new Date(0).toISOString()
  }

  return new Date(value).toISOString()
}

export function parseWonderLabManifest(value: unknown): WonderLabManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('A WonderLab component manifest is required.')
  }

  const input = value as Partial<WonderLabManifest>
  if (input.version !== 1) {
    throw new Error(
      `Unsupported WonderLab manifest version: ${String(input.version)}.`,
    )
  }

  if (!Array.isArray(input.entries)) {
    throw new Error('Manifest entries must be an array.')
  }

  if (input.entries.length > MAX_MANIFEST_ENTRIES) {
    throw new Error(
      `Manifest exceeds the ${MAX_MANIFEST_ENTRIES} entry safety limit.`,
    )
  }

  const entries = input.entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Manifest entry ${index} must be an object.`)
    }

    const record = entry as Partial<WonderLabManifestEntry>
    return {
      sourceKey: requireString(
        record.sourceKey,
        `entries[${index}].sourceKey`,
      ).toLowerCase(),
      sourcePath: requireString(
        record.sourcePath,
        `entries[${index}].sourcePath`,
      ),
      sourceHash: requireString(
        record.sourceHash,
        `entries[${index}].sourceHash`,
      ).toLowerCase(),
      componentName: requireString(
        record.componentName,
        `entries[${index}].componentName`,
      ),
      slug: requireString(record.slug, `entries[${index}].slug`).toLowerCase(),
      folderName: requireString(
        record.folderName,
        `entries[${index}].folderName`,
      ),
    }
  })

  if (typeof input.count === 'number' && input.count !== entries.length) {
    throw new Error(
      `Manifest count mismatch: declared ${input.count}, received ${entries.length}.`,
    )
  }

  return {
    version: 1,
    generatedAt: normalizeGeneratedAt(input.generatedAt),
    componentRoot:
      typeof input.componentRoot === 'string' && input.componentRoot.trim()
        ? input.componentRoot.trim()
        : 'components',
    count: entries.length,
    entries,
  }
}

function groupedBy<T>(items: T[], keyFor: (item: T) => string | null) {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const key = keyFor(item)
    if (!key) continue
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }

  return groups
}

function entryChanges(
  manifest: WonderLabManifest,
  entry: WonderLabManifestEntry,
  existing: Component,
): ComponentReconcileChanges {
  const changes: ComponentReconcileChanges = {}

  if (existing.componentName !== entry.componentName) {
    changes.componentName = entry.componentName
  }
  if (existing.folderName !== entry.folderName) {
    changes.folderName = entry.folderName
  }
  if (existing.slug !== entry.slug) changes.slug = entry.slug
  if (existing.sourcePath !== entry.sourcePath) {
    changes.sourcePath = entry.sourcePath
  }
  if (existing.sourceKey !== entry.sourceKey) changes.sourceKey = entry.sourceKey
  if (existing.sourceHash !== entry.sourceHash) {
    changes.sourceHash = entry.sourceHash
  }
  if (!existing.isDiscovered) changes.isDiscovered = true

  const sourceChanged =
    changes.slug !== undefined ||
    changes.sourcePath !== undefined ||
    changes.sourceKey !== undefined ||
    changes.sourceHash !== undefined ||
    changes.isDiscovered === true

  if (sourceChanged) changes.lastSeenAt = manifest.generatedAt

  return changes
}

export function buildComponentReconcilePlan(
  manifest: WonderLabManifest,
  existingComponents: Component[],
): ComponentReconcilePlan {
  const conflicts: ComponentReconcileConflict[] = []
  const creates: ComponentReconcileAction[] = []
  const updates: ComponentReconcileAction[] = []
  const unchanged: string[] = []
  const matchedComponentIds = new Set<number>()

  const manifestByNormalizedName = groupedBy(manifest.entries, (entry) =>
    normalizeComponentName(entry.componentName),
  )
  const manifestBySourceKey = groupedBy(manifest.entries, (entry) =>
    entry.sourceKey.toLowerCase(),
  )

  for (const [key, entries] of manifestBySourceKey) {
    if (entries.length > 1) {
      conflicts.push({
        key,
        componentNames: entries.map((entry) => entry.componentName),
        reason: 'Multiple manifest entries use the same canonical source key.',
      })
    }
  }

  for (const [key, entries] of manifestByNormalizedName) {
    if (entries.length > 1) {
      conflicts.push({
        key,
        componentNames: entries.map((entry) => entry.componentName),
        reason:
          'Multiple source components normalize to the same globally unique component name. Remove the legacy componentName uniqueness before reconciling these entries.',
      })
    }
  }

  const databaseByNormalizedName = groupedBy(existingComponents, (component) =>
    normalizeComponentName(component.componentName),
  )
  const databaseBySourceKey = groupedBy(existingComponents, (component) =>
    component.sourceKey?.toLowerCase() || null,
  )
  const databaseBySourcePath = groupedBy(existingComponents, (component) =>
    component.sourcePath || null,
  )
  const databaseBySourceHash = groupedBy(existingComponents, (component) =>
    component.sourceHash?.toLowerCase() || null,
  )

  for (const [key, components] of databaseByNormalizedName) {
    if (components.length > 1) {
      conflicts.push({
        key,
        componentNames: components.map((component) => component.componentName),
        reason:
          'Multiple database rows normalize to the same component name. Resolve the duplicate before applying reconciliation.',
      })
    }
  }

  for (const [key, components] of databaseBySourceKey) {
    if (components.length > 1) {
      conflicts.push({
        key,
        componentNames: components.map((component) => component.componentName),
        reason:
          'Multiple database rows claim the same canonical source key. Resolve the source identity conflict before applying reconciliation.',
      })
    }
  }

  const blockedKeys = new Set(conflicts.map((conflict) => conflict.key))

  for (const entry of manifest.entries) {
    const normalizedName = normalizeComponentName(entry.componentName)
    if (blockedKeys.has(normalizedName) || blockedKeys.has(entry.sourceKey)) {
      continue
    }

    const exactSourceKey = databaseBySourceKey.get(entry.sourceKey)?.[0]
    const exactSourcePath = databaseBySourcePath.get(entry.sourcePath)?.[0]
    const hashMatches = databaseBySourceHash.get(entry.sourceHash) ?? []
    const uniqueHashMatch = hashMatches.length === 1 ? hashMatches[0] : undefined
    const exactName = existingComponents.find(
      (component) => component.componentName === entry.componentName,
    )
    const normalizedMatches = databaseByNormalizedName.get(normalizedName) ?? []

    const identityMatch = exactSourceKey ?? exactSourcePath ?? uniqueHashMatch

    if (identityMatch && exactName && identityMatch.id !== exactName.id) {
      conflicts.push({
        key: entry.sourceKey,
        componentNames: [identityMatch.componentName, exactName.componentName],
        reason:
          'Canonical source identity and the target component name resolve to different database rows.',
      })
      continue
    }

    const existing = identityMatch ?? exactName ?? normalizedMatches[0]

    if (!existing) {
      creates.push({
        kind: 'create',
        componentName: entry.componentName,
        changes: {
          folderName: entry.folderName,
          slug: entry.slug,
          sourcePath: entry.sourcePath,
          sourceKey: entry.sourceKey,
          sourceHash: entry.sourceHash,
          lastSeenAt: manifest.generatedAt,
          isDiscovered: true,
        },
      })
      continue
    }

    if (matchedComponentIds.has(existing.id)) {
      conflicts.push({
        key: entry.sourceKey,
        componentNames: [existing.componentName, entry.componentName],
        reason:
          'Multiple manifest entries resolve to the same database Component record.',
      })
      continue
    }

    matchedComponentIds.add(existing.id)

    const changes = entryChanges(manifest, entry, existing)

    if (Object.keys(changes).length) {
      updates.push({
        kind: 'update',
        componentName: entry.componentName,
        existingId: existing.id,
        changes,
      })
    } else {
      unchanged.push(entry.componentName)
    }
  }

  const missingFromManifest = existingComponents
    .filter((component) => !matchedComponentIds.has(component.id))
    .map(({ id, componentName, folderName, sourceKey }) => ({
      id,
      componentName,
      folderName,
      sourceKey,
    }))

  for (const component of existingComponents) {
    if (matchedComponentIds.has(component.id) || !component.isDiscovered) continue

    updates.push({
      kind: 'update',
      componentName: component.componentName,
      existingId: component.id,
      changes: { isDiscovered: false },
    })
  }

  return {
    creates,
    updates,
    unchanged,
    missingFromManifest,
    conflicts,
    matchedComponentIds: [...matchedComponentIds],
  }
}
