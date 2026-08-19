<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <nav
      class="mb-2 flex shrink-0 items-center gap-2 kr-panel-flat p-2"
      aria-label="Art studio views"
    >
      <button
        type="button"
        class="btn btn-sm rounded-xl"
        :class="activeTab === 'generate' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'generate'"
        @click="selectPrimaryTab('generate')"
      >
        <Icon name="kind-icon:sparkles" class="h-4 w-4" />
        Generate
      </button>

      <button
        type="button"
        class="btn btn-sm rounded-xl"
        :class="activeTab === 'gallery' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'gallery'"
        @click="selectPrimaryTab('gallery')"
      >
        <Icon name="kind-icon:gallery" class="h-4 w-4" />
        Gallery
      </button>

      <p class="ml-1 hidden text-xs text-base-content/55 md:block">
        Make something new, or browse what you already made.
      </p>
    </nav>

    <art-manager class="min-h-0 flex-1" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNavStore } from '@/stores/navStore'

type ArtPrimaryTab = 'generate' | 'gallery'

const navStore = useNavStore()

const activeTab = computed(() => navStore.getDashboardTab('art'))

function selectPrimaryTab(tab: ArtPrimaryTab): void {
  navStore.setDashboardTab('art', tab, 'art studio primary navigation')
}
</script>
