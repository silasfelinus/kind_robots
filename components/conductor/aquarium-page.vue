<!-- /components/conductor/aquarium-page.vue -->
<template>
  <project-front-page
    class="kr-surface"
    slug="cthulhuquarium"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <CthulhuquariumPlay />

      <details
        v-if="userStore.isAdmin"
        class="group kr-panel-flat mt-5"
        @toggle="curationOpen = ($event.target as HTMLDetailsElement).open"
      >
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 p-3 marker:hidden"
        >
          <span class="flex items-center gap-2 font-black">
            <Icon name="kind-icon:lock" class="kr-icon-4" />
            Monster curation
          </span>
          <span class="kr-badge-outline">Admin only</span>
        </summary>
        <div class="border-t border-base-300 p-3">
          <CurationCthulhuquariumCuration v-if="curationOpen" />
        </div>
      </details>
    </template>
    <template #footer>
      <!-- Charlotte and Wilbur speak from a fixed bottom sheet
           (cthulhuquarium-dialogue.vue). While they do, this keeps the end
           of the page scrollable out from under it instead of hidden. -->
      <div v-if="tankStore.storyShowing" class="h-56" aria-hidden="true" />
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { ref } from 'vue'
import { useCthulhuquariumTankStore } from '@/stores/cthulhuquariumTankStore'
import { useUserStore } from '@/stores/userStore'
import CurationCthulhuquariumCuration from '@/components/curation/cthulhuquarium-curation.vue'

const tankStore = useCthulhuquariumTankStore()
const userStore = useUserStore()
const curationOpen = ref(false)

const config: ProjectFrontConfig = {
  slug: 'cthulhuquarium',
  title: 'Cthulhuquarium',
  icon: 'kind-icon:fish',
  tagline:
    'It sits in the back of the curiosity shop, and now it is yours to feed.',
  description:
    'A darkly funny aquarium. Every fed creature drops coins: tap them, buy more creatures, and fill the tank.',
  sections: [
    {
      key: 'loop',
      title: 'Coins from every fish',
      body: 'Every fed creature drops coins; tap them before they fade, then buy more fish and a bigger tank.',
      icon: 'kind-icon:coin',
    },
    {
      key: 'collect',
      title: 'Collect the unlistable',
      body: 'Each unlock reveals a field note written by someone who is not telling you everything.',
      icon: 'kind-icon:fish',
    },
  ],
  deliverables: {
    done: [
      'Server-backed tanks with real offline income',
      'The fun loop — every fish drops coins, copies, and a tank that grows to 40',
      'Bestiary schema shared with Ruler Hooked',
      'Browsable public aquariums',
    ],
    next: ['Twenty species with generated art'],
  },
}
</script>
