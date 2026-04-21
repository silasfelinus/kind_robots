<!-- /components/content/themes/theme-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="filterGroup"
        class="select select-bordered select-xs w-full bg-base-200 sm:w-auto"
      >
        <option value="all">All themes</option>
        <option value="default">Default</option>
        <option value="shared">Shared</option>
      </select>

      <input
        v-model="query"
        type="search"
        placeholder="Search themes…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="themeError" class="picker-error">{{ themeError }}</div>

    <div v-if="filtered.length === 0" class="picker-empty">
      <span>🌈</span> No themes found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="t in filtered"
        :key="typeof t === 'string' ? t : t.id"
        class="picker-row"
        :class="{
          'picker-row--active': activeThemeName === getThemeName(t),
        }"
        @click="applyTheme(t)"
      >
        <span
          class="picker-icon h-5 w-5 shrink-0 rounded-md border border-base-300"
          :data-theme="typeof t === 'string' ? t : 'custom-preview-' + t.id"
          style="background: oklch(var(--p, 50% 0.2 260))"
        />

        <span class="picker-label">
          <span class="picker-name">{{ getThemeName(t) }}</span>
          <span class="picker-sub">
            {{ typeof t === 'string' ? 'Default' : 'Shared' }}
          </span>
        </span>

        <button
          class="picker-action"
          :class="
            activeThemeName === getThemeName(t) ? 'btn-primary' : 'btn-ghost'
          "
          @click.stop="applyTheme(t)"
        >
          {{ activeThemeName === getThemeName(t) ? 'Active' : 'Apply' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const themeStore = useThemeStore()
const query = ref('')
const filterGroup = ref<'all' | 'default' | 'shared'>('all')
const themeError = ref('')

type ThemeEntry = string | Theme

const activeThemeName = computed(() => themeStore.currentTheme)

const allThemes = computed<ThemeEntry[]>(() => {
  const defaults: ThemeEntry[] =
    filterGroup.value !== 'shared' ? [...themeStore.daisyuiThemes] : []
  const shared: ThemeEntry[] =
    filterGroup.value !== 'default' ? [...themeStore.sharedThemes] : []

  return [...defaults, ...shared]
})

const filtered = computed<ThemeEntry[]>(() => {
  const q = query.value.trim().toLowerCase()

  if (!q) return allThemes.value

  return allThemes.value.filter((t) =>
    getThemeName(t).toLowerCase().includes(q),
  )
})

function getThemeName(t: ThemeEntry): string {
  return typeof t === 'string' ? t : t.name
}

function safeThemeValues(val: unknown): Record<string, string> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

async function applyTheme(t: ThemeEntry) {
  try {
    const input =
      typeof t === 'string'
        ? t
        : {
            id: t.id,
            userId: t.userId,
            name: t.name,
            prefersDark: t.prefersDark,
            colorScheme: t.colorScheme,
            isPublic: t.isPublic,
            tagline: t.tagline,
            room: t.room || '',
            values: safeThemeValues(t.values),
          }

    const result = await themeStore.setActiveTheme(input)

    if (!result.success) {
      themeError.value = result.message ?? 'Failed to apply theme'
      return
    }

    themeError.value = ''
  } catch (err: unknown) {
    themeError.value =
      err instanceof Error ? err.message : 'Failed to apply theme'
  }
}
</script>
