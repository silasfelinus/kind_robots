<!-- /components/art/stylist-clients.vue -->
<!--
  Superkate client database: add/edit/delete customers, attach a private profile
  photo, and keep appointment history detached when a client is deleted.
-->
<template>
  <section
    class="stylist-clients flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:heart" class="h-5 w-5 text-primary" />
      <h2 class="text-base font-black text-base-content">Clients</h2>
      <span class="badge badge-ghost badge-sm">{{ superkate.sortedCustomers.length }}</span>
    </header>

    <form
      class="flex flex-wrap items-end gap-2 rounded-xl border border-base-300 bg-base-100 p-3"
      @submit.prevent="save"
    >
      <label class="flex min-w-40 flex-1 flex-col gap-1">
        <span class="text-xs font-black text-base-content">Name</span>
        <input
          v-model="name"
          type="text"
          placeholder="Client name"
          class="input input-sm input-bordered w-full"
        />
      </label>
      <label class="flex min-w-40 flex-1 flex-col gap-1">
        <span class="text-xs font-black text-base-content">Email (optional)</span>
        <input
          v-model="email"
          type="email"
          placeholder="For receipt prefill"
          class="input input-sm input-bordered w-full"
        />
      </label>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!name.trim()">
        {{ editingId ? 'Update' : 'Add client' }}
      </button>
      <button
        v-if="editingId"
        type="button"
        class="btn btn-ghost btn-sm"
        @click="resetForm"
      >
        Cancel
      </button>
    </form>

    <p v-if="photoError" class="rounded-xl bg-error/10 p-2 text-xs text-error">
      {{ photoError }}
    </p>

    <p v-if="!superkate.sortedCustomers.length" class="text-xs text-base-content/40">
      No clients yet — add one above, or save an appointment and the client is created
      automatically.
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="customer in superkate.sortedCustomers"
        :key="customer.id"
        class="flex flex-wrap items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-2"
      >
        <div
          class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200"
        >
          <img
            v-if="photoUrls[customer.id]"
            :src="photoUrls[customer.id]"
            :alt="`${customer.name} client photo`"
            class="h-full w-full object-cover"
          />
          <Icon v-else name="kind-icon:user" class="size-7 text-base-content/25" />
        </div>

        <div class="flex min-w-44 flex-1 flex-col">
          <span class="truncate text-sm font-bold">{{ customer.name }}</span>
          <span class="truncate text-xs text-base-content/50">
            {{ customer.email || 'no email' }} ·
            {{ superkate.appointmentsForCustomer(customer.id).length }} appointments
          </span>
          <span class="mt-1 text-[0.68rem] text-base-content/40">
            Client photos are private and stored with this profile.
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1">
          <label class="btn btn-ghost btn-xs" :class="{ 'btn-disabled': uploadingId === customer.id }">
            <span v-if="uploadingId === customer.id" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:camera" class="size-3.5" />
            Take photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              class="hidden"
              :disabled="uploadingId === customer.id"
              @change="uploadPhoto(customer, $event)"
            />
          </label>

          <label class="btn btn-ghost btn-xs" :class="{ 'btn-disabled': uploadingId === customer.id }">
            <Icon name="kind-icon:upload" class="size-3.5" />
            Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              :disabled="uploadingId === customer.id"
              @change="uploadPhoto(customer, $event)"
            />
          </label>

          <button type="button" class="btn btn-ghost btn-xs" @click="edit(customer)">
            Edit
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error"
            @click="confirmRemove(customer)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  useSuperkateStore,
  type SuperkateCustomer,
} from '@/stores/superkateStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

const superkate = useSuperkateStore()
const userStore = useUserStore()

const name = ref('')
const email = ref('')
const editingId = ref<number | null>(null)
const uploadingId = ref<number | null>(null)
const photoError = ref('')
const photoUrls = reactive<Record<number, string>>({})

type ClientPhotoSummary = {
  id: number
  photoUrl?: string | null
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

function revokePhotoUrl(clientId: number): void {
  const current = photoUrls[clientId]
  if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
  delete photoUrls[clientId]
}

async function loadPrivatePhoto(clientId: number, url: string): Promise<void> {
  const token = userStore.token || userStore.user?.token || ''
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) return

  const blob = await response.blob()
  revokePhotoUrl(clientId)
  photoUrls[clientId] = URL.createObjectURL(blob)
}

async function save() {
  if (!name.value.trim()) return
  await superkate.saveCustomer({
    id: editingId.value,
    name: name.value,
    email: email.value,
  })
  resetForm()
  await loadPhotoIndex()
}

async function loadPhotoIndex(): Promise<void> {
  const response = await performFetch<{
    clients: ClientPhotoSummary[]
  }>('/api/stylist/suite', { method: 'GET' }, 1, 20_000)

  if (!response.success || !response.data) return

  const clientsWithPhotos = (response.data.clients ?? []).filter(
    (client): client is ClientPhotoSummary & { photoUrl: string } =>
      typeof client.photoUrl === 'string' && client.photoUrl.length > 0,
  )
  const activeIds = new Set(clientsWithPhotos.map((client) => client.id))

  for (const key of Object.keys(photoUrls)) {
    const clientId = Number(key)
    if (!activeIds.has(clientId)) revokePhotoUrl(clientId)
  }

  await Promise.all(
    clientsWithPhotos.map((client) => loadPrivatePhoto(client.id, client.photoUrl)),
  )
}

async function uploadPhoto(customer: SuperkateCustomer, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploadingId.value = customer.id
  photoError.value = ''

  try {
    const form = new FormData()
    form.append('file', file)

    const response = await performFetch<{ photoUrl: string }>(
      `/api/stylist/client/${customer.id}/photo`,
      { method: 'POST', body: form },
      1,
      30_000,
    )

    if (!response.success || !response.data?.photoUrl) {
      throw new Error(response.message || 'Could not save the client photo.')
    }

    await loadPrivatePhoto(customer.id, response.data.photoUrl)
  } catch (error) {
    photoError.value =
      error instanceof Error ? error.message : 'Could not save the client photo.'
  } finally {
    uploadingId.value = null
  }
}

function confirmRemove(customer: SuperkateCustomer) {
  const ok =
    typeof window === 'undefined'
      ? false
      : window.confirm(
          `Delete ${customer.name}? Their appointment history keeps its name, but the profile, email, and private photo are removed.`,
        )

  if (ok) {
    void superkate.removeCustomer(customer.id)
    revokePhotoUrl(customer.id)
    if (editingId.value === customer.id) resetForm()
  }
}

onMounted(() => {
  void loadPhotoIndex()
})

onBeforeUnmount(() => {
  for (const key of Object.keys(photoUrls)) revokePhotoUrl(Number(key))
})
</script>