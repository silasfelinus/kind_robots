<!-- /components/academy/academy-remix.vue -->
<template>
  <section class="flex flex-col gap-3">
    <header
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div class="flex flex-col gap-1">
        <h2
          class="flex items-center gap-2 text-base font-black text-base-content"
        >
          <Icon name="kind-icon:magic" class="h-5 w-5 text-primary" />
          Remix Studio
        </h2>
        <p class="text-sm text-base-content/70">
          Pick a historical style, bring an image — yours or from the gallery —
          and let the Kontext engine repaint it the way the masters would have.
        </p>
      </div>
      <span class="badge badge-ghost badge-sm">
        {{ academyStore.stylesRemixedCount }}/{{ academyStore.styles.length }}
        styles remixed
      </span>
    </header>

    <div
      class="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
    >
      <art-styler
        class="min-h-0"
        :styles="remixStyles"
        :selected-style-key="academyStore.selectedStyleSlug"
        :show-close="false"
        @style-selected="onStyleSelected"
        @generated="onGenerated"
      />

      <aside class="flex min-h-0 flex-col gap-3">
        <academy-style-detail
          v-if="contextStyle"
          :lesson="contextStyle"
          :show-close="false"
          @remix="() => {}"
        />

        <div
          v-else
          class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-6 text-center"
        >
          <span class="text-3xl">🏛️</span>
          <p class="text-sm font-semibold text-base-content/60">
            Select a style to see its story
          </p>
          <p class="text-xs text-base-content/40">
            Every remix comes with a free history lesson. We're sneaky like
            that.
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import type { AcademyStyle } from '@/stores/seeds/academyStyles'
import type { StyleEntry } from '@/stores/helpers/styleHelper'
import type { ArtImage } from '~/prisma/generated/prisma/client'

const academyStore = useAcademyStore()

const activeStyleSlug = ref<string | null>(
  academyStore.selectedStyleSlug ?? null,
)

const remixStyles = computed<StyleEntry[]>(() => {
  return academyStore.timeline.map((style) => academyStyleToEntry(style))
})

const contextStyle = computed<AcademyStyle | null>(() => {
  if (!activeStyleSlug.value) return null
  return (
    academyStore.styles.find((style) => style.slug === activeStyleSlug.value) ??
    null
  )
})

function academyStyleToEntry(style: AcademyStyle): StyleEntry {
  return {
    slug: style.slug,
    label: style.name,
    category: 'History',
    triggerPhrase: style.remix.template,
    loraPath: style.remix.loraPath,
    loraWeight: style.remix.loraWeight,
    previewImageSrc: style.previewImageSrc,
  }
}

function onStyleSelected(entry: StyleEntry | null) {
  activeStyleSlug.value = entry?.slug ?? null
  academyStore.selectStyle(entry?.slug ?? null)
}

function onGenerated(_image: ArtImage) {
  if (activeStyleSlug.value) {
    academyStore.markStyleRemixed(activeStyleSlug.value)
  }
}
</script>
