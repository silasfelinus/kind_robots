<!-- /components/builder/builder-summary.vue -->
<template>
  <section class="flex min-h-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-success/80">Complete</p>
        <h2 class="text-3xl font-black text-base-content">{{ title }}</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/60">
          The required cards are complete. This is the generic final screen, ready for a model-specific interact component when you want the deluxe version.
        </p>
      </div>

      <button type="button" class="btn btn-sm btn-primary rounded-xl" @click="store.randomCard()">
        <Icon name="kind-icon:cards" class="h-4 w-4" />
        Revisit deck
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
      <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="mb-3 text-xs font-black uppercase tracking-widest text-base-content/50">Sheet data</p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            v-for="entry in sheetEntries"
            :key="entry.key"
            class="rounded-2xl bg-base-100 p-3"
          >
            <p class="text-[0.6rem] font-black uppercase tracking-widest text-base-content/35">{{ entry.key }}</p>
            <p class="mt-1 line-clamp-5 text-sm font-semibold leading-relaxed text-base-content/75">{{ entry.value }}</p>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-200">
        <div class="relative aspect-4/3 bg-base-300">
          <img v-if="imagePath" :src="imagePath" :alt="title" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center">
            <Icon name="kind-icon:blueprint" class="h-16 w-16 text-base-content/20" />
          </div>
          <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-100/95 to-transparent p-4">
            <p class="font-black text-base-content">{{ title }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-3 p-4">
          <button type="button" class="btn btn-primary rounded-2xl" @click="store.setStatus('Generic builder summary acknowledged.')">
            <Icon name="kind-icon:check" class="h-4 w-4" />
            Looks good
          </button>
          <button type="button" class="btn btn-ghost rounded-2xl border border-base-300" @click="store.resetBuilder(false)">
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            New local draft
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const title = computed(() => String(store.sheet.name || store.sheet.title || store.activeConfig.title || 'Completed Builder'))
const imagePath = computed(() => typeof store.sheet.imagePath === 'string' ? store.sheet.imagePath : '')

const sheetEntries = computed(() => {
  return Object.entries(store.sheet)
    .map(([key, value]) => ({ key, value: stringifyValue(value) }))
    .filter((entry) => entry.value.trim().length > 0)
})

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) => typeof entry === 'object' ? JSON.stringify(entry) : String(entry))
      .join(', ')
  }
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (value == null) return ''
  return String(value)
}
</script>
