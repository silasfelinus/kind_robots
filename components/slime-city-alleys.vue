<!-- /components/slime-city-alleys.vue -->
<!--
  FIVE ALLEYS (Silas, 2026-11-05: "we still lack the GAME ... Solforge style,
  you have five rows and you can only attack or defend in the row you placed
  ... non-grid, you chose to attach someone or the opponent, hearthstone
  style"). The board for utils/slimeCity/alleys.ts: two bosses, five alleys
  with one slot per crew, a hand of cards, chosen attacks, and a play-by-play
  log. The rival's turn plays out one command at a time so it can be read.
-->
<template>
  <section
    class="sca5"
    :class="'tone-' + myCrew.color"
    data-testid="slime-alleys"
    aria-label="Five Alleys"
  >
    <header class="sca5-top">
      <button
        type="button"
        class="sca5-boss enemy"
        :class="{ target: bossTargetable }"
        :disabled="!bossTargetable"
        data-testid="alley-boss-enemy"
        :aria-label="rivalCrew.name + ' boss, ' + game.boss.enemy + ' HP'"
        @click="chooseTarget('boss')"
      >
        <SlimeCityArtwork
          class="sca5-boss-art"
          :image-id="slimeArtId('crews', rivalCrew.id)"
          :alt="''"
          :fallback="rivalCrew.insignia"
          compact
        />
        <span class="sca5-boss-copy">
          <small>{{ rivalCrew.name }}</small>
          <b
            >{{ game.boss.enemy }}<i>/{{ ALLEY_BOSS_HP }}</i></b
          >
          <span class="sca5-hp"
            ><i
              :style="{
                width: (game.boss.enemy / ALLEY_BOSS_HP) * 100 + '%',
              }"
          /></span>
        </span>
        <span class="sca5-meta">
          <span>{{ game.hands.enemy.length }} in hand</span>
          <span>{{ game.decks.enemy.length }} in deck</span>
          <span>{{ game.mana.enemy }}/{{ game.maxMana.enemy }} mana</span>
        </span>
      </button>
      <div class="sca5-turn" role="status">
        <small>TURN {{ game.turn }} / {{ ALLEY_TURN_LIMIT }}</small>
        <strong>{{
          game.victor
            ? game.victor === 'player'
              ? 'YOU WIN'
              : game.victor === 'enemy'
                ? 'YOU LOSE'
                : 'DRAW'
            : game.active === 'player'
              ? 'YOUR MOVE'
              : rivalCrew.name.split(' ').slice(-1)[0] + ' MOVE'
        }}</strong>
      </div>
      <label class="sca5-rival">
        <span>RIVAL</span>
        <select v-model="rivalId" data-testid="alley-rival" @change="newGame()">
          <option v-for="team in rivals" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
      </label>
    </header>

    <div class="sca5-body">
      <div class="sca5-board" role="grid" aria-label="Five alleys">
        <div
          v-for="lane in LANES"
          :key="lane"
          class="sca5-lane"
          :class="{ flash: flashLanes.includes(lane) }"
          role="row"
          :data-testid="'alley-lane-' + lane"
        >
          <span class="sca5-lane-name">ALLEY {{ lane + 1 }}</span>
          <template v-for="side in SIDES" :key="side">
            <button
              type="button"
              class="sca5-slot"
              :class="[
                side,
                {
                  filled: !!unitIn(side, lane),
                  landable: landable(side, lane),
                  target: unitTargetable(side, lane),
                  chosen:
                    !!unitIn(side, lane) &&
                    unitIn(side, lane)!.uid === chosenUnit,
                  ready: side === 'player' && canAttackWith(unitIn(side, lane)),
                },
              ]"
              :data-testid="'alley-slot-' + side + '-' + lane"
              :aria-label="slotLabel(side, lane)"
              @click="touchSlot(side, lane)"
            >
              <template v-if="unitIn(side, lane)">
                <span class="sca5-token">
                  <SlimeCityArtwork
                    :image-id="tokenArt(unitIn(side, lane)!)"
                    :alt="''"
                    :fallback="cardById(unitIn(side, lane)!.cardId).symbol"
                    compact
                  />
                </span>
                <span class="sca5-unit-name">{{
                  cardById(unitIn(side, lane)!.cardId).name
                }}</span>
                <span class="sca5-stats">
                  <b class="atk" title="Attack">{{
                    blowOf(game, unitIn(side, lane)!)
                  }}</b>
                  <b
                    v-if="unitIn(side, lane)!.armor"
                    class="arm"
                    title="Armor"
                    >{{ unitIn(side, lane)!.armor }}</b
                  >
                  <b class="hp" title="Health">{{ unitIn(side, lane)!.hp }}</b>
                </span>
                <span class="sca5-tags">
                  <i
                    v-if="unitIn(side, lane)!.fresh"
                    title="Just landed: attacks next turn"
                    >💤</i
                  >
                  <i
                    v-if="unitIn(side, lane)!.rootedAt !== null"
                    title="Rooted: skips its next attack"
                    >🕸</i
                  >
                  <i
                    v-if="unitIn(side, lane)!.range >= 2"
                    title="Reaches the next alleys"
                    >↔</i
                  >
                  <i
                    v-for="k in unitIn(side, lane)!.keywords"
                    :key="k"
                    class="kw"
                    :title="KEYWORDS[k].text"
                    >{{ KEYWORDS[k].label }}</i
                  >
                </span>
              </template>
              <span v-else class="sca5-empty">{{
                side === 'player' && landable(side, lane) ? 'PLAY HERE' : ''
              }}</span>
              <span
                v-if="trapIn(side, lane)"
                class="sca5-trap"
                :title="
                  side === 'player'
                    ? 'Your hidden ' + cardById(trapIn(side, lane)!.cardId).name
                    : 'A hidden enemy trap'
                "
                >{{
                  side === 'player'
                    ? '⚠ ' + cardById(trapIn(side, lane)!.cardId).name
                    : '⚠ ?'
                }}</span
              >
            </button>
          </template>
        </div>
      </div>

      <aside class="sca5-side">
        <div v-if="heldCard" class="sca5-held" data-testid="alley-held">
          <span class="sca5-hint">{{ heldHint }}</span>
          <SlimeCityCard :card="asPlayed(heldCard)" />
        </div>
        <div v-else-if="chosenUnitObj" class="sca5-held">
          <span class="sca5-hint">{{
            attackTargets(game, chosenUnitObj.uid).length
              ? 'ATTACK: TAP A GLOWING TARGET'
              : 'THIS FIGHTER CANNOT ATTACK NOW'
          }}</span>
          <SlimeCityCard :card="asPlayed(cardById(chosenUnitObj.cardId))" />
        </div>
        <ol
          ref="logEl"
          class="sca5-log kr-scroll"
          aria-label="Play by play"
          data-testid="alley-log"
        >
          <li
            v-for="(entry, i) in game.log.slice(-40)"
            :key="game.log.length - 40 + i"
            :class="['log-' + entry.kind, 'by-' + entry.side]"
          >
            {{ entry.text }}
          </li>
        </ol>
      </aside>
    </div>

    <footer class="sca5-bottom">
      <div class="sca5-boss player" :class="{ target: false }">
        <SlimeCityArtwork
          class="sca5-boss-art"
          :image-id="slimeArtId('crews', myCrew.id)"
          :alt="''"
          :fallback="myCrew.insignia"
          compact
        />
        <span class="sca5-boss-copy">
          <small>{{ myCrew.name }}</small>
          <b
            >{{ game.boss.player }}<i>/{{ ALLEY_BOSS_HP }}</i></b
          >
          <span class="sca5-hp"
            ><i
              :style="{
                width: (game.boss.player / ALLEY_BOSS_HP) * 100 + '%',
              }"
          /></span>
        </span>
        <span class="sca5-crystals" :title="game.mana.player + ' mana'">
          <i
            v-for="n in game.maxMana.player"
            :key="n"
            :class="{ full: n <= game.mana.player }"
          />
          <b>{{ game.mana.player }}/{{ game.maxMana.player }}</b>
        </span>
      </div>

      <div class="sca5-hand" role="list" aria-label="Your hand">
        <button
          v-for="(id, i) in game.hands.player"
          :key="id + ':' + i"
          type="button"
          class="sca5-card"
          :class="{
            selected: heldIndex === i,
            dim: !playable(id),
          }"
          role="listitem"
          :data-testid="'alley-card-' + id"
          :aria-pressed="heldIndex === i"
          :aria-label="cardById(id).name + ', costs ' + cardById(id).cost"
          @click="pickCard(i)"
        >
          <SlimeCityArtwork
            class="sca5-card-art"
            :image-id="slimeArtId('cards', id)"
            :alt="''"
            :fallback="cardById(id).symbol"
            compact
          />
          <b class="sca5-cost">{{ cardById(id).cost }}</b>
          <span class="sca5-card-label">
            <strong>{{ cardById(id).name }}</strong>
            <small v-if="cardById(id).kind === 'creature'"
              >{{ cardById(id).attack ?? 1 }} ATK ·
              {{ alleyHp(cardById(id)) }} HP</small
            >
            <small v-else>{{ cardById(id).kind }}</small>
          </span>
        </button>
      </div>

      <div class="sca5-actions">
        <button
          v-if="!game.victor"
          type="button"
          class="sca5-end"
          data-testid="alley-end-turn"
          :disabled="game.active !== 'player' || busy"
          @click="endMyTurn()"
        >
          {{ busy ? 'RIVAL PLAYING…' : 'END TURN ▶' }}
        </button>
        <button
          v-else
          type="button"
          class="sca5-end"
          data-testid="alley-new-game"
          @click="newGame()"
        >
          NEW MATCH ▶
        </button>
        <small>{{ game.decks.player.length }} cards in your deck</small>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
} from 'vue'
import {
  ALLEY_BOSS_HP,
  ALLEY_LANES,
  ALLEY_TURN_LIMIT,
  aimOf,
  alleyHp,
  applyAlleyCommand,
  attack,
  attackTargets,
  blowOf,
  canPlay,
  createAlleys,
  endTurn,
  playCard,
  unitAt,
  type AlleyState,
  type AlleyTarget,
  type AlleyUnit,
} from '~/utils/slimeCity/alleys'
import { alleyCpuStep } from '~/utils/slimeCity/alleysCpu'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import {
  KEYWORDS,
  TEAMS,
  cardById,
  teamById,
  type Card,
  type Side,
  type TeamId,
} from '~/utils/slimeCity/prototypes'
import { useSlimeCityStore } from '~/stores/slimeCity'

