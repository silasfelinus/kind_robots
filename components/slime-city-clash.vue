<!-- Canonical Clash: two card plays, then an animated automatic alley-by-alley strike sweep. -->
<template>
  <section
    class="clash"
    data-testid="slime-clash"
    aria-label="Slime City Clash"
  >
    <div class="clash-stage">
      <div class="clash-field">
        <div class="clash-boss is-enemy" :class="{ hit: bossHit === 'enemy' }">
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
            >{{ game.boss.enemy }}
            <small>/ {{ clashBossMax('enemy') }} HP</small></b
          >
          <span
            v-if="bossHit === 'enemy'"
            :key="'boss-enemy-' + impactKey"
            class="clash-float is-boss"
            >-{{ impact!.dealt }}</span
          >
          <span class="clash-bank">{{ game.plays.enemy }} / 2</span>
        </div>

        <div
          class="clash-board"
          role="grid"
          aria-label="Five parallel combat lanes"
        >
          <SlimeCityArtwork
            class="clash-map-art"
            :image-id="slimeArtId('boards', 'pitworks-blackout')"
            alt="Overhead painting of the Pitworks arena floor"
            fallback="⚡"
            compact
          />
          <div class="clash-lane-numbers">
            <span v-for="lane in lanes" :key="lane">ALLEY {{ lane + 1 }}</span>
          </div>
          <template v-for="side in sides" :key="side">
            <div
              class="clash-row"
              :class="'is-' + side"
              role="row"
              :aria-label="
                side === 'enemy' ? 'Enemy fighters' : 'Your fighters'
              "
            >
              <button
                v-for="lane in lanes"
                :key="side + '-' + lane"
                type="button"
                class="clash-slot"
                :class="{
                  filled: !!unit(side, lane),
                  target: targetable(side, lane),
                  selected: selectedUnit === unit(side, lane)?.uid,
                  lunge: lunge?.side === side && lunge.lane === lane,
                  hit: floater(side, lane) !== null,
                }"
                :disabled="!targetable(side, lane) && !unit(side, lane)"
                :aria-label="slotLabel(side, lane)"
                :data-testid="'clash-' + side + '-' + lane"
                @click="clickSlot(side, lane)"
              >
                <template v-if="unit(side, lane)">
                  <SlimeCityArtwork
                    :image-id="artFor(unit(side, lane)!)"
                    :alt="cardById(unit(side, lane)!.cardId).name"
                    :fallback="cardById(unit(side, lane)!.cardId).symbol"
                    compact
                  />
                  <span class="clash-fighter-label">{{
                    cardById(unit(side, lane)!.cardId).name
                  }}</span>
                  <span class="clash-numbers"
                    ><b>{{ clashPower(game, unit(side, lane)!) }} ⚔</b
                    ><b>{{ unit(side, lane)!.hp }} ♥</b></span
                  >
                  <span v-if="status(unit(side, lane)!)" class="clash-status">{{
                    status(unit(side, lane)!)
                  }}</span>
                  <span v-if="unit(side, lane)!.gear.length" class="clash-gear"
                    >✦ {{ unit(side, lane)!.gear.length }}</span
                  >
                </template>
                <span v-else class="clash-empty">{{
                  targetable(side, lane)
                    ? side === 'player'
                      ? 'PLAY HERE'
                      : 'TARGET'
                    : 'OPEN'
                }}</span>
                <span
                  v-if="floater(side, lane) !== null"
                  :key="'float-' + impactKey + side + lane"
                  class="clash-float"
                  >{{ floater(side, lane) }}</span
                >
              </button>
            </div>
            <div
              v-if="side === 'enemy'"
              class="clash-impact"
              aria-label="What each alley will do this turn"
            >
              <span
                v-for="lane in lanes"
                :key="'forecast-' + lane"
                :class="{ striking: lunge?.lane === lane }"
              >
                {{ forecast(lane) }}
              </span>
            </div>
          </template>
        </div>
        <div
          class="clash-boss is-player"
          :class="{ hit: bossHit === 'player' }"
        >
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
            >{{ game.boss.player }}
            <small>/ {{ clashBossMax('player') }} HP</small></b
          >
          <span
            v-if="bossHit === 'player'"
            :key="'boss-player-' + impactKey"
            class="clash-float is-boss"
            >-{{ impact!.dealt }}</span
          >
          <span class="clash-bank">{{ game.plays.player }} / 2</span>
        </div>
      </div>
    </div>

    <footer class="clash-bottom">
      <div class="clash-hud">
        <div class="clash-plays">
          <strong>{{ phaseLabel }}</strong>
          <span
            >{{ game.plays.player }} / {{ CLASH_PLAYS }} card plays ·
            {{ game.decks.player.length }} in deck ·
            {{ game.discards.player.length }} discarded</span
          >
        </div>
        <button
          type="button"
          class="clash-reset"
          data-testid="clash-restart"
          title="Start a new Clash match"
          @click="newMatch"
        >
          ↻ REMATCH
        </button>
        <button
          type="button"
          class="clash-pass"
          data-testid="clash-pass"
          title="Skip remaining card plays and send your crew in"
          :disabled="
            busy ||
            game.active !== 'player' ||
            game.phase !== 'play' ||
            !!game.victor
          "
          @click="pass"
        >
          FIGHT <span aria-hidden="true">›</span>
        </button>
      </div>
      <div class="clash-tray">
        <div class="clash-hand" aria-label="Cards in your hand">
          <button
            v-for="(id, index) in game.hands.player"
            :key="id + ':' + index"
            type="button"
            class="clash-card"
            :class="{
              selected: heldIndex === index,
              unaffordable: !playableNow(id),
            }"
            :aria-disabled="!playableNow(id)"
            :title="clashCardText(cardById(id))"
            :data-testid="'clash-hand-' + index"
            :aria-pressed="heldIndex === index"
            @click="pick(index)"
          >
            <SlimeCityArtwork
              :image-id="slimeArtId('cards', id)"
              :fallback-image-id="
                slimeArtId(
                  'crews',
                  cardById(id).team === 'mercenary'
                    ? lab.activeTeam
                    : cardById(id).team,
                )
              "
              :title="
                slimeArtId('cards', id)
                  ? cardById(id).name
                  : 'Crew art preview: bespoke Comfy card illustration pending'
              "
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
              ><em>{{ clashCardBadge(cardById(id)) }}</em
              ><b>{{ cardById(id).name }}</b
              ><small>{{ kindLabel(cardById(id)) }}</small></span
            >
          </button>
        </div>
        <aside
          class="clash-detail"
          data-testid="clash-detail"
          aria-live="polite"
        >
          <template v-if="detail">
            <strong>{{ detail.name }}</strong>
            <small>{{ detail.meta }}</small>
            <p>{{ detail.text }}</p>
          </template>
          <p v-else class="clash-detail-hint">{{ hint }}</p>
        </aside>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import {
  cardById,
  teamById,
  type Card,
  type Side,
} from '~/utils/slimeCity/prototypes'
import {
  CLASH_LANES,
  CLASH_PLAYS,
  canClashPlay,
  chooseClashCpu,
  clashBossMax,
  clashCardBadge,
  clashCardText,
  clashPlayCost,
  clashPower,
  clashUnitAt,
  createClash,
  endClashTurn,
  nextClashStrike,
  passClash,
  playClash,
  strikeClash,
  type ClashState,
  type ClashStrike,
  type ClashUnit,
} from '~/utils/slimeCity/clash'
import { useSlimeCityStore } from '~/stores/slimeCity'

