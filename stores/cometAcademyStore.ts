import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { playbookRunKey } from '~/utils/playbook/runReview'
import { computed, ref } from 'vue'
import type { PlayerForm } from '~/utils/cometAcademy/protagonistEvolution'
import type { SiteId } from '~/utils/cometAcademy/cityMap'
import type { PatrolZoneId } from '~/utils/cometAcademy/nightPatrols'
import {
  signatureById,
  type SignaturePowerId,
  type PowerVowId,
} from '~/utils/cometAcademy/specialPowers'
import { defineStore } from 'pinia'
import type { SocialActionId } from '~/utils/cometAcademy/relationships'
import {
  assignTeam,
  assignPlayerCase,
  planThirdNight,
  chooseNightPatrol,
  chooseEncounter,
  finishAcademy,
  incidentsFor,
  nextSchoolDay,
  resolveDispatch,
  restoreAcademy,
  recruitContact,
  callEmergencyVolunteer,
  socialize,
  startAcademy,
  startFullAcademy,
  studentAvailable,
  tendInfirmary,
  visitCitySite,
  type AcademyRun,
  type PowerId,
  type StudentId,
} from '~/utils/cometAcademy/rules'

const SAVE_KEY = 'comet-city-academy-slice-v1'
const YEARBOOK_KEY = 'comet-city-academy-yearbook-v1'

export type AcademyYearbookEntry = {
  plays: number
  forms: PlayerForm[]
  endings: string[]
}
export type AcademyYearbook = Record<string, AcademyYearbookEntry>

export const useCometAcademyStore = defineStore('cometAcademy', () => {
  const run = ref<AcademyRun | null>(null)
  const loaded = ref(false)
  const storageWarning = ref('')
  const yearbook = ref<AcademyYearbook>({})

  function recordIdentity(started = false) {
    const current = run.value
    if (!current?.signature) return
    const entry = yearbook.value[current.signature] ?? {
      plays: 0,
      forms: [] as PlayerForm[],
      endings: [] as string[],
    }
    if (started) entry.plays += 1
    const form = current.playerEvolution?.form
    if (form && form !== 'student' && !entry.forms.includes(form))
      entry.forms.push(form)
    if (
      current.phase === 'ending' &&
      current.ending &&
      !entry.endings.includes(current.ending)
    )
      entry.endings.push(current.ending)
    yearbook.value = { ...yearbook.value, [current.signature]: entry }
  }

  const incidents = computed(() => (run.value ? incidentsFor(run.value) : []))

  function persist() {
    try {
      recordIdentity()
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      localStorage.setItem(YEARBOOK_KEY, JSON.stringify(yearbook.value))
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'This browser cannot save your term. Keep the page open to continue.'
    }
  }

  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const history = localStorage.getItem(YEARBOOK_KEY)
      if (history) {
        const parsed: unknown = JSON.parse(history)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const [key, value] of Object.entries(parsed)) {
            if (
              !signatureById(key) ||
              !value ||
              typeof value !== 'object' ||
              Array.isArray(value)
            )
              continue
            const entry = value as Partial<AcademyYearbookEntry>
            yearbook.value[key] = {
              plays:
                Number.isInteger(entry.plays) && (entry.plays ?? 0) >= 0
                  ? entry.plays!
                  : 0,
              forms: Array.isArray(entry.forms)
                ? entry.forms.filter(
                    (form): form is PlayerForm =>
                      form === 'hero' || form === 'villain',
                  )
                : [],
              endings: Array.isArray(entry.endings)
                ? entry.endings.filter(
                    (ending): ending is string => typeof ending === 'string',
                  )
                : [],
            }
          }
        }
      }
    } catch {
      storageWarning.value =
        'Your Yearbook could not be read. Your current term is still available.'
    }
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      run.value = restoreAcademy(raw ? JSON.parse(raw) : null)
      if (run.value?.signature && !yearbook.value[run.value.signature])
        recordIdentity(true)
      else recordIdentity()
    } catch {
      run.value = null
      storageWarning.value =
        'Your previous save could not be loaded. You can begin a new term.'
    }
  }

  function begin(
    power: PowerId,
    signature?: SignaturePowerId,
    vow?: PowerVowId,
    form: PlayerForm = 'student',
  ) {
    if (
      form !== 'student' &&
      (!signature || !yearbook.value[signature]?.forms.includes(form))
    )
      throw new Error(
        'Earn the mantle during a previous campaign before replaying it',
      )
    run.value = startFullAcademy(power, Date.now(), signature, vow, form)
    recordIdentity(true)
    usePlaybookRunReviewStore().begin(
      'comet-city-academy',
      playbookRunKey(run.value),
    )
    persist()
  }

  function beginFirstWeek(
    power: PowerId,
    signature?: SignaturePowerId,
    vow?: PowerVowId,
  ) {
    run.value = startAcademy(power, Date.now(), signature, vow)
    recordIdentity(true)
    usePlaybookRunReviewStore().begin(
      'comet-city-academy',
      playbookRunKey(run.value),
    )
    persist()
  }

  function heal(studentId: StudentId) {
    if (!run.value) return
    run.value = tendInfirmary(run.value, studentId)
    persist()
  }

  function requestBackup() {
    if (!run.value) return
    run.value = callEmergencyVolunteer(run.value)
    persist()
  }

  function recruit(studentId: StudentId) {
    if (!run.value) return
    run.value = recruitContact(run.value, studentId)
    persist()
  }

  function available(studentId: StudentId) {
    return run.value ? studentAvailable(run.value, studentId) : true
  }

  function social(id: StudentId, action: SocialActionId) {
    if (!run.value) return
    run.value = socialize(run.value, id, action)
    persist()
  }

  function visit(siteId: SiteId) {
    if (!run.value) return
    run.value = visitCitySite(run.value, siteId)
    persist()
  }

  function assign(caseId: string, students: StudentId[]) {
    if (!run.value) return
    run.value = assignTeam(run.value, caseId, students)
    persist()
  }

  function lead(caseId: string) {
    if (!run.value) return
    run.value = assignPlayerCase(run.value, caseId)
    persist()
  }

  function planCrisis(caseId: string, approach: 'split' | 'concentrate') {
    if (!run.value) return
    run.value = planThirdNight(run.value, caseId, approach)
    persist()
  }

  function patrol(zone: PatrolZoneId, choiceId: string) {
    if (!run.value) return
    run.value = chooseNightPatrol(run.value, zone, choiceId)
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

  function end(choice: 'protect' | 'command' | 'share' | 'evacuate') {
    if (!run.value) return
    run.value = finishAcademy(run.value, choice)
    persist()
  }

  function restart() {
    run.value = null
    persist()
  }

  return {
    loaded,
    run,
    incidents,
    storageWarning,
    yearbook,
    load,
    begin,
    beginFirstWeek,
    heal,
    available,
    recruit,
    requestBackup,
    social,
    visit,
    assign,
    lead,
    planCrisis,
    patrol,
    dispatch,
    choose,
    next,
    end,
    restart,
  }
})
