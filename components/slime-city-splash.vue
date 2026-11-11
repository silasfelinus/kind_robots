<template>
  <section
    class="scs"
    :class="{ leaving }"
    :style="{ '--crew': crewTone(picked.color) }"
    aria-labelledby="slime-splash-title"
    data-testid="slime-city-splash"
  >
    <div class="scs-sky" aria-hidden="true">
      <SlimeCityArtwork
        :key="'sky-' + picked.id"
        class="scs-backdrop"
        :image-id="slimeArtId('ui', 'title-splash')"
        :fallback-image-id="slimeArtId('districts', homeDistrict)"
        :alt="picked.district + ' skyline'"
        compact
        data-testid="slime-splash-backdrop"
      />
      <div class="scs-shade"></div>
      <div class="scs-pool"></div>
      <span
        v-for="bubble in BUBBLES"
        :key="bubble.id"
        class="scs-bubble"
        :style="bubble.style"
      ></span>
    </div>

    <div class="scs-content">
      <header class="scs-head">
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
          Six rival crews. Seven districts. One radioactive megacity, and the
          currency is meat.
        </p>
        <button
          type="button"
          class="scs-settings"
          aria-label="Settings"
          title="Settings"
          data-testid="slime-splash-settings"
          @click="go(() => (lab.view = 'settings'))"
        >
          <icon name="kind-icon:settings" class="h-6 w-6" />
        </button>
      </header>

      <section class="scs-crew-pane" aria-labelledby="slime-splash-crew-head">
        <article
          class="scs-poster"
          aria-live="polite"
          data-testid="slime-splash-dossier"
        >
          <SlimeCityArtwork
            :key="picked.id"
            class="scs-poster-art"
            :image-id="slimeArtId('crews', picked.id)"
            :alt="picked.name + ' crew poster'"
            :fallback="picked.insignia"
            compact
          />
          <div class="scs-poster-copy">
            <span class="scs-poster-turf"
              >{{ picked.insignia }} HOME TURF · {{ picked.district }}</span
            >
            <strong>{{ picked.name }}</strong>
            <em>{{ picked.motto }}</em>
            <p>{{ picked.hook }}</p>
          </div>
        </article>
        <div class="scs-roster-head">
          <h2 id="slime-splash-crew-head">Choose your crew</h2>
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
            :title="team.name + ': ' + team.motto"
            :aria-label="team.name + '. ' + team.motto"
            :aria-pressed="picked.id === team.id"
            :data-testid="'slime-splash-crew-' + team.id"
            @click="pickedId = team.id"
          >
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', team.id)"
              :alt="team.name + ' crew emblem'"
              :fallback="team.insignia"
              compact
            />
          </button>
        </div>
      </section>

      <nav class="scs-modes" aria-label="Play Slime City">
        <button
          type="button"
          class="scs-tile primary"
          :disabled="leaving"
          data-testid="slime-splash-battle"
          @click="enter(modes[0]!.id)"
        >
          <SlimeCityArtwork
            class="scs-tile-art"
            :image-id="modes[0]!.art"
            :fallback-image-id="slimeArtId('crews', picked.id)"
            :alt="modes[0]!.title"
            compact
          />
          <icon :name="modes[0]!.icon" class="scs-tile-icon" />
          <strong>{{ modes[0]!.title }}</strong>
        </button>
        <button
          type="button"
          class="scs-tile"
          :disabled="leaving"
          data-testid="slime-splash-journey"
          @click="enter(modes[1]!.id)"
        >
          <SlimeCityArtwork
            class="scs-tile-art"
            :image-id="modes[1]!.art"
            :fallback-image-id="slimeArtId('crews', picked.id)"
            :alt="modes[1]!.title"
            compact
          />
          <icon :name="modes[1]!.icon" class="scs-tile-icon" />
          <strong>{{ modes[1]!.title }}</strong>
        </button>
        <button
          type="button"
          class="scs-tile"
          :disabled="leaving"
          data-testid="slime-splash-tower"
          @click="enter(modes[2]!.id)"
        >
          <SlimeCityArtwork
            class="scs-tile-art"
            :image-id="modes[2]!.art"
            :fallback-image-id="slimeArtId('crews', picked.id)"
            :alt="modes[2]!.title"
            compact
          />
          <icon :name="modes[2]!.icon" class="scs-tile-icon" />
          <strong>{{ modes[2]!.title }}</strong>
        </button>
        <button
          type="button"
          class="scs-tile"
          :disabled="leaving"
          data-testid="slime-splash-decks"
          @click="enter(modes[3]!.id)"
        >
          <SlimeCityArtwork
            class="scs-tile-art"
            :image-id="modes[3]!.art"
            :fallback-image-id="slimeArtId('crews', picked.id)"
            :alt="modes[3]!.title"
            compact
          />
          <icon :name="modes[3]!.icon" class="scs-tile-icon" />
          <strong>{{ modes[3]!.title }}</strong>
        </button>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { CAMPAIGN_DISTRICTS } from '~/utils/slimeCity/city'
import type { Team } from '~/utils/slimeCity/prototypes'

type Destination = 'clash' | 'campaign' | 'tower' | 'collection'

