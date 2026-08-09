<template>
  <div class="kr-unbound kr-container max-w-3xl p-6 space-y-8">
    <div
      v-if="userStore.isGuest"
      class="rounded-2xl border border-accent/30 bg-(--kr-surface) p-6 text-center space-y-3"
    >
      <p class="text-base-content/80">
        You're browsing as a guest. Sign up to keep a karma and mana balance
        that follows your account. ✨
      </p>
      <NuxtLink to="/register" class="btn btn-accent rounded-xl"
        >Create an account</NuxtLink
      >
    </div>

    <template v-else>
      <section
        class="rounded-2xl border border-primary/20 bg-base-100 shadow-lg p-6 space-y-4"
      >
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-sm text-base-content/60">Karma</h2>
            <div class="text-5xl font-extrabold text-primary tabular-nums">
              {{ karmaStore.balance }}
            </div>
          </div>
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            :disabled="karmaStore.loading"
            @click="karmaStore.fetch()"
          >
            Refresh
          </button>
        </div>

        <p class="text-sm text-base-content/60">
          Earned by reacting, creating, sharing, and helping other Kind Robots
          users — a running score of your community contribution.
        </p>

        <div v-if="karmaStore.loading" class="text-base-content/50 text-sm">
          Loading…
        </div>
        <div
          v-else-if="!karmaStore.transactions.length"
          class="text-base-content/50 text-sm"
        >
          No karma activity yet. Go react, create, and share! 🌱
        </div>
        <ul
          v-else
          class="divide-y divide-base-content/10 rounded-xl border border-base-content/10 overflow-hidden"
        >
          <li
            v-for="txn in karmaStore.transactions"
            :key="txn.id"
            class="flex items-center justify-between px-4 py-3 bg-base-100"
          >
            <div class="space-y-0.5">
              <div class="text-sm font-medium">
                {{ formatReason(txn.reason) }}
              </div>
              <div class="text-xs text-base-content/50">
                {{ formatWhen(txn.createdAt) }}
              </div>
            </div>
            <span
              class="font-bold tabular-nums"
              :class="txn.amount >= 0 ? 'text-success' : 'text-error'"
            >
              {{ txn.amount >= 0 ? '+' : '' }}{{ txn.amount }}
            </span>
          </li>
        </ul>
      </section>

      <mana-wallet />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useKarmaStore } from '@/stores/karmaStore'
import { useUserStore } from '@/stores/userStore'

const karmaStore = useKarmaStore()
const userStore = useUserStore()

function formatReason(reason: string): string {
  return reason
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

onMounted(() => {
  karmaStore.fetch()
})
</script>