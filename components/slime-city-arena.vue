<!-- /components/slime-city-arena.vue -->
<!--
  THE ARENA: BLACKOUT, BLOODRUSH AND TURF.

  Silas, 2026-11-02, first impressions: "Combat and movement on the blackout
  board should be automatic. we need custom tokens for all cards on the board.
  Images with reaction faces would probably work. creatures can be set for
  attack, defense … having a base that gets attacked makes more sense. We
  should be able to click on the tokens on the board and see the card … It
  should look like a aaa console game." Then: "base and capture the flag
  should be different elements … two, each on opposite ends inside their
  base … same improvements made to bloodrush."

  So the stage is the board: a console HUD across the top (both bases, the
  clock, the format), the painted arena with art tokens that glide as the
  crews march, two planted flags inside two base columns, and the hand along
  the bottom. Tapping a token opens its card and its battle orders.

  Silas, 2026-11-03: "a new version of this game, modeled after go. each turn
  you play a single token, but go rules apply." TURF reuses this stage: the
  HUD counts turf and prisoners instead of bases, empty points take their
  owner's tint, slime puddles fill liberties, and a held card shows its TURF
  effect before it lands.
-->
<template>
  <section
    class="sca kr-surface"
    :class="['mode-' + lab.mode, 'tone-' + lab.team.color]"
    aria-label="Slime City arena"
    data-testid="slime-arena"
  >
    <div class="sca-stage">
      <SlimeCityArtwork
        class="sca-backdrop"
        :image-id="slimeBoardArtId(lab.districtId, lab.mode)"
        :alt="currentMode.title + ' painted arena background'"
        fallback="▦"
        compact
      />

      <header class="sca-hud" data-testid="slime-arena-hud">
        <div
          class="sca-base mine"
          :class="{ hit: hitBase === 'player' }"
          data-testid="slime-base-player"
        >
          <span class="sca-emblem tone-chip">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', lab.activeTeam)"
              :alt="lab.team.name + ' emblem'"
              :fallback="lab.team.insignia"
              compact
            />
          </span>
          <span
            v-if="turf"
            class="sca-base-text"
            data-testid="slime-turf-player"
          >
            <small>YOUR TURF</small>
            <span class="sca-meter"
              ><i :style="{ width: turfPct(lab.sight.turfScore[0]) }"
            /></span>
            <b>{{ lab.sight.turfScore[0] }}</b>
          </span>
          <span v-else class="sca-base-text">
            <small>YOUR BASE</small>
            <span class="sca-meter"
              ><i :style="{ width: basePct(lab.sight.bases[0]) }"
            /></span>
            <b>{{ lab.sight.bases[0] }}</b>
          </span>
          <span
            v-if="turf"
            class="sca-flag-chip"
            :title="lab.sight.prisoners[0] + ' enemy stones captured'"
            >✊ {{ lab.sight.prisoners[0] }} TAKEN</span
          >
          <span
            v-else
            class="sca-flag-chip"
            :class="{ taken: lab.sight.flags[0].carrier !== null }"
            :title="
              lab.sight.flags[0].carrier !== null
                ? 'Your flag has been stolen'
                : 'Your flag is safe at home'
            "
            >⚑
            {{ lab.sight.flags[0].carrier !== null ? 'STOLEN' : 'SAFE' }}</span
          >
        </div>

        <div class="sca-clock">
          <span v-if="lab.campaignBout && lab.activeChapter" class="sca-tag"
            >CHAPTER {{ lab.campaignBout.index + 1 }}/5 ·
            {{ lab.activeChapter.title }}</span
          >
          <span v-else-if="lab.boutPlan" class="sca-tag"
            >RIVAL · {{ lab.boutPlan.rival.name }}</span
          >
          <strong
            >{{ lab.mode === 'bloodrush' ? 'TICK' : 'ROUND' }}
            {{ lab.match.round
            }}<small>/{{ lab.match.maxRounds }}</small></strong
          >
          <nav
            class="sca-modes"
            aria-label="Game mode"
            data-testid="slime-mode-tabs"
          >
            <button
              v-for="preset in lab.modes"
              :key="preset.id"
              type="button"
              :class="{ active: lab.mode === preset.id }"
              :aria-pressed="lab.mode === preset.id"
              :title="preset.subtitle"
              :data-testid="'slime-mode-' + preset.id"
              @click="lab.mode === preset.id || lab.chooseMode(preset.id)"
            >
              {{ preset.title }}
            </button>
          </nav>
        </div>

        <div
          class="sca-base theirs"
          :class="{ hit: hitBase === 'enemy' }"
          data-testid="slime-base-enemy"
        >
          <span
            v-if="turf"
            class="sca-flag-chip"
            :title="lab.sight.prisoners[1] + ' of your stones captured'"
            >✊ {{ lab.sight.prisoners[1] }} TAKEN</span
          >
          <span
            v-else
            class="sca-flag-chip"
            :class="{ taken: lab.sight.flags[1].carrier !== null }"
            :title="
              lab.sight.flags[1].carrier !== null
                ? 'Your crew is carrying the enemy flag'
                : 'The enemy flag stands in their base'
            "
            >⚑
            {{
              lab.sight.flags[1].carrier !== null ? 'IN HAND' : 'GUARDED'
            }}</span
          >
          <span
            v-if="turf"
            class="sca-base-text"
            data-testid="slime-turf-enemy"
            :title="'Includes ' + TURF_KOMI + ' komi for moving second'"
          >
            <small>ENEMY TURF</small>
            <span class="sca-meter"
              ><i :style="{ width: turfPct(lab.sight.turfScore[1]) }"
            /></span>
            <b>{{ lab.sight.turfScore[1] }}</b>
          </span>
          <span v-else class="sca-base-text">
            <small>ENEMY BASE</small>
            <span class="sca-meter"
              ><i :style="{ width: basePct(lab.sight.bases[1]) }"
            /></span>
            <b>{{ lab.sight.bases[1] }}</b>
          </span>
          <span class="sca-emblem">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', lab.match.foeId)"
              :alt="lab.enemy.name + ' emblem'"
              :fallback="lab.enemy.insignia"
              compact
            />
          </span>
        </div>
        <page-help
          class="sca-help"
          :label="'How to play ' + currentMode.title"
          @open="lab.openGuide()"
        />
      </header>

      <div class="sca-field">
        <div
          class="sc-board sca-board"
          :class="{ dragging: !!lab.dragCard || !!lab.selectedCard, turf }"
          :style="{
            gridTemplateColumns:
              'repeat(' + lab.match.width + ', minmax(0, 1fr))',
            gridTemplateRows:
              'repeat(' + lab.match.height + ', minmax(0, 1fr))',
            '--ratio': lab.match.width / lab.match.height,
            '--w': lab.match.width,
            '--h': lab.match.height,
          }"
          role="group"
          :aria-label="currentMode.size + ' arena'"
        >
          <SlimeCityArtwork
            class="sc-board-floor"
            :image-id="slimeBoardArtId(lab.districtId, lab.mode)"
            :alt="currentMode.title + ' painted board'"
            compact
          />
          <button
            v-for="cell in lab.board"
            :key="cell.x + '-' + cell.y"
            type="button"
            class="sca-tile"
            :class="{
              'base-mine': !turf && cell.x === 0,
              'base-theirs': !turf && cell.x === lab.match.width - 1,
              'turf-mine': territory[cell.x + ':' + cell.y] === 'player',
              'turf-theirs': territory[cell.x + ':' + cell.y] === 'enemy',
              star: turf && STAR_POINTS.has(cell.x + ':' + cell.y),
              landing: canLand(cell.x, cell.y),
              lair: monsterHere(cell.x, cell.y),
            }"
            :data-drop-x="cell.x"
            :data-drop-y="cell.y"
            :data-testid="'slime-tile-' + cell.x + '-' + cell.y"
            :aria-label="cellAria(cell.x, cell.y)"
            @click="lab.touchSquare(cell.x, cell.y)"
          >
            <span
              v-if="visibleTrap(cell.x, cell.y)"
              class="sca-trap"
              :class="{ wired: turf }"
              :title="turf ? 'Your tripwire' : undefined"
              >◇</span
            >
            <span
              v-if="slimeAt(cell.x, cell.y)"
              class="sca-slime"
              data-testid="slime-puddle"
              aria-hidden="true"
            />
            <span
              v-if="monsterHere(cell.x, cell.y)"
              class="sca-monster"
              data-testid="slime-monster"
              ><span>❂</span><small>{{ lab.sight.monster?.hp }}</small></span
            >
          </button>
          <template v-if="!turf">
            <span class="sca-base-label mine" aria-hidden="true"
              >YOUR BASE</span
            >
            <span class="sca-base-label theirs" aria-hidden="true"
              >ENEMY BASE</span
            >
          </template>
          <span
            v-for="(flag, index) in loseFlags"
            :key="'flag-' + index"
            class="sca-flag"
            :class="index === 0 ? 'mine' : 'theirs'"
            :style="{ '--x': flag.x, '--y': flag.y }"
            :data-testid="
              index === 0 ? 'slime-flag-player' : 'slime-flag-enemy'
            "
            aria-hidden="true"
            ><i>⚑</i></span
          >
          <TransitionGroup tag="div" name="sca-token" class="sca-tokens">
            <button
              v-for="unit in lab.sight.units"
              :key="unit.id"
              type="button"
              class="sca-token"
              :class="[
                unit.side === 'player' ? 'friendly' : 'hostile',
                'mood-' + mood(unit),
                {
                  open: lab.selectedUnit === unit.id,
                  defend: unit.stance === 'defend',
                  carrier: unit.carryingFlag,
                  sealed: !unit.known,
                  rooted: unit.rooted,
                  warded: unit.warded,
                },
              ]"
              :style="{ '--x': unit.x, '--y': unit.y }"
              :data-drop-x="unit.x"
              :data-drop-y="unit.y"
              :data-testid="'slime-token-' + unit.id"
              :aria-label="tokenAria(unit)"
              @click="lab.touchSquare(unit.x, unit.y)"
            >
              <span class="sca-portrait">
                <SlimeCityArtwork
                  v-if="unit.cardId"
                  :image-id="tokenArt(unit)"
                  :alt="''"
                  :fallback="cardById(unit.cardId).symbol"
                  compact
                />
                <span v-else class="sca-unknown">?</span>
              </span>
              <span class="sca-face" aria-hidden="true">{{
                FACES[mood(unit)]
              }}</span>
              <span
                v-if="unit.known && !turf"
                class="sca-stance"
                aria-hidden="true"
                >{{ unit.stance === 'defend' ? '🛡' : '⚔' }}</span
              >
              <span
                v-if="unit.carryingFlag"
                class="sca-carried"
                aria-hidden="true"
                >⚑</span
              >
              <span
                v-if="unit.hp !== null && !turf"
                class="sca-hp"
                aria-hidden="true"
                ><i
                  :style="{
                    width:
                      Math.max(0, (unit.hp / (unit.maxHp || 1)) * 100) + '%',
                  }"
              /></span>
            </button>
          </TransitionGroup>
          <span
            v-for="pop in pops"
            :key="pop.key"
            class="sca-pop"
            :class="pop.kind"
            :style="{ '--x': pop.x, '--y': pop.y }"
            aria-hidden="true"
            >{{ pop.text }}</span
          >
          <span
            v-for="fx in fxs"
            :key="fx.key"
            class="sca-fx"
            :class="[fx.kind, fx.side === 'player' ? 'mine' : 'theirs']"
            :style="{
              '--x': fx.x,
              '--y': fx.y,
              '--dx': fx.dx,
              '--dy': fx.dy,
              '--delay': fx.delay + 'ms',
            }"
            :data-testid="'slime-fx-' + fx.kind"
            aria-hidden="true"
            ><i /><b>{{ fx.label }}</b></span
          >
        </div>
      </div>

      <div
        v-if="turf && heldCard && !lab.inspectedUnit"
        class="sca-inspect sca-held"
        role="status"
        :aria-label="heldCard.name + ' TURF effect'"
        data-testid="slime-turf-held"
      >
        <div class="sca-inspect-live">
          <span class="sca-tag">TURF · PLACE ON ANY EMPTY POINT</span>
          <p class="sca-turf-rule">
            {{ turfText(heldCard, lab.sight.parity) }}
          </p>
        </div>
        <SlimeCityCard class="sca-inspect-card" :card="heldCard" />
      </div>
      <div
        v-if="lab.inspectedUnit"
        class="sca-inspect"
        role="dialog"
        aria-modal="false"
        :aria-label="inspectedName + ' card'"
        data-testid="slime-unit-card"
      >
        <button
          type="button"
          class="sca-close"
          aria-label="Close card"
          @click="lab.closeUnit()"
        >
          ✕
        </button>
        <div class="sca-inspect-live">
          <span class="sca-tag">{{
            lab.inspectedUnit.side === 'player' ? 'YOUR CREW' : 'ENEMY'
          }}</span>
          <p v-if="turf && inspectedCard" class="sca-turf-rule">
            {{ turfText(inspectedCard, lab.sight.parity) }}
            <template v-if="lab.inspectedUnit.warded">
              Warded this round.</template
            >
          </p>
          <p
            v-if="lab.inspectedUnit.hp !== null && !turf"
            class="sca-live-stats"
          >
            <span
              ><b>{{ lab.inspectedUnit.hp }}</b
              >/{{ lab.inspectedUnit.maxHp }} HP</span
            >
            <span
              ><b>{{ lab.inspectedUnit.attack }}</b> ATK</span
            >
            <span
              ><b>{{
                (lab.inspectedUnit.armor ?? 0) +
                (lab.inspectedUnit.stance === 'defend' ? 1 : 0)
              }}</b>
              ARMOR</span
            >
          </p>
          <p v-if="lab.inspectedUnit.carryingFlag && !turf" class="sca-callout">
            ⚑ CARRYING
            {{ lab.inspectedUnit.side === 'player' ? 'THE ENEMY' : 'YOUR' }}
            FLAG
          </p>
          <div
            v-if="
              lab.inspectedUnit.side === 'player' && !lab.match.victor && !turf
            "
            class="sca-orders"
            role="group"
            aria-label="Battle orders"
          >
            <button
              type="button"
              :class="{ on: lab.inspectedUnit.stance === 'attack' }"
              :aria-pressed="lab.inspectedUnit.stance === 'attack'"
              data-testid="slime-stance-attack"
              @click="lab.orderStance(lab.inspectedUnit.id, 'attack')"
            >
              <b>⚔ ATTACK</b><small>Charge the enemy flag and base</small>
            </button>
            <button
              type="button"
              :class="{ on: lab.inspectedUnit.stance === 'defend' }"
              :aria-pressed="lab.inspectedUnit.stance === 'defend'"
              data-testid="slime-stance-defend"
              @click="lab.orderStance(lab.inspectedUnit.id, 'defend')"
            >
              <b>🛡 DEFEND</b><small>Guard your base · +1 armor</small>
            </button>
          </div>
          <p
            v-else-if="lab.inspectedUnit.known && !turf"
            class="sca-orders-read"
          >
            {{
              lab.inspectedUnit.stance === 'defend'
                ? 'Holding its base.'
                : 'Charging your base.'
            }}
          </p>
        </div>
        <SlimeCityCard
          v-if="inspectedCard"
          class="sca-inspect-card"
          :card="inspectedCard"
        />
        <div v-else class="sca-inspect-card sca-concealed">
          <span>?</span>
          <strong>CONCEALED</strong>
          <small>A spy you have not unmasked yet.</small>
        </div>
      </div>

      <div v-if="lab.match.victor" class="sc-result sca-result" role="status">
        <strong>{{
          lab.match.victor === 'player'
            ? turf
              ? 'YOU HOLD THE STREETS'
              : 'VICTORY IN THE PIT'
            : lab.match.victor === 'draw'
              ? 'MUTUAL DESTRUCTION'
              : 'THE PIT CLAIMS YOU'
        }}</strong
        ><span>{{ winLine }}</span
        ><span class="sc-result-actions"
          ><button
            v-if="lab.lastBout || lab.lastContract || lab.lastCampaign"
            type="button"
            @click="lab.lastCampaign ? lab.showCampaign() : lab.showCity()"
          >
            {{
              lab.lastCampaign ? 'BACK TO STORY' : 'BACK TO THE CITY'
            }}</button
          ><button type="button" @click="lab.reset(true)">REMATCH</button
          ><button type="button" @click="lab.reset()">NEW FIGHT</button></span
        >
      </div>

      <div
        v-if="lab.guideOpen"
        class="sc-guide kr-scroll"
        role="dialog"
        aria-modal="false"
        :aria-label="'How to play ' + currentMode.title"
        data-testid="slime-guide"
      >
        <span class="sc-overline">HOW TO PLAY / {{ currentMode.title }}</span>
        <p class="sc-guide-goal">{{ lab.guide.goal }}</p>
        <ol>
          <li v-for="step in lab.guide.steps" :key="step">{{ step }}</li>
        </ol>
        <span class="sc-overline">PROTOTYPE LIMITS</span>
        <ul>
          <li v-for="item in lab.guide.limits" :key="item">{{ item }}</li>
        </ul>
        <div
          v-if="lab.variants.length"
          class="sc-rules"
          data-testid="slime-rules"
        >
          <span class="sc-overline">LAB RULE VARIANTS · RESTART SAME SEED</span>
          <div class="sc-rule-list">
            <button
              v-for="variant in lab.variants"
              :key="variant.id"
              type="button"
              class="sc-rule"
              :class="{ on: lab.rules[variant.id] }"
              :aria-pressed="lab.rules[variant.id]"
              :title="variant.text"
              :data-testid="'slime-rule-' + variant.id"
              @click="lab.toggleRule(variant.id)"
            >
              {{ variant.label }}
            </button>
          </div>
        </div>
        <p class="sc-guide-seed">
          Seed {{ lab.match.seed }}: the same seed and the same plays replay the
          same match.
        </p>
        <button
          type="button"
          data-testid="slime-guide-close"
          @click="lab.closeGuide()"
        >
          GOT IT · PLAY
        </button>
      </div>
    </div>

    <SlimeCityHand />
    <div class="sc-battle-bottom">
      <span v-if="lab.sight.parity" data-testid="slime-parity-status"
        >{{ lab.sight.playSpent ? 'PLAY USED' : '1 PLAY'
        }}<template v-if="lab.sight.freeKind">
          · FREE {{ lab.sight.freeKind.toUpperCase() }}</template
        ><template v-if="lab.sight.jammed[0]">
          · JAMMED ×{{ lab.sight.jammed[0] }}</template
        ><template v-if="lab.sight.jammed[1]">
          · ENEMY JAMMED ×{{ lab.sight.jammed[1] }}</template
        ></span
      >
      <span v-else
        >{{ lab.match.mana }} MANA<template v-if="lab.sight.debt[0]">
          · OWES {{ lab.sight.debt[0] }}</template
        ><template v-if="lab.match.overtime"> · SUDDEN DEATH</template
        ><template v-if="lab.sight.monster">
          · MONSTER {{ lab.sight.monster.hp }}/{{
            lab.sight.monster.maxHp
          }}</template
        ></span
      >
      <span aria-live="polite">{{ lab.match.log[0] }}</span>
      <button
        v-if="lab.mode !== 'bloodrush'"
        type="button"
        class="sca-go"
        :disabled="!!lab.match.victor"
        data-testid="slime-next-round"
        :title="
          turf ? 'Pass your turn: two passes in a row end the game' : undefined
        "
        @click="lab.nextRound()"
      >
        {{ turf ? 'PASS ▶' : 'END ROUND ▶' }}
      </button>
      <button
        v-else
        type="button"
        class="sca-go"
        :disabled="!!lab.match.victor"
        data-testid="slime-toggle-rush"
        @click="lab.toggleRush()"
      >
        {{ lab.running ? 'PAUSE ■' : 'RUN ▶' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import {
  cardById,
  flagSquare,
  inDeployZone,
  playedCard,
  turfTerritory,
  turfText,
  TURF_KOMI,
  type TurfFx,
  type TurfFxKind,
  type ViewFighter,
} from '~/utils/slimeCity/prototypes'
import { slimeArtId, slimeBoardArtId } from '~/utils/slimeCity/artManifest'

const lab = useSlimeCityStore()
const turf = computed(() => lab.mode === 'turf')
/** The Go board's traditional star points on a 9 × 9 board. */
const STAR_POINTS = new Set(['2:2', '6:2', '4:4', '2:6', '6:6'])
/** Empty points only one crew surrounds (area scoring), tinted on the board. */
const territory = computed<Record<string, string | null>>(() =>
  turf.value ? turfTerritory(lab.match).owner : {},
)
function turfPct(score: number): string {
  const total = lab.match.width * lab.match.height
  return Math.max(0, Math.min(100, (score / total) * 100)) + '%'
}
function slimeAt(x: number, y: number): boolean {
  return lab.sight.puddles.some((p) => p.x === x && p.y === y)
}
const heldCard = computed(() => {
  const id = lab.dragCard ?? lab.selectedCard
  return id ? playedCard(lab.match, cardById(id)) : null
})
const currentMode = computed(
  () => lab.modes.find((mode) => mode.id === lab.mode) || lab.modes[0]!,
)

/** Reaction faces until each creature's painted mood tokens render. */
type Mood = 'fierce' | 'guard' | 'hurt' | 'dazed' | 'ouch' | 'gleeful' | 'sly'
const FACES: Record<Mood, string> = {
  fierce: '😈',
  guard: '😤',
  hurt: '😣',
  dazed: '😵',
  ouch: '😠',
  gleeful: '😆',
  sly: '🤫',
}
function mood(unit: ViewFighter): Mood {
  if (!unit.known) return 'sly'
  if (unit.warded) return 'guard'
  if (unit.carryingFlag) return 'gleeful'
  const share = (unit.hp ?? 1) / (unit.maxHp || 1)
  if (share <= 0.34 || unit.rooted) return 'dazed'
  if (pops.value.some((p) => p.id === unit.id && p.kind === 'hurt'))
    return 'ouch'
  if (share <= 0.67) return 'hurt'
  return unit.stance === 'defend' ? 'guard' : 'fierce'
}
/** The three painted token portraits each creature gets (art round 6). */
const PORTRAIT: Record<Mood, 'fierce' | 'guard' | 'hurt'> = {
  fierce: 'fierce',
  gleeful: 'fierce',
  sly: 'fierce',
  guard: 'guard',
  hurt: 'hurt',
  dazed: 'hurt',
  ouch: 'hurt',
}
/** A painted mood portrait when one exists, else the card's own art. */
function tokenArt(unit: ViewFighter): number | null {
  if (!unit.cardId) return null
  return (
    slimeArtId('tokens', unit.cardId + '/' + PORTRAIT[mood(unit)]) ??
    slimeArtId('cards', unit.cardId)
  )
}

function basePct(hp: number): string {
  return Math.max(0, Math.min(100, (hp / (lab.sight.baseMax || 1)) * 100)) + '%'
}

/** Flags draw on their own square unless a carrier holds them. */
const loseFlags = computed(() =>
  turf.value ? [] : lab.sight.flags.filter((flag) => flag.carrier === null),
)

const inspectedCard = computed(() =>
  lab.inspectedUnit?.cardId
    ? playedCard(lab.match, cardById(lab.inspectedUnit.cardId))
    : null,
)
const inspectedName = computed(() => inspectedCard.value?.name ?? 'Concealed')

/** Highlight the squares the held or dragged creature card can land on. */
const heldCreature = computed(() => {
  const id = lab.dragCard ?? lab.selectedCard
  if (!id) return false
  return cardById(id).kind === 'creature'
})
function canLand(x: number, y: number): boolean {
  if (turf.value)
    return (
      !!heldCard.value &&
      !slimeAt(x, y) &&
      !visibleTrap(x, y) &&
      !lab.sight.units.some((u) => u.x === x && u.y === y)
    )
  return (
    heldCreature.value &&
    inDeployZone(lab.match, 'player', x) &&
    !flagSquare(lab.match, x, y) &&
    !lab.sight.units.some((u) => u.x === x && u.y === y)
  )
}

function monsterHere(x: number, y: number): boolean {
  const m = lab.sight.monster
  return !!m && m.x === x && m.y === y
}
function visibleTrap(x: number, y: number): boolean {
  return lab.sight.traps.some((trap) => trap.x === x && trap.y === y)
}
function tokenAria(unit: ViewFighter): string {
  if (!unit.cardId)
    return turf.value
      ? 'Concealed enemy stone. It may hide a tripwire.'
      : 'Concealed enemy. Open card.'
  if (turf.value)
    return (
      (unit.side === 'enemy' ? 'Enemy stone, ' : 'Your stone, ') +
      cardById(unit.cardId).name +
      (unit.warded ? ', warded' : '') +
      '. Open card.'
    )
  return (
    (unit.side === 'enemy' ? 'Enemy ' : '') +
    cardById(unit.cardId).name +
    ', ' +
    unit.hp +
    ' of ' +
    unit.maxHp +
    ' hit points, ' +
    (unit.stance === 'defend' ? 'defending' : 'attacking') +
    (unit.carryingFlag ? ', carrying a flag' : '') +
    '. Open card.'
  )
}
function cellAria(x: number, y: number): string {
  const flag = lab.sight.flags.findIndex(
    (f) => f.carrier === null && f.x === x && f.y === y,
  )
  const owner = territory.value[x + ':' + y]
  const parts = [
    'Square ' + (x + 1) + ', ' + (y + 1),
    turf.value
      ? owner === 'player'
        ? 'your turf'
        : owner === 'enemy'
          ? 'enemy turf'
          : ''
      : x === 0
        ? 'your base'
        : x === lab.match.width - 1
          ? 'enemy base'
          : '',
    slimeAt(x, y) ? 'slimed' : '',
    flag === 0 ? 'your flag' : flag === 1 ? 'enemy flag' : '',
    monsterHere(x, y) ? 'giant monster' : '',
  ]
  return parts.filter(Boolean).join(', ')
}

const winLine = computed(() => {
  const how: Record<string, string> = {
    flag: 'The flag was carried home.',
    base: 'A base was smashed flat.',
    score: 'Breakthroughs decided it.',
    rout: 'One side was routed.',
    time: 'Time ran out: the healthier base wins.',
    monster: 'The giant monster fell.',
    territory:
      'The turf was counted: ' +
      lab.sight.turfScore[0] +
      ' to ' +
      lab.sight.turfScore[1] +
      ' (komi ' +
      TURF_KOMI +
      ').',
  }
  return lab.match.winPath ? (how[lab.match.winPath] ?? '') : ''
})

/** Floating damage and heal numbers, plus a base shake, after each resolve. */
interface Pop {
  key: number
  id: number
  x: number
  y: number
  text: string
  kind: 'hurt' | 'heal' | 'ko' | 'base'
}
const pops = ref<Pop[]>([])
/**
 * TURF board events (Silas, 2026-11-04: "Do it 1", the Turf visuals pass):
 * every capture, explosion, crush, pounce, tripwire, slime, ward, wash, shove
 * and cling-on plays its own animation on its point, in the order it happened.
 */
interface Fx {
  key: number
  kind: TurfFxKind
  side: 'player' | 'enemy'
  x: number
  y: number
  dx: number
  dy: number
  delay: number
  label: string
}
const FX_STEP_MS = 140
const FX_LIFE_MS = 1300
const fxs = ref<Fx[]>([])
function fxLabel(fx: TurfFx): string {
  const mine = fx.side === 'player'
  return {
    capture: mine ? 'TAKEN' : 'LOST',
    boom: 'BOOM',
    crush: 'CRUSHED',
    pounce: 'POUNCE',
    trip: 'TRIPWIRE',
    slime: 'SLIMED',
    ward: 'WARDED',
    wash: 'WASHED',
    shove: 'SHOVED',
    cling: 'CLINGS ON',
  }[fx.kind]
}
function lastSeq(list: TurfFx[] | undefined): number {
  return list?.length ? list[list.length - 1]!.seq : 0
}
const hitBase = ref<'player' | 'enemy' | null>(null)
let popKey = 0
const timers = new Set<ReturnType<typeof setTimeout>>()
function later(fn: () => void, ms: number): void {
  const t = setTimeout(() => {
    timers.delete(t)
    fn()
  }, ms)
  timers.add(t)
}
watch(
  () => lab.match,
  (next, prev) => {
    if (!prev || next.seed !== prev.seed || next.commands.length === 0) return
    if (next.mode === 'turf') {
      const seen = lastSeq(prev.turfFx)
      const events = (next.turfFx ?? []).filter((f) => f.seq > seen)
      if (!events.length) return
      // A burst of one kind (a group captured at once) names it once; every
      // point still gets its ring.
      const named = new Set<TurfFxKind>()
      const nameOnce = (f: TurfFx): string => {
        if (named.has(f.kind)) return ''
        named.add(f.kind)
        return fxLabel(f)
      }
      const played: Fx[] = events.map((f, i) => ({
        key: ++popKey,
        kind: f.kind,
        side: f.side,
        x: f.x,
        y: f.y,
        dx: f.from ? f.x - f.from.x : 0,
        dy: f.from ? f.y - f.from.y : 0,
        delay: i * FX_STEP_MS,
        label: nameOnce(f),
      }))
      fxs.value = [...fxs.value, ...played]
      const keys = new Set(played.map((f) => f.key))
      later(
        () => {
          fxs.value = fxs.value.filter((f) => !keys.has(f.key))
        },
        FX_LIFE_MS + played.length * FX_STEP_MS,
      )
      return
    }
    const fresh: Pop[] = []
    const before = new Map(prev.units.map((u) => [u.id, u]))
    const seen = new Set<number>()
    for (const unit of next.units) {
      seen.add(unit.id)
      const was = before.get(unit.id)
      if (!was || was.hp === unit.hp) continue
      if (unit.side === 'enemy' && unit.hidden) continue
      const delta = unit.hp - was.hp
      fresh.push({
        key: ++popKey,
        id: unit.id,
        x: unit.x,
        y: unit.y,
        text: (delta > 0 ? '+' : '') + delta,
        kind: delta > 0 ? 'heal' : 'hurt',
      })
    }
    for (const was of prev.units)
      if (!seen.has(was.id))
        fresh.push({
          key: ++popKey,
          id: was.id,
          x: was.x,
          y: was.y,
          text: 'KO',
          kind: 'ko',
        })
    for (const side of ['player', 'enemy'] as const) {
      const lost = prev.bases[side] - next.bases[side]
      if (lost <= 0) continue
      hitBase.value = side
      later(() => (hitBase.value = null), 650)
      fresh.push({
        key: ++popKey,
        id: -1,
        x: side === 'player' ? 0 : next.width - 1,
        y: Math.floor(next.height / 2),
        text: '-' + lost + ' BASE',
        kind: 'base',
      })
    }
    if (!fresh.length) return
    pops.value = [...pops.value, ...fresh]
    const keys = new Set(fresh.map((p) => p.key))
    later(() => {
      pops.value = pops.value.filter((p) => !keys.has(p.key))
    }, 1100)
  },
)
onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t)
})
</script>

