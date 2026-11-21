<!-- components/cthulhuquarium/cthulhuquarium-style-picker.vue
     The art-style swatches (conductor cthulhuquarium/t-107), after Shifting
     Desks' style picker: each style shows the same sample, Charlotte's
     full-length portrait, so the choice is about the look and nothing else.
     Classic is the default. Kept with the other game settings (per browser);
     renders nothing while Classic is the only style on offer. -->
<template>
  <fieldset
    v-if="options.length > 1"
    class="flex min-w-0 flex-col gap-2"
    aria-labelledby="cq-style-heading"
  >
    <legend id="cq-style-heading" class="text-sm font-bold">Art style</legend>
    <div class="cq-style-swatches" role="radiogroup" aria-label="Art style">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        role="radio"
        :aria-checked="current === option.id"
        class="cq-style-swatch"
        :class="{ 'cq-style-on': current === option.id }"
        :title="option.blurb"
        @click="choose(option.id)"
      >
        <img
          v-if="sampleFor(option.id)"
          :src="sampleFor(option.id) ?? undefined"
          :alt="`${option.label}: Charlotte Fishmonger`"
          class="cq-style-sample"
          loading="lazy"
        />
        <span class="cq-style-label">
          <Icon
            v-if="current === option.id"
            name="kind-icon:check"
            class="size-4 shrink-0"
          />
          {{ option.label }}
        </span>
        <span
          v-if="option.id === CTHULHUQUARIUM_DEFAULT_ART_STYLE"
          class="cq-style-default"
          >Default</span
        >
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import classicSample from '~/assets/images/cthulhuquarium/cthulhuquarium-char-charlotte-fishmonger.webp'
import { useCthulhuquariumTankStore } from '~/stores/cthulhuquariumTankStore'
import {
  CTHULHUQUARIUM_DEFAULT_ART_STYLE,
  selectableCthulhuquariumArtStyles,
  type CthulhuquariumArtStyleId,
} from '~/utils/cthulhuquariumArtStyles'
import { cthulhuquariumStyleFile } from '~/utils/cthulhuquariumStyledArt'

const tankStore = useCthulhuquariumTankStore()
const options = selectableCthulhuquariumArtStyles()
const current = computed(() => tankStore.settings.artStyle)

function sampleFor(style: CthulhuquariumArtStyleId): string | null {
  if (style === 'classic') return classicSample
  return cthulhuquariumStyleFile(style, 'heroes', 'charlotte-fishmonger')
}

function choose(style: CthulhuquariumArtStyleId) {
  tankStore.updateSettings({ artStyle: style })
}
</script>

<style scoped>
.cq-style-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
}
.cq-style-swatch {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: 2px solid rgb(216 181 106 / 0.35);
  border-radius: 0.75rem;
  background: radial-gradient(circle at 50% 30%, #1d2b2c, #0b1112);
  transition: border-color 0.15s ease;
}
.cq-style-swatch:hover,
.cq-style-swatch:focus-visible {
  border-color: rgb(216 181 106 / 0.8);
}
.cq-style-on {
  border-color: #5fd4c0;
  box-shadow: 0 0 0 3px rgb(95 212 192 / 0.35);
}
.cq-style-sample {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  object-position: 50% 20%;
}
.cq-style-label {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.3rem 0.25rem;
  background: rgb(8 12 13 / 0.85);
  color: #f2e6c9;
  font-size: 0.8rem;
  font-weight: 800;
}
.cq-style-default {
  position: absolute;
  left: 0.3rem;
  top: 0.3rem;
  border-radius: 0.3rem;
  background: rgb(8 12 13 / 0.85);
  padding: 0.1rem 0.35rem;
  color: #f2e6c9;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
