<template>
  <fieldset class="couch-mixer" data-testid="space-couch-sound-mixer">
    <legend>Sound mix</legend>
    <p v-if="!soundOn" class="couch-mixer-off">
      Sound is off in the settings above. Turn it on to hear the lounge band.
    </p>
    <label>
      <span>Music</span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        :value="Math.round(sound.mix.music * 100)"
        :disabled="!soundOn"
        data-testid="space-couch-music-volume"
        aria-label="Music volume"
        @input="onInput('music', $event)"
      />
      <output>{{ Math.round(sound.mix.music * 100) }}</output>
    </label>
    <label>
      <span>Effects</span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        :value="Math.round(sound.mix.effects * 100)"
        :disabled="!soundOn"
        data-testid="space-couch-effects-volume"
        aria-label="Sound effects volume"
        @input="onInput('effects', $event)"
      />
      <output>{{ Math.round(sound.mix.effects * 100) }}</output>
    </label>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useSpaceCouchSoundStore } from '~/stores/spaceCouchSoundStore'

const kit = usePlaybookKitStore()
const sound = useSpaceCouchSoundStore()
const soundOn = computed(() => kit.settings.sound !== 'off')

function onInput(channel: 'music' | 'effects', event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100
  sound.unlock()
  sound.setMix({ [channel]: value })
  if (channel === 'effects') sound.play(['tap'])
}
</script>

<style scoped>
.couch-mixer {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 0.75rem;
}
.couch-mixer legend {
  padding: 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.couch-mixer label {
  display: grid;
  grid-template-columns: 4.5rem 1fr 2.5rem;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
}
.couch-mixer input[type='range'] {
  width: 100%;
  accent-color: #f0b27a;
}
.couch-mixer output {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.couch-mixer-off {
  font-size: 0.8rem;
  opacity: 0.8;
}
</style>
