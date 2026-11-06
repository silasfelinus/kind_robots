<!-- Five fixed lanes, two decisions per crew and one automatic simultaneous clash. -->
<template>
  <section class="clash" data-testid="slime-clash" aria-label="Slime City Clash prototype">
    <header class="clash-top">
      <div class="clash-title">
        <span class="clash-eyebrow">THE PITWORKS · FUN-FIRST PROTOTYPE</span>
        <strong>CLASH <i> / </i> FIVE ALLEYS</strong>
        <small>Pick your positions. Two plays each. Then everyone fights.</small>
      </div>
      <div class="clash-round">
        <span>ROUND {{ game.round }} / {{ CLASH_ROUND_LIMIT }}</span>
        <b>{{ game.victor ? 'FINAL BELL' : busy ? 'RIVAL THINKING' : 'YOUR CALL' }}</b>
      </div>
      <button class="clash-reset" type="button" data-testid="clash-restart" @click="newMatch">
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
            <span class="clash-health"><i :style="{ width: healthWidth('enemy') }" /></span>
          </div>
          <b>{{ game.boss.enemy }} <small>/ {{ CLASH_BOSS_HP }} HP</small></b>
          <span class="clash-bank">{{ game.mana.enemy }} MANA</span>
        </div>

        <div class="clash-board" role="grid" aria-label="Five parallel combat lanes">
          <div class="clash-lane-numbers">
            <span v-for="lane in lanes" :key="lane">ALLEY {{ lane + 1 }}</span>
          </div>
          <div class="clash-row is-enemy" role="row" aria-label="Enemy creatures">
            <button
              v-for="lane in lanes"
              :key="'enemy-' + lane"
              type="button"
              class="clash-slot"
              :class="{ filled: !!unit('enemy', lane), target: targetable('enemy', lane), selected: selectedUnit === unit('enemy', lane)?.uid }"
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
                <span class="clash-fighter-label">{{ cardById(unit('enemy', lane)!.cardId).name }}</span>
                <span class="clash-numbers"><b>{{ clashPower(game, unit('enemy', lane)!) }} ⚔</b><b>{{ unit('enemy', lane)!.hp }} ♥</b></span>
                <span v-if="unit('enemy', lane)!.gear.length" class="clash-gear">✦ {{ unit('enemy', lane)!.gear.length }}</span>
              </template>
              <span v-else class="clash-empty">{{ targetable('enemy', lane) ? 'TARGET' : 'OPEN' }}</span>
            </button>
          </div>
          <div class="clash-impact" aria-label="Current combat forecast, before remaining card plays">
            <span v-for="lane in lanes" :key="'forecast-' + lane">
              {{ forecast(lane) }}
            </span>
          </div>
          <div class="clash-row is-player" role="row" aria-label="Your creatures">
            <button
              v-for="lane in lanes"
              :key="'player-' + lane"
              type="button"
              class="clash-slot"
              :class="{ filled: !!unit('player', lane), target: targetable('player', lane), selected: selectedUnit === unit('player', lane)?.uid }"
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
                <span class="clash-fighter-label">{{ cardById(unit('player', lane)!.cardId).name }}</span>
                <span class="clash-numbers"><b>{{ clashPower(game, unit('player', lane)!) }} ⚔</b><b>{{ unit('player', lane)!.hp }} ♥</b></span>
                <span v-if="unit('player', lane)!.gear.length" class="clash-gear">✦ {{ unit('player', lane)!.gear.length }}</span>
              </template>
              <span v-else class="clash-empty">{{ targetable('player', lane) ? 'PLAY HERE' : 'OPEN' }}</span>
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
            <span class="clash-health"><i :style="{ width: healthWidth('player') }" /></span>
          </div>
          <b>{{ game.boss.player }} <small>/ {{ CLASH_BOSS_HP }} HP</small></b>
          <span class="clash-bank">{{ game.mana.player }} MANA</span>
        </div>
      </div>

      <aside class="clash-sidebar">
        <div class="clash-info">
          <span class="clash-eyebrow">{{ selectedCard ? 'READY TO PLAY' : selectedUnitCard ? 'FIELD INSPECTOR' : 'THE RULES' }}</span>
          <template v-if="selectedCard">
            <div class="clash-detail-art">
              <SlimeCityArtwork :image-id="slimeArtId('cards', selectedCard.id)" :alt="selectedCard.name" :fallback="selectedCard.symbol" compact />
            </div>
            <strong>{{ selectedCard.name }}</strong>
            <p>{{ clashCardText(selectedCard) }}</p>
            <small>{{ selectedCard.cost }} MANA · {{ selectedCard.kind.toUpperCase() }}</small>
            <span class="clash-help">Tap a glowing lane to play it. Tap the card again to cancel.</span>
          </template>
          <template v-else-if="selectedUnitCard">
            <div class="clash-detail-art">
              <SlimeCityArtwork :image-id="slimeArtId('cards', selectedUnitCard.id)" :alt="selectedUnitCard.name" :fallback="selectedUnitCard.symbol" compact />
            </div>
            <strong>{{ selectedUnitCard.name }}</strong>
            <p>{{ selectedUnitCard.text }}</p>
            <span class="clash-help">Fighters stay in their lane. Playing a new creature there replaces yours.</span>
          </template>
          <template v-else>
            <strong>NO MOVEMENT. JUST CONSEQUENCES.</strong>
            <p>Every round each crew plays two cards, one at a time. Then creatures clash simultaneously. Unblocked creatures hit the boss.</p>
            <span class="clash-help">Attack, health and current damage forecasts are always visible. A rival play can change them.</span>
          </template>
        </div>
        <div class="clash-recap" role="log" aria-label="Latest combat events">
          <span class="clash-eyebrow">LIVE PLAY-BY-PLAY</span>
          <ol>
            <li v-for="(event, index) in game.log.slice(-9).reverse()" :key="game.log.length - index" :class="'log-' + event.kind">{{ event.text }}</li>
          </ol>
        </div>
      </aside>
    </div>

    <footer class="clash-bottom">
      <div class="clash-hud">
        <div class="clash-plays">
          <strong>{{ game.victor ? resultText : busy ? 'RIVAL RESPONDING' : 'YOUR HAND' }}</strong>
          <span>{{ game.plays.player }} / {{ CLASH_PLAYS }} plays · {{ game.mana.player }} mana · {{ game.decks.player.length }} in deck</span>
        </div>
        <button type="button" class="clash-pass" data-testid="clash-pass" :disabled="busy || game.active !== 'player' || !!game.victor" @click="pass">
          PASS <span aria-hidden="true">›</span>
        </button>
      </div>
      <div class="clash-hand" aria-label="Cards in your hand">
        <button
          v-for="(id, index) in game.hands.player"
          :key="id + ':' + index"
          type="button"
          class="clash-card"
          :class="{ selected: heldIndex === index, unaffordable: cardById(id).cost > game.mana.player }"
          :disabled="busy || !!game.victor || game.active !== 'player'"
          :data-testid="'clash-hand-' + index"
          :aria-pressed="heldIndex === index"
          @click="pick(index)"
        >
          <SlimeCityArtwork :image-id="slimeArtId('cards', id)" :alt="cardById(id).name" :fallback="cardById(id).symbol" compact />
          <span class="clash-cost">{{ cardById(id).cost }}</span>
          <span class="clash-card-label"><b>{{ cardById(id).name }}</b><small>{{ cardById(id).kind }}</small></span>
        </button>
      </div>
      <span class="clash-footnote">Local practice only. This match awards no Meat, cards or account progress.</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { cardById, teamById, type Card, type Side } from '~/utils/slimeCity/prototypes'
