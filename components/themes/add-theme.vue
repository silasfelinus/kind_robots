<!-- /components/content/icons/theme-menu.vue -->
<template>
  <div class="theme-menu mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6">
    <section
      class="rounded-2xl border border-base-content bg-base-200 p-4 shadow-md"
    >
      <div
        class="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 class="text-xl font-bold">🎨 Make Your Own Theme</h2>
          <p class="text-sm text-base-content/70">
            Build, preview, save, and apply a custom theme without leaving the
            page.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-sm">Public</span>
            <input
              v-model="themeForm.isPublic"
              type="checkbox"
              class="toggle toggle-sm"
            />
          </label>

          <label class="label cursor-pointer gap-2">
            <span class="label-text text-sm">Apply after save</span>
            <input
              v-model="applyAfterSave"
              type="checkbox"
              class="toggle toggle-sm"
            />
          </label>
        </div>
      </div>

      <div
        class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,24rem)]"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="color in colorKeys"
              :key="color"
              class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-3"
            >
              <span class="min-w-0 flex-1 truncate text-sm font-medium">
                {{ themeStore.labelFromKey(color) }}
              </span>

              <input
                type="color"
                :value="themeForm.values?.[color] || '#ffffff'"
                class="h-10 w-16 cursor-pointer rounded-xl border border-base-300 bg-transparent p-1"
                @input="onColorInput($event, color)"
              />
            </label>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              v-model="themeForm.name"
              type="text"
              placeholder="Theme name"
              class="input input-bordered w-full bg-base-100 text-center"
            />

            <input
              v-model="themeForm.room"
              type="text"
              placeholder="Room or vibe"
              class="input input-bordered w-full bg-base-100 text-center"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              v-model="themeForm.tagline"
              type="text"
              placeholder="Optional tagline"
              class="input input-bordered w-full bg-base-100 text-center"
            />

            <select
              v-model="themeForm.colorScheme"
              class="select select-bordered w-full bg-base-100"
            >
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="btn btn-accent" @click="randomizeTheme">
              🎲 Randomize
            </button>

            <button class="btn btn-outline" @click="resetTheme">Reset</button>

            <button
              class="btn btn-primary"
              :disabled="isSaving || !trimmedName"
              @click="saveTheme"
            >
              {{
                isSaving
                  ? 'Saving…'
                  : updateMode
                    ? 'Update Theme'
                    : 'Save Theme'
              }}
            </button>

            <button
              class="btn btn-secondary"
              :disabled="isApplyingPreview"
              @click="applyPreviewTheme"
            >
              {{ isApplyingPreview ? 'Applying…' : 'Preview This Theme' }}
            </button>
          </div>

          <p
            v-if="themeError"
            class="rounded-2xl border border-error bg-error/10 p-3 text-sm text-error whitespace-pre-wrap"
          >
            {{ themeError }}
          </p>
        </div>

        <div class="min-h-0">
          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold">Live Preview</h3>
                <p class="text-sm text-base-content/70">
                  Try the palette before committing to the bit.
                </p>
              </div>

              <span class="badge badge-outline">
                {{ themeForm.colorScheme || 'light' }}
              </span>
            </div>

            <div
              class="rounded-2xl border border-base-300 p-4"
              :style="previewStyleObject"
            >
              <div class="space-y-3">
                <div>
                  <div class="text-xl font-bold">
                    {{ trimmedName || 'Unnamed Theme' }}
                  </div>
                  <div class="text-sm opacity-80">
                    {{
                      themeForm.tagline ||
                      'A suspiciously stylish color experiment.'
                    }}
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button class="btn btn-primary btn-sm">Primary</button>
                  <button class="btn btn-secondary btn-sm">Secondary</button>
                  <button class="btn btn-accent btn-sm">Accent</button>
                  <button class="btn btn-info btn-sm">Info</button>
                  <button class="btn btn-success btn-sm">Success</button>
                  <button class="btn btn-warning btn-sm">Warning</button>
                  <button class="btn btn-error btn-sm">Error</button>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div
                    class="rounded-xl border border-base-300 bg-base-200 p-3"
                  >
                    <div class="text-xs uppercase opacity-70">base-100</div>
                    <div class="text-sm font-semibold">
                      {{ themeForm.values?.['base-100'] || '#ffffff' }}
                    </div>
                  </div>

                  <div
                    class="rounded-xl border border-base-300 bg-base-200 p-3"
                  >
                    <div class="text-xs uppercase opacity-70">primary</div>
                    <div class="text-sm font-semibold">
                      {{ themeForm.values?.primary || '#ffffff' }}
                    </div>
                  </div>

                  <div
                    class="rounded-xl border border-base-300 bg-base-200 p-3"
                  >
                    <div class="text-xs uppercase opacity-70">accent</div>
                    <div class="text-sm font-semibold">
                      {{ themeForm.values?.accent || '#ffffff' }}
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-xl border border-base-300 bg-base-200 p-3 text-sm"
                >
                  This is how your theme might feel in the wild. Slightly
                  glamorous. Mildly dangerous.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

