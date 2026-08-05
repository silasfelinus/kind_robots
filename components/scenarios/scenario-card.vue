<!-- /components/scenarios/scenario-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :allow-reviews="scenario.allowReviews"
    :target-id="scenario.id"
    target-type="scenario"
    reaction-category="SCENARIO"
    :target-title="scenarioTitle"
    :earned-karma="earnedKarma"
    @select="selectScenario"
  >
    <template #actions>
      <!--
        HIDDEN AT REST. These three sat visible on every card at all times,
        three filled circles punched over the art. Silas, 2026-08-05: "the icon
        popups for delete copy etc should def not be visible on load, maybe
        maybe maybe on hover is fine, but the implementation looks ugly."

        Its siblings (character-card, bot-card, reward-card) already gated the
        same buttons on `activeSelected || compact`; scenario-card was the one
        that never did, which is why only Scenarios looked like this. Matching
        them, plus a hover/focus reveal so the actions stay discoverable
        without having to select first. focus-within matters: hover alone hides
        these from keyboard users entirely, and a card that must be selected
        before it can be deleted is fine, but one that can never be reached by
        keyboard is not.
      -->
      <div
        class="flex items-center gap-2 transition-opacity duration-150"
        :class="
          activeSelected || compact
            ? 'opacity-100'
            : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'
        "
      >
        <button
          v-if="showActions && canEdit"
          class="rounded-full bg-base-100/90 p-2 text-primary shadow backdrop-blur transition hover:bg-primary hover:text-primary-content"
          type="button"
          title="Edit Scenario"
          @click.stop="emit('edit', scenario.id)"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
        </button>

        <button
          v-if="showActions && allowClone"
          class="rounded-full bg-base-100/90 p-2 text-secondary shadow backdrop-blur transition hover:bg-secondary hover:text-secondary-content"
          type="button"
          title="Clone Scenario"
          @click.stop="emit('clone', scenario.id)"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
        </button>

        <button
          v-if="showActions && canDelete"
          class="rounded-full bg-base-100/90 p-2 text-error shadow backdrop-blur transition hover:bg-error hover:text-error-content"
          type="button"
          title="Delete Scenario"
          @click.stop="deleteScenario"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
        </button>
      </div>
    </template>

    <kr-entity-card-body
      :title="scenarioTitle"
      :subtitle="scenario.genres || ''"
      :description="scenario.description"
      description-fallback="No description yet."
      :source="scenario"
      :variant="variant"
      :fallback="artFallbackSrc"
      :show-image="showImage"
      :show-description="showDescription"
      :compact="compact"
      :selected="activeSelected"
      :badges="badges"
      :meta="showMeta ? metaChips : []"
      placeholder-icon="kind-icon:map"
    >
      <!-- The one genuinely Scenario-shaped thing on the card. -->
      <div
        v-if="showInspirations && scenario.inspirations && !compact"
        class="mx-0.5 mt-2.5 rounded-xl border border-base-300 bg-base-100 p-2.5"
      >
        <p
          class="text-[0.65rem] font-bold uppercase tracking-wider text-base-content/50"
        >
          Inspirations
        </p>

        <p
          class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-base-content/70"
        >
          {{ scenario.inspirations }}
        </p>
      </div>
    </kr-entity-card-body>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { resolveArtImageSrc, type ArtVariant } from '@/utils/artImageSrc'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'
import { parseScenarioIntros } from '@/stores/helpers/scenarioHelper'

const props = withDefaults(
  defineProps<{
    scenario: Scenario
    selected?: boolean
    showImage?: boolean
    compact?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showInspirations?: boolean
    showReaction?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowClone?: boolean
    fallbackImage?: string
    /**
     * Which stored art to show, and at what aspect — the shared card/hero/icon
     * vocabulary. This was hardcoded `variant="card"` on the body below, which
     * is why a gallery mode switch changed nothing visible: every mode rendered
     * the identical portrait card. Same prop, same default, as dream-card.
     */
    variant?: ArtVariant
    /** Total karma this scenario has earned from reactions to it. Omit/undefined
     *  renders no badge — see components/wonderlab/reactable-card.vue. */
    earnedKarma?: number | null
  }>(),
  {
    selected: false,
    showImage: true,
    compact: false,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showInspirations: false,
    showReaction: true,
    allowEdit: true,
    allowDelete: true,
    allowClone: true,
    variant: 'card',
    fallbackImage: '/images/scenarios/space.webp',
    earnedKarma: undefined,
  },
)

const emit = defineEmits<{
  choose: [scenario: Scenario]
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
}>()

const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const artStore = useArtStore()

const artImage = ref<ArtImage | null>(null)

const activeSelected = computed(() => {
  return (
    props.selected || scenarioStore.selectedScenario?.id === props.scenario.id
  )
})

const scenarioTitle = computed(() => {
  return props.scenario.title || `Scenario #${props.scenario.id}`
})

const canEdit = computed(() => {
  return (
    props.allowEdit &&
    (userStore.isAdmin || userStore.userId === props.scenario.userId)
  )
})

const canDelete = computed(() => {
  return (
    props.allowDelete &&
    (userStore.isAdmin || userStore.userId === props.scenario.userId)
  )
})

/*
 * What the card body falls back to when the Scenario has no card variant yet:
 * the linked ArtImage's path or base64, then the wide primary imagePath, then
 * the shipped placeholder. kr-entity-card-body (via kr-art-plate) applies the
 * cardPath/heroPath/iconPath half of the chain itself, so this file no longer
 * carries its own copy of resolveArtVariantSrc's variant branch.
 */
const artFallbackSrc = computed(() =>
  resolveArtImageSrc(
    artImage.value,
    props.scenario.imagePath || props.fallbackImage,
  ),
)

const introCount = computed(() => {
  return parseScenarioIntros(props.scenario.intros).length
})

const badges = computed<EntityCardChip[]>(() => {
  const result: EntityCardChip[] = []
  // No 'Yours' chip. /stories shows the signed-in user their own scenarios, so
  // it rendered on all 152 of them — a badge that is always true carries no
  // information and cost a third of each icon row. Silas, 2026-08-05: "the
  // owner info should not even be present on this gallery, and 'Yours' takes up
  // a full third of the space."
  if (props.scenario.isMature) {
    result.push({ label: 'Mature', class: 'badge-warning' })
  }
  return result
})

const metaChips = computed<EntityCardChip[]>(() => {
  const result: EntityCardChip[] = []
  if (props.scenario.locations) {
    result.push({
      label: props.scenario.locations,
      class: 'badge-ghost',
      icon: 'kind-icon:map',
    })
  }
  if (introCount.value) {
    result.push({
      label: `${introCount.value} ${introCount.value === 1 ? 'opening' : 'openings'}`,
      class: 'badge-outline',
    })
  }
  return result
})

async function selectScenario() {
  await scenarioStore.selectScenario(props.scenario.id)
  emit('choose', props.scenario)
}

async function deleteScenario() {
  const deleted = await scenarioStore.deleteScenario(props.scenario.id)

  if (deleted !== false) {
    emit('delete', props.scenario.id)
  }
}

async function loadScenarioImage() {
  artImage.value = null

  if (!props.scenario.artImageId || !props.showImage) return

  try {
    const result = await artStore.getArtImageById(props.scenario.artImageId)

    if (result) {
      artImage.value = result
    }
  } catch (error) {
    console.error('Failed to load scenario art image:', error)
  }
}

onMounted(async () => {
  await loadScenarioImage()
})

watch(
  () => props.scenario.artImageId,
  async () => {
    await loadScenarioImage()
  },
)
</script>
