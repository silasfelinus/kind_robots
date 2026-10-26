<template>
  <Transition name="support-rise">
    <aside
      v-if="support.activePrompt"
      class="support-prompt fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[min(42rem,calc(100vw-2rem))]"
      role="dialog"
      aria-modal="false"
      aria-label="Share and support Kind Robots"
      @keydown.esc="support.dismiss()"
    >
      <div
        class="relative max-h-[80dvh] overflow-y-auto rounded-2xl shadow-2xl"
      >
        <button
          ref="closeButton"
          type="button"
          class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2 z-10"
          aria-label="Close"
          @click="support.dismiss()"
        >
          <Icon name="kind-icon:close" class="size-4" aria-hidden="true" />
        </button>
        <support-card :title="gameTitle" :path="support.activePrompt.path" />
        <p
          class="absolute bottom-1.5 left-0 right-0 text-center text-[0.65rem] opacity-55"
        >
          {{
            support.activePrompt.reason === 'runs'
              ? 'Thanks for playing another round.'
              : 'Thanks for coming back to play.'
          }}
          We only ask every few plays.
        </p>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useSupportStore } from '@/stores/supportStore'
import { playTitleFromPath } from '~/utils/supportShare'
import { findArcadeGame } from '~/utils/arcade/games'

const support = useSupportStore()
const route = useRoute()
const closeButton = ref<HTMLButtonElement | null>(null)

const gameTitle = computed(() =>
  playTitleFromPath(
    support.activePrompt?.path ?? '',
    (slug) => findArcadeGame(slug)?.title,
  ),
)

watch(
  () => route.fullPath,
  () => support.recordRoute(route.fullPath),
  { immediate: true },
)

watch(
  () => support.activePrompt,
  async (prompt) => {
    if (!prompt) return
    await nextTick()
    closeButton.value?.focus({ preventScroll: true })
  },
)
</script>

<style scoped>
.support-prompt :deep(.support-card) {
  padding-bottom: 1.75rem;
}

.support-prompt :deep(.support-head) {
  padding-right: 2.25rem;
}

.support-rise-enter-active,
.support-rise-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.support-rise-enter-from,
.support-rise-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

@media (prefers-reduced-motion: reduce) {
  .support-rise-enter-active,
  .support-rise-leave-active {
    transition: none;
  }
}
</style>
