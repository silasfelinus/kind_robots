<template>
  <div class="mx-auto max-w-3xl p-4 space-y-6 bg-base-200 border rounded-2xl">
    <h2 class="text-2xl text-center font-bold">
      {{ isEditing ? 'Edit Pitch' : 'Create Pitch' }}
    </h2>

    <form class="space-y-4" @submit.prevent="handleFormSubmit">
      <PitchTypeSelector />

      <!-- Title -->
      <div>
        <label for="title" class="block text-sm font-semibold mb-1"
          >Title</label
        >
        <input
          id="title"
          v-model="formState.title"
          type="text"
          class="input input-bordered w-full"
          placeholder="Pitch title"
          required
        />
      </div>

      <!-- Prompt -->
      <div>
        <label for="prompt" class="block text-sm font-semibold mb-1"
          >Prompt</label
        >
        <textarea
          id="prompt"
          v-model="formState.pitch"
          class="textarea textarea-bordered w-full"
          placeholder="Describe your idea or concept"
          rows="3"
          :required="!isTitleType"
        />
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-semibold mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          v-model="formState.description"
          class="textarea textarea-bordered w-full"
          placeholder="Add extra context or flavor"
          rows="2"
        />
      </div>

      <!-- Examples -->
      <div>
        <label class="block text-sm font-semibold mb-1">Examples</label>
        <div class="space-y-2">
          <div
            v-for="(example, index) in examples"
            :key="index"
            class="flex items-center gap-2"
          >
            <input
              v-model="examples[index]"
              type="text"
              class="input input-bordered w-full"
              placeholder="Example prompt"
            />
            <button
              type="button"
              class="btn btn-ghost text-error"
              @click="removeExample(index)"
            >
              <Icon name="kind-icon:trash" class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              v-if="index > 0"
              @click="moveExample(index, -1)"
            >
              ⬆️
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              v-if="index < examples.length - 1"
              @click="moveExample(index, 1)"
            >
              ⬇️
            </button>
          </div>
          <button
            type="button"
            class="btn btn-link text-primary"
            @click="addExample"
          >
            + Add New Example
          </button>
        </div>
      </div>

      <!-- Public Toggle -->
      <div class="flex items-center gap-2">
        <input
          id="isPublic"
          v-model="formState.isPublic"
          type="checkbox"
          class="checkbox"
        />
        <label for="isPublic" class="text-sm">Make this pitch public</label>
      </div>

      <!-- Submit -->
      <div class="text-center">
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="
            !formState.title ||
            (!formState.pitch && !isTitleType) ||
            isSubmitting
          "
        >
          {{
            isSubmitting
              ? 'Submitting...'
              : isEditing
                ? 'Update Pitch'
                : 'Create Pitch'
          }}
        </button>
      </div>

      <!-- Error -->
      <p v-if="errorMessage" class="text-error text-center">
        {{ errorMessage }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, PitchType } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'

const pitchStore = usePitchStore()
const userStore = useUserStore()

const isEditing = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const examples = ref<string[]>([])

const formState = ref({
  id: undefined,
  title: '',
  pitch: '',
  description: '',
  examples: '',
  isPublic: true,
})

const isTitleType = computed(
  () => pitchStore.selectedPitchType === PitchType.TITLE,
)

function resetForm() {
  isEditing.value = false
  formState.value = {
    id: undefined,
    title: '',
    pitch: '',
    description: '',
    examples: '',
    isPublic: true,
  }
  examples.value = []
}

function addExample() {
  examples.value.push('')
}
function removeExample(index: number) {
  examples.value.splice(index, 1)
}
function moveExample(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < examples.value.length) {
    const temp = examples.value[index]
    examples.value[index] = examples.value[newIndex]
    examples.value[newIndex] = temp
  }
}

async function handleFormSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (isTitleType.value) {
      formState.value.pitch = formState.value.title
    }

    formState.value.examples = examples.value.join('|')

    const payload = {
      ...formState.value,
      designer: userStore.username,
      PitchType: pitchStore.selectedPitchType || undefined,
    }

    const result =
      isEditing.value && formState.value.id
        ? await pitchStore.updatePitch(formState.value.id, payload)
        : await pitchStore.createPitch(payload)

    if (result?.success) {
      resetForm()
    } else {
      errorMessage.value = result?.message || 'Error submitting pitch'
    }
  } catch {
    errorMessage.value = 'Failed to submit pitch'
  } finally {
    isSubmitting.value = false
  }
}
</script>
