// /stores/superkateStore.ts
//
// Web replica of the Hair by Superkate services app (conductor project
// superkate-hairstyle-ai t-015): customers, appointments, and receipt
// settings backing the /stylist suite (Calculator | Clients | History |
// Hair Studio). Kind Robots is the backend of record eventually; this store
// is the approved "easy mock" — persisted to localStorage so Superkate's
// data survives reloads on her device. KR-model-backed sync is a follow-up.
//
// Core formula (calculator SPEC): hourly rate x time spent + product cost.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type SuperkateCustomer = {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type SuperkateAppointment = {
  id: number
  customerId: number | null
  clientName: string
  date: string // YYYY-MM-DD
  hourlyRateCents: number
  minutes: number
  productCostCents: number
  totalCents: number
  createdAt: string
}

export type SuperkateSettings = {
  salonName: string
  bookingLink: string
  replyContact: string
}

const STORAGE_KEY = 'superkateSuite'

const DEFAULT_SETTINGS: SuperkateSettings = {
  salonName: 'Hair by Superkate',
  bookingLink: 'https://hairbysuperkate.glossgenius.com/',
  replyContact: 'hairbysuperkate@gmail.com',
}

export function computeTotalCents(
  hourlyRateCents: number,
  minutes: number,
  productCostCents: number,
): number {
  const rate = Math.max(0, Math.round(hourlyRateCents))
  const time = Math.max(0, Math.round(minutes))
  const product = Math.max(0, Math.round(productCostCents))

  return Math.round((rate * time) / 60) + product
}

export function formatCents(cents: number): string {
  return `$${(Math.max(0, Math.round(cents)) / 100).toFixed(2)}`
}

export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const rest = total % 60

  if (!hours) return `${rest}m`
  if (!rest) return `${hours}h`

  return `${hours}h ${rest}m`
}

