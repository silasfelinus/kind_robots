<!-- /components/home/home-attention.vue -->
<!--
  The things waiting on Silas, and the place he answers them.

  Silas, 2026-08-29: "Dream entry should take up less horizontal space to leave
  room for a vertical notification scroll, especially things that I can answer
  that are human gated." Then, once it existed: "We need a definite pipeline, so
  that if I click on one of the human gate notifications, it lets me enter a
  comment and that comment is fed to the next agent dealing with that problem.
  The infrastructure should be there, the excecition is missing the front
  end....but also we might be missing whatever ties the response to the project
  referenced. follow it end to end."

  IT WAS BOTH. The front end was missing here, and following the chain end to
  end found a real break behind it. The chain is:

    this component
      -> conductorStore.submitTaskAction
      -> POST /api/conductor/task-action        (Kind Robots, admin-only)
      -> a YAML file committed to conductor's task-events/ via the GitHub API
      -> .github/workflows/process-task-events.yml
      -> scripts/process_task_events.py         (appends the note to the task)
      -> sync-kind-robots-projection.yml        (projects it back here)

  Every link of that existed and worked. The break was at the far end: the only
  comment action available left the task at `status: needs-human`, and
  conductor's Worker selects `status: ready` and nothing else. So an answer was
  written into the roadmap and then never handed to anybody -- which is exactly
  "we might be missing whatever ties the response to the project referenced".

  The fix is the `answer` action (see task-action.post.ts): the same note, plus
  the release back to `ready` that puts the task in the next Worker's queue.
  That is the primary button here. `comment` survives as "note only", for
  adding context to a gate that should stay gated, and conductor's
  audit_human_gates.py now flags those so they surface in the session sweep
  instead of sitting unread.

  APPROVE IS DELIBERATELY NOT THE PRIMARY. Approving closes a gate on the
  coordination system of record; answering hands it onward. The second is the
  one Silas asked for and the safer default, so it is the one in reach.

  ADMIN-ONLY BY DATA, not by a check here: conductorStore only has gates when
  the projection is readable, and /api/conductor/task-action is behind
  requireAdminApiUser -- so a signed-out visitor sees the empty branch and the
  column collapses out of the layout entirely.
