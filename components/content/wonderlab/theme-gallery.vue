<!-- /components/content/themes/theme-gallery.vue -->
<template>
  <div class="overflow-y-auto max-h-[calc(100vh-4rem)] px-4 py-6">
    <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Default Themes -->
      <div>
        <h2 class="text-xl font-semibold mb-3">🌈 Default Themes</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <magic-container
            v-for="theme in themeStore.daisyuiThemes"
            :key="theme"
            :data-theme="theme"
            class="rounded-xl p-4 border cursor-pointer text-center hover:ring hover:ring-primary"
            @click="setTheme(theme)"
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
            :data-theme="'custom-preview-' + theme.id"
            class="relative rounded-xl p-4 border cursor-pointer group hover:ring hover:ring-secondary"
            @click="setTheme(theme)"
          >
            <div
              class="w-full h-full flex items-center justify-center font-mono text-lg text-center"
            >
              {{ theme.name }}
            </div>
            <button
              class="absolute top-2 right-2 btn btn-xs btn-warning opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="editTheme(theme)"
            >
              ✏️ Edit
            </button>
          </magic-container>
        </div>

        <!-- Info + Errors -->
        <div class="col-span-full space-y-4 mt-6">
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
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/content/themes/theme-gallery.vue

import { ref, computed, watchEffect } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useHead } from '#imports'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()
const themeError = ref('')
const inspectValues = ref<string | null>(null)

function safeThemeValues(val: unknown): Record<string, string> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

function setTheme(theme: string | Theme) {
  const input =
    typeof theme === 'string'
      ? theme
      : {
          name: theme.name,
          prefersDark: theme.prefersDark,
          colorScheme: theme.colorScheme,
          isPublic: theme.isPublic,
          room: theme.room || '',
          values: safeThemeValues(theme.values),
        }

  try {
    const result = themeStore.setActiveTheme(input)
    if (!result.success) {
      themeError.value = `❌ Failed to apply theme\n${result.message}`
      inspectValues.value = null
    } else {
      themeError.value = ''
      inspectValues.value = JSON.stringify(themeStore.getThemeValues(), null, 2)
      milestoneStore.rewardMilestone(9)
    }
  } catch (err) {
    themeError.value = `❌ setTheme crashed:\n${(err as Error).message}`
  }
}

function editTheme(theme: Theme) {
  try {
    themeStore.themeForm = {
      id: theme.id,
      name: theme.name,
      prefersDark: theme.prefersDark,
      colorScheme: theme.colorScheme,
      isPublic: theme.isPublic,
      room: theme.room || '',
      values: safeThemeValues(theme.values),
    }
    themeError.value = ''
  } catch (err) {
    themeError.value = `❌ editTheme crashed:\n${(err as Error).message}`
  }
}

const sharedThemeStyles = computed(() =>
  themeStore.sharedThemes
    .map((theme) => {
      const values = safeThemeValues(theme.values)
      const selector = `[data-theme="custom-preview-${theme.id}"]`
      const entries = Object.entries(values)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')
      return `${selector} {\n${entries}\n}`
    })
    .join('\n\n'),
)

watchEffect(() => {
  if (themeStore.sharedThemes.length) {
    useHead({
      style: [
        {
          key: 'custom-theme-preview',
          tagPriority: 'low',
          textContent: sharedThemeStyles.value,
        },
      ],
    })
  }
})
</script>
