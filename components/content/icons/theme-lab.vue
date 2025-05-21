<!-- /components/content/icons/theme-lab.vue -->
<template>
  <div class="theme-lab w-full px-4 py-6 max-w-6xl mx-auto space-y-12">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-2">🎨 Theme Lab</h1>
      <p class="text-base-content/70">
        Craft, preview, and personalize your Kind Robots experience
      </p>
    </div>

    <!-- Build / Edit Theme -->
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
            v-model="customTheme[color]"
            class="input input-bordered w-full h-10 p-0 rounded-md"
          />
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="mt-4 flex flex-col sm:flex-row gap-4 items-center">
          <label class="flex gap-2 items-center">
            <span class="label-text">Set as default</span>
          </label>
          <label class="flex gap-2 items-center">
            <input type="checkbox" class="toggle" v-model="customPrefersDark" />
            <span class="label-text">Prefers dark mode</span>
          </label>
          <select v-model="customColorScheme" class="select select-bordered">
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
            v-model="customTheme[key]"
            class="input input-bordered w-full h-10"
            placeholder="e.g. 1rem or 0"
          />
        </div>

        <input
          v-model="customName"
          placeholder="Theme name"
          class="input input-bordered text-center"
        />
        <input
          v-model="customRoom"
          placeholder="Optional room (e.g. splash, editor)"
          class="input input-bordered text-center"
        />
        <button @click="saveTheme" class="btn btn-primary">
          {{ updateMode ? 'Update Theme' : 'Save Theme' }}
        </button>
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
          <button class="btn btn-primary btn-sm">Primary</button>
          <button class="btn btn-secondary btn-sm">Secondary</button>
          <button class="btn btn-accent btn-sm">Accent</button>
          <button class="btn btn-warning btn-sm">Warning</button>
          <button class="btn btn-error btn-sm">Error</button>
        </div>
      </div>
    </section>

    <!-- Explore Themes -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 class="text-xl font-semibold mb-3">🌈 Default Themes</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <magic-container
            v-for="theme in themeStore.availableThemes"
            :key="theme"
            :data-theme="theme"
            class="rounded-xl p-4 border cursor-pointer text-center hover:ring hover:ring-primary"
            @click="applyTheme(theme)"
          >
            <div class="font-mono">{{ theme }}</div>
          </magic-container>
        </div>
      </div>

      <div v-if="themeStore.sharedThemes.length">
        <h2 class="text-xl font-semibold mb-3">🌍 Shared Themes</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <magic-container
            v-for="theme in themeStore.sharedThemes"
            :key="theme.id"
            :style="getThemeStyle(theme.values as Record<string, string>)"
            class="rounded-xl p-4 border cursor-pointer hover:ring hover:ring-secondary"
            @click.ctrl="editTheme(theme)"
            @click="applyTheme(theme.name)"
          >
            <div class="font-mono text-lg">{{ theme.name }}</div>
          </magic-container>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

const customPrefersDark = ref(false)
const customColorScheme = ref<'light' | 'dark'>('light')

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

const customTheme = ref<Record<string, string>>(
  Object.fromEntries([...colorKeys, ...extraVars].map((key) => [key, ''])),
)

const customName = ref('')
const customRoom = ref('')
const selectedThemeId = ref<number | null>(null)
const updateMode = ref(false)
const applyAfterSave = ref(true)

const useCustom = computed({
  get: () => themeStore.showCustom,
  set: (val) => themeStore.setShowCustom(val),
})

const applyTheme = (themeName: string) => {
  themeStore.changeTheme(themeName)
  milestoneStore.rewardMilestone(9)
}

function isValidColor(val: string) {
  return (
    typeof val === 'string' &&
    (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val) ||
      /^oklch\(.+\)$/.test(val))
  )
}

const previewStyle = computed(() => {
  const vars = Object.entries(customTheme.value)
    .filter(([, val]) => isValidColor(val))
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
  return `padding: 1rem; ${vars}`
})

function hexToRgb(hex: string) {
  if (!isValidColor(hex)) {
    console.warn('Invalid hex value:', hex)
    return '255 255 255'
  }

  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

const saveTheme = async () => {
  if (!customName.value) return

  const theme = {
    name: customName.value.trim(),
    values: sanitizeThemeValues(customTheme.value),
    room: customRoom.value.trim() || undefined,
    isPublic: false,
    prefersDark: customPrefersDark.value,
    colorScheme: customColorScheme.value,
  }

  try {
    if (updateMode.value && selectedThemeId.value) {
      await themeStore.updateTheme(selectedThemeId.value, theme)
    } else {
      await themeStore.addTheme(theme)
    }

    if (applyAfterSave.value) {
      themeStore.changeTheme(theme.name)
    }

    milestoneStore.rewardMilestone(9)
    customName.value = ''
    customRoom.value = ''
    selectedThemeId.value = null
    updateMode.value = false
  } catch (e) {
    console.error('Theme save failed', e)
  }
}

function editTheme(theme: Theme) {
  customName.value = theme.name
  customRoom.value = theme.room || ''
  customPrefersDark.value = theme.prefersDark || false
  customColorScheme.value = theme.colorScheme === 'dark' ? 'dark' : 'light'

  const validTheme =
    theme.values && typeof theme.values === 'object'
      ? sanitizeThemeValues(theme.values as Record<string, string>)
      : {}

  customTheme.value = Object.fromEntries([
    ...colorKeys.map((key) => [key, '#ffffff']),
    ...extraVars.map((key) => [key, '']), // these can remain blank safely
  ])

  selectedThemeId.value = theme.id || null
  updateMode.value = true
}

function resetThemeForm() {
  customName.value = ''
  customRoom.value = ''
  customPrefersDark.value = false
  customColorScheme.value = 'light'
  updateMode.value = false
  selectedThemeId.value = null
  customTheme.value = Object.fromEntries([
    ...colorKeys.map((key) => [key, '#ffffff']),
    ...extraVars.map((key) => [key, '']), // these can remain blank safely
  ])
}

function sanitizeThemeValues(
  values: Record<string, string>,
): Record<string, string> {
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

function labelFromKey(key: string) {
  return key.replace('--color-', '').replaceAll('-', ' ')
}

function getThemeStyle(values: Record<string, string>) {
  return Object.entries(values)
    .filter(([, val]) => isValidColor(val))
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
}
</script>
