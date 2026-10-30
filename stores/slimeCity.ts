import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  advance,
  cardById,
  CARDS,
  createMatch,
  deploy,
  DISTRICTS,
  MODES,
  move,
  reveal,
  TEAMS,
  teamById,
  unitAt,
  type ModeId,
  type TeamId,
} from '~/utils/slimeCity/prototypes'

export const useSlimeCityStore = defineStore('slimeCityLab', () => {
  const view = ref<'city' | 'arena' | 'cards'>('city')
  const activeTeam = ref<TeamId>('catgirls')
  const enemyTeam = ref<TeamId>('bloodfairies')
  const mode = ref<ModeId>('blackout')
  const districtId = ref('chimera')
  const match = ref(createMatch(mode.value, activeTeam.value, enemyTeam.value))
  const selectedCard = ref<string | null>(null)
  const selectedUnit = ref<number | null>(null)
  const running = ref(false)
  let interval: ReturnType<typeof setInterval> | undefined

  const team = computed(() => teamById(activeTeam.value))
  const enemy = computed(() => teamById(enemyTeam.value))
  const cards = computed(() =>
    CARDS.filter((item) => item.team === activeTeam.value),
  )
  const selected = computed(() =>
    match.value.units.find((item) => item.id === selectedUnit.value),
  )
  const district = computed(
    () =>
      DISTRICTS.find((item) => item.id === districtId.value) || DISTRICTS[0],
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

  function reset(): void {
    stop()
    match.value = createMatch(mode.value, activeTeam.value, enemyTeam.value)
    selectedCard.value = null
    selectedUnit.value = null
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

  function chooseMode(id: ModeId): void {
    mode.value = id
    view.value = 'arena'
    reset()
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
  }

  function chooseCard(id: string): void {
    selectedCard.value = selectedCard.value === id ? null : id
    selectedUnit.value = null
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
        selectedUnit.value = null
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

  function toggleRush(): void {
    if (mode.value !== 'bloodrush' || match.value.victor) return
    if (running.value) return stop()
    running.value = true
    interval = setInterval(() => {
      match.value = advance(match.value)
      if (match.value.victor) stop()
    }, 1100)
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
    match,
    selectedCard,
    selectedUnit,
    running,
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
    stop,
    dispose,
    chooseTeam,
    chooseEnemy,
    chooseMode,
    visit,
    startDistrictMatch,
    chooseCard,
    touchSquare,
    unmask,
    nextRound,
    toggleRush,
    unitLabel,
  }
})
