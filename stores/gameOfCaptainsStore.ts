import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  assignAwayTeam, decidePolicy, finishVoyage, launchMission, nextDestination,
  restoreVoyage, startVoyage,
  type CaptainId, type CrewId, type PolicyId, type VoyageRun,
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
      storageWarning.value = 'Local saves are blocked by your browser. Keep this tab open to finish your voyage.'
    }
  }
  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      run.value = restoreVoyage(raw ? JSON.parse(raw) : null)
    } catch {
      run.value = null
      storageWarning.value = 'Previous voyage could not be loaded. You can begin a new one.'
    }
  }
  function begin(captain: CaptainId, crew: CrewId[]) {
    run.value = startVoyage(captain, crew)
    persist()
  }
  function assign(crew: CrewId[]) {
    if (!run.value) return
    run.value = assignAwayTeam(run.value, crew)
    persist()
  }
  function launch() {
    if (!run.value) return
    run.value = launchMission(run.value)
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
  function finish(strategy: 'protect' | 'compromise') {
    if (!run.value) return
    run.value = finishVoyage(run.value, strategy)
    persist()
  }
  function restart() {
    run.value = null
    persist()
  }
  return { run, loaded, saved, storageWarning, load, begin, assign, launch, decide, next, finish, restart }
})
