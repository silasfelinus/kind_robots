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

        <fieldset
          v-for="control in VOLUME_CONTROLS"
          :key="control.key"
          class="cs-card space-y-2 p-3"
        >
          <legend class="cs-kicker px-1">{{ control.label }}</legend>
          <label
            :for="`cs-${control.key}`"
            class="flex items-center justify-between text-xs"
          >
            <span>{{ control.hint }}</span>
            <span>{{ store.settings[control.key] }}%</span>
          </label>
          <input
            :id="`cs-${control.key}`"
            type="range"
            min="0"
            max="100"
            step="5"
            class="range range-primary range-sm w-full"
            :value="store.settings[control.key]"
            :aria-label="control.label"
            @input="setVolume(control.key, $event)"
          />
        </fieldset>

        <fieldset class="cs-card space-y-2 p-3">
          <legend class="cs-kicker px-1">About</legend>
          <p class="text-xs opacity-80">
            Who made the game, its art and its theme, and the films it remixes.
          </p>
          <button
            type="button"
            class="btn btn-sm btn-outline rounded-2xl"
            data-testid="cs-settings-credits"
            @click="$emit('credits')"
          >
            <icon name="kind-icon:star" class="h-4 w-4" /> Credits
          </button>
        </fieldset>

        <fieldset class="cs-card space-y-2 p-3 @3xl:col-span-2">
          <legend class="cs-kicker px-1">Saved progress</legend>
          <p class="text-xs opacity-80">
            {{
              store.accountOwner
                ? 'Your week and scrapbook sync to your account across devices.'
                : 'Your week and scrapbook are saved in this browser. Sign in to sync.'
            }}
          </p>
          <p v-if="store.accountOwner" role="status" class="text-xs opacity-80">
            {{ store.accountStatus }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="store.canImportDevice"
              type="button"
              class="btn btn-sm btn-outline rounded-2xl"
              @click="store.importDeviceProgress()"
            >
              Import this browser’s guest progress
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline rounded-2xl"
              data-testid="cs-settings-replay-tips"
              :disabled="!store.tipsSeen.length"
              @click="store.resetTips()"
            >
              Replay the tips
            </button>
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

type ChoiceKey = Exclude<keyof CrystalStreetSettings, VolumeKey>
type VolumeKey = 'effectsVolume' | 'musicVolume'

type Group = {
  [K in ChoiceKey]: {
    key: K
    label: string
    hint: string
    options: { value: CrystalStreetSettings[K]; label: string }[]
  }
}[ChoiceKey]

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
  {
    key: 'tips',
    label: 'Tips',
    hint: 'Short coaching notes the first time each part of the week comes up.',
    options: [
      { value: 'auto', label: 'First week' },
      { value: 'on', label: 'Always' },
      { value: 'off', label: 'Off' },
    ],
  },
  {
    key: 'sound',
    label: 'Sound',
    hint: 'Dice, card swishes, a drone at dusk and a sting for every win and loss.',
    options: [
      { value: 'on', label: 'On' },
      { value: 'off', label: 'Off' },
    ],
  },
]

const VOLUME_CONTROLS: { key: VolumeKey; label: string; hint: string }[] = [
  { key: 'effectsVolume', label: 'Effects volume', hint: 'Dice and game cues' },
  { key: 'musicVolume', label: 'Music volume', hint: 'Theme music video' },
]

defineEmits<{ credits: [] }>()

const store = useCrystalStreetStore()
const abandonArmed = ref(false)
const resetArmed = ref(false)

function setVolume(key: VolumeKey, event: Event): void {
  store.setSetting(key, Number((event.target as HTMLInputElement).value))
}

function pick(key: ChoiceKey, value: string): void {
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
