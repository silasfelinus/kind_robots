<!-- /components/content/themes/theme-manager.vue -->
<template>
  <dashboard-shell
    dashboard-key="theme"
    title="Theme Manager"
    :summary="managerSummary"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading themes..."
    nav-grid-class="xl:grid-cols-3"
    @refresh="refreshManagerData"
  >
    <template #actions>
      <span
        v-if="themeStore.currentTheme"
        class="flex items-center gap-1.5 rounded-full border border-amber-500 px-2.5 py-1 font-mono text-xs text-amber-500"
      >
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        {{ themeStore.currentTheme }}
      </span>

      <span class="badge badge-neutral">{{ allThemeCount }} themes</span>
    </template>

    <template #default="{ activeTab: currentTab, setTab: setShellTab }">
      <theme-gallery
        v-if="currentTab === 'gallery'"
        @edit="setShellTab('custom')"
      />

      <section
        v-else-if="currentTab === 'custom'"
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-base-300 bg-base-200 px-5 py-3"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="font-mono text-xs uppercase tracking-widest opacity-50"
            >
              {{ themeStore.themeForm.id ? 'Editing' : 'Creating new theme' }}
            </span>

            <span
              v-if="themeStore.themeForm.id && themeStore.themeForm.name"
              class="text-sm font-bold text-amber-500"
            >
              {{ themeStore.themeForm.name }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="themeStore.themeForm.id"
              class="btn btn-ghost btn-xs rounded-xl"
              type="button"
              @click="newTheme"
            >
              New theme instead
            </button>

            <select
              class="select select-bordered select-sm rounded-xl bg-base-100 focus:border-amber-500"
              @change="onForgeSelect"
            >
              <option value="">Edit existing theme</option>

              <option
                v-for="theme in themeStore.sharedThemes"
                :key="theme.id"
                :value="theme.id"
              >
                {{ theme.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <add-theme :key="forgeKey" />
        </div>
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown theme tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const themeStore = useThemeStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const forgeKey = ref(0)

const allThemeCount = computed(() => {
  return (
    (themeStore.daisyuiThemes?.length ?? 0) +
    (themeStore.sharedThemes?.length ?? 0)
  )
})

const managerSummary = computed(() => {
  const currentTheme = themeStore.currentTheme || 'no active theme'
  const daisyCount = themeStore.daisyuiThemes?.length ?? 0
  const sharedCount = themeStore.sharedThemes?.length ?? 0

  return `${daisyCount} DaisyUI themes and ${sharedCount} shared themes loaded. Active theme: ${currentTheme}.`
})

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

async function refreshManagerData() {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await themeStore.getThemes()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh themes.'
  } finally {
    isLoadingManager.value = false
  }
}

function loadThemeIntoForm(theme: Theme) {
  themeStore.themeForm = {
    id: theme.id,
    name: theme.name,
    prefersDark: theme.prefersDark,
    colorScheme: theme.colorScheme,
    isPublic: theme.isPublic,
    tagline: theme.tagline,
    room: theme.room ?? '',
    values: safeThemeValues(theme.values),
  }

  forgeKey.value++
}

function newTheme() {
  themeStore.resetThemeForm()
  forgeKey.value++
}

function onForgeSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!id) return

  const theme = themeStore.sharedThemes.find((item: Theme) => {
    return item.id === id
  })

  if (theme) {
    loadThemeIntoForm(theme)
  }

  target.value = ''
}

onMounted(async () => {
  await refreshManagerData()
})
</script>
