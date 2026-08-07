<!-- /components/pages/for-you-manager.vue -->
<template>
  <section
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden"
  >
    <div class="kr-scroll min-h-0 flex-1 overscroll-contain">
      <div
        class="mx-auto w-full max-w-[1800px] space-y-6 p-2 pb-8 sm:p-4 sm:pb-10 xl:p-6"
      >
        <!--
          daily-dream-generator moved here from dream-manager, where it sat in a
          `#persistent` slot and so rendered "Today's Facet Dream" above EVERY
          Dreams tab. Silas, 2026-08-07: "if that's supposed to be part of the
          daily dream index, it shouldn't be here."

          This IS the daily-dream index, so it lands beside the digest browser
          rather than being deleted -- the Dream browser should not carry the
          daily ritual, but the daily page should.
        -->
        <daily-dream-generator />

        <daily-digest-browser />

        <header
          class="kr-toolbar flex flex-col gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-accent">
              <Icon name="kind-icon:sparkles" class="size-5" />
              <p class="text-xs font-black uppercase tracking-[0.18em]">
                For You
              </p>
            </div>
            <h2 class="mt-1 text-xl font-black sm:text-2xl">
              Your attention desk
            </h2>
            <p class="mt-1 max-w-3xl text-sm text-base-content/60">
              Decisions, proposals, and follow-ups gathered into one human-sized
              place.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="userStore.isAdmin"
              class="badge badge-warning h-auto gap-1 rounded-xl px-3 py-2"
            >
              <Icon name="kind-icon:lock" class="size-3.5" />
              {{ conductorStore.humanGates.length }} active gate{{
                conductorStore.humanGates.length === 1 ? '' : 's'
              }}
            </span>
            <span
              v-if="userStore.isAdmin"
              class="badge badge-secondary h-auto gap-1 rounded-xl px-3 py-2"
            >
              <Icon name="kind-icon:lightbulb" class="size-3.5" />
              {{ conductorStore.pendingPitches.length }} pitch{{
                conductorStore.pendingPitches.length === 1 ? '' : 'es'
              }}
            </span>
            <span class="badge badge-accent h-auto gap-1 rounded-xl px-3 py-2">
              <Icon name="kind-icon:check-square" class="size-3.5" />
              {{ todoStore.honeyDoTodos.length }} follow-up{{
                todoStore.honeyDoTodos.length === 1 ? '' : 's'
              }}
            </span>
            <button
              v-if="userStore.isAdmin"
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              :disabled="conductorStore.pending"
              @click="conductorStore.fetchProjects(true)"
            >
              <span
                v-if="conductorStore.pending"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:refresh-cw" class="size-4" />
              Refresh
            </button>
          </div>
        </header>

        <p
          v-if="urgentCount > 0"
          class="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-semibold text-error"
        >
          {{ urgentCount }} item{{ urgentCount === 1 ? '' : 's' }} need a
          decision.
        </p>

        <template v-if="userStore.isAdmin">
          <section class="space-y-3">
            <div class="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.16em] text-warning"
                >
                  Conductor
                </p>
                <h2 class="text-xl font-black">Human gates</h2>
                <p class="text-sm text-base-content/55">
                  Active approvals and questions waiting on your judgment.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <label
                  v-if="conductorStore.pausedHumanGates.length"
                  class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-bold shadow-sm"
                >
                  <input
                    v-model="showPausedProjects"
                    type="checkbox"
                    class="toggle toggle-warning toggle-sm"
                  />
                  <span>Show paused projects</span>
                  <span class="badge badge-ghost badge-sm rounded-lg">
                    {{ conductorStore.pausedHumanGates.length }}
                  </span>
                </label>
                <span class="badge badge-warning rounded-xl">
                  {{ conductorStore.humanGates.length }} active
                </span>
              </div>
            </div>

            <div
              v-if="conductorStore.pending && !conductorStore.hasLiveData"
              class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3"
            >
              <div
                v-for="n in 3"
                :key="n"
                class="h-64 animate-pulse rounded-2xl border border-base-300 bg-base-200"
              />
            </div>

            <div
              v-else-if="visibleHumanGates.length"
              class="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3"
            >
              <article
                v-for="gate in visibleHumanGates"
                :key="`${gate.project.slug}/${gate.task.id}`"
                class="flex h-full min-w-0 flex-col rounded-2xl border bg-base-100 p-4 shadow-sm transition-shadow hover:shadow-md"
                :class="
                  isPausedGate(gate)
                    ? 'border-base-300 opacity-80'
                    : 'border-warning/30'
                "
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <button
                      type="button"
                      class="max-w-full truncate text-left text-xs font-bold text-primary hover:underline"
                      @click="viewConductorProject(gate.project.slug)"
                    >
                      {{ gate.project.name }} · {{ gate.task.id }}
                    </button>
                    <h3 class="mt-1 text-base font-black leading-snug">
                      {{ gate.task.title }}
                    </h3>
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-1">
                    <span
                      v-if="isPausedGate(gate)"
                      class="badge badge-neutral badge-sm rounded-xl"
                    >
                      paused
                    </span>
                    <span
                      class="badge badge-sm rounded-xl"
                      :class="gate.task.softGate ? 'badge-info' : 'badge-error'"
                    >
                      {{ gate.task.softGate ? 'question' : 'approval' }}
                    </span>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap gap-1.5">
                  <span
                    v-if="gate.task.stakes"
                    class="badge badge-ghost badge-sm rounded-xl"
                  >
                    {{ gate.task.stakes }}
                  </span>
                  <span
                    v-if="!gate.task.softGate && !isPausedGate(gate)"
                    class="badge badge-outline badge-sm rounded-xl"
                  >
                    blocking work
                  </span>
                </div>

                <details
                  v-if="gate.task.note"
                  class="group mt-3 rounded-xl border border-base-300 bg-base-200/50"
                >
                  <summary
                    class="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-base-content/65 marker:hidden"
                  >
                    Context from Conductor
                    <Icon
                      name="kind-icon:chevron-down"
                      class="size-4 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p
                    class="whitespace-pre-wrap border-t border-base-300 px-3 py-3 text-xs leading-relaxed text-base-content/70"
                  >
                    {{ gate.task.note }}
                  </p>
                </details>

                <div class="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <button
                    type="button"
                    class="btn btn-success btn-sm rounded-xl"
                    :disabled="taskIsUpdating(gate.project.slug, gate.task.id)"
                    @click="
                      actOnGate(gate.project.slug, gate.task.id, 'approve')
                    "
                  >
                    <span
                      v-if="taskIsUpdating(gate.project.slug, gate.task.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    <Icon v-else name="kind-icon:check" class="size-4" />
                    Approve
                  </button>

                  <details class="group min-w-[12rem] flex-1">
                    <summary
                      class="btn btn-outline btn-sm w-full list-none rounded-xl marker:hidden"
                    >
                      <Icon name="kind-icon:message-square" class="size-4" />
                      Reply or send back
                      <Icon
                        name="kind-icon:chevron-down"
                        class="ml-auto size-4 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div
                      class="mt-3 rounded-2xl border border-base-300 bg-base-200/60 p-3"
                    >
                      <textarea
                        v-model="
                          gateMessages[gateKey(gate.project.slug, gate.task.id)]
                        "
                        class="textarea textarea-bordered min-h-24 w-full rounded-xl bg-base-100 text-sm"
                        placeholder="Add context, requested changes, or a note…"
                        :disabled="
                          taskIsUpdating(gate.project.slug, gate.task.id)
                        "
                      />
                      <div class="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="btn btn-error btn-outline btn-sm rounded-xl"
                          :disabled="
                            taskIsUpdating(gate.project.slug, gate.task.id) ||
                            !gateMessage(gate.project.slug, gate.task.id).trim()
                          "
                          @click="
                            actOnGate(gate.project.slug, gate.task.id, 'reject')
                          "
                        >
                          Send back
                        </button>
                        <button
                          type="button"
                          class="btn btn-ghost btn-sm rounded-xl"
                          :disabled="
                            taskIsUpdating(gate.project.slug, gate.task.id) ||
                            !gateMessage(gate.project.slug, gate.task.id).trim()
                          "
                          @click="
                            actOnGate(
                              gate.project.slug,
                              gate.task.id,
                              'comment',
                            )
                          "
                        >
                          Send note
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </article>
            </div>

            <div
              v-else-if="conductorStore.hasLiveData && !conductorStore.pending"
              class="rounded-2xl border border-success/20 bg-success/5 px-5 py-8 text-center"
            >
              <Icon
                name="kind-icon:check-circle"
                class="mx-auto mb-2 size-9 text-success/55"
              />
              <p class="font-black">
                No active Conductor gates are waiting on you.
              </p>
              <p class="mt-1 text-sm text-base-content/50">
                <template v-if="conductorStore.pausedHumanGates.length">
                  {{ conductorStore.pausedHumanGates.length }} paused-project
                  gate{{
                    conductorStore.pausedHumanGates.length === 1
                      ? ' is'
                      : 's are'
                  }}
                  hidden above.
                </template>
                <template v-else>The robots may proceed.</template>
              </p>
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.16em] text-secondary"
                >
                  Possibilities
                </p>
                <h2 class="text-xl font-black">Pitch proposals</h2>
                <p class="text-sm text-base-content/55">
                  New ideas waiting for a green light or a merciful trapdoor.
                </p>
              </div>
              <span class="badge badge-secondary rounded-xl">
                {{ conductorStore.pendingPitches.length }} waiting
              </span>
            </div>

            <div
              v-if="conductorStore.pendingPitches.length"
              class="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3"
            >
              <article
                v-for="pitch in conductorStore.pendingPitches"
                :key="pitch.slug"
                class="flex h-full min-w-0 flex-col rounded-2xl border border-secondary/25 bg-base-100 p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-bold text-secondary/80">
                      {{ pitch.projectTarget || 'General' }}
                      <span v-if="pitch.date"> · {{ pitch.date }}</span>
                    </p>
                    <h3 class="mt-1 text-base font-black leading-snug">
                      {{ pitch.title }}
                    </h3>
                  </div>
                  <span
                    v-if="pitch.effort"
                    class="badge badge-ghost badge-sm rounded-xl"
                  >
                    {{ pitch.effort }}
                  </span>
                </div>

                <p
                  v-if="pitch.idea"
                  class="mt-3 line-clamp-5 text-sm leading-relaxed text-base-content/70"
                >
                  {{ pitch.idea }}
                </p>

                <div class="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    class="btn btn-success btn-sm rounded-xl"
                    :disabled="pitchIsUpdating(pitch.slug)"
                    @click="
                      conductorStore.updatePitchStatus(pitch.slug, 'approved')
                    "
                  >
                    Approve pitch
                  </button>
                  <button
                    type="button"
                    class="btn btn-error btn-outline btn-sm rounded-xl"
                    :disabled="pitchIsUpdating(pitch.slug)"
                    @click="
                      conductorStore.updatePitchStatus(pitch.slug, 'rejected')
                    "
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm rounded-xl"
                    @click="navigateTo('/conductor')"
                  >
                    Full review
                  </button>
                </div>
              </article>
            </div>

            <div
              v-else-if="conductorStore.hasLiveData && !conductorStore.pending"
              class="rounded-2xl border border-base-300 bg-base-100 px-5 py-7 text-center"
            >
              <Icon
                name="kind-icon:lightbulb"
                class="mx-auto mb-2 size-8 text-secondary/45"
              />
              <p class="font-bold text-base-content/65">
                No new pitches are waiting.
              </p>
            </div>
          </section>
        </template>

        <section class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.16em] text-accent"
              >
                Kind Robots
              </p>
              <h2 class="text-xl font-black">Personal follow-ups</h2>
              <p class="text-sm text-base-content/55">
                Your existing reminders, arranged for an actual human screen.
              </p>
            </div>
            <span class="badge badge-accent rounded-xl">
              {{ todoStore.honeyDoTodos.length }} waiting
            </span>
          </div>

          <div
            v-if="todoStore.loading && !todoStore.honeyDoTodos.length"
            class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
          >
            <div
              v-for="n in 3"
              :key="n"
              class="h-28 animate-pulse rounded-2xl border border-base-300 bg-base-200"
            />
          </div>

          <div
            v-else-if="todoStore.honeyDoTodos.length"
            class="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3"
          >
            <honeydo-card
              v-for="todo in todoStore.honeyDoTodos"
              :key="todo.id"
              class="h-full"
              :todo="todo"
              :project="relatedProject(todo)"
              @toggle-done="todoStore.toggleDone(todo)"
              @view-project="viewProject"
            />
          </div>

          <div
            v-else
            class="rounded-2xl border border-base-300 bg-base-100 px-5 py-7 text-center"
          >
            <Icon
              name="kind-icon:check-circle"
              class="mx-auto mb-2 size-8 text-success/45"
            />
            <p class="font-bold text-base-content/65">
              No personal follow-ups are waiting.
            </p>
          </div>
        </section>

        <p
          v-if="
            conductorStore.taskUpdateError || conductorStore.pitchUpdateError
          "
          class="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {{
            conductorStore.taskUpdateError || conductorStore.pitchUpdateError
          }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTodoStore, type Todo } from '@/stores/todoStore'
