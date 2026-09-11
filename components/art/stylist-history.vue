<!-- /components/art/stylist-history.vue -->
<!--
  Superkate appointment history (web replica): search by client name, filter
  by date, review totals, and open the warm receipt email for any appointment.
-->
<template>
  <section class="flex flex-col gap-4 kr-panel-muted-md">
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:book" class="kr-icon-primary-5" />
      <h2 class="text-base font-black text-base-content">Appointments</h2>
      <span class="kr-badge-ghost-sm">{{ results.length }}</span>
    </header>

    <div class="flex flex-wrap gap-2">
      <input
        v-model="query"
        type="text"
        placeholder="Search by client"
        class="kr-input-sm min-w-40 flex-1"
      />
      <input v-model="date" type="date" class="kr-input-sm" />
      <button
        v-if="query || date"
        type="button"
        class="kr-btn-ghost-plain"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <p v-if="!results.length" class="kr-text-dim-xs-40">
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
        class="flex flex-col gap-2 kr-panel-compact-xs"
      >
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="kr-text-bold-sm truncate">{{ appointment.clientName }}</span>
            <span class="kr-text-dim-xs">
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
            class="kr-btn-ghost-xs-plain"
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
          <a :href="superkate.receiptMailto(appointment)" class="kr-btn-outline-xs">
            <Icon name="mdi:email-outline" class="kr-icon-4" />
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

  if (ok) void superkate.removeAppointment(appointment.id)
}
</script>
