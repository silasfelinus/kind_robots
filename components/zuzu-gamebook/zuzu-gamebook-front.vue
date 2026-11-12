<template>
  <section
    class="kr-panes mx-auto w-full max-w-[1500px] grid-cols-1 gap-3 px-3 pb-3 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,.8fr)] lg:px-8"
    aria-label="Zuzu Gamebook title screen"
    data-testid="zuzu-gamebook-title"
  >
    <figure
      class="relative min-h-[12rem] overflow-hidden rounded-2xl border border-warning/30 bg-stone-950 sm:min-h-[16rem]"
    >
      <img
        src="/zuzu-gamebook/scenes/waterhole.webp"
        alt="The desolate watering hole on the road to the Hollow Bell"
        class="absolute inset-0 size-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
      <figcaption class="absolute inset-x-0 bottom-0 space-y-1 p-4 text-stone-100 sm:p-7">
        <p class="text-[10px] font-black uppercase tracking-[.3em] text-amber-300">
          Zuzu · Koala Assassin
        </p>
        <h1 class="max-w-2xl font-serif text-3xl font-black leading-tight sm:text-5xl">
          The Bell That Never Rang
        </h1>
        <p class="max-w-md text-sm text-stone-100/85">
          Nine acts. Fifteen fates. One road through the dust.
        </p>
      </figcaption>
    </figure>

    <div class="kr-scroll min-h-0 overflow-y-auto rounded-2xl border border-warning/25 bg-base-200 p-4 sm:p-6">
      <template v-if="pane === 'home'">
        <p class="text-xs font-black uppercase tracking-widest text-warning">
          {{ current.chapter }}
        </p>
        <h2 class="mt-2 font-serif text-xl font-bold">{{ current.title }}</h2>
        <p class="mt-1 text-sm opacity-75">
          {{ store.run.visited.length }} pages turned ·
          {{ store.discovered.length }}/{{ endingCount }} endings discovered
        </p>
        <div class="mt-5 grid gap-2">
          <button
            type="button"
            class="btn btn-warning w-full justify-start"
            data-testid="zuzu-gamebook-continue"
            @click="emit('continue')"
          >
            <icon name="kind-icon:book-open" class="size-5" />
            Continue your journey
          </button>
          <button
            type="button"
            class="btn btn-outline w-full justify-start"
            data-testid="zuzu-gamebook-new"
            @click="emit('restart')"
          >
            <icon name="kind-icon:refresh" class="size-5" />
            New journey
          </button>
          <button
            type="button"
            class="btn btn-ghost w-full justify-start"
            @click="emit('ledger')"
          >
            <icon name="kind-icon:book-open" class="size-5" />
            Bell Ledger · scrapbook and saves
          </button>
          <button
            type="button"
            class="btn btn-ghost w-full justify-start"
            @click="pane = 'settings'"
          >
            Reading settings
          </button>
        </div>
        <div class="mt-5 border-t border-base-content/15 pt-4">
          <game-achievement-strip game="zuzu-gamebook" layout="icons" />
        </div>
      </template>
      <template v-else>
        <button
          type="button"
          class="btn btn-ghost btn-sm mb-3"
          @click="pane = 'home'"
        >
          <icon name="kind-icon:arrow-left" class="size-4" />
          Back to the book
        </button>
        <h2 class="font-serif text-2xl font-bold">Reading settings</h2>
        <p class="mt-1 text-xs opacity-70">
          These preferences stay on this device and apply to the reading view.
        </p>
        <ul class="mt-4 grid gap-3">
          <li v-for="key in settingKeys" :key="key">
            <label :for="'zuzu-setting-' + key" class="mb-1 block text-sm font-bold">
              {{ KIT_SETTING_LABELS[key].label }}
            </label>
            <select
              :id="'zuzu-setting-' + key"
              class="select select-bordered w-full"
              :value="kit.settings[key]"
              @change="changeSetting(key, $event)"
            >
              <option v-for="option in KIT_SETTING_OPTIONS[key]" :key="option" :value="option">
                {{ KIT_SETTING_LABELS[key].options[option] ?? option }}
              </option>
            </select>
          </li>
        </ul>
        <p class="mt-4 text-sm font-serif" :class="kit.settings.font === 'sans' ? 'font-sans' : ''">
          The wind turns a page of dust. The road is yours to choose.
        </p>
        <button type="button" class="btn btn-ghost btn-sm mt-3" @click="kit.resetSettings()">
          Reset reading preferences
        </button>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useZuzuGamebookStore } from '~/stores/zuzuGamebookStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { ENDING_IDS, scene } from '~/utils/zuzuGamebook/adventure'
import {
  KIT_SETTING_LABELS,
  KIT_SETTING_OPTIONS,
  type KitSettings,
} from '~/utils/playbookKit/settings'

const emit = defineEmits<{
  continue: []
  restart: []
  ledger: []
}>()

const store = useZuzuGamebookStore()
const kit = usePlaybookKitStore()
const pane = ref<'home' | 'settings'>('home')
const settingKeys = ['textSize', 'font', 'contrast', 'motion'] as const
type ReadingSetting = (typeof settingKeys)[number]
const endingCount = ENDING_IDS.length
const current = computed(() => scene(store.run.sceneId))

function changeSetting(key: ReadingSetting, event: Event) {
  const target = event.target as HTMLSelectElement
  kit.setSetting(key, target.value as KitSettings[ReadingSetting])
}
</script>
