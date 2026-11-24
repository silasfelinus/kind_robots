<template>
  <fieldset class="grid gap-2 rounded-xl border p-3">
    <legend class="font-bold">Royal soundscape</legend>
    <button
      v-if="!audio.enabled"
      type="button"
      class="rh-btn rh-btn--small"
      @click="audio.unlock()"
    >
      Enable audio
    </button>
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        :checked="audio.prefs.muted"
        @change="audio.update({ muted: !audio.prefs.muted })"
      />
      Mute all game audio
    </label>
    <label class="grid gap-1">
      <span>Music {{ Math.round(audio.prefs.music * 100) }}%</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="audio.prefs.music"
        @input="setLevel('music', $event)"
      />
    </label>
    <label class="grid gap-1">
      <span>Sound effects {{ Math.round(audio.prefs.effects * 100) }}%</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="audio.prefs.effects"
        @input="setLevel('effects', $event)"
      />
    </label>
    <small
      >Music pauses during learning questions and when the game is
      hidden.</small
    >
  </fieldset>
</template>

<script setup lang="ts">
import { useRulerHookedAudioStore } from '~/stores/rulerHookedAudioStore'

const audio = useRulerHookedAudioStore()

function setLevel(channel: 'music' | 'effects', event: Event) {
  audio.update({ [channel]: (event.target as HTMLInputElement).valueAsNumber })
}
</script>
