<!-- /components/content/story/credit-purchase.vue -->
<template>
  <div class="p-6 bg-base-200 rounded-2xl shadow-md text-center">
    <h2 class="text-2xl font-bold text-primary mb-4">Buy Credits</h2>
    <p class="mb-6 text-lg text-gray-500">
      Purchase credits to generate more AI-powered stories.
    </p>

    <!-- Pricing Options -->
    <div class="grid gap-4 sm:grid-cols-3">
      <button
        v-for="option in creditOptions"
        :key="option.amount"
        class="p-4 border rounded-xl hover:bg-base-300 transition"
        @click="purchaseCredits(option.amount, option.price)"
      >
        <p class="text-xl font-semibold">{{ option.amount }} Credits</p>
        <p class="text-lg text-success font-bold">${{ option.price }}</p>
      </button>
    </div>

    <!-- Payment Processing Status -->
    <div v-if="loading" class="mt-6 text-warning">Processing payment...</div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(false)

// Credit Purchase Options
const creditOptions = [
  { amount: 50, price: 5 },
  { amount: 200, price: 18 },
  { amount: 500, price: 40 },
]

// Simulated Purchase Function
const purchaseCredits = async (amount: number, price: number) => {
  loading.value = true
  try {
    // Simulate API call or Stripe payment
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Fake delay
    alert(`Successfully purchased ${amount} credits for $${price}`)
    // Here, you'd update the store with the new credits
  } catch (error) {
    console.error('Payment failed:', error)
    alert('Payment failed. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>
