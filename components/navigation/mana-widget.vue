<template>
  <div ref="root" class="mana-widget relative">
    <button
      class="btn btn-sm btn-ghost gap-1 rounded-xl px-2"
      :class="{ 'animate-pulse': manaStore.refillReady && !manaStore.isFamily }"
      type="button"
      title="Mana"
      @click="toggle"
    >
      <span class="mana-icon text-lg leading-none">⚡</span>
      <span class="font-semibold tabular-nums">
        {{ manaStore.isFamily ? '∞' : manaStore.balance }}
      </span>
    </button>

    <Transition name="fade">
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-72 space-y-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-xl"
      >
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-medium text-base-content/70">
            {{ userStore.username }}'s Mana
          </span>
          <span class="text-2xl font-extrabold tabular-nums text-primary">
            {{ manaStore.isFamily ? '∞' : manaStore.balance }}
          </span>
        </div>

        <div v-if="!manaStore.isFamily" class="space-y-1">
          <progress
            class="progress progress-primary w-full"
            :value="manaStore.pct"
            max="100"
          />
          <div class="flex justify-between text-xs text-base-content/60">
            <span>{{ manaStore.balance }} / {{ manaStore.cap }}</span>
            <span v-if="manaStore.refillReady" class="font-medium text-success">
              Refill ready ✨
            </span>
            <span v-else>Refills in {{ manaStore.refillCountdown }}</span>
          </div>
        </div>

        <p v-else class="text-xs text-base-content/60">
          Family plan — unlimited generations on house tokens. 🏡
        </p>

        <div class="flex flex-col gap-2 pt-1">
          <NuxtLink
            to="/wallet"
            class="btn btn-sm btn-outline btn-primary rounded-xl"
            @click="open = false"
          >
            View wallet
          </NuxtLink>
          <NuxtLink
            to="/subscriptions"
            class="btn btn-sm btn-primary rounded-xl"
            @click="open = false"
          >
            Get more mana 🚀
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useManaStore } from '@/stores/manaStore'
import { useUserStore } from '@/stores/userStore'

const manaStore = useManaStore()
const userStore = useUserStore()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle(): void {
  open.value = !open.value
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
  manaStore.fetch()
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
