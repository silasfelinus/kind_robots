<template>
  <div v-if="product && cartItem" class="cart-item bg-base-200 rounded-2xl p-4 flex flex-col">
    <!-- Pass the product to the ProductCard component -->
    <ProductCard :product="product" />

    <!-- Cart specific actions -->
    <div class="cart-item-actions flex items-center mt-2">
      <button class="bg-warning text-lg px-2 py-1 rounded" @click="decrementQuantity">-</button>
      <div class="quantity text-lg mx-2">
        {{ cartItem.quantity }}
      </div>
      <button class="bg-primary text-lg px-2 py-1 rounded" @click="incrementQuantity">+</button>
      <button class="bg-accent text-lg px-2 py-1 rounded ml-4" @click="removeFromCart">
        Remove
      </button>
    </div>
  </div>
  <div v-else class="bg-warning rounded-2xl p-4 text-lg">Loading or item not available...</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCartStore } from '@/stores/cartStore'
import { useProductStore, Product } from '@/stores/productStore' // Import Product type
import { errorHandler } from '@/server/api/utils/error'

// Define the prop type for 'item'
const props = defineProps<{
  item: {
    id: number
    cartId: number
    productId: number
    quantity: number
  }
}>()

const cartItem = ref(props.item) // Initialize cartItem with the passed 'item' prop
const cartStore = useCartStore()
const productStore = useProductStore()

// Fetch the product based on cartItem's productId
const product = ref<Product | null>(null) // Initialize to null
watch(
  () => cartItem.value.productId,
  (newProductId) => {
    product.value = productStore.getProductById(newProductId)
  }
)
const incrementQuantity = async () => {
  try {
    await cartStore.addItem(cartItem.value.productId, cartItem.value.quantity + 1)
  } catch (error: any) {
    errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
}

const decrementQuantity = async () => {
  try {
    if (cartItem.value.quantity > 1) {
      await cartStore.updateCartItem(cartItem.value.id, { quantity: cartItem.value.quantity - 1 })
    }
  } catch (error: any) {
    errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
}

const removeFromCart = async () => {
  try {
    await cartStore.deleteCartItem(cartItem.value.id)
  } catch (error: any) {
    errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
}
</script>

<style scoped>
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--bg-base-200);
  border-radius: var(--rounded-2xl);
}
</style>
