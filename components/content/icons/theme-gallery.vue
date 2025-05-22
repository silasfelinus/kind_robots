<template>
  <!-- Explore Themes -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Default Themes -->
    <div>
      <h2 class="text-xl font-semibold mb-3">🌈 Default Themes</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <magic-container
          v-for="theme in themeStore.availableThemes"
          :key="theme"
          :data-theme="theme"
          class="rounded-xl p-4 border cursor-pointer text-center hover:ring hover:ring-primary"
          @click="handleSetTheme(theme)"
        >
          <div class="font-mono">{{ theme }}</div>
        </magic-container>
      </div>
    </div>

    <!-- Shared Themes -->
    <div v-if="themeStore.sharedThemes.length">
      <h2 class="text-xl font-semibold mb-3">🌍 Shared Themes</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <magic-container
          v-for="theme in themeStore.sharedThemes"
          :key="theme.id"
          :style="getThemeStyle(theme.values as Record<string, string>)"
          class="relative rounded-xl p-4 border cursor-pointer group hover:ring hover:ring-secondary"
          @click="handleSetTheme(theme)"
        >
          <div class="font-mono text-lg">{{ theme.name }}</div>
          <button
            class="absolute top-2 right-2 btn btn-xs btn-warning opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="editTheme(theme)"
          >
            ✏️ Edit
          </button>
        </magic-container>
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="themeError"
      class="col-span-2 mt-4 p-3 text-sm text-error bg-error/10 border border-error rounded-xl whitespace-pre-wrap"
    >
      {{ themeError }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()
const themeError = ref('')

function handleSetTheme(theme: string | Theme) {
  const result = themeStore.setActiveTheme(theme)
  if (!result.success) {
    themeError.value = `❌ Failed to apply theme\n${result.message}\n\n${JSON.stringify(theme, null, 2)}`
  } else {
    themeError.value = ''
    milestoneStore.rewardMilestone(9)
  }
}

function editTheme(theme: Theme) {
  try {
    themeStore.themeForm = { ...theme }
  } catch (err) {
    themeError.value = `❌ Failed to edit theme\n${(err as Error).message}`
  }
}

function hexToRgb(hex: string) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return '255 255 255'
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

function getThemeStyle(values: Record<string, string>) {
  return Object.entries(values)
    .map(([key, val]) => `${key}: ${hexToRgb(val)}`)
    .join('; ')
}
</script>
