<template>
  <div class="container">
    <h1>General Manager</h1>

    <!-- Display Products -->
    <div class="products">
      <h2>Products</h2>
      <button @click="fetchProducts">Fetch Products</button>
      <ul>
        <li v-for="product in products" :key="product.id">
          {{ product.name }} - {{ product.costInPennies }}
          <button @click="addToCart(product.id)">Add to Cart</button>
        </li>
      </ul>
    </div>

    <!-- Display Cart -->
    <div class="cart">
      <h2>Cart</h2>
      <button @click="fetchCartItems">Fetch Cart Items</button>
      <ul>
        <li v-for="item in cartItems" :key="item.productId">
          Product ID: {{ item.productId }} - Quantity: {{ item.quantity }}
          <button @click="removeFromCart(item.productId)">Remove</button>
        </li>
      </ul>
    </div>

    <!-- Display Customer -->
    <div class="customer">
      <h2>Customer</h2>
      <button @click="fetchCustomer">Fetch Customer</button>
      <p>ID: {{ customer.id }}</p>
      <p>Email: {{ customer.email }}</p>
      <p>Name: {{ customer.name }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCartStore } from '@/stores/cartStore'
import { useCustomerStore } from '@/stores/customerStore'
import { useProductStore } from '@/stores/productStore'
import { useUserStore } from '@/stores/userStore' // Import userStore
import { errorHandler } from '@/server/api/utils/error' // Import errorHandler

const cartStore = useCartStore()
const customerStore = useCustomerStore()
const productStore = useProductStore()
const userStore = useUserStore() // Initialize userStore
// Fetch products from the database
const fetchProducts = async () => {
  await productStore.fetchProducts()
}

// Fetch cart items for a customer
const fetchCartItems = async () => {
  await cartStore.fetchCartItems(customerStore.id)
}

// Fetch customer by email
const fetchCustomer = async () => {
  await customerStore.fetchCustomerByEmail('test@email.com')
}

// Add a product to the cart
const addToCart = (productId: number) => {
  cartStore.addItem(productId)
}

// Remove a product from the cart
const removeFromCart = (productId: number) => {
  cartStore.removeItem(productId)
}

const products = productStore.products
const cartItems = cartStore.items
const customer = ref({
  id: customerStore.id,
  email: customerStore.email,
  name: customerStore.name
})

// Fetch customer by userId on component mount
onMounted(async () => {
  try {
    const userId = userStore.userId
    if (userId) {
      await customerStore.fetchCustomerByUserId(userId)
    }
  } catch (error) {
    errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
})
</script>

<style scoped>
/* Responsive layout styles */
.container {
  max-width: 1200px;
  margin: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }

  .products,
  .cart,
  .customer {
    flex: 1;
  }
}
</style>
