<!-- /components/content/themes/theme-manager.vue -->
<template>
  <dashboard-shell
    title="Theme Manager"
    :summary="managerSummary"
    :tabs="dashboardTabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading themes..."
    nav-grid-class="xl:grid-cols-3"
    @set-tab="setTab"
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

      <span class="badge badge-neutral"> {{ allThemeCount }} themes </span>
    </template>

    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview' || currentTab === 'gallery'"
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div
          class="flex shrink-0 flex-wrap items-center gap-4 border-b border-base-300 bg-base-200 px-4 py-3"
        >
          <input
            v-model="searchQuery"
            class="input input-bordered input-sm min-w-44 flex-1 rounded-xl bg-base-100 focus:border-primary"
            placeholder="Search themes…"
            type="search"
          />

          <label
            class="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-sm opacity-80 hover:opacity-100"
          >
            <input
              v-model="showDarkOnly"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            <span>Dark only</span>
          </label>
        </div>

        <div
          v-if="filteredDaisyThemes.length"
          class="grid min-h-0 flex-1 gap-2 overflow-y-auto p-4 pb-8"
          style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))"
        >
          <button
            v-for="theme in filteredDaisyThemes"
            :key="theme"
            :data-theme="theme"
            class="group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-base-200 px-2 py-3 text-center transition-all duration-150 hover:-translate-y-0.5"
            :class="
              themeStore.currentTheme === theme
                ? 'border-accent shadow-md'
                : 'border-base-300 hover:border-accent/60 hover:shadow-sm'
            "
            type="button"
            @click="applyTheme(theme)"
          >
            <span
              v-if="themeStore.currentTheme === theme"
              class="absolute right-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-accent-content"
            >
              ✓
            </span>

            <span
              class="w-full truncate text-center font-mono text-[11px] font-semibold text-base-content"
            >
              {{ theme }}
            </span>

            <div class="flex gap-1">
              <span class="h-3.5 w-3.5 rounded-full bg-primary" />
              <span class="h-3.5 w-3.5 rounded-full bg-secondary" />
              <span class="h-3.5 w-3.5 rounded-full bg-accent" />
              <span class="h-3.5 w-3.5 rounded-full bg-neutral" />
            </div>
          </button>
        </div>

        <div
          v-else
          class="flex min-h-80 flex-1 flex-col items-center justify-center gap-3 text-sm opacity-60"
        >
          <p>No themes match your search.</p>

          <button
            class="btn btn-outline btn-sm rounded-xl"
            type="button"
            @click="searchQuery = ''"
          >
            Clear search
          </button>
        </div>
      </section>

      <section
        v-else-if="currentTab === 'shared'"
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div
          v-if="themeStore.sharedThemes.length"
          class="grid min-h-0 flex-1 gap-3 overflow-y-auto p-5 pb-8"
          style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"
        >
          <button
            v-for="theme in themeStore.sharedThemes"
            :key="theme.id"
            class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition-all duration-150 hover:-translate-y-0.5"
            :class="
              themeStore.currentTheme === theme.name
                ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                : 'border-transparent hover:border-amber-400 hover:shadow-md'
            "
            :style="{
              background: swatchesFor(theme).base100,
              color: swatchesFor(theme).neutral,
            }"
            type="button"
            @click="applySharedTheme(theme)"
          >
            <span
              v-if="themeStore.currentTheme === theme.name"
              class="absolute right-1.5 top-1.5 z-10 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white"
              style="background: #f59e0b"
            >
              Active
            </span>

            <div
              class="flex flex-col gap-1.5 p-2.5"
              :style="{ background: swatchesFor(theme).base200 }"
            >
              <div class="flex gap-1">
                <span
                  v-for="[label, color] in [
                    ['P', swatchesFor(theme).primary],
                    ['S', swatchesFor(theme).secondary],
                    ['A', swatchesFor(theme).accent],
                  ]"
                  :key="label"
                  class="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                  :style="{ background: color }"
                >
                  {{ label }}
                </span>
              </div>

              <div
                class="h-1.5 w-full overflow-hidden rounded-full"
                :style="{ background: swatchesFor(theme).base300 }"
              >
                <div
                  class="h-full w-[45%] rounded-full"
                  :style="{ background: swatchesFor(theme).primary }"
                />
              </div>

              <div
                class="h-4 rounded border"
                :style="{
                  background: swatchesFor(theme).base100,
                  borderColor: swatchesFor(theme).base300,
                }"
              />
            </div>

            <div
              v-if="!swatchesFor(theme).hasColors"
              class="flex h-2.5 items-center justify-center"
              :style="{ background: swatchesFor(theme).base300 }"
            >
              <span class="font-mono text-[8px] opacity-40">no preview</span>
            </div>

            <div v-else class="flex h-2.5">
              <span
                class="flex-1"
                :style="{ background: swatchesFor(theme).primary }"
              />
              <span
                class="flex-1"
                :style="{ background: swatchesFor(theme).secondary }"
              />
              <span
                class="flex-1"
                :style="{ background: swatchesFor(theme).accent }"
              />
              <span
                class="flex-1"
                :style="{ background: swatchesFor(theme).neutral }"
              />
              <span
                class="flex-1"
                :style="{ background: swatchesFor(theme).base300 }"
              />
            </div>

            <div
              class="border-t p-2"
              :style="{
                borderColor: swatchesFor(theme).base300,
                background: swatchesFor(theme).base100,
              }"
            >
              <div class="truncate text-center font-mono text-xs font-bold">
                {{ theme.name }}
              </div>

              <div
                v-if="theme.tagline"
                class="truncate text-center text-[10px] opacity-60"
              >
                {{ theme.tagline }}
              </div>

              <div class="mt-1 flex justify-center gap-1">
                <span
                  v-if="theme.isPublic"
                  class="rounded px-1 py-0.5 font-mono text-[9px] opacity-60"
                  :style="{ background: swatchesFor(theme).base200 }"
                >
                  Public
                </span>

                <span
                  v-if="theme.prefersDark"
                  class="rounded px-1 py-0.5 font-mono text-[9px] text-white"
                  :style="{ background: swatchesFor(theme).neutral }"
                >
                  Dark
                </span>
              </div>
            </div>

            <button
              class="absolute left-1.5 top-1.5 rounded border bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-80 hover:opacity-100!"
              type="button"
              @click.stop="editSharedTheme(theme)"
            >
              Edit
            </button>
          </button>
        </div>

        <div
          v-else
          class="flex min-h-80 flex-1 flex-col items-center justify-center gap-3 p-8 text-center opacity-60"
        >
          <div class="text-5xl opacity-20">◐</div>

          <p class="text-lg font-bold">No shared themes yet</p>

          <p class="max-w-xs text-sm">
            Create a custom theme in Forge and save it as public.
          </p>

          <button
            class="btn btn-outline btn-sm rounded-xl"
            type="button"
            @click="setTab('custom')"
          >
            Go to Forge
          </button>
        </div>
      </section>

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
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useNavStore } from '@/stores/navStore'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const dashboardKey = 'theme' as const

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()
const navStore = useNavStore()

