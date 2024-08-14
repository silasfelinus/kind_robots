<template>
  <div class="bg-base-200 rounded-2xl p-4">
    <h1 class="text-lg">Products</h1>
    <div v-for="product in products" :key="product.id">
      <ProductCard :product="product" />
    </div>
  </div>
</template>

<script setup>
import { useProductStore } from '@/stores/productStore'

const productStore = useProductStore()
const products = computed(() => productStore.products)
</script>
