<template>
  <dialog
    ref="sheet"
    class="modal"
    aria-labelledby="shifting-desks-settings-heading"
    @close="confirmingReset = false"
  >
    <div
      class="modal-box flex max-h-[92dvh] w-[min(96vw,48rem)] max-w-none flex-col gap-3 bg-base-100 p-3 sm:p-5"
    >
      <header class="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p
            class="font-mono text-[10px] font-black uppercase tracking-widest text-warning"
          >
            Consolidated Wellness &amp; Defense
          </p>
          <h2
            id="shifting-desks-settings-heading"
            class="font-mono text-xl font-black uppercase"
          >
            Employee accommodations
          </h2>
          <p class="text-xs opacity-75">
            Your preferences survive promotion, termination and reloading.
          </p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" @click="close">
          Close
        </button>
      </header>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3"
        >
          <label
            v-for="field in fields"
            :key="field.key"
            class="flex flex-col gap-1 rounded-xl bg-base-200 p-3"
          >
            <span class="text-sm font-bold">{{ field.label }}</span>
            <select
              class="select select-bordered w-full"
              :aria-label="field.label"
              :value="store.settings[field.key]"
              @change="updateChoice(field.key, $event)"
            >
              <option
                v-for="option in field.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <section
          class="rounded-xl bg-base-200 p-3"
          aria-label="Sound preferences"
        >
          <h3 class="text-sm font-black uppercase">Audio</h3>
          <p class="mt-1 text-xs opacity-70">
            This game has no soundtrack or sound effects yet. These volumes are
            saved for when its audio is introduced.
          </p>
          <label
            v-for="volume in volumes"
            :key="volume.key"
            class="mt-3 flex items-center gap-3"
          >
            <span class="w-28 text-sm font-semibold">{{ volume.label }}</span>
            <input
              type="range"
              class="range range-warning range-sm min-w-0 flex-1"
              min="0"
              max="100"
              step="5"
              :aria-label="volume.label + ' volume'"
              :value="store.settings[volume.key]"
              @input="updateVolume(volume.key, $event)"
            />
            <output class="w-10 text-right font-mono text-xs">
              {{ store.settings[volume.key] }}%
            </output>
          </label>
        </section>

        <section class="rounded-xl bg-base-200 p-3">
          <h3 class="mb-2 text-sm font-black uppercase">
            Illustration edition
          </h3>
          <shifting-desks-style-picker class="h-44 rounded-xl sm:h-56" />
        </section>

        <section class="rounded-xl border border-warning/30 bg-base-200 p-3">
          <h3 class="text-sm font-black uppercase">Personnel records transfer</h3>
          <p class="mt-1 text-xs opacity-75">
            Copy a backup to keep your current shift, endings and employee dossiers
            when changing browsers. Import replaces this browser's game progress.
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline btn-sm" @click="makeBackup">
              Prepare backup
            </button>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              :disabled="!backupText"
              @click="restoreBackup"
            >
              {{ confirmingImport ? 'Confirm: replace saved progress' : 'Import backup' }}
            </button>
          </div>
          <label class="mt-2 block text-xs font-semibold" for="shifting-backup">
            Backup text
          </label>
          <textarea
            id="shifting-backup"
            v-model="backupText"
            class="textarea textarea-bordered mt-1 h-24 w-full font-mono text-xs"
            placeholder="Prepare a backup or paste a saved backup here"
            @input="confirmingImport = false"
          />
          <p v-if="backupMessage" class="mt-1 text-xs" role="status">
            {{ backupMessage }}
          </p>
        </section>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="store.resetSettings()"
          >
            Restore display defaults
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="confirmingReset ? 'btn-error' : 'btn-outline btn-error'"
            @click="reset"
          >
            {{
              confirmingReset
                ? 'Confirm: erase all local game progress'
                : 'Erase local game progress'
            }}
          </button>
        </div>
        <p v-if="confirmingReset" class="text-xs text-error" role="alert">
          This clears your current run, ending gallery, milestones and locally
          saved Personnel Archive. Display settings remain intact.
        </p>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit">Close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'
import type { DeskSettings } from '~/utils/shiftingDesks/preferences'

const store = useShiftingDesksStore()
const emit = defineEmits<{ reset: [] }>()
const sheet = ref<HTMLDialogElement | null>(null)
const confirmingReset = ref(false)
const confirmingImport = ref(false)
const backupText = ref('')
const backupMessage = ref('')

const fields = [
  {
    key: 'textSize',
    label: 'Story text size',
    options: [
      { value: 'normal', label: 'Comfortable' },
      { value: 'large', label: 'Large' },
      { value: 'extra-large', label: 'Extra large' },
    ],
  },
  {
    key: 'readingSpeed',
    label: 'Card transition speed',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'fast', label: 'Fast' },
      { value: 'instant', label: 'Instant' },
    ],
  },
  {
    key: 'motion',
    label: 'Motion',
    options: [
      { value: 'system', label: 'Follow device preference' },
      { value: 'reduced', label: 'Reduce animation' },
    ],
  },
  {
    key: 'contrast',
    label: 'Contrast',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'high', label: 'High' },
    ],
  },
] as const

const volumes = [
  { key: 'musicVolume', label: 'Music' },
  { key: 'soundVolume', label: 'Effects' },
] as const

function updateChoice(key: keyof DeskSettings, event: Event): void {
  store.setSetting(key, (event.target as HTMLSelectElement).value)
}

function updateVolume(key: 'musicVolume' | 'soundVolume', event: Event): void {
  store.setSetting(key, (event.target as HTMLInputElement).valueAsNumber)
}

function makeBackup(): void {
  backupText.value = store.exportBackup()
  confirmingImport.value = false
  backupMessage.value = 'Backup prepared. Copy this text to a safe location.'
}

function restoreBackup(): void {
  if (!confirmingImport.value) {
    confirmingImport.value = true
    backupMessage.value = 'Import will replace this browser’s saved game. Press again to confirm.'
    return
  }
  confirmingImport.value = false
  if (!store.importBackup(backupText.value)) {
    backupMessage.value = 'Invalid backup or browser storage unavailable. Your progress was not replaced.'
    return
  }
  backupMessage.value = 'Personnel records restored. Your current shift is ready.'
}

function open(): void {
  confirmingReset.value = false
  sheet.value?.showModal()
}

function close(): void {
  sheet.value?.close()
}

function reset(): void {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    return
  }
  store.resetProgress()
  emit('reset')
  close()
}

defineExpose({ open })
</script>
