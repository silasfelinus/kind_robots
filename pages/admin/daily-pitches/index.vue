<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto max-w-[1500px] space-y-5 px-3 py-5 sm:px-6">
      <div v-if="!user.initialized" class="grid min-h-64 place-items-center">
        <span class="kr-spinner-lg-primary" />
      </div>
      <div
        v-else-if="!user.isAdmin"
        class="kr-note kr-note-error p-6 text-center"
      >
        Administrator access required.
      </div>
      <template v-else>
        <section
          class="relative overflow-hidden rounded-3xl border border-base-content/15 bg-base-200 p-5 sm:p-8"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent"
          />
          <div class="relative flex flex-wrap items-end justify-between gap-4">
            <div class="max-w-2xl space-y-2">
              <p
                class="text-xs font-bold uppercase tracking-[.22em] text-primary"
              >
                Daily Dream · the build shelf
              </p>
              <h2 class="font-serif text-2xl font-black sm:text-4xl">
                What happened after Approve?
              </h2>
              <p class="text-sm leading-relaxed text-base-content/75">
                Every approved daily pitch gets a page here, even when no game
                or toy has been built yet. This is a progress gallery, separate
                from the Conductor project manager. A roadmap is not a playable
                preview, and a linked page is not proof of a live deployment.
              </p>
            </div>
            <button
              class="btn btn-outline btn-sm"
              type="button"
              :disabled="conductor.pending"
              @click="conductor.fetchProjects(true)"
            >
              <Icon name="kind-icon:refresh" class="size-4" /> Refresh status
            </button>
          </div>
        </section>

        <div
          v-if="conductor.pending && !hasProjection"
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="h-72 animate-pulse rounded-3xl bg-base-200"
          />
        </div>
        <div v-else-if="!hasProjection" class="kr-note kr-note-error p-5">
          Conductor progress data is unavailable. No projects or progress have
          been inferred from fallback cards.
          <span v-if="conductor.error">{{ conductor.error }}</span>
        </div>
        <template v-else>
          <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div class="kr-panel-compact">
              <p class="text-2xl font-black">{{ entries.length }}</p>
              <p class="text-xs text-base-content/60">Approved pitches</p>
            </div>
            <div class="kr-panel-compact">
              <p class="text-2xl font-black">{{ count('awaiting-intake') }}</p>
              <p class="text-xs text-base-content/60">Not scaffolded</p>
            </div>
            <div class="kr-panel-compact">
              <p class="text-2xl font-black">{{ count('scaffolded') }}</p>
              <p class="text-xs text-base-content/60">
                Scaffolded, no build task done
              </p>
            </div>
            <div class="kr-panel-compact">
              <p class="text-2xl font-black">
                {{ count('building') + count('page-linked') }}
              </p>
              <p class="text-xs text-base-content/60">
                Build work or page link recorded
              </p>
            </div>
          </section>

          <nav
            aria-label="Filter approved pitches by development stage"
            class="flex flex-wrap gap-2"
          >
            <button
              v-for="option in filters"
              :key="option.value"
              type="button"
              class="btn btn-sm rounded-xl"
              :class="
                filter === option.value
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              :aria-pressed="filter === option.value"
              @click="filter = option.value"
            >
              {{ option.label }}
              <span class="badge badge-sm">{{
                option.value === 'all' ? entries.length : count(option.value)
              }}</span>
            </button>
          </nav>

          <div
            v-if="!visibleEntries.length"
            class="kr-panel p-8 text-center text-base-content/65"
          >
            {{
              entries.length
                ? 'No approved pitches in this stage.'
                : 'No approved Daily Dream pitches are present in the current Conductor projection.'
            }}
          </div>
          <section
            v-else
            aria-label="Approved daily pitch gallery"
            class="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <article
              v-for="entry in visibleEntries"
              :key="entry.pitch.slug"
              class="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-base-content/15 bg-base-100 shadow-sm transition hover:border-primary/60 hover:shadow-lg"
            >
              <NuxtLink
                :to="
                  '/admin/daily-pitches/' + encodeURIComponent(entry.pitch.slug)
                "
                class="block"
                :aria-label="'View development status of ' + entry.pitch.title"
              >
                <div
                  class="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-secondary/30 via-base-300 to-primary/20"
                >
                  <img
                    v-if="
                      entry.project?.cardPath &&
                      !failedPosters[entry.pitch.slug]
                    "
                    :src="entry.project.cardPath"
                    :alt="'Project artwork for ' + entry.pitch.title"
                    loading="lazy"
                    class="size-full object-cover transition duration-300 group-hover:scale-105"
                    @error="failedPosters[entry.pitch.slug] = true"
                  />
                  <div v-else class="grid size-full place-items-center">
                    <Icon
                      name="kind-icon:sparkles"
                      class="size-16 text-primary/45"
                    />
                  </div>
                  <span
                    class="absolute bottom-3 left-3 badge border-base-100/20 bg-base-100/95 text-base-content"
                  >
                    {{ entry.pitch.date }}
                  </span>
                </div>
                <div class="space-y-3 p-5">
                  <h3
                    class="font-serif text-xl font-black leading-tight group-hover:text-primary"
                  >
                    {{ entry.pitch.title }}
                  </h3>
                  <span
                    class="badge badge-outline h-auto whitespace-normal py-1 text-xs"
                    >{{ stageLabels[entry.stage] }}</span
                  >
                  <p
                    class="line-clamp-3 min-h-16 text-sm leading-relaxed text-base-content/70"
                  >
                    {{
                      entry.pitch.idea ||
                      'Pitch details are recorded in Conductor.'
                    }}
                  </p>
                  <p class="text-xs text-base-content/65">
                    <template v-if="entry.isSharedProject"
                      >Tracked under {{ entry.projectSlug }}. The shared roadmap
                      is not game-specific.</template
                    >
                    <template v-else-if="entry.project"
                      >{{ entry.completedBuildTasks }} /
                      {{ entry.totalBuildTasks }} implementation tasks completed
                      (scope approvals excluded)</template
                    >
                    <template v-else
                      >No Conductor project matches this approved
                      pitch.</template
                    >
                  </p>
                  <p
                    class="inline-flex items-center gap-1 text-sm font-bold text-primary"
                  >
                    Open progress page
                    <Icon name="kind-icon:arrow-right" class="size-4" />
                  </p>
                </div>
              </NuxtLink>
              <div
                v-if="entry.pageUrl"
                class="mt-auto border-t border-base-content/10 p-3"
              >
                <a
                  class="btn btn-outline btn-sm w-full rounded-xl"
                  :href="entry.pageUrl"
                >
                  Open recorded project page
                  <Icon name="kind-icon:external-link" class="size-4" />
                </a>
              </div>
            </article>
          </section>
          <p class="text-xs text-base-content/60">
            Data from Conductor's synchronized project and pitch ledger, not an
            independently maintained project list. Last projection:
            {{
              conductor.fetchedAt
                ? new Date(conductor.fetchedAt).toLocaleString()
                : 'unknown'
            }}. Linked pages have not been independently checked for deployment.
          </p>
        </template>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'
