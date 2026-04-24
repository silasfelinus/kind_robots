<!-- /components/content/themes/theme-manager.vue -->
<template>
  <div class="relative flex min-h-dvh flex-col overflow-hidden bg-base-300">
    <!-- ── Header ──────────────────────────────────────────────────── -->
    <header
      class="flex shrink-0 flex-wrap items-center gap-4 border-b border-base-300 bg-base-100 px-5 py-3"
    >
      <!-- Brand -->
      <div class="mr-auto flex items-center gap-2">
        <span class="text-2xl leading-none text-amber-500">◐</span>
        <span class="text-lg font-bold tracking-tight">Theme Manager</span>
        <span class="self-end pb-0.5 font-mono text-[11px] opacity-40">
          {{ allThemeCount }} themes
        </span>
      </div>

      <!-- Tabs -->
      <nav class="flex gap-1 rounded-xl border border-base-300 bg-base-200 p-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all"
          :class="
            activeMode === tab.id
              ? 'bg-base-100 text-amber-500 shadow-sm'
              : 'opacity-55 hover:bg-base-300 hover:opacity-85'
          "
          @click="activeMode = tab.id"
        >
          <span>{{ tab.icon }}</span>
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Active theme pill -->
      <span
        v-if="themeStore.currentTheme"
        class="flex items-center gap-1.5 rounded-full border border-amber-500 px-2.5 py-1 font-mono text-xs text-amber-500"
      >
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        {{ themeStore.currentTheme }}
      </span>
    </header>

    <!-- ── Body ────────────────────────────────────────────────────── -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- ══ GALLERY ══════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'gallery'"
        class="flex flex-1 flex-col overflow-hidden"
      >
        <!-- Search / filter bar -->
        <div
          class="flex shrink-0 flex-wrap items-center gap-4 border-b border-base-300 bg-base-100 px-5 py-3"
        >
          <input
            v-model="searchQuery"
            class="input input-bordered input-sm min-w-44 flex-1 bg-base-200 focus:border-primary"
            placeholder="Search themes…"
            type="search"
          />
          <label
            class="flex cursor-pointer select-none items-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            <input
              v-model="showDarkOnly"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            <span>Dark only</span>
          </label>
        </div>

        <!-- Theme grid -->
        <div
          v-if="filteredDaisyThemes.length"
          class="grid flex-1 gap-2 overflow-y-auto p-4 pb-8"
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
            @click="applyTheme(theme)"
          >
            <!-- Active badge -->
            <span
              v-if="themeStore.currentTheme === theme"
              class="absolute right-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-accent-content"
            >
              ✓
            </span>

            <!-- Name -->
            <span
              class="w-full truncate text-center font-mono text-[11px] font-semibold text-base-content"
            >
              {{ theme }}
            </span>

            <!-- Color circles -->
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
          class="flex flex-1 flex-col items-center justify-center gap-3 text-sm opacity-60"
        >
          <p>No themes match your search.</p>
          <button class="btn btn-outline btn-sm" @click="searchQuery = ''">
            Clear search
          </button>
        </div>
      </section>
      <!-- ══ SHARED ════════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'shared'"
        class="flex flex-1 flex-col overflow-hidden"
      >
        <div
          v-if="themeStore.sharedThemes.length"
          class="grid flex-1 gap-3 overflow-y-auto p-5 pb-8"
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
            @click="applySharedTheme(theme)"
          >
            <!-- Active badge -->
            <span
              v-if="themeStore.currentTheme === theme.name"
              class="absolute right-1.5 top-1.5 z-10 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white"
              style="background: #f59e0b"
            >
              Active
            </span>

            <!-- Mini diorama -->
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
                  >{{ label }}</span
                >
              </div>

              <!-- Progress bar -->
              <div
                class="h-1.5 w-full overflow-hidden rounded-full"
                :style="{ background: swatchesFor(theme).base300 }"
              >
                <div
                  class="h-full w-[45%] rounded-full"
                  :style="{ background: swatchesFor(theme).primary }"
                />
              </div>

              <!-- Input mock -->
              <div
                class="h-4 rounded border"
                :style="{
                  background: swatchesFor(theme).base100,
                  borderColor: swatchesFor(theme).base300,
                }"
              />
            </div>

            <!-- No-values fallback strip -->
            <div
              v-if="!swatchesFor(theme).hasColors"
              class="flex h-2.5 items-center justify-center"
              :style="{ background: swatchesFor(theme).base300 }"
            >
              <span class="font-mono text-[8px] opacity-40">no preview</span>
            </div>

            <!-- Color swatch strip -->
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

            <!-- Name + meta -->
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
                  >Public</span
                >
                <span
                  v-if="theme.prefersDark"
                  class="rounded px-1 py-0.5 font-mono text-[9px] text-white"
                  :style="{ background: swatchesFor(theme).neutral }"
                  >Dark</span
                >
              </div>
            </div>

            <!-- Edit button -->
            <button
              class="absolute left-1.5 top-1.5 rounded border bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-80 hover:opacity-100!"
              @click.stop="editSharedTheme(theme)"
            >
              Edit
            </button>
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center opacity-60"
        >
          <div class="text-5xl opacity-20">◐</div>
          <p class="text-lg font-bold">No shared themes yet</p>
          <p class="max-w-xs text-sm">
            Create a custom theme in Forge and save it as public.
          </p>
          <button class="btn btn-outline btn-sm" @click="activeMode = 'forge'">
            Go to Forge
          </button>
        </div>
      </section>
      <!-- ══ FORGE ═════════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'forge'"
        class="flex flex-1 flex-col overflow-hidden"
      >
        <!-- Forge top bar: load-existing select + mode label -->
        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-base-300 bg-base-100 px-5 py-3"
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
              class="btn btn-ghost btn-xs"
              @click="newTheme"
            >
              New theme instead
            </button>
            <select
              class="select select-bordered select-sm bg-base-200 focus:border-amber-500"
              @change="onForgeSelect"
            >
              <option value="">— Edit existing theme —</option>
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

        <!--
          Delegate to <add-theme />.
          It reads/writes themeStore.themeForm directly and owns all the
          color pickers, save logic, preview, randomize, and error state.
          :key="forgeKey" forces a remount when loading an existing theme
          so add-theme's onMounted doesn't clobber our pre-populated form.
        -->
        <div class="flex-1 overflow-y-auto">
          <add-theme :key="forgeKey" />
        </div>
      </section>
    </div>

    <!-- ── Loading overlay ─────────────────────────────────────────── -->
    <transition name="tm-fade">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-base-100/85"
      >
        <span class="loading loading-spinner loading-md text-amber-500" />
        <span class="font-mono text-sm">Loading themes…</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

