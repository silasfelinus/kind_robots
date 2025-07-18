<template>
  <div class="w-full max-w-5xl mx-auto space-y-10">
    <div class="text-center space-y-2">
      <h2 class="text-3xl font-extrabold text-primary-content">
        🧠 Choose Your Destiny Plan
      </h2>
      <p class="text-base text-base-content/70 max-w-xl mx-auto">
        Support Kind Robots monthly and unlock whimsical wonders, priority
        magic, and maybe even a thank-you haiku.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Free Plan -->
      <div
        class="rounded-2xl border border-base-content/10 bg-base-200 shadow-md hover:shadow-xl p-6 transition-all flex flex-col justify-between"
        :class="{ 'ring-2 ring-accent': !isPatron }"
      >
        <div class="space-y-3">
          <h3 class="text-2xl font-bold text-accent-content">Free Plan 🧃</h3>
          <ul class="list-disc list-inside text-base-content/80 space-y-1">
            <li>Access to public tools</li>
            <li>Community forums</li>
            <li>Jellybeans on your birthday (probably)</li>
          </ul>
        </div>
        <div class="mt-6 text-center">
          <span class="badge badge-outline badge-accent text-sm py-2 px-4">
            Current Plan
          </span>
        </div>
      </div>

      <!-- Patron Plan -->
      <div
        class="rounded-2xl border border-primary/30 bg-base-100 shadow-lg hover:shadow-2xl p-6 transition-all flex flex-col justify-between"
        :class="{ 'ring-2 ring-primary': isPatron }"
      >
        <div class="space-y-3">
          <h3 class="text-2xl font-bold text-primary">Patron Plan 🚀</h3>
          <ul class="list-disc list-inside text-base-content/80 space-y-1">
            <li>
              <span class="font-semibold text-primary"
                >1000 monthly mana tokens</span
              >
              ⚡
            </li>
            <li>Priority support & faster AI response</li>
            <li>Private forums & exclusive content</li>
            <li>Early access to new features & models</li>
          </ul>
        </div>
        <div class="mt-6">
          <button
            v-if="!isPatron"
            class="btn btn-primary w-full rounded-2xl text-lg tracking-wide hover:brightness-110"
            @click="startSubscription"
          >
            Subscribe – $5/month
          </button>
          <button
            v-else
            class="btn btn-outline w-full rounded-2xl text-lg"
            @click="cancelSub"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>

    <div v-if="message" class="text-center text-success font-medium">
      {{ message }}
    </div>

    <div v-if="error" class="text-center text-error font-medium">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/settings/subscription-manager.vue
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'
import { ref, computed } from 'vue'

const userStore = useUserStore()
const cartStore = useCartStore()

const message = ref('')
const error = ref('')

const isPatron = computed(() => userStore.user?.isMember === true)

const startSubscription = async () => {
  try {
    if (!userStore.user?.id) throw new Error('User not logged in')
    await cartStore.subscribe(userStore.user.id)
  } catch (err: any) {
    error.value = err.message || 'Subscription failed.'
  }
}

const cancelSub = async () => {
  try {
    if (!userStore.user?.id) throw new Error('User not logged in')
    await cartStore.cancelSubscription(userStore.user.id)
    message.value = 'Subscription cancelled. Thank you for your support!'
  } catch (err: any) {
    error.value = err.message || 'Could not cancel subscription.'
  }
}
</script>