import {
  CLASH_BOSS_HP,
  CLASH_LANES,
  CLASH_PLAYS,
  CLASH_ROUND_LIMIT,
  canClashPlay,
  chooseClashCpu,
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
const enemyTeam = computed(() => lab.activeTeam === 'ironjaw' ? 'catgirls' : 'ironjaw')
const mine = computed(() => teamById(lab.activeTeam))
const rival = computed(() => teamById(enemyTeam.value))
let seed = 30611
const game = shallowRef<ClashState>(createClash(lab.activeTeam, enemyTeam.value, seed))
const heldIndex = ref<number | null>(null)
const selectedUnit = ref<number | null>(null)
const busy = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
function newMatch(): void {
  if (timer) clearTimeout(timer)
  timer = null
  busy.value = false
  heldIndex.value = null
  selectedUnit.value = null
  game.value = createClash(lab.activeTeam, enemyTeam.value, ++seed)
}
watch(() => lab.activeTeam, newMatch)
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
const selectedCard = computed<Card | null>(() =>
  heldIndex.value === null ? null : cardById(game.value.hands.player[heldIndex.value]!) )
const selectedUnitCard = computed<Card | null>(() => {
  const u = game.value.units.find((x) => x.uid === selectedUnit.value)
  return u ? cardById(u.cardId) : null
})
const resultText = computed(() => game.value.victor === 'player' ? 'YOU WIN!' : game.value.victor === 'enemy' ? 'RIVAL WINS' : 'DRAW')
function unit(side: Side, lane: number): ClashUnit | undefined { return clashUnitAt(game.value, side, lane) }
function artFor(u: ClashUnit): number | null {
  const face = u.hp < u.maxHp ? 'hurt' : u.side === 'player' ? 'fierce' : 'guard'
  return slimeArtId('tokens', u.cardId + '/' + face) ?? slimeArtId('cards', u.cardId)
}
function healthWidth(side: Side): string { return Math.max(0, game.value.boss[side] / CLASH_BOSS_HP * 100) + '%' }
function allowedSide(card: Card, side: Side): boolean {
  if (card.kind === 'creature' || card.kind === 'trap') return side === 'player'
  if (card.kind === 'equipment' || ['heal', 'armor', 'sharpen', 'boost', 'grant'].includes(card.effect ?? '')) return side === 'player'
  return side === 'enemy'
}
function targetable(side: Side, lane: number): boolean {
  if (busy.value || game.value.active !== 'player' || !selectedCard.value) return false
  return allowedSide(selectedCard.value, side) && canClashPlay(game.value, 'player', selectedCard.value.id, lane)
}
function pick(index: number): void {
  selectedUnit.value = null
  heldIndex.value = heldIndex.value === index ? null : index
}
function slotLabel(side: Side, lane: number): string {
  const u = unit(side, lane)
  return (side === 'player' ? 'Your ' : 'Enemy ') + 'alley ' + (lane + 1) + (u ? ': ' + cardById(u.cardId).name + ', ' + u.hp + ' health' : ': empty') + (targetable(side, lane) ? ', playable target' : '')
}
function clickSlot(side: Side, lane: number): void {
  if (targetable(side, lane) && selectedCard.value) {
    const next = playClash(game.value, 'player', selectedCard.value.id, lane)
    if (next === game.value) return
    game.value = next
    heldIndex.value = null
    selectedUnit.value = null
    cpuReply()
    return
  }
  if (unit(side, lane)) {
    heldIndex.value = null
    selectedUnit.value = unit(side, lane)!.uid
  }
}
function cpuReply(): void {
  if (game.value.active !== 'enemy' || game.value.victor) return
  busy.value = true
  timer = setTimeout(() => {
    const action = chooseClashCpu(game.value)
    game.value = action.t === 'play'
      ? playClash(game.value, 'enemy', action.card, action.lane)
      : passClash(game.value, 'enemy')
    busy.value = false
    timer = null
    // Covers a rival's final decision when the player has already spent both plays.
    cpuReply()
  }, 550)
}
function pass(): void {
  game.value = passClash(game.value, 'player')
  heldIndex.value = null
  selectedUnit.value = null
  cpuReply()
}
function forecast(lane: number): string {
  const ours = unit('player', lane)
  const theirs = unit('enemy', lane)
  if (!ours && !theirs) return '◇'
  const a = ours ? (ours.rooted ? 0 : clashPower(game.value, ours)) : 0
  const b = theirs ? (theirs.rooted ? 0 : clashPower(game.value, theirs)) : 0
  if (ours && theirs) return Math.max(0, a - theirs.armor) + ' ↔ ' + Math.max(0, b - ours.armor)
  return ours ? 'BOSS −' + a : 'BOSS −' + b
}
</script>

<style scoped>
.clash { --ink: #ecf9fc; --neon: #b9f151; display:flex; flex-direction:column; gap:0.7rem; width:100%; height:100%; min-height:0; overflow:hidden; padding:0.65rem; color:var(--ink); background:radial-gradient(ellipse at 50% 5%,#265049bb,transparent 60%),#071115; font-family:inherit; }
.clash button { cursor:pointer; color:inherit; }
.clash button:disabled { cursor:default; opacity:.58; }
.clash-top,.clash-hud,.clash-boss { display:flex; align-items:center; gap:.7rem; }
.clash-top { justify-content:space-between; flex:none; padding:.1rem .45rem; }
.clash-title { display:flex; flex-direction:column; gap:.2rem; }
.clash-eyebrow,.clash-round span { color:#9ad9cb; font-size:.62rem; font-weight:850; letter-spacing:.13em; }
.clash-title strong { font-size:clamp(1.05rem,2vw,1.8rem); letter-spacing:.055em; line-height:1.05; }
.clash-title strong i { color:var(--neon); font-style:normal; }
.clash-title small { font-size:.74rem; color:#c4d9d8; }
.clash-round { display:flex; flex-direction:column; text-align:center; gap:.18rem; }
.clash-round b { color:var(--neon); letter-spacing:.06em; font-size:.88rem; }
.clash-reset,.clash-pass { background:#19332f; border:1px solid #5c99917a; border-radius:.55rem; padding:.55rem .75rem; display:flex; align-items:center; justify-content:center; gap:.3rem; font-size:.72rem; font-weight:850; }
.clash-reset:hover,.clash-pass:hover:not(:disabled) { border-color:var(--neon); }
.clash-stage { display:grid; grid-template-columns:minmax(0, 1fr) minmax(160px, 24%); gap:.65rem; min-height:0; flex:1; }
.clash-field { min-height:0; display:flex; flex-direction:column; gap:.35rem; }
.clash-boss { background:linear-gradient(110deg,#15342f,#0b2029); border:1px solid #76b5a448; border-radius:.7rem; padding:.3rem .55rem; min-height:3rem; }
.clash-boss.is-enemy { background:linear-gradient(110deg,#4b1f31,#17212d); border-color:#ee819655; }
.clash-boss :deep(img) { width:2.5rem; height:2.5rem; object-fit:cover; border-radius:.4rem; }
.clash-boss-name { flex:1; min-width:0; display:flex; flex-direction:column; gap:.08rem; }
.clash-boss-name small { font-size:.57rem; color:#a3c2b9; letter-spacing:.09em; }
.clash-boss-name strong { font-size:.75rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; }
.clash-boss > b { flex:none; font-size:1.1rem; color:#d7ffe7; font-variant-numeric:tabular-nums; }
.clash-boss > b small { font-size:.54rem; font-weight:600; }
.clash-bank { font-size:.63rem; color:#d7ff89; white-space:nowrap; }
.clash-health { background:#102026; border-radius:.2rem; height:.25rem; width:100%; overflow:hidden; }
.clash-health i { display:block; height:100%; background:linear-gradient(90deg,#b6ef63,#57cfb1); transition:width .25s; }
.is-enemy .clash-health i { background:linear-gradient(90deg,#f3908c,#d95882); }
.clash-board { flex:1; display:flex; flex-direction:column; gap:.3rem; min-height:0; padding:.5rem; border-radius:.8rem; border:1px solid #38877a77; background:linear-gradient(#0c2029bb,#12302899),repeating-linear-gradient(45deg,transparent 0 18px,#ffffff05 19px 20px); }
.clash-lane-numbers,.clash-row,.clash-impact { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.35rem; }
.clash-lane-numbers { flex:none; }
.clash-lane-numbers span { text-align:center; font-size:.59rem; color:#b5dfd1; letter-spacing:.08em; }
.clash-row { flex:1; min-height:0; }
.clash-slot { min-height:0; min-width:0; border:1px dashed #719d955e; border-radius:.65rem; overflow:hidden; position:relative; background:linear-gradient(145deg,#1e45444d,#0d222c99); display:flex; align-items:center; justify-content:center; flex-direction:column; }
.clash-row.is-enemy .clash-slot { background:linear-gradient(145deg,#70364e73,#1b243099); }
.clash-slot.filled { border-style:solid; border-color:#83c4ae88; }
.clash-row.is-enemy .clash-slot.filled { border-color:#dc9cb088; }
.clash-slot.target { border:2px solid var(--neon); box-shadow:inset 0 0 18px #b9f13c40,0 0 11px #b9f13c40; opacity:1; }
.clash-slot.selected { border-color:#ffffff; }
.clash-slot :deep(img) { position:absolute; top:0; left:0; height:100%; width:100%; object-fit:cover; opacity:.92; }
.clash-fighter-label { position:absolute; bottom:1.75rem; left:0; right:0; z-index:1; padding:.45rem .2rem .25rem; font-size:clamp(.5rem,.85vw,.8rem); line-height:1.05; font-weight:850; color:white; background:linear-gradient(transparent,#030e14ec); text-shadow:0 1px 2px black; }
.clash-numbers { position:absolute; bottom:0; left:0; right:0; z-index:1; display:flex; justify-content:space-around; gap:.1rem; padding:.3rem .1rem; background:#06151de9; font-size:.7rem; }
.clash-numbers b:first-child { color:#ffdd9a; }.clash-numbers b:last-child { color:#ff9ea4; }
.clash-gear { position:absolute; top:.2rem; right:.2rem; z-index:1; font-size:.58rem; padding:.12rem .22rem; border-radius:.2rem; background:#03141af0; }
.clash-empty { color:#95baad; font-size:clamp(.5rem,.85vw,.7rem); letter-spacing:.06em; font-weight:750; }
.clash-impact { align-items:center; flex:none; min-height:1.35rem; }
.clash-impact span { text-align:center; color:#d9f9ab; font-size:clamp(.55rem,.95vw,.73rem); font-weight:850; white-space:nowrap; }
.clash-sidebar { min-height:0; display:flex; flex-direction:column; gap:.5rem; }
.clash-info,.clash-recap { min-height:0; border:1px solid #4a8e7f55; border-radius:.7rem; padding:.65rem; background:#081c24d9; display:flex; flex-direction:column; gap:.45rem; }
.clash-info { flex:0 0 auto; max-height:65%; overflow-y:auto; }
.clash-info strong { font-size:.9rem; line-height:1.12; }
.clash-info p { font-size:.78rem; line-height:1.35; color:#c6dbd8; margin:0; }
.clash-info small { font-size:.67rem; color:var(--neon); }
.clash-help { font-size:.67rem; color:#9ab5ae; line-height:1.35; }
.clash-detail-art { height:clamp(75px,16vh,170px); overflow:hidden; border-radius:.45rem; }
.clash-detail-art :deep(img) { width:100%; height:100%; object-fit:cover; }
.clash-recap { flex:1; overflow:auto; }
.clash-recap ol { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:.4rem; }
.clash-recap li { font-size:.71rem; line-height:1.3; color:#a9ceca; border-bottom:1px solid #ffffff0d; padding-bottom:.25rem; }
.clash-recap li.log-boss { color:#ffe0a7; }.clash-recap li.log-death { color:#ffb6ac; }
.clash-bottom { flex:none; display:flex; flex-direction:column; gap:.35rem; }
.clash-hud { justify-content:space-between; padding:.05rem .3rem; }
.clash-plays { display:flex; gap:.4rem; align-items:baseline; flex-wrap:wrap; }
.clash-plays strong { font-size:.88rem; color:var(--neon); }
.clash-plays span { font-size:.72rem; color:#b3cfc7; }
.clash-hand { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.4rem; min-height:clamp(84px,13vh,130px); }
.clash-card { overflow:hidden; min-width:0; position:relative; border-radius:.5rem; border:1px solid #7ca8a063; background:#16323a; }
.clash-card.selected { border:2px solid var(--neon); transform:translateY(-3px); box-shadow:0 0 12px #b9f15166; }
.clash-card.unaffordable { filter:saturate(.45); }
.clash-card :deep(img) { position:absolute; width:100%; height:100%; object-fit:cover; top:0; left:0; }
.clash-cost { position:absolute; top:.2rem; left:.2rem; z-index:1; width:1.3rem; height:1.3rem; border-radius:50%; background:#b9ef56; color:#071115; font-size:.75rem; font-weight:900; display:grid; place-items:center; }
.clash-card-label { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent,#031219fc 40%); padding:.7rem .25rem .2rem; display:flex; flex-direction:column; align-items:flex-start; }
.clash-card-label b { font-size:clamp(.55rem,.8vw,.78rem); line-height:1.1; text-align:left; }
.clash-card-label small { font-size:.58rem; text-transform:uppercase; color:#bbd5c9; }
.clash-footnote { font-size:.56rem; color:#88a89e; text-align:right; }
@media(max-width:850px) {
  .clash { overflow:auto; }
  .clash-stage { grid-template-columns:minmax(0,1fr); flex:none; }
  .clash-sidebar { flex-direction:row; min-height:100px; }
  .clash-info,.clash-recap { flex:1; max-height:190px; }
  .clash-row { min-height:120px; }
  .clash-hand { min-height:105px; }
}
@media(max-width:520px) {
  .clash { padding:.35rem; gap:.45rem; }
  .clash-top { flex-wrap:wrap; gap:.35rem; }
  .clash-title strong { font-size:1.25rem; }
  .clash-title small { font-size:.62rem; }
  .clash-round { order:3; flex-direction:row; justify-content:space-between; width:100%; }
  .clash-boss { gap:.35rem; padding:.3rem; }
  .clash-bank { display:none; }
  .clash-boss > b { font-size:.85rem; }
  .clash-boss > b small { font-size:.5rem; }
  .clash-row { min-height:95px; gap:.2rem; }
  .clash-board { padding:.3rem; gap:.2rem; }
  .clash-lane-numbers,.clash-impact { gap:.2rem; }
  .clash-lane-numbers span { font-size:.5rem; }
  .clash-fighter-label { font-size:.5rem; bottom:1.5rem; }
  .clash-numbers { font-size:.55rem; }
  .clash-impact span { font-size:.51rem; }
  .clash-sidebar { flex-direction:column; }
  .clash-info { max-height:200px; }
  .clash-recap { max-height:100px; }
  .clash-hand { gap:.2rem; min-height:93px; }
  .clash-card-label { padding:.6rem .1rem .15rem; }
  .clash-card-label b { font-size:.51rem; }
  .clash-card-label small { font-size:.47rem; }
  .clash-cost { width:1rem; height:1rem; font-size:.61rem; }
}
@media(prefers-reduced-motion: reduce) { .clash-slot,.clash-card,.clash-health i { transition:none; } }
</style>
