<!-- /components/content/themes/theme-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      class="shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow"
    >
      <div
        class="flex flex-col gap-3 bg-linear-to-br from-primary/12 via-secondary/10 to-accent/10 p-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div v-if="showHeader" class="flex min-w-0 items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-primary shadow-sm"
          >
            <Icon name="kind-icon:paintbrush" class="h-5 w-5" />
          </span>

          <div class="min-w-0">
            <h1 class="truncate text-xl font-black text-primary sm:text-2xl">
              Theme Gallery
            </h1>

            <p
              class="mt-0.5 truncate text-xs font-semibold text-base-content/60 sm:text-sm"
            >
              Preview, apply, and tune the whole vibe grid.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label
            class="input input-sm input-bordered flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-base-100/90 sm:w-64 sm:flex-none"
          >
            <Icon name="kind-icon:search" class="h-4 w-4 opacity-55" />
            <input
              v-model="searchQuery"
              class="min-w-0"
              type="search"
              placeholder="Search themes"
            />
          </label>

          <div class="join">
            <button
              v-for="filter in themeFilters"
              :key="filter.value"
              class="btn join-item btn-sm rounded-2xl"
              :class="
                activeFilter === filter.value
                  ? 'btn-primary'
                  : 'btn-ghost bg-base-100/80'
              "
              type="button"
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>

          <span
            v-if="activeThemeName"
            class="inline-flex max-w-44 items-center gap-1.5 truncate rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-black text-accent"
          >
            <Icon name="kind-icon:check" class="h-3.5 w-3.5 shrink-0" />
            <span class="truncate">{{ activeThemeName }}</span>
          </span>

          <!--
            THREE BADGES, NOT A STATS BAND. These counts used to be a
            `grid-cols-3 divide-x` strip with its own top border -- a full row,
            each cell a big number stacked over a tiny uppercase caption, for
            three integers. Silas, 2026-08-07: "one devoted to the output count:
            default, shared, showing, that's a lot of real estate for something
            that could share the row above it."

            Same three numbers, same order, on the line that was already here.
          -->
          <span class="flex flex-wrap items-center gap-1 text-xs">
            <span class="badge badge-primary badge-sm rounded-lg">
              {{ filteredDaisyThemes.length }} default
            </span>
            <span class="badge badge-secondary badge-sm rounded-lg">
              {{ filteredSharedThemes.length }} shared
            </span>
            <span class="badge badge-accent badge-sm rounded-lg">
              {{ visibleThemeCount }} showing
            </span>
          </span>
        </div>
      </div>
    </header>

    <section
      v-if="themeError"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-3 text-sm font-semibold text-error"
    >
      <div class="flex items-start gap-2">
        <Icon name="kind-icon:alert" class="mt-0.5 h-4 w-4 shrink-0" />
        <p class="whitespace-pre-wrap">{{ themeError }}</p>
      </div>
    </section>

    <main class="min-h-0 flex-1 overflow-y-auto pr-1">
      <section class="flex flex-col gap-3">
        <section
          v-if="showDefaultThemes"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
              >
                <Icon name="kind-icon:palette" class="h-4 w-4" />
              </span>

              <div class="min-w-0">
                <h2 class="truncate text-base font-black text-base-content">
                  Default Themes
                </h2>

                <p class="truncate text-xs text-base-content/55">
                  Built-in DaisyUI palettes.
                </p>
              </div>
            </div>

            <span class="badge badge-primary badge-sm">
              {{ filteredDaisyThemes.length }}
            </span>
          </div>

          <!-- The shared shell owns the grid. The old class was
               `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
               xl:grid-cols-6 2xl:grid-cols-8` -- SIX viewport breakpoints for a
               panel that is not full width. MODE_GRID_CLASS measures the
               container once instead.

               `:modes="[]"` hides the bar: a theme swatch has no card/hero/icon
               art to switch between.

               A DaisyUI theme is a plain STRING, so the GalleryItem id IS the
               theme and the card needs no lookup at all. -->
          <kr-gallery :items="daisyItems" :modes="[]" empty-label="themes">
            <template #item="{ item }">
              <article
                :data-theme="String(item.id)"
                class="group flex min-h-28 flex-col overflow-hidden rounded-2xl border bg-base-100 text-base-content shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                :class="
                  activeThemeName === String(item.id)
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-base-300 hover:border-primary/45'
                "
              >
                <button
                  class="flex flex-1 flex-col p-2.5 text-left"
                  type="button"
                  @click="applyBuiltInTheme(String(item.id))"
                >
                  <div
                    class="grid h-8 grid-cols-5 overflow-hidden rounded-xl border border-base-300"
                  >
                    <span class="bg-primary" />
                    <span class="bg-secondary" />
                    <span class="bg-accent" />
                    <span class="bg-neutral" />
                    <span class="bg-base-300" />
                  </div>

                  <div
                    class="mt-2 flex min-w-0 items-center justify-between gap-2"
                  >
                    <h3 class="truncate text-sm font-black capitalize">
                      {{ String(item.id) }}
                    </h3>

                    <Icon
                      v-if="activeThemeName === String(item.id)"
                      name="kind-icon:check"
                      class="h-4 w-4 shrink-0 text-primary"
                    />
                  </div>

                  <div
                    class="mt-2 grid grid-cols-3 gap-1 text-center text-[0.62rem] font-black"
                  >
                    <span
                      class="rounded-lg bg-primary px-1.5 py-1 text-primary-content"
                    >
                      P
                    </span>
                    <span
                      class="rounded-lg bg-secondary px-1.5 py-1 text-secondary-content"
                    >
                      S
                    </span>
                    <span
                      class="rounded-lg bg-accent px-1.5 py-1 text-accent-content"
                    >
                      A
                    </span>
                  </div>
                </button>
              </article>
            </template>

            <template #empty>
              <div
                class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm font-semibold text-base-content/55"
              >
                No default themes match that search. Suspiciously specific.
              </div>
            </template>
          </kr-gallery>
        </section>

        <section
          v-if="showSharedThemes"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary"
              >
                <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              </span>

              <div class="min-w-0">
                <h2 class="truncate text-base font-black text-base-content">
                  Shared Themes
                </h2>

                <p class="truncate text-xs text-base-content/55">
                  Community and custom palettes.
                </p>
              </div>
            </div>

            <span class="badge badge-secondary badge-sm">
              {{ filteredSharedThemes.length }}
            </span>
          </div>

          <!-- Same shell, same six-breakpoint grid retired. Shared themes ARE
               records, so unlike the DaisyUI list above this one looks its
               theme up by id. -->
          <kr-gallery :items="sharedItems" :modes="[]" empty-label="themes">
            <template #item="{ item }">
              <article
                v-if="sharedById.get(Number(item.id))"
                class="group flex min-h-32 flex-col overflow-hidden rounded-2xl border bg-base-100 text-base-content shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                :class="
                  activeThemeName === sharedById.get(Number(item.id))!.name
                    ? 'border-secondary ring-2 ring-secondary/40'
                    : 'border-base-300 hover:border-secondary/45'
                "
                :style="previewStyleFor(sharedById.get(Number(item.id))!)"
              >
                <button
                  class="flex flex-1 flex-col p-2.5 text-left"
                  type="button"
                  @click="applySharedTheme(sharedById.get(Number(item.id))!)"
                >
                  <div
                    class="grid h-8 grid-cols-5 overflow-hidden rounded-xl border border-base-300"
                  >
                    <span class="bg-primary" />
                    <span class="bg-secondary" />
                    <span class="bg-accent" />
                    <span class="bg-neutral" />
                    <span class="bg-base-300" />
                  </div>

                  <div
                    class="mt-2 flex min-w-0 items-center justify-between gap-2"
                  >
                    <h3 class="truncate text-sm font-black">
                      {{ sharedById.get(Number(item.id))!.name }}
                    </h3>

                    <Icon
                      v-if="
                        activeThemeName ===
                        sharedById.get(Number(item.id))!.name
                      "
                      name="kind-icon:check"
                      class="h-4 w-4 shrink-0 text-secondary"
                    />
                  </div>

                  <p
                    class="mt-1 line-clamp-1 text-[0.7rem] font-semibold text-base-content/55"
                  >
                    {{
                      sharedById.get(Number(item.id))!.tagline ||
                      sharedById.get(Number(item.id))!.room ||
                      'Custom Kind Robots palette'
                    }}
                  </p>

                  <div
                    class="mt-2 grid grid-cols-3 gap-1 text-center text-[0.62rem] font-black"
                  >
                    <span
                      class="rounded-lg bg-primary px-1.5 py-1 text-primary-content"
                    >
                      P
                    </span>
                    <span
                      class="rounded-lg bg-secondary px-1.5 py-1 text-secondary-content"
                    >
                      S
                    </span>
                    <span
                      class="rounded-lg bg-accent px-1.5 py-1 text-accent-content"
                    >
                      A
                    </span>
                  </div>
                </button>

                <div
                  class="grid grid-cols-2 border-t border-base-300 bg-base-200/70"
                >
                  <button
                    class="btn btn-ghost btn-xs rounded-none"
                    type="button"
                    @click="applySharedTheme(sharedById.get(Number(item.id))!)"
                  >
                    Apply
                  </button>

                  <button
                    class="btn btn-ghost btn-xs rounded-none"
                    type="button"
                    @click="handleThemeEdit(sharedById.get(Number(item.id))!)"
                  >
                    Edit
                  </button>
                </div>
              </article>
            </template>

            <template #empty>
              <div
                class="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/55"
              >
                <Icon
                  name="kind-icon:palette"
                  class="h-10 w-10 text-secondary"
                />

                <p class="mt-2 text-base font-black">No shared themes found.</p>

                <p class="mt-1 max-w-md text-sm">
                  Either the goblin published nothing, or your search is too
                  powerful.
                </p>
              </div>
            </template>
          </kr-gallery>
        </section>

        <section
          v-if="inspectValues"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <Icon name="kind-icon:code" class="h-4 w-4 text-primary" />

              <h2 class="truncate text-sm font-black text-base-content">
                Active Theme Snapshot
              </h2>
            </div>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              @click="inspectValues = null"
            >
              Clear
            </button>
          </div>

          <pre
            class="max-h-72 overflow-auto rounded-2xl bg-base-200 p-3 text-xs text-base-content/75"
            >{{ inspectValues }}</pre>
        </section>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
