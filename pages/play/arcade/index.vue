<template>
  <main class="kr-surface">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4"
    >
      <div v-if="!slug" class="kr-scroll min-h-0 flex-1">
        <ArcadeHall />
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
            class="btn btn-outline btn-sm xl:hidden"
            :aria-expanded="showDetails"
            aria-controls="arcade-cabinet-details"
            @click="showDetails = !showDetails"
          >
            {{ showDetails ? 'Play game' : 'Scores & reviews' }}
          </button>
        </nav>

        <div
          class="kr-panes min-h-0 grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div
            class="kr-pane-scroll min-w-0"
            :class="showDetails ? 'hidden xl:block' : 'block'"
          >
            <ArcadeCabinet :key="meta.slug" :slug="meta.slug" />
          </div>

          <aside
            id="arcade-cabinet-details"
            class="kr-pane-scroll kr-panel min-w-0 rounded-2xl"
            :class="showDetails ? 'block' : 'hidden xl:block'"
            aria-label="High scores, about and reviews"
          >
            <div class="flex flex-col gap-4 p-4">
              <section v-for="range in ranges" :key="range.key">
                <p
                  class="mb-2 text-xs font-bold uppercase tracking-widest opacity-70"
                >
                  {{ range.label }}
                </p>
                <ol
                  v-if="store.board(meta.slug, range.key).length"
                  class="space-y-1 font-mono text-sm"
                >
                  <li
                    v-for="(row, index) in store.board(meta.slug, range.key)"
                    :key="row.id"
                    class="flex justify-between gap-3 rounded px-2 py-0.5"
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
                        :title="`Played by ${row.username}`"
                        >· {{ row.username }}</span
                      >
                    </span>
                    <span>{{ row.score.toLocaleString() }}</span>
                  </li>
                </ol>
                <p v-else class="text-sm opacity-70">
                  No scores yet. Be the first!
                </p>
              </section>
              <p v-if="store.offline" class="text-xs opacity-70">
                The score server is unreachable, so these are the scores saved
                on this device.
              </p>
              <p v-if="store.pendingCount" class="text-xs opacity-70">
                {{ store.pendingCount }}
                {{ store.pendingCount === 1 ? 'score' : 'scores' }} from this
                device will join the global board as soon as the score server
                answers.
              </p>
              <p class="text-sm leading-relaxed">{{ meta.blurb }}</p>
              <p
                v-if="meta.slug === 'butterfly-blaster'"
                class="text-sm leading-relaxed"
              >
                On screen, the butterfly protects villages. Off screen, AMI buys
                real bed nets for families who need them:
                <a
                  href="https://againstmalaria.com/amibot"
                  target="_blank"
                  rel="noopener"
                  class="link link-primary"
                  >help her send one</a
                >.
              </p>
              <ArcadeReviews :game="meta.slug" compact />
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
const slug = computed(() =>
  typeof route.query.game === 'string' ? route.query.game : '',
)
watch(slug, () => {
  showDetails.value = false
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
</script>
