<!-- /components/builder/builder-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <user-builder
      v-if="activeTab === 'user'"
      class="hidden"
      aria-hidden="true"
    />

    <header
      class="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-100 px-4 py-3"
    >
      <div class="min-w-0 flex-1">
        <h2
          class="flex items-center gap-2 truncate text-lg font-black leading-tight text-base-content"
        >
          <Icon :name="headerIcon" class="h-5 w-5 shrink-0 text-primary" />
          <span class="truncate">{{ title }}</span>
        </h2>

        <p class="truncate text-xs text-base-content/50">
          {{ subtitle }}
        </p>
      </div>

      <div v-if="showBuilderControls" class="flex shrink-0 items-center gap-2">
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

    <main class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
      <section class="flex min-h-0 flex-col gap-3">
        <template v-if="isBuilderActive">
          <builder-splash v-if="showSplash" />
          <builder-step-panel v-else-if="store.activeCard" />
          <builder-summary v-else-if="store.allComplete" />
          <builder-card-grid v-else />
        </template>

        <div
          v-else
          class="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
        >
          <Icon name="kind-icon:blueprint" class="h-12 w-12 text-primary/70" />

          <h3 class="mt-4 text-lg font-black text-base-content">
            Builder is warming up
          </h3>

          <p class="mt-2 max-w-md text-sm leading-relaxed text-base-content/60">
            Pick a builder tab to start shaping a user, character, bot, reward,
            scenario, dream, pitch, or art project.
          </p>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <Transition name="builder-modal-fade">
        <div
          v-if="showResetConfirm"
          class="fixed inset-0 z-30 flex items-center justify-center p-4"
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { useNavStore } from '@/stores/navStore'
import { type DashboardKey } from '@/stores/helpers/dashboardHelper'
import {
  defaultBuilderStage,
  isBuilderStageKey,
  type BuilderStageKey,
} from '@/stores/seeds/builderSchema'
import { ensureBuildersRegistered } from '@/stores/registerBuilderStore'

const store = useBuilderStore()
const navStore = useNavStore()

const showResetConfirm = ref(false)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || 'builder'
})

const activeTab = computed<BuilderStageKey>(() => {
  const selectedTab = navStore.getDashboardTab(
    dashboardKey.value as DashboardKey,
  )

  return isBuilderStageKey(selectedTab) ? selectedTab : defaultBuilderStage
})

const isBuilderActive = computed(() => {
  return store.activeConfig.modelType !== 'builder' && store.cards.length > 0
})

const showSplash = computed(() => {
  return (
    !store.activeCard &&
    !store.completedCardList.length &&
    !store.visibleCards.length
  )
})

const showBuilderControls = computed(() => {
  return isBuilderActive.value
})

const headerIcon = computed(() => {
  return fallbackIcon.value
})

const fallbackIcon = computed(() => {
  if (activeTab.value === 'user') return 'kind-icon:user'
  if (activeTab.value === 'art') return 'kind-icon:palette'
  return 'kind-icon:blueprint'
})

const title = computed(() => {
  const sheetTitle = String(store.sheet.name || store.sheet.title || '').trim()

  return (
    sheetTitle ||
    store.activeConfig.title ||
    store.splash.title ||
    fallbackTitle.value
  )
})

const fallbackTitle = computed(() => {
  if (activeTab.value === 'user') return 'User Builder'
  if (activeTab.value === 'art') return 'Art Builder'
  return 'Builder'
})

const subtitle = computed(() => {
  if (store.activeCard) return store.activeCard.title
  if (store.allComplete) return 'Ready for final review and interaction.'

  return (
    store.splash.tagline || store.activeConfig.label || fallbackSubtitle.value
  )
})

const fallbackSubtitle = computed(() => {
  if (activeTab.value === 'user') {
    return 'Shape the human side of the Kind Robots universe.'
  }

  if (activeTab.value === 'art') {
    return 'Generate and refine artwork for the builder flow.'
  }

  return 'Choose a builder card and start shaping the project.'
})

async function syncBuilder(): Promise<void> {
  await nextTick()

  if (store.registry[activeTab.value]) {
    store.setBuilder(activeTab.value)
  }
}

function resetBuilder(): void {
  store.resetBuilder(true)
  showResetConfirm.value = false
}

watch(activeTab, syncBuilder)

onMounted(async () => {
  ensureBuildersRegistered()
  store.hydrate()
  await syncBuilder()
})
</script>

<style scoped>
.builder-feedback-enter-active,
.builder-feedback-leave-active,
.builder-modal-fade-enter-active,
.builder-modal-fade-leave-active {
  transition: all 180ms ease;
}

.builder-feedback-enter-from,
.builder-feedback-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.builder-modal-fade-enter-from,
.builder-modal-fade-leave-to {
  opacity: 0;
}
</style>
