<!-- /components/builders/art-builder.vue -->
<template>
  <builder-shell
    builder-key="art"
    title="Art Builder"
    :sections="sections"
    :summary-items="summaryItems"
    summary-title="Art Summary"
    summary-subtitle="Review the image goal, source, prompt, style, and destination."
    @section-change="activeSection = $event"
  >
    <template #default="{ activeSection: currentSection, setSection, goNext, goBack }">
      <section v-if="currentSection === 'setup'" class="flex flex-col gap-4">
        Art setup here.
      </section>

      <section v-else-if="currentSection === 'select'" class="flex flex-col gap-4">
        Art selection here.
      </section>

      <section v-else-if="currentSection === 'design'" class="flex flex-col gap-4">
        Art prompt design here.
      </section>

      <section v-else-if="currentSection === 'generate'" class="flex flex-col gap-4">
        Art generation here.
      </section>

      <section v-else-if="currentSection === 'connect'" class="flex flex-col gap-4">
        Art connection here.
      </section>

      <section v-else-if="currentSection === 'summary'" class="flex flex-col gap-4">
        Art summary here.
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown art builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  BuilderChoiceSummary,
  BuilderSectionConfig,
  BuilderSectionKey,
} from '@/components/builders/builder-shell.vue'

const activeSection = ref<BuilderSectionKey>('setup')
const selectedGoal = ref('')
const localPrompt = ref('')
const selectedStyle = ref('')
const selectedDestination = ref('')

const sections: BuilderSectionConfig[] = [
  {
    key: 'setup',
    label: 'Goal',
    icon: 'kind-icon:compass',
    title: 'Art Goal',
    summary:
      'Choose whether this image is a cover, reference, portrait, location, reward, or scenario moment.',
  },
  {
    key: 'select',
    label: 'Source',
    icon: 'kind-icon:image',
    title: 'Image Source',
    summary:
      'Start from an upload, existing image, collection, pitch, dream, or empty prompt.',
  },
  {
    key: 'design',
    label: 'Prompt',
    icon: 'kind-icon:prompt',
    title: 'Prompt Design',
    summary: 'Shape the visual prompt, style, subject, setting, and constraints.',
  },
  {
    key: 'generate',
    label: 'Generate',
    icon: 'kind-icon:wand',
    title: 'Generate Art',
    summary: 'Send the prompt to the active art server and review the result.',
  },
  {
    key: 'connect',
    label: 'Attach',
    icon: 'kind-icon:link',
    title: 'Attach Art',
    summary:
      'Connect the image to collections, dreams, characters, rewards, or scenarios.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Art Summary',
    summary: 'Review the selected image, prompt, destination, and connected records.',
  },
]

const summaryItems = computed<BuilderChoiceSummary[]>(() => [
  {
    key: 'goal',
    label: 'Image Goal',
    value: selectedGoal.value,
    icon: 'kind-icon:compass',
    description: 'The purpose of this image.',
    editSection: 'setup',
  },
  {
    key: 'prompt',
    label: 'Prompt',
    value: localPrompt.value,
    icon: 'kind-icon:prompt',
    description: 'The main visual instruction.',
    editSection: 'design',
  },
  {
    key: 'style',
    label: 'Style',
    value: selectedStyle.value,
    icon: 'kind-icon:palette',
    description: 'The selected visual treatment.',
    editSection: 'design',
  },
  {
    key: 'destination',
    label: 'Destination',
    value: selectedDestination.value,
    icon: 'kind-icon:link',
    description: 'Where this image should be used.',
    editSection: 'connect',
  },
])
</script>