import {
  useProjectStore,
  type ProjectWithRelations,
} from '@/stores/projectStore'
import { usePageStore } from '@/stores/pageStore'
import {
  useConductorStore,
  type ConductorHumanGate,
  type ConductorTaskAction,
} from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'

const todoStore = useTodoStore()
const projectStore = useProjectStore()
const pageStore = usePageStore()
const conductorStore = useConductorStore()
const userStore = useUserStore()
const gateMessages = ref<Record<string, string>>({})
const showPausedProjects = ref(false)

const visibleHumanGates = computed<ConductorHumanGate[]>(() =>
  showPausedProjects.value
    ? [...conductorStore.humanGates, ...conductorStore.pausedHumanGates]
    : conductorStore.humanGates,
)

const urgentCount = computed(() => {
  const hardGates = userStore.isAdmin
    ? conductorStore.humanGates.filter((gate) => !gate.task.softGate).length
    : 0
  const pitches = userStore.isAdmin ? conductorStore.pendingPitches.length : 0
  const highTodos = todoStore.honeyDoTodos.filter(
    (todo) => todo.priority === 'HIGH',
  ).length
  return hardGates + pitches + highTodos
})

function gateKey(projectSlug: string, taskId: string): string {
  return `${projectSlug}/${taskId}`
}

