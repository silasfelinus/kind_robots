<template>
  <section class="space-y-4">
    <div class="kr-panel flex flex-wrap items-end gap-3 p-4">
      <label class="kr-form-field min-w-60">
        <span class="kr-text-dim-xs-55 font-bold">Book</span>
        <select
          :value="store.selectedBookSlug"
          class="kr-select-sm"
          @change="store.selectBook(eventValue($event))"
        >
          <option
            v-for="book in store.books"
            :key="book.slug"
            :value="book.slug"
          >
            {{ book.title }} · {{ book.counts.acceptedColor }}/{{
              book.counts.total
            }}
            color accepted
          </option>
        </select>
      </label>

      <label class="kr-form-field min-w-56 flex-1">
        <span class="kr-text-dim-xs-55 font-bold">Find a page</span>
        <input
          v-model="search"
          type="search"
          class="kr-input-sm"
          placeholder="title, prompt, notes..."
        />
      </label>

      <label
        class="kr-text-bold-sm flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2"
      >
        <input
          v-model="hideFinal"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        Hide final pairs
      </label>

      <button
        class="kr-btn"
        type="button"
        :disabled="store.loading"
        @click="refresh"
      >
        <span v-if="store.loading" class="kr-spinner-xs" />
        Refresh
      </button>
    </div>

    <div v-if="notice" class="alert border border-info/25 bg-info/10">
      <span>{{ notice }}</span>
      <button class="kr-btn-ghost-xs-plain" type="button" @click="notice = ''">
        Dismiss
      </button>
    </div>
    <div v-if="error" class="alert border border-error/25 bg-error/10">
      <span>{{ error }}</span>
      <button class="kr-btn-ghost-xs-plain" type="button" @click="error = ''">
        Dismiss
      </button>
    </div>

    <div
      v-if="store.loading && !store.books.length"
      class="grid min-h-64 place-items-center kr-panel"
    >
      <span class="kr-spinner-lg-primary" />
    </div>

    <div
      v-else-if="!visibleProposals.length"
      class="grid min-h-52 place-items-center kr-panel-flat border-dashed bg-base-100/50 p-8 text-center"
    >
      <p class="font-black">No pages match this view.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article
        v-for="proposal in visibleProposals"
        :key="proposal.id"
        class="kr-panel min-w-0 overflow-hidden"
      >
        <div class="relative bg-base-300">
          <div class="grid grid-cols-2 gap-px">
            <figure class="relative min-w-0 bg-base-200">
              <div class="aspect-[17/22] w-full overflow-hidden">
                <a
                  v-if="proposal.colorUrl"
                  :href="proposal.colorUrl"
                  target="_blank"
                  rel="noopener"
                  class="block size-full cursor-zoom-in"
                  :title="`Open ${proposal.title} color full size`"
                >
                  <img
                    :src="proposal.colorUrl"
                    :alt="`${proposal.title} color candidate`"
                    class="size-full object-contain"
                    loading="lazy"
                  />
                </a>
                <div
                  v-else
                  class="grid size-full place-items-center text-base-content/30"
                >
                  <div class="text-center">
                    <Icon name="kind-icon:image" class="kr-icon-10 mx-auto" />
                    <p class="kr-text-bold-xs mt-2">No color candidate</p>
                  </div>
                </div>
              </div>
              <figcaption
                class="absolute bottom-3 left-3 badge border-0 bg-base-100/90 font-black shadow-sm backdrop-blur"
              >
                Color
              </figcaption>
            </figure>

            <figure class="relative min-w-0 bg-base-200">
              <div class="aspect-[17/22] w-full overflow-hidden">
                <a
                  v-if="bwDisplayUrl(proposal)"
                  :href="bwDisplayUrl(proposal) || ''"
                  target="_blank"
                  rel="noopener"
                  class="block size-full cursor-zoom-in"
                  :title="`Open ${proposal.title} B&W full size`"
                >
                  <img
                    :src="bwDisplayUrl(proposal) || ''"
                    :alt="`${proposal.title} black and white candidate`"
                    class="size-full object-contain grayscale"
                    loading="lazy"
                  />
                </a>
                <div
                  v-else
                  class="grid size-full place-items-center text-base-content/30"
                >
                  <div class="text-center">
                    <Icon name="kind-icon:image" class="kr-icon-10 mx-auto" />
                    <p class="kr-text-bold-xs mt-2">No B&amp;W candidate</p>
                  </div>
                </div>
              </div>
              <figcaption
                class="absolute bottom-3 left-3 badge border-0 bg-base-100/90 font-black shadow-sm backdrop-blur"
              >
                B&amp;W
              </figcaption>
            </figure>
          </div>

          <div
            class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3"
          >
            <span
              class="badge border-0 bg-base-100/90 font-black shadow-sm backdrop-blur"
            >
              {{ proposal.id }}
            </span>
            <span
              class="badge border-0 shadow-sm"
              :class="stageBadge(proposal)"
            >
              {{ stageLabel(proposal) }}
            </span>
          </div>
        </div>

        <div class="space-y-4 p-4">
          <div>
            <p class="kr-text-eyebrow text-[11px] tracking-wider text-primary">
              Slot {{ proposal.slot }}
            </p>
            <h2 class="kr-text-black-xl mt-1 leading-tight">
              {{ proposal.title }}
            </h2>
            <p
              v-if="proposal.concept?.sourceLineage"
              class="mt-2 text-sm leading-5"
            >
              <span class="font-black text-secondary">Riffing on:</span>
              {{ proposal.concept.sourceLineage }}
            </p>
            <p
              v-if="proposal.concept?.recast"
              class="mt-1 text-sm leading-5 text-base-content/80"
            >
              <span class="font-black">Recast:</span>
              {{ proposal.concept.recast }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="fact in pageFacts(proposal)"
                :key="`${proposal.id}:${fact}`"
                class="badge badge-ghost badge-sm"
              >
                {{ fact }}
              </span>
            </div>
          </div>

          <details
            v-if="conceptBrief(proposal).length || proposal.notes.length"
            class="group rounded-xl border border-base-300 bg-base-200/40"
          >
            <summary
              class="kr-text-black-xs flex cursor-pointer list-none items-center justify-between gap-2 p-3 marker:hidden"
            >
              Concept brief &amp; production notes
              <Icon
                name="kind-icon:chevron-down"
                class="kr-icon-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <dl
              class="space-y-2 border-t border-base-300 p-3 text-sm leading-5"
            >
              <div
                v-for="entry in conceptBrief(proposal)"
                :key="`${proposal.id}:${entry.label}`"
              >
                <dt class="kr-text-dim-xs-55 font-bold">{{ entry.label }}</dt>
                <dd>{{ entry.value }}</dd>
              </div>
              <div v-if="proposal.notes.length">
                <dt class="kr-text-dim-xs-55 font-bold">Production notes</dt>
                <dd>
                  <ul class="list-disc space-y-1 pl-5">
                    <li
                      v-for="(note, index) in proposal.notes"
                      :key="`${proposal.id}:note:${index}`"
                    >
                      {{ note }}
                    </li>
                  </ul>
                </dd>
              </div>
            </dl>
          </details>

          <div
            v-if="proposal.inspirations.length"
            class="flex gap-2 overflow-x-auto pb-1"
          >
            <figure
              v-for="asset in proposal.inspirations"
              :key="`${proposal.id}:${asset.path}`"
              class="w-16 shrink-0"
            >
              <img
                v-if="asset.url"
                :src="asset.url"
                :alt="asset.kind"
                class="aspect-square w-full rounded-lg object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="grid aspect-square w-full place-items-center rounded-lg bg-base-200 text-[10px] text-base-content/35"
              >
                reference
              </div>
            </figure>
          </div>

          <div
            v-if="userStore.isAdmin"
            class="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3"
          >
            <label class="kr-form-field flex flex-col">
              <span class="kr-text-black-xs">Request a change</span>
              <span class="kr-text-dim-xs-55">
                Say what should be different in plain words. It is added to the
                prompt and a new color render is queued.
              </span>
              <textarea
                v-model="changeRequests[proposal.id]"
                class="textarea textarea-bordered min-h-20 w-full resize-y rounded-xl text-sm leading-5"
                maxlength="500"
                placeholder="e.g. make the figure smaller, with forward limbs enlarged by perspective"
              />
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                class="kr-btn-primary"
                type="button"
                :disabled="
                  !changeRequest(proposal.id) ||
                  store.savingPrompt ||
                  store.requestingAction
                "
                @click="applyChange(proposal.id, true)"
              >
                Apply &amp; re-render color
              </button>
              <button
                class="kr-btn"
                type="button"
                :disabled="!changeRequest(proposal.id)"
                @click="applyChange(proposal.id, false)"
              >
                Add to prompt only
              </button>
            </div>
          </div>

          <label class="kr-form-field flex flex-col">
            <span class="kr-text-black-xs">
              Pitch / art prompt
              <span
                v-if="userStore.isAdmin && promptChanged(proposal)"
                class="badge badge-warning badge-sm ml-1 align-middle"
              >
                unsaved
              </span>
            </span>
            <textarea
              v-model="drafts[proposal.id]"
              class="textarea textarea-bordered min-h-40 w-full resize-y rounded-xl text-sm leading-5"
              :readonly="!userStore.isAdmin"
            />
          </label>

          <div v-if="userStore.isAdmin" class="flex flex-wrap gap-2">
            <button
              class="kr-btn-primary"
              type="button"
              :disabled="store.savingPrompt || !promptChanged(proposal)"
              @click="savePrompt(proposal.id)"
            >
              Save prompt
            </button>
            <button
              v-if="promptChanged(proposal)"
              class="kr-btn-ghost-xs-plain"
              type="button"
              @click="drafts[proposal.id] = proposal.prompt"
            >
              Undo edits
            </button>
            <button
              class="kr-btn"
              type="button"
              :disabled="store.requestingAction"
              @click="render(proposal.id, 'color')"
            >
              New color
            </button>
            <button
              v-if="proposal.accepted.color"
              class="kr-btn"
              type="button"
              :disabled="store.requestingAction"
              @click="render(proposal.id, 'bw')"
            >
              New B&amp;W
            </button>
            <button
              v-if="colorCandidatePath(proposal)"
              class="btn btn-success btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="
                acceptColor(proposal.id, colorCandidatePath(proposal) || '')
              "
            >
              Accept color
            </button>
            <button
              v-if="bwCandidatePath(proposal)"
              class="btn btn-success btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="acceptBw(proposal.id, bwCandidatePath(proposal) || '')"
            >
              Accept B&amp;W
            </button>
            <button
              v-if="
                proposal.accepted.color &&
                proposal.accepted.bw &&
                !(proposal.final.color && proposal.final.bw)
              "
              class="btn btn-success btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="finalize(proposal.id)"
            >
              Finalize pair
            </button>
          </div>

          <div v-else class="kr-text-dim-xs-45 flex items-center gap-2">
            <Icon name="kind-icon:lock" class="kr-icon-4" />
            Production edits are admin-only.
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
} from '~/types/coloringBookStudio'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'
import { useUserStore } from '@/stores/userStore'

