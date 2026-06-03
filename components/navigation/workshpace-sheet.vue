<!-- /components/builder/workspace-sheet.vue -->
<template>
  <aside class="flex min-h-0 flex-col gap-3 overflow-y-auto">
    <!-- View toggle (builder dashboards only) -->
    <div
      v-if="isBuilder"
      class="grid grid-cols-2 gap-1 rounded-2xl border border-base-300 bg-base-200 p-1"
    >
      <button
        type="button"
        class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors"
        :class="
          view === 'info'
            ? 'bg-base-100 text-primary shadow-sm'
            : 'text-base-content/45 hover:text-base-content/70'
        "
        @click="view = 'info'"
      >
        <Icon name="kind-icon:info" class="h-3.5 w-3.5" />
        Info
      </button>
      <button
        type="button"
        class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors"
        :class="
          view === 'sheet'
            ? 'bg-base-100 text-primary shadow-sm'
            : 'text-base-content/45 hover:text-base-content/70'
        "
        @click="view = 'sheet'"
      >
        <Icon name="kind-icon:cards" class="h-3.5 w-3.5" />
        Sheet
        <span
          v-if="completedCount"
          class="rounded-full bg-primary/15 px-1.5 text-[0.6rem] tabular-nums text-primary"
        >
          {{ completedCount }}
        </span>
      </button>
    </div>

    <!-- ── INFO VIEW (default, and the only view off-builder) ───── -->
    <template v-if="!isBuilder || view === 'info'">
      <div
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
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
            <Icon :name="placeholderIcon" class="h-10 w-10 text-primary/25" />
            <p class="text-xs italic text-base-content/35">
              Sheet waiting for its portrait era.
            </p>
          </div>
        </div>
        <div class="flex flex-col gap-1 p-4">
          <p class="font-black leading-tight text-base-content">
            {{ title }}
          </p>
          <p
            class="text-xs font-black uppercase tracking-widest text-primary/70"
          >
            {{ label }}
          </p>
          <p
            v-if="narrative"
            class="mt-1 text-sm leading-relaxed text-base-content/65"
          >
            {{ narrative }}
          </p>
        </div>
      </div>
    </template>

    <!-- ── SHEET VIEW: progress + completed cards (builder only) ── -->
    <template v-else>
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
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { useNavStore } from '@/stores/navStore'
import { NAV_CARDS } from '@/stores/helpers/navCards'

const store = useBuilderStore()
const navStore = useNavStore()

const view = ref<'info' | 'sheet'>('info')

// Which dashboard are we on? The shared shell mounts this sheet everywhere.
const dashboardKey = computed(() => navStore.dashboardShell?.dashboardKey || '')

// Only the builder dashboard drives an actual sheet/toggle.
const isBuilder = computed(() => dashboardKey.value === 'builder')

// For non-builder dashboards, pull hero + narration from the matching nav card.
const navCard = computed(() =>
  NAV_CARDS.find((card) => card.payload?.dashboardKey === dashboardKey.value),
)

const title = computed(() => {
  if (isBuilder.value) {
    return String(
      store.sheet.name ||
        store.sheet.title ||
        store.activeConfig.title ||
        'Untitled builder',
    )
  }
  return navCard.value?.title || 'Kind Robots'
})

const label = computed(() => {
  if (isBuilder.value) return store.activeConfig.label
  return navCard.value?.label || ''
})

const narrative = computed(() => {
  if (isBuilder.value) {
    return String(
      store.sheet.narrative ||
        store.sheet.description ||
        store.activeCard?.narrative ||
        store.activeConfig.splash?.description ||
        '',
    )
  }
  return navCard.value?.narrative || ''
})

const imagePath = computed(() => {
  if (isBuilder.value) {
    return typeof store.sheet.imagePath === 'string'
      ? store.sheet.imagePath
      : ''
  }
  return navCard.value?.heroImage || ''
})

const placeholderIcon = computed(() =>
  isBuilder.value
    ? 'kind-icon:blueprint'
    : navCard.value?.icon || 'kind-icon:blueprint',
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
