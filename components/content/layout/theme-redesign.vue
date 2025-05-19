<template>
  <div class="theme-lab w-full px-4 py-6 max-w-6xl mx-auto space-y-12">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-2">🎨 Theme Lab</h1>
      <p class="text-base-content/70">
        Craft, preview, and personalize your Kind Robots experience
      </p>
    </div>

    <!-- Mode Toggle -->
    <div class="flex justify-center gap-4">
      <button
        v-for="mode in ['default', 'user', 'custom']"
        :key="mode"
        @click="themeStore.setThemeSource('main', { [mode]: currentThemeRef })"
        class="btn btn-outline"
        :class="{ 'btn-active': activeMode === mode }"
      >
        Use {{ mode }} theme
      </button>
    </div>

    <!-- Build New Theme -->
    <section
      class="bg-base-200 border border-base-content p-6 rounded-2xl shadow-lg"
    >
      <h2 class="text-2xl font-semibold mb-4">Create Your Own Theme</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="color in colorKeys"
          :key="color"
          class="flex items-center gap-2"
        >
          <label class="w-32 font-medium capitalize text-sm">{{ color }}</label>
          <input
            type="color"
            v-model="customTheme[color]"
            class="input input-bordered w-full h-10 p-0 rounded-md"
          />
        </div>
      </div>

      <div
        class="mt-4 flex flex-col sm:flex-row gap-2 justify-between items-center"
      >
        <input
          v-model="customName"
          placeholder="New theme name"
          class="input input-bordered text-center w-full sm:max-w-xs"
        />
        <button @click="saveTheme" class="btn btn-primary">Save Theme</button>
      </div>

      <div class="mt-4 border rounded-xl p-4" :style="previewStyle">
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
            :style="getThemeStyle(theme.values)"
            class="rounded-xl p-4 border cursor-pointer hover:ring hover:ring-secondary"
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
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

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

const customTheme = ref<Record<string, string>>(
  Object.fromEntries(colorKeys.map((key) => [key, '#ffffff'])),
)
const customName = ref('')

const activeMode = ref<'default' | 'user' | 'custom'>('default')
const currentThemeRef = computed(() => themeStore.mainTheme)

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

const saveTheme = async () => {
  if (!customName.value) return
  const newTheme = {
    name: customName.value.trim(),
    values: { ...customTheme.value },
    isPublic: false,
  }
  try {
    await $fetch('/api/themes', { method: 'POST', body: newTheme })
    customName.value = ''
    milestoneStore.rewardMilestone(9)
    await themeStore.fetchPublicThemes()
  } catch (e) {
    console.error('Theme save failed', e)
  }
}

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
