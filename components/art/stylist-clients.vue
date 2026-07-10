<!-- /components/art/stylist-clients.vue -->
<!--
  Superkate client database (web replica): add/edit/delete customers with an
  optional email for receipt prefill. Deleting a client keeps appointment
  history (client name snapshot) per the calculator spec's delete-detach rule.
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

    <!-- Add / edit form -->
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

    <p v-if="!superkate.sortedCustomers.length" class="text-xs text-base-content/40">
      No clients yet — add one above, or save an appointment and the client is created
      automatically.
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="customer in superkate.sortedCustomers"
        :key="customer.id"
        class="flex flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
      >
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm font-bold">{{ customer.name }}</span>
          <span class="truncate text-xs text-base-content/50">
            {{ customer.email || 'no email' }} ·
            {{ superkate.appointmentsForCustomer(customer.id).length }} appointments
          </span>
        </div>
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
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  useSuperkateStore,
  type SuperkateCustomer,
} from '@/stores/superkateStore'

const superkate = useSuperkateStore()

const name = ref('')
const email = ref('')
const editingId = ref<number | null>(null)

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

async function save() {
  if (!name.value.trim()) return
  await superkate.saveCustomer({
    id: editingId.value,
    name: name.value,
    email: email.value,
  })
  resetForm()
}

function confirmRemove(customer: SuperkateCustomer) {
  const ok =
    typeof window === 'undefined'
      ? false
      : window.confirm(
          `Delete ${customer.name}? Their appointment history keeps its name, but the profile and email are removed.`,
        )

  if (ok) {
    void superkate.removeCustomer(customer.id)
    if (editingId.value === customer.id) resetForm()
  }
}
</script>
