<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <NuxtLink to="/play/daily-pitches" class="btn btn-ghost btn-sm"
        >← Approved pitches</NuxtLink
      >
      <div
        v-if="!user.initialized || (conductor.pending && !ready)"
        class="grid min-h-64 place-items-center"
      >
        <span class="kr-spinner-lg-primary" />
      </div>
      <p v-else-if="!ready" class="kr-note kr-note-error p-5">
        Conductor's synchronized record is unavailable.
      </p>
      <p v-else-if="!record" class="kr-panel p-6">
        This pitch is not in the current approved Daily Dream ledger.
      </p>
      <template v-else>
        <header class="relative overflow-hidden rounded-3xl bg-base-200 p-6">
          <div
            class="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10"
          />
          <div class="relative space-y-3">
            <p class="text-xs font-bold uppercase tracking-widest text-primary">
              Approved {{ record.pitch.date }}
            </p>
            <h2 class="font-serif text-3xl font-black">
              {{ record.pitch.title }}
            </h2>
            <span class="badge badge-outline h-auto whitespace-normal py-1">{{
              user.isAdmin ? labels[record.stage] : (mayVisitPitchFrontend(record, false) ? 'Ready to play' : 'Coming soon')
            }}</span>
            <p class="max-w-3xl text-sm leading-relaxed">
              {{ record.pitch.idea }}
            </p>
          </div>
        </header>
        <section v-if="!user.isAdmin" class="kr-panel space-y-4 p-6 text-center">
          <h3 class="font-serif text-2xl font-black">
            {{ mayVisitPitchFrontend(record, false) ? 'Ready to play' : 'Coming soon' }}
          </h3>
          <p class="text-sm text-base-content/70">
            {{ mayVisitPitchFrontend(record, false)
              ? 'This experience has been approved for public play.'
              : 'This Daily Dream project is in development. Check back for its public release.' }}
          </p>
          <a v-if="mayVisitPitchFrontend(record, false)" class="btn btn-primary" :href="record.pageUrl || undefined">
            Open experience <Icon name="kind-icon:external-link" class="size-4" />
          </a>
        </section>
        <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div class="space-y-4">
            <section class="kr-panel space-y-3 p-5">
              <h3 class="font-serif text-xl font-black">What exists today</h3>
              <p v-if="!record.project" class="text-sm">
                Approval was recorded, but intake has not yet created a matching
                Conductor project.
              </p>
              <p v-else-if="record.isSharedProject" class="text-sm">
                This pitch targets {{ record.projectSlug }}, an existing
                project. Its tasks cover multiple pitches and cannot measure
                this one independently.
              </p>
              <p v-else class="text-sm">
                {{ record.completedBuildTasks }} of
                {{ record.totalBuildTasks }} implementation tasks are marked
                done. Scope approval is excluded.
                {{
                  record.pageUrl
                    ? 'A page URL is recorded, but deployment has not been independently verified.'
                    : 'No front-end page URL is recorded.'
                }}
              </p>
              <div class="flex flex-wrap gap-2">
                <a
                  v-if="record.pageUrl"
                  :href="record.pageUrl"
                  class="btn btn-primary btn-sm"
                  >Open recorded page ↗</a
                >
                <a
                  :href="pitchUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline btn-sm"
                  >Approved pitch ↗</a
                >
                <a
                  v-if="record.project"
                  :href="roadmapUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline btn-sm"
                  >Roadmap ↗</a
                >
              </div>
            </section>
            <section class="kr-panel space-y-3 p-5">
              <h3 class="font-serif text-xl font-black">Development work</h3>
              <p v-if="!record.project" class="text-sm opacity-60">
                No tasks until the project is scaffolded.
              </p>
              <div
                v-for="task in record.project?.tasks || []"
                :key="task.id"
                class="rounded-2xl border border-base-300 p-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h4 class="text-sm font-bold">{{ task.title }}</h4>
                  <span class="badge badge-sm badge-outline">{{
                    task.status
                  }}</span>
                </div>
                <p class="mt-1 text-xs opacity-60">
                  {{ task.id }} · {{ task.owner || 'unassigned' }} ·
                  {{ task.updated || 'no update recorded' }}
                </p>
                <details v-if="task.note" class="mt-2 text-xs">
                  <summary class="cursor-pointer">Read work notes</summary>
                  <p class="mt-2 whitespace-pre-wrap">{{ task.note }}</p>
                </details>
              </div>
            </section>
          </div>
          <aside class="kr-panel h-fit space-y-3 p-5">
            <h3 class="font-serif text-xl font-black">Roadmap milestones</h3>
            <p v-if="!record.project" class="text-sm opacity-60">
              Awaiting intake.
            </p>
            <div
              v-for="milestone in record.project?.milestones || []"
              :key="milestone.id"
              class="border-l-2 border-primary/40 pl-3"
            >
              <p class="text-sm font-bold">{{ milestone.title }}</p>
              <p class="text-xs opacity-60">{{ milestone.status }}</p>
            </div>
            <p class="text-xs opacity-60">
              Milestones are plans, not proof of a playable build. Last sync:
              {{ conductor.fetchedAt || 'unknown' }}
            </p>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConductorStore } from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'
import {
  approvedDailyPitchProgress,
  mayVisitPitchFrontend,
  PITCH_STAGE_LABELS,
} from '@/utils/approvedPitchProgress'

const conductor = useConductorStore()
const user = useUserStore()
const route = useRoute()
const labels = PITCH_STAGE_LABELS
const slug = computed(() =>
  typeof route.params.slug === 'string' ? route.params.slug : '',
)
const ready = computed(() => conductor.data?.projection.status === 'ready')
const record = computed(() =>
  approvedDailyPitchProgress(
    conductor.pitches,
    conductor.data?.projects ?? [],
  ).find((item) => item.pitch.slug === slug.value),
)
const pitchUrl = computed(
  () =>
    'https://github.com/silasfelinus/conductor/blob/main/pitches/' +
    encodeURIComponent(slug.value) +
    '.md',
)
const roadmapUrl = computed(
  () =>
    'https://github.com/silasfelinus/conductor/blob/main/projects/' +
    encodeURIComponent(record.value?.projectSlug || '') +
    '/roadmap.yaml',
)
watch(
  () => user.initialized,
  (initialized) => {
    if (initialized) void conductor.fetchProjects()
  },
  { immediate: true },
)
</script>
