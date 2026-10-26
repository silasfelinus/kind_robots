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
// The Playbook Kit console now lives in the Playbook Forge (title menu, Kit
// console; conductor playbook-kit t-018). Old links land on the same game.
const route = useRoute()
const game = typeof route.query.game === 'string' ? route.query.game : ''
const target = `/admin/playbook-forge?kit=${encodeURIComponent(game)}`
await navigateTo(target, { redirectCode: 301, replace: true })
</script>