<style scoped>
.sca {
  --hud: #0b111bdd;
  --mine: #6fe9ff;
  --theirs: #ff7a7a;
  --gold: #ffd34d;
  --lime: #d7ff7a;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: #070b12;
  color: #f7f2e8;
}
.tone-red {
  --tone: #fe6657;
}
.tone-blue {
  --tone: #6fc8ff;
}
.tone-purple {
  --tone: #d38cff;
}
.tone-green {
  --tone: #c7fa62;
}
.tone-gold {
  --tone: #f7c968;
}
.sca-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  isolation: isolate;
}
.sca-backdrop {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.38;
  filter: blur(6px) saturate(1.2);
  transform: scale(1.06);
  pointer-events: none;
}

/* ---- HUD ---- */
.sca-hud {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.8rem;
  background: linear-gradient(#05080ef2, #05080e00);
}
.sca-base {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}
.sca-base.theirs {
  justify-content: flex-end;
  text-align: right;
}
.sca-base.hit {
  animation: sca-shake 0.45s;
}
.sca-emblem {
  flex: none;
  overflow: hidden;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.6rem;
  border: 2px solid var(--mine);
  box-shadow: 0 0 14px color-mix(in srgb, var(--mine) 50%, transparent);
}
.theirs .sca-emblem {
  border-color: var(--theirs);
  box-shadow: 0 0 14px color-mix(in srgb, var(--theirs) 50%, transparent);
}
.sca-base-text {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 0.45rem;
  min-width: 0;
  flex: 1;
  max-width: 16rem;
}
.sca-base-text small {
  grid-column: 1 / -1;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  color: #c6d2df;
}
.sca-base-text b {
  font-size: 1.25rem;
  font-weight: 1000;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.theirs .sca-base-text b {
  order: -1;
}
.sca-meter {
  position: relative;
  height: 0.7rem;
  overflow: hidden;
  border-radius: 999px;
  background: #ffffff1c;
  box-shadow: inset 0 0 0 1px #ffffff26;
}
.sca-meter i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #2ab7d6, var(--mine));
  transition: width 0.45s ease-out;
}
.theirs .sca-meter i {
  inset: 0 0 0 auto;
  background: linear-gradient(270deg, #d63c4c, var(--theirs));
}
.sca-flag-chip {
  flex: none;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #ffd34d88;
  color: var(--gold);
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  background: #2a210b99;
}
.sca-flag-chip.taken {
  border-color: #ff7a7a;
  color: #fff;
  background: #7a1d2acc;
  animation: sca-pulse 1s infinite alternate;
}
.theirs .sca-flag-chip.taken {
  border-color: var(--gold);
  background: #6b5310cc;
}
.sca-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.sca-clock strong {
  font-size: 1.15rem;
  font-weight: 1000;
  letter-spacing: 0.14em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.sca-clock strong small {
  font-size: 0.7rem;
  color: #9aa7b8;
}
.sca-tag {
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  color: var(--lime);
  text-transform: uppercase;
}
.sca-modes {
  display: flex;
  padding: 0.15rem;
  gap: 0.15rem;
  border-radius: 999px;
  background: #ffffff14;
}
.sca-modes button {
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #b8c4d0;
}
.sca-modes button.active {
  background: var(--lime);
  color: #111a0c;
}

/* ---- Board ---- */
.sca-field {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 0.25rem 0.75rem 0.5rem;
  container-type: size;
}
.sca-board {
  position: relative;
  display: grid;
  width: min(100cqw, calc(100cqh * var(--ratio, 1)));
  aspect-ratio: var(--ratio, 1);
  gap: 0;
  border: 4px solid #8aa0ae;
  border-radius: 0.6rem;
  background: #1e2b34;
  overflow: visible;
  box-shadow:
    0 0 0 4px #10141c,
    0 24px 60px #000c,
    0 0 80px color-mix(in srgb, var(--tone) 18%, transparent);
  transform: perspective(1400px) rotateX(8deg);
  transform-origin: 50% 100%;
}
.sca-board .sc-board-floor {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: 0.35rem;
  pointer-events: none;
}
.sca-board .sc-board-floor :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.15);
}
.sca-tile {
  position: relative;
  z-index: 1;
  min-width: 0;
  min-height: 0;
  background: #0b1a2224;
  box-shadow: inset 0 0 0 1px #00000038;
  outline-offset: -3px;
  transition: background 0.15s;
}
.sca-tile:nth-child(even) {
  background: #0b1a2240;
}
.sca-tile.base-mine {
  background: linear-gradient(90deg, #6fe9ff55, #6fe9ff1f);
  box-shadow:
    inset 0 0 0 1px #6fe9ff33,
    inset 3px 0 #6fe9ffaa;
}
.sca-tile.base-theirs {
  background: linear-gradient(270deg, #ff7a7a55, #ff7a7a1f);
  box-shadow:
    inset 0 0 0 1px #ff7a7a33,
    inset -3px 0 #ff7a7aaa;
}
.sca-tile.landing {
  background: #c8ff6a40;
  outline: 2px dashed #d7ff7acc;
}
.sca-tile:hover,
.sca-tile:focus-visible {
  outline: 2px solid #d7ff69;
}
.sca-tile.lair {
  background: radial-gradient(circle, #ff3fbf77, #3a103766 75%);
}
.sca-trap {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #ff98b4;
  font-size: 1rem;
  opacity: 0.75;
}
/* TURF: your wired trap stone wears its tripwire as a corner badge. */
.sca-trap.wired {
  inset: 1px 2px auto auto;
  z-index: 3;
  font-size: 0.75rem;
  opacity: 1;
  text-shadow: 0 0 4px #ff3fbf;
  pointer-events: none;
}
.sca-monster {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ff9be8;
  font-size: clamp(1.1rem, 4cqh, 2.4rem);
  line-height: 1;
  text-shadow: 0 0 14px #ff3fbf;
}
.sca-monster small {
  font-size: 0.55rem;
  color: #ffd6f4;
}
.sca-base-label {
  position: absolute;
  z-index: 2;
  top: 50%;
  font-size: clamp(0.45rem, 1.6cqh, 0.7rem);
  font-weight: 1000;
  letter-spacing: 0.3em;
  writing-mode: vertical-rl;
  pointer-events: none;
  opacity: 0.85;
  text-shadow: 0 1px 4px #000;
}
.sca-base-label.mine {
  left: -1.35rem;
  color: var(--mine);
  transform: translateY(-50%) rotate(180deg);
}
.sca-base-label.theirs {
  right: -1.35rem;
  color: var(--theirs);
  transform: translateY(-50%);
}

/* TURF: a Go board — square points, star points, territory tint, slime. */
.sca-board.turf {
  background: #2a2216;
}
.sca-board.turf .sca-tile {
  background: #1b140a40;
  box-shadow: inset 0 0 0 1px #f5d28a33;
}
.sca-tile.star::after {
  content: '';
  position: absolute;
  inset: 44%;
  border-radius: 50%;
  background: #f5d28a99;
}
.sca-tile.turf-mine {
  background: color-mix(in srgb, var(--mine) 22%, transparent);
}
.sca-tile.turf-theirs {
  background: color-mix(in srgb, var(--theirs) 22%, transparent);
}
.sca-slime {
  position: absolute;
  inset: 10%;
  border-radius: 46% 54% 40% 60% / 55% 45% 55% 45%;
  background: radial-gradient(circle at 35% 30%, #e9ff9c, #7ed321 55%, #2f5d0c);
  box-shadow:
    0 0 14px #9cff3a99,
    inset 0 -3px 6px #1d3a06aa;
  animation: sca-wobble 1.6s ease-in-out infinite alternate;
}
@keyframes sca-wobble {
  to {
    border-radius: 58% 42% 52% 48% / 44% 56% 44% 56%;
    transform: scale(1.05);
  }
}
.sca-token.warded .sca-portrait {
  box-shadow:
    0 0 0 3px #8fe7ff,
    0 0 20px #8fe7ffaa;
}
.sca-turf-rule {
  margin: 0;
  padding: 0.6rem 0.7rem;
  border-radius: 0.6rem;
  border: 1px solid #f5d28a55;
  background: #2a221688;
  color: #f8ecd2;
  font-size: 0.78rem;
  line-height: 1.45;
}
.sca-held {
  pointer-events: none;
}

/* Flags and tokens sit on a layer sized to the grid. */
.sca-flag,
.sca-token,
.sca-pop {
  position: absolute;
  left: calc((var(--x) + 0.5) / var(--w) * 100%);
  top: calc((var(--y) + 0.5) / var(--h) * 100%);
  translate: -50% -50%;
}
.sca-flag {
  z-index: 2;
  display: grid;
  place-items: center;
  width: calc(100% / var(--w) * 0.9);
  aspect-ratio: 1;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, #ffd34d66, transparent 70%);
  animation: sca-pulse 1.4s infinite alternate;
}
.sca-flag i {
  font-style: normal;
  font-size: clamp(1rem, 6cqh, 2.6rem);
  line-height: 1;
  filter: drop-shadow(0 2px 2px #000);
}
.sca-flag.mine i {
  color: var(--mine);
}
.sca-flag.theirs i {
  color: var(--theirs);
}
.sca-tokens {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.sca-token {
  --ring: var(--mine);
  width: calc(100% / var(--w) * 0.84);
  aspect-ratio: 1;
  padding: 0;
  border-radius: 50%;
  pointer-events: auto;
  transition:
    left 0.45s cubic-bezier(0.3, 0.8, 0.3, 1),
    top 0.45s cubic-bezier(0.3, 0.8, 0.3, 1),
    transform 0.15s;
}
.sca-token.hostile {
  --ring: var(--theirs);
}
.sca-token:hover,
.sca-token:focus-visible,
.sca-token.open {
  transform: scale(1.14);
  z-index: 4;
}
.sca-portrait {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 50%;
  border: 3px solid var(--ring);
  background: #18222f;
  box-shadow:
    0 6px 10px #000b,
    0 0 12px color-mix(in srgb, var(--ring) 60%, transparent);
}
.sca-portrait :deep(img) {
  object-position: 50% 30%;
}
.sca-token.hostile .sca-portrait :deep(img) {
  transform: scaleX(-1);
}
.sca-token.open .sca-portrait {
  border-color: #fff;
  box-shadow:
    0 0 0 3px var(--ring),
    0 0 22px var(--ring);
}
.sca-token.defend .sca-portrait {
  border-style: double;
  border-width: 5px;
}
.sca-token.carrier .sca-portrait {
  box-shadow:
    0 0 0 3px var(--gold),
    0 0 22px var(--gold);
}
.sca-token.sealed .sca-portrait {
  background: repeating-linear-gradient(
    35deg,
    #243346,
    #243346 5px,
    #4c5269 6px,
    #4c5269 10px
  );
  border-style: dashed;
}
.sca-token.rooted .sca-portrait {
  outline: 2px dashed #8fd3ff;
  outline-offset: 2px;
}
.sca-unknown {
  display: grid;
  place-items: center;
  height: 100%;
  font-size: 1.4rem;
  font-weight: 1000;
}
.sca-face {
  position: absolute;
  right: -12%;
  bottom: -6%;
  font-size: clamp(0.75rem, 3.6cqh, 1.35rem);
  line-height: 1;
  filter: drop-shadow(0 1px 2px #000);
  transition: transform 0.2s;
}
.sca-token.mood-ouch .sca-face {
  animation: sca-shake 0.4s;
}
.sca-stance {
  position: absolute;
  left: -10%;
  top: -8%;
  display: grid;
  place-items: center;
  width: 42%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #0b111bee;
  border: 1px solid var(--ring);
  font-size: clamp(0.5rem, 2.4cqh, 0.85rem);
}
.sca-carried {
  position: absolute;
  right: -10%;
  top: -18%;
  color: var(--gold);
  font-size: clamp(0.8rem, 4cqh, 1.5rem);
  filter: drop-shadow(0 1px 2px #000);
  animation: sca-pulse 0.8s infinite alternate;
}
.sca-hp {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: -10%;
  height: 12%;
  min-height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: #000c;
}
.sca-hp i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #79f28a, #d7ff7a);
  transition: width 0.4s;
}
.hostile .sca-hp i {
  background: linear-gradient(90deg, #ff5c6c, #ff9b7a);
}
.sca-token-enter-from,
.sca-token-leave-to {
  opacity: 0;
  transform: scale(0.3);
}
.sca-token-enter-active {
  transition:
    opacity 0.3s,
    transform 0.35s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.sca-token-leave-active {
  transition:
    opacity 0.45s,
    transform 0.45s;
}
.sca-pop {
  z-index: 5;
  font-size: clamp(0.8rem, 4.5cqh, 1.6rem);
  font-weight: 1000;
  pointer-events: none;
  text-shadow:
    0 2px 0 #000,
    0 0 10px #000;
  animation: sca-rise 1.1s ease-out forwards;
}
.sca-pop.hurt {
  color: #ff6b6b;
}
.sca-pop.heal {
  color: #8aff9a;
}
.sca-pop.ko {
  color: #fff;
  letter-spacing: 0.1em;
}
.sca-pop.base {
  color: var(--gold);
  font-size: clamp(0.7rem, 3.6cqh, 1.2rem);
  white-space: nowrap;
}

/* ---- Card inspector ---- */
.sca-inspect {
  position: absolute;
  z-index: 6;
  top: 4.2rem;
  right: 0.75rem;
  bottom: 0.75rem;
  width: min(21rem, 46%);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem;
  overflow: auto;
  border: 1px solid #ffffff2a;
  border-radius: 1rem;
  background: #070b12ee;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 60px #000c;
  animation: sca-slide 0.22s ease-out;
}
.sca-close {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #000a;
  font-weight: 900;
}
.sca-inspect-card {
  flex: none;
  width: min(100%, 13.5rem);
  margin: 0 auto;
}
.sca-concealed {
  display: grid;
  place-items: center;
  gap: 0.3rem;
  aspect-ratio: 2 / 3;
  border-radius: 0.8rem;
  border: 2px dashed #6b7a90;
  background: repeating-linear-gradient(
    35deg,
    #1b2533,
    #1b2533 6px,
    #262f40 7px,
    #262f40 12px
  );
  text-align: center;
}
.sca-concealed span {
  font-size: 3rem;
  font-weight: 1000;
}
.sca-inspect-live {
  display: grid;
  gap: 0.5rem;
  padding-right: 2rem;
}
.sca-live-stats {
  display: flex;
  justify-content: space-around;
  margin: 0;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #b8c4d0;
}
.sca-live-stats b {
  font-size: 1.2rem;
  color: #fff;
}
.sca-callout {
  margin: 0;
  text-align: center;
  color: var(--gold);
  font-weight: 900;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
}
.sca-orders {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.sca-orders button {
  display: grid;
  gap: 0.2rem;
  padding: 0.65rem 0.5rem;
  border-radius: 0.7rem;
  border: 2px solid #ffffff2e;
  background: #ffffff0d;
  text-align: center;
  transition:
    transform 0.12s,
    border-color 0.12s;
}
.sca-orders button b {
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}
.sca-orders button small {
  font-size: 0.58rem;
  color: #aab6c6;
}
.sca-orders button.on {
  border-color: var(--lime);
  background: #d7ff7a22;
  box-shadow: 0 0 18px #d7ff7a33;
}
.sca-orders button:hover {
  transform: translateY(-2px);
}
.sca-orders-read {
  margin: 0;
  text-align: center;
  font-size: 0.7rem;
  color: #c6d2df;
}

/* ---- Overlays shared with the page's console language ---- */
.sca-result {
  position: absolute;
  z-index: 7;
  inset: 18% 15%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  border: 2px solid var(--lime);
  border-radius: 1rem;
  background: #070b12f0;
  box-shadow: 0 0 6rem #000;
  text-align: center;
}
.sca-result strong {
  font-size: clamp(1.2rem, 4cqw, 2.6rem);
  letter-spacing: 0.12em;
  color: var(--lime);
}
.sc-result-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}
.sc-result-actions button,
.sc-guide button {
  padding: 0.6rem 1rem;
  border: 1px solid var(--lime);
  border-radius: 0.5rem;
  color: #f2ffd0;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.sc-guide {
  position: absolute;
  z-index: 8;
  inset: 0.6rem;
  max-width: 36rem;
  margin: 0 auto;
  overflow: auto;
  padding: 1rem 1.1rem;
  border: 2px solid var(--lime);
  border-radius: 1rem;
  background: #070b12f4;
  color: #dfe6f0;
  font-size: 0.78rem;
  line-height: 1.5;
  box-shadow: 0 0 4rem #000;
}
.sc-overline {
  display: block;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  color: var(--lime);
}
.sc-guide-goal {
  margin: 0.4rem 0;
  color: #f2ffd0;
  font-weight: 800;
}
.sc-guide ol,
.sc-guide ul {
  margin: 0.3rem 0 0.7rem;
  padding-left: 1.2rem;
}
.sc-guide-seed {
  color: #a6aac0;
  font-size: 0.66rem;
}
.sc-rules {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}
.sc-rule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.sc-guide .sc-rule {
  padding: 0.3rem 0.55rem;
  border: 1px solid #60708167;
  border-radius: 999px;
  background: #26304477;
  color: #c9d2de;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.sc-guide .sc-rule.on {
  border-color: #ff7de0;
  background: #4a1f45;
  color: #fff;
}

/* ---- Bottom bar ---- */
.sc-battle-bottom {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.2rem;
  padding: 0.45rem 0.8rem;
  background: #070b12;
  border-top: 1px solid #ffffff14;
  font-size: 0.68rem;
  color: #b8c4d0;
}
.sc-battle-bottom span:first-child {
  color: var(--lime);
  font-weight: 900;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.sc-battle-bottom span:nth-child(2) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sca-go {
  flex: none;
  padding: 0.75rem 1.4rem;
  border-radius: 0.6rem;
  background: linear-gradient(#e3ff8f, #b6ee45);
  color: #142008;
  font-size: 0.8rem;
  font-weight: 1000;
  letter-spacing: 0.14em;
  box-shadow:
    0 4px 0 #6c9a1d,
    0 0 24px #c8ff5a55;
  transition: transform 0.1s;
}
.sca-go:hover:not(:disabled) {
  transform: translateY(-2px);
}
.sca-go:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #6c9a1d;
}
.sca-go:disabled {
  opacity: 0.45;
}

@keyframes sca-pulse {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}
@keyframes sca-shake {
  0%,
  100% {
    translate: 0 0;
  }
  25% {
    translate: -3px 0;
  }
  75% {
    translate: 3px 0;
  }
}
/* ---- TURF board events: one animation per kind ---- */
.sca-fx {
  --c: var(--mine);
  position: absolute;
  z-index: 5;
  left: calc(var(--x) / var(--w) * 100%);
  top: calc(var(--y) / var(--h) * 100%);
  width: calc(100% / var(--w));
  height: calc(100% / var(--h));
  display: grid;
  place-items: center;
  pointer-events: none;
}
.sca-fx.theirs {
  --c: var(--theirs);
}
.sca-fx i {
  position: absolute;
  inset: 8%;
  border: 3px solid var(--c);
  border-radius: 50%;
  opacity: 0;
  animation: sca-fx-ring 0.9s ease-out var(--delay) forwards;
}
.sca-fx b {
  position: relative;
  color: var(--c);
  font-size: clamp(0.42rem, min(2.6cqh, 2.1cqw), 0.95rem);
  font-weight: 1000;
  letter-spacing: 0.06em;
  white-space: nowrap;
  text-shadow:
    0 2px 0 #000,
    0 0 8px #000;
  opacity: 0;
  animation: sca-fx-label 1.2s ease-out var(--delay) forwards;
}
/* Captures read as yours (cyan) or lost (red) by who took them. */
.sca-fx.boom {
  --c: #ffae42;
}
.sca-fx.boom i {
  border: 0;
  background: radial-gradient(circle, #fff6 0 15%, #ff8a2a 35%, #ff3d2a00 70%);
  animation-name: sca-fx-boom;
}
.sca-fx.crush i {
  border-radius: 18%;
  border-width: 4px;
  animation-name: sca-fx-crush;
}
.sca-fx.pounce {
  --c: #ff9be1;
}
.sca-fx.pounce i {
  border: 0;
  border-radius: 0;
  background: repeating-linear-gradient(
    -55deg,
    transparent 0 18%,
    var(--c) 18% 24%
  );
  animation-name: sca-fx-claw;
}
.sca-fx.trip {
  --c: #ff4fd8;
}
.sca-fx.trip i {
  border-style: dashed;
  animation-name: sca-fx-zap;
}
.sca-fx.slime {
  --c: #8dff5a;
}
.sca-fx.slime i {
  border: 0;
  background: radial-gradient(circle, #8dff5a88, #8dff5a00 70%);
  animation-name: sca-fx-ripple;
}
.sca-fx.ward {
  --c: var(--gold);
}
.sca-fx.ward i {
  border-radius: 30%;
  animation-name: sca-fx-shield;
}
.sca-fx.wash {
  --c: #bff3ff;
}
.sca-fx.wash i {
  border-style: dotted;
}
.sca-fx.cling {
  --c: #8aff9a;
}
.sca-fx.cling i {
  animation-name: sca-fx-beat;
}
/* A shoved stone's ghost slides from where it stood. */
.sca-fx.shove i {
  border-style: solid;
  animation-name: sca-fx-slide;
}
@keyframes sca-fx-ring {
  from {
    opacity: 1;
    transform: scale(0.4);
  }
  to {
    opacity: 0;
    transform: scale(1.6);
  }
}
@keyframes sca-fx-label {
  0% {
    opacity: 0;
    transform: translateY(0.3rem) scale(0.8);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1.15);
  }
  70% {
    opacity: 1;
    transform: translateY(-0.6rem) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-1.1rem) scale(1);
  }
}
@keyframes sca-fx-boom {
  0% {
    opacity: 1;
    transform: scale(0.3);
  }
  40% {
    opacity: 1;
    transform: scale(2.2);
  }
  100% {
    opacity: 0;
    transform: scale(2.6);
  }
}
@keyframes sca-fx-crush {
  0% {
    opacity: 1;
    transform: scale(1.7);
  }
  35% {
    opacity: 1;
    transform: scale(0.85) translateX(-6%);
  }
  50% {
    transform: scale(0.85) translateX(6%);
  }
  65% {
    transform: scale(0.85) translateX(-3%);
  }
  100% {
    opacity: 0;
    transform: scale(0.85);
  }
}
@keyframes sca-fx-claw {
  0% {
    opacity: 1;
    clip-path: inset(0 100% 0 0);
  }
  45% {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
  100% {
    opacity: 0;
    clip-path: inset(0 0 0 0);
  }
}
@keyframes sca-fx-zap {
  0%,
  30%,
  60% {
    opacity: 1;
    transform: scale(1.1) rotate(0deg);
  }
  15%,
  45% {
    opacity: 0.2;
    transform: scale(1.3) rotate(20deg);
  }
  100% {
    opacity: 0;
    transform: scale(1.6) rotate(45deg);
  }
}
@keyframes sca-fx-ripple {
  from {
    opacity: 1;
    transform: scale(0.2);
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
}
@keyframes sca-fx-shield {
  0% {
    opacity: 0;
    transform: scale(1.5);
  }
  35% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
@keyframes sca-fx-beat {
  0%,
  40% {
    opacity: 1;
    transform: scale(0.8);
  }
  20%,
  60% {
    opacity: 1;
    transform: scale(1.15);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
@keyframes sca-fx-slide {
  from {
    opacity: 1;
    transform: translate(calc(var(--dx) * -125%), calc(var(--dy) * -125%));
  }
  to {
    opacity: 0;
    transform: translate(0, 0);
  }
}
@keyframes sca-fx-fade {
  0%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes sca-rise {
  from {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  to {
    opacity: 0;
    transform: translateY(-1.6rem) scale(1);
  }
}
@keyframes sca-slide {
  from {
    opacity: 0;
    transform: translateX(1rem);
  }
}

@container (max-width: 760px) {
  .sca-hud {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    grid-template-areas:
      'clock clock help'
      'mine theirs theirs';
    gap: 0.4rem 0.6rem;
    padding: 0.4rem 0.5rem;
  }
  .sca-clock {
    grid-area: clock;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  .sca-base.mine {
    grid-area: mine;
  }
  .sca-base.theirs {
    grid-area: theirs;
  }
  .sca-help {
    grid-area: help;
  }
  .sca-emblem {
    width: 2rem;
    height: 2rem;
  }
  .sca-flag-chip {
    display: none;
  }
  .sca-board {
    transform: none;
  }
  .sca-base-label {
    display: none;
  }
  .sca-inspect {
    top: auto;
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    width: auto;
    max-height: 72%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .sca-inspect-card {
    width: min(42%, 11rem);
  }
  .sca-inspect-live {
    flex: 1;
    min-width: 10rem;
  }
  .sca-orders {
    grid-template-columns: 1fr;
  }
  .sc-battle-bottom span:nth-child(2) {
    display: none;
  }
  .sc-battle-bottom span:first-child {
    flex: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sca-fx i {
    display: none;
  }
  .sca-fx b {
    animation-name: sca-fx-fade;
  }
  .sca-token,
  .sca-meter i,
  .sca-hp i {
    transition: none;
  }
  .sca-flag,
  .sca-carried,
  .sca-flag-chip.taken,
  .sca-slime,
  .sca-pop,
  .sca-base.hit,
  .sca-token.mood-ouch .sca-face {
    animation: none;
  }
  .sca-board {
    transform: none;
  }
}
</style>
