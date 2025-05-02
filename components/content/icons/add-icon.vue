<!-- /pages/add-icon.vue -->
<template>
  <div class="container mx-auto max-w-xl p-6 space-y-4">
    <h1 class="text-3xl font-bold text-primary">Create New Icon</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <input
        v-model="form.title"
        type="text"
        placeholder="Title"
        class="input input-bordered w-full"
        required
      />
      <input
        v-model="form.label"
        type="text"
        placeholder="Label (optional)"
        class="input input-bordered w-full"
      />
      <input
        v-model="form.description"
        type="text"
        placeholder="Description (optional)"
        class="input input-bordered w-full"
      />
      <input
        v-model="form.icon"
        type="text"
        placeholder="Icon name (e.g. lucide:home)"
        class="input input-bordered w-full"
        required
      />
      <input
        v-model="form.link"
        type="text"
        placeholder="Route or external link"
        class="input input-bordered w-full"
      />

      <!-- Removed type selector: always "nav" -->
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="form.isPublic" class="checkbox" />
        Public
      </label>

      <button type="submit" class="btn btn-primary w-full">Save Icon</button>
    </form>
  </div>
</template>

<script setup lang="ts">
// /pages/add-icon.vue
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useIconStore } from '@/stores/iconStore'

const router = useRouter()
const iconStore = useIconStore()

const form = reactive({
  title: '',
  type: 'nav', // enforced
  icon: '',
  label: '',
  link: '',
  description: '',
  component: '',
  isPublic: true,
})

async function handleSubmit() {
  form.type = 'nav' // always enforced just in case
  if (!form.title || !form.icon) return

  const { success, data } = await iconStore.createIcon(form)
  if (success && data?.id) {
    iconStore.addIconToSmartBar(data.id)
    router.push('/icongallery')
  }
}
</script>
