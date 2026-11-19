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
            src="/images/chessweeper/icon.webp"
            alt=""
            width="28"
            height="28"
            class="size-7 shrink-0 rounded-lg object-cover"
          />
          <span class="min-w-0 flex-1 truncate font-bold">
            Chessweeper · Three Dangerous Worlds
          </span>
          <span class="badge badge-primary hidden sm:inline-flex">
            Chess × Mines × Discs
          </span>
        </nav>
      </header-page-bar>
      <page-help
        label="How to play Chessweeper"
        @open="openGamePanel('guide')"
      />
      <iframe
        ref="gameFrame"
        class="chessweeper-frame min-h-0 w-full flex-1 rounded-2xl border border-base-content/20"
        src="/chessweeper/index.html?embedded=1"
        title="Chessweeper: play Sugarbomb Kingdom, Ashen Checkmate or Jackpot Apocalypse"
        allow="fullscreen"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
const gameFrame = ref<HTMLIFrameElement | null>(null)

function openGamePanel(panel: string) {
  gameFrame.value?.contentWindow?.postMessage(
    { type: 'chessweeper:open', panel },
    window.location.origin,
  )
}

useHead({ title: 'Chessweeper · Three Dangerous Worlds · Kind Robots' })
useSeoMeta({
  description:
    'One dangerous chessboard, three original worlds: kawaii Sugarbomb Kingdom, gothic Ashen Checkmate, and neon Jackpot Apocalypse. Play chess, Minesweeper and disc survival together.',
})
</script>

<style scoped>
.chessweeper-frame {
  background: #130b28;
  color-scheme: dark;
}
</style>
