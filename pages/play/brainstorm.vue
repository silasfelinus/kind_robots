<template>
  <main
    class="kr-surface h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
  >
    <brainstorm-play-console />
  </main>
</template>

<script setup lang="ts">
useHead({ title: 'Brainstorm · Show me what you got' })
useSeoMeta({
  description:
    'A party game for the whole table: put a prompt down, pile on with your own lines, react to the best ones, and watch every idea get painted.',
})
</script>
