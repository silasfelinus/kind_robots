import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  advance,
  attack,
  mayAttack,
  blowDamage,
  legalNeighbor,
  cardById,
  cardReady,
  CARDS,
  createMatch,
  DEFAULT_RULES,
  deploy,
  DISTRICTS,
  KEYWORDS,
  MODE_GUIDES,
  MODES,
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
  contractBlocked,
  contractTerms,
  createCity,
  decide,
  decideStreet,
  streetStory,
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
  const view = ref<'city' | 'arena' | 'cards'>('city')
  const activeTeam = ref<TeamId>('catgirls')
  const enemyTeam = ref<TeamId>('bloodfairies')
  const mode = ref<ModeId>('blackout')
  const districtId = ref<DistrictId>('pitworks')
  /** Session-only city progress: nothing is saved or awarded. */
  const city = ref(createCity())
  /** The district whose rival the current match is against, if any. */
  const bout = ref<DistrictId | null>(null)
  /** The rival bout that just ended, for the BACK TO THE CITY button. */
  const lastBout = ref<DistrictId | null>(null)
  const contractBout = ref<DistrictId | null>(null)
  const lastContract = ref<DistrictId | null>(null)
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

  const team = computed(() => teamById(activeTeam.value))
  const enemy = computed(() => teamById(enemyTeam.value))
  const cards = computed(() =>
    CARDS.filter((item) => item.team === activeTeam.value),
  )
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
  const streetProgress = computed(
    () => Object.keys(city.value.streetChoices).length,
  )
  const boutPlan = computed(() => (bout.value ? CITY_PLAN[bout.value] : null))
  const contractPlan = computed(() => CITY_CONTRACTS[districtId.value])
  const activeContract = computed(() => contractBout.value ? CITY_CONTRACTS[contractBout.value] : null)
  const contractGate = computed(() => contractBlocked(city.value, districtId.value))
  const here = computed(() => city.value.location === districtId.value)
  const route = computed(() =>
    streetsFrom(city.value.location).find((s) => s.to === districtId.value),
  )
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
    bout.value = null
    lastBout.value = null
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

  function showCards(): void {
    stop()
    view.value = 'cards'
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
    const next = travel(city.value, districtId.value)
    if (next !== city.value) city.value = next
  }

  function choose(choiceId: string): void {
    city.value = decide(city.value, choiceId)
  }

  function chooseStreet(choiceId: string): void {
    city.value = decideStreet(city.value, choiceId)
    districtId.value = city.value.location
  }

  /** Fight this district's rival on its format, with your decision's terms. */
  function fightRival(): void {
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
    view.value = 'arena'
    if (!guideSeen.has(rival.mode)) openGuide()
  }

  /** Once a rival bout ends, its result changes the city. */
  function settleBout(): void {
    if (!bout.value || !match.value.victor) return
    city.value = recordBout(city.value, bout.value, match.value.victor)
    lastBout.value = bout.value
    bout.value = null
  }

  function resetCity(): void {
    city.value = createCity()
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
    if (unit?.side === 'enemy' && attackTargets.value.includes(unit.id)) {
      chooseAttackTarget(unit.id)
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
    bout,
    lastBout,
    boutPlan,
    plan,
    streetEvent,
    streetProgress,
    here,
    route,
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
    selectedTarget,
    attackPreview,
    running,
    guideOpen,
    team,
    enemy,
    cards,
    hand,
    inspectedCard,
    selected,
    district,
    board,
    teams: TEAMS,
    modes: MODES,
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
    fightRival,
    resetCity,
    startDistrictMatch,
    showCity,
    showCards,
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
