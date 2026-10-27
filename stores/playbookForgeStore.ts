import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
import { usePlaybookStore, type PlaybookNoteKind } from '~/stores/playbookStore'
import { useFacetCatalogStore } from '~/stores/facetCatalogStore'
import {
  PLAYBOOK_GAMES,
  buildPlaybook,
  isPlaybookGame,
} from '~/utils/playbook/games'
import { KIT_PLAYBOOKS, kitPlaybook } from '~/utils/playbookKit/games'
import {
  DEFAULT_ASSUMPTIONS,
  type Assumptions,
} from '~/utils/playbookForge/calibration'
import {
  combinedSection,
  filterEntries,
  galleryTiles as buildGalleryTiles,
  targetEntries,
  type GalleryFilter,
  type GalleryTarget,
} from '~/utils/playbookForge/gallery'
import {
  EMPTY_PLAN_EDIT,
  applyPlanEdit,
  combosLine,
  planChanges,
  type AdditionKind,
  type PlanEdit,
} from '~/utils/playbookForge/adjust'
import {
  characterItem,
  facetItem,
  gameBeats,
  gamePlaces,
  itemDesign,
  itemSpark,
  rewardItem,
  scenarioItem,
  scenarioLocations,
  type CatalogItem,
  type CatalogTab,
} from '~/utils/playbookForge/catalog'
import { cardsForTab, type Design } from '~/utils/playbookForge/designs'
import { forecast } from '~/utils/playbookForge/estimate'
import {
  blueprintFromPitch,
  type GestationConcept,
  type GestationNote,
} from '~/utils/playbookForge/gestation'
import {
  dealSparks,
  elementFromFacets,
  facetPool,
  genreSpark,
  presetForGenre,
  type FacetCard,
  type FacetPool,
  type Spark,
  type SparkSlot,
} from '~/utils/playbookForge/facets'
import {
  EXISTING_PLAYBOOKS,
  builtBlueprint,
  type BuiltCounts,
  type ExistingPlaybook,
} from '~/utils/playbookForge/existing'
import {
  FORGE_TABS,
  rowsFor,
  stepValue,
  type FactorRow,
  type ForgeTab,
} from '~/utils/playbookForge/factors'
import { blueprintFromIdea } from '~/utils/playbookForge/presets'
import {
  blueprintBrief,
  blueprintPitch,
  planDiff,
} from '~/utils/playbookForge/handoff'
import type { Blueprint } from '~/utils/playbookForge/types'
import {
  PLAYBOOK_ART_LANES,
  playbookArtRequest,
} from '~/utils/playbook/artLanes'
import type { Playbook, PlaybookNode } from '~/utils/playbook/types'
import { withVerifiedArt } from '~/utils/playbookForge/verifiedArt'
import { withBundledArt } from '~/utils/playbook/bundledArt'
import {
  buildLedger,
  artPromptBrief,
  nodeArtPrompt,
  nodeShape,
  planGaps,
  unitsToPaint,
  unitsToWrite,
  writingBrief,
  type LedgerJob,
  type Shine,
  type ProjectJobs,
} from '~/utils/playbookForge/ledger'

// Playbook Forge (conductor playbook-kit t-012). Drafts and assumptions live in
// this browser; launching a playbook or sending a revised plan writes a Kind
// Robots Project or an agent Todo, which is how Conductor hears about it.

export type ForgeScreen =
  | 'title'
  | 'library'
  | 'idea'
  | 'loadout'
  | 'analyze'
  | 'ledger'
  | 'gallery'
  | 'beats'
  | 'kit'
  | 'gestation'
  | 'catalog'
  | 'launch'
  | 'assumptions'

/** Most pictures one Submit sends to the relay, so a slip never floods the queue. */
export const SUBMIT_CAP = 60

export type LedgerRelay = {
  studio: string | null
  project: string
  edits: number
  byNode: Record<string, LedgerJob[]>
  /** Beats whose image-store picture exists (node key → URL). */
  painted?: Record<string, string>
  /** URLs independently checked against delivered raster files on the server. */
  verified?: Record<string, string>
  extras?: { total: number; delivered: number; missing: string[] }
  jobs: ProjectJobs
  truncated: boolean
}

export type LedgerSubmit = {
  kind: 'art' | 'text'
  section: string
  count: number
  /** Art: beats with no authored prompt, sent as a prompt-writing Todo instead. */
  unprompted: number
  seconds: number
  words: number
}

const DRAFTS_KEY = 'kr-playbook-forge-drafts-v1'
const ASSUMPTIONS_KEY = 'kr-playbook-forge-assumptions-v1'
const LIBRARY_SORT_KEY = 'kr-playbook-forge-library-sort-v1'
const PLAN_EDITS_KEY = 'kr-playbook-forge-plan-edits-v1'
const TRAY_KEY = 'kr-playbook-forge-tray-v1'

/** One game's ledger at a glance, for the Load a game library. */
export type LibraryStat = {
  progress: number
  writtenShare: number
  paintedShare: number
  starred: number
  sections: number
  shine: Shine
  remainingSeconds: number
  remainingWords: number
  units: number
}

