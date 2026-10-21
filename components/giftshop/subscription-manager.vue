<template>
  <div class="kr-container max-w-5xl space-y-10">
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
          <h3 class="kr-text-bold-2xl text-accent-content">Free Plan 🧃</h3>
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
          <h3 class="kr-text-bold-2xl text-primary">Patron Plan 🚀</h3>
          <ul class="list-disc list-inside text-base-content/80 space-y-1">
            <li>
              <span class="font-semibold text-primary"
                >1,000 paid tokens each month</span
              >
              ⚡
            </li>
            <li>Credited after each successful monthly payment</li>
            <li>Help support the creation of new worlds and stories</li>
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
          <p
            v-else-if="scheduledEnd"
            class="text-center text-sm text-base-content/80"
          >
            Renewal cancelled. Your Patron access continues until
            <strong>{{ scheduledEnd }}</strong>.
          </p>
          <button
            v-else
            class="btn btn-outline w-full rounded-2xl text-lg"
            @click="cancelSub"
          >
            Cancel renewal at period end
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

const isPatron = computed(() => userStore.isMember)
const scheduledEnd = computed(() => {
  const member = userStore.user
  if (!isPatron.value || !member?.stripeSubscriptionId || !member.memberUntil)
    return ''
  const date = new Date(member.memberUntil)
  if (!Number.isFinite(date.getTime()) || date <= new Date()) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
})

const startSubscription = async () => {
  try {
    if (!userStore.user?.id) throw new Error('User not logged in')
    await cartStore.subscribe()
  } catch (err: any) {
    error.value = err.message || 'Subscription failed.'
  }
}

const cancelSub = async () => {
  try {
    if (!userStore.user?.id) throw new Error('User not logged in')
    const result = await cartStore.cancelSubscription()
    if (!result.success) throw new Error(result.message)
    if (!result.endsAt) throw new Error('Cancellation date was not returned')
    userStore.user.memberUntil = new Date(result.endsAt)
    message.value = 'Renewal cancelled. Your existing Patron access stays active through the paid period.'
  } catch (err: any) {
    error.value = err.message || 'Could not cancel subscription.'
  }
}
</script>
