<!-- /components/content/story/story-bar.vue -->
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
          <icon :name="link.icon" class="w-6 h-6" />
          <span class="hidden sm:inline">{{ link.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Dynamic Section Rendering -->
    <component :is="currentSectionComponent" class="mt-6" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStoryStore } from '@/stores/storyStore'

// Import Components
import StoryCreator from '@/components/story/story-creator.vue'
import CreditPurchase from '@/components/story/credit-purchase.vue'
import StoryAbout from '@/components/story/story-about.vue'

// Define valid section keys
const sections = {
  create: StoryCreator,
  credits: CreditPurchase,
  about: StoryAbout,
} as const

type SectionKey = keyof typeof sections

// Store Setup
const storyMakerStore = useStoryStore()

// Navigation Links
const links: { name: SectionKey; label: string; icon: string }[] = [
  { name: 'create', label: 'Create Story', icon: 'kind-icon:pencil' },
  { name: 'credits', label: 'Generate Credits', icon: 'kind-icon:generate' },
  { name: 'about', label: 'About', icon: 'kind-icon:info-circle' },
]

// Computed Properties
const activeSection = computed(
  () => storyMakerStore.activeSection as SectionKey,
)
const setActiveSection = (section: SectionKey) => {
  storyMakerStore.activeSection = section
}

// Section Components Mapping
const currentSectionComponent = computed(() => sections[activeSection.value])
</script>
