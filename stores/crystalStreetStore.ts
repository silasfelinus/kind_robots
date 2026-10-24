import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadPlaybookLiveText } from './utils/playbookLiveText'
import {
  CRYSTAL_STREET_LIVE_TEXT,
  VILLAINS,
  buy as buyInRun,
  choose as chooseInRun,
  currentEncounter,
  dismiss as dismissInRun,
  doActivity,
  endingKey,
  isRunState,
  newRun,
  nightfall as nightfallInRun,
  pendingOutcome,
  reroll as rerollInRun,
  resolve as resolveInRun,
  useItem as useItemInRun,
  villainOf,
  type DayActivity,
  type LogEntry,
  type NewRunOptions,
  type RunState,
} from '~/utils/crystalStreet/rules'
import type { EndingTier } from '~/utils/crystalStreet/types'
import type { CompanionId, ItemId, LocationId } from '~/utils/crystalStreet/ids'

const RUN_KEY = 'crystal-street-run-v1'
const SCRAPBOOK_KEY = 'crystal-street-scrapbook-v1'
const SETTINGS_KEY = 'crystal-street-settings-v1'
const SCRAPBOOK_LIMIT = 80

export type CrystalStreetSettings = {
  textSize: 'small' | 'medium' | 'large'
  contrast: 'normal' | 'high'
  motion: 'full' | 'reduced'
}

export const DEFAULT_SETTINGS: CrystalStreetSettings = {
  textSize: 'medium',
  contrast: 'normal',
  motion: 'full',
}

function restoreSettings(raw: unknown): CrystalStreetSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >
  const pick = <T extends string>(key: string, options: readonly T[], d: T) =>
    options.includes(value[key] as T) ? (value[key] as T) : d
  return {
    textSize: pick(
      'textSize',
      ['small', 'medium', 'large'],
      DEFAULT_SETTINGS.textSize,
    ),
    contrast: pick('contrast', ['normal', 'high'], DEFAULT_SETTINGS.contrast),
    motion: pick('motion', ['full', 'reduced'], DEFAULT_SETTINGS.motion),
  }
}

export type ScrapbookRun = {
  seed: string
  villain: string
  tier: EndingTier
  name: string
  avatar?: string
  archetype: string
  crew: string[]
  clues: number
  wins: number
  day: number
  endedAt: number
  highlights: LogEntry[]
}

export type Scrapbook = { runs: ScrapbookRun[]; endings: string[] }

function emptyScrapbook(): Scrapbook {
  return { runs: [], endings: [] }
}

function restoreScrapbook(raw: unknown): Scrapbook {
  if (!raw || typeof raw !== 'object') return emptyScrapbook()
  const value = raw as Partial<Scrapbook>
  return {
    runs: Array.isArray(value.runs)
      ? value.runs.filter(
          (r): r is ScrapbookRun =>
            !!r && typeof r.seed === 'string' && typeof r.villain === 'string',
        )
      : [],
    endings: Array.isArray(value.endings)
      ? value.endings.filter((e): e is string => typeof e === 'string')
      : [],
  }
}

export function highlightsOf(run: RunState): LogEntry[] {
  const wins = run.log.filter((l) => l.success)
  const picks = [...wins.slice(-3), run.log[run.log.length - 1]]
  return [...new Set(picks.filter((l): l is LogEntry => !!l))].slice(-4)
}

export const useCrystalStreetStore = defineStore('crystalStreet', () => {
  const run = ref<RunState | null>(null)
  const scrapbook = ref<Scrapbook>(emptyScrapbook())
  const settings = ref<CrystalStreetSettings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)
  const storageWarning = ref('')

  const encounter = computed(() =>
    run.value ? currentEncounter(run.value) : null,
  )
  const outcome = computed(() => (run.value ? pendingOutcome(run.value) : null))
  const villain = computed(() => (run.value ? villainOf(run.value) : null))
  const bestFound = computed(
    () =>
      VILLAINS.filter((v) =>
        scrapbook.value.endings.includes(endingKey(v.id, 'best')),
      ).length,
  )
  const metVillains = computed(
    () => new Set(scrapbook.value.runs.map((r) => r.villain)),
  )

  function persist(): void {
    try {
      if (run.value) localStorage.setItem(RUN_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(RUN_KEY)
      localStorage.setItem(SCRAPBOOK_KEY, JSON.stringify(scrapbook.value))
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'This browser is not saving: your week and scrapbook will be lost on reload.'
    }
  }

  function load(): void {
    if (loaded.value) return
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(RUN_KEY) ?? 'null')
      run.value = isRunState(saved) ? saved : null
      scrapbook.value = restoreScrapbook(
        JSON.parse(localStorage.getItem(SCRAPBOOK_KEY) ?? 'null'),
      )
      settings.value = restoreSettings(
        JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'),
      )
    } catch {
      run.value = null
      scrapbook.value = emptyScrapbook()
      settings.value = { ...DEFAULT_SETTINGS }
    }
    loaded.value = true
    void loadPlaybookLiveText('crystal-street', CRYSTAL_STREET_LIVE_TEXT).then(
      (changed) => {
        if (changed && run.value) run.value = { ...run.value }
      },
    )
  }

  function record(next: RunState): void {
    if (!next.ending) return
    if (scrapbook.value.runs.some((r) => r.seed === next.seed)) return
    const key = endingKey(next.villain, next.ending.tier)
    scrapbook.value = {
      runs: [
        {
          seed: next.seed,
          villain: next.villain,
          tier: next.ending.tier,
          name: next.name,
          ...(next.avatar ? { avatar: next.avatar } : {}),
          archetype: next.archetype,
          crew: [...next.crew],
          clues: next.clues.length,
          wins: next.wins,
          day: next.day,
          endedAt: next.ending.at,
          highlights: highlightsOf(next),
        },
        ...scrapbook.value.runs,
      ].slice(0, SCRAPBOOK_LIMIT),
      endings: scrapbook.value.endings.includes(key)
        ? scrapbook.value.endings
        : [...scrapbook.value.endings, key],
    }
  }

  function commit(next: RunState): void {
    if (next === run.value) return
    run.value = next
    record(next)
    persist()
  }

  function start(
    options: Omit<NewRunOptions, 'seed'> & { seed?: string },
  ): void {
    const seed =
      options.seed ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    commit(newRun({ ...options, seed }))
  }

  function abandon(): void {
    run.value = null
    persist()
  }

  function setSetting<K extends keyof CrystalStreetSettings>(
    key: K,
    value: CrystalStreetSettings[K],
  ): void {
    settings.value = { ...settings.value, [key]: value }
    persist()
  }

  function resetScrapbook(): void {
    scrapbook.value = emptyScrapbook()
    persist()
  }

  function act<T extends unknown[]>(
    fn: (state: RunState, ...args: T) => RunState,
    ...args: T
  ): void {
    if (run.value) commit(fn(run.value, ...args))
  }

  return {
    run,
    scrapbook,
    settings,
    loaded,
    storageWarning,
    encounter,
    outcome,
    villain,
    bestFound,
    metVillains,
    load,
    start,
    abandon,
    setSetting,
    resetScrapbook,
    choose: (choiceId: string) => act(chooseInRun, choiceId),
    reroll: () => act(rerollInRun),
    resolve: () => act(resolveInRun),
    activity: (location: LocationId, activity: DayActivity) =>
      act(doActivity, location, activity),
    nightfall: () => act(nightfallInRun),
    buy: (item: ItemId) => act(buyInRun, item),
    useItem: (item: ItemId) => act(useItemInRun, item),
    dismiss: (id: CompanionId) => act(dismissInRun, id),
  }
})
