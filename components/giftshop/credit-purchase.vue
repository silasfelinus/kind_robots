<!-- /components/giftshop/credit-purchase.vue -->
<template>
  <div class="p-6 bg-base-200 rounded-2xl shadow-md text-center">
    <h2 class="text-2xl font-bold text-primary mb-4">Buy Mana</h2>
    <p class="mb-6 text-lg text-gray-500">
      Top up your mana balance to generate more AI-powered content.
    </p>

    <!-- Pricing Options -->
    <div class="grid gap-4 sm:grid-cols-3">
      <button
        v-for="tier in manaTopupTiers"
        :key="tier.id"
        class="p-4 border rounded-xl hover:bg-base-300 transition disabled:opacity-50"
        :disabled="loading"
        @click="purchaseMana(tier.id)"
      >
        <p class="text-xl font-semibold">{{ tier.label }}</p>
        <p class="text-lg text-success font-bold">${{ tier.priceUsd }}</p>
      </button>
    </div>

    <!-- Payment Processing Status -->
    <div v-if="loading" class="mt-6 text-warning">
      Redirecting to checkout...
    </div>
    <div v-if="error" class="mt-6 text-error">{{ error }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()
const loading = ref(false)
const error = ref('')

// Mirrors the trusted server-side tiers in server/api/stripe/topup.post.ts —
// the server re-validates tierId and prices; this list is display-only.
const manaTopupTiers = [
  { id: 'small', label: 'Small mana top-up', priceUsd: 5 },
  { id: 'medium', label: 'Medium mana top-up', priceUsd: 10 },
  { id: 'large', label: 'Large mana top-up', priceUsd: 25 },
]

const purchaseMana = async (tierId: string) => {
  loading.value = true
  error.value = ''
  try {
    const result = await cartStore.topup(tierId)
    if (!result.success) {
      error.value = result.message || 'Mana top-up failed. Please try again.'
    }
    // On success, cartStore.topup redirects the browser to Stripe Checkout.
  } finally {
    loading.value = false
  }
}
</script>
