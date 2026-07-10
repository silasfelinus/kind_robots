<!-- /components/art/stylist-calculator.vue -->
<!--
  Superkate services calculator (web replica). Core formula from the
  calculator SPEC: hourly rate x time spent + product cost = total.
  Time is hours/minutes with preset chips; product cost defaults to $0.00.
-->
<template>
  <section
    class="stylist-calculator flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:sparkles" class="h-5 w-5 text-primary" />
      <h2 class="text-base font-black text-base-content">New Appointment</h2>
    </header>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Client</span>
        <input
          v-model="clientName"
          type="text"
          list="calculator-client-suggestions"
          placeholder="Client name"
          class="input input-sm input-bordered w-full"
        />
        <datalist id="calculator-client-suggestions">
          <option
            v-for="customer in superkate.sortedCustomers"
            :key="customer.id"
            :value="customer.name"
          />
        </datalist>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Date</span>
        <input v-model="date" type="date" class="input input-sm input-bordered w-full" />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Hourly rate ($)</span>
        <input
          v-model.number="hourlyRate"
          type="number"
          min="0"
          step="5"
          class="input input-sm input-bordered w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Product cost ($, optional)</span>
        <input
          v-model.number="productCost"
          type="number"
          min="0"
          step="1"
          class="input input-sm input-bordered w-full"
        />
      </label>
    </div>

    <!-- Time spent -->
    <div class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-3">
      <span class="text-xs font-black text-base-content">Time spent</span>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="chip in TIME_CHIPS"
          :key="chip.minutes"
          type="button"
          class="btn btn-xs rounded-lg"
          :class="totalMinutes === chip.minutes ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="setMinutes(chip.minutes)"
        >
          {{ chip.label }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            v-model.number="hours"
            type="number"
            min="0"
            max="12"
            class="input input-xs input-bordered w-16"
          />
          hours
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            v-model.number="minutes"
            type="number"
            min="0"
            max="59"
            step="5"
            class="input input-xs input-bordered w-16"
          />
          minutes
        </label>
      </div>
    </div>

    <!-- Live total -->
    <div class="flex items-center justify-between rounded-xl bg-primary/10 p-3">
      <span class="text-xs text-base-content/70">
        {{ formatCents(hourlyRateCents) }}/hr × {{ formatMinutes(totalMinutes) }} +
        {{ formatCents(productCostCents) }} products
      </span>
      <span class="text-lg font-black text-primary">{{ formatCents(totalCents) }}</span>
    </div>

    <button
      type="button"
      class="btn btn-primary btn-sm"
      :disabled="!canSave"
      @click="save"
    >
      Save appointment
    </button>

    <!-- Receipt for the just-saved appointment -->
    <div
      v-if="savedAppointment"
      class="flex flex-col gap-2 rounded-xl border border-success/40 bg-success/5 p-3"
    >
      <span class="text-xs font-black text-success">Saved! Receipt preview</span>
      <pre class="whitespace-pre-wrap rounded-lg bg-base-100 p-2 text-xs">{{
        superkate.receiptText(savedAppointment)
      }}</pre>
      <a
        :href="superkate.receiptMailto(savedAppointment)"
        class="btn btn-outline btn-sm"
      >
        <Icon name="mdi:email-outline" class="h-4 w-4" />
        Open receipt email
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useSuperkateStore,
  computeTotalCents,
  formatCents,
  formatMinutes,
  type SuperkateAppointment,
} from '@/stores/superkateStore'

const superkate = useSuperkateStore()

const TIME_CHIPS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '2h 30m', minutes: 150 },
  { label: '3h', minutes: 180 },
]

const clientName = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const hourlyRate = ref<number>(0)
const productCost = ref<number>(0)
const hours = ref<number>(1)
const minutes = ref<number>(0)

const savedAppointment = ref<SuperkateAppointment | null>(null)

const totalMinutes = computed(
  () => Math.max(0, hours.value || 0) * 60 + Math.max(0, minutes.value || 0),
)
const hourlyRateCents = computed(() =>
  Math.round(Math.max(0, hourlyRate.value || 0) * 100),
)
const productCostCents = computed(() =>
  Math.round(Math.max(0, productCost.value || 0) * 100),
)
const totalCents = computed(() =>
  computeTotalCents(hourlyRateCents.value, totalMinutes.value, productCostCents.value),
)

const canSave = computed(
  () =>
    !!clientName.value.trim() &&
    !!date.value &&
    hourlyRateCents.value > 0 &&
    totalMinutes.value > 0,
)

function setMinutes(total: number) {
  hours.value = Math.floor(total / 60)
  minutes.value = total % 60
}

async function save() {
  const appointment = await superkate.saveAppointment({
    clientName: clientName.value,
    date: date.value,
    hourlyRateCents: hourlyRateCents.value,
    minutes: totalMinutes.value,
    productCostCents: productCostCents.value,
  })

  if (appointment) {
    savedAppointment.value = appointment
  }
}
</script>
