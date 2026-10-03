// /utils/scripts/verifyComicLayouts.test.ts
//
// Contract test for comic-creator/t-014 page layouts (utils/comicLayouts.ts).
// What it protects: every template stays on the page, rearranging never loses a
// panel (a smaller layout or a merge sends extras to the overflow tray), dropping
// on an occupied cell swaps rather than stacking, and the normalizer repairs a
// stored document instead of trusting it.
import assert from 'node:assert/strict'

import {
  addComicPage,
  addComicPanel,
  COMIC_LAYOUTS,
  comicMergeableNeighbor,
  comicPageCells,
  emptyComicIssueLayout,
  mergeComicCells,
  moveComicPage,
  moveComicPanel,
  normalizeComicIssueLayout,
  setComicPageLayout,
  splitComicCell,
  suggestComicLayout,
} from '../comicLayouts.js'

const EPS = 1e-6
for (const template of COMIC_LAYOUTS) {
  let area = 0
  for (const cell of template.cells) {
    assert.ok(cell.x >= -EPS && cell.y >= -EPS, template.key)
    assert.ok(
      cell.x + cell.w <= 1 + EPS && cell.y + cell.h <= 1 + EPS,
      template.key,
    )
    area += cell.w * cell.h
  }
  if (!template.overlap)
    assert.ok(Math.abs(area - 1) < 1e-6, `${template.key} covers the page`)
}
console.log(
  '✅ every template stays on the page and non-overlapping ones tile it',
)

function pageWithPanels(layoutKey: string, count: number) {
  let layout = addComicPage(emptyComicIssueLayout(), layoutKey)
  const pageId = layout.pages[0]!.id
  for (let slot = 1; slot <= count; slot += 1)
    layout = addComicPanel(layout, pageId, slot).layout
  return { layout, pageId }
}

{
  const { layout, pageId } = pageWithPanels('grid-6', 6)
  const smaller = setComicPageLayout(layout, pageId, 'three-tier')
  const panels = smaller.pages[0]!.panels
  assert.equal(panels.length, 6)
  assert.deepEqual(
    panels.map((p) => p.cell),
    [0, 1, 2, null, null, null],
  )
  const bigger = setComicPageLayout(smaller, pageId, 'grid-9')
  assert.deepEqual(
    bigger.pages[0]!.panels.map((p) => p.cell),
    [0, 1, 2, 3, 4, 5],
  )
}
console.log(
  '✅ changing layout reflows in reading order and never drops a panel',
)

{
  const { layout, pageId } = pageWithPanels('grid-2x2', 4)
  const split = splitComicCell(layout, pageId, 0, 'vertical')
  assert.equal(comicPageCells(split.pages[0]!).length, 5)
  assert.deepEqual(
    split.pages[0]!.panels.map((p) => p.cell),
    [0, 2, 3, 4],
  )
  const merged = mergeComicCells(split, pageId, 0, 1)
  assert.deepEqual(
    comicPageCells(merged.pages[0]!),
    comicPageCells(layout.pages[0]!),
  )
  assert.deepEqual(
    merged.pages[0]!.panels.map((p) => p.cell),
    [0, 1, 2, 3],
  )
  const full = addComicPanel(split, pageId, 9, 1).layout
  const mergedFull = mergeComicCells(full, pageId, 0, 1)
  const cells = mergedFull.pages[0]!.panels.map((p) => p.cell)
  assert.equal(cells.filter((c) => c === null).length, 1)
  assert.equal(mergeComicCells(layout, pageId, 0, 3), layout)
  assert.equal(comicMergeableNeighbor(layout.pages[0]!, 0), 1)
}
console.log(
  '✅ split then merge restores the cells; a merged-away panel goes to overflow',
)

{
  let layout = addComicPage(emptyComicIssueLayout(), 'two-tier')
  layout = addComicPage(layout, 'two-tier')
  const [a, b] = layout.pages.map((p) => p.id)
  layout = addComicPanel(layout, a!, 1).layout
  layout = addComicPanel(layout, a!, 2).layout
  layout = addComicPanel(layout, b!, 3).layout
  const p1 = layout.pages[0]!.panels[0]!.id
  const swapped = moveComicPanel(layout, p1, b!, 0)
  const pageA = swapped.pages[0]!.panels.map((p) => [p.slotId, p.cell])
  const pageB = swapped.pages[1]!.panels.map((p) => [p.slotId, p.cell])
  assert.deepEqual(
    pageA.sort(),
    [
      [2, 1],
      [3, 0],
    ].sort(),
  )
  assert.deepEqual(pageB, [[1, 0]])
  const reordered = moveComicPage(swapped, b!, 0)
  assert.equal(reordered.pages[0]!.id, b)
}
console.log('✅ dropping on an occupied cell swaps across pages; pages reorder')

{
  const repaired = normalizeComicIssueLayout({
    pages: [
      {
        id: 'p',
        layoutKey: 'nope',
        panels: [
          { id: 'x', slotId: 1, cell: 5 },
          { id: 'x', slotId: 2, cell: 0 },
          { slotId: 3, cell: 0 },
        ],
      },
      { id: 'p', layoutKey: 'grid-2x2', panels: [] },
    ],
  })
  assert.equal(repaired.pages[0]!.layoutKey, 'splash')
  assert.notEqual(repaired.pages[0]!.id, repaired.pages[1]!.id)
  const cells = repaired.pages[0]!.panels.map((p) => p.cell)
  assert.deepEqual(cells, [null, 0, null])
  assert.equal(new Set(repaired.pages[0]!.panels.map((p) => p.id)).size, 3)
  assert.deepEqual(
    normalizeComicIssueLayout('garbage'),
    emptyComicIssueLayout(),
  )
  assert.equal(suggestComicLayout(1), 'splash')
  assert.equal(suggestComicLayout(4), 'grid-2x2')
}
console.log(
  '✅ the normalizer repairs unknown layouts, duplicate ids and out-of-range cells',
)
