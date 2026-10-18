<template>
  <div class="relative size-full overflow-hidden bg-base-300">
    <img
      :src="src"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-xl"
      :class="tint"
    />
    <img
      :src="src"
      :alt="alt"
      class="relative size-full object-contain drop-shadow-2xl"
      :class="tint"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{ src: string; alt: string; tint?: string }>()
</script>