import {
  approvedDailyPitchProgress,
  PITCH_STAGE_LABELS,
  type PitchBuildStage,
} from '@/utils/approvedPitchProgress'

type Filter = 'all' | PitchBuildStage
const conductor = useConductorStore()
const user = useUserStore()
const failedPosters = ref<Record<string, boolean>>({})
const filter = ref<Filter>('all')
const stageLabels = PITCH_STAGE_LABELS
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting-intake', label: 'Awaiting intake' },
  { value: 'scaffolded', label: 'Scaffolded' },
  { value: 'building', label: 'Building' },
  { value: 'page-linked', label: 'Page linked' },
  { value: 'shared-project', label: 'Existing project' },
]
const hasProjection = computed(
  () => conductor.data?.projection.status === 'ready',
)
const entries = computed(() =>
  approvedDailyPitchProgress(conductor.pitches, conductor.data?.projects ?? []),
)
const visibleEntries = computed(() =>
  filter.value === 'all'
    ? entries.value
    : entries.value.filter((entry) => entry.stage === filter.value),
)
function count(stage: PitchBuildStage): number {
  return entries.value.filter((entry) => entry.stage === stage).length
}
watch(
  () => user.isAdmin,
  (isAdmin) => {
    if (isAdmin) void conductor.fetchProjects()
  },
  { immediate: true },
)
</script>
