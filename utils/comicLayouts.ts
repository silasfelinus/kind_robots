// /utils/comicLayouts.ts
//
// Comic page layout engine (comic-creator/t-014, shared with the public maker in
// t-004). An issue's pages live in one versioned JSON document so every rearrange
// (reorder pages, move a panel to another page, change a layout, split or merge a
// cell) is a pure transform followed by a single save, never a half-applied set
// of requests.
//
// Geometry is in page fractions (0..1). Cells are listed in reading order; a panel
// points at a cell by index. A panel whose cell is null sits in the page's overflow
// tray, which is how changing to a smaller layout or merging cells never loses one.
//
// Pure: no Prisma, no h3, no app aliases.

export type ComicCell = { x: number; y: number; w: number; h: number }
export type ComicLetteringKind = 'caption' | 'speech' | 'thought' | 'sfx'
export type ComicLettering = {
  id: string
  kind: ComicLetteringKind
  text: string
}
export type ComicLayoutPanel = {
  id: string
  slotId: number | null
  cell: number | null
  artAttemptId?: number | null
  focusX?: number
  focusY?: number
  lettering?: ComicLettering[]
}
export type ComicLayoutPage = {
  id: string
  label?: string
  layoutKey: string
  cells?: ComicCell[]
  notes?: string
  panels: ComicLayoutPanel[]
}
export type ComicIssueLayout = { version: 1; pages: ComicLayoutPage[] }
export type ComicLayoutTemplate = {
  key: string
  label: string
  cells: ComicCell[]
  overlap?: boolean
}

export const COMIC_PAGE_ASPECT = 6.625 / 10.1875
export const COMIC_MAX_PAGES = 64
export const COMIC_MAX_PANELS_PER_PAGE = 16
export const COMIC_MAX_LETTERING = 8
export const COMIC_LETTERING_KINDS: ComicLetteringKind[] = [
  'caption',
  'speech',
  'thought',
  'sfx',
]

function rows(heights: number[]): ComicCell[] {
  const cells: ComicCell[] = []
  let y = 0
  for (const h of heights) {
    cells.push({ x: 0, y, w: 1, h })
    y += h
  }
  return cells
}

function grid(columns: number, rowCount: number): ComicCell[] {
  const cells: ComicCell[] = []
  for (let r = 0; r < rowCount; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      cells.push({
        x: c / columns,
        y: r / rowCount,
        w: 1 / columns,
        h: 1 / rowCount,
      })
    }
  }
  return cells
}

export const COMIC_LAYOUTS: ComicLayoutTemplate[] = [
  { key: 'splash', label: 'Splash', cells: [{ x: 0, y: 0, w: 1, h: 1 }] },
  { key: 'two-tier', label: 'Two tiers', cells: rows([0.5, 0.5]) },
  {
    key: 'three-tier',
    label: 'Three tiers',
    cells: rows([1 / 3, 1 / 3, 1 / 3]),
  },
  {
    key: 'widescreen-strips',
    label: 'Widescreen strips',
    cells: rows([0.25, 0.25, 0.25, 0.25]),
  },
  { key: 'grid-2x2', label: 'Four grid', cells: grid(2, 2) },
  { key: 'grid-6', label: 'Six grid', cells: grid(2, 3) },
  { key: 'grid-9', label: 'Nine grid', cells: grid(3, 3) },
  {
    key: 'big-top',
    label: 'Big top',
    cells: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  {
    key: 'five-mixed',
    label: 'Five mixed',
    cells: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
    ],
  },
  {
    key: 'inset',
    label: 'Splash with inset',
    overlap: true,
    cells: [
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 0.58, y: 0.06, w: 0.36, h: 0.28 },
    ],
  },
]

const TEMPLATE_BY_KEY = new Map(
  COMIC_LAYOUTS.map((template) => [template.key, template]),
)
const CUSTOM_LAYOUT_KEY = 'custom'
const EPSILON = 1e-6

export function comicLayoutTemplate(key: string): ComicLayoutTemplate {
  return TEMPLATE_BY_KEY.get(key) ?? COMIC_LAYOUTS[0]!
}