const lab = useSlimeCityStore()
const LANES = Array.from({ length: ALLEY_LANES }, (_, i) => i)
// Enemy row on top, yours below.
const SIDES: Side[] = ['enemy', 'player']
/** The rival's commands play out one at a time, this far apart. */
const CPU_STEP_MS = 750

const myCrew = computed(() => teamById(lab.activeTeam))
const rivals = computed(() => TEAMS.filter((t) => t.id !== lab.activeTeam))
const rivalId = ref<TeamId>(TEAMS.find((t) => t.id !== lab.activeTeam)!.id)
const rivalCrew = computed(() => teamById(rivalId.value))

let seedCounter = Date.now() % 100000
// shallowRef: the engine replaces the whole state each action, and structuredClone
// cannot clone Vue's reactive proxies.
const game = shallowRef<AlleyState>(
  createAlleys(lab.activeTeam, rivalId.value, seedCounter),
)
const heldIndex = ref<number | null>(null)
const chosenUnit = ref<number | null>(null)
const busy = ref(false)
const flashLanes = ref<number[]>([])
const logEl = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

function newGame(): void {
  if (timer) clearTimeout(timer)
  busy.value = false
  seedCounter++
  if (rivalId.value === lab.activeTeam) rivalId.value = rivals.value[0]!.id
  game.value = createAlleys(lab.activeTeam, rivalId.value, seedCounter)
  heldIndex.value = null
  chosenUnit.value = null
}
watch(() => lab.activeTeam, newGame)
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const heldId = computed(() =>
  heldIndex.value === null
    ? null
    : (game.value.hands.player[heldIndex.value] ?? null),
)
/** The card as FIVE ALLEYS plays it (crew-calibrated health). */
function asPlayed(card: Card): Card {
  return card.kind === 'creature' ? { ...card, hp: alleyHp(card) } : card
}
const heldCard = computed(() => (heldId.value ? cardById(heldId.value) : null))
const chosenUnitObj = computed(() =>
  chosenUnit.value === null
    ? null
    : (game.value.units.find((u) => u.uid === chosenUnit.value) ?? null),
)

