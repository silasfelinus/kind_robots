<template>
  <main class="kr-surface">
    <div class="kr-scroll grid min-h-0 place-items-center p-6">
      <NuxtLink :to="target" class="btn btn-primary">
        Continue to the Playbook Forge
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
// Playbook Studio now lives in the Playbook Forge: Load a game, then Beats
// (conductor playbook-kit t-018). Old links land on the same game's beats.
const route = useRoute()
const game = typeof route.query.game === 'string' ? route.query.game : ''
const target = game
  ? `/admin/playbook-forge?game=${encodeURIComponent(game)}`
  : '/admin/playbook-forge'
await navigateTo(target, { redirectCode: 301, replace: true })
</script>
