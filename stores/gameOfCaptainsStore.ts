import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import {
  chooseRomance as applyRomanceChoice,
  relationshipEpilogue,
  type RomanceChoiceId,
} from '~/utils/gameOfCaptains/romance'
import {
  chooseTrioStep,
  restoreTrioAdventure,
  trioEpilogue,
  type TrioEndingIndex,
} from '~/utils/gameOfCaptains/trioAdventures'
import { playbookRunKey } from '~/utils/playbook/runReview'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  assignAwayTeam,
  configurePocketRoom,
  rechargeCouchShield,
  advanceVoyageDay,
  decidePolicy,
  finishVoyage,
  launchMission,
  nextDestination,
  chooseMission,
  beginCrewDetour,
  stageCrewDetour,
  resolveCrewDetour,
  restoreVoyage,
  startVoyage,
  type CaptainId,
  type CrewId,
  type DetourApproach,
  type FinaleStrategy,
  type PolicyId,
  type PocketRoom,
  type VoyageRun,
} from '~/utils/gameOfCaptains/rules'

const SAVE_KEY = 'game-of-captains-voyage-v1'

export const useGameOfCaptainsStore = defineStore('gameOfCaptains', () => {
  const run = ref<VoyageRun | null>(null)
  const loaded = ref(false)
  const storageWarning = ref('')
  const saved = computed(() => !!run.value)

  function persist() {
    try {
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'Local saves are blocked by your browser. Keep this tab open to finish your voyage.'
    }
  }
  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      run.value = restoreTrioAdventure(
        restoreVoyage(raw ? JSON.parse(raw) : null),
      )
    } catch {
      run.value = null
      storageWarning.value =
        'Previous voyage could not be loaded. You can begin a new one.'
    }
  }
  function begin(captain: CaptainId, crew: CrewId[]) {
    run.value = startVoyage(captain, crew)
    usePlaybookRunReviewStore().begin(
      'game-of-captains',
      playbookRunKey(run.value),
    )
    persist()
  }
  function assign(crew: CrewId[]) {
    if (!run.value) return
    run.value = assignAwayTeam(run.value, crew)
    persist()
  }
  function chartMission(missionId: string) {
    if (!run.value) return
    run.value = chooseMission(run.value, missionId)
    persist()
  }
  function chooseRoom(room: PocketRoom | null) {
    if (!run.value) return
    run.value = configurePocketRoom(run.value, room)
    persist()
  }
  function rechargeShield() {
    if (!run.value) return
    run.value = rechargeCouchShield(run.value)
    persist()
  }
  function launch() {
    if (!run.value) return
    run.value = launchMission(run.value)
    persist()
  }
  function advanceDay() {
    if (!run.value) return
    run.value = advanceVoyageDay(run.value)
    persist()
  }
  function decide(policy: PolicyId) {
    if (!run.value) return
    run.value = decidePolicy(run.value, policy)
    persist()
  }
  function next() {
    if (!run.value) return
    run.value = nextDestination(run.value)
    persist()
  }
  function chooseRomance(choice: RomanceChoiceId) {
    if (!run.value) return
    run.value = applyRomanceChoice(run.value, choice)
    persist()
  }
  function chooseTrio(option: TrioEndingIndex) {
    if (!run.value) return
    run.value = chooseTrioStep(run.value, option)
    persist()
  }
  function detour(crewId: CrewId) {
    if (!run.value) return
    run.value = beginCrewDetour(run.value, crewId)
    persist()
  }
  function planDetour(approach: DetourApproach) {
    if (!run.value) return
    run.value = stageCrewDetour(run.value, approach)
    persist()
  }
  function resolveDetour(approach: DetourApproach) {
    if (!run.value) return
    run.value = resolveCrewDetour(run.value, approach)
    persist()
  }
  function finish(strategy: FinaleStrategy) {
    if (!run.value) return
    run.value = trioEpilogue(
      relationshipEpilogue(finishVoyage(run.value, strategy)),
    )
    persist()
  }
  function restart() {
    run.value = null
    persist()
  }
  return {
    run,
    loaded,
    saved,
    storageWarning,
    load,
    begin,
    assign,
    chooseRoom,
    chartMission,
    rechargeShield,
    launch,
    advanceDay,
    decide,
    next,
    chooseRomance,
    chooseTrio,
    detour,
    planDetour,
    resolveDetour,
    finish,
    restart,
  }
})
