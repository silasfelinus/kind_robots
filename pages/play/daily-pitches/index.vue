<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto max-w-[1500px] space-y-5 px-3 py-5 sm:px-6">
      <div v-if="!user.initialized" class="grid min-h-64 place-items-center">
        <span class="kr-spinner-lg-primary" />
      </div>
      <template v-else>
        <header-page-bar compact>
          <div
            class="flex min-w-0 flex-1 items-center justify-end gap-2 px-1"
            title="Daily Dream · the build shelf"
            data-testid="daily-pitches-bar"
          >
            <button
              class="btn btn-ghost btn-sm"
              type="button"
              :disabled="conductor.pending"
              @click="conductor.fetchProjects(true)"
            >
              <Icon name="kind-icon:refresh" class="size-4" /> Refresh status
            </button>
          </div>
        </header-page-bar>

        <p class="max-w-3xl text-sm leading-relaxed text-base-content/75">
          Browse our approved Daily Dream ideas. Games and experiences open to
          everyone once they are ready; until then, they are coming soon.
          Administrators can inspect work in progress and approve each preview
          for Play.
        </p>

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
          <section
            v-if="user.isAdmin"
            class="grid grid-cols-2 gap-3 md:grid-cols-4"
          >
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
            v-if="user.isAdmin"
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
            v-if="!visibleEntries.length && !showMusicMentor"
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
                  '/play/daily-pitches/' + encodeURIComponent(entry.pitch.slug)
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
                    >{{
                      user.isAdmin
                        ? stageLabels[entry.stage]
                        : mayVisitPitchFrontend(entry, false)
                          ? 'Ready to play'
                          : 'Coming soon'
                    }}</span
                  >
                  <p
                    class="line-clamp-3 min-h-16 text-sm leading-relaxed text-base-content/70"
                  >
                    {{
                      entry.pitch.idea ||
                      'Pitch details are recorded in Conductor.'
                    }}
                  </p>
                  <p v-if="user.isAdmin" class="text-xs text-base-content/65">
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
                class="mt-auto space-y-2 border-t border-base-content/10 p-3"
              >
                <p
                  v-if="user.isAdmin && !entry.pageUrl"
                  class="text-xs text-base-content/60"
                >
                  No project preview URL recorded yet.
                </p>
                <p
                  v-if="
                    user.isAdmin &&
                    entry.pageUrl &&
                    !isPublicFacingPitchPage(entry.pageUrl)
                  "
                  class="text-xs text-warning"
                >
                  This preview is under Admin; create a public Play route before
                  approving.
                </p>
                <p
                  v-if="
                    conductor.playReadyError &&
                    readyErrorSlug === entry.pitch.slug
                  "
                  class="kr-note kr-note-error text-xs"
                >
                  {{ conductor.playReadyError }}
                </p>
                <button
                  v-if="user.isAdmin"
                  type="button"
                  class="btn btn-sm w-full rounded-xl"
                  :class="entry.publicReady ? 'btn-outline' : 'btn-primary'"
                  :disabled="
                    (!entry.publicReady &&
                      !isPublicFacingPitchPage(entry.pageUrl)) ||
                    conductor.updatingPlayReadySlugs.includes(entry.pitch.slug)
                  "
                  @click="setReady(entry.pitch.slug, !entry.publicReady)"
                >
                  {{
                    entry.publicReady
                      ? 'Revoke Play approval'
                      : 'Approve for Play'
                  }}
                </button>
                <a
                  v-if="mayVisitPitchFrontend(entry, user.isAdmin)"
                  class="btn btn-outline btn-sm w-full rounded-xl"
                  :href="entry.pageUrl || undefined"
                >
                  {{
                    user.isAdmin && !entry.publicReady
                      ? 'Open admin preview'
                      : 'Open experience'
                  }}
                  <Icon name="kind-icon:external-link" class="size-4" />
                </a>
                <p
                  v-else
                  class="text-center text-sm font-bold text-base-content/55"
                >
                  Coming soon
                </p>
              </div>
            </article>
            <!-- This finished one-prompt experiment belongs on the small-project
                 shelf, not in Conductor's real approved-pitch ledger. -->
            <article
              v-if="showMusicMentor"
              class="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-base-content/15 bg-base-100 shadow-sm transition hover:border-primary/60 hover:shadow-lg"
            >
              <NuxtLink to="/music-mentor" class="block">
                <div class="relative aspect-[16/9] overflow-hidden bg-base-300">
                  <img
                    src="/images/channels/plan/music-mentor.webp"
                    alt="Music Mentor project illustration"
                    loading="lazy"
                    class="size-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span
                    class="absolute bottom-3 left-3 badge border-base-100/20 bg-base-100/95 text-base-content"
                  >
                    One-prompt experiment
                  </span>
                </div>
                <div class="space-y-3 p-5">
                  <h3 class="font-serif text-xl font-black">Music Mentor</h3>
                  <span class="badge badge-outline">Available to use</span>
                  <p
                    class="min-h-16 text-sm leading-relaxed text-base-content/70"
                  >
                    Upload a recording for pitch, timing, dynamics and
                    arrangement feedback. Your audio stays on your device.
                  </p>
                  <p class="text-xs text-base-content/60">
                    Shelved with Daily Dream projects for discovery; originally
                    a standalone experiment, not an approved daily pitch.
                  </p>
                  <p
                    class="inline-flex items-center gap-1 text-sm font-bold text-primary"
                  >
                    Open Music Mentor
                    <Icon name="kind-icon:arrow-right" class="size-4" />
                  </p>
                </div>
              </NuxtLink>
            </article>
          </section>
          <p v-if="user.isAdmin" class="text-xs text-base-content/60">
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
  mayVisitPitchFrontend,
  isPublicFacingPitchPage,
  PITCH_STAGE_LABELS,
  type PitchBuildStage,
} from '@/utils/approvedPitchProgress'

type Filter = 'all' | PitchBuildStage
const conductor = useConductorStore()
const user = useUserStore()
const failedPosters = ref<Record<string, boolean>>({})
const filter = ref<Filter>('all')
const readyErrorSlug = ref<string | null>(null)
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
const showMusicMentor = computed(
  () => filter.value === 'all' || filter.value === 'page-linked',
)
const visibleEntries = computed(() =>
  filter.value === 'all'
    ? entries.value
    : entries.value.filter((entry) => entry.stage === filter.value),
)
async function setReady(slug: string, ready: boolean) {
  readyErrorSlug.value = slug
  await conductor.setPitchPlayReady(slug, ready)
}
function count(stage: PitchBuildStage): number {
  return entries.value.filter((entry) => entry.stage === stage).length
}
watch(
  () => user.initialized,
  (initialized) => {
    if (initialized) void conductor.fetchProjects()
  },
  { immediate: true },
)
</script>
