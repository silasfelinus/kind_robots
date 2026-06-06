<!-- /components/navigation/workspace-sheet.vue -->
<template>
  <aside class="flex min-h-0 flex-col gap-4 overflow-y-auto p-1">
    <div
      class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="relative aspect-4/3 overflow-hidden bg-base-300">
        <img
          v-if="imagePath"
          :src="imagePath"
          :alt="title"
          class="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />

        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <Icon :name="placeholderIcon" class="h-16 w-16 text-primary/25" />

          <p class="text-base font-bold italic text-base-content/40">
            Sheet waiting for its portrait era.
          </p>
        </div>

        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-base-100 via-base-100/50 to-transparent"
        />

        <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p
            class="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-base-100/85 px-3 py-1 text-sm font-black uppercase tracking-widest text-primary shadow-sm backdrop-blur"
          >
            <Icon :name="placeholderIcon" class="h-4 w-4 shrink-0" />
            <span class="truncate">{{ label }}</span>
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3 p-4 sm:p-5">
        <h2
          class="text-3xl font-black leading-none tracking-tight text-base-content sm:text-4xl"
        >
          {{ title }}
        </h2>

        <p
          v-if="narrative"
          class="text-base font-semibold leading-relaxed text-base-content/70 sm:text-lg"
        >
          {{ narrative }}
        </p>

        <p
          v-if="showDebugPath"
          class="break-all rounded-xl bg-base-200 px-3 py-2 text-xs font-semibold text-base-content/45"
        >
          {{ imagePath || 'No image path resolved' }}
        </p>
      </div>
    </div>

    <template v-if="isBuilder">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
          <p
            class="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-base-content/45"
          >
            <Icon name="kind-icon:sparkles" class="h-4 w-4 text-primary/70" />
            Progress
          </p>

          <p class="text-sm font-black tabular-nums text-primary">
            {{ completedCount }}/{{ requiredCount }}
          </p>
        </div>

        <div class="h-2.5 overflow-hidden rounded-full bg-base-300">
          <div
            class="h-full rounded-full bg-primary transition-all duration-500"
            :style="{ width: `${progressPct}%` }"
          />
        </div>
      </div>

      <div
        v-if="builderStore.completedCardList.length"
        class="flex flex-col gap-3"
      >
        <section
          v-for="card in builderStore.completedCardList"
          :key="card.key"
          class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <img
            v-if="cardImagePath(card)"
            :src="cardImagePath(card)"
            :alt="card.label"
            class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 blur-sm transition-all duration-500 group-hover:scale-105 group-hover:opacity-20"
          />

          <div
            class="pointer-events-none absolute inset-0 bg-linear-to-br from-base-100 via-base-100/95 to-base-100/75"
          />

          <div class="relative flex flex-col gap-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-sm"
                >
                  <img
                    v-if="cardImagePath(card)"
                    :src="cardImagePath(card)"
                    :alt="card.label"
                    class="h-full w-full object-cover"
                  />

                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon :name="card.icon" class="h-7 w-7 text-primary/45" />
                  </div>
                </div>

                <div class="min-w-0">
                  <p
                    class="truncate text-lg font-black leading-tight text-base-content"
                  >
                    {{ card.label }}
                  </p>

                  <p
                    class="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-base-content/55"
                  >
                    {{ completedCardSummary(card) }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="btn btn-sm btn-ghost shrink-0 rounded-xl text-error"
                @click="builderStore.removeSection(card.key)"
              >
                Clear
              </button>
            </div>

            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="field in visibleFields(card.restoresFields)"
                :key="field.key"
                class="group/field overflow-hidden rounded-2xl border border-base-300/60 bg-base-200/80"
              >
                <div
                  v-if="field.imagePath"
                  class="relative aspect-5/2 overflow-hidden bg-base-300"
                >
                  <img
                    :src="field.imagePath"
                    :alt="field.key"
                    class="h-full w-full object-cover transition-transform duration-500 group-hover/field:scale-105"
                  />

                  <div
                    class="absolute inset-0 bg-linear-to-t from-base-200 via-base-200/30 to-transparent"
                  />

                  <p
                    class="absolute bottom-2 left-3 right-3 truncate text-xs font-black uppercase tracking-widest text-base-content/70"
                  >
                    {{ formatFieldKey(field.key) }}
                  </p>
                </div>

                <div class="px-3 py-2.5">
                  <p
                    v-if="!field.imagePath"
                    class="text-xs font-black uppercase tracking-widest text-base-content/35"
                  >
                    {{ formatFieldKey(field.key) }}
                  </p>

                  <p
                    class="mt-1 line-clamp-4 text-sm font-semibold leading-relaxed text-base-content/75"
                  >
                    {{ field.value }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center shadow-sm"
      >
        <Icon
          name="kind-icon:cards"
          class="mx-auto h-12 w-12 text-base-content/25"
        />

        <p class="mt-3 text-base font-black text-base-content/65">
          No completed cards yet.
        </p>

        <p class="mt-1 text-sm font-semibold text-base-content/40">
          The character sheet goblin is waiting patiently.
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
  heroImage?: string
  deckImage?: string
  narrative?: string
  tagline?: string
  payload?: Record<string, unknown>
}

type VisibleField = {
  key: string
  value: string
  imagePath: string
}

const route = useRoute()
const builderStore = useBuilderStore()
const pageStore = usePageStore()

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
        activeImageCard.value?.narrative ||
        builderStore.activeConfig.splash?.description ||
        pageStore.description,
    )
  }

  return (
    activeImageCard.value?.narrative ||
    activeImageCard.value?.tagline ||
    pageStore.description ||
    pageStore.subtitle
  )
})