export function comicPageCells(
  page: Pick<ComicLayoutPage, 'layoutKey' | 'cells'>,
): ComicCell[] {
  if (page.cells?.length) return page.cells
  return comicLayoutTemplate(page.layoutKey).cells
}

export function comicCellAspect(cell: ComicCell): number {
  return (cell.w * COMIC_PAGE_ASPECT) / cell.h
}

export function nearestComicAspect(cell: ComicCell, aspects: string[]): string {
  const target = comicCellAspect(cell)
  let best = aspects[0] ?? '1:1'
  let bestDistance = Number.POSITIVE_INFINITY
  for (const aspect of aspects) {
    const [w, h] = aspect.split(':').map(Number)
    if (!w || !h) continue
    const distance = Math.abs(Math.log(w / h) - Math.log(target))
    if (distance < bestDistance) {
      best = aspect
      bestDistance = distance
    }
  }
  return best
}

let idCounter = 0
export function comicLayoutId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function emptyComicIssueLayout(): ComicIssueLayout {
  return { version: 1, pages: [] }
}

function clamp01(value: unknown, fallback: number): number {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(1, Math.max(0, number))
}

function cleanString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function normalizeCells(raw: unknown): ComicCell[] | undefined {
  if (!Array.isArray(raw) || !raw.length) return undefined
  const cells: ComicCell[] = []
  for (const item of raw.slice(0, COMIC_MAX_PANELS_PER_PAGE)) {
    const record = (item ?? {}) as Record<string, unknown>
    const cell = {
      x: clamp01(record.x, 0),
      y: clamp01(record.y, 0),
      w: clamp01(record.w, 1),
      h: clamp01(record.h, 1),
    }
    if (cell.w <= 0 || cell.h <= 0) continue
    cells.push(cell)
  }
  return cells.length ? cells : undefined
}

function normalizeLettering(raw: unknown): ComicLettering[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, COMIC_MAX_LETTERING).map((item) => {
    const record = (item ?? {}) as Record<string, unknown>
    const kind = COMIC_LETTERING_KINDS.includes(
      record.kind as ComicLetteringKind,
    )
      ? (record.kind as ComicLetteringKind)
      : 'caption'
    return {
      id: cleanString(record.id, 64) || comicLayoutId('l'),
      kind,
      text: cleanString(record.text, 600),
    }
  })
}

export function normalizeComicIssueLayout(raw: unknown): ComicIssueLayout {
  const source = (raw ?? {}) as Record<string, unknown>
  const pages: ComicLayoutPage[] = []
  const pageIds = new Set<string>()
  const panelIds = new Set<string>()
  const list = Array.isArray(source.pages) ? source.pages : []
  for (const rawPage of list.slice(0, COMIC_MAX_PAGES)) {
    const record = (rawPage ?? {}) as Record<string, unknown>
    let id = cleanString(record.id, 64)
    if (!id || pageIds.has(id)) id = comicLayoutId('p')
    pageIds.add(id)
    const cells = normalizeCells(record.cells)
    const layoutKey =
      cells && record.layoutKey === CUSTOM_LAYOUT_KEY
        ? CUSTOM_LAYOUT_KEY
        : TEMPLATE_BY_KEY.has(String(record.layoutKey))
          ? String(record.layoutKey)
          : 'splash'
    const page: ComicLayoutPage = {
      id,
      layoutKey,
      ...(cells ? { cells } : {}),
      ...(cleanString(record.label, 120)
        ? { label: cleanString(record.label, 120) }
        : {}),
      ...(cleanString(record.notes, 4000)
        ? { notes: cleanString(record.notes, 4000) }
        : {}),
      panels: [],
    }
    const cellCount = comicPageCells(page).length
    const usedCells = new Set<number>()
    const rawPanels = Array.isArray(record.panels) ? record.panels : []
    for (const rawPanel of rawPanels.slice(0, COMIC_MAX_PANELS_PER_PAGE)) {
      const panelRecord = (rawPanel ?? {}) as Record<string, unknown>
      let panelId = cleanString(panelRecord.id, 64)
      if (!panelId || panelIds.has(panelId)) panelId = comicLayoutId('c')
      panelIds.add(panelId)
      const slotId = Number(panelRecord.slotId)
      const cellValue = Number(panelRecord.cell)
      const cell =
        panelRecord.cell !== null &&
        Number.isInteger(cellValue) &&
        cellValue >= 0 &&
        cellValue < cellCount &&
        !usedCells.has(cellValue)
          ? cellValue
          : null
      if (cell !== null) usedCells.add(cell)
      const art = Number(panelRecord.artAttemptId)
      page.panels.push({
        id: panelId,
        slotId: Number.isInteger(slotId) && slotId > 0 ? slotId : null,
        cell,
        artAttemptId: Number.isInteger(art) && art > 0 ? art : null,
        focusX: clamp01(panelRecord.focusX, 0.5),
        focusY: clamp01(panelRecord.focusY, 0.5),
        lettering: normalizeLettering(panelRecord.lettering),
      })
    }
    pages.push(page)
  }
  return { version: 1, pages }
}

