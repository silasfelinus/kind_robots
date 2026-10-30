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
      <h2>{{ battle.arena?.title ?? mission }}</h2>
      <p class="atf-venue">{{ battle.arena?.venue ?? mission }}</p>
      <p>{{ opening }}</p>
      <p v-if="battle.arena" class="atf-lair" data-testid="academy-unique-lair">
        {{ battle.arena.objective }}
      </p>
      <div class="atf-stats">
        <strong>{{
          role === 'villain' ? 'VILLAIN ROUTE' : 'HERO ROUTE'
        }}</strong>
        <span>{{ rivalName }} · {{ state.phase.toUpperCase() }}</span>
        <span>TURN {{ state.turn }}</span>
      </div>
    </header>
    <aside
      v-if="boss && threat"
      class="atf-boss-panel"
      data-testid="academy-signature-lieutenant"
      :aria-label="'Lieutenant ' + threat.name"
    >
      <span class="atf-boss-kicker">THE LIEUTENANT ENTERS</span>
      <div class="atf-boss-layout">
        <strong>{{ threat.name }}</strong>
        <span>{{ threat.attack }} · {{ boss.hp }} HP</span>
      </div>
      <p>{{ threat.power }}</p>
      <p v-if="boss.signatureTarget" class="atf-boss-warning">
        ⚠ ATTACK CHARGING · {{ threat.counterVerb }} at ⚙, move off the red
        tiles, or land a hit on {{ threat.name }}.
      </p>
      <p v-else class="atf-boss-counter">{{ threat.counter }}</p>
    </aside>
    <aside
      v-if="boss && state.phase !== 'active'"
      class="atf-reckoning"
      data-testid="academy-lieutenant-reckoning"
    >
      <span class="atf-boss-kicker"
        >FINAL PANEL · {{ role.toUpperCase() }} CUT</span
      >
      <strong>
        {{
          state.phase === 'victory'
            ? role === 'villain'
              ? 'THE CITY GETS A WARNING'
              : 'THE CITY GETS A WITNESS'
            : 'THE LIEUTENANT GETS THE LAST WORD'
        }}
      </strong>
      <p>{{ battle.arena?.lieutenantAgenda }}</p>
      <p v-if="battle.arena?.discovered" class="atf-boss-counter">
        EVIDENCE RECOVERED · {{ battle.arena.secret }}
      </p>
      <p v-else class="atf-boss-counter">THE SECRET REMAINS ON THE FIELD</p>
    </aside>
    <aside
      v-if="battle.arena?.lieutenantParley"
      class="atf-reckoning"
      data-testid="academy-lieutenant-settlement"
    >
      <span class="atf-boss-kicker">AN ENEMY CHOOSES THEIR OWN STORY</span>
      <strong>
        {{
          battle.arena.lieutenantParley === 'ally'
            ? 'THE LIEUTENANT CHANGES SIDES'
            : 'A CEASEFIRE HOLDS'
        }}
      </strong>
      <p>{{ battle.arena.lieutenantAgenda }}</p>
      <p class="atf-boss-counter">
        {{
          battle.arena.lieutenantParley === 'ally'
            ? 'Their testimony and support can change the final prom-night outcome.'
            : 'The lieutenant withdraws and promises to stop endangering civilians.'
        }}
      </p>
    </aside>
    <aside
      v-if="allied"
      class="atf-ally-panel"
      data-testid="academy-allied-lieutenant"
      :aria-label="'Allied lieutenant ' + allied.lieutenantName"
    >
      <span class="atf-boss-kicker">THE LIEUTENANT RETURNS · YOUR SIDE</span>
      <div class="atf-boss-layout">
        <strong>{{ allied.lieutenantName }}</strong>
        <span
          >{{ allied.hp }} HP ·
          {{
            allied.signatureSupportUsed ? 'POWER SPENT' : 'SIGNATURE READY'
          }}</span
        >
      </div>
      <p>
        Select their ✦ card and spend 2 AP for a once-per-battle signature
        attack on the nearest visible rival. Allies are safe.
      </p>
      <p v-if="alliedPreview" class="atf-ally-ready">
        TARGET {{ aliasFor(alliedPreview.target) }} ·
        {{ alliedPreview.cells.length }} highlighted tiles
      </p>
    </aside>
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
          'atf-objective': atPoint(cell, battle.arena?.objectivePoint),
          'atf-secret':
            atPoint(cell, battle.arena?.secretPoint) &&
            !battle.arena?.discovered,
          'atf-shift': atPoint(cell, battle.arena?.shiftPoint),
          'atf-threat': isThreat(cell),
          'atf-ally-target': isAllyThreat(cell),
          'atf-boss-counter': atPoint(cell, boss?.signatureCounter),
        }"
        :disabled="
          state.phase !== 'active' || terrainAt(cell, state.map) === 'wall'
        "
        :aria-label="cellLabel(cell)"
        :title="cellLabel(cell)"
        @click="$emit('cell', cell.x, cell.y)"
      >
        <template v-if="atPoint(cell, boss?.signatureCounter) && !unitAt(cell)">
          <span class="atf-token" aria-hidden="true">⚙</span>
          <small>DISRUPT</small>
        </template>
        <template
          v-else-if="
            atPoint(cell, battle.arena?.objectivePoint) &&
            !battle.arena?.secured &&
            !unitAt(cell)
          "
        >
          <span class="atf-token" aria-hidden="true">◎</span>
          <small>OBJECTIVE</small>
        </template>
        <template
          v-else-if="
            atPoint(cell, battle.arena?.secretPoint) &&
            !battle.arena?.discovered &&
            !unitAt(cell)
          "
        >
          <span class="atf-token" aria-hidden="true">?</span>
          <small>SECRET</small>
        </template>
        <template v-else-if="unitAt(cell)">
          <span class="atf-token">{{
            unitAt(cell)?.team === 'squad' ? '✦' : '◆'
          }}</span>
          <small>{{ aliasFor(unitAt(cell)!).slice(0, 10) }}</small>
          <span class="atf-hp">{{ unitAt(cell)?.hp }} HP</span>
        </template>
        <span v-else-if="isThreat(cell)" aria-hidden="true">⚠</span>
        <span v-else-if="isAllyThreat(cell)" aria-hidden="true">✧</span>
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
    <div
      v-if="battle.arena"
      class="atf-casefile"
      aria-label="Mission objectives"
    >
      <span :class="{ secured: battle.arena.secured }">
        {{ battle.arena.secured ? '✓' : '◎' }}
        {{
          battle.arena.kind === 'origin'
            ? 'RESOLVE ORIGIN CRISIS'
            : 'SECURE RIVAL LAIR'
        }}
      </span>
      <span :class="{ secured: battle.arena.discovered }">
        {{ battle.arena.discovered ? '✓' : '?' }} OPTIONAL SECRET
      </span>
      <span v-if="battle.arena.lieutenantParley" class="secured">
        ✓
        {{
          battle.arena.lieutenantParley === 'ally' ? 'DEFECTED' : 'CEASEFIRE'
        }}
      </span>
      <span v-if="battle.arena.shifted" class="atf-alarm">⚠ ARENA SHIFTED</span>
    </div>
    <p class="atf-log" role="status">{{ state.log }}</p>
    <div
      v-if="boss?.hp && state.phase === 'active'"
      class="atf-parley"
      data-testid="academy-lieutenant-parley"
    >
      <span class="atf-boss-kicker">A DIFFERENT WAY TO WIN</span>
      <p>{{ battle.arena?.lieutenantAgenda }}</p>
      <p>
        {{
          canParley
            ? 'Evidence recovered. The lieutenant is vulnerable and within speaking range. Choose a deal, or continue fighting.'
            : 'To open talks: uncover the secret, lower the lieutenant to 2 HP or less, then approach within two squares with 1 AP remaining.'
        }}
      </p>
      <div v-if="canParley" class="atf-parley-actions">
        <button
          type="button"
          data-testid="academy-parley-ally"
          @click="$emit('parley', 'ally')"
        >
          OFFER PROTECTION · GAIN AN ALLY
        </button>
        <button
          type="button"
          data-testid="academy-parley-truce"
          @click="$emit('parley', 'truce')"
        >
          NEGOTIATE A CEASEFIRE
        </button>
      </div>
    </div>
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
      <button
        v-if="boss?.signatureTarget"
        type="button"
        class="atf-disrupt"
        :disabled="!canCounter"
        data-testid="academy-boss-disrupt"
        @click="$emit('counter')"
      >
        DISRUPT · 1 AP
      </button>
      <button
        v-if="selected?.id === 'allied-lieutenant'"
        type="button"
        class="atf-ally-action"
        :disabled="!alliedPreview"
        data-testid="academy-allied-signature"
        @click="$emit('support')"
      >
        {{ alliedPreview?.attack ?? 'SIGNATURE UNAVAILABLE' }} · 2 AP
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
      Select a friendly card to move or fire. Reach the ◎ tile and tap again
      from one square away to secure the lair; step onto ? to recover its
      secret. The environment changes mid-fight. Every action autosaves.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gridDistance } from '~/utils/everyVillainTactics/combat'
