<!-- /components/builders/builder-shell.vue -->
<template>
  <section class="flex min-h-full w-full flex-col gap-4">
    <header class="rounded-2xl border border-base-300 bg-base-200 p-4">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <p
            v-if="eyebrow"
            class="text-xs font-bold uppercase tracking-[0.22em] text-base-content/50"
          >
            {{ eyebrow }}
          </p>

          <h2
            class="mt-1 flex items-center gap-2 text-2xl font-bold text-base-content"
          >
            <Icon :name="activeSection.icon" class="h-6 w-6 text-primary" />
            {{ activeSection.title }}
          </h2>

          <p class="mt-2 max-w-4xl text-sm text-base-content/70 sm:text-base">
            {{ activeSection.summary }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <button
            class="btn btn-sm rounded-xl"
            type="button"
            :disabled="!canGoBack"
            @click="goBack"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Back
          </button>

          <button
            class="btn btn-sm btn-primary rounded-xl"
            type="button"
            :disabled="!canGoNext"
            @click="goNext"
          >
            Next
            <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <nav
      class="relative overflow-x-auto rounded-2xl border border-base-300 bg-base-200 p-3"
      aria-label="Builder sections"
    >
      <div class="flex min-w-max items-stretch gap-3">
        <button
          v-for="(section, index) in normalizedSections"
          :key="section.key"
          class="group relative flex min-w-36 flex-col items-start gap-2 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
          :class="sectionButtonClass(section.key)"
          type="button"
          :aria-current="activeSection.key === section.key ? 'step' : undefined"
          @click="setSection(section.key)"
        >
          <div class="flex w-full items-center justify-between gap-2">
            <Icon :name="section.icon" class="h-5 w-5 shrink-0" />

            <span
              class="rounded-full bg-base-100/60 px-2 py-0.5 text-[0.65rem] font-black text-base-content/60 group-hover:text-primary-content"
              :class="
                activeSection.key === section.key ? 'text-primary-content' : ''
              "
            >
              {{ index + 1 }}
            </span>
          </div>

          <span class="text-sm font-black">
            {{ section.label }}
          </span>

          <span class="line-clamp-2 text-xs opacity-70">
            {{ section.summary }}
          </span>
        </button>
      </div>
    </nav>

    <main
      class="min-h-0 flex-1 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <slot
        :active-section="activeSection.key"
        :active-section-config="activeSection"
        :set-section="setSection"
        :go-next="goNext"
        :go-back="goBack"
        :can-go-next="canGoNext"
        :can-go-back="canGoBack"
      />
    </main>

    <section
      v-if="showSummaryRail"
      class="rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div
        class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h3
            class="flex items-center gap-2 text-lg font-bold text-base-content"
          >
            <Icon name="kind-icon:blueprint" class="h-5 w-5 text-primary" />
            {{ summaryTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ summarySubtitle }}
          </p>
        </div>

        <button
          v-if="hasSummarySection"
          class="btn btn-sm rounded-xl"
          type="button"
          @click="setSection('summary')"
        >
          Open Summary
        </button>
      </div>

      <div
        v-if="summaryItems.length"
        class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <article
          v-for="item in summaryItems"
          :key="item.key"
          class="flex min-h-28 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div
            class="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-base-300"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.label"
              class="h-full w-full object-cover"
            />

            <div v-else class="flex h-full w-full items-center justify-center">
              <Icon
                :name="item.icon || fallbackIcon"
                class="h-8 w-8 text-primary"
              />
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <p class="truncate text-sm font-bold text-base-content">
              {{ item.label }}
            </p>

            <p class="line-clamp-2 text-sm text-base-content/70">
              {{ displayValue(item.value) }}
            </p>

            <p
              v-if="item.description"
              class="line-clamp-2 text-xs text-base-content/50"
            >
              {{ item.description }}
            </p>

            <button
              v-if="item.editSection && hasSection(item.editSection)"
              class="btn btn-xs mt-auto w-fit rounded-xl"
              type="button"
              @click="setSection(item.editSection)"
            >
              Reconfigure
            </button>
          </div>
        </article>
      </div>

      <div
        v-else
        class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/60"
      >
        No builder choices yet. The tiny clipboard goblin is waiting politely.
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export type BuilderSectionKey = string

export type BuilderChoiceSummary = {
  key: string
  label: string
  value?: string | number | boolean | null
  image?: string | null
  icon?: string | null
  description?: string | null
  editSection?: BuilderSectionKey
}

export type BuilderSectionConfig = {
  key: BuilderSectionKey
  label: string
  icon: string
  title: string
  summary: string
}

const fallbackIcon = 'kind-icon:sparkles'

const fallbackStartSection: BuilderSectionConfig = {
  key: 'start',
  label: 'Start',
  icon: fallbackIcon,
  title: 'Start',
  summary: 'Begin this builder step.',
}

const fallbackSections = [
  fallbackStartSection,
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Summary',
    summary: 'Review the current choices, images, links, and next actions.',
  },
] satisfies [BuilderSectionConfig, ...BuilderSectionConfig[]]

