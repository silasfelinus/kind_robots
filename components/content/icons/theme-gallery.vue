<template>
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
          class="relative rounded-xl p-4 border cursor-pointer group hover:ring hover:ring-secondary"
          @click="applyTheme(theme.name)"
        >
          <div class="font-mono text-lg">{{ theme.name }}</div>
          <button
            class="absolute top-2 right-2 btn btn-xs btn-warning opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="themeStore.setActiveTheme(theme)"
          >
            ✏️ Edit
          </button>
        </magic-container>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

const applyTheme = (themeName: string) => {
  themeStore.setActiveTheme(themeName)
  milestoneStore.rewardMilestone(9)
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
