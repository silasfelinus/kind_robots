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
import { useUserStore } from '~/stores/userStore'
import { mergeAlienGuides } from '~/utils/gameOfCaptains/alienAccountMerge'
import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useAchievementStore } from '~/stores/achievementStore'
import {
  NO_VOYAGE_FACTS,
  alienAchievements,
  redshirtAchievements,
  voyageDeedAchievements,
  voyageDeedFacts,
} from '~/utils/gameOfCaptains/achievements'
import {
  SPACE_COUCH_KIT_ID,
  spaceCouchKitUnlocks,
} from '~/utils/gameOfCaptains/kitUnlocks'
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
  trioKey,
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
import { computed, ref, watch } from 'vue'
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
  requisitionSupplies,
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
const ALIEN_GUIDE_OWNER_KEY = 'game-of-captains-alien-legacy-import-owner-v1'
const ALIEN_PENDING_PREFIX = 'game-of-captains-alien-pending-user-'
const KNOWLEDGE_KEY = 'game-of-captains-redshirt-knowledge-v1'
const PREFERENCES_KEY = 'game-of-captains-preferences-v1'
type CouchPreferences = { largeText: boolean; reducedMotion: boolean }

export const useGameOfCaptainsStore = defineStore('gameOfCaptains', () => {
  const userStore = useUserStore()
  const run = ref<VoyageRun | null>(null)
  const loaded = ref(false)
  const redshirtKnowledge = ref<RedshirtKnowledge>({})
  const storageWarning = ref('')
  const alienSyncStatus = ref<'guest' | 'loading' | 'synced' | 'pending'>(
    'guest',
  )
  const alienSyncWarning = ref('')
  let accountEpoch = 0
  let writer: Promise<void> | null = null
  let queuedSignature = ''
  let desiredRevision = 0
  let completedRevision = 0
  let legacyImportUserId: number | null = null
  // What the voyage had already earned at the last action, so the next action
  // awards only what it newly earned. load() restores a saved voyage with
  // `restoring` set, which resets the snapshot without awarding.
  let deedFacts = NO_VOYAGE_FACTS
  let restoring = false

  function award(...codes: string[]) {
    if (!codes.length) return
    const achievements = useAchievementStore()
    for (const code of codes) void achievements.rewardAchievementByCode(code)
  }

  const pendingGuideKey = (id: number): string => ALIEN_PENDING_PREFIX + id
  const readCachedGuide = (key: string): AlienGuide => {
    try {
      return normalizeAlienGuide(
        JSON.parse(localStorage.getItem(key) ?? 'null'),
      )
    } catch {
      return emptyAlienGuide()
    }
  }
  const hasAlienProgress = (guide: AlienGuide): boolean =>
    guide.discovered.length > 0 ||
    guide.attempted.length > 0 ||
    guide.milestoneSeen.length > 0

  function saveAlienGuideToAccount() {
    const id = userStore.authenticatedUserId
    if (!id) return
    const snapshot = JSON.stringify(alienGuide.value)
    if (snapshot === queuedSignature) return
    queuedSignature = snapshot
    desiredRevision++
    try {
      localStorage.setItem(pendingGuideKey(id), snapshot)
    } catch {
      alienSyncWarning.value = 'Browser recovery storage is unavailable.'
    }
    alienSyncStatus.value = 'pending'
    if (writer) return
    const epoch = accountEpoch
    const send = async () => {
      while (epoch === accountEpoch && completedRevision < desiredRevision) {
        const revision = desiredRevision
        const response = await performFetch<AlienGuide>(
          '/api/game-of-captains/guide',
          {
            method: 'POST',
            body: JSON.stringify(alienGuide.value),
          },
        )
        if (epoch !== accountEpoch || userStore.authenticatedUserId !== id)
          return
        if (!response.success || !response.data) {
          alienSyncStatus.value = 'pending'
          alienSyncWarning.value =
            'Scrapbook not yet synced. Local recovery is saved for your next visit.'
          return
        }
        alienGuide.value = mergeAlienGuides(response.data, alienGuide.value)
        completedRevision = revision
        alienSyncWarning.value = ''
        if (completedRevision === desiredRevision) {
          queuedSignature = JSON.stringify(alienGuide.value)
          alienSyncStatus.value = 'synced'
          try {
            localStorage.removeItem(pendingGuideKey(id))
            if (legacyImportUserId === id) {
              localStorage.removeItem(ALIEN_GUIDE_KEY)
              localStorage.setItem(ALIEN_GUIDE_OWNER_KEY, String(id))
              legacyImportUserId = null
            }
          } catch {
            // The server accepted the guide. Local cleanup is optional.
          }
        }
      }
    }
    const task = send()
      .catch(() => {
        if (epoch === accountEpoch) {
          alienSyncStatus.value = 'pending'
          alienSyncWarning.value =
            'Connection interrupted. Your account-scoped recovery copy remains available.'
        }
      })
      .finally(() => {
        if (writer === task) writer = null
      })
    writer = task
  }

  function retryAlienGuideSync() {
    if (!userStore.authenticatedUserId || alienSyncStatus.value === 'loading')
      return
    queuedSignature = ''
    saveAlienGuideToAccount()
  }

  async function syncAlienGuideAccount() {
    if (!loaded.value) return
    const epoch = ++accountEpoch
    alienSighting.value = null
    alienReport.value = null
    collectorIncident.value = null
    collectorReport.value = null
    alienArtwork.value = {}
    alienArtLoaded.value = false
    onboardingArt.value = {}
    onboardingArtLoaded.value = false
    trioArtwork.value = {}
    loadedTrioArtwork.value = {}
    pendingTrioArtwork.value = {}
    const id = userStore.authenticatedUserId
    writer = null
    queuedSignature = ''
    desiredRevision = 0
    completedRevision = 0
    legacyImportUserId = null
    alienSyncWarning.value = ''
    if (!id) {
      alienGuide.value = readCachedGuide(ALIEN_GUIDE_KEY)
      alienSyncStatus.value = 'guest'
      return
    }
    alienGuide.value = emptyAlienGuide()
    alienSyncStatus.value = 'loading'
    const pending = readCachedGuide(pendingGuideKey(id))
    const owner = localStorage.getItem(ALIEN_GUIDE_OWNER_KEY)
    const legacy =
      owner === null || owner === String(id)
        ? readCachedGuide(ALIEN_GUIDE_KEY)
        : emptyAlienGuide()
    if (hasAlienProgress(legacy)) {
      legacyImportUserId = id
      if (owner === null) {
        try {
          localStorage.setItem(ALIEN_GUIDE_OWNER_KEY, String(id))
        } catch {
          alienSyncWarning.value =
            'Legacy scrapbook ownership could not be cached on this device.'
        }
      }
    }
    const response = await performFetch<AlienGuide>(
      '/api/game-of-captains/guide',
    )
    if (epoch !== accountEpoch || userStore.authenticatedUserId !== id) return
    const remote =
      response.success && response.data
        ? normalizeAlienGuide(response.data)
        : emptyAlienGuide()
    alienGuide.value = mergeAlienGuides(
      mergeAlienGuides(remote, pending),
      mergeAlienGuides(legacy, alienGuide.value),
    )
    if (!response.success) {
      alienSyncWarning.value =
        'Account guide could not be read; changes will be merged when the server is available.'
    }
    queuedSignature = JSON.stringify(remote)
    alienSyncStatus.value = 'pending'
    saveAlienGuideToAccount()
    if (
      response.success &&
      response.data &&
      JSON.stringify(remote) === JSON.stringify(alienGuide.value)
    ) {
      // A no-op save is unnecessary; the server already has this guide.
      alienSyncStatus.value = 'synced'
    }
  }
  watch(
    () => userStore.authenticatedUserId,
    () => {
      if (!loaded.value) return
      void syncAlienGuideAccount()
      void loadAlienArtwork()
      void loadOnboardingArt()
      if (run.value) void loadTrioArtwork(trioKey(run.value.crew))
    },
  )
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
  const alienEncounterAvailable = computed(
    () =>
      (alienSyncStatus.value !== 'loading' || !userStore.authenticatedUserId) &&
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
    const discoveredBefore = alienGuide.value.discovered.length
    alienGuide.value = outcome.guide
    award(
      ...alienAchievements(
        discoveredBefore,
        alienGuide.value.discovered.length,
      ),
    )
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
    const epoch = accountEpoch
    try {
      const response = await performFetch<Record<string, string>>(
        '/api/game-of-captains/alien-art',
      )
      if (epoch === accountEpoch && response.success && response.data) {
        alienArtwork.value = response.data
      }
    } catch {
      if (epoch === accountEpoch) alienArtwork.value = {}
    } finally {
      if (epoch === accountEpoch) alienArtLoaded.value = true
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
    const epoch = accountEpoch
    pendingTrioArtwork.value[trio] = true
    try {
      const response = await performFetch<Record<string, string>>(
        '/api/game-of-captains/trio-art?trio=' + encodeURIComponent(trio),
      )
      if (epoch === accountEpoch && response.success && response.data) {
        trioArtwork.value = { ...trioArtwork.value, ...response.data }
        loadedTrioArtwork.value[trio] = true
      }
    } catch {
      // Portrait fallbacks remain available. A failed request may retry.
    } finally {
      if (epoch === accountEpoch) pendingTrioArtwork.value[trio] = false
    }
  }
  async function loadOnboardingArt() {
    if (onboardingArtLoaded.value) return
    const epoch = accountEpoch
    try {
      const response = await performFetch<Record<string, string>>(
        '/api/game-of-captains/onboarding-art',
      )
      if (epoch === accountEpoch && response.success && response.data) {
        onboardingArt.value = response.data
      }
    } catch {
      if (epoch === accountEpoch) onboardingArt.value = {}
    } finally {
      if (epoch === accountEpoch) onboardingArtLoaded.value = true
    }
  }
  const preferences = ref<CouchPreferences>({
    largeText: false,
    reducedMotion: false,
  })
  const saved = computed(() => !!run.value)

  /** Feeds the Playbook Kit scrapbook from the saved run (its own save key). */
  function recordKitUnlocks() {
    try {
      const kit = usePlaybookKitStore()
      if (kit.game !== SPACE_COUCH_KIT_ID) kit.open(SPACE_COUCH_KIT_ID)
      const earned = spaceCouchKitUnlocks(run.value)
      for (const id of earned.moments) kit.unlock('moments', id)
      for (const id of earned.reveals) kit.unlock('reveals', id)
      for (const id of earned.endings) kit.unlock('endings', id)
    } catch {
      // The scrapbook is a bonus; it can never block saving the voyage.
    }
  }
  /** Awards what the action that just persisted newly earned. */
  function awardDeeds(namesBefore: number) {
    const facts = voyageDeedFacts(run.value)
    let kitEndings = 0
    try {
      kitEndings = Object.keys(usePlaybookKitStore().progress.endings).length
    } catch {
      // Without the scrapbook, Anthology waits for the next ending.
    }
    award(
      ...voyageDeedAchievements(deedFacts, facts, kitEndings),
      ...redshirtAchievements(
        namesBefore,
        Object.keys(redshirtKnowledge.value).length,
      ),
    )
    deedFacts = facts
  }
  function persist() {
    recordKitUnlocks()
    const namesBefore = Object.keys(redshirtKnowledge.value).length
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
      if (userStore.authenticatedUserId) {
        if (
          alienSyncStatus.value === 'synced' ||
          alienSyncStatus.value === 'pending'
        )
          saveAlienGuideToAccount()
        else
          localStorage.setItem(
            pendingGuideKey(userStore.authenticatedUserId),
            JSON.stringify(alienGuide.value),
          )
      } else {
        localStorage.setItem(ALIEN_GUIDE_KEY, JSON.stringify(alienGuide.value))
      }
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'Local saves are blocked by your browser. Keep this tab open to finish your voyage.'
    }
    if (restoring) deedFacts = voyageDeedFacts(run.value)
    else awardDeeds(namesBefore)
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
      alienGuide.value = userStore.authenticatedUserId
        ? emptyAlienGuide()
        : readCachedGuide(ALIEN_GUIDE_KEY)
      const raw = localStorage.getItem(SAVE_KEY)
      run.value = restoreTrioAdventure(
        restoreVoyage(raw ? JSON.parse(raw) : null),
      )
      deedFacts = voyageDeedFacts(run.value)
      restoring = true
      if (run.value) persist()
      restoring = false
      void syncAlienGuideAccount()
    } catch {
      restoring = false
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
    award('game-of-captains-launch')
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
  function requisition() {
    if (!run.value) return
    run.value = requisitionSupplies(run.value)
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
    alienSyncStatus,
    alienSyncWarning,
    syncAlienGuideAccount,
    retryAlienGuideSync,
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
    requisition,
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