function gateMessage(projectSlug: string, taskId: string): string {
  return gateMessages.value[gateKey(projectSlug, taskId)] ?? ''
}

function isPausedGate(gate: ConductorHumanGate): boolean {
  return gate.project.conductorStatus === 'paused'
}

function taskIsUpdating(projectSlug: string, taskId: string): boolean {
  return conductorStore.updatingTaskKeys.includes(gateKey(projectSlug, taskId))
}

function pitchIsUpdating(slug: string): boolean {
  return conductorStore.updatingPitchSlugs.includes(slug)
}

async function actOnGate(
  projectSlug: string,
  taskId: string,
  action: ConductorTaskAction,
) {
  const key = gateKey(projectSlug, taskId)
  const completed = await conductorStore.submitTaskAction(
    projectSlug,
    taskId,
    action,
    gateMessages.value[key] ?? '',
  )
  if (completed) delete gateMessages.value[key]
}

function relatedProject(todo: Todo): ProjectWithRelations | null {
  if (!todo.projectId) return null
  return (
    projectStore.projects.find((project) => project.id === todo.projectId) ??
    null
  )
}

function viewProject(project: ProjectWithRelations) {
  if (!project.slug) return
  pageStore.setWorkspaceCardKey(project.slug)
  navigateTo('/conductor')
}

function viewConductorProject(projectSlug: string) {
  pageStore.setWorkspaceCardKey(projectSlug)
  navigateTo('/conductor')
}

onMounted(() => {
  if (!todoStore.hasLoaded) void todoStore.fetchTodos()
  if (!projectStore.loaded) void projectStore.fetchProjects()
  if (userStore.isAdmin) void conductorStore.fetchProjects()
})
</script>
