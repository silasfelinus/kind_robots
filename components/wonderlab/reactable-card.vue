<!-- /components/wonderlab/reactable-card.vue -->
<template>
  <article
    :class="[
      'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      selected ? 'border-primary bg-primary/10' : 'border-base-300',
      cardClass,
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
        v-if="reactionOpen"
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
          v-if="targetId && targetType && reactionCategory"
          :target-id="targetId"
          :target-type="targetType"
          :reaction-category="reactionCategory"
          :target-title="targetTitle"
          compact
          @submitted="reactionOpen = false"
        />
      </div>
    </Transition>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
    targetType?: ReactionTargetType
    reactionCategory?: ReactionCategoryEnum
    targetTitle?: string
    cardClass?: string
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

const showReactionButton = computed(() => {
  return Boolean(
    props.showReaction &&
    props.selected &&
    props.targetId &&
    props.targetType &&
    props.reactionCategory,
  )
})

function handleSelect() {
  emit('select')
}

function toggleReaction() {
  reactionOpen.value = !reactionOpen.value
}
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
