<!-- /components/tzaddik/tzaddik-detail-sheet.vue -->
<!--
  Person detail view (tzaddik-gallery/t-005). Opened from pages/tzaddik-gallery.vue
  when a Living/Memorial gallery card is clicked. Shows the sourced record in
  full: image, biography/rationale, provenance, curation status, submitter
  attribution, the objections section, reactions, and a Request recheck control.

  A modal rather than its own route, matching how this gallery already presents
  itself (one page, tabs) and how home-object-sheet.vue reads other showcase
  kinds -- but built fresh rather than reused, because a TzaddikCandidate's
  fields (provenance, curationState, objections, recheck state) have no analog
  in ShowcaseDetail.
-->
<template>
  <Teleport to="body">
    <dialog
      class="modal modal-open"
      aria-modal="true"
      @cancel.prevent="emit('close')"
      @click.self="emit('close')"
    >
      <div
        class="modal-box flex max-h-[88dvh] w-[min(94vw,52rem)] max-w-none flex-col overflow-hidden rounded-3xl border-2 border-primary/60 bg-base-100 p-0 shadow-2xl"
      >
        <header
          class="flex shrink-0 items-start gap-3 kr-panel-header-sm sm:p-4"
        >
          <div class="min-w-0 flex-1">
            <p
              class="kr-text-eyebrow text-[0.6rem] tracking-[0.18em] text-primary"
            >
              Tzaddik Gallery
            </p>
            <h2 class="kr-text-black-lg truncate sm:text-xl">
              {{ displayName || 'Loading…' }}
            </h2>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm shrink-0 rounded-xl"
            aria-label="Close"
            @click="emit('close')"
          >
            <Icon name="kind-icon:x" class="kr-icon-4" />
          </button>
        </header>

        <div class="kr-scroll p-3 sm:p-4">
          <div v-if="pending" class="flex min-h-40 items-center justify-center">
            <span class="kr-loading-primary-md" />
            <span class="sr-only">Loading…</span>
          </div>

          <div v-else-if="errorMessage" class="kr-note kr-note-warning">
            {{ errorMessage }}
          </div>

          <div
            v-else-if="candidate"
            class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]"
          >
            <div class="overflow-hidden rounded-2xl border border-base-300">
              <kr-art-plate
                :source="{ imagePath: imageSrc }"
                variant="hero"
                shape="card"
                frame="none"
                :alt="displayName"
                :fallback="fallbackArt"
                fit="contain"
                eager
              />
            </div>

            <div class="flex min-w-0 flex-col gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="kr-badge-ghost-sm" :class="statusBadgeClass">
                  {{ statusLabel }}
                </span>
                <span v-if="candidate.suggestedBy" class="kr-text-dim-xs-55">
                  Submitted by {{ candidate.suggestedBy }}
                </span>
              </div>

              <div v-if="tagLabels.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="label in tagLabels"
                  :key="label"
                  class="kr-badge-xs badge-ghost border border-base-300"
                >
                  {{ label }}
                </span>
              </div>

              <p class="kr-prose whitespace-pre-line text-sm leading-relaxed">
                {{ biography }}
              </p>

              <a
                :href="candidate.wikipediaUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <Icon name="kind-icon:link" class="kr-icon-3-5" />
                Source on Wikipedia
              </a>

              <p
                v-if="candidate.imageAttribution"
                class="kr-text-dim-xs-55 leading-snug"
              >
                Image: {{ candidate.imageAttribution }}
                <template v-if="candidate.imageLicense">
                  ({{ candidate.imageLicense }})
                </template>
              </p>

              <section
                class="rounded-2xl border border-base-300 bg-base-200/50 p-3"
              >
                <p
                  class="kr-text-eyebrow text-[0.6rem] tracking-[0.14em] text-base-content/60"
                >
                  Controversy / objections
                </p>
                <p
                  v-if="objections"
                  class="mt-1 whitespace-pre-line text-sm leading-relaxed"
                >
                  {{ objections }}
                </p>
                <p v-else class="mt-1 text-sm italic text-base-content/45">
                  No documented objections.
                </p>
                <a
                  v-if="candidate.objectionsSourceUrl"
                  :href="candidate.objectionsSourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Source
                </a>
              </section>

              <section
                class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 p-3"
              >
                <div class="min-w-0">
                  <p class="kr-text-bold-xs">
                    {{ recheckStatusLabel }}
                  </p>
                  <p class="kr-text-dim-xs-55">
                    {{ lastCheckedLabel }}
                  </p>
                </div>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300"
                  :disabled="!canRequestRecheck || recheckBusy"
                  @click="submitRecheck"
                >
                  <span v-if="recheckBusy" class="kr-spinner-xs" />
                  <Icon v-else name="kind-icon:refresh" class="kr-icon-3-5" />
                  Request recheck
                </button>
              </section>

              <reaction-card
                :target-id="candidate.id"
                target-type="tzaddikCandidate"
                reaction-category="TZADDIK"
                :target-title="displayName"
                compact
              />

              <review-list
                target-type="tzaddikCandidate"
                :target-id="candidate.id"
                empty-label="No reviews yet — be the first."
              />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTzaddikStore } from '@/stores/tzaddikStore'
