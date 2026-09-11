<!-- /components/conductor/task-responder.vue -->
<template>
  <div v-if="userStore.isAdmin" class="mt-2">
    <button
      type="button"
      class="kr-btn-ghost-xs-lg gap-1 border border-base-300"
      :aria-expanded="open"
      @click="toggle"
    >
      <Icon name="kind-icon:comment" class="size-3" />
      {{ isGated ? 'Answer this gate' : 'Respond' }}
    </button>

    <div
      v-if="open"
      class="mt-2 rounded-lg border border-base-300 bg-base-200/50 p-2"
    >
      <label class="sr-only" :for="`task-reply-${taskKey}`">
        Your response for {{ task.title }}
      </label>
      <textarea
        :id="`task-reply-${taskKey}`"
        v-model="reply"
        rows="3"
        class="textarea textarea-bordered w-full rounded-lg text-sm leading-snug"
        :placeholder="
          isGated
            ? 'Answer this, and the next agent picks the task up carrying what you said.'
            : 'This reaches the project worker as a new task on this roadmap item.'
        "
        :disabled="busy"
      />

      <div class="mt-1.5 flex flex-wrap items-center gap-1">
        <template v-if="isGated">
          <button
            type="button"
            class="btn btn-primary btn-xs gap-1 rounded-lg"
            :disabled="busy || !replyText"
            title="Answer and release the gate for the next agent"
            @click="runTaskAction('answer')"
          >
            <span v-if="busy" class="kr-spinner-xs" />
            <Icon v-else name="kind-icon:send" class="size-3" />
            Send to agent
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg border border-base-300 text-success"
            :disabled="busy"
            title="Close this gate as approved"
            @click="runTaskAction('approve')"
          >
            Approve
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg border border-base-300 text-error"
            :disabled="busy || !replyText"
            title="Send the work back for another pass"
            @click="runTaskAction('reject')"
          >
            Send back
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg border border-base-300"
            :disabled="busy || !replyText"
            title="Add this note but leave the gate open"
            @click="runTaskAction('comment')"
          >
            Note only
          </button>
        </template>
        <button
          v-else
          type="button"
          class="btn btn-primary btn-xs gap-1 rounded-lg"
          :disabled="busy || !replyText || !props.projectId"
          @click="sendTaskNote"
        >
          <span v-if="busy" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:send" class="size-3" />
          Send to worker
        </button>
      </div>

      <p v-if="error" class="mt-1 text-[0.65rem] font-bold text-error">
        {{ error }}
      </p>
      <p v-else-if="sent" class="mt-1 text-[0.65rem] font-bold text-success">
        {{ sent }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ConductorTask } from '@/server/api/conductor/projects.get'
import {
  useConductorStore,
  type ConductorTaskAction,
} from '@/stores/conductorStore'
import { useTodoStore } from '@/stores/todoStore'
import { useUserStore } from '@/stores/userStore'

/*
 * Responding to a roadmap item, in the place the item is actually read.
 *
 * Silas, 2026-09-11: "I cannot actually respond to tasks, I can't clear tasks
 * that are human gated." The gate composer already existed on the For You home
 * surface (home-attention.vue) and the conductor task-action endpoint already
 * supported all four verbs -- the two conductor surfaces that actually SHOW a
 * roadmap were the ones with no way to act on it, so a gate opened here had to
 * be answered somewhere else. This is the shared composer both of them mount.
 *
 * A gate gets the four conductor verbs. Anything else gets a project Todo
 * tagged with the task id, because conductor's task-action endpoint only
 * accepts a task already parked at needs-human (409 otherwise) and inventing a
 * second write path into the roadmap from here would be a worse answer than
 * using the queue the workers already read.
 */
const props = defineProps<{
  projectSlug: string
  task: ConductorTask
  projectId?: number | null
}>()

const conductorStore = useConductorStore()
const todoStore = useTodoStore()
const userStore = useUserStore()

const open = ref(false)
const reply = ref('')
const sent = ref('')
const error = ref('')
const noteSubmitting = ref(false)

const taskKey = computed(() => `${props.projectSlug}/${props.task.id}`)
const isGated = computed(() => props.task.status === 'needs-human')
const replyText = computed(() => reply.value.trim())
const busy = computed(
  () =>
    noteSubmitting.value ||
    conductorStore.updatingTaskKeys.includes(taskKey.value),
)

function toggle(): void {
  open.value = !open.value
  sent.value = ''
  error.value = ''
  conductorStore.taskUpdateError = null
}

async function runTaskAction(action: ConductorTaskAction): Promise<void> {
  error.value = ''
  const completed = await conductorStore.submitTaskAction(
    props.projectSlug,
    props.task.id,
    action,
    reply.value,
  )
  if (!completed) {
    error.value =
      conductorStore.taskUpdateError || 'Conductor task update failed.'
    return
  }
  reply.value = ''
  sent.value =
    action === 'comment'
      ? 'Note queued. The gate stays open.'
      : 'Queued for conductor. It reaches the roadmap on the next task-events run.'
}

async function sendTaskNote(): Promise<void> {
  const body = replyText.value
  if (!body || !props.projectId) return
  noteSubmitting.value = true
  error.value = ''
  try {
    const created = await todoStore.createTodo({
      title: `${props.task.id}: ${props.task.title}`.slice(0, 160),
      description: [
        `Project: ${props.projectSlug}`,
        `Roadmap task: ${props.task.id} (${props.task.status})`,
        body,
      ].join('\n\n'),
      category: 'AGENT',
      priority: 'NORMAL',
      projectId: props.projectId,
    })
    if (!created) {
      error.value = 'That response could not be saved.'
      return
    }
    reply.value = ''
    sent.value = 'Sent to the project worker queue.'
  } finally {
    noteSubmitting.value = false
  }
}
</script>
