<!-- /components/tzaddik/tzaddik-card.vue -->
<template>
  <div :data-theme="candidateTheme" class="h-full rounded-2xl">
    <reactable-card
      :selected="selected"
      :compact="compact"
      :show-reaction="showReaction"
      :target-id="candidate.id"
      target-type="tzaddikCandidate"
      reaction-category="TZADDIK"
      :target-title="displayName"
      :earned-karma="earnedKarma"
      @select="selectCandidate"
    >
      <kr-entity-card-body
        :title="displayName"
        :subtitle="regionLabel"
        :description="rationale"
        description-fallback="No pitch written yet."
        :source="null"
        :variant="variant"
        :fallback="imageSrc"
        :show-image="showImage"
        :show-description="showDescription"
        :compact="compact"
        :selected="selected"
        :badges="badges"
        :meta="metaChips"
        placeholder-icon="kind-icon:stars"
      >
        <template v-if="recheckReason">
          <p
            class="mx-0.5 mt-2 line-clamp-2 text-xs leading-relaxed text-warning"
          >
            {{ recheckReason }}
          </p>
          <div class="mx-0.5 mt-2 flex gap-1.5">
            <button
              type="button"
              class="btn btn-xs flex-1 rounded-lg"
              :disabled="resolveBusy"
              @click.stop="acceptRecheck"
            >
              Update
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs flex-1 rounded-lg border border-base-300"
              :disabled="resolveBusy"
              @click.stop="dismissRecheck"
            >
              Keep current
            </button>
          </div>
        </template>
      </kr-entity-card-body>
    </reactable-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveEntityTheme } from '@/utils/entityTheme'
import {
  useTzaddikStore,
  type TzaddikModerationQueueCandidate,
} from '@/stores/tzaddikStore'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
import { sortedTzaddikTags, tzaddikTagLabel } from '@/utils/tzaddikTags'
import { recheckReasonLabel } from '@/utils/tzaddikRecheck'

const props = withDefaults(
  defineProps<{
    candidate: TzaddikModerationQueueCandidate
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showDescription?: boolean
    showReaction?: boolean
    /** Which stored art to show, and at what aspect -- the shared
     *  card/hero/icon vocabulary. */
    variant?: ArtVariant
    /** Total karma this candidate has earned from reactions to it.
     *  Omit/undefined renders no badge -- see reactable-card.vue. */
    earnedKarma?: number | null
  }>(),
  {
    variant: 'card',
    selected: false,
    compact: false,
    showImage: true,
    showDescription: true,
    showReaction: true,
    earnedKarma: undefined,
  },
)

const emit = defineEmits<{
  open: [id: number]
}>()

const store = useTzaddikStore()

const candidateTheme = computed(() => resolveEntityTheme(props.candidate))

const displayName = computed(
  () => props.candidate.displayNameOverride || props.candidate.displayName,
)

const rationale = computed(
  () => props.candidate.rationaleOverride || props.candidate.rationale || '',
)

const imageSrc = computed(
  () => props.candidate.imageUrlOverride || props.candidate.imageFileUrl || '',
)

const regionLabel = computed(() =>
  [props.candidate.region, props.candidate.countryCode]
    .filter(Boolean)
    .join(', '),
)

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
}

/*
 * lifeState always shows (Living/Memorial is the split the gallery browses
 * by, so it reads as the card's category, same corner every reward's rarity
 * badge owns). curationState only shows when it is not the steady-state
 * APPROVED -- a "Pending review"/"Archived" chip is the one piece of admin
 * context worth surfacing on the review-queue tab's cards; repeating
 * "Approved" on all 36 public roster cards would just be noise.
 */
const badges = computed<EntityCardChip[]>(() => {
  const result: EntityCardChip[] = [
    props.candidate.lifeState === 'MEMORIAL'
      ? { label: 'Memorial', class: 'badge-ghost' }
      : { label: 'Living', class: 'badge-primary' },
  ]

  const curationLabel = STATUS_LABELS[props.candidate.curationState]
  if (curationLabel && props.candidate.curationState !== 'APPROVED') {
    result.push({ label: curationLabel, class: 'badge-warning' })
  }

  return result
})

const metaChips = computed<EntityCardChip[]>(() =>
  sortedTzaddikTags(props.candidate.Tags.map((entry) => entry.tag)).map(
    (tag) => ({ label: tzaddikTagLabel(tag), class: 'badge-outline' }),
  ),
)

// t-029: only the NEEDS_REVIEW moderation-queue filter's response carries
// RecheckRequests, so this is empty (and renders nothing) everywhere else
// tzaddik-card is used.
const recheckReason = computed(() =>
  recheckReasonLabel(props.candidate.RecheckRequests?.[0]),
)

const resolveBusy = computed(() => store.isModerating)

// t-030: resolve the flagged recheck right from the queue card instead of
// requiring a click-through to the detail sheet.
async function acceptRecheck(): Promise<void> {
  await store.resolveRecheckReview(props.candidate.id, 'accept')
}

async function dismissRecheck(): Promise<void> {
  await store.resolveRecheckReview(props.candidate.id, 'dismiss')
}

function selectCandidate(): void {
  emit('open', props.candidate.id)
}
</script>
