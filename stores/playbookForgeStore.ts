import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
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

// Playbook Forge (conductor playbook-kit t-012). Drafts and assumptions live in
// this browser; launching a playbook or sending a revised plan writes a Kind
// Robots Project or an agent Todo, which is how Conductor hears about it.

export type ForgeScreen =
  | 'title'
  | 'library'
  | 'idea'
  | 'loadout'
  | 'analyze'
  | 'launch'
  | 'assumptions'

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
    else if (from === 'analyze' || from === 'idea' || from === 'library')
      screen.value = 'title'
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