type Mode = 'gallery' | 'shared' | 'forge'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

// ── State ────────────────────────────────────────────────────────
const activeMode = ref<Mode>('gallery')
const searchQuery = ref('')
const showDarkOnly = ref(false)
const isLoading = ref(false)
// Bumping forgeKey forces <add-theme> to remount when we load an existing
// theme, so its onMounted/initializeThemeFormIfNeeded sees the pre-set form.
const forgeKey = ref(0)

// ── Shared-theme card helpers ─────────────────────────────────────

function safeValues(val: unknown): Record<string, string> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

// Map canonical names → every alias we might see stored
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
  vals: Record<string, string>,
  canonical: string,
): string | undefined {
  for (const alias of KEY_ALIASES[canonical] ?? [canonical, `--${canonical}`]) {
    if (vals[alias] !== undefined) return vals[alias]
  }
}

// Replace topSwatches with this in <script setup>
function swatchesFor(theme: Theme) {
  const vals = safeValues(theme.values)
  const get = (canonical: string) => resolveKey(vals, canonical)
  return {
    primary: get('primary') ?? '#570df8',
    secondary: get('secondary') ?? '#f000b8',
    accent: get('accent') ?? '#1fb2a5',
    neutral: get('neutral') ?? '#3d4451',
    base100: get('base-100') ?? '#ffffff',
    base200: get('base-200') ?? '#e5e7eb',
    base300: get('base-300') ?? '#d1d5db',
    hasColors: Object.keys(vals).length > 0,
  }
}

// ── Tabs ─────────────────────────────────────────────────────────
const tabs = [
  { id: 'gallery' as Mode, label: 'Gallery', icon: '◫' },
  { id: 'shared' as Mode, label: 'Shared', icon: '◈' },
  { id: 'forge' as Mode, label: 'Forge', icon: '◐' },
]

// ── Computed ─────────────────────────────────────────────────────
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
  if (q) list = list.filter((t) => t.toLowerCase().includes(q))
  if (showDarkOnly.value) list = list.filter((t) => DARK_THEMES.has(t))
  return list
})

const allThemeCount = computed(
  () =>
    (themeStore.daisyuiThemes?.length ?? 0) +
    (themeStore.sharedThemes?.length ?? 0),
)

const SWATCH_KEYS = ['primary', 'secondary', 'accent', 'neutral', 'base-100']

// ── Actions ───────────────────────────────────────────────────────
async function applyTheme(name: string) {
  const result = await themeStore.setActiveTheme(name)
  if (result.success) milestoneStore.rewardMilestone(9)
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
  if (result.success) milestoneStore.rewardMilestone(9)
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
  // Remount <add-theme> so its onMounted doesn't wipe the form we just set
  forgeKey.value++
}

function editSharedTheme(theme: Theme) {
  loadThemeIntoForm(theme)
  activeMode.value = 'forge'
}

function newTheme() {
  themeStore.resetThemeForm()
  forgeKey.value++
}

function onForgeSelect(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (!id) return
  const theme = themeStore.sharedThemes.find((t: Theme) => t.id === id)
  if (theme)
    loadThemeIntoForm(theme)
    // Reset select visually back to placeholder
  ;(e.target as HTMLSelectElement).value = ''
}

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
  if (!themeStore.initialized) {
    isLoading.value = true
    await themeStore.initialize()
    isLoading.value = false
  } else if (!themeStore.sharedThemes.length) {
    await themeStore.getThemes()
  }
})
</script>

<style scoped>
/* Only thing scoped CSS is needed for: the enter/leave transitions.
   Everything else is Tailwind. */
.tm-fade-enter-active,
.tm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tm-fade-enter-from,
.tm-fade-leave-to {
  opacity: 0;
}
</style>
