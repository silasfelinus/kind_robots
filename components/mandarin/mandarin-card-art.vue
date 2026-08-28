<template>
  <div class="mandarin-art" :class="`mandarin-art--${pigment}`">
    <img
      v-if="art"
      :src="art"
      :alt="`Illustration for ${meaning}`"
      class="absolute inset-0 h-full w-full object-cover"
      :loading="eager ? 'eager' : 'lazy'"
      @error="emit('error', cardKey)"
    />
    <span v-else-if="revealGlyph" class="mandarin-art__glyph" aria-hidden="true">
      {{ simplified }}
    </span>
    <span v-else class="mandarin-art__waiting">
      <Icon name="kind-icon:image" class="size-8 opacity-80" />
      <span class="text-xs opacity-80">Picture not ready yet</span>
    </span>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mandarinPigmentIndex } from '@/utils/mandarinPalette'

const props = withDefaults(
  defineProps<{
    cardKey: string
    simplified: string
    meaning: string
    /** Rendered illustration URL, when one exists. */
    art?: string
    /**
     * Whether the Hanzi may stand in for a missing picture. False on the study
     * card's picture prompt, where the character IS the answer being tested.
     */
    revealGlyph?: boolean
    eager?: boolean
  }>(),
  { art: '', revealGlyph: true, eager: false },
)

const emit = defineEmits<{ error: [cardKey: string] }>()

const pigment = computed(() => mandarinPigmentIndex(props.cardKey))
</script>

<style scoped>
/*
 * The illustrated corpus renders on the home relay over days, so an unrendered
 * card is a normal state, not an error state. A pigment field from the tutor's
 * own gouache palette keeps a half-illustrated deck looking deliberate instead
 * of like a wall of grey loading boxes -- and the colour is drawn from the card
 * key, so a word always sits on the same ground.
 */
.mandarin-art {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  color: #f7f0e0;
  /* The glyph scales to whatever box the parent gives this, not to the viewport. */
  container-type: inline-size;
}

.mandarin-art--0 {
  background: linear-gradient(150deg, #35506b, #22384d);
}

.mandarin-art--1 {
  background: linear-gradient(150deg, #3d7d69, #27564a);
}

.mandarin-art--2 {
  background: linear-gradient(150deg, #e0663f, #a9412a);
}

.mandarin-art--3 {
  background: linear-gradient(150deg, #d8a441, #a97722);
}

.mandarin-art--4 {
  background: linear-gradient(150deg, #7d5e97, #4d3a63);
}

.mandarin-art__glyph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: clamp(2.5rem, 38cqw, 5rem);
  font-weight: 600;
  line-height: 1;
  color: rgb(247 240 224 / 0.92);
  text-shadow: 0 2px 12px rgb(0 0 0 / 0.35);
}

.mandarin-art__waiting {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  text-align: center;
}
</style>
