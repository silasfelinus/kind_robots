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

  THE NOTE SHOWN HERE IS A SUMMARY, NOT THE RAW FIELD (kind-robots/t-078,
  remaining polish item 2). A gate's `note` accumulates every prior cycle's
  progress paragraph -- some run past 10,000 characters -- so `line-clamp-4`
  over the raw text used to show four lines of whatever the OLDEST still-open
  paragraph happened to be, not the actionable part. Notes written to the
  "Writing needs-human task notes for Silas" template in conductor's
  AGENTS.md lead with `FOR SILAS:` and a `TO APPROVE:` segment specifically so
  a reader (or this panel) can jump straight to the question and the
  recommendation; `summarizeGateNote` below extracts exactly those two spans
  and falls back to the note's own opening clip when a note predates or
  ignores the convention.

  A SUBMISSION RECEIPT THAT OUTLIVES THE ROW (remaining polish item 1). The
  `answer`/`approve` actions release the task off `needs-human`, which drops
  it out of `gates` on the very same tick this component sets `sentKey` --
  the confirmation text lived inside `v-if="openKey === gateKey(gate)"`, a
  block belonging to a row that had already stopped existing, so it never
  actually painted. `receipts` is a section-level list instead of a per-row
  one, so it survives the row's own disappearance; each entry self-clears
  after `RECEIPT_TTL_MS` and can also be dismissed by hand.

  ADMIN-ONLY BY AN EXPLICIT CHECK, because "by data" was never true.

  This used to claim the panel gated itself: "conductorStore only has gates when
  the projection is readable, and /api/conductor/task-action is behind
  requireAdminApiUser -- so a signed-out visitor sees the empty branch." Only
  the second half held. `/api/conductor/task-action` is indeed admin-only, so a
  stranger could never ACT on a gate -- but `/api/conductor/projects` is fully
  public and returns every project's whole task list, `needs-human` rows
  included. Verified against production 2026-09-08 while signed out: 52
  projects, 44 needs-human tasks, 36 of them on active/continuous projects --
  which is exactly the "NEEDS YOU · 36" a logged-out visitor was seeing.

  So every stranger got Silas's personal decision queue on the front page.
  Silas, 2026-09-08: "unlogged in users should not even see a 'needs you'
  section as those are explicit to my user admin account."

  The gate list is not secret -- the same rows are on /conductor, which is a
  public page on purpose -- but it is not a front door for a visitor either:
  it is one person's inbox, it is the tallest thing in the column, and it
  pushes the newsfeed (which IS for visitors) into a sliver.

  `userStore.isAdmin` is the check, matching how the rest of the app gates
  admin-only affordances, and it renders nothing at all for anyone else rather
  than an empty panel -- the column then gives that height to the newsfeed.