const STRIKE_WINDUP_MS = 320
const STRIKE_SETTLE_MS = 560
const CPU_PLAY_MS = 520

const lab = useSlimeCityStore()
const lanes = Array.from({ length: CLASH_LANES }, (_, lane) => lane)
const sides: Side[] = ['enemy', 'player']
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
const lunge = ref<{ side: Side; lane: number } | null>(null)
const impact = ref<ClashStrike | null>(null)
const impactKey = ref(0)
const pace = ref(1)
let timer: ReturnType<typeof setTimeout> | null = null

const busy = computed(
  () =>
    !game.value.victor &&
    (game.value.active === 'enemy' || game.value.phase === 'attack'),
)
function stopTimer(): void {
  if (timer) clearTimeout(timer)
  timer = null
}
function schedule(ms: number): void {
  stopTimer()
  timer = setTimeout(
    () => {
      timer = null
      advance()
    },
    Math.round(ms * pace.value),
  )
}
/** One beat of the automatic flow: rival card plays, then each alley strike. */
function advance(): void {
  const s = game.value
  if (s.victor) {
    lunge.value = null
    return
  }
  if (s.phase === 'attack') {
    const lane = nextClashStrike(s, s.active)
    if (lane < 0) {
      lunge.value = null
      impact.value = null
      game.value = endClashTurn(s, s.active)
      if (busy.value) schedule(CPU_PLAY_MS)
      return
    }
    if (lunge.value?.side !== s.active || lunge.value.lane !== lane) {
      impact.value = null
      lunge.value = { side: s.active, lane }
      schedule(STRIKE_WINDUP_MS)
      return
    }
    game.value = strikeClash(s, s.active)
    impact.value = game.value.strike
    impactKey.value++
    schedule(STRIKE_SETTLE_MS)
    return
  }
  if (s.active !== 'enemy') return
  const action = chooseClashCpu(s)
  game.value =
    action.t === 'play'
      ? playClash(s, 'enemy', action.card, action.lane)
      : passClash(s, 'enemy')
  schedule(CPU_PLAY_MS)
}
function kick(): void {
  if (busy.value && !timer) schedule(CPU_PLAY_MS)
}
function newMatch(): void {
  stopTimer()
  heldIndex.value = null
  selectedUnit.value = null
  lunge.value = null
  impact.value = null
  game.value = createClash(lab.activeTeam, enemyTeam.value, ++seed)
}
watch(() => lab.activeTeam, newMatch)
onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    pace.value = 0.4
})
onBeforeUnmount(stopTimer)