// /components/content/themes/theme-gallery.vue
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { computed, onMounted, ref } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useThemeStore, type Theme } from '@/stores/themeStore'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })

type ThemeFilter = 'all' | 'default' | 'shared'

const themeStore = useThemeStore()
const achievementStore = useAchievementStore()

const themeError = ref('')
const inspectValues = ref<string | null>(null)
const searchQuery = ref('')
const activeFilter = ref<ThemeFilter>('all')

const themeFilters: { label: string; value: ThemeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Default', value: 'default' },
  { label: 'Shared', value: 'shared' },
]

const colorAliases: Record<string, string[]> = {
  primary: [
    'primary',
    '--primary',
    'color-primary',
    '--color-primary',
    'p',
    '--p',
  ],
  secondary: [
    'secondary',
    '--secondary',
    'color-secondary',
    '--color-secondary',
    's',
    '--s',
  ],
  accent: ['accent', '--accent', 'color-accent', '--color-accent', 'a', '--a'],
  neutral: [
    'neutral',
    '--neutral',
    'color-neutral',
    '--color-neutral',
    'n',
    '--n',
  ],
  'base-100': [
    'base-100',
    '--base-100',
    'color-base-100',
    '--color-base-100',
    'base100',
    'b1',
    '--b1',
  ],
  'base-200': [
    'base-200',
    '--base-200',
    'color-base-200',
    '--color-base-200',
    'base200',
    'b2',
    '--b2',
  ],
  'base-300': [
    'base-300',
    '--base-300',
    'color-base-300',
    '--color-base-300',
    'base300',
    'b3',
    '--b3',
  ],
  info: ['info', '--info', 'color-info', '--color-info', 'in', '--in'],
  success: [
    'success',
    '--success',
    'color-success',
    '--color-success',
    'su',
    '--su',
  ],
  warning: [
    'warning',
    '--warning',
    'color-warning',
    '--color-warning',
    'wa',
    '--wa',
  ],
  error: ['error', '--error', 'color-error', '--color-error', 'er', '--er'],
}

