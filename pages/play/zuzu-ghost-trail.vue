<template>
  <main class="kr-surface">
    <div class="kr-scroll kr-container max-w-7xl space-y-4 p-3 sm:p-6">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-2xl font-bold">Zuzu · Ghost Trail</p>
          <p class="text-sm opacity-75">
            A haunted journey across the frontier.
          </p>
        </div>
        <NuxtLink
          to="/play/arcade?game=zuzu-ghost-trail"
          class="btn btn-outline btn-sm"
        >
          Arcade cabinet &amp; scores
        </NuxtLink>
      </header>
      <ArcadeCabinet slug="zuzu-ghost-trail" />
    </div>
  </main>
</template>

<script setup lang="ts">
useHead({ title: 'Zuzu · Ghost Trail' })
</script>
