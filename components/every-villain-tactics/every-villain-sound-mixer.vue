<template>
  <fieldset class="evt-sound" data-testid="tactics-sound-mixer">
    <legend>Original music &amp; sound</legend>
    <p v-if="!sound.enabled" class="evt-sound-warning">
      The Playbook Kit's Sound setting is off. Turn it on in the console
      settings to hear the score and effects.
    </p>
    <label class="evt-sound-mute">
      <input
        type="checkbox"
        :checked="sound.mix.muted"
        data-testid="tactics-audio-mute"
        @change="setMuted"
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
        :aria-label="channel.label + ' volume'"
        :data-testid="'tactics-audio-' + channel.id"
        :value="Math.round(sound.mix[channel.id] * 100)"
        @input="setVolume(channel.id, $event)"
      />
      <output>{{ Math.round(sound.mix[channel.id] * 100) }}%</output>
    </label>
    <small>
      Playback starts after your first tap or key press. Battle events remain
      visible in the combat log with sound muted.
    </small>
  </fieldset>
</template>

<script setup lang="ts">
import { useEveryVillainSoundStore } from '~/stores/everyVillainSoundStore'

type VolumeChannel = 'master' | 'music' | 'effects'
const sound = useEveryVillainSoundStore()
const channels: Array<{ id: VolumeChannel; label: string }> = [
  { id: 'master', label: 'Master' },
  { id: 'music', label: 'Music' },
  { id: 'effects', label: 'Effects' },
]

function setMuted(event: Event): void {
  sound.unlock()
  sound.setMix({
    muted: (event.target as HTMLInputElement).checked,
  })
}

function setVolume(channel: VolumeChannel, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value) / 100
  sound.unlock()
  if (channel === 'master') sound.setMix({ master: value })
  else if (channel === 'music') sound.setMix({ music: value })
  else sound.setMix({ effects: value })
  if (channel === 'effects') sound.play(['select'])
}
</script>

<style scoped>
.evt-sound {
  display: grid;
  gap: 0.7rem;
  margin: 0.8rem 0;
  padding: 0.9rem;
  border: 1px solid rgb(255 255 255 / 0.24);
  border-radius: 0.9rem;
  background: rgb(15 10 40 / 0.45);
}
.evt-sound-warning {
  color: #ffce67;
  line-height: 1.4;
  font-size: 0.8rem;
}
.evt-sound legend {
  padding: 0 0.4rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.evt-sound label:not(.evt-sound-mute) {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) 3rem;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.evt-sound input[type='range'] {
  width: 100%;
  accent-color: #ffce67;
}
.evt-sound output {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.evt-sound-mute {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
}
.evt-sound small {
  color: #f5d7eb;
  font-size: 0.78rem;
  line-height: 1.45;
}
</style>
