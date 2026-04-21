<!-- /components/content/themes/theme-gallery.vue -->
<template>
  <div class="overflow-y-auto max-h-[calc(100vh-4rem)] px-4 py-6">
    <section class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <h2 class="mb-3 text-xl font-semibold">🌈 Default Themes</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <magic-container
            v-for="theme in themeStore.daisyuiThemes"
            :key="theme"
            :data-theme="theme"
            class="cursor-pointer rounded-xl border p-4 text-center hover:ring hover:ring-primary"
            @click="setTheme(theme)"
          >
            <div class="font-mono">{{ theme }}</div>
          </magic-container>
        </div>
      </div>

      <div v-if="themeStore.sharedThemes.length">
        <h2 class="mb-3 text-xl font-semibold">🌍 Shared Themes</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <magic-container
            v-for="theme in themeStore.sharedThemes"
            :key="theme.id"
            :data-theme="'custom-preview-' + theme.id"
            class="group relative cursor-pointer rounded-xl border p-4 hover:ring hover:ring-secondary"
            @click="setTheme(theme)"
          >
            <div
              class="flex h-full w-full items-center justify-center text-center font-mono text-lg"
            >
              {{ theme.name }}
            </div>
            <button
              class="btn btn-warning btn-xs absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
              type="button"
              @click.stop="editTheme(theme)"
            >
              ✏️ Edit
            </button>
          </magic-container>
        </div>
      </div>
    </section>

    <section class="mt-6 space-y-4">
      <div
        v-if="inspectValues"
        class="max-h-[40vh] overflow-auto whitespace-pre-wrap rounded-xl border border-base-300 bg-base-100 p-4 text-sm"
      >
        <h3 class="mb-2 text-lg font-bold">🎨 Selected Theme Info</h3>
        <pre>{{ inspectValues }}</pre>
      </div>

      <p
        v-if="themeError"
        class="whitespace-pre-wrap rounded-xl border border-error bg-error/10 p-3 text-sm text-error"
      >
        {{ themeError }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
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

async function setTheme(theme: string | Theme) {
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
    const result = await themeStore.setActiveTheme(input)

    if (!result.success) {
      themeError.value = `❌ Failed to apply theme\n${result.message}`
      inspectValues.value = null
      return
    }

    themeError.value = ''

    const snapshot =
      typeof theme === 'string'
        ? await themeStore.getActiveThemeSnapshot(theme)
        : themeStore.themeForm

    inspectValues.value = JSON.stringify(snapshot, null, 2)
    milestoneStore.rewardMilestone(9)
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    themeError.value = `❌ editTheme crashed:\n${(err as Error).message}`
  }
}

const sharedThemeStyles = computed<string>(() => {
  return themeStore.sharedThemes
    .map((theme: Theme) => {
      const values = safeThemeValues(theme.values)
      const selector = `[data-theme="custom-preview-${theme.id}"]`
      const entries = Object.entries(values)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')
      return `${selector} {\n${entries}\n}`
    })
    .join('\n\n')
})

watchEffect(() => {
  if (!themeStore.sharedThemes.length) return

  useHead({
    style: [
      {
        key: 'custom-theme-preview',
        tagPriority: 'low',
        textContent: sharedThemeStyles.value,
      },
    ],
  })
})
</script>
