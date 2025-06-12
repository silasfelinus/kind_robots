<!-- /components/content/themes/theme-test.vue -->
<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">🎨 Built-in Themes</h2>
    <div class="grid gap-2 grid-cols-2">
      <div
        v-for="theme in themeStore.daisyuiThemes"
        :key="theme"
        class="p-4 border rounded-xl cursor-pointer text-center hover:bg-primary hover:text-primary-content"
        @click="setTheme(theme)"
      >
        {{ theme }}
      </div>
    </div>

    <h2 class="text-xl font-bold mt-8 mb-4">🌍 Shared Themes</h2>
    <div class="grid gap-2 grid-cols-2">
      <div
        v-for="theme in themeStore.sharedThemes"
        :key="theme.id"
        class="relative p-4 border rounded-xl cursor-pointer text-center group hover:bg-secondary hover:text-secondary-content"
        @click="setTheme(theme)"
      >
        {{ theme.name }}
        <button
          class="absolute top-2 right-2 btn btn-xs btn-warning opacity-0 group-hover:opacity-100"
          @click.stop="editTheme(theme)"
        >
          ✏️ Edit
        </button>
      </div>
    </div>

    <div v-if="inspectValues" class="mt-6">
      <h3 class="text-lg font-bold mb-2">🎨 Theme Values</h3>
      <pre
        class="text-sm bg-base-200 border rounded-xl p-4 whitespace-pre-wrap max-h-60 overflow-auto"
        >{{ inspectValues }}</pre
      >
    </div>

    <div v-if="themeStore.themeForm?.values" class="mt-8">
      <h3 class="text-lg font-bold mb-2">📝 Edit Theme</h3>
      <magic-container
        :data-theme="'custom-preview-' + (themeStore.themeForm?.id ?? 'new')"
        class="p-6 border rounded-xl bg-base-100 space-y-4"
      >
        <input
          v-model="themeStore.themeForm.name"
          class="input input-bordered w-full"
          placeholder="Theme name"
        />

        <label class="label cursor-pointer space-x-2">
          <span class="label-text">Dark Mode</span>
          <input
            type="checkbox"
            v-model="themeStore.themeForm.prefersDark"
            class="toggle"
          />
        </label>

        <button
          class="btn btn-primary w-full"
          :disabled="savingId !== null"
          @click="saveTheme"
        >
          💾 {{ savingId ? 'Saving...' : 'Save Theme' }}
        </button>
      </magic-container>
    </div>

    <p v-if="themeError" class="mt-6 text-sm text-error whitespace-pre-wrap">
      {{ themeError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useHead } from '#imports'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { performFetch } from '@/stores/utils'

const themeStore = useThemeStore()
const themeError = ref('')
const inspectValues = ref<string | null>(null)
const savingId = ref<number | null>(null)

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
      if (typeof document !== 'undefined') {
        inspectValues.value = JSON.stringify(
          themeStore.getThemeValues(),
          null,
          2,
        )
      }
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

async function saveTheme() {
  savingId.value = themeStore.themeForm?.id || null

  const result = await performFetch('/api/themes', {
    method: themeStore.themeForm?.id ? 'PATCH' : 'POST',
    body: JSON.stringify(themeStore.themeForm),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!result.success) {
    themeError.value = `❌ Save failed\n${result.message}`
  } else {
    themeError.value = ''
  }

  savingId.value = null
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
