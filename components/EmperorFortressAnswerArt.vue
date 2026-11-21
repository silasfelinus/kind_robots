<template>
  <figure
    class="relative overflow-hidden rounded-lg border border-warning/35 bg-base-300"
    role="img"
    :aria-label="label"
  >
    <img
      v-if="src"
      :key="src"
      :src="src"
      alt=""
      class="h-full w-full object-cover object-center"
      loading="lazy"
      @error="tryNext"
    />
    <span
      v-else
      class="grid h-full min-h-20 place-content-center px-2 text-center text-xs opacity-70"
    >
      Illustration unavailable
    </span>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  candidates: readonly string[]
  label: string
}>()
const position = ref(0)
const src = computed(() => props.candidates[position.value])

watch(
  () => props.candidates,
  () => {
    position.value = 0
  },
)

function tryNext() {
  if (position.value < props.candidates.length) position.value += 1
}
</script>
