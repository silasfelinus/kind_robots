<template>
  <section
    class="atf-console"
    data-testid="academy-tactical-battle"
    aria-label="Playable night patrol tactical battle"
  >
    <header class="atf-header">
      <span class="atf-overline"
        >NIGHT {{ battle.day }} · TACTICAL INTERLUDE</span
      >
      <h2>{{ mission }}</h2>
      <p>{{ opening }}</p>
      <div class="atf-stats">
        <strong>{{
          role === 'villain' ? 'VILLAIN ROUTE' : 'HERO ROUTE'
        }}</strong>
        <span>{{ rivalName }} · {{ state.phase.toUpperCase() }}</span>
        <span>TURN {{ state.turn }}</span>
      </div>
    </header>
    <div
      class="atf-grid"
      :style="{
        gridTemplateColumns: 'repeat(' + state.map.width + ', minmax(0, 1fr))',
      }"
      role="group"
      aria-label="Tactical map"
    >
      <button
        v-for="cell in cells"
        :key="cell.x + ':' + cell.y"
        type="button"
        class="atf-cell"
        :class="{
          'atf-wall': terrainAt(cell, state.map) === 'wall',
          'atf-cover': terrainAt(cell, state.map) === 'cover',
          'atf-squad': unitAt(cell)?.team === 'squad',
          'atf-rival': unitAt(cell)?.team === 'rival',
          'atf-selected': selected?.x === cell.x && selected?.y === cell.y,
          'atf-reachable': state.mode === 'move' && availableMove(state, cell),
        }"
        :disabled="
          state.phase !== 'active' || terrainAt(cell, state.map) === 'wall'
        "
        :aria-label="cellLabel(cell)"
        :title="cellLabel(cell)"
        @click="$emit('cell', cell.x, cell.y)"
      >
        <template v-if="unitAt(cell)">
          <span class="atf-token">{{
            unitAt(cell)?.team === 'squad' ? '✦' : '◆'
          }}</span>
          <small>{{ aliasFor(unitAt(cell)!).slice(0, 10) }}</small>
          <span class="atf-hp">{{ unitAt(cell)?.hp }} HP</span>
        </template>
        <span
          v-else-if="terrainAt(cell, state.map) === 'wall'"
          aria-hidden="true"
          >▦</span
        >
        <span
          v-else-if="terrainAt(cell, state.map) === 'cover'"
          aria-hidden="true"
          >◧</span
        >
        <span
          v-else-if="state.mode === 'move' && availableMove(state, cell)"
          aria-hidden="true"
          >·</span
        >
      </button>
    </div>
    <p class="atf-log" role="status">{{ state.log }}</p>
    <div v-if="state.phase === 'active'" class="atf-controls">
      <button
        type="button"
        :class="{ chosen: state.mode === 'move' }"
        @click="$emit('mode', 'move')"
      >
        MOVE
      </button>
      <button
        type="button"
        :class="{ chosen: state.mode === 'fire' }"
        @click="$emit('mode', 'fire')"
      >
        FIRE
      </button>
      <button type="button" @click="$emit('turn')">END TURN</button>
      <button class="atf-retreat" type="button" @click="$emit('retreat')">
        RETREAT
      </button>
    </div>
    <button
      v-else
      class="atf-continue"
      type="button"
      data-testid="academy-tactical-debrief"
      @click="$emit('finish')"
    >
      {{
        state.phase === 'victory'
          ? 'VICTORY · RECORD THE CONSEQUENCES'
          : 'DEFEAT · FACE THE CONSEQUENCES'
      }}
      ↗
    </button>
    <p class="atf-instructions">
      Select a friendly card, choose Move or Fire, then choose a square or
      opponent. Cover and line of sight determine your shot. Fights autosave
      after every action. Your casualties and result replace the normal mission
      odds.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  actorAt,
  aliasFor,
  availableMove,
  previewShot,
  selectedUnit,
  terrainAt,
  type Cell,
} from '~/utils/everyVillainTactics/training'
import type { TacticalInterlude } from '~/utils/cometAcademy/tacticalInterlude'

