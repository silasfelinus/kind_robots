<!-- A painting with a fallback chain (artLibrary.ts). Tries each candidate in
     order; if every one is missing it shows a soft painted wash with the
     subject's initial, never a broken-image icon. -->
<template>
  <div class="rh-art" :class="[`rh-art--${fit}`]">
    <img
      v-if="src"
      :key="src"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      :style="{ objectPosition: position }"
      @error="index += 1"
    />
    <div v-else class="rh-art__wash" aria-hidden="true">
      <span v-if="initial">{{ initial }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    candidates: readonly string[]
    alt?: string
    fit?: 'cover' | 'contain'
    position?: string
    eager?: boolean
    initial?: string
  }>(),
  { alt: '', fit: 'cover', position: 'center', eager: false, initial: '' },
)

const index = ref(0)
watch(
  () => props.candidates.join('|'),
  () => {
    index.value = 0
  },
)
const src = computed(() => props.candidates[index.value] ?? null)
</script>

<style scoped>
.rh-art {
  position: relative;
  overflow: hidden;
  background: var(--rh-wash, #2c1428);
}
.rh-art img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.rh-art--cover img {
  object-fit: cover;
}
.rh-art--contain img {
  object-fit: contain;
}
.rh-art__wash {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(
      circle at 30% 25%,
      rgb(255 230 180 / 0.35),
      transparent 55%
    ),
    linear-gradient(160deg, #6b8fb0, #3f6b5a 55%, #2c1428);
  color: rgb(255 244 220 / 0.85);
  font-family: var(--rh-display);
  font-size: clamp(1.5rem, 6cqi, 4rem);
}
</style>
