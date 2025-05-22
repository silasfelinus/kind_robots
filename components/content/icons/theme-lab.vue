<template>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="color in colorKeys"
          :key="color"
          class="flex items-center gap-2"
        >
          <label class="w-40 font-medium capitalize text-sm">{{
            labelFromKey(color)
          }}</label>
          <input
            type="color"
            :value="themeForm.values?.[color] || '#ffffff'"
            @input="onColorInput($event, color)"
            class="input input-bordered w-full h-10 p-0 rounded-md"
          />
        </div>
      </div>

      <button class="btn btn-accent" @click="fillWithRandomTheme">
        🎲 Randomize Theme
      </button>

      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="mt-4 flex flex-col sm:flex-row gap-4 items-center">
          <label class="flex gap-2 items-center">
            <input
              type="checkbox"
              class="toggle"
              v-model="themeForm.prefersDark"
            />
            <span class="label-text">Prefers dark mode</span>
          </label>
          <select
            v-model="themeForm.colorScheme"
            class="select select-bordered"
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </div>

        <div
          v-for="key in extraVars"
          :key="key"
          class="flex items-center gap-2"
        >
          <label class="w-40 font-medium text-sm">{{
            key.replace('--', '')
          }}</label>
          <input
            type="text"
            v-model="themeForm.values[key]"
            class="input input-bordered w-full h-10"
            placeholder="e.g. 1rem or 0"
          />
        </div>

        <input
          v-model="themeForm.name"
          placeholder="Theme name"
          class="input input-bordered text-center"
        />
        <input
          v-model="themeForm.room"
          placeholder="Optional room (e.g. splash, editor)"
          class="input input-bordered text-center"
        />
        <button @click="saveTheme" class="btn btn-primary">
          {{ updateMode ? 'Update Theme' : 'Save Theme' }}
        </button>

        <p
          v-if="themeError"
          class="mt-4 p-3 text-sm text-error bg-error/10 border border-error rounded-xl"
        >
          {{ themeError }}
        </p>
      </div>

      <div
        class="form-control col-span-1 sm:col-span-3 flex flex-col sm:flex-row gap-4 items-center mt-4"
      >
        <label class="label gap-2">
          <input type="checkbox" class="toggle" v-model="applyAfterSave" />
          <span class="label-text">Apply after saving</span>
        </label>
        <label class="label gap-2">
          <input type="checkbox" class="toggle" v-model="useCustom" />
          <span class="label-text">Use page themes (showCustom)</span>
        </label>
      </div>

      <button class="btn btn-outline" @click="resetThemeForm">Reset</button>

      <div
        class="mt-4 border rounded-xl p-4 transition-all duration-300"
        :style="`${previewStyle}; border-radius: var(--radius-box); border-width: var(--border);`"
      >
        <h3 class="text-lg font-bold">Live Preview</h3>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-base-100 btn-sm">Base-100</button>
          <button class="btn btn-primary btn-sm">Primary</button>
          <button class="btn btn-secondary btn-sm">Secondary</button>
          <button class="btn btn-accent btn-sm">Accent</button>
          <button class="btn btn-accent btn-sm">Info</button>
          <button class="btn btn-accent btn-sm">Success</button>
          <button class="btn btn-warning btn-sm">Warning</button>
          <button class="btn btn-error btn-sm">Error</button>
        </div>
      </div>
    </section>

    <theme-gallery />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const themeStore = useThemeStore()
const themeForm = themeStore.themeForm as Record<string, any>
const themeError = ref('')

const colorKeys = [
  '--color-primary',
  '--color-primary-content',
  '--color-secondary',
  '--color-secondary-content',
  '--color-accent',
  '--color-accent-content',
  '--color-neutral',
  '--color-neutral-content',
  '--color-base-100',
  '--color-base-200',
  '--color-base-300',
  '--color-base-content',
  '--color-info',
  '--color-info-content',
  '--color-success',
  '--color-success-content',
  '--color-warning',
  '--color-warning-content',
  '--color-error',
  '--color-error-content',
]

const extraVars = [
  '--radius-selector',
  '--radius-field',
  '--radius-box',
  '--size-selector',
  '--size-field',
  '--border',
  '--depth',
  '--noise',
]
if (!themeForm.values) {
  themeForm.values = Object.fromEntries([
    ...colorKeys.map((key) => [key, '#ffffff']),
    ...extraVars.map((key) => [key, '']),
  ])
  fillWithRandomTheme()
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

function getRandomHex(): string {
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  )
}

function sanitizeThemeValues(values: Record<string, string>) {
  const sanitized: Record<string, string> = {}
  for (const [key, val] of Object.entries(values)) {
    if (key.startsWith('--color-') && isValidColor(val)) {
      sanitized[key] = val
    } else if (
      extraVars.includes(key) &&
      typeof val === 'string' &&
      val.length
    ) {
      sanitized[key] = val
    }
  }
  return sanitized
}

function isValidColor(val: string) {
  return (
    typeof val === 'string' &&
    (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val) ||
      /^oklch\(.+\)$/.test(val))
  )
}

const previewStyle = computed(() => {
  const entries = themeForm.values as Record<string, string>
  const vars = Object.entries(entries || {})
    .filter(([, val]) => isValidColor(val))
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
  return `padding: 1rem; ${vars}`
})

function labelFromKey(key: string) {
  return key.replace('--color-', '').replaceAll('-', ' ')
}

function resetThemeForm() {
  Object.assign(themeForm, {
    id: undefined,
    name: '',
    room: '',
    prefersDark: false,
    colorScheme: 'light',
    values: Object.fromEntries([
      ...colorKeys.map((key) => [key, '#ffffff']),
      ...extraVars.map((key) => [key, '']),
    ]),
  })
}

async function saveTheme() {
  if (!themeForm.name) return
  const payload = {
    name: themeForm.name.trim(),
    values: sanitizeThemeValues(themeForm.values || {}),
    room: themeForm.room?.trim() || undefined,
    isPublic: false,
    prefersDark: themeForm.prefersDark,
    colorScheme: themeForm.colorScheme,
  }
  try {
    if (themeForm.id) {
      await themeStore.updateTheme(themeForm.id, payload)
    } else {
      await themeStore.addTheme(payload)
    }
    if (applyAfterSave.value) {
      const { success, message } = themeStore.setActiveTheme(themeForm.name)
      if (!success && message) {
        themeError.value = message
      } else {
        themeError.value = ''
      }
    } else {
      themeError.value = ''
    }
    resetThemeForm()
  } catch (e) {
    console.error('Theme save failed', e)
    themeError.value = 'Theme save failed: ' + String(e)
  }
}
</script>
