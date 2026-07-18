// /utils/scripts/verifyWonderLabReconcile.ts
import assert from 'node:assert/strict'
import type { Component } from '~/prisma/generated/prisma/client'
import {
  buildComponentReconcilePlan,
  parseWonderLabManifest,
  type WonderLabManifest,
} from '@/server/utils/wonderlabComponentReconcile'

function component(
  id: number,
  componentName: string,
  folderName: string,
): Component {
  return {
    id,
    componentName,
    folderName,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    isWorking: false,
    underConstruction: false,
    isBroken: false,
    title: componentName,
    notes: null,
    artImageId: null,
  }
}

function manifest(
  entries: WonderLabManifest['entries'],
): WonderLabManifest {
  return {
    version: 1,
    generatedAt: '2026-07-18T00:00:00.000Z',
    componentRoot: 'components',
    count: entries.length,
    entries,
  }
}

function entry(componentName: string, folderName: string) {
  const sourcePath = `components/${folderName}/${componentName}.vue`

  return {
    sourceKey: sourcePath.toLowerCase(),
    sourcePath,
    sourceHash: 'a'.repeat(64),
    componentName,
    slug: `${folderName}-${componentName}`.toLowerCase(),
    folderName,
  }
}

const safePlan = buildComponentReconcilePlan(
  manifest([entry('ExistingCard', 'cards'), entry('NewPanel', 'panels')]),
  [
    component(1, 'ExistingCard', 'legacy'),
    component(2, 'RetiredWidget', 'legacy'),
  ],
)

assert.equal(safePlan.updates.length, 1)
assert.deepEqual(safePlan.updates[0]?.changes, { folderName: 'cards' })
assert.equal(safePlan.creates.length, 1)
assert.equal(safePlan.creates[0]?.componentName, 'NewPanel')
assert.deepEqual(
  safePlan.missingFromManifest.map((item) => item.componentName),
  ['RetiredWidget'],
  'Unmatched database records must be reported rather than deleted.',
)
assert.equal(safePlan.conflicts.length, 0)

const renamePlan = buildComponentReconcilePlan(
  manifest([entry('NarratorCard', 'navigation')]),
  [component(3, 'narrator-card', 'legacy')],
)

assert.equal(renamePlan.updates.length, 1)
assert.deepEqual(renamePlan.updates[0]?.changes, {
  componentName: 'NarratorCard',
  folderName: 'navigation',
})

const conflictPlan = buildComponentReconcilePlan(
  manifest([
    entry('StatusBadge', 'one'),
    entry('status-badge', 'two'),
  ]),
  [],
)

assert.equal(conflictPlan.conflicts.length, 1)
assert.equal(conflictPlan.creates.length, 0)

assert.throws(
  () =>
    parseWonderLabManifest({
      ...manifest([entry('Counted', 'cards')]),
      count: 2,
    }),
  /count mismatch/i,
)

console.log('WonderLab component reconciliation verification passed.')