const lab = useSlimeCityStore()

const TITLE = 'SLIME CITY'.split('')

const TONES: Record<Team['color'], string> = {
  red: '#fe6657',
  blue: '#6fc8ff',
  purple: '#d38cff',
  green: '#c7fa62',
  gold: '#f7c968',
}

const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
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
const homeDistrict = computed(() => CAMPAIGN_DISTRICTS[picked.value.id])

/**
 * Silas, 2026-11-10 PT: "It's confusing to have no parity between top of the
 * dashboard and the bottom buttons. Simple!" The title screen's tiles are the
 * game's tabs, in tab order, named exactly as the tabs are.
 */
const modes = computed<
  { id: Destination; title: string; icon: string; art: number | null }[]
>(() => [
  {
    id: 'clash',
    title: 'VS',
    icon: 'kind-icon:lightning',
    art: slimeArtId('boards', 'pitworks-blackout'),
  },
  {
    id: 'campaign',
    title: 'Journey',
    icon: 'kind-icon:story',
    art:
      slimeArtId('story', picked.value.id + '/opening') ??
      slimeArtId('story', picked.value.id + '/1/scene'),
  },
  {
    id: 'tower',
    title: 'Tower',
    icon: 'kind-icon:castle',
    art: slimeArtId('districts', 'crown'),
  },
  {
    id: 'collection',
    title: 'Collection',
    icon: 'kind-icon:cards',
    art: slimeArtId('ui', 'card-back'),
  },
])

const leaving = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function crewTone(color: Team['color']): string {
  return TONES[color] ?? '#c5ff59'
}

