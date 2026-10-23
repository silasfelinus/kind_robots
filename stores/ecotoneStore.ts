import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  COMPANIONS,
  ENDING_IDS,
  type CompanionId,
  type EventId,
} from '~/utils/ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  originPerkAvailable,
  chooseSubstanceMoment,
  computeEnding,
  createRun,
  crossroadsNewcomer,
  currentChapter,
  findCard,
  restoreRun,
  setLiveEdits,
  travelParty,
  type CrossroadsChoice,
  type RunState,
} from '~/utils/ecotone/engine'
import type { CardEdit } from '~/utils/playbook/edits'
import type { SubstanceId } from '~/utils/ecotone/substanceArc'
import { performFetch } from '~/stores/utils'

const RUN_KEY = 'kr.ecotone.run.v1'
const ENDINGS_KEY = 'kr.ecotone.endings.v1'

export const useEcotoneStore = defineStore('ecotone', () => {
  const run = ref<RunState | null>(null)
  const endings = ref<string[]>([])
  const loaded = ref(false)
  // Bumped when Playbook Manager live edits arrive, so card text re-reads them.
  const liveVersion = ref(0)

  const chapter = computed(() => (run.value ? currentChapter(run.value) : 1))
  const card = computed(() => {
    void liveVersion.value
    return run.value && run.value.phase === 'beat'
      ? findCard(run.value.card)
      : null
  })
  const offered = computed(() => {
    void liveVersion.value
    return run.value && run.value.phase === 'fork'
      ? run.value.offered.flatMap((id) => findCard(id) ?? [])
      : []
  })
  const lead = computed(
    () => COMPANIONS.find((c) => c.id === run.value?.activeLead) ?? null,
  )
  const party = computed(() =>
    run.value
      ? travelParty(run.value).flatMap(
          (id) => COMPANIONS.find((companion) => companion.id === id) ?? [],
        )
      : [],
  )
  const prospect = computed(
    () => COMPANIONS.find((c) => c.id === run.value?.prospect) ?? null,
  )
  const newcomer = computed(() => {
    const id = run.value ? crossroadsNewcomer(run.value) : null
    return COMPANIONS.find((c) => c.id === id) ?? null
  })
  const ending = computed(() =>
    run.value?.phase === 'end' ? computeEnding(run.value) : null,
  )
  const unlockedCount = computed(
    () => endings.value.filter((id) => ENDING_IDS.includes(id)).length,
  )

  function persist() {
    if (!import.meta.client) return
    try {
      if (run.value)
        window.localStorage.setItem(RUN_KEY, JSON.stringify(run.value))
      else window.localStorage.removeItem(RUN_KEY)
      window.localStorage.setItem(ENDINGS_KEY, JSON.stringify(endings.value))
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
    void loadLiveEdits()
  }

  async function loadLiveEdits() {
    if (!import.meta.client) return
    const response = await performFetch<Record<string, CardEdit>>(
      '/api/playbook/ecotone/live',
    )
    if (!response.success || !response.data) return
    setLiveEdits(response.data)
    liveVersion.value += 1
  }

  function update(next: RunState) {
    if (next === run.value) return
    run.value = next
    if (
      next.phase === 'end' &&
      next.ending &&
      ENDING_IDS.includes(next.ending) &&
      !endings.value.includes(next.ending)
    )
      endings.value = [...endings.value, next.ending]
    persist()
  }

  function begin(archetypeId: string) {
    update(createRun(Date.now() % 2147483647, archetypeId))
  }

  function pickEvent(event: EventId) {
    if (run.value) update(chooseEvent(run.value, event))
  }

  function pickFork(cardId: string) {
    if (run.value) update(chooseFork(run.value, cardId))
  }

  function choose(choiceId: string, spendOriginPerk = false) {
    if (run.value)
      update(chooseBeat(run.value, choiceId, spendOriginPerk && originPerkAvailable(run.value, choiceId)))
  }

  function takeMoment(selected: SubstanceId[]) {
    if (run.value) update(chooseSubstanceMoment(run.value, selected))
  }

  function crossroads(choice: boolean | CrossroadsChoice) {
    if (run.value) update(chooseCrossroads(run.value, choice))
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
    offered,
    lead,
    party,
    prospect,
    newcomer,
    ending,
    unlockedCount,
    endingTotal: ENDING_IDS.length,
    initialize,
    begin,
    pickEvent,
    pickFork,
    choose,
    takeMoment,
    crossroads,
    proceed,
    abandon,
    companionMet,
  }
})