import { defaultArtFor } from '@/utils/defaultArtPool'
import { sortedTzaddikTags, tzaddikTagLabel } from '@/utils/tzaddikTags'

const props = defineProps<{ candidateId: number }>()
const emit = defineEmits<{ close: [] }>()

const store = useTzaddikStore()
const pending = ref(true)
const errorMessage = ref('')

const candidate = computed(() => store.detailById[props.candidateId] ?? null)

const displayName = computed(
  () =>
    candidate.value?.displayNameOverride || candidate.value?.displayName || '',
)

const biography = computed(() => {
  const c = candidate.value
  if (!c) return ''
  return (
    c.biographyOverride || c.biography || c.rationaleOverride || c.rationale
  )
})

const objections = computed(
  () =>
    candidate.value?.objectionsOverride || candidate.value?.objections || '',
)

const imageSrc = computed(
  () =>
    candidate.value?.imageUrlOverride || candidate.value?.imageFileUrl || '',
)

const fallbackArt = computed(() =>
  defaultArtFor(`tzaddik-${props.candidateId}`),
)

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
}

const statusLabel = computed(
  () => STATUS_LABELS[candidate.value?.curationState ?? ''] ?? 'Unknown',
)

const tagLabels = computed(() =>
  sortedTzaddikTags(
    (candidate.value?.Tags ?? []).map((entry) => entry.tag),
  ).map(tzaddikTagLabel),
)

const statusBadgeClass = computed(() => {
  switch (candidate.value?.curationState) {
    case 'APPROVED':
      return 'text-success border-success/40'
    case 'ARCHIVED':
      return 'text-base-content/50 border-base-300'
    default:
      return 'text-warning border-warning/40'
  }
})

const latestRecheck = computed(
  () => candidate.value?.RecheckRequests?.[0] ?? null,
)

const recheckPending = computed(() =>
  latestRecheck.value
    ? ['PENDING', 'CHECKING'].includes(latestRecheck.value.status)
    : false,
)

const canRequestRecheck = computed(
  () => Boolean(candidate.value) && !recheckPending.value,
)

const recheckStatusLabel = computed(() => {
  if (recheckPending.value) return 'Recheck pending'
  return 'Recheck available'
})

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const lastCheckedLabel = computed(() => {
  const checked = formatDate(candidate.value?.sourceCheckedAt)
  return checked ? `Last checked ${checked}` : 'Never checked'
})

const recheckBusy = computed(() => store.isRequestingRecheck)

async function submitRecheck(): Promise<void> {
  if (!canRequestRecheck.value) return
  await store.requestRecheck(props.candidateId)
}

async function load(): Promise<void> {
  pending.value = true
  errorMessage.value = ''
  const result = await store.fetchOne(props.candidateId)
  if (!result) {
    errorMessage.value = 'Could not load this candidate right now.'
  }
  pending.value = false
}

onMounted(load)
watch(() => props.candidateId, load)
</script>