/** Leave the title screen: keep the chosen crew, play the exit, then go. */
function go(open: () => void): void {
  if (leaving.value) return
  if (pickedId.value !== lab.activeTeam) lab.chooseTeam(pickedId.value)
  leaving.value = true
  timer = setTimeout(open, 260)
}
function enter(destination: Destination): void {
  go(() => {
    if (destination === 'campaign') lab.showCampaign()
    else if (destination === 'tower') lab.showTower()
    else if (destination === 'collection') lab.showCards()
    else lab.showVs()
  })
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.scs {
  position: relative;
  isolation: isolate;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #f7f2e8;
  background: #0a0e16;
  font-family: system-ui, sans-serif;
  container: slime-splash / size;
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
.scs-backdrop {
  position: absolute;
  inset: 0;
  margin: 0;
  animation: scs-drift 26s ease-in-out infinite alternate;
}
.scs-backdrop :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scs-backdrop :deep(.slime-art-fallback) {
  display: none;
}
.scs-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, #070b12f2 0%, #070b12c0 45%, #070b1266 100%),
    linear-gradient(#070b1200 55%, #070b12e6 100%);
}
.scs-pool {
  position: absolute;
  inset: auto -10% -7rem;
  height: 11rem;
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    #c5ff5999,
    #5fae2f4d 35%,
    transparent 70%
  );
  filter: blur(8px);
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
  box-sizing: border-box;
  height: 100%;
  width: min(100%, 78rem);
  margin-inline: auto;
  padding: clamp(0.6rem, 3cqh, 2rem) clamp(0.75rem, 3cqw, 2rem);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'head crew'
    'modes modes';
  gap: clamp(0.5rem, 2cqh, 1.25rem) clamp(0.75rem, 3cqw, 2.5rem);
}

.scs-head {
  position: relative;
  grid-area: head;
  display: flex;
  flex-direction: column;
  gap: clamp(0.25rem, 1cqh, 0.6rem);
  min-width: 0;
}
.scs-overline {
  margin: 0;
  color: #b9bed2;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.24em;
}
.scs-title {
  margin: 0;
  font-size: clamp(2.4rem, min(9cqw, 15cqh), 8rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 0.9;
  letter-spacing: -0.06em;
  white-space: nowrap;
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
  font-size: clamp(0.9rem, 2.4cqh, 1.2rem);
  font-weight: 650;
  text-shadow: 0 1px 6px #000;
}

.scs-crew-pane {
  grid-area: crew;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(0.35rem, 1.2cqh, 0.7rem);
}
.scs-poster {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border-radius: 1.1rem;
  border: 2px solid var(--crew);
  background: #0b111c;
  box-shadow:
    0 0 30px color-mix(in srgb, var(--crew) 40%, transparent),
    0 18px 40px #000b;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.scs-poster-art {
  position: absolute;
  inset: 0;
  margin: 0;
  animation: scs-poster-in 0.45s ease both;
}
.scs-poster-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scs-poster-art :deep(.slime-art-fallback) {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 4rem;
  color: var(--crew);
}
.scs-poster-copy {
  position: absolute;
  inset: auto 0 0;
  padding: 2.5rem 1rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  background: linear-gradient(transparent, #050910f2 45%);
  text-align: left;
}
.scs-poster-turf {
  color: var(--crew);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.18em;
}
.scs-poster-copy strong {
  font-size: clamp(1rem, 3cqh, 1.45rem);
  font-weight: 950;
  letter-spacing: 0.03em;
  line-height: 1.05;
}
.scs-poster-copy em {
  color: color-mix(in srgb, var(--crew) 70%, #fff);
  font-size: 0.85rem;
}
.scs-poster-copy p {
  margin: 0.2rem 0 0;
  color: #dfe5ee;
  font-size: 0.85rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.scs-roster-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.scs-roster-head h2 {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.scs-roster {
  flex: none;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem;
}
.scs-crew {
  aspect-ratio: 1;
  min-width: 0;
  max-height: 5.5rem;
  justify-self: center;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 2px solid #4d5567;
  border-radius: 0.8rem;
  background: var(--tone);
  cursor: pointer;
  filter: saturate(0.6) brightness(0.75);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s,
    filter 0.15s;
}
.scs-crew :deep(.slime-art),
.scs-crew :deep(img) {
  width: 100%;
  height: 100%;
  margin: 0;
  object-fit: cover;
}
.scs-crew:hover {
  transform: translateY(-3px);
  filter: none;
  border-color: color-mix(in srgb, var(--tone) 70%, #4d5567);
}
.scs-crew.chosen {
  filter: none;
  border-color: var(--tone);
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 0 18px color-mix(in srgb, var(--tone) 55%, transparent);
}
.scs-crew:focus-visible {
  outline: 2px solid #c5ff59;
  outline-offset: 2px;
}

.scs-settings {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border: 1px solid #c5ff5955;
  border-radius: 999px;
  background: #0e1420d9;
  color: #e7ecf3;
  cursor: pointer;
}
.scs-settings:hover {
  border-color: #c5ff59;
  color: #c5ff59;
}
.scs-modes {
  grid-area: modes;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(0.4rem, 1.4cqw, 0.9rem);
}
.scs-tile {
  position: relative;
  isolation: isolate;
  aspect-ratio: 5 / 4;
  max-height: 22cqh;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  overflow: hidden;
  padding: 0.5rem;
  border: 2px solid #c5ff5955;
  border-radius: 1rem;
  background: #0e1420;
  color: #f7f2e8;
  cursor: pointer;
  transition:
    transform 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}
.scs-tile-art {
  position: absolute;
  inset: 0;
  z-index: -2;
  margin: 0;
  opacity: 0.6;
  transition:
    opacity 0.2s,
    transform 0.4s;
}
.scs-tile-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scs-tile-art :deep(.slime-art-fallback) {
  display: none;
}
.scs-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(circle at 50% 45%, #070b1288, #070b12e6 75%);
}
.scs-tile-icon {
  width: clamp(1.6rem, 5cqw, 2.8rem);
  height: clamp(1.6rem, 5cqw, 2.8rem);
  color: #c5ff59;
  filter: drop-shadow(0 2px 6px #000);
}
.scs-tile strong {
  font-size: clamp(0.72rem, 1.8cqw, 1.15rem);
  font-weight: 1000;
  font-style: italic;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-shadow: 0 2px 6px #000;
}
.scs-tile:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: #c5ff59;
  box-shadow: 0 0 22px #c5ff5944;
}
.scs-tile:hover:not(:disabled) .scs-tile-art {
  opacity: 0.85;
  transform: scale(1.05);
}
.scs-tile:focus-visible,
.scs-settings:focus-visible {
  outline: 2px solid #c5ff59;
  outline-offset: 2px;
}
.scs-tile.primary {
  border-color: #c5ff59;
  box-shadow: 0 0 24px #c5ff5955;
}
.scs-tile:disabled {
  cursor: default;
}

/* Tall or narrow screens: title, poster, then the five tiles. */
@container slime-splash (max-aspect-ratio: 5 / 4) {
  .scs-content {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas: 'head' 'crew' 'modes';
    text-align: center;
  }
  .scs-head {
    align-items: center;
  }
  .scs-title {
    font-size: clamp(2.2rem, min(13cqw, 10cqh), 7rem);
  }
  .scs-tile {
    max-height: 14cqh;
  }
}
@container slime-splash (max-width: 34rem) {
  .scs-tagline,
  .scs-overline {
    display: none;
  }
  .scs-modes {
    gap: 0.3rem;
  }
  .scs-tile {
    padding: 0.3rem 0.15rem;
    border-radius: 0.7rem;
  }
  .scs-tile strong {
    font-size: 0.58rem;
    letter-spacing: 0.01em;
  }
  .scs-settings {
    width: 2.1rem;
    height: 2.1rem;
  }
}
@container slime-splash (max-height: 34rem) {
  .scs-overline,
  .scs-poster-copy p {
    display: none;
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
    transform: translateY(-70cqh) translateX(1rem);
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
@keyframes scs-drift {
  from {
    transform: scale(1.04) translateX(0);
  }
  to {
    transform: scale(1.1) translateX(-2%);
  }
}
@keyframes scs-poster-in {
  from {
    opacity: 0;
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scs,
  .scs-letter,
  .scs-letter::after,
  .scs-pool,
  .scs-backdrop,
  .scs-poster-art,
  .scs-crew,
  .scs-tile,
  .scs-tile-art {
    animation: none !important;
    transition: none !important;
  }
  .scs-bubble {
    display: none;
  }
}
</style>
