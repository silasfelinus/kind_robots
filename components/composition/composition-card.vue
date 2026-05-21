<!-- /components/content/composition/composition-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="composition.id"
    target-type="resource"
    reaction-category="COMPOSITION"
    :target-title="compositionTitle"
    @select="selectComposition"
  >
    <template #actions>
      <button
        v-if="showActions && allowEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Composition"
        @click.stop="emit('edit', composition.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>
      <button
        v-if="showActions && allowDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Composition"
        @click.stop="deleteComposition"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <!-- Ingredient badges -->
    <div
      v-if="showImage"
      :class="[
        'relative flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-300 p-3',
        compact ? 'min-h-20' : 'min-h-28',
      ]"
    >
      <span
        v-for="slot in activeSlots"
        :key="slot.key"
        class="badge badge-lg gap-1"
        :class="slot.class"
      >
        <Icon :name="slot.icon" class="h-3 w-3" />
        {{ slot.label }}
      </span>

      <div v-if="activeSlots.length === 0" class="text-xs text-base-content/40">
        No ingredients
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="activeSelected" class="badge badge-primary badge-sm"
          >Selected</span
        >
        <span
          class="badge badge-sm"
          :class="composition.isPublic ? 'badge-success' : 'badge-warning'"
        >
          {{ composition.isPublic ? 'Public' : 'Private' }}
        </span>
      </div>

      <span class="absolute right-2 top-2 badge badge-outline badge-sm">
        {{ composition.mode || 'both' }}
      </span>

      <div
        v-if="activeSelected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <h2
        :class="[
          'font-black leading-tight text-base-content',
          compact ? 'line-clamp-1 text-base' : 'text-lg',
        ]"
        :title="compositionTitle"
      >
        {{ compositionTitle }}
      </h2>

      <p
        v-if="showDescription"
        :class="[
          'text-base-content/70',
          compact ? 'line-clamp-2 text-sm' : 'text-sm',
        ]"
      >
        {{
          composition.description || composition.label || 'No description yet.'
        }}
      </p>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span
          v-if="composition.narrativeText"
          class="badge badge-success badge-sm gap-1"
        >
          <Icon name="kind-icon:check" class="h-3 w-3" />
          Narrative
        </span>
        <span
          v-if="composition.artPrompt"
          class="badge badge-primary badge-sm gap-1"
        >
          <Icon name="kind-icon:check" class="h-3 w-3" />
          Art Prompt
        </span>
        <span
          v-if="!composition.narrativeText && !composition.artPrompt"
          class="badge badge-ghost badge-sm"
        >
          Not synthesized
        </span>
      </div>

      <button
        v-if="showSelectButton"
        class="btn btn-sm mt-auto rounded-xl"
        :class="activeSelected ? 'btn-primary text-white' : 'btn-outline'"
        type="button"
        @click.stop="selectComposition"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
        {{ activeSelected ? 'Selected' : 'Select' }}
      </button>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompositionStore } from '@/stores/compositionStore'

type CompositionItem = {
  id: number
  title?: string | null
  description?: string | null
  label?: string | null
  mode?: string | null
  isPublic?: boolean | null
  narrativeText?: string | null
  artPrompt?: string | null
  characterId?: number | null
  dreamId?: number | null
  scenarioId?: number | null
  pitchId?: number | null
  rewardId?: number | null
  characterBlurb?: string | null
  dreamBlurb?: string | null
  scenarioBlurb?: string | null
  pitchBlurb?: string | null
  rewardBlurb?: string | null
}

const props = withDefaults(
  defineProps<{
    composition: CompositionItem
    selected?: boolean
    showImage?: boolean
    compact?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showSelectButton?: boolean
    showReaction?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
  }>(),
  {
    selected: false,
    showImage: true,
    compact: false,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showSelectButton: false,
    showReaction: true,
    allowEdit: true,
    allowDelete: true,
  },
)

const emit = defineEmits<{ edit: [id: number]; delete: [id: number] }>()

const compositionStore = useCompositionStore()

const activeSelected = computed(
  () =>
    props.selected ||
    compositionStore.selectedModel?.id === props.composition.id,
)

const compositionTitle = computed(
  () =>
    props.composition.title ||
    props.composition.label ||
    `Composition #${props.composition.id}`,
)

type SlotBadge = { key: string; label: string; icon: string; class: string }

const activeSlots = computed((): SlotBadge[] => {
  const slots: SlotBadge[] = []
  const c = props.composition
  if (c.characterId || c.characterBlurb)
    slots.push({
      key: 'character',
      label: 'Character',
      icon: 'kind-icon:user',
      class: 'badge-accent',
    })
  if (c.dreamId || c.dreamBlurb)
    slots.push({
      key: 'dream',
      label: 'Location',
      icon: 'kind-icon:map',
      class: 'badge-secondary',
    })
  if (c.scenarioId || c.scenarioBlurb)
    slots.push({
      key: 'scenario',
      label: 'Scenario',
      icon: 'kind-icon:scroll',
      class: 'badge-info',
    })
  if (c.pitchId || c.pitchBlurb)
    slots.push({
      key: 'pitch',
      label: 'Concept',
      icon: 'kind-icon:lightbulb',
      class: 'badge-warning',
    })
  if (c.rewardId || c.rewardBlurb)
    slots.push({
      key: 'reward',
      label: 'Reward',
      icon: 'kind-icon:star',
      class: 'badge-success',
    })
  return slots
})

function selectComposition() {
  compositionStore.selectModel(props.composition.id)
}

async function deleteComposition() {
  const result = await compositionStore.deleteModel(props.composition.id)
  if (result?.success !== false) emit('delete', props.composition.id)
}
</script>
