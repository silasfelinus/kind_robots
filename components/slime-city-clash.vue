<!-- Canonical Clash: two card plays, then an animated automatic alley-by-alley strike sweep. -->
<template>
  <section
    class="clash"
    :class="{ 'log-open': logOpen }"
    data-testid="slime-clash"
    aria-label="Slime City Clash"
  >
    <div class="clash-layout">
      <div class="clash-stage">
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
                @pointerenter="hoverSlot($event, side, lane)"
                @pointerleave="hoverUnit = null"
              >
                <template v-if="unit(side, lane)">
                  <SlimeCityArtwork
                    :image-id="artFor(unit(side, lane)!)"
                    :alt="cardById(unit(side, lane)!.cardId).name"
                    :fallback="cardById(unit(side, lane)!.cardId).symbol"
                    compact
                  />
                  <span class="clash-numbers">
                    <b
                      :key="'atk-' + clashPower(game, unit(side, lane)!)"
                      class="clash-stat is-attack"
                      :aria-label="
                        clashPower(game, unit(side, lane)!) + ' attack'
                      "
                      ><i aria-hidden="true">⚔</i
                      >{{ clashPower(game, unit(side, lane)!) }}</b
                    >
                    <b
                      :key="'hp-' + unit(side, lane)!.hp"
                      class="clash-stat is-life"
                      :class="{
                        low:
                          unit(side, lane)!.hp * 3 <= unit(side, lane)!.maxHp,
                      }"
                      :aria-label="unit(side, lane)!.hp + ' life'"
                      ><svg viewBox="0 0 24 22" aria-hidden="true">
                        <path
                          d="M12 21.2S1.6 14.9.4 8.4C-.5 3.8 2.6.5 6.3.5c2.4 0 4.3 1.3 5.7 3.3C13.4 1.8 15.3.5 17.7.5c3.7 0 6.8 3.3 5.9 7.9C22.4 14.9 12 21.2 12 21.2z"
                        /></svg
                      ><span>{{ unit(side, lane)!.hp }}</span></b
                    >
                  </span>
                  <span class="clash-fighter-label"
                    ><i
                      class="clash-stars"
                      :class="{ max: unit(side, lane)!.level >= 3 }"
                      :aria-label="'Level ' + unit(side, lane)!.level"
                      >{{ '★'.repeat(unit(side, lane)!.level) }}</i
                    >{{ cardById(unit(side, lane)!.cardId).name }}</span
                  >
                  <span class="clash-tags">
                    <span
                      v-if="unit(side, lane)!.armor"
                      class="clash-tag is-armor"
                      >🛡 {{ unit(side, lane)!.armor }}</span
                    >
                    <span
                      v-if="status(unit(side, lane)!)"
                      class="clash-status"
                      >{{ status(unit(side, lane)!) }}</span
                    >
                    <span
                      v-if="unit(side, lane)!.gear.length"
                      class="clash-gear"
                      >✦ {{ unit(side, lane)!.gear.length }}</span
                    >
                  </span>
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
      </div>

      <aside class="clash-vs" aria-label="Versus">
        <div
          v-for="side in sides"
          :key="'boss-' + side"
          class="clash-boss"
          :class="[
            'is-' + side,
            'mood-' + mood(side),
            { hit: bossHit === side },
          ]"
          :data-testid="'clash-boss-' + side"
        >
          <div class="clash-portrait">
            <SlimeCityArtwork
              :key="side + mood(side)"
              :image-id="
                slimeArtId('bosses', teamOf(side).id + '/' + mood(side))
              "
              :fallback-image-id="slimeArtId('crews', teamOf(side).id)"
              :alt="teamOf(side).name + ' boss, ' + mood(side)"
              :fallback="teamOf(side).insignia"
              compact
            />
            <Transition name="clash-quip">
              <span
                v-if="quip(side)"
                :key="reactions[side].key"
                class="clash-quip"
                aria-live="polite"
                >{{ quip(side) }}</span
              >
            </Transition>
            <span
              v-if="bossHit === side"
              :key="'boss-' + side + '-' + impactKey"
              class="clash-float is-boss"
              >-{{ impact!.dealt }}</span
            >
          </div>
          <div class="clash-boss-info">
            <small
              >{{ side === 'enemy' ? 'RIVAL BOSS' : 'YOUR BOSS'
              }}<template v-if="allyOf(side)">
                · ALLY {{ allyOf(side)!.name }}</template
              ></small
            >
            <strong>{{ teamOf(side).name }}</strong>
            <span class="clash-health"
              ><i :style="{ width: healthWidth(side) }"
            /></span>
            <span class="clash-boss-line">
              <b class="clash-hp"
                >{{ game.boss[side]
                }}<small>/ {{ clashBossCap(game, side) }}</small></b
              >
              <span
                class="clash-bank"
                :aria-label="
                  game.plays[side] +
                  ' of ' +
                  clashPlayLimit(game, side) +
                  ' card plays used'
                "
                ><i
                  v-for="n in clashPlayLimit(game, side)"
                  :key="n"
                  :class="{ used: n <= game.plays[side] }"
                />PLAYS</span
              >
            </span>
            <span v-if="side === 'enemy'" class="clash-powers">
              <span
                v-for="team in clashPowers(game, 'enemy')"
                :key="'rival-power-' + team"
                class="clash-power-chip"
                :class="{
                  spent: clashPowerSpent(game, 'enemy', team),
                  charged: rivalCharged,
                }"
                :title="powerTitle(team)"
                data-testid="clash-rival-power"
                >{{ factionPower(team).symbol
                }}<span class="clash-power-name">
                  {{ factionPower(team).name
                  }}{{
                    clashPowerSpent(game, 'enemy', team) ? ' · USED' : ''
                  }}</span
                ></span
              >
            </span>
            <span v-else class="clash-powers">
              <button
                v-for="(team, i) in clashPowers(game, 'player')"
                :key="'power-' + team"
                type="button"
                class="clash-power"
                :class="{
                  armed: powerArmed === team,
                  spent: clashPowerSpent(game, 'player', team),
                  charged: myCharged && !clashPowerSpent(game, 'player', team),
                }"
                :data-testid="i === 0 ? 'clash-power' : 'clash-power-ally'"
                :aria-pressed="powerArmed === team"
                :title="powerTitle(team)"
                :disabled="!powerReady(team)"
                @click="firePower(team)"
              >
                {{ factionPower(team).symbol
                }}<span class="clash-power-name">
                  {{
                    clashPowerSpent(game, 'player', team)
                      ? factionPower(team).name + ' · USED'
                      : powerArmed === team
                        ? 'PICK A TARGET'
                        : (myCharged ? '⚡ ' : '') + factionPower(team).name
                  }}</span
                >
              </button>
            </span>
          </div>
        </div>

        <div class="clash-vs-mid">
          <button
            type="button"
            class="clash-exit"
            data-testid="clash-exit"
            :title="exitLabel"
            :aria-label="exitLabel"
            @click="leave"
          >
            ‹
          </button>
          <SlimeCityCrewSelect
            v-if="!inBout"
            compact
            label="Your crew"
            @picked="lab.playClashFormat()"
          />
          <span class="clash-vs-badge" aria-hidden="true">VS</span>
          <span class="clash-phase">
            <small>ROUND {{ game.round }}</small>
            <strong>{{ phaseLabel }}</strong>
          </span>
          <button
            type="button"
            class="clash-log-toggle"
            :aria-expanded="logOpen"
            data-testid="clash-log-toggle"
            @click="logOpen = !logOpen"
          >
            LOG
          </button>
        </div>

        <section
          class="clash-log"
          aria-label="Battle log"
          data-testid="clash-log"
        >
          <h3>BATTLE LOG</h3>
          <div class="clash-log-meta">
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
              v-if="!inBout && !game.victor"
              type="button"
              class="clash-new-match"
              data-testid="clash-new-match"
              :disabled="lab.progressBusy"
              @click="lab.playClashFormat()"
            >
              ↻ NEW
            </button>
            <span
              class="clash-kind"
              :class="'is-' + lab.clashLaunch.kind"
              data-testid="clash-kind"
              >{{ kindLabel }}</span
            >
          </div>

          <ol ref="logList" class="kr-scroll">
            <li
              v-for="(entry, i) in logEntries"
              :key="i"
              :class="['is-' + entry.kind, { round: entry.newRound }]"
            >
              <small v-if="entry.newRound">ROUND {{ entry.round }}</small>
              <span>{{ entry.text }}</span>
            </li>
            <li v-if="!logEntries.length" class="is-empty">
              <span>Play a card to start the fight.</span>
            </li>
          </ol>
        </section>

        <div class="clash-console">
          <div id="clash-hand-dock" class="clash-hand-dock"></div>
          <div class="clash-console-main">
            <div class="clash-console-row">
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
                v-if="game.victor && !reportOpen"
                type="button"
                class="clash-reset"
                data-testid="clash-show-report"
                title="Meat earned and notes on this match"
                @click="reportOpen = true"
              >
                ★ REWARDS
              </button>
              <button
                v-if="game.victor && lab.clashLaunch.kind !== 'tower'"
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
                v-if="!game.victor"
                type="button"
                class="clash-reset clash-undo"
                data-testid="clash-undo"
                title="Take back your last card or power this turn"
                :disabled="undoAt < 0"
                @click="undo"
              >
                ↶<span class="clash-undo-word"> UNDO</span>
              </button>
              <button
                v-if="!game.victor"
                type="button"
                class="clash-pass"
                data-testid="clash-pass"
                :title="
                  noLegalPlay
                    ? 'No playable card in this hand. Pass to continue the round.'
                    : 'Skip remaining card plays and send your crew in'
                "
                :class="{ ready: readyToFight }"
                :disabled="
                  !readyToFight &&
                  (busy ||
                    game.active !== 'player' ||
                    game.phase !== 'play' ||
                    !!game.victor)
                "
                @click="pass"
              >
                {{ noLegalPlay ? 'PASS' : 'FIGHT' }}
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
    <SlimeCityMatchReport
      v-if="game.victor && reportOpen"
      :state="game"
      :kind-label="kindLabel"
      :back-label="backTarget || 'BACK TO VS ›'"
      :can-rematch="lab.clashLaunch.kind !== 'tower'"
      @close="reportOpen = false"
      @rematch="rematchFromReport"
      @back="backFromReport"
    />
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
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
  type TeamId,
} from '~/utils/slimeCity/prototypes'
import {
  CLASH_LANES,
  applyClashCommand,
  canClashPower,
  clashOvercharged,
  clashPowers,
  clashPowerSpent,
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
  replayClash,
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
import { bossQuip, type BossMood } from '~/utils/slimeCity/bossReactions'
import { OVERCHARGE_RULE, factionPower } from '~/utils/slimeCity/factionPowers'
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
/** The exact setup this match was dealt from, so an undo can replay it. */
let dealtSetup = lab.clashSetup()
function dealt(): ClashState {
  dealtSetup = lab.clashSetup()
  return createClash(
    dealtSetup.player,
    dealtSetup.enemy,
    dealtSetup.seed,
    dealtSetup.options,
  )
}
const game = shallowRef<ClashState>(dealt())
let dealtLaunch = lab.clashLaunch.id
function teamOf(side: Side) {
  return teamById(game.value.teams[side])
}
function allyOf(side: Side) {
  const ally = game.value.allies?.[side]
  return ally ? teamById(ally) : null
}
const inBout = computed(() =>
  ['rival', 'contract', 'campaign', 'tower'].includes(lab.clashLaunch.kind),
)
const rewarded = computed(
  () => lab.progressLoaded && lab.clashLaunch.kind === 'reward',
)
const kindLabel = computed(
  () =>
    ({
      practice: 'VS CPU',
      reward: 'REWARD MATCH',
      rival: 'JOURNEY BOUT',
      contract: 'JOURNEY CONTRACT',
      campaign: 'JOURNEY CHAPTER BOUT',
      tower: 'TOWER FIGHT',
    })[lab.clashLaunch.kind] +
    ' · ' +
    (alliance.value ? 'ALLIANCE' : 'SOLO'),
)
/** After a City or Story bout ends, head back to where it started. */
const backTarget = computed(() => {
  if (!game.value.victor || !lab.clashResult) return ''
  const kind = lab.clashResult.kind
  if (kind === 'campaign') return 'BACK TO JOURNEY ›'
  if (kind === 'tower') return 'BACK TO TOWER ›'
  if (kind === 'rival' || kind === 'contract') return 'BACK TO JOURNEY MAP ›'
  return 'BACK TO VS ›'
})
/** Phones hide the mode tabs during a fight; this leads back out. */
const exitLabel = computed(() =>
  inBout.value
    ? lab.clashLaunch.kind === 'tower'
      ? 'Back to the Tower'
      : 'Back to the Journey'
    : 'Back to VS',
)
function leave(): void {
  const kind = lab.clashLaunch.kind
  if (kind === 'campaign') lab.showCampaign()
  else if (kind === 'tower') lab.showTower()
  else if (kind === 'rival' || kind === 'contract') lab.showCity()
  else lab.showVs()
}
function goBack(): void {
  if (lab.clashResult?.kind === 'campaign') lab.showCampaign()
  else if (lab.clashResult?.kind === 'tower') lab.showTower()
  else if (
    lab.clashResult?.kind === 'rival' ||
    lab.clashResult?.kind === 'contract'
  )
    lab.showCity()
  else lab.showVs()
}
/** Every server-issued match pays: PRACTICE and, signed in, every bout. */
const rewardNote = computed(() =>
  lab.clashLaunch.rewardId && game.value.victor
    ? lab.progressBusy
      ? 'Verifying your match…'
      : lab.progressError || lab.progress.lastReward || ''
    : lab.clashLaunch.rewardId && !game.value.victor
      ? 'Reward match: the server replays your moves before paying out.'
      : inBout.value && !game.value.victor
        ? lab.boutUnrewarded
        : '',
)
const alliance = computed(() => game.value.format === 'alliance')
/** Silas, 2026-11-10 PT: one power in SOLO, both crews' powers in ALLIANCE. */
const powerArmed = ref<TeamId | null>(null)
const myCharged = computed(() => clashOvercharged(game.value, 'player'))
const rivalCharged = computed(() => clashOvercharged(game.value, 'enemy'))
function powerTitle(team: TeamId): string {
  const power = factionPower(team)
  return (
    power.name +
    ': ' +
    power.text +
    ' One use per match. ' +
    OVERCHARGE_RULE +
    ' Overcharged: ' +
    power.overcharge
  )
}
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
/**
 * Boss reactions: a boss winces when its life or a fighter falls and the
 * other boss gloats; the match result holds each face until a rematch.
 */
const reactions = reactive<Record<Side, { mood: BossMood; key: number }>>({
  player: { mood: 'ready', key: 0 },
  enemy: { mood: 'ready', key: 0 },
})
const reactionTimers: Partial<Record<Side, ReturnType<typeof setTimeout>>> = {}
function react(side: Side, mood: BossMood): void {
  clearTimeout(reactionTimers[side])
  reactions[side] = { mood, key: reactions[side].key + 1 }
  reactionTimers[side] = setTimeout(() => {
    if (!game.value.victor)
      reactions[side] = { mood: 'ready', key: reactions[side].key }
  }, 1700)
}
function resetReactions(): void {
  for (const side of sides) {
    clearTimeout(reactionTimers[side])
    reactions[side] = { mood: 'ready', key: 0 }
  }
}
function mood(side: Side): BossMood {
  const victor = game.value.victor
  if (victor && victor !== 'draw') return victor === side ? 'gloat' : 'beaten'
  return reactions[side].mood
}
function quip(side: Side): string {
  return reactions[side].key ? bossQuip(teamOf(side).id, mood(side)) : ''
}
function reactTo(prev: ClashState, next: ClashState): void {
  if (next.victor && !prev.victor) {
    if (next.victor !== 'draw') {
      react(next.victor, 'gloat')
      react(next.victor === 'player' ? 'enemy' : 'player', 'beaten')
    }
    return
  }
  const hurt = sides.filter(
    (side) =>
      next.boss[side] < prev.boss[side] ||
      (next.fallen?.[side]?.length ?? 0) > (prev.fallen?.[side]?.length ?? 0),
  )
  for (const side of sides) {
    if (hurt.includes(side)) react(side, 'hit')
    else if (hurt.length) react(side, 'gloat')
  }
}
/** Every flourish is derived from the same committed command as the game. */
function commit(next: ClashState): number {
  const cue = clashSpectacle(game.value, next)
  reactTo(game.value, next)
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
  powerArmed.value = null
  hoverUnit.value = null
  resetReactions()
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
/**
 * The reward screen rises a beat after the final blow, so the knockout and
 * the bosses' reactions land first. SEE BOARD hides it; ★ REWARDS reopens.
 */
const reportOpen = ref(false)
let reportTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => game.value.victor,
  (victor) => {
    if (reportTimer) clearTimeout(reportTimer)
    reportTimer = null
    if (!victor) {
      reportOpen.value = false
      return
    }
    reportTimer = setTimeout(() => {
      if (game.value.victor) reportOpen.value = true
    }, 1400)
  },
)
onBeforeUnmount(() => {
  if (reportTimer) clearTimeout(reportTimer)
})
function rematchFromReport(): void {
  reportOpen.value = false
  lab.playClashFormat()
}
function backFromReport(): void {
  reportOpen.value = false
  goBack()
}
onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    pace.value = 0.4
})
onBeforeUnmount(() => {
  stopTimer()
  resetReactions()
})

