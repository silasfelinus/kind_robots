<template>
  <div ref="root" class="karma-widget relative">
    <button
      class="btn btn-sm btn-ghost gap-1 rounded-xl px-2"
      type="button"
      title="Karma"
      @click="toggle"
    >
      <span class="karma-icon text-lg leading-none">✨</span>
      <span class="font-semibold tabular-nums">{{ karmaStore.balance }}</span>
    </button>

    <Transition name="fade">
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-72 space-y-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-xl"
      >
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-medium text-base-content/70">
            {{ userStore.username }}'s Karma
          </span>
          <span class="text-2xl font-extrabold tabular-nums text-primary">
            {{ karmaStore.balance }}
          </span>
        </div>

        <p class="text-xs text-base-content/60">
          Earned by reacting, creating, sharing, and helping other Kind Robots
          users. A measure of community contribution.
        </p>

        <ul
          v-if="karmaStore.transactions.length"
          class="max-h-40 space-y-1 overflow-y-auto text-xs"
        >
          <li
            v-for="txn in karmaStore.transactions"
            :key="txn.id"
            class="flex justify-between text-base-content/70"
          >
            <span class="truncate">{{ formatReason(txn.reason) }}</span>
            <span
              class="tabular-nums"
              :class="txn.amount >= 0 ? 'text-success' : 'text-error'"
            >
              {{ txn.amount >= 0 ? '+' : '' }}{{ txn.amount }}
            </span>
          </li>
        </ul>

        <NuxtLink
          to="/wallet"
          class="btn btn-sm btn-outline btn-primary rounded-xl"
          @click="open = false"
        >
          View wallet
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useKarmaStore } from '@/stores/karmaStore'
import { useUserStore } from '@/stores/userStore'

const karmaStore = useKarmaStore()
const userStore = useUserStore()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle(): void {
  open.value = !open.value
}

function formatReason(reason: string): string {
  return reason
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function onDocumentClick(event: MouseEvent): void {
  if (!open.value) return

  if (root.value && !root.value.contains(event.target as Node)) {
    open.value = false
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => {
  karmaStore.fetch()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
