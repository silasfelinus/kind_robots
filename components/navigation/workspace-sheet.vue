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

    <!-- Tutorial: collapsed by default, toggled open -->
    <template v-if="tutorialChannelKey">
      <button
        type="button"
        class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-left shadow-sm transition hover:border-primary/40"
        :aria-expanded="showTutorial"
        @click="showTutorial = !showTutorial"
      >
        <span class="flex items-center gap-2">
          <Icon name="kind-icon:info" class="h-5 w-5 text-primary" />
          <span
            class="text-sm font-black uppercase tracking-widest text-base-content/70"
          >
            {{ showTutorial ? 'Hide tutorial' : 'Show tutorial' }}
          </span>
        </span>
        <Icon
          :name="
            showTutorial ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
          "
          class="h-5 w-5 shrink-0 text-base-content/45"
        />
      </button>

      <tutorial-flyer
        v-if="showTutorial"
        :channel="tutorialChannelKey"
        inline
      />
    </template>

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
          <div
            v-if="cardImagePath(card)"
            class="relative aspect-video overflow-hidden bg-base-300"
          >
            <img
              :src="cardImagePath(card)"
              :alt="card.label"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-base-100 via-base-100/45 to-transparent"
            />

            <button
              type="button"
              class="btn btn-sm btn-circle absolute right-3 top-3 border-none bg-base-100/80 text-error shadow-sm backdrop-blur hover:bg-base-100"
              @click="builderStore.removeSection(card.key)"
            >
              <Icon name="kind-icon:trash" class="h-4 w-4" />
            </button>

            <div class="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-base-100/85 shadow-sm backdrop-blur"
              >
                <Icon :name="card.icon" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-2xl font-black leading-none tracking-tight text-base-content drop-shadow-sm"
                >
                  {{ card.label }}
                </p>

                <p
                  class="mt-1 line-clamp-1 text-sm font-semibold leading-snug text-base-content/65"
                >
                  {{ completedCardSummary(card) }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex items-center justify-between gap-3 border-b border-base-300/60 p-4"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-200 shadow-sm"
              >
                <Icon :name="card.icon" class="h-7 w-7 text-primary/60" />
              </div>

              <div class="min-w-0">
                <p
                  class="truncate text-xl font-black leading-tight text-base-content"
                >
                  {{ card.label }}
                </p>

                <p
                  class="mt-0.5 line-clamp-1 text-sm font-semibold leading-snug text-base-content/55"
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

          <div class="flex flex-col gap-2 p-3">
            <template
              v-for="field in visibleFields(card.restoresFields)"
              :key="field.key"
            >
              <button
                v-if="field.imagePath"
                type="button"
                class="group/field relative aspect-video overflow-hidden rounded-2xl border border-base-300/60 bg-base-300 text-left"
                @click="toggleFieldDetails(card.key, field.key)"
              >
                <img
                  :src="field.imagePath"
                  :alt="field.title || field.key"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover/field:scale-105"
                />

                <div
                  class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-base-100/95 via-base-100/40 to-transparent"
                />

                <div class="absolute inset-x-0 bottom-0 p-3">
                  <div class="flex items-end justify-between gap-3">
                    <div class="min-w-0">
                      <p
                        class="text-xs font-black uppercase tracking-widest text-primary drop-shadow-sm"
                      >
                        {{ formatFieldKey(field.key) }}
                      </p>

                      <p
                        v-if="field.value.trim()"
                        class="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-base-content/85 drop-shadow-sm"
                      >
                        {{ field.value }}
                      </p>
                    </div>

                    <Icon
                      :name="
                        isFieldOpen(card.key, field.key)
                          ? 'kind-icon:chevron-up'
                          : 'kind-icon:info'
                      "
                      class="h-4 w-4 shrink-0 text-primary"
                    />
                  </div>

                  <div
                    v-if="isFieldOpen(card.key, field.key)"
                    class="mt-3 rounded-2xl border border-base-300/60 bg-base-100/90 p-3 text-sm font-semibold leading-relaxed text-base-content/70 shadow-sm backdrop-blur"
                  >
                    {{ fieldDetails(field) }}
                  </div>
                </div>
              </button>

              <button
                v-else
                type="button"
                class="rounded-2xl border border-base-300/60 bg-base-200/80 px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-base-200"
                @click="toggleFieldDetails(card.key, field.key)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p
                      class="text-xs font-black uppercase tracking-widest text-base-content/35"
                    >
                      {{ formatFieldKey(field.key) }}
                    </p>

                    <p
                      class="mt-1 text-sm font-semibold leading-relaxed text-base-content/75"
                    >
                      {{ field.value }}
                    </p>
                  </div>

                  <Icon
                    :name="
                      isFieldOpen(card.key, field.key)
                        ? 'kind-icon:chevron-up'
                        : 'kind-icon:info'
                    "
                    class="mt-1 h-4 w-4 shrink-0 text-primary/60"
                  />
                </div>

                <p
                  v-if="isFieldOpen(card.key, field.key)"
                  class="mt-3 rounded-xl bg-base-100 px-3 py-2 text-sm font-semibold leading-relaxed text-base-content/65"
                >
                  {{ fieldDetails(field) }}
                </p>
              </button>
            </template>
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
import { useSheetStore } from '@/stores/sheetStore'
import { NAV_CARDS } from '@/stores/helpers/navCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import { resolveTutorialChannelFromRoute } from '@/stores/helpers/tutorialCards'

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

type ImageRecord = Record<string, unknown>

type VisibleField = {
  key: string
  value: string
  imagePath: string
  title: string
  description: string
  narrative: string
}

const BUILDER_DEFAULT_IMAGE_FIELD_PRIORITY = [
  'species',
  'gender',
  'class',
  'alignment',
  'personality',
  'backstory',
  'quirks',
  'imagePath',
  'artPrompt',
] as const

const route = useRoute()
const builderStore = useBuilderStore()
const pageStore = usePageStore()
const sheetStore = useSheetStore()

const showDebugPath = ref(false)
const showTutorial = ref(false)
const openFieldKey = ref('')

const override = computed(() => sheetStore.override)

const tutorialChannelKey = computed(() => {
  const key = resolveTutorialChannelFromRoute(route.path)

  console.log('[workspace-sheet tutorial match]', {
    routePath: route.path,
    matchedChannel: key,
    pageCardsKey: pageStore.cardsKey,
    workspaceCardKey: pageStore.workspaceCardKey,
    pageTitle: pageStore.title,
  })

  return key
})

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

const activeImageCard = computed(() => {
  return activeCard.value as ImageCard | null
})

const title = computed(() => {
  if (override.value?.title) {
    return override.value.title
  }

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
  if (override.value?.label) {
    return override.value.label
  }

  if (isBuilder.value) {
    return activeCard.value?.label || builderStore.activeConfig.label
  }

  return activeCard.value?.label || pageStore.room
})

const narrative = computed(() => {
  if (override.value?.narrative) {
    return override.value.narrative
  }

  if (isBuilder.value) {
    return String(
      builderStore.sheet.narrative ||
        builderStore.sheet.description ||
        activeSelectedFieldInfo.value?.description ||
        activeSelectedFieldInfo.value?.narrative ||
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

const activeSelectedFieldInfo = computed(() => {
  if (!isBuilder.value) return null

  const activeFields = activeCard.value?.restoresFields ?? []
  const activeField = activeFields
    .map((key) => visibleFieldFromKey(key))
    .find((field) => field.imagePath)

  if (activeField) return activeField

  const completedFields = builderStore.completedCardList.flatMap((card) => {
    return visibleFields(card.restoresFields)
  })

  return completedFields.find((field) => field.imagePath) ?? null
})

function selectionPreviewImagePath(): string {
  const preview = builderStore.activeSelectionPreview

  if (!preview) return ''

  return imagePathFromRecord(preview as ImageRecord)
}

const imagePath = computed(() => {
  if (override.value?.imagePath) {
    const overrideImage = override.value.imagePath

    return overrideImage.startsWith('data:')
      ? overrideImage
      : normalizeImagePath(overrideImage)
  }

  if (isBuilder.value) {
    const sheetImage = builderStore.sheet.imagePath

    if (typeof sheetImage === 'string' && sheetImage) {
      return normalizeImagePath(sheetImage)
    }

    return normalizeImagePath(
      firstString([
        activeSelectedFieldInfo.value?.imagePath,
        builderCompletedDefaultImagePath(),
        selectionPreviewImagePath(),
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
  return (
    override.value?.icon ||
    activeCard.value?.icon ||
    pageStore.icon ||
    'kind-icon:blueprint'
  )
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

function priorityForBuilderField(key: string): number {
  const normalizedKey = key.trim().toLowerCase()

  const index = BUILDER_DEFAULT_IMAGE_FIELD_PRIORITY.findIndex((field) => {
    return field.toLowerCase() === normalizedKey
  })

  return index === -1 ? BUILDER_DEFAULT_IMAGE_FIELD_PRIORITY.length : index
}

function builderCompletedDefaultImagePath(): string {
  if (!isBuilder.value) return ''

  const candidates = builderStore.completedCardList
    .flatMap((card) => {
      return visibleFields(card.restoresFields)
        .filter((field) => field.imagePath)
        .map((field) => ({
          key: field.key,
          imagePath: field.imagePath,
          priority: priorityForBuilderField(field.key),
        }))
    })
    .sort((a, b) => a.priority - b.priority)

  return candidates[0]?.imagePath ?? ''
}

function visibleFields(fields: string[]): VisibleField[] {
  return fields
    .map((key) => visibleFieldFromKey(key))
    .filter((entry) => entry.value.trim().length > 0 || entry.imagePath)
}

function visibleFieldFromKey(key: string): VisibleField {
  const value = builderStore.sheet[key]
  const directRecord = objectRecord(value)
  const optionRecord = resolveFieldOptionRecord(key, value)
  const record = optionRecord ?? directRecord
  const valueText = stringifyValue(value)
  const title = firstString([
    record?.label,
    record?.title,
    record?.name,
    valueText,
    formatFieldKey(key),
  ])

  return {
    key,
    value: title,
    imagePath: imagePathFromRecord(record) || imagePathFromValue(value),
    title,
    description: firstString([
      record?.description,
      record?.summary,
      record?.tagline,
      directRecord?.description,
      directRecord?.summary,
      directRecord?.tagline,
    ]),
    narrative: firstString([
      record?.narrative,
      record?.text,
      record?.content,
      directRecord?.narrative,
      directRecord?.text,
      directRecord?.content,
    ]),
  }
}

function completedCardSummary(card: BuilderCard): string {
  const fields = visibleFields(card.restoresFields)
  const firstTextField = fields.find((field) => !field.imagePath)

  if (firstTextField?.value) return firstTextField.value

  const firstImageField = fields.find((field) => field.imagePath)

  if (firstImageField?.value) return firstImageField.value

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

  return imagePathFromRecord(objectRecord(value))
}

function imagePathFromRecord(record: ImageRecord | null): string {
  if (!record) return ''

  return normalizeImagePath(
    firstString([
      record.imagePath,
      record.heroImage,
      record.deckImage,
      record.image,
      record.splashImage,
      record.url,
      record.src,
      objectRecord(record.payload)?.imagePath,
      objectRecord(record.payload)?.heroImage,
      objectRecord(record.payload)?.deckImage,
      objectRecord(record.payload)?.image,
      objectRecord(record.payload)?.splashImage,
    ]),
  )
}

function resolveFieldOptionRecord(
  key: string,
  value: unknown,
): ImageRecord | null {
  const cleanValue = stringifyValue(value)

  if (!cleanValue) return null

  const matchingCards = builderStore.cards.filter((card) => {
    return card.key === key || card.restoresFields?.includes(key)
  })

  const records = matchingCards.flatMap((card) => collectImageRecords(card))

  return (
    records.find((record) => recordMatchesFieldValue(record, cleanValue)) ??
    null
  )
}

function collectImageRecords(value: unknown, depth = 0): ImageRecord[] {
  if (depth > 7) return []

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectImageRecords(entry, depth + 1))
  }

  const record = objectRecord(value)

  if (!record) return []

  const nestedKeys = [
    'options',
    'choices',
    'items',
    'cards',
    'steps',
    'fields',
    'values',
    'payload',
    'data',
    'reward',
  ]

  const self =
    hasOptionIdentity(record) || imagePathFromRecord(record) ? [record] : []

  const nested = nestedKeys.flatMap((nestedKey) => {
    return collectImageRecords(record[nestedKey], depth + 1)
  })

  return [...self, ...nested]
}

function hasOptionIdentity(record: ImageRecord): boolean {
  return Boolean(
    firstString([
      record.id,
      record.key,
      record.value,
      record.label,
      record.title,
      record.name,
    ]),
  )
}

function recordMatchesFieldValue(record: ImageRecord, value: string): boolean {
  const normalizedValue = normalizeComparable(value)
  const identities = [
    record.id,
    record.key,
    record.value,
    record.label,
    record.title,
    record.name,
  ].map((entry) => normalizeComparable(firstString([entry])))

  return identities.includes(normalizedValue)
}

function objectRecord(value: unknown): ImageRecord | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ImageRecord
  }

  return null
}

function toggleFieldDetails(cardKey: string, fieldKey: string): void {
  const nextKey = `${cardKey}:${fieldKey}`

  openFieldKey.value = openFieldKey.value === nextKey ? '' : nextKey
}

function isFieldOpen(cardKey: string, fieldKey: string): boolean {
  return openFieldKey.value === `${cardKey}:${fieldKey}`
}

function fieldDetails(field: VisibleField): string {
  return (
    field.description ||
    field.narrative ||
    field.value ||
    `${formatFieldKey(field.key)} has been added to this character.`
  )
}

function looksLikeImagePath(value: string): boolean {
  const cleanValue = value.trim().toLowerCase()

  return (
    cleanValue.startsWith('/images/') ||
    cleanValue.startsWith('images/') ||
    cleanValue.startsWith('/species/') ||
    cleanValue.startsWith('species/') ||
    cleanValue.startsWith('/rewards/') ||
    cleanValue.startsWith('rewards/') ||
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
        record.value ||
        record.description ||
        record.narrative ||
        '',
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

function normalizeComparable(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
}

function normalizeImagePath(path: string): string {
  const cleanPath = path.trim()

  if (!cleanPath) return ''
  if (
    cleanPath.startsWith('/') ||
    cleanPath.startsWith('http') ||
    cleanPath.startsWith('data:')
  ) {
    return cleanPath
  }

  if (
    cleanPath.startsWith('images/') ||
    cleanPath.startsWith('species/') ||
    cleanPath.startsWith('rewards/')
  ) {
    return `/${cleanPath}`
  }

  return `/images/${cleanPath}`
}
</script>
