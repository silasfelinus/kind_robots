<!-- /components/navigation/splash-tutorial.vue -->
<template>
  <section
    v-if="pageStore.page"
    class="grid h-full min-h-0 w-full grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl bg-base-100/40 p-2 md:gap-4 md:p-3"
  >
    <div
      class="min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/70 shadow-sm motion-safe:animate-fade-in-up"
    >
      <title-card />
    </div>

    <div
      class="min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/60 shadow-sm motion-safe:animate-fade-in-up [animation-delay:150ms]"
    >
      <ami-chat class="w-full" />
    </div>

    <figure
      v-if="pageImage"
      class="group relative min-h-0 min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-lg motion-safe:animate-fade-in-up [animation-delay:300ms]"
    >
      <NuxtImg
        :src="pageImage"
        alt="Room illustration"
        :sizes="imageSizes"
        class="absolute inset-0 h-full w-full scale-105 object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-110"
        loading="lazy"
      />

      <!-- richer two-layer wash: bottom grounding + subtle top vignette -->
      <div
        class="absolute inset-0 bg-linear-to-t from-base-300/55 via-base-300/10 to-base-300/20"
      />
      <!-- color sheen that animates on hover for a touch of life -->
      <div
        class="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-accent/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
      />
      <div class="absolute inset-0 ring-1 ring-inset ring-base-content/10" />
    </figure>

    <div
      v-else
      class="grid min-h-0 min-w-0 place-items-center rounded-2xl border border-dashed border-base-300 bg-base-200/70 p-6 text-center text-sm text-base-content/60"
    >
      No splash image found. The room is technically haunted by layout
      whitespace.
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NuxtImg } from '#components'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const image = computed(() => pageStore.page?.image || '')

const pageImage = computed(() => {
  const img = image.value.trim()
  if (!img) return ''
  return img.startsWith('/') ? img : `/images/${img}`
})

const imageSizes = computed(
  () => '(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px',
)
</script>
