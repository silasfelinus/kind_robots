<template>
  <div class="arcade-hall">
    <div class="arcade-hall-backdrop" aria-hidden="true">
      <img
        v-if="backdrop"
        :src="backdrop"
        alt=""
        class="arcade-hall-backdrop-art"
        @error="backdrop = ''"
      />
    </div>

    <section class="arcade-hall-intro">
      <p class="arcade-neon">Kind Robots Arcade</p>
      <p class="arcade-hall-lede">
        Free play, forever. Pick a cabinet, watch its attract mode, press start,
        and put your initials on the board. Every game is an original Kind
        Robots riff on a golden-age favourite, and it plays with a keyboard, a
        gamepad or your thumbs.
      </p>
    </section>

    <ul class="arcade-row" aria-label="Cabinets">
      <li v-for="game in games" :key="game.slug">
        <NuxtLink
          :to="`/play/arcade?game=${game.slug}`"
          class="arcade-mini"
          :style="{ '--arcade-accent': game.accent }"
        >
          <span class="arcade-mini-marquee">{{ game.title }}</span>
          <span class="arcade-mini-screen">
            <img
              v-if="brokenArt[game.slug] !== 'none'"
              :src="brokenArt[game.slug] ? FALLBACK_ART : game.titleArt"
              :alt="`${game.title} title screen`"
              class="arcade-mini-art"
              loading="lazy"
              @error="onArtError(game.slug)"
            />
            <span class="arcade-mini-press">Press start</span>
          </span>
          <span class="arcade-mini-panel">
            <span class="arcade-mini-riff">Riffs on {{ game.riffsOn }}</span>
            <span class="arcade-mini-blurb">{{ game.blurb }}</span>
            <span class="arcade-mini-score">
              {{ topLine(game.slug) }}
            </span>
            <span class="arcade-mini-play">Play</span>
          </span>
        </NuxtLink>
      </li>
      <li v-for="soon in comingSoon" :key="soon.slug">
        <div
          class="arcade-mini arcade-mini-soon"
          :style="{ '--arcade-accent': soon.accent }"
        >
          <span class="arcade-mini-marquee">{{ soon.title }}</span>
          <span class="arcade-mini-screen">
            <img
              v-if="soon.titleArt && !brokenArt[soon.slug]"
              :src="soon.titleArt"
              :alt="`${soon.title} title screen`"
              class="arcade-mini-art"
              loading="lazy"
              @error="brokenArt[soon.slug] = 'none'"
            />
            <span class="arcade-mini-press">Coming soon</span>
          </span>
          <span class="arcade-mini-panel">
            <span class="arcade-mini-riff">Riffs on {{ soon.riffsOn }}</span>
            <span class="arcade-mini-blurb">
              Being built now. New cabinets arrive as the robots finish them.
            </span>
          </span>
        </div>
      </li>
    </ul>

    <section class="arcade-fame" aria-labelledby="arcade-fame-title">
      <h2 id="arcade-fame-title" class="arcade-fame-title">Hall of fame</h2>
      <p class="arcade-fame-lede">
        Every board is global: one high-score list per cabinet for everyone who
        plays, updated the moment a score lands.
        <span v-if="store.pendingCount">
          {{ store.pendingCount }}
          {{ store.pendingCount === 1 ? 'score' : 'scores' }} from this device
          will join the boards as soon as the score server answers.
        </span>
      </p>
      <ol class="arcade-fame-grid">
        <li v-for="game in games" :key="game.slug" class="arcade-fame-card">
          <NuxtLink
            :to="`/play/arcade?game=${game.slug}`"
            class="arcade-fame-game"
            :style="{ '--arcade-accent': game.accent }"
          >
            {{ game.title }}
          </NuxtLink>
          <ol v-if="fame(game.slug)?.top.length" class="arcade-fame-top">
            <li
              v-for="(row, index) in fame(game.slug)?.top"
              :key="`${game.slug}-${index}`"
            >
              <span>{{ index + 1 }}. {{ row.initials }}</span>
              <span>{{ row.score.toLocaleString('en-US') }}</span>
            </li>
          </ol>
          <p v-else class="arcade-fame-empty">No scores yet. Be the first!</p>
          <p class="arcade-fame-meta">
            <span v-if="fame(game.slug)?.todayBest">
              Today: {{ formatChampion(fame(game.slug)?.todayBest) }}
            </span>
            <span v-else>Today: open</span>
            <span>{{ playsLabel(fame(game.slug)?.plays ?? 0) }}</span>
          </p>
        </li>
      </ol>
    </section>

    <p class="arcade-hall-footnote">
      Butterfly Blaster plays for AMI, our Anti-Malaria Intelligence. Real bed
      nets protect real villages:
      <a
        href="https://againstmalaria.com/amibot"
        target="_blank"
        rel="noopener"
        class="arcade-link"
        >help AMI buy one</a
      >.
    </p>
  </div>
</template>

<script setup lang="ts">
// /components/arcade/arcade-hall.vue
//
// The Kind Robots Arcade hall: a row of cabinets, live ones linking to their
// own page and queued ones shown as "coming soon" (conductor kr-arcade).

import { onMounted, reactive, ref } from 'vue'
import { useArcadeStore } from '@/stores/arcadeStore'
import { ARCADE_GAMES, COMING_SOON } from '~/utils/arcade/games'
import { formatChampion } from '~/utils/arcade/leaderboard'

const store = useArcadeStore()
const games = ARCADE_GAMES
const comingSoon = COMING_SOON
const backdrop = ref('/images/arcade/arcade-hall-backdrop.webp')
// '' = use the game's own art, 'fallback' = it 404'd so show the arcade
// splash, 'none' = the splash failed too.
const brokenArt = reactive<Record<string, '' | 'fallback' | 'none'>>({})
const FALLBACK_ART = '/images/arcade/arcade-attract-splash.webp'

