<template>
  <div class="max-w-4xl mx-auto p-6 bg-base-200 rounded-2xl shadow-lg">
    <!-- Navigation Bar -->
    <nav
      class="flex justify-between items-center w-full p-4 bg-base-300 rounded-t-2xl shadow-md"
    >
      <div class="flex gap-4">
        <button
          v-for="link in links"
          :key="link.name"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          :class="{
            'bg-primary text-white': activeSection === link.name,
            'hover:bg-base-200': activeSection !== link.name,
          }"
          @click="setActiveSection(link.name as SectionKey)"
        >
          <icon v-if="isCompact" :name="link.icon" class="w-6 h-6" />
          <span v-else>{{ link.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Dynamic Section Rendering -->
    <component :is="currentSectionComponent" class="mt-6" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStoryMakerStore } from '@/stores/storyStore'
import { useDisplayStore } from '@/stores/displayStore'

// Define valid section keys
const sections = {
  create: 'story-creator',
  credits: 'credit-purchase',
  about: 'story-about',
} as const

type SectionKey = keyof typeof sections // Ensures only valid section keys

// Store Setup
const storyMakerStore = useStoryMakerStore()
const displayStore = useDisplayStore()

// Navigation Links
const links: { name: SectionKey; label: string; icon: string }[] = [
  { name: 'create', label: 'Create Story', icon: 'pencil' },
  { name: 'credits', label: 'Buy Credits', icon: 'dollar-sign' },
  { name: 'about', label: 'About', icon: 'info' },
]

// Computed Properties
const activeSection = computed(
  () => storyMakerStore.activeSection as SectionKey,
)
const setActiveSection = (section: SectionKey) => {
  storyMakerStore.activeSection = section
}
const isCompact = computed(() => displayStore.isMobileViewport)

// Section Components Mapping
const currentSectionComponent = computed(() => sections[activeSection.value])
</script>