export function parseComicIssueLayout(
  stored: string | null | undefined,
): ComicIssueLayout {
  try {
    return normalizeComicIssueLayout(JSON.parse(String(stored || '{}')))
  } catch {
    return emptyComicIssueLayout()
  }
}

function clonePages(layout: ComicIssueLayout): ComicLayoutPage[] {
  return layout.pages.map((page) => ({
    ...page,
    ...(page.cells ? { cells: page.cells.map((cell) => ({ ...cell })) } : {}),
    panels: page.panels.map((panel) => ({
      ...panel,
      lettering: (panel.lettering ?? []).map((item) => ({ ...item })),
    })),
  }))
}

function withPages(pages: ComicLayoutPage[]): ComicIssueLayout {
  return { version: 1, pages }
}

export function addComicPage(
  layout: ComicIssueLayout,
  layoutKey = 'three-tier',
  index: number = layout.pages.length,
): ComicIssueLayout {
  if (layout.pages.length >= COMIC_MAX_PAGES) return layout
  const pages = clonePages(layout)
  const page: ComicLayoutPage = {
    id: comicLayoutId('p'),
    layoutKey: TEMPLATE_BY_KEY.has(layoutKey) ? layoutKey : 'three-tier',
    panels: [],
  }
  pages.splice(Math.max(0, Math.min(index, pages.length)), 0, page)
  return withPages(pages)
}

export function removeComicPage(
  layout: ComicIssueLayout,
  pageId: string,
): ComicIssueLayout {
  return withPages(clonePages(layout).filter((page) => page.id !== pageId))
}

export function moveComicPage(
  layout: ComicIssueLayout,
  pageId: string,
  toIndex: number,
): ComicIssueLayout {
  const pages = clonePages(layout)
  const from = pages.findIndex((page) => page.id === pageId)
  if (from === -1) return layout
  const [page] = pages.splice(from, 1)
  pages.splice(Math.max(0, Math.min(toIndex, pages.length)), 0, page!)
  return withPages(pages)
}

function reflow(page: ComicLayoutPage): void {
  const count = comicPageCells(page).length
  const ordered = [...page.panels].sort((a, b) => {
    const left = a.cell ?? Number.POSITIVE_INFINITY
    const right = b.cell ?? Number.POSITIVE_INFINITY
    return left - right
  })
  ordered.forEach((panel, index) => {
    panel.cell = index < count ? index : null
  })
  page.panels = ordered
}

export function setComicPageLayout(
  layout: ComicIssueLayout,
  pageId: string,
  layoutKey: string,
): ComicIssueLayout {
  if (!TEMPLATE_BY_KEY.has(layoutKey)) return layout
  const pages = clonePages(layout)
  const page = pages.find((item) => item.id === pageId)
  if (!page) return layout
  page.layoutKey = layoutKey
  delete page.cells
  reflow(page)
  return withPages(pages)
}