const heldHint = computed(() => {
  const card = heldCard.value
  if (!card) return ''
  if (card.cost > game.value.mana.player)
    return 'NEEDS ' + card.cost + ' MANA · YOU HAVE ' + game.value.mana.player
  if (card.kind === 'creature') return 'TAP AN EMPTY SLOT IN YOUR ROW'
  if (card.kind === 'trap') return 'HIDE IT: TAP ANY ALLEY ON YOUR ROW'
  const aim = aimOf(card)
  if (aim === 'own-unit') return 'TAP ONE OF YOUR FIGHTERS'
  if (aim === 'own-any') return 'TAP ONE OF YOUR FIGHTERS OR YOUR BOSS'
  if (aim === 'enemy-any') return 'TAP AN ENEMY FIGHTER OR THEIR BOSS'
  return 'TAP AN ENEMY FIGHTER'
})

function unitIn(side: Side, lane: number): AlleyUnit | undefined {
  return unitAt(game.value, side, lane)
}
function trapIn(side: Side, lane: number) {
  return game.value.traps.find((t) => t.side === side && t.lane === lane)
}
function tokenArt(unit: AlleyUnit): number | null {
  const pose =
    unit.hp < unit.maxHp ? 'hurt' : unit.side === 'player' ? 'fierce' : 'guard'
  for (const p of [pose, 'fierce', 'guard', 'hurt']) {
    const id = slimeArtId('tokens', unit.cardId + '/' + p)
    if (id !== null) return id
  }
  return slimeArtId('cards', unit.cardId)
}
function myTurn(): boolean {
  return !game.value.victor && game.value.active === 'player' && !busy.value
}
function playable(id: string): boolean {
  if (!myTurn() || cardById(id).cost > game.value.mana.player) return false
  return LANES.some(
    (lane) =>
      canPlay(game.value, 'player', id, lane) ||
      canPlay(game.value, 'player', id, lane, 'boss') ||
      game.value.units.some((u) =>
        canPlay(game.value, 'player', id, lane, u.uid),
      ),
  )
}
function canAttackWith(unit: AlleyUnit | undefined): boolean {
  return !!unit && myTurn() && attackTargets(game.value, unit.uid).length > 0
}

