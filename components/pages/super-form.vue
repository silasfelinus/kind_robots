<!-- /components/pages/super-form.vue -->
<template>
  <section class="flex min-h-full items-center justify-center p-3 sm:p-6">
    <div
      class="w-full max-w-xl rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl sm:p-6"
    >
      <header class="mb-6 text-center">
        <site-logo class="mx-auto mb-4" />
        <h1 class="text-3xl font-black text-primary sm:text-4xl">
          Hair by Superkate!
        </h1>
        <p class="mt-2 text-sm text-base-content/70">
          Create and email a client receipt without exposing the mail credentials.
        </p>
      </header>

      <form class="grid gap-4" @submit.prevent="submitForm">
        <label class="form-control">
          <span class="label-text font-bold">Date</span>
          <input
            v-model="form.date"
            type="date"
            class="input input-bordered mt-1 w-full"
            required
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Client name</span>
          <input
            v-model="form.clientName"
            type="text"
            class="input input-bordered mt-1 w-full"
            placeholder="Client name"
            maxlength="120"
            required
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Services provided</span>
          <textarea
            v-model="form.servicesProvided"
            class="textarea textarea-bordered mt-1 min-h-24 w-full"
            placeholder="Cut, color, styling..."
            maxlength="1000"
          />
        </label>

        <section
          class="grid gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:grid-cols-2"
        >
          <label class="form-control">
            <span class="label-text font-bold">Hours</span>
            <input
              v-model="form.hours"
              type="number"
              class="input input-bordered mt-1 w-full"
              min="0"
              max="48"
              step="0.25"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Rate per hour</span>
            <input
              v-model="form.rate"
              type="number"
              class="input input-bordered mt-1 w-full"
              min="0"
              max="5000"
              step="0.01"
            />
          </label>

          <label class="form-control sm:col-span-2">
            <span class="label-text font-bold">Product cost</span>
            <input
              v-model="form.productCost"
              type="number"
              class="input input-bordered mt-1 w-full"
              min="0"
              max="50000"
              step="0.01"
            />
          </label>

          <div
            class="rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:col-span-2"
          >
            <p class="text-sm text-base-content/70">
              {{ calculationLabel }}
            </p>
            <p class="mt-1 text-3xl font-black text-primary">
              ${{ totalCost.toFixed(2) }}
            </p>
          </div>
        </section>

        <label class="form-control">
          <span class="label-text font-bold">Client email</span>
          <input
            v-model="form.clientEmail"
            type="email"
            class="input input-bordered mt-1 w-full"
            placeholder="client@example.com"
            required
          />
          <span class="mt-1 text-xs text-base-content/60">
            Studio copies are added securely by the server.
          </span>
        </label>

        <div
          v-if="receiptStore.lastMessage || receiptStore.lastError"
          class="alert rounded-2xl"
          :class="receiptStore.lastError ? 'alert-error' : 'alert-success'"
        >
          <Icon
            :name="receiptStore.lastError ? 'kind-icon:warning' : 'kind-icon:check'"
            class="h-5 w-5"
          />
          <span>{{ receiptStore.lastError || receiptStore.lastMessage }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary rounded-2xl"
          :disabled="receiptStore.isSending"
        >
          <span
            v-if="receiptStore.isSending"
            class="loading loading-spinner loading-sm"
          />
          <Icon v-else name="kind-icon:email" class="h-5 w-5" />
          {{ receiptStore.isSending ? 'Sending...' : 'Send receipt' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSuperkateReceiptStore } from '@/stores/superkateReceiptStore'

type FormData = {
  date: string
  clientName: string
  servicesProvided: string
  hours: string
  rate: string
  productCost: string
  clientEmail: string
}

const receiptStore = useSuperkateReceiptStore()

function today(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function emptyForm(): FormData {
  return {
    date: today(),
    clientName: '',
    servicesProvided: '',
    hours: '',
    rate: '',
    productCost: '',
    clientEmail: '',
  }
}

const form = ref<FormData>(emptyForm())

const totalCost = computed(() => {
  return (
    Number(form.value.hours || 0) * Number(form.value.rate || 0) +
    Number(form.value.productCost || 0)
  )
})

const calculationLabel = computed(() => {
  const rate = Number(form.value.rate || 0).toFixed(2)
  const hours = Number(form.value.hours || 0)
  const product = Number(form.value.productCost || 0).toFixed(2)
  return `$${rate} × ${hours} hours + $${product} products`
})

async function submitForm(): Promise<void> {
  const result = await receiptStore.sendReceiptEmail({
    date: form.value.date,
    clientName: form.value.clientName,
    servicesProvided: form.value.servicesProvided,
    hours: Number(form.value.hours || 0),
    rate: Number(form.value.rate || 0),
    productCost: Number(form.value.productCost || 0),
    clientEmail: form.value.clientEmail,
  })

  if (result.success) {
    form.value = emptyForm()
  }
}
</script>
