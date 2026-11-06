<!-- Canonical Clash: two card plays, then selected attacks with power-for-power retaliation. -->
<template>
  <section
    class="clash"
    data-testid="slime-clash"
    aria-label="Slime City Clash"
  >
    <header class="clash-top">
      <div class="clash-title">
        <span class="clash-eyebrow">THE PITWORKS · MAIN EVENT</span>
        <strong>SLIME CITY <i> / </i> CLASH</strong>
        <small>Draw five. Play two. Choose attacks. Survivors heal one.</small>
      </div>
      <div class="clash-round">
        <span>ROUND {{ game.round }} / {{ CLASH_ROUND_LIMIT }}</span>
        <b>{{ phaseLabel }}</b>
      </div>
      <button
        class="clash-reset"
        type="button"
        :aria-pressed="showHelp"
        @click="showHelp = !showHelp"
      >
        ? RULES
      </button>
      <button
        class="clash-reset"
        type="button"
        data-testid="clash-restart"
        @click="newMatch"
      >
        <span aria-hidden="true">↻</span> REMATCH
      </button>
    </header>

    <div class="clash-stage">
      <div class="clash-field">
        <div class="clash-boss is-enemy">
          <SlimeCityArtwork
            :image-id="slimeArtId('crews', rival.id)"
            :alt="rival.name"
            :fallback="rival.insignia"
            compact
          />
          <div class="clash-boss-name">
            <small>RIVAL BOSS</small><strong>{{ rival.name }}</strong>
            <span class="clash-health"
              ><i :style="{ width: healthWidth('enemy') }"
            /></span>
          </div>
          <b
            >{{ game.boss.enemy }} <small>/ {{ CLASH_BOSS_HP }} HP</small></b
          >
          <button
            v-if="game.phase === 'attack' && game.active === 'player'"
            class="clash-face"
            type="button"
            data-testid="clash-attack-boss"
            :disabled="!bossTargetable"
            @click="attackBoss"
          >
            ATTACK BOSS
          </button>
          <span class="clash-bank">{{ game.plays.enemy }} / 2 PLAYS</span>
        </div>

        <div
          class="clash-board"
          role="grid"
          aria-label="Five parallel combat lanes"
        >
          <SlimeCityArtwork
            class="clash-map-art"
            :image-id="slimeArtId('districts', 'pitworks')"
            alt="The Pitworks district battleground"
            fallback="⚡"
            compact
          />
          <div class="clash-lane-numbers">
            <span v-for="lane in lanes" :key="lane">ALLEY {{ lane + 1 }}</span>
          </div>
          <div
            class="clash-row is-enemy"
            role="row"
            aria-label="Enemy creatures"
          >
            <button
              v-for="lane in lanes"
              :key="'enemy-' + lane"
              type="button"
              class="clash-slot"
              :class="{
                filled: !!unit('enemy', lane),
                target:
                  targetable('enemy', lane) || attackTargetable('enemy', lane),
                selected: selectedUnit === unit('enemy', lane)?.uid,
              }"
              :disabled="!targetable('enemy', lane) && !unit('enemy', lane)"
              :aria-label="slotLabel('enemy', lane)"
              :data-testid="'clash-enemy-' + lane"
              @click="clickSlot('enemy', lane)"
            >
              <template v-if="unit('enemy', lane)">
                <SlimeCityArtwork
                  :image-id="artFor(unit('enemy', lane)!)"
                  :alt="cardById(unit('enemy', lane)!.cardId).name"
                  :fallback="cardById(unit('enemy', lane)!.cardId).symbol"
                  compact
                />
                <span class="clash-fighter-label">{{
                  cardById(unit('enemy', lane)!.cardId).name
                }}</span>
                <span class="clash-numbers"
                  ><b>{{ clashPower(game, unit('enemy', lane)!) }} ⚔</b
                  ><b>{{ unit('enemy', lane)!.hp }} ♥</b></span
                >
                <span v-if="unit('enemy', lane)!.gear.length" class="clash-gear"
                  >✦ {{ unit('enemy', lane)!.gear.length }}</span
                >
              </template>
              <span v-else class="clash-empty">{{
                targetable('enemy', lane) ? 'TARGET' : 'OPEN'
              }}</span>
            </button>
          </div>
          <div
            class="clash-impact"
            aria-label="Current fighter power and attack status"
          >
            <span v-for="lane in lanes" :key="'forecast-' + lane">
              {{ forecast(lane) }}
            </span>
          </div>
          <div
            class="clash-row is-player"
            role="row"
            aria-label="Your creatures"
          >
            <button
              v-for="lane in lanes"
              :key="'player-' + lane"
              type="button"
              class="clash-slot"
              :class="{
                filled: !!unit('player', lane),
                target:
                  targetable('player', lane) ||
                  attackTargetable('player', lane),
                selected:
                  selectedAttacker === unit('player', lane)?.uid ||
                  selectedUnit === unit('player', lane)?.uid,
              }"
              :disabled="!targetable('player', lane) && !unit('player', lane)"
              :aria-label="slotLabel('player', lane)"
              :data-testid="'clash-player-' + lane"
              @click="clickSlot('player', lane)"
            >
              <template v-if="unit('player', lane)">
                <SlimeCityArtwork
                  :image-id="artFor(unit('player', lane)!)"
                  :alt="cardById(unit('player', lane)!.cardId).name"
                  :fallback="cardById(unit('player', lane)!.cardId).symbol"
                  compact
                />
                <span class="clash-fighter-label">{{
                  cardById(unit('player', lane)!.cardId).name
                }}</span>
                <span class="clash-numbers"
                  ><b>{{ clashPower(game, unit('player', lane)!) }} ⚔</b
                  ><b>{{ unit('player', lane)!.hp }} ♥</b></span
                >
                <span
                  v-if="unit('player', lane)!.gear.length"
                  class="clash-gear"
                  >✦ {{ unit('player', lane)!.gear.length }}</span
                >
              </template>
              <span v-else class="clash-empty">{{
                targetable('player', lane) ? 'PLAY HERE' : 'OPEN'
              }}</span>
            </button>
          </div>
        </div>
        <div class="clash-boss is-player">
          <SlimeCityArtwork
            :image-id="slimeArtId('crews', mine.id)"
            :alt="mine.name"
            :fallback="mine.insignia"
            compact
          />
          <div class="clash-boss-name">
            <small>YOUR BOSS</small><strong>{{ mine.name }}</strong>
            <span class="clash-health"
              ><i :style="{ width: healthWidth('player') }"
            /></span>
          </div>
          <b
            >{{ game.boss.player }} <small>/ {{ CLASH_BOSS_HP }} HP</small></b
          >
          <span class="clash-bank">{{ game.plays.player }} / 2 PLAYS</span>
        </div>
      </div>

      <aside
        v-if="showHelp"
        class="clash-sidebar"
      >
        <div class="clash-info">
          <span class="clash-eyebrow">{{
            selectedCard
              ? 'READY TO PLAY'
              : selectedUnitCard
                ? 'FIELD INSPECTOR'
                : 'THE RULES'
          }}</span>
          <template v-if="selectedCard">
            <div class="clash-detail-art">
              <SlimeCityArtwork
                :image-id="slimeArtId('cards', selectedCard.id)"
                :alt="selectedCard.name"
                :fallback="selectedCard.symbol"
                compact
              />
            </div>
            <strong>{{ selectedCard.name }}</strong>
            <p>{{ clashCardText(selectedCard) }}</p>
            <small
              >{{ clashPlayCost(selectedCard) }} PLAY{{
                clashPlayCost(selectedCard) === 2 ? 'S' : ''
              }}
              · {{ selectedCard.kind.toUpperCase() }}</small
            >
            >
            <span class="clash-help"
              >Tap a glowing lane to play it. Tap the card again to
              cancel.</span
            >
          </template>
          <template v-else-if="selectedUnitCard">
            <div class="clash-detail-art">
              <SlimeCityArtwork
                :image-id="slimeArtId('cards', selectedUnitCard.id)"
                :alt="selectedUnitCard.name"
                :fallback="selectedUnitCard.symbol"
                compact
              />
            </div>
            <strong>{{ selectedUnitCard.name }}</strong>
            <p>{{ clashCardText(selectedUnitCard) }}</p>
            <span class="clash-help"
              >Fighters stay in their lane. Playing a new creature there
              replaces yours.</span
            >
          </template>
          <template v-else>
            <strong>TWO PLAYS. THEN ATTACK.</strong>
            <p>
              Draw five random cards each turn. Play two normal cards or one
              special two-play card. Unplayed cards are discarded.
            </p>
            <p>
              Select a friendly follower, then any enemy follower to trade power
              damage. If no enemies remain, attack the boss. Each follower may
              attack once per turn.
            </p>
            <span class="clash-help"
              >Surviving followers recover one life after both players finish.
              Placement still matters for traps, neighbors and swarm
              powers.</span
            >
          </template>
        </div>
        <div class="clash-recap" role="log" aria-label="Latest combat events">
          <span class="clash-eyebrow">LIVE PLAY-BY-PLAY</span>
          <ol>
            <li
              v-for="(event, index) in game.log.slice(-9).reverse()"
              :key="game.log.length - index"
              :class="'log-' + event.kind"
            >
              {{ event.text }}
            </li>
          </ol>
        </div>
      </aside>
    </div>

    <footer class="clash-bottom">
      <div class="clash-hud">
        <div class="clash-plays">
          <strong>{{
            game.victor
              ? resultText
              : busy
                ? 'RIVAL TURN'
                : game.phase === 'attack'
                  ? 'CHOOSE ATTACKS'
                  : 'YOUR HAND'
          }}</strong>
          <span
            >{{ game.plays.player }} / {{ CLASH_PLAYS }} card plays ·
            {{ game.decks.player.length }} in deck ·
            {{ game.discards.player.length }} discarded</span
          >
        </div>
        <button
          type="button"
          class="clash-pass"
          data-testid="clash-pass"
          :disabled="busy || game.active !== 'player' || !!game.victor"
          @click="pass"
        >
          {{ game.phase === 'play' ? 'TO ATTACKS' : 'END ATTACKS' }}
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div class="clash-hand" aria-label="Cards in your hand">
        <button
          v-for="(id, index) in game.hands.player"
          :key="id + ':' + index"
          type="button"
          class="clash-card"
          :class="{
            selected: heldIndex === index,
            unaffordable:
              game.phase !== 'play' ||
              clashPlayCost(cardById(id)) + game.plays.player > CLASH_PLAYS,
          }"
          :disabled="
            busy ||
            !!game.victor ||
            game.active !== 'player' ||
            game.phase !== 'play'
          "
          :title="clashCardText(cardById(id))"
          :data-testid="'clash-hand-' + index"
          :aria-pressed="heldIndex === index"
          @click="pick(index)"
        >
          <SlimeCityArtwork
            :image-id="slimeArtId('cards', id)"
            :alt="cardById(id).name"
            :fallback="cardById(id).symbol"
            compact
          />
          <span class="clash-cost"
            >{{ clashPlayCost(cardById(id)) }} PLAY{{
              clashPlayCost(cardById(id)) === 2 ? 'S' : ''
            }}</span
          >
          <span class="clash-card-label"
            ><b>{{ cardById(id).name }}</b
            ><small>{{ cardById(id).kind }}</small></span
          >
        </button>
      </div>
      <span class="clash-footnote"
        >Local practice only. This match awards no Meat, cards or account
        progress.</span
      >
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import {
  cardById,
  teamById,
  type Card,
  type Side,
} from '~/utils/slimeCity/prototypes'
import {
  CLASH_BOSS_HP,
  CLASH_LANES,
  CLASH_PLAYS,
  CLASH_ROUND_LIMIT,
  canClashPlay,
  canClashAttack,
  attackClash,
  endClashTurn,
  chooseClashCpu,
  clashPlayCost,
  clashCardText,
  clashPower,
  clashUnitAt,
  createClash,
  passClash,
  playClash,
  type ClashState,
  type ClashUnit,
} from '~/utils/slimeCity/clash'
import { useSlimeCityStore } from '~/stores/slimeCity'

