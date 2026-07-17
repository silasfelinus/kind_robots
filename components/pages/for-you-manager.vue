<!-- /components/pages/for-you-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-1.5 sm:p-2.5"
  >
    <div class="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
      <p class="text-xs font-semibold text-accent/80">🍯 For You</p>
      <p class="mt-0.5 text-xs text-base-content/50">
        Action items your AI assigned to you. These help your projects along —
        check them off as you go.
      </p>
      <p
        v-if="highPriorityCount > 0"
        class="mt-1 text-xs font-semibold text-error"
      >
        {{ highPriorityCount }} high-priority item{{
          highPriorityCount > 1 ? 's' : ''
        }}
        need your attention.
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div class="space-y-2">
        <template v-if="todoStore.loading && !todoStore.honeyDoTodos.length">
          <div
            v-for="n in 3"
            :key="n"
            class="h-16 animate-pulse rounded-2xl border border-base-300 bg-base-200"
          />
        </template>

        <div
          v-for="todo in todoStore.honeyDoTodos"
          :key="todo.id"
          class="flex flex-col gap-1 rounded-2xl border px-4 py-3 transition-colors"
          :class="
            todo.priority === 'HIGH'
              ? 'border-error/30 bg-error/5'
              : 'border-base-300 bg-base-100'
          "
        >
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="shrink-0 text-base-content/30 transition-colors hover:text-success"
              title="Mark complete"
              @click="todoStore.toggleDone(todo)"
            >
              <Icon name="kind-icon:circle" class="size-5" />
            </button>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{
              todo.title
            }}</span>
            <span
              v-if="todo.priority === 'HIGH'"
              class="badge badge-error badge-xs shrink-0"
              >🔴 high</span
            >
            <span
              v-else-if="todo.priority === 'LOW'"
              class="badge badge-ghost badge-xs shrink-0"
              >🟢 low</span
            >
            <span class="shrink-0 text-xs text-base-content/40">{{
              relativeTime(todo.createdAt)
            }}</span>
          </div>
          <p
            v-if="todo.description"
            class="ml-8 text-xs leading-relaxed text-base-content/50"
          >
            {{ todo.description }}
          </p>
          <button
            v-if="relatedProject(todo)"
            type="button"
            class="ml-8 self-start text-xs text-info hover:underline"
            @click="viewProject(relatedProject(todo)!)"
          >
            View
            {{
              relatedProject(todo)!.title || relatedProject(todo)!.slug
            }}&nbsp;→
          </button>
        </div>

        <div
          v-if="!todoStore.loading && !todoStore.honeyDoTodos.length"
          class="py-8 text-center"
        >
          <Icon
            name="kind-icon:check-circle"
            class="mx-auto mb-2 size-8 text-success/40"
          />
          <p class="text-sm font-semibold text-base-content/50">
            Nothing needs your attention right now.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTodoStore, type Todo } from '@/stores/todoStore'
import {
  useProjectStore,
  type ProjectWithRelations,
} from '@/stores/projectStore'
import { usePageStore } from '@/stores/pageStore'

const todoStore = useTodoStore()
const projectStore = useProjectStore()
const pageStore = usePageStore()

const highPriorityCount = computed(
  () =>
    todoStore.honeyDoTodos.filter((todo) => todo.priority === 'HIGH').length,
)

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

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

onMounted(() => {
  if (!todoStore.hasLoaded) void todoStore.fetchTodos()
  if (!projectStore.loaded) void projectStore.fetchProjects()
})
</script>