import {
  signatureThreatCells,
  signatureThreatFor,
} from '~/utils/everyVillainTactics/signatureLieutenant'
import {
  actorAt,
  aliasFor,
  availableMove,
  previewAlliedSignature,
  previewShot,
  selectedUnit,
  terrainAt,
  type Cell,
} from '~/utils/everyVillainTactics/training'
import {
  canParleyWithLieutenant,
  type TacticalInterlude,
} from '~/utils/cometAcademy/tacticalInterlude'

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
  counter: []
  parley: [decision: 'ally' | 'truce']
  support: []
  retreat: []
  finish: []
}>()
const state = computed(() => props.battle.state)
const selected = computed(() => selectedUnit(state.value))
const allied = computed(() =>
  state.value.units.find((unit) => unit.id === 'allied-lieutenant'),
)
const alliedPreview = computed(() => previewAlliedSignature(state.value))
const isAllyThreat = (p: Cell) =>
  !!alliedPreview.value &&
  alliedPreview.value.cells.some((cell) => cell.x === p.x && cell.y === p.y)
const canParley = computed(() => canParleyWithLieutenant(props.battle))
const boss = computed(() =>
  state.value.units.find((unit) => unit.signatureBoss),
)
const threat = computed(() =>
  boss.value?.signatureBoss
    ? signatureThreatFor(boss.value.signatureBoss)
    : null,
)
const dangerousCells = computed(() =>
  boss.value?.signatureBoss && boss.value.hp > 0 && boss.value.signatureTarget
    ? signatureThreatCells(
        state.value.map,
        boss.value.signatureBoss,
        boss.value.signatureTarget,
      )
    : [],
)
const isThreat = (p: Cell) =>
  dangerousCells.value.some((cell) => cell.x === p.x && cell.y === p.y)