const props = defineProps<{
  battle: TacticalInterlude
  rivalName: string
  mission: string
  opening: string
  role: 'hero' | 'villain'
}>()
defineEmits<{
  cell: [x: number, y: number]
  mode: [mode: 'move' | 'fire']
  turn: []
  retreat: []
  finish: []
}>()
const state = computed(() => props.battle.state)
const selected = computed(() => selectedUnit(state.value))
const cells = computed(() =>
  Array.from(
    { length: state.value.map.width * state.value.map.height },
    (_, index) => ({
      x: index % state.value.map.width,
      y: Math.floor(index / state.value.map.width),
    }),
  ),
)
const unitAt = (cell: Cell) => actorAt(state.value, cell)
function cellLabel(cell: Cell) {
  const unit = unitAt(cell)
  if (unit) {
    const chance =
      unit.team === 'rival' && selected.value
        ? previewShot(selected.value, unit, state.value.map).hit
        : null
    return `${aliasFor(unit)}, ${unit.hp} HP${chance === null ? '' : ', ' + chance + '% hit chance'}`
  }
  return `Column ${cell.x + 1}, row ${cell.y + 1}: ${terrainAt(cell, state.value.map)}${availableMove(state.value, cell) ? ', reachable' : ''}`
}
</script>

<style scoped>
.atf-console {
  display: grid;
  gap: 0.65rem;
  min-width: 0;
  color: #f5f3ff;
}
.atf-header {
  display: grid;
  gap: 0.35rem;
}
.atf-overline {
  font-size: 0.7rem;
  letter-spacing: 0.17em;
  color: #ffc781;
  font-weight: 800;
}
.atf-header h2 {
  font-size: clamp(1.25rem, 3cqi, 2rem);
  line-height: 1.1;
  font-weight: 950;
  text-transform: uppercase;
}
.atf-header p {
  max-height: 4.5em;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #e9d5ff;
}
.atf-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.85rem;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
.atf-stats strong {
  color: #fbbf24;
}
.atf-grid {
  display: grid;
  gap: 3px;
  padding: 0.4rem;
  border: 2px solid #8675b0;
  border-radius: 0.8rem;
  background: #171027;
  width: 100%;
}
.atf-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 0;
  min-height: 2.3rem;
  aspect-ratio: 1;
  background: #3b3054;
  border: 1px solid #6b5f83;
  border-radius: 0.3rem;
  font-size: 0.9rem;
  overflow: hidden;
}
.atf-cell small {
  font-size: clamp(0.48rem, 1.2cqi, 0.7rem);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
  padding-inline: 1px;
  font-weight: 800;
}
.atf-token {
  font-size: 1rem;
  line-height: 1;
}
.atf-hp {
  font-size: 0.6rem;
  font-weight: 800;
}
.atf-wall {
  background: #11101c;
  opacity: 0.55;
}
.atf-cover {
  background: #545272;
}
.atf-squad {
  background: #175f61;
  border-color: #6ee7b7;
}
.atf-rival {
  background: #7b2543;
  border-color: #fda4af;
}
.atf-selected {
  outline: 3px solid #fef08a;
  outline-offset: -3px;
}
.atf-reachable:not(.atf-squad):not(.atf-rival) {
  box-shadow: inset 0 0 0 2px #6ee7b7;
}
.atf-cell:focus-visible,
.atf-controls button:focus-visible,
.atf-continue:focus-visible {
  outline: 3px solid white;
  outline-offset: 2px;
}
.atf-log {
  min-height: 2.2rem;
  padding: 0.55rem 0.75rem;
  background: #2d2046;
  border-left: 3px solid #fcd34d;
  font-size: 0.85rem;
}
.atf-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.atf-controls button,
.atf-continue {
  border: 1px solid #b0a0d3;
  border-radius: 0.45rem;
  padding: 0.65rem 0.9rem;
  min-height: 2.7rem;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.atf-controls .chosen {
  background: #4f46e5;
}
.atf-controls .atf-retreat {
  margin-left: auto;
  color: #fecaca;
}
.atf-continue {
  width: 100%;
  background: #fbbf24;
  color: #1c132c;
  border-color: #fbbf24;
}
.atf-instructions {
  font-size: 0.72rem;
  line-height: 1.4;
  color: #d8caed;
}
@media (max-width: 430px) {
  .atf-cell {
    min-height: 1.8rem;
  }
  .atf-grid {
    gap: 2px;
    padding: 0.25rem;
  }
}
</style>
