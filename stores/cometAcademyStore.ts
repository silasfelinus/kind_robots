import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { playbookRunKey } from '~/utils/playbook/runReview'
import { computed, ref } from 'vue'
import type { PlayerForm } from '~/utils/cometAcademy/protagonistEvolution'
import type { SiteId } from '~/utils/cometAcademy/cityMap'
import type { PatrolZoneId } from '~/utils/cometAcademy/nightPatrols'
import type { MissionApproach } from '~/utils/cometAcademy/expandedNightCases'
import {
  signatureById,
  type SignaturePowerId,
  type PowerVowId,
} from '~/utils/cometAcademy/specialPowers'
import { defineStore } from 'pinia'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  decodeSaveCode,
  encodeSaveCode,
  mastermindMet,
  normalizeSettings,
  type PromSettings,
} from '~/utils/cometAcademy/consoleScreens'
import {
  actorAt,
  counterSignatureLieutenant,
  endTurn,
  fireSelected,
  moveSelected,
  useAlliedSignature,
} from '~/utils/everyVillainTactics/training'
import {
  newTacticalInterlude,
  parleyWithLieutenant,
  secureRivalObjective,
  discoverRivalSecret,
  reconcileTacticalVictory,
  advanceRivalArena,
  tacticalResultFor,
} from '~/utils/cometAcademy/tacticalInterlude'
import type {
  SocialActionId,
  TriadArcId,
} from '~/utils/cometAcademy/relationships'
import {
  accuseMastermind,
  assignTeam,
  assignPlayerCase,
  selectMissionApproach,
  planThirdNight,
  chooseNightPatrol,
  chooseNovelNight,
  chooseRecommendedRival,
  chooseEncounter,
  finishAcademy,
  incidentsFor,
  nextSchoolDay,
  resolveDispatch,
  restoreAcademy,
  recruitContact,
  callEmergencyVolunteer,
  negotiateTriad,
  socialize,
  startAcademy,
  startFullAcademy,
  studentAvailable,
  tendInfirmary,
  visitCitySite,
  type AcademyRun,
  type CampaignPlayOptions,
  type PowerId,
  type StudentId,
} from '~/utils/cometAcademy/rules'

