<!--
  REWARD SCREEN. Silas, 2026-11-11 PT: "We need an actual reward screen which
  shows the meat earned after a match. Even losing should earn some, but
  winning is more, with benefits for not taking damage. Notice and comment on
  oddities (no level threes played, fast game, close call, etc)". Shown over
  the board when a Clash ends: the result, each Meat line, what the server
  actually paid (or why nothing was), and a few notes on the match.
-->
<template>
  <div class="smr" role="dialog" aria-modal="false" aria-label="Match rewards">
    <section
      class="smr-card"
      :class="'is-' + outcome"
      data-testid="slime-match-report"
    >
      <header class="smr-head">
        <small>{{ kindLabel }}</small>
        <strong>{{ title }}</strong>
        <span class="smr-score">
          {{ report.bossLeft }}<small>–{{ report.rivalLeft }}</small>
          <em>BOSS LIFE · ROUND {{ report.rounds }}</em>
        </span>
      </header>

      <div class="smr-total" :class="{ pending: !settled, unpaid: !paying }">
        <b data-testid="slime-match-meat">+{{ shownMeat }}</b>
        <span>MEAT</span>
        <small v-if="paidXp">+{{ paidXp }} XP</small>
      </div>
      <p class="smr-status" :class="{ warn: !paying }" aria-live="polite">
        {{ status }}
      </p>

      <ul class="smr-lines" aria-label="Meat earned">
        <li v-for="line in report.meat" :key="line.label">
          <span>{{ line.label }}</span>
          <b>+{{ line.meat }}</b>
        </li>
      </ul>

      <ul v-if="report.notes.length" class="smr-notes" aria-label="Match notes">
        <li v-for="note in report.notes.slice(0, 4)" :key="note">
          {{ note }}
        </li>
      </ul>

      <footer class="smr-actions">
        <button
          type="button"
          class="smr-quiet"
          data-testid="slime-match-report-close"
          @click="emit('close')"
        >
          SEE BOARD
        </button>
        <button
          v-if="canRematch"
          type="button"
          class="smr-quiet"
          data-testid="slime-match-report-rematch"
          :disabled="lab.progressBusy"
          @click="emit('rematch')"
        >
          ↻ {{ rewarded ? 'PLAY AGAIN' : 'REMATCH' }}
        </button>
        <button
          type="button"
          class="smr-go"
          data-testid="slime-match-report-back"
          @click="emit('back')"
        >
          {{ backLabel }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import type { ClashState } from '~/utils/slimeCity/clash'
import { clashMatchReport, reportMeat } from '~/utils/slimeCity/matchReport'

const props = defineProps<{
  state: ClashState
  kindLabel: string
  backLabel: string
  canRematch: boolean
}>()
const emit = defineEmits<{ close: []; rematch: []; back: [] }>()
const lab = useSlimeCityStore()

const report = computed(() => clashMatchReport(props.state))
const outcome = computed(() =>
  props.state.victor === 'player'
    ? 'win'
    : props.state.victor === 'enemy'
      ? 'loss'
      : 'draw',
)
const title = computed(
  () => ({ win: 'YOU WIN!', loss: 'RIVAL WINS', draw: 'DRAW' })[outcome.value],
)
const rewarded = computed(() => !!lab.clashLaunch.rewardId)
const earned = computed(() => reportMeat(report.value))
/** Settled: the server answered, or there was nothing to settle. */
const settled = computed(
  () => !rewarded.value || !!lab.lastPayout || !!lab.progressError,
)
/** Whether Meat is (or is about to be) paid into the wallet. */
const paying = computed(
  () =>
    rewarded.value &&
    !lab.progressError &&
    !(lab.lastPayout && lab.lastPayout.capped),
)
const shownMeat = computed(() =>
  lab.lastPayout && rewarded.value ? lab.lastPayout.meat : earned.value,
)
const paidXp = computed(() =>
  rewarded.value && lab.lastPayout ? lab.lastPayout.xp : 0,
)
const status = computed(() => {
  if (!rewarded.value)
    return (
      lab.boutUnrewarded ||
      (lab.progressLoaded
        ? 'Practice match: no Meat on the line. This is what it would have paid.'
        : 'Sign in to bank Meat from CPU matches. This is what it would have paid.')
    )
  if (lab.progressError) return 'Not paid: ' + lab.progressError
  if (!lab.lastPayout)
    return 'The server is replaying your match before it pays…'
  if (lab.lastPayout.capped)
    return 'Recorded, but today’s paid bouts are used up. Come back tomorrow.'
  return 'Paid into your wallet. You now hold ' + lab.progress.meat + ' Meat.'
})
</script>

<style scoped>
.smr {
  position: absolute;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  background: radial-gradient(ellipse at 50% 40%, #0a0f16cc, #05080ccc 70%);
  animation: smr-in 0.25s ease-out;
}
@keyframes smr-in {
  from {
    opacity: 0;
  }
}
.smr-card {
  width: min(100%, 26rem);
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border: 2px solid #4d6a5f;
  border-radius: 1rem;
  background: linear-gradient(180deg, #13222a, #0b1218);
  box-shadow: 0 20px 60px #000c;
  color: #eef4ee;
  animation: smr-pop 0.35s cubic-bezier(0.2, 0.9, 0.25, 1.2);
}
@keyframes smr-pop {
  from {
    transform: translateY(1rem) scale(0.94);
  }
}
.smr-card.is-win {
  border-color: #c5ff59;
  box-shadow:
    0 0 40px #c5ff5933,
    0 20px 60px #000c;
}
.smr-card.is-loss {
  border-color: #ff6f7a99;
}
.smr-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 0 0.6rem;
}
.smr-head > small {
  grid-column: 1 / -1;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #a6c7bc;
}
.smr-head > strong {
  font-size: 2rem;
  font-weight: 1000;
  font-style: italic;
  letter-spacing: -0.03em;
  line-height: 1;
}
.is-win .smr-head > strong {
  color: #c5ff59;
  text-shadow: 0 0 18px #c5ff5966;
}
.is-loss .smr-head > strong {
  color: #ffb4bd;
}
.smr-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 1.3rem;
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
}
.smr-score small {
  font-size: 0.8rem;
  color: #ffb4bd;
}
.smr-score em {
  margin-top: 0.15rem;
  font-size: 0.5rem;
  font-style: normal;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #a6c7bc;
}
.smr-total {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  border-radius: 0.8rem;
  background: #1b1410;
  border: 1px solid #ffb27a55;
}
.smr-total b {
  font-size: 3rem;
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  color: #ffb27a;
  text-shadow: 0 0 22px #ff8a3d66;
}
.smr-total span {
  font-size: 0.9rem;
  font-weight: 1000;
  letter-spacing: 0.14em;
  color: #ffd6a1;
}
.smr-total small {
  margin-left: 0.4rem;
  font-size: 0.8rem;
  font-weight: 900;
  color: #c5ff59;
}
.smr-total.pending b {
  animation: smr-pulse 1s ease-in-out infinite alternate;
}
@keyframes smr-pulse {
  to {
    opacity: 0.55;
  }
}
.smr-total.unpaid b {
  color: #8a8f99;
  text-shadow: none;
  text-decoration: line-through;
  text-decoration-thickness: 3px;
}
.smr-status {
  margin: -0.2rem 0 0;
  text-align: center;
  font-size: 0.72rem;
  color: #b9cfc7;
}
.smr-status.warn {
  color: #ffd6a1;
}
.smr-lines,
.smr-notes {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.smr-lines li {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  background: #16262b;
  font-size: 0.78rem;
}
.smr-lines b {
  color: #ffb27a;
  font-weight: 950;
}
.smr-notes li {
  position: relative;
  padding-left: 1.1rem;
  font-size: 0.76rem;
  line-height: 1.35;
  color: #dfe7f2;
}
.smr-notes li::before {
  content: '★';
  position: absolute;
  left: 0;
  color: #c5ff59;
}
.smr-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.smr-actions button {
  flex: 1 1 auto;
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.smr-quiet {
  border: 1px solid #586e68;
  background: #16262b;
  color: #eef4ee;
}
.smr-go {
  border: 0;
  background: linear-gradient(180deg, #d8ff7c, #a6e33c);
  color: #13210a;
}
.smr-actions button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
