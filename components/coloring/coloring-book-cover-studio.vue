<template>
  <section
    v-if="book && cover"
    id="coloring-cover-studio"
    class="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
  >
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge badge-accent rounded-2xl">Cover source art</span>
          <span class="text-xs font-black uppercase tracking-widest text-base-content/40">
            {{ book.title }}
          </span>
        </div>
        <h3 class="mt-2 text-2xl font-black">Canonical cover production</h3>
        <p class="mt-1 max-w-3xl text-sm text-base-content/55">
          Generate, revise, adopt, accept, and finalize the portrait source illustration.
          Title typography, spine, back cover, barcode space, bleed, and printer template
          remain explicit packaging work after this stage.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="badge rounded-2xl" :class="statusBadge">
          {{ cover.status }}
        </span>
        <span v-if="cover.semanticScore !== null" class="badge badge-info rounded-2xl">
          Score {{ cover.semanticScore }}
        </span>
        <span v-if="cover.revisionHistory.length" class="badge badge-outline rounded-2xl">
          {{ cover.revisionHistory.length }} archived revision{{ cover.revisionHistory.length === 1 ? '' : 's' }}
        </span>
      </div>
    </header>

    <div class="grid gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <article class="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-200/40 p-4">
        <div class="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100">
          <img
            v-if="displayUrl"
            :src="displayUrl"
            :alt="`${book.title} cover source art`"
            class="aspect-[2/3] size-full object-contain"
          />
          <div
            v-else
            class="flex aspect-[2/3] items-center justify-center text-base-content/30"
          >
            <icon name="kind-icon:book" class="size-20" />
          </div>
          <span
            class="badge absolute left-3 top-3 rounded-2xl"
            :class="displayLabel === 'Final' ? 'badge-success' : displayLabel === 'Accepted' ? 'badge-primary' : 'badge-ghost'"
          >
            {{ displayLabel }}
          </span>
        </div>

        <p class="break-all text-xs text-base-content/45">
          {{ displayPath || cover.imagePath }}
        </p>

        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="rounded-2xl bg-base-100 p-2">
            <p class="font-black">{{ cover.artImageId || '—' }}</p>
            <p class="text-base-content/45">ArtImage</p>
          </div>
          <div class="rounded-2xl bg-base-100 p-2">
            <p class="font-black">{{ cover.renderSeed ?? '—' }}</p>
            <p class="text-base-content/45">Seed</p>
          </div>
          <div class="rounded-2xl bg-base-100 p-2">
            <p class="font-black">{{ cover.renderEngine || '—' }}</p>
            <p class="text-base-content/45">Engine</p>
          </div>
        </div>
      </article>

      <article class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-4">
        <div>
          <h4 class="text-xl font-black">Cover art prompt</h4>
          <p v-if="cover.sourceRef" class="mt-1 break-all text-xs text-base-content/45">
            Historical source: {{ cover.sourceRef }}
          </p>
        </div>

        <textarea
          v-model="promptDraft"
          class="textarea textarea-bordered min-h-72 w-full rounded-2xl text-sm leading-relaxed"
          :readonly="!userStore.isAdmin"
          placeholder="Describe a coherent ensemble front-cover illustration with a quiet title area..."
        />

        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/45">
          <span>{{ promptDraft.length }} characters</span>
          <span v-if="promptDirty" class="badge badge-warning badge-sm rounded-2xl">
            Unsaved changes
          </span>
        </div>

        <button
          v-if="userStore.isAdmin"
          type="button"
          class="btn btn-primary rounded-2xl"
          :disabled="!promptDirty || studio.savingCoverPrompt || promptDraft.trim().length < 40"
          @click="savePrompt"
        >
          <span v-if="studio.savingCoverPrompt" class="loading loading-spinner loading-sm" />
          <icon v-else name="kind-icon:save" class="size-5" />
          Save canonical cover prompt
        </button>

        <div
          v-if="cover.semanticReasons.length"
          class="rounded-2xl border border-warning/40 bg-warning/10 p-3"
        >
          <p class="text-sm font-black text-warning">Latest review notes</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-warning">
            <li v-for="reason in cover.semanticReasons" :key="reason">
              {{ reason }}
            </li>
          </ul>
        </div>

        <template v-if="userStore.isAdmin">
          <div class="divider my-0">Cover action</div>

          <input
            v-model="actionNote"
            type="text"
            class="input input-bordered rounded-2xl"
            placeholder="Optional cover decision or revision note"
          />

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="btn btn-secondary rounded-2xl"
              :disabled="!canGenerate || studio.requestingAction || promptDirty"
              @click="requestCover(false)"
            >
              <span v-if="studio.requestingAction" class="loading loading-spinner loading-sm" />
              <icon v-else name="kind-icon:sparkles" class="size-5" />
              Generate cover candidate
            </button>

            <button
              v-if="canRevise"
              type="button"
              class="btn btn-outline btn-warning rounded-2xl"
              :disabled="studio.requestingAction || promptDirty"
              @click="requestCover(true)"
            >
              <icon name="kind-icon:refresh" class="size-5" />
              Archive and regenerate
            </button>

            <ProductionActionButton
              label="Accept cover source"
              confirm-label="Confirm cover acceptance"
              icon-name="kind-icon:check"
              :enabled="canAccept"
              :armed="armedAction === 'accept-cover'"
              :busy="studio.requestingAction"
              @click="runHumanAction('accept-cover')"
            />

            <ProductionActionButton
              label="Finalize cover source"
              confirm-label="Confirm final cover source"
              icon-name="kind-icon:book"
              :enabled="canFinalize"
              :armed="armedAction === 'finalize-cover'"
              :busy="studio.requestingAction"
              @click="runHumanAction('finalize-cover')"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200/40 p-3">
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text text-xs font-black uppercase tracking-wide">
                  Adopt an existing set-local cover file
                </span>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <input
                  v-model="legacyPath"
                  type="text"
                  class="input input-bordered w-full rounded-2xl"
                  placeholder="approved/my-cover.webp"
                />
                <button
                  type="button"
                  class="btn btn-outline rounded-2xl"
                  :disabled="!validLegacyPath || studio.requestingAction"
                  @click="adoptExisting"
                >
                  <icon name="kind-icon:gallery" class="size-5" />
                  Adopt exact file
                </button>
              </div>
            </label>
            <p class="mt-2 text-xs text-base-content/45">
              The file must already exist inside this book’s Conductor set. Missing ArtJob metadata is preserved as missing, not creatively hallucinated.
            </p>
          </div>

          <p v-if="promptDirty" class="text-xs font-semibold text-warning">
            Save the prompt before requesting a render so the event uses the text shown here.
          </p>
          <p v-if="armedAction" class="text-xs font-semibold text-warning">
            This writes a cover decision to Conductor. Click the highlighted button again to confirm.
          </p>
        </template>
      </article>
    </div>

    <div v-if="cover.revisionHistory.length" class="flex flex-col gap-3">
      <h4 class="font-black">Archived cover revisions</h4>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <a
          v-for="revision in cover.revisionHistory"
          :key="revision.id"
          :href="revision.archivedUrl || undefined"
          :target="revision.archivedUrl ? '_blank' : undefined"
          rel="noopener noreferrer"
          class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/40 p-3"
          :class="revision.archivedUrl ? 'transition hover:border-primary hover:shadow-sm' : ''"
        >
          <img
            v-if="revision.archivedUrl"
            :src="revision.archivedUrl"
            :alt="`${book.title} archived cover revision`"
            class="aspect-[2/3] w-full rounded-xl bg-base-100 object-contain"
          />
          <p class="text-xs font-black">{{ revision.previousStatus || 'Archived revision' }}</p>
          <p class="text-xs text-base-content/45">
            {{ formatDate(revision.requestedAt) }}
          </p>
          <p v-if="revision.semanticScore !== null" class="text-xs text-base-content/55">
            Semantic score {{ revision.semanticScore }}
          </p>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ColoringBookStudioOperation } from '~/types/coloringBookStudio'
