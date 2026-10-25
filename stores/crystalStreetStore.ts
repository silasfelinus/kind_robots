import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadPlaybookLiveText } from './utils/playbookLiveText'
import {
  CRYSTAL_STREET_LIVE_TEXT,
  VILLAINS,
  awaitingDraw,
  drawFrom as drawFromInRun,
  buy as buyInRun,
  choose as chooseInRun,
  currentEncounter,
  dismiss as dismissInRun,
  doActivity,
  endingKey,
  repairRun,
  specialKey,
  newRun,
  nightfall as nightfallInRun,
  pendingOutcome,
  reroll as rerollInRun,
  resolve as resolveInRun,
  useItem as useItemInRun,
  villainOf,
  type DayActivity,
  type DeckChoice,
  type LogEntry,
  type NewRunOptions,
  type RunState,
} from '~/utils/crystalStreet/rules'
import { TIP_IDS, tipFor } from '~/utils/crystalStreet/tips'
import type { EndingTier, SpecialEnding } from '~/utils/crystalStreet/types'
import type { CompanionId, ItemId, LocationId } from '~/utils/crystalStreet/ids'

const RUN_KEY = 'crystal-street-run-v1'
const SCRAPBOOK_KEY = 'crystal-street-scrapbook-v1'
const SETTINGS_KEY = 'crystal-street-settings-v1'
const TIPS_KEY = 'crystal-street-tips-v1'
const SCRAPBOOK_LIMIT = 80

export type CrystalStreetSettings = {
  textSize: 'small' | 'medium' | 'large'
  contrast: 'normal' | 'high'
  motion: 'full' | 'reduced'
  /** Coach tips: during the first week only, always, or never. */
  tips: 'auto' | 'on' | 'off'
  /** Synthesised sound effects for rolls, cards, dusk and endings. */
  sound: 'on' | 'off'
}

export const DEFAULT_SETTINGS: CrystalStreetSettings = {
  textSize: 'medium',
  contrast: 'normal',
  motion: 'full',
  tips: 'auto',
  sound: 'on',
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
    tips: pick('tips', ['auto', 'on', 'off'], DEFAULT_SETTINGS.tips),
    sound: pick('sound', ['on', 'off'], DEFAULT_SETTINGS.sound),
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
  /** A faction collapse or the Final Girl's win. */
  special?: SpecialEnding
}

// friends: every companion ever recruited, so the scrapbook shows only the
// people you have actually met (Silas, 2026-10-24 PT).
export type Scrapbook = {
  runs: ScrapbookRun[]
  endings: string[]
  friends: string[]
}

function emptyScrapbook(): Scrapbook {
  return { runs: [], endings: [], friends: [] }
}

function restoreScrapbook(raw: unknown): Scrapbook {
  if (!raw || typeof raw !== 'object') return emptyScrapbook()
  const value = raw as Partial<Scrapbook>
  const runs = Array.isArray(value.runs)
    ? value.runs.filter(
        (r): r is ScrapbookRun =>
          !!r && typeof r.seed === 'string' && typeof r.villain === 'string',
      )
    : []
  const friends = Array.isArray(value.friends)
    ? value.friends.filter((f): f is string => typeof f === 'string')
    : []
  return {
    runs,
    endings: Array.isArray(value.endings)
      ? value.endings.filter((e): e is string => typeof e === 'string')
      : [],
    // Older scrapbooks predate the friends list: everyone in a pasted week's
    // crew was met.
    friends: [...new Set([...friends, ...runs.flatMap((r) => r.crew ?? [])])],
  }
}

