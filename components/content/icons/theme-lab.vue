<!-- /components/content/icons/theme-lab.vue -->
<template>
  <div class="w-full h-full overflow-y-auto">
    <div class="theme-lab w-full px-4 py-6 max-w-6xl mx-auto space-y-12">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-2">🎨 Theme Lab</h1>
        <p class="text-base-content/70">
          Craft, preview, and personalize your Kind Robots experience
        </p>
      </div>

      <section
        class="bg-base-200 border border-base-content p-6 rounded-2xl shadow-lg"
      >
        <h2 class="text-2xl font-semibold mb-4">Create or Edit Your Theme</h2>

<!-- Color Inputs -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  <div
    v-for="color in colorKeys"
    :key="color"
    class="relative group w-full h-12 rounded-md overflow-hidden border border-base-content"
  >
    <!-- Color Picker -->
    <input
      type="color"
      :value="themeForm.values?.[color] || '#ffffff'"
      @input="onColorInput($event, color)"
      class="w-full h-full appearance-none cursor-pointer bg-transparent"
    />

    <!-- Overlayed Label -->
    <span
      class="absolute bottom-0 left-0 w-full bg-base-300/80 text-xs text-center text-base-content py-0.5 font-medium capitalize truncate pointer-events-none"
    >
      {{ labelFromKey(color) }}
    </span>
  </div>
</div>


        <!-- Random Theme Button -->
        <button class="btn btn-accent mt-4" @click="fillWithRandomTheme">
          🎲 Randomize Theme
        </button>

        <!-- Extra Vars -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Prefers Dark Toggle -->
          <label class="flex gap-2 items-center text-sm font-medium">
            <input
              type="checkbox"
              class="toggle"
              v-model="themeForm.prefersDark"
            />
            <span>Prefers dark mode</span>
          </label>

          <!-- Sliders and Extras -->
          <label
            v-for="key in extraVars"
            :key="key"
            class="flex flex-col gap-1 text-sm font-medium"
          >
            <span>{{ key.replace('--', '') }}</span>

            <div v-if="isSliderKey(key)" class="w-full">
              <input
                type="range"
                class="range range-sm"
                :min="getSliderMeta(key).min"
                :max="getSliderMeta(key).max"
                :step="getSliderMeta(key).step"
                v-model="themeForm.values[key]"
              />
              <div class="text-xs text-right text-base-content/70">
                {{ themeForm.values[key] }}
              </div>
            </div>

            <input
              v-else
              type="text"
              v-model="themeForm.values[key]"
              class="input input-bordered w-full h-10"
              placeholder="e.g. 1rem or 0"
            />
          </label>

          <!-- Theme Name -->
          <label class="w-full text-sm font-medium flex flex-col gap-1">
            Theme Name
            <input
              v-model="themeForm.name"
              placeholder="Theme name"
              class="input input-bordered text-center"
            />
          </label>

          <!-- Save Button -->
          <button @click="saveTheme" class="btn btn-primary">
            {{ updateMode ? 'Update Theme' : 'Save Theme' }}
          </button>

          <!-- Error Message -->
          <p
            v-if="themeError"
            class="mt-4 p-3 text-sm text-error bg-error/10 border border-error rounded-xl"
          >
            {{ themeError }}
          </p>
        </div>

        <!-- Toggles -->
        <div
          class="form-control col-span-1 sm:col-span-3 flex flex-col sm:flex-row gap-4 items-center mt-6"
        >
          <label class="label gap-2">
            <input type="checkbox" class="toggle" v-model="applyAfterSave" />
            <span class="label-text">Apply after saving</span>
          </label>
          <label class="label gap-2">
            <input
              type="checkbox"
              class="toggle"
              v-model="themeForm.isPublic"
            />
            <span class="label-text">Make this theme public</span>
          </label>
          <label class="label gap-2">
            <input type="checkbox" class="toggle" v-model="useCustom" />
            <span class="label-text">Use page themes (showCustom)</span>
          </label>
        </div>

        <!-- Reset Button -->
        <button class="btn btn-outline mt-4" @click="resetThemeForm">
          Reset
        </button>

        <!-- Live Preview -->
<div
  class="mt-6 border rounded-xl p-6 space-y-4 transition-all duration-300"
  :style="`${previewStyle}; border-radius: var(--radius-box, 0.5rem); border-width: var(--border, 1px); box-shadow: var(--shadow, 0 1px 2px rgba(0, 0, 0, 0.1));`"
