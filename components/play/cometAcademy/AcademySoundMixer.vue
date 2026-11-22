<template>
  <fieldset class="prom-sound" data-testid="prom-sound-mixer">
    <legend>Original music &amp; sound</legend>
    <label class="prom-sound-mute">
      <input
        type="checkbox"
        :checked="sound.mix.muted"
        data-testid="prom-audio-mute"
        @change="toggleMute"
      />
      <span>Mute all audio</span>
    </label>
    <label v-for="channel in channels" :key="channel.id">
      <span>{{ channel.label }}</span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        :value="Math.round(sound.mix[channel.id] * 100)"
        :aria-label="channel.label + ' volume'"
        :data-testid="'prom-audio-' + channel.id"
        @input="changeVolume(channel.id, $event)"
      />
      <output>{{ Math.round(sound.mix[channel.id] * 100) }}%</output>
    </label>
    <small>
      The original score starts after your first tap or key press. All
      consequences remain readable in the game log with sound muted.
    </small>
  </fieldset>
</template>

<script setup lang="ts">
import { usePromSoundStore } from '~/stores/promSoundStore'

type VolumeChannel = 'master' | 'music' | 'effects'
const sound = usePromSoundStore()
const channels: Array<{ id: VolumeChannel; label: string }> = [
  { id: 'master', label: 'Master' },
  { id: 'music', label: 'Music' },
  { id: 'effects', label: 'Effects' },
]

function toggleMute(event: Event): void {
  sound.unlock()
  sound.setMix({
    muted: (event.target as HTMLInputElement).checked,
  })
}

function changeVolume(channel: VolumeChannel, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value) / 100
  sound.unlock()
  if (channel === 'master') sound.setMix({ master: value })
  else if (channel === 'music') sound.setMix({ music: value })
  else sound.setMix({ effects: value })
  if (channel === 'effects') sound.play(['choice'])
}
</script>

<style scoped>
.prom-sound {
  display: grid;
  gap: 0.65rem;
  margin: 0.3rem 0;
  padding: 0.75rem;
  border: 1px solid rgb(245 200 158 / 0.35);
  border-radius: 0.8rem;
  background: rgb(10 20 42 / 0.65);
}
.prom-sound legend {
  padding: 0 0.3rem;
  color: #f6c89e;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.07em;
}
.prom-sound label:not(.prom-sound-mute) {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr) 3rem;
  align-items: center;
  gap: 0.5rem;
}
.prom-sound-mute {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
}
.prom-sound input[type='range'] {
  width: 100%;
  accent-color: #f6c89e;
}
.prom-sound output {
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.prom-sound small {
  color: #b5c7d6;
  line-height: 1.4;
}
</style>
