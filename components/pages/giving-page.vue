<!-- /components/content/pages/giving-page.vue -->
<template>
  <div class="kr-unbound mx-auto max-w-5xl space-y-6 px-4 py-2 sm:px-6 lg:px-8">
    <div
      class="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center shadow-sm sm:p-10"
    >
      <Icon
        name="kind-icon:hand-heart"
        class="mx-auto h-12 w-12 text-primary"
      />

      <p class="mt-4 text-3xl font-black text-base-content sm:text-4xl">
        Give Directly. We Never Touch It.
      </p>

      <p class="mx-auto mt-3 max-w-2xl text-base-content/75">
        Kind Robots supports the
        <strong>Against Malaria Foundation</strong>. The direct fundraiser link
        sends your donation straight to AMF, with Kind Robots never receiving or
        processing the money.
      </p>

      <a
        href="https://www.againstmalaria.com/amibot"
        target="_blank"
        rel="noopener"
        class="btn btn-primary btn-lg mt-6 rounded-2xl"
      >
        <Icon name="kind-icon:gift" class="h-5 w-5" />
        Donate at againstmalaria.com/amibot
      </a>

      <p class="mt-2 text-xs text-base-content/50">
        Opens the Against Malaria Foundation's official fundraiser page in a new
        tab.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="kr-panel p-5">
        <Icon name="kind-icon:heart" class="h-6 w-6 text-secondary" />

        <h2 class="mt-2 text-lg font-black text-base-content">Why AMF?</h2>

        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          {{ trivia }}
        </p>
      </div>

      <div class="kr-panel p-5">
        <Icon name="kind-icon:cart" class="h-6 w-6 text-secondary" />

        <h2 class="mt-2 text-lg font-black text-base-content">
          Prefer It On Your Receipt?
        </h2>

        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          You can add a $1 AMF-designated donation to a Kind Robots purchase.
          Stripe collects it with the rest of the cart, and Kind Robots records
          it separately for AMF remittance. Use the direct link above when you
          prefer no middleman at all.
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-2xl"
            :disabled="!donationItem"
            @click="addDonationToCart"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            Add $1 donation to cart
          </button>

          <button
            v-if="added || cartStore.hasItems"
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            @click="openCart"
          >
            <Icon name="kind-icon:cart" class="h-4 w-4" />
            View cart
            <span class="badge badge-secondary">
              {{ cartStore.totalItems }}
            </span>
          </button>
        </div>

        <p v-if="added" class="mt-2 text-xs font-semibold text-success">
          Added. The cart is now available here and in the dashboard header.
        </p>
      </div>
    </div>

    <section
      id="monthly-support"
      class="kr-panel scroll-mt-24 p-5 sm:p-7"
    >
      <div class="mb-6 text-center">
        <Icon name="kind-icon:rocket" class="mx-auto h-8 w-8 text-primary" />
        <h2 class="mt-2 text-2xl font-black text-base-content">
          Support Kind Robots Monthly
        </h2>
        <p class="mx-auto mt-2 max-w-2xl text-sm text-base-content/70">
          Monthly plans support Kind Robots itself: servers, art, stories, and
          continued development. This is separate from donations to AMF.
        </p>
      </div>

      <subscription-manager />
    </section>

    <div
      class="rounded-2xl border border-info/30 bg-info/10 p-4 text-center text-sm text-info-content"
    >
      <p>{{ plea }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { cartItems } from '@/stores/seeds/cartItems'
import { malariaTrivia } from '@/utils/messages/MalariaTrivia'
import { sponsorPlea } from '@/utils/messages/sponsorPlea'

const cartStore = useCartStore()
const router = useRouter()
const added = ref(false)

const donationItem = computed(() =>
  cartItems.find((item) => item.type === 'donation'),
)

const trivia = computed(() => {
  const pool = malariaTrivia
  return pool[Math.floor(Math.random() * pool.length)]
})

const plea = computed(() => {
  const pool = sponsorPlea
  return pool[Math.floor(Math.random() * pool.length)]
})

onMounted(() => {
  void cartStore.initialize()
})

function addDonationToCart() {
  const item = donationItem.value
  if (!item) return

  cartStore.addItem({
    type: item.type,
    artImageId: 0,
    imageUrl: item.image,
    quantity: 1,
    price: item.price,
    notes: item.label,
  })

  added.value = true
}

function openCart(): void {
  void router.push('/cart')
}
</script>
