<!-- /components/content/story/edit-icon.vue -->
<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-md shadow-xl border border-base-content/10"
  >
    <h2 class="text-xl font-bold mb-4">Edit Icon</h2>

    <label class="form-control mb-2">
      <span class="label-text">Title</span>
      <input v-model="form.title" class="input input-bordered" />
    </label>

    <label class="form-control mb-2">
      <span class="label-text">Label</span>
      <input v-model="form.label" class="input input-bordered" />
    </label>

    <label class="form-control mb-2">
      <span class="label-text">Description</span>
      <textarea
        v-model="form.description"
        class="textarea textarea-bordered"
        rows="3"
      />
    </label>

    <label class="form-control mb-2">
      <span class="label-text">Designer</span>
      <input v-model="form.designer" class="input input-bordered" />
    </label>

    <div class="flex justify-end mt-4 gap-2">
      <button class="btn btn-outline btn-sm" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn btn-primary btn-sm" @click="save">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIconStore } from '@/stores/iconStore'
import type { SmartIcon } from '@prisma/client'

const props = defineProps<{ icon: SmartIcon }>()
const emit = defineEmits(['close'])

const iconStore = useIconStore()
const form = ref({ ...props.icon })

watch(
  () => props.icon,
  (val) => {
    form.value = { ...val }
  },
)

async function save() {
  if (!form.value.id) return

  const { success } = await iconStore.updateIcon(form.value.id, form.value)

  if (success) {
    // Update the icon in the local store too (if needed)
    const index = iconStore.icons.findIndex((i) => i.id === form.value.id)
    if (index !== -1) {
      iconStore.icons[index] = { ...form.value } as SmartIcon
      iconStore.syncToLocalStorage()
    }
    emit('close')
  }
}
</script>
