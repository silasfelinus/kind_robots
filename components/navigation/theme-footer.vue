<!-- /components/navigation/theme-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
        >
          <icon name="kind-icon:theme" class="h-6 w-6" />
        </div>

        <div class="flex min-w-0 flex-col gap-1 overflow-hidden">
          <div class="truncate text-sm font-semibold">Theme</div>
          <div class="truncate text-xs text-base-content/70">
            Pick a look without leaving the footer.
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
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,22rem)]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">🎨 Theme Footer</h2>
            <div class="text-xs text-base-content/70">
              Switch vibes fast. No wandering required.
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
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Quick Theme Notes
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Footer Mode
            </div>
            <div class="mt-1 text-lg font-semibold">Open</div>
          </div>

          <div
            class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
          >
            Open mode keeps the picker front and center while still leaving room
            for a little supporting context. Very civilized. Very smug.
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,24rem)]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">🎨 Theme Footer</h2>
            <div class="text-xs text-base-content/70">
              Full-size footer mode for browsing and switching themes.
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
            class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Theme Tools
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto">
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
                  Jump to the full theme area when you want deeper controls.
                </div>
              </div>
            </button>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/70"
            >
              Priority mode gives the picker room to breathe instead of stuffing
              it into a shoebox like a Victorian interface.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/theme-footer.vue
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

const router = useRouter()
const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

async function openThemeLab() {
  await router.push('/themes')
}
</script>
