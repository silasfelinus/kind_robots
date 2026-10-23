<!-- /components/conductor/aquarium-page.vue
     The aquarium is a console game, not a scrolling project landing page.
     The app shell owns viewport height and the page's only kr-stage fills it.
     Existing project metadata remains in Kind Robots/Conductor and the site
     navbar still provides route identity and tutorial navigation. -->
<template>
  <div class="kr-surface relative bg-base-200">
    <div class="kr-stage">
      <CthulhuquariumPlay />
    </div>

    <!-- Curation is an admin utility, not another document section below
         the play surface. Keep it reachable without adding page scroll. -->
    <details
      v-if="userStore.isAdmin"
      class="absolute bottom-16 right-3 z-30 w-64 max-w-[calc(100%-1.5rem)] rounded-2xl border border-base-300 bg-base-100/95 shadow-lg"
      @toggle="curationOpen = ($event.target as HTMLDetailsElement).open"
    >
      <summary
        class="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 text-xs font-bold marker:hidden"
      >
        <span class="flex items-center gap-2">
          <Icon name="kind-icon:lock" class="kr-icon-4" />
          Monster curation
        </span>
        <span class="kr-badge-outline">Admin</span>
      </summary>
      <div
        class="max-h-64 overflow-y-auto overscroll-contain border-t border-base-300 p-2"
      >
        <CurationCthulhuquariumCuration v-if="curationOpen" />
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import CurationCthulhuquariumCuration from '@/components/curation/cthulhuquarium-curation.vue'

const userStore = useUserStore()
const curationOpen = ref(false)
</script>
