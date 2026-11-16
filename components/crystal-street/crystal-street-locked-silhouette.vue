<template>
  <div
    class="cs-card overflow-hidden"
    role="img"
    :aria-label="`Undiscovered ${kind}`"
  >
    <div
      class="relative flex aspect-[4/5] flex-col items-center justify-end overflow-hidden bg-base-300 px-3 pt-4"
      aria-hidden="true"
    >
      <span class="h-1/3 w-1/2 rounded-full bg-base-content/40" />
      <span class="-mb-2 h-2/5 w-full rounded-t-full bg-base-content/40" />
    </div>
    <span class="block px-1.5 py-1 cs-label font-semibold">???</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ kind: 'nightmare' | 'friend' }>()
</script>
