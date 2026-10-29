<template>
  <main class="kr-surface">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4"
    >
      <div v-if="!slug" class="kr-panes min-h-0 grid-cols-1">
        <div class="kr-pane-scroll">
          <ArcadeHall />
        </div>
      </div>

      <template v-else-if="meta">
        <nav
          class="flex shrink-0 items-center gap-2 text-sm"
          aria-label="Arcade cabinet navigation"
        >
          <NuxtLink to="/play/arcade" class="btn btn-sm btn-ghost">
            ← Arcade hall
          </NuxtLink>
          <span class="min-w-0 flex-1 truncate opacity-70">
            {{ meta.title }}
          </span>
          <button
            type="button"
            class="arcade-details-toggle btn btn-outline btn-sm"
            :aria-expanded="showDetails"
            aria-controls="arcade-cabinet-details"
            @click="showDetails = !showDetails"
          >
            {{ showDetails ? 'Back to game' : 'Scores & more' }}
          </button>
        </nav>

        <div class="kr-panes arcade-layout min-h-0 grid-cols-1 gap-2">
          <div
            class="kr-pane arcade-playfield min-w-0"
            :class="{ 'arcade-playfield--hidden': showDetails }"
          >
            <ArcadeCabinet :key="meta.slug" :slug="meta.slug" contained />
          </div>

          <aside
            id="arcade-cabinet-details"
            class="kr-pane-scroll kr-panel arcade-details min-w-0 rounded-2xl"
            :class="{ 'arcade-details--hidden': !showDetails }"
            aria-label="High scores, achievements, instructions and reviews"
          >
            <div
              class="arcade-details-tabs"
              role="group"
              aria-label="Game details"
            >
              <button
                v-for="tab in detailTabs"
                :key="tab.key"
                type="button"
                class="btn btn-xs"
                :class="detailTab === tab.key ? 'btn-primary' : 'btn-ghost'"
                :aria-pressed="detailTab === tab.key"
                @click="detailTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="flex flex-col gap-3 p-3">
              <section
                class="arcade-detail-section"
                :class="{
                  'arcade-detail-section--inactive':
                    detailTab !== 'instructions',
                }"
                aria-label="How to play"
              >
                <h2
                  class="mb-1 text-xs font-bold uppercase tracking-widest opacity-70"
                >
                  How to play
                </h2>
                <p class="text-sm leading-relaxed">{{ meta.blurb }}</p>
                <p class="mt-2 text-xs opacity-70">
                  Keyboard: arrows or WASD to move, Enter to start, P to pause,
                  Space/Z for A and X/Shift for B. Gamepads also work.
                </p>
                <p
                  v-if="meta.slug === 'butterfly-blaster'"
                  class="mt-2 text-sm leading-relaxed"
                >
                  On screen, the butterfly protects villages. Off screen, AMI
                  buys real bed nets for families who need them:
                  <a
                    href="https://againstmalaria.com/amibot"
                    target="_blank"
                    rel="noopener"
                    class="link link-primary"
                    >help her send one</a
                  >.
                </p>
              </section>

              <section
                class="arcade-detail-section"
                :class="{
                  'arcade-detail-section--inactive': detailTab !== 'scores',
                }"
                aria-label="High scores"
              >
                <section
                  v-for="range in ranges"
                  :key="range.key"
                  class="mb-3 last:mb-0"
                >
                  <p
                    class="mb-1 text-xs font-bold uppercase tracking-widest opacity-70"
                  >
                    {{ range.label }}
                  </p>
                  <ol
                    v-if="store.board(meta.slug, range.key).length"
                    class="space-y-1 font-mono text-xs"
                  >
                    <li
                      v-for="(row, index) in store.board(meta.slug, range.key)"
                      :key="row.id"
                      class="flex justify-between gap-2 rounded px-1 py-0.5"
                      :class="
                        row.id === store.lastSubmittedId
                          ? 'bg-primary/20 font-bold'
                          : ''
                      "
                    >
                      <span class="min-w-0 truncate">
                        {{ index + 1 }}. {{ row.initials }}
                        <span
                          v-if="row.username"
                          class="font-sans text-xs opacity-70"
                          :title="'Played by ' + row.username"
                          >· {{ row.username }}</span
                        >
                      </span>
                      <span>{{ row.score.toLocaleString() }}</span>
                    </li>
                  </ol>
                  <p v-else class="text-xs opacity-70">
                    No scores yet. Be the first!
                  </p>
                </section>
                <p v-if="store.offline" class="mt-2 text-xs opacity-70">
                  The server is offline. Showing scores saved on this device.
                </p>
                <p v-if="store.pendingCount" class="mt-2 text-xs opacity-70">
                  {{ store.pendingCount }}
                  {{ store.pendingCount === 1 ? 'score' : 'scores' }} will sync
                  when the score server responds.
                </p>
              </section>

              <section
                class="arcade-detail-section"
                :class="{
                  'arcade-detail-section--inactive':
                    detailTab !== 'achievements',
                }"
                aria-label="Achievements"
              >
                <GameAchievementStrip :game="meta.slug" layout="icons" />
              </section>

              <section
                class="arcade-detail-section"
                :class="{
                  'arcade-detail-section--inactive': detailTab !== 'reviews',
                }"
              >
                <ArcadeReviews :game="meta.slug" compact />
              </section>
            </div>
          </aside>
        </div>
      </template>

      <div v-else class="kr-panel mx-auto max-w-xl rounded-2xl p-6 text-center">
        <p class="mb-3">That cabinet is still being built.</p>
        <NuxtLink to="/play/arcade" class="btn btn-primary btn-sm">
          Back to the arcade
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
// /pages/play/arcade/index.vue -- the Kind Robots Arcade (conductor
// kr-arcade). With no ?game= it is the hall; ?game=<slug> opens that cabinet.
// A query (not a sub-route) keeps the shell header on the Arcade tab, which
// matches tabs by exact route.

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useArcadeStore } from '@/stores/arcadeStore'
import { ARCADE_GAMES, findArcadeGame } from '~/utils/arcade/games'

