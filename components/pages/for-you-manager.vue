<!-- /components/pages/for-you-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-1.5 sm:p-2.5"
  >
    <div class="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p class="text-xs font-semibold text-accent/80">✨ For You</p>
          <p class="mt-0.5 text-xs text-base-content/55">
            Decisions, proposals, and personal follow-ups that need a human hand.
          </p>
        </div>
        <button
          v-if="userStore.isAdmin"
          class="btn btn-ghost btn-xs"
          :disabled="conductorStore.pending"
          @click="conductorStore.fetchProjects(true)"
        >
          <span
            v-if="conductorStore.pending"
            class="loading loading-spinner loading-xs"
          />
          Refresh
        </button>
      </div>
      <p
        v-if="urgentCount > 0"
        class="mt-1 text-xs font-semibold text-error"
      >
        {{ urgentCount }} item{{ urgentCount === 1 ? '' : 's' }} need a decision.
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div class="space-y-4 pb-4">
        <template v-if="userStore.isAdmin">
          <section class="space-y-2">
            <div class="flex items-center justify-between gap-2 px-1">
              <div>
                <h2 class="text-sm font-black">Conductor human gates</h2>
                <p class="text-xs text-base-content/50">
                  Approvals and questions currently blocking agent work.
                </p>
              </div>
              <span class="badge badge-warning badge-sm">
                {{ conductorStore.humanGates.length }}
              </span>
            </div>

            <div
              v-if="conductorStore.pending && !conductorStore.hasLiveData"
              class="h-28 animate-pulse rounded-2xl border border-base-300 bg-base-200"
            />

            <article
              v-for="gate in conductorStore.humanGates"
              :key="`${gate.project.slug}/${gate.task.id}`"
              class="rounded-2xl border border-warning/30 bg-warning/5 p-3 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <button
                    class="text-left text-xs font-bold text-primary hover:underline"
                    @click="viewConductorProject(gate.project.slug)"
                  >
                    {{ gate.project.name }} · {{ gate.task.id }}
                  </button>
                  <h3 class="mt-0.5 text-sm font-black leading-tight">
                    {{ gate.task.title }}
                  </h3>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    class="badge badge-sm"
                    :class="gate.task.softGate ? 'badge-info' : 'badge-error'"
                  >
                    {{ gate.task.softGate ? 'soft gate' : 'human gate' }}
                  </span>
                  <span v-if="gate.task.stakes" class="badge badge-ghost badge-sm">
                    {{ gate.task.stakes }}
                  </span>
                </div>
              </div>

              <details v-if="gate.task.note" class="mt-2 text-xs">
                <summary class="cursor-pointer font-semibold text-base-content/65">
                  Context from Conductor
                </summary>
                <p class="mt-2 whitespace-pre-wrap text-base-content/70">
                  {{ gate.task.note }}
                </p>
              </details>

              <textarea
                v-model="gateMessages[gateKey(gate.project.slug, gate.task.id)]"
                class="textarea textarea-bordered mt-3 min-h-20 w-full text-sm"
                placeholder="Add context, requested changes, or an approval note…"
                :disabled="taskIsUpdating(gate.project.slug, gate.task.id)"
              />

              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  class="btn btn-success btn-sm"
                  :disabled="taskIsUpdating(gate.project.slug, gate.task.id)"
                  @click="actOnGate(gate.project.slug, gate.task.id, 'approve')"
                >
                  <span
                    v-if="taskIsUpdating(gate.project.slug, gate.task.id)"
                    class="loading loading-spinner loading-xs"
                  />
                  Approve
                </button>
                <button
                  class="btn btn-error btn-outline btn-sm"
                  :disabled="
                    taskIsUpdating(gate.project.slug, gate.task.id) ||
                    !gateMessage(gate.project.slug, gate.task.id).trim()
                  "
                  @click="actOnGate(gate.project.slug, gate.task.id, 'reject')"
                >
                  Send back
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  :disabled="
                    taskIsUpdating(gate.project.slug, gate.task.id) ||
                    !gateMessage(gate.project.slug, gate.task.id).trim()
                  "
                  @click="actOnGate(gate.project.slug, gate.task.id, 'comment')"
                >
                  Send note
                </button>
              </div>
            </article>

            <div
              v-if="
                conductorStore.hasLiveData &&
                !conductorStore.pending &&
                !conductorStore.humanGates.length
              "
              class="rounded-2xl border border-success/20 bg-success/5 px-4 py-5 text-center"
            >
              <Icon
                name="kind-icon:check-circle"
                class="mx-auto mb-1 size-7 text-success/50"
              />
              <p class="text-sm font-semibold text-base-content/55">
                No Conductor gates are waiting on you.
              </p>
            </div>
          </section>

          <section class="space-y-2">
            <div class="flex items-center justify-between gap-2 px-1">
              <div>
                <h2 class="text-sm font-black">Pitch proposals</h2>
                <p class="text-xs text-base-content/50">
                  New ideas awaiting approval or rejection.
                </p>
              </div>
              <span class="badge badge-secondary badge-sm">
                {{ conductorStore.pendingPitches.length }}
              </span>
            </div>

            <article
              v-for="pitch in conductorStore.pendingPitches"
              :key="pitch.slug"
              class="rounded-2xl border border-secondary/25 bg-secondary/5 p-3"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-secondary/80">
                    {{ pitch.projectTarget || 'General' }}
                    <span v-if="pitch.date"> · {{ pitch.date }}</span>
                  </p>
                  <h3 class="text-sm font-black leading-tight">{{ pitch.title }}</h3>
                </div>
                <span v-if="pitch.effort" class="badge badge-ghost badge-sm">
                  {{ pitch.effort }}
                </span>
              </div>
              <p v-if="pitch.idea" class="mt-2 text-xs text-base-content/70">
                {{ pitch.idea }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  class="btn btn-success btn-sm"
                  :disabled="pitchIsUpdating(pitch.slug)"
                  @click="conductorStore.updatePitchStatus(pitch.slug, 'approved')"
                >
                  Approve pitch
                </button>
                <button
                  class="btn btn-error btn-outline btn-sm"
                  :disabled="pitchIsUpdating(pitch.slug)"
                  @click="conductorStore.updatePitchStatus(pitch.slug, 'rejected')"
                >
                  Reject
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  @click="navigateTo('/conductor')"
                >
                  Full review
                </button>
              </div>
            </article>

            <div
              v-if="
                conductorStore.hasLiveData &&
                !conductorStore.pending &&
                !conductorStore.pendingPitches.length
              "
              class="rounded-2xl border border-base-300 bg-base-100 px-4 py-4 text-center text-sm text-base-content/50"
            >
              No new pitches are waiting.
            </div>
          </section>
        </template>

        <section class="space-y-2">
          <div class="flex items-center justify-between gap-2 px-1">
            <div>
              <h2 class="text-sm font-black">Personal follow-ups</h2>
              <p class="text-xs text-base-content/50">
                Your existing Kind Robots task reminders.
              </p>
            </div>
            <span class="badge badge-accent badge-sm">
              {{ todoStore.honeyDoTodos.length }}
            </span>
          </div>

          <template v-if="todoStore.loading && !todoStore.honeyDoTodos.length">
            <div
              v-for="n in 2"
              :key="n"
              class="h-16 animate-pulse rounded-2xl border border-base-300 bg-base-200"
            />
          </template>

          <honeydo-card
            v-for="todo in todoStore.honeyDoTodos"
            :key="todo.id"
            :todo="todo"
            :project="relatedProject(todo)"
            @toggle-done="todoStore.toggleDone(todo)"
            @view-project="viewProject"
          />

          <div
            v-if="!todoStore.loading && !todoStore.honeyDoTodos.length"
            class="rounded-2xl border border-base-300 bg-base-100 px-4 py-4 text-center text-sm text-base-content/50"
          >
            No personal follow-ups are waiting.
          </div>
        </section>

        <p
          v-if="conductorStore.taskUpdateError || conductorStore.pitchUpdateError"
          class="rounded-xl bg-error/10 px-3 py-2 text-xs text-error"
        >
          {{ conductorStore.taskUpdateError || conductorStore.pitchUpdateError }}
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
  type ConductorTaskAction,
} from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'

const todoStore = useTodoStore()
const projectStore = useProjectStore()
const pageStore = usePageStore()
const conductorStore = useConductorStore()
const userStore = useUserStore()
const gateMessages = ref<Record<string, string>>({})

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
