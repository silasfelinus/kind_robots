<!-- /components/content/pages/giving-page.vue -->
<template>
  <div class="mx-auto max-w-4xl space-y-6 px-4 py-2 sm:px-6 lg:px-8">
    <div
      class="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center shadow-sm sm:p-10"
    >
      <Icon
        name="kind-icon:hand-heart"
        class="mx-auto h-12 w-12 text-primary"
      />

      <h1 class="mt-4 text-3xl font-black text-base-content sm:text-4xl">
        Give Directly. We Never Touch It.
      </h1>

      <p class="mx-auto mt-3 max-w-2xl text-base-content/75">
        Kind Robots supports the
        <strong>Against Malaria Foundation</strong> — every dollar buys
        insecticide-treated bed nets that prevent malaria. Donations go straight
        to AMF; we are not a middleman and never see a cent of it.
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
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <Icon name="kind-icon:heart" class="h-6 w-6 text-secondary" />

        <h2 class="mt-2 text-lg font-black text-base-content">Why AMF?</h2>

        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          {{ trivia }}
        </p>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <Icon name="kind-icon:cart" class="h-6 w-6 text-secondary" />

        <h2 class="mt-2 text-lg font-black text-base-content">
          Prefer It On Your Receipt?
        </h2>

        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          As a convenience, you can add a $1 net donation to your Kind Robots
          cart alongside anything else you're picking up — it still routes 100%
          to AMF. The direct link above is the fastest way to give.
        </p>

        <button
          type="button"
          class="btn btn-outline btn-sm mt-4 rounded-2xl"
          :disabled="!donationItem"
          @click="addDonationToCart"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add $1 net donation to cart
        </button>

        <p v-if="added" class="mt-2 text-xs font-semibold text-success">
          Added — thank you! Check the cart to review.
        </p>
      </div>
    </div>

    <div
      class="rounded-2xl border border-info/30 bg-info/10 p-4 text-center text-sm text-info-content"
    >
      <p>{{ plea }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCartStore } from '@/stores/cartStore'
import { cartItems } from '@/stores/seeds/cartItems'
import { malariaTrivia } from '@/utils/messages/MalariaTrivia'
import { sponsorPlea } from '@/utils/messages/sponsorPlea'

const cartStore = useCartStore()
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
</script>