import ProductionActionButton from './production-action-button.vue'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'
import { useUserStore } from '@/stores/userStore'

const studio = useColoringBookStudioStore()
const userStore = useUserStore()
const promptDraft = ref('')
const actionNote = ref('')
const legacyPath = ref('')
const armedAction = ref<ColoringBookStudioOperation | null>(null)

const book = computed(() => studio.selectedBook)
const cover = computed(() => studio.selectedCover)
const promptDirty = computed(
  () => Boolean(cover.value && promptDraft.value.trim() !== cover.value.prompt.trim()),
)
const displayUrl = computed(
  () =>
    cover.value?.finalUrl ||
    cover.value?.acceptedUrl ||
    cover.value?.renderedUrl ||
    cover.value?.rejectedUrl ||
    null,
)
const displayPath = computed(
  () =>
    cover.value?.finalPath ||
    cover.value?.acceptedPath ||
    cover.value?.renderedPath ||
    cover.value?.rejectedPath ||
    null,
)
const displayLabel = computed(() => {
  if (cover.value?.finalPath) return 'Final'
  if (cover.value?.acceptedPath) return 'Accepted'
  if (cover.value?.renderedPath) return 'Candidate'
  if (cover.value?.rejectedPath) return 'Needs review'
  return 'No candidate'
})
const statusBadge = computed(() => {
  if (cover.value?.status === 'final') return 'badge-success'
  if (cover.value?.status === 'approved') return 'badge-primary'
  if (cover.value?.status === 'done') return 'badge-secondary'
  if (cover.value?.status === 'needs_review' || cover.value?.status === 'failed') {
    return 'badge-error'
  }
  return 'badge-ghost'
})
const canGenerate = computed(() =>
  ['pending', 'failed', 'missing'].includes(cover.value?.status || 'missing'),
)
const canRevise = computed(() =>
  ['done', 'needs_review', 'failed'].includes(cover.value?.status || ''),
)
const canAccept = computed(() =>
  Boolean(cover.value?.status === 'done' && cover.value.renderedPath && !cover.value.acceptedPath),
)
const canFinalize = computed(() =>
  Boolean(cover.value?.acceptedPath && !cover.value.finalPath),
)
const validLegacyPath = computed(() => {
  const path = legacyPath.value.trim().replace(/\\/g, '/')
  const prefix = book.value
    ? `projects/coloring-book/sets/${book.value.slug}/`
    : ''
  return Boolean(
    path &&
      !path.startsWith('/') &&
      !path.includes(':') &&
      !path.split('/').includes('..') &&
      (!path.startsWith('projects/') || path.startsWith(prefix)) &&
      /\.(?:webp|png|jpe?g)$/i.test(path),
  )
})

watch(
  cover,
  (value) => {
    promptDraft.value = value?.prompt || ''
    actionNote.value = ''
    legacyPath.value = ''
    armedAction.value = null
  },
  { immediate: true },
)

async function savePrompt(): Promise<void> {
  await studio.saveCoverPrompt(promptDraft.value)
}

async function requestCover(force: boolean): Promise<void> {
  armedAction.value = null
  const success = await studio.requestCover(force, actionNote.value)
  if (success) actionNote.value = ''
}

async function runHumanAction(
  operation: 'accept-cover' | 'finalize-cover',
): Promise<void> {
  if (armedAction.value !== operation) {
    armedAction.value = operation
    return
  }
  const success = await studio.requestProductionAction(operation, {
    note: actionNote.value,
  })
  if (success) {
    armedAction.value = null
    actionNote.value = ''
  }
}

async function adoptExisting(): Promise<void> {
  armedAction.value = null
  const success = await studio.acceptCover(actionNote.value, legacyPath.value.trim())
  if (success) {
    actionNote.value = ''
    legacyPath.value = ''
  }
}

function formatDate(value: string | null): string {
  if (!value) return 'Unknown time'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
</script>