const lab = useSlimeCityStore()
const lanes = Array.from({ length: CLASH_LANES }, (_, lane) => lane)
const enemyTeam = computed(() =>
  lab.activeTeam === 'ironjaw' ? 'catgirls' : 'ironjaw',
)
const mine = computed(() => teamById(lab.activeTeam))
const rival = computed(() => teamById(enemyTeam.value))
let seed = 30611
const game = shallowRef<ClashState>(
  createClash(lab.activeTeam, enemyTeam.value, seed),
)
const heldIndex = ref<number | null>(null)
const selectedUnit = ref<number | null>(null)
const selectedAttacker = ref<number | null>(null)
const showHelp = ref(false)
const busy = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
function newMatch(): void {
  if (timer) clearTimeout(timer)
  timer = null
  busy.value = false
  heldIndex.value = null
  selectedUnit.value = null
  selectedAttacker.value = null
  showHelp.value = false
  game.value = createClash(lab.activeTeam, enemyTeam.value, ++seed)
}
watch(() => lab.activeTeam, newMatch)
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
const selectedCard = computed<Card | null>(() =>
  heldIndex.value === null
    ? null
    : cardById(game.value.hands.player[heldIndex.value]!),
)
const selectedUnitCard = computed<Card | null>(() => {
  const u = game.value.units.find((x) => x.uid === selectedUnit.value)
  return u ? cardById(u.cardId) : null
})
const phaseLabel = computed(() =>
  game.value.victor
    ? 'FINAL BELL'
    : busy.value || game.value.active === 'enemy'
      ? 'RIVAL THINKING'
      : game.value.phase === 'play'
        ? 'PLAY UP TO TWO CARDS'
        : 'PICK YOUR ATTACKS',
)
const bossTargetable = computed(
  () =>
    selectedAttacker.value !== null &&
    canClashAttack(game.value, 'player', selectedAttacker.value, 'boss'),
)
const resultText = computed(() =>
  game.value.victor === 'player'
    ? 'YOU WIN!'
    : game.value.victor === 'enemy'
      ? 'RIVAL WINS'
      : 'DRAW',
)
function unit(side: Side, lane: number): ClashUnit | undefined {
  return clashUnitAt(game.value, side, lane)
}
function artFor(u: ClashUnit): number | null {
  const face =
    u.hp < u.maxHp ? 'hurt' : u.side === 'player' ? 'fierce' : 'guard'
  return (
    slimeArtId('tokens', u.cardId + '/' + face) ?? slimeArtId('cards', u.cardId)
  )
}
function healthWidth(side: Side): string {
  return Math.max(0, (game.value.boss[side] / CLASH_BOSS_HP) * 100) + '%'
}
function allowedSide(card: Card, side: Side): boolean {
  if (card.kind === 'creature' || card.kind === 'trap') return side === 'player'
  if (
    card.kind === 'equipment' ||
    ['heal', 'armor', 'sharpen', 'boost', 'grant'].includes(card.effect ?? '')
  )
    return side === 'player'
  return side === 'enemy'
}
function targetable(side: Side, lane: number): boolean {
  if (busy.value || game.value.active !== 'player' || !selectedCard.value)
    return false
  return (
    allowedSide(selectedCard.value, side) &&
    canClashPlay(game.value, 'player', selectedCard.value.id, lane)
  )
}
function attackTargetable(side: Side, lane: number): boolean {
  if (
    busy.value ||
    game.value.phase !== 'attack' ||
    game.value.active !== 'player'
  )
    return false
  const follower = unit(side, lane)
  if (!follower) return false
  if (side === 'player') return !follower.attacked && !follower.rooted
  return (
    selectedAttacker.value !== null &&
    canClashAttack(game.value, 'player', selectedAttacker.value, follower.uid)
  )
}
function pick(index: number): void {
  if (game.value.phase !== 'play') return
  selectedUnit.value = null
  selectedAttacker.value = null
  heldIndex.value = heldIndex.value === index ? null : index
}
function slotLabel(side: Side, lane: number): string {
  const u = unit(side, lane)
  return (
    (side === 'player' ? 'Your ' : 'Enemy ') +
    'alley ' +
    (lane + 1) +
    (u ? ': ' + cardById(u.cardId).name + ', ' + u.hp + ' health' : ': empty') +
    (targetable(side, lane) || attackTargetable(side, lane)
      ? ', playable target'
      : '')
  )
}
function clickSlot(side: Side, lane: number): void {
  if (busy.value || game.value.active !== 'player' || game.value.victor) return
  const targetUnit = unit(side, lane)
  if (game.value.phase === 'attack') {
    if (
      side === 'player' &&
      targetUnit &&
      !targetUnit.attacked &&
      !targetUnit.rooted
    ) {
      selectedAttacker.value = targetUnit.uid
      selectedUnit.value = targetUnit.uid
      return
    }
    if (
      side === 'enemy' &&
      targetUnit &&
      selectedAttacker.value !== null &&
      canClashAttack(
        game.value,
        'player',
        selectedAttacker.value,
        targetUnit.uid,
      )
    ) {
      game.value = attackClash(
        game.value,
        'player',
        selectedAttacker.value,
        targetUnit.uid,
      )
      selectedAttacker.value = null
      selectedUnit.value = null
    }
    return
  }
  if (targetable(side, lane) && selectedCard.value) {
    const next = playClash(game.value, 'player', selectedCard.value.id, lane)
    if (next === game.value) return
    game.value = next
    heldIndex.value = null
    selectedUnit.value = null
    return
  }
  if (targetUnit) {
    heldIndex.value = null
    selectedUnit.value = targetUnit.uid
  }
}
function attackBoss(): void {
  if (selectedAttacker.value === null || !bossTargetable.value) return
  game.value = attackClash(game.value, 'player', selectedAttacker.value, 'boss')
  selectedAttacker.value = null
  selectedUnit.value = null
}
function cpuReply(): void {
  if (game.value.active !== 'enemy' || game.value.victor || timer) return
  busy.value = true
  timer = setTimeout(() => {
    timer = null
    const action = chooseClashCpu(game.value)
    switch (action.t) {
      case 'play':
        game.value = playClash(game.value, 'enemy', action.card, action.lane)
        break
      case 'pass':
        game.value = passClash(game.value, 'enemy')
        break
      case 'attack':
        game.value = attackClash(game.value, 'enemy', action.uid, action.target)
        break
      case 'end':
        game.value = endClashTurn(game.value, 'enemy')
        break
    }
    busy.value = game.value.active === 'enemy' && !game.value.victor
    cpuReply()
  }, 350)
}
function pass(): void {
  if (busy.value || game.value.active !== 'player' || game.value.victor) return
  game.value =
    game.value.phase === 'play'
      ? passClash(game.value, 'player')
      : endClashTurn(game.value, 'player')
  heldIndex.value = null
  selectedUnit.value = null
  selectedAttacker.value = null
  cpuReply()
}
function forecast(lane: number): string {
  const ours = unit('player', lane)
  const theirs = unit('enemy', lane)
  if (!ours && !theirs) return '◇'
  const label = (u: ClashUnit): string =>
    u.attacked ? '✓' : u.rooted ? '⌁' : String(clashPower(game.value, u))
  return (ours ? label(ours) : '·') + ' / ' + (theirs ? label(theirs) : '·')
}
</script>