const store = useColoringBookStudioStore()
const userStore = useUserStore()
const search = ref('')
const hideFinal = ref(false)
const notice = ref('')
const error = ref('')
const drafts = reactive<Record<string, string>>({})
const changeRequests = reactive<Record<string, string>>({})

const visibleProposals = computed<ColoringBookProposal[]>(() => {
  const query = search.value.trim().toLowerCase()
  return (store.selectedBook?.proposals || []).filter((proposal) => {
    if (hideFinal.value && proposal.final.color && proposal.final.bw)
      return false
    if (!query) return true
    return [proposal.title, proposal.id, proposal.prompt, ...proposal.notes]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

onMounted(async () => {
  await userStore.initialize()
  await refresh()
})

async function refresh(): Promise<void> {
  error.value = ''
  await store.fetchStudio()
  syncDrafts()
  if (store.error) error.value = store.error
}

function syncDrafts(): void {
  for (const book of store.books) {
    for (const proposal of book.proposals) {
      drafts[proposal.id] = proposal.prompt
    }
  }
}

function eventValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function productionState(
  proposalId: string,
): ColoringBookProductionState | null {
  return (
    store.productionStates[`${store.selectedBookSlug}:${proposalId}`] ?? null
  )
}

function bwDisplayUrl(proposal: ColoringBookProposal): string | null {
  return productionState(proposal.id)?.bwUrl || proposal.bwUrl
}

function colorCandidatePath(proposal: ColoringBookProposal): string | null {
  if (proposal.accepted.color || proposal.final.color) return null
  return proposal.queue.renderedPath
}

function bwCandidatePath(proposal: ColoringBookProposal): string | null {
  if (proposal.accepted.bw || proposal.final.bw) return null
  return productionState(proposal.id)?.bwRenderedPath ?? null
}

function conceptBrief(
  proposal: ColoringBookProposal,
): { label: string; value: string }[] {
  const concept = proposal.concept
  if (!concept) return []
  const entries: [string, string | null][] = [
    ['Framing', concept.framing],
    ['Visual hook', concept.visualHook],
    ['Body direction', concept.bodyDirection],
    ['Horror engine', concept.horrorEngine],
    ['Camp engine', concept.campEngine],
    ['Sensuality', concept.sensuality],
    ['Making it original', concept.originalizationHook],
  ]
  return entries
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => ({ label, value }))
}

function pageFacts(proposal: ColoringBookProposal): string[] {
  const facts: string[] = []
  const queue = proposal.queue
  if (queue.status) facts.push(`queue: ${queue.status}`)
  if (queue.revisionCount) facts.push(`${queue.revisionCount} revisions`)
  if (queue.semanticScore !== null && queue.semanticScore !== undefined) {
    facts.push(`semantic ${queue.semanticScore}`)
  }
  if (queue.renderEngine) facts.push(queue.renderEngine)
  if (queue.completedAt)
    facts.push(`rendered ${queue.completedAt.slice(0, 10)}`)
  if (proposal.inspirations.length) {
    facts.push(`${proposal.inspirations.length} references`)
  }
  return facts
}

function changeRequest(proposalId: string): string {
  return (changeRequests[proposalId] || '').replace(/\s+/g, ' ').trim()
}

function promptWithChange(base: string, change: string): string {
  return `${base.trim()}\n\nRevision request: ${change}`
}

async function applyChange(
  proposalId: string,
  rerender: boolean,
): Promise<void> {
  const change = changeRequest(proposalId)
  if (!change) return
  const nextPrompt = promptWithChange(drafts[proposalId] || '', change)
  if (!rerender) {
    drafts[proposalId] = nextPrompt
    changeRequests[proposalId] = ''
    return
  }
  select(proposalId)
  error.value = ''
  if (!(await store.savePrompt(nextPrompt))) {
    if (store.error) error.value = store.error
    return
  }
  changeRequests[proposalId] = ''
  syncDrafts()
  const queued = await store.requestColorRender(
    true,
    `Change requested from Coloring Book curation: ${change}`,
  )
  if (queued) {
    notice.value =
      store.message ||
      'Change saved to the prompt and a new color render queued.'
  } else if (store.error) {
    error.value = `Prompt saved, but the render was not queued: ${store.error}`
  }
}

function promptChanged(proposal: ColoringBookProposal): boolean {
  return (drafts[proposal.id] || '').trim() !== proposal.prompt.trim()
}

function stageLabel(proposal: ColoringBookProposal): string {
  if (proposal.final.color && proposal.final.bw) return 'Final pair'
  if (proposal.accepted.color && proposal.accepted.bw)
    return 'Ready to finalize'
  if (bwCandidatePath(proposal)) return 'Accept B&W'
  if (proposal.accepted.color) return 'Build B&W'
  if (colorCandidatePath(proposal)) return 'Accept color'
  if (
    proposal.queue.status === 'pending' ||
    proposal.queue.status === 'running'
  ) {
    return 'Rendering color'
  }
  if (
    proposal.queue.status === 'needs_review' ||
    proposal.queue.semanticGateError
  ) {
    return 'Needs review'
  }
  return 'Needs color'
}

function stageBadge(proposal: ColoringBookProposal): string {
  if (proposal.final.color && proposal.final.bw) return 'badge-success'
  if (proposal.accepted.color && proposal.accepted.bw) return 'badge-success'
  if (
    proposal.queue.status === 'needs_review' ||
    proposal.queue.semanticGateError
  ) {
    return 'badge-warning'
  }
  if (
    proposal.queue.status === 'pending' ||
    proposal.queue.status === 'running'
  ) {
    return 'badge-info'
  }
  return 'badge-neutral'
}

function select(proposalId: string): void {
  store.selectProposal(proposalId)
}

async function savePrompt(proposalId: string): Promise<void> {
  select(proposalId)
  const ok = await store.savePrompt(drafts[proposalId] || '')
  if (ok) {
    notice.value = store.message || 'Prompt saved.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function render(
  proposalId: string,
  variant: 'color' | 'bw',
): Promise<void> {
  select(proposalId)
  const ok =
    variant === 'color'
      ? await store.requestColorRender(
          true,
          'Requested from Coloring Book curation',
        )
      : await store.requestBw(true, 'Requested from Coloring Book curation')
  if (ok) {
    notice.value = store.message || `${variant} render requested.`
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function acceptColor(
  proposalId: string,
  sourcePath: string,
): Promise<void> {
  select(proposalId)
  if (
    await store.acceptColor('Accepted from Coloring Book curation', sourcePath)
  ) {
    notice.value = store.message || 'Color candidate accepted.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function acceptBw(proposalId: string, sourcePath: string): Promise<void> {
  select(proposalId)
  if (
    await store.acceptBw('Accepted from Coloring Book curation', sourcePath)
  ) {
    notice.value = store.message || 'B&W candidate accepted.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function finalize(proposalId: string): Promise<void> {
  select(proposalId)
  if (await store.finalizePair('Finalized from Coloring Book curation')) {
    notice.value = store.message || 'Pair finalized.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}
</script>