const searchQuery = ref('')
const showDarkOnly = ref(false)
const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const forgeKey = ref(0)

const dashboardTabs = computed(() => {
  return [
    ...navStore.getDashboardTabs(dashboardKey),
    {
      key: 'shared',
      label: 'Shared',
      icon: 'kind-icon:gallery',
      title: 'Shared Themes',
      summary: 'Browse public custom themes from the community.',
    },
  ]
})

const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const DARK_THEMES = new Set([
  'dark',
  'night',
  'coffee',
  'halloween',
  'forest',
  'black',
  'luxury',
  'dracula',
  'business',
  'synthwave',
  'cyberpunk',
  'dim',
  'sunset',
])

const filteredDaisyThemes = computed(() => {
  let list = (themeStore.daisyuiThemes ?? []) as string[]
  const q = searchQuery.value.trim().toLowerCase()

  if (q) {
    list = list.filter((theme) => theme.toLowerCase().includes(q))
  }

  if (showDarkOnly.value) {
    list = list.filter((theme) => DARK_THEMES.has(theme))
  }

  return list
})

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

function safeValues(value: unknown): Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {}
}

const KEY_ALIASES: Record<string, string[]> = {
  primary: ['primary', '--primary', 'p', '--p'],
  secondary: ['secondary', '--secondary', 's', '--s'],
  accent: ['accent', '--accent', 'a', '--a'],
  neutral: ['neutral', '--neutral', 'n', '--n'],
  'base-100': ['base-100', '--base-100', 'b1', '--b1', 'base100'],
  'base-200': ['base-200', '--base-200', 'b2', '--b2', 'base200'],
  'base-300': ['base-300', '--base-300', 'b3', '--b3', 'base300'],
}

function resolveKey(
  values: Record<string, string>,
  canonical: string,
): string | undefined {
  for (const alias of KEY_ALIASES[canonical] ?? [canonical, `--${canonical}`]) {
    if (values[alias] !== undefined) return values[alias]
  }
}

function swatchesFor(theme: Theme) {
  const values = safeValues(theme.values)

  const get = (canonical: string) => {
    return resolveKey(values, canonical)
  }

  return {
    primary: get('primary') ?? '#570df8',
    secondary: get('secondary') ?? '#f000b8',
    accent: get('accent') ?? '#1fb2a5',
    neutral: get('neutral') ?? '#3d4451',
    base100: get('base-100') ?? '#ffffff',
    base200: get('base-200') ?? '#e5e7eb',
    base300: get('base-300') ?? '#d1d5db',
    hasColors: Object.keys(values).length > 0,
  }
}

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)
}

async function refreshManagerData() {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([navStore.initialize(), themeStore.getThemes()])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh themes.'
  } finally {
    isLoadingManager.value = false
  }
}

async function applyTheme(name: string) {
  const result = await themeStore.setActiveTheme(name)

  if (result.success) {
    milestoneStore.rewardMilestone(9)
  }
}

async function applySharedTheme(theme: Theme) {
  const result = await themeStore.setActiveTheme({
    id: theme.id,
    userId: theme.userId,
    name: theme.name,
    prefersDark: theme.prefersDark,
    colorScheme: theme.colorScheme,
    isPublic: theme.isPublic,
    tagline: theme.tagline,
    room: theme.room ?? '',
    values: safeValues(theme.values),
  })

  if (result.success) {
    milestoneStore.rewardMilestone(9)
  }
}

function loadThemeIntoForm(theme: Theme) {
  themeStore.themeForm.id = theme.id
  themeStore.themeForm.name = theme.name
  themeStore.themeForm.prefersDark = theme.prefersDark
  themeStore.themeForm.colorScheme = theme.colorScheme
  themeStore.themeForm.isPublic = theme.isPublic
  themeStore.themeForm.tagline = theme.tagline
  themeStore.themeForm.room = theme.room ?? ''
  themeStore.themeForm.values = safeValues(theme.values)
  forgeKey.value++
}

function editSharedTheme(theme: Theme) {
  loadThemeIntoForm(theme)
  setTab('custom')
}

function newTheme() {
  themeStore.resetThemeForm()
  forgeKey.value++
}

function onForgeSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!id) return

  const theme = themeStore.sharedThemes.find((item: Theme) => item.id === id)

  if (theme) {
    loadThemeIntoForm(theme)
  }

  target.value = ''
}

onMounted(async () => {
  await refreshManagerData()
})
</script>