function onArtError(slug: string) {
  brokenArt[slug] = brokenArt[slug] ? 'none' : 'fallback'
}

function fame(slug: string) {
  return store.hallOfFame.find((entry) => entry.slug === slug)
}

function topLine(slug: string) {
  const best = fame(slug)?.top[0] ?? store.board(slug, 'all')[0]
  return best
    ? `HI ${best.score.toLocaleString('en-US')} ${best.initials}`
    : 'HI SCORE: be the first'
}

function playsLabel(plays: number) {
  return plays === 1 ? '1 score on the board' : `${plays} scores on the board`
}

onMounted(async () => {
  await store.fetchHallOfFame()
  void store.flushPending()
  // Fall back to per-cabinet boards (or this device's) if the hall of fame
  // could not load.
  if (!store.hallOfFame.length) {
    for (const game of games) void store.fetchBoard(game.slug, 'all')
  }
})
</script>

<style scoped>
.arcade-hall {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1rem, 3vw, 2rem);
  border-radius: 1.5rem;
  overflow: hidden;
  background: linear-gradient(180deg, #0b0620, #2e1065 70%, #4a044e);
  color: #f5f3ff;
}

.arcade-hall-backdrop {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.arcade-hall-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 6, 32, 0.55),
    rgba(11, 6, 32, 0.85)
  );
}

.arcade-hall-backdrop-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.arcade-hall-intro {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 46rem;
}

.arcade-neon {
  margin: 0;
  font-family: ui-monospace, 'Courier New', monospace;
  font-weight: 900;
  font-size: clamp(1.5rem, 5vw, 2.75rem);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  text-shadow:
    0 0 8px #f472b6,
    0 0 22px #a78bfa,
    3px 3px 0 #1e1b4b;
}

.arcade-hall-lede {
  margin: 0;
  color: #e9d5ff;
  line-height: 1.55;
}

.arcade-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.arcade-mini {
  --arcade-accent: #f472b6;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 1rem 1rem 0.5rem 0.5rem;
  overflow: hidden;
  background: linear-gradient(180deg, #312e81, #1e1b4b);
  border: 2px solid #a78bfa;
  box-shadow: 0 0 18px color-mix(in srgb, var(--arcade-accent) 40%, transparent);
  color: inherit;
  text-decoration: none;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

a.arcade-mini:hover,
a.arcade-mini:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 0 30px color-mix(in srgb, var(--arcade-accent) 70%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .arcade-mini {
    transition: none;
  }

  a.arcade-mini:hover,
  a.arcade-mini:focus-visible {
    transform: none;
  }
}

.arcade-mini-marquee {
  padding: 0.6rem 0.75rem;
  text-align: center;
  font-family: ui-monospace, 'Courier New', monospace;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(
    90deg,
    #0d9488,
    #7c3aed 35%,
    #db2777 70%,
    #f59e0b
  );
  border-bottom: 3px solid #fde68a;
  text-shadow:
    0 0 6px var(--arcade-accent),
    2px 2px 0 #1e1b4b;
}

.arcade-mini-screen {
  position: relative;
  display: grid;
  place-items: end center;
  aspect-ratio: 4 / 3;
  margin: 0.75rem;
  border-radius: 0.75rem;
  overflow: hidden;
  background: radial-gradient(circle at 50% 35%, #4c1d95, #0b0620 80%);
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.85);
}

.arcade-mini-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.arcade-mini-press {
  position: relative;
  margin-bottom: 0.6rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  background: rgba(11, 6, 32, 0.7);
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fde68a;
}

.arcade-mini-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0.9rem 0.9rem;
}

.arcade-mini-riff {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c4b5fd;
}

.arcade-mini-blurb {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #ede9fe;
}

.arcade-mini-score {
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 0.8rem;
  color: #f9a8d4;
}

.arcade-mini-play {
  align-self: flex-start;
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  background: #facc15;
  color: #1e1b4b;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.arcade-mini-soon {
  opacity: 0.72;
  filter: saturate(0.7);
}

.arcade-fame {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.arcade-fame-title {
  margin: 0;
  font-family: ui-monospace, 'Courier New', monospace;
  font-weight: 900;
  font-size: clamp(1.1rem, 3vw, 1.6rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fde68a;
  text-shadow: 0 0 10px rgba(250, 204, 21, 0.6);
}

.arcade-fame-lede {
  margin: 0;
  color: #e9d5ff;
  line-height: 1.5;
}

.arcade-fame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.arcade-fame-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.9rem;
  background: rgba(15, 10, 46, 0.78);
  border: 1px solid rgba(253, 230, 138, 0.25);
}

.arcade-fame-game {
  --arcade-accent: #f472b6;
  font-weight: 800;
  color: #fff;
  text-decoration: none;
  text-shadow: 0 0 8px var(--arcade-accent);
}

.arcade-fame-top {
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 0.85rem;
}

.arcade-fame-top li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.arcade-fame-top li:first-child {
  color: #fde68a;
  font-weight: 800;
}

.arcade-fame-empty {
  margin: 0;
  font-size: 0.85rem;
  color: #c4b5fd;
}

.arcade-fame-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
  margin: 0;
  font-size: 0.75rem;
  color: #a5b4fc;
}

.arcade-hall-footnote {
  margin: 0;
  font-size: 0.9rem;
  color: #e9d5ff;
}

.arcade-link {
  color: #fde68a;
  text-decoration: underline;
}
</style>
