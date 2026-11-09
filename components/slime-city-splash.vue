<template>
  <section
    class="scs kr-scroll"
    :class="{ leaving }"
    :style="{ '--crew': crewTone(picked.color) }"
    aria-labelledby="slime-splash-title"
    data-testid="slime-city-splash"
  >
    <header-page-bar console-theme="slime-city">
      <div class="scs-bar">
        <span class="scs-bar-mark">SLIME<span>CITY</span></span>
        <span class="scs-bar-note">TITLE SCREEN</span>
      </div>
    </header-page-bar>

    <div class="scs-sky" aria-hidden="true">
      <div class="scs-moon"></div>
      <div class="scs-skyline scs-skyline-back"></div>
      <div class="scs-skyline scs-skyline-front"></div>
      <div class="scs-pool"></div>
      <span
        v-for="bubble in BUBBLES"
        :key="bubble.id"
        class="scs-bubble"
        :style="bubble.style"
      ></span>
    </div>

    <div class="scs-content">
      <p class="scs-overline">KIND ROBOTS ARCADE · TACTICAL CARD BATTLER</p>
      <h1 id="slime-splash-title" class="scs-title">
        <span
          v-for="(letter, i) in TITLE"
          :key="i"
          class="scs-letter"
          :class="{ gap: letter === ' ' }"
          :style="{ animationDelay: 0.08 + i * 0.05 + 's' }"
          >{{ letter }}</span
        >
      </h1>
      <p class="scs-tagline">
        Six rival crews. Seven districts. One radioactive megacity.
      </p>

      <div class="scs-roster-head">
        <h2>Choose your crew</h2>
        <span>You can switch any time.</span>
      </div>
      <div
        class="scs-roster"
        role="group"
        aria-label="Choose your crew"
        data-testid="slime-splash-crews"
      >
        <button
          v-for="team in lab.teams"
          :key="team.id"
          type="button"
          class="scs-crew"
          :class="{ chosen: picked.id === team.id }"
          :style="{ '--tone': crewTone(team.color) }"
          :aria-pressed="picked.id === team.id"
          :data-testid="'slime-splash-crew-' + team.id"
          @click="pickedId = team.id"
        >
          <span class="scs-crew-emblem">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', team.id)"
              :alt="team.name + ' crew emblem'"
              :fallback="team.insignia"
              compact
            />
          </span>
          <span class="scs-crew-text">
            <strong>{{ team.name }}</strong>
            <small>{{ team.motto }}</small>
          </span>
        </button>
      </div>

      <article
        class="scs-dossier"
        aria-live="polite"
        data-testid="slime-splash-dossier"
      >
        <span class="scs-dossier-turf">
          {{ picked.insignia }} HOME TURF · {{ picked.district }}
        </span>
        <p>{{ picked.hook }}</p>
      </article>

      <nav class="scs-actions" aria-label="Start playing">
        <button
          type="button"
          class="scs-go primary"
          :disabled="leaving"
          data-testid="slime-splash-battle"
          @click="enter('clash')"
        >
          <strong>Quick battle</strong>
          <small>Jump into a card fight</small>
        </button>
        <button
          type="button"
          class="scs-go"
          :disabled="leaving"
          data-testid="slime-splash-city"
          @click="enter('city')"
        >
          <strong>Explore the city</strong>
          <small>Walk the seven districts</small>
        </button>
        <button
          type="button"
          class="scs-go"
          :disabled="leaving"
          data-testid="slime-splash-story"
          @click="enter('campaign')"
        >
          <strong>Crew story</strong>
          <small>Five rivals, one chapter at a time</small>
        </button>
      </nav>

      <ol class="scs-how" aria-label="How Slime City plays">
        <li>
          <b>01</b>
          <span>Draw five cards and deploy creatures onto the board.</span>
        </li>
        <li>
          <b>02</b>
          <span>Bank mana, outmaneuver, and capture the enemy flag.</span>
        </li>
        <li>
          <b>03</b>
          <span>Your story choices change the fights that follow.</span>
        </li>
      </ol>

      <p class="scs-footnote">
        Free in your browser. A playable work in progress: some card art and
        saved progression are still being built.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import type { Team } from '~/utils/slimeCity/prototypes'

type Destination = 'clash' | 'city' | 'campaign'

const emit = defineEmits<{ enter: [] }>()

const lab = useSlimeCityStore()

const TITLE = 'SLIME CITY'.split('')

const TONES: Record<Team['color'], string> = {
  red: '#fe6657',
  blue: '#6fc8ff',
  purple: '#d38cff',
  green: '#c7fa62',
  gold: '#f7c968',
}

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  style: {
    left: ((i * 37 + 11) % 96) + 2 + '%',
    width: 0.35 + ((i * 7) % 5) * 0.18 + 'rem',
    height: 0.35 + ((i * 7) % 5) * 0.18 + 'rem',
    animationDelay: -((i * 1.7) % 9) + 's',
    animationDuration: 7 + ((i * 3) % 6) + 's',
  },
}))

