import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAchievementStore } from './achievementStore'
import {
  advance as advanceRun,
  descend as descendRun,
  choose as chooseInRun,
  currentCard,
  newRun,
  outcomeById,
  upgradeRun,
  useInstant as useInstantInRun,
  type ChooseOptions,
  type RunState,
  endingFor,
} from '~/utils/shiftingDesks/rules'
import { dailySeed } from '~/utils/shiftingDesks/daily'

const SAVE_KEY = 'shifting-desks-run-v1'
const ENVELOPE_KEY = 'shifting-desks-envelope-opened-v1'
const OUTCOMES_KEY = 'shifting-desks-outcomes-v1'
// Every ending this browser has reached: the front desk's collectible gallery.
const ENDINGS_KEY = 'shifting-desks-endings-v1'

export const useShiftingDesksStore = defineStore('shiftingDesks', () => {
  const run = ref<RunState | null>(null)
  const discovered = ref<string[]>([])
  const endingsFound = ref<string[]>([])
  const loaded = ref(false)
  const rollSerial = ref(0)
  const envelopeOpened = ref(false)

  const card = computed(() => (run.value ? currentCard(run.value) : null))
  const outcome = computed(() =>
    outcomeById(run.value?.departmentOutcome ?? null),
  )
  const finished = computed(
    () =>
      !!run.value &&
      (run.value.status === 'complete' || run.value.status === 'eliminated') &&
      !run.value.pending,
  )
  const transition = computed(
    () =>
      !!run.value &&
      run.value.status === 'department-complete' &&
      !run.value.pending,
  )

  function persist(): void {
    try {
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      localStorage.setItem(OUTCOMES_KEY, JSON.stringify(discovered.value))
      localStorage.setItem(ENDINGS_KEY, JSON.stringify(endingsFound.value))
    } catch {
      return
    }
  }

  function load(): void {
    if (loaded.value) return
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : null
      run.value = upgradeRun(parsed)
      envelopeOpened.value =
        localStorage.getItem(ENVELOPE_KEY) === run.value?.seed
      const seen: unknown = JSON.parse(
        localStorage.getItem(OUTCOMES_KEY) ?? '[]',
      )
      discovered.value = Array.isArray(seen)
        ? seen.filter((s): s is string => typeof s === 'string')
        : []
      const endings: unknown = JSON.parse(
        localStorage.getItem(ENDINGS_KEY) ?? '[]',
      )
      endingsFound.value = Array.isArray(endings)
        ? endings.filter((s): s is string => typeof s === 'string')
        : []
      if (recordEnding()) persist()
    } catch {
      run.value = null
      discovered.value = []
    }
    loaded.value = true
  }

  // `daily` deals today's Daily Memo seed, the same run for everyone.
  function start(jobId: string, options: { daily?: boolean } = {}): void {
    const seed = options.daily
      ? dailySeed()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    run.value = newRun(seed, jobId)
    envelopeOpened.value = false
    persist()
  }

  function choose(choiceId: string, options: ChooseOptions = {}): void {
    if (!run.value) return
    const prev = run.value
    const before = run.value.log.length
    run.value = chooseInRun(run.value, choiceId, options)
    if (run.value.log.length === before) return
    awardShiftEnd(prev.status, run.value)
    rollSerial.value += 1
    const id = run.value.departmentOutcome
    if (id && !discovered.value.includes(id))
      discovered.value = [...discovered.value, id]
    recordEnding()
    persist()
  }

  // True when this run reached an ending the gallery had not seen yet.
  function recordEnding(): boolean {
    if (!run.value) return false
    if (run.value.status !== 'complete' && run.value.status !== 'eliminated')
      return false
    const ending = endingFor(run.value)
    if (!ending || endingsFound.value.includes(ending.id)) return false
    endingsFound.value = [...endingsFound.value, ending.id]
    return true
  }

  function useInstant(which: 'favor' | 'mutation'): void {
    if (!run.value) return
    run.value = useInstantInRun(run.value, which)
    persist()
  }

  function openEnvelope(): void {
    envelopeOpened.value = true
    try {
      if (run.value) localStorage.setItem(ENVELOPE_KEY, run.value.seed)
    } catch {
      return
    }
  }

  function awardShiftEnd(previous: RunState['status'], after: RunState): void {
    if (previous !== 'playing' || after.status === 'playing') return
    const achievements = useAchievementStore()
    if (after.department === 'orientation' && after.status !== 'eliminated')
      void achievements.rewardAchievementByCode(
        'shifting-desks-survived-review',
      )
    if (after.status === 'complete')
      void achievements.rewardAchievementByCode(
        'shifting-desks-faced-the-board',
      )
  }

  function descend(): void {
    if (!run.value) return
    const previous = run.value.department
    run.value = descendRun(run.value)
    persist()
    if (
      previous !== 'sub-level-zero' &&
      run.value.department === 'sub-level-zero'
    )
      void useAchievementStore().rewardAchievementByCode(
        'shifting-desks-sub-level-zero',
      )
  }

  function advance(): void {
    if (!run.value) return
    run.value = advanceRun(run.value)
    persist()
  }

  function quit(): void {
    run.value = null
    persist()
  }

  return {
    run,
    envelopeOpened,
    useInstant,
    openEnvelope,
    discovered,
    endingsFound,
    loaded,
    rollSerial,
    card,
    outcome,
    finished,
    transition,
    descend,
    load,
    start,
    choose,
    advance,
    quit,
  }
})
