<template>
  <div class="bg-base-300 rounded-2xl p-4">
    <h1 class="text-lg">Your Cart</h1>
    <div v-for="item in cartItems" :key="item.id">
      <CartItem :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCartStore, type CartItem } from './../../../stores/cartStore'

const cartStore = useCartStore()

// Ensure cartItems is correctly typed as CartItem[]
const cartItems = ref<CartItem[]>([])

onMounted(async () => {
  await cartStore.fetchItemsByCartId(1) // Replace 1 with the actual cart ID
  cartItems.value = cartStore.cartItems
})
</script>
