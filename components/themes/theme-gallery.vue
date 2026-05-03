<!-- /components/content/themes/theme-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-4"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <h1 class="truncate text-2xl font-black text-primary">Theme Gallery</h1>

        <p class="mt-1 text-sm text-base-content/65">
          Preview, apply, and edit DaisyUI or shared Kind Robots themes.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-primary">
          {{ themeStore.daisyuiThemes.length }} default
        </span>

        <span class="badge badge-secondary">
          {{ themeStore.sharedThemes.length }} shared
        </span>

        <span v-if="activeThemeName" class="badge badge-accent">
          {{ activeThemeName }}
        </span>
      </div>
    </header>

    <section
      v-if="themeError"
      class="shrink-0 whitespace-pre-wrap rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
    >
      {{ themeError }}
    </section>

    <main class="min-h-0 flex-1 overflow-y-auto">
      <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-black text-base-content">
                Default Themes
              </h2>

              <p class="text-sm text-base-content/60">
                Built-in DaisyUI palettes.
              </p>
            </div>

            <Icon name="kind-icon:palette" class="h-7 w-7 text-primary" />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <theme-card
              v-for="theme in themeStore.daisyuiThemes"
              :key="theme"
              :theme="theme"
              :selected="activeThemeName === theme"
              :compact="true"
              :show-actions="false"
              :show-meta="false"
              @applied="handleThemeApplied"
              @error="handleThemeError"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-black text-base-content">
                Shared Themes
              </h2>

              <p class="text-sm text-base-content/60">
                Community and custom palettes.
              </p>
            </div>

            <Icon name="kind-icon:sparkles" class="h-7 w-7 text-secondary" />
          </div>

          <div
            v-if="themeStore.sharedThemes.length"
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <theme-card
              v-for="theme in themeStore.sharedThemes"
              :key="theme.id"
              :theme="theme"
              :selected="activeThemeName === theme.name"
              :compact="true"
              :show-actions="true"
              @applied="handleThemeApplied"
              @edit="handleThemeEdit"
              @error="handleThemeError"
            />
          </div>

          <div
            v-else
            class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
          >
            <Icon name="kind-icon:palette" class="h-12 w-12 text-secondary" />

            <p class="mt-2 text-lg font-bold">No shared themes yet.</p>

            <p class="mt-1 text-sm">
              The theme goblin has not published anything suspiciously tasteful.
            </p>
          </div>
        </div>
      </section>

      <section
        v-if="inspectValues"
        class="mt-6 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <h2 class="text-lg font-black text-base-content">
            Active Theme Snapshot
          </h2>

          <button
            class="btn btn-xs btn-ghost rounded-xl"
            type="button"
            @click="inspectValues = null"
          >
            Clear
          </button>
        </div>

        <pre
          class="max-h-96 overflow-auto rounded-2xl bg-base-200 p-3 text-xs text-base-content/75"
          >{{ inspectValues }}</pre
        >
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
// /components/content/themes/theme-gallery.vue
import { computed, ref, watchEffect } from 'vue'
import { useHead } from '#imports'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

const themeError = ref('')
const inspectValues = ref<string | null>(null)
const activeThemeName = ref(themeStore.themeForm?.name || '')

function safeThemeValues(value: unknown): Record<string, string> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, string>)
        : {}
    } catch {
      return {}
    }
  }

  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {}
}

function handleThemeApplied(name: string, snapshot: unknown) {
  activeThemeName.value = name
  themeError.value = ''
  inspectValues.value = JSON.stringify(snapshot, null, 2)
  milestoneStore.rewardMilestone(9)
}

function handleThemeEdit(theme: Theme) {
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
}

function handleThemeError(message: string) {
  themeError.value = `❌ ${message}`
  inspectValues.value = null
}

const sharedThemeStyles = computed(() => {
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
