<!-- /components/content/shop/giftshop-browser.vue -->
<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-center">🎁 Welcome to the Gift Shop</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in cartItems"
        :key="item.id"
        class="bg-base-200 border border-base-300 rounded-2xl p-4 flex flex-col gap-3"
      >
        <!-- Image or Upload -->
        <div v-if="item.needsArt">
          <label class="label font-semibold">🎨 Upload Your Art</label>
          <image-upload v-model="customImages[item.id]" />
        </div>
        <img
          v-else
          :src="item.image"
          class="w-full h-40 object-contain rounded-xl border bg-base-100"
        />

        <!-- Info -->
        <div class="text-lg font-semibold">{{ item.label }}</div>
        <div class="text-sm text-base-content/70">{{ item.description }}</div>

        <!-- Price and Mana -->
        <div class="flex flex-col gap-1">
          <div class="text-sm font-medium">💰 ${{ item.price.toFixed(2) }}</div>
        </div>

        <!-- Quantity -->
        <div class="form-control">
          <label class="label font-semibold">🛒 Quantity</label>
          <input
            v-model.number="quantities[item.id]"
            type="number"
            min="1"
            class="input input-sm input-bordered w-24"
          />
        </div>

        <!-- Add to Cart -->
        <button
          class="btn btn-primary btn-sm mt-auto"
          :disabled="item.needsArt && !customImages[item.id]"
          @click="addToCart(item)"
        >
          ➕ Add to Cart
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/shop/giftshop-browser.vue
import { ref, reactive } from 'vue'
import { cartItems, type CartItem } from '@/stores/seeds/cartItems'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()

// track image overrides for items that need art
const customImages = reactive<Record<string, string>>({})
const quantities = reactive<Record<string, number>>(
  Object.fromEntries(cartItems.map((item) => [item.id, 1])),
)

function addToCart(item: CartItem) {
  const quantity = quantities[item.id] || 1
  const imageUrl = item.needsArt ? customImages[item.id] : item.image

  const payload = {
    id: `${item.id}-${Date.now()}`, // unique cart entry ID
    type: item.type,
    artImageId: 0,
    imageUrl,
    quantity,
    price: item.price,
    notes: item.label,
  }

  cartStore.addItem(payload)
  alert(`Added ${quantity} × ${item.label} to cart.`)
}
</script>
