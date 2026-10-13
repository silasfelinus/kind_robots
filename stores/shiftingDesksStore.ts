import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  advance as advanceRun,
  choose as chooseInRun,
  currentCard,
  isRunState,
  newRun,
  outcomeById,
  type RunState,
} from '~/utils/shiftingDesks/rules'

const SAVE_KEY = 'shifting-desks-run-v1'
const OUTCOMES_KEY = 'shifting-desks-outcomes-v1'

export const useShiftingDesksStore = defineStore('shiftingDesks', () => {
  const run = ref<RunState | null>(null)
  const discovered = ref<string[]>([])
  const loaded = ref(false)
  const rollSerial = ref(0)

  const card = computed(() => (run.value ? currentCard(run.value) : null))
  const outcome = computed(() =>
    outcomeById(run.value?.departmentOutcome ?? null),
  )
  const finished = computed(
    () => !!run.value && run.value.status !== 'playing' && !run.value.pending,
  )

  function persist(): void {
    try {
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      localStorage.setItem(OUTCOMES_KEY, JSON.stringify(discovered.value))
    } catch {
      return
    }
  }

  function load(): void {
    if (loaded.value) return
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : null
      run.value = isRunState(parsed) ? parsed : null
      const seen: unknown = JSON.parse(
        localStorage.getItem(OUTCOMES_KEY) ?? '[]',
      )
      discovered.value = Array.isArray(seen)
        ? seen.filter((s): s is string => typeof s === 'string')
        : []
    } catch {
      run.value = null
      discovered.value = []
    }
    loaded.value = true
  }

  function start(jobId: string): void {
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    run.value = newRun(seed, jobId)
    persist()
  }

  function choose(choiceId: string, spendForm = false): void {
    if (!run.value) return
    const before = run.value.log.length
    run.value = chooseInRun(run.value, choiceId, spendForm)
    if (run.value.log.length === before) return
    rollSerial.value += 1
    const id = run.value.departmentOutcome
    if (id && !discovered.value.includes(id))
      discovered.value = [...discovered.value, id]
    persist()
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
    discovered,
    loaded,
    rollSerial,
    card,
    outcome,
    finished,
    load,
    start,
    choose,
    advance,
    quit,
  }
})
