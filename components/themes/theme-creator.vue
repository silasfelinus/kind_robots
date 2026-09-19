<template>
  <section class="kr-panel-flat overflow-hidden">
    <header
      class="flex flex-col gap-3 border-b border-base-300 bg-base-200/70 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"
        >
          <Icon name="kind-icon:palette" class="kr-icon-5" />
        </span>

        <div class="min-w-0">
          <p class="kr-text-black-base truncate">
            {{ updateMode ? 'Edit Theme' : 'Theme Creator' }}
          </p>
          <p class="kr-text-dim-xs">
            Build, preview, and save a custom palette.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="label cursor-pointer gap-2 py-0">
          <span class="text-xs font-semibold">Public</span>
          <input
            v-model="themeForm.isPublic"
            type="checkbox"
            class="toggle toggle-sm"
          />
        </label>

        <label class="label cursor-pointer gap-2 py-0">
          <span class="text-xs font-semibold">Apply after save</span>
          <input
            v-model="applyAfterSave"
            type="checkbox"
            class="toggle toggle-sm"
          />
        </label>

        <button
          v-if="updateMode"
          class="btn btn-ghost btn-sm"
          type="button"
          @click="newTheme"
        >
          <Icon name="kind-icon:plus" class="kr-icon-4" />
          New
        </button>
      </div>
    </header>

    <div
      class="grid gap-4 p-4 [grid-template-columns:repeat(auto-fit,minmax(min(22rem,100%),1fr))]"
    >
      <div class="space-y-4">
        <div
          class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))]"
        >
          <label
            v-for="color in colorKeys"
            :key="color"
            class="flex items-center gap-3 kr-panel-muted p-3"
          >
            <span class="min-w-0 flex-1 truncate text-sm font-semibold">
              {{ themeStore.labelFromKey(color) }}
            </span>

            <input
              type="color"
              :value="themeForm.values?.[color] || '#ffffff'"
              class="h-9 w-14 cursor-pointer rounded-xl border border-base-300 bg-transparent p-1"
              :aria-label="`Choose ${themeStore.labelFromKey(color)} color`"
              @input="onColorInput($event, color)"
            />
          </label>
        </div>

        <div
          class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]"
        >
          <label class="space-y-1">
            <span class="kr-text-dim-xs">Name</span>
            <input
              v-model="themeForm.name"
              type="text"
              class="input w-full bg-base-100"
              placeholder="Theme name"
            />
          </label>

          <label class="space-y-1">
            <span class="kr-text-dim-xs">Room or vibe</span>
            <input
              v-model="themeForm.room"
              type="text"
              class="input w-full bg-base-100"
              placeholder="Cozy arcade, moonlit library…"
            />
          </label>

          <label class="space-y-1">
            <span class="kr-text-dim-xs">Tagline</span>
            <input
              v-model="themeForm.tagline"
              type="text"
              class="input w-full bg-base-100"
              placeholder="Optional tagline"
            />
          </label>

          <label class="space-y-1">
            <span class="kr-text-dim-xs">Color scheme</span>
            <select
              v-model="themeForm.colorScheme"
              class="select w-full bg-base-100"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-accent btn-sm"
            type="button"
            @click="randomizeTheme"
          >
            <Icon name="kind-icon:dice" class="kr-icon-4" />
            Randomize
          </button>

          <button
            class="btn btn-ghost btn-sm"
            type="button"
            @click="resetTheme"
          >
            <Icon name="kind-icon:refresh" class="kr-icon-4" />
            Reset
          </button>

          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="isApplyingPreview || !trimmedName"
            @click="applyPreviewTheme"
          >
            <Icon name="kind-icon:paintbrush" class="kr-icon-4" />
            {{ isApplyingPreview ? 'Applying…' : 'Preview' }}
          </button>

          <button
            class="btn btn-primary btn-sm"
            type="button"
            :disabled="isSaving || !trimmedName"
            @click="saveTheme"
          >
            <Icon name="kind-icon:save" class="kr-icon-4" />
            {{
              isSaving
                ? 'Saving…'
                : updateMode
                  ? 'Update Theme'
                  : 'Save Theme'
            }}
          </button>
        </div>

        <p
          v-if="themeError"
          class="kr-note kr-note-error whitespace-pre-wrap p-3 text-sm"
        >
          {{ themeError }}
        </p>
      </div>

      <aside class="kr-panel-muted p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <p class="kr-text-black-sm">Live Preview</p>
            <p class="kr-text-dim-xs">A small sample of the palette in use.</p>
          </div>

          <span class="kr-badge-ghost-sm">
            {{ themeForm.colorScheme || 'light' }}
          </span>
        </div>

        <div
          class="rounded-2xl border border-base-300 bg-base-100 p-4 text-base-content"
          :style="previewStyleObject"
        >
          <p class="kr-text-black-lg">{{ trimmedName || 'Unnamed Theme' }}</p>
          <p class="kr-text-dim-sm mt-1">
            {{ themeForm.tagline || 'A suspiciously stylish color experiment.' }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button class="btn btn-primary btn-sm" type="button">Primary</button>
            <button class="btn btn-secondary btn-sm" type="button">
              Secondary
            </button>
            <button class="btn btn-accent btn-sm" type="button">Accent</button>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-2">
            <div
              class="rounded-xl bg-base-200 p-2 text-center text-xs font-bold"
            >
              base
            </div>
            <div
              class="rounded-xl bg-info p-2 text-center text-xs font-bold text-info-content"
            >
              info
            </div>
            <div
              class="rounded-xl bg-success p-2 text-center text-xs font-bold text-success-content"
            >
              success
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
const achievementStore = useAchievementStore()
const { themeForm } = storeToRefs(themeStore)

const themeError = ref('')
const isSaving = ref(false)
const isApplyingPreview = ref(false)

const colorKeys = computed(() => themeStore.colorKeys)

const applyAfterSave = computed({
  get: () => themeStore.applyAfterSave,
  set: (value: boolean) => themeStore.setApplyAfterSave(value),
})

const updateMode = computed(() => Boolean(themeForm.value.id))
const trimmedName = computed(() => themeForm.value.name?.trim() || '')

onMounted(() => {
  themeStore.initializeThemeFormIfNeeded()
})

function safeThemeValues(value: unknown): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {}
}