const canCounter = computed(
  () =>
    !!selected.value &&
    selected.value.ap > 0 &&
    !!boss.value &&
    boss.value.hp > 0 &&
    !!boss.value.signatureTarget &&
    !!boss.value?.signatureCounter &&
    gridDistance(selected.value, boss.value.signatureCounter) <= 1,
)
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
const atPoint = (cell: Cell, point?: Cell | null) =>
  !!point && cell.x === point.x && cell.y === point.y
function cellLabel(cell: Cell) {
  const objective = props.battle.arena
  const landmark = atPoint(cell, objective?.objectivePoint)
    ? ', lair objective: ' +
      (objective?.secured ? 'secured' : objective?.objective)
    : atPoint(cell, objective?.secretPoint)
      ? ', ' +
        (objective?.discovered ? 'discovered clue' : 'undiscovered secret')
      : ''
  const warning = isThreat(cell) ? ', in announced danger zone' : ''
  const allyMark = isAllyThreat(cell) ? ', in allied signature strike' : ''
  const signal = atPoint(cell, boss.value?.signatureCounter)
    ? ', disrupt station: approach and spend one AP'
    : ''
  const unit = unitAt(cell)
  if (unit) {
    const chance =
      unit.team === 'rival' && selected.value
        ? previewShot(selected.value, unit, state.value.map).hit
        : null
    return `${aliasFor(unit)}, ${unit.hp} HP${chance === null ? '' : ', ' + chance + '% hit chance'}${landmark}${warning}${allyMark}${signal}`
  }
  return `Column ${cell.x + 1}, row ${cell.y + 1}: ${terrainAt(cell, state.value.map)}${landmark}${warning}${allyMark}${signal}${availableMove(state.value, cell) ? ', reachable' : ''}`
}
</script>