const themeError = ref('')
const isSaving = ref(false)
const isApplyingPreview = ref(false)

const themeForm = themeStore.themeForm

onMounted(() => {
  themeStore.initializeThemeFormIfNeeded()
})

const colorKeys = computed(() => themeStore.colorKeys)

const applyAfterSave = computed({
  get: () => themeStore.applyAfterSave,
  set: (value: boolean) => themeStore.setApplyAfterSave(value),
})

const updateMode = computed(() => Boolean(themeForm.id))

const trimmedName = computed(() => themeForm.name?.trim() || '')

function getSafeThemeValues(val: unknown): Record<string, string> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
    ? (val as Record<string, string>)
    : {}
}

function onColorInput(event: Event, key: string) {
  const value = (event.target as HTMLInputElement)?.value
  if (!value) return
  themeStore.setColorValue(key, value)
}

function resetTheme() {
  themeError.value = ''
  themeStore.resetThemeForm()
}

function randomizeTheme() {
  themeError.value = ''
  themeStore.fillWithRandomTheme()
}

const previewStyleObject = computed<Record<string, string>>(() => {
  const values = getSafeThemeValues(themeForm.values)
  const style: Record<string, string> = {
    backgroundColor: values['base-100'] || '#ffffff',
    color: values.neutral || '#111111',
  }

  for (const [key, value] of Object.entries(values)) {
    style[`--${convertToDaisyVar(key)}`] = hexToRgb(value)
  }

  return style
})

function convertToDaisyVar(key: string) {
  const map: Record<string, string> = {
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

  return map[key] || key
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const bigint = Number.parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

function getPreviewCardStyle(values: Record<string, string>) {
  const style: Record<string, string> = {}

  for (const [key, value] of Object.entries(values)) {
    style[`--${convertToDaisyVar(key)}`] = hexToRgb(value)
  }

  style.padding = '1rem'
  return style
}

async function applyBuiltInTheme(theme: string) {
  const result = await themeStore.setActiveTheme(theme)
  themeError.value = result.success
    ? ''
    : result.message || 'Failed to apply theme'

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
    room: theme.room || '',
    values: getSafeThemeValues(theme.values),
  })

  themeError.value = result.success
    ? ''
    : result.message || 'Failed to apply theme'

  if (result.success) {
    milestoneStore.rewardMilestone(9)
  }
}

async function applyPreviewTheme() {
  if (!trimmedName.value) {
    themeError.value = 'Give your theme a name first.'
    return
  }

  isApplyingPreview.value = true
  themeError.value = ''

  try {
    const result = await themeStore.setActiveTheme({
      id: themeForm.id,
      userId: themeForm.userId,
      name: trimmedName.value,
      prefersDark: themeForm.prefersDark ?? false,
      colorScheme: themeForm.colorScheme || 'light',
      isPublic: themeForm.isPublic ?? false,
      tagline: themeForm.tagline || null,
      room: themeForm.room || '',
      values: getSafeThemeValues(themeForm.values),
    })

    themeError.value = result.success
      ? ''
      : result.message || 'Failed to preview theme'

    if (result.success) {
      milestoneStore.rewardMilestone(9)
    }
  } catch (error: unknown) {
    themeError.value =
      error instanceof Error ? error.message : 'Failed to preview theme'
  } finally {
    isApplyingPreview.value = false
  }
}

async function saveTheme() {
  if (!trimmedName.value) {
    themeError.value = 'Theme name is required.'
    return
  }

  isSaving.value = true
  themeError.value = ''

  try {
    themeForm.name = trimmedName.value

    const payload = {
      id: themeForm.id,
      userId: themeForm.userId,
      name: themeForm.name,
      prefersDark: themeForm.prefersDark ?? false,
      colorScheme: themeForm.colorScheme || 'light',
      isPublic: themeForm.isPublic ?? false,
      tagline: themeForm.tagline || null,
      room: themeForm.room || '',
      values: getSafeThemeValues(themeForm.values),
    }

    if (updateMode.value && themeForm.id) {
      await themeStore.updateTheme(themeForm.id, payload)
    } else {
      await themeStore.addTheme(payload)
    }

    await themeStore.getThemes(true)

    if (applyAfterSave.value) {
      const result = await themeStore.setActiveTheme(payload)
      themeError.value = result.success
        ? ''
        : result.message || 'Failed to apply saved theme'
    }

    milestoneStore.rewardMilestone(9)
    themeStore.resetThemeForm()
  } catch (error: unknown) {
    themeError.value =
      error instanceof Error ? error.message : 'Theme save failed'
  } finally {
    isSaving.value = false
  }
}
</script>
