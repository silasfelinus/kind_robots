<!-- /components/content/icons/theme-menu.vue -->

<template>
  <div class="theme-menu flex flex-col gap-8 px-4 py-6 max-w-5xl mx-auto">
    <!-- Section: Build Your Own Theme -->
    <div
      class="bg-base-200 border border-base-content p-4 rounded-2xl shadow-md"
    >
      <h2 class="text-xl font-bold mb-4">🎨 Make Your Own Theme</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="color in colorKeys"
          :key="color"
          class="flex items-center gap-2"
        >
          <label class="w-28 font-medium capitalize">{{ color }}</label>
          <input
            type="color"
            v-model="customTheme[color]"
            class="input input-bordered w-full h-10 p-0"
          />
        </div>
      </div>

      <!-- Name + Save -->
      <div
        class="mt-4 flex flex-col sm:flex-row gap-2 items-center justify-between"
      >
        <input
          v-model="customName"
          placeholder="Theme name"
          class="input input-bordered w-full sm:max-w-xs text-center"
        />
        <button @click="saveTheme" class="btn btn-primary btn-sm">
          Save Theme
        </button>
      </div>

      <!-- Live Preview -->
      <div class="mt-4 border rounded-xl p-4" :style="previewStyle">
        <div class="text-xl font-semibold">Live Preview</div>
        <p class="text-base mt-2">
          This is how your theme might feel. Test the colors here before saving.
        </p>
        <div class="mt-2 flex gap-2">
          <button class="btn btn-primary btn-sm">Primary</button>
          <button class="btn btn-secondary btn-sm">Secondary</button>
          <button class="btn btn-accent btn-sm">Accent</button>
          <button class="btn btn-warning btn-sm">Warning</button>
          <button class="btn btn-error btn-sm">Error</button>
        </div>
      </div>
    </div>

    <!-- Section: Available Themes -->
    <div
      class="bg-base-200 border border-base-content p-4 rounded-2xl shadow-md"
    >
      <h2 class="text-xl font-bold mb-4">🌈 Default Themes</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <magic-container
          v-for="theme in themeStore.availableThemes"
          :key="theme"
          :data-theme="theme"
          class="rounded-xl p-4 border shadow-sm transition-all cursor-pointer text-center"
          @click="applyTheme(theme)"
        >
          <div class="text-lg font-mono">{{ theme }}</div>
        </magic-container>
      </div>
    </div>

    <!-- Section: Shared Themes -->
    <div
      v-if="themeStore.sharedThemes.length"
      class="bg-base-200 border border-base-content p-4 rounded-2xl shadow-md"
    >
      <h2 class="text-xl font-bold mb-4">🌍 Shared Themes</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <magic-container
          v-for="theme in themeStore.sharedThemes"
          :key="theme.id"
          :style="getThemeStyle(getSafeThemeValues(theme.values))"
          class="rounded-xl p-4 border shadow-sm cursor-pointer"
          @click="applyTheme(theme.name)"
        >
          <div class="font-mono text-lg">{{ theme.name }}</div>
        </magic-container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

// 🔧 COLOR KEYS
const colorKeys = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'base-100',
  'base-200',
  'base-300',
  'info',
  'success',
  'warning',
  'error',
]

function getSafeThemeValues(val: unknown): Record<string, string> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

const customTheme = ref<Record<string, string>>(
  Object.fromEntries(colorKeys.map((key) => [key, '#ffffff'])),
)
const customName = ref('')

// 🔁 Computed style block for preview
const previewStyle = computed(() => {
  const vars = Object.entries(customTheme.value)
    .map(([key, val]) => `--${convertToDaisyVar(key)}: ${hexToRgb(val)}`)
    .join('; ')
  return `background-color: var(--b1); color: var(--n); padding: 1rem; ${vars}`
})

const convertToDaisyVar = (key: string) => {
  const map: Record<string, string> = {
    primary: 'p',
    secondary: 's',
    accent: 'a',
    neutral: 'n',
    'base-100': 'b1',
    'base-200': 'b2',
    'base-300': 'b3',
    info: 'in',
    success: 'su',
    warning: 'wa',
    error: 'er',
  }
  return map[key] || key
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

// 🌈 Save a custom theme
const saveTheme = async () => {
  if (!customName.value) return
  const newTheme = {
    name: customName.value.trim(),
    values: { ...customTheme.value },
    isPublic: false,
  }
  try {
    await $fetch('/api/themes', {
      method: 'POST',
      body: newTheme,
    })
    customName.value = ''
    milestoneStore.rewardMilestone(9)
    await themeStore.getThemes()
  } catch (e) {
    console.error('Theme save failed', e)
  }
}

// 🎯 Apply theme
const applyTheme = (theme: string) => {
  themeStore.changeTheme(theme)
  milestoneStore.rewardMilestone(9)
}

const getThemeStyle = (values: Record<string, string>) => {
  const entries = Object.entries(values)
    .map(([key, val]) => `--${convertToDaisyVar(key)}: ${hexToRgb(val)}`)
    .join('; ')
  return `padding: 1rem; ${entries}`
}
</script>