const legacyColorVarMap: Record<string, string> = {
  primary: 'p',
  secondary: 's',
  accent: 'a',
  neutral: 'n',
  'base-100': 'b1',
  'base-200': 'b2',
  'base-300': 'b3',
  info: 'in',
  success: 'su',
  warning: 'wa',
  error: 'er',
}

const activeThemeName = computed(() => {
  const activeTheme = themeStore.activeTheme

  if (typeof activeTheme === 'string') {
    return activeTheme
  }

  return (
    activeTheme?.name || themeStore.themeForm?.name || themeStore.currentTheme
  )
})

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase())

const filteredDaisyThemes = computed(() => {
  const query = normalizedSearch.value

  return themeStore.daisyuiThemes.filter((theme: string) => {
    if (!query) return true

    return theme.toLowerCase().includes(query)
  })
})

const filteredSharedThemes = computed(() => {
  const query = normalizedSearch.value

  return themeStore.sharedThemes.filter((theme: Theme) => {
    if (!query) return true

    return [
      theme.name,
      theme.room || '',
      theme.tagline || '',
      theme.colorScheme || '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

/*
 * Two collections, two item lists. DaisyUI themes are strings, so the id is
 * the theme itself and the card reads `String(item.id)` with no lookup; shared
 * themes are records and need one.
 */
const daisyItems = computed<GalleryItem[]>(() =>
  filteredDaisyThemes.value.map((theme) => ({ id: theme, title: theme })),
)

const sharedItems = computed<GalleryItem[]>(() =>
  filteredSharedThemes.value.map((theme) => ({
    id: theme.id,
    title: theme.name || `Theme ${theme.id}`,
  })),
)

const sharedById = computed(
  () => new Map(filteredSharedThemes.value.map((theme) => [theme.id, theme])),
)

const showDefaultThemes = computed(() => {
  return activeFilter.value === 'all' || activeFilter.value === 'default'
})

const showSharedThemes = computed(() => {
  return activeFilter.value === 'all' || activeFilter.value === 'shared'
})

const visibleThemeCount = computed(() => {
  const defaultCount = showDefaultThemes.value
    ? filteredDaisyThemes.value.length
    : 0
  const sharedCount = showSharedThemes.value
    ? filteredSharedThemes.value.length
    : 0

  return defaultCount + sharedCount
})

function safeThemeValues(value: unknown): Record<string, string> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? coerceThemeValues(parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value)
    ? coerceThemeValues(value as Record<string, unknown>)
    : {}
}

function coerceThemeValues(
  value: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => {
        return typeof entry[0] === 'string' && typeof entry[1] === 'string'
      })
      .map(([key, color]) => [key.trim(), color.trim()]),
  )
}

function normalizeKey(key: string): string {
  return key.startsWith('--') ? key : `--${key}`
}

function stripVariablePrefix(key: string): string {
  return key.replace(/^--/, '').replace(/^color-/, '')
}

function resolveThemeColor(
  values: Record<string, string>,
  canonical: string,
): string | undefined {
  for (const alias of colorAliases[canonical] ?? [
    canonical,
    `--${canonical}`,
  ]) {
    const direct = values[alias]

    if (direct) {
      return direct
    }
  }

  return undefined
}

function hexToRgbTriplet(value: string): string | null {
  const clean = value.trim().replace('#', '')

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return null
  }

  const numeric = Number.parseInt(clean, 16)
  const red = (numeric >> 16) & 255
  const green = (numeric >> 8) & 255
  const blue = numeric & 255

  return `${red} ${green} ${blue}`
}

function previewStyleFor(theme: Theme): Record<string, string> {
  const values = safeThemeValues(theme.values)
  const style: Record<string, string> = {}

  for (const [key, value] of Object.entries(values)) {
    const cssKey = normalizeKey(key)
    const stripped = stripVariablePrefix(cssKey)

    style[cssKey] = value

    if (!cssKey.startsWith('--color-')) {
      style[`--color-${stripped}`] = value
    }
  }

  for (const canonical of Object.keys(colorAliases)) {
    const value = resolveThemeColor(values, canonical)

    if (!value) continue

    style[`--${canonical}`] = value
    style[`--color-${canonical}`] = value

    const legacyKey = legacyColorVarMap[canonical]
    const rgb = hexToRgbTriplet(value)

    if (legacyKey && rgb) {
      style[`--${legacyKey}`] = rgb
    }
  }

  return style
}

async function applyBuiltInTheme(theme: string): Promise<void> {
  themeError.value = ''

  const result = await themeStore.setActiveTheme(theme)

  if (!result.success) {
    handleThemeError(result.message || `Failed to apply ${theme}.`)
    return
  }

  const snapshot = await themeStore.getActiveThemeSnapshot(theme)
  inspectValues.value = JSON.stringify(snapshot, null, 2)
  achievementStore.rewardAchievementByCode('theme')
}

async function applySharedTheme(theme: Theme): Promise<void> {
  themeError.value = ''

  const result = await themeStore.setActiveTheme({
    id: theme.id,
    userId: theme.userId,
    name: theme.name,
    prefersDark: theme.prefersDark,
    colorScheme: theme.colorScheme,
    isPublic: theme.isPublic,
    tagline: theme.tagline,
    room: theme.room || '',
    values: safeThemeValues(theme.values),
  })

  if (!result.success) {
    handleThemeError(result.message || `Failed to apply ${theme.name}.`)
    return
  }

  const snapshot = await themeStore.getActiveThemeSnapshot(theme.name)
  inspectValues.value = JSON.stringify(snapshot, null, 2)
  achievementStore.rewardAchievementByCode('theme')
}

function handleThemeEdit(theme: Theme): void {
  themeStore.themeForm = {
    id: theme.id,
    userId: theme.userId,
    name: theme.name,
    prefersDark: theme.prefersDark,
    colorScheme: theme.colorScheme,
    isPublic: theme.isPublic,
    tagline: theme.tagline,
    room: theme.room || '',
    values: safeThemeValues(theme.values),
  }

  themeStore.setShowCustom(true)
  themeError.value = ''
}

function handleThemeError(message: string): void {
  themeError.value = `❌ ${message}`
  inspectValues.value = null
}

onMounted(async () => {
  themeError.value = ''

  await themeStore.initialize({
    fetchShared: true,
  })

  if (!themeStore.sharedThemes.length) {
    await themeStore.getThemes(true)
  }

  if (themeStore.lastError) {
    handleThemeError(themeStore.lastError)
  }
})
</script>
