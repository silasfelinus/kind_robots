<!-- /components/content/shop/shopping-cart.vue -->
<template>
  <section class="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-black text-primary">
          <Icon name="kind-icon:cart" class="h-7 w-7" />
          Your Cart
        </h1>
        <p class="mt-1 text-sm text-base-content/65">
          Review everything here before Stripe opens its secure checkout.
        </p>
      </div>

      <button
        v-if="cartStore.hasItems"
        type="button"
        class="btn btn-sm btn-outline btn-error rounded-2xl"
        :disabled="cartStore.loading"
        @click="cartStore.clearCart"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
        Clear cart
      </button>
    </div>

    <div
      v-if="cartStore.initializing"
      class="rounded-2xl border border-info/30 bg-info/10 p-8 text-center text-info"
    >
      <Icon name="kind-icon:spinner" class="mx-auto h-8 w-8 animate-spin" />
      <p class="mt-2 font-bold">Gathering the cart butterflies...</p>
    </div>

    <div
      v-else-if="!cartStore.hasItems"
      class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center"
    >
      <Icon name="kind-icon:cart" class="mx-auto h-10 w-10 text-base-content/35" />
      <p class="mt-3 text-lg font-black text-base-content">Your cart is empty.</p>
      <p class="mt-1 text-sm text-base-content/60">
        The butterflies have returned the receipt printer to sleep mode.
      </p>
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <NuxtLink to="/sanctuary" class="btn btn-primary rounded-2xl">
          Browse the giftshop
        </NuxtLink>
        <NuxtLink to="/giving" class="btn btn-outline rounded-2xl">
          Support Against Malaria
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <div class="space-y-4">
        <article
          v-for="item in cartStore.items"
          :key="item.id"
          class="flex flex-col gap-4 kr-panel-flat p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <img
            :src="item.imageUrl"
            :alt="item.notes || item.type"
            class="h-24 w-24 rounded-xl border border-base-300 bg-base-200 object-contain"
          />

          <div class="min-w-0 flex-1 space-y-2">
            <div>
              <h2 class="text-lg font-black text-base-content">
                {{ item.notes || itemLabel(item.type) }}
              </h2>
              <p v-if="item.type === 'donation'" class="text-xs text-base-content/60">
                Collected through Kind Robots Stripe checkout and recorded as an
                AMF-designated amount for separate remittance.
              </p>
              <p
                v-else-if="item.artImageId > 0"
                class="text-xs text-base-content/55"
              >
                Artwork #{{ item.artImageId }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="font-semibold">${{ item.price.toFixed(2) }}</span>
              <span class="text-base-content/45">×</span>
              <label class="sr-only" :for="`quantity-${item.id}`">Quantity</label>
              <input
                :id="`quantity-${item.id}`"
                v-model.number="quantities[item.id]"
                type="number"
                min="1"
                max="25"
                class="input input-sm input-bordered w-20"
                :disabled="cartStore.loading"
                @change="updateQuantity(item.id, item.quantity)"
              />
              <span class="text-base-content/45">=</span>
              <span class="font-black text-primary">
                ${{ lineTotal(item).toFixed(2) }}
              </span>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-ghost text-error sm:self-center"
            :disabled="cartStore.loading"
            @click="cartStore.removeItem(item.id)"
          >
            <Icon name="kind-icon:trash" class="h-4 w-4" />
            Remove
          </button>
        </article>
      </div>

      <div class="rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div class="text-xs font-black uppercase tracking-widest text-base-content/50">
              Cart total
            </div>
            <div class="text-4xl font-black text-primary">
              ${{ cartStore.formattedTotalPrice }}
            </div>
            <p class="mt-1 text-xs text-base-content/55">
              Prices are validated again on the server. The browser cannot set
              its own Stripe price.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-lg rounded-2xl"
            :disabled="cartStore.loading"
            @click="checkout"
          >
            <Icon
              :name="cartStore.loading ? 'kind-icon:spinner' : 'kind-icon:card'"
              class="h-5 w-5"
              :class="{ 'animate-spin': cartStore.loading }"
            />
            {{ cartStore.loading ? 'Opening Stripe...' : 'Secure Stripe checkout' }}
          </button>
        </div>
      </div>
    </template>

    <div
      v-if="checkoutMessage || cartStore.lastError"
      class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error"
      role="alert"
    >
      {{ checkoutMessage || cartStore.lastError }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'

const cartStore = useCartStore()
const userStore = useUserStore()
const router = useRouter()
const quantities = reactive<Record<string, number>>({})
const checkoutMessage = ref('')

watch(
  () => cartStore.items.map((item) => ({ id: item.id, quantity: item.quantity })),
  (items) => {
    const activeIds = new Set(items.map((item) => item.id))

    for (const key of Object.keys(quantities)) {
      if (!activeIds.has(key)) delete quantities[key]
    }

    for (const item of items) quantities[item.id] = item.quantity
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  await Promise.all([cartStore.initialize(), userStore.initialize?.()])
})

function itemLabel(type: string): string {
  return type.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function lineTotal(item: (typeof cartStore.items)[number]): number {
  return item.price * (quantities[item.id] ?? item.quantity)
}

function updateQuantity(id: string, fallback: number): void {
  cartStore.updateQuantity(id, quantities[id] ?? fallback)
}

async function checkout(): Promise<void> {
  checkoutMessage.value = ''

  if (!userStore.userId) {
    checkoutMessage.value =
      'Sign in before opening Stripe checkout. Your cart will stay here.'
    await router.push({ path: '/login', query: { redirect: '/cart' } })
    return
  }

  const result = await cartStore.checkout()

  if (!result.success) {
    checkoutMessage.value =
      result.message || 'Stripe checkout could not be opened.'
  }
}
</script>
