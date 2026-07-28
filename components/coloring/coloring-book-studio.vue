<template>
  <section class="flex flex-col gap-5">
    <header
      class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <div class="flex items-center gap-2">
          <icon name="kind-icon:book" class="size-6 text-primary" />
          <h3 class="text-2xl font-black">Coloring Book Production Studio</h3>
        </div>
        <p class="mt-1 max-w-3xl text-sm text-base-content/60">
          Three canonical books, 108 proposal slots, real Conductor prompts,
          paired art, queue state, and targeted revision requests.
        </p>
      </div>

      <button
        type="button"
        class="btn btn-outline rounded-2xl"
        :disabled="studio.loading"
        @click="studio.fetchStudio()"
      >
        <span v-if="studio.loading" class="loading loading-spinner loading-sm" />
        <icon v-else name="kind-icon:refresh" class="size-5" />
        Refresh Conductor
      </button>
    </header>

    <div v-if="studio.error" class="alert alert-error rounded-2xl" role="alert">
      <icon name="kind-icon:alert" class="size-5" />
      <span>{{ studio.error }}</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="studio.clearNotice()"
      >
        Dismiss
      </button>
    </div>

    <div
      v-if="studio.message"
      class="alert alert-success rounded-2xl"
      role="status"
    >
      <icon name="kind-icon:check" class="size-5" />
      <span>{{ studio.message }}</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="studio.clearNotice()"
      >
        Dismiss
      </button>
    </div>

    <div
      v-if="studio.loading && !studio.books.length"
      class="flex min-h-80 items-center justify-center rounded-3xl border border-base-300 bg-base-100"
    >
      <span class="loading loading-dots loading-lg" />
    </div>

    <template v-else>
      <div class="grid gap-3 lg:grid-cols-3">
        <button
          v-for="book in studio.books"
          :key="book.slug"
          type="button"
          class="rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          :class="
            studio.selectedBookSlug === book.slug
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-base-300 bg-base-100'
          "
          @click="studio.selectBook(book.slug)"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p
                class="text-xs font-black uppercase tracking-widest text-base-content/40"
              >
                Book {{ book.order }}
              </p>
              <h4 class="text-xl font-black">{{ book.title }}</h4>
            </div>
            <span class="badge badge-outline rounded-2xl">{{ book.status }}</span>
          </div>

          <progress
            class="progress progress-primary my-3 w-full"
            :value="book.counts.finalPairs"
            :max="book.targetProposals"
          />

          <div class="grid grid-cols-4 gap-2 text-center text-xs">
            <div class="rounded-2xl bg-base-200 p-2">
              <strong class="block text-base">{{ book.counts.prompts }}</strong>
              Prompts
            </div>
            <div class="rounded-2xl bg-base-200 p-2">
              <strong class="block text-base">{{ book.counts.rendered }}</strong>
              Rendered
            </div>
            <div class="rounded-2xl bg-base-200 p-2">
              <strong class="block text-base">{{ book.counts.acceptedPairs }}</strong>
              Pairs
            </div>
            <div class="rounded-2xl bg-base-200 p-2">
              <strong class="block text-base">{{ book.counts.finalPairs }}</strong>
              Final
            </div>
          </div>
        </button>
      </div>

      <div
        role="tablist"
        class="tabs tabs-boxed flex-wrap rounded-2xl bg-base-200 p-1"
      >
        <button
          v-for="mode in modes"
          :key="mode.key"
          type="button"
          role="tab"
          class="tab gap-2 rounded-xl"
          :class="activeMode === mode.key ? 'tab-active' : ''"
          @click="activeMode = mode.key"
        >
          <icon :name="mode.icon" class="size-4" />
          {{ mode.label }}
        </button>
      </div>

      <div v-if="activeMode === 'books'" class="grid gap-4 lg:grid-cols-3">
        <article
          v-for="book in studio.books"
          :key="book.slug"
          class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p
                class="text-xs font-black uppercase tracking-widest text-base-content/40"
              >
                {{ book.slug }}
              </p>
              <h4 class="text-2xl font-black">{{ book.title }}</h4>
            </div>
            <span class="badge badge-primary rounded-2xl">
              {{ book.counts.total }}/{{ book.targetProposals }}
            </span>
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-2xl bg-base-200 p-3">
              <dt class="text-base-content/50">Pending color</dt>
              <dd class="text-lg font-black">{{ book.counts.pending }}</dd>
            </div>
            <div class="rounded-2xl bg-base-200 p-3">
              <dt class="text-base-content/50">Needs attention</dt>
              <dd class="text-lg font-black">
                {{ book.counts.needsReview + book.counts.blocked }}
              </dd>
            </div>
            <div class="rounded-2xl bg-base-200 p-3">
              <dt class="text-base-content/50">Accepted color</dt>
              <dd class="text-lg font-black">{{ book.counts.acceptedColor }}</dd>
            </div>
            <div class="rounded-2xl bg-base-200 p-3">
              <dt class="text-base-content/50">Final pairs</dt>
              <dd class="text-lg font-black">{{ book.counts.finalPairs }}</dd>
            </div>
          </dl>

          <button
            type="button"
            class="btn btn-primary mt-auto rounded-2xl"
            @click="openBook(book.slug)"
          >
            <icon name="kind-icon:gallery" class="size-5" />
            Open page ledger
          </button>
        </article>
      </div>

      <div v-if="activeMode === 'pages'" class="flex flex-col gap-4">
        <div
          class="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h4 class="text-xl font-black">{{ studio.selectedBook?.title }}</h4>
            <p class="text-sm text-base-content/50">
              Side-by-side production candidates for every proposal slot.
            </p>
          </div>

          <select
            v-model="pageFilter"
            class="select select-bordered rounded-2xl"
            aria-label="Filter coloring-book proposals"
          >
            <option value="all">All proposals</option>
            <option value="pending">Pending color</option>
            <option value="rendered">Rendered candidates</option>
            <option value="review">Needs review</option>
            <option value="paired">Accepted or final pairs</option>
          </select>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="proposal in filteredProposals"
            :key="proposal.id"
            type="button"
            class="overflow-hidden rounded-3xl border bg-base-100 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            :class="
              studio.selectedProposalId === proposal.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-base-300'
            "
            @click="openProposal(proposal.id)"
          >
            <div class="grid aspect-[4/3] grid-cols-2 bg-base-200">
              <div class="relative overflow-hidden border-r border-base-300">
                <img
                  v-if="proposal.colorUrl"
                  :src="proposal.colorUrl"
                  :alt="`${proposal.title} color candidate`"
                  class="size-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex size-full items-center justify-center text-base-content/30"
                >
                  <icon name="kind-icon:palette" class="size-10" />
                </div>
                <span
                  class="badge badge-sm absolute bottom-2 left-2 rounded-2xl"
                >
                  Color
                </span>
              </div>

              <div class="relative overflow-hidden">
                <img
                  v-if="proposal.bwUrl"
                  :src="proposal.bwUrl"
                  :alt="`${proposal.title} black-and-white page`"
                  class="size-full object-cover grayscale"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex size-full items-center justify-center text-base-content/30"
                >
                  <icon name="kind-icon:pencil" class="size-10" />
                </div>
                <span
                  class="badge badge-sm absolute bottom-2 left-2 rounded-2xl"
                >
                  B&amp;W
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-2 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p
                    class="text-xs font-black uppercase tracking-widest text-base-content/40"
                  >
                    Slot {{ proposal.slot }} · {{ proposal.id }}
                  </p>
                  <h5 class="font-black">{{ proposal.title }}</h5>
                </div>
                <span
                  class="badge badge-sm rounded-2xl"
                  :class="statusBadge(proposal.queue.status)"
                >
                  {{ proposal.queue.status }}
                </span>
              </div>
              <p
                class="line-clamp-2 text-xs leading-relaxed text-base-content/55"
              >
                {{ proposal.prompt || 'No production prompt yet.' }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div
        v-if="activeMode === 'editor' && studio.selectedProposal"
        class="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]"
      >
        <article
          class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5"
        >
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-widest text-base-content/40"
              >
                {{ studio.selectedBook?.title }} · Slot
                {{ studio.selectedProposal.slot }} ·
                {{ studio.selectedProposal.id }}
              </p>
              <h4 class="text-2xl font-black">
                {{ studio.selectedProposal.title }}
              </h4>
            </div>
            <span
              class="badge rounded-2xl"
              :class="statusBadge(studio.selectedProposal.queue.status)"
            >
              {{ studio.selectedProposal.queue.status }}
            </span>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <figure
              class="overflow-hidden rounded-3xl border border-base-300 bg-base-200"
            >
              <div class="aspect-[2/3]">
                <img
                  v-if="studio.selectedProposal.colorUrl"
                  :src="studio.selectedProposal.colorUrl"
                  :alt="`${studio.selectedProposal.title} current color version`"
                  class="size-full object-contain"
                />
                <div
                  v-else
                  class="flex size-full flex-col items-center justify-center gap-2 text-base-content/35"
                >
                  <icon name="kind-icon:palette" class="size-14" />
                  <span>No color candidate</span>
                </div>
              </div>
              <figcaption
                class="border-t border-base-300 p-3 text-center font-black"
              >
                Current color master
              </figcaption>
            </figure>

            <figure
              class="overflow-hidden rounded-3xl border border-base-300 bg-base-200"
            >
              <div class="aspect-[2/3]">
                <img
                  v-if="studio.selectedProposal.bwUrl"
                  :src="studio.selectedProposal.bwUrl"
                  :alt="`${studio.selectedProposal.title} current black-and-white version`"
                  class="size-full object-contain grayscale"
                />
                <div
                  v-else
                  class="flex size-full flex-col items-center justify-center gap-2 text-base-content/35"
                >
                  <icon name="kind-icon:pencil" class="size-14" />
                  <span>No line-art pair</span>
                </div>
              </div>
              <figcaption
                class="border-t border-base-300 p-3 text-center font-black"
              >
                Current black &amp; white
              </figcaption>
            </figure>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-base-200 p-3 text-sm">
              <span class="block text-xs text-base-content/45">Semantic score</span>
              <strong>
                {{ studio.selectedProposal.queue.semanticScore ?? '—' }}
              </strong>
            </div>
            <div class="rounded-2xl bg-base-200 p-3 text-sm">
              <span class="block text-xs text-base-content/45">Render engine</span>
              <strong>
                {{ studio.selectedProposal.queue.renderEngine ?? '—' }}
              </strong>
            </div>
            <div class="rounded-2xl bg-base-200 p-3 text-sm">
              <span class="block text-xs text-base-content/45">
                Archived revisions
              </span>
              <strong>{{ studio.selectedProposal.queue.revisionCount }}</strong>
            </div>
          </div>
        </article>

        <aside
          class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5"
        >
          <div>
            <h4 class="text-xl font-black">Canonical production prompt</h4>
            <p class="mt-1 break-all text-xs text-base-content/45">
              {{ studio.selectedProposal.promptSourcePath }}
            </p>
            <p
              v-if="studio.selectedProposal.promptRef"
              class="mt-1 break-all text-xs text-info"
            >
              Queue reference: {{ studio.selectedProposal.promptRef }}
            </p>
          </div>

          <textarea
            v-model="promptDraft"
            class="textarea textarea-bordered min-h-64 w-full rounded-2xl text-sm leading-relaxed"
            :readonly="!userStore.isAdmin"
            :placeholder="`Describe ${studio.selectedProposal.title} as a production-ready color master...`"
          />

          <div
            class="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/45"
          >
            <span>{{ promptDraft.length }} characters</span>
            <span
              v-if="promptDirty"
              class="badge badge-warning badge-sm rounded-2xl"
            >
              Unsaved changes
            </span>
          </div>

          <button
            v-if="userStore.isAdmin"
            type="button"
            class="btn btn-primary rounded-2xl"
            :disabled="
              !promptDirty ||
              studio.savingPrompt ||
              promptDraft.trim().length < 20
            "
            @click="savePrompt"
          >
            <span
              v-if="studio.savingPrompt"
              class="loading loading-spinner loading-sm"
            />
            <icon v-else name="kind-icon:save" class="size-5" />
            Save canonical prompt
          </button>

          <div class="divider my-0">Render request</div>

          <input
            v-model="requestNote"
            type="text"
            class="input input-bordered rounded-2xl"
            placeholder="Optional revision direction"
            :readonly="!userStore.isAdmin"
          />

          <button
            v-if="userStore.isAdmin"
            type="button"
            class="btn rounded-2xl"
            :class="requestNeedsForce ? 'btn-secondary' : 'btn-accent'"
            :disabled="studio.requestingRender || promptDirty"
            @click="requestRender"
          >
            <span
              v-if="studio.requestingRender"
              class="loading loading-spinner loading-sm"
            />
            <icon v-else name="kind-icon:sparkles" class="size-5" />
            {{
              requestNeedsForce
                ? 'Archive current and request revision'
                : 'Request this color candidate'
            }}
          </button>

          <div
            v-if="!userStore.isAdmin"
            class="alert rounded-2xl bg-base-200 text-sm"
          >
            <icon name="kind-icon:lock" class="size-5" />
            <span>Production edits and render requests are admin-only.</span>
          </div>

          <div
            class="rounded-2xl border border-info/30 bg-info/10 p-3 text-xs leading-relaxed"
          >
            Black-and-white generation remains color-first. Existing pairs are
            visible now; targeted B&amp;W conversion follows after a color
            composition is accepted.
          </div>
        </aside>
      </div>

      <div v-if="activeMode === 'queue'" class="flex flex-col gap-4">
        <div
          class="flex flex-col gap-2 rounded-3xl border border-base-300 bg-base-100 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h4 class="text-xl font-black">Queue &amp; review problems</h4>
            <p class="text-sm text-base-content/50">
              Semantic gate failures and proposals that exhausted automatic retries.
            </p>
          </div>
          <span class="badge badge-warning rounded-2xl">
            {{ studio.queueProblems.length }} need attention
          </span>
        </div>

        <div
          v-if="!studio.queueProblems.length"
          class="rounded-3xl border border-success/30 bg-success/10 p-8 text-center"
        >
          <icon name="kind-icon:check" class="mx-auto size-10 text-success" />
          <p class="mt-2 font-black">No queue problems currently reported.</p>
        </div>

        <button
          v-for="problem in studio.queueProblems"
          :key="`${problem.bookSlug}:${problem.proposal.id}`"
          type="button"
          class="flex flex-col gap-3 rounded-3xl border border-warning/40 bg-warning/10 p-4 text-left sm:flex-row sm:items-start sm:justify-between"
          @click="openProblem(problem.bookSlug, problem.proposal.id)"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-widest text-base-content/45"
            >
              {{ problem.bookTitle }} · {{ problem.proposal.id }}
            </p>
            <h5 class="font-black">{{ problem.proposal.title }}</h5>
            <p class="mt-1 max-w-4xl text-sm text-base-content/65">
              {{
                problem.proposal.queue.semanticGateError ||
                'Automatic attempts exhausted; human review required.'
              }}
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <span
              class="badge rounded-2xl"
              :class="statusBadge(problem.proposal.queue.status)"
            >
              {{ problem.proposal.queue.status }}
            </span>
            <span class="badge badge-outline rounded-2xl">
              {{ problem.proposal.queue.semanticAttempts }} attempts
            </span>
          </div>
        </button>
      </div>

      <div
        v-if="activeMode === 'color'"
        class="rounded-3xl border border-base-300 bg-base-100 p-4"
      >
        <div class="mb-4">
          <h4 class="text-xl font-black">End-user coloring preview</h4>
          <p class="text-sm text-base-content/50">
            The existing coloring engine lives here without pretending to be the
            production manager.
          </p>
        </div>
        <coloring-book-manager />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'
import { useUserStore } from '@/stores/userStore'

type StudioMode = 'books' | 'pages' | 'editor' | 'queue' | 'color'
type PageFilter = 'all' | 'pending' | 'rendered' | 'review' | 'paired'

const studio = useColoringBookStudioStore()
const userStore = useUserStore()
const activeMode = ref<StudioMode>('books')
const pageFilter = ref<PageFilter>('all')
const promptDraft = ref('')
const requestNote = ref('')

const modes: { key: StudioMode; label: string; icon: string }[] = [
  { key: 'books', label: 'Books', icon: 'kind-icon:book' },
  { key: 'pages', label: 'Pages', icon: 'kind-icon:gallery' },
  { key: 'editor', label: 'Prompt & Render', icon: 'kind-icon:prompt' },
  { key: 'queue', label: 'Queue', icon: 'kind-icon:activity' },
  { key: 'color', label: 'Color Preview', icon: 'kind-icon:paintbrush' },
]

const filteredProposals = computed(() => {
  const proposals = studio.selectedBook?.proposals ?? []
  if (pageFilter.value === 'pending') {
    return proposals.filter((proposal) => proposal.queue.status === 'pending')
  }
  if (pageFilter.value === 'rendered') {
    return proposals.filter((proposal) => Boolean(proposal.colorUrl))
  }
  if (pageFilter.value === 'review') {
    return proposals.filter(
      (proposal) =>
        proposal.queue.status === 'needs_review' ||
        Boolean(proposal.queue.semanticGateError),
    )
  }
  if (pageFilter.value === 'paired') {
    return proposals.filter(
      (proposal) =>
        Boolean(proposal.accepted.color && proposal.accepted.bw) ||
        Boolean(proposal.final.color && proposal.final.bw),
    )
  }
  return proposals
})

const promptDirty = computed(
  () =>
    promptDraft.value.trim() !== (studio.selectedProposal?.prompt ?? '').trim(),
)

const requestNeedsForce = computed(() => {
  const proposal = studio.selectedProposal
  return Boolean(
    proposal && (proposal.queue.status !== 'pending' || proposal.colorUrl),
  )
})

watch(
  () => [studio.selectedProposal?.id, studio.selectedProposal?.prompt] as const,
  () => {
    promptDraft.value = studio.selectedProposal?.prompt ?? ''
    requestNote.value = ''
  },
  { immediate: true },
)

onMounted(async () => {
  if (!studio.books.length) await studio.fetchStudio()
})

function statusBadge(status: string): string {
  if (status === 'done' || status === 'approved') return 'badge-success'
  if (status === 'pending' || status === 'running') return 'badge-info'
  if (status === 'needs_review') return 'badge-warning'
  if (status === 'failed' || status === 'cancelled') return 'badge-error'
  return 'badge-ghost'
}

function openBook(bookSlug: string): void {
  studio.selectBook(bookSlug)
  activeMode.value = 'pages'
}

function openProposal(proposalId: string): void {
  studio.selectProposal(proposalId)
  activeMode.value = 'editor'
}

function openProblem(bookSlug: string, proposalId: string): void {
  studio.selectBook(bookSlug)
  studio.selectProposal(proposalId)
  activeMode.value = 'editor'
}

async function savePrompt(): Promise<void> {
  await studio.savePrompt(promptDraft.value)
}

async function requestRender(): Promise<void> {
  await studio.requestColorRender(requestNeedsForce.value, requestNote.value)
}
</script>
