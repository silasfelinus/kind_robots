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
            <small
              >RIVAL BOSS<template v-if="rivalAlly">
                · ALLY {{ rivalAlly.name }}</template
              ></small
            ><strong>{{ rival.name }}</strong>
            <span class="clash-health"
              ><i :style="{ width: healthWidth('enemy') }"
            /></span>
          </div>
          <b
            >{{ game.boss.enemy }}
            <small>/ {{ clashBossCap(game, 'enemy') }} HP</small></b
          >
          <span
            v-if="bossHit === 'enemy'"
            :key="'boss-enemy-' + impactKey"
            class="clash-float is-boss"
            >-{{ impact!.dealt }}</span
          >
          <span
            v-if="alliance"
            class="clash-power-chip"
            :class="{ spent: game.powerUsed?.enemy }"
            :title="rivalPower.name + ': ' + rivalPower.text"
            data-testid="clash-rival-power"
            >{{ rivalPower.symbol }} {{ rivalPower.name
            }}{{ game.powerUsed?.enemy ? ' · USED' : '' }}</span
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
          <SlimeCityClashMoment :moment="spectacle" />
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
                :data-clash-side="side"
                :data-clash-lane="lane"
                @click="clickSlot(side, lane)"
              >
                <template v-if="unit(side, lane)">
                  <SlimeCityArtwork
                    :image-id="artFor(unit(side, lane)!)"
                    :alt="cardById(unit(side, lane)!.cardId).name"
                    :fallback="cardById(unit(side, lane)!.cardId).symbol"
                    compact
                  />
                  <span class="clash-fighter-label"
                    ><i
                      class="clash-stars"
                      :class="{ max: unit(side, lane)!.level >= 3 }"
                      :aria-label="'Level ' + unit(side, lane)!.level"
                      >{{ '★'.repeat(unit(side, lane)!.level) }}</i
                    >{{ cardById(unit(side, lane)!.cardId).name }}</span
                  >
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
            <small
              >YOUR BOSS<template v-if="myAlly">
                · ALLY {{ myAlly.name }}</template
              ></small
            ><strong>{{ mine.name }}</strong>
            <span class="clash-health"
              ><i :style="{ width: healthWidth('player') }"
            /></span>
          </div>
          <b
            >{{ game.boss.player }}
            <small>/ {{ clashBossCap(game, 'player') }} HP</small></b
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
            >{{ game.plays.player }} / {{ clashPlayLimit(game, 'player') }} card
            plays · {{ game.decks.player.length }} in deck ·
            {{ game.discards.player.length }} discarded</span
          >
        </div>
        <div
          class="clash-format"
          role="group"
          aria-label="Clash format"
          data-testid="clash-format"
        >
          <button
            type="button"
            :aria-pressed="!alliance"
            :disabled="inBout"
            title="SOLO CLASH: your faction's 20-card deck"
            data-testid="clash-format-solo"
            @click="lab.playClashFormat('solo')"
          >
            SOLO
          </button>
          <button
            type="button"
            :aria-pressed="alliance"
            :disabled="inBout"
            title="ALLIANCE: two factions, 20 cards and your general's one-time power"
            data-testid="clash-format-alliance"
            @click="lab.playClashFormat('alliance')"
          >
            ALLIANCE
          </button>
        </div>
        <button
          v-if="alliance"
          type="button"
          class="clash-power"
          :class="{ armed: powerArmed, spent: game.powerUsed?.player }"
          data-testid="clash-power"
          :aria-pressed="powerArmed"
          :title="myPower.name + ': ' + myPower.text + ' One use per match.'"
          :disabled="!powerReady"
          @click="firePower"
        >
          {{ myPower.symbol }}
          {{
            game.powerUsed?.player
              ? myPower.name + ' · USED'
              : powerArmed
                ? 'PICK A RIVAL FIGHTER'
                : myPower.name
          }}
        </button>
        <span
          class="clash-kind"
          :class="'is-' + lab.clashLaunch.kind"
          data-testid="clash-kind"
          >{{ kindLabel }}</span
        >
        <button
          v-if="backTarget"
          type="button"
          class="clash-reset clash-back"
          data-testid="clash-back"
          @click="goBack"
        >
          {{ backTarget }}
        </button>
        <button
          v-if="(!inBout || game.victor) && lab.clashLaunch.kind !== 'tower'"
          type="button"
          class="clash-reset"
          data-testid="clash-restart"
          :title="
            rewarded
              ? 'A new CPU match for XP and Meat'
              : 'Start a new practice match'
          "
          :disabled="lab.progressBusy"
          @click="lab.playClashFormat()"
        >
          ↻ {{ rewarded ? 'PLAY FOR REWARDS' : 'REMATCH' }}
        </button>
        <button
          type="button"
          class="clash-pass"
          data-testid="clash-pass"
          :title="
            noLegalPlay
              ? 'No playable card in this hand. Pass to continue the round.'
              : 'Skip remaining card plays and send your crew in'
          "
          :disabled="
            busy ||
            game.active !== 'player' ||
            game.phase !== 'play' ||
            !!game.victor
          "
          @click="pass"
        >
          {{ noLegalPlay ? 'PASS' : 'FIGHT' }} <span aria-hidden="true">›</span>
        </button>
      </div>
      <div class="clash-hand-zone">
        <p class="clash-ticker" aria-live="polite">{{ ticker }}</p>
        <p
          v-if="rewardNote"
          class="clash-reward-note"
          aria-live="polite"
          data-testid="clash-reward-note"
        >
          {{ rewardNote }}
        </p>
      </div>
    </footer>
    <div
      v-if="choiceStages && selectedCard"
      class="clash-choice"
      role="radiogroup"
      aria-label="Choose this card's level three"
      data-testid="clash-choice"
    >
      <span class="clash-choice-label">CHOOSE ONE · LV 3</span>
      <button
        v-for="(st, i) in choiceStages"
        :key="st.title"
        type="button"
        role="radio"
        :aria-checked="evoPick === i"
        :class="{ on: evoPick === i }"
        :data-testid="'clash-choice-' + i"
        @click="evoPick = i === 1 ? 1 : 0"
      >
        <b>{{ st.title }}</b>
        <small>{{ evoStageText(st, selectedCard.kind) }}</small>
      </button>
    </div>
    <SlimeCityClashHand
      :game="game"
      :held="heldIndex"
      :inspect="inspect"
      @pick="onPick"
      @drop="onDrop"
    />
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
import { slimeArtId, slimeCardArtId } from '~/utils/slimeCity/artManifest'
import {
  cardById,
  teamById,
  type Card,
  type Side,
} from '~/utils/slimeCity/prototypes'
import {
  CLASH_LANES,
  applyClashCommand,
  canClashPower,
  useClashPower,
  clashPlayLimit,
  canClashPlay,
  chooseClashCpu,
  clashBossCap,
  clashEffectivePlayCost,
  clashPower,
  clashLevel,
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
import { factionPower } from '~/utils/slimeCity/factionPowers'
import {
  clashEvolutionChoice,
  type EvoPick,
} from '~/utils/slimeCity/clashEvolutions'
import { evoStageText } from '~/utils/slimeCity/evolutions/dsl'
import {
  clashSpectacle,
  type ClashSpectacle,
} from '~/utils/slimeCity/clashSpectacle'

const STRIKE_WINDUP_MS = 320
const STRIKE_SETTLE_MS = 560
const CPU_PLAY_MS = 520

const lab = useSlimeCityStore()
const lanes = Array.from({ length: CLASH_LANES }, (_, lane) => lane)
const sides: Side[] = ['enemy', 'player']
/** Deal whatever match the store launched (practice, reward or bout). */
function dealt(): ClashState {
  const setup = lab.clashSetup()
  return createClash(setup.player, setup.enemy, setup.seed, setup.options)
}
const game = shallowRef<ClashState>(dealt())
let dealtLaunch = lab.clashLaunch.id
const mine = computed(() => teamById(game.value.teams.player))
const rival = computed(() => teamById(game.value.teams.enemy))
const inBout = computed(() =>
  ['rival', 'contract', 'campaign', 'tower'].includes(lab.clashLaunch.kind),
)
const rewarded = computed(
  () => lab.progressLoaded && lab.clashLaunch.kind === 'reward',
)
const kindLabel = computed(
  () =>
    ({
      practice: 'PRACTICE',
      reward: 'REWARD MATCH',
      rival: 'CITY BOUT',
      contract: 'CITY CONTRACT',
      campaign: 'STORY BOUT',
      tower: 'TOWER FIGHT',
    })[lab.clashLaunch.kind] +
    ' · ' +
    (alliance.value ? 'ALLIANCE' : 'SOLO'),
)
/** After a City or Story bout ends, head back to where it started. */
const backTarget = computed(() => {
  if (!game.value.victor || !lab.clashResult) return ''
  const kind = lab.clashResult.kind
  if (kind === 'campaign') return 'BACK TO STORY ›'
  if (kind === 'tower') return 'BACK TO TOWER ›'
  if (kind === 'rival' || kind === 'contract') return 'BACK TO THE CITY ›'
  return ''
})
function goBack(): void {
  if (lab.clashResult?.kind === 'campaign') lab.showCampaign()
  else if (lab.clashResult?.kind === 'tower') lab.showTower()
  else lab.showCity()
}
const rewardNote = computed(() =>
  lab.clashLaunch.kind === 'reward' && game.value.victor
    ? lab.progressBusy
      ? 'Verifying your match…'
      : lab.progressError || lab.progress.lastReward || ''
    : lab.clashLaunch.kind === 'reward' && !game.value.victor
      ? 'Reward match: the server replays your moves before paying out.'
      : '',
)
const alliance = computed(() => game.value.format === 'alliance')
const myPower = computed(() => factionPower(game.value.teams.player))
const rivalPower = computed(() => factionPower(game.value.teams.enemy))
const myAlly = computed(() =>
  game.value.allies?.player ? teamById(game.value.allies.player) : null,
)
const rivalAlly = computed(() =>
  game.value.allies?.enemy ? teamById(game.value.allies.enemy) : null,
)
const powerArmed = ref(false)
const heldIndex = ref<number | null>(null)
const selectedUnit = ref<number | null>(null)
const lunge = ref<{ side: Side; lane: number } | null>(null)
const impact = ref<ClashStrike | null>(null)
const impactKey = ref(0)
const spectacle = shallowRef<(ClashSpectacle & { key: number }) | null>(null)
let spectacleKey = 0
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
/** Every flourish is derived from the same committed command as the game. */
function commit(next: ClashState): number {
  const cue = clashSpectacle(game.value, next)
  game.value = next
  if (!cue) return 0
  spectacle.value = { ...cue, key: ++spectacleKey }
  return cue.grade === 'legend' ? 1550 : cue.grade === 'feature' ? 1100 : 0
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
      commit(endClashTurn(s, s.active))
      if (busy.value) schedule(CPU_PLAY_MS)
      return
    }
    if (lunge.value?.side !== s.active || lunge.value.lane !== lane) {
      impact.value = null
      lunge.value = { side: s.active, lane }
      schedule(STRIKE_WINDUP_MS)
      return
    }
    const flourish = commit(strikeClash(s, s.active))
    impact.value = game.value.strike
    impactKey.value++
    schedule(Math.max(STRIKE_SETTLE_MS, flourish))
    return
  }
  if (s.active !== 'enemy') return
  const flourish = commit(applyClashCommand(s, chooseClashCpu(s)))
  schedule(Math.max(CPU_PLAY_MS, flourish))
}
function kick(delay = 0): void {
  if (busy.value && !timer) schedule(Math.max(CPU_PLAY_MS, delay))
}
function newMatch(): void {
  stopTimer()
  heldIndex.value = null
  selectedUnit.value = null
  lunge.value = null
  impact.value = null
  spectacle.value = null
  powerArmed.value = false
  dealtLaunch = lab.clashLaunch.id
  game.value = dealt()
}
watch(() => lab.clashLaunch.id, newMatch)
// Changing crews mid-practice deals a new match for the new crew.
watch(
  () => lab.activeTeam,
  () => {
    if (!inBout.value) lab.playClashFormat()
  },
)
// Every finished match reports to the store once: City, Story or rewards.
watch(
  () => game.value.victor,
  (victor) => {
    if (victor) lab.settleClash(dealtLaunch, game.value)
  },
)
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
/** A held choose-one level three: its two options, and the one picked. */
const evoPick = ref<EvoPick>(0)
const choiceStages = computed(() =>
  selectedCard.value
    ? clashEvolutionChoice(
        selectedCard.value.id,
        clashLevel(game.value, 'player', selectedCard.value.id),
      )
    : undefined,
)
watch(heldIndex, () => {
  evoPick.value = 0
})
const resultText = computed(() =>
  game.value.victor === 'player'
    ? 'YOU WIN!'
    : game.value.victor === 'enemy'
      ? 'RIVAL WINS'
      : 'DRAW',
)
const noLegalPlay = computed(
  () =>
    game.value.active === 'player' &&
    game.value.phase === 'play' &&
    !game.value.hands.player.some((id) =>
      lanes.some((lane) => canClashPlay(game.value, 'player', id, lane)),
    ),
)
const phaseLabel = computed(() => {
  const s = game.value
  if (s.victor) return resultText.value
  if (s.phase === 'attack')
    return s.active === 'player' ? 'YOUR CREW STRIKES' : 'RIVAL STRIKES'
  if (s.active === 'enemy') return 'RIVAL PLAYING'
  if (noLegalPlay.value) return 'NO LEGAL PLAY · PASS TO CONTINUE'
  return s.plays.player === 0
    ? clashPlayLimit(s, 'player') === 1
      ? 'OPENING TURN: PLAY ONE CARD'
      : 'PLAY UP TO TWO CARDS'
    : 'ONE MORE PLAY, THEN FIGHT'
})
const bossHit = computed<Side | null>(() =>
  impact.value?.target === 'boss' && impact.value.dealt > 0
    ? impact.value.side === 'player'
      ? 'enemy'
      : 'player'
    : null,
)
const inspect = computed<{
  id: string
  note: string
  level: number
  pick?: EvoPick
} | null>(() => {
  const u = game.value.units.find((v) => v.uid === selectedUnit.value)
  if (!u) return null
  return {
    id: u.cardId,
    level: u.level,
    pick: u.evoChoice ?? 0,
    note:
      (u.side === 'player' ? 'Your fighter' : 'Rival fighter') +
      ' in alley ' +
      (u.lane + 1) +
      ': ' +
      clashPower(game.value, u) +
      ' power, ' +
      u.hp +
      '/' +
      u.maxHp +
      ' life' +
      (u.armor ? ', ' + u.armor + ' armor' : '') +
      (u.guard ? ', +' + u.guard + ' Union Wall armor' : '') +
      '.' +
      (u.rooted ? ' Stunned: skips its next strike.' : '') +
      (u.fresh && !u.keywords.includes('ambush')
        ? ' Just landed: blocks now, strikes next turn.'
        : ''),
  }
})
const ticker = computed(() =>
  busy.value || game.value.victor
    ? (game.value.log[game.value.log.length - 1]?.text ?? '')
    : '',
)

