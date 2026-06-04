<!-- /components/navigation/workspace-sheet.vue -->
<template>
  <aside class="flex min-h-0 flex-col gap-3 overflow-y-auto">
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

    <template v-if="!isBuilder || view === 'info'">
      <div
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="relative aspect-[3/2] bg-base-300">
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

          <p
            v-if="showDebugPath"
            class="mt-2 break-all rounded-xl bg-base-200 px-2 py-1 text-[0.65rem] text-base-content/45"
          >
            {{ imagePath || 'No image path resolved' }}
          </p>
        </div>
      </div>
    </template>

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

      <div
        v-if="builderStore.completedCardList.length"
        class="flex flex-col gap-2"
      >
        <section
          v-for="card in builderStore.completedCardList"
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
              @click="builderStore.removeSection(card.key)"
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
import { useRoute } from 'vue-router'
import { useBuilderStore } from '@/stores/builderStore'
import { usePageStore } from '@/stores/pageStore'
import { NAV_CARDS } from '@/stores/helpers/navCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

type ImageCard = BuilderCard & {
  image?: string
  imagePath?: string
  splashImage?: string
  payload?: Record<string, unknown>
}

const route = useRoute()
const builderStore = useBuilderStore()
const pageStore = usePageStore()

const view = ref<'info' | 'sheet'>('info')
const showDebugPath = ref(false)

const isBuilder = computed(() => {
  return pageStore.cardsKey === 'builderCards' && builderStore.cards.length > 0
})

const builderCards = computed<BuilderCard[]>(() => {
  return builderStore.visibleCards.length
    ? builderStore.visibleCards
    : builderStore.cards
})

const sourceCards = computed<BuilderCard[]>(() => {
  if (isBuilder.value && builderCards.value.length) {
    return builderCards.value
  }

  if (pageStore.cards.length) {
    return pageStore.cards
  }

  return NAV_CARDS
})

const routeCardKey = computed(() => {
  return (
    sourceCards.value.find((card) => getCardPath(card) === route.path)?.key ??
    sourceCards.value[0]?.key ??
    ''
  )
})

const activeCardKey = computed(() => {
  if (isBuilder.value) {
    return builderStore.activeCardKey || sourceCards.value[0]?.key || ''
  }

  return pageStore.workspaceCardKey || routeCardKey.value
})

const activeCard = computed(() => {
  return (
    sourceCards.value.find((card) => card.key === activeCardKey.value) ?? null
  )
})

const title = computed(() => {
  if (isBuilder.value) {
    return String(
      builderStore.sheet.name ||
        builderStore.sheet.title ||
        activeCard.value?.title ||
        builderStore.activeConfig.title ||
        pageStore.title,
    )
  }

  return activeCard.value?.title || pageStore.title
})

const label = computed(() => {
  if (isBuilder.value) {
    return activeCard.value?.label || builderStore.activeConfig.label
  }

  return activeCard.value?.label || pageStore.room
})

const narrative = computed(() => {
  if (isBuilder.value) {
    return String(
      builderStore.sheet.narrative ||
        builderStore.sheet.description ||
        activeCard.value?.narrative ||
        builderStore.activeConfig.splash?.description ||
        pageStore.description,
    )
  }

  return (
    activeCard.value?.narrative ||
    activeCard.value?.tagline ||
    pageStore.description ||
    pageStore.subtitle
  )
})

const imagePath = computed(() => {
  const card = activeCard.value as ImageCard | null

  if (isBuilder.value) {
    const sheetImage = builderStore.sheet.imagePath

    if (typeof sheetImage === 'string' && sheetImage) {
      return normalizeImagePath(sheetImage)
    }

    return normalizeImagePath(
      firstString([
        card?.heroImage,
        card?.deckImage,
        card?.image,
        card?.imagePath,
        card?.splashImage,
        card?.payload?.heroImage,
        card?.payload?.deckImage,
        card?.payload?.image,
        card?.payload?.imagePath,
        builderStore.activeConfig.splash?.imagePath,
        pageStore.image,
      ]),
    )
  }

  return normalizeImagePath(
    firstString([
      card?.heroImage,
      card?.deckImage,
      card?.image,
      card?.imagePath,
      card?.splashImage,
      card?.payload?.heroImage,
      card?.payload?.deckImage,
      card?.payload?.image,
      card?.payload?.imagePath,
      pageStore.image,
    ]),
  )
})

const placeholderIcon = computed(() => {
  return activeCard.value?.icon || pageStore.icon || 'kind-icon:blueprint'
})

const requiredCount = computed(() => {
  return (
    builderStore.activeConfig.requiredCardKeys?.length ||
    builderStore.cards.length ||
    1
  )
})

const completedCount = computed(() => {
  const required =
    builderStore.activeConfig.requiredCardKeys ??
    builderStore.cards.map((card) => card.key)

  return required.filter((key) => builderStore.completedCards[key]).length
})

const progressPct = computed(() => {
  return Math.round((completedCount.value / requiredCount.value) * 100)
})

function getCardPath(card: BuilderCard): string {
  const path = card.payload?.path ?? card.payload?.to ?? card.payload?.href
  return typeof path === 'string' ? path : ''
}

function visibleFields(
  fields: string[],
): Array<{ key: string; value: string }> {
  return fields
    .map((key) => ({ key, value: stringifyValue(builderStore.sheet[key]) }))
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

function firstString(values: unknown[]): string {
  const found = values.find((value) => {
    return typeof value === 'string' && value.trim().length > 0
  })

  return typeof found === 'string' ? found : ''
}

function normalizeImagePath(path: string): string {
  const cleanPath = path.trim()

  if (!cleanPath) return ''
  if (cleanPath.startsWith('/') || cleanPath.startsWith('http')) return cleanPath
  if (cleanPath.startsWith('images/')) return `/${cleanPath}`

  return `/images/${cleanPath}`
}
</script>