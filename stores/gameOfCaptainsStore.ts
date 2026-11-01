import {
  emptyAlienGuide,
  normalizeAlienGuide,
  nextAlienSighting,
  maySeeAlien,
  resolveAlienSighting,
  type AlienGuide,
  type AlienSighting,
  type AlienChoice,
} from '~/utils/gameOfCaptains/alienFieldGuide'
import {
  nextCollectorIncident,
  resolveCollectorIncident,
  collectorEcho,
  type CollectorIncident,
  type CollectorChoice,
  type CollectorEnding,
} from '~/utils/gameOfCaptains/alienMilestones'
import { performFetch } from '~/stores/utils'
import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import {
  visitCasinoVenue,
  type CasinoChoice,
} from '~/utils/gameOfCaptains/solarCircuit'
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
import {
  startWorldTravel,
  arriveAtWorld,
  deployExpedition,
  leaveExpedition,
  hireRedshirt,
} from '~/utils/gameOfCaptains/expedition'
import {
  advanceCloneQuest,
  cloneEndingCoda,
  printClone,
  recordCloneMissions,
  type CloneChoice,
} from '~/utils/gameOfCaptains/cloneSaga'
import {
  learnRedshirtKnowledge,
  normalizeRedshirtKnowledge,
  type RedshirtKnowledge,
} from '~/utils/gameOfCaptains/redshirtKnowledge'
import {
  chooseCaptainInstinct,
  type CaptainInstinctChoice,
} from '~/utils/gameOfCaptains/captainInstincts'
import { playbookRunKey } from '~/utils/playbook/runReview'
import {
  resolveConsequence,
  applyConsequenceEpilogue,
} from '~/utils/gameOfCaptains/consequenceStories'
import type { StarAssessment } from '~/utils/gameOfCaptains/starSigns'
import type { CaptainOriginId } from '~/utils/gameOfCaptains/captainOrigins'
import {
  dispatchEpisodeBatch,
  drawEpisodeDeck,
  episodeDecksDone,
  episodeEndingCoda,
  type EpisodeAssignment,
  type EpisodeDeck,
  type EpisodeChoice,
} from '~/utils/gameOfCaptains/episodeConsole'
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
const ALIEN_GUIDE_KEY = 'game-of-captains-alien-scrapbook-v1'
const KNOWLEDGE_KEY = 'game-of-captains-redshirt-knowledge-v1'
const PREFERENCES_KEY = 'game-of-captains-preferences-v1'
type CouchPreferences = { largeText: boolean; reducedMotion: boolean }