const activeImageCard = computed(() => {
  return activeCard.value as ImageCard | null
})

const imagePath = computed(() => {
  if (isBuilder.value) {
    const sheetImage = builderStore.sheet.imagePath

    if (typeof sheetImage === 'string' && sheetImage) {
      return normalizeImagePath(sheetImage)
    }

    return normalizeImagePath(
      firstString([
        cardImagePath(activeImageCard.value),
        builderStore.activeConfig.splash?.imagePath,
        pageStore.image,
      ]),
    )
  }

  return normalizeImagePath(
    firstString([cardImagePath(activeImageCard.value), pageStore.image]),
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

function visibleFields(fields: string[]): VisibleField[] {
  return fields
    .map((key) => {
      const value = stringifyValue(builderStore.sheet[key])
      const imagePath = imagePathFromValue(builderStore.sheet[key])

      return {
        key,
        value,
        imagePath,
      }
    })
    .filter((entry) => entry.value.trim().length > 0)
}

function completedCardSummary(card: BuilderCard): string {
  const fields = visibleFields(card.restoresFields)
  const firstTextField = fields.find((field) => !field.imagePath)

  if (firstTextField?.value) return firstTextField.value

  return 'A completed piece of the sheet is ready.'
}

function cardImagePath(card: ImageCard | BuilderCard | null): string {
  const imageCard = card as ImageCard | null

  if (!imageCard) return ''

  return normalizeImagePath(
    firstString([
      imageCard.heroImage,
      imageCard.deckImage,
      imageCard.image,
      imageCard.imagePath,
      imageCard.splashImage,
      imageCard.payload?.heroImage,
      imageCard.payload?.deckImage,
      imageCard.payload?.image,
      imageCard.payload?.imagePath,
      imageCard.payload?.splashImage,
    ]),
  )
}

function imagePathFromValue(value: unknown): string {
  if (typeof value === 'string') {
    return looksLikeImagePath(value) ? normalizeImagePath(value) : ''
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>

    return normalizeImagePath(
      firstString([
        record.heroImage,
        record.deckImage,
        record.image,
        record.imagePath,
        record.splashImage,
        record.url,
        record.src,
      ]),
    )
  }

  return ''
}

function looksLikeImagePath(value: string): boolean {
  const cleanValue = value.trim().toLowerCase()

  return (
    cleanValue.startsWith('/images/') ||
    cleanValue.startsWith('images/') ||
    cleanValue.startsWith('http') ||
    cleanValue.endsWith('.png') ||
    cleanValue.endsWith('.jpg') ||
    cleanValue.endsWith('.jpeg') ||
    cleanValue.endsWith('.webp') ||
    cleanValue.endsWith('.gif') ||
    cleanValue.endsWith('.svg')
  )
}

function formatFieldKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
}

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === 'object' ? JSON.stringify(entry) : String(entry),
      )
      .join(', ')
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>

    return String(
      record.label ||
        record.title ||
        record.name ||
        record.description ||
        record.narrative ||
        JSON.stringify(value),
    )
  }

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
  if (cleanPath.startsWith('/') || cleanPath.startsWith('http')) {
    return cleanPath
  }

  if (cleanPath.startsWith('images/')) {
    return `/${cleanPath}`
  }

  return `/images/${cleanPath}`
}
</script>
