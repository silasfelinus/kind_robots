<!-- /components/navigation/cart-button.vue -->
<template>
  <button
    v-if="cartStore.hasItems"
    type="button"
    class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-primary/40 bg-primary/10 text-primary"
    :aria-label="cartLabel"
    :title="cartLabel"
    @click="openCart"
  >
    <span class="indicator">
      <Icon name="kind-icon:cart" class="h-5 w-5" />
      <span class="badge indicator-item badge-secondary badge-xs">
        {{ compactItemCount }}
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()
const router = useRouter()

const compactItemCount = computed(() =>
  cartStore.totalItems > 99 ? '99+' : String(cartStore.totalItems),
)

const cartLabel = computed(() => {
  const noun = cartStore.totalItems === 1 ? 'item' : 'items'
  return `Open cart: ${cartStore.totalItems} ${noun}, $${cartStore.formattedTotalPrice}`
})

onMounted(() => {
  void cartStore.initialize()
})

function openCart(): void {
  void router.push('/cart')
}
</script>
