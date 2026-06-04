<template>
  <div ref="root" class="relative">
    <!-- Trigger: compact balance pill -->
    <button
      class="btn btn-sm btn-ghost gap-2 rounded-full"
      :class="{ 'animate-pulse': manaStore.refillReady && !manaStore.isFamily }"
      @click="toggle"
    >
      <span class="text-lg leading-none">⚡</span>
      <span class="font-semibold tabular-nums">
        {{ manaStore.isFamily ? '∞' : manaStore.balance }}
      </span>
    </button>

    <!-- Dropdown menu -->
    <Transition name="fade">
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-72 rounded-2xl border border-base-content/10 bg-base-100 shadow-xl p-4 z-50 space-y-3"
      >
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-medium text-base-content/70">
            {{ userStore.username }}'s Mana
          </span>
          <span class="text-2xl font-extrabold text-primary tabular-nums">
            {{ manaStore.isFamily ? '∞' : manaStore.balance }}
          </span>
        </div>

        <!-- Balance bar -->
        <div v-if="!manaStore.isFamily" class="space-y-1">
          <progress
            class="progress progress-primary w-full"
            :value="manaStore.pct"
            max="100"
          />
          <div class="flex justify-between text-xs text-base-content/60">
            <span>{{ manaStore.balance }} / {{ manaStore.cap }}</span>
            <span v-if="manaStore.refillReady" class="text-success font-medium">
              Refill ready ✨
            </span>
            <span v-else>Refills in {{ manaStore.refillCountdown }}</span>
          </div>
        </div>

        <p v-else class="text-xs text-base-content/60">
          Family plan — unlimited generations on house tokens. 🏡
        </p>

        <div class="pt-1 flex flex-col gap-2">
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
// /components/giftshop/mana-widget.vue
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useManaStore } from '@/stores/manaStore'
import { useUserStore } from '@/stores/userStore'

const manaStore = useManaStore()
const userStore = useUserStore()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target as Node)) {
    open.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
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
