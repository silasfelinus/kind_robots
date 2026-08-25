<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs font-black uppercase tracking-widest text-primary">Admin production</p>
          <h1 class="mt-1 text-3xl font-black">Curation Studio</h1>
          <p class="mt-2 text-sm leading-6 text-base-content/65">
            Compare the idea, prompt, and production art without drilling through a detail editor.
            Cthulhuquarium and Coloring Book share the same gallery-first decision rhythm while
            keeping their existing production pipelines separate.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-outline">Admin only</span>
          <span class="badge badge-outline">ArtJob backed</span>
        </div>
      </header>

      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="rounded-2xl border border-error/40 bg-error/10 p-8 text-center"
      >
        <p class="text-xl font-black">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          This screen edits production prompts and can enqueue GPU work.
        </p>
      </div>

      <template v-else>
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
        </nav>

        <CurationCthulhuquariumCuration v-if="project === 'cthulhuquarium'" />
        <CurationColoringBookCuration v-else />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const ready = ref(false)
const project = ref<'cthulhuquarium' | 'coloring-book'>('cthulhuquarium')

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
})
</script>
