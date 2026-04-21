<!-- /components/content/themes/theme-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="filterGroup"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
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
          'picker-row--active':
            typeof t === 'string'
              ? themeStore.activeThemeName === t
              : themeStore.activeThemeName === t.name,
        }"
        @click="applyTheme(t)"
      >
        <!-- Swatch: a tiny strip of the theme's primary color if available -->
        <span
          class="picker-icon shrink-0 w-5 h-5 rounded-md border border-base-300"
          :data-theme="typeof t === 'string' ? t : 'custom-preview-' + t.id"
          style="background: oklch(var(--p, 50% 0.2 260))"
        />

        <span class="picker-label">
          <span class="picker-name">{{ typeof t === 'string' ? t : t.name }}</span>
          <span class="picker-sub">{{ typeof t === 'string' ? 'Default' : 'Shared' }}</span>
        </span>

        <button
          class="picker-action"
          :class="
            (typeof t === 'string' ? themeStore.activeThemeName === t : themeStore.activeThemeName === t.name)
              ? 'btn-primary'
              : 'btn-ghost'
          "
          @click.stop="applyTheme(t)"
        >
          {{ (typeof t === 'string' ? themeStore.activeThemeName === t : themeStore.activeThemeName === t.name) ? 'Active' : 'Apply' }}
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
const filterGroup = ref('all')
const themeError = ref('')

type ThemeEntry = string | Theme

const allThemes = computed<ThemeEntry[]>(() => {
  const defaults: ThemeEntry[] = filterGroup.value !== 'shared' ? themeStore.daisyuiThemes : []
  const shared: ThemeEntry[] = filterGroup.value !== 'default' ? themeStore.sharedThemes : []
  return [...defaults, ...shared]
})

const filtered = computed<ThemeEntry[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allThemes.value
  return allThemes.value.filter((t) => {
    const name = typeof t === 'string' ? t : t.name
    return name.toLowerCase().includes(q)
  })
})

function applyTheme(t: ThemeEntry) {
  try {
    const input =
      typeof t === 'string'
        ? t
        : {
            name: t.name,
            prefersDark: t.prefersDark,
            colorScheme: t.colorScheme,
            isPublic: t.isPublic,
            room: t.room || '',
            values:
              typeof t.values === 'object' && t.values !== null
                ? (t.values as Record<string, string>)
                : {},
          }
    const result = themeStore.setActiveTheme(input)
    if (!result.success) themeError.value = result.message ?? 'Failed to apply'
    else themeError.value = ''
  } catch (err: unknown) {
    themeError.value = (err as Error).message
  }
}
</script>
