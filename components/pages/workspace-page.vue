<!-- /components/pages/workspace-page.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <!-- Header -->
    <header v-if="showHeader" class="flex shrink-0 items-center gap-2">
      <Icon name="kind-icon:gearhammer" class="size-5 text-primary" />
      <h2 class="text-lg font-semibold">Conductor Workspace</h2>
      <span class="badge badge-primary badge-sm ml-1">ADMIN</span>
      <div class="ml-auto flex items-center gap-2">
        <span v-if="data?.fetchedAt" class="text-xs text-base-content/50">
          Updated {{ fetchedLabel }}
        </span>
        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="pending"
          @click="refresh()"
        >
          <span v-if="pending" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
          Refresh
        </button>
      </div>
    </header>

    <!-- Error state -->
    <div
      v-if="error"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
    >
      <Icon name="kind-icon:warning" class="mr-1 inline size-4" />
      {{ error.message }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="pending && !data" class="hand-scroll flex shrink-0 items-end gap-3 overflow-x-auto pb-2 pt-4">
      <div
        v-for="n in 5"
        :key="n"
        class="project-card animate-pulse shrink-0 rounded-2xl border border-base-300 bg-base-200"
        style="aspect-ratio: 2/3"
      />
    </div>

    <!-- Stats bar -->
    <div v-if="data" class="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
        <p class="text-2xl font-black text-primary">{{ data.projects.length }}</p>
        <p class="text-xs font-semibold text-base-content/60">Projects</p>
      </div>
      <div class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
        <p class="text-2xl font-black text-success">{{ totalDone }}</p>
        <p class="text-xs font-semibold text-base-content/60">Tasks Done</p>
      </div>
      <div class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
        <p class="text-2xl font-black text-warning">{{ totalNeedsHuman }}</p>
        <p class="text-xs font-semibold text-base-content/60">Needs You</p>
      </div>
      <div
        class="cursor-pointer rounded-2xl border px-4 py-3 transition-colors"
        :class="
          showPitches
            ? 'border-warning/60 bg-warning/10'
            : 'border-base-300 bg-base-200 hover:border-warning/40'
        "
        @click="showPitches = !showPitches"
      >
        <p class="text-2xl font-black text-warning">{{ pendingPitches.length }}</p>
        <p class="text-xs font-semibold text-base-content/60">
          Pitches Pending
          <Icon
            name="kind-icon:chevron-down"
            class="ml-0.5 inline size-3 transition-transform"
            :class="showPitches ? 'rotate-180' : ''"
          />
        </p>
      </div>
    </div>

    <!-- Pitches panel (collapsible) -->
    <Transition name="slide-down">
      <div v-if="data && showPitches && pendingPitches.length" class="shrink-0 space-y-2">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/50">
          Pitches Awaiting Your Vote
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="pitch in pendingPitches"
            :key="pitch.slug"
            class="rounded-2xl border border-warning/40 bg-warning/5 p-4 transition-shadow hover:shadow-md"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <h4 class="font-bold leading-tight text-base-content">{{ pitch.title }}</h4>
              <span class="badge badge-warning badge-sm shrink-0">vote</span>
            </div>
            <p v-if="pitch.projectTarget" class="mb-2 text-xs text-base-content/50">
              <Icon name="kind-icon:folder" class="mr-0.5 inline size-3" />
              {{ pitch.projectTarget }}
              <span v-if="pitch.date" class="ml-2">· {{ pitch.date }}</span>
            </p>
            <p v-if="pitch.idea" class="line-clamp-3 text-sm text-base-content/75">
              {{ pitch.idea }}
            </p>
          </article>
        </div>
      </div>
    </Transition>

    <!-- Project card hand -->
    <div v-if="data && data.projects.length" class="project-hand shrink-0">
      <div class="hand-scroll flex items-end gap-3 overflow-x-auto pb-3 pt-6 px-2">
        <button
          v-for="(project, index) in data.projects"
          :key="project.slug"
          type="button"
          class="project-card group relative shrink-0 cursor-pointer rounded-2xl border transition-all duration-200 hover:z-40 hover:-translate-y-3 hover:scale-110"
          :class="[
            selectedProject?.slug === project.slug
              ? 'z-30 border-primary shadow-lg is-selected'
              : 'z-10 border-base-300 hover:border-primary/60',
            flippingSlug === project.slug ? 'is-flipping' : '',
          ]"
          @click="handleCardClick(project)"
        >
          <div class="card-flip relative w-full">
            <!-- Card front -->
            <div class="card-face card-front relative flex w-full flex-col overflow-hidden rounded-2xl shadow-md">
              <div class="relative overflow-hidden" style="aspect-ratio: 2/3">
                <img
                  :src="cardBackSrc(index)"
                  :alt="project.name"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <!-- Kind-tinted gradient overlay -->
                <div
                  class="absolute inset-0 transition-opacity duration-300"
                  :style="kindOverlay(project.kind)"
                />

                <!-- Large kind icon, centered -->
                <div class="absolute inset-0 flex items-center justify-center pb-8">
                  <Icon
                    :name="kindIcon(project.kind)"
                    class="transition-transform duration-300 group-hover:scale-125"
                    :class="kindIconColorClass(project.kind)"
                    style="width: 2.75rem; height: 2.75rem"
                  />
                </div>

                <!-- Bottom overlay: progress + alert badges -->
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pb-2 pt-6">
                  <div class="mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      :class="kindProgressClass(project.kind)"
                      :style="{ width: `${project.progress}%` }"
                    />
                  </div>
                  <div class="flex flex-wrap gap-0.5">
                    <span v-if="blockedCount(project) > 0" class="badge badge-error badge-xs">
                      {{ blockedCount(project) }} ✗
                    </span>
                    <span v-if="needsHumanCount(project) > 0" class="badge badge-accent badge-xs">
                      {{ needsHumanCount(project) }} 👤
                    </span>
                  </div>
                </div>

                <!-- Selected indicator -->
                <Transition name="pop">
                  <div
                    v-if="selectedProject?.slug === project.slug"
                    class="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary shadow"
                  >
                    <Icon name="kind-icon:check" class="size-3 text-primary-content" />
                  </div>
                </Transition>
              </div>

              <!-- Card footer label -->
              <div class="bg-base-100 px-2 py-1.5 rounded-b-2xl">
                <p class="truncate text-center text-[0.6rem] font-black leading-none text-base-content/80" :title="project.name || project.slug">
                  {{ project.name || project.slug }}
                </p>
                <p class="text-center text-[0.55rem] leading-none text-base-content/40 mt-0.5">
                  {{ project.progress }}%
                </p>
              </div>
            </div>

            <!-- Card back (revealed during flip animation) -->
            <div class="card-face card-back absolute inset-0 flex flex-col overflow-hidden rounded-2xl shadow-md">
              <div class="relative min-h-0 flex-1 overflow-hidden">
                <img
                  :src="cardBackSrc(index)"
                  :alt="`Card back`"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="bg-base-100 px-2 py-1.5 rounded-b-2xl">
                <p class="text-center text-[0.6rem] leading-none">&nbsp;</p>
                <p class="text-center text-[0.55rem] leading-none mt-0.5">&nbsp;</p>
              </div>
            </div>
          </div>

          <!-- Sparkle + swirl FX layer -->
          <div
            v-if="flippingSlug === project.slug"
            class="sparkle-layer pointer-events-none absolute inset-0 z-50 overflow-visible"
            aria-hidden="true"
          >
            <span
              v-for="n in 10"
              :key="n"
              class="sparkle"
              :style="sparkleStyle(n)"
            />
            <span class="swirl swirl-a" />
            <span class="swirl swirl-b" />
          </div>
        </button>
      </div>
    </div>

    <!-- Detail panel — slides in below the card hand -->
    <Transition name="detail-slide">
      <div
        v-if="selectedProject"
        class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        <!-- Detail header -->
        <div class="flex shrink-0 items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border"
            :class="kindIconClass(selectedProject.kind)"
          >
            <Icon :name="kindIcon(selectedProject.kind)" class="size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-lg font-black">
              {{ selectedProject.name || selectedProject.slug }}
            </h3>
            <p class="text-xs text-base-content/50">
              {{ selectedProject.progress }}% complete · {{ selectedProject.tasks.length }} tasks
            </p>
          </div>
          <span class="badge badge-sm shrink-0" :class="kindBadgeClass(selectedProject.kind)">
            {{ selectedProject.kind }}
          </span>
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="selectedProject = null"
          >
            <Icon name="kind-icon:x" class="size-4" />
          </button>
        </div>

        <!-- Task status summary chips -->
        <div class="flex shrink-0 flex-wrap gap-2">
          <span
            v-for="[status, count] in taskStatusSummary(selectedProject)"
            :key="status"
            class="badge badge-sm gap-1"
            :class="taskBadgeClass(status)"
          >
            <Icon :name="taskIcon(status)" class="size-3" />
            {{ count }} {{ status }}
          </span>
        </div>

        <!-- ── Project Dream Intent panel ──────────────────────────────────── -->
        <div
          v-if="linkedDream"
          class="shrink-0 space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <!-- Section header + edit toggle -->
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:dream" class="size-4 text-primary" />
            <h4 class="flex-1 text-xs font-bold uppercase tracking-wide text-base-content/60">
              Project Intent
            </h4>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl gap-1"
              @click="dreamEditMode = !dreamEditMode"
            >
              <Icon :name="dreamEditMode ? 'kind-icon:x' : 'kind-icon:edit'" class="size-3" />
              {{ dreamEditMode ? 'Cancel' : 'Edit' }}
            </button>
          </div>

          <!-- ── Visibility + Maturity toggles (always visible) ───────────── -->
          <div class="flex flex-wrap gap-2">
            <!-- isPublic toggle -->
            <button
              type="button"
              class="btn btn-sm rounded-xl gap-2 transition-colors"
              :class="linkedDream.isPublic ? 'btn-success' : 'btn-ghost border border-base-300'"
              :disabled="dreamSaving"
              @click="patchDream({ isPublic: !linkedDream.isPublic })"
            >
              <Icon :name="linkedDream.isPublic ? 'kind-icon:eye' : 'kind-icon:eye-off'" class="size-3.5" />
              {{ linkedDream.isPublic ? 'Public' : 'Private' }}
            </button>

            <!-- isMature toggle -->
            <button
              type="button"
              class="btn btn-sm rounded-xl gap-2 transition-colors"
              :class="linkedDream.isMature ? 'btn-warning' : 'btn-ghost border border-base-300'"
              :disabled="dreamSaving"
              @click="patchDream({ isMature: !linkedDream.isMature })"
            >
              <Icon name="kind-icon:warning" class="size-3.5" />
              {{ linkedDream.isMature ? 'Mature' : 'Safe' }}
            </button>

            <!-- allowReviews toggle -->
            <button
              type="button"
              class="btn btn-sm rounded-xl gap-2 transition-colors"
              :class="linkedDream.allowReviews ? 'btn-accent' : 'btn-ghost border border-base-300'"
              :disabled="dreamSaving"
              @click="patchDream({ allowReviews: !linkedDream.allowReviews })"
            >
              <Icon name="kind-icon:chat" class="size-3.5" />
              {{ linkedDream.allowReviews ? 'Reviews On' : 'Reviews Off' }}
            </button>

            <!-- projectStatus selector -->
            <select
              class="select select-sm rounded-xl border-base-300 bg-base-200 text-xs font-semibold"
              :value="linkedDream.projectStatus ?? 'ACTIVE'"
              :disabled="dreamSaving"
              @change="patchDream({ projectStatus: ($event.target as HTMLSelectElement).value as 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED' })"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="DONE">DONE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            <span v-if="dreamSaving" class="loading loading-spinner loading-xs self-center text-primary" />
            <span v-if="dreamSaveMessage" class="self-center text-xs" :class="dreamSaveError ? 'text-error' : 'text-success'">
              {{ dreamSaveMessage }}
            </span>
          </div>

          <!-- ── Read-only view ──────────────────────────────────────────── -->
          <template v-if="!dreamEditMode">
            <p v-if="linkedDream.description" class="text-sm text-base-content/80">
              {{ linkedDream.description }}
            </p>
            <p v-else-if="linkedDream.pitch" class="text-sm italic text-base-content/60">
              {{ linkedDream.pitch }}
            </p>
            <div v-if="linkedDream.liveUrl || linkedDream.repoUrl" class="flex flex-wrap gap-2">
              <a
                v-if="linkedDream.liveUrl"
                :href="linkedDream.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-xs btn-outline gap-1"
              >
                <Icon name="kind-icon:external-link" class="size-3" />
                Live Site
              </a>
              <a
                v-if="linkedDream.repoUrl"
                :href="linkedDream.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-xs btn-outline gap-1"
              >
                <Icon name="kind-icon:code" class="size-3" />
                Repo
              </a>
            </div>
          </template>

          <!-- ── Edit form ───────────────────────────────────────────────── -->
          <template v-if="dreamEditMode">
            <div class="space-y-3">
              <div class="form-control">
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">Description</span>
                </label>
                <textarea
                  v-model="dreamEditForm.description"
                  class="textarea textarea-bordered rounded-xl text-sm"
                  rows="3"
                  placeholder="What is this project? What problem does it solve?"
                />
              </div>

              <div class="form-control">
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">Intent / Pitch</span>
                </label>
                <textarea
                  v-model="dreamEditForm.pitch"
                  class="textarea textarea-bordered rounded-xl text-sm"
                  rows="2"
                  placeholder="One-line seed: what's the core constraint or north star?"
                />
              </div>

              <div class="form-control">
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">Flavor Text</span>
                </label>
                <input
                  v-model="dreamEditForm.flavorText"
                  type="text"
                  class="input input-bordered rounded-xl text-sm"
                  placeholder="Short tagline shown on the card"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="form-control">
                  <label class="label py-0.5">
                    <span class="label-text text-xs font-semibold">Live URL</span>
                  </label>
                  <input
                    v-model="dreamEditForm.liveUrl"
                    type="url"
                    class="input input-bordered rounded-xl text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div class="form-control">
                  <label class="label py-0.5">
                    <span class="label-text text-xs font-semibold">Repo URL</span>
                  </label>
                  <input
                    v-model="dreamEditForm.repoUrl"
                    type="url"
                    class="input input-bordered rounded-xl text-sm"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm rounded-xl"
                  @click="cancelDreamEdit"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm rounded-xl gap-1"
                  :disabled="dreamSaving"
                  @click="saveDreamEdit"
                >
                  <span v-if="dreamSaving" class="loading loading-spinner loading-xs" />
                  Save
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- No linked dream nudge -->
        <div
          v-else
          class="shrink-0 rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-4 text-center text-xs text-base-content/40"
        >
          <Icon name="kind-icon:dream" class="mx-auto mb-1 size-5 opacity-40" />
          No Project Dream linked for <strong>{{ selectedProject.slug }}</strong> — run
          <code class="rounded bg-base-200 px-1">addProjects.http</code> to seed it.
        </div>

        <!-- Notes from Silas -->
        <div
          v-if="selectedProject.notesFromSilas"
          class="shrink-0 rounded-2xl border border-info/30 bg-info/5 p-4 text-sm text-base-content/80"
        >
          <p class="mb-1 text-xs font-bold uppercase tracking-wide text-info/70">Notes from Silas</p>
          {{ selectedProject.notesFromSilas }}
        </div>

        <!-- Two-column: milestones + tasks -->
        <div class="grid min-h-0 gap-4 pb-4 sm:grid-cols-2">
          <!-- Milestones -->
          <div v-if="selectedProject.milestones.length">
            <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              Milestones
            </h4>
            <div class="space-y-2">
              <div
                v-for="m in selectedProject.milestones"
                :key="m.id"
                class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
              >
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  :class="milestoneIconClass(m.status)"
                >
                  <Icon :name="milestoneIcon(m.status)" class="size-3.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{{ m.title }}</p>
                  <p class="text-xs text-base-content/50">weight {{ m.weight }}</p>
                </div>
                <span class="badge badge-sm shrink-0" :class="milestoneBadgeClass(m.status)">
                  {{ m.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tasks -->
          <div v-if="selectedProject.tasks.length">
            <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
              Tasks ({{ selectedProject.tasks.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="task in selectedProject.tasks"
                :key="task.id"
                class="rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                    :class="taskIconClass(task.status)"
                  >
                    <Icon :name="taskIcon(task.status)" class="size-3" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold leading-snug">{{ task.title }}</p>
                    <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-base-content/50">
                      <span>{{ task.id }}</span>
                      <span v-if="task.milestone">· {{ task.milestone }}</span>
                      <span v-if="task.gateHuman" class="text-accent">· gate</span>
                      <span v-if="task.owner">· {{ task.owner }}</span>
                      <span v-if="task.passes > 0" class="text-warning">· pass {{ task.passes }}/3</span>
                    </div>
                  </div>
                  <span class="badge badge-sm shrink-0" :class="taskBadgeClass(task.status)">
                    {{ task.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Empty state -->
    <div
      v-if="!pending && data && !data.projects.length"
      class="flex flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
    >
      <div class="text-center">
        <Icon name="kind-icon:gearhammer" class="mx-auto mb-2 size-8 opacity-40" />
        <p class="text-sm text-base-content/50">No projects found in Conductor.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { ConductorProject, ConductorData } from '@/server/api/conductor/projects.get'
import { useDreamStore } from '@/stores/dreamStore'

withDefaults(
  defineProps<{
    showHeader?: boolean
  }>(),
  { showHeader: true },
)

const { data, pending, error, refresh } = await useFetch<ConductorData>('/api/conductor/projects', {
  lazy: true,
})

const dreamStore = useDreamStore()

const selectedProject = ref<ConductorProject | null>(null)
const showPitches = ref(true)

// Flip animation state
const flippingSlug = ref('')
const FLIP_DURATION_MS = 650
let flipTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  if (!dreamStore.hasLoaded) {
    await dreamStore.fetchDreams({ dreamType: 'PROJECT' })
  }
})

onBeforeUnmount(() => {
  if (flipTimer) clearTimeout(flipTimer)
})

// ── Project Dream integration ─────────────────────────────────────────────────

const linkedDream = computed(() => {
  if (!selectedProject.value) return null
  return dreamStore.projectDreams.find(
    (d) => d.slug === selectedProject.value!.slug,
  ) ?? null
})

// Edit state
const dreamEditMode = ref(false)
const dreamSaving = ref(false)
const dreamSaveMessage = ref('')
const dreamSaveError = ref(false)

type ProjectPatch = {
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
  isPublic?: boolean
  isMature?: boolean
  allowReviews?: boolean
  projectStatus?: 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED'
}

const dreamEditForm = ref<ProjectPatch>({})

watch(linkedDream, (dream) => {
  dreamEditMode.value = false
  dreamEditForm.value = dream
    ? {
        description: dream.description ?? '',
        pitch: dream.pitch ?? '',
        flavorText: dream.flavorText ?? '',
        liveUrl: dream.liveUrl ?? '',
        repoUrl: dream.repoUrl ?? '',
      }
    : {}
})

function cancelDreamEdit() {
  dreamEditMode.value = false
  const dream = linkedDream.value
  dreamEditForm.value = dream
    ? {
        description: dream.description ?? '',
        pitch: dream.pitch ?? '',
        flavorText: dream.flavorText ?? '',
        liveUrl: dream.liveUrl ?? '',
        repoUrl: dream.repoUrl ?? '',
      }
    : {}
}

let saveMessageTimer: ReturnType<typeof setTimeout> | null = null

async function patchDream(patch: ProjectPatch) {
  if (!linkedDream.value) return
  dreamSaving.value = true
  dreamSaveMessage.value = ''
  dreamSaveError.value = false

  const result = await dreamStore.updateDream(linkedDream.value.id, patch)

  dreamSaving.value = false

  if (result?.success) {
    dreamSaveMessage.value = 'Saved'
    dreamSaveError.value = false
  } else {
    dreamSaveMessage.value = result?.message || 'Save failed'
    dreamSaveError.value = true
  }

  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  saveMessageTimer = setTimeout(() => { dreamSaveMessage.value = '' }, 3000)
}

async function saveDreamEdit() {
  await patchDream(dreamEditForm.value)
  if (!dreamSaveError.value) dreamEditMode.value = false
}

function handleCardClick(project: ConductorProject) {
  if (flipTimer) clearTimeout(flipTimer)

  const isDeselect = selectedProject.value?.slug === project.slug
  selectedProject.value = isDeselect ? null : project

  flippingSlug.value = project.slug
  flipTimer = setTimeout(() => {
    flippingSlug.value = ''
    flipTimer = null
  }, FLIP_DURATION_MS)
}

function cardBackSrc(index: number): string {
  return `/images/adventure/card/card-back${(index % 5) + 1}.webp`
}

function sparkleStyle(n: number): CSSProperties {
  const angle = (n / 10) * Math.PI * 2
  const radius = 28 + (n % 3) * 8
  const x = 50 + Math.cos(angle) * radius
  const y = 50 + Math.sin(angle) * radius
  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${(n % 5) * 40}ms`,
  }
}

const fetchedLabel = computed(() => {
  if (!data.value?.fetchedAt) return ''
  return new Date(data.value.fetchedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const pendingPitches = computed(
  () => data.value?.pitches.filter((p) => p.status.includes('awaiting')) ?? [],
)

const totalDone = computed(
  () =>
    data.value?.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
      0,
    ) ?? 0,
)

const totalNeedsHuman = computed(
  () =>
    data.value?.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'needs-human').length,
      0,
    ) ?? 0,
)

function blockedCount(p: ConductorProject) {
  return p.tasks.filter((t) => t.status === 'blocked').length
}

function needsHumanCount(p: ConductorProject) {
  return p.tasks.filter((t) => t.status === 'needs-human').length
}

const STATUS_ORDER = ['done', 'review', 'claimed', 'ready', 'waiting', 'blocked', 'needs-human']

function taskStatusSummary(p: ConductorProject): [string, number][] {
  const counts: Record<string, number> = {}
  for (const t of p.tasks) counts[t.status] = (counts[t.status] ?? 0) + 1
  return Object.entries(counts).sort(([a], [b]) => {
    const ai = STATUS_ORDER.indexOf(a)
    const bi = STATUS_ORDER.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

function kindIcon(kind: string) {
  return kind === 'software'
    ? 'kind-icon:code'
    : kind === 'proposal'
      ? 'kind-icon:sparkles'
      : 'kind-icon:document'
}

function kindOverlay(kind: string): CSSProperties {
  const overlays: Record<string, string> = {
    software:
      'linear-gradient(160deg, rgba(168,85,247,0.25) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%)',
    proposal:
      'linear-gradient(160deg, rgba(14,165,233,0.25) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%)',
    content:
      'linear-gradient(160deg, rgba(236,72,153,0.25) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%)',
  }
  return { background: overlays[kind] ?? overlays['content']! }
}

function kindIconColorClass(kind: string) {
  return kind === 'software'
    ? 'kind-glow-primary'
    : kind === 'proposal'
      ? 'kind-glow-info'
      : 'kind-glow-secondary'
}

function kindProgressClass(kind: string) {
  return kind === 'software'
    ? 'bg-primary'
    : kind === 'proposal'
      ? 'bg-info'
      : 'bg-secondary'
}

function kindIconClass(kind: string) {
  return kind === 'software'
    ? 'border-primary/40 bg-primary/10 text-primary'
    : kind === 'proposal'
      ? 'border-info/40 bg-info/10 text-info'
      : 'border-secondary/40 bg-secondary/10 text-secondary'
}

function kindBadgeClass(kind: string) {
  return kind === 'software'
    ? 'badge-primary'
    : kind === 'proposal'
      ? 'badge-info'
      : 'badge-secondary'
}

function taskBadgeClass(status: string) {
  const map: Record<string, string> = {
    done: 'badge-success',
    review: 'badge-secondary',
    claimed: 'badge-warning',
    ready: 'badge-info',
    waiting: 'badge-ghost',
    blocked: 'badge-error',
    'needs-human': 'badge-accent',
  }
  return map[status] ?? 'badge-ghost'
}

function taskIcon(status: string) {
  const map: Record<string, string> = {
    done: 'kind-icon:check',
    review: 'kind-icon:eye',
    claimed: 'kind-icon:hammer',
    ready: 'kind-icon:arrow-right',
    waiting: 'kind-icon:clock',
    blocked: 'kind-icon:warning',
    'needs-human': 'kind-icon:user',
  }
  return map[status] ?? 'kind-icon:sparkles'
}

function taskIconClass(status: string) {
  const map: Record<string, string> = {
    done: 'border-success/40 bg-success/10 text-success',
    review: 'border-secondary/40 bg-secondary/10 text-secondary',
    claimed: 'border-warning/40 bg-warning/10 text-warning',
    ready: 'border-info/40 bg-info/10 text-info',
    waiting: 'border-base-300 bg-base-200 text-base-content/40',
    blocked: 'border-error/40 bg-error/10 text-error',
    'needs-human': 'border-accent/40 bg-accent/10 text-accent',
  }
  return map[status] ?? 'border-base-300 bg-base-200 text-base-content/40'
}

function milestoneIcon(status: string) {
  return status === 'done'
    ? 'kind-icon:check'
    : status === 'in-progress'
      ? 'kind-icon:hammer'
      : 'kind-icon:clock'
}

function milestoneIconClass(status: string) {
  return status === 'done'
    ? 'border-success/40 bg-success/10 text-success'
    : status === 'in-progress'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-base-300 bg-base-200 text-base-content/40'
}

function milestoneBadgeClass(status: string) {
  return status === 'done'
    ? 'badge-success'
    : status === 'in-progress'
      ? 'badge-warning'
      : 'badge-ghost'
}
</script>

<style scoped>
/* ── Card hand scroll strip ───────────────────────────── */
.hand-scroll {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.hand-scroll::-webkit-scrollbar {
  display: none;
}

/* ── Project card sizing ──────────────────────────────── */
.project-card {
  width: 120px;
  perspective: 900px;
}

.is-selected {
  box-shadow:
    0 0 0 2px hsl(var(--p, 280 90% 60%)),
    0 8px 24px hsl(var(--p, 280 90% 60%) / 0.35);
}

/* ── Kind icon glows ──────────────────────────────────── */
.kind-glow-primary {
  color: hsl(var(--p, 280 90% 70%));
  filter: drop-shadow(0 0 10px hsl(var(--p, 280 90% 70%) / 0.9));
}
.kind-glow-secondary {
  color: hsl(var(--s, 316 70% 60%));
  filter: drop-shadow(0 0 10px hsl(var(--s, 316 70% 60%) / 0.9));
}
.kind-glow-info {
  color: hsl(var(--in, 198 93% 60%));
  filter: drop-shadow(0 0 10px hsl(var(--in, 198 93% 60%) / 0.9));
}

/* ── 3-D flip mechanics (ported from workspace-hand) ─── */
.card-flip {
  transform-style: preserve-3d;
  transition: transform 0s;
}

.card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.is-flipping .card-flip {
  animation: card-spin 650ms cubic-bezier(0.4, 0.1, 0.2, 1);
}

@keyframes card-spin {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  50% {
    transform: rotateY(180deg) scale(1.08);
  }
  100% {
    transform: rotateY(360deg) scale(1);
  }
}

/* ── Sparkles ────────────────────────────────────────── */
.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 9999px;
  background: radial-gradient(circle, hsl(var(--p, 280 90% 70%)) 0%, transparent 70%);
  box-shadow:
    0 0 6px 2px hsl(var(--p, 280 90% 70%) / 0.8),
    0 0 12px 4px hsl(var(--s, 200 90% 70%) / 0.5);
  opacity: 0;
  animation: sparkle-pop 650ms ease-out forwards;
}

@keyframes sparkle-pop {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(0deg);
  }
  35% {
    opacity: 1;
    transform: scale(1.4) rotate(90deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.4) rotate(180deg);
  }
}

/* ── Swirl rings ─────────────────────────────────────── */
.swirl {
  position: absolute;
  inset: 8%;
  border-radius: 9999px;
  border: 2px solid transparent;
  opacity: 0;
}

.swirl-a {
  border-top-color: hsl(var(--p, 280 90% 70%) / 0.9);
  border-right-color: hsl(var(--s, 200 90% 70%) / 0.6);
  animation: swirl-spin 650ms ease-out forwards;
}

.swirl-b {
  inset: 20%;
  border-bottom-color: hsl(var(--a, 320 90% 70%) / 0.9);
  border-left-color: hsl(var(--p, 280 90% 70%) / 0.6);
  animation: swirl-spin-rev 650ms ease-out forwards;
}

@keyframes swirl-spin {
  0% {
    opacity: 0;
    transform: rotate(0deg) scale(0.6);
  }
  40% {
    opacity: 1;
    transform: rotate(220deg) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: rotate(420deg) scale(1.3);
  }
}

@keyframes swirl-spin-rev {
  0% {
    opacity: 0;
    transform: rotate(0deg) scale(0.6);
  }
  40% {
    opacity: 1;
    transform: rotate(-220deg) scale(1.05);
  }
  100% {
    opacity: 0;
    transform: rotate(-420deg) scale(1.25);
  }
}

/* ── Transitions ─────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 2000px;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}

.detail-slide-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
}
.detail-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.detail-slide-enter-from,
.detail-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0, 0.2, 1.4);
}
.pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* ── Reduced motion ──────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .is-flipping .card-flip {
    animation: none;
  }
  .sparkle,
  .swirl {
    animation: none;
    opacity: 0;
  }
}
</style>