export const useSuperkateStore = defineStore('superkateStore', () => {
  const customers = ref<SuperkateCustomer[]>([])
  const appointments = ref<SuperkateAppointment[]>([])
  const settings = ref<SuperkateSettings>({ ...DEFAULT_SETTINGS })
  const hydrated = ref(false)

  // Which suite view is open on /stylist. Store-level so it survives
  // leaving and returning to the page, matching the dashboard-tab fix.
  const activeView = ref<'studio' | 'calculator' | 'clients' | 'history'>(
    'studio',
  )

  const isClient = typeof window !== 'undefined'

  function persist(): void {
    if (!isClient) return

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          customers: customers.value,
          appointments: appointments.value,
          settings: settings.value,
        }),
      )
    } catch {}
  }

  function hydrate(force = false): void {
    if (!isClient) return
    if (hydrated.value && !force) return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null

      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.customers)) customers.value = parsed.customers
        if (Array.isArray(parsed.appointments))
          appointments.value = parsed.appointments
        if (parsed.settings && typeof parsed.settings === 'object') {
          settings.value = { ...DEFAULT_SETTINGS, ...parsed.settings }
        }
      }
    } catch {}

    hydrated.value = true
  }

  function nextId(rows: Array<{ id: number }>): number {
    return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
  }

  const sortedCustomers = computed(() =>
    [...customers.value].sort((a, b) => a.name.localeCompare(b.name)),
  )

  const sortedAppointments = computed(() =>
    [...appointments.value].sort(
      (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
    ),
  )

  function customerByName(name: string): SuperkateCustomer | null {
    const target = name.trim().toLowerCase()
    if (!target) return null

    return (
      customers.value.find(
        (customer) => customer.name.trim().toLowerCase() === target,
      ) ?? null
    )
  }

  function saveCustomer(input: {
    id?: number | null
    name: string
    email?: string | null
  }): SuperkateCustomer | null {
    const name = input.name.trim()
    if (!name) return null

    const now = new Date().toISOString()
    const email = (input.email ?? '').trim()

    if (input.id) {
      let updated: SuperkateCustomer | null = null

      customers.value = customers.value.map((customer) => {
        if (customer.id !== input.id) return customer
        updated = { ...customer, name, email, updatedAt: now }
        return updated
      })

      persist()
      return updated
    }

    const existing = customerByName(name)

    if (existing) {
      return saveCustomer({ id: existing.id, name, email: email || existing.email })
    }

    const customer: SuperkateCustomer = {
      id: nextId(customers.value),
      name,
      email,
      createdAt: now,
      updatedAt: now,
    }

    customers.value = [...customers.value, customer]
    persist()
    return customer
  }

  function removeCustomer(id: number): void {
    customers.value = customers.value.filter((customer) => customer.id !== id)
    // Appointment history keeps its client name snapshot after the linked
    // customer is deleted (delete-detach invariant from the calculator spec).
    appointments.value = appointments.value.map((appointment) =>
      appointment.customerId === id
        ? { ...appointment, customerId: null }
        : appointment,
    )
    persist()
  }

  function saveAppointment(input: {
    clientName: string
    date: string
    hourlyRateCents: number
    minutes: number
    productCostCents: number
  }): SuperkateAppointment | null {
    const clientName = input.clientName.trim()
    if (!clientName || !input.date) return null

    const customer = customerByName(clientName) ?? saveCustomer({ name: clientName })

    const appointment: SuperkateAppointment = {
      id: nextId(appointments.value),
      customerId: customer?.id ?? null,
      clientName,
      date: input.date,
      hourlyRateCents: Math.max(0, Math.round(input.hourlyRateCents)),
      minutes: Math.max(0, Math.round(input.minutes)),
      productCostCents: Math.max(0, Math.round(input.productCostCents)),
      totalCents: computeTotalCents(
        input.hourlyRateCents,
        input.minutes,
        input.productCostCents,
      ),
      createdAt: new Date().toISOString(),
    }

    appointments.value = [...appointments.value, appointment]
    persist()
    return appointment
  }

  function removeAppointment(id: number): void {
    appointments.value = appointments.value.filter(
      (appointment) => appointment.id !== id,
    )
    persist()
  }

  function appointmentsForCustomer(customerId: number): SuperkateAppointment[] {
    return sortedAppointments.value.filter(
      (appointment) => appointment.customerId === customerId,
    )
  }

  function searchAppointments(query: string, date: string): SuperkateAppointment[] {
    const target = query.trim().toLowerCase()

    return sortedAppointments.value.filter((appointment) => {
      if (date && appointment.date !== date) return false
      if (target && !appointment.clientName.toLowerCase().includes(target))
        return false
      return true
    })
  }

  function updateSettings(patch: Partial<SuperkateSettings>): void {
    settings.value = { ...settings.value, ...patch }
    persist()
  }

  function receiptText(appointment: SuperkateAppointment): string {
    const rate = formatCents(appointment.hourlyRateCents)
    const time = formatMinutes(appointment.minutes)
    const product = formatCents(appointment.productCostCents)
    const total = formatCents(appointment.totalCents)

    return [
      `Hi ${appointment.clientName}!`,
      '',
      `Thank you so much for visiting ${settings.value.salonName} on ${appointment.date}.`,
      '',
      `${rate}/hr x ${time} + ${product} products = ${total}`,
      '',
      settings.value.salonName,
      settings.value.bookingLink,
      settings.value.replyContact,
      'Superkate loves you!',
    ].join('\n')
  }

  function receiptMailto(appointment: SuperkateAppointment): string {
    const customer = appointment.customerId
      ? customers.value.find((entry) => entry.id === appointment.customerId)
      : null
    const to = customer?.email || ''
    const subject = encodeURIComponent(
      `Your ${settings.value.salonName} receipt — ${appointment.date}`,
    )
    const body = encodeURIComponent(receiptText(appointment))

    return `mailto:${to}?subject=${subject}&body=${body}`
  }

  return {
    customers,
    appointments,
    settings,
    hydrated,
    activeView,

    sortedCustomers,
    sortedAppointments,

    hydrate,
    customerByName,
    saveCustomer,
    removeCustomer,
    saveAppointment,
    removeAppointment,
    appointmentsForCustomer,
    searchAppointments,
    updateSettings,
    receiptText,
    receiptMailto,
  }
})
