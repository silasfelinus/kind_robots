<!-- /components/art/stylist-clients.vue -->
<template>
  <section class="stylist-clients flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4">
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:heart" class="h-5 w-5 text-primary" />
      <h2 class="text-base font-black text-base-content">Clients</h2>
      <span class="badge badge-ghost badge-sm">{{ superkate.sortedCustomers.length }}</span>
    </header>

    <form class="flex flex-wrap items-end gap-2 rounded-xl border border-base-300 bg-base-100 p-3" @submit.prevent="save">
      <label class="flex min-w-40 flex-1 flex-col gap-1">
        <span class="text-xs font-black">Name</span>
        <input v-model="name" type="text" placeholder="Client name" class="input input-sm input-bordered w-full" />
      </label>
      <label class="flex min-w-40 flex-1 flex-col gap-1">
        <span class="text-xs font-black">Email (optional)</span>
        <input v-model="email" type="email" placeholder="For receipt prefill" class="input input-sm input-bordered w-full" />
      </label>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!name.trim()">
        {{ editingId ? 'Update' : 'Add client' }}
      </button>
      <button v-if="editingId" type="button" class="btn btn-ghost btn-sm" @click="resetForm">Cancel</button>
    </form>

    <p v-if="photoError" class="rounded-xl bg-error/10 p-2 text-xs text-error">{{ photoError }}</p>
    <p v-if="!superkate.sortedCustomers.length" class="text-xs text-base-content/40">
      No clients yet — add one above, or save an appointment and the client is created automatically.
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="customer in superkate.sortedCustomers"
        :key="customer.id"
        class="rounded-xl border border-base-300 bg-base-100 p-2"
      >
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
            <img
              v-if="photoUrls[customer.id]"
              :src="photoUrls[customer.id]"
              :alt="`${customer.name} primary client photo`"
              class="h-full w-full object-cover"
            />
            <Icon v-else name="kind-icon:user" class="size-7 text-base-content/25" />
          </div>

          <div class="flex min-w-44 flex-1 flex-col">
            <span class="truncate text-sm font-bold">{{ customer.name }}</span>
            <span class="truncate text-xs text-base-content/50">
              {{ customer.email || 'no email' }} ·
              {{ superkate.appointmentsForCustomer(customer.id).length }} appointments ·
              {{ photoCounts[customer.id] || 0 }} photos
            </span>
            <span class="mt-1 text-[0.68rem] text-base-content/40">
              Private gallery with before, after, style, inspiration, and formula folders.
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <button type="button" class="btn btn-primary btn-xs" @click="toggleGallery(customer.id)">
              <Icon name="kind-icon:image" class="size-3.5" />
              {{ openGalleryId === customer.id ? 'Close gallery' : 'Open gallery' }}
            </button>
            <button type="button" class="btn btn-ghost btn-xs" @click="edit(customer)">Edit</button>
            <button type="button" class="btn btn-ghost btn-xs text-error" @click="confirmRemove(customer)">Delete</button>
          </div>
        </div>

        <stylist-client-gallery
          v-if="openGalleryId === customer.id"
          :client="customer"
          @changed="loadPhotoIndex"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useSuperkateStore, type SuperkateCustomer } from '@/stores/superkateStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

const superkate = useSuperkateStore()
const userStore = useUserStore()
const name = ref('')
const email = ref('')
const editingId = ref<number | null>(null)
const openGalleryId = ref<number | null>(null)
const photoError = ref('')
const photoUrls = reactive<Record<number, string>>({})
const photoCounts = reactive<Record<number, number>>({})

type ClientPhotoSummary = {
  id: number
  photoUrl?: string | null
  photoCount?: number | null
}

function resetForm() {
  name.value = ''
  email.value = ''
  editingId.value = null
}

function edit(customer: SuperkateCustomer) {
  editingId.value = customer.id
  name.value = customer.name
  email.value = customer.email
}

function toggleGallery(clientId: number) {
  openGalleryId.value = openGalleryId.value === clientId ? null : clientId
}

function revokePhotoUrl(clientId: number) {
  const current = photoUrls[clientId]
  if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
  delete photoUrls[clientId]
}

async function loadPrivatePhoto(clientId: number, url: string) {
  const token = userStore.token || userStore.user?.token || ''
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) return
  revokePhotoUrl(clientId)
  photoUrls[clientId] = URL.createObjectURL(await response.blob())
}

async function save() {
  if (!name.value.trim()) return
  await superkate.saveCustomer({ id: editingId.value, name: name.value, email: email.value })
  resetForm()
  await loadPhotoIndex()
}

async function loadPhotoIndex() {
  const response = await performFetch<{ clients: ClientPhotoSummary[] }>(
    '/api/stylist/suite',
    { method: 'GET' },
    1,
    20000,
  )
  if (!response.success || !response.data) return

  const clients = response.data.clients || []
  const activeIds = new Set(clients.map((client) => client.id))
  Object.keys(photoUrls).forEach((key) => {
    const id = Number(key)
    if (!activeIds.has(id)) revokePhotoUrl(id)
  })

  await Promise.all(clients.map(async (client) => {
    photoCounts[client.id] = client.photoCount || 0
    if (client.photoUrl) await loadPrivatePhoto(client.id, client.photoUrl)
    else revokePhotoUrl(client.id)
  }))
}

function confirmRemove(customer: SuperkateCustomer) {
  const ok = typeof window !== 'undefined' && window.confirm(
    `Delete ${customer.name}? Their appointment history keeps its name, but the profile, email, and entire private gallery are removed.`,
  )
  if (!ok) return
  void superkate.removeCustomer(customer.id)
  revokePhotoUrl(customer.id)
  delete photoCounts[customer.id]
  if (openGalleryId.value === customer.id) openGalleryId.value = null
  if (editingId.value === customer.id) resetForm()
}

onMounted(loadPhotoIndex)
onBeforeUnmount(() => Object.keys(photoUrls).forEach((key) => revokePhotoUrl(Number(key))))
</script>