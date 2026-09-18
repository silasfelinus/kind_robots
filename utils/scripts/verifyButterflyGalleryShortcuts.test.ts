// Regression test for the Butterfly Gallery non-drag keyboard shortcuts
// (butterfly-gallery/t-020, stores/helpers/butterflyGalleryShortcuts.ts).
// Exercises the pure intent resolver directly -- no DOM/component mount
// needed. Filed after a PR review caught the first version binding this
// handler on `window` with no focus scoping, so `Delete` could trash the
// selected image from anywhere on the page; the guard conditions asserted
// here (editable target, modifier keys, gallery status, missing selection)
// are exactly what must not regress.
import assert from 'node:assert/strict'

import {
  presetShortcutKey,
  resolveButterflyShortcutIntent,
  type ButterflyShortcutContext,
} from '../../stores/helpers/butterflyGalleryShortcuts'

const LEFT_BINS = [
  { id: 'preset-five', label: '5★ Keep' },
  { id: 'preset-four', label: '4★ Good' },
  { id: 'preset-three', label: '3★ Maybe' },
  { id: 'preset-two', label: '2★ Weak' },
  { id: 'preset-one', label: '1★ Cull' },
]

function baseContext(
  overrides: Partial<ButterflyShortcutContext>,
): ButterflyShortcutContext {
  return {
    key: '5',
    hasModifier: false,
    isEditableTarget: false,
    status: 'ready',
    selectedEntryId: 101,
    pileEntryIds: [101, 102, 103],
    leftBins: LEFT_BINS,
    ...overrides,
  }
}

// -- presetShortcutKey extracts the leading digit ---------------------------

{
  assert.equal(presetShortcutKey('5★ Keep'), '5')
  assert.equal(presetShortcutKey('1★ Cull'), '1')
  assert.equal(presetShortcutKey('Trash'), undefined)
}

// -- digit keys sort into the matching-rating bin ----------------------------

{
  const intent = resolveButterflyShortcutIntent(baseContext({ key: '3' }))
  assert.deepEqual(intent, { type: 'sort', binId: 'preset-three' })
}

// -- Delete trashes the selected entry ---------------------------------------

{
  const intent = resolveButterflyShortcutIntent(baseContext({ key: 'Delete' }))
  assert.deepEqual(intent, { type: 'trash' })
}

// -- arrow keys move the pile selection, including from no selection --------

{
  const forward = resolveButterflyShortcutIntent(
    baseContext({ key: 'ArrowRight', selectedEntryId: 101 }),
  )
  assert.deepEqual(forward, { type: 'select', entryId: 102 })

  const backward = resolveButterflyShortcutIntent(
    baseContext({ key: 'ArrowLeft', selectedEntryId: 102 }),
  )
  assert.deepEqual(backward, { type: 'select', entryId: 101 })

  const fromNothing = resolveButterflyShortcutIntent(
    baseContext({ key: 'ArrowRight', selectedEntryId: null }),
  )
  assert.deepEqual(fromNothing, { type: 'select', entryId: 101 })

  const pastTheEnd = resolveButterflyShortcutIntent(
    baseContext({ key: 'ArrowRight', selectedEntryId: 103 }),
  )
  assert.equal(pastTheEnd, null, 'no wraparound past the last pile entry')

  const emptyPile = resolveButterflyShortcutIntent(
    baseContext({ key: 'ArrowRight', pileEntryIds: [] }),
  )
  assert.equal(emptyPile, null)
}

// -- guard: an editable target (the search/filter field) blocks every key ---

{
  for (const key of ['5', 'Delete', 'ArrowRight']) {
    const intent = resolveButterflyShortcutIntent(
      baseContext({ key, isEditableTarget: true }),
    )
    assert.equal(intent, null, `${key} must be ignored while typing`)
  }
}

// -- guard: a modifier key (browser/OS shortcuts) blocks every key ----------

{
  for (const key of ['5', 'Delete', 'ArrowRight']) {
    const intent = resolveButterflyShortcutIntent(
      baseContext({ key, hasModifier: true }),
    )
    assert.equal(intent, null, `Cmd/Ctrl/Alt+${key} must be left alone`)
  }
}

// -- guard: only `ready` status accepts shortcuts (not dragging/saving/intro)

{
  for (const status of [
    'loading',
    'intro',
    'dragging',
    'dropping',
    'saving',
    'rescanning',
    'error',
  ] as const) {
    const intent = resolveButterflyShortcutIntent(baseContext({ status }))
    assert.equal(intent, null, `status ${status} must suppress shortcuts`)
  }
}

// -- guard: digit/Delete require a selection; arrows never do ---------------

{
  const noSelectionSort = resolveButterflyShortcutIntent(
    baseContext({ key: '5', selectedEntryId: null }),
  )
  assert.equal(noSelectionSort, null)

  const noSelectionTrash = resolveButterflyShortcutIntent(
    baseContext({ key: 'Delete', selectedEntryId: null }),
  )
  assert.equal(noSelectionTrash, null)
}

// -- a digit with no matching bin, an out-of-range digit, and an unrelated
//    key are all no-ops rather than falling through to some default bin -----

{
  const noBinForRating = resolveButterflyShortcutIntent(
    baseContext({
      key: '3',
      leftBins: LEFT_BINS.filter((b) => b.id !== 'preset-three'),
    }),
  )
  assert.equal(noBinForRating, null)

  const outOfRangeDigit = resolveButterflyShortcutIntent(
    baseContext({ key: '9' }),
  )
  assert.equal(outOfRangeDigit, null)

  const unrelatedKey = resolveButterflyShortcutIntent(baseContext({ key: 'a' }))
  assert.equal(unrelatedKey, null)
}

console.log('verifyButterflyGalleryShortcuts: all checks passed')