/** Where the held card would land for a tap on this slot. */
function heldTarget(side: Side, lane: number): AlleyTarget | undefined {
  const unit = unitIn(side, lane)
  return unit ? unit.uid : undefined
}
function landable(side: Side, lane: number): boolean {
  const id = heldId.value
  if (!id || !myTurn()) return false
  const card = cardById(id)
  if (card.kind === 'creature' || card.kind === 'trap')
    return side === 'player' && canPlay(game.value, 'player', id, lane)
  return false
}
function unitTargetable(side: Side, lane: number): boolean {
  const unit = unitIn(side, lane)
  if (!unit || !myTurn()) return false
  if (heldId.value) {
    const card = cardById(heldId.value)
    if (card.kind === 'creature' || card.kind === 'trap') return false
    return canPlay(game.value, 'player', heldId.value, lane, unit.uid)
  }
  if (chosenUnit.value !== null)
    return attackTargets(game.value, chosenUnit.value).includes(unit.uid)
  return false
}
const bossTargetable = computed(() => {
  if (!myTurn()) return false
  if (heldId.value)
    return canPlay(game.value, 'player', heldId.value, 0, 'boss')
  if (chosenUnit.value !== null)
    return attackTargets(game.value, chosenUnit.value).includes('boss')
  return false
})

function slotLabel(side: Side, lane: number): string {
  const unit = unitIn(side, lane)
  const whose = side === 'player' ? 'Your' : 'Enemy'
  if (!unit) return whose + ' slot, alley ' + (lane + 1) + ', empty'
  return (
    whose +
    ' ' +
    cardById(unit.cardId).name +
    ', alley ' +
    (lane + 1) +
    ', ' +
    blowOf(game.value, unit) +
    ' attack, ' +
    unit.hp +
    ' health'
  )
}

