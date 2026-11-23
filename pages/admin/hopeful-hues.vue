<template>
  <main class="kr-surface kr-scroll min-h-0">
    <div class="flex h-full min-h-0 flex-col gap-2 p-2">
      <header-page-bar>
        <nav
          class="flex min-w-0 flex-1 items-center gap-2 text-xs sm:text-sm"
          aria-label="Hopeful Hues navigation"
        >
          <NuxtLink to="/admin" class="btn btn-ghost btn-sm shrink-0">
            ← Admin
          </NuxtLink>
          <span
            aria-hidden="true"
            class="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/20 text-lg"
          >
            🌈
          </span>
          <span class="min-w-0 flex-1 truncate font-bold">
            Hopeful Hues · Superkate &amp; the Kind Robots
          </span>
          <span class="badge badge-secondary hidden sm:inline-flex">
            Admin preview · Match-3
          </span>
        </nav>
      </header-page-bar>
      <page-help
        label="How to play Hopeful Hues"
        @open="openGamePanel('guide')"
      />
      <iframe
        ref="gameFrame"
        class="hopeful-hues-frame min-h-0 w-full flex-1 rounded-2xl border border-base-content/20"
        src="/hopeful-hues/index.html?embedded=1"
        title="Hopeful Hues: a rainbow match-three adventure with Superkate and the Kind Robots"
        allow="fullscreen; autoplay"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
const gameFrame = ref<HTMLIFrameElement | null>(null)

function openGamePanel(panel: string) {
  gameFrame.value?.contentWindow?.postMessage(
    { type: 'hopeful-hues:open', panel },
    window.location.origin,
  )
}

useHead({ title: 'Hopeful Hues · Superkate & the Kind Robots · Kind Robots' })
useSeoMeta({
  description:
    'A hopecore rainbow match-three adventure. Swap tiles with Superkate and the Kind Robots, take any move back, follow a long branching map to five endings, and fill a scrapbook.',
})
</script>

<style scoped>
.hopeful-hues-frame {
  background: #ffe3f1;
}
</style>
