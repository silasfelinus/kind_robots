import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  assignTeam,
  chooseEncounter,
  finishAcademy,
  incidentsFor,
  nextSchoolDay,
  resolveDispatch,
  restoreAcademy,
  startAcademy,
  type AcademyRun,
  type PowerId,
  type StudentId,
} from '~/utils/cometAcademy/rules'

const SAVE_KEY = 'comet-city-academy-slice-v1'

export const useCometAcademyStore = defineStore('cometAcademy', () => {
  const run = ref<AcademyRun | null>(null)
  const loaded = ref(false)
  const storageWarning = ref('')

  const incidents = computed(() => (run.value ? incidentsFor(run.value) : []))

  function persist() {
    try {
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      storageWarning.value = ''
    } catch {
      storageWarning.value = 'This browser cannot save your term. Keep the page open to continue.'
    }
  }

  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      run.value = restoreAcademy(raw ? JSON.parse(raw) : null)
    } catch {
      run.value = null
      storageWarning.value = 'Your previous save could not be loaded. You can begin a new term.'
    }
  }

  function begin(power: PowerId) {
    run.value = startAcademy(power)
    persist()
  }

  function assign(caseId: string, students: StudentId[]) {
    if (!run.value) return
    run.value = assignTeam(run.value, caseId, students)
    persist()
  }

  function dispatch() {
    if (!run.value) return
    run.value = resolveDispatch(run.value)
    persist()
  }

  function choose(optionId: string) {
    if (!run.value) return
    run.value = chooseEncounter(run.value, optionId)
    persist()
  }

  function next() {
    if (!run.value) return
    run.value = nextSchoolDay(run.value)
    persist()
  }

  function end(choice: 'protect' | 'command') {
    if (!run.value) return
    run.value = finishAcademy(run.value, choice)
    persist()
  }

  function restart() {
    run.value = null
    persist()
  }

  return { loaded, run, incidents, storageWarning, load, begin, assign, dispatch, choose, next, end, restart }
})
