<template>
  <div class="overflow-y-auto max-h-[calc(100vh-4rem)] px-4 py-6">
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

      <!-- Full Width Info + Error Block -->
      <div class="col-span-full space-y-4">
        <div
          v-if="inspectValues"
          class="bg-base-100 border border-base-300 rounded-xl p-4 whitespace-pre-wrap text-sm overflow-auto max-h-[40vh]"
        >
          <h3 class="text-lg font-bold mb-2">🎨 Selected Theme Info</h3>
          <pre>{{ inspectValues }}</pre>
        </div>
        <p
          v-if="themeError"
          class="p-3 text-sm text-error bg-error/10 border border-error rounded-xl whitespace-pre-wrap"
        >
          {{ themeError }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { getThemeStyle, hexToRgb } from '@/utils/helpers/themeHelpers'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()
const themeError = ref('')
const inspectValues = ref<string | null>(null)

function handleSetTheme(theme: string | Theme) {
  const result = themeStore.setActiveTheme(theme)
  if (!result.success) {
    themeError.value = `❌ Failed to apply theme\n${result.message}`
    inspectValues.value = null
  } else {
    themeError.value = ''
    try {
      inspectValues.value = JSON.stringify(themeStore.getThemeValues(), null, 2)
      milestoneStore.rewardMilestone(9)
    } catch (err) {
      themeError.value = `❌ Failed to load theme info\n${(err as Error).message}`
    }
  }
}

function editTheme(theme: Theme) {
  try {
    themeStore.themeForm = { ...theme }
  } catch (err) {
    themeError.value = `❌ Failed to edit theme\n${(err as Error).message}`
  }
}
</script>