/** Companions this week has recruited, from its recruit flags. */
export function recruitedIn(run: RunState): string[] {
  return run.flags
    .filter((f) => f.startsWith('recruit:'))
    .map((f) => f.slice('recruit:'.length))
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
  const tipsSeen = ref<string[]>([])
  // Tips run through a player's first week unless they choose otherwise.
  const tip = computed(() => {
    const mode = settings.value.tips
    if (!run.value || mode === 'off') return null
    if (mode === 'auto' && scrapbook.value.runs.length) return null
    return tipFor(run.value, tipsSeen.value)
  })

  function resetTips(): void {
    tipsSeen.value = []
    persist()
  }

  function seeTip(id: string): void {
    if (tipsSeen.value.includes(id)) return
    tipsSeen.value = [...tipsSeen.value, id]
    persist()
  }
  const loaded = ref(false)
  const storageWarning = ref('')

  const encounter = computed(() =>
    run.value ? currentEncounter(run.value) : null,
  )
  const outcome = computed(() => (run.value ? pendingOutcome(run.value) : null))
  const drawing = computed(() => !!run.value && awaitingDraw(run.value))
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
      localStorage.setItem(TIPS_KEY, JSON.stringify(tipsSeen.value))
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
      run.value = repairRun(saved)
      scrapbook.value = restoreScrapbook(
        JSON.parse(localStorage.getItem(SCRAPBOOK_KEY) ?? 'null'),
      )
      settings.value = restoreSettings(
        JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'),
      )
      const seen: unknown = JSON.parse(localStorage.getItem(TIPS_KEY) ?? '[]')
      tipsSeen.value = Array.isArray(seen)
        ? TIP_IDS.filter((id) => seen.includes(id))
        : []
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
    const special = next.ending.special
    const keys = special
      ? special === 'final-girl'
        ? [endingKey(next.villain, next.ending.tier), specialKey(special)]
        : [specialKey(special)]
      : [endingKey(next.villain, next.ending.tier)]
    scrapbook.value = {
      ...scrapbook.value,
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
          ...(special ? { special } : {}),
        },
        ...scrapbook.value.runs,
      ].slice(0, SCRAPBOOK_LIMIT),
      endings: [
        ...scrapbook.value.endings,
        ...keys.filter((k) => !scrapbook.value.endings.includes(k)),
      ],
    }
  }

  function commit(next: RunState): void {
    if (next === run.value) return
    run.value = next
    const met = recruitedIn(next).filter(
      (id) => !scrapbook.value.friends.includes(id),
    )
    if (met.length)
      scrapbook.value = {
        ...scrapbook.value,
        friends: [...scrapbook.value.friends, ...met],
      }
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

  // A click that lands just as the screen changes (the second half of a
  // double-click on Continue) would hit whatever button replaced the one
  // pressed, often the next card's first choice. Moves that change the
  // screen ignore input until it has settled (roadmap #4143, UI torture).
  const SETTLE_MS = 350
  let changedAt = 0
  function move<T extends unknown[]>(
    fn: (state: RunState, ...args: T) => RunState,
    ...args: T
  ): void {
    if (!run.value || Date.now() - changedAt < SETTLE_MS) return
    const before = run.value
    act(fn, ...args)
    if (run.value !== before) changedAt = Date.now()
  }

  return {
    run,
    scrapbook,
    settings,
    loaded,
    storageWarning,
    encounter,
    outcome,
    drawing,
    villain,
    bestFound,
    metVillains,
    load,
    start,
    abandon,
    setSetting,
    resetScrapbook,
    tip,
    tipsSeen,
    seeTip,
    resetTips,
    choose: (choiceId: string) => move(chooseInRun, choiceId),
    reroll: () => move(rerollInRun),
    resolve: () => move(resolveInRun),
    activity: (location: LocationId, activity: DayActivity) =>
      move(doActivity, location, activity),
    nightfall: () => move(nightfallInRun),
    drawFrom: (deck: DeckChoice) => move(drawFromInRun, deck),
    buy: (item: ItemId) => act(buyInRun, item),
    useItem: (item: ItemId) => act(useItemInRun, item),
    dismiss: (id: CompanionId) => act(dismissInRun, id),
  }
})
