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
          @click="handleInspectTheme(theme)"
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

    <!-- Inspect Modal -->
    <dialog v-if="inspectValues" class="modal modal-open">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-2">Theme Values</h3>
        <pre
          class="bg-base-300 text-sm overflow-auto rounded-lg p-4 max-h-[60vh] whitespace-pre-wrap"
          >{{ inspectValues }}
        </pre>
        <div class="modal-action">
          <button class="btn" @click="inspectValues = null">Close</button>
        </div>
      </div>
    </dialog>
  </section>
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
    themeError.value = `❌ Failed to apply theme\n${result.message}\n\n${JSON.stringify(theme, null, 2)}`
  } else {
    themeError.value = ''
    milestoneStore.rewardMilestone(9)
  }
}

function handleInspectTheme(theme: Theme) {
  const result = themeStore.setActiveTheme(theme)
  if (!result.success) {
    themeError.value = `❌ Failed to inspect theme\n${result.message}`
    return
  }
  try {
    const values = themeStore.getThemeValues()
    inspectValues.value = JSON.stringify(values, null, 2)
    milestoneStore.rewardMilestone(9)
  } catch (err) {
    themeError.value = `❌ Failed to inspect theme\n${(err as Error).message}`
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
