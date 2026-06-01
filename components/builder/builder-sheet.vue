<!-- /components/builder/builder-sheet.vue -->
<template>
  <aside class="flex flex-col gap-3 overflow-y-auto">
    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div class="relative aspect-3/2 bg-base-300">
        <img
          v-if="imagePath"
          :src="imagePath"
          :alt="title"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <Icon name="kind-icon:blueprint" class="h-10 w-10 text-primary/25" />
          <p class="text-xs italic text-base-content/35">
            Sheet waiting for its portrait era.
          </p>
        </div>
      </div>
      <div class="p-3">
        <p class="truncate font-black leading-tight text-base-content">
          {{ title }}
        </p>
        <p class="mt-0.5 truncate text-xs text-base-content/50">
          {{ store.activeConfig.label }}
        </p>
      </div>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="mb-2 flex items-center justify-between">
        <p
          class="text-xs font-black uppercase tracking-widest text-base-content/40"
        >
          Progress
        </p>
        <p class="text-xs font-black tabular-nums text-primary">
          {{ completedCount }}/{{ requiredCount }}
        </p>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-base-300">
        <div
          class="h-full rounded-full bg-primary transition-all duration-500"
          :style="{ width: `${progressPct}%` }"
        />
      </div>
    </div>

    <div v-if="store.completedCardList.length" class="flex flex-col gap-2">
      <section
        v-for="card in store.completedCardList"
        :key="card.key"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <Icon :name="card.icon" class="h-4 w-4 shrink-0 text-primary" />
            <p class="truncate text-sm font-black text-base-content">
              {{ card.label }}
            </p>
          </div>
          <button
            type="button"
            class="btn btn-xs btn-ghost rounded-xl text-error"
            @click="store.removeSection(card.key)"
          >
            Clear
          </button>
        </div>

        <div class="flex flex-col gap-1">
          <div
            v-for="field in visibleFields(card.restoresFields)"
            :key="field.key"
            class="rounded-xl bg-base-200 px-3 py-2"
          >
            <p
              class="text-[0.6rem] font-black uppercase tracking-widest text-base-content/35"
            >
              {{ field.key }}
            </p>
            <p
              class="mt-0.5 line-clamp-3 text-xs font-semibold leading-relaxed text-base-content/70"
            >
              {{ field.value }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <div
      v-else
      class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-4 text-center"
    >
      <Icon
        name="kind-icon:cards"
        class="mx-auto h-8 w-8 text-base-content/25"
      />
      <p class="mt-2 text-sm font-bold text-base-content/60">
        No completed cards yet.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const title = computed(() =>
  String(
    store.sheet.name ||
      store.sheet.title ||
      store.activeConfig.title ||
      'Untitled builder',
  ),
)
const imagePath = computed(() =>
  typeof store.sheet.imagePath === 'string' ? store.sheet.imagePath : '',
)
const requiredCount = computed(
  () => store.activeConfig.requiredCardKeys?.length || store.cards.length || 1,
)
const completedCount = computed(() => {
  const required =
    store.activeConfig.requiredCardKeys ?? store.cards.map((card) => card.key)
  return required.filter((key) => store.completedCards[key]).length
})
const progressPct = computed(() =>
  Math.round((completedCount.value / requiredCount.value) * 100),
)

function visibleFields(
  fields: string[],
): Array<{ key: string; value: string }> {
  return fields
    .map((key) => ({ key, value: stringifyValue(store.sheet[key]) }))
    .filter((entry) => entry.value.trim().length > 0)
}

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === 'object' ? JSON.stringify(entry) : String(entry),
      )
      .join(', ')
  }
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (value == null) return ''
  return String(value)
}
</script>
