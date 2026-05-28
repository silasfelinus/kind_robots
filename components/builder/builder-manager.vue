<!-- /components/builder/builder-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <header
      class="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-100 px-4 py-3"
    >
      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-xl lg:hidden"
        :class="showSheet ? 'btn-active' : ''"
        :aria-label="showSheet ? 'Hide builder sheet' : 'Show builder sheet'"
        @click="showSheet = !showSheet"
      >
        <Icon name="kind-icon:blueprint" class="h-4 w-4" />
      </button>

      <div class="min-w-0 flex-1">
        <h2
          class="flex items-center gap-2 truncate text-lg font-black leading-tight text-base-content"
        >
          <Icon
            name="kind-icon:sparkles"
            class="h-5 w-5 shrink-0 text-primary"
          />
          <span class="truncate">{{ title }}</span>
        </h2>
        <p class="truncate text-xs text-base-content/50">{{ subtitle }}</p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/50 hover:text-primary"
          @click="store.randomCard()"
        >
          <Icon name="kind-icon:dice" class="h-4 w-4" />
          <span class="hidden sm:inline">Random</span>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/50 hover:text-error"
          @click="showResetConfirm = true"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>

    <Transition name="builder-feedback">
      <div
        v-if="store.lastError || store.statusMessage"
        class="shrink-0 border-b px-4 py-2 text-sm font-semibold"
        :class="
          store.lastError
            ? 'border-error/30 bg-error/10 text-error'
            : 'border-success/30 bg-success/10 text-success'
        "
      >
        {{ store.lastError || store.statusMessage }}
      </div>
    </Transition>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <Transition name="builder-sheet-slide">
        <aside
          v-show="showSheet || isDesktop"
          class="w-72 shrink-0 overflow-y-auto border-r border-base-300 bg-base-100 p-3"
        >
          <builder-sheet />
        </aside>
      </Transition>

      <main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <builder-stage />
        </div>

        <div class="shrink-0 border-t border-base-300 bg-base-100/70 p-2">
          <builder-hand />
        </div>
      </main>
    </div>

    <Teleport to="body">
      <Transition name="builder-modal-fade">
        <div
          v-if="showResetConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showResetConfirm = false"
        >
          <div class="absolute inset-0 bg-base-300/60 backdrop-blur-sm" />
          <div
            class="relative w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl"
          >
            <h3 class="text-lg font-black text-base-content">
              Clear this builder?
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-base-content/60">
              This clears staged answers, completed cards, rewards, stats, and
              local saved state for this builder. Pure potential. Slightly
              haunted.
            </p>
            <div class="mt-5 flex justify-end gap-2">
              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-xl"
                @click="showResetConfirm = false"
              >
                Keep it
              </button>
              <button
                type="button"
                class="btn btn-sm btn-error rounded-xl"
                @click="resetBuilder"
              >
                Clear everything
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
const showSheet = ref(false)
const showResetConfirm = ref(false)
const isDesktop = ref(false)

const title = computed(() => {
  const sheetTitle = String(store.sheet.name || store.sheet.title || '').trim()
  return (
    sheetTitle || store.activeConfig.title || store.splash.title || 'Builder'
  )
})

const subtitle = computed(() => {
  if (store.activeCard) return store.activeCard.title
  if (store.allComplete) return 'Ready for final review and interaction.'
  return store.splash.tagline || store.activeConfig.label
})

function updateDesktop(): void {
  isDesktop.value = window.matchMedia('(min-width: 1024px)').matches
}

function resetBuilder(): void {
  store.resetBuilder(true)
  showResetConfirm.value = false
}

onMounted(() => {
  store.hydrate()
  updateDesktop()
  window.addEventListener('resize', updateDesktop)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDesktop)
})
</script>

<style scoped>
.builder-feedback-enter-active,
.builder-feedback-leave-active,
.builder-sheet-slide-enter-active,
.builder-sheet-slide-leave-active,
.builder-modal-fade-enter-active,
.builder-modal-fade-leave-active {
  transition: all 180ms ease;
}

.builder-feedback-enter-from,
.builder-feedback-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.builder-sheet-slide-enter-from,
.builder-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

.builder-modal-fade-enter-from,
.builder-modal-fade-leave-to {
  opacity: 0;
}
</style>
