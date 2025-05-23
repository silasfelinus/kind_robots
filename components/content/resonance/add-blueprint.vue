<!-- /components/content/blueprints/add-blueprint.vue -->
<template>
  <div
    class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 max-w-5xl space-y-6"
  >
    <h1 class="text-4xl text-center font-bold">Create or Edit a Blueprint</h1>

    <!-- Selector + Designer -->
    <div class="flex flex-wrap justify-between items-center gap-4">
      <blueprint-selector />

      <div v-if="blueprintStore.selectedItem" class="flex items-center">
        <button class="btn btn-icon" @click="deselectCurrentItem">
          <icon name="mdi:close-box" class="text-2xl" />
        </button>
        <span class="ml-2 text-sm">Create new entry</span>
      </div>

      <div class="flex-grow max-w-xs">
        <label class="block text-sm font-semibold mb-1">Designer</label>
        <input
          v-if="canEditDesigner"
          v-model="blueprintStore.form.designer"
          type="text"
          class="input input-bordered w-full"
        />
        <p v-else class="text-sm text-base-content/70">
          {{ blueprintStore.form.designer }}
        </p>
      </div>

      <div class="flex gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Visibility</label>
          <div class="flex space-x-2">
            <button
              type="button"
              class="btn btn-sm"
              :class="
                blueprintStore.form.isPublic ? 'btn-primary' : 'btn-outline'
              "
              @click="blueprintStore.form.isPublic = true"
            >
              Public
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="
                !blueprintStore.form.isPublic ? 'btn-primary' : 'btn-outline'
              "
              @click="blueprintStore.form.isPublic = false"
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
        <choice-manager label="title" model="Blueprint" />
        <choice-manager label="description" model="Blueprint" />
        <choice-manager label="tags" model="Blueprint" />
      </div>
      <div class="space-y-4">
        <choice-manager label="coverArtId" model="Blueprint" />
        <label class="form-control">
          <span class="label-text">Steps (JSON)</span>
          <textarea
            v-model="stepsInput"
            rows="6"
            class="textarea textarea-bordered"
          ></textarea>
        </label>
      </div>
    </div>

    <!-- Submit -->
    <form @submit.prevent="handleSubmit" class="pt-4">
      <div v-if="isLoading" class="loading loading-ring loading-lg"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </div>

      <button type="submit" class="btn btn-primary mt-4" :disabled="isLoading">
        <span v-if="isLoading">Saving...</span>
        <span v-else>{{
          blueprintStore.form.id ? 'Update Blueprint' : 'Create Blueprint'
        }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
// /components/content/blueprints/add-blueprint.vue
import { ref, computed, onMounted, watch } from 'vue'
import { useBlueprintStore, type SupportedModel } from '@/stores/blueprintStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useUserStore } from '@/stores/userStore'

const blueprintStore = useBlueprintStore()
const choiceStore = useChoiceStore()
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const stepsInput = ref(
  blueprintStore.form.steps
    ? typeof blueprintStore.form.steps === 'string'
      ? blueprintStore.form.steps
      : JSON.stringify(blueprintStore.form.steps, null, 2)
    : '',
)

watch(
  () => blueprintStore.form.steps,
  (newVal) => {
    stepsInput.value =
      typeof newVal === 'string'
        ? newVal
        : JSON.stringify(newVal ?? '', null, 2)
  },
)

const canEditDesigner = computed(
  () =>
    !blueprintStore.form.id || blueprintStore.form.userId === userStore.userId,
)

function deselectCurrentItem() {
  blueprintStore.deselect()
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const fields = ['title', 'description', 'tags', 'coverArtId']
    fields.forEach((field) => {
      choiceStore.applyToForm(blueprintStore.form, field, 'Blueprint')
    })

    try {
      blueprintStore.form.steps = stepsInput.value
        ? JSON.parse(stepsInput.value)
        : []
    } catch (e) {
      errorMessage.value = 'Steps must be valid JSON.'
      isLoading.value = false
      return
    }

    const result = await blueprintStore.save()
    if (result.success) {
      successMessage.value = blueprintStore.form.id
        ? 'Blueprint updated successfully!'
        : 'Blueprint created successfully!'
    } else {
      errorMessage.value = result.message || 'Failed to save blueprint.'
    }
  } catch (error) {
    errorMessage.value = `Error: ${(error as Error).message}`
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  blueprintStore.initialize()
  choiceStore.initialize()
})
</script>
