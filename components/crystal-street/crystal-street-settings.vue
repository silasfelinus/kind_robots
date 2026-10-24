<template>
  <section class="kr-panes grid-cols-1" aria-label="Settings">
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">Settings</h2>
      </div>
      <div
        class="kr-pane-scroll grid grid-cols-1 content-start gap-3 p-3 @3xl:grid-cols-2"
        data-testid="cs-settings"
      >
        <fieldset
          v-for="group in GROUPS"
          :key="group.key"
          class="cs-card space-y-2 p-3"
        >
          <legend class="cs-kicker px-1">{{ group.label }}</legend>
          <p class="text-xs opacity-80">{{ group.hint }}</p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="option in group.options"
              :key="option.value"
              type="button"
              class="btn btn-sm rounded-2xl"
              :class="
                store.settings[group.key] === option.value
                  ? 'btn-primary'
                  : 'btn-ghost border-base-content/20'
              "
              :aria-pressed="store.settings[group.key] === option.value"
              @click="pick(group.key, option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>

        <fieldset class="cs-card space-y-2 p-3 @3xl:col-span-2">
          <legend class="cs-kicker px-1">Saved on this device</legend>
          <p class="text-xs opacity-80">
            Your week in progress and your scrapbook live in this browser only.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline rounded-2xl"
              :disabled="!store.run || !!store.run.ending"
              @click="confirmAbandon"
            >
              {{
                abandonArmed
                  ? 'Tap again to give up the week'
                  : 'Give up the week in progress'
              }}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline btn-error rounded-2xl"
              :disabled="!store.scrapbook.runs.length"
              @click="confirmReset"
            >
              {{
                resetArmed
                  ? 'Tap again to erase every memory'
                  : 'Erase the scrapbook'
              }}
            </button>
          </div>
          <p class="text-xs opacity-70">
            Erasing the scrapbook also locks the monster gallery and endings
            again.
          </p>
        </fieldset>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  useCrystalStreetStore,
  type CrystalStreetSettings,
} from '~/stores/crystalStreetStore'

type Group = {
  [K in keyof CrystalStreetSettings]: {
    key: K
    label: string
    hint: string
    options: { value: CrystalStreetSettings[K]; label: string }[]
  }
}[keyof CrystalStreetSettings]

const GROUPS: Group[] = [
  {
    key: 'textSize',
    label: 'Text size',
    hint: 'Scales every word and button on this screen.',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
  {
    key: 'contrast',
    label: 'Contrast',
    hint: 'High contrast makes panels solid and dims nothing.',
    options: [
      { value: 'normal', label: 'Neon' },
      { value: 'high', label: 'High contrast' },
    ],
  },
  {
    key: 'motion',
    label: 'Motion',
    hint: 'Reduced motion stops fades, flickers and blinking eyes.',
    options: [
      { value: 'full', label: 'Full' },
      { value: 'reduced', label: 'Reduced' },
    ],
  },
]

const store = useCrystalStreetStore()
const abandonArmed = ref(false)
const resetArmed = ref(false)

function pick(key: keyof CrystalStreetSettings, value: string): void {
  store.setSetting(key, value as never)
}

function confirmAbandon(): void {
  if (!abandonArmed.value) {
    abandonArmed.value = true
    return
  }
  abandonArmed.value = false
  store.abandon()
}

function confirmReset(): void {
  if (!resetArmed.value) {
    resetArmed.value = true
    return
  }
  resetArmed.value = false
  store.resetScrapbook()
}
</script>
