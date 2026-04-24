<!-- /components/navigation/theme-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <!-- ── COMPACT: single row ────────────────────────────────────── -->
    <div v-if="isCompact" class="flex h-full w-full items-center gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-base-100"
      >
        <icon name="kind-icon:theme" class="h-4 w-4" />
      </div>

      <select
        class="select select-bordered select-sm flex-1 bg-base-100 focus:border-primary"
        @change="onSelectChange"
      >
        <optgroup label="Built-in">
          <option
            v-for="t in themeStore.daisyuiThemes"
            :key="`builtin:${t}`"
            :value="`builtin:${t}`"
            :selected="currentTheme === t"
          >
            {{ t }}
          </option>
        </optgroup>
        <optgroup v-if="themeStore.sharedThemes.length" label="Custom">
          <option
            v-for="t in themeStore.sharedThemes"
            :key="`shared:${t.id}`"
            :value="`shared:${t.id}`"
            :selected="currentTheme === t.name"
          >
            {{ t.name }}
          </option>
        </optgroup>
      </select>

      <span class="hidden shrink-0 font-mono text-xs text-primary sm:block">
        {{ currentTheme }}
      </span>

      <button
        type="button"
        class="btn btn-sm btn-primary shrink-0"
        @click="openThemeLab"
      >
        Open
      </button>
    </div>

    <!-- ── OPEN: picker + active theme display ────────────────────── -->
    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 gap-3"
      style="grid-template-columns: 1fr minmax(0, 14rem)"
    >
      <!-- Left: theme grid -->
      <div class="flex min-h-0 flex-col gap-2">
        <div class="flex shrink-0 items-center justify-between gap-2">
          <p
            class="font-mono text-[10px] uppercase tracking-widest text-base-content/40"
          >
            Themes
          </p>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            @click="openThemeLab"
          >
            Theme Lab ↗
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <p
            class="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-base-content/30"
          >
            Built-in
          </p>
          <div
            class="grid gap-1.5 pb-3"
            style="grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))"
          >
            <button
              v-for="theme in themeStore.daisyuiThemes"
              :key="theme"
              :data-theme="theme"
              type="button"
              class="flex flex-col items-center gap-1 rounded-2xl border-2 bg-base-200 px-1.5 py-2 transition hover:-translate-y-0.5"
              :class="
                currentTheme === theme
                  ? 'border-accent shadow-sm'
                  : 'border-base-300 hover:border-accent/50'
              "
              @click="applyBuiltInTheme(theme)"
            >
              <span
                class="w-full truncate text-center font-mono text-[10px] font-semibold text-base-content"
              >
                {{ theme }}
              </span>
              <div class="flex gap-0.5">
                <span class="h-3 w-3 rounded-full bg-primary" />
                <span class="h-3 w-3 rounded-full bg-secondary" />
                <span class="h-3 w-3 rounded-full bg-accent" />
                <span class="h-3 w-3 rounded-full bg-neutral" />
              </div>
            </button>
          </div>

          <template v-if="themeStore.sharedThemes.length">
            <p
              class="mb-1.5 mt-2 font-mono text-[9px] uppercase tracking-widest text-base-content/30"
            >
              Custom
            </p>
            <div
              class="grid gap-1.5 pb-3"
              style="
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
              "
            >
              <button
                v-for="theme in themeStore.sharedThemes"
                :key="theme.id"
                type="button"
                class="flex flex-col items-center gap-1 rounded-2xl border-2 px-1.5 py-2 transition hover:-translate-y-0.5"
                :class="
                  currentTheme === theme.name
                    ? 'border-accent shadow-sm'
                    : 'border-base-300 hover:border-accent/50'
                "
                :style="{
                  background: sw(theme).base200,
                  color: sw(theme).neutral,
                }"
                @click="applySharedTheme(theme)"
              >
                <span
                  class="w-full truncate text-center font-mono text-[10px] font-semibold"
                >
                  {{ theme.name }}
                </span>
                <div class="flex gap-0.5">
                  <span
                    class="h-3 w-3 rounded-full"
                    :style="{ background: sw(theme).primary }"
                  />
                  <span
                    class="h-3 w-3 rounded-full"
                    :style="{ background: sw(theme).secondary }"
                  />
                  <span
                    class="h-3 w-3 rounded-full"
                    :style="{ background: sw(theme).accent }"
                  />
                  <span
                    class="h-3 w-3 rounded-full"
                    :style="{ background: sw(theme).neutral }"
                  />
                </div>
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Right: active theme color variables -->
      <div
        class="flex min-h-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div class="shrink-0">
          <p
            class="font-mono text-[10px] uppercase tracking-widest text-base-content/40"
          >
            Active theme
          </p>
          <p class="mt-0.5 truncate font-mono text-sm font-bold text-primary">
            {{ currentTheme }}
          </p>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <theme-display />
        </div>
      </div>
    </div>

    <!-- ── PRIORITY: larger picker + active theme display ─────────── -->
    <div
      v-else
      class="grid h-full w-full min-h-0 gap-3"
      style="grid-template-columns: 1fr minmax(0, 18rem)"
    >
      <!-- Left: larger theme grid -->
      <div class="flex min-h-0 flex-col gap-2">
        <div class="flex shrink-0 items-center justify-between gap-2">
          <p
            class="font-mono text-[10px] uppercase tracking-widest text-base-content/40"
          >
            Themes
          </p>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            @click="openThemeLab"
          >
            Theme Lab ↗
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <p
            class="mb-2 font-mono text-[9px] uppercase tracking-widest text-base-content/30"
          >
            Built-in
          </p>
          <div
            class="grid gap-2 pb-4"
            style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))"
          >
            <button
              v-for="theme in themeStore.daisyuiThemes"
              :key="theme"
              :data-theme="theme"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-base-200 px-2 py-3 transition hover:-translate-y-0.5"
              :class="
                currentTheme === theme
                  ? 'border-accent shadow-md'
                  : 'border-base-300 hover:border-accent/50'
              "
              @click="applyBuiltInTheme(theme)"
            >
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

          <template v-if="themeStore.sharedThemes.length">
            <p
              class="mb-2 mt-3 font-mono text-[9px] uppercase tracking-widest text-base-content/30"
            >
              Custom
            </p>
            <div
              class="grid gap-2 pb-4"
              style="
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
              "
            >
              <button
                v-for="theme in themeStore.sharedThemes"
                :key="theme.id"
                type="button"
                class="flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition hover:-translate-y-0.5"
                :class="
                  currentTheme === theme.name
                    ? 'border-accent shadow-md'
                    : 'border-base-300 hover:border-accent/50'
                "
                :style="{
                  background: sw(theme).base200,
                  color: sw(theme).neutral,
                }"
                @click="applySharedTheme(theme)"
              >
                <span
                  class="w-full truncate text-center font-mono text-[11px] font-semibold"
                >
                  {{ theme.name }}
                </span>
                <div class="flex gap-1">
                  <span
                    class="h-3.5 w-3.5 rounded-full"
                    :style="{ background: sw(theme).primary }"
                  />
                  <span
                    class="h-3.5 w-3.5 rounded-full"
                    :style="{ background: sw(theme).secondary }"
                  />
                  <span
                    class="h-3.5 w-3.5 rounded-full"
                    :style="{ background: sw(theme).accent }"
                  />
                  <span
                    class="h-3.5 w-3.5 rounded-full"
                    :style="{ background: sw(theme).neutral }"
                  />
                </div>
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Right: active theme color variables -->
      <div
        class="flex min-h-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div class="shrink-0">
          <p
            class="font-mono text-[10px] uppercase tracking-widest text-base-content/40"
          >
            Active theme
          </p>
          <p class="mt-0.5 truncate font-mono text-sm font-bold text-primary">
            {{ currentTheme }}
          </p>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <theme-display />
        </div>
        <button
          type="button"
          class="btn btn-sm btn-primary mt-1 shrink-0 w-full"
          @click="openThemeLab"
        >
          Open Theme Lab
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const router = useRouter()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')
const currentTheme = computed(() => themeStore.currentTheme)