-->
<template>
  <section
    v-if="isAdmin && (gates.length || isLoading || receipts.length)"
    class="flex min-h-0 flex-col gap-1 kr-panel-flat p-2"
  >
    <header class="flex shrink-0 items-baseline justify-between gap-2">
      <h2 class="kr-text-eyebrow text-[0.7rem] tracking-[0.16em] text-primary">
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
      The receipts. Section-level and separate from `gates` on purpose -- see
      the file header note. Newest first, capped, each self-dismissing.
    -->
    <ul v-if="receipts.length" class="shrink-0 space-y-1">
      <li
        v-for="receipt in receipts"
        :key="receipt.id"
        class="flex items-start gap-1.5 rounded-lg border border-success/30 bg-success/10 px-1.5 py-1 text-[0.65rem] leading-snug text-success"
      >
        <Icon name="kind-icon:check" class="kr-icon-3 mt-0.5 shrink-0" />
        <span class="min-w-0 flex-1">
          <span class="font-bold">{{ receipt.title }}</span>
          — {{ receiptVerb(receipt.action) }}.
        </span>
        <button
          type="button"
          class="shrink-0 text-success/50 hover:text-success"
          title="Dismiss"
          @click="dismissReceipt(receipt.id)"
        >
          <Icon name="kind-icon:x" class="kr-icon-3" />
        </button>
      </li>
    </ul>

    <!--
      A bounded scroller, not an unbounded list: the gate count is unpredictable
      (it has been seventy-plus) and this sits beside a fixed-height hero. The
      layout contract's one-scroll rule deliberately does not count a `max-h-*`
      region -- nested preview, not the page's scroll owner.

      ONE BOUND, applied at every width. This carried `xl:max-h-full` as well,
      which was right only while the page divided the viewport height and gave
      this column a definite one to resolve against. home-page.vue stopped doing
      that on 2026-09-11 (Silas: "we should never be forcing to a single vertical
      screen, let's let these things breath"), so at every width the column is
      auto-height, `max-h-full` means "as tall as my content", and the scroller
      silently stops scrolling -- the list simply unrolls into the page. The
      explicit rem value is the only bound that holds regardless.

      Measured on a tablet at 1180x820 (2026-09-02): this rendered 3542px tall
      with `scrollHeight === clientHeight`, and the page's real scroll owner
      reported 4333px of content in a 722px viewport. Six screenfuls, almost all
      of it gates. Silas: "We have three screens, a MASSIVE news feed." The
      explicit 26rem is about six gate rows -- enough to work through, short
      enough that projects and news stay on the same screen. With it, the same
      page measures 1133px.

      ONE COLUMN, not the three-across grid a very wide column briefly invited.
      Silas, 2026-08-30: "Basically, one vertically scrollable row, so the dream
      section can breath." The width is set by the page (half the band at lg, a
      third at xl) and the gates simply stack and scroll inside it, which is
      also the shape that lets a composer open in place without reflowing its
      neighbours.
    -->
    <div
      class="max-h-[26rem] min-h-0 space-y-1 overflow-y-auto overscroll-contain pr-1"
    >
      <div
        v-for="gate in gates"
        :key="gateKey(gate)"
        class="min-w-0 kr-panel-flat rounded-lg transition-colors"
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
            class="kr-text-eyebrow truncate text-[0.6rem] tracking-[0.12em] text-primary"
          >
            {{ gate.project.name || gate.project.slug }}
            <span v-if="gate.task.softGate" class="text-base-content/35"
              >· soft</span
            >
          </p>
          <p
            class="kr-text-bold-content line-clamp-2 text-[0.7rem] leading-snug group-hover:text-primary"
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
          <div
            v-if="gate.task.note"
            class="mb-1.5 space-y-1 rounded bg-base-200/60 p-1.5 text-[0.65rem] leading-snug text-base-content/60"
          >
            <p class="line-clamp-3 whitespace-pre-line">
              {{ noteSummary(gate).question }}
            </p>
            <p
              v-if="noteSummary(gate).recommendation"
              class="line-clamp-2 whitespace-pre-line font-bold text-base-content/70"
            >
              → {{ noteSummary(gate).recommendation }}
            </p>
          </div>

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
              <span v-if="isUpdating(gate)" class="kr-spinner-xs" />
              <Icon v-else name="kind-icon:send" class="kr-icon-3" />
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  useConductorStore,
  type ConductorHumanGate,
  type ConductorTaskAction,
} from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'

const conductorStore = useConductorStore()
const userStore = useUserStore()

/*
 * The whole panel hangs off this. See the note above: the projection these
 * gates come from is public, so without an explicit check every signed-out
 * visitor saw Silas's decision queue.
 */
const isAdmin = computed(() => userStore.isAdmin)

const gates = computed(() => conductorStore.humanGates)
const isLoading = computed(() => !conductorStore.hasLoaded)

const openKey = ref('')
const sentKey = ref('')
const replies = ref<Record<string, string>>({})

function gateKey(gate: ConductorHumanGate): string {
  return `${gate.project.slug}/${gate.task.id}`
}

