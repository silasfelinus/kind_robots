<!-- /components/slime-city-quick-settings.vue -->
<!-- In-play settings gear for the Clash HUD (main-game standard: settings reachable
     mid-game). Opens a small panel over the board without leaving or pausing the fight;
     every toggle writes the same store-owned, device-local preference as the title
     settings screen, so nothing here has its own state to drift.
     Silas, 2026-11-24 PT: "Forfeit is a button in settings control. One simple
     control panel." A host passes its own actions (back, forfeit) in the default
     slot; `up` opens the panel above a gear that sits at the foot of a rail. -->
<template>
  <div class="scq" data-testid="slime-quick-settings">
    <button
      ref="gearButton"
      type="button"
      :class="
        header
          ? 'btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 bg-base-100 xl:size-12'
          : 'scq-gear'
      "
      :aria-expanded="open"
      aria-controls="slime-quick-settings-panel"
      aria-label="Game settings"
      title="Game settings"
      data-testid="slime-quick-settings-gear"
      @click="open = !open"
    >
      <Icon
        name="kind-icon:settings"
        :class="header ? 'kr-icon-5 xl:size-6' : 'scq-icon'"
      />
    </button>
    <div
      v-if="open"
      id="slime-quick-settings-panel"
      class="scq-panel"
      :class="{ up }"
      role="dialog"
      aria-label="Game settings"
      data-testid="slime-quick-settings-panel"
      @keydown.esc.stop="close"
    >
      <h3>SETTINGS</h3>
      <p>Changes apply now. Your fight keeps going.</p>
      <button
        type="button"
        :aria-pressed="sound.sound"
        data-testid="slime-quick-sound"
        @click="sound.setSound(!sound.sound)"
      >
        SOUND · {{ sound.sound ? 'ON' : 'OFF' }}
      </button>
      <button
        type="button"
        :aria-pressed="sound.music"
        :disabled="!sound.sound"
        data-testid="slime-quick-music"
        @click="sound.setMusic(!sound.music)"
      >
        MUSIC · {{ sound.music ? 'ON' : 'OFF' }}
      </button>
      <button
        type="button"
        :aria-pressed="sound.effects"
        :disabled="!sound.sound"
        data-testid="slime-quick-effects"
        @click="sound.setEffects(!sound.effects)"
      >
        EFFECTS · {{ sound.effects ? 'ON' : 'OFF' }}
      </button>
      <button
        type="button"
        :aria-pressed="lab.reducedMotion"
        data-testid="slime-quick-reduced-motion"
        @click="lab.setReducedMotion(!lab.reducedMotion)"
      >
        REDUCED MOTION · {{ lab.reducedMotion ? 'ON' : 'OFF' }}
      </button>
      <div
        class="scq-speed"
        role="group"
        aria-label="Clash speed"
        data-testid="slime-quick-clash-speed"
      >
        <button
          v-for="speed in CLASH_SPEEDS"
          :key="speed"
          type="button"
          :aria-pressed="lab.clashSpeed === speed"
          :data-testid="`slime-quick-speed-${speed}`"
          @click="lab.setClashSpeed(speed)"
        >
          {{ speed.toUpperCase() }}
        </button>
      </div>
      <button
        type="button"
        :aria-pressed="lab.largeText"
        data-testid="slime-quick-large-text"
        @click="lab.setLargeText(!lab.largeText)"
      >
        LARGE TEXT · {{ lab.largeText ? 'ON' : 'OFF' }}
      </button>
      <button
        type="button"
        :aria-pressed="lab.highContrast"
        data-testid="slime-quick-high-contrast"
        @click="lab.setHighContrast(!lab.highContrast)"
      >
        HIGH CONTRAST · {{ lab.highContrast ? 'ON' : 'OFF' }}
      </button>
      <slot />
      <button
        type="button"
        class="scq-resume"
        data-testid="slime-quick-resume"
        @click="close"
      >
        BACK TO THE FIGHT
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSlimeCityStore } from '~/stores/slimeCity'
import { useSlimeCitySoundStore } from '~/stores/slimeCitySound'
import { CLASH_SPEEDS } from '~/stores/helpers/slimeCityClashPreference'

withDefaults(defineProps<{ up?: boolean; header?: boolean }>(), {
  up: false,
  header: false,
})
const lab = useSlimeCityStore()
const sound = useSlimeCitySoundStore()
const open = ref(false)
const gearButton = ref<HTMLButtonElement | null>(null)

onMounted(() => {
  lab.hydrateReducedMotion()
  lab.hydrateClashSpeed()
  lab.hydrateLargeText()
  lab.hydrateHighContrast()
})

function close(): void {
  open.value = false
  gearButton.value?.focus()
}
</script>

<style scoped>
.scq {
  position: relative;
  display: inline-flex;
}
.scq-gear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border: 1px solid #5c99917a;
  border-radius: 0.45rem;
  background: #10231f;
  color: #dfff93;
}
.scq-gear[aria-expanded='true'] {
  border-color: #b9f151;
  color: #b9f151;
}
.scq-gear:focus-visible,
.scq-panel button:focus-visible {
  outline: 2px solid #b9f151;
  outline-offset: 2px;
}
.scq-icon {
  width: 1.1rem;
  height: 1.1rem;
}
.scq-panel {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 14rem;
  max-width: calc(100vw - 1rem);
  padding: 0.6rem;
  border: 1px solid #38877a;
  border-radius: 0.7rem;
  background: #061418f2;
  box-shadow: 0 0.6rem 1.6rem #000a;
  text-align: left;
}
.scq-panel.up {
  top: auto;
  bottom: calc(100% + 0.35rem);
}
.scq-panel h3 {
  margin: 0;
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  color: #9ad9cb;
}
.scq-panel p {
  margin: 0 0 0.2rem;
  font-size: 0.6rem;
  color: #c7d8d2;
}
.scq-panel button {
  min-height: 2rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid #5c99917a;
  border-radius: 0.4rem;
  background: #10231f;
  color: #e8f5ef;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-align: left;
}
.scq-speed {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
}
.scq-panel .scq-speed button {
  text-align: center;
}
.scq-panel .scq-speed button[aria-pressed='true'] {
  border-color: #b9f151;
  color: #b9f151;
}
.scq-panel button[aria-pressed='true'] {
  border-color: #b9f151;
  color: #b9f151;
}
.scq-panel button:disabled {
  opacity: 0.5;
}
.scq-panel .scq-resume {
  margin-top: 0.2rem;
  text-align: center;
  background: #1d3a1a;
  color: #dfff93;
}
</style>
