<template>
  <div
    class="art-prompts bg-base-200 rounded-2xl border flex flex-col m-4 p-4 space-y-4"
  >
    <h1 class="text-2xl font-semibold text-center">Art Prompts</h1>

    <!-- Fetch Button -->
    <div class="flex justify-center">
      <button class="btn btn-primary" @click="fetchPrompts">
        Fetch Art Prompts
      </button>
    </div>

    <!-- Add New Prompt (Visible to Admins) -->
    <div
      v-if="userRole === 'admin'"
      class="flex flex-col items-center space-y-2"
    >
      <input
        v-model="newPrompt"
        placeholder="New Prompt"
        class="input input-bordered w-full max-w-md"
      />
      <button
        :disabled="!isValidPrompt"
        class="btn btn-accent"
        @click="addNewPrompt"
      >
        Add Prompt
      </button>
    </div>

    <!-- List of Prompts -->
    <ul class="space-y-4">
      <li
        v-for="prompt in prompts"
        :key="prompt.id"
        class="border-b p-4 flex justify-between items-center"
      >
        <span>{{ prompt.prompt }}</span>
        <div class="flex space-x-2">
          <button class="btn btn-sm btn-info" @click="selectPrompt(prompt)">
            Select
          </button>

          <!-- Edit and Delete (Visible to Admins) -->
          <div
            v-if="userRole === 'ADMIN' && userStore.isLoggedIn"
            class="flex space-x-2"
          >
            <button
              class="btn btn-sm btn-warning"
              @click="startEditingPrompt(prompt)"
            >
              Edit
            </button>
            <button
              class="btn btn-sm btn-error"
              @click="deletePrompt(prompt.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Display Selected Prompt -->
    <div v-if="selectedPrompt" class="border-t pt-4">
      <h2 class="text-lg font-semibold">
        Selected Prompt: {{ selectedPrompt.prompt }}
      </h2>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePromptStore, type Prompt } from './../../../stores/promptStore'
import { useUserStore } from './../../../stores/userStore'

const promptStore = usePromptStore()
const {
  fetchPrompts,
  selectPrompt,
  prompts,
  selectedPrompt, // Use selectedPrompt instead of activePrompt
  createPrompt,
  deletePrompt,
} = promptStore

const userStore = useUserStore()

// User role (this should come from your user management logic)
const userRole = userStore.role

// New prompt input
const newPrompt = ref('')

const editingPrompt = ref<Prompt | null>(null)

// Start editing a prompt
const startEditingPrompt = (prompt: Prompt) => {
  editingPrompt.value = prompt
  newPrompt.value = prompt.prompt
}

// Fetch art prompts when the component is mounted
onMounted(() => {
  fetchPrompts()
})

// Validation for new prompt
const isValidPrompt = computed(() => {
  return newPrompt.value.trim().length > 0
})

// Add a new prompt
const addNewPrompt = () => {
  if (isValidPrompt.value) {
    createPrompt(newPrompt.value.trim())
    newPrompt.value = ''
  }
}
</script>
<style scoped>
.btn-primary {
  @apply bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark;
}

.btn-accent {
  @apply bg-accent text-white py-2 px-4 rounded-lg hover:bg-accent-dark;
}

.btn-info {
  @apply bg-info text-white py-1 px-3 rounded-lg hover:bg-info-dark;
}

.btn-warning {
  @apply bg-warning text-white py-1 px-3 rounded-lg hover:bg-warning-dark;
}

.btn-error {
  @apply bg-error text-white py-1 px-3 rounded-lg hover:bg-error-dark;
}

.input-bordered {
  @apply border-gray-300 rounded-lg p-2;
}
</style>
