<template>
  <div
    class="absolute inset-0 z-40 grid place-items-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
    @click.self="emit('close')"
    @keydown.esc.stop="emit('close')"
  >
    <section
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eod-preferences-title"
      tabindex="-1"
      class="@container kr-scroll eod-frame w-full max-w-3xl max-h-full overflow-y-auto bg-base-100 p-4 shadow-2xl sm:p-6"
    >
      <header class="mb-5 flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-warning">
            The court's comforts
          </p>
          <h2 id="eod-preferences-title" class="font-serif text-2xl font-bold">
            Settings
          </h2>
          <p class="mt-1 text-sm opacity-75">
            Reading and motion preferences stay on this device, across your
            reigns.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          aria-label="Close settings"
          @click="emit('close')"
        >
          <Icon name="kind-icon:close" class="h-5 w-5" />
          Close
        </button>
      </header>
      <div class="grid gap-5 @sm:grid-cols-2">
        <fieldset class="space-y-2">
          <legend class="font-semibold text-warning">Story text size</legend>
          <p class="text-sm opacity-75">Dialogue, dispatches and answers.</p>
          <label
            v-for="choice in sizes"
            :key="choice.value"
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-base-content/15 p-2.5"
          >
            <input
              type="radio"
              name="eod-reading-size"
              class="radio radio-warning radio-sm"
              :value="choice.value"
              :checked="court.preferences.readingSize === choice.value"
              @change="court.setPreference('readingSize', choice.value)"
            />
            {{ choice.label }}
          </label>
        </fieldset>
        <fieldset class="space-y-2">
          <legend class="font-semibold text-warning">Reading font</legend>
          <p class="text-sm opacity-75">Choose character or clarity.</p>
          <label
            v-for="choice in fonts"
            :key="choice.value"
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-base-content/15 p-2.5"
          >
            <input
              type="radio"
              name="eod-reading-font"
              class="radio radio-warning radio-sm"
              :value="choice.value"
              :checked="court.preferences.readingFont === choice.value"
              @change="court.setPreference('readingFont', choice.value)"
            />
            {{ choice.label }}
          </label>
          <label
            class="mt-3 block font-semibold text-warning"
            for="eod-preferences-speed"
            >Dialogue speed</label
          >
          <select
            id="eod-preferences-speed"
            class="select select-bordered w-full"
            :value="court.textSpeed"
            @change="
              court.setTextSpeed(
                ($event.target as HTMLSelectElement).value as TextSpeed,
              )
            "
          >
            <option value="normal">Measured reveal</option>
            <option value="fast">Quick reveal</option>
            <option value="instant">Show all immediately</option>
          </select>
        </fieldset>
        <fieldset class="space-y-2">
          <legend class="font-semibold text-warning">
            Dialogue panel width
          </legend>
          <p class="text-sm opacity-75">
            Keep the art visible, or give the words extra space.
          </p>
          <label
            v-for="choice in widths"
            :key="choice.value"
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-base-content/15 p-2.5"
          >
            <input
              type="radio"
              name="eod-reading-width"
              class="radio radio-warning radio-sm"
              :value="choice.value"
              :checked="court.preferences.readingWidth === choice.value"
              @change="court.setPreference('readingWidth', choice.value)"
            />
            {{ choice.label }}
          </label>
        </fieldset>
        <div class="space-y-4">
          <label
            class="flex items-start gap-3 rounded-lg border border-base-content/15 p-3"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-warning mt-0.5"
              :checked="court.preferences.contrast === 'high'"
              @change="
                court.setPreference(
                  'contrast',
                  ($event.target as HTMLInputElement).checked
                    ? 'high'
                    : 'standard',
                )
              "
            />
            <span
              ><strong class="block">High contrast reading panels</strong
              ><span class="text-sm opacity-75"
                >Stronger lettering and darker text backdrops.</span
              ></span
            >
          </label>
          <label
            class="flex items-start gap-3 rounded-lg border border-base-content/15 p-3"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-warning mt-0.5"
              :checked="court.preferences.motion === 'reduced'"
              @change="
                court.setPreference(
                  'motion',
                  ($event.target as HTMLInputElement).checked
                    ? 'reduced'
                    : 'system',
                )
              "
            />
            <span
              ><strong class="block">Reduce scene motion</strong
              ><span class="text-sm opacity-75"
                >Avoid background pans and use instant dialogue reveal.</span
              ></span
            >
          </label>
        </div>
      </div>
      <div class="mt-5 rounded-lg border border-warning/30 bg-base-200 p-4">
        <p
          class="mb-2 text-xs font-bold uppercase tracking-widest text-warning"
        >
          Live reading preview
        </p>
        <p class="eod-reading italic">
          “The roads have brought three stories, Your Majesty. Only two can be
          true.”
        </p>
        <p class="eod-choice-reading mt-3 border-t border-warning/20 pt-2">
          Ask the messenger which road they took.
        </p>
      </div>
      <footer class="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          class="btn btn-outline btn-sm"
          @click="court.resetPreferences()"
        >
          Restore defaults
        </button>
        <button type="button" class="btn btn-warning" @click="emit('close')">
          Return to the court
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import type { ReadingSize, TextSpeed } from '~/stores/emperorFortressStore'
const emit = defineEmits<{ close: [] }>()
const court = useEmperorFortressStore()
const dialog = ref<HTMLElement | null>(null)
const sizes: { value: ReadingSize; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable (larger on desktop)' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra large' },
]
const fonts = [
  { value: 'serif', label: 'Literary serif' },
  { value: 'sans', label: 'Clear sans-serif' },
] as const
const widths = [
  { value: 'balanced', label: 'Balanced art and story' },
  { value: 'wide', label: 'Wider reading panel' },
] as const
onMounted(() => dialog.value?.focus())
</script>