<style scoped>
.atf-ally-panel {
  padding: 0.85rem;
  border: 2px solid #b9edc0;
  border-radius: 0.6rem;
  background: linear-gradient(105deg, #154331, #242a4b);
  color: #f0fff0;
}
.atf-ally-panel p {
  font-size: 0.83rem;
  line-height: 1.35;
}
.atf-ally-panel .atf-ally-ready {
  color: #d5ff91;
  font-weight: 850;
}
.atf-ally-target {
  box-shadow: inset 0 0 0 2px #bbf7d0;
  border-color: #bbf7d0;
}
.atf-ally-action {
  background: #24634e;
  border: 1px solid #b9edc0;
  color: #fff;
  font-weight: 900;
}
.atf-ally-action:disabled {
  opacity: 0.5;
}
.atf-parley {
  display: grid;
  gap: 0.45rem;
  padding: 0.8rem;
  border: 2px solid #ab87e0;
  border-radius: 0.7rem;
  background: linear-gradient(130deg, #25193c, #211a2d);
}
.atf-parley p {
  font-size: 0.84rem;
  line-height: 1.35;
}
.atf-parley-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.atf-parley-actions button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.4rem;
  border: 1px solid #fde68a;
  color: #fff7e4;
  background: #513968;
  font-weight: 900;
  font-size: 0.75rem;
}
.atf-parley-actions button:focus-visible {
  outline: 3px solid #fde68a;
}
.atf-reckoning {
  display: grid;
  gap: 0.3rem;
  padding: 0.75rem 0.9rem;
  background: linear-gradient(125deg, #392342, #161321);
  border: 2px solid #f9c96e;
  box-shadow: 4px 4px 0 #0b0811;
}
.atf-reckoning strong {
  font-size: clamp(1.1rem, 2.8cqi, 2rem);
  font-weight: 950;
  line-height: 1;
}
.atf-reckoning p {
  font-size: 0.8rem;
}
.atf-boss-panel {
  position: relative;
  padding: 0.75rem 0.9rem;
  background:
    repeating-linear-gradient(118deg, transparent 0 16px, #fece7620 16px 19px),
    linear-gradient(115deg, #421a44, #1b142d);
  border: 2px solid #f9c96e;
  box-shadow: 4px 4px 0 #100b19;
  transform: skew(-1deg);
}
.atf-boss-kicker {
  font-size: 0.65rem;
  color: #ffcb71;
  font-weight: 950;
  letter-spacing: 0.16em;
}
.atf-boss-layout {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
}
.atf-boss-layout strong {
  font-size: clamp(1.1rem, 2.5cqi, 1.8rem);
  font-weight: 1000;
  letter-spacing: -0.04em;
  text-shadow: 2px 2px 0 #62122a;
  text-transform: uppercase;
}
.atf-boss-layout span,
.atf-boss-panel p {
  font-size: 0.75rem;
  line-height: 1.3;
}
.atf-boss-panel .atf-boss-warning {
  color: #ffc1b8;
  font-weight: 850;
  padding-top: 0.2rem;
}
.atf-boss-panel .atf-boss-counter {
  color: #fbd5a5;
}
.atf-threat {
  background: #792535;
  border-color: #fda4af;
  box-shadow: inset 0 0 0 1px #fecaca;
}
.atf-boss-counter.atf-cell {
  outline: 3px dashed #fef08a;
  outline-offset: -3px;
}
.atf-disrupt {
  color: #201529;
  background: #fbbf24;
  font-weight: 900;
}
.atf-disrupt:disabled {
  opacity: 0.4;
}
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
.atf-header .atf-venue {
  font-size: 0.72rem;
  color: #fbbf24;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.atf-lair {
  color: #fff2b7;
  font-weight: 800;
}
.atf-casefile {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  font-size: 0.69rem;
  font-weight: 900;
}
.atf-casefile .secured {
  color: #6ee7b7;
}
.atf-casefile .atf-alarm {
  color: #ffb4a2;
}
.atf-objective {
  box-shadow: inset 0 0 0 2px #fbbf24;
}
.atf-secret {
  box-shadow: inset 0 0 0 2px #a78bfa;
}
.atf-shift {
  border-style: dashed;
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