function findPanel(pages: ComicLayoutPage[], panelId: string) {
  for (const page of pages) {
    const index = page.panels.findIndex((panel) => panel.id === panelId)
    if (index !== -1) return { page, index, panel: page.panels[index]! }
  }
  return null
}

export function moveComicPanel(
  layout: ComicIssueLayout,
  panelId: string,
  toPageId: string,
  toCell: number | null,
): ComicIssueLayout {
  const pages = clonePages(layout)
  const source = findPanel(pages, panelId)
  const target = pages.find((page) => page.id === toPageId)
  if (!source || !target) return layout
  const cellCount = comicPageCells(target).length
  const cell =
    toCell !== null &&
    Number.isInteger(toCell) &&
    toCell >= 0 &&
    toCell < cellCount
      ? toCell
      : null
  if (
    source.page.id !== target.id &&
    target.panels.length >= COMIC_MAX_PANELS_PER_PAGE
  )
    return layout
  const fromCell = source.panel.cell
  const occupant =
    cell === null
      ? null
      : target.panels.find(
          (panel) => panel.cell === cell && panel.id !== panelId,
        )
  source.page.panels.splice(source.index, 1)
  const moved = { ...source.panel, cell }
  if (occupant) {
    target.panels = target.panels.filter((panel) => panel.id !== occupant.id)
    const sourceCount = comicPageCells(source.page).length
    const swapCell =
      fromCell !== null && fromCell < sourceCount ? fromCell : null
    source.page.panels.push({ ...occupant, cell: swapCell })
  }
  target.panels.push(moved)
  return withPages(pages)
}

export function addComicPanel(
  layout: ComicIssueLayout,
  pageId: string,
  slotId: number,
  preferredCell: number | null = null,
): { layout: ComicIssueLayout; panelId: string | null } {
  const pages = clonePages(layout)
  const page = pages.find((item) => item.id === pageId)
  if (!page || page.panels.length >= COMIC_MAX_PANELS_PER_PAGE)
    return { layout, panelId: null }
  const count = comicPageCells(page).length
  const used = new Set(page.panels.map((panel) => panel.cell))
  let cell: number | null = null
  if (
    preferredCell !== null &&
    preferredCell >= 0 &&
    preferredCell < count &&
    !used.has(preferredCell)
  ) {
    cell = preferredCell
  } else {
    for (let index = 0; index < count; index += 1) {
      if (!used.has(index)) {
        cell = index
        break
      }
    }
  }
  const panelId = comicLayoutId('c')
  page.panels.push({
    id: panelId,
    slotId,
    cell,
    artAttemptId: null,
    focusX: 0.5,
    focusY: 0.5,
    lettering: [],
  })
  return { layout: withPages(pages), panelId }
}

export function removeComicPanel(
  layout: ComicIssueLayout,
  panelId: string,
): ComicIssueLayout {
  const pages = clonePages(layout)
  for (const page of pages)
    page.panels = page.panels.filter((panel) => panel.id !== panelId)
  return withPages(pages)
}

export function updateComicPanel(
  layout: ComicIssueLayout,
  panelId: string,
  patch: Partial<
    Pick<ComicLayoutPanel, 'artAttemptId' | 'focusX' | 'focusY' | 'lettering'>
  >,
): ComicIssueLayout {
  const pages = clonePages(layout)
  const found = findPanel(pages, panelId)
  if (!found) return layout
  found.page.panels[found.index] = { ...found.panel, ...patch }
  return normalizeComicIssueLayout(withPages(pages))
}

