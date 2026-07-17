<!-- /components/tasks/honeydo-card.vue -->
<!--
  Shared honey-do item card (checkbox toggle, title, priority badge,
  description, relative timestamp, "View project" link). Used by both the
  Conductor HONEYDO tab (components/pages/conductor-page.vue) and the
  top-level For You page (components/pages/for-you-manager.vue) so the two
  surfaces can't silently drift apart when a badge or action is added.
  Purely presentational -- callers own the todoStore/projectStore calls and
  handle emitted events.
-->
<template>
  <div
    class="flex flex-col gap-1 rounded-2xl border px-4 py-3 transition-colors"
    :class="cardClass"
  >
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="shrink-0 transition-colors"
        :class="
          isDone
            ? 'text-success'
            : 'text-base-content/30 hover:text-success'
        "
        title="Mark complete"
        @click="emit('toggle-done')"
      >
        <Icon
          :name="isDone ? 'kind-icon:check-circle' : 'kind-icon:circle'"
          class="size-5"
        />
      </button>
      <span
        class="min-w-0 flex-1 truncate text-sm font-medium"
        :class="isDone ? 'line-through text-base-content/40' : ''"
        >{{ todo.title }}</span
      >
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
      <span
        v-if="showCategoryBadge"
        class="badge badge-accent badge-xs shrink-0"
        >🍯 honey do</span
      >
      <span
        v-if="showRelativeTime"
        class="shrink-0 text-xs text-base-content/40"
        >{{ relativeTime(todo.createdAt) }}</span
      >
      <div
        v-if="showArchiveAction || showDeleteAction"
        class="flex shrink-0 gap-1"
      >
        <button
          v-if="showArchiveAction && todo.status !== 'ARCHIVED'"
          type="button"
          class="btn btn-ghost btn-xs rounded-lg text-base-content/30 hover:text-base-content"
          title="Archive"
          @click="emit('archive')"
        >
          <Icon name="kind-icon:archive" class="size-3" />
        </button>
        <button
          v-if="showDeleteAction"
          type="button"
          class="btn btn-ghost btn-xs rounded-lg text-base-content/20 hover:text-error"
          title="Delete"
          @click="emit('delete')"
        >
          <Icon name="kind-icon:x" class="size-3" />
        </button>
      </div>
    </div>
    <p
      v-if="todo.description"
      class="ml-8 text-xs leading-relaxed text-base-content/50"
    >
      {{ todo.description }}
    </p>
    <button
      v-if="project"
      type="button"
      class="ml-8 self-start text-xs text-info hover:underline"
      @click="emit('view-project', project)"
    >
      View {{ project.title || project.slug }}&nbsp;→
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '@/stores/todoStore'
import type { ProjectWithRelations } from '@/stores/projectStore'

const props = withDefaults(
  defineProps<{
    todo: Todo
    project?: ProjectWithRelations | null
    showRelativeTime?: boolean
    showCategoryBadge?: boolean
    showArchiveAction?: boolean
    showDeleteAction?: boolean
  }>(),
  {
    project: null,
    showRelativeTime: true,
    showCategoryBadge: false,
    showArchiveAction: false,
    showDeleteAction: false,
  },
)

const emit = defineEmits<{
  'toggle-done': []
  archive: []
  delete: []
  'view-project': [project: ProjectWithRelations]
}>()

const isDone = computed(() => props.todo.status === 'DONE')

const cardClass = computed(() =>
  isDone.value
    ? 'opacity-60 border-base-300 bg-base-100'
    : props.todo.priority === 'HIGH'
      ? 'border-error/30 bg-error/5'
      : 'border-base-300 bg-base-100',
)

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
</script>
