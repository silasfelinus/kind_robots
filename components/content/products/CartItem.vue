<template>
  <div
    v-if="product && cartItem"
    class="cart-item bg-base-200 rounded-2xl p-4 flex flex-col"
  >
    <!-- Pass the product to the ProductCard component -->
    <ProductCard :product="product" />

    <!-- Cart specific actions -->
    <div class="cart-item-actions flex items-center mt-2">
      <button
        class="bg-warning text-lg px-2 py-1 rounded"
        @click="decrementQuantity"
      >
        -
      </button>
      <div class="quantity text-lg mx-2">
        {{ cartItem.quantity }}
      </div>
      <button
        class="bg-primary text-lg px-2 py-1 rounded"
        @click="incrementQuantity"
      >
        +
      </button>
      <button
        class="bg-accent text-lg px-2 py-1 rounded ml-4"
        @click="removeFromCart"
      >
        Remove
      </button>
    </div>
  </div>
  <div v-else class="bg-warning rounded-2xl p-4 text-lg">
    Loading or item not available...
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  item: {
    id: number
    cartId: number
    productId: number
    quantity: number
  }
}>()

const cartItem = ref(props.item)
const cartStore = useCartStore()
const productStore = useProductStore()
const errorStore = useErrorStore() // Initialize errorStore

const product = ref<Product | null>(null)
watch(
  () => cartItem.value.productId,
  (newProductId) => {
    product.value = productStore.getProductById(newProductId)
  },
)

const incrementQuantity = async () => {
  try {
    await cartStore.addItem(
      cartItem.value.productId,
      cartItem.value.quantity + 1,
    )
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
  }
}

const decrementQuantity = async () => {
  try {
    if (cartItem.value.quantity > 1) {
      await cartStore.updateCartItem(cartItem.value.id, {
        quantity: cartItem.value.quantity - 1,
      })
    }
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
  }
}

const removeFromCart = async () => {
  try {
    await cartStore.deleteCartItem(cartItem.value.id)
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
  }
}
</script>
