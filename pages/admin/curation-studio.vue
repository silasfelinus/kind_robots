<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-4 md:p-6">
      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="rounded-2xl border border-error/40 bg-error/10 p-8 text-center"
      >
        <p class="text-xl font-black">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          This screen edits production curation data and can enqueue GPU work.
        </p>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <nav class="tabs tabs-boxed w-fit bg-base-200 p-1" aria-label="Curation project">
            <button
              type="button"
              class="tab font-black"
              :class="{ 'tab-active': project === 'cthulhuquarium' }"
              @click="project = 'cthulhuquarium'"
            >
              🐟 Cthulhuquarium
            </button>
            <button
              type="button"
              class="tab font-black"
              :class="{ 'tab-active': project === 'coloring-book' }"
              @click="project = 'coloring-book'"
            >
              ✏️ Coloring Book
            </button>
            <button
              type="button"
              class="tab font-black"
              :class="{ 'tab-active': project === 'mandarin' }"
              @click="project = 'mandarin'"
            >
              🀄 Mandarin
            </button>
          </nav>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-outline">Admin only</span>
            <span class="badge badge-outline">Audited changes</span>
            <span class="badge badge-outline">ArtJob backed</span>
          </div>
        </div>

        <CurationCthulhuquariumCuration v-if="project === 'cthulhuquarium'" />
        <CurationColoringBookCuration v-else-if="project === 'coloring-book'" />
        <CurationMandarinCuration v-else />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CurationColoringBookCuration from '@/components/curation/coloring-book-curation.vue'
import CurationCthulhuquariumCuration from '@/components/curation/cthulhuquarium-curation.vue'
import CurationMandarinCuration from '@/components/curation/mandarin-curation.vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const ready = ref(false)
const project = ref<'cthulhuquarium' | 'coloring-book' | 'mandarin'>(
  'cthulhuquarium',
)

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
})
</script>
