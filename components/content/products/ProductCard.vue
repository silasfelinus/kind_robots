<template>
  <div class="product-card bg-base-200 rounded-2xl p-4 flex flex-col">
    <div class="product-header flex items-center justify-between mb-2">
      <div class="product-title text-lg font-bold">
        {{ product.title }}
      </div>
      <div class="product-price text-info">{{ product.costInPennies }} Pennies</div>
    </div>
    <div class="product-info">
      <div class="product-category text-sm text-accent">Category: {{ product.category }}</div>
      <div class="product-flavor text-sm text-warning">
        {{ product.flavorText }}
      </div>
      <div class="product-description text-sm text-info">
        {{ product.description }}
      </div>
    </div>
    <div class="product-actions flex items-center mt-2">
      <button class="bg-primary text-lg px-2 py-1 rounded" @click="addToCart(product.id)">Add to Cart</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { type Product } from '@/stores/productStore';

const props = defineProps<{
  product: Product;
}>();

const { product } = props;
const cartStore = useCartStore();
const cartId = computed(() => cartStore.carts[0]?.id); // Added optional chaining

const addToCart = (productId: number) => {
  if (cartId.value) {
    // Added a check for cartId
    cartStore.addItem(productId, cartId.value);
  }
};
</script>
