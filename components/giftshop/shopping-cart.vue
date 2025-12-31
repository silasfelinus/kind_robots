<!-- /components/content/shop/shopping-cart.vue -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold">🛒 Your Cart</h2>
      <button
        class="btn btn-sm btn-outline btn-error"
        v-if="cartStore.hasItems"
        @click="cartStore.clearCart"
      >
        ❌ Clear Cart
      </button>
    </div>

    <div v-if="!cartStore.hasItems" class="text-center text-base-content/70">
      Your cart is empty. Add something magical ✨
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in cartStore.items"
        :key="item.id"
        class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-base-200 border border-base-300 rounded-2xl"
      >
        <img
          :src="item.imageUrl"
          class="w-24 h-24 object-contain rounded-xl border bg-base-100"
        />

        <div class="flex-1 space-y-1">
          <div class="text-lg font-semibold">{{ item.notes }}</div>
          <div class="text-sm text-base-content/70">Type: {{ item.type }}</div>
          <div class="text-sm text-base-content/70">
            ${{ item.price.toFixed(2) }} ×
            <input
              type="number"
              class="input input-sm w-20 ml-1"
              min="1"
              v-model.number="quantities[item.id]"
              @change="updateQuantity(item)"
            />
            =
            <span class="font-medium">
              ${{ (item.price * quantities[item.id]).toFixed(2) }}
            </span>
          </div>
        </div>

        <button
          class="btn btn-sm btn-outline btn-error self-start sm:self-center"
          @click="cartStore.removeItem(item.id)"
        >
          🗑 Remove
        </button>
      </div>

      <div class="text-right text-lg font-semibold">
        Total: ${{ cartStore.totalPrice.toFixed(2) }}
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
// /components/content/shop/shopping-cart.vue
import { reactive } from 'vue'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

function checkout() {
  if (!userStore.userId) {
    alert('You must be logged in to check out.')
    return
  }
  cartStore.checkout(userStore.userId)
}


const cartStore = useCartStore()

const quantities = reactive<Record<string, number>>(
  Object.fromEntries(cartStore.items.map((item) => [item.id, item.quantity]))
)

function updateQuantity(item: typeof cartStore.items[number]) {
  const qty = quantities[item.id]
  cartStore.updateQuantity(item.id, qty)
}


</script>
