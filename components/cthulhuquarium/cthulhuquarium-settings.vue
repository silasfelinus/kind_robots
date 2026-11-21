<!-- components/cthulhuquarium/cthulhuquarium-settings.vue
     The settings panel (conductor cthulhuquarium/t-100, the main-game
     standard): sound volume, how fast lines are written out, text size, high
     contrast and motion. Kept per browser by the store; nothing here touches
     the tank, so there is no reset (a destructive tank reset was not asked
     for). Emits close; the store owns every value. -->
<template>
  <Teleport to="body">
    <dialog
      class="modal modal-open"
      data-theme="cthulhuquarium"
      aria-modal="true"
      aria-labelledby="cq-settings-title"
      @cancel.prevent="close"
    >
      <div
        class="modal-box cq-settings flex max-w-md flex-col gap-4 bg-base-100 text-base-content"
      >
        <header class="flex items-center justify-between gap-3">
          <h3 id="cq-settings-title" class="font-serif text-2xl font-black">
            Settings
          </h3>
          <button
            ref="closeRef"
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            aria-label="Close settings"
            @click="close"
          >
            <Icon name="kind-icon:close" class="size-5" />
          </button>
        </header>

        <!-- cthulhuquarium/t-107: shown only once a second style is on offer. -->
        <cthulhuquarium-style-picker />

        <label class="flex flex-col gap-1">
          <span class="text-sm font-bold">Sound volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            class="range range-primary range-sm"
            :value="Math.round(settings.volume * 100)"
            :aria-valuetext="`${Math.round(settings.volume * 100)} percent`"
            @input="onVolume"
          />
        </label>

        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-bold">Text speed</legend>
          <div class="join w-full" role="radiogroup" aria-label="Text speed">
            <button
              v-for="speed in SPEEDS"
              :key="speed.value"
              type="button"
              role="radio"
              class="btn join-item btn-sm flex-1"
              :class="{ 'btn-primary': settings.textSpeed === speed.value }"
              :aria-checked="settings.textSpeed === speed.value"
              @click="tankStore.updateSettings({ textSpeed: speed.value })"
            >
              {{ speed.label }}
            </button>
          </div>
        </fieldset>

        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-bold">Motion</legend>
          <div class="join w-full" role="radiogroup" aria-label="Motion">
            <button
              v-for="motion in MOTIONS"
              :key="motion.value"
              type="button"
              role="radio"
              class="btn join-item btn-sm flex-1"
              :class="{ 'btn-primary': settings.motion === motion.value }"
              :aria-checked="settings.motion === motion.value"
              @click="tankStore.updateSettings({ motion: motion.value })"
            >
              {{ motion.label }}
            </button>
          </div>
        </fieldset>

        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-bold">Music</span>
          <input
            type="checkbox"
            class="toggle toggle-primary"
            :checked="settings.music"
            @change="tankStore.updateSettings({ music: checked($event) })"
          />
        </label>
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-bold">Larger story text</span>
          <input
            type="checkbox"
            class="toggle toggle-primary"
            :checked="settings.largeText"
            @change="tankStore.updateSettings({ largeText: checked($event) })"
          />
        </label>
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-bold">High contrast</span>
          <input
            type="checkbox"
            class="toggle toggle-primary"
            :checked="settings.highContrast"
            @change="
              tankStore.updateSettings({ highContrast: checked($event) })
            "
          />
        </label>

        <p class="text-xs italic opacity-70">
          Saved in this browser. Your tank, fish and coins are kept on the
          server and are never touched here.
        </p>
        <button type="button" class="btn btn-primary" @click="close">
          Back to the tank
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="close">close</button>
      </form>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCthulhuquariumTankStore } from '~/stores/cthulhuquariumTankStore'
import type {
  CthulhuquariumMotionSetting as MotionSetting,
  CthulhuquariumTextSpeed as TextSpeed,
} from '~/utils/cthulhuquariumSettings'

const emit = defineEmits<{ close: []; volume: [value: number] }>()
const tankStore = useCthulhuquariumTankStore()
const settings = computed(() => tankStore.settings)

const SPEEDS: ReadonlyArray<{ value: TextSpeed; label: string }> = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
  { value: 'instant', label: 'At once' },
]
const MOTIONS: ReadonlyArray<{ value: MotionSetting; label: string }> = [
  { value: 'system', label: 'My device' },
  { value: 'reduced', label: 'Less' },
  { value: 'full', label: 'Full' },
]

function checked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked
}

function onVolume(event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100
  tankStore.updateSettings({ volume: value })
  emit('volume', value)
}

function close() {
  tankStore.closeSettings()
  emit('close')
}

// The dialog is not opened with showModal(), so the browser never sends it
// `cancel`: Esc is caught here, ahead of the console's own Esc (back).
const closeRef = ref<HTMLButtonElement | null>(null)
function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopImmediatePropagation()
  close()
}
onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  closeRef.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<style scoped>
.cq-settings fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}
</style>
