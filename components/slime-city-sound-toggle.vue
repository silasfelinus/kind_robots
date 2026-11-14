<template>
  <button
    type="button"
    class="sc-sound-toggle"
    :class="{ off: !sound.sound }"
    :aria-pressed="sound.sound"
    :aria-label="
      sound.sound ? 'Turn Slime City sound off' : 'Turn Slime City sound on'
    "
    :title="sound.sound ? 'Sound on: tap to mute' : 'Sound off: tap to unmute'"
    data-testid="slime-sound-toggle"
    @click="sound.toggleSound()"
  >
    <Icon
      :name="sound.sound ? 'kind-icon:volume-high' : 'kind-icon:volume'"
      class="sc-sound-icon"
    />
    <span class="sc-sound-word">{{ sound.sound ? 'SOUND' : 'MUTED' }}</span>
  </button>
</template>

<script setup lang="ts">
import { useSlimeCitySoundStore } from '~/stores/slimeCitySound'

const sound = useSlimeCitySoundStore()
</script>

<style scoped>
.sc-sound-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 2rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid #7ba74a77;
  border-radius: 0.3rem;
  background: #19271c;
  color: #dfff93;
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.sc-sound-toggle.off {
  color: #a6aac0;
  border-color: #a6aac055;
  background: #161b26;
}
.sc-sound-icon {
  width: 1rem;
  height: 1rem;
}
@container (max-width: 760px) {
  .sc-sound-word {
    display: none;
  }
}
</style>
