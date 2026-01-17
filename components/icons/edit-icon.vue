<!-- /components/content/icons/edit-icon.vue -->

<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-xl shadow-xl border border-base-content/10 space-y-4"
  >
    <h2 class="text-2xl font-bold text-primary">Edit Icon</h2>

    <!-- Live Preview -->
    <div class="flex items-center gap-3">
      <Icon
        :name="form.icon || 'kind-icon:help'"
        class="text-4xl text-base-content"
      />
      <span class="text-base-content/70 text-sm">
        Preview: {{ form.icon || 'kind-icon:help' }}
      </span>
    </div>

    <!-- Title -->
    <label class="form-control">
      <span class="label-text">Title</span>
      <input v-model="form.title" class="input input-bordered w-full" />
    </label>

    <!-- Label -->
    <label class="form-control">
      <span class="label-text">Label</span>
      <input v-model="form.label" class="input input-bordered w-full" />
    </label>

    <!-- Description -->
    <label class="form-control">
      <span class="label-text">Description</span>
      <textarea
        v-model="form.description"
        class="textarea textarea-bordered w-full"
        rows="2"
      />
    </label>

    <!-- Designer -->
    <label class="form-control">
      <span class="label-text">Designer</span>
      <input v-model="form.designer" class="input input-bordered w-full" />
    </label>

    <!-- Icon Name -->
    <label class="form-control">
      <span class="label-text">Icon Name (e.g. kind-icon:home)</span>
      <input v-model="form.icon" class="input input-bordered w-full" />
    </label>

    <!-- Link -->
    <label class="form-control">
      <span class="label-text">Link</span>
      <input v-model="form.link" class="input input-bordered w-full" />
    </label>

    <!-- Type -->
    <label class="form-control">
      <span class="label-text">Type</span>
      <select v-model="form.type" class="select select-bordered w-full">
        <option value="nav">Navigation</option>
        <option value="utility">Utility</option>
      </select>
    </label>

    <!-- Public -->
    <label class="form-control inline-flex items-center gap-2">
      <input type="checkbox" v-model="form.isPublic" class="checkbox" />
      <span class="label-text">Public</span>
    </label>

    <!-- Buttons -->
    <div class="flex justify-end gap-2 pt-2">
      <button class="btn btn-outline btn-sm" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn btn-primary btn-sm" @click="save">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/edit-icon.vue
import { ref, watch } from 'vue'
import { useSmartbarStore } from '@/stores/smartbarStore'
import type { SmartIcon } from '~/prisma/generated/prisma/client'

const props = defineProps<{ icon: SmartIcon }>()
const emit = defineEmits(['close'])

const smartbarStore = useSmartbarStore()
const form = ref({ ...props.icon })

watch(
  () => props.icon,
  (val) => {
    form.value = { ...val }
  },
)

async function save() {
  if (!form.value.id) return
  const { success } = await smartbarStore.updateIcon(form.value.id, form.value)
  if (success) {
    emit('close')
  }
}
</script>
