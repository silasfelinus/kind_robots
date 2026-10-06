<template>
  <main class="kr-surface">
    <div class="kr-scroll kr-container max-w-7xl p-2 sm:p-4 lg:p-6">
      <nav class="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <NuxtLink to="/play/arcade" class="btn btn-sm btn-ghost">
          ← Arcade hall
        </NuxtLink>
        <span v-if="meta" class="opacity-70">
          {{ meta.title }} · riffs on {{ meta.riffsOn }}
        </span>
      </nav>

      <div v-if="meta" class="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div class="min-w-0 flex-1">
          <ArcadeCabinet :slug="meta.slug" />
        </div>

        <aside
          class="kr-panel flex w-full flex-col gap-4 rounded-2xl p-4 xl:w-80 xl:shrink-0"
          aria-label="High scores"
        >
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
                <span>{{ index + 1 }}. {{ row.initials }}</span>
                <span>{{ row.score.toLocaleString() }}</span>
              </li>
            </ol>
            <p v-else class="text-sm opacity-70">
              No scores yet. Be the first!
            </p>
          </section>
          <p v-if="store.offline" class="text-xs opacity-70">
            The score server is unreachable, so these are the scores saved on
            this device.
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
        </aside>
      </div>

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
// /pages/play/arcade/[game].vue -- one Kind Robots Arcade cabinet plus its
// today / all-time high score tables (conductor kr-arcade).

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useArcadeStore } from '@/stores/arcadeStore'
import { findArcadeGame } from '~/utils/arcade/games'

const route = useRoute()
const store = useArcadeStore()
const meta = computed(() => findArcadeGame(String(route.params.game ?? '')))

const ranges = [
  { key: 'today' as const, label: "Today's best" },
  { key: 'all' as const, label: 'All-time high scores' },
]

useHead({
  title: computed(() =>
    meta.value
      ? `${meta.value.title} · Kind Robots Arcade`
      : 'Kind Robots Arcade',
  ),
})
</script>
