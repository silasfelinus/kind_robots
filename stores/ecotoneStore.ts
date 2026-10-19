import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  COMPANIONS,
  ENCOUNTERS,
  ENDING_IDS,
  type CompanionId,
  type LensId,
} from '~/utils/ecotone/content'
import {
  advance,
  chooseCrossroads,
  chooseEncounter,
  chooseIntro,
  chooseLens,
  createRun,
  crossroadsNewcomer,
  currentChapter,
  restoreRun,
  type RunState,
} from '~/utils/ecotone/engine'

const RUN_KEY = 'kr.ecotone.run.v1'
const ENDINGS_KEY = 'kr.ecotone.endings.v1'

export const useEcotoneStore = defineStore('ecotone', () => {
  const run = ref<RunState | null>(null)
  const endings = ref<string[]>([])
  const loaded = ref(false)

  const chapter = computed(() => (run.value ? currentChapter(run.value) : 1))
  const card = computed(() =>
    run.value && run.value.phase === 'encounter'
      ? (ENCOUNTERS.find(
          (c) => c.id === run.value?.deck[run.value.encounterIndex],
        ) ?? null)
      : null,
  )
  const lead = computed(
    () => COMPANIONS.find((c) => c.id === run.value?.activeLead) ?? null,
  )
  const introCompanion = computed(
    () => COMPANIONS.find((c) => c.id === run.value?.introCompanion) ?? null,
  )
  const newcomer = computed(() => {
    const id = run.value ? crossroadsNewcomer(run.value) : null
    return COMPANIONS.find((c) => c.id === id) ?? null
  })
  const unlockedCount = computed(
    () => endings.value.filter((id) => ENDING_IDS.includes(id)).length,
  )

  function persist() {
    if (!import.meta.client) return
    try {
      if (run.value)
        window.localStorage.setItem(RUN_KEY, JSON.stringify(run.value))
      else window.localStorage.removeItem(RUN_KEY)
    } catch {
      /* private browsing keeps the run in memory only */
    }
  }

  function initialize() {
    if (loaded.value) return
    if (import.meta.client) {
      try {
        const saved = window.localStorage.getItem(RUN_KEY)
        if (saved) run.value = restoreRun(JSON.parse(saved))
        const ledger = window.localStorage.getItem(ENDINGS_KEY)
        if (ledger) {
          const parsed: unknown = JSON.parse(ledger)
          if (Array.isArray(parsed))
            endings.value = parsed.filter(
              (id): id is string =>
                typeof id === 'string' && ENDING_IDS.includes(id),
            )
        }
      } catch {
        run.value = null
      }
    }
    loaded.value = true
  }

  function update(next: RunState) {
    if (next === run.value) return
    run.value = next
    persist()
  }

  function begin(archetypeId: string) {
    update(createRun(Date.now() % 2147483647, archetypeId))
  }

  function pickLens(lens: LensId) {
    if (run.value) update(chooseLens(run.value, lens))
  }

  function meet(accept: boolean) {
    if (run.value) update(chooseIntro(run.value, accept))
  }

  function choose(choiceId: string) {
    if (run.value) update(chooseEncounter(run.value, choiceId))
  }

  function crossroads(follow: boolean) {
    if (run.value) update(chooseCrossroads(run.value, follow))
  }

  function proceed() {
    if (run.value) update(advance(run.value))
  }

  function abandon() {
    run.value = null
    persist()
  }

  function companionMet(id: CompanionId) {
    return Boolean(run.value?.meetingOrder.includes(id))
  }

  return {
    run,
    endings,
    loaded,
    chapter,
    card,
    lead,
    introCompanion,
    newcomer,
    unlockedCount,
    endingTotal: ENDING_IDS.length,
    initialize,
    begin,
    pickLens,
    meet,
    choose,
    crossroads,
    proceed,
    abandon,
    companionMet,
  }
})