export function splitComicCell(
  layout: ComicIssueLayout,
  pageId: string,
  cellIndex: number,
  direction: 'horizontal' | 'vertical',
): ComicIssueLayout {
  const pages = clonePages(layout)
  const page = pages.find((item) => item.id === pageId)
  if (!page) return layout
  const cells = comicPageCells(page).map((cell) => ({ ...cell }))
  const cell = cells[cellIndex]
  if (!cell || cells.length >= COMIC_MAX_PANELS_PER_PAGE) return layout
  const halves: ComicCell[] =
    direction === 'vertical'
      ? [
          { x: cell.x, y: cell.y, w: cell.w / 2, h: cell.h },
          { x: cell.x + cell.w / 2, y: cell.y, w: cell.w / 2, h: cell.h },
        ]
      : [
          { x: cell.x, y: cell.y, w: cell.w, h: cell.h / 2 },
          { x: cell.x, y: cell.y + cell.h / 2, w: cell.w, h: cell.h / 2 },
        ]
  cells.splice(cellIndex, 1, ...halves)
  for (const panel of page.panels) {
    if (panel.cell !== null && panel.cell > cellIndex) panel.cell += 1
  }
  page.cells = cells
  page.layoutKey = CUSTOM_LAYOUT_KEY
  return withPages(pages)
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON
}

export function mergedComicCell(a: ComicCell, b: ComicCell): ComicCell | null {
  const sameRow = near(a.y, b.y) && near(a.h, b.h)
  const sameColumn = near(a.x, b.x) && near(a.w, b.w)
  if (sameRow && (near(a.x + a.w, b.x) || near(b.x + b.w, a.x))) {
    return { x: Math.min(a.x, b.x), y: a.y, w: a.w + b.w, h: a.h }
  }
  if (sameColumn && (near(a.y + a.h, b.y) || near(b.y + b.h, a.y))) {
    return { x: a.x, y: Math.min(a.y, b.y), w: a.w, h: a.h + b.h }
  }
  return null
}

export function mergeComicCells(
  layout: ComicIssueLayout,
  pageId: string,
  first: number,
  second: number,
): ComicIssueLayout {
  const pages = clonePages(layout)
  const page = pages.find((item) => item.id === pageId)
  if (!page) return layout
  const cells = comicPageCells(page).map((cell) => ({ ...cell }))
  const keep = Math.min(first, second)
  const drop = Math.max(first, second)
  const a = cells[keep]
  const b = cells[drop]
  if (!a || !b || keep === drop) return layout
  const merged = mergedComicCell(a, b)
  if (!merged) return layout
  cells.splice(drop, 1)
  cells[keep] = merged
  for (const panel of page.panels) {
    if (panel.cell === drop) {
      const keepTaken = page.panels.some((other) => other.cell === keep)
      panel.cell = keepTaken ? null : keep
    } else if (panel.cell !== null && panel.cell > drop) {
      panel.cell -= 1
    }
  }
  page.cells = cells
  page.layoutKey = CUSTOM_LAYOUT_KEY
  return withPages(pages)
}

export function comicMergeableNeighbor(
  page: Pick<ComicLayoutPage, 'layoutKey' | 'cells'>,
  cellIndex: number,
): number | null {
  const cells = comicPageCells(page)
  const cell = cells[cellIndex]
  if (!cell) return null
  for (const offset of [1, -1]) {
    const other = cells[cellIndex + offset]
    if (other && mergedComicCell(cell, other)) return cellIndex + offset
  }
  return null
}

export function comicPlacedSlotIds(layout: ComicIssueLayout): Set<number> {
  const ids = new Set<number>()
  for (const page of layout.pages) {
    for (const panel of page.panels) if (panel.slotId) ids.add(panel.slotId)
  }
  return ids
}

export function comicLayoutAttemptIds(layout: ComicIssueLayout): Set<number> {
  const ids = new Set<number>()
  for (const page of layout.pages) {
    for (const panel of page.panels)
      if (panel.artAttemptId) ids.add(panel.artAttemptId)
  }
  return ids
}

export type ComicSuggestedPage = { layoutKey: string; panelCount: number }

export function suggestComicLayout(panelCount: number, splash = false): string {
  if (splash || panelCount <= 1) return 'splash'
  if (panelCount === 2) return 'two-tier'
  if (panelCount === 3) return 'three-tier'
  if (panelCount === 4) return 'grid-2x2'
  if (panelCount === 5) return 'five-mixed'
  if (panelCount <= 6) return 'grid-6'
  return 'grid-9'
}
