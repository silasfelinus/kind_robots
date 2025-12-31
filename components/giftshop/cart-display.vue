<!-- /components/content/shop/cart-display.vue -->
<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-xl font-bold">🛍️ Your Cart</h3>
      <button class="btn btn-sm btn-ghost" @click="cartStore.clearCart">
        ❌ Clear All
      </button>
    </div>

    <div v-if="!cartStore.hasItems" class="text-base-content text-center">
      Your cart is empty. Go print something rad.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in cartStore.items"
        :key="item.id"
        class="flex items-center gap-4 bg-base-200 rounded-xl p-4 border border-base-300"
      >
        <img
          :src="item.imageUrl"
          class="w-16 h-16 object-cover rounded-md border"
        />

        <div class="flex-1">
          <div class="font-semibold capitalize">{{ item.type }}</div>
          <div class="text-sm text-base-content/70">
            Image ID: {{ item.artImageId }}
          </div>
          <input
            type="number"
            min="1"
            class="input input-sm input-bordered w-24 mt-1"
            v-model.number="quantities[item.id]"
            @change="updateQuantity(item.id)"
          />
        </div>

        <button
          class="btn btn-sm btn-outline btn-error"
          @click="cartStore.removeItem(item.id)"
        >
          🗑 Remove
        </button>
      </div>

      <div class="text-right font-semibold">
        Total Items: {{ cartStore.totalItems }}
      </div>

      <div class="flex justify-end">
        <button class="btn btn-primary" @click="checkout">
          💳 Proceed to Checkout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore'
import { reactive } from 'vue'

const cartStore = useCartStore()
const quantities = reactive<Record<string, number>>(
  Object.fromEntries(cartStore.items.map((item) => [item.id, item.quantity])),
)

function updateQuantity(id: string) {
  const qty = quantities[id]
  cartStore.updateQuantity(id, qty)
}

function checkout() {
  // You can replace this with Stripe or your real checkout logic
  console.log('🧾 Checkout payload:', cartStore.items)
  alert('Pretend we’re checking out now. 🚀')
}
</script>
