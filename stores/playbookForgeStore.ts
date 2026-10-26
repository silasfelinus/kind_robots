import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
import { usePlaybookStore } from '~/stores/playbookStore'
import { isPlaybookGame } from '~/utils/playbook/games'
import { KIT_PLAYBOOKS, kitPlaybook } from '~/utils/playbookKit/games'
import {
  DEFAULT_ASSUMPTIONS,
  type Assumptions,
} from '~/utils/playbookForge/calibration'
import { forecast } from '~/utils/playbookForge/estimate'
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
import type { Playbook } from '~/utils/playbook/types'
import {
  buildLedger,
  nodeArtPrompt,
  nodeShape,
  planGaps,
  unitsToPaint,
  unitsToWrite,
  writingBrief,
  type LedgerJob,
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
  | 'beats'
  | 'kit'
  | 'launch'
  | 'assumptions'

/** Most pictures one Submit sends to the relay, so a slip never floods the queue. */
export const SUBMIT_CAP = 60

export type LedgerRelay = {
  studio: string | null
  project: string
  edits: number
  byNode: Record<string, LedgerJob[]>
  jobs: ProjectJobs
  truncated: boolean
}

export type LedgerSubmit = {
  kind: 'art' | 'text'
  section: string
  count: number
  seconds: number
  words: number
}

const DRAFTS_KEY = 'kr-playbook-forge-drafts-v1'
const ASSUMPTIONS_KEY = 'kr-playbook-forge-assumptions-v1'

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

  const ledgerBook = ref<Playbook | null>(null)
  const ledgerRelay = ref<LedgerRelay | null>(null)
  const ledgerLoading = ref(false)
  const ledgerSection = ref(0)
  const ledgerLane = ref('')
  const ledgerConfirm = ref<LedgerSubmit | null>(null)

  const ledger = computed(() => {
    const entry = existing.value
    if (!entry) return null
    const gaps = built.value ? planGaps(entry.plan, built.value) : []
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
      ledgerBook.value ?? { order: [], nodes: {} },
      ledgerRelay.value?.byNode ?? {},
      {
        laneKey: ledgerLane.value,
        assumptions: assumptions.value,
        gaps,
        notes,
      },
    )
  })
  const ledgerFocused = computed(
    () => ledger.value?.sections[ledgerSection.value] ?? null,
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
    if (next === 'assumptions' || next === 'launch')
      returnTo.value = screen.value
    screen.value = next
    status.value = ''
    result.value = null
  }

  /** The B button: one step back toward the title screen. */
  function back() {
    const from = screen.value
    if (from === 'launch' || from === 'assumptions')
      screen.value = returnTo.value
    else if (from === 'loadout')
      screen.value = existing.value ? 'library' : 'idea'
    else if (from === 'ledger' && ledgerConfirm.value) {
      ledgerConfirm.value = null
      return
    } else if (from === 'ledger') screen.value = 'library'
    else if (from === 'beats')
      screen.value =
        ledgerBook.value || ledgerRelay.value ? 'ledger' : 'library'
    else if (from === 'kit')
      screen.value = existing.value ? 'ledger' : 'library'
    else if (from === 'analyze')
      screen.value = ledgerBook.value || ledgerRelay.value ? 'ledger' : 'title'
    else if (from === 'idea' || from === 'library') screen.value = 'title'
    status.value = ''
    result.value = null
  }

  function startIdea() {
    existing.value = null
    built.value = null
    draft.value = null
    go('idea')
  }

  function forge(title: string, idea: string, genre: string) {
    draft.value = blueprintFromIdea(
      title.trim() || 'Untitled playbook',
      idea.trim(),
      genre,
    )
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
    draft.value = structuredClone(entry.plan)
    built.value = null
    tab.value = 'story'
    focus.value = 0
    go('analyze')
    loadingBuilt.value = true
    try {
      built.value = await entry.count()
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
      draft.value = structuredClone(entry.plan)
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
    draft.value = structuredClone(entry.plan)
    built.value = null
    ledgerBook.value = null
    ledgerRelay.value = null
    ledgerSection.value = 0
    ledgerConfirm.value = null
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
            ? buildPlaybook(entry.studio)
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
    const section = ledgerFocused.value
    if (!section) return
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
    ledgerConfirm.value = {
      kind,
      section: section.id,
      count,
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
    const section = ledgerFocused.value
    const lane = PLAYBOOK_ART_LANES.find((l) => l.key === ledgerLane.value)
    if (!book || !section || !lane || busy.value) return
    const units = unitsToPaint(section).slice(0, SUBMIT_CAP)
    busy.value = true
    let sent = 0
    let refused = ''
    try {
      for (const unit of units) {
        const node = book.nodes[unit.key]
        if (!node) continue
        status.value = `Submitting ${section.label} to the relay: ${sent + 1} of ${units.length}…`
        const prompt = nodeArtPrompt(node)
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
      status.value = refused
        ? `Sent ${sent} of ${units.length}, then the relay refused: ${refused}`
        : `Sent ${sent} picture${sent === 1 ? '' : 's'} on ${lane.label}. kr-relay picks them up from the queue.`
    } finally {
      busy.value = false
    }
  }

  /** Sends a section's missing words to the next agent as a high-priority Todo. */
  async function submitSectionText() {
    const entry = existing.value
    const book = ledgerBook.value
    const section = ledgerFocused.value
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
    if (existing.value) draft.value = structuredClone(existing.value.plan)
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
    ledgerBook,
    ledgerRelay,
    ledgerLoading,
    ledgerSection,
    ledgerFocused,
    ledgerLane,
    ledgerConfirm,
    openLedger,
    openBeats,
    openKit,
    kitId,
    beatSection,
    beatSearch,
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