export const useGameOfCaptainsStore = defineStore('gameOfCaptains', () => {
  const run = ref<VoyageRun | null>(null)
  const loaded = ref(false)
  const redshirtKnowledge = ref<RedshirtKnowledge>({})
  const storageWarning = ref('')
  const alienGuide = ref<AlienGuide>(emptyAlienGuide())
  const alienSighting = ref<AlienSighting | null>(null)
  const alienReport = ref<{
    text: string
    speciesId: string
    recorded: boolean
  } | null>(null)
  const collectorIncident = ref<CollectorIncident | null>(null)
  const collectorReport = ref<{
    at: number
    ending: CollectorEnding
    text: string
  } | null>(null)
  const pendingCollectorIncident = computed(() =>
    nextCollectorIncident(alienGuide.value),
  )
  function openCollectorIncident() {
    if (
      !pendingCollectorIncident.value ||
      collectorIncident.value ||
      collectorReport.value ||
      alienSighting.value ||
      alienReport.value
    )
      return
    collectorIncident.value = pendingCollectorIncident.value
  }
  function chooseCollectorAction(choice: CollectorChoice) {
    const incident = collectorIncident.value
    if (!incident) return
    const result = resolveCollectorIncident(
      alienGuide.value,
      incident.at,
      choice,
    )
    if (!result) return
    alienGuide.value = result.guide
    collectorReport.value = {
      at: incident.at,
      ending: result.ending,
      text: result.text,
    }
    collectorIncident.value = null
    if (run.value) {
      run.value = {
        ...run.value,
        log: [
          ...run.value.log,
          `Ship day ${run.value.day ?? run.value.chapter}: The Couch Natural History Society recorded ${incident.title}. ${result.text}`,
        ],
      }
    }
    persist()
  }
  function dismissCollectorIncident() {
    collectorIncident.value = null
    collectorReport.value = null
  }
  const alienEncounterAvailable = computed(() =>
    maySeeAlien(run.value, alienGuide.value),
  )
  function lookForAlien() {
    if (!run.value || !alienEncounterAvailable.value) return
    alienReport.value = null
    const sighting = nextAlienSighting(run.value, alienGuide.value)
    const echo = collectorEcho(alienGuide.value)
    alienSighting.value =
      sighting && echo
        ? {
            ...sighting,
            scene: sighting.scene + ' The local radio adds: ' + echo,
          }
        : sighting
  }
  function chooseAlienAction(choice: AlienChoice) {
    const sighting = alienSighting.value
    if (!sighting) return
    const outcome = resolveAlienSighting(alienGuide.value, sighting, choice)
    alienGuide.value = outcome.guide
    if (run.value) {
      run.value = {
        ...run.value,
        log: [
          ...run.value.log,
          `Ship day ${run.value.day ?? run.value.chapter}: Alien field encounter with ${sighting.species.name}. ${outcome.text}`,
        ],
      }
    }
    alienReport.value = {
      text: outcome.text,
      speciesId: sighting.species.id,
      recorded: outcome.recorded,
    }
    alienSighting.value = null
    persist()
  }
  function dismissAlienEncounter() {
    const discovered = alienReport.value?.recorded === true
    alienSighting.value = null
    alienReport.value = null
    if (discovered) openCollectorIncident()
  }

  const alienArtwork = ref<Record<string, string>>({})
  const alienArtLoaded = ref(false)
  async function loadAlienArtwork() {
    if (alienArtLoaded.value) return
    try {
      const response = await performFetch<Record<string, string>>(
        '/api/game-of-captains/alien-art',
      )
      if (response.success && response.data) {
        alienArtwork.value = response.data
      }
    } catch {
      alienArtwork.value = {}
    } finally {
      alienArtLoaded.value = true
    }
  }
  const onboardingArt = ref<Record<string, string>>({})
  const onboardingArtLoaded = ref(false)
  const trioArtwork = ref<Record<string, string>>({})
  const loadedTrioArtwork = ref<Record<string, boolean>>({})
  const pendingTrioArtwork = ref<Record<string, boolean>>({})
  async function loadTrioArtwork(trio: string) {
    if (
      !/^[a-z]+-[a-z]+-[a-z]+$/.test(trio) ||
      loadedTrioArtwork.value[trio] ||
      pendingTrioArtwork.value[trio]
    )
      return
    pendingTrioArtwork.value[trio] = true
    try {
      const response = await performFetch<Record<string, string>>(
        '/api/game-of-captains/trio-art?trio=' + encodeURIComponent(trio),
      )
      if (response.success && response.data) {
        trioArtwork.value = { ...trioArtwork.value, ...response.data }
        loadedTrioArtwork.value[trio] = true
      }
    } catch {
      // Portrait fallbacks remain available. A failed request may retry.
    } finally {
      pendingTrioArtwork.value[trio] = false
    }
  }
  async function loadOnboardingArt() {
    if (onboardingArtLoaded.value) return
    try {
      const response = await performFetch<Record<string, string>>(
        '/api/game-of-captains/onboarding-art',
      )
      if (response.success && response.data) {
        onboardingArt.value = response.data
      }
    } catch {
      onboardingArt.value = {}
    } finally {
      onboardingArtLoaded.value = true
    }
  }
  const preferences = ref<CouchPreferences>({
    largeText: false,
    reducedMotion: false,
  })
  const saved = computed(() => !!run.value)

  function persist() {
    try {
      if (run.value) {
        redshirtKnowledge.value = learnRedshirtKnowledge(
          run.value,
          redshirtKnowledge.value,
        )
        localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      } else {
        localStorage.removeItem(SAVE_KEY)
      }
      localStorage.setItem(
        KNOWLEDGE_KEY,
        JSON.stringify(redshirtKnowledge.value),
      )
      localStorage.setItem(ALIEN_GUIDE_KEY, JSON.stringify(alienGuide.value))
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
      try {
        const savedPreferences = JSON.parse(
          localStorage.getItem(PREFERENCES_KEY) ?? 'null',
        )
        if (savedPreferences && typeof savedPreferences === 'object') {
          preferences.value = {
            largeText: savedPreferences.largeText === true,
            reducedMotion: savedPreferences.reducedMotion === true,
          }
        }
      } catch {
        preferences.value = { largeText: false, reducedMotion: false }
      }
      try {
        redshirtKnowledge.value = normalizeRedshirtKnowledge(
          JSON.parse(localStorage.getItem(KNOWLEDGE_KEY) ?? '{}'),
        )
      } catch {
        // A damaged knowledge cache cannot invalidate an otherwise valid voyage.
        redshirtKnowledge.value = {}
      }
      try {
        alienGuide.value = normalizeAlienGuide(
          JSON.parse(localStorage.getItem(ALIEN_GUIDE_KEY) ?? 'null'),
        )
      } catch {
        alienGuide.value = emptyAlienGuide()
      }
      const raw = localStorage.getItem(SAVE_KEY)
      run.value = restoreTrioAdventure(
        restoreVoyage(raw ? JSON.parse(raw) : null),
      )
      if (run.value) persist()
    } catch {
      run.value = null
      storageWarning.value =
        'Previous voyage could not be loaded. You can begin a new one.'
    }
  }
  function begin(
    captain: CaptainId,
    crew: CrewId[],
    assessment?: StarAssessment,
    origin?: CaptainOriginId,
  ) {
    run.value = startVoyage(captain, crew, Date.now(), assessment, origin)
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
  function travel() {
    if (!run.value) return
    run.value = startWorldTravel(run.value)
    persist()
  }
  function arrive() {
    if (!run.value) return
    run.value = arriveAtWorld(run.value)
    persist()
  }
  function deploy(encounterId: string, lead: string) {
    if (!run.value) return
    const before = run.value
    run.value = recordCloneMissions(
      before,
      deployExpedition(before, encounterId, lead),
    )
    persist()
  }
  function deployBatch(assignments: EpisodeAssignment[]) {
    if (!run.value) return
    const before = run.value
    run.value = recordCloneMissions(
      before,
      dispatchEpisodeBatch(before, assignments),
    )
    persist()
  }
  function drawDailyDeck(
    deck: EpisodeDeck,
    choice: EpisodeChoice,
    cast: string[],
  ) {
    if (!run.value) return
    run.value = drawEpisodeDeck(run.value, deck, choice, cast)
    persist()
  }
  function cloneAdvance(choice: CloneChoice) {
    if (!run.value) return
    run.value = advanceCloneQuest(run.value, choice)
    persist()
  }
  function clonePrint(id: string) {
    if (!run.value) return
    run.value = printClone(run.value, id)
    persist()
  }
  function endExpedition() {
    if (!run.value || !episodeDecksDone(run.value)) return
    run.value = leaveExpedition(run.value)
    persist()
  }
  function hire() {
    if (!run.value) return
    run.value = hireRedshirt(run.value)
    persist()
  }
  function visitVenue(venue: 'bar' | 'casino', choice: CasinoChoice) {
    if (!run.value) return
    run.value = visitCasinoVenue(run.value, venue, choice)
    persist()
  }
  function captainAction(choice: CaptainInstinctChoice) {
    if (!run.value) return
    run.value = chooseCaptainInstinct(run.value, choice)
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
  function decideConsequence(choiceId: string) {
    if (!run.value) return
    run.value = resolveConsequence(run.value, choiceId)
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
    run.value = applyConsequenceEpilogue(
      cloneEndingCoda(
        episodeEndingCoda(
          trioEpilogue(relationshipEpilogue(finishVoyage(run.value, strategy))),
        ),
      ),
    )
    persist()
  }
  function restart() {
    run.value = null
    persist()
  }
  function setPreference(key: keyof CouchPreferences, value: boolean) {
    preferences.value = { ...preferences.value, [key]: value }
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.value))
    } catch {
      storageWarning.value = 'Settings could not be stored on this device.'
    }
  }
  return {
    run,
    loaded,
    redshirtKnowledge,
    alienGuide,
    collectorIncident,
    collectorReport,
    pendingCollectorIncident,
    openCollectorIncident,
    chooseCollectorAction,
    dismissCollectorIncident,
    alienArtwork,
    loadAlienArtwork,
    alienSighting,
    alienReport,
    alienEncounterAvailable,
    lookForAlien,
    chooseAlienAction,
    dismissAlienEncounter,
    saved,
    storageWarning,
    onboardingArt,
    onboardingArtLoaded,
    loadOnboardingArt,
    trioArtwork,
    loadTrioArtwork,
    preferences,
    setPreference,
    load,
    begin,
    assign,
    chooseRoom,
    captainAction,
    chartMission,
    travel,
    arrive,
    deploy,
    deployBatch,
    drawDailyDeck,
    cloneAdvance,
    clonePrint,
    endExpedition,
    hire,
    visitVenue,
    rechargeShield,
    launch,
    advanceDay,
    decide,
    decideConsequence,
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
