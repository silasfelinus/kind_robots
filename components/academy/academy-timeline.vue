<!-- /components/academy/academy-timeline.vue -->
<template>
  <section class="flex flex-col gap-4">
    <header
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div class="flex flex-col gap-1">
        <h2
          class="flex items-center gap-2 text-base font-black text-base-content"
        >
          <Icon name="kind-icon:map" class="h-5 w-5 text-primary" />
          The Art History Timeline
        </h2>
        <p class="text-sm text-base-content/70">
          Twenty-five centuries of style, all public domain, all remixable. Pick
          an era and see what the masters were up to.
        </p>
      </div>
      <div
        class="flex items-center gap-2 text-xs font-semibold text-base-content/60"
      >
        <span class="badge badge-ghost badge-sm">
          {{ academyStore.lessonsViewedCount }}/{{
            academyStore.timeline.length
          }}
          lessons explored
        </span>
        <span class="badge badge-ghost badge-sm">
          {{ academyStore.stylesRemixedCount }} styles remixed
        </span>
      </div>
    </header>

    <ol class="relative flex flex-col gap-3 pl-6">
      <div
        class="absolute bottom-4 left-2 top-4 w-0.5 rounded-full bg-linear-to-b from-primary/60 via-secondary/40 to-primary/10"
      />

      <li
        v-for="style in academyStore.timeline"
        :key="style.slug"
        class="relative"
      >
        <span
          class="absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full border-2 transition-colors"
          :class="
            expandedSlug === style.slug
              ? 'border-primary bg-primary'
              : academyStore.viewedLessons.includes(style.slug)
                ? 'border-primary bg-base-100'
                : 'border-base-300 bg-base-100'
          "
        />

        <button
          v-if="expandedSlug !== style.slug"
          type="button"
          class="group flex w-full flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-left transition-all hover:border-primary/50 hover:shadow-sm"
          aria-expanded="false"
          @click="expandedSlug = style.slug"
        >
          <span class="text-xl leading-none">🏛️</span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="flex flex-wrap items-baseline gap-2">
              <span
                class="text-sm font-black text-base-content group-hover:text-primary"
              >
                {{ style.name }}
              </span>
              <span class="text-xs text-base-content/50">{{ style.era }}</span>
            </span>
            <span class="truncate text-xs text-base-content/60">
              {{ style.recognitionCues[0] }}
            </span>
          </span>
          <Icon
            v-if="academyStore.viewedLessons.includes(style.slug)"
            name="kind-icon:check"
            class="h-4 w-4 shrink-0 text-success"
            title="Lesson explored"
          />
          <Icon
            name="mdi:chevron-down"
            class="h-4 w-4 shrink-0 text-base-content/40 group-hover:text-primary"
          />
        </button>

        <academy-style-detail
          v-else
          :lesson="style"
          @close="expandedSlug = null"
          @remix="emit('remix', $event)"
        />
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'

const emit = defineEmits<{
  remix: [styleSlug: string]
}>()

const academyStore = useAcademyStore()

const expandedSlug = ref<string | null>(null)
</script>
