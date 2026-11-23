<template>
  <main class="kr-surface kr-scroll min-h-0">
    <div class="flex h-full min-h-0 flex-col gap-2 p-2">
      <header-page-bar>
        <nav
          class="flex min-w-0 flex-1 items-center gap-2 text-xs sm:text-sm"
          aria-label="Chessweeper navigation"
        >
          <NuxtLink to="/play/arcade" class="btn btn-ghost btn-sm shrink-0">
            ← Arcade
          </NuxtLink>
          <img
            v-if="iconAvailable"
            src="/images/chessweeper/icon.webp"
            alt=""
            width="28"
            height="28"
            class="size-7 shrink-0 rounded-lg object-cover"
            @error="iconAvailable = false"
          />
          <span
            v-else
            aria-hidden="true"
            class="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/20 text-lg"
          >
            ♔
          </span>
          <span class="min-w-0 flex-1 truncate font-bold">
            Chessweeper
          </span>
          <span class="badge badge-primary hidden sm:inline-flex">
            ♔ × ✹ × ◉
          </span>
        </nav>
      </header-page-bar>
      <NuxtLink
        v-if="route.query.mode === 'classic'"
        to="/play/chessweeper"
        class="btn btn-primary btn-sm self-end"
      >
        ▶ Triple Threat
      </NuxtLink>
      <page-help
        label="How to play Chessweeper"
        @open="openGamePanel('guide')"
      />
      <iframe
        ref="gameFrame"
        class="chessweeper-frame min-h-0 w-full flex-1 rounded-2xl border border-base-content/20"
        :src="frameSrc"
        title="Chessweeper: three simultaneous games, or original Classic campaigns"
        allow="fullscreen"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const frameSrc = computed(() =>
  route.query.mode === 'classic'
    ? '/chessweeper/index.html?embedded=1'
    : '/chessweeper/triple.html',
)
const gameFrame = ref<HTMLIFrameElement | null>(null)
const iconAvailable = ref(true)

function openGamePanel(panel: string) {
  gameFrame.value?.contentWindow?.postMessage(
    { type: 'chessweeper:open', panel },
    window.location.origin,
  )
}

useHead({ title: 'Chessweeper · Triple Threat · Kind Robots' })
useSeoMeta({
  description:
    'Three simultaneous games on one clock: play chess, reveal Minesweeper fields and dodge discs in real time. Original three-world Classic campaigns remain available.',
})
</script>

<style scoped>
.chessweeper-frame {
  background: #130b28;
  color-scheme: dark;
}
</style>
