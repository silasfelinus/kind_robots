<!-- /components/content/themes/theme-lab.vue -->
<template>
  <section
    class="bg-base-200 border border-base-content p-6 rounded-2xl shadow-lg"
  >
    <h2 class="text-2xl font-semibold mb-4">Create or Edit Your Theme</h2>

    <!-- Color Inputs -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div
        v-for="color in colorKeys"
        :key="color"
        class="relative group w-full h-12 rounded-md overflow-hidden border border-base-content"
      >
        <input
          type="color"
          :id="`color-${color}`"
          :value="themeForm.values?.[color] || '#ffffff'"
          @input="onColorInput($event, color)"
          class="w-full h-full appearance-none cursor-pointer bg-transparent"
        />

        <span
          class="absolute bottom-0 left-0 w-full bg-base-300/80 text-xs text-center text-base-content py-0.5 font-medium capitalize truncate pointer-events-none"
        >
          {{ labelFromKey(color) }}
        </span>
      </div>
    </div>

    <button class="btn btn-accent mt-4" @click="fillWithRandomTheme">
      🎲 Randomize Theme
    </button>

    <!-- Extra Vars -->
    <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <label
        for="prefers-dark"
        class="flex gap-2 items-center text-sm font-medium"
      >
        <input
          id="prefers-dark"
          type="checkbox"
          class="toggle"
          v-model="themeForm.prefersDark"
        />
        <span>Prefers dark mode</span>
      </label>

      <label
        v-for="key in extraVars"
        :key="key"
        class="flex flex-col gap-1 text-sm font-medium"
        :for="`input-${key}`"
      >
        <span>{{ key.replace('--', '') }}</span>

        <div v-if="isSliderKey(key)" class="w-full">
          <input
            type="range"
            class="range range-sm"
            :id="`input-${key}`"
            :min="getSliderMeta(key).min"
            :max="getSliderMeta(key).max"
            :step="getSliderMeta(key).step"
            v-bind="vModelBinding(key)"
          />
          <div class="text-xs text-right text-base-content/70">
            {{ bindValue(key).value }}
          </div>
        </div>

        <input
          v-else
          type="text"
          class="input input-bordered w-full h-10"
          :id="`input-${key}`"
          placeholder="e.g. 1rem or 0"
          v-bind="vModelBinding(key)"
        />
      </label>

      <input
        v-model="themeForm.name"
        id="input-theme-name"
        placeholder="Theme name"
        class="input input-bordered text-center"
      />

      <button @click="saveTheme" class="btn btn-primary">
        {{ updateMode ? 'Update Theme' : 'Save Theme' }}
      </button>

      <p
        v-if="themeError"
        class="mt-4 p-3 text-sm text-error bg-error/10 border border-error rounded-xl"
      >
        {{ themeError }}
      </p>
    </div>

    <!-- Toggles -->
    <div
      class="form-control col-span-1 sm:col-span-3 flex flex-col sm:flex-row gap-4 items-center mt-6"
    >
      <label for="apply-after-save" class="label gap-2">
        <input
          id="apply-after-save"
          type="checkbox"
          class="toggle"
          v-model="applyAfterSave"
        />
        <span class="label-text">Apply after saving</span>
      </label>

      <label for="theme-is-public" class="label gap-2">
        <input
          id="theme-is-public"
          type="checkbox"
          class="toggle"
          v-model="themeForm.isPublic"
        />
        <span class="label-text">Make this theme public</span>
      </label>

      <label for="use-page-themes" class="label gap-2">
        <input
          id="use-page-themes"
          type="checkbox"
          class="toggle"
          v-model="useCustom"
        />
        <span class="label-text">Use page themes (showCustom)</span>
      </label>
    </div>

    <button class="btn btn-outline mt-4" @click="resetThemeForm">Reset</button>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
const themeForm = themeStore.themeForm
const themeError = ref('')

onMounted(() => {
  themeStore.initializeThemeFormIfNeeded()
})

const colorKeys = computed(() => themeStore.colorKeys)
const extraVars = computed(() => themeStore.extraVars)
const { labelFromKey, isValidColor } = useThemeStore()

const updateMode = computed(() => !!themeForm.id)

const applyAfterSave = computed({
  get: () => themeStore.applyAfterSave,
  set: (val: boolean) => themeStore.setApplyAfterSave(val),
})

const useCustom = computed({
  get: () => themeStore.showCustom,
  set: (val: boolean) => themeStore.setShowCustom(val),
})

watch(
  () => themeForm.prefersDark,
  (val) => {
    themeForm.colorScheme = val ? 'dark' : 'light'
  },
)

function bindValue(key: string) {
  return computed({
    get: () => themeForm.values?.[key] ?? '',
    set: (val) => {
      if (themeForm.values) themeForm.values[key] = val
    },
  })
}

function vModelBinding(key: string) {
  const model = bindValue(key)
  return {
    get modelValue() {
      return model.value
    },
    set modelValue(val: any) {
      model.value = val
    },
  }
}

function getSliderMeta(key: string) {
  if (key.includes('radius')) return { min: 0, max: 3, step: 0.05 }
  if (key.includes('size')) return { min: 0.5, max: 3, step: 0.1 }
  if (key === '--depth') return { min: 0, max: 3, step: 1 }
  if (key === '--border') return { min: 0, max: 4, step: 1 }
  if (key === '--noise') return { min: 0, max: 100, step: 1 }
  return { min: 0, max: 1, step: 0.1 }
}

function isSliderKey(key: string) {
  return (
    ['--depth', '--noise', '--border'].includes(key) ||
    key.includes('radius') ||
    key.includes('size')
  )
}

const fillWithRandomTheme = () =>
  themeStore.fillThemeWithRandomColors(themeForm)

const resetThemeForm = () => themeStore.resetThemeForm()

function onColorInput(e: Event, key: string) {
  const value = (e.target as HTMLInputElement)?.value
  if (value) themeStore.setColorValue(key, value)
}

async function saveTheme() {
  if (!themeForm.name) return
  try {
    const payload = themeStore.buildThemePayload(themeForm)

    if (updateMode.value) {
      await themeStore.updateTheme(themeForm.id!, payload)
    } else {
      await themeStore.addTheme(payload)
    }

    if (applyAfterSave.value) {
      const result = themeStore.setActiveTheme(themeForm.name!)
      themeError.value = result.success ? '' : result.message || 'Unknown error'
    }

    themeStore.resetThemeForm()
  } catch (e) {
    console.error('Theme save failed', e)
    themeError.value = 'Theme save failed: ' + String(e)
  }
}
</script>