/*
 * The note summary. See the file header note for why this exists: a raw
 * `note` can run past 10,000 characters of accumulated cycle history, and
 * `line-clamp-*` alone just shows the oldest few lines of it.
 *
 * Every FOR-SILAS-note this panel is actually meant to surface follows
 * conductor AGENTS.md's template -- `FOR SILAS: <question>` then, later,
 * `TO APPROVE: <recommendation>` -- so the split is a plain substring search,
 * not a summarizer. A note that predates or ignores the template (an older
 * gate, or a hand-written one) has no `FOR SILAS:` marker at all, and this
 * falls back to clipping its own opening text instead of hiding it.
 */
const NOTE_SUMMARY_LIMIT = 220
const FOR_SILAS_MARKER = /FOR SILAS:?/i
const TO_APPROVE_MARKER = /TO APPROVE:?/i

function clipNote(text: string, limit = NOTE_SUMMARY_LIMIT): string {
  const trimmed = text.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`
}

function summarizeGateNote(note: string | null | undefined): {
  question: string
  recommendation: string | null
} {
  // Collapsed to one line first: these notes are YAML block scalars and the
  // markers can land mid-paragraph, so a literal newline inside the question
  // span would otherwise survive into `whitespace-pre-line` as a stray break.
  const flat = (note ?? '').replace(/\s+/g, ' ').trim()
  if (!flat) {
    return {
      question: 'No note recorded for this gate yet.',
      recommendation: null,
    }
  }

  const silasMatch = FOR_SILAS_MARKER.exec(flat)
  if (!silasMatch) {
    return { question: clipNote(flat), recommendation: null }
  }

  const afterSilas = flat.slice(silasMatch.index + silasMatch[0].length)
  const approveMatch = TO_APPROVE_MARKER.exec(afterSilas)
  if (!approveMatch) {
    return { question: clipNote(afterSilas), recommendation: null }
  }

  const question = afterSilas.slice(0, approveMatch.index)
  const recommendation = afterSilas.slice(
    approveMatch.index + approveMatch[0].length,
  )

  return {
    question: clipNote(question) || clipNote(afterSilas),
    recommendation: clipNote(recommendation) || null,
  }
}

function noteSummary(gate: ConductorHumanGate) {
  return summarizeGateNote(gate.task.note)
}

/*
 * The receipts. Section-level state rather than per-row, so a submission
 * survives the row it was submitted from disappearing -- see the file header
 * note for the bug this replaces (the confirmation text used to live inside
 * the very row `answer`/`approve` had just removed from `gates`).
 */
interface GateReceipt {
  id: string
  title: string
  action: ConductorTaskAction
}

const RECEIPT_TTL_MS = 12_000
const MAX_RECEIPTS = 4

const receipts = ref<GateReceipt[]>([])
const receiptTimers = new Map<string, ReturnType<typeof setTimeout>>()

function receiptVerb(action: ConductorTaskAction): string {
  if (action === 'approve') return 'approved and closed'
  if (action === 'reject') return 'sent back for another pass'
  if (action === 'comment') return 'noted, gate left open'
  return 'sent to the next agent'
}

function dismissReceipt(id: string): void {
  const timer = receiptTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    receiptTimers.delete(id)
  }
  receipts.value = receipts.value.filter((receipt) => receipt.id !== id)
}

function pushReceipt(
  gate: ConductorHumanGate,
  action: ConductorTaskAction,
): void {
  const id = `${gateKey(gate)}-${Date.now()}`
  receipts.value = [
    { id, title: gate.task.title, action },
    ...receipts.value,
  ].slice(0, MAX_RECEIPTS)
  receiptTimers.set(
    id,
    setTimeout(() => dismissReceipt(id), RECEIPT_TTL_MS),
  )
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
   * note now visible above the box. The receipt is pushed for the same two
   * actions, precisely because those are the ones whose own confirmation text
   * is about to vanish along with the row.
   */
  if (action !== 'comment') {
    openKey.value = ''
    pushReceipt(gate, action)
  }
}

onMounted(() => {
  /*
   * fetchProjects is cached in the store (FRESH_DATA_MS), so this is a no-op
   * when anything else on the session has already asked.
   */
  void conductorStore.fetchProjects()
})

onBeforeUnmount(() => {
  receiptTimers.forEach((timer) => clearTimeout(timer))
  receiptTimers.clear()
})
</script>
