<template>
  <div class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-6 grid-cols-1">
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Sample Model</h1>

    <!-- Select / Deselect -->
    <div class="flex flex-wrap justify-between items-center gap-4">
      <sample-selector />

      <div v-if="sampleStore.selectedItem" class="flex items-center">
        <button class="btn btn-icon" @click="deselectCurrentItem">
          <icon name="mdi:close-box" class="text-3xl" />
        </button>
        <p class="ml-2">Create new entry</p>
      </div>

      <div class="flex-grow max-w-xs">
        <label for="designer" class="block text-lg font-medium">Designer:</label>
        <input
          v-if="canEditDesigner"
          id="designer"
          v-model="sampleStore.form.designer"
          type="text"
          class="w-full p-3 rounded-lg border"
        />
        <p v-else>{{ sampleStore.form.designer }}</p>
      </div>

      <div class="flex gap-6">
        <div>
          <label class="block text-lg font-medium">Visibility:</label>
          <div class="flex space-x-2">
            <button
              type="button"
              :class="sampleStore.form.isPublic ? 'btn btn-primary' : 'btn btn-outline'"
              @click="sampleStore.form.isPublic = true"
            >
              Public
            </button>
            <button
              type="button"
              :class="!sampleStore.form.isPublic ? 'btn btn-primary' : 'btn btn-outline'"
              @click="sampleStore.form.isPublic = false"
            >
              Private
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-4">
        <choice-manager label="title" model="SampleModel" />
        <choice-manager label="label" model="SampleModel" />
        <choice-manager label="type" model="SampleModel" />
      </div>
      <div class="space-y-4">
        <choice-manager label="icon" model="SampleModel" />
        <choice-manager label="link" model="SampleModel" />
        <choice-manager label="component" model="SampleModel" />
      </div>
    </div>

    <!-- Submit -->
    <form @submit.prevent="handleSubmit" class="bg-white shadow-md rounded-xl p-6 w-full mt-6">
      <div v-if="isLoading" class="loading loading-ring loading-lg mt-4"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-500 mt-2">{{ successMessage }}</div>

      <button type="submit" class="btn btn-primary mt-4" :disabled="isLoading">
        <span v-if="isLoading">Saving...</span>
        <span v-else>{{ sampleStore.form.id ? 'Update Entry' : 'Create New Entry' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSampleModelStore } from '@/stores/sampleModelStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useUserStore } from '@/stores/userStore'

const sampleStore = useSampleModelStore()
const choiceStore = useChoiceStore()
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const canEditDesigner = computed(() =>
  !sampleStore.form.id || sampleStore.form.userId === userStore.userId
)

function deselectCurrentItem() {
  sampleStore.deselect()
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const fields = ['title', 'label', 'type', 'icon', 'link', 'component']
    fields.forEach((field) => {
      choiceStore.applyToForm(sampleStore.form, field, 'SampleModel')
    })

    const result = await sampleStore.save()
    if (result.success) {
      successMessage.value = sampleStore.form.id
        ? 'Entry updated successfully!'
        : 'New entry created successfully!'
    } else {
      errorMessage.value = result.message || 'Failed to save entry.'
    }
  } catch (error) {
    errorMessage.value = `Error: ${(error as Error).message}`
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  sampleStore.initialize()
  choiceStore.initialize()
})
</script>
