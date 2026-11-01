<template>
  <main class="kr-surface">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 p-2 sm:p-3"
    >
      <header-page-bar>
        <nav
          class="flex min-w-0 flex-1 items-center justify-end gap-2"
          aria-label="Ghost Trail links"
        >
          <NuxtLink
            to="/play/arcade?game=zuzu-ghost-trail"
            class="btn btn-outline btn-sm"
          >
            Arcade cabinet &amp; scores
          </NuxtLink>
        </nav>
      </header-page-bar>
      <div class="kr-scroll min-h-0 flex-1">
        <ArcadeCabinet slug="zuzu-ghost-trail" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
useHead({ title: 'Zuzu · Ghost Trail' })
useSeoMeta(
  gameLinkPreviewMeta(
    'zuzu-ghost-trail',
    useRuntimeConfig().public.appBaseUrl,
  ) ?? {},
)
</script>
