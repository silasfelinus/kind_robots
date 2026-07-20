<!-- /components/conductor/storymaker-page.vue -->
<template>
  <ProjectFrontPage slug="storymaker" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col items-start gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:story" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Start weaving
          </h3>
        </div>
        <p class="text-sm text-base-content/70">
          Storymaker builds on the Stories engine — bring your characters,
          settings, and rewards and let the narrator help them collide.
        </p>
        <p v-if="totalScenarios > 0" class="text-xs text-base-content/60">
          {{ totalScenarios }} scenario{{ totalScenarios === 1 ? '' : 's' }}
          ready to weave into a story right now.
        </p>
        <ul v-if="recentScenarios.length" class="flex flex-col gap-1">
          <li v-for="scenario in recentScenarios" :key="scenario.id">
            <NuxtLink
              to="/stories"
              class="text-sm text-primary hover:underline"
            >
              {{ scenario.title || 'Untitled scenario' }}
            </NuxtLink>
          </li>
        </ul>
        <NuxtLink
          to="/stories"
          class="btn btn-primary btn-sm gap-1.5 rounded-2xl"
        >
          <Icon name="kind-icon:story" class="size-4" />
          Open the Stories studio
        </NuxtLink>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { useScenarioStore } from '@/stores/scenarioStore'

const scenarioStore = useScenarioStore()

onMounted(() => {
  scenarioStore.initialize()
})

const totalScenarios = computed(() => scenarioStore.totalScenarios)
const recentScenarios = computed(() => scenarioStore.scenarios.slice(0, 3))

const config: ProjectFrontConfig = {
  slug: 'storymaker',
  title: 'Storymaker',
  channelKey: 'scenario',
  tabKey: 'storymaker',
  icon: 'kind-icon:story',
  tagline: 'Bring everything into one unfolding story.',
  description:
    'The long-form loom of Kind Robots. Storymaker gathers your cast, places, and treasures into a collaborative story and lets the narrator turn choices into consequences — a story that actually goes somewhere.',
  sections: [
    {
      key: 'weave',
      title: 'Weave the threads',
      body: 'Characters, settings, and rewards come together into one narrative space.',
      icon: 'kind-icon:story',
    },
    {
      key: 'narrate',
      title: 'Let it unfold',
      body: 'The narrator gives every choice a consequence with teeth.',
      icon: 'kind-icon:sparkles',
    },
  ],
  deliverables: {
    done: ['Stories/scenario engine reused', 'Narrative data model'],
    next: ['Dedicated Storymaker flow', 'Multi-author sessions'],
  },
}
</script>
