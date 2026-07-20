<!-- /components/conductor/conductor-app-page.vue -->
<template>
  <ProjectFrontPage slug="conductor-app" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col items-start gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:server" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Build progress
          </h3>
        </div>
        <p class="text-sm text-base-content/70">
          The Flutter client is built in the open, one roadmap task at a time —
          the same conductor roadmap that steers every other project here.
        </p>
        <div v-if="totalTasks > 0" class="flex items-center gap-3">
          <progress
            class="progress progress-primary w-40"
            :value="doneTasks"
            :max="totalTasks"
          />
          <span class="text-xs text-base-content/60">
            {{ doneTasks }} of {{ totalTasks }} tasks done
          </span>
        </div>
        <ul v-if="nextTasks.length" class="flex flex-col gap-1">
          <li
            v-for="task in nextTasks"
            :key="task.id"
            class="text-sm text-base-content/70"
          >
            <Icon
              name="kind-icon:sparkles"
              class="mr-1 inline size-3.5 text-primary/70"
            />
            {{ task.title }}
          </li>
        </ul>
        <p class="text-xs text-base-content/50">
          Not on the App Store or Play Store yet — store readiness is its own
          tracked task before any submission.
        </p>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { useConductorStore } from '@/stores/conductorStore'

const conductorStore = useConductorStore()

onMounted(() => {
  conductorStore.fetchProjects()
})

const project = computed(() =>
  conductorStore.projects.find((entry) => entry.slug === 'conductor-app'),
)
const tasks = computed(() => project.value?.tasks ?? [])
const totalTasks = computed(() => tasks.value.length)
const doneTasks = computed(
  () => tasks.value.filter((task) => task.status === 'done').length,
)
const nextTasks = computed(() =>
  tasks.value.filter((task) => task.status === 'ready').slice(0, 3),
)

const config: ProjectFrontConfig = {
  slug: 'conductor-app',
  title: 'Conductor App',
  channelKey: 'conductor',
  tabKey: 'conductor-app',
  icon: 'kind-icon:external-link',
  tagline: 'Steer the swarm from your pocket.',
  description:
    'The companion Flutter client for Conductor — review projects, approve gates, and nudge the build loop from a phone. This is its launch pad and status inside Kind Robots.',
  bridge: true,
  sections: [
    {
      key: 'mobile',
      title: 'Conductor, mobile',
      body: 'The steering surface, reshaped for a phone: projects, gates, and approvals.',
      icon: 'kind-icon:external-link',
    },
    {
      key: 'status',
      title: 'Build + launch',
      body: 'Track the Flutter client build and launch it when a deploy is live.',
      icon: 'kind-icon:server',
    },
  ],
  deliverables: {
    done: ['Flutter client project underway'],
    next: ['Web/app deploy + launch link', 'In-app project steering parity'],
  },
}
</script>
