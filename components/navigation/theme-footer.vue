<!-- /components/navigation/theme-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
        >
          <icon name="kind-icon:theme" class="h-6 w-6" />
        </div>

        <div class="flex min-w-0 flex-col gap-1 overflow-hidden">
          <div class="truncate text-sm font-semibold">
            {{ activeThemeLabel }}
          </div>
          <div class="truncate text-xs text-base-content/70">
            {{ compactSubtitle }}
          </div>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-primary"
          @click="openThemeLab"
        >
          Open
        </button>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,22rem)]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex shrink-0 items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">🎨 Theme Footer</h2>
            <div class="text-xs text-base-content/70">
              Flip themes without leaving the footer like a civilized goblin.
            </div>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-primary"
            @click="openThemeLab"
          >
            Theme Lab
          </button>
        </div>

        <div class="mt-3 shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="theme in quickThemes"
            :key="theme"
            type="button"
            class="rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-sm font-semibold transition hover:bg-base-300"
            :class="{
              'border-primary bg-primary/15 text-primary':
                currentTheme === theme,
            }"
            @click="applyBuiltInTheme(theme)"
          >
            {{ theme }}
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-hidden">
          <div
            class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-200 p-2"
          >
            <theme-picker class="h-full w-full" />
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 shrink-0 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Active Theme
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="flex flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Current
              </div>
              <div class="mt-1 truncate text-lg font-semibold">
                {{ activeThemeLabel }}
              </div>
              <div class="mt-1 text-xs text-base-content/70">
                {{ activeThemeMode }}
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
            >
              <div class="mb-2 font-semibold">Theme Snapshot</div>
              <pre class="max-h-64 overflow-auto whitespace-pre-wrap text-xs">{{
                inspectValues
              }}</pre>
            </div>

            <p
              v-if="themeError"
              class="rounded-2xl border border-error bg-error/10 p-3 text-sm text-error whitespace-pre-wrap"
            >
              {{ themeError }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,24rem)]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex shrink-0 items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">🎨 Theme Footer</h2>
            <div class="text-xs text-base-content/70">
              Full-size mode for browsing, testing, and not getting gaslit by
              stale theme values.
            </div>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-primary"
            @click="openThemeLab"
          >
            Theme Lab
          </button>
        </div>

        <div
          class="mt-3 shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        >
          <button
            v-for="theme in extendedThemes"
            :key="theme"
            type="button"
            class="rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-sm font-semibold transition hover:bg-base-300"
            :class="{
              'border-primary bg-primary/15 text-primary':
                currentTheme === theme,
            }"
            @click="applyBuiltInTheme(theme)"
          >
            {{ theme }}
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-hidden">
          <div
            class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <theme-picker class="h-full w-full" />
          </div>
        </div>
      </div>

      <div class="hidden min-h-0 xl:flex xl:flex-col">
        <div
          class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div
            class="mb-2 shrink-0 text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Theme Tools
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="grid grid-cols-1 gap-3">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div
                  class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
                >
                  Current Theme
                </div>
                <div class="mt-1 truncate text-lg font-semibold">
                  {{ activeThemeLabel }}
                </div>
                <div class="mt-1 text-xs text-base-content/70">
                  {{ activeThemeMode }}
                </div>
              </div>

              <button
                type="button"
                class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-3 py-3 text-left transition hover:bg-base-300"
                @click="openThemeLab"
              >
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
                >
                  <icon name="kind-icon:theme" class="h-6 w-6" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="truncate font-semibold">Open Theme Lab</div>
                  <div class="line-clamp-3 text-xs text-base-content/70">
                    Jump to the full theme area when you want deeper controls
                    and editing.
                  </div>
                </div>
              </button>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
              >
                <div class="mb-2 font-semibold">Theme Snapshot</div>
                <pre
                  class="max-h-72 overflow-auto whitespace-pre-wrap text-xs"
                  >{{ inspectValues }}</pre
                >
              </div>

              <p
                v-if="themeError"
                class="rounded-2xl border border-error bg-error/10 p-3 text-sm text-error whitespace-pre-wrap"
              >
                {{ themeError }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/theme-footer.vue
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'

const router = useRouter()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()

const themeError = ref('')
const inspectValues = ref('{}')

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const currentTheme = computed(() => themeStore.currentTheme)

const activeThemeLabel = computed(() => {
  return typeof themeStore.activeTheme === 'string'
    ? themeStore.activeTheme
    : themeStore.activeTheme?.name || themeStore.currentTheme
})

const activeThemeMode = computed(() => {
  return typeof themeStore.activeTheme === 'string'
    ? 'Built-in DaisyUI theme'
    : 'Custom theme'
})

const compactSubtitle = computed(() => {
  return typeof themeStore.activeTheme === 'string'
    ? 'Built-in theme selected'
    : 'Custom theme selected'
})

const quickThemes = ['retro', 'cupcake', 'forest', 'dracula']
const extendedThemes = [
  'retro',
  'cupcake',
  'forest',
  'dracula',
  'night',
  'dim',
  'nord',
  'sunset',
  'bumblebee',
  'luxury',
]

async function applyBuiltInTheme(theme: string) {
  try {
    const result = await themeStore.setActiveTheme(theme)

    if (!result.success) {
      themeError.value = result.message || 'Failed to apply theme.'
      return
    }

    themeError.value = ''

    const snapshot = await themeStore.getActiveThemeSnapshot(theme)
    inspectValues.value = JSON.stringify(snapshot, null, 2)
  } catch (error: unknown) {
    themeError.value = (error as Error).message || 'Theme switch failed.'
  }
}

watchEffect(async () => {
  const snapshot =
    typeof themeStore.activeTheme === 'string'
      ? await themeStore.getActiveThemeSnapshot(themeStore.activeTheme)
      : themeStore.themeForm

  inspectValues.value = JSON.stringify(snapshot, null, 2)
})

async function openThemeLab() {
  await router.push('/themes')
}
</script>