>
  <h3 class="text-lg font-bold">Live Preview</h3>

  <div class="flex gap-2 flex-wrap">
    <button class="btn btn-base-100 btn-sm">Base-100</button>
    <button class="btn btn-primary btn-sm">Primary</button>
    <button class="btn btn-secondary btn-sm">Secondary</button>
    <button class="btn btn-accent btn-sm">Accent</button>
    <button class="btn btn-info btn-sm">Info</button>
    <button class="btn btn-success btn-sm">Success</button>
    <button class="btn btn-warning btn-sm">Warning</button>
    <button class="btn btn-error btn-sm">Error</button>
  </div>

  <div class="bg-base-100 p-4 rounded-box border border-base-300 space-y-3 text-base-content">
    <p class="text-sm">
      This card uses <code class="text-xs">--radius-box</code>,
      <code class="text-xs">--border</code>, and
      <code class="text-xs">--shadow</code>.
    </p>
    <input
      class="input input-bordered w-full"
      placeholder="Example input"
      readonly
    />
    <progress class="progress w-full progress-primary" value="40" max="100" />
    <div class="flex justify-between text-xs text-base-content/70">
      <span>Font: <code>{{ themeForm.values['--text-base'] || 'default' }}</code></span>
      <span>Padding: <code>{{ themeForm.values['--padding-card'] || 'default' }}</code></span>
    </div>
  </div>
</div>

      </section>

      <!-- Theme Gallery -->
      <theme-gallery />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import {
  colorKeys,
  extraVars,
  isValidColor,
  labelFromKey,
  buildThemePayload,
  getRandomHex,
  defaultExtraVars,
} from '@/utils/helpers/themeHelpers'

const themeStore = useThemeStore()
const themeForm = themeStore.themeForm as Record<string, any>
const themeError = ref('')

if (!themeForm.values) {
  themeForm.values = {
    ...Object.fromEntries(colorKeys.map((key) => [key, '#ffffff'])),
    ...defaultExtraVars,
  }
  fillWithRandomTheme()
  themeForm.name ||= `MyTheme-${Date.now()}`
}

const updateMode = computed(() => !!themeForm.id)

const applyAfterSave = computed({
  get: () => themeForm.applyAfterSave ?? true,
  set: (val) => (themeForm.applyAfterSave = val),
})

const useCustom = computed({
  get: () => themeStore.showCustom,
  set: (val) => themeStore.setShowCustom(val),
})

watch(
  () => themeForm.prefersDark,
  (val) => {
    themeForm.colorScheme = val ? 'dark' : 'light'
  },
)

function isSliderKey(key: string): boolean {
  return (
    key.includes('radius') ||
    key.includes('size') ||
    key === '--depth' ||
    key === '--noise' ||
    key === '--border'
  )
}

function getSliderMeta(key: string) {
  if (key === '--depth') return { min: 0, max: 10, step: 1 }
  if (key === '--noise') return { min: 0, max: 1, step: 0.1 }
  if (key === '--border') return { min: 0, max: 10, step: 1 }
  if (key.includes('radius') || key.includes('size'))
    return { min: 0, max: 2, step: 0.05 }
  return { min: 0, max: 1, step: 0.1 }
}

function fillWithRandomTheme() {
  themeForm.values ||= {}
  for (const key of colorKeys) {
    themeForm.values[key] = getRandomHex()
  }
}

function onColorInput(e: Event, color: string) {
  const target = e.target as HTMLInputElement | null
  if (target && themeForm.values) {
    themeForm.values[color] = target.value
  }
}

function resetThemeForm() {
  Object.assign(themeForm, {
    id: undefined,
    name: '',
    room: '',
    isPublic: true,
    prefersDark: false,
    colorScheme: 'light',
    values: {
      ...Object.fromEntries(colorKeys.map((key) => [key, '#ffffff'])),
      ...defaultExtraVars,
    },
  })
}

async function saveTheme() {
  if (!themeForm.name) return
  try {
    const payload = buildThemePayload(themeForm)
    if (themeForm.id) {
      await themeStore.updateTheme(themeForm.id, payload)
    } else {
      await themeStore.addTheme(payload)
    }
    if (applyAfterSave.value) {
      const { success, message } = themeStore.setActiveTheme(themeForm.name)
      themeError.value = success ? '' : message || 'Unknown error'
    } else {
      themeError.value = ''
    }
    resetThemeForm()
  } catch (e) {
    console.error('Theme save failed', e)
    themeError.value = 'Theme save failed: ' + String(e)
  }
}

const previewStyle = computed(() => {
  const entries = themeForm.values as Record<string, string>
  const vars = Object.entries(entries || {})
    .filter(([, val]) => isValidColor(val))
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
  return `padding: 1rem; ${vars}`
})
</script>
