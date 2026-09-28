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
      />
    </reactable-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveEntityTheme } from '@/utils/entityTheme'
import type { TzaddikCandidateWithTags } from '@/stores/tzaddikStore'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
import { sortedTzaddikTags, tzaddikTagLabel } from '@/utils/tzaddikTags'
import { resolveTzaddikImageSrc } from '@/utils/tzaddikImage'

const props = withDefaults(
  defineProps<{
    candidate: TzaddikCandidateWithTags
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

const candidateTheme = computed(() => resolveEntityTheme(props.candidate))

const displayName = computed(
  () => props.candidate.displayNameOverride || props.candidate.displayName,
)

const rationale = computed(
  () => props.candidate.rationaleOverride || props.candidate.rationale || '',
)

const imageSrc = computed(() => resolveTzaddikImageSrc(props.candidate))

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

function selectCandidate(): void {
  emit('open', props.candidate.id)
}
</script>