const selectedCard = computed<Card | null>(() => {
  const id =
    heldIndex.value === null ? null : game.value.hands.player[heldIndex.value]
  return id ? cardById(id) : null
})
const resultText = computed(() =>
  game.value.victor === 'player'
    ? 'YOU WIN!'
    : game.value.victor === 'enemy'
      ? 'RIVAL WINS'
      : 'DRAW',
)
const phaseLabel = computed(() => {
  const s = game.value
  if (s.victor) return resultText.value
  if (s.phase === 'attack')
    return s.active === 'player' ? 'YOUR CREW STRIKES' : 'RIVAL STRIKES'
  if (s.active === 'enemy') return 'RIVAL PLAYING'
  return s.plays.player === 0
    ? 'PLAY UP TO TWO CARDS'
    : 'ONE MORE PLAY, THEN FIGHT'
})
const bossHit = computed<Side | null>(() =>
  impact.value?.target === 'boss' && impact.value.dealt > 0
    ? impact.value.side === 'player'
      ? 'enemy'
      : 'player'
    : null,
)
const detail = computed<{ name: string; meta: string; text: string } | null>(
  () => {
    if (selectedCard.value) {
      const card = selectedCard.value
      const plays = clashPlayCost(card)
      return {
        name: card.name,
        meta:
          kindLabel(card) +
          ' · ' +
          plays +
          ' PLAY' +
          (plays === 2 ? 'S' : '') +
          (playableNow(card.id) ? ' · tap a glowing alley' : ''),
        text: clashCardText(card),
      }
    }
    const u = game.value.units.find((v) => v.uid === selectedUnit.value)
    if (!u) return null
    const card = cardById(u.cardId)
    return {
      name: card.name,
      meta:
        (u.side === 'player' ? 'YOUR FIGHTER' : 'RIVAL FIGHTER') +
        ' · ALLEY ' +
        (u.lane + 1) +
        ' · ' +
        clashPower(game.value, u) +
        ' ⚔ ' +
        u.hp +
        '/' +
        u.maxHp +
        ' ♥' +
        (u.armor ? ' · ' + u.armor + ' ARMOR' : ''),
      text:
        clashCardText(card) +
        (u.rooted ? ' Stunned: skips its next strike.' : '') +
        (u.fresh ? ' Just landed: reaches the boss next turn.' : ''),
    }
  },
)
const hint = computed(() => {
  if (busy.value || game.value.victor)
    return game.value.log[game.value.log.length - 1]?.text ?? 'Clash!'
  return 'Tap a card or fighter to read what it does. Fighters strike straight across their own alley; an open alley hits the boss.'
})

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
  return Math.max(0, (game.value.boss[side] / clashBossMax(side)) * 100) + '%'
}
function kindLabel(card: Card): string {
  return card.kind === 'creature'
    ? 'FIGHTER'
    : card.kind === 'equipment'
      ? 'GEAR'
      : card.kind.toUpperCase()
}
function status(u: ClashUnit): string {
  if (u.rooted) return 'STUN'
  if (u.fresh && !game.value.victor) return 'NEW'
  return ''
}
function playableNow(id: string): boolean {
  const s = game.value
  return (
    !busy.value &&
    !s.victor &&
    s.active === 'player' &&
    s.phase === 'play' &&
    clashPlayCost(cardById(id)) + s.plays.player <= CLASH_PLAYS
  )
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
  const card = selectedCard.value
  if (!card || !playableNow(card.id)) return false
  return (
    allowedSide(card, side) && canClashPlay(game.value, 'player', card.id, lane)
  )
}
function floater(side: Side, lane: number): string | null {
  const hit = impact.value
  if (!hit || hit.lane !== lane) return null
  if (side === hit.side)
    return hit.returned > 0 || hit.attackerFell
      ? (hit.trap ? 'TRAP -' : '-') + hit.returned
      : null
  if (hit.target !== 'unit') return null
  return hit.dealt > 0 ? '-' + hit.dealt : 'BLOCK'
}
function pick(index: number): void {
  selectedUnit.value = null
  heldIndex.value = heldIndex.value === index ? null : index
}
function slotLabel(side: Side, lane: number): string {
  const u = unit(side, lane)
  return (
    (side === 'player' ? 'Your ' : 'Enemy ') +
    'alley ' +
    (lane + 1) +
    (u ? ': ' + cardById(u.cardId).name + ', ' + u.hp + ' health' : ': empty') +
    (targetable(side, lane) ? ', playable target' : '')
  )
}
function clickSlot(side: Side, lane: number): void {
  const card = selectedCard.value
  if (card && targetable(side, lane)) {
    const next = playClash(game.value, 'player', card.id, lane)
    if (next === game.value) return
    game.value = next
    heldIndex.value = null
    selectedUnit.value = null
    kick()
    return
  }
  const targetUnit = unit(side, lane)
  if (targetUnit) {
    heldIndex.value = null
    selectedUnit.value =
      selectedUnit.value === targetUnit.uid ? null : targetUnit.uid
  }
}
function pass(): void {
  if (busy.value || game.value.active !== 'player' || game.value.victor) return
  game.value = passClash(game.value, 'player')
  heldIndex.value = null
  kick()
}
function forecast(lane: number): string {
  const ours = unit('player', lane)
  const theirs = unit('enemy', lane)
  if (!ours && !theirs) return '◇'
  const power = (u: ClashUnit): string =>
    u.rooted ? '⌁' : String(clashPower(game.value, u))
  if (ours && theirs) return power(theirs) + ' ⇅ ' + power(ours)
  if (ours) return '▲ ' + power(ours)
  return '▼ ' + power(theirs!)
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

/* The playmat, not the hand or duplicated page furniture, owns this screen. */
.clash {
  gap: 0.22rem;
  padding: 0.28rem;
}
.clash-stage {
  flex: 1 1 auto;
  min-height: 0;
  gap: 0;
}
.clash-field {
  flex: 1 1 auto;
  min-height: 0;
  gap: 0.18rem;
}
.clash-boss {
  min-height: 2.15rem;
  max-height: 2.5rem;
  padding: 0.15rem 0.45rem;
  background: #0d2831ee;
}
.clash-boss.is-enemy {
  background: #2e1b2aee;
}
.clash-boss :deep(.slime-art) {
  flex: 0 0 1.95rem;
  width: 1.95rem;
  height: 1.95rem;
}
.clash-boss :deep(img) {
  width: 1.85rem;
  height: 1.85rem;
}
.clash-boss-name {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
.clash-boss-name strong {
  font-size: 0.82rem;
}
.clash-boss-name small {
  display: none;
}
.clash-boss-name .clash-health {
  max-width: 10rem;
}
.clash-boss > b {
  font-size: 0.86rem;
}
.clash-boss .clash-bank {
  font-size: 0.62rem;
}
.clash-board {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.3rem;
  gap: 0.2rem;
  background: #101e23;
}
.clash-map-art {
  opacity: 0.86;
}
.clash-slot {
  background: #06171f31;
  backdrop-filter: brightness(0.94);
  border-color: #d6e8d266;
}
.clash-row.is-enemy .clash-slot {
  background: #301a2a46;
}
.clash-lane-numbers span {
  color: #fff0c7;
  text-shadow: 0 1px 4px #06121d;
}
.clash-impact {
  z-index: 2;
  border-radius: 0.3rem;
  background: #061a1db5;
}
.clash-bottom {
  flex: none;
  gap: 0.25rem;
}
.clash-hud {
  min-height: 1.65rem;
  padding: 0.05rem 0.3rem;
}
.clash-plays span {
  font-size: 0.64rem;
}
.clash-plays strong {
  font-size: 0.74rem;
}
.clash-reset,
.clash-pass {
  padding: 0.35rem 0.55rem;
  font-size: 0.66rem;
}
.clash-hand {
  display: flex;
  justify-content: center;
  gap: clamp(0.2rem, 0.65vw, 0.5rem);
  min-height: 0;
  max-height: clamp(100px, 17vh, 160px);
}
.clash-card {
  flex: 0 1 clamp(70px, 9vw, 103px);
  width: clamp(70px, 9vw, 103px);
  max-height: clamp(100px, 17vh, 160px);
  aspect-ratio: 2 / 3;
}
.clash-card-label b {
  font-size: clamp(0.52rem, 0.74vw, 0.69rem);
}
@media (max-width: 850px) {
  .clash {
    overflow: hidden;
  }
  .clash-stage {
    grid-template-columns: minmax(0, 1fr);
    flex: 1 1 auto;
  }
  .clash-hand {
    min-height: 0;
    max-height: 130px;
  }
  .clash-card {
    flex-basis: clamp(56px, 17vw, 88px);
    width: clamp(56px, 17vw, 88px);
    max-height: 130px;
  }
}
@media (max-width: 520px) {
  .clash-hand {
    max-height: 110px;
  }
  .clash-card {
    flex-basis: min(18vw, 70px);
    width: min(18vw, 70px);
    max-height: 110px;
  }
  .clash-boss {
    gap: 0.25rem;
  }
  .clash-boss-name .clash-health {
    max-width: 3rem;
  }
}
/* Automatic alley sweep: the striker lunges across, the struck side shakes. */
.clash-row:has(.lunge) {
  z-index: 3;
}
.clash-slot.lunge {
  z-index: 3;
  border-color: #fff3b0;
  box-shadow: 0 0 18px #ffe07a99;
}
.clash-row.is-player .clash-slot.lunge {
  animation: clash-lunge-up 0.6s ease-in-out;
}
.clash-row.is-enemy .clash-slot.lunge {
  animation: clash-lunge-down 0.6s ease-in-out;
}
.clash-slot.hit:not(.lunge),
.clash-boss.hit {
  animation: clash-shake 0.36s ease-in-out;
}
.clash-boss {
  position: relative;
}
.clash-boss.hit {
  border-color: #ff9ea4;
  box-shadow: 0 0 16px #ff6f7a88;
}
@keyframes clash-lunge-up {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  55% {
    transform: translateY(-34%) scale(1.06);
  }
}
@keyframes clash-lunge-down {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  55% {
    transform: translateY(34%) scale(1.06);
  }
}
@keyframes clash-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6%);
  }
  45% {
    transform: translateX(5%);
  }
  70% {
    transform: translateX(-3%);
  }
}
.clash-float {
  position: absolute;
  z-index: 4;
  left: 50%;
  top: 38%;
  transform: translate(-50%, 0);
  pointer-events: none;
  font-size: clamp(1rem, 2.4vw, 1.9rem);
  font-weight: 950;
  color: #ffe2e4;
  text-shadow:
    0 0 6px #ff3b5c,
    0 2px 3px #000;
  white-space: nowrap;
  animation: clash-float 0.9s ease-out forwards;
}
.clash-float.is-boss {
  top: -0.2rem;
  left: auto;
  right: 4.5rem;
  font-size: 1.15rem;
}
@keyframes clash-float {
  0% {
    opacity: 0;
    transform: translate(-50%, 20%) scale(0.7);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1.15);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -70%) scale(1);
  }
}
.clash-impact span.striking {
  color: #fff3b0;
  text-shadow: 0 0 8px #ffd34d;
}
.clash-status {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  z-index: 1;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.25rem;
  border-radius: 0.2rem;
  background: #03141af0;
  color: #d7ff89;
}
/* Readable cards: a badge on every hand card and a rules panel beside the hand. */
.clash-card-label em {
  font-style: normal;
  font-size: clamp(0.5rem, 0.72vw, 0.68rem);
  font-weight: 900;
  color: #ffe6a6;
  line-height: 1.1;
}
.clash-tray {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  gap: 0.5rem;
  min-height: 0;
}
.clash-tray .clash-hand {
  grid-column: 2;
}
.clash-detail {
  grid-column: 3;
  min-width: 0;
  max-width: 24rem;
  max-height: clamp(100px, 17vh, 160px);
  overflow-y: auto;
  border: 1px solid #4a8e7f55;
  border-radius: 0.6rem;
  padding: 0.4rem 0.55rem;
  background: #081c24d9;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.clash-detail strong {
  font-size: 0.82rem;
  line-height: 1.1;
}
.clash-detail small {
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  color: var(--neon);
}
.clash-detail p {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.3;
  color: #d3e6e2;
}
.clash-detail p.clash-detail-hint {
  color: #9ab5ae;
}
@media (max-width: 1100px) {
  .clash-tray {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .clash-tray .clash-hand {
    grid-column: 1;
  }
  .clash-detail {
    grid-column: 2;
    max-width: none;
  }
}
@media (max-width: 700px) {
  .clash-tray {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.25rem;
  }
  .clash-detail {
    max-height: 3.4rem;
    padding: 0.25rem 0.45rem;
  }
  .clash-detail p {
    font-size: 0.64rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .clash-slot.lunge,
  .clash-slot.hit,
  .clash-boss.hit {
    animation: none;
  }
  .clash-float {
    animation-duration: 0.5s;
  }
}
</style>
