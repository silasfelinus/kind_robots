<template>
  <div class="giftshop-container bg-base-300 rounded-2xl p-4 flex flex-col">
    <!-- Header Section -->
    <div class="giftshop-header text-lg font-bold mb-4">
      Welcome to the Gift Shop!
    </div>

    <!-- Product Gallery -->
    <div class="product-gallery mb-4">
      <product-gallery />
    </div>

    <!-- Toggle Shopping Cart Button -->
    <button
      class="toggle-cart bg-primary text-lg px-2 py-1 rounded"
      @click="toggleCart"
    >
      {{ showCart ? 'Hide Cart' : 'Show Cart' }}
    </button>

    <!-- Shopping Cart -->
    <div v-if="showCart" class="shopping-cart">
      <shopping-cart />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { generateSillyName } from './../../../utils/useRandomName'

// Initialize stores
const userStore = useUserStore()
const cartStore = useCartStore()
const customerStore = useCustomerStore()

// State for toggling the cart
const showCart = ref(false)

// Function to toggle cart visibility
const toggleCart = () => {
  showCart.value = !showCart.value
}
const initStores = async () => {
  try {
    if (userStore.userId === 0) {
      const newUserResponse = await userStore.register({
        username: generateSillyName(),
      })

      if (newUserResponse?.success && newUserResponse?.user?.id) {
        const newUserId = newUserResponse.user.id

        const newCustomerResponse = await customerStore.createCustomer({
          userId: newUserId,
        })

        if (newCustomerResponse?.success && newCustomerResponse?.customerId) {
          const newCustomerId = newCustomerResponse.customerId

          const newCartResponse = await cartStore.createCart(newCustomerId)

          if (newCartResponse?.success && newCartResponse?.cartId) {
            const newCartId = newCartResponse.cartId

            localStorage.setItem('userId', newUserId.toString())
            localStorage.setItem('cartId', newCartId.toString())
          }
        }
      }
    } else {
      const existingCustomerResponse =
        await customerStore.fetchCustomerByUserId(userStore.userId)

      if (
        !existingCustomerResponse?.success ||
        !existingCustomerResponse?.customerId
      ) {
        const newCustomerResponse = await customerStore.createCustomer({
          userId: userStore.userId,
        })

        if (newCustomerResponse?.success && newCustomerResponse?.customerId) {
          const newCustomerId = newCustomerResponse.customerId

          const newCartResponse = await cartStore.createCart(newCustomerId)

          if (newCartResponse?.success && newCartResponse?.cartId) {
            const newCartId = newCartResponse.cartId

            localStorage.setItem('cartId', newCartId.toString())
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Initialization Error: ${error.message}`)
    } else {
      console.error(`Initialization Error: Unknown error`)
    }
  }
}

initStores()
</script>
