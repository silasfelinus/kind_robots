import { defineStore } from 'pinia'
import {
  canBuyPack,
  currentChallenges,
  levelFor,
  newProgression,
  nextLevelXp,
  PACK_COST,
  rarityOf,
  type Progression,
} from '../utils/slimeCity/progression'
import {
  campaignChapter,
  campaignEnding,
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
  type CampaignApproach,
} from '../utils/slimeCity/campaign'
import type { SlimeCityStory } from '../utils/slimeCity/storySave'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  advance,
  attack,
  mayAttack,
  blowDamage,
  legalNeighbor,
  canBulldozeInto,
  cardById,
  cardReady,
  CARDS,
  loadoutProblems,
  createMatch,
  DEFAULT_RULES,
  deploy,
  DISTRICTS,
  KEYWORDS,
  MODE_GUIDES,
  PLAYER_MODES,
  move,
  normalizeSeed,
  observe,
  reveal,
  RULE_VARIANTS,
  RUSH_TICK_MS,
  TEAMS,
  teamById,
  unitAt,
  type ModeId,
  type RuleVariants,
  type TeamId,
} from '../utils/slimeCity/prototypes'
import {
  applyTerms,
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
  const view = ref<'city' | 'arena' | 'cards' | 'campaign' | 'rewards'>('city')
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
  async function startCpuBattle(): Promise<void> {
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
        body: JSON.stringify({ teamId: activeTeam.value }),
      })
      if (!result.success || !result.data)
        throw new Error(result.message || 'Could not issue CPU battle.')
      stop()
      mode.value = 'blackout'
      rules.value = { ...DEFAULT_RULES }
      enemyTeam.value = result.data.foeId
      seed.value = result.data.seed
      reset(true)
      rewardMatchId.value = result.data.id
      view.value = 'arena'
      if (!guideSeen.has('blackout')) openGuide()
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
  const savedDecks = ref<Partial<Record<TeamId, string[]>>>({})
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
    savedDecks.value = {}
    replacingCard.value = null
    districtId.value = 'pitworks'
    if (!userId || isGuest()) return
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
      savedDecks.value = response.data.decks ?? {}
      storyRevision.value = response.data.revision
      storyAccount.value = userId
      storyLoaded.value = true
    } catch (error) {
      if (userId !== authId()) return
      storyError.value =
        error instanceof Error ? error.message : 'Story load failed.'
    }
  }

  async function flushStory(): Promise<void> {
    storySaving.value = true
    try {
      while (storyDirty && storyEditable() && storyLoaded.value) {
        storyDirty = false
        const userId = authId()
        const snapshot: SlimeCityStory = {
          version: 1,
          revision: storyRevision.value,
          city: city.value,
          campaigns: campaignSave.value,
          decks: savedDecks.value,
        }
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
    if (!storyLoaded.value || storyAccount.value !== authId()) return
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
  const selectedUnit = ref<number | null>(null)
  const targetUnit = ref<number | null>(null)
  const running = ref(false)
  /** The how-to-play panel opens once per format for a first-time tester. */
  const guideOpen = ref(false)
  const guideSeen = new Set<ModeId>()
  let interval: ReturnType<typeof setInterval> | undefined

  const campaignStory = computed(() => FACTION_CAMPAIGNS[activeTeam.value])
  const campaignState = computed(() => campaignSave.value[activeTeam.value])
  const activeChapter = computed(() =>
    campaignChapter(campaignSave.value, activeTeam.value),
  )
  const campaignFinale = computed(() =>
    campaignEnding(campaignSave.value, activeTeam.value),
  )
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
    CARDS.filter((item) => item.team === activeTeam.value),
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
  function isFounderCard(id: string): boolean {
    const card = CARDS.find((entry) => entry.id === id)
    return !!card && starterCards(card.team).includes(id)
  }
  function isCardUnlocked(id: string): boolean {
    return isFounderCard(id) || progress.value.cards.includes(id)
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
      deckMessage.value = 'Unlock this reserve in a Meat pack before using it.'
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
    targetUnit.value = null
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
  const attackTargets = computed(() => {
    if (mode.value !== 'blackout' || !selected.value) return []
    return sight.value.units
      .filter(
        (unit) =>
          unit.side === 'enemy' &&
          unit.known &&
          match.value.units.some(
            (actual) =>
              actual.id === unit.id &&
              mayAttack(match.value, selected.value!, actual),
          ),
      )
      .map((unit) => unit.id)
  })
  const selectedTarget = computed(() =>
    targetUnit.value === -1
      ? match.value.monster
      : match.value.units.find((u) => u.id === targetUnit.value),
  )
  const attackPreview = computed(() =>
    selected.value && selectedTarget.value
      ? blowDamage(match.value, selected.value, selectedTarget.value)
      : 0,
  )
  const canShoveTarget = computed(() => {
    const unit = selected.value
    const target = selectedTarget.value
    return (
      !!unit &&
      !!target &&
      'side' in target &&
      canBulldozeInto(match.value, unit, target.x, target.y)
    )
  })
  function shoveSelected(): void {
    if (!selected.value || !selectedTarget.value || !canShoveTarget.value)
      return
    const target = selectedTarget.value
    const next = move(match.value, selected.value.id, target.x, target.y)
    if (next === match.value) return
    match.value = next
    targetUnit.value = null
    if (!next.units.some((u) => u.id === selectedUnit.value && u.ap > 0))
      selectedUnit.value = null
    settleBout()
  }

  function canMoveTo(x: number, y: number): boolean {
    const fighter = selected.value
    return (
      !!fighter &&
      mode.value === 'blackout' &&
      fighter.ap > 0 &&
      legalNeighbor(fighter, { x, y }) &&
      !match.value.units.some((u) => u.x === x && u.y === y) &&
      !(match.value.monster?.x === x && match.value.monster?.y === y)
    )
  }

  function chooseAttackTarget(id: number): void {
    if (id === -1) {
      if (
        selected.value &&
        match.value.monster &&
        mayAttack(match.value, selected.value, match.value.monster)
      )
        targetUnit.value = -1
      return
    }
    if (attackTargets.value.includes(id)) targetUnit.value = id
  }
  function attackSelected(): void {
    if (selectedUnit.value === null || targetUnit.value === null) return
    const next = attack(match.value, selectedUnit.value, targetUnit.value)
    if (next !== match.value) {
      match.value = next
      targetUnit.value = null
      settleBout()
    }
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
    targetUnit.value = null
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
    replacingCard.value = null
    if (enemyTeam.value === id)
      enemyTeam.value = TEAMS.find((item) => item.id !== id)?.id || 'riot'
    reset()
  }

  function chooseEnemy(id: TeamId): void {
    enemyTeam.value = id
    reset()
  }

  function showCity(): void {
    stop()
    view.value = 'city'
  }

  function showCampaign(): void {
    stop()
    campaignBout.value = null
    view.value = 'campaign'
  }

  function showCards(): void {
    stop()
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
    view.value = 'city'
  }

  function chooseMode(id: ModeId): void {
    mode.value = id
    view.value = 'arena'
    reset()
    if (!guideSeen.has(id)) openGuide()
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
    }
  }

  function chooseAftermath(choiceId: string): void {
    if (!storyEditable()) return
    const next = decideAftermath(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
    }
  }

  function chooseCrisis(choiceId: string): void {
    if (!storyEditable()) return
    const next = decideCrisis(city.value, choiceId)
    if (next !== city.value) {
      city.value = next
      persistStory()
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
  }

  function revisitFinale(): void {
    finaleDismissed.value = false
    districtId.value = 'pitworks'
  }

  /** Fight this district's rival on its format, with your decision's terms. */
  function fightRival(): void {
    if (!storyEditable()) return
    const id = districtId.value
    if (!here.value || boutBlocked(city.value, id)) return
    const rival = CITY_PLAN[id].rival
    stop()
    mode.value = rival.mode
    seed.value = rollSeed()
    const fresh = createMatch(
      rival.mode,
      activeTeam.value,
      rival.team,
      seed.value,
      rules.value,
    )
    match.value = applyTerms(fresh, boutTerms(city.value, id))
    selectedCard.value = null
    selectedUnit.value = null
    bout.value = id
    lastBout.value = null
    contractBout.value = null
    lastContract.value = null
    view.value = 'arena'
    if (!guideSeen.has(rival.mode)) openGuide()
  }

  function fightContract(): void {
    if (!storyEditable()) return
    const id = districtId.value
    if (contractBlocked(city.value, id)) return
    stop()
    mode.value = 'blackout'
    seed.value = rollSeed()
    const contract = CITY_CONTRACTS[id]
    match.value = applyTerms(
      createMatch(
        'blackout',
        activeTeam.value,
        contract.team,
        seed.value,
        rules.value,
      ),
      contractTerms(city.value, id),
    )
    selectedCard.value = null
    previewOpen.value = false
    selectedUnit.value = null
    targetUnit.value = null
    bout.value = null
    lastBout.value = null
    contractBout.value = id
    lastContract.value = null
    view.value = 'arena'
    if (!guideSeen.has('blackout')) openGuide()
  }
  function startCampaignBattle(choiceId: CampaignApproach): void {
    if (!storyEditable()) return
    if (campaignBout.value) return
    const fromCity =
      view.value === 'city' &&
      campaignAtDestination.value &&
      districtId.value === campaignDistrict.value
    if (view.value !== 'campaign' && !fromCity) return
    const teamId = activeTeam.value
    const chapter = campaignChapter(campaignSave.value, teamId)
    const choice = chapter?.choices.find((option) => option.id === choiceId)
    if (!chapter || !choice) return
    stop()
    mode.value = 'blackout'
    rules.value = { ...DEFAULT_RULES }
    enemyTeam.value = chapter.foe
    seed.value = rollSeed()
    match.value = applyTerms(
      createMatch('blackout', teamId, chapter.foe, seed.value, rules.value),
      fromCity
        ? storyMissionTerms(city.value, districtId.value, choice.terms)
        : choice.terms,
    )
    selectedCard.value = null
    selectedUnit.value = null
    targetUnit.value = null
    previewOpen.value = false
    bout.value = null
    lastBout.value = null
    contractBout.value = null
    lastContract.value = null
    campaignBout.value = {
      team: teamId,
      foe: chapter.foe,
      index: campaignSave.value[teamId].wins,
      choice: choice.id,
    }
    lastCampaign.value = null
    view.value = 'arena'
    if (!guideSeen.has('blackout')) openGuide()
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
      if (correctAccount()) progress.value = response.data
    } catch (error) {
      progressError.value =
        error instanceof Error ? error.message : 'Reward verification failed.'
    } finally {
      progressBusy.value = false
    }
  }

  /** Once a rival, contract or campaign bout ends, update only its ledger. */
  function settleBout(): void {
    if (!match.value.victor) return
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
        match.value.victor,
      )
      lastCampaign.value = team
      persistStory()
      campaignBout.value = null
      return
    }
    if (contractBout.value) {
      const id = contractBout.value
      city.value = recordContract(city.value, id, match.value.victor)
      persistStory()
      lastContract.value = id
      contractBout.value = null
      return
    }
    if (!bout.value) return
    city.value = recordBout(city.value, bout.value, match.value.victor)
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
  }

  function startDistrictMatch(): void {
    view.value = 'arena'
    reset()
    if (!guideSeen.has(mode.value)) openGuide()
  }

  function chooseCard(id: string): void {
    if (mode.value === 'blackout' && !match.value.hands.player.includes(id))
      return
    selectedCard.value = selectedCard.value === id ? null : id
    previewOpen.value = !!selectedCard.value && mode.value === 'blackout'
    selectedUnit.value = null
    targetUnit.value = null
  }

  function closePreview(): void {
    previewOpen.value = false
  }

  function ready(id: string): boolean {
    return (
      cardReady(match.value, 'player', id) &&
      (mode.value !== 'blackout' || match.value.hands.player.includes(id))
    )
  }

  function touchSquare(x: number, y: number): void {
    if (match.value.victor) return
    if (selectedCard.value) {
      const result = deploy(match.value, selectedCard.value, x, y)
      if (result !== match.value) {
        match.value = result
        previewOpen.value = false
        selectedCard.value = null
        settleBout()
      }
      return
    }
    const unit = unitAt(match.value, x, y)
    if (unit?.side === 'player') {
      selectedUnit.value = unit.id
      targetUnit.value = null
      return
    }
    if (
      unit?.side === 'enemy' &&
      (attackTargets.value.includes(unit.id) ||
        (!!selected.value &&
          canBulldozeInto(match.value, selected.value, x, y)))
    ) {
      targetUnit.value = unit.id
      return
    }
    if (
      selected.value &&
      match.value.monster?.x === x &&
      match.value.monster?.y === y
    ) {
      chooseAttackTarget(-1)
      return
    }
    if (selectedUnit.value !== null) {
      const result = move(match.value, selectedUnit.value, x, y)
      if (result !== match.value) {
        match.value = result
        // Keep a fighter selected while it still has AP to spend.
        const still = result.units.find((u) => u.id === selectedUnit.value)
        if (!still || still.ap < 1) selectedUnit.value = null
        settleBout()
      }
    }
  }

  function unmask(): void {
    if (selectedUnit.value === null) return
    match.value = reveal(match.value, selectedUnit.value)
  }

  function nextRound(): void {
    if (running.value || match.value.victor) return
    match.value = advance(match.value)
    targetUnit.value = null
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
    currentDeck,
    currentDeckProblems,
    replacingCard,
    deckMessage,
    isFounderCard,
    isCardUnlocked,
    selectDeckCard,
    restoreFounderDeck,
    testCustomDeck,
    storyLoaded,
    storySaving,
    storyError,
    hydrateStory,
    campaignBout,
    lastCampaign,
    campaignStory,
    campaignState,
    activeChapter,
    campaignFinale,
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
    targetUnit,
    attackTargets,
    canMoveTo,
    canShoveTarget,
    shoveSelected,
    selectedTarget,
    attackPreview,
    running,
    guideOpen,
    team,
    enemy,
    cards,
    collectionSize: CARDS.length,
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
    chooseAttackTarget,
    attackSelected,
    unmask,
    nextRound,
    tick,
    toggleRush,
    unitLabel,
  }
})
