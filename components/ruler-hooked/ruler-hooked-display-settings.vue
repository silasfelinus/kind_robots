<template>
  <div class="grid gap-3">
    <RulerHookedAudioSettings />
    <fieldset class="grid gap-3 rounded-xl border p-3">
      <legend class="font-bold">Reading and comfort</legend>
      <label class="grid gap-1">
        <span>Story text size</span>
        <select
          class="rh-input"
          :value="display.prefs.readingSize"
          @change="setReadingSize"
        >
          <option value="standard">Standard</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra large</option>
        </select>
      </label>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="display.prefs.highContrast"
          @change="
            display.update({ highContrast: !display.prefs.highContrast })
          "
        />
        High-contrast reading panels
      </label>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="display.prefs.reducedMotion"
          @change="
            display.update({ reducedMotion: !display.prefs.reducedMotion })
          "
        />
        Reduce decorative motion
      </label>
      <p class="text-sm">
        Story scenes stay on screen until you advance. Fishing timing indicators
        remain active; system reduced-motion preferences are also respected.
      </p>
      <button type="button" class="rh-btn" @click="display.reset()">
        Restore display defaults
      </button>
      <p class="text-sm">Display preferences are saved on this device.</p>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedDisplayStore } from '~/stores/rulerHookedDisplayStore'
import type { RoyalReadingSize } from '~/utils/rulerHooked/displayPrefs'

const display = useRulerHookedDisplayStore()

function setReadingSize(event: Event) {
  display.update({
    readingSize: (event.target as HTMLSelectElement).value as RoyalReadingSize,
  })
}
</script>
