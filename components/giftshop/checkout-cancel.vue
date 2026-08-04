<!-- /components/giftshop/checkout-cancel.vue -->
<template>
  <section
    class="mx-auto flex h-full min-h-0 max-w-3xl flex-col items-center justify-center gap-5 overflow-y-auto px-4 py-8 text-center"
  >
    <div
      class="w-full rounded-3xl border border-warning/40 bg-base-100 p-6 shadow-lg sm:p-10"
    >
      <Icon name="kind-icon:cart" class="mx-auto h-14 w-14 text-warning" />

      <h1 class="mt-4 text-3xl font-black text-base-content">
        Checkout cancelled
      </h1>

      <p class="mx-auto mt-3 max-w-xl text-base-content/70">
        Stripe did not complete a charge. Your cart is still here, exactly as
        you left it.
      </p>

      <div
        v-if="cartStore.hasItems"
        class="mx-auto mt-5 w-fit rounded-2xl border border-base-300 bg-base-200 px-5 py-3"
      >
        <div class="text-xs font-black uppercase tracking-widest text-base-content/50">
          Cart preserved
        </div>
        <div class="text-2xl font-black text-primary">
          {{ cartStore.totalItems }} item{{ cartStore.totalItems === 1 ? '' : 's' }} ·
          ${{ cartStore.formattedTotalPrice }}
        </div>
      </div>

      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <NuxtLink to="/cart" class="btn btn-primary rounded-2xl">
          <Icon name="kind-icon:cart" class="h-4 w-4" />
          Return to cart
        </NuxtLink>

        <NuxtLink to="/sanctuary" class="btn btn-outline rounded-2xl">
          Continue browsing
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()

onMounted(() => {
  void cartStore.initialize()
})
</script>
