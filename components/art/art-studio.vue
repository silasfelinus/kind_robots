<template>
  <section class="kr-surface gap-0">
    <nav
      class="mb-2 flex shrink-0 items-center gap-2 kr-panel-flat p-2"
      aria-label="Art studio views"
    >
      <button
        type="button"
        class="kr-btn"
        :class="activeTab === 'generate' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'generate'"
        @click="selectPrimaryTab('generate')"
      >
        <Icon name="kind-icon:sparkles" class="kr-icon-4" />
        Generate
      </button>

      <button
        type="button"
        class="kr-btn"
        :class="activeTab === 'gallery' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'gallery'"
        @click="selectPrimaryTab('gallery')"
      >
        <Icon name="kind-icon:gallery" class="kr-icon-4" />
        Gallery
      </button>

      <p class="kr-text-dim-xs-55 ml-1 hidden md:block">
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