-->
<template>
  <section
    v-if="gates.length || isLoading"
    class="flex min-h-0 flex-col gap-1 kr-panel-flat p-2 lg:w-80 lg:shrink-0"
  >
    <header class="flex shrink-0 items-baseline justify-between gap-2">
      <h2
        class="text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary"
      >
        Needs you
        <span v-if="gates.length" class="text-base-content/40"
          >· {{ gates.length }}</span
        >
      </h2>

      <NuxtLink
        to="/conductor"
        class="link link-hover text-[0.7rem] font-bold text-base-content/50 hover:text-primary"
      >
        conductor →
      </NuxtLink>
    </header>

    <!--
      A bounded scroller, not an unbounded list: the gate count is unpredictable
      (it has been twenty-plus) and this sits beside a fixed-height hero. The
      layout contract's one-scroll rule deliberately does not count a `max-h-*`
      region -- nested preview, not the page's scroll owner.
    -->
    <div
      class="max-h-64 min-h-0 space-y-1 overflow-y-auto overscroll-contain pr-1"
    >
      <div
        v-for="gate in gates"
        :key="gateKey(gate)"
        class="rounded-lg border border-base-300 bg-base-100 transition-colors"
        :class="openKey === gateKey(gate) ? 'border-primary' : ''"
      >
        <button
          type="button"
          class="group block w-full px-2 py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :aria-expanded="openKey === gateKey(gate)"
          :title="gate.task.title"
          @click="toggle(gate)"
        >
          <p
            class="truncate text-[0.6rem] font-black uppercase tracking-[0.12em] text-primary"
          >
            {{ gate.project.name || gate.project.slug }}
            <span v-if="gate.task.softGate" class="text-base-content/35"
              >· soft</span
            >
          </p>
          <p
            class="line-clamp-2 text-[0.7rem] font-bold leading-snug text-base-content group-hover:text-primary"
          >
            {{ gate.task.title }}
          </p>
        </button>

        <!--
          The composer, opened in place. Not a modal: answering three gates in a
          row should not mean opening and dismissing three dialogs, and the list
          it belongs to is already a scroller.
        -->
        <div
          v-if="openKey === gateKey(gate)"
          class="border-t border-base-300 p-2"
        >
          <p
            v-if="gate.task.note"
            class="mb-1.5 line-clamp-4 whitespace-pre-line rounded bg-base-200/60 p-1.5 text-[0.65rem] leading-snug text-base-content/60"
          >
            {{ gate.task.note }}
          </p>

          <label class="sr-only" :for="`gate-reply-${gateKey(gate)}`">
            Your answer for {{ gate.task.title }}
          </label>
          <textarea
            :id="`gate-reply-${gateKey(gate)}`"
            v-model="replies[gateKey(gate)]"
            rows="3"
            class="w-full rounded border border-base-300 bg-base-100 p-1.5 text-[0.7rem] leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            placeholder="Answer this, and the next agent picks the task up carrying what you said."
            :disabled="isUpdating(gate)"
          />

          <div class="mt-1.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              class="btn btn-primary btn-xs gap-1 rounded-lg"
              :disabled="isUpdating(gate) || !replyText(gate)"
              @click="act(gate, 'answer')"
            >
              <span
                v-if="isUpdating(gate)"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:send" class="size-3" />
              Send to agent
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg border border-base-300"
              :disabled="isUpdating(gate) || !replyText(gate)"
              title="Add this note but leave the gate open"
              @click="act(gate, 'comment')"
            >
              Note only
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg border border-base-300 text-success"
              :disabled="isUpdating(gate)"
              title="Close this gate as approved"
              @click="act(gate, 'approve')"
            >
              Approve
            </button>

            <NuxtLink
              :to="`/conductor?project=${encodeURIComponent(gate.project.slug)}`"
              class="btn btn-ghost btn-xs ml-auto rounded-lg text-base-content/50"
            >
              Open
            </NuxtLink>
          </div>

          <p
            v-if="conductorStore.taskUpdateError"
            class="mt-1 text-[0.65rem] font-bold text-error"
          >
            {{ conductorStore.taskUpdateError }}
          </p>

          <p
            v-else-if="sentKey === gateKey(gate)"
            class="mt-1 text-[0.65rem] font-bold text-success"
          >
            Queued for conductor. It reaches the roadmap on the next task-events
            run.
          </p>
        </div>
      </div>

      <p
        v-if="isLoading && !gates.length"
        class="px-1 py-2 text-[0.7rem] text-base-content/50"
      >
        Checking what's waiting…
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  useConductorStore,
  type ConductorHumanGate,
  type ConductorTaskAction,
} from '@/stores/conductorStore'

const conductorStore = useConductorStore()

const gates = computed(() => conductorStore.humanGates)
const isLoading = computed(() => !conductorStore.hasLoaded)

const openKey = ref('')
const sentKey = ref('')
const replies = ref<Record<string, string>>({})

function gateKey(gate: ConductorHumanGate): string {
  return `${gate.project.slug}/${gate.task.id}`
}

function replyText(gate: ConductorHumanGate): string {
  return (replies.value[gateKey(gate)] ?? '').trim()
}

function isUpdating(gate: ConductorHumanGate): boolean {
  return conductorStore.updatingTaskKeys.includes(gateKey(gate))
}

function toggle(gate: ConductorHumanGate): void {
  const key = gateKey(gate)
  openKey.value = openKey.value === key ? '' : key
  sentKey.value = ''
  conductorStore.taskUpdateError = null
}

async function act(
  gate: ConductorHumanGate,
  action: ConductorTaskAction,
): Promise<void> {
  const key = gateKey(gate)
  const completed = await conductorStore.submitTaskAction(
    gate.project.slug,
    gate.task.id,
    action,
    replies.value[key] ?? '',
  )
  if (!completed) return

  // Cleared rather than deleted: the eslint rule against dynamic delete is
  // right that the key set here is data, and an empty string is what
  // `replyText` already treats as "nothing to send".
  replies.value[key] = ''
  sentKey.value = key
  /*
   * `answer` and `approve` both move the task off `needs-human`, so the store's
   * optimistic update drops it out of `humanGates` and this row disappears on
   * its own. A `comment` leaves it in place, so the panel stays open with the
   * note now visible above the box.
   */
  if (action !== 'comment') openKey.value = ''
}

onMounted(() => {
  /*
   * fetchProjects is cached in the store (FRESH_DATA_MS), so this is a no-op
   * when anything else on the session has already asked.
   */
  void conductorStore.fetchProjects()
})
</script>