function onColorInput(event: Event, key: string): void {
  const value = (event.target as HTMLInputElement).value
  if (!value) return
  themeStore.setColorValue(key, value)
}

function newTheme(): void {
  themeError.value = ''
  themeStore.resetThemeForm()
  themeStore.fillWithRandomTheme()
}

function resetTheme(): void {
  themeError.value = ''
  themeStore.resetThemeForm()
}

function randomizeTheme(): void {
  themeError.value = ''
  themeStore.fillWithRandomTheme()
}

const previewStyleObject = computed<Record<string, string>>(() => {
  const values = safeThemeValues(themeForm.value.values)
  const style: Record<string, string> = {}

  for (const [key, value] of Object.entries(values)) {
    style[`--${key}`] = value
    style[`--color-${key}`] = value
  }

  return style
})

function payload() {
  return {
    id: themeForm.value.id,
    userId: themeForm.value.userId,
    name: trimmedName.value,
    prefersDark: themeForm.value.prefersDark ?? false,
    colorScheme: themeForm.value.colorScheme || 'light',
    isPublic: themeForm.value.isPublic ?? false,
    tagline: themeForm.value.tagline || null,
    room: themeForm.value.room || '',
    values: safeThemeValues(themeForm.value.values),
  }
}

async function applyPreviewTheme(): Promise<void> {
  if (!trimmedName.value) return

  isApplyingPreview.value = true
  themeError.value = ''

  try {
    const result = await themeStore.setActiveTheme(payload())

    if (!result.success) {
      themeError.value = result.message || 'Failed to preview theme.'
      return
    }

    achievementStore.rewardAchievementByCode('theme')
  } catch (error: unknown) {
    themeError.value =
      error instanceof Error ? error.message : 'Failed to preview theme.'
  } finally {
    isApplyingPreview.value = false
  }
}

async function saveTheme(): Promise<void> {
  if (!trimmedName.value) {
    themeError.value = 'Theme name is required.'
    return
  }

  isSaving.value = true
  themeError.value = ''

  try {
    const nextTheme = payload()

    if (updateMode.value && themeForm.value.id) {
      await themeStore.updateTheme(themeForm.value.id, nextTheme)

      if (themeStore.lastError) {
        throw new Error(themeStore.lastError)
      }
    } else {
      const result = await themeStore.addTheme(nextTheme)

      if (!result.success) {
        throw new Error(result.message || 'Theme save failed.')
      }
    }

    await themeStore.getThemes(true)

    if (applyAfterSave.value) {
      const result = await themeStore.setActiveTheme(nextTheme)

      if (!result.success) {
        throw new Error(result.message || 'Failed to apply saved theme.')
      }
    }

    achievementStore.rewardAchievementByCode('theme')
    themeStore.resetThemeForm()
  } catch (error: unknown) {
    themeError.value =
      error instanceof Error ? error.message : 'Theme save failed.'
  } finally {
    isSaving.value = false
  }
}
</script>
