<template>
  <div class="p-6">
    <!-- Built-in Themes -->
    <h2 class="text-xl font-bold mb-4">🎨 Built-in Themes</h2>
    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      <magic-container
        v-for="theme in themeStore.daisyuiThemes"
        :key="theme"
        :data-theme="theme"
        class="rounded-xl"
        :class="{
          'ring ring-primary ring-offset-2': themeStore.activeTheme === theme,
        }"
      >
        <button
          class="btn btn-block border transition-transform duration-200 hover:scale-[1.03]"
          @click="setTheme(theme)"
        >
          {{ theme }}
        </button>
      </magic-container>
    </div>

    <!-- Shared Themes -->
    <h2 class="text-xl font-bold mt-8 mb-4">🌍 Shared Themes</h2>
    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      <magic-container
        v-for="theme in themeStore.sharedThemes"
        :key="theme.id"
        :data-theme="'custom-preview-' + theme.id"
        class="relative rounded-xl"
        :class="{
          'ring ring-secondary ring-offset-2':
            typeof themeStore.activeTheme !== 'string' &&
            themeStore.activeTheme?.id === theme.id,
        }"
      >
        <button
          class="btn btn-block border transition-transform duration-200 hover:scale-[1.03]"
          @click="setTheme(theme)"
        >
          {{ theme.name }}
        </button>
        <button
          title="Edit Theme"
          class="absolute top-2 right-2 btn btn-xs btn-warning"
          @click.stop="editTheme(theme)"
        >
          ✏️
        </button>
      </magic-container>
    </div>

    <!-- Debug: Theme Values -->
    <div v-if="inspectValues" class="mt-6">
      <h3 class="text-lg font-bold mb-2">🎨 Theme Values</h3>
      <pre
        class="text-sm bg-base-200 border rounded-xl p-4 whitespace-pre-wrap max-h-60 overflow-auto"
        >{{ inspectValues }}</pre
      >
    </div>

    <!-- Theme Editor -->
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

    <!-- Error Message -->
    <p v-if="themeError" class="mt-6 text-sm text-error whitespace-pre-wrap">
      {{ themeError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useHead } from '#imports'
import { useThemeStore, type Theme } from '@/stores/themeStore'

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
  try {
    savingId.value = themeStore.themeForm?.id ?? -1
    const result = await themeStore.addTheme(themeStore.themeForm)
    if (!result.success) {
      themeError.value = `❌ Theme save failed:\n${result.message}`
    } else {
      themeError.value = ''
    }
  } catch (err) {
    themeError.value = `❌ saveTheme crashed:\n${(err as Error).message}`
  } finally {
    savingId.value = null
  }
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
  if (themeStore.sharedThemes.length) {
    useHead({
      style: [
        {
          key: 'custom-theme-preview',
          tagPriority: 'low',
          textContent: sharedThemeStyles.value,
        },
      ],
    })
  }
})
</script>