const SAVE_KEY = 'comet-city-academy-slice-v1'
const YEARBOOK_KEY = 'comet-city-academy-yearbook-v1'
/** Mastermind ids the player has unmasked in any term, for Scrapbook dossiers. */
const DOSSIER_KEY = 'comet-city-academy-dossiers-v1'

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
  const settings = ref<PromSettings>({ ...DEFAULT_SETTINGS })
  const dossiers = ref<string[]>([])

  function recordDossier() {
    const current = run.value
    if (
      !current?.mastermind ||
      !mastermindMet(current) ||
      dossiers.value.includes(current.mastermind)
    )
      return
    dossiers.value = [...dossiers.value, current.mastermind]
  }

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
  const tactical = computed(() => run.value?.tacticalBattle ?? null)

  function persist() {
    try {
      recordIdentity()
      recordDossier()
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      localStorage.setItem(YEARBOOK_KEY, JSON.stringify(yearbook.value))
      localStorage.setItem(DOSSIER_KEY, JSON.stringify(dossiers.value))
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
      settings.value = normalizeSettings(
        JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'),
      )
      const met: unknown = JSON.parse(localStorage.getItem(DOSSIER_KEY) ?? '[]')
      dossiers.value = Array.isArray(met)
        ? met.filter((id): id is string => typeof id === 'string')
        : []
    } catch {
      settings.value = { ...DEFAULT_SETTINGS }
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
    options?: CampaignPlayOptions,
  ) {
    if (
      form !== 'student' &&
      (!signature || !yearbook.value[signature]?.forms.includes(form))
    )
      throw new Error(
        'Earn the mantle during a previous campaign before replaying it',
      )
    run.value = startFullAcademy(
      power,
      Date.now(),
      signature,
      vow,
      form,
      options,
    )
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

  function negotiate(arcId: TriadArcId, optionId: string) {
    if (!run.value) return
    run.value = negotiateTriad(run.value, arcId, optionId)
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

  function missionTactic(caseId: string, approach: MissionApproach) {
    if (!run.value) return
    run.value = selectMissionApproach(run.value, caseId, approach)
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

  function novelNight(
    caseId: string,
    choice: 'rescue' | 'investigate' | 'split' | 'concentrate',
  ) {
    if (!run.value) return
    run.value = chooseNovelNight(run.value, caseId, choice)
    persist()
  }

  function recommendRival() {
    if (!run.value) return
    run.value = chooseRecommendedRival(run.value)
    persist()
  }

  function startBattle() {
    if (!run.value || run.value.campaignOptions?.tacticalMissions === false)
      return false
    const battle = newTacticalInterlude(run.value)
    if (!battle) return false
    run.value = { ...run.value, tacticalBattle: battle }
    persist()
    return true
  }

  function battleMode(mode: 'move' | 'fire') {
    const fight = run.value?.tacticalBattle?.state
    if (!fight || fight.phase !== 'active') return
    fight.mode = mode
    fight.hover = null
    persist()
  }

  function battleClick(x: number, y: number) {
    const battle = run.value?.tacticalBattle
    const fight = battle?.state
    if (!battle || !fight || fight.phase !== 'active') return
    const point = { x, y }
    const arena = battle.arena
    if (
      arena &&
      !arena.secured &&
      arena.objectivePoint.x === x &&
      arena.objectivePoint.y === y &&
      actorAt(fight, point)?.team !== 'rival' &&
      secureRivalObjective(battle)
    ) {
      persist()
      return
    }
    const unit = actorAt(fight, point)
    if (unit?.team === 'squad' && unit.hp > 0) {
      fight.selected = unit.id
      fight.mode = 'move'
      fight.hover = point
      discoverRivalSecret(battle)
    } else if (unit?.team === 'rival' && fight.mode === 'fire') {
      if (fireSelected(fight, unit)) reconcileTacticalVictory(battle)
    } else if (!unit && fight.mode === 'move') {
      if (moveSelected(fight, point)) discoverRivalSecret(battle)
    }
    persist()
  }

  function battleCounter() {
    const fight = run.value?.tacticalBattle?.state
    if (!fight || !counterSignatureLieutenant(fight)) return false
    persist()
    return true
  }

  function battleParley(decision: 'ally' | 'truce') {
    const battle = run.value?.tacticalBattle
    if (!battle || !parleyWithLieutenant(battle, decision)) return false
    persist()
    return true
  }

  function battleSupport() {
    const battle = run.value?.tacticalBattle
    if (!battle || !useAlliedSignature(battle.state)) return false
    reconcileTacticalVictory(battle)
    persist()
    return true
  }

  function battleTurn() {
    const battle = run.value?.tacticalBattle
    const fight = battle?.state
    if (!battle || !fight || fight.phase !== 'active') return
    endTurn(fight)
    reconcileTacticalVictory(battle)
    advanceRivalArena(battle)
    persist()
  }

  function battleRetreat() {
    const fight = run.value?.tacticalBattle?.state
    if (!fight || fight.phase !== 'active') return
    fight.phase = 'defeat'
    fight.log =
      'You order a retreat. Your team survives, but the rival wins the ground.'
    persist()
  }

  function battleResolve() {
    if (!run.value) return
    const result = tacticalResultFor(run.value)
    if (!result) return
    const completed = {
      ...run.value,
      tacticalBattle: null,
      tacticalResult: result,
      tacticalHistory: [...(run.value.tacticalHistory ?? []), result],
    }
    run.value = resolveDispatch(completed)
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

  function accuse(villainId: string) {
    if (!run.value) return
    run.value = accuseMastermind(run.value, villainId)
    persist()
  }

  function updateSettings(next: Partial<PromSettings>) {
    settings.value = normalizeSettings({ ...settings.value, ...next })
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch {
      storageWarning.value =
        'This browser cannot save settings. They will reset when you leave.'
    }
  }

  function exportSave(): string {
    return run.value ? encodeSaveCode(run.value) : ''
  }

  /** Replaces the current term with a validated save code. */
  function importSave(code: string): boolean {
    const restored = decodeSaveCode(code)
    if (!restored) return false
    run.value = restored
    recordIdentity(
      Boolean(restored.signature && !yearbook.value[restored.signature]),
    )
    persist()
    return true
  }

  return {
    loaded,
    run,
    incidents,
    tactical,
    storageWarning,
    yearbook,
    settings,
    dossiers,
    load,
    begin,
    beginFirstWeek,
    heal,
    available,
    recruit,
    requestBackup,
    social,
    negotiate,
    visit,
    assign,
    lead,
    missionTactic,
    planCrisis,
    patrol,
    novelNight,
    dispatch,
    recommendRival,
    startBattle,
    battleMode,
    battleClick,
    battleCounter,
    battleParley,
    battleSupport,
    battleTurn,
    battleRetreat,
    battleResolve,
    choose,
    next,
    end,
    restart,
    accuse,
    updateSettings,
    exportSave,
    importSave,
  }
})