export const LIBRARY_SORTS = [
  { id: 'progress-asc', label: 'Least done' },
  { id: 'progress-desc', label: 'Most done' },
  { id: 'left', label: 'Most render left' },
  { id: 'title', label: 'A–Z' },
] as const
export type LibrarySort = (typeof LIBRARY_SORTS)[number]['id']

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function readJson<T>(key: string): T | null {
  try {
    const text = storage()?.getItem(key)
    return text ? (JSON.parse(text) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    const store = storage()
    if (!store) return false
    store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const usePlaybookForgeStore = defineStore('playbookForge', () => {
  const screen = ref<ForgeScreen>('title')
  const tab = ref<ForgeTab>('pitch')
  const focus = ref(0)
  const draft = ref<Blueprint | null>(null)
  const drafts = ref<Record<string, Blueprint>>({})
  const assumptions = ref<Assumptions>(structuredClone(DEFAULT_ASSUMPTIONS))
  const existing = ref<ExistingPlaybook | null>(null)
  const built = ref<BuiltCounts | null>(null)
  const loadingBuilt = ref(false)
  const status = ref('')
  const busy = ref(false)
  const result = ref<{
    kind: 'project' | 'todo'
    id: number
    title: string
  } | null>(null)
  const persistWarning = ref('')
  const loaded = ref(false)

  const rows = computed<FactorRow[]>(() =>
    draft.value ? rowsFor(tab.value, draft.value) : [],
  )
  const focusedRow = computed(() => rows.value[focus.value] ?? null)
  const current = computed(() =>
    draft.value ? forecast(draft.value, assumptions.value) : null,
  )
  const builtPlan = computed(() =>
    existing.value && built.value
      ? builtBlueprint(existing.value, built.value)
      : null,
  )
  const builtForecast = computed(() =>
    builtPlan.value ? forecast(builtPlan.value, assumptions.value) : null,
  )

  const planEdits = ref<Record<string, PlanEdit>>({})
  const ledgerPanel = ref<'detail' | 'adjust'>('detail')
  const posting = ref(false)
  const adjustStatus = ref('')

  function editFor(slug: string): PlanEdit {
    return planEdits.value[slug] ?? structuredClone(EMPTY_PLAN_EDIT)
  }

  /** A game's plan as this browser has adjusted it: its Conductor plan plus edits and added elements. */
  function planFor(entry: ExistingPlaybook): Blueprint {
    return applyPlanEdit(entry.plan, planEdits.value[entry.slug])
  }

  function saveEdit(slug: string, edit: PlanEdit) {
    planEdits.value = { ...planEdits.value, [slug]: edit }
    persistWarning.value = writeJson(PLAN_EDITS_KEY, planEdits.value)
      ? ''
      : 'Browser storage is blocked: these adjustments last only this visit.'
    libraryStats.value = Object.fromEntries(
      Object.entries(libraryStats.value).filter(([key]) => key !== slug),
    )
  }

  /** Changes one plan number (or choice) for the open game; equal to the plan clears it. */
  function setOverride<K extends keyof Blueprint>(key: K, value: Blueprint[K]) {
    const entry = existing.value
    if (!entry) return
    const edit = editFor(entry.slug)
    const overrides: Partial<Blueprint> = Object.fromEntries(
      Object.entries(edit.overrides).filter(([k]) => k !== key),
    )
    if (entry.plan[key] !== value) overrides[key] = value
    saveEdit(entry.slug, { ...edit, overrides })
    draft.value = planFor(entry)
  }

  function stepOverride(row: FactorRow, direction: 1 | -1) {
    const entry = existing.value
    if (!entry) return
    const base = { ...entry.plan, ...editFor(entry.slug).overrides }
    const value = stepValue(row, base, direction)
    if (value !== null) setOverride(row.key, value)
  }

  function addElement(element: {
    kind: AdditionKind
    title: string
    note: string
    source?: string
  }) {
    const entry = existing.value
    const title = element.title.trim()
    if (!entry || !title) return
    const edit = editFor(entry.slug)
    saveEdit(entry.slug, {
      ...edit,
      additions: [
        ...edit.additions,
        {
          id: `${Date.now().toString(36)}-${edit.additions.length}`,
          kind: element.kind,
          title,
          note: element.note.trim(),
          ...(element.source ? { source: element.source } : {}),
        },
      ],
    })
    draft.value = planFor(entry)
  }

  function removeElement(id: string) {
    const entry = existing.value
    if (!entry) return
    const edit = editFor(entry.slug)
    saveEdit(entry.slug, {
      ...edit,
      additions: edit.additions.filter((a) => a.id !== id),
    })
    draft.value = planFor(entry)
  }

  function setAdjustNote(note: string) {
    const entry = existing.value
    if (!entry) return
    saveEdit(entry.slug, { ...editFor(entry.slug), note })
  }

  function clearOverrides() {
    const entry = existing.value
    if (!entry) return
    saveEdit(entry.slug, { ...editFor(entry.slug), overrides: {} })
    draft.value = planFor(entry)
  }

  /** What the open game's next post would carry: the note, changed numbers and unposted elements. */
  const pendingAdjustment = computed(() => {
    const entry = existing.value
    if (!entry) return null
    const edit = editFor(entry.slug)
    const plan = planFor(entry)
    return {
      slug: entry.slug,
      title: entry.title,
      note: edit.note.trim(),
      changes: planChanges(entry.plan, edit.overrides),
      additions: edit.additions
        .filter((a) => !a.postedUrl)
        .map(({ kind, title, note, source, prompt }) => ({
          kind,
          title,
          note,
          source,
          prompt,
        })),
      combos: combosLine(plan),
    }
  })

  /** Posts the pending adjustment to the game's GitHub issue. Numbers stay as the working plan. */
  async function postAdjustment() {
    const entry = existing.value
    const post = pendingAdjustment.value
    if (!entry || !post || posting.value) return
    if (!post.note && !post.changes.length && !post.additions.length) {
      adjustStatus.value =
        'Type an adjustment, change a number or add an element first.'
      return
    }
    posting.value = true
    adjustStatus.value = 'Posting to GitHub…'
    try {
      const res = await performFetch<{ issue: number; url: string }>(
        '/api/playbook-forge/adjustment',
        { method: 'POST', body: JSON.stringify(post) },
        0,
        20000,
      )
      if (!res.success || !res.data) {
        adjustStatus.value = `Not posted: ${res.message || 'GitHub did not answer.'} The adjustment is kept here.`
        return
      }
      const { url } = res.data
      const edit = editFor(entry.slug)
      saveEdit(entry.slug, {
        ...edit,
        note: '',
        additions: edit.additions.map((a) =>
          a.postedUrl ? a : { ...a, postedUrl: url },
        ),
        posts: [{ url, at: new Date().toISOString() }, ...edit.posts].slice(
          0,
          20,
        ),
      })
      adjustStatus.value = `Posted to issue #${res.data.issue}.`
    } finally {
      posting.value = false
    }
  }

  const facets = ref<FacetPool>({})
  const facetsState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const facetsError = ref('')
  const ideaSparks = ref<Spark[]>([])
  const ideaGenre = ref<Spark | null>(null)
  const genreFacets = computed(() => facets.value.GENRE ?? [])

  /** The Facet catalog's genres and the taxonomies sparks are dealt from, once per visit. */
  async function loadFacets() {
    if (facetsState.value === 'loading' || facetsState.value === 'ready') return
    facetsState.value = 'loading'
    try {
      // Every taxonomy: sparks deal from theirs, the catalogue browses all.
      const rows = await useFacetCatalogStore().fetchCatalogSlice({
        take: 1000,
      })
      facets.value = facetPool(rows)
      facetsState.value = 'ready'
      if (!ideaSparks.value.length) dealIdeaSparks()
    } catch (error) {
      facetsError.value =
        error instanceof Error ? error.message : 'Facets could not load.'
      facetsState.value = 'error'
    }
  }

  /** Picks a genre Facet for a new idea; returns the loadout it starts from. */
  function chooseGenreFacet(card: FacetCard | null): string | null {
    ideaGenre.value = card ? genreSpark(card) : null
    return card ? presetForGenre(card) : null
  }

  function dealIdeaSparks(slot?: SparkSlot) {
    ideaSparks.value = dealSparks(
      facets.value,
      ideaSparks.value,
      Math.random,
      slot,
    )
  }

  function toggleSparkLock(slot: SparkSlot) {
    ideaSparks.value = ideaSparks.value.map((s) =>
      s.slot === slot ? { ...s, locked: !s.locked } : s,
    )
  }

  function dropSpark(slot: SparkSlot) {
    ideaSparks.value = ideaSparks.value.filter((s) => s.slot !== slot)
  }

  /** A named element for the open game's ledger, drawn from Facets. */
  function drawElement(kind: AdditionKind) {
    return elementFromFacets(kind, facets.value)
  }

  // Designs: every plan page leads with art, either the game's own beats or
  // designs (an authored prompt, rendered here on request).
  const designs = computed<Design[]>(() =>
    existing.value
      ? editFor(existing.value.slug).additions
      : (draft.value?.designs ?? []),
  )
  const designCards = computed(() =>
    cardsForTab(
      tab.value,
      existing.value && ledgerBook.value
        ? withVerifiedArt(ledgerBook.value, ledgerRelay.value?.verified)
        : null,
      designs.value,
    ),
  )
  const designJobs = ref<Record<string, string>>({})
  const pendingDesigns = ref<Design[]>([])

  /** Adds or updates a design on the open game (its ledger additions) or the draft. */
  function saveDesign(design: Design) {
    const entry = existing.value
    if (entry) {
      const edit = editFor(entry.slug)
      const at = edit.additions.findIndex((a) => a.id === design.id)
      const additions =
        at >= 0
          ? edit.additions.map((a, i) => (i === at ? { ...a, ...design } : a))
          : [...edit.additions, design]
      saveEdit(entry.slug, { ...edit, additions })
      draft.value = planFor(entry)
      return
    }
    if (!draft.value) return
    const list = draft.value.designs ?? []
    const at = list.findIndex((d) => d.id === design.id)
    draft.value = {
      ...draft.value,
      designs:
        at >= 0
          ? list.map((d, i) => (i === at ? { ...d, ...design } : d))
          : [...list, design],
    }
    persistDraft()
  }

  function removeDesign(id: string) {
    if (existing.value) return removeElement(id)
    if (!draft.value) return
    draft.value = {
      ...draft.value,
      designs: (draft.value.designs ?? []).filter((d) => d.id !== id),
    }
    persistDraft()
  }

  /** Renders a design's authored prompt on Krea 2. Never renders without a prompt. */
  async function renderDesign(id: string) {
    const design = designs.value.find((d) => d.id === id)
    const prompt = design?.prompt?.trim()
    const lane = PLAYBOOK_ART_LANES.find((l) => l.key === 'krea2')
    if (!design || !prompt || !lane) return
    designJobs.value = { ...designJobs.value, [id]: 'Sending…' }
    const shape =
      design.kind === 'follower' || design.kind === 'villain'
        ? 'portrait'
        : 'scene'
    const res = await performFetch<{ jobId?: number }>('/api/art/enqueue', {
      method: 'POST',
      body: JSON.stringify(
        playbookArtRequest(
          lane,
          prompt,
          shape,
          Math.floor(Math.random() * 2_000_000_000),
          {
            projectSlug:
              existing.value?.slug || draft.value?.slug || 'playbook-forge',
            designer: `${existing.value?.title ?? draft.value?.title ?? 'Playbook Forge'} design`,
          },
        ),
      ),
    })
    const jobId = Number(res.data?.jobId)
    if (!res.success || !Number.isInteger(jobId)) {
      designJobs.value = {
        ...designJobs.value,
        [id]: `Refused: ${res.message || 'no answer'}`,
      }
      return
    }
    saveDesign({ ...design, jobId, imageUrl: undefined })
    designJobs.value = { ...designJobs.value, [id]: 'Queued' }
  }

  /** Picks up finished renders for designs that are waiting on a job. */
  async function refreshDesignJobs() {
    for (const design of designs.value) {
      if (!design.jobId || design.imageUrl) continue
      const res = await performFetch<{
        job?: { status?: string; artImageId?: number | null }
      }>(`/api/art/queue/${design.jobId}`)
      const job = res.data?.job
      if (!job) continue
      if (job.status === 'DONE' && job.artImageId) {
        saveDesign({
          ...design,
          imageUrl: `/api/art/images/${job.artImageId}/file`,
        })
        designJobs.value = { ...designJobs.value, [design.id]: '' }
      } else
        designJobs.value = {
          ...designJobs.value,
          [design.id]:
            job.status === 'RUNNING'
              ? 'Rendering'
              : job.status === 'FAILED'
                ? 'Failed'
                : 'Queued',
        }
    }
  }

  // The catalogue: Kind Robots content browsed by its art, for brainstorming.
  const catalogTab = ref<CatalogTab>('facets')
  const catalog = ref<Partial<Record<CatalogTab, CatalogItem[]>>>({})
  const catalogLoading = ref<CatalogTab | ''>('')
  const catalogError = ref('')
  const catalogSearch = ref('')
  const catalogFocus = ref('')
  const tray = ref<CatalogItem[]>([])

  async function list(url: string) {
    const res = await performFetch<Record<string, unknown>[]>(url, {}, 0, 30000)
    if (!res.success) throw new Error(res.message || `${url} did not answer.`)
    return Array.isArray(res.data) ? res.data : []
  }

  function playbookBooks() {
    return PLAYBOOK_GAMES.map((game) => ({
      game,
      book: buildPlaybook(game.id),
    }))
  }

  async function loadCatalog(tab: CatalogTab = catalogTab.value) {
    if (catalog.value[tab] || catalogLoading.value === tab) return
    catalogLoading.value = tab
    catalogError.value = ''
    try {
      let items: CatalogItem[] = []
      if (tab === 'facets' || tab === 'locations') await loadFacets()
      if (tab === 'facets')
        items = Object.values(facets.value).flat().map(facetItem)
      else if (tab === 'characters')
        items = (await list('/api/characters')).flatMap(
          (row) => characterItem(row) ?? [],
        )
      else if (tab === 'scenarios')
        items = (await list('/api/scenarios')).flatMap(
          (row) => scenarioItem(row) ?? [],
        )
      else if (tab === 'rewards')
        items = (await list('/api/rewards')).flatMap(
          (row) => rewardItem(row) ?? [],
        )
      else if (tab === 'locations') {
        const scenarios = await list('/api/scenarios').catch(() => [])
        items = [
          ...(facets.value.SETTING ?? []).map(facetItem),
          ...playbookBooks().flatMap(({ game, book }) =>
            gamePlaces(game.id, book),
          ),
          ...scenarios.flatMap(scenarioLocations),
        ]
      } else if (tab === 'beats')
        items = playbookBooks().flatMap(({ game, book }) =>
          gameBeats(game.id, book),
        )
      catalog.value = { ...catalog.value, [tab]: items }
    } catch (error) {
      catalogError.value =
        error instanceof Error ? error.message : 'The catalogue could not load.'
    } finally {
      catalogLoading.value = ''
    }
  }

  function openCatalog(tab?: CatalogTab) {
    if (tab) catalogTab.value = tab
    go('catalog')
    void loadCatalog()
  }

  function setCatalogTab(tab: CatalogTab) {
    catalogTab.value = tab
    catalogFocus.value = ''
    void loadCatalog(tab)
  }

  function inTray(key: string) {
    return tray.value.some((item) => item.key === key)
  }

  function toggleTray(item: CatalogItem) {
    tray.value = inTray(item.key)
      ? tray.value.filter((i) => i.key !== item.key)
      : [...tray.value, item]
    writeJson(TRAY_KEY, tray.value)
  }

  function clearTray() {
    tray.value = []
    writeJson(TRAY_KEY, tray.value)
  }

  /** Starts a new playbook from the tray: Facets become sparks, everything else designs. */
  function trayToIdea() {
    const facetsIn = tray.value.flatMap((item) => {
      const spark = itemSpark(item)
      return spark ? [spark] : []
    })
    ideaGenre.value =
      facetsIn.find((s) => s.slot === 'genre') ?? ideaGenre.value
    const sparks = facetsIn.filter((s) => s.slot !== 'genre')
    ideaSparks.value = [
      ...ideaSparks.value.filter((s) => !sparks.some((n) => n.slot === s.slot)),
      ...sparks.map((s) => ({ ...s, locked: true })),
    ]
    pendingDesigns.value = tray.value
      .filter((item) => !item.facet || item.facet.taxonomy === 'SETTING')
      .map(itemDesign)
    startIdea()
  }

  /** Adds the tray to the open game as designs (shown on its plan pages and ledger). */
  function trayToGame() {
    const entry = existing.value
    if (!entry || !tray.value.length) return
    for (const item of tray.value) saveDesign(itemDesign(item))
    status.value = `${tray.value.length} designs added to ${entry.title}. Post them from the ledger's Adjust panel.`
    clearTray()
  }

  const libraryStats = ref<Record<string, LibraryStat>>({})
  const libraryLoading = ref(false)
  const librarySort = ref<LibrarySort>('progress-asc')

  /**
   * Every game's ledger from its code (beats, art, words, plan gaps), so the
   * library shows how done each one is. Built one game at a time so the
   * console stays responsive while the larger adapters load.
   */
  async function loadLibraryStats() {
    if (libraryLoading.value) return
    libraryLoading.value = true
    try {
      for (const entry of EXISTING_PLAYBOOKS) {
        if (libraryStats.value[entry.slug]) continue
        if (!entry.studio || !isPlaybookGame(entry.studio)) continue
        const book = await withBundledArt(buildPlaybook(entry.studio))
        const counts = await entry.count().catch(() => null)
        const inventory = await performFetch<{
          verified: Record<string, string>
          extras: { total: number; delivered: number; missing: string[] }
        }>(
          `/api/admin/playbook-ledger/${encodeURIComponent(entry.studio)}?inventory=1`,
        )
        // A failed verification is unknown, never an optimistic 100%.
        if (!inventory.success || !inventory.data) continue
        const ledger = buildLedger(
          withVerifiedArt(book, inventory.data.verified),
          {},
          {
            laneKey: book.artLanes[0] ?? 'krea2',
            assumptions: assumptions.value,
            gaps: counts ? planGaps(planFor(entry), counts) : [],
            extraArt: inventory.data.extras,
          },
        )
        libraryStats.value = {
          ...libraryStats.value,
          [entry.slug]: {
            progress: ledger.progress,
            writtenShare: ledger.writtenShare,
            paintedShare: ledger.paintedShare,
            starred: ledger.starred,
            sections: ledger.sections.length,
            shine: ledger.shine,
            remainingSeconds: ledger.remainingSeconds,
            remainingWords: ledger.remainingWords,
            units: ledger.units,
          },
        }
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    } finally {
      libraryLoading.value = false
    }
  }

  function setLibrarySort(next: LibrarySort) {
    librarySort.value = next
    writeJson(LIBRARY_SORT_KEY, next)
  }

  /** The library in the chosen order; games still being counted go last. */
  const libraryGames = computed(() => {
    const stat = (slug: string) => libraryStats.value[slug]
    const games = [...EXISTING_PLAYBOOKS]
    const known = (a: string, b: string) => Number(!stat(a)) - Number(!stat(b))
    return games.sort((a, b) => {
      if (librarySort.value === 'title') return a.title.localeCompare(b.title)
      const unknown = known(a.slug, b.slug)
      if (unknown) return unknown
      const sa = stat(a.slug)
      const sb = stat(b.slug)
      if (!sa || !sb) return a.title.localeCompare(b.title)
      if (librarySort.value === 'left')
        return sb.remainingSeconds - sa.remainingSeconds
      const diff =
        librarySort.value === 'progress-asc'
          ? sa.progress - sb.progress
          : sb.progress - sa.progress
      return diff || a.title.localeCompare(b.title)
    })
  })

  const ledgerBook = ref<Playbook | null>(null)
  const ledgerRelay = ref<LedgerRelay | null>(null)
  const ledgerLoading = ref(false)
  const ledgerSection = ref(0)
  const ledgerLane = ref('')
  const ledgerConfirm = ref<LedgerSubmit | null>(null)

  const ledger = computed(() => {
    const entry = existing.value
    if (!entry) return null
    const gaps = built.value ? planGaps(planFor(entry), built.value) : []
    const notes: string[] = []
    if (!entry.studio)
      notes.push(
        'No Playbook Studio adapter yet, so its beats cannot be listed one by one (playbook-kit t-013).',
      )
    const edits = ledgerRelay.value?.edits ?? 0
    if (edits)
      notes.push(
        `${edits} Playbook Studio edit${edits === 1 ? ' is' : 's are'} not folded into the authored source yet.`,
      )
    if (ledgerRelay.value?.truncated)
      notes.push('Only the newest 5000 relay jobs were read.')
    return buildLedger(
      withVerifiedArt(
        ledgerBook.value ?? { order: [], nodes: {} },
        ledgerRelay.value?.verified,
      ),
      ledgerRelay.value?.byNode ?? {},
      {
        laneKey: ledgerLane.value,
        assumptions: assumptions.value,
        gaps,
        extraArt: ledgerRelay.value?.extras,
        notes,
      },
    )
  })
  const ledgerFocused = computed(
    () => ledger.value?.sections[ledgerSection.value] ?? null,
  )

  // The gallery: a game's sections and people as large art, each beat with
  // its picture or prompt, its renders and its notes, and comments on whole
  // sections and people (Silas, 2026-10-27: "more of a command center, with
  // large image friendly interfaces, than a museum").
  const galleryTarget = ref<GalleryTarget | null>(null)
  const galleryFocus = ref<string | null>(null)
  const galleryFilter = ref<GalleryFilter>('all')
  const galleryGroup = ref('All')
  const galleryBook = computed<Playbook | null>(() =>
    ledgerBook.value
      ? {
          ...ledgerBook.value,
          ...withVerifiedArt(ledgerBook.value, ledgerRelay.value?.verified),
        }
      : null,
  )
  const galleryTiles = computed(() =>
    galleryBook.value
      ? buildGalleryTiles(galleryBook.value, ledger.value)
      : { sections: [], people: [] },
  )
  const galleryTile = computed(() => {
    const target = galleryTarget.value
    if (!target) return null
    const tiles =
      target.type === 'section'
        ? galleryTiles.value.sections
        : galleryTiles.value.people
    return tiles.find((t) => t.target.id === target.id) ?? null
  })
  const galleryEntries = computed(() =>
    galleryBook.value && galleryTarget.value
      ? targetEntries(galleryBook.value, ledger.value, galleryTarget.value)
      : [],
  )
  const galleryShown = computed(() =>
    filterEntries(galleryEntries.value, galleryFilter.value),
  )
  const galleryFocused = computed(
    () =>
      galleryEntries.value.find((e) => e.key === galleryFocus.value) ?? null,
  )
  /** The gallery's section, or a person's beats as one, for the shared submit flow. */
  const gallerySection = computed(() => {
    const target = galleryTarget.value
    const l = ledger.value
    if (!target || !l) return null
    if (target.type === 'section')
      return l.sections.find((s) => s.id === target.id) ?? null
    return combinedSection(
      galleryTile.value?.label ?? target.id,
      l.sections,
      galleryEntries.value.map((e) => e.key),
    )
  })
  const submitSection = computed(() =>
    screen.value === 'gallery' ? gallerySection.value : ledgerFocused.value,
  )

  /** What one press of ◀ or ▶ on the focused row would do to the forecast. */
  const preview = computed(() => {
    const row = focusedRow.value
    const b = draft.value
    if (!row || !b) return { less: null, more: null }
    const at = (direction: 1 | -1) => {
      const value = stepValue(row, b, direction)
      return value === null
        ? null
        : forecast({ ...b, [row.key]: value }, assumptions.value)
    }
    return { less: at(-1), more: at(1) }
  })

  const draftList = computed(() =>
    Object.values(drafts.value).sort((a, b) => a.title.localeCompare(b.title)),
  )

  function load() {
    if (loaded.value) return
    loaded.value = true
    drafts.value = readJson<Record<string, Blueprint>>(DRAFTS_KEY) ?? {}
    planEdits.value = readJson<Record<string, PlanEdit>>(PLAN_EDITS_KEY) ?? {}
    tray.value = readJson<CatalogItem[]>(TRAY_KEY) ?? []
    const sort = readJson<LibrarySort>(LIBRARY_SORT_KEY)
    if (sort && LIBRARY_SORTS.some((option) => option.id === sort))
      librarySort.value = sort
    const saved = readJson<Assumptions>(ASSUMPTIONS_KEY)
    if (saved)
      assumptions.value = {
        ...DEFAULT_ASSUMPTIONS,
        ...saved,
        words: { ...DEFAULT_ASSUMPTIONS.words, ...saved.words },
      }
  }

  function persistDraft() {
    const b = draft.value
    if (!b || existing.value || !b.slug) return
    drafts.value = { ...drafts.value, [b.slug]: b }
    persistWarning.value = writeJson(DRAFTS_KEY, drafts.value)
      ? ''
      : 'Browser storage is blocked: this draft lasts only this visit.'
  }

  const returnTo = ref<ForgeScreen>('title')

  function go(next: ForgeScreen) {
    if (next === 'assumptions' || next === 'launch' || next === 'catalog')
      returnTo.value = screen.value
    screen.value = next
    status.value = ''
    result.value = null
  }

  /** The B button: one step back toward the title screen. */
  function back() {
    const from = screen.value
    if (from === 'launch' || from === 'assumptions' || from === 'catalog')
      screen.value = returnTo.value
    else if (from === 'loadout')
      screen.value = existing.value ? 'library' : 'idea'
    else if (from === 'ledger' && ledgerConfirm.value) {
      ledgerConfirm.value = null
      return
    } else if (from === 'ledger' && ledgerPanel.value === 'adjust') {
      ledgerPanel.value = 'detail'
      return
    } else if (from === 'ledger') screen.value = 'library'
    else if (from === 'gallery' && ledgerConfirm.value) {
      ledgerConfirm.value = null
      return
    } else if (from === 'gallery' && galleryFocus.value) {
      galleryFocus.value = null
      return
    } else if (from === 'gallery') screen.value = 'ledger'
    else if (from === 'beats')
      screen.value =
        ledgerBook.value || ledgerRelay.value ? 'ledger' : 'library'
    else if (from === 'kit')
      screen.value = existing.value ? 'ledger' : 'library'
    else if (from === 'analyze')
      screen.value = ledgerBook.value || ledgerRelay.value ? 'ledger' : 'title'
    else if (from === 'idea' || from === 'library' || from === 'gestation')
      screen.value = 'title'
    status.value = ''
    result.value = null
  }

  const gestation = ref<GestationConcept[] | null>(null)
  const gestationLoading = ref(false)
  const gestationError = ref('')
  const gestationId = ref('')
  const gestationStatus = ref('')
  const gestationFocused = computed(
    () =>
      gestation.value?.find((c) => c.conceptId === gestationId.value) ??
      gestation.value?.[0] ??
      null,
  )

  /** The daily playbook challenge's concepts, read from Conductor. */
  async function loadGestation() {
    if (gestationLoading.value) return
    gestationLoading.value = true
    gestationError.value = ''
    try {
      const res = await performFetch<{ concepts: GestationConcept[] }>(
        '/api/playbook-forge/gestation',
        {},
        0,
        30000,
      )
      if (res.success && res.data) {
        gestation.value = res.data.concepts
        if (!gestationId.value)
          gestationId.value = res.data.concepts[0]?.conceptId ?? ''
      } else gestationError.value = res.message || 'Conductor did not answer.'
    } finally {
      gestationLoading.value = false
    }
  }

  function openGestation() {
    go('gestation')
    if (!gestation.value) void loadGestation()
  }

  /** Saves a note for the concept's next development (Conductor SILAS-NOTES.yaml). */
  async function postGestationNote(conceptId: string, note: string) {
    const text = note.trim()
    if (!text || busy.value) return false
    busy.value = true
    gestationStatus.value = 'Saving the note…'
    try {
      const res = await performFetch<GestationNote>(
        '/api/playbook-forge/gestation-note',
        { method: 'POST', body: JSON.stringify({ conceptId, note: text }) },
        0,
        20000,
      )
      if (!res.success || !res.data) {
        gestationStatus.value = `Not saved: ${res.message || 'Conductor did not answer.'}`
        return false
      }
      const concept = gestation.value?.find((c) => c.conceptId === conceptId)
      if (concept) concept.notes = [...concept.notes, res.data]
      gestationStatus.value =
        'Saved. The next daily challenge answers it before anything else.'
      return true
    } finally {
      busy.value = false
    }
  }

  /** Turns a gestating pitch into a Forge draft: its genre's loadout plus the counts it names. */
  function forgePitch(conceptId: string) {
    const concept = gestation.value?.find((c) => c.conceptId === conceptId)
    if (!concept) return
    existing.value = null
    built.value = null
    draft.value = blueprintFromPitch(concept.latest)
    tab.value = 'pitch'
    focus.value = 0
    persistDraft()
    go('loadout')
  }

  function startIdea() {
    existing.value = null
    built.value = null
    draft.value = null
    go('idea')
  }

  function forge(title: string, idea: string, genre: string) {
    draft.value = {
      ...blueprintFromIdea(
        title.trim() || 'Untitled playbook',
        idea.trim(),
        genre,
      ),
      sparks: [
        ...(ideaGenre.value ? [ideaGenre.value] : []),
        ...ideaSparks.value.map(({ locked: _locked, ...spark }) => spark),
      ],
      designs: pendingDesigns.value,
    }
    pendingDesigns.value = []
    tab.value = 'pitch'
    focus.value = 0
    persistDraft()
    go('loadout')
  }

  function openDraft(slug: string) {
    const found = drafts.value[slug]
    if (!found) return
    existing.value = null
    built.value = null
    draft.value = structuredClone(found)
    tab.value = 'pitch'
    focus.value = 0
    go('loadout')
  }

  function deleteDraft(slug: string) {
    const { [slug]: _removed, ...rest } = drafts.value
    drafts.value = rest
    writeJson(DRAFTS_KEY, rest)
  }

  async function analyze(slug: string) {
    const entry = EXISTING_PLAYBOOKS.find((e) => e.slug === slug)
    if (!entry) return
    // From a game's ledger, Plan keeps the ledger to come back to.
    if (existing.value?.slug !== slug || screen.value !== 'ledger') {
      ledgerBook.value = null
      ledgerRelay.value = null
    }
    existing.value = entry
    draft.value = planFor(entry)
    built.value = null
    tab.value = 'story'
    focus.value = 0
    go('analyze')
    loadingBuilt.value = true
    try {
      built.value = await entry.count()
      // The plan pages lead with the game's own art.
      if (!ledgerBook.value && entry.studio && isPlaybookGame(entry.studio)) {
        ledgerBook.value = await withBundledArt(buildPlaybook(entry.studio))
        void loadRelay(entry.studio)
      }
    } catch (error) {
      status.value = `Could not count ${entry.title}: ${error instanceof Error ? error.message : String(error)}`
    } finally {
      loadingBuilt.value = false
    }
  }

  async function loadRelay(slug: string) {
    const res = await performFetch<LedgerRelay>(
      `/api/admin/playbook-ledger/${encodeURIComponent(slug)}`,
    )
    if (res.success && res.data) ledgerRelay.value = res.data
    else
      status.value = `Relay records unavailable: ${res.message || 'no response'}. Beats are counted from code only.`
  }

  /** The production ledger: every beat a playbook is made of, its spend and what is left. */
  /** The kit game the Kit preview screen plays (a Playbook Kit spec id). */
  const kitId = ref(KIT_PLAYBOOKS[0]?.id ?? '')
  const beatSection = ref<'all' | number>('all')
  const beatSearch = ref('')
  const beatView = ref<'list' | 'cards'>('list')

  /**
   * Playbook Studio inside the Forge: a game's beats with the scene editor,
   * overlays, notes and art requests (the Studio store and API).
   */
  async function openBeats(slug: string, key?: string) {
    const entry = EXISTING_PLAYBOOKS.find((e) => e.slug === slug)
    if (!entry?.studio || !isPlaybookGame(entry.studio)) {
      status.value = entry
        ? `${entry.title} has no Playbook Studio adapter yet, so its beats cannot be opened.`
        : 'Unknown playbook.'
      return
    }
    if (existing.value?.slug !== slug) {
      existing.value = entry
      draft.value = planFor(entry)
    }
    beatSection.value = 'all'
    beatSearch.value = ''
    go('beats')
    const studio = usePlaybookStore()
    await studio.setGame(entry.studio)
    if (key && studio.playbook.nodes[key]) studio.selectedKey = key
  }

  /** The Playbook Kit console, for games built on the kit. */
  function openKit(id: string) {
    const spec = kitPlaybook(id) ?? KIT_PLAYBOOKS[0]
    if (!spec) return
    kitId.value = spec.id
    const entry = EXISTING_PLAYBOOKS.find((e) => e.slug === spec.id)
    if (entry) existing.value = entry
    go('kit')
  }

  async function openLedger(slug: string) {
    const entry = EXISTING_PLAYBOOKS.find((e) => e.slug === slug)
    if (!entry) return
    existing.value = entry
    draft.value = planFor(entry)
    built.value = null
    ledgerBook.value = null
    ledgerRelay.value = null
    ledgerSection.value = 0
    ledgerConfirm.value = null
    ledgerPanel.value = 'detail'
    go('ledger')
    ledgerLoading.value = true
    try {
      const [counts, book] = await Promise.all([
        entry.count(),
        (async () => {
          if (!entry.studio) return null
          const { buildPlaybook, isPlaybookGame } =
            await import('~/utils/playbook/games')
          return isPlaybookGame(entry.studio)
            ? withBundledArt(buildPlaybook(entry.studio))
            : null
        })(),
      ])
      built.value = counts
      ledgerBook.value = book
      ledgerLane.value = book?.artLanes[0] ?? PLAYBOOK_ART_LANES[0]!.key
      await loadRelay(entry.studio ?? entry.slug)
    } catch (error) {
      status.value = `Could not read ${entry.title}: ${error instanceof Error ? error.message : String(error)}`
    } finally {
      ledgerLoading.value = false
    }
  }

  /** Opens a game's gallery on a section or person (default: the ledger's focused section). */
  async function openGallery(
    slug: string,
    target?: GalleryTarget,
    key?: string,
  ) {
    if (existing.value?.slug !== slug || !ledgerBook.value)
      await openLedger(slug)
    const entry = existing.value
    if (!entry?.studio || !ledgerBook.value) {
      status.value = `${entry?.title ?? 'This game'} has no Playbook Studio adapter yet, so it has no gallery.`
      return
    }
    const focused = ledgerFocused.value
    galleryTarget.value =
      target ??
      (focused
        ? { type: 'section', id: focused.id }
        : (galleryTiles.value.sections[0]?.target ?? null))
    galleryFilter.value = 'all'
    galleryGroup.value = 'All'
    galleryFocus.value = null
    ledgerConfirm.value = null
    go('gallery')
    if (isPlaybookGame(entry.studio))
      await usePlaybookStore().setGame(entry.studio)
    if (key) focusEntry(key)
  }

  function showTarget(target: GalleryTarget) {
    galleryGroup.value = 'All'
    galleryTarget.value = target
    galleryFocus.value = null
    ledgerConfirm.value = null
  }

  /** Focuses one beat and fetches its renders' previews. */
  function focusEntry(key: string | null) {
    galleryFocus.value = key
    ledgerConfirm.value = null
    if (!key) return
    const studio = usePlaybookStore()
    void studio.refreshJobs(key)
    for (const job of ledgerRelay.value?.byNode[key] ?? [])
      if (job.artImageId) void studio.loadPreview(job.artImageId)
  }

  /** Every render requested for a beat, newest first, with its preview once loaded. */
  function galleryRenders(key: string) {
    const studio = usePlaybookStore()
    const rows = new Map<
      number,
      { jobId: number; status: string; imageId: number | null }
    >()
    for (const job of ledgerRelay.value?.byNode[key] ?? [])
      rows.set(job.id, {
        jobId: job.id,
        status: job.status,
        imageId: job.artImageId ?? studio.jobs[job.id]?.artImageId ?? null,
      })
    for (const note of studio.notesFor(key)) {
      const id = note.artJobId
      if (!id || rows.has(id)) continue
      const job = studio.jobs[id]
      rows.set(id, {
        jobId: id,
        status: job?.status ?? 'PENDING',
        imageId: job?.artImageId ?? null,
      })
    }
    return [...rows.values()]
      .sort((a, b) => b.jobId - a.jobId)
      .map((row) => ({
        ...row,
        src: row.imageId ? (studio.previews[row.imageId] ?? null) : null,
      }))
  }

  /** A comment, a re-render flag or a prompt proposal on a beat, section or person. */
  async function galleryNote(
    key: string,
    kind: PlaybookNoteKind,
    body: string,
  ): Promise<boolean> {
    const text = body.trim()
    if (!text) return false
    const studio = usePlaybookStore()
    const ok = await studio.addNote(key, { kind, body: text })
    status.value = ok
      ? kind === 'flag'
        ? 'Flagged for a new picture.'
        : 'Saved for the next development.'
      : studio.message
    return ok
  }

  /** Send a creative brief to the game's master issue, not merely a private beat note. */
  async function postGalleryDirection(direction: string) {
    const entry = existing.value
    const brief = direction.trim()
    if (!entry || !brief || posting.value) return false
    const scope = galleryFocus.value
      ? (galleryFocused.value?.title ?? galleryFocus.value)
      : (galleryTile.value?.label ?? 'whole playbook')
    const origin =
      galleryGroup.value === 'All' ? '' : ` / ${galleryGroup.value} group`
    posting.value = true
    adjustStatus.value = 'Sending direction to GitHub…'
    try {
      const res = await performFetch<{ issue: number; url: string }>(
        '/api/playbook-forge/adjustment',
        {
          method: 'POST',
          body: JSON.stringify({
            slug: entry.slug,
            title: entry.title,
            note: `Creative direction for ${scope}${origin}:\n\n${brief}`,
            changes: [],
            additions: [],
            combos: '',
          }),
        },
        0,
        20000,
      )
      if (!res.success || !res.data) {
        adjustStatus.value = `Not posted: ${res.message || 'GitHub did not answer.'}`
        return false
      }
      adjustStatus.value = `Direction posted to #${res.data.issue}.`
      return true
    } finally {
      posting.value = false
    }
  }

  /** Renders a beat from a reviewed prompt (or, for pipeline games, leaves it for the next round). */
  async function renderEntry(key: string, prompt: string) {
    const book = ledgerBook.value
    const node = book?.nodes[key]
    const text = prompt.trim()
    if (!book || !node || !text || busy.value) return
    if (book.artPipeline) {
      await galleryNote(
        key,
        'comment',
        `Prompt for the next ${book.artPipeline} round: ${text}`,
      )
      status.value = `${book.title} art is queued by ${book.artPipeline}; the prompt is saved for its next round.`
      return
    }
    busy.value = true
    try {
      const studio = usePlaybookStore()
      const lane = PLAYBOOK_ART_LANES.find((l) => l.key === ledgerLane.value)
      const ok = await studio.requestArt(key, {
        prompt: text,
        laneKey: ledgerLane.value,
        shape: nodeShape(node),
      })
      status.value = ok
        ? `Sent to ${lane?.label ?? 'the relay'}. The render appears here when kr-relay finishes it.`
        : studio.message
      if (ok) await loadRelay(book.game)
    } finally {
      busy.value = false
    }
  }

  /** Asks the agents to write one beat's art prompt (a beat is never prompted from its title). */
  async function askPrompt(key: string) {
    const book = ledgerBook.value
    const node = book?.nodes[key]
    if (!book || !node || busy.value) return
    busy.value = true
    try {
      const res = await performFetch<{ id: number; title: string }>(
        '/api/todos',
        {
          method: 'POST',
          body: JSON.stringify({
            title: `Write art prompt: ${book.title} · ${node.title}`,
            description: artPromptBrief(
              book.game,
              book.title,
              book.artProject,
              galleryTile.value?.label ?? node.kind,
              [node],
            ),
            priority: 'HIGH',
            category: 'AGENT',
          }),
        },
      )
      status.value = res.success
        ? 'Sent to the agents as a prompt-writing Todo.'
        : res.message || 'The Todo was refused.'
    } finally {
      busy.value = false
    }
  }

  function focusSection(index: number) {
    const count = ledger.value?.sections.length ?? 0
    if (!count) return
    ledgerSection.value = (index + count) % count
    ledgerConfirm.value = null
  }

  function cycleLane(direction: 1 | -1) {
    const keys = PLAYBOOK_ART_LANES.map((l) => l.key)
    const at = keys.indexOf(ledgerLane.value)
    ledgerLane.value = keys[(at + direction + keys.length) % keys.length]!
    ledgerConfirm.value = null
  }

  /** First press: the confirm card with the count and time. Second press: send it. */
  function askSubmit(kind: 'art' | 'text') {
    const section = submitSection.value
    if (!section) return
    const pipeline = ledgerBook.value?.artPipeline
    if (kind === 'art' && pipeline) {
      status.value = `${ledgerBook.value?.title} art is written and queued by ${pipeline}, not from the Forge.`
      return
    }
    const count =
      kind === 'art'
        ? Math.min(unitsToPaint(section).length, SUBMIT_CAP)
        : unitsToWrite(section).length
    if (!count) {
      status.value =
        kind === 'art'
          ? `${section.label}: nothing to paint. Rendered or queued art is already on its way.`
          : `${section.label}: every beat is written.`
      return
    }
    const perImage =
      section.remainingSeconds / Math.max(1, unitsToPaint(section).length)
    const book = ledgerBook.value
    const unprompted =
      kind === 'art' && book
        ? unitsToPaint(section).filter((unit) => {
            const node = book.nodes[unit.key]
            return node && !nodeArtPrompt(node)
          }).length
        : 0
    ledgerConfirm.value = {
      kind,
      section: section.id,
      count:
        kind === 'art'
          ? Math.min(unitsToPaint(section).length - unprompted, SUBMIT_CAP) +
            unprompted
          : count,
      unprompted,
      seconds: kind === 'art' ? Math.round(perImage * count) : 0,
      words: kind === 'text' ? section.remainingWords : 0,
    }
  }

  async function confirmSubmit() {
    const pending = ledgerConfirm.value
    if (!pending || busy.value) return
    ledgerConfirm.value = null
    if (pending.kind === 'art') await submitSectionArt()
    else await submitSectionText()
  }

  /** Sends a section's unpainted beats to the art relay as Playbook Studio art requests. */
  async function submitSectionArt() {
    const book = ledgerBook.value
    const section = submitSection.value
    const lane = PLAYBOOK_ART_LANES.find((l) => l.key === ledgerLane.value)
    if (!book || !section || !lane || busy.value) return
    const all = unitsToPaint(section)
    const unprompted = all
      .map((unit) => book.nodes[unit.key])
      .filter((node): node is PlaybookNode => !!node && !nodeArtPrompt(node))
    if (book.artPipeline) {
      status.value = `${book.title} art is written and queued by ${book.artPipeline}, not from the Forge. Missing pictures there are submitted by Auto Art Generate.`
      return
    }
    const units = all
      .filter((unit) => {
        const node = book.nodes[unit.key]
        return node && nodeArtPrompt(node)
      })
      .slice(0, SUBMIT_CAP)
    busy.value = true
    let sent = 0
    let refused = ''
    let promptTodo = ''
    try {
      if (unprompted.length) {
        status.value = `Queuing prompt writing for ${unprompted.length} beats…`
        const res = await performFetch<{ id: number; title: string }>(
          '/api/todos',
          {
            method: 'POST',
            body: JSON.stringify({
              title: `Write art prompts: ${book.title} · ${section.label} (${unprompted.length} beats)`,
              description: artPromptBrief(
                book.game,
                book.title,
                book.artProject,
                section.label,
                unprompted,
              ),
              priority: 'HIGH',
              category: 'AGENT',
            }),
          },
        )
        promptTodo = res.success
          ? `${unprompted.length} beats without a prompt went to the agents as a prompt-writing Todo.`
          : `The prompt-writing Todo was refused: ${res.message || 'no answer'}.`
      }
      for (const unit of units) {
        const node = book.nodes[unit.key]
        if (!node) continue
        status.value = `Submitting ${section.label} to the relay: ${sent + 1} of ${units.length}…`
        const prompt = nodeArtPrompt(node)!
        const shape = nodeShape(node)
        const res = await performFetch<{ jobId?: number }>('/api/art/enqueue', {
          method: 'POST',
          body: JSON.stringify(
            playbookArtRequest(
              lane,
              prompt,
              shape,
              Math.floor(Math.random() * 2_000_000_000),
              {
                projectSlug: book.artProject,
                designer: book.title,
                negative: book.artNegative,
              },
            ),
          ),
        })
        const jobId = Number(res.data?.jobId)
        if (!res.success || !Number.isInteger(jobId)) {
          refused = res.message || 'The art queue refused the request.'
          break
        }
        await performFetch(
          `/api/admin/playbook/${book.game}/${encodeURIComponent(unit.key)}/notes`,
          {
            method: 'POST',
            body: JSON.stringify({
              kind: 'art-request',
              body: `${lane.label} · ${shape}: ${prompt} (Playbook Forge ledger)`,
              artJobId: jobId,
            }),
          },
        )
        sent += 1
      }
      await loadRelay(book.game)
      const pictures = units.length
        ? refused
          ? `Sent ${sent} of ${units.length}, then the relay refused: ${refused}`
          : `Sent ${sent} picture${sent === 1 ? '' : 's'} on ${lane.label}. kr-relay picks them up from the queue.`
        : ''
      status.value = [pictures, promptTodo].filter(Boolean).join(' ')
    } finally {
      busy.value = false
    }
  }

  /** Sends a section's missing words to the next agent as a high-priority Todo. */
  async function submitSectionText() {
    const entry = existing.value
    const book = ledgerBook.value
    const section = submitSection.value
    if (!entry || !book || !section || busy.value) return
    busy.value = true
    status.value = 'Sending…'
    try {
      const res = await performFetch<{ id: number; title: string }>(
        '/api/todos',
        {
          method: 'POST',
          body: JSON.stringify({
            title: `Write ${entry.title} ${section.label.toLowerCase()} from the Playbook Forge ledger`,
            description: writingBrief(book.game, entry.title, section),
            priority: 'HIGH',
            category: 'AGENT',
          }),
        },
      )
      if (!res.success || !res.data) {
        status.value = res.message || 'The writing could not be sent.'
        return
      }
      result.value = { kind: 'todo', id: res.data.id, title: res.data.title }
      status.value = 'Sent. The next agent takes it before any roadmap work.'
    } finally {
      busy.value = false
    }
  }

  function setTab(next: ForgeTab) {
    tab.value = next
    focus.value = 0
  }

  function cycleTab(direction: 1 | -1) {
    const ids = FORGE_TABS.map((t) => t.id)
    setTab(ids[(ids.indexOf(tab.value) + direction + ids.length) % ids.length]!)
  }

  function moveFocus(direction: 1 | -1) {
    const count = rows.value.length
    if (count) focus.value = (focus.value + direction + count) % count
  }

  function step(direction: 1 | -1, row: FactorRow | null = focusedRow.value) {
    if (!row || !draft.value) return
    const value = stepValue(row, draft.value, direction)
    if (value === null) return
    draft.value = { ...draft.value, [row.key]: value }
    if (existing.value) setOverride(row.key, value)
    if (focus.value >= rows.value.length)
      focus.value = Math.max(0, rows.value.length - 1)
    persistDraft()
  }

  function setText(key: 'title' | 'idea', value: string) {
    if (!draft.value) return
    draft.value = { ...draft.value, [key]: value }
    persistDraft()
  }

  function setAssumption<K extends keyof Assumptions>(
    key: K,
    value: Assumptions[K],
  ) {
    assumptions.value = { ...assumptions.value, [key]: value }
    writeJson(ASSUMPTIONS_KEY, assumptions.value)
  }

  function resetAssumptions() {
    assumptions.value = structuredClone(DEFAULT_ASSUMPTIONS)
    writeJson(ASSUMPTIONS_KEY, assumptions.value)
  }

  function resetPlan() {
    if (existing.value) draft.value = planFor(existing.value)
  }

  /** Creates the Kind Robots Project; its scaffold Todo carries the blueprint to Conductor. */
  async function launch() {
    const b = draft.value
    const f = current.value
    if (!b || !f || busy.value) return
    busy.value = true
    status.value = 'Forging…'
    try {
      const res = await performFetch<{ id: number; title: string }>(
        '/api/projects',
        {
          method: 'POST',
          body: JSON.stringify({
            title: b.title,
            slug: b.slug,
            conductorSlug: b.slug,
            description: b.idea || `${b.title}: a playbook game.`,
            goal: `${b.title}: ${f.tier ?? 'saga'} playbook on the Playbook Kit with ${b.endings} endings, ${b.encounters} encounters and ${b.followers} followers.`,
            pitch: blueprintPitch(b, f),
            liveUrl:
              b.placement === 'play' ? `/play/${b.slug}` : `/admin/${b.slug}`,
            status: 'ACTIVE',
            priority: 'HIGH',
          }),
        },
      )
      if (!res.success || !res.data) {
        status.value = res.message || 'The project could not be created.'
        return
      }
      result.value = { kind: 'project', id: res.data.id, title: res.data.title }
      status.value = `${b.title} is a Kind Robots project. Its scaffold Todo is waiting for the next Conductor agent.`
    } finally {
      busy.value = false
    }
  }

  /** Sends a revised plan for an existing playbook to the agents as a high-priority Todo. */
  async function sendPlan() {
    const entry = existing.value
    const b = draft.value
    const f = current.value
    if (!entry || !b || !f || busy.value) return
    busy.value = true
    status.value = 'Sending…'
    try {
      const res = await performFetch<{ id: number; title: string }>(
        '/api/todos',
        {
          method: 'POST',
          body: JSON.stringify({
            title: `Revise ${entry.title} plan (${entry.slug}) from the Playbook Forge`,
            description: blueprintBrief(b, f, planDiff(entry.plan, b)),
            priority: 'HIGH',
            category: 'AGENT',
          }),
        },
      )
      if (!res.success || !res.data) {
        status.value = res.message || 'The plan could not be sent.'
        return
      }
      result.value = { kind: 'todo', id: res.data.id, title: res.data.title }
      status.value = 'Sent. Agents take Todos before any roadmap work.'
    } finally {
      busy.value = false
    }
  }

  return {
    screen,
    tab,
    focus,
    draft,
    draftList,
    assumptions,
    existing,
    built,
    builtPlan,
    builtForecast,
    loadingBuilt,
    rows,
    focusedRow,
    current,
    preview,
    status,
    busy,
    result,
    persistWarning,
    load,
    go,
    back,
    startIdea,
    forge,
    openDraft,
    deleteDraft,
    analyze,
    ledger,
    planEdits,
    planFor,
    ledgerPanel,
    posting,
    adjustStatus,
    setOverride,
    stepOverride,
    addElement,
    removeElement,
    setAdjustNote,
    clearOverrides,
    pendingAdjustment,
    postAdjustment,
    facets,
    facetsState,
    facetsError,
    genreFacets,
    ideaSparks,
    ideaGenre,
    loadFacets,
    chooseGenreFacet,
    dealIdeaSparks,
    toggleSparkLock,
    dropSpark,
    drawElement,
    gestation,
    gestationLoading,
    gestationError,
    gestationId,
    gestationStatus,
    gestationFocused,
    loadGestation,
    openGestation,
    postGestationNote,
    forgePitch,
    designs,
    designCards,
    designJobs,
    pendingDesigns,
    saveDesign,
    removeDesign,
    renderDesign,
    refreshDesignJobs,
    catalogTab,
    catalog,
    catalogLoading,
    catalogError,
    catalogSearch,
    catalogFocus,
    tray,
    loadCatalog,
    openCatalog,
    setCatalogTab,
    inTray,
    toggleTray,
    clearTray,
    trayToIdea,
    trayToGame,
    libraryStats,
    libraryLoading,
    librarySort,
    libraryGames,
    loadLibraryStats,
    setLibrarySort,
    ledgerBook,
    ledgerRelay,
    ledgerLoading,
    ledgerSection,
    ledgerFocused,
    galleryTarget,
    galleryFocus,
    galleryFilter,
    galleryGroup,
    galleryBook,
    galleryTiles,
    galleryTile,
    galleryEntries,
    galleryShown,
    galleryFocused,
    gallerySection,
    openGallery,
    showTarget,
    focusEntry,
    galleryRenders,
    galleryNote,
    postGalleryDirection,
    renderEntry,
    askPrompt,
    ledgerLane,
    ledgerConfirm,
    openLedger,
    openBeats,
    openKit,
    kitId,
    beatSection,
    beatSearch,
    beatView,
    focusSection,
    cycleLane,
    askSubmit,
    confirmSubmit,
    setTab,
    cycleTab,
    moveFocus,
    step,
    setText,
    setAssumption,
    resetAssumptions,
    resetPlan,
    launch,
    sendPlan,
  }
})
