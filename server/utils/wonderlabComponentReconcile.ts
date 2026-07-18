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

export type ComponentReconcileAction = {
  kind: 'create' | 'update'
  componentName: string
  existingId?: number
  changes: Record<string, string>
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
    Pick<Component, 'id' | 'componentName' | 'folderName'>
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
      ),
      sourcePath: requireString(
        record.sourcePath,
        `entries[${index}].sourcePath`,
      ),
      sourceHash: requireString(
        record.sourceHash,
        `entries[${index}].sourceHash`,
      ),
      componentName: requireString(
        record.componentName,
        `entries[${index}].componentName`,
      ),
      slug: requireString(record.slug, `entries[${index}].slug`),
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
    generatedAt:
      typeof input.generatedAt === 'string'
        ? input.generatedAt
        : new Date(0).toISOString(),
    componentRoot:
      typeof input.componentRoot === 'string' && input.componentRoot.trim()
        ? input.componentRoot.trim()
        : 'components',
    count: entries.length,
    entries,
  }
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

  const manifestByNormalizedName = new Map<string, WonderLabManifestEntry[]>()
  for (const entry of manifest.entries) {
    const key = normalizeComponentName(entry.componentName)
    const group = manifestByNormalizedName.get(key) ?? []
    group.push(entry)
    manifestByNormalizedName.set(key, group)
  }

  for (const [key, entries] of manifestByNormalizedName) {
    if (entries.length > 1) {
      conflicts.push({
        key,
        componentNames: entries.map((entry) => entry.componentName),
        reason:
          'Multiple source components normalize to the same database component name. A source-path schema migration is required before these can be reconciled safely.',
      })
    }
  }

  const databaseByNormalizedName = new Map<string, Component[]>()
  for (const component of existingComponents) {
    const key = normalizeComponentName(component.componentName)
    const group = databaseByNormalizedName.get(key) ?? []
    group.push(component)
    databaseByNormalizedName.set(key, group)
  }

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

  const blockedKeys = new Set(conflicts.map((conflict) => conflict.key))

  for (const entry of manifest.entries) {
    const normalizedName = normalizeComponentName(entry.componentName)
    if (blockedKeys.has(normalizedName)) continue

    const exact = existingComponents.find(
      (component) => component.componentName === entry.componentName,
    )
    const normalizedMatches = databaseByNormalizedName.get(normalizedName) ?? []
    const existing = exact ?? normalizedMatches[0]

    if (!existing) {
      creates.push({
        kind: 'create',
        componentName: entry.componentName,
        changes: {
          folderName: entry.folderName,
        },
      })
      continue
    }

    matchedComponentIds.add(existing.id)

    const changes: Record<string, string> = {}
    if (existing.componentName !== entry.componentName) {
      changes.componentName = entry.componentName
    }
    if (existing.folderName !== entry.folderName) {
      changes.folderName = entry.folderName
    }

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
    .map(({ id, componentName, folderName }) => ({
      id,
      componentName,
      folderName,
    }))

  return {
    creates,
    updates,
    unchanged,
    missingFromManifest,
    conflicts,
    matchedComponentIds: [...matchedComponentIds],
  }
}
