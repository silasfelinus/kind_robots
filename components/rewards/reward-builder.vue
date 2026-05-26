<!-- components/rewards/reward-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- Header -->
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:gift" class="h-5 w-5 text-primary" />
        <h1 class="text-lg font-black tracking-tight">Reward Builder</h1>
        <span
          v-if="rewardStore.rewardForm.rewardType"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {{ String(rewardStore.rewardForm.rewardType).toLowerCase() }}
        </span>
        <span
          v-if="rewardStore.rewardForm.rarity"
          class="rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize"
          :class="rarityClass(String(rewardStore.rewardForm.rarity))"
        >
          {{ String(rewardStore.rewardForm.rarity).toLowerCase() }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="rewardStore.isSaving"
          @click="showResetConfirm = true"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-primary rounded-xl gap-1.5"
          :disabled="!canSave || rewardStore.isSaving"
          @click="doSave"
        >
          <span
            v-if="rewardStore.isSaving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:save" class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm"
      >
        <reward-sheet />
      </aside>
      <main class="flex flex-1 flex-col overflow-hidden">
        <reward-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <!-- Hand tray -->
    <reward-hand
      class="shrink-0 border-t border-base-300 bg-base-100/80 backdrop-blur-sm"
    />

    <!-- Reset confirm -->
    <Transition name="fade">
      <div
        v-if="showResetConfirm"
        class="absolute inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm"
        @click.self="showResetConfirm = false"
      >
        <div
          class="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-2xl"
        >
          <p class="mb-1 text-lg font-black">Reset reward?</p>
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

    <!-- Save feedback -->
    <Transition name="slide-up">
      <div
        v-if="saveMessage"
        class="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg"
        :class="
          saveError
            ? 'bg-error text-error-content'
            : 'bg-success text-success-content'
        "
      >
        {{ saveMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRewardBuilderStore } from '@/stores/rewardBuilderStore'
import { useRewardStore } from '@/stores/rewardStore'

const builder = useRewardBuilderStore()
const rewardStore = useRewardStore()

const isMobile = ref(false)
const showResetConfirm = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const savedRewardId = ref<number | null>(null)

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
    Boolean(rewardStore.rewardForm.text?.trim()) &&
    Boolean(rewardStore.rewardForm.power?.trim()) &&
    !rewardStore.isSaving,
)

function rarityClass(rarity: string): string {
  const map: Record<string, string> = {
    COMMON: 'border-base-300 text-base-content/50',
    UNCOMMON: 'border-green-400/50 text-green-600',
    RARE: 'border-blue-400/50 text-blue-600',
    EPIC: 'border-purple-400/50 text-purple-600',
    LEGENDARY: 'border-yellow-400/50 text-yellow-600',
    MYTHIC: 'border-red-400/50 text-red-600',
  }
  return map[rarity] ?? 'border-base-300'
}

function doReset() {
  showResetConfirm.value = false
  savedRewardId.value = null
  saveMessage.value = ''
  builder.resetBuilder()
  builder.selectCard('type')
}

async function doSave() {
  saveMessage.value = ''
  saveError.value = false
  const result = await builder.saveReward()
  if (result) {
    savedRewardId.value = result.id
    saveMessage.value = 'Reward saved.'
    saveError.value = false
  } else {
    saveMessage.value = rewardStore.error ?? 'Save failed.'
    saveError.value = true
  }
  setTimeout(() => {
    saveMessage.value = ''
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
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
