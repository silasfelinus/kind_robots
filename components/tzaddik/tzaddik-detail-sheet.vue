<template>
  <Teleport to="body">
    <dialog
      class="modal modal-open"
      aria-modal="true"
      @cancel.prevent="emit('close')"
      @click.self="emit('close')"
    >
      <div
        class="modal-box flex max-h-[94dvh] w-[min(96vw,90rem)] max-w-none flex-col overflow-hidden rounded-3xl border border-primary/35 bg-base-100 p-0 shadow-2xl lg:h-[min(90dvh,52rem)]"
      >
        <header
          class="flex shrink-0 items-center gap-2 border-b border-base-300 bg-base-100/95 px-3 py-2.5 backdrop-blur sm:px-4"
        >
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="emit('close')"
          >
            ← {{ contextLabel }}
          </button>

          <div class="min-w-0 flex-1 text-center">
            <p class="kr-text-eyebrow text-[0.58rem] tracking-[0.16em] text-primary">
              Tzaddik Gallery
            </p>
            <p class="truncate text-xs font-semibold text-base-content/60">
              {{ displayName || 'Loading…' }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl px-2"
              :disabled="previousCandidateId === null"
              aria-label="Previous profile"
              @click="navigateTo(previousCandidateId)"
            >
              ←
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl px-2"
              :disabled="nextCandidateId === null"
              aria-label="Next profile"
              @click="navigateTo(nextCandidateId)"
            >
              →
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-square btn-sm rounded-xl"
              aria-label="Close"
              @click="emit('close')"
            >
              <Icon name="kind-icon:x" class="kr-icon-4" />
            </button>
          </div>
        </header>

        <div class="kr-scroll min-h-0 flex-1 lg:overflow-hidden">
          <div v-if="pending" class="flex min-h-64 items-center justify-center">
            <span class="kr-loading-primary-md" />
            <span class="sr-only">Loading…</span>
          </div>

          <div
            v-else-if="errorMessage"
            class="m-4 kr-note kr-note-warning"
          >
            {{ errorMessage }}
          </div>

          <div
            v-else-if="candidate"
            class="flex min-h-full flex-col lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(21rem,0.9fr)_minmax(0,1.1fr)]"
          >
            <section
              class="relative min-h-[26rem] overflow-hidden bg-base-300 lg:min-h-0"
            >
              <kr-art-plate
                :source="{ imagePath: imageSrc }"
                variant="hero"
                shape="card"
                frame="none"
                :alt="displayName"
                :fallback="fallbackArt"
                fit="cover"
                eager
                class="absolute inset-0 h-full w-full"
              />
              <div
                class="absolute inset-0 bg-linear-to-t from-black/90 via-black/15 to-black/10"
              />

              <div class="absolute left-3 top-3 flex max-w-[80%] flex-wrap gap-1.5">
                <span class="badge border-white/25 bg-black/45 text-white">
                  {{ statusLabel }}
                </span>
                <span
                  v-for="label in tagLabels"
                  :key="label"
                  class="badge border-white/20 bg-black/35 text-white/90"
                >
                  {{ label }}
                </span>
              </div>

              <div class="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white sm:p-5">
                <p
                  class="text-xs font-bold uppercase tracking-[0.16em] text-white/65"
                >
                  {{ candidate.lifeState === 'MEMORIAL' ? 'Memorial' : 'Living' }}
                  <template v-if="candidate.region || candidate.countryCode">
                    ·
                    {{ [candidate.region, candidate.countryCode].filter(Boolean).join(', ') }}
                  </template>
                </p>
                <h2 class="text-3xl font-black leading-none sm:text-4xl">
                  {{ displayName }}
                </h2>
                <p
                  v-if="rationale"
                  class="max-w-2xl text-sm font-medium leading-relaxed text-white/85 sm:text-base"
                >
                  {{ rationale }}
                </p>
              </div>
            </section>

            <section
              class="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_19rem]"
            >
              <article
                class="space-y-4 p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto"
              >
                <section v-if="biography" class="space-y-1.5">
                  <p class="kr-text-eyebrow text-primary">Biography</p>
                  <p class="kr-prose whitespace-pre-line text-sm leading-relaxed">
                    {{ biography }}
                  </p>
                </section>

                <section
                  class="rounded-2xl border border-base-300 bg-base-200/45 p-4"
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="kr-text-eyebrow text-primary">Source & provenance</p>
                      <p class="kr-text-dim-xs-55 mt-1">
                        {{ lastCheckedLabel }}
                      </p>
                    </div>
                    <a
                      :href="candidate.wikipediaUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300"
                    >
                      <Icon name="kind-icon:link" class="kr-icon-3-5" />
                      Wikipedia
                    </a>
                  </div>
                  <p
                    v-if="candidate.imageAttribution"
                    class="kr-text-dim-xs-55 mt-3 leading-relaxed"
                  >
                    Image: {{ candidate.imageAttribution }}
                    <template v-if="candidate.imageLicense">
                      · {{ candidate.imageLicense }}
                    </template>
                  </p>
                </section>

                <section
                  class="rounded-2xl border border-warning/25 bg-warning/5 p-4"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="kr-text-eyebrow text-warning">
                      Controversy / objections
                    </p>
                    <a
                      v-if="candidate.objectionsSourceUrl"
                      :href="candidate.objectionsSourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs font-semibold text-primary hover:underline"
                    >
                      Source
                    </a>
                  </div>
                  <p
                    v-if="objections"
                    class="mt-2 whitespace-pre-line text-sm leading-relaxed"
                  >
                    {{ objections }}
                  </p>
                  <p v-else class="mt-2 text-sm italic text-base-content/50">
                    No substantial documented objection is currently attached to this
                    profile.
                  </p>
                </section>
              </article>

              <aside
                class="flex min-h-0 flex-col gap-3 border-t border-base-300 bg-base-200/30 p-3 sm:p-4 lg:border-l lg:border-t-0"
              >
                <div
                  class="rounded-2xl border border-base-300 bg-base-100/80 p-3"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="kr-text-bold-xs">{{ statusLabel }}</p>
                      <p v-if="candidate.suggestedBy" class="kr-text-dim-xs-55 mt-0.5">
                        Submitted by {{ candidate.suggestedBy }}
                      </p>
                    </div>
                    <span class="kr-badge-ghost-sm" :class="statusBadgeClass">
                      {{ candidate.lifeState === 'MEMORIAL' ? 'Past' : 'Living' }}
                    </span>
                  </div>
                </div>

                <reaction-card
                  :target-id="candidate.id"
                  target-type="tzaddikCandidate"
                  reaction-category="TZADDIK"
                  :target-title="displayName"
                  compact
                />

                <section
                  class="rounded-2xl border border-base-300 bg-base-100/80 p-3"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <p class="kr-text-bold-xs">{{ recheckStatusLabel }}</p>
                      <p class="kr-text-dim-xs-55">{{ lastCheckedLabel }}</p>
                    </div>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300"
                      :disabled="!canRequestRecheck || recheckBusy"
                      @click="submitRecheck"
                    >
                      <span v-if="recheckBusy" class="kr-spinner-xs" />
                      <Icon v-else name="kind-icon:refresh" class="kr-icon-3-5" />
                      Recheck
                    </button>
                  </div>
                </section>

                <section
                  class="flex min-h-[14rem] flex-1 flex-col rounded-2xl border border-base-300 bg-base-100/80 p-3 lg:min-h-0"
                >
                  <div class="mb-2 shrink-0">
                    <p class="kr-text-bold-xs">Community discussion</p>
                    <p class="kr-text-dim-xs-55">
                      Reviews and comments stay separate from the sourced profile.
                    </p>
                  </div>
                  <div class="min-h-0 flex-1 lg:overflow-y-auto lg:pr-1">
                    <review-list
                      target-type="tzaddikCandidate"
                      :target-id="candidate.id"
                      empty-label="No reviews yet — be the first."
                    />
                  </div>
                </section>
              </aside>
            </section>
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

const props = withDefaults(
  defineProps<{
    candidateId: number
    candidateIds?: number[]
    contextLabel?: string
  }>(),
  {
    candidateIds: () => [],
    contextLabel: 'Gallery',
  },
)

const emit = defineEmits<{
  close: []
  navigate: [candidateId: number]
}>()

const store = useTzaddikStore()
const pending = ref(true)
const errorMessage = ref('')

const candidate = computed(() => store.detailById[props.candidateId] ?? null)

const displayName = computed(
  () =>
    candidate.value?.displayNameOverride || candidate.value?.displayName || '',
)

const biography = computed(() => {
  const current = candidate.value
  if (!current) return ''
  return (
    current.biographyOverride ||
    current.biography ||
    current.rationaleOverride ||
    current.rationale
  )
})

const rationale = computed(() => {
  const current = candidate.value
  if (!current) return ''
  return current.rationaleOverride || current.rationale || ''
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

const recheckStatusLabel = computed(() =>
  recheckPending.value ? 'Recheck pending' : 'Source recheck',
)

const currentCandidateIndex = computed(() =>
  props.candidateIds.indexOf(props.candidateId),
)

const previousCandidateId = computed(() => {
  const index = currentCandidateIndex.value
  return index > 0 ? props.candidateIds[index - 1] : null
})

const nextCandidateId = computed(() => {
  const index = currentCandidateIndex.value
  return index >= 0 && index < props.candidateIds.length - 1
    ? props.candidateIds[index + 1]
    : null
})

function navigateTo(candidateId: number | null): void {
  if (candidateId === null) return
  emit('navigate', candidateId)
}

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
  return checked ? `Last checked ${checked}` : 'Source not checked yet'
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
