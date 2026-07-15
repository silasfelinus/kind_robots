<!-- /components/academy/academy-styles-browser.vue -->
<template>
  <section class="flex flex-col gap-4">
    <header
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div class="flex flex-col gap-1">
        <h2
          class="flex items-center gap-2 text-base font-black text-base-content"
        >
          <Icon name="kind-icon:palette" class="h-5 w-5 text-primary" />
          Style Gallery
        </h2>
        <p class="text-sm text-base-content/70">
          Every style the Academy teaches. Open a lesson, learn to spot it, then
          remix your own image in it.
        </p>
      </div>

      <label
        class="input input-bordered input-sm flex items-center gap-1.5 bg-base-100"
      >
        <Icon
          name="kind-icon:search"
          class="h-3.5 w-3.5 shrink-0 text-base-content/40"
        />
        <input
          v-model="searchQuery"
          type="search"
          class="min-w-0 flex-1 bg-transparent"
          placeholder="Search styles…"
          aria-label="Search Academy styles"
        />
      </label>
    </header>

    <academy-style-detail
      v-if="expandedStyle"
      :lesson="expandedStyle"
      @close="expandedSlug = null"
      @remix="emit('remix', $event)"
    />

    <div
      class="grid gap-3"
      style="
        grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
      "
    >
      <button
        v-for="style in filteredStyles"
        :key="style.slug"
        type="button"
        class="group flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-150"
        :class="
          expandedSlug === style.slug
            ? 'border-primary shadow-md shadow-primary/20'
            : 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-sm'
        "
        :aria-expanded="expandedSlug === style.slug"
        @click="expandedSlug = expandedSlug === style.slug ? null : style.slug"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-2xl leading-none">🏛️</span>
          <Icon
            v-if="academyStore.viewedLessons.includes(style.slug)"
            name="kind-icon:check"
            class="h-4 w-4 text-success"
            title="Lesson explored"
          />
        </div>
        <div class="flex flex-col">
          <span
            class="text-sm font-black text-base-content group-hover:text-primary"
          >
            {{ style.name }}
          </span>
          <span class="text-xs text-base-content/50">
            {{ style.era }} · {{ style.region }}
          </span>
        </div>
        <p class="line-clamp-2 text-xs leading-relaxed text-base-content/60">
          {{ style.keyIdeas }}
        </p>
      </button>
    </div>

    <div
      v-if="!filteredStyles.length"
      class="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200/60 text-center"
    >
      <Icon name="kind-icon:search" class="h-8 w-8 text-base-content/20" />
      <p class="mt-1 text-xs text-base-content/40">
        No styles match "{{ searchQuery }}" — history is long, but not that
        long.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import type { AcademyStyle } from '@/stores/seeds/academyStyles'

const emit = defineEmits<{
  remix: [styleSlug: string]
}>()

const academyStore = useAcademyStore()

const searchQuery = ref('')
const expandedSlug = ref<string | null>(null)

const expandedStyle = computed<AcademyStyle | null>(() => {
  if (!expandedSlug.value) return null
  return (
    academyStore.styles.find((style) => style.slug === expandedSlug.value) ??
    null
  )
})

const filteredStyles = computed<AcademyStyle[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return academyStore.timeline

  return academyStore.timeline.filter((style) => {
    return [
      style.name,
      style.era,
      style.region,
      style.keyIdeas,
      ...style.recognitionCues,
      ...style.artists.map((artist) => artist.name),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})
</script>