const KEY_ALIASES: Record<string, string[]> = {
  primary: ['primary', '--primary', 'p', '--p'],
  secondary: ['secondary', '--secondary', 's', '--s'],
  accent: ['accent', '--accent', 'a', '--a'],
  neutral: ['neutral', '--neutral', 'n', '--n'],
  'base-200': ['base-200', '--base-200', 'b2', '--b2', 'base200'],
}

function safeValues(val: unknown): Record<string, string> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

function resolveKey(
  vals: Record<string, string>,
  canonical: string,
): string | undefined {
  for (const alias of KEY_ALIASES[canonical] ?? [canonical, `--${canonical}`]) {
    if (vals[alias] !== undefined) return vals[alias]
  }
}

function sw(theme: Theme) {
  const vals = safeValues(theme.values)
  const g = (k: string) => resolveKey(vals, k)
  return {
    primary: g('primary') ?? '#570df8',
    secondary: g('secondary') ?? '#f000b8',
    accent: g('accent') ?? '#1fb2a5',
    neutral: g('neutral') ?? '#3d4451',
    base200: g('base-200') ?? '#e5e7eb',
  }
}

async function applyBuiltInTheme(theme: string) {
  await themeStore.setActiveTheme(theme)
}

async function applySharedTheme(theme: Theme) {
  await themeStore.setActiveTheme({
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
}

function onSelectChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val.startsWith('builtin:')) {
    void applyBuiltInTheme(val.slice('builtin:'.length))
  } else if (val.startsWith('shared:')) {
    const id = Number(val.slice('shared:'.length))
    const theme = themeStore.sharedThemes.find((t: Theme) => t.id === id)
    if (theme) void applySharedTheme(theme)
  }
}

async function openThemeLab() {
  await router.push('/themes')
}
</script>
