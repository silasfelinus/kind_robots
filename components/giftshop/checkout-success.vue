<!-- /components/giftshop/checkout-success.vue -->
<template>
  <section
    class="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-5 px-4 py-8 text-center"
  >
    <div
      class="w-full rounded-3xl border bg-base-100 p-6 shadow-lg sm:p-10"
      :class="panelClass"
    >
      <Icon :name="statusIcon" class="mx-auto h-14 w-14" :class="iconClass" />

      <h1 class="mt-4 text-3xl font-black text-base-content">
        {{ heading }}
      </h1>

      <p class="mx-auto mt-3 max-w-xl text-base-content/70">
        {{ message }}
      </p>

      <div
        v-if="verifiedAmount"
        class="mx-auto mt-5 w-fit rounded-2xl border border-base-300 bg-base-200 px-5 py-3"
      >
        <div class="text-xs font-black uppercase tracking-widest text-base-content/50">
          Confirmed total
        </div>
        <div class="text-2xl font-black text-primary">
          {{ verifiedAmount }}
        </div>
      </div>

      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <NuxtLink to="/sanctuary" class="btn btn-primary rounded-2xl">
          <Icon name="kind-icon:butterfly" class="h-4 w-4" />
          Return to Sanctuary
        </NuxtLink>

        <NuxtLink
          v-if="state === 'error' || state === 'unpaid'"
          to="/cart"
          class="btn btn-outline rounded-2xl"
        >
          <Icon name="kind-icon:cart" class="h-4 w-4" />
          Review cart
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { performFetch } from '@/stores/utils'

type CheckoutStatusData = {
  sessionId: string
  status: string | null
  paymentStatus: string
  paid: boolean
  amountTotal: number
  currency: string
}

type VerificationState = 'loading' | 'paid' | 'unpaid' | 'error'

const route = useRoute()
const cartStore = useCartStore()
const state = ref<VerificationState>('loading')
const detail = ref('Confirming the payment with Stripe...')
const checkoutStatus = ref<CheckoutStatusData | null>(null)

const heading = computed(() => {
  if (state.value === 'paid') return 'Payment confirmed'
  if (state.value === 'unpaid') return 'Payment is not complete'
  if (state.value === 'error') return 'We could not verify this checkout'
  return 'Checking the receipt'
})

const message = computed(() => {
  if (state.value === 'paid') {
    return 'Stripe confirmed the charge. Your cart has been cleared, and fulfillment is being recorded by the secure webhook.'
  }

  if (state.value === 'unpaid') {
    return 'Stripe did not report a completed charge. Your cart is still intact so nothing gets lost.'
  }

  return detail.value
})

const panelClass = computed(() => {
  if (state.value === 'paid') return 'border-success/40'
  if (state.value === 'error') return 'border-error/40'
  if (state.value === 'unpaid') return 'border-warning/40'
  return 'border-info/40'
})

const statusIcon = computed(() => {
  if (state.value === 'paid') return 'kind-icon:check'
  if (state.value === 'error') return 'kind-icon:alert'
  if (state.value === 'unpaid') return 'kind-icon:clock'
  return 'kind-icon:spinner'
})

const iconClass = computed(() => {
  if (state.value === 'paid') return 'text-success'
  if (state.value === 'error') return 'text-error'
  if (state.value === 'unpaid') return 'text-warning'
  return 'animate-spin text-info'
})

const verifiedAmount = computed(() => {
  const data = checkoutStatus.value
  if (!data?.paid) return ''

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency.toUpperCase(),
  }).format(data.amountTotal / 100)
})

onMounted(async () => {
  await cartStore.initialize()

  const rawSessionId = route.query.session_id
  const sessionId = typeof rawSessionId === 'string' ? rawSessionId.trim() : ''

  if (!sessionId) {
    state.value = 'error'
    detail.value =
      'The Stripe return link did not include a checkout session ID. Your cart was not cleared.'
    return
  }

  const result = await performFetch<CheckoutStatusData>(
    `/api/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}`,
  )

  if (!result.success || !result.data) {
    state.value = 'error'
    detail.value =
      result.message ||
      'Stripe checkout verification failed. Your cart was not cleared.'
    return
  }

  checkoutStatus.value = result.data

  if (!result.data.paid) {
    state.value = 'unpaid'
    return
  }

  cartStore.clearCart()
  state.value = 'paid'
})
</script>
