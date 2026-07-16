// /stores/superkateStore.ts
//
// Web replica of the Hair by Superkate services app (conductor project
// superkate-hairstyle-ai t-015): customers, appointments, and receipt
// settings backing the /stylist suite (Calculator | Clients | History |
// Hair Studio | Settings).
//
// Persistence: server-backed for signed-in users (StylistClient /
// StylistAppointment via /api/stylist/*) so the client book syncs across
// devices, with localStorage as the offline/guest fallback and cache.
// Existing local-only data is migrated up the first time the server copy
// is empty. Receipt settings stay device-local for now.
//
// Core formula (calculator SPEC): hourly rate x time spent + product cost.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

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

type ServerClient = {
  id: number
  name: string
  email: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type ServerAppointment = {
  id: number
  clientId: number | null
  clientName: string
  date: string
  hourlyRateCents: number
  minutes: number
  productCostCents: number
  totalCents: number
  createdAt?: string | null
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

function fromServerClient(client: ServerClient): SuperkateCustomer {
  return {
    id: client.id,
    name: client.name,
    email: client.email ?? '',
    createdAt: client.createdAt ?? '',
    updatedAt: client.updatedAt ?? '',
  }
}

function fromServerAppointment(row: ServerAppointment): SuperkateAppointment {
  return {
    id: row.id,
    customerId: row.clientId ?? null,
    clientName: row.clientName,
    date: row.date,
    hourlyRateCents: row.hourlyRateCents,
    minutes: row.minutes,
    productCostCents: row.productCostCents,
    totalCents: row.totalCents,
    createdAt: row.createdAt ?? '',
  }
}

export const useSuperkateStore = defineStore('superkateStore', () => {
  const userStore = useUserStore()

  const customers = ref<SuperkateCustomer[]>([])
  const appointments = ref<SuperkateAppointment[]>([])
  const settings = ref<SuperkateSettings>({ ...DEFAULT_SETTINGS })
  const hydrated = ref(false)
  // True once the server copy loaded — mutations then write through to the
  // API. False (guest/offline) keeps the original local-only behavior.
  const serverBacked = ref(false)
  const isSyncing = ref(false)
  const syncError = ref('')

  // Which suite view is open on /stylist. Store-level so it survives
  // leaving and returning to the page, matching the dashboard-tab fix.
  const activeView = ref<
    | 'studio'
    | 'calculator'
    | 'clients'
    | 'history'
    | 'settings'
    | 'diagnostics'
  >('studio')

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
    } catch {
      /* localStorage unavailable (private mode / SSR) — cache skipped */
    }
  }

  function hydrateFromLocalStorage(): void {
    if (!isClient) return

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
    } catch {
      /* corrupt or unavailable localStorage — start fresh */
    }
  }

  function isSignedIn(): boolean {
    const token = userStore.token || userStore.user?.token || ''
    return !!token && !userStore.isGuest
  }

  /** Push pre-sync local records to the empty server copy, once. */
  async function migrateLocalToServer(): Promise<void> {
    const localCustomers = [...customers.value]
    const localAppointments = [...appointments.value]

    for (const customer of localCustomers) {
      await performFetch(
        '/api/stylist/client',
        {
          method: 'POST',
          body: JSON.stringify({ name: customer.name, email: customer.email }),
          headers: { 'Content-Type': 'application/json' },
        },
        1,
        15_000,
      )
    }

    for (const appointment of localAppointments) {
      await performFetch(
        '/api/stylist/appointment',
        {
          method: 'POST',
          body: JSON.stringify({
            clientName: appointment.clientName,
            date: appointment.date,
            hourlyRateCents: appointment.hourlyRateCents,
            minutes: appointment.minutes,
            productCostCents: appointment.productCostCents,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
        1,
        15_000,
      )
    }
  }

  async function loadFromServer(): Promise<void> {
    isSyncing.value = true
    syncError.value = ''

    try {
      const response = await performFetch<{
        clients: ServerClient[]
        appointments: ServerAppointment[]
      }>('/api/stylist/suite', { method: 'GET' }, 2, 20_000)

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load the studio book.')
      }

      const serverClients = response.data.clients ?? []
      const serverAppointments = response.data.appointments ?? []

      const serverEmpty = !serverClients.length && !serverAppointments.length
      const localHasData =
        customers.value.length > 0 || appointments.value.length > 0

      if (serverEmpty && localHasData) {
        await migrateLocalToServer()

        const reloaded = await performFetch<{
          clients: ServerClient[]
          appointments: ServerAppointment[]
        }>('/api/stylist/suite', { method: 'GET' }, 1, 20_000)

        if (reloaded.success && reloaded.data) {
          customers.value = (reloaded.data.clients ?? []).map(fromServerClient)
          appointments.value = (reloaded.data.appointments ?? []).map(
            fromServerAppointment,
          )
        }
      } else {
        customers.value = serverClients.map(fromServerClient)
        appointments.value = serverAppointments.map(fromServerAppointment)
      }

      serverBacked.value = true
      persist()
    } catch (error) {
      syncError.value =
        error instanceof Error ? error.message : 'Could not load the studio book.'
    } finally {
      isSyncing.value = false
    }
  }

  function hydrate(force = false): void {
    if (hydrated.value && !force) return

    hydrateFromLocalStorage()
    hydrated.value = true

    if (isClient && isSignedIn()) {
      void loadFromServer()
    }
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

  function upsertLocalCustomer(customer: SuperkateCustomer): void {
    const exists = customers.value.some((entry) => entry.id === customer.id)
    customers.value = exists
      ? customers.value.map((entry) =>
          entry.id === customer.id ? customer : entry,
        )
      : [...customers.value, customer]
    persist()
  }

  async function saveCustomer(input: {
    id?: number | null
    name: string
    email?: string | null
  }): Promise<SuperkateCustomer | null> {
    const name = input.name.trim()
    if (!name) return null

    const email = (input.email ?? '').trim()

    if (serverBacked.value) {
      const response = await performFetch<{ client: ServerClient }>(
        '/api/stylist/client',
        {
          method: 'POST',
          body: JSON.stringify({ id: input.id ?? undefined, name, email }),
          headers: { 'Content-Type': 'application/json' },
        },
        1,
        15_000,
      )

      if (!response.success || !response.data?.client) {
        syncError.value = response.message || 'Could not save the client.'
        return null
      }

      const customer = fromServerClient(response.data.client)
      upsertLocalCustomer(customer)
      return customer
    }

    const now = new Date().toISOString()

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

  async function removeCustomer(id: number): Promise<void> {
    if (serverBacked.value) {
      const response = await performFetch(
        `/api/stylist/client/${id}`,
        { method: 'DELETE' },
        1,
        15_000,
      )

      if (!response.success) {
        syncError.value = response.message || 'Could not delete the client.'
        return
      }
    }

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

  async function saveAppointment(input: {
    clientName: string
    date: string
    hourlyRateCents: number
    minutes: number
    productCostCents: number
  }): Promise<SuperkateAppointment | null> {
    const clientName = input.clientName.trim()
    if (!clientName || !input.date) return null

    if (serverBacked.value) {
      const response = await performFetch<{
        appointment: ServerAppointment
        client: ServerClient
      }>(
        '/api/stylist/appointment',
        {
          method: 'POST',
          body: JSON.stringify({
            clientName,
            date: input.date,
            hourlyRateCents: input.hourlyRateCents,
            minutes: input.minutes,
            productCostCents: input.productCostCents,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
        1,
        15_000,
      )

      if (!response.success || !response.data?.appointment) {
        syncError.value = response.message || 'Could not save the appointment.'
        return null
      }

      const appointment = fromServerAppointment(response.data.appointment)
      appointments.value = [...appointments.value, appointment]

      if (response.data.client) {
        upsertLocalCustomer(fromServerClient(response.data.client))
      }

      persist()
      return appointment
    }

    const customer =
      customerByName(clientName) ?? (await saveCustomer({ name: clientName }))

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

  async function removeAppointment(id: number): Promise<void> {
    if (serverBacked.value) {
      const response = await performFetch(
        `/api/stylist/appointment/${id}`,
        { method: 'DELETE' },
        1,
        15_000,
      )

      if (!response.success) {
        syncError.value = response.message || 'Could not delete the appointment.'
        return
      }
    }

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
    serverBacked,
    isSyncing,
    syncError,
    activeView,

    sortedCustomers,
    sortedAppointments,

    hydrate,
    loadFromServer,
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