function flash(): void {
  const last = game.value.log[game.value.log.length - 1]
  flashLanes.value = last?.lanes ?? []
  setTimeout(() => (flashLanes.value = []), 600)
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
}

function pickCard(i: number): void {
  chosenUnit.value = null
  heldIndex.value = heldIndex.value === i ? null : i
}

function apply(next: AlleyState): void {
  if (next === game.value) return
  game.value = next
  heldIndex.value = null
  chosenUnit.value = null
  flash()
}

function chooseTarget(target: AlleyTarget): void {
  if (!myTurn()) return
  if (heldId.value) {
    // Damage spells aimed at the boss are cast "from" alley 1.
    apply(playCard(game.value, 'player', heldId.value, 0, target))
    return
  }
  if (chosenUnit.value !== null)
    apply(attack(game.value, 'player', chosenUnit.value, target))
}

function touchSlot(side: Side, lane: number): void {
  if (!myTurn()) return
  const unit = unitIn(side, lane)
  if (heldId.value) {
    const card = cardById(heldId.value)
    if (card.kind === 'creature' || card.kind === 'trap') {
      if (side === 'player')
        apply(playCard(game.value, 'player', heldId.value, lane))
      return
    }
    const target = heldTarget(side, lane)
    if (target !== undefined)
      apply(playCard(game.value, 'player', heldId.value, lane, target))
    return
  }
  if (chosenUnit.value !== null && unit && unit.side === 'enemy') {
    apply(attack(game.value, 'player', chosenUnit.value, unit.uid))
    return
  }
  chosenUnit.value =
    unit && unit.side === 'player' && chosenUnit.value !== unit.uid
      ? unit.uid
      : null
}

function endMyTurn(): void {
  if (!myTurn()) return
  heldIndex.value = null
  chosenUnit.value = null
  game.value = endTurn(game.value, 'player')
  flash()
  busy.value = true
  stepRival()
}

function stepRival(): void {
  timer = setTimeout(() => {
    if (game.value.victor || game.value.active !== 'enemy') {
      busy.value = false
      return
    }
    const cmd = alleyCpuStep(game.value, 'enemy')
    const next = cmd
      ? applyAlleyCommand(game.value, cmd)
      : endTurn(game.value, 'enemy')
    // A command the engine refused would loop; end the rival's turn instead.
    game.value = next === game.value ? endTurn(game.value, 'enemy') : next
    flash()
    if (game.value.active === 'enemy' && !game.value.victor) stepRival()
    else busy.value = false
  }, CPU_STEP_MS)
}
</script>