const props = withDefaults(
  defineProps<{
    builderKey: string
    title: string
    sections?: BuilderSectionConfig[]
    summaryItems?: BuilderChoiceSummary[]
    initialSection?: BuilderSectionKey
    showSummaryRail?: boolean
    summaryTitle?: string
    summarySubtitle?: string
  }>(),
  {
    sections: () => [],
    summaryItems: () => [],
    initialSection: 'start',
    showSummaryRail: true,
    summaryTitle: 'Current Builder Summary',
    summarySubtitle:
      'A living receipt for choices, additions, links, and tiny creative crimes.',
  },
)

const emit = defineEmits<{
  'section-change': [section: BuilderSectionKey]
}>()

const activeSectionKey = ref<BuilderSectionKey>(props.initialSection)

const normalizedSections = computed<BuilderSectionConfig[]>(() => {
  return props.sections.length ? props.sections : fallbackSections
})

const eyebrow = computed(() => props.title)

const activeSectionIndex = computed(() => {
  const index = normalizedSections.value.findIndex(
    (section) => section.key === activeSectionKey.value,
  )

  return index >= 0 ? index : 0
})

const activeSection = computed<BuilderSectionConfig>(() => {
  return (
    normalizedSections.value[activeSectionIndex.value] ?? fallbackStartSection
  )
})

const canGoBack = computed(() => activeSectionIndex.value > 0)

const canGoNext = computed(() => {
  return activeSectionIndex.value < normalizedSections.value.length - 1
})

const hasSummarySection = computed(() => hasSection('summary'))

function hasSection(sectionKey: BuilderSectionKey) {
  return normalizedSections.value.some((section) => section.key === sectionKey)
}

function setSection(sectionKey: BuilderSectionKey) {
  if (!hasSection(sectionKey)) return

  activeSectionKey.value = sectionKey
  emit('section-change', sectionKey)
}

function goBack() {
  if (!canGoBack.value) return

  const section = normalizedSections.value[activeSectionIndex.value - 1]

  if (section) {
    setSection(section.key)
  }
}

function goNext() {
  if (!canGoNext.value) return

  const section = normalizedSections.value[activeSectionIndex.value + 1]

  if (section) {
    setSection(section.key)
  }
}

function sectionButtonClass(sectionKey: BuilderSectionKey) {
  if (activeSectionKey.value === sectionKey) {
    return 'border-primary bg-primary text-primary-content shadow-md'
  }

  return 'border-base-300 bg-base-100 text-base-content'
}

function displayValue(value: BuilderChoiceSummary['value']) {
  if (value === null || value === undefined || value === '') {
    return 'Not selected yet'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}

watch(
  () => props.initialSection,
  (section) => {
    if (section && hasSection(section)) {
      setSection(section)
    }
  },
)

watch(
  normalizedSections,
  (sections) => {
    const firstSection = sections[0] ?? fallbackStartSection

    if (!hasSection(activeSectionKey.value)) {
      setSection(firstSection.key)
    }
  },
  { immediate: true },
)
</script>
