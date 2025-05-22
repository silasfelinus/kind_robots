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
          class="rounded-xl p-4 border cursor-pointer hover:ring hover:ring-secondary"
          @click.ctrl="editTheme(theme)"
          @click="applyTheme(theme.name)"
        >
          <div class="font-mono text-lg">{{ theme.name }}</div>
        </magic-container>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

const applyTheme = (themeName: string) => {
  themeStore.changeTheme(themeName)
  milestoneStore.rewardMilestone(9)
}
</script>
