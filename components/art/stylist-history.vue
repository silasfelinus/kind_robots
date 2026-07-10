<!-- /components/art/stylist-history.vue -->
<!--
  Superkate appointment history (web replica): search by client name, filter
  by date, review totals, and open the warm receipt email for any appointment.
-->
<template>
  <section
    class="stylist-history flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:book" class="h-5 w-5 text-primary" />
      <h2 class="text-base font-black text-base-content">Appointments</h2>
      <span class="badge badge-ghost badge-sm">{{ results.length }}</span>
    </header>

    <div class="flex flex-wrap gap-2">
      <input
        v-model="query"
        type="text"
        placeholder="Search by client"
        class="input input-sm input-bordered min-w-40 flex-1"
      />
      <input v-model="date" type="date" class="input input-sm input-bordered" />
      <button
        v-if="query || date"
        type="button"
        class="btn btn-ghost btn-sm"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <p v-if="!results.length" class="text-xs text-base-content/40">
      {{
        superkate.sortedAppointments.length
          ? 'No appointments match those filters.'
          : 'No appointments saved yet — the Calculator tab creates them.'
      }}
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="appointment in results"
        :key="appointment.id"
        class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-bold">{{ appointment.clientName }}</span>
            <span class="text-xs text-base-content/50">
              {{ appointment.date }} · {{ formatCents(appointment.hourlyRateCents) }}/hr ×
              {{ formatMinutes(appointment.minutes) }} +
              {{ formatCents(appointment.productCostCents) }}
            </span>
          </div>
          <span class="text-base font-black text-primary">
            {{ formatCents(appointment.totalCents) }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            @click="toggleReceipt(appointment.id)"
          >
            Receipt
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error"
            @click="confirmRemove(appointment)"
          >
            Delete
          </button>
        </div>

        <div
          v-if="openReceiptId === appointment.id"
          class="flex flex-col gap-2 rounded-lg bg-base-200 p-2"
        >
          <pre class="whitespace-pre-wrap text-xs">{{ superkate.receiptText(appointment) }}</pre>
          <a :href="superkate.receiptMailto(appointment)" class="btn btn-outline btn-xs">
            <Icon name="mdi:email-outline" class="h-4 w-4" />
            Open receipt email
          </a>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useSuperkateStore,
  formatCents,
  formatMinutes,
  type SuperkateAppointment,
} from '@/stores/superkateStore'

const superkate = useSuperkateStore()

const query = ref('')
const date = ref('')
const openReceiptId = ref<number | null>(null)

const results = computed(() => superkate.searchAppointments(query.value, date.value))

function clearFilters() {
  query.value = ''
  date.value = ''
}

function toggleReceipt(id: number) {
  openReceiptId.value = openReceiptId.value === id ? null : id
}

function confirmRemove(appointment: SuperkateAppointment) {
  const ok =
    typeof window === 'undefined'
      ? false
      : window.confirm(
          `Delete the ${appointment.date} appointment for ${appointment.clientName}?`,
        )

  if (ok) superkate.removeAppointment(appointment.id)
}
</script>