const pickedId = ref(lab.activeTeam)
const picked = computed(
  () => lab.teams.find((team) => team.id === pickedId.value) ?? lab.team,
)
const leaving = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function crewTone(color: Team['color']): string {
  return TONES[color] ?? '#c5ff59'
}

function enter(destination: Destination): void {
  if (leaving.value) return
  if (pickedId.value !== lab.activeTeam) lab.chooseTeam(pickedId.value)
  if (destination === 'city') lab.showCityMap()
  else if (destination === 'campaign') lab.showCampaign()
  else lab.view = 'clash'
  leaving.value = true
  timer = setTimeout(() => emit('enter'), 260)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.scs {
  position: relative;
  isolation: isolate;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  color: #f7f2e8;
  background: radial-gradient(
    ellipse at 65% 0%,
    #29314c 0%,
    #101724 48%,
    #0a0e16 80%
  );
  font-family: system-ui, sans-serif;
  container: slime-splash / inline-size;
  transition:
    opacity 0.26s ease,
    transform 0.26s ease;
}
.scs.leaving {
  opacity: 0;
  transform: scale(1.03);
}

.scs-bar {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding-inline: 0.5rem;
}
.scs-bar-mark {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  font-weight: 1000;
  font-style: italic;
  letter-spacing: -0.06em;
  color: #f7f2e8;
}
.scs-bar-mark span {
  margin-left: 0.2em;
  color: #c5ff59;
}
.scs-bar-note {
  color: #a6aac0;
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.2em;
}

.scs-sky {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.scs-moon {
  position: absolute;
  right: 12%;
  top: 6%;
  width: clamp(5rem, 14vw, 10rem);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #feee9e, #d796b5 65%, #ff5381);
  box-shadow: 0 0 5rem #dc43917a;
  opacity: 0.75;
}
.scs-skyline {
  position: absolute;
  inset: 0;
  clip-path: polygon(
    0 62%,
    6% 62%,
    6% 44%,
    12% 44%,
    12% 56%,
    19% 56%,
    19% 36%,
    26% 36%,
    26% 52%,
    34% 52%,
    34% 47%,
    41% 47%,
    41% 55%,
    50% 55%,
    50% 32%,
    57% 32%,
    57% 51%,
    63% 51%,
    63% 41%,
    70% 41%,
    70% 58%,
    77% 58%,
    77% 38%,
    84% 38%,
    84% 54%,
    91% 54%,
    91% 47%,
    100% 47%,
    100% 100%,
    0 100%
  );
}
.scs-skyline-back {
  top: 18%;
  background:
    repeating-linear-gradient(90deg, transparent 0 12px, #e2d88618 13px 16px),
    linear-gradient(#533a60, #182635);
  filter: drop-shadow(0 -7px 10px #fc658560);
  opacity: 0.85;
}
.scs-skyline-front {
  top: 34%;
  background:
    repeating-linear-gradient(
      90deg,
      #182d33 0 7px,
      #668075 8px 9px,
      #16242f 12px 20px
    ),
    linear-gradient(#192534, #0b1820);
  transform: scaleX(-1);
  opacity: 0.9;
}
.scs-pool {
  position: absolute;
  inset: auto -10% -6rem;
  height: 12rem;
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    #c5ff59cc,
    #5fae2f66 35%,
    transparent 70%
  );
  filter: blur(6px);
  animation: scs-pulse 5s ease-in-out infinite;
}
.scs-bubble {
  position: absolute;
  bottom: -1rem;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #f4ffd5, #c5ff59 55%, #6fb72e);
  box-shadow: 0 0 10px #c5ff59aa;
  opacity: 0;
  animation: scs-rise linear infinite;
}

.scs-content {
  position: relative;
  box-sizing: border-box;
  width: min(100%, 62rem);
  margin-inline: auto;
  padding: clamp(1.25rem, 4vh, 3rem) 1rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
.scs-overline {
  margin: 0;
  color: #a6aac0;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.24em;
}
.scs-title {
  margin: 0;
  font-size: clamp(3rem, 12vw, 7.5rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 0.9;
  letter-spacing: -0.06em;
  color: #c5ff59;
  text-shadow:
    0 0.06em 0 #4f8a1c,
    0 0 0.4em #c5ff5966,
    0 0 1.2em #ff538144;
}
.scs-letter {
  display: inline-block;
  position: relative;
  animation: scs-drop 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
.scs-letter.gap {
  width: 0.28em;
}
.scs-letter:nth-child(3n + 1)::after,
.scs-letter:nth-child(4n + 2)::after {
  content: '';
  position: absolute;
  left: 42%;
  top: 86%;
  width: 0.09em;
  height: 0.22em;
  border-radius: 0 0 999px 999px;
  background: #c5ff59;
  box-shadow: 0 0 6px #c5ff59aa;
  transform-origin: top;
  animation: scs-drip 3.6s ease-in infinite;
  animation-delay: inherit;
}
.scs-letter.gap::after {
  display: none;
}
.scs-tagline {
  margin: 0;
  max-width: 34rem;
  color: #e7ecf3;
  font-size: clamp(0.95rem, 2.2vw, 1.2rem);
  font-weight: 650;
}

.scs-roster-head {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem 0.75rem;
}
.scs-roster-head h2 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f7f2e8;
}
.scs-roster-head span {
  color: #a6aac0;
  font-size: 0.75rem;
}
.scs-roster {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.scs-crew {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem;
  border: 1px solid #4d5567;
  border-radius: 0.8rem;
  background: #0e1420d9;
  color: #eef2f8;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s,
    background 0.15s;
}
.scs-crew:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--tone) 60%, #4d5567);
}
.scs-crew:focus-visible,
.scs-go:focus-visible {
  outline: 2px solid #c5ff59;
  outline-offset: 2px;
}
.scs-crew.chosen {
  border-color: var(--tone);
  background: color-mix(in srgb, var(--tone) 14%, #0e1420);
  box-shadow: 0 0 18px color-mix(in srgb, var(--tone) 45%, transparent);
}
.scs-crew-emblem {
  flex: none;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
  border-radius: 0.55rem;
  border: 2px solid color-mix(in srgb, var(--tone) 70%, transparent);
  background: radial-gradient(#ffffff44, transparent 70%), var(--tone);
}
.scs-crew-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.scs-crew-text strong {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.15;
}
.scs-crew-text small {
  color: color-mix(in srgb, var(--tone) 70%, #eef2f8);
  font-size: 0.72rem;
  font-style: italic;
}

.scs-dossier {
  box-sizing: border-box;
  width: 100%;
  max-width: 44rem;
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--crew);
  border-radius: 0.6rem;
  background: #0b111cd9;
  text-align: left;
}
.scs-dossier-turf {
  color: var(--crew);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.18em;
}
.scs-dossier p {
  margin: 0.3rem 0 0;
  color: #dfe5ee;
  font-size: 0.9rem;
  line-height: 1.45;
}

.scs-actions {
  width: 100%;
  max-width: 44rem;
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 0.6rem;
}
.scs-go {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.8rem 0.6rem;
  border: 1px solid #c5ff5966;
  border-radius: 0.8rem;
  background: #0e1420e6;
  color: #eef2f8;
  cursor: pointer;
  transition:
    transform 0.15s,
    background 0.15s,
    box-shadow 0.15s;
}
.scs-go:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #172133;
}
.scs-go strong {
  font-size: 0.95rem;
  font-weight: 950;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.scs-go small {
  color: #a6aac0;
  font-size: 0.7rem;
}
.scs-go.primary {
  border-color: #c5ff59;
  background: #c5ff59;
  color: #142016;
  box-shadow: 0 0 24px #c5ff5955;
}
.scs-go.primary small {
  color: #2c4a1a;
}
.scs-go.primary:hover:not(:disabled) {
  background: #d6ff86;
  box-shadow: 0 0 34px #c5ff5988;
}
.scs-go:disabled {
  cursor: default;
}

.scs-how {
  box-sizing: border-box;
  width: 100%;
  max-width: 44rem;
  margin: 0.5rem 0 0;
  padding: 0.75rem 1rem;
  border-radius: 0.8rem;
  background: #0b111cd9;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.scs-how li {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  text-align: left;
  color: #c7cfdb;
  font-size: 0.78rem;
  line-height: 1.35;
}
.scs-how b {
  flex: none;
  color: #c5ff59;
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.08em;
}
.scs-footnote {
  margin: 0.25rem 0 0;
  max-width: 36rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: #0b111cb3;
  color: #a6aec0;
  font-size: 0.72rem;
}

@container slime-splash (max-width: 44rem) {
  .scs-roster {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .scs-actions,
  .scs-how {
    grid-template-columns: 1fr;
  }
  .scs-crew-emblem {
    width: 2.4rem;
    height: 2.4rem;
  }
  .scs-moon {
    right: -1.5rem;
    top: 0.5rem;
    width: 4.5rem;
    opacity: 0.55;
  }
}
@container slime-splash (max-width: 26rem) {
  .scs-roster {
    grid-template-columns: 1fr;
  }
}

@keyframes scs-drop {
  from {
    opacity: 0;
    transform: translateY(-0.6em) scaleY(1.2);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes scs-drip {
  0%,
  55% {
    transform: scaleY(0.2);
    opacity: 0.9;
  }
  85% {
    transform: scaleY(1.6);
    opacity: 1;
  }
  100% {
    transform: scaleY(1.6) translateY(0.2em);
    opacity: 0;
  }
}
@keyframes scs-rise {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-70vh) translateX(1rem);
    opacity: 0;
  }
}
@keyframes scs-pulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scs,
  .scs-letter,
  .scs-letter::after,
  .scs-pool,
  .scs-crew,
  .scs-go {
    animation: none !important;
    transition: none !important;
  }
  .scs-bubble {
    display: none;
  }
}
</style>
