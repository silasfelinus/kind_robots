import { BASE_CARD_IDS } from '~/utils/slimeCity/baseCollection'
import { defineStore } from 'pinia'
import {
  canBuyPack,
  currentChallenges,
  currentEvergreen,
  levelFor,
  newProgression,
  nextLevelXp,
  PACK_COST,
  rarityOf,
  type Progression,
} from '../utils/slimeCity/progression'
import {
  campaignBattleTerms,
  campaignChapter,
  campaignEchoFor,
  campaignFavorsFor,
  campaignLegacyFor,
  campaignLegacyTerms,
  campaignEnding,
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
  type CampaignApproach,
} from '../utils/slimeCity/campaign'
import { campaignConversationFor } from '../utils/slimeCity/campaignDialogue'
import {
  allianceStoryScene,
  chooseAllianceStory,
  allianceStoryBattleTerms,
  allianceStoryPlan,
  allianceStoryAftermath,
  allianceStoryFinale,
  type AllianceStoryPick,
} from '../utils/slimeCity/campaignAllianceJourney'
import {
  geneRiotScene,
  geneRiotSceneText,
  geneRiotLastOutcome,
  geneRiotBattleTerms,
  geneRiotEpilogue,
  chooseGeneRiotScene,
  type GeneRiotPick,
} from '../utils/slimeCity/campaignGeneRiot'
import {
  bloodfairyBeat,
  bloodfairySceneText,
  bloodfairyLastOutcome,
  bloodfairyBattleTerms,
  bloodfairyEpilogue,
  bloodfairyLedger,
  bloodfairyStageThreeReveal,
  chooseBloodfairyBeat,
  bloodfairyStoryDeck,
} from '../utils/slimeCity/campaignBloodfairies'
import {
  ironjawBeat,
  ironjawSceneText,
  ironjawLastOutcome,
  ironjawBattleTerms,
  ironjawEpilogue,
  ironjawLedger,
  chooseIronjawBeat,
  ironjawStoryDeck,
} from '../utils/slimeCity/campaignIronjaw'
import {
  riotBeat,
  riotSceneText,
  riotLastOutcome,
  riotBattleTerms,
  riotEpilogue,
  riotLedger,
  chooseRiotBeat,
  riotStoryDeck,
} from '../utils/slimeCity/campaignRiot'
import {
  undertowBeat,
  undertowSceneText,
  undertowLastOutcome,
  undertowBattleTerms,
  undertowEpilogue,
  undertowLedger,
  chooseUndertowBeat,
  undertowStoryDeck,
} from '../utils/slimeCity/campaignUndertow'
import {
  exchangeBeat,
  exchangeSceneText,
  exchangeLastOutcome,
  exchangeBattleTerms,
  exchangeEpilogue,
  exchangeLedger,
  chooseExchangeBeat,
  exchangeStoryDeck,
} from '../utils/slimeCity/campaignExchange'
import {
  campaignCardChoices,
  campaignSoloDeck,
  chooseCampaignCard,
} from '../utils/slimeCity/campaignCardRewards'
import {
  freshTower,
  startTower,
  towerRoutes,
  towerBosses,
  chooseTowerRoute,
  resolveTowerBattle,
  towerSpoils,
  claimTowerSpoil,
  leaveEmptyTower,
  type TowerSave,
} from '../utils/slimeCity/allianceTower'
import { campaignAftermathFor } from '../utils/slimeCity/campaignAftermath'
import {
  recordFinishedRuns,
  type ScrapbookPage,
} from '../utils/slimeCity/endings'
import {
  campaignBattlefield,
  describeBattlefield,
  OBJECTIVE_LABELS,
} from '../utils/slimeCity/campaignBattlefields'
import type {
  SlimeCityStory,
  StoryMode,
  UnlockMode,
} from '../utils/slimeCity/storySave'
import {
  readGuestSlimeStory,
  writeGuestSlimeStory,
} from '../utils/slimeCity/guestStorySave'
import {
  ALLIANCE_DECK_SIZE,
  SOLO_DECK_SIZE,
  STARTER_CARD_IDS,
  allianceCardPool,
  allianceProblems,
  allianceStarter,
  cpuAlliance,
  soloCardPool,
  soloProblems,
  soloStarter,
  swapGeneral,
  LIBRARY_MAX_DECKS,
  libraryDeck,
  libraryDeckProblem,
  type AllianceDeck,
  type LibraryDeck,
} from '../utils/slimeCity/alliance'
import type { ClashOptions, ClashState } from '../utils/slimeCity/clash'
import { clashBossesFromTerms } from '../utils/slimeCity/clashBouts'
import {
  CLASH_BOUT_KINDS,
  type ClashBoutKind,
} from '../utils/slimeCity/clashRewards'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  advance,
  dealsHands,
  cardById,
  cardReady,
  toggleHandDiscard,
  CARDS,
  loadoutProblems,
  createMatch,
  DEFAULT_RULES,
  deploy,
  DISTRICTS,
  KEYWORDS,
  MODE_GUIDES,
  PLAYER_MODES,
  normalizeSeed,
  observe,
  reveal,
  setStance,
  RULE_VARIANTS,
  RUSH_TICK_MS,
  TEAMS,
  teamById,
  type ModeId,
  type RuleVariants,
  type Stance,
  type Side,
  type TeamId,
} from '../utils/slimeCity/prototypes'
import {
  type BoutTerms,
  boutBlocked,
  boutTerms,
  CITY_PLAN,
  CITY_CONTRACTS,
  CAMPAIGN_DISTRICTS,
  championAftermath,
  cityCrisis,
  cityEpilogue,
  cityFinale,
  cityRoute,
  contractBlocked,
  contractTerms,
  createCity,
  decide,
  decideAftermath,
  decideCrisis,
  decideFinale,
  decideStreet,
  streetStory,
  storyMissionTerms,
  gateReason,
  HEAT_LIMIT,
  recordBout,
  recordContract,
  streetsFrom,
  totalStanding,
  travel,
  type DistrictId,
} from '../utils/slimeCity/city'

/**
 * One focused city screen at a time (Silas, 2026-11-02: "We should generally
 * aim for one focused screen at a time"). The painted map is the navigation
 * screen; every other value is a full-stage scene that replaces it.
 */
export type CityScreen = 'map' | 'district' | 'story' | 'contract'
/** A pending city event that takes over any scene until it is resolved. */
export type CityEvent =
  'aftermath' | 'crisis' | 'street' | 'finale' | 'epilogue'
export type CityScene = CityScreen | CityEvent
/** The campaign stage shows either the next chapter or the last bout's aftermath. */
export type CampaignScreen = 'chapter' | 'aftermath'

/** A fresh six-digit seed, easy to read out loud during a playtest. */
function rollSeed(): number {
  try {
    const buf = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buf)
    return 100000 + (buf[0]! % 900000)
  } catch {
    return 100000 + Math.floor(Math.random() * 900000)
  }
}

export type DeckFormat = 'solo' | 'alliance'
/** Prebuilt Alliance pairings: each crew leads once. */
export const STARTER_MATCHUPS: [TeamId, TeamId][] = [
  ['catgirls', 'bloodfairies'],
  ['bloodfairies', 'riot'],
  ['ironjaw', 'catgirls'],
  ['riot', 'ironjaw'],
  ['undertow', 'exchange'],
  ['exchange', 'bloodfairies'],
]
export type ClashKind =
  'practice' | 'reward' | 'rival' | 'contract' | 'campaign' | 'tower'
export interface ClashLaunch {
  id: number
  kind: ClashKind
  format: DeckFormat
  enemy: TeamId
  seed: number
  /** Server-issued reward match id (kind 'reward'). */
  rewardId?: string
  /** The deck issued to the server, so the replay matches what was dealt. */
  cards?: string[]
  alliance?: AllianceDeck
  /** City and Story terms moved onto the bosses. */
  bosses?: Record<Side, number>
}
/** Two decks hold the same cards, in any order. */
function sameCards(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((id, index) => id === right[index])
}

