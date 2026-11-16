<template>
  <div
    :class="compact ? 'overflow-hidden' : 'cs-card overflow-hidden'"
    role="img"
    :aria-label="`Undiscovered ${kind}`"
  >
    <div
      class="relative flex flex-col items-center justify-end overflow-hidden bg-base-300 px-3 pt-4"
      :class="landscape ? 'aspect-[16/9]' : 'aspect-[4/5]'"
      aria-hidden="true"
    >
      <template v-if="kind === 'ending'">
        <span
          class="absolute right-[12%] top-[12%] h-1/3 aspect-square rounded-full bg-base-content/15"
        />
        <span
          class="absolute bottom-0 left-[12%] h-3/5 w-1/3 rounded-t-full bg-base-content/40"
        />
        <span
          class="absolute bottom-0 right-[8%] h-2/5 w-1/2 rounded-t-full bg-base-content/30"
        />
      </template>
      <template v-else>
        <span class="h-1/3 w-1/2 rounded-full bg-base-content/40" />
        <span class="-mb-2 h-2/5 w-full rounded-t-full bg-base-content/40" />
      </template>
    </div>
    <span v-if="!compact" class="block px-1.5 py-1 cs-label font-semibold"
      >???</span
    >
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    kind: 'nightmare' | 'friend' | 'ending'
    landscape?: boolean
    compact?: boolean
  }>(),
  {
    landscape: false,
    compact: false,
  },
)
</script>