<style scoped>
.clash {
  --ink: #ecf9fc;
  --neon: #b9f151;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 0.65rem;
  color: var(--ink);
  background:
    radial-gradient(ellipse at 50% 5%, #265049bb, transparent 60%), #071115;
  font-family: inherit;
}
.clash button {
  cursor: pointer;
  color: inherit;
}
.clash button:disabled {
  cursor: default;
  opacity: 0.58;
}
.clash-top,
.clash-hud,
.clash-boss {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.clash-top {
  justify-content: space-between;
  flex: none;
  padding: 0.1rem 0.45rem;
}
.clash-title {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.clash-eyebrow,
.clash-round span {
  color: #9ad9cb;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.13em;
}
.clash-title strong {
  font-size: clamp(1.05rem, 2vw, 1.8rem);
  letter-spacing: 0.055em;
  line-height: 1.05;
}
.clash-title strong i {
  color: var(--neon);
  font-style: normal;
}
.clash-title small {
  font-size: 0.74rem;
  color: #c4d9d8;
}
.clash-round {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 0.18rem;
}
.clash-round b {
  color: var(--neon);
  letter-spacing: 0.06em;
  font-size: 0.88rem;
}
.clash-reset,
.clash-pass {
  background: #19332f;
  border: 1px solid #5c99917a;
  border-radius: 0.55rem;
  padding: 0.55rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 850;
}
.clash-reset:hover,
.clash-pass:hover:not(:disabled) {
  border-color: var(--neon);
}
.clash-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  position: relative;
  gap: 0.65rem;
  min-height: 0;
  flex: 1;
}
.clash-field {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.clash-boss {
  background: linear-gradient(110deg, #15342f, #0b2029);
  border: 1px solid #76b5a448;
  border-radius: 0.7rem;
  padding: 0.3rem 0.55rem;
  min-height: 3rem;
}
.clash-boss.is-enemy {
  background: linear-gradient(110deg, #4b1f31, #17212d);
  border-color: #ee819655;
}
.clash-boss :deep(img) {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: cover;
  border-radius: 0.4rem;
}
.clash-boss-name {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}
.clash-boss-name small {
  font-size: 0.57rem;
  color: #a3c2b9;
  letter-spacing: 0.09em;
}
.clash-boss-name strong {
  font-size: 0.75rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.clash-boss > b {
  flex: none;
  font-size: 1.1rem;
  color: #d7ffe7;
  font-variant-numeric: tabular-nums;
}
.clash-boss > b small {
  font-size: 0.54rem;
  font-weight: 600;
}
.clash-bank {
  font-size: 0.63rem;
  color: #d7ff89;
  white-space: nowrap;
}
.clash-health {
  background: #102026;
  border-radius: 0.2rem;
  height: 0.25rem;
  width: 100%;
  overflow: hidden;
}
.clash-health i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #b6ef63, #57cfb1);
  transition: width 0.25s;
}
.is-enemy .clash-health i {
  background: linear-gradient(90deg, #f3908c, #d95882);
}
.clash-board {
  position: relative;
  isolation: isolate;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 0;
  padding: 0.5rem;
  border-radius: 0.8rem;
  border: 1px solid #38877a77;
  background:
    linear-gradient(#0c2029bb, #12302899),
    repeating-linear-gradient(45deg, transparent 0 18px, #ffffff05 19px 20px);
}
.clash-lane-numbers,
.clash-row,
.clash-impact {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
}
.clash-lane-numbers {
  flex: none;
}
.clash-lane-numbers span {
  text-align: center;
  font-size: 0.59rem;
  color: #b5dfd1;
  letter-spacing: 0.08em;
}
.clash-row {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}
.clash-slot {
  min-height: 0;
  min-width: 0;
  border: 1px dashed #719d955e;
  border-radius: 0.65rem;
  overflow: hidden;
  position: relative;
  background: linear-gradient(145deg, #1e45444d, #0d222c99);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.clash-row.is-enemy .clash-slot {
  background: linear-gradient(145deg, #70364e73, #1b243099);
}
.clash-slot.filled {
  border-style: solid;
  border-color: #83c4ae88;
}
.clash-row.is-enemy .clash-slot.filled {
  border-color: #dc9cb088;
}
.clash-slot.target {
  border: 2px solid var(--neon);
  box-shadow:
    inset 0 0 18px #b9f13c40,
    0 0 11px #b9f13c40;
  opacity: 1;
}
.clash-slot.selected {
  border-color: #ffffff;
}
.clash-slot :deep(img) {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  opacity: 0.92;
}
.clash-fighter-label {
  position: absolute;
  bottom: 1.75rem;
  left: 0;
  right: 0;
  z-index: 1;
  padding: 0.45rem 0.2rem 0.25rem;
  font-size: clamp(0.5rem, 0.85vw, 0.8rem);
  line-height: 1.05;
  font-weight: 850;
  color: white;
  background: linear-gradient(transparent, #030e14ec);
  text-shadow: 0 1px 2px black;
}
.clash-numbers {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  justify-content: space-around;
  gap: 0.1rem;
  padding: 0.3rem 0.1rem;
  background: #06151de9;
  font-size: 0.7rem;
}
.clash-numbers b:first-child {
  color: #ffdd9a;
}
.clash-numbers b:last-child {
  color: #ff9ea4;
}
.clash-gear {
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  z-index: 1;
  font-size: 0.58rem;
  padding: 0.12rem 0.22rem;
  border-radius: 0.2rem;
  background: #03141af0;
}
.clash-empty {
  color: #95baad;
  font-size: clamp(0.5rem, 0.85vw, 0.7rem);
  letter-spacing: 0.06em;
  font-weight: 750;
}
.clash-impact {
  align-items: center;
  flex: none;
  min-height: 1.35rem;
}
.clash-impact span {
  text-align: center;
  color: #d9f9ab;
  font-size: clamp(0.55rem, 0.95vw, 0.73rem);
  font-weight: 850;
  white-space: nowrap;
}
.clash-map-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.32;
  pointer-events: none;
}
.clash-map-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.clash-face {
  color: #0e1d1b !important;
  background: #c4f862;
  border-radius: 0.5rem;
  padding: 0.4rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 900;
}
.clash-sidebar {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: min(270px, 48%);
  z-index: 5;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.clash-info,
.clash-recap {
  min-height: 0;
  border: 1px solid #4a8e7f55;
  border-radius: 0.7rem;
  padding: 0.65rem;
  background: #081c24d9;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.clash-info {
  flex: 0 0 auto;
  max-height: 65%;
  overflow-y: auto;
}
.clash-info strong {
  font-size: 0.9rem;
  line-height: 1.12;
}
.clash-info p {
  font-size: 0.78rem;
  line-height: 1.35;
  color: #c6dbd8;
  margin: 0;
}
.clash-info small {
  font-size: 0.67rem;
  color: var(--neon);
}
.clash-help {
  font-size: 0.67rem;
  color: #9ab5ae;
  line-height: 1.35;
}
.clash-detail-art {
  height: clamp(75px, 16vh, 170px);
  overflow: hidden;
  border-radius: 0.45rem;
}
.clash-detail-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.clash-recap {
  flex: 1;
  overflow: auto;
}
.clash-recap ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.clash-recap li {
  font-size: 0.71rem;
  line-height: 1.3;
  color: #a9ceca;
  border-bottom: 1px solid #ffffff0d;
  padding-bottom: 0.25rem;
}
.clash-recap li.log-boss {
  color: #ffe0a7;
}
.clash-recap li.log-death {
  color: #ffb6ac;
}
.clash-bottom {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.clash-hud {
  justify-content: space-between;
  padding: 0.05rem 0.3rem;
}
.clash-plays {
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
  flex-wrap: wrap;
}
.clash-plays strong {
  font-size: 0.88rem;
  color: var(--neon);
}
.clash-plays span {
  font-size: 0.72rem;
  color: #b3cfc7;
}
.clash-hand {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.4rem;
  min-height: clamp(145px, 21vh, 225px);
  max-height: 240px;
}
.clash-card {
  aspect-ratio: 2 / 3;
  overflow: hidden;
  min-width: 0;
  position: relative;
  border-radius: 0.5rem;
  border: 1px solid #7ca8a063;
  background: #16323a;
}
.clash-card.selected {
  border: 2px solid var(--neon);
  transform: translateY(-3px);
  box-shadow: 0 0 12px #b9f15166;
}
.clash-card.unaffordable {
  filter: saturate(0.45);
}
.clash-card :deep(img) {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  top: 0;
  left: 0;
}
.clash-cost {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  z-index: 1;
  min-width: 2rem;
  height: 1.25rem;
  padding: 0.05rem 0.25rem;
  border-radius: 0.4rem;
  background: #b9ef56;
  color: #071115;
  font-size: 0.75rem;
  font-weight: 900;
  display: grid;
  place-items: center;
}
.clash-card-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, #031219fc 40%);
  padding: 0.7rem 0.25rem 0.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.clash-card-label b {
  font-size: clamp(0.55rem, 0.8vw, 0.78rem);
  line-height: 1.1;
  text-align: left;
}
.clash-card-label small {
  font-size: 0.58rem;
  text-transform: uppercase;
  color: #bbd5c9;
}
.clash-footnote {
  font-size: 0.56rem;
  color: #88a89e;
  text-align: right;
}
@media (max-width: 850px) {
  .clash {
    overflow: auto;
  }
  .clash-stage {
    grid-template-columns: minmax(0, 1fr);
    flex: none;
  }
  .clash-sidebar {
    flex-direction: column;
    min-height: 100px;
  }
  .clash-info,
  .clash-recap {
    flex: 1;
    max-height: 190px;
  }
  .clash-row {
    min-height: 120px;
  }
  .clash-hand {
    min-height: 150px;
  }
}
@media (max-width: 520px) {
  .clash {
    padding: 0.35rem;
    gap: 0.45rem;
  }
  .clash-top {
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .clash-title strong {
    font-size: 1.25rem;
  }
  .clash-title small {
    font-size: 0.62rem;
  }
  .clash-round {
    order: 3;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .clash-boss {
    gap: 0.35rem;
    padding: 0.3rem;
  }
  .clash-bank {
    display: none;
  }
  .clash-boss > b {
    font-size: 0.85rem;
  }
  .clash-boss > b small {
    font-size: 0.5rem;
  }
  .clash-row {
    min-height: 95px;
    gap: 0.2rem;
  }
  .clash-board {
    padding: 0.3rem;
    gap: 0.2rem;
  }
  .clash-lane-numbers,
  .clash-impact {
    gap: 0.2rem;
  }
  .clash-lane-numbers span {
    font-size: 0.5rem;
  }
  .clash-fighter-label {
    font-size: 0.5rem;
    bottom: 1.5rem;
  }
  .clash-numbers {
    font-size: 0.55rem;
  }
  .clash-impact span {
    font-size: 0.51rem;
  }
  .clash-sidebar {
    flex-direction: column;
  }
  .clash-info {
    max-height: 200px;
  }
  .clash-recap {
    max-height: 100px;
  }
  .clash-hand {
    gap: 0.2rem;
    min-height: 125px;
  }
  .clash-card-label {
    padding: 0.6rem 0.1rem 0.15rem;
  }
  .clash-card-label b {
    font-size: 0.51rem;
  }
  .clash-card-label small {
    font-size: 0.47rem;
  }
  .clash-cost {
    min-width: 1.35rem;
    height: 1rem;
    font-size: 0.51rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .clash-slot,
  .clash-card,
  .clash-health i {
    transition: none;
  }
}
</style>