/** Silas, 2026-11-10 PT: "we should be able to see a log of an active game". */
const logOpen = ref(false)
const logList = ref<HTMLOListElement | null>(null)
const logEntries = computed(() =>
  game.value.log.slice(-80).map((entry, i, all) => ({
    ...entry,
    newRound: i === 0 || all[i - 1]!.round !== entry.round,
  })),
)
watch(
  () => game.value.log.length,
  async () => {
    await nextTick()
    const list = logList.value
    if (list) list.scrollTop = list.scrollHeight
  },
)

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
  if (powerArmed.value)
    return factionPower(powerArmed.value).name.toUpperCase() + ': PICK AN ALLEY'
  if (noLegalPlay.value) return 'NO LEGAL PLAY · PASS TO CONTINUE'
  return s.plays.player === 0
    ? s.round === 1
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
/** A mouse over a fighter previews its full card, docked away from it. */
const hoverUnit = ref<number | null>(null)
function hoverSlot(event: PointerEvent, side: Side, lane: number): void {
  if (event.pointerType !== 'mouse') return
  hoverUnit.value = unit(side, lane)?.uid ?? null
}
const inspect = computed<{
  id: string
  note: string
  level: number
  pick?: EvoPick
  hover?: boolean
  dock?: 'left' | 'right'
} | null>(() => {
  // A clicked fighter stays pinned with its level tabs; hover previews
  // only while nothing is pinned (Silas, 2026-11-10 PT: "if a user clicks on
  // the card rather than hovers, we should get the evolution").
  const pinned = game.value.units.find((v) => v.uid === selectedUnit.value)
  const hovered =
    pinned || heldIndex.value !== null
      ? undefined
      : game.value.units.find((v) => v.uid === hoverUnit.value)
  const u = pinned ?? hovered
  if (!u) return null
  return {
    id: u.cardId,
    level: u.level,
    pick: u.evoChoice ?? 0,
    hover: !pinned && !!hovered,
    dock: u.lane >= 2 ? 'left' : 'right',
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
  // A deployed fighter IS its card. Show the full card painting (or its
  // curated evolution painting), not the old cropped reaction-face token.
  // This also avoids a level-two fighter silently showing level-one token art.
  return slimeCardArtId(u.cardId, u.level, u.evoChoice ?? 0)
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
/** A power can fire now (for a targeted power: at some fighter). */
function powerReady(team: TeamId): boolean {
  return (
    !busy.value &&
    lanes.some((lane) => canClashPower(game.value, 'player', lane, team))
  )
}
function firePower(team: TeamId): void {
  if (!powerReady(team)) return
  heldIndex.value = null
  selectedUnit.value = null
  if (factionPower(team).target === 'none') {
    commit(useClashPower(game.value, 'player', 0, team))
    powerArmed.value = null
    return
  }
  powerArmed.value = powerArmed.value === team ? null : team
}
function targetable(side: Side, lane: number): boolean {
  const armed = powerArmed.value
  if (armed)
    return (
      side === (factionPower(armed).target === 'own' ? 'player' : 'enemy') &&
      canClashPower(game.value, 'player', lane, armed)
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
  powerArmed.value = null
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
      commit(useClashPower(game.value, 'player', lane, powerArmed.value))
      powerArmed.value = null
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
    // Your last play holds here until FIGHT, so it can still be undone.
    if (!readyToFight.value) kick(flourish)
    return
  }
  const targetUnit = unit(side, lane)
  if (targetUnit) {
    heldIndex.value = null
    selectedUnit.value =
      selectedUnit.value === targetUnit.uid ? null : targetUnit.uid
  }
}
/**
 * Silas, 2026-11-10 PT: "there should be an undo button if you are still on
 * the same round". Your last card or power this turn, while you are still
 * choosing plays: the match replays from its deal without it, so the same
 * seed gives the same draws, and a reward transcript never sees it.
 */
/**
 * Your last allowed play ends the play phase in the engine; the sweep waits
 * for FIGHT instead of starting at once, so that play can still be undone.
 */
const readyToFight = computed(() => {
  const s = game.value
  if (s.victor || s.active !== 'player' || s.phase !== 'attack') return false
  const last = s.commands.at(-1)
  return last?.t === 'play' && last.side === 'player'
})
const undoAt = computed(() => {
  const s = game.value
  if (
    s.victor ||
    s.active !== 'player' ||
    !(readyToFight.value || (s.phase === 'play' && !busy.value))
  )
    return -1
  for (let i = s.commands.length - 1; i >= 0; i--) {
    const c = s.commands[i]!
    if (c.t === 'end' || c.t === 'pass' || c.t === 'strike') return -1
    if (c.side === 'player' && (c.t === 'play' || c.t === 'power')) return i
  }
  return -1
})
function undo(): void {
  const at = undoAt.value
  if (at < 0) return
  stopTimer()
  game.value = replayClash(
    dealtSetup.player,
    dealtSetup.enemy,
    dealtSetup.seed,
    game.value.commands.slice(0, at),
    dealtSetup.options,
  )
  heldIndex.value = null
  selectedUnit.value = null
  hoverUnit.value = null
  powerArmed.value = null
  lunge.value = null
  impact.value = null
  spectacle.value = null
}
function pass(): void {
  if (readyToFight.value) {
    heldIndex.value = null
    kick()
    return
  }
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
/*
  Silas, 2026-11-10 PT: the board owns the screen; the boss portraits, life,
  card plays, hand button, controls and battle log form ONE versus console
  beside it (a rail on wide screens, top and bottom strips on narrow ones).
*/
.clash {
  --ink: #ecf9fc;
  --neon: #b9f151;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: clip;
  box-sizing: border-box;
  color: var(--ink);
  background:
    radial-gradient(ellipse at 50% 5%, #265049bb, transparent 60%), #071115;
  font-family: inherit;
  container: clash / size;
}
.clash-layout {
  --rail: clamp(15rem, 24cqw, 21rem);
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--rail);
  gap: 0.35rem;
  padding: 0.3rem;
  box-sizing: border-box;
}
.clash button {
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.clash button:disabled {
  cursor: default;
  opacity: 0.58;
}

/* ---------- Board ---------- */
.clash-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.clash-board {
  position: relative;
  isolation: isolate;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  padding: clamp(0.2rem, 0.6vw, 0.45rem);
  border-radius: 0.8rem;
  border: 1px solid #38877a77;
  background: #101e23;
}
.clash-map-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: 0;
  opacity: 0.86;
  pointer-events: none;
}
.clash-map-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.8rem;
}
.clash-lane-numbers,
.clash-row,
.clash-impact {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(0.12rem, 0.5vw, 0.3rem);
}
.clash-lane-numbers {
  flex: none;
  position: relative;
  z-index: 1;
}
.clash-lane-numbers span {
  text-align: center;
  font-size: 0.59rem;
  letter-spacing: 0.08em;
  color: #fff0c7;
  text-shadow: 0 1px 4px #06121d;
}
.clash-row {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}
.clash-row:has(.lunge) {
  z-index: 3;
}
.clash-impact {
  position: relative;
  z-index: 2;
  flex: none;
  align-items: center;
  min-height: 1.35rem;
  border-radius: 0.3rem;
  background: #061a1db5;
}
.clash-impact span {
  text-align: center;
  color: #d9f9ab;
  font-size: clamp(0.55rem, 0.95vw, 0.78rem);
  font-weight: 850;
  white-space: nowrap;
}
.clash-impact span.striking {
  color: #fff3b0;
  text-shadow: 0 0 8px #ffd34d;
}

/* ---------- Fighter tokens ---------- */
.clash-slot {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d6e8d266;
  border-radius: 0.45rem;
  background: #06171f31;
  backdrop-filter: brightness(0.94);
  container-type: size;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.clash-row.is-enemy .clash-slot {
  background: #301a2a46;
}
.clash-slot.filled {
  background-image: radial-gradient(ellipse at 50% 40%, #31545b, #081a25 80%);
  border-style: solid;
  border-color: #83c4ae88;
}
.clash-row.is-enemy .clash-slot.filled {
  border-color: #dc9cb088;
}
.clash-slot.filled:hover {
  border-color: #fff;
}
.clash-slot.target {
  border: 2px solid var(--neon);
  box-shadow:
    inset 0 0 18px #b9f13c40,
    0 0 11px #b9f13c40;
}
.clash-slot.selected {
  border-color: #fff;
  box-shadow: 0 0 0 2px #ffffff88;
}
.clash-slot > :deep(.slime-art) {
  position: absolute;
  inset: 0;
  margin: 0;
}
.clash-slot :deep(img) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  opacity: 1;
}
.clash-numbers {
  --stat: clamp(1.6rem, 30cqmin, 4.2rem);
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  right: 0.2rem;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;
}
.clash-stat {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--stat);
  height: var(--stat);
  font-size: calc(var(--stat) * 0.52);
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: #fff;
  -webkit-text-stroke: calc(var(--stat) * 0.03) #1b0b04;
  paint-order: stroke fill;
  text-shadow:
    0 2px 0 #0009,
    0 0 6px #000a;
  animation: clash-stat-pop 0.42s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.clash-stat.is-attack {
  clip-path: polygon(50% 0, 100% 18%, 100% 66%, 50% 100%, 0 66%, 0 18%);
  background:
    radial-gradient(circle at 35% 25%, #fff7c9 0 12%, transparent 40%),
    linear-gradient(160deg, #ffe07a, #f59a1b 55%, #9c4a06);
}
.clash-stat.is-attack::before {
  content: '';
  position: absolute;
  inset: 8%;
  clip-path: inherit;
  border: 0;
  background: linear-gradient(160deg, #ffcf4d00, #6b2f0055);
}
.clash-stat.is-attack i {
  position: absolute;
  right: 6%;
  bottom: 14%;
  font-size: 0.34em;
  font-style: normal;
  -webkit-text-stroke: 0;
  opacity: 0.8;
}
.clash-stat.is-life svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 2px 2px #000a);
}
.clash-stat.is-life path {
  fill: #ff4f6d;
  stroke: #3a0612;
  stroke-width: 1.1;
}
.clash-stat.is-life span {
  position: relative;
  margin-top: -8%;
}
.clash-stat.is-life.low path {
  fill: #a8203c;
  animation: clash-heartbeat 0.9s ease-in-out infinite;
  transform-origin: 50% 55%;
}
.clash-fighter-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  padding: 0.6rem 0.25rem 0.25rem;
  font-size: clamp(0.5rem, 11cqmin, 0.85rem);
  line-height: 1.05;
  font-weight: 850;
  text-align: center;
  color: #fff;
  background: linear-gradient(transparent, #030e14ec 55%);
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
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
.clash-tags {
  position: absolute;
  left: 0.2rem;
  right: 0.2rem;
  bottom: calc(clamp(0.5rem, 11cqmin, 0.85rem) * 2.4 + 0.6rem);
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.15rem;
  pointer-events: none;
}
.clash-status,
.clash-gear,
.clash-tag {
  font-size: clamp(0.5rem, 8cqmin, 0.68rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  background: #03141af0;
  color: #d7ff89;
}
.clash-tag.is-armor {
  color: #bfe3ff;
}
.clash-empty {
  color: #c6dcd4;
  font-size: clamp(0.5rem, 0.85vw, 0.72rem);
  letter-spacing: 0.06em;
  font-weight: 750;
  text-shadow: 0 1px 3px #000;
}
.clash-row.is-player .clash-empty {
  position: absolute;
  top: 14%;
}

/* ---------- Hand zone: the ticker floats over the board ---------- */
.clash-hand-zone {
  position: relative;
  height: 0;
  pointer-events: none;
}
.clash-ticker,
.clash-reward-note {
  position: absolute;
  bottom: 0.6rem;
  left: 50%;
  z-index: 5;
  width: max-content;
  max-width: min(80%, 30rem);
  margin: 0;
  padding: 0.3rem 0.65rem;
  border-radius: 0.5rem;
  background: #06151de8;
  transform: translateX(-50%);
  text-align: center;
  font-size: clamp(0.7rem, 1.6vw, 0.9rem);
  font-weight: 750;
  line-height: 1.3;
  color: #c9e3dc;
}
.clash-ticker:empty {
  display: none;
}
.clash-reward-note {
  bottom: 2.6rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #ffe9a8;
}

/* ---------- Versus console ---------- */
.clash-vs {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.clash-boss {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border-radius: 0.8rem;
  border: 1px solid #76b5a448;
  background: #0d2831ee;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.clash-boss.is-enemy {
  order: 0;
  border-color: #ee819655;
  background: #2e1b2aee;
}
.clash-boss.is-player {
  order: 4;
}
.clash-vs-mid {
  order: 1;
}
.clash-log {
  order: 2;
}
.clash-console {
  order: 5;
}
.clash-portrait {
  position: relative;
  flex: 1 1 auto;
  min-height: 3rem;
  border-radius: 0.8rem 0.8rem 0 0;
  overflow: hidden;
  background: #071115;
}
.clash-portrait :deep(.slime-art) {
  position: absolute;
  inset: 0;
  margin: 0;
}
.clash-portrait :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 25%;
  transition:
    filter 0.3s,
    transform 0.3s;
}
.clash-portrait :deep(.slime-art-fallback) {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 2rem;
}
.clash-boss.mood-hit .clash-portrait :deep(img) {
  filter: sepia(0.5) saturate(2.4) hue-rotate(-30deg) brightness(1.1);
  transform: scale(1.06);
}
.clash-boss.mood-gloat .clash-portrait :deep(img) {
  transform: scale(1.08);
  filter: saturate(1.3) brightness(1.08);
}
.clash-boss.mood-beaten .clash-portrait :deep(img) {
  filter: grayscale(0.85) brightness(0.6);
  transform: scale(0.98) rotate(-2deg);
}
.clash-boss.mood-gloat .clash-portrait {
  animation: clash-gloat 0.7s ease-in-out 2;
}
.clash-quip {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  z-index: 3;
  max-width: 90%;
  padding: 0.3rem 0.7rem;
  border-radius: 1rem;
  border: 2px solid #111;
  background: #fffbe8;
  color: #111;
  font-size: clamp(0.75rem, 1.4cqw, 1rem);
  font-weight: 1000;
  font-style: italic;
  white-space: nowrap;
  transform: translateX(-50%) rotate(-3deg);
  box-shadow: 0 4px 0 #0007;
}
.clash-quip::after {
  content: '';
  position: absolute;
  left: 30%;
  bottom: -0.55rem;
  border: 0.3rem solid transparent;
  border-top: 0.45rem solid #111;
}
.mood-hit .clash-quip {
  background: #ff5f7a;
  color: #fff;
}
.mood-beaten .clash-quip {
  background: #c6c9d2;
}
.clash-quip-enter-active {
  animation: clash-quip-in 0.35s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.clash-quip-leave-active {
  transition: opacity 0.25s;
}
.clash-quip-leave-to {
  opacity: 0;
}
.clash-boss-info {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.35rem 0.55rem 0.45rem;
  min-width: 0;
}
.clash-boss-info small {
  font-size: 0.55rem;
  color: #a3c2b9;
  letter-spacing: 0.09em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.clash-boss-info strong {
  font-size: 0.82rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.clash-health {
  display: block;
  height: 0.4rem;
  width: 100%;
  border-radius: 999px;
  background: #102026;
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
.clash-boss-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.clash-hp {
  font-size: clamp(1.2rem, 2.4cqw, 1.8rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  color: #d7ffe7;
  font-variant-numeric: tabular-nums;
}
.is-enemy .clash-hp {
  color: #ffd6dc;
}
.clash-hp small {
  margin-left: 0.2rem;
  font-size: 0.42em;
  font-style: normal;
  font-weight: 700;
  color: #a3c2b9;
}
.clash-bank {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.55rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  color: #a3c2b9;
}
.clash-bank i {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 0.2rem;
  border: 1px solid #d7ff89;
  background: #d7ff89;
  transform: rotate(45deg);
}
.clash-bank i.used {
  background: transparent;
  opacity: 0.45;
}
.clash-boss.hit {
  border-color: #ff9ea4;
  box-shadow: 0 0 16px #ff6f7a88;
  animation: clash-shake 0.36s ease-in-out;
}
.clash-power {
  margin-top: 0.15rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid #ffd76a99;
  border-radius: 0.55rem;
  background: linear-gradient(110deg, #4a3510, #2a1b08);
  color: #ffe9a8 !important;
  font-size: 0.62rem !important;
  font-weight: 900;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  font-size: 0.62rem;
  font-weight: 850;
  color: #ffd76a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.clash-powers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  min-width: 0;
}
.clash-powers .clash-power {
  flex: 0 1 auto;
  min-width: 0;
}
.clash-power.charged {
  border-color: #fff27a;
  color: #fffbe0 !important;
  background: linear-gradient(110deg, #8a5a08, #3d2604);
  box-shadow:
    0 0 14px #ffd76acc,
    inset 0 0 10px #ffe9a866;
  animation: clash-charge 1.4s ease-in-out infinite;
}
.clash-power-chip.charged:not(.spent) {
  color: #fff27a;
  text-shadow: 0 0 6px #ffd76a;
}
@keyframes clash-charge {
  0%,
  100% {
    box-shadow:
      0 0 10px #ffd76a99,
      inset 0 0 8px #ffe9a844;
  }
  50% {
    box-shadow:
      0 0 20px #ffd76a,
      inset 0 0 12px #ffe9a888;
  }
}
.clash-power-chip.spent {
  opacity: 0.5;
  text-decoration: line-through;
}
.clash-vs-mid {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.2rem;
}
.clash-vs-badge {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    #f6ffcf,
    var(--neon) 55%,
    #5d8f1b
  );
  color: #142016;
  font-weight: 1000;
  font-style: italic;
  font-size: 0.9rem;
  box-shadow: 0 0 14px #b9f15177;
}
.clash-phase {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.clash-phase small {
  font-size: 0.55rem;
  letter-spacing: 0.14em;
  color: #9ad9cb;
}
.clash-phase strong {
  font-size: 0.72rem;
  color: var(--neon);
  line-height: 1.15;
}
.clash-log-toggle,
.clash-exit {
  display: none;
}
.clash-log {
  flex: 1 1 0;
  min-height: 5rem;
  display: flex;
  flex-direction: column;
  border-radius: 0.7rem;
  border: 1px solid #38877a77;
  background: #061418e6;
  overflow: hidden;
}
.clash-log h3 {
  margin: 0;
  padding: 0.3rem 0.55rem;
  font-size: 0.55rem;
  letter-spacing: 0.16em;
  color: #9ad9cb;
  border-bottom: 1px solid #38877a44;
}
.clash-log ol {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.3rem 0.5rem 0.5rem;
  list-style: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.clash-log li {
  font-size: 0.68rem;
  line-height: 1.3;
  color: #c9e3dc;
  padding-left: 0.4rem;
  border-left: 2px solid #38877a77;
}
.clash-log li small {
  display: block;
  margin: 0.25rem 0 0.1rem -0.4rem;
  font-size: 0.52rem;
  letter-spacing: 0.14em;
  color: var(--neon);
}
.clash-log li.is-death {
  border-color: #ff6f7a;
  color: #ffc9cf;
}
.clash-log li.is-boss {
  border-color: #ffd34d;
  color: #ffe9a8;
}
.clash-log li.is-trap {
  border-color: #6fc8ff;
}
.clash-log li.is-play {
  border-color: #b9f151aa;
}
.clash-log li.is-empty {
  border: 0;
  color: #7f9c95;
}
.clash-console {
  flex: none;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas: 'hand main';
  align-items: center;
  gap: 0.35rem 0.5rem;
  padding: 0.45rem 0.5rem 0.4rem;
  border-radius: 0.8rem;
  border: 1px solid #76b5a448;
  background: #0b1f24f0;
}
.clash-hand-dock {
  grid-area: hand;
  display: flex;
  padding-bottom: 0.7rem;
}
.clash-console-main {
  grid-area: main;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.clash-console-row {
  display: flex;
  gap: 0.35rem;
}
.clash-log-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.4rem;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid #38877a44;
}
.clash-log-meta .clash-new-match {
  padding: 0.2rem 0.5rem;
  border: 1px solid #5c99917a;
  border-radius: 999px;
  background: #10231f;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.clash-reset,
.clash-pass {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem 0.55rem;
  border: 1px solid #5c99917a;
  border-radius: 0.55rem;
  background: #19332f;
  font-size: 0.7rem;
  font-weight: 900;
  white-space: nowrap;
}
.clash-pass {
  flex: 1.3;
  border-color: var(--neon);
  background: var(--neon);
  color: #142016 !important;
  letter-spacing: 0.06em;
}
.clash-pass.ready {
  animation: clash-charge 1.4s ease-in-out infinite;
}
.clash-pass:disabled {
  background: #19332f;
  color: var(--ink) !important;
  border-color: #5c99917a;
}
.clash-reset:hover,
.clash-pass:hover:not(:disabled) {
  border-color: #fff;
}
.clash-back {
  border-color: var(--neon);
  color: #e9ffd0;
}
.clash-undo {
  flex: 0.8;
}
.clash-format {
  display: flex;
  flex: none;
  overflow: hidden;
  border: 1px solid #5c99917a;
  border-radius: 0.55rem;
}
.clash-format button {
  padding: 0.3rem 0.5rem;
  border: 0;
  background: #10231f;
  font-size: 0.58rem;
  font-weight: 850;
  letter-spacing: 0.06em;
}
.clash-format button[aria-pressed='true'] {
  background: #b9f15126;
  color: #e9ffd0;
}
.clash-kind {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  border: 1px solid #5c99917a;
  color: #b8e3d8;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.08em;
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

/* ---------- Narrow or tall: rival strip on top, your console below ---------- */
@container clash (max-width: 46rem) or (max-aspect-ratio: 1 / 1) {
  .clash-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas:
      'rival rival'
      'mid mid'
      'stage stage'
      'me console';
    gap: 0.25rem;
    padding: 0.25rem;
  }
  .clash-vs {
    display: contents;
  }
  .clash-boss.is-enemy {
    grid-area: rival;
  }
  .clash-vs-mid {
    grid-area: mid;
  }
  .clash-stage {
    grid-area: stage;
    min-height: 0;
  }
  .clash-boss.is-player {
    grid-area: me;
  }
  .clash-console {
    grid-area: console;
  }
  .clash-boss {
    flex: none;
    flex-direction: row;
    align-items: stretch;
    min-height: clamp(3.4rem, 9cqh, 5rem);
  }
  .clash-portrait {
    flex: 0 0 clamp(3.4rem, 9cqh, 5rem);
    min-height: 0;
    border-radius: 0.8rem 0 0 0.8rem;
  }
  .clash-power {
    margin-top: 0;
    padding: 0.3rem 0.45rem;
    font-size: 0.62rem !important;
  }
  .clash-boss-info {
    flex: 1;
    justify-content: center;
    padding: 0.2rem 0.5rem;
  }
  .clash-boss-info > small {
    display: none;
  }
  .clash-hp {
    font-size: 1.15rem;
  }
  .clash-quip {
    top: auto;
    bottom: -0.2rem;
    left: 100%;
    transform: translateX(0.4rem) rotate(-3deg);
    font-size: 0.72rem;
  }
  .clash-quip::after {
    display: none;
  }
  .clash-vs-mid {
    padding: 0 0.15rem;
  }
  .clash-vs-badge {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 0.65rem;
  }
  .clash-phase {
    flex-direction: row;
    align-items: baseline;
    gap: 0.45rem;
  }
  .clash-log-toggle {
    display: block;
    padding: 0.25rem 0.55rem;
    border: 1px solid #5c99917a;
    border-radius: 0.45rem;
    background: #10231f;
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 0.1em;
  }
  .clash-log-toggle[aria-expanded='true'] {
    border-color: var(--neon);
    color: var(--neon);
  }
  .clash-log {
    display: none;
    position: absolute;
    top: calc(clamp(3.4rem, 9cqh, 5rem) + 2.4rem);
    right: 0.4rem;
    z-index: 12;
    width: min(22rem, calc(100% - 0.8rem));
    height: 45cqh;
    box-shadow: 0 12px 30px #000c;
  }
  .log-open .clash-log {
    display: flex;
  }
  .clash-console {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.45rem;
  }
  .clash-console-row .clash-reset,
  .clash-console-row .clash-pass {
    flex: none;
    padding: 0.5rem 0.75rem;
  }
  .clash-console-row .clash-pass {
    min-width: 5.5rem;
  }
}
@container clash (max-width: 30rem) {
  .clash-lane-numbers span {
    font-size: 0.48rem;
  }
  .clash-phase small {
    display: none;
  }
}

/*
  Silas, 2026-11-11 PT, on an iPhone: "If we are in battle mode, the battle
  mat should be the majority of that screen ... the cards should start at the
  very screen bottom, and replace most of the versus section. We need that
  info much larger." Narrow or tall: a slim rival strip, a slim round line,
  the board, one slim strip for your boss and controls, and the hand fanned
  up from the bottom edge in its own row (the hand overlay spans the layout).
*/
@container clash (max-width: 46rem) or (max-aspect-ratio: 1 / 1) {
  .clash-layout {
    --hand-h: calc(min(15rem, 44cqw, 42cqh) * 0.69 + 0.2rem);
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto minmax(0, 1fr) auto var(--hand-h);
    grid-template-areas:
      'rival rival'
      'mid mid'
      'stage stage'
      'me console'
      'hand hand';
    gap: 0.25rem;
    padding: 0.25rem 0.25rem 0;
  }
  .clash-stage {
    display: contents;
  }
  .clash-board {
    grid-area: stage;
  }
  .clash-hand-zone {
    grid-area: stage;
    align-self: end;
    z-index: 5;
  }
  .clash-reward-note {
    bottom: 0.4rem;
    max-width: 94%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.6rem;
  }
  .clash-ticker {
    bottom: 2rem;
    font-size: 0.65rem;
  }
  .clash-boss {
    min-height: 0;
    border-radius: 0.6rem;
  }
  .clash-portrait {
    flex: 0 0 2.9rem;
    border-radius: 0.6rem 0 0 0.6rem;
  }
  .clash-boss-info {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'name line'
      'bar powers';
    align-items: center;
    gap: 0.15rem 0.45rem;
    padding: 0.2rem 0.45rem;
  }
  .clash-boss-info strong {
    grid-area: name;
    font-size: 0.7rem;
  }
  .clash-health {
    grid-area: bar;
    height: 0.35rem;
  }
  .clash-boss-line {
    grid-area: line;
    gap: 0.4rem;
  }
  .clash-hp {
    font-size: 1.05rem;
  }
  .clash-bank {
    font-size: 0;
    gap: 0.2rem;
  }
  .clash-bank i {
    width: 0.55rem;
    height: 0.55rem;
  }
  .clash-powers {
    grid-area: powers;
    flex-wrap: nowrap;
    gap: 0.25rem;
  }
  .clash-power-name {
    display: none;
  }
  .clash-power,
  .clash-power-chip {
    display: grid;
    place-items: center;
    min-width: 1.7rem;
    height: 1.5rem;
    margin: 0;
    padding: 0 0.3rem;
    font-size: 0.85rem !important;
  }
  .clash-power-chip {
    border: 1px solid #ffd76a55;
    border-radius: 0.45rem;
  }
  .clash-vs-mid {
    gap: 0.4rem;
    min-height: 1.6rem;
  }
  .clash-vs-badge {
    display: none;
  }
  .clash-exit {
    display: grid;
    place-items: center;
    flex: none;
    width: 1.8rem;
    height: 1.6rem;
    padding: 0;
    border: 1px solid #5c99917a;
    border-radius: 0.45rem;
    background: #10231f;
    font-size: 1.1rem;
    font-weight: 900;
    line-height: 1;
  }
  .clash-phase small {
    font-size: 0.5rem;
  }
  .clash-phase strong {
    font-size: 0.66rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .clash .clash-log-toggle {
    padding: 0.25rem 0.55rem;
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 0.1em;
  }
  .clash .clash-exit {
    font-size: 1.1rem;
  }
  .clash-log {
    top: 4.6rem;
  }
  .clash-boss.is-player .clash-boss-info strong {
    display: none;
  }
  .clash-boss.is-player .clash-boss-info {
    grid-template-areas:
      'line line'
      'bar powers';
  }
  .clash-console {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.3rem;
    padding: 0.2rem 0.3rem;
    border-radius: 0.6rem;
  }
  .clash-hand-dock {
    padding: 0;
  }
  .clash-stage :deep(.cxh) {
    z-index: 20;
  }
  .clash-hand-dock :deep(.cxh-toggle) {
    width: 2.5rem;
    height: 2.5rem;
  }
  .clash-console-row .clash-reset,
  .clash-console-row .clash-pass {
    padding: 0.45rem 0.6rem;
  }
  .clash-undo-word {
    display: none;
  }
  .clash-console-row .clash-pass {
    min-width: 4.8rem;
  }
}

/* ---------- Strike sweep ---------- */
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
.clash-slot.hit:not(.lunge) {
  animation: clash-shake 0.36s ease-in-out;
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
  top: 40%;
  font-size: clamp(1.6rem, 3cqw, 2.6rem);
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
@keyframes clash-stat-pop {
  from {
    transform: scale(1.5);
  }
}
@keyframes clash-heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.12);
  }
}
@keyframes clash-gloat {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4%);
  }
}
@keyframes clash-quip-in {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.4) rotate(-12deg);
  }
}

/* ---------- Choose-one level three ---------- */
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

@media (prefers-reduced-motion: reduce) {
  .clash-slot,
  .clash-health i,
  .clash-portrait :deep(img) {
    transition: none;
  }
  .clash-slot.lunge,
  .clash-slot.hit,
  .clash-boss.hit,
  .clash-boss .clash-portrait,
  .clash-stat,
  .clash-power.charged,
  .clash-stat.is-life.low path,
  .clash-quip-enter-active {
    animation: none;
  }
  .clash-float {
    animation-duration: 0.5s;
  }
}
</style>
