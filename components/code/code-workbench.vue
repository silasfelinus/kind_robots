<!-- /components/code-cards/code-card-workbench.vue -->
<template>
  <section class="flex h-full min-h-[700px] w-full flex-col gap-4 rounded-2xl bg-base-200 p-3 sm:p-4">
    <header class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-1">
        <h1 class="flex items-center gap-2 text-2xl font-black text-primary sm:text-3xl">
          <icon name="kind-icon:blocks" class="h-8 w-8" />
          Code Cards
        </h1>

        <p class="max-w-3xl text-sm text-base-content/70 sm:text-base">
          Snap creative tools together like digital tinkertoys. Text, images, models, characters, dreams, rewards, and scenarios can all become pieces in the machine.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="template in codeCardStore.templates"
          :key="template.id"
          class="btn btn-sm rounded-2xl border-base-300 bg-base-200"
          type="button"
          @click="codeCardStore.loadTemplate(template.id)"
        >
          <icon :name="template.icon" class="h-4 w-4" />
          {{ template.title }}
        </button>

        <button
          class="btn btn-sm btn-outline rounded-2xl"
          type="button"
          @click="codeCardStore.clearBoard()"
        >
          <icon name="kind-icon:trash" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <code-card-palette />

      <div class="flex min-h-0 flex-col gap-3">
        <div
          v-if="codeCardStore.message"
          class="rounded-2xl border border-info/30 bg-info/10 p-3 text-sm text-info-content"
        >
          {{ codeCardStore.message }}
        </div>

        <code-card-canvas />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCodeStore } from '@/stores/codeStore'

const codeCardStore = useCodeStore()

onMounted(() => {
  codeCardStore.initialize()
})
</script>