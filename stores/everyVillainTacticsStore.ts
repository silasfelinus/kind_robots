import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'
import {
  actorAt,
  availableMove,
  endTurn,
  fireSelected,
  moveSelected,
  overwatchSelected,
  hunkerSelected,
  elevationAt,
  previewShot,
  selectedUnit,
  trainingState,
  terrainAt,
  type Cell,
  type Mode,
} from '~/utils/everyVillainTactics/training'

export type TacticalPerspective = 'hero' | 'villain' | 'henchman' | 'sidekick'

export const PERSPECTIVES: Record<
  TacticalPerspective,
  { label: string; headline: string; opening: string }
> = {
  hero: {
    label: 'Hero',
    headline: 'Save the assembly',
    opening:
      'Someone sealed the auditorium doors with students still inside. Your team has one chance to open a path before the panic spreads.',
  },
  villain: {
    label: 'Villain',
    headline: 'Stop their reckless rescue',
    opening:
      'The heroes want to storm a sealed building without knowing what waits behind the doors. You are keeping a dangerous secret contained.',
  },
  henchman: {
    label: 'Henchman',
    headline: 'An impossible order',
    opening:
      'You were told to hold the east stairs. Nobody mentioned the children trapped inside, or why your boss refuses to answer the radio.',
  },
  sidekick: {
    label: 'Sidekick',
    headline: 'Make your own call',
    opening:
      'Your partner wants a clean victory. You just heard another voice crying for help behind the wall. What kind of hero follows orders?',
  },
}

export const useEveryVillainTacticsStore = defineStore(
  'everyVillainTactics',
  () => {
    const state = ref(trainingState())
    const perspective = ref<TacticalPerspective>('hero')
    const rosterOpen = ref(false)
    const rosterSearch = ref('')
    const roster = IDENTITY_ARCS
    const active = computed(() => selectedUnit(state.value) ?? null)
    const players = computed(() =>
      state.value.units.filter((u) => u.team === 'squad'),
    )
    const enemies = computed(() =>
      state.value.units.filter((u) => u.team === 'rival'),
    )
    const scene = computed(() => PERSPECTIVES[perspective.value])
    const hovered = computed(() => state.value.hover)
    const mode = computed<Mode>(() => state.value.mode)
    const movePossible = computed(
      () => hovered.value && availableMove(state.value, hovered.value),
    )
    const aimedTarget = computed(() => {
      const point = hovered.value
      const selected = active.value
      if (!point || !selected) return null
      const target = actorAt(state.value, point)
      if (target?.team === 'rival') return previewShot(selected, target)
      if (movePossible.value) {
        const projected = { ...selected, x: point.x, y: point.y }
        const options = enemies.value
          .filter((u) => u.hp > 0)
          .map((u) => previewShot(projected, u))
          .filter((s) => s.hit > 0)
          .sort((a, b) => b.hit - a.hit)
        return options[0] ?? null
      }
      return null
    })
    const previewLabel = computed(() => {
      if (!active.value) return 'Select a squadmate'
      if (!hovered.value)
        return 'Hover a highlighted tile to see sightlines and attack odds'
      if (mode.value === 'fire') {
        return aimedTarget.value?.hit
          ? 'Clear shot · ' + aimedTarget.value.hit + '% hit chance'
          : 'No clear shot from current position'
      }
      if (!movePossible.value)
        return 'Destination blocked or out of movement range'
      return aimedTarget.value
        ? 'From here: ' +
            aimedTarget.value.hit +
            '% on ' +
            enemies.value.find((u) => u.id === aimedTarget.value?.target)?.id
        : 'Reachable · no visible target from this position'
    })

    function reset() {
      state.value = trainingState()
    }
    function choosePerspective(value: TacticalPerspective) {
      perspective.value = value
      reset()
    }
    function chooseLead(signature: string) {
      const valid = roster.some((u) => u.signature === signature)
      if (!valid) return
      reset()
      state.value.units[0]!.identity = signature
      state.value.log =
        'New squad leader assigned. The battle starts at First Bell.'
      rosterOpen.value = false
    }
    function select(id: string) {
      const u = state.value.units.find(
        (u) => u.id === id && u.hp > 0 && u.team === 'squad',
      )
      if (!u) return
      state.value.selected = id
      state.value.hover = { x: u.x, y: u.y }
      state.value.mode = 'move'
    }
    function setMode(next: Mode) {
      state.value.mode = next
      state.value.hover = null
    }
    function hover(point: Cell | null) {
      state.value.hover = point
    }
    function click(point: Cell) {
      const unit = actorAt(state.value, point)
      if (unit?.team === 'squad') return select(unit.id)
      if (state.value.phase !== 'active') return
      if (unit?.team === 'rival') {
        if (state.value.mode === 'fire') fireSelected(state.value, unit)
      } else if (state.value.mode === 'move') {
        moveSelected(state.value, point)
      }
    }
    function nextTurn() {
      endTurn(state.value)
    }
    function overwatch() {
      overwatchSelected(state.value)
    }
    function hunker() {
      hunkerSelected(state.value)
    }
    function cellStyle(point: Cell) {
      return {
        selected:
          !!active.value &&
          active.value.x === point.x &&
          active.value.y === point.y,
        reachable:
          state.value.mode === 'move' &&
          !!active.value &&
          availableMove(state.value, point),
        sightline:
          !!state.value.hover &&
          point.x === state.value.hover.x &&
          point.y === state.value.hover.y,
        'has-cover': terrainAt(point) === 'cover',
        'has-wall': terrainAt(point) === 'wall',
        elevated: elevationAt(point) > 0,
      }
    }
    return {
      state,
      perspective,
      scene,
      roster,
      rosterOpen,
      rosterSearch,
      active,
      players,
      enemies,
      hovered,
      mode,
      aimedTarget,
      previewLabel,
      movePossible,
      reset,
      choosePerspective,
      chooseLead,
      select,
      setMode,
      hover,
      click,
      nextTurn,
      overwatch,
      hunker,
      cellStyle,
    }
  },
)
