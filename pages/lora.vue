<!-- /pages/lora.vue -->
<!--
  LoRA browser. Two tabs:
    - My Library  (Phase 2): browse / filter / edit owned LoRAs.
    - Discover    (Phase 3): browse Civitai / CivArchive and download new ones.
  Discover is a placeholder until the download queue + external browse land.
-->
<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-3 p-3">
    <div role="tablist" class="tabs tabs-boxed w-fit self-center">
      <button
        role="tab"
        class="tab"
        :class="{ 'tab-active': activeTab === 'library' }"
        type="button"
        @click="activeTab = 'library'"
      >
        <Icon name="kind-icon:folder" class="mr-1 h-4 w-4" />
        My Library
      </button>

      <button
        role="tab"
        class="tab"
        :class="{ 'tab-active': activeTab === 'discover' }"
        type="button"
        @click="activeTab = 'discover'"
      >
        <Icon name="kind-icon:search" class="mr-1 h-4 w-4" />
        Discover
      </button>
    </div>

    <div class="min-h-0 flex-1">
      <lora-gallery v-if="activeTab === 'library'" />

      <section
        v-else
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-8 text-center"
      >
        <Icon name="kind-icon:search" class="h-12 w-12 text-base-content/40" />
        <h2 class="text-lg font-bold">Discover is coming soon</h2>
        <p class="max-w-md text-sm text-base-content/60">
          Browse Civitai and CivArchive, hide LoRAs you already own, and
          one-click download new ones straight into your library. Landing in
          Phase 3 alongside the download queue.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({ title: 'LoRA Library' })

const activeTab = ref<'library' | 'discover'>('library')
</script>