function unit(side: Side, lane: number): ClashUnit | undefined {
  return clashUnitAt(game.value, side, lane)
}
function artFor(u: ClashUnit): number | null {
  const face =
    u.hp < u.maxHp ? 'hurt' : u.side === 'player' ? 'fierce' : 'guard'
  return (
    (u.level >= 2
      ? slimeCardArtId(u.cardId, u.level, u.evoChoice ?? 0)
      : null) ??
    slimeArtId('tokens', u.cardId + '/' + face) ??
    slimeCardArtId(u.cardId, u.level)
  )
}
function healthWidth(side: Side): string {
  return (
    Math.max(
      0,
      (game.value.boss[side] / clashBossCap(game.value, side)) * 100,
    ) + '%'
  )
}
function status(u: ClashUnit): string {
  if (u.rooted) return 'STUN'
  if (u.guard) return 'WALL +' + u.guard
  if (u.fresh && !game.value.victor && !u.keywords.includes('ambush'))
    return 'NEW'
  return ''
}
function playableNow(id: string): boolean {
  const s = game.value
  return (
    !busy.value &&
    !s.victor &&
    s.active === 'player' &&
    s.phase === 'play' &&
    clashEffectivePlayCost(s, 'player', cardById(id)) + s.plays.player <=
      clashPlayLimit(s, 'player')
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
/** Your power can fire now (for a targeted power: at some fighter). */
const powerReady = computed(
  () =>
    alliance.value &&
    !busy.value &&
    lanes.some((lane) => canClashPower(game.value, 'player', lane)),
)
function firePower(): void {
  if (!powerReady.value) return
  if (myPower.value.target === 'none') {
    commit(useClashPower(game.value, 'player'))
    heldIndex.value = null
    return
  }
  powerArmed.value = !powerArmed.value
  heldIndex.value = null
  selectedUnit.value = null
}
function targetable(side: Side, lane: number): boolean {
  if (powerArmed.value)
    return (
      side === (myPower.value.target === 'own' ? 'player' : 'enemy') &&
      canClashPower(game.value, 'player', lane)
    )
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
function onPick(index: number | null): void {
  powerArmed.value = false
  selectedUnit.value = null
  heldIndex.value = index
}
function onDrop(index: number, side: Side, lane: number): void {
  heldIndex.value = index
  if (targetable(side, lane)) clickSlot(side, lane)
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
  if (powerArmed.value) {
    if (targetable(side, lane)) {
      commit(useClashPower(game.value, 'player', lane))
      powerArmed.value = false
      selectedUnit.value = null
    }
    return
  }
  const card = selectedCard.value
  if (card && targetable(side, lane)) {
    const next = playClash(game.value, 'player', card.id, lane, evoPick.value)
    if (next === game.value) return
    const flourish = commit(next)
    heldIndex.value = null
    selectedUnit.value = null
    kick(flourish)
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
  commit(passClash(game.value, 'player'))
  heldIndex.value = null
  kick()
}
function forecast(lane: number): string {
  const ours = unit('player', lane)
  const theirs = unit('enemy', lane)
  if (!ours && !theirs) return '◇'
  const power = (u: ClashUnit): string =>
    u.rooted
      ? '⌁'
      : u.fresh && !u.keywords.includes('ambush')
        ? '⏳'
        : String(clashPower(game.value, u))
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
.clash-format {
  display: flex;
  border: 1px solid #5c99917a;
  border-radius: 0.55rem;
  overflow: hidden;
  flex: 0 0 auto;
}
.clash-format button {
  background: #10231f;
  border: 0;
  padding: 0.4rem 0.55rem;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.06em;
}
.clash-format button[aria-pressed='true'] {
  background: #b9f15126;
  color: #e9ffd0;
}
.clash-power {
  background: linear-gradient(110deg, #4a3510, #2a1b08);
  border: 1px solid #ffd76a99;
  border-radius: 0.55rem;
  padding: 0.5rem 0.7rem;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #ffe9a8;
  white-space: nowrap;
}
.clash-power:hover:not(:disabled),
.clash-power.armed {
  border-color: #ffd76a;
  box-shadow: 0 0 12px #ffd76a66;
}
.clash-power.spent {
  text-decoration: line-through;
  filter: grayscale(0.7);
}
.clash-power-chip {
  font-size: 0.6rem;
  font-weight: 850;
  color: #ffd76a;
  white-space: nowrap;
}
.clash-power-chip.spent {
  opacity: 0.5;
  text-decoration: line-through;
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

@media (max-width: 850px) {
  .clash {
    overflow: auto;
  }
  .clash-stage {
    grid-template-columns: minmax(0, 1fr);
    flex: none;
  }

  .clash-row {
    min-height: 120px;
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
}
@media (prefers-reduced-motion: reduce) {
  .clash-slot,
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

@media (max-width: 850px) {
  .clash {
    overflow: hidden;
  }
  .clash-stage {
    grid-template-columns: minmax(0, 1fr);
    flex: 1 1 auto;
  }
}
@media (max-width: 520px) {
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
/* A held choose-one level three: two option buttons above the hand. */
.clash-choice {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 7;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.4rem;
  width: min(34rem, calc(100% - 2rem));
  padding: 0.45rem;
  border: 2px solid var(--neon);
  border-radius: 0.8rem;
  background: #071115;
  box-shadow: 0 0.4rem 1.4rem #000a;
}
.clash-choice-label {
  flex: 1 0 100%;
  text-align: center;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--neon);
}
.clash-choice button {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.55rem;
  border: 2px solid #ffffff33;
  border-radius: 0.6rem;
  background: #0b2026;
  color: var(--ink);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.clash-choice button.on {
  border-color: var(--neon);
  box-shadow: 0 0 0.8rem #b9f15166;
}
.clash-choice b {
  font-size: 0.75rem;
}
.clash-choice small {
  font-size: 0.65rem;
  line-height: 1.25;
  opacity: 0.85;
}
/* Fixed hand zone: the floating hand overlays it, so turns never resize the board. */
.clash {
  position: relative;
  overflow: clip;
}
.clash-hand-zone {
  position: relative;
  height: calc(clamp(9.5rem, 30vw, 15rem) * 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4.5rem;
}
.clash-kind {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #5c99917a;
  color: #b8e3d8;
  white-space: nowrap;
}
.clash-kind.is-reward {
  border-color: #ffd76a99;
  color: #ffe9a8;
}
.clash-kind.is-rival,
.clash-kind.is-contract,
.clash-kind.is-campaign {
  border-color: #f08ad699;
  color: #ffc4ef;
}
.clash-back {
  border-color: var(--neon);
  color: #e9ffd0;
}
.clash-reward-note {
  margin: 0.2rem 0 0;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: #ffe9a8;
}
.clash-ticker {
  margin: 0;
  max-width: 34rem;
  text-align: center;
  font-size: clamp(0.7rem, 1.6vw, 0.95rem);
  font-weight: 750;
  line-height: 1.3;
  color: #c9e3dc;
}
.clash-row.is-player .clash-empty {
  position: absolute;
  top: 14%;
}
@media (max-width: 700px) {
  .clash-hand-zone {
    height: 5rem;
    padding: 0 3.6rem;
  }
}
.clash-stars {
  display: block;
  font-style: normal;
  font-size: 0.85em;
  letter-spacing: 0.1em;
  color: #ffe6a6;
}
.clash-stars.max {
  color: #ffd34d;
  text-shadow: 0 0 6px #ffb800;
}
</style>
