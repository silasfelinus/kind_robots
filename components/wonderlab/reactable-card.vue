<!-- /components/wonderlab/reactable-card.vue -->
<template>
  <article
    :class="[
      'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      selected ? 'border-primary bg-primary/10' : 'border-base-300',
      normalizedCardClass,
    ]"
    @click="handleSelect"
  >
    <div
      v-if="$slots.actions || showReactionButton"
      class="absolute right-2 top-2 z-30 flex items-center gap-2"
      @click.stop
    >
      <slot name="actions" />

      <button
        v-if="showReactionButton"
        class="rounded-full bg-base-100 p-2 text-accent shadow transition hover:bg-accent hover:text-accent-content"
        type="button"
        title="React"
        @click.stop="toggleReaction"
      >
        <Icon name="kind-icon:star" class="h-4 w-4" />
      </button>
    </div>

    <slot />

    <Transition name="reaction-pop">
      <div
        v-if="reactionOpen && canRenderReactionCard"
        class="absolute inset-x-2 top-14 z-40 max-h-[calc(100%-4rem)] overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
        @click.stop
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <p
            class="truncate text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            React
          </p>

          <button
            class="btn btn-xs btn-ghost rounded-xl"
            type="button"
            @click="reactionOpen = false"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <reaction-card
          :target-id="normalizedTargetId"
          :target-type="normalizedTargetType"
          :reaction-category="normalizedReactionCategory"
          :target-title="normalizedTargetTitle"
          compact
          @submitted="reactionOpen = false"
        />
      </div>
    </Transition>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  ReactionCategoryEnum,
  ReactionTargetType,
} from '@/stores/reactionStore'

const props = withDefaults(
  defineProps<{
    selected?: boolean
    compact?: boolean
    showReaction?: boolean
    targetId?: number | null
    targetType?: ReactionTargetType | string
    reactionCategory?: ReactionCategoryEnum | string
    targetTitle?: string | null
    cardClass?: string | string[] | Record<string, boolean> | null
  }>(),
  {
    selected: false,
    compact: false,
    showReaction: true,
    targetId: null,
    targetType: undefined,
    reactionCategory: undefined,
    targetTitle: '',
    cardClass: '',
  },
)

const emit = defineEmits<{
  select: []
}>()

const reactionOpen = ref(false)

const normalizedTargetId = computed(() => {
  const id = Number(props.targetId)

  return Number.isInteger(id) && id > 0 ? id : 0
})

const normalizedTargetType = computed(() => {
  return safeText(props.targetType).trim() as ReactionTargetType
})

const normalizedReactionCategory = computed(() => {
  return safeText(props.reactionCategory).trim() as ReactionCategoryEnum
})

const normalizedTargetTitle = computed(() => {
  return safeText(props.targetTitle).trim() || 'Untitled'
})

const normalizedCardClass = computed(() => {
  return props.cardClass ?? ''
})

const canRenderReactionCard = computed(() => {
  return Boolean(
    normalizedTargetId.value > 0 &&
    normalizedTargetType.value &&
    normalizedReactionCategory.value,
  )
})

const showReactionButton = computed(() => {
  return Boolean(
    props.showReaction && props.selected && canRenderReactionCard.value,
  )
})

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)

  return ''
}

function handleSelect() {
  emit('select')
}

function toggleReaction() {
  if (!canRenderReactionCard.value) return

  reactionOpen.value = !reactionOpen.value
}

watch(canRenderReactionCard, (canRender) => {
  if (!canRender) {
    reactionOpen.value = false
  }
})
</script>

<style scoped>
.reaction-pop-enter-active,
.reaction-pop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.reaction-pop-enter-from,
.reaction-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem) scale(0.98);
}
</style>
