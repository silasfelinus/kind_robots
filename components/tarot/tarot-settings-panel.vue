<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTarotReaderStore } from '~/stores/tarotReaderStore'
import { useUserStore } from '~/stores/userStore'

const store = useTarotReaderStore()
const userStore = useUserStore()
const confirmReset = ref(false)

const SYNC_LABEL: Record<string, string> = {
  off: 'Not syncing',
  idle: 'Ready',
  syncing: 'Syncing…',
  synced: 'Synced to your account',
  error: 'Sync failed; saved on this device',
}
const syncLabel = computed(() => SYNC_LABEL[store.accountStatus] ?? '')

function reset() {
  if (!confirmReset.value) {
    confirmReset.value = true
    return
  }
  store.resetProgress()
  confirmReset.value = false
}
</script>

<template>
  <form
    class="grid max-w-xl gap-4 text-sm"
    aria-label="Kind Tarot settings"
    @submit.prevent
  >
    <fieldset class="grid gap-2">
      <legend class="mb-1 text-xs font-black uppercase tracking-wider">
        Sound
      </legend>
      <label class="flex items-center gap-3">
        <input
          type="checkbox"
          class="toggle toggle-sm toggle-primary"
          :checked="store.settings.musicOn"
          @change="
            store.updateSettings({
              musicOn: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        <span class="w-24">Music</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="range range-xs flex-1"
          aria-label="Music volume"
          :value="store.settings.musicVolume"
          @input="
            store.updateSettings({
              musicVolume: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </label>
      <label class="flex items-center gap-3">
        <input
          type="checkbox"
          class="toggle toggle-sm toggle-primary"
          :checked="store.settings.sfxOn"
          @change="
            store.updateSettings({
              sfxOn: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        <span class="w-24">Sound effects</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="range range-xs flex-1"
          aria-label="Sound effects volume"
          :value="store.settings.sfxVolume"
          @input="
            store.updateSettings({
              sfxVolume: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </label>
    </fieldset>

    <fieldset class="grid gap-2">
      <legend class="mb-1 text-xs font-black uppercase tracking-wider">
        Reading
      </legend>
      <label class="flex items-center gap-3">
        <span class="w-24">Text size</span>
        <select
          class="select select-bordered select-sm"
          :value="store.settings.textSize"
          @change="
            store.updateSettings({
              textSize: ($event.target as HTMLSelectElement).value as
                'sm' | 'md' | 'lg',
            })
          "
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </label>
      <label class="flex items-center gap-3">
        <span class="w-24">Card reveal</span>
        <select
          class="select select-bordered select-sm"
          :value="store.settings.revealSpeed"
          @change="
            store.updateSettings({
              revealSpeed: ($event.target as HTMLSelectElement).value as
                'slow' | 'normal' | 'fast',
            })
          "
        >
          <option value="slow">Slow and dramatic</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </label>
    </fieldset>

    <fieldset class="grid gap-2">
      <legend class="mb-1 text-xs font-black uppercase tracking-wider">
        Comfort
      </legend>
      <label class="flex items-center gap-3">
        <input
          type="checkbox"
          class="toggle toggle-sm"
          :checked="store.settings.reducedMotion"
          @change="
            store.updateSettings({
              reducedMotion: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        Reduced motion (no flips or animation)
      </label>
      <label class="flex items-center gap-3">
        <input
          type="checkbox"
          class="toggle toggle-sm"
          :checked="store.settings.highContrast"
          @change="
            store.updateSettings({
              highContrast: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        High contrast
      </label>
    </fieldset>

    <fieldset class="grid gap-2">
      <legend class="mb-1 text-xs font-black uppercase tracking-wider">
        Your account
      </legend>
      <label v-if="userStore.isLoggedIn" class="flex items-center gap-3">
        <input
          type="checkbox"
          class="toggle toggle-sm toggle-primary"
          :checked="store.settings.accountSync"
          @change="
            store.setAccountSync(($event.target as HTMLInputElement).checked)
          "
        />
        <span class="flex-1">Keep birth charts and progress in my account</span>
        <span class="text-xs opacity-75" aria-live="polite">{{
          syncLabel
        }}</span>
      </label>
      <p class="text-xs opacity-75">
        <template v-if="userStore.isLoggedIn">
          With this on, your charts, settings and studied cards follow you to
          every device. Turning it off removes the copy from your account and
          keeps everything on this device.
        </template>
        <template v-else>
          Charts and settings are saved in this browser. Sign in to keep them on
          every device.
        </template>
      </p>
    </fieldset>

    <fieldset class="grid gap-2 rounded-xl border border-error/40 p-3">
      <legend class="px-1 text-xs font-black uppercase tracking-wider">
        Reset
      </legend>
      <p class="text-xs opacity-75">
        Forget the birth charts, studied cards and settings, here and in your
        account sync. Your collection, achievements and chat stay as they are.
      </p>
      <div class="flex gap-2">
        <button
          class="btn btn-sm"
          :class="confirmReset ? 'btn-error' : 'btn-outline btn-error'"
          type="button"
          @click="reset"
        >
          {{
            confirmReset ? 'Tap again to forget everything' : 'Reset progress'
          }}
        </button>
        <button
          v-if="confirmReset"
          class="btn btn-ghost btn-sm"
          type="button"
          @click="confirmReset = false"
        >
          Cancel
        </button>
      </div>
    </fieldset>
  </form>
</template>