<style scoped>
.sca5 {
  --tone: #8fe7ff;
  display: grid;
  align-content: start;
  gap: 0.6rem;
  /* The page gives each view a fixed-height cell: fill it and scroll inside. */
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 0.75rem;
  border-radius: 1rem;
  background:
    radial-gradient(circle at 50% 0%, #2a1f3d 0%, transparent 60%), #0b0f17;
  color: #f4f4ec;
}
.sca5.tone-red {
  --tone: #ff8a7a;
}
.sca5.tone-green {
  --tone: #b6ee45;
}
.sca5.tone-purple {
  --tone: #d59bff;
}
.sca5.tone-gold {
  --tone: #f7c968;
}
.sca5-top,
.sca5-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}
.sca5-boss {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex: 1 1 15rem;
  padding: 0.4rem 0.6rem;
  border: 2px solid #ffffff22;
  border-radius: 0.8rem;
  background: #141a26;
  color: inherit;
  text-align: left;
}
.sca5-boss.enemy {
  border-color: #ff7a7a55;
}
.sca5-boss.target {
  border-color: #ff5a5a;
  box-shadow: 0 0 18px #ff5a5a88;
  cursor: crosshair;
}
.sca5-boss-art {
  flex: 0 0 3rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  overflow: hidden;
}
.sca5-boss-copy {
  display: grid;
  gap: 0.15rem;
  min-width: 7rem;
}
.sca5-boss-copy small {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}
.sca5-boss-copy b {
  font-size: 1.3rem;
  font-weight: 1000;
}
.sca5-boss-copy b i {
  font-size: 0.75rem;
  font-style: normal;
  opacity: 0.6;
}
.sca5-hp {
  display: block;
  height: 0.4rem;
  border-radius: 1rem;
  background: #ffffff1a;
  overflow: hidden;
}
.sca5-hp i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ff6a6a, #ffd36a);
  transition: width 0.4s ease;
}
.player .sca5-hp i {
  background: linear-gradient(90deg, #5ad1ff, #b6ee45);
}
.sca5-meta {
  display: grid;
  gap: 0.1rem;
  margin-left: auto;
  font-size: 0.7rem;
  opacity: 0.8;
  text-align: right;
}
.sca5-turn {
  display: grid;
  text-align: center;
  flex: 0 0 auto;
}
.sca5-turn small {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  opacity: 0.7;
}
.sca5-turn strong {
  color: var(--tone);
  font-size: 1.05rem;
  letter-spacing: 0.08em;
}
.sca5-rival {
  display: grid;
  gap: 0.15rem;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
}
.sca5-rival select {
  padding: 0.3rem 0.4rem;
  border-radius: 0.5rem;
  border: 1px solid #ffffff33;
  background: #141a26;
  color: inherit;
  font-size: 0.8rem;
}
.sca5-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 19rem);
  gap: 0.6rem;
}
.sca5-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.4rem;
  padding: 0.5rem;
  border-radius: 0.9rem;
  background:
    repeating-linear-gradient(90deg, #ffffff06 0 2px, transparent 2px 20%),
    linear-gradient(#1a1326, #0f1a20);
  border: 1px solid #ffffff1f;
}
.sca5-lane {
  display: grid;
  grid-template-rows: auto 1fr 1fr;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.3rem;
  border-radius: 0.7rem;
  background: #ffffff08;
  transition: background 0.3s;
}
.sca5-lane.flash {
  background: color-mix(in srgb, var(--tone) 25%, transparent);
}
.sca5-lane-name {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-align: center;
  opacity: 0.6;
}
.sca5-slot {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 0.2rem;
  min-height: 8.5rem;
  padding: 0.35rem 0.25rem;
  border: 2px dashed #ffffff1f;
  border-radius: 0.7rem;
  background: #0b111b;
  color: inherit;
  font: inherit;
}
.sca5-slot.enemy.filled {
  border: 2px solid #ff7a7a66;
}
.sca5-slot.player.filled {
  border: 2px solid color-mix(in srgb, var(--tone) 55%, transparent);
}
.sca5-slot.ready {
  box-shadow: 0 0 12px color-mix(in srgb, var(--tone) 60%, transparent);
}
.sca5-slot.landable {
  border: 2px dashed var(--tone);
  background: color-mix(in srgb, var(--tone) 14%, #0b111b);
  cursor: copy;
}
.sca5-slot.target {
  border: 2px solid #ff5a5a;
  box-shadow: 0 0 16px #ff5a5a99;
  cursor: crosshair;
}
.sca5-slot.chosen {
  outline: 3px solid #fff3b0;
  outline-offset: 1px;
}
.sca5-token {
  width: min(4.4rem, 90%);
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ffffff33;
}
.sca5-unit-name {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.15;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sca5-stats {
  display: flex;
  gap: 0.25rem;
}
.sca5-stats b {
  min-width: 1.4rem;
  padding: 0.05rem 0.3rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  text-align: center;
}
.sca5-stats .atk {
  background: #a3332a;
}
.sca5-stats .arm {
  background: #3a5a7a;
}
.sca5-stats .hp {
  background: #2f7a3a;
}
.sca5-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.6rem;
  font-style: normal;
}
.sca5-tags i {
  font-style: normal;
}
.sca5-tags .kw {
  padding: 0 0.25rem;
  border-radius: 0.3rem;
  background: #ffffff1a;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.sca5-empty {
  margin: auto;
  color: var(--tone);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.sca5-trap {
  position: absolute;
  bottom: 0.2rem;
  left: 0.2rem;
  right: 0.2rem;
  overflow: hidden;
  border-radius: 0.3rem;
  background: #4a3a10cc;
  color: #ffe08a;
  font-size: 0.58rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sca5-side {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.5rem;
  min-height: 0;
  max-height: 34rem;
}
.sca5-held {
  display: grid;
  gap: 0.4rem;
}
.sca5-held :deep(.scc) {
  width: min(100%, 12rem);
  margin: 0 auto;
}
.sca5-hint {
  color: var(--tone);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.sca5-log {
  display: grid;
  align-content: start;
  gap: 0.25rem;
  margin: 0;
  padding: 0.5rem 0.6rem;
  overflow-y: auto;
  list-style: none;
  border-radius: 0.7rem;
  background: #070b12;
  border: 1px solid #ffffff1a;
  font-size: 0.76rem;
  line-height: 1.35;
}
.sca5-log li {
  padding-left: 0.5rem;
  border-left: 3px solid #ffffff22;
}
.sca5-log .by-player {
  border-left-color: var(--tone);
}
.sca5-log .by-enemy {
  border-left-color: #ff7a7a;
}
.sca5-log .log-turn {
  margin-top: 0.3rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.sca5-log .log-boss,
.sca5-log .log-death {
  color: #ffd36a;
}
.sca5-log .log-end {
  color: #fff3b0;
  font-weight: 900;
}
.sca5-crystals {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
  margin-left: auto;
}
.sca5-crystals i {
  width: 0.7rem;
  height: 0.9rem;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  background: #ffffff22;
}
.sca5-crystals i.full {
  background: #5ad1ff;
}
.sca5-crystals b {
  margin-left: 0.3rem;
  font-size: 0.85rem;
}
.sca5-bottom .sca5-boss {
  flex: 1 1 14rem;
}
.sca5-hand {
  display: flex;
  gap: 0.4rem;
  flex: 10 1 22rem;
  overflow-x: auto;
  padding: 0.2rem;
}
.sca5-card {
  position: relative;
  flex: 0 0 6.4rem;
  aspect-ratio: 2 / 3;
  padding: 0;
  overflow: hidden;
  border: 2px solid #8fe7ff55;
  border-radius: 0.7rem;
  background: #141a26;
  color: inherit;
  transition:
    transform 0.15s,
    border-color 0.15s;
}
.sca5-card:hover {
  transform: translateY(-4px);
}
.sca5-card.selected {
  border-color: #fff3b0;
  transform: translateY(-8px);
  box-shadow: 0 0 18px #fff3b077;
}
.sca5-card.dim {
  filter: grayscale(0.7) brightness(0.7);
}
.sca5-card-art {
  position: absolute;
  inset: 0;
}
.sca5-cost {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #b6ee45;
  color: #10220a;
  font-size: 0.85rem;
}
.sca5-card-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  padding: 0.3rem;
  background: linear-gradient(transparent, #000d 40%);
  text-align: left;
}
.sca5-card-label strong {
  font-size: 0.7rem;
  line-height: 1.1;
}
.sca5-card-label small {
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
}
.sca5-actions {
  display: grid;
  justify-items: end;
  gap: 0.25rem;
  flex: 0 0 auto;
}
.sca5-end {
  padding: 0.7rem 1.2rem;
  border: 0;
  border-radius: 0.7rem;
  background: linear-gradient(#e3ff8f, #b6ee45);
  color: #10220a;
  font-weight: 1000;
  letter-spacing: 0.08em;
}
.sca5-end:disabled {
  opacity: 0.55;
}
.sca5-actions small {
  font-size: 0.65rem;
  opacity: 0.7;
}
@media (max-width: 760px) {
  .sca5-body {
    grid-template-columns: 1fr;
  }
  .sca5-side {
    max-height: 9rem;
  }
  .sca5-held :deep(.scc) {
    display: none;
  }
  .sca5-board {
    gap: 0.2rem;
    padding: 0.3rem;
  }
  .sca5-lane {
    padding: 0.15rem;
  }
  .sca5-slot {
    min-height: 6.5rem;
  }
  .sca5-tags .kw {
    display: none;
  }
  .sca5-meta {
    display: none;
  }
  .sca5-card {
    flex-basis: 5.2rem;
  }
}
</style>
