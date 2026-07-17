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

onMounted(() => {
  if (!todoStore.hasLoaded) void todoStore.fetchTodos()
  if (!projectStore.loaded) void projectStore.fetchProjects()
})
</script>
