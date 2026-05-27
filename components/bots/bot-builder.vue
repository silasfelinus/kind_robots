<!-- components/bots/bot-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:robot" class="h-5 w-5 text-primary" />
        <h1 class="text-lg font-black tracking-tight">Bot Builder</h1>
        <span
          v-if="botStore.botForm.BotType"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {{ botStore.botForm.BotType }}
        </span>
        <span
          v-if="botStore.botForm.underConstruction"
          class="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning"
        >
          under construction
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="builder.isSaving"
          @click="showResetConfirm = true"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-primary rounded-xl gap-1.5"
          :disabled="!canSave || builder.isSaving"
          @click="doSave"
        >
          <span
            v-if="builder.isSaving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:save" class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm"
      >
        <bot-sheet />
      </aside>
      <main class="flex flex-1 flex-col overflow-hidden">
        <bot-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <bot-hand
      class="shrink-0 border-t border-base-300 bg-base-100/80 backdrop-blur-sm"
    />

    <Transition name="fade">
      <div
        v-if="showResetConfirm"
        class="absolute inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm"
        @click.self="showResetConfirm = false"
      >
        <div
          class="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-2xl"
        >
          <p class="mb-1 text-lg font-black">Reset bot?</p>
          <p class="mb-6 text-sm text-base-content/60">
            Clears everything and starts fresh.
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="btn btn-outline rounded-xl"
              @click="showResetConfirm = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-error rounded-xl"
              @click="doReset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="feedback"
        class="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg"
        :class="
          isError
            ? 'bg-error text-error-content'
            : 'bg-success text-success-content'
        "
      >
        {{ feedback }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBotBuilderStore } from '@/stores/botBuilderStore'
import { useBotStore } from '@/stores/botStore'

const builder = useBotBuilderStore()
const botStore = useBotStore()

const isMobile = ref(false)
const showResetConfirm = ref(false)
const feedback = ref('')
const isError = ref(false)

function updateBreakpoint() {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  builder.restoreState()
  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('type')
  }
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})

onBeforeUnmount(() => window.removeEventListener('resize', updateBreakpoint))

const canSave = computed(
  () =>
    Boolean(botStore.botForm.name?.trim()) &&
    Boolean(botStore.botForm.prompt?.trim()) &&
    !builder.isSaving,
)

function doReset() {
  showResetConfirm.value = false
  builder.resetBuilder()
  builder.selectCard('type')
}

async function doSave() {
  feedback.value = ''
  const result = await builder.saveBot()
  if (result.success && result.data) {
    feedback.value = 'Bot saved.'
    isError.value = false
  } else {
    feedback.value = builder.lastError ?? result.message ?? 'Save failed.'
    isError.value = true
  }
  setTimeout(() => {
    feedback.value = ''
  }, 3000)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.slide-up-leave-active {
  transition: opacity 150ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
