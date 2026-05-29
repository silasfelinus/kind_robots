<template>
  <div class="w-full max-w-3xl mx-auto p-6 space-y-8">
    <div class="text-center space-y-2">
      <h1 class="text-3xl font-extrabold text-primary">
        ⚡ {{ userStore.username }}'s Mana Wallet
      </h1>
      <p class="text-base-content/70">
        Mana powers your art and text generations. Refills daily — top up
        anytime.
      </p>
    </div>

    <!-- Guest gate -->
    <div
      v-if="userStore.isGuest"
      class="rounded-2xl border border-accent/30 bg-base-200 p-6 text-center space-y-3"
    >
      <p class="text-base-content/80">
        You're browsing as a guest. Guests get a daily mana top-up — sign up to
        keep your balance, earn bonus mana, and unlock more. ✨
      </p>
      <NuxtLink to="/register" class="btn btn-accent rounded-xl"
        >Create an account</NuxtLink
      >
    </div>

    <template v-else>
      <!-- Balance card -->
      <div
        class="rounded-2xl border border-primary/20 bg-base-100 shadow-lg p-6 space-y-4"
      >
        <div class="flex items-end justify-between">
          <div>
            <div class="text-sm text-base-content/60">Current balance</div>
            <div class="text-5xl font-extrabold text-primary tabular-nums">
              {{ manaStore.isFamily ? '∞' : manaStore.balance }}
            </div>
          </div>
          <div v-if="!manaStore.isFamily" class="text-right">
            <div class="text-sm text-base-content/60">Daily cap</div>
            <div class="text-2xl font-bold">{{ manaStore.cap }}</div>
          </div>
        </div>

        <div v-if="!manaStore.isFamily" class="space-y-1">
          <progress
            class="progress progress-primary w-full"
            :value="manaStore.pct"
            max="100"
          />
          <div class="flex justify-between text-sm text-base-content/60">
            <span v-if="manaStore.refillReady" class="text-success font-medium">
              Refill ready on next load ✨
            </span>
            <span v-else>Next refill in {{ manaStore.refillCountdown }}</span>
          </div>
        </div>

        <p v-else class="text-sm text-base-content/60">
          Family plan — unlimited generations on house tokens. 🏡
        </p>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <NuxtLink
            to="/subscriptions"
            class="btn btn-primary rounded-xl flex-1"
          >
            Get more mana 🚀
          </NuxtLink>
          <button
            class="btn btn-ghost rounded-xl"
            :disabled="manaStore.loading"
            @click="manaStore.fetch()"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- BYO hint -->
      <div class="rounded-xl bg-base-200 p-4 text-sm text-base-content/70">
        💡 Using your own API key or local server? Those generations are free —
        and sharing what you make can earn you bonus mana.
      </div>

      <!-- Spend log -->
      <div class="space-y-3">
        <h2 class="text-xl font-bold">Recent activity</h2>
        <div v-if="manaStore.loading" class="text-base-content/50">
          Loading…
        </div>
        <div
          v-else-if="!manaStore.transactions.length"
          class="text-base-content/50"
        >
          No transactions yet. Go make something! 🎨
        </div>
        <ul
          v-else
          class="divide-y divide-base-content/10 rounded-xl border border-base-content/10 overflow-hidden"
        >
          <li
            v-for="t in manaStore.transactions"
            :key="t.id"
            class="flex items-center justify-between px-4 py-3 bg-base-100"
          >
            <div class="space-y-0.5">
              <div class="text-sm font-medium">{{ label(t.reason) }}</div>
              <div class="text-xs text-base-content/50">
                {{ when(t.createdAt) }}
              </div>
            </div>
            <span
              class="font-bold tabular-nums"
              :class="t.amount >= 0 ? 'text-success' : 'text-error'"
            >
              {{ t.amount >= 0 ? '+' : '' }}{{ t.amount }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// /pages/wallet.vue
import { onMounted } from 'vue'
import { useManaStore } from '@/stores/manaStore'
import { useUserStore } from '@/stores/userStore'

const manaStore = useManaStore()
const userStore = useUserStore()

const LABELS: Record<string, string> = {
  SIGNUP_BONUS: '🎁 Signup bonus',
  CYCLE_REFILL: '🔄 Daily refill',
  GENERATION_ART: '🎨 Art generation',
  GENERATION_TEXT: '✍️ Text generation',
  SOCIAL_REACTION: '💬 Reaction reward',
  SOCIAL_SHARE: '📤 Sharing reward',
  BOUNTY_CREATE: '🎯 Bounty created',
  BOUNTY_REWARD: '🏆 Bounty reward',
  PURCHASE: '💳 Purchase',
  SUBSCRIPTION_GRANT: '🚀 Subscription grant',
  ADMIN_REFUND: '🔧 Admin refund',
  ADJUSTMENT: '⚙️ Adjustment',
}

const label = (r: string) => LABELS[r] || r
const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

onMounted(() => {
  manaStore.fetch()
})
</script>