const route = useRoute()
const store = useArcadeStore()
const showDetails = ref(false)
type DetailTab = 'scores' | 'achievements' | 'instructions' | 'reviews'
const detailTabs: { key: DetailTab; label: string }[] = [
  { key: 'instructions', label: 'How to play' },
  { key: 'scores', label: 'Scores' },
  { key: 'achievements', label: 'Awards' },
  { key: 'reviews', label: 'Reviews' },
]
const detailTab = ref<DetailTab>('instructions')
const slug = computed(() =>
  typeof route.query.game === 'string' ? route.query.game : '',
)
watch(slug, () => {
  showDetails.value = false
  detailTab.value = 'instructions'
})
const meta = computed(() =>
  ARCADE_GAMES.some((game) => game.slug === slug.value)
    ? findArcadeGame(slug.value)
    : undefined,
)

const ranges = [
  { key: 'today' as const, label: "Today's best · worldwide" },
  { key: 'all' as const, label: 'All-time high scores · worldwide' },
]

useHead({
  title: computed(() =>
    meta.value
      ? `${meta.value.title} · Kind Robots Arcade`
      : 'Kind Robots Arcade',
  ),
})

// Only the hall is a stable shareable page; ?game= cabinets keep the default.
if (!route.query.game) {
  useSeoMeta(
    gameLinkPreviewMeta('arcade', useRuntimeConfig().public.appBaseUrl) ?? {},
  )
}
</script>

<style scoped>
.arcade-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  align-items: stretch;
}

.arcade-playfield {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.arcade-playfield :deep(.arcade-cabinet--contained) {
  height: 100%;
  min-height: 0;
}

.arcade-details {
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.arcade-details-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.125rem;
  padding: 0.5rem 0.5rem 0;
}

.arcade-details-tabs .btn {
  min-width: 0;
  padding-inline: 0.25rem;
  font-size: 0.68rem;
}

@media (max-width: 1023px) {
  .arcade-playfield--hidden,
  .arcade-details--hidden,
  .arcade-detail-section--inactive {
    display: none;
  }
}

@media (min-width: 1024px) {
  .arcade-layout {
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 19rem);
  }

  .arcade-details-toggle,
  .arcade-details-tabs {
    display: none;
  }
}
</style>