export const useSlimeCityStore = defineStore('slimeCityLab', () => {
  // Account + network services load lazily so the pure game store stays
  // importable (and testable) outside the Nuxt runtime.
  const net = shallowRef<{
    fetcher: typeof import('./utils').performFetch
    user: ReturnType<typeof import('./userStore').useUserStore>
  } | null>(null)
  const netReady = Promise.all([import('./utils'), import('./userStore')])
    .then(([utils, users]) => {
      net.value = { fetcher: utils.performFetch, user: users.useUserStore() }
    })
    .catch(() => undefined)
  const authId = (): number | null =>
    net.value?.user.authenticatedUserId ?? null
  const isGuest = (): boolean => net.value?.user.isGuest ?? true
  async function performFetch<T>(url: string, options: RequestInit = {}) {
    await netReady
    if (!net.value) throw new Error('Account services are unavailable.')
    return net.value.fetcher<T>(url, options)
  }
  const view = ref<
    | 'home'
    | 'settings'
    | 'city'
    | 'arena'
    | 'alleys'
    | 'clash'
    | 'cards'
    | 'campaign'
    | 'rewards'
    | 'tower'
    | 'vs'
  >('home')
  const activeTeam = ref<TeamId>('catgirls')
  const enemyTeam = ref<TeamId>('bloodfairies')
  const mode = ref<ModeId>('blackout')
  const districtId = ref<DistrictId>('pitworks')
  /** Account-scoped story progress. Narrative wins never mint Meat or cards. */
  const city = ref(createCity())
  /** Only server-issued CPU battles can earn account rewards. */
  const rewardMatchId = ref<string | null>(null)
  const progress = ref<Progression>(newProgression())
  const progressLoaded = ref(false)
  const progressAccount = ref<number | null>(null)
  const progressBusy = ref(false)
  const progressError = ref('')
  const challengeList = computed(() => currentChallenges(progress.value))
  const evergreenList = computed(() => currentEvergreen(progress.value))
  const level = computed(() => levelFor(progress.value.xp))
  const nextLevel = computed(() => nextLevelXp(progress.value.xp))
  const packAffordable = computed(
    () => progressLoaded.value && canBuyPack(progress.value),
  )
  const packPrice = PACK_COST
  const cardRarity = rarityOf

  function correctAccount(): boolean {
    return !!authId() && !isGuest() && progressAccount.value === authId()
  }
  async function hydrateProgression(): Promise<void> {
    await netReady
    if (!authId() || isGuest()) {
      progressLoaded.value = false
      progressAccount.value = null
      progress.value = newProgression()
      progressError.value = 'Sign in to sync your Slime City account.'
      return
    }
    progressBusy.value = true
    progressLoaded.value = false
    progress.value = newProgression()
    progressError.value = ''
    const requestUserId = authId()
    try {
      const result = await performFetch<Progression>('/api/slime-city/progress')
      if (!result.success || !result.data)
        throw new Error(
          result.message || 'Could not load your Slime City account.',
        )
      if (requestUserId !== authId()) return
      progress.value = result.data
      progressAccount.value = requestUserId
      progressLoaded.value = true
      enforceCollection()
    } catch (error) {
      progressError.value =
        error instanceof Error ? error.message : 'Could not load account.'
    } finally {
      progressBusy.value = false
    }
  }
  async function claimReward(id: string): Promise<void> {
    if (!correctAccount() || !progressLoaded.value || progressBusy.value) return
    progressBusy.value = true
    progressError.value = ''
    try {
      const result = await performFetch<Progression>('/api/slime-city/claim', {
        method: 'POST',
        body: JSON.stringify({ id }),
      })
      if (!result.success || !result.data)
        throw new Error(result.message || 'Claim rejected.')
      progress.value = result.data
    } catch (error) {
      progressError.value =
        error instanceof Error ? error.message : 'Could not claim reward.'
    } finally {
      progressBusy.value = false
    }
  }
  async function purchasePack(): Promise<void> {
    if (!correctAccount() || !packAffordable.value || progressBusy.value) return
    progressBusy.value = true
    progressError.value = ''
    try {
      const result = await performFetch<Progression>('/api/slime-city/pack', {
        method: 'POST',
      })
      if (!result.success || !result.data)
        throw new Error(result.message || 'Purchase rejected.')
      progress.value = result.data
    } catch (error) {
      progressError.value =
        error instanceof Error ? error.message : 'Could not buy pack.'
    } finally {
      progressBusy.value = false
    }
  }
  async function startCpuBattle(
    format: DeckFormat = clashFormat.value,
  ): Promise<void> {
    if (!correctAccount() || !progressLoaded.value) {
      await hydrateProgression()
      if (!correctAccount() || !progressLoaded.value) return
    }
    if (progressBusy.value) return
    progressBusy.value = true
    progressError.value = ''
    try {
      const result = await performFetch<{
        id: string
        teamId: TeamId
        foeId: TeamId
        seed: number
      }>('/api/slime-city/match', {
        method: 'POST',
        body: JSON.stringify({
          teamId: activeTeam.value,
          clash:
            format === 'alliance'
              ? { format, deck: playAlliance.value }
              : { format, cards: playSolo.value },
        }),
      })
      if (!result.success || !result.data)
        throw new Error(result.message || 'Could not issue CPU battle.')
      enemyTeam.value = result.data.foeId
      launchClash({
        kind: 'reward',
        format,
        enemy: result.data.foeId,
        seed: result.data.seed,
        rewardId: result.data.id,
        cards: format === 'solo' ? [...playSolo.value] : undefined,
        alliance: format === 'alliance' ? playAlliance.value : undefined,
      })
    } catch (error) {
      progressError.value =
        error instanceof Error ? error.message : 'Could not begin CPU battle.'
    } finally {
      progressBusy.value = false
    }
  }
  /** The district whose rival the current match is against, if any. */
  const bout = ref<DistrictId | null>(null)
  /** The rival bout that just ended, for the BACK TO THE CITY button. */
  const lastBout = ref<DistrictId | null>(null)
  const contractBout = ref<DistrictId | null>(null)
  const lastContract = ref<DistrictId | null>(null)
  const campaignSave = ref(createCampaignSave())
  const towerSave = ref<TowerSave>(freshTower())
  const towerRun = computed(() => towerSave.value.run)
  const towerMeta = computed(() => towerSave.value.meta)
  const towerOptions = computed(() =>
    towerRun.value ? towerRoutes(towerRun.value) : null,
  )
  const towerRewards = computed(() =>
    towerRun.value ? towerSpoils(towerRun.value, towerSave.value.meta) : null,
  )
  const savedDecks = ref<Partial<Record<TeamId, string[]>>>({})
  /** ALLIANCE: the last legal 20-card deck saved for each general. */
  const savedAlliances = ref<Partial<Record<TeamId, AllianceDeck>>>({})
  /** ALLIANCE: work in progress, kept even while it is not yet legal. */
  const allianceDrafts = ref<Partial<Record<TeamId, AllianceDeck>>>({})
  /** SOLO CLASH 20-card decks, one per faction (saved when legal). */
  const savedSolo = ref<Partial<Record<TeamId, string[]>>>({})
  const soloDrafts = ref<Partial<Record<TeamId, string[]>>>({})
  /** COLLECTION's named Alliance deck library, and the deck in hand. */
  const library = ref<LibraryDeck[]>([])
  const libraryId = ref<string | null>(null)
  /**
   * Which deck the COLLECTION armory is editing: the Alliance library by
   * default; 'solo' only when the SOLO story opens its crew deck.
   */
  const deckFormat = ref<DeckFormat>('alliance')
  /** Which deck the CLASH tab deals: Solo (one faction) or Alliance (two). */
  const clashFormat = ref<DeckFormat>('alliance')
  const CLASH_FORMAT_KEY = 'kr-slime-city-clash-format-v1'
  function hydrateClashFormat(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(CLASH_FORMAT_KEY)
      if (stored === 'solo' || stored === 'alliance') {
        clashFormat.value = stored
        deckFormat.value = stored
      }
    } catch {
      // Private browsing or disabled storage must not prevent play.
    }
  }
  function setDefaultClashFormat(format: DeckFormat): void {
    clashFormat.value = format
    deckFormat.value = format
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CLASH_FORMAT_KEY, format)
    } catch {
      // The preference still applies for the current session.
    }
  }

  /** One narrative journey; only its 20-card deck composition changes. */
  const journeyFormat = ref<DeckFormat>('solo')
  const journeyDeckId = ref<string | null>(null)
  /**
   * The Clash match to deal next. Every battle is CLASH (Silas, 2026-11-08
   * PT): the CLASH tab's practice and reward matches, and the City's rival,
   * contract and Story bouts, which are always SOLO CLASH.
   */
  const clashLaunch = ref<ClashLaunch>({
    id: 0,
    kind: 'practice',
    format: 'solo',
    enemy: 'ironjaw',
    seed: 30611,
  })
  /** How the last bout ended, for the result banner and BACK buttons. */
  const clashResult = ref<{
    kind: ClashKind
    victor: Side | 'draw'
  } | null>(null)
  /** One collection rule for everyone since 2026-11-10 PT: earn beyond the base. */
  const unlockMode = computed<UnlockMode>(() => 'trickle')
  /** Story bouts: as written or all TURF, with or without PARITY. */
  const storyMode = ref<StoryMode>('written')
  const storyParity = ref(false)
  /** Endings gallery and scrapbook (slime-city/t-059). */
  const endingsFound = ref<string[]>([])
  const scrapbook = ref<ScrapbookPage[]>([])
  const endingsOpen = ref(false)
  const replacingCard = ref<string | null>(null)
  const deckMessage = ref('')
  const storyLoaded = ref(false)
  const storySaving = ref(false)
  const storyRevision = ref(0)
  const storyAccount = ref<number | null>(null)
  const storyError = ref('')
  let storyDirty = false
  let storyWrite: Promise<void> | null = null

  function storyEditable(): boolean {
    return (
      !authId() ||
      isGuest() ||
      (storyLoaded.value && storyAccount.value === authId())
    )
  }

  async function hydrateStory(): Promise<void> {
    await netReady
    const userId = authId()
    storyLoaded.value = false
    storyAccount.value = null
    storyRevision.value = 0
    storyDirty = false
    storyError.value = ''
    city.value = createCity()
    campaignSave.value = createCampaignSave()
    towerSave.value = freshTower()
    savedDecks.value = {}
    savedAlliances.value = {}
    allianceDrafts.value = {}
    savedSolo.value = {}
    soloDrafts.value = {}
    library.value = []
    libraryId.value = null
    journeyFormat.value = 'solo'
    journeyDeckId.value = null
    campaignScreen.value = 'chapter'
    storyMode.value = 'written'
    storyParity.value = false
    endingsFound.value = []
    scrapbook.value = []
    endingsOpen.value = false
    replacingCard.value = null
    districtId.value = 'pitworks'
    cityScreen.value = 'map'
    if (!userId || isGuest()) {
      const saved = readGuestSlimeStory()
      if (saved) {
        city.value = saved.city
        districtId.value = saved.city.location
        campaignSave.value = saved.campaigns
        towerSave.value = saved.tower ?? freshTower()
        savedDecks.value = saved.decks ?? {}
        savedAlliances.value = saved.alliances ?? {}
        savedSolo.value = saved.soloDecks ?? {}
        library.value = saved.library ?? []
        activeTeam.value = saved.journeyTeam ?? activeTeam.value
        journeyFormat.value = saved.journeyFormat ?? 'solo'
        journeyDeckId.value = saved.journeyDeckId ?? null
        campaignScreen.value = saved.journeyScreen ?? 'chapter'
        storyMode.value = saved.storyMode ?? 'written'
        storyParity.value = saved.storyParity ?? false
        endingsFound.value = saved.endings ?? []
        scrapbook.value = saved.scrapbook ?? []
        if (towerRun.value?.phase === 'battle') forfeitTower()
      }
      storyLoaded.value = true
      enforceCollection()
      seedLibrary()
      if (campaignRewardChoices.value) campaignScreen.value = 'aftermath'
      syncEndings()
      return
    }
    try {
      const response = await performFetch<SlimeCityStory>(
        '/api/slime-city/story',
      )
      if (!response.success || !response.data)
        throw new Error(response.message || 'Could not load your city story.')
      if (userId !== authId()) return
      city.value = response.data.city
      districtId.value = response.data.city.location
      campaignSave.value = response.data.campaigns
      activeTeam.value = response.data.journeyTeam ?? activeTeam.value
      journeyFormat.value = response.data.journeyFormat ?? 'solo'
      journeyDeckId.value = response.data.journeyDeckId ?? null
      campaignScreen.value = response.data.journeyScreen ?? 'chapter'
      towerSave.value = response.data.tower ?? freshTower()
      savedDecks.value = response.data.decks ?? {}
      savedAlliances.value = response.data.alliances ?? {}
      allianceDrafts.value = {}
      savedSolo.value = response.data.soloDecks ?? {}
      soloDrafts.value = {}
      library.value = response.data.library ?? []
      libraryId.value = null
      storyMode.value = response.data.storyMode ?? 'written'
      storyParity.value = response.data.storyParity ?? false
      endingsFound.value = response.data.endings ?? []
      scrapbook.value = response.data.scrapbook ?? []
      storyRevision.value = response.data.revision
      storyAccount.value = userId
      storyLoaded.value = true
      // A partially played Clash cannot be replayed for free after refresh.
      // Until command-by-command save/resume exists, reload forfeits this floor.
      if (towerRun.value?.phase === 'battle') forfeitTower()
      enforceCollection()
      seedLibrary()
      const selectedJourney = library.value.find(
        (item) => item.id === journeyDeckId.value,
      )
      if (
        selectedJourney &&
        selectedJourney.general === activeTeam.value &&
        libraryDeckReady(selectedJourney.id)
      )
        selectLibraryDeck(selectedJourney.id)
      else journeyDeckId.value = null
      if (campaignRewardChoices.value) campaignScreen.value = 'aftermath'
      // Runs finished before the gallery existed still earn their pages.
      syncEndings()
    } catch (error) {
      if (userId !== authId()) return
      storyError.value =
        error instanceof Error ? error.message : 'Story load failed.'
    }
  }

  function storySnapshot(): SlimeCityStory {
    return {
      version: 1,
      revision: storyRevision.value,
      city: city.value,
      campaigns: campaignSave.value,
      tower: towerSave.value,
      decks: savedDecks.value,
      alliances: savedAlliances.value,
      soloDecks: savedSolo.value,
      library: library.value,
      journeyTeam: activeTeam.value,
      journeyFormat: journeyFormat.value,
      journeyDeckId: journeyDeckId.value,
      journeyScreen: campaignScreen.value,
      unlocks: unlockMode.value,
      storyMode: storyMode.value,
      storyParity: storyParity.value,
      endings: endingsFound.value,
      scrapbook: scrapbook.value,
    }
  }

  async function flushStory(): Promise<void> {
    storySaving.value = true
    try {
      while (storyDirty && storyEditable() && storyLoaded.value) {
        storyDirty = false
        const userId = authId()
        const snapshot = storySnapshot()
        try {
          const result = await performFetch<SlimeCityStory>(
            '/api/slime-city/story',
            {
              method: 'POST',
              body: JSON.stringify(snapshot),
            },
          )
          if (userId !== authId()) return
          if (!result.success || !result.data)
            throw new Error(result.message || 'City story was not saved.')
          storyRevision.value = result.data.revision
          storyError.value = ''
        } catch (error) {
          if (userId !== authId()) return
          storyError.value =
            error instanceof Error ? error.message : 'Story save failed.'
          storyLoaded.value = false
          storyDirty = false
          return
        }
      }
    } finally {
      storySaving.value = false
    }
  }

  function persistStory(): void {
    if (!storyLoaded.value) return
    if (!authId() || isGuest()) {
      if (!writeGuestSlimeStory(storySnapshot()))
        storyError.value = 'Could not save this guest journey on this device.'
      else storyError.value = ''
      return
    }
    if (storyAccount.value !== authId()) return
    storyDirty = true
    if (!storyWrite) {
      storyWrite = flushStory().finally(() => {
        storyWrite = null
        if (storyDirty && storyLoaded.value) persistStory()
      })
    }
  }
  const campaignBout = ref<{
    team: TeamId
    index: number
    foe: TeamId
    choice: CampaignApproach
  } | null>(null)
  const lastCampaign = ref<TeamId | null>(null)
  const campaignScreen = ref<CampaignScreen>('chapter')
  const seed = ref(rollSeed())
  /** t-003 objective variants for the next match; all off by default. */
  const rules = ref<RuleVariants>({ ...DEFAULT_RULES })
  const match = ref(
    createMatch(
      mode.value,
      activeTeam.value,
      enemyTeam.value,
      seed.value,
      rules.value,
    ),
  )
  const selectedCard = ref<string | null>(null)
  const previewOpen = ref(false)
  /** The board token whose card is open in the inspector. */
  const selectedUnit = ref<number | null>(null)
  /** The hand card being dragged, so the board can light its landing squares. */
  const dragCard = ref<string | null>(null)
  const running = ref(false)
  /** The how-to-play panel opens once per format for a first-time tester. */
  const guideOpen = ref(false)
  const guideSeen = new Set<ModeId>()
  let interval: ReturnType<typeof setInterval> | undefined

  const campaignStory = computed(() => FACTION_CAMPAIGNS[activeTeam.value])
  const campaignState = computed(() => campaignSave.value[activeTeam.value])
  const geneRiotCurrent = computed(() =>
    activeTeam.value === 'catgirls' ? geneRiotScene(campaignState.value) : null,
  )
  const geneRiotText = computed(() =>
    geneRiotCurrent.value
      ? geneRiotSceneText(campaignState.value, geneRiotCurrent.value)
      : '',
  )
  const geneRiotOutcome = computed(() =>
    activeTeam.value === 'catgirls'
      ? geneRiotLastOutcome(campaignState.value)
      : null,
  )
  function chooseGeneRiotBeat(id: GeneRiotPick): void {
    if (
      !storyEditable() ||
      activeTeam.value !== 'catgirls' ||
      campaignRewardChoices.value
    )
      return
    const next = chooseGeneRiotScene(campaignSave.value, id)
    if (next === campaignSave.value) return
    campaignSave.value = next
    persistStory()
  }
  const bloodfairyCurrent = computed(() =>
    activeTeam.value === 'bloodfairies'
      ? bloodfairyBeat(campaignState.value)
      : null,
  )
  const ironjawCurrent = computed(() =>
    activeTeam.value === 'ironjaw' ? ironjawBeat(campaignState.value) : null,
  )
  const riotCurrent = computed(() =>
    activeTeam.value === 'riot' ? riotBeat(campaignState.value) : null,
  )
  const undertowCurrent = computed(() =>
    activeTeam.value === 'undertow' ? undertowBeat(campaignState.value) : null,
  )
  const exchangeCurrent = computed(() =>
    activeTeam.value === 'exchange' ? exchangeBeat(campaignState.value) : null,
  )
  const campaignJourneyCurrent = computed(
    () =>
      geneRiotCurrent.value ??
      bloodfairyCurrent.value ??
      ironjawCurrent.value ??
      riotCurrent.value ??
      undertowCurrent.value ??
      exchangeCurrent.value,
  )
  /** After the crew's existing scenes, an Alliance gets its own authored
   * decision before the chapter battle. Solo skips this beat. */
  const campaignAllianceCurrent = computed(() =>
    journeyFormat.value === 'alliance' &&
    activeChapter.value &&
    !campaignJourneyCurrent.value &&
    !campaignRewardChoices.value
      ? allianceStoryScene(
          campaignSave.value,
          activeTeam.value,
          selectedJourneyAlliance.value.ally,
        )
      : null,
  )
  const campaignAllianceConsequence = computed(() =>
    allianceStoryPlan(
      campaignSave.value,
      activeTeam.value,
      campaignSave.value[activeTeam.value].wins,
    ),
  )
  const campaignAllianceAftermath = computed(() => {
    const state = campaignSave.value[activeTeam.value]
    if (!state.lastResult) return null
    const chapter = state.lastResult === 'player' ? state.wins - 1 : state.wins
    return allianceStoryAftermath(
      campaignSave.value,
      activeTeam.value,
      chapter,
      state.lastResult,
    )
  })
  function chooseCampaignAlliance(id: AllianceStoryPick): void {
    if (
      !storyEditable() ||
      view.value !== 'campaign' ||
      campaignBout.value ||
      !campaignAllianceCurrent.value
    )
      return
    const next = chooseAllianceStory(
      campaignSave.value,
      activeTeam.value,
      campaignAllianceCurrent.value.ally,
      id,
    )
    if (next === campaignSave.value) return
    campaignSave.value = next
    persistStory()
  }
  const campaignJourneyText = computed(() =>
    geneRiotCurrent.value
      ? geneRiotText.value
      : bloodfairyCurrent.value
        ? bloodfairySceneText(campaignState.value, bloodfairyCurrent.value)
        : ironjawCurrent.value
          ? ironjawSceneText(campaignState.value, ironjawCurrent.value)
          : riotCurrent.value
            ? riotSceneText(campaignState.value, riotCurrent.value)
            : undertowCurrent.value
              ? undertowSceneText(campaignState.value, undertowCurrent.value)
              : exchangeCurrent.value
                ? exchangeSceneText(campaignState.value, exchangeCurrent.value)
                : '',
  )
  const campaignJourneyOutcome = computed(() =>
    activeTeam.value === 'catgirls'
      ? geneRiotOutcome.value
      : activeTeam.value === 'bloodfairies'
        ? bloodfairyLastOutcome(campaignState.value)
        : activeTeam.value === 'ironjaw'
          ? ironjawLastOutcome(campaignState.value)
          : activeTeam.value === 'riot'
            ? riotLastOutcome(campaignState.value)
            : activeTeam.value === 'undertow'
              ? undertowLastOutcome(campaignState.value)
              : activeTeam.value === 'exchange'
                ? exchangeLastOutcome(campaignState.value)
                : null,
  )
  const bloodfairyChorus = computed(() =>
    bloodfairyLedger(campaignSave.value.bloodfairies),
  )
  const bloodfairyStageThree = computed(
    () =>
      activeTeam.value === 'bloodfairies' &&
      bloodfairyStageThreeReveal(campaignState.value),
  )
  const ironjawShift = computed(() => ironjawLedger(campaignSave.value.ironjaw))
  const riotShow = computed(() => riotLedger(campaignSave.value.riot))
  const undertowSignal = computed(() =>
    undertowLedger(campaignSave.value.undertow),
  )
  const exchangeAppetite = computed(() =>
    exchangeLedger(campaignSave.value.exchange),
  )
  function chooseCampaignJourneyBeat(id: GeneRiotPick): void {
    if (
      !storyEditable() ||
      campaignBout.value ||
      campaignRewardChoices.value ||
      view.value !== 'campaign'
    )
      return
    const next =
      activeTeam.value === 'catgirls'
        ? chooseGeneRiotScene(campaignSave.value, id)
        : activeTeam.value === 'bloodfairies'
          ? chooseBloodfairyBeat(campaignSave.value, id)
          : activeTeam.value === 'ironjaw'
            ? chooseIronjawBeat(campaignSave.value, id)
            : activeTeam.value === 'riot'
              ? chooseRiotBeat(campaignSave.value, id)
              : activeTeam.value === 'undertow'
                ? chooseUndertowBeat(campaignSave.value, id)
                : activeTeam.value === 'exchange'
                  ? chooseExchangeBeat(campaignSave.value, id)
                  : campaignSave.value
    if (next === campaignSave.value) return
    campaignSave.value = next
    persistStory()
  }
  const campaignRewardChoices = computed(() =>
    campaignCardChoices(campaignSave.value, activeTeam.value),
  )
  function chooseCampaignCardReward(id: string): void {
    if (!storyEditable()) return
    const next = chooseCampaignCard(campaignSave.value, activeTeam.value, id)
    if (next === campaignSave.value) return
    campaignSave.value = next
    persistStory()
  }
  const campaignAftermath = computed(() =>
    campaignAftermathFor(campaignSave.value, activeTeam.value),
  )
  const campaignConversation = computed(() =>
    campaignConversationFor(campaignSave.value, activeTeam.value),
  )
  const campaignFavors = computed(() =>
    campaignFavorsFor(campaignSave.value, activeTeam.value),
  )
  const favorSelection = ref<{
    team: TeamId
    wins: number
    index: number
  } | null>(null)
  const campaignFavorIndex = computed(() => {
    const saved = favorSelection.value
    const wins = campaignSave.value[activeTeam.value].wins
    return saved?.team === activeTeam.value &&
      saved.wins === wins &&
      campaignFavors.value.some((favor) => favor.chapterIndex === saved.index)
      ? saved.index
      : wins - 1
  })
  const campaignEcho = computed(() =>
    campaignEchoFor(
      campaignSave.value,
      activeTeam.value,
      campaignFavorIndex.value,
    ),
  )
  function selectCampaignFavor(index: number): void {
    // A finished campaign still picks which favor its city bouts carry.
    if (!storyEditable() || (!activeChapter.value && !campaignLegacy.value))
      return
    if (!campaignFavors.value.some((favor) => favor.chapterIndex === index))
      return
    favorSelection.value = {
      team: activeTeam.value,
      wins: campaignSave.value[activeTeam.value].wins,
      index,
    }
  }
  const activeChapter = computed(() =>
    campaignChapter(campaignSave.value, activeTeam.value),
  )
  /** The next chapter's authored battlefield and its plain-words rules. */
  const chapterField = computed(() => {
    if (!activeChapter.value) return null
    const field = campaignBattlefield(
      activeTeam.value,
      campaignSave.value[activeTeam.value].wins,
    )
    return field
      ? {
          ...field,
          label: OBJECTIVE_LABELS[field.objective],
          lines: describeBattlefield(field),
          // Story bouts are SOLO CLASH: no grid battlefield to rebuild.
          applies: false,
        }
      : null
  })
  /** The battlefield of the campaign bout being fought, if it was rebuilt. */
  const boutField = computed(() => {
    const current = campaignBout.value
    if (!current || mode.value === 'turf') return null
    const field = campaignBattlefield(current.team, current.index)
    return field ? { ...field, label: OBJECTIVE_LABELS[field.objective] } : null
  })
  const campaignAllianceFinale = computed(() =>
    allianceStoryFinale(campaignSave.value, activeTeam.value),
  )
  const campaignFinale = computed(() => {
    const ending = campaignEnding(campaignSave.value, activeTeam.value)
    if (!ending) return null
    const epilogue =
      activeTeam.value === 'catgirls'
        ? geneRiotEpilogue(campaignState.value)
        : activeTeam.value === 'bloodfairies'
          ? bloodfairyEpilogue(campaignState.value)
          : activeTeam.value === 'ironjaw'
            ? ironjawEpilogue(campaignState.value)
            : activeTeam.value === 'riot'
              ? riotEpilogue(campaignState.value)
              : activeTeam.value === 'undertow'
                ? undertowEpilogue(campaignState.value)
                : activeTeam.value === 'exchange'
                  ? exchangeEpilogue(campaignState.value)
                  : ''
    return [ending, epilogue].filter(Boolean).join(' ')
  })
  /** A finished campaign's chosen favor, carried into rivals and contracts. */
  const campaignLegacy = computed(() =>
    campaignLegacyFor(
      campaignSave.value,
      activeTeam.value,
      campaignFavorIndex.value,
    ),
  )
  /**
   * Fold finished crew runs into the endings gallery and scrapbook. The
   * active crew's chosen legacy favor is known; other crews keep theirs.
   */
  function syncEndings(): void {
    const next = recordFinishedRuns(
      { endings: endingsFound.value, scrapbook: scrapbook.value },
      campaignSave.value,
      campaignLegacy.value
        ? { [activeTeam.value]: campaignLegacy.value.echo.title }
        : {},
    )
    if (!next.changed) return
    endingsFound.value = next.endings
    scrapbook.value = next.scrapbook
    persistStory()
  }
  watch([campaignSave, campaignLegacy], syncEndings)
  const campaignDistrict = computed(() =>
    activeChapter.value ? CAMPAIGN_DISTRICTS[activeChapter.value.foe] : null,
  )
  const campaignAtDestination = computed(
    () =>
      campaignDistrict.value !== null &&
      city.value.location === campaignDistrict.value &&
      !city.value.pendingStreet &&
      !city.value.pendingAftermath &&
      !cityCrisis(city.value) &&
      !cityFinale(city.value),
  )
  const team = computed(() => teamById(activeTeam.value))
  const enemy = computed(() => teamById(enemyTeam.value))
  const cards = computed(() =>
    CARDS.filter(
      (item) => item.team === activeTeam.value || item.team === 'mercenary',
    ),
  )
  const starterCards = (id: TeamId): string[] => {
    const starter = teamById(id)
    return [...starter.creatures, ...starter.special]
  }
  const currentDeck = computed(
    () => savedDecks.value[activeTeam.value] ?? starterCards(activeTeam.value),
  )
  const currentDeckProblems = computed(() =>
    loadoutProblems(activeTeam.value, currentDeck.value),
  )
  function isStarterCard(id: string): boolean {
    return STARTER_CARD_IDS.has(id)
  }
  function isCardUnlocked(id: string): boolean {
    return isStarterCard(id) || progress.value.cards.includes(id)
  }
  /**
   * Silas, 2026-11-10 PT: "everyone, including me as admin, should be
   * restricted to those base cards and then cards that they particularly
   * unlock". Once both the story and the owned cards are loaded, any saved
   * deck holding a card this account has not unlocked goes back to its
   * crew's starter, so the next save passes the server's ownership check.
   */
  function enforceCollection(): void {
    if (!storyLoaded.value || !progressLoaded.value) return
    let reset = 0
    const keep = <T>(
      saved: Partial<Record<TeamId, T>>,
      cardsOf: (deck: T) => string[],
    ): Partial<Record<TeamId, T>> => {
      const kept: Partial<Record<TeamId, T>> = {}
      for (const [team, deck] of Object.entries(saved) as [TeamId, T][])
        if (deck && cardsOf(deck).every((id) => isCardUnlocked(id)))
          kept[team] = deck
        else reset++
      return kept
    }
    savedDecks.value = keep(savedDecks.value, (deck) => deck)
    savedAlliances.value = keep(savedAlliances.value, (deck) => deck.cards)
    savedSolo.value = keep(savedSolo.value, (deck) => deck)
    // Library decks lose only the locked cards and stay as unfinished decks,
    // so a save never carries a card the server will refuse.
    let trimmed = 0
    const owned = library.value.map((deck) => {
      const cards = deck.cards.filter((id) => isCardUnlocked(id))
      if (cards.length === deck.cards.length) return deck
      trimmed++
      return { ...deck, cards }
    })
    if (trimmed) {
      library.value = owned
      reset += trimmed
    }
    if (!reset) return
    allianceDrafts.value = {}
    soloDrafts.value = {}
    deckMessage.value =
      reset +
      (reset === 1 ? ' deck held' : ' decks held') +
      ' cards you have not unlocked yet; those cards were taken out.'
    persistStory()
  }
  function selectDeckCard(id: string): void {
    if (!storyLoaded.value || !progressLoaded.value || storySaving.value) {
      deckMessage.value = 'Sign in and load your account to edit a deck.'
      return
    }
    const candidate = cards.value.find((card) => card.id === id)
    if (!candidate) return
    const inDeck = currentDeck.value.includes(id)
    if (inDeck) {
      replacingCard.value = replacingCard.value === id ? null : id
      deckMessage.value = candidate.signature
        ? 'Your crew signature stays in every legal deck.'
        : 'Now select an owned reserve of the same card type.'
      return
    }
    const source = cards.value.find((card) => card.id === replacingCard.value)
    if (!source || source.signature || source.kind !== candidate.kind) {
      deckMessage.value =
        'Choose an existing non-signature deck card of this type first.'
      return
    }
    if (!isCardUnlocked(id)) {
      deckMessage.value = 'Unlock this card in a Meat pack before using it.'
      return
    }
    const updated = currentDeck.value.map((cardId) =>
      cardId === source.id ? id : cardId,
    )
    const problems = loadoutProblems(activeTeam.value, updated)
    if (problems.length) {
      deckMessage.value = problems.join(' · ')
      return
    }
    savedDecks.value = { ...savedDecks.value, [activeTeam.value]: updated }
    replacingCard.value = null
    deckMessage.value =
      candidate.name + ' replaces ' + source.name + '. Saving…'
    persistStory()
  }
  /** Default ally for a new alliance: the next crew around the city. */
  function defaultAlly(general: TeamId): TeamId {
    const at = TEAMS.findIndex((t) => t.id === general)
    return TEAMS[(at + 1) % TEAMS.length]!.id
  }
  /** The alliance the armory shows: draft, else saved, else a starter. */
  const currentAlliance = computed<AllianceDeck>(
    () =>
      allianceDrafts.value[activeTeam.value] ??
      savedAlliances.value[activeTeam.value] ??
      allianceStarter(activeTeam.value, defaultAlly(activeTeam.value)),
  )
  const currentAllianceProblems = computed(() =>
    allianceProblems(currentAlliance.value),
  )
  /** The alliance CLASH deals: the saved legal deck, else the starter. */
  const playAlliance = computed<AllianceDeck>(
    () =>
      savedAlliances.value[activeTeam.value] ??
      allianceStarter(activeTeam.value, defaultAlly(activeTeam.value)),
  )
  const allianceCards = computed(() =>
    allianceCardPool(currentAlliance.value.general, currentAlliance.value.ally),
  )
  /** Store an edit: saved (and synced) when legal, otherwise kept as a draft. */
  function commitAlliance(deck: AllianceDeck, done: string): void {
    const problems = allianceProblems(deck)
    allianceDrafts.value = { ...allianceDrafts.value, [deck.general]: deck }
    const entry = library.value.find((item) => item.id === libraryId.value)
    if (entry) {
      library.value = library.value.map((item) =>
        item.id === entry.id ? libraryDeck(deck, item.id, item.name) : item,
      )
      persistStory()
    }
    if (problems.length) {
      deckMessage.value =
        done + ' Draft not in play until legal: ' + problems.join(' · ')
      return
    }
    savedAlliances.value = { ...savedAlliances.value, [deck.general]: deck }
    deckMessage.value =
      done + (storyLoaded.value ? ' Saving…' : ' Sign in to keep it.')
    persistStory()
  }
  /**
   * Change the second faction. General and mercenary picks stay; the old
   * second faction's cards make way for the new one's starter cards.
   */
  function setAlly(ally: TeamId): void {
    const deck = currentAlliance.value
    if (ally === deck.general || ally === deck.ally) return
    const kept = deck.cards.filter((id) => cardById(id).team !== deck.ally)
    const fill = allianceStarter(deck.general, ally).cards.filter(
      (id) => cardById(id).team === ally,
    )
    const cards = [...kept]
    for (const id of fill)
      if (cards.length < ALLIANCE_DECK_SIZE && isCardUnlocked(id))
        cards.push(id)
    commitAlliance(
      { general: deck.general, ally, cards },
      teamById(ally).name + ' are your second faction.',
    )
  }
  /** Make the second faction the general: same two factions, same cards. */
  function swapAllianceGeneral(): void {
    const next = swapGeneral(currentAlliance.value)
    commitAlliance(next, teamById(next.general).name + ' now lead as general.')
    const message = deckMessage.value
    chooseTeam(next.general)
    deckMessage.value = message
  }
  function toggleAllianceCard(id: string): void {
    const deck = currentAlliance.value
    const card = CARDS.find((entry) => entry.id === id)
    if (!card) return
    if (deck.cards.includes(id)) {
      commitAlliance(
        { ...deck, cards: deck.cards.filter((cardId) => cardId !== id) },
        card.name + ' leaves the alliance.',
      )
      return
    }
    if (!allianceCards.value.some((entry) => entry.id === id)) {
      deckMessage.value = 'Only your two factions’ cards and mercenaries fit.'
      return
    }
    if (!isCardUnlocked(id)) {
      deckMessage.value = 'Unlock this card in a Meat pack before using it.'
      return
    }
    if (deck.cards.length >= ALLIANCE_DECK_SIZE) {
      deckMessage.value =
        'The alliance is full at ' +
        ALLIANCE_DECK_SIZE +
        '. Tap a deck card to take it out first.'
      return
    }
    commitAlliance(
      { ...deck, cards: [...deck.cards, id] },
      card.name + ' joins the alliance.',
    )
  }
  function libraryName(deck: AllianceDeck): string {
    return (
      teamById(deck.general).name.split(' ')[0] +
      ' + ' +
      teamById(deck.ally).name.split(' ')[0]
    )
  }
  function newLibraryId(): string {
    return 'd' + Date.now().toString(36) + rollSeed().toString(36)
  }
  /** Older saves: their saved Alliance decks become the first library. */
  function seedLibrary(): void {
    if (library.value.length) return
    const seeds = Object.values(savedAlliances.value).filter(
      (deck): deck is AllianceDeck => !!deck,
    )
    if (!seeds.length) seeds.push(playAlliance.value)
    library.value = seeds
      .slice(0, LIBRARY_MAX_DECKS)
      .map((deck) => libraryDeck(deck, newLibraryId(), libraryName(deck)))
    persistStory()
  }
  /** Pick a library deck: it becomes the deck Clash, Campaign and Tower deal. */
  function selectLibraryDeck(id: string): void {
    const entry = library.value.find((item) => item.id === id)
    if (!entry) return
    const deck: AllianceDeck = {
      general: entry.general,
      ally: entry.ally,
      cards: [...entry.cards],
    }
    if (entry.general !== activeTeam.value) chooseTeam(entry.general)
    libraryId.value = id
    clashFormat.value = 'alliance'
    allianceDrafts.value = { ...allianceDrafts.value, [deck.general]: deck }
    if (!allianceProblems(deck).length) {
      savedAlliances.value = { ...savedAlliances.value, [deck.general]: deck }
      deckMessage.value = entry.name + ' is your deck.'
      persistStory()
    } else
      deckMessage.value =
        entry.name +
        ' needs ' +
        (ALLIANCE_DECK_SIZE - entry.cards.length) +
        ' more cards before it can play.'
  }
  function newLibraryDeck(): void {
    if (library.value.length >= LIBRARY_MAX_DECKS) {
      deckMessage.value = 'The library holds ' + LIBRARY_MAX_DECKS + ' decks.'
      return
    }
    const deck = allianceStarter(
      activeTeam.value,
      defaultAlly(activeTeam.value),
    )
    const entry = libraryDeck(
      { ...deck, cards: deck.cards.filter((id) => isCardUnlocked(id)) },
      newLibraryId(),
      'New deck ' + (library.value.length + 1),
    )
    library.value = [...library.value, entry]
    selectLibraryDeck(entry.id)
    persistStory()
  }
  function copyLibraryDeck(id: string): void {
    const entry = library.value.find((item) => item.id === id)
    if (!entry || library.value.length >= LIBRARY_MAX_DECKS) return
    const copy = libraryDeck(entry, newLibraryId(), entry.name + ' copy')
    library.value = [...library.value, copy]
    selectLibraryDeck(copy.id)
    persistStory()
  }
  function deleteLibraryDeck(id: string): void {
    library.value = library.value.filter((item) => item.id !== id)
    if (libraryId.value === id) {
      libraryId.value = null
      const next = library.value[0]
      if (next) selectLibraryDeck(next.id)
    }
    deckMessage.value = 'Deck deleted.'
    persistStory()
  }
  function renameLibraryDeck(id: string, name: string): void {
    const clean = name.trim()
    if (!clean) return
    library.value = library.value.map((item) =>
      item.id === id ? libraryDeck(item, item.id, clean) : item,
    )
    persistStory()
  }
  function libraryDeckReady(id: string): boolean {
    const entry = library.value.find((item) => item.id === id)
    return (
      !!entry &&
      !libraryDeckProblem(entry) &&
      entry.cards.length === ALLIANCE_DECK_SIZE
    )
  }
  const selectedJourneyAlliance = computed<AllianceDeck>(() => {
    const entry = library.value.find((item) => item.id === journeyDeckId.value)
    if (
      entry &&
      libraryDeckReady(entry.id) &&
      entry.general === activeTeam.value
    )
      return {
        general: entry.general,
        ally: entry.ally,
        cards: [...entry.cards],
      }
    return playAlliance.value
  })
  const journeyDeckName = computed(() => {
    if (journeyFormat.value === 'solo')
      return teamById(activeTeam.value).name + ' solo deck'
    return (
      library.value.find((item) => item.id === journeyDeckId.value)?.name ??
      'Current alliance'
    )
  })
  function setJourneyFormat(format: DeckFormat): void {
    if (!storyEditable() || (format !== 'solo' && format !== 'alliance')) return
    journeyFormat.value = format
    persistStory()
  }
  function selectJourneyDeck(id: string): void {
    if (!storyEditable()) return
    if (!id) {
      journeyDeckId.value = null
      journeyFormat.value = 'alliance'
      persistStory()
      return
    }
    const selected = library.value.find((item) => item.id === id)
    if (
      !selected ||
      selected.general !== activeTeam.value ||
      !libraryDeckReady(id)
    )
      return
    selectLibraryDeck(id)
    journeyDeckId.value = id
    journeyFormat.value = 'alliance'
    persistStory()
  }
  function showJourneyDeck(): void {
    if (journeyFormat.value === 'solo') return showSoloDeck()
    stop()
    deckFormat.value = 'alliance'
    if (journeyDeckId.value && libraryDeckReady(journeyDeckId.value))
      selectLibraryDeck(journeyDeckId.value)
    view.value = 'cards'
  }
  /** COLLECTION opens on the Alliance library; SOLO opens its crew deck. */
  function showSoloDeck(): void {
    stop()
    deckFormat.value = 'solo'
    view.value = 'cards'
  }
  /**
   * Silas, 2026-11-11 PT: "We should have prenbuilt decks, one for each
   * faction solo and a smattering of matchups." Every crew's Solo starter,
   * plus six Alliance pairings, each general leading once.
   */
  const starterDecks = computed(() => [
    ...TEAMS.map((team) => ({
      id: 'solo-' + team.id,
      general: team.id,
      ally: null as TeamId | null,
      name: team.name.split(' ')[0]!,
    })),
    ...STARTER_MATCHUPS.map(([general, ally]) => ({
      id: 'mix-' + general + '-' + ally,
      general,
      ally: ally as TeamId | null,
      name: libraryName({ general, ally, cards: [] }),
    })),
  ])
  /** The starter deck the builder is showing, when no library deck is. */
  const activeStarterId = computed(() =>
    libraryId.value
      ? null
      : deckFormat.value === 'solo'
        ? sameCards(currentSolo.value, soloStarter(activeTeam.value))
          ? 'solo-' + activeTeam.value
          : null
        : 'mix-' + activeTeam.value + '-' + currentAlliance.value.ally,
  )
  /**
   * Silas, 2026-11-11 PT: "Still not seeing how to create/edit solo decks
   * from this screen." Each crew keeps one Solo deck; once it differs from
   * the starter it sits on the YOUR DECKS shelf.
   */
  const customSoloTeams = computed(() =>
    TEAMS.map((team) => team.id).filter((team) => {
      const cards = soloDrafts.value[team] ?? savedSolo.value[team]
      return !!cards && !sameCards(cards, soloStarter(team))
    }),
  )
  const activeSoloDeck = computed<TeamId | null>(() =>
    deckFormat.value === 'solo' &&
    !libraryId.value &&
    customSoloTeams.value.includes(activeTeam.value)
      ? activeTeam.value
      : null,
  )
  function selectSoloDeck(team: TeamId): void {
    if (team !== activeTeam.value) chooseTeam(team)
    libraryId.value = null
    setDeckAlly(null)
  }
  /** Deal a prebuilt deck into the builder (and into play). */
  function dealStarterDeck(general: TeamId, ally: TeamId | null): void {
    if (general !== activeTeam.value) chooseTeam(general)
    libraryId.value = null
    if (!ally) {
      deckFormat.value = 'solo'
      clashFormat.value = 'solo'
      commitSolo(
        soloStarter(general),
        teamById(general).name + ' Solo starter is your deck.',
      )
      return
    }
    deckFormat.value = 'alliance'
    clashFormat.value = 'alliance'
    commitAlliance(
      allianceStarter(general, ally),
      libraryName({ general, ally, cards: [] }) + ' starter is your deck.',
    )
  }
  /** SOLO, or a second faction for an Alliance deck. */
  function setDeckAlly(ally: TeamId | null): void {
    if (!ally) {
      deckFormat.value = 'solo'
      clashFormat.value = 'solo'
      return
    }
    deckFormat.value = 'alliance'
    clashFormat.value = 'alliance'
    setAlly(ally)
  }
  /** Keep the deck on screen as a named library deck you can edit. */
  function copyCurrentDeck(): void {
    if (libraryId.value) {
      copyLibraryDeck(libraryId.value)
      return
    }
    if (library.value.length >= LIBRARY_MAX_DECKS) {
      deckMessage.value = 'The library holds ' + LIBRARY_MAX_DECKS + ' decks.'
      return
    }
    const deck = currentAlliance.value
    const entry = libraryDeck(
      { ...deck, cards: deck.cards.filter((id) => isCardUnlocked(id)) },
      newLibraryId(),
      libraryName(deck),
    )
    library.value = [...library.value, entry]
    selectLibraryDeck(entry.id)
    persistStory()
  }
  function restoreAllianceStarter(): void {
    commitAlliance(
      allianceStarter(activeTeam.value, currentAlliance.value.ally),
      'Starter alliance restored.',
    )
  }
  function playAllianceClash(): void {
    clashFormat.value = 'alliance'
    playClashFormat('alliance')
  }
  /** The Solo deck the armory shows: draft, else saved, else the starter. */
  const currentSolo = computed<string[]>(
    () =>
      soloDrafts.value[activeTeam.value] ??
      savedSolo.value[activeTeam.value] ??
      soloStarter(activeTeam.value),
  )
  const currentSoloProblems = computed(() =>
    soloProblems(activeTeam.value, currentSolo.value),
  )
  /** The Solo deck City, Story and the CLASH tab deal: saved, else starter. */
  const playSolo = computed<string[]>(
    () => savedSolo.value[activeTeam.value] ?? soloStarter(activeTeam.value),
  )
  const soloCards = computed(() => soloCardPool(activeTeam.value))
  function commitSolo(cards: string[], done: string): void {
    const team = activeTeam.value
    const problems = soloProblems(team, cards)
    soloDrafts.value = { ...soloDrafts.value, [team]: cards }
    if (problems.length) {
      deckMessage.value =
        done + ' Draft not in play until legal: ' + problems.join(' · ')
      return
    }
    savedSolo.value = { ...savedSolo.value, [team]: cards }
    deckMessage.value =
      done + (storyLoaded.value ? ' Saving…' : ' Sign in to keep it.')
    persistStory()
  }
  function toggleSoloCard(id: string): void {
    const cards = currentSolo.value
    const card = CARDS.find((entry) => entry.id === id)
    if (!card) return
    if (cards.includes(id)) {
      commitSolo(
        cards.filter((cardId) => cardId !== id),
        card.name + ' leaves the deck.',
      )
      return
    }
    if (!soloCards.value.some((entry) => entry.id === id)) {
      deckMessage.value = 'Only your faction’s cards and mercenaries fit.'
      return
    }
    if (!isCardUnlocked(id)) {
      deckMessage.value = 'Unlock this card in a Meat pack before using it.'
      return
    }
    if (cards.length >= SOLO_DECK_SIZE) {
      deckMessage.value =
        'The deck is full at ' +
        SOLO_DECK_SIZE +
        '. Tap a deck card to take it out first.'
      return
    }
    commitSolo([...cards, id], card.name + ' joins the deck.')
  }
  function restoreSoloStarter(): void {
    commitSolo(soloStarter(activeTeam.value), 'Starter Solo deck restored.')
  }

  /** Deal a new Clash match. Bouts set their own kind, rival and terms. */
  function launchClash(next: Omit<ClashLaunch, 'id'>): void {
    stop()
    // An abandoned City or Story bout never inherits a practice or reward
    // result.
    if (next.kind === 'practice' || next.kind === 'reward') clearBouts()
    clashResult.value = null
    lastPayout.value = null
    clashLaunch.value = { ...next, id: clashLaunch.value.id + 1 }
    view.value = 'clash'
  }
  /** Why the bout being dealt pays nothing, for the battle console. */
  const boutUnrewarded = ref('')
  /**
   * What the server actually paid for the last reward match, for the reward
   * screen: the wallet before and after settlement. capped means the daily
   * paid-bout limit recorded it without paying.
   */
  const lastPayout = ref<{ meat: number; xp: number; capped: boolean } | null>(
    null,
  )
  /**
   * Silas, 2026-11-10 PT ("Do it"): SOLO story, CAMPAIGN and TOWER fights pay
   * XP and Meat and count toward bounties, like PRACTICE. Signed in, the
   * server issues the seed and keeps the deck and terms, then replays the
   * fight before paying. A deck that borrows cards you have not unlocked, or
   * a server that cannot be reached, still deals the bout, unrewarded.
   */
  async function launchBout(next: Omit<ClashLaunch, 'id'>): Promise<void> {
    boutUnrewarded.value = ''
    const signedIn = progressLoaded.value && correctAccount()
    const alliance =
      next.format === 'alliance' ? (next.alliance ?? playAlliance.value) : null
    const cards = alliance ? alliance.cards : (next.cards ?? playSolo.value)
    if (
      !signedIn ||
      !next.bosses ||
      !(CLASH_BOUT_KINDS as readonly string[]).includes(next.kind)
    ) {
      launchClash(next)
      return
    }
    if (!cards.every((id) => isCardUnlocked(id))) {
      boutUnrewarded.value =
        'Unrewarded: this deck borrows cards you have not unlocked.'
      launchClash(next)
      return
    }
    if (progressBusy.value) {
      boutUnrewarded.value = 'Unrewarded: the last reward is still settling.'
      launchClash(next)
      return
    }
    progressBusy.value = true
    progressError.value = ''
    try {
      const result = await performFetch<{
        id: string
        teamId: TeamId
        foeId: TeamId
        seed: number
      }>('/api/slime-city/match', {
        method: 'POST',
        body: JSON.stringify({
          teamId: alliance ? alliance.general : activeTeam.value,
          foeId: next.enemy,
          clash: {
            ...(alliance
              ? { format: 'alliance', deck: alliance }
              : { format: 'solo', cards }),
            bout: { kind: next.kind as ClashBoutKind, bosses: next.bosses },
          },
        }),
      })
      if (!result.success || !result.data)
        throw new Error(result.message || 'Could not issue the bout.')
      launchClash({
        ...next,
        seed: result.data.seed,
        rewardId: result.data.id,
        ...(alliance ? { alliance } : { cards: [...cards] }),
      })
    } catch (error) {
      boutUnrewarded.value =
        'Unrewarded: ' +
        (error instanceof Error ? error.message : 'the server is unreachable.')
      launchClash(next)
    } finally {
      progressBusy.value = false
    }
  }
  /** createClash arguments for the current launch. */
  function clashSetup(launch: ClashLaunch = clashLaunch.value): {
    player: TeamId
    enemy: TeamId
    seed: number
    options: ClashOptions
  } {
    const options: ClashOptions =
      launch.format === 'alliance'
        ? {
            alliance: {
              player: launch.alliance ?? playAlliance.value,
              enemy: cpuAlliance(launch.enemy, launch.seed),
            },
          }
        : { decks: { player: launch.cards ?? playSolo.value } }
    if (launch.bosses) options.bosses = launch.bosses
    return {
      player: activeTeam.value,
      enemy: launch.enemy,
      seed: launch.seed,
      options,
    }
  }
  function rivalFor(team: TeamId): TeamId {
    return team === 'ironjaw' ? 'catgirls' : 'ironjaw'
  }
  /**
   * The CLASH tab: a reward match against the CPU when your account is
   * loaded (server-issued seed and rival, verified replay), else practice.
   */
  function playClashFormat(format: DeckFormat = clashFormat.value): void {
    clashFormat.value = format
    if (progressLoaded.value && correctAccount()) {
      void startCpuBattle(format)
      return
    }
    launchClash({
      kind: 'practice',
      format,
      enemy: rivalFor(activeTeam.value),
      seed: rollSeed(),
    })
  }
  /** A finished Clash match reports here exactly once. */
  function settleClash(launchId: number, state: ClashState): void {
    const launch = clashLaunch.value
    if (launchId !== launch.id || !state.victor || clashResult.value) return
    clashResult.value = { kind: launch.kind, victor: state.victor }
    if (launch.kind !== 'reward' && launch.rewardId)
      void finishCpuBattle(launch.rewardId, [...state.commands])
    if (launch.kind === 'tower' && towerRun.value?.phase === 'battle') {
      towerSave.value = {
        ...towerSave.value,
        run: resolveTowerBattle(towerRun.value, state.victor),
      }
      persistStory()
      return
    }
    if (launch.kind === 'reward' && launch.rewardId) {
      void finishCpuBattle(launch.rewardId, [...state.commands])
      return
    }
    settleBout(state.victor)
  }
  function restoreFounderDeck(): void {
    if (!storyLoaded.value) return
    savedDecks.value = {
      ...savedDecks.value,
      [activeTeam.value]: starterCards(activeTeam.value),
    }
    replacingCard.value = null
    deckMessage.value = 'Founder deck restored. Saving…'
    persistStory()
  }
  function testCustomDeck(): void {
    if (currentDeckProblems.value.length) {
      deckMessage.value = currentDeckProblems.value.join(' · ')
      return
    }
    stop()
    rewardMatchId.value = null
    mode.value = 'blackout'
    rules.value = { ...DEFAULT_RULES }
    seed.value = rollSeed()
    match.value = createMatch(
      'blackout',
      activeTeam.value,
      enemyTeam.value,
      seed.value,
      rules.value,
      currentDeck.value,
    )
    selectedCard.value = null
    previewOpen.value = false
    selectedUnit.value = null
    bout.value = null
    contractBout.value = null
    campaignBout.value = null
    view.value = 'arena'
    deckMessage.value = 'Practice match: no XP or Meat rewards.'
    if (!guideSeen.has('blackout')) openGuide()
  }
  const hand = computed(() => sight.value.hand)
  const inspectedCard = computed(() =>
    selectedCard.value
      ? cards.value.find((c) => c.id === selectedCard.value)
      : null,
  )
  /** The variants that change the current format. */
  const variants = computed(() =>
    RULE_VARIANTS.filter((v) => v.modes.includes(mode.value)),
  )
  /** The board as the human may see it: hidden enemies and traps redacted. */
  const sight = computed(() => observe(match.value, 'player'))
  const guide = computed(() => MODE_GUIDES[mode.value])
  const selected = computed(() =>
    match.value.units.find(
      (item) => item.id === selectedUnit.value && item.side === 'player',
    ),
  )
  /** The fighter behind the open token, as the player may see it. */
  const inspectedUnit = computed(
    () => sight.value.units.find((u) => u.id === selectedUnit.value) ?? null,
  )
  /** Arena orders for one of your creatures. */
  function orderStance(id: number, stance: Stance): void {
    if (match.value.victor) return
    const next = setStance(match.value, id, stance)
    if (next !== match.value) match.value = next
  }
  function closeUnit(): void {
    selectedUnit.value = null
  }

  const district = computed(
    () =>
      DISTRICTS.find((item) => item.id === districtId.value) || DISTRICTS[0]!,
  )
  const plan = computed(() => CITY_PLAN[districtId.value])
  const streetEvent = computed(() => streetStory(city.value))
  const aftermathEvent = computed(() => championAftermath(city.value))
  const crisisEvent = computed(() => cityCrisis(city.value))
  const finaleEvent = computed(() => cityFinale(city.value))
  const finaleResult = computed(() => cityEpilogue(city.value))
  const finaleDismissed = ref(false)
  const streetProgress = computed(
    () => Object.keys(city.value.streetChoices).length,
  )
  const boutPlan = computed(() => (bout.value ? CITY_PLAN[bout.value] : null))
  const contractPlan = computed(() => CITY_CONTRACTS[districtId.value])
  const activeContract = computed(() =>
    contractBout.value ? CITY_CONTRACTS[contractBout.value] : null,
  )
  const contractGate = computed(() =>
    contractBlocked(city.value, districtId.value),
  )
  const here = computed(() => city.value.location === districtId.value)
  const routeSteps = computed(() =>
    cityRoute(city.value.location, districtId.value),
  )
  const route = computed(() => routeSteps.value[0] ?? null)
  const gate = computed(() => gateReason(city.value, districtId.value))
  const blocked = computed(() => boutBlocked(city.value, districtId.value))
  const standing = computed(() => totalStanding(city.value))
  const heatLimit = HEAT_LIMIT
  const cityScreen = ref<CityScreen>('map')
  const cityEvent = computed<CityEvent | null>(() => {
    if (aftermathEvent.value) return 'aftermath'
    if (crisisEvent.value) return 'crisis'
    if (streetEvent.value) return 'street'
    if (finaleEvent.value) return 'finale'
    if (finaleResult.value && !finaleDismissed.value) return 'epilogue'
    return null
  })
  /** The selected district holds this crew's next story chapter. */
  const storyHere = computed(
    () => !!activeChapter.value && campaignDistrict.value === districtId.value,
  )
  const contractHere = computed(
    () =>
      here.value &&
      !streetEvent.value &&
      city.value.cleared.includes(districtId.value),
  )
  /** What the city stage shows now: the map, a pending event, or a scene. */
  const cityScene = computed<CityScene>(() => {
    if (cityScreen.value === 'map') return 'map'
    if (cityEvent.value) return cityEvent.value
    if (cityScreen.value === 'story' && storyHere.value) return 'story'
    if (cityScreen.value === 'contract' && contractHere.value) return 'contract'
    return 'district'
  })
  function arrivalScreen(): CityScreen {
    return storyHere.value ? 'story' : 'district'
  }
  /** After an event resolves mid-route, return to the map to keep walking. */
  function settleCityScreen(): void {
    if (cityScreen.value !== 'map' && !cityEvent.value && !here.value)
      cityScreen.value = 'map'
  }
  function districtStatus(raw: string): string {
    if (!(raw in CITY_PLAN)) return 'far'
    const id = raw as DistrictId
    if (city.value.location === id) return 'here'
    if (city.value.cleared.includes(id)) return 'cleared'
    if (gateReason(city.value, id)) return 'locked'
    if (streetsFrom(city.value.location).some((s) => s.to === id))
      return 'reachable'
    return 'far'
  }
  const board = computed(() =>
    Array.from({ length: match.value.width * match.value.height }, (_, i) => ({
      x: i % match.value.width,
      y: Math.floor(i / match.value.width),
    })),
  )

  function stop(): void {
    running.value = false
    if (interval) clearInterval(interval)
    interval = undefined
  }

  /** Restart the test: a new seed unless the same one is asked for. */
  function reset(sameSeed = false): void {
    stop()
    rewardMatchId.value = null
    bout.value = null
    lastBout.value = null
    contractBout.value = null
    lastContract.value = null
    campaignBout.value = null
    lastCampaign.value = null
    if (!sameSeed) seed.value = rollSeed()
    match.value = createMatch(
      mode.value,
      activeTeam.value,
      enemyTeam.value,
      seed.value,
      rules.value,
    )
    selectedCard.value = null
    previewOpen.value = false
    selectedUnit.value = null
  }

  /** Switch one rule variant and restart on the same seed to compare. */
  function toggleRule(id: keyof RuleVariants): void {
    rules.value = { ...rules.value, [id]: !rules.value[id] }
    reset(true)
  }

  function useSeed(value: number): void {
    seed.value = normalizeSeed(value)
    reset(true)
  }

  function chooseTeam(id: TeamId): void {
    activeTeam.value = id
    const journeyPicked = library.value.find(
      (item) => item.id === journeyDeckId.value,
    )
    if (journeyPicked && journeyPicked.general !== id)
      journeyDeckId.value = null
    persistStory()
    const picked = library.value.find((item) => item.id === libraryId.value)
    if (picked && picked.general !== id) libraryId.value = null
    replacingCard.value = null
    campaignScreen.value = 'chapter'
    if (enemyTeam.value === id)
      enemyTeam.value = TEAMS.find((item) => item.id !== id)?.id || 'riot'
    reset()
  }

  function chooseEnemy(id: TeamId): void {
    enemyTeam.value = id
    reset()
  }

  /** The CITY tab: from another view, return to the screen you left (or the
   *  event waiting for you); from inside the city, back out to the map. */
  function showCity(): void {
    stop()
    if (view.value === 'city') cityScreen.value = 'map'
    else if (cityEvent.value && cityScreen.value === 'map')
      cityScreen.value = 'district'
    view.value = 'city'
  }

  function showCityMap(): void {
    stop()
    cityScreen.value = 'map'
    view.value = 'city'
  }

  /** Replace the map with a full-stage scene for the selected district. */
  function enterCity(screen: CityScreen = 'district'): void {
    stop()
    cityScreen.value = screen
    view.value = 'city'
  }

  function showTower(): void {
    stop()
    view.value = 'tower'
  }
  /** VS: fight the CPU, or start and track games against other players. */
  function showVs(): void {
    stop()
    view.value = 'vs'
  }

  function beginTower(): void {
    if (!storyEditable()) return
    if (towerRun.value) return showTower()
    if (allianceProblems(playAlliance.value).length) return
    towerSave.value = {
      ...towerSave.value,
      run: startTower(playAlliance.value, rollSeed(), towerMeta.value),
    }
    persistStory()
    showTower()
  }

  function chooseTowerFloor(id: string): void {
    const run = towerRun.value
    if (!storyEditable() || !run) return
    const next = chooseTowerRoute(run, id)
    if (next === run || !next.chosen) return
    towerSave.value = { ...towerSave.value, run: next }
    persistStory()
    void launchBout({
      kind: 'tower',
      format: 'alliance',
      alliance: next.deck,
      enemy: next.chosen.foe,
      seed: (next.seed + next.floor * 997 + 13) >>> 0,
      bosses: towerBosses(next),
    })
  }

  function takeTowerSpoil(cardId: string): void {
    if (!storyEditable()) return
    const next = claimTowerSpoil(towerSave.value, cardId)
    if (next === towerSave.value) return
    towerSave.value = next
    persistStory()
  }

  function forfeitTower(): void {
    if (!storyEditable() || towerRun.value?.phase !== 'battle') return
    towerSave.value = {
      ...towerSave.value,
      run: resolveTowerBattle(towerRun.value, 'enemy'),
    }
    persistStory()
  }

  function leaveTowerWithoutSpoils(): void {
    if (!storyEditable()) return
    const next = leaveEmptyTower(towerSave.value)
    if (next === towerSave.value) return
    towerSave.value = next
    persistStory()
  }

  function showCampaign(): void {
    stop()
    campaignBout.value = null
    if (campaignRewardChoices.value) campaignScreen.value = 'aftermath'
    view.value = 'campaign'
  }

  function continueCampaign(): void {
    if (campaignRewardChoices.value) return
    campaignScreen.value = 'chapter'
    persistStory()
  }

  function showCampaignAftermath(): void {
    campaignScreen.value = 'aftermath'
    persistStory()
  }

  function showCards(): void {
    stop()
    deckFormat.value = 'alliance'
    if (!libraryId.value && library.value[0])
      selectLibraryDeck(library.value[0].id)
    view.value = 'cards'
  }
  function showRewards(): void {
    stop()
    view.value = 'rewards'
    void hydrateProgression()
  }

  /** Find the next campaign rival without skipping real city street encounters. */
  function findCampaignBattle(): void {
    if (!campaignDistrict.value) return
    stop()
    districtId.value = campaignDistrict.value
    cityScreen.value = here.value || cityEvent.value ? 'story' : 'map'
    view.value = 'city'
  }

  /** Legacy arena formats are retired: every battle is Clash. */
  function chooseMode(_id?: ModeId): void {
    playClashFormat('solo')
  }

  function openGuide(): void {
    stop()
    guideSeen.add(mode.value)
    guideOpen.value = true
  }

  function closeGuide(): void {
    guideOpen.value = false
  }

  function toggleGuide(): void {
    if (guideOpen.value) closeGuide()
    else openGuide()
  }

  /** Look at a district's dossier (travel is separate, along streets). */
  function visit(id: string): void {
    if (!(id in CITY_PLAN)) return
    districtId.value = id as DistrictId
    view.value = 'city'
  }

  function walk(): void {
    if (!storyEditable()) return
    if (!route.value) return
    const next = travel(city.value, route.value.to)
    if (next !== city.value) {
      city.value = next
      persistStory()
      if (cityEvent.value || here.value) cityScreen.value = arrivalScreen()
    }
  }

  function choose(choiceId: string): void {
    if (!storyEditable()) return
    const next = decide(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
    }
  }

  function chooseStreet(choiceId: string): void {
    if (!storyEditable()) return
    const next = decideStreet(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
      settleCityScreen()
    }
  }

  function chooseAftermath(choiceId: string): void {
    if (!storyEditable()) return
    const next = decideAftermath(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
      settleCityScreen()
    }
  }

  function chooseCrisis(choiceId: string): void {
    if (!storyEditable()) return
    const next = decideCrisis(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
      settleCityScreen()
    }
  }

  function chooseFinale(choiceId: string): void {
    if (!storyEditable()) return
    const next = decideFinale(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
    }
    finaleDismissed.value = false
  }

  function dismissFinale(): void {
    finaleDismissed.value = true
    cityScreen.value = 'map'
  }

  function revisitFinale(): void {
    finaleDismissed.value = false
    districtId.value = 'pitworks'
    cityScreen.value = 'district'
  }

  /** The format and rules a story bout written for `written` plays in. */
  function storyBout(written: ModeId): { mode: ModeId; rules: RuleVariants } {
    return {
      mode: storyMode.value === 'turf' ? 'turf' : written,
      rules: { ...DEFAULT_RULES, parity: storyParity.value },
    }
  }
  /**
   * Every City and Story bout is SOLO CLASH now (Silas, 2026-11-08 PT); the
   * written format is kept only in the story data.
   */
  /** City campaign bouts deal the deck format you picked. */
  function storyBoutLabel(_written?: ModeId): string {
    return journeyFormat.value === 'alliance' ? 'ALLIANCE CLASH' : 'SOLO CLASH'
  }
  /** Play story bouts as written or as TURF, and with or without PARITY. */
  function setStoryFormat(next: { mode?: StoryMode; parity?: boolean }): void {
    if (!storyEditable()) return
    if (next.mode) storyMode.value = next.mode
    if (next.parity !== undefined) storyParity.value = next.parity
    persistStory()
  }

  /** Fight this district's rival on its format, with your decision's terms. */
  function fightRival(): void {
    if (!storyEditable()) return
    const id = districtId.value
    if (!here.value || boutBlocked(city.value, id)) return
    const rival = CITY_PLAN[id].rival
    clearBouts()
    bout.value = id
    launchStoryClash(
      'rival',
      rival.team,
      campaignLegacyTerms(
        campaignSave.value,
        activeTeam.value,
        boutTerms(city.value, id),
        campaignFavorIndex.value,
      ),
    )
  }
  function clearBouts(): void {
    bout.value = null
    lastBout.value = null
    contractBout.value = null
    lastContract.value = null
    campaignBout.value = null
    lastCampaign.value = null
  }
  /**
   * One Journey deck format drives chapter and city fights. Written outcomes,
   * local city decisions, and faction callbacks still alter the boss terms.
   */
  function launchStoryClash(
    kind: ClashKind,
    enemy: TeamId,
    terms: BoutTerms,
  ): void {
    enemyTeam.value = enemy
    void launchBout({
      kind,
      format: journeyFormat.value,
      ...(journeyFormat.value === 'alliance'
        ? { alliance: selectedJourneyAlliance.value }
        : {}),
      enemy,
      seed: rollSeed(),
      bosses: clashBossesFromTerms(terms),
      ...(kind === 'campaign' && journeyFormat.value === 'solo'
        ? {
            cards:
              activeTeam.value === 'bloodfairies'
                ? bloodfairyStoryDeck(
                    campaignSave.value.bloodfairies,
                    campaignSoloDeck(
                      campaignSave.value,
                      activeTeam.value,
                      playSolo.value,
                    ),
                  )
                : activeTeam.value === 'ironjaw'
                  ? ironjawStoryDeck(
                      campaignSave.value.ironjaw,
                      campaignSoloDeck(
                        campaignSave.value,
                        activeTeam.value,
                        playSolo.value,
                      ),
                    )
                  : activeTeam.value === 'riot'
                    ? riotStoryDeck(
                        campaignSave.value.riot,
                        campaignSoloDeck(
                          campaignSave.value,
                          activeTeam.value,
                          playSolo.value,
                        ),
                      )
                    : activeTeam.value === 'undertow'
                      ? undertowStoryDeck(
                          campaignSave.value.undertow,
                          campaignSoloDeck(
                            campaignSave.value,
                            activeTeam.value,
                            playSolo.value,
                          ),
                        )
                      : activeTeam.value === 'exchange'
                        ? exchangeStoryDeck(
                            campaignSave.value.exchange,
                            campaignSoloDeck(
                              campaignSave.value,
                              activeTeam.value,
                              playSolo.value,
                            ),
                          )
                        : campaignSoloDeck(
                            campaignSave.value,
                            activeTeam.value,
                            playSolo.value,
                          ),
          }
        : {}),
    })
  }

  function fightContract(): void {
    if (!storyEditable()) return
    const id = districtId.value
    if (contractBlocked(city.value, id)) return
    const contract = CITY_CONTRACTS[id]
    clearBouts()
    contractBout.value = id
    launchStoryClash(
      'contract',
      contract.team,
      campaignLegacyTerms(
        campaignSave.value,
        activeTeam.value,
        contractTerms(city.value, id),
        campaignFavorIndex.value,
      ),
    )
  }
  /** One source of truth for pre-fight cards and the actual story match. */
  function campaignPreviewTerms(terms: BoutTerms): BoutTerms {
    const base = campaignBattleTerms(
      campaignSave.value,
      activeTeam.value,
      terms,
      campaignFavorIndex.value,
    )
    const prepared =
      activeTeam.value === 'catgirls'
        ? geneRiotBattleTerms(campaignSave.value.catgirls, base)
        : activeTeam.value === 'bloodfairies'
          ? bloodfairyBattleTerms(campaignSave.value.bloodfairies, base)
          : activeTeam.value === 'ironjaw'
            ? ironjawBattleTerms(campaignSave.value.ironjaw, base)
            : activeTeam.value === 'riot'
              ? riotBattleTerms(campaignSave.value.riot, base)
              : activeTeam.value === 'undertow'
                ? undertowBattleTerms(campaignSave.value.undertow, base)
                : activeTeam.value === 'exchange'
                  ? exchangeBattleTerms(campaignSave.value.exchange, base)
                  : base
    return journeyFormat.value === 'alliance'
      ? allianceStoryBattleTerms(
          campaignSave.value,
          activeTeam.value,
          selectedJourneyAlliance.value.ally,
          prepared,
        )
      : prepared
  }

  function startCampaignBattle(choiceId: CampaignApproach): void {
    if (!storyEditable()) return
    if (
      campaignBout.value ||
      campaignRewardChoices.value ||
      campaignJourneyCurrent.value ||
      campaignAllianceCurrent.value
    )
      return
    const fromCity =
      view.value === 'city' &&
      campaignAtDestination.value &&
      districtId.value === campaignDistrict.value
    if (view.value !== 'campaign' && !fromCity) return
    const teamId = activeTeam.value
    const chapter = campaignChapter(campaignSave.value, teamId)
    const choice = chapter?.choices.find((option) => option.id === choiceId)
    if (!chapter || !choice) return
    clearBouts()
    campaignBout.value = {
      team: teamId,
      foe: chapter.foe,
      index: campaignSave.value[teamId].wins,
      choice: choice.id,
    }
    launchStoryClash(
      'campaign',
      chapter.foe,
      campaignPreviewTerms(
        fromCity
          ? storyMissionTerms(city.value, districtId.value, choice.terms)
          : choice.terms,
      ),
    )
  }

  async function finishCpuBattle(id: string, commands: unknown): Promise<void> {
    progressBusy.value = true
    progressError.value = ''
    try {
      const response = await performFetch<Progression>(
        '/api/slime-city/finish',
        {
          method: 'POST',
          body: JSON.stringify({ matchId: id, commands }),
        },
      )
      if (!response.success || !response.data)
        throw new Error(response.message || 'Battle verification failed.')
      if (correctAccount()) {
        const before = progress.value
        const after = response.data
        lastPayout.value = {
          meat: after.meat - before.meat,
          xp: after.xp - before.xp,
          capped: after.lastReward.includes('cap reached'),
        }
        progress.value = after
      }
    } catch (error) {
      progressError.value =
        error instanceof Error ? error.message : 'Reward verification failed.'
    } finally {
      progressBusy.value = false
    }
  }

  /** Once a rival, contract or campaign bout ends, update only its ledger. */
  function settleBout(victor: Side | 'draw' | null = match.value.victor): void {
    if (!victor) return
    if (rewardMatchId.value) {
      const id = rewardMatchId.value
      const commands = [...match.value.commands]
      rewardMatchId.value = null
      void finishCpuBattle(id, commands)
      return
    }
    if (campaignBout.value) {
      const { team, index, foe, choice } = campaignBout.value
      campaignSave.value = resolveCampaignBattle(
        campaignSave.value,
        team,
        index,
        foe,
        choice,
        victor,
      )
      lastCampaign.value = team
      campaignBout.value = null
      campaignScreen.value = 'aftermath'
      persistStory()
      return
    }
    if (contractBout.value) {
      const id = contractBout.value
      city.value = recordContract(city.value, id, victor)
      persistStory()
      lastContract.value = id
      contractBout.value = null
      return
    }
    if (!bout.value) return
    city.value = recordBout(city.value, bout.value, victor)
    persistStory()
    lastBout.value = bout.value
    bout.value = null
  }

  function resetCity(): void {
    if (!storyEditable()) return
    city.value = createCity()
    persistStory()
    finaleDismissed.value = false
    districtId.value = 'pitworks'
    cityScreen.value = 'map'
  }

  function startDistrictMatch(): void {
    // Story district practice now opens the canonical CLASH rules.
    // The old Arena battle simulator is available explicitly under Legacy.
    view.value = 'clash'
  }

  function chooseCard(id: string): void {
    if (dealsHands(match.value) && !match.value.hands.player.includes(id))
      return
    selectedCard.value = selectedCard.value === id ? null : id
    previewOpen.value = false
    selectedUnit.value = null
  }

  function closePreview(): void {
    previewOpen.value = false
  }

  function ready(id: string): boolean {
    return (
      cardReady(match.value, 'player', id) &&
      (!dealsHands(match.value) || match.value.hands.player.includes(id))
    )
  }

  /**
   * Tap a square: with a card in hand it plays there; otherwise a token opens
   * its card. Creatures move and fight on their own, so there is nothing else.
   */
  function touchSquare(x: number, y: number): void {
    if (selectedCard.value) {
      if (match.value.victor) return
      const result = deploy(match.value, selectedCard.value, x, y)
      if (result !== match.value) {
        match.value = result
        previewOpen.value = false
        selectedCard.value = null
        settleBout()
        answerTurf()
      }
      return
    }
    const unit = sight.value.units.find((u) => u.x === x && u.y === y)
    selectedUnit.value = unit && unit.id !== selectedUnit.value ? unit.id : null
  }

  /** Drag-and-drop: a card dropped on a square plays there if it can. */
  function dropCard(id: string, x: number, y: number): boolean {
    if (match.value.victor || !ready(id)) return false
    const result = deploy(match.value, id, x, y)
    if (result === match.value) return false
    match.value = result
    selectedCard.value = null
    previewOpen.value = false
    settleBout()
    answerTurf()
    return true
  }

  /** TURF: one token a turn, so placing yours hands the move to the CPU. */
  function answerTurf(): void {
    if (match.value.mode === 'turf' && !match.value.victor) nextRound()
  }

  function unmask(): void {
    if (selectedUnit.value === null) return
    match.value = reveal(match.value, selectedUnit.value)
  }

  /** Toss a card onto the discard pile; it is replaced at the next draw. */
  function markHandDiscard(id: string): void {
    if (match.value.victor) return
    const result = toggleHandDiscard(match.value, id)
    if (result !== match.value) {
      match.value = result
      if (selectedCard.value === id) {
        selectedCard.value = null
        previewOpen.value = false
      }
    }
  }
  /** Take the most recently tossed card back into the hand. */
  function undoDiscard(): void {
    const last = match.value.markedDiscards.player.at(-1)
    if (last) markHandDiscard(last)
  }

  function nextRound(): void {
    if (running.value || match.value.victor) return
    match.value = advance(match.value)
    if (selectedCard.value && !ready(selectedCard.value)) {
      selectedCard.value = null
      previewOpen.value = false
    }
    settleBout()
  }

  /** One fixed BLOODRUSH tick; the timer calls this and nothing else. */
  function tick(): void {
    if (match.value.victor) return stop()
    match.value = advance(match.value)
    if (match.value.victor) {
      stop()
      settleBout()
    }
  }

  function toggleRush(): void {
    if (mode.value !== 'bloodrush' || match.value.victor) return
    if (running.value) return stop()
    guideOpen.value = false
    running.value = true
    interval = setInterval(tick, RUSH_TICK_MS)
  }

  function unitLabel(id: string): string {
    return cardById(id).name
  }

  watch(view, (next, before) => {
    if (
      before === 'clash' &&
      next !== 'clash' &&
      clashLaunch.value.kind === 'tower'
    )
      forfeitTower()
  })

  watch(
    () => authId(),
    () => {
      progressAccount.value = null
      progressLoaded.value = false
      progress.value = newProgression()
      rewardMatchId.value = null
      void hydrateProgression()
      void hydrateStory()
    },
  )

  void hydrateStory()

  function dispose(): void {
    stop()
  }

  return {
    view,
    activeTeam,
    enemyTeam,
    mode,
    districtId,
    city,
    progress,
    progressLoaded,
    progressBusy,
    progressError,
    rewardMatchId,
    startCpuBattle,
    challengeList,
    evergreenList,
    level,
    nextLevel,
    packAffordable,
    packPrice,
    cardRarity,
    hydrateProgression,
    claimReward,
    purchasePack,
    bout,
    lastBout,
    boutPlan,
    contractBout,
    lastContract,
    contractPlan,
    activeContract,
    contractGate,
    campaignSave,
    towerSave,
    towerRun,
    towerMeta,
    towerOptions,
    towerRewards,
    beginTower,
    chooseTowerFloor,
    takeTowerSpoil,
    leaveTowerWithoutSpoils,
    forfeitTower,
    showTower,
    showVs,
    currentDeck,
    currentDeckProblems,
    replacingCard,
    deckMessage,
    isStarterCard,
    isCardUnlocked,
    selectDeckCard,
    restoreFounderDeck,
    testCustomDeck,
    deckFormat,
    library,
    libraryId,
    selectLibraryDeck,
    newLibraryDeck,
    copyLibraryDeck,
    deleteLibraryDeck,
    renameLibraryDeck,
    libraryDeckReady,
    showSoloDeck,
    showJourneyDeck,
    libraryMax: LIBRARY_MAX_DECKS,
    clashFormat,
    hydrateClashFormat,
    setDefaultClashFormat,
    journeyFormat,
    journeyDeckId,
    journeyDeckName,
    selectedJourneyAlliance,
    setJourneyFormat,
    selectJourneyDeck,
    currentAlliance,
    currentAllianceProblems,
    playAlliance,
    allianceCards,
    setAlly,
    swapAllianceGeneral,
    toggleAllianceCard,
    restoreAllianceStarter,
    starterDecks,
    activeStarterId,
    dealStarterDeck,
    setDeckAlly,
    copyCurrentDeck,
    customSoloTeams,
    activeSoloDeck,
    selectSoloDeck,
    playAllianceClash,
    currentSolo,
    currentSoloProblems,
    playSolo,
    soloCards,
    toggleSoloCard,
    restoreSoloStarter,
    clashLaunch,
    boutUnrewarded,
    lastPayout,
    clashResult,
    clashSetup,
    playClashFormat,
    settleClash,
    unlockMode,
    storyMode,
    storyParity,
    storyBout,
    storyBoutLabel,
    setStoryFormat,
    storyLoaded,
    storySaving,
    storyError,
    hydrateStory,
    campaignBout,
    lastCampaign,
    campaignScreen,
    continueCampaign,
    showCampaignAftermath,
    campaignStory,
    campaignState,
    campaignRewardChoices,
    chooseCampaignCardReward,
    geneRiotCurrent,
    geneRiotText,
    geneRiotOutcome,
    chooseGeneRiotBeat,
    bloodfairyCurrent,
    bloodfairyChorus,
    bloodfairyStageThree,
    ironjawCurrent,
    ironjawShift,
    riotCurrent,
    riotShow,
    undertowCurrent,
    undertowSignal,
    exchangeCurrent,
    exchangeAppetite,
    campaignJourneyCurrent,
    campaignAllianceCurrent,
    campaignAllianceConsequence,
    campaignAllianceAftermath,
    chooseCampaignAlliance,
    campaignPreviewTerms,
    campaignJourneyText,
    campaignJourneyOutcome,
    chooseCampaignJourneyBeat,
    campaignConversation,
    campaignAftermath,
    campaignEcho,
    campaignFavors,
    campaignFavorIndex,
    campaignLegacy,
    selectCampaignFavor,
    endingsFound,
    scrapbook,
    endingsOpen,
    activeChapter,
    campaignFinale,
    campaignAllianceFinale,
    chapterField,
    boutField,
    campaignDistrict,
    campaignAtDestination,
    plan,
    streetEvent,
    aftermathEvent,
    crisisEvent,
    finaleEvent,
    finaleResult,
    finaleDismissed,
    streetProgress,
    cityScreen,
    cityEvent,
    cityScene,
    storyHere,
    contractHere,
    showCityMap,
    enterCity,
    here,
    route,
    routeSteps,
    gate,
    blocked,
    standing,
    heatLimit,
    districtStatus,
    seed,
    rules,
    variants,
    keywords: KEYWORDS,
    match,
    sight,
    guide,
    selectedCard,
    previewOpen,
    selectedUnit,
    dragCard,
    inspectedUnit,
    orderStance,
    closeUnit,
    running,
    guideOpen,
    team,
    enemy,
    cards,
    collectionSize: CARDS.length,
    baseCollectionSize: BASE_CARD_IDS.length,
    hand,
    inspectedCard,
    selected,
    district,
    board,
    teams: TEAMS,
    modes: PLAYER_MODES,
    districts: DISTRICTS,
    reset,
    toggleRule,
    useSeed,
    stop,
    dispose,
    chooseTeam,
    chooseEnemy,
    chooseMode,
    openGuide,
    closeGuide,
    toggleGuide,
    visit,
    walk,
    choose,
    chooseStreet,
    chooseAftermath,
    chooseCrisis,
    chooseFinale,
    dismissFinale,
    revisitFinale,
    fightRival,
    fightContract,
    showCampaign,
    findCampaignBattle,
    startCampaignBattle,
    resetCity,
    startDistrictMatch,
    showCity,
    showCards,
    showRewards,
    chooseCard,
    closePreview,
    ready,
    touchSquare,
    dropCard,
    unmask,
    nextRound,
    markHandDiscard,
    undoDiscard,
    tick,
    toggleRush,
    unitLabel,
  }
})
