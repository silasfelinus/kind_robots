<!-- /components/builders/builder-shell.vue -->
<template>
  <section class="flex min-h-full w-full flex-col gap-4">
    <!-- ── Wizard header ────────────────────────────────────────────────── -->
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="flex min-w-0 items-start gap-3">
          <!-- Active section icon badge -->
          <span
            class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
          >
            <Icon :name="activeSection.icon" class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <p
              v-if="eyebrow"
              class="text-[0.62rem] font-black uppercase tracking-[0.22em] text-base-content/40"
            >
              {{ eyebrow }}
            </p>
            <h2 class="text-2xl font-black leading-tight text-base-content">
              {{ activeSection.title }}
            </h2>
            <p class="mt-1 max-w-3xl text-sm text-base-content/60">
              {{ activeSection.summary }}
            </p>
          </div>
        </div>

        <!-- Back / Next -->
        <div class="flex shrink-0 items-center gap-2">
          <button
            class="btn btn-sm rounded-xl border-base-300 bg-base-200 hover:bg-base-300"
            type="button"
            :disabled="!canGoBack"
            @click="goBack"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Back
          </button>

          <button
            class="btn btn-sm btn-primary rounded-xl shadow-sm shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/30 active:translate-y-0"
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

    <!-- ── Step strip ───────────────────────────────────────────────────── -->
    <nav
      class="relative overflow-x-auto rounded-2xl border border-base-300 bg-base-100 p-2"
      aria-label="Builder sections"
      style="scrollbar-width: thin"
    >
      <div class="flex min-w-max items-stretch gap-1.5">
        <button
          v-for="(section, index) in normalizedSections"
          :key="section.key"
          class="group relative flex min-w-28 flex-col items-start gap-1.5 rounded-xl p-3 text-left transition-all hover:bg-base-200"
          :class="sectionButtonClass(section.key)"
          type="button"
          :aria-current="activeSection.key === section.key ? 'step' : undefined"
          @click="setSection(section.key)"
        >
          <!-- Step number pill -->
          <div class="flex w-full items-center justify-between gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-black transition-all"
              :class="stepPillClass(section.key)"
            >
              {{ index + 1 }}
            </span>
            <Icon :name="section.icon" class="h-4 w-4 shrink-0 opacity-70" />
          </div>

          <span class="text-xs font-black leading-tight">{{
            section.label
          }}</span>

          <!-- Active underline accent -->
          <span
            v-if="activeSection.key === section.key"
            class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
          />
        </button>
      </div>
    </nav>

    <!-- ── Main content slot ────────────────────────────────────────────── -->
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

    <!-- ── Summary rail ──────────────────────────────────────────────────── -->
    <section
      v-if="showSummaryRail"
      class="rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div
        class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:blueprint" class="h-5 w-5 text-primary" />
          <div>
            <h3 class="text-base font-black text-base-content">
              {{ summaryTitle }}
            </h3>
            <p class="text-xs text-base-content/50">{{ summarySubtitle }}</p>
          </div>
        </div>
        <button
          v-if="hasSummarySection"
          class="btn btn-sm rounded-xl border-base-300 bg-base-200 hover:bg-base-300"
          type="button"
          @click="setSection('summary')"
        >
          Open Summary
        </button>
      </div>

      <div
        v-if="summaryItems.length"
        class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4"
      >
        <article
          v-for="item in summaryItems"
          :key="item.key"
          class="flex gap-3 rounded-xl border border-base-300 bg-base-200/60 p-3 transition-shadow hover:shadow-sm"
        >
          <!-- Thumbnail or icon badge -->
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base-300"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.label"
              class="h-full w-full object-cover"
            />
            <Icon
              v-else
              :name="item.icon || fallbackIcon"
              class="h-6 w-6 text-primary"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <p
              class="text-[0.65rem] font-black uppercase tracking-widest text-base-content/40"
            >
              {{ item.label }}
            </p>
            <p class="line-clamp-2 text-sm font-semibold text-base-content">
              {{ displayValue(item.value) }}
            </p>
            <p
              v-if="item.description"
              class="line-clamp-1 text-[0.65rem] text-base-content/45"
            >
              {{ item.description }}
            </p>
            <button
              v-if="item.editSection && hasSection(item.editSection)"
              class="btn btn-xs mt-auto w-fit rounded-lg border-base-300 bg-base-100 hover:bg-base-200"
              type="button"
              @click="setSection(item.editSection)"
            >
              Edit
            </button>
          </div>
        </article>
      </div>

      <div
        v-else
        class="flex items-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/50 px-4 py-3 text-sm text-base-content/45"
      >
        <Icon name="kind-icon:clipboard" class="h-4 w-4" />
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

const normalizedSections = computed<BuilderSectionConfig[]>(() =>
  props.sections.length ? props.sections : fallbackSections,
)

const eyebrow = computed(() => props.title)

const activeSectionIndex = computed(() => {
  const index = normalizedSections.value.findIndex(
    (section) => section.key === activeSectionKey.value,
  )
  return index >= 0 ? index : 0
})

const activeSection = computed<BuilderSectionConfig>(
  () =>
    normalizedSections.value[activeSectionIndex.value] ?? fallbackStartSection,
)

const canGoBack = computed(() => activeSectionIndex.value > 0)
const canGoNext = computed(
  () => activeSectionIndex.value < normalizedSections.value.length - 1,
)
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
  if (section) setSection(section.key)
}

function goNext() {
  if (!canGoNext.value) return
  const section = normalizedSections.value[activeSectionIndex.value + 1]
  if (section) setSection(section.key)
}

function sectionButtonClass(sectionKey: BuilderSectionKey) {
  if (activeSectionKey.value === sectionKey) {
    return 'bg-primary/10 text-primary border border-primary/30'
  }
  return 'text-base-content/70 border border-transparent hover:border-base-300'
}

function stepPillClass(sectionKey: BuilderSectionKey) {
  if (activeSectionKey.value === sectionKey) {
    return 'bg-primary text-primary-content'
  }
  return 'bg-base-300 text-base-content/60'
}

function displayValue(value: BuilderChoiceSummary['value']) {
  if (value === null || value === undefined || value === '')
    return 'Not selected yet'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

watch(
  () => props.initialSection,
  (section) => {
    if (section && hasSection(section)) setSection(section)
  },
)

watch(
  normalizedSections,
  (sections) => {
    const firstSection = sections[0] ?? fallbackStartSection
    if (!hasSection(activeSectionKey.value)) setSection(firstSection.key)
  },
  { immediate: true },
)
</script>
