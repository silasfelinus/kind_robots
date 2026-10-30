import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  advance,
  cardById,
  cardReady,
  CARDS,
  createMatch,
  deploy,
  DISTRICTS,
  MODE_GUIDES,
  MODES,
  move,
  normalizeSeed,
  observe,
  reveal,
  RUSH_TICK_MS,
  TEAMS,
  teamById,
  unitAt,
  type ModeId,
  type TeamId,
} from '../utils/slimeCity/prototypes'

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
  const districtId = ref('chimera')
  const seed = ref(rollSeed())
  const match = ref(
    createMatch(mode.value, activeTeam.value, enemyTeam.value, seed.value),
  )
  const selectedCard = ref<string | null>(null)
  const selectedUnit = ref<number | null>(null)
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
  /** The board as the human may see it: hidden enemies and traps redacted. */
  const sight = computed(() => observe(match.value, 'player'))
  const guide = computed(() => MODE_GUIDES[mode.value])
  const selected = computed(() =>
    match.value.units.find(
      (item) => item.id === selectedUnit.value && item.side === 'player',
    ),
  )
  const district = computed(
    () =>
      DISTRICTS.find((item) => item.id === districtId.value) || DISTRICTS[0]!,
  )
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
    if (!sameSeed) seed.value = rollSeed()
    match.value = createMatch(
      mode.value,
      activeTeam.value,
      enemyTeam.value,
      seed.value,
    )
    selectedCard.value = null
    selectedUnit.value = null
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

  function visit(id: string): void {
    const found = DISTRICTS.find((item) => item.id === id)
    if (!found) return
    districtId.value = id
    activeTeam.value = found.team
    if (enemyTeam.value === activeTeam.value) enemyTeam.value = 'ironjaw'
    view.value = 'city'
    reset()
  }

  function startDistrictMatch(): void {
    view.value = 'arena'
    reset()
    if (!guideSeen.has(mode.value)) openGuide()
  }

  function chooseCard(id: string): void {
    selectedCard.value = selectedCard.value === id ? null : id
    selectedUnit.value = null
  }

  function ready(id: string): boolean {
    return cardReady(match.value, 'player', id)
  }

  function touchSquare(x: number, y: number): void {
    if (match.value.victor) return
    if (selectedCard.value) {
      const result = deploy(match.value, selectedCard.value, x, y)
      if (result !== match.value) {
        match.value = result
        selectedCard.value = null
      }
      return
    }
    const unit = unitAt(match.value, x, y)
    if (unit?.side === 'player') {
      selectedUnit.value = unit.id
      return
    }
    if (selectedUnit.value !== null) {
      const result = move(match.value, selectedUnit.value, x, y)
      if (result !== match.value) {
        match.value = result
        // Keep a fighter selected while it still has AP to spend.
        const still = result.units.find((u) => u.id === selectedUnit.value)
        if (!still || still.ap < 1) selectedUnit.value = null
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
  }

  /** One fixed BLOODRUSH tick; the timer calls this and nothing else. */
  function tick(): void {
    if (match.value.victor) return stop()
    match.value = advance(match.value)
    if (match.value.victor) stop()
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
    seed,
    match,
    sight,
    guide,
    selectedCard,
    selectedUnit,
    running,
    guideOpen,
    team,
    enemy,
    cards,
    selected,
    district,
    board,
    teams: TEAMS,
    modes: MODES,
    districts: DISTRICTS,
    reset,
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
    startDistrictMatch,
    showCity,
    showCards,
    chooseCard,
    ready,
    touchSquare,
    unmask,
    nextRound,
    tick,
    toggleRush,
    unitLabel,
  }
})
