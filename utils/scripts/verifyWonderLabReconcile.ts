// /utils/scripts/verifyWonderLabReconcile.ts
import assert from 'node:assert/strict'
import type { Component } from '~/prisma/generated/prisma/client'
import {
  buildComponentReconcilePlan,
  parseWonderLabManifest,
  type WonderLabManifest,
  type WonderLabManifestEntry,
} from '@/server/utils/wonderlabComponentReconcile'

const GENERATED_AT = '2026-07-18T00:00:00.000Z'

type ComponentOverrides = Partial<Component>

function component(
  id: number,
  componentName: string,
  folderName: string,
  overrides: ComponentOverrides = {},
): Component {
  return {
    id,
    componentName,
    folderName,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    slug: null,
    sourcePath: null,
    sourceKey: null,
    sourceHash: null,
    status: 'UNREVIEWED',
    statusReason: null,
    title: componentName,
    description: null,
    notes: null,
    category: null,
    tags: null,
    previewMode: null,
    previewConfig: null,
    lastSeenAt: null,
    isDiscovered: false,
    artImageId: null,
    ...overrides,
  }
}

function manifest(
  entries: WonderLabManifest['entries'],
): WonderLabManifest {
  return {
    version: 1,
    generatedAt: GENERATED_AT,
    componentRoot: 'components',
    count: entries.length,
    entries,
  }
}

function entry(
  componentName: string,
  folderName: string,
  hashCharacter = componentName.slice(0, 1).toLowerCase() || 'a',
): WonderLabManifestEntry {
  const sourcePath = `components/${folderName}/${componentName}.vue`

  return {
    sourceKey: sourcePath.toLowerCase(),
    sourcePath,
    sourceHash: hashCharacter.repeat(64),
    componentName,
    slug: `${folderName}-${componentName}`.toLowerCase(),
    folderName,
  }
}

const existingEntry = entry('ExistingCard', 'cards', 'a')
const newEntry = entry('NewPanel', 'panels', 'b')
const safePlan = buildComponentReconcilePlan(
  manifest([existingEntry, newEntry]),
  [
    component(1, 'ExistingCard', 'legacy'),
    component(2, 'RetiredWidget', 'legacy'),
  ],
)

assert.equal(safePlan.updates.length, 1)
assert.deepEqual(safePlan.updates[0], {
  kind: 'update',
  componentName: 'ExistingCard',
  existingId: 1,
  changes: {
    folderName: 'cards',
    slug: existingEntry.slug,
    sourcePath: existingEntry.sourcePath,
    sourceKey: existingEntry.sourceKey,
    sourceHash: existingEntry.sourceHash,
    isDiscovered: true,
    lastSeenAt: GENERATED_AT,
  },
})
assert.equal(safePlan.creates.length, 1)
assert.deepEqual(safePlan.creates[0], {
  kind: 'create',
  componentName: 'NewPanel',
  changes: {
    folderName: 'panels',
    slug: newEntry.slug,
    sourcePath: newEntry.sourcePath,
    sourceKey: newEntry.sourceKey,
    sourceHash: newEntry.sourceHash,
    lastSeenAt: GENERATED_AT,
    isDiscovered: true,
  },
})
assert.deepEqual(
  safePlan.missingFromManifest.map((item) => item.componentName),
  ['RetiredWidget'],
  'Unmatched database records must be reported rather than deleted.',
)
assert.equal(safePlan.conflicts.length, 0)

const movedEntry = entry('NarratorCard', 'navigation', 'c')
const movePlan = buildComponentReconcilePlan(manifest([movedEntry]), [
  component(3, 'old-narrator-card', 'legacy-navigation', {
    slug: 'legacy-navigation-old-narrator-card',
    sourcePath: 'components/legacy-navigation/old-narrator-card.vue',
    sourceKey: 'components/legacy-navigation/old-narrator-card.vue',
    sourceHash: movedEntry.sourceHash,
    isDiscovered: true,
  }),
])

assert.equal(movePlan.updates.length, 1)
assert.deepEqual(movePlan.updates[0], {
  kind: 'update',
  componentName: 'NarratorCard',
  existingId: 3,
  changes: {
    componentName: 'NarratorCard',
    folderName: 'navigation',
    slug: movedEntry.slug,
    sourcePath: movedEntry.sourcePath,
    sourceKey: movedEntry.sourceKey,
    lastSeenAt: GENERATED_AT,
  },
})
assert.equal(movePlan.creates.length, 0)

const stableEntry = entry('StableCard', 'cards', 'd')
const stablePlan = buildComponentReconcilePlan(manifest([stableEntry]), [
  component(4, stableEntry.componentName, stableEntry.folderName, {
    slug: stableEntry.slug,
    sourcePath: stableEntry.sourcePath,
    sourceKey: stableEntry.sourceKey,
    sourceHash: stableEntry.sourceHash,
    lastSeenAt: new Date(GENERATED_AT),
    isDiscovered: true,
  }),
])

assert.equal(stablePlan.updates.length, 0)
assert.equal(stablePlan.creates.length, 0)
assert.deepEqual(stablePlan.unchanged, ['StableCard'])

const missingPlan = buildComponentReconcilePlan(manifest([]), [
  component(5, 'MissingCard', 'cards', {
    sourceKey: 'components/cards/missing-card.vue',
    isDiscovered: true,
  }),
])

assert.deepEqual(missingPlan.missingFromManifest, [
  {
    id: 5,
    componentName: 'MissingCard',
    folderName: 'cards',
    sourceKey: 'components/cards/missing-card.vue',
  },
])
assert.deepEqual(missingPlan.updates, [
  {
    kind: 'update',
    componentName: 'MissingCard',
    existingId: 5,
    changes: { isDiscovered: false },
  },
])

const conflictPlan = buildComponentReconcilePlan(
  manifest([
    entry('StatusBadge', 'one', 'e'),
    entry('status-badge', 'two', 'f'),
  ]),
  [],
)

assert.equal(conflictPlan.conflicts.length, 1)
assert.equal(conflictPlan.creates.length, 0)

assert.throws(
  () =>
    parseWonderLabManifest({
      ...manifest([entry('Counted', 'cards', 'g')]),
      count: 2,
    }),
  /count mismatch/i,
)

const normalizedManifest = parseWonderLabManifest({
  ...manifest([entry('Normalized', 'cards', 'A')]),
  generatedAt: '2026-07-18T00:00:00-07:00',
})
assert.equal(normalizedManifest.entries[0]?.sourceHash, 'a'.repeat(64))
assert.equal(
  normalizedManifest.entries[0]?.sourceKey,
  normalizedManifest.entries[0]?.sourceKey.toLowerCase(),
)
assert.equal(normalizedManifest.generatedAt, '2026-07-18T07:00:00.000Z')

console.log('WonderLab component reconciliation verification passed.')
