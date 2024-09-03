<template>
  <div
    class="art-prompts rounded-2xl border bg-base-200 flex flex-col m-4 p-4 text-lg"
  >
    <h1>Art Prompts</h1>

    <!-- Fetch Button -->
    <button @click="fetchPrompts">Fetch Art Prompts</button>

    <!-- Add New Prompt (Visible to Admins) -->
    <div v-if="userRole === 'admin'" class="input-section">
      <input
        v-model="newPrompt"
        placeholder="New Prompt"
        class="input-styling"
      />
      <button
        :disabled="!isValidPrompt"
        class="add-button"
        @click="addNewPrompt"
      >
        Add Prompt
      </button>
    </div>

    <!-- List of Prompts -->
    <ul>
      <li v-for="prompt in prompts" :key="prompt.id">
        {{ prompt.prompt }}
        <button @click="selectPrompt(prompt)">Select</button>

        <!-- Edit and Delete (Visible to Admins) -->
        <span v-if="userRole === 'ADMIN' && userStore.isLoggedIn">
          <button
            class="rounded-2xl border bg-base-200 flex p-2 m-2"
            @click="startEditingPrompt(prompt)"
          >
            Edit
          </button>
          <button
            class="rounded-2xl border bg-base-200 flex p-2 m-2"
            @click="deletePrompt(prompt.id)"
          >
            Delete
          </button>
        </span>
      </li>
    </ul>

    <!-- Display Selected Prompt -->
    <div v-if="activePrompt">
      <h2>Selected Prompt: {{ activePrompt.prompt }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePromptStore, type Prompt } from './../../../stores/promptStore'
import { useUserStore } from './../../../stores/userStore'

const promptStore = usePromptStore()
const {
  fetchPrompts,
  selectPrompt,
  prompts,
  activePrompt,
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
.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.input-styling {
  font-size: 1.5rem;
  padding: 10px;
  border-radius: 12px;
  border: 2px solid bg-primary;
  width: 100%;
}

.add-button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 1.2rem;
  border-radius: 12px;
  background-color: bg-accent;
  color: white;
  cursor: pointer;
}

.add-button:disabled {
  background-color: bg-warning;
  cursor: not-allowed;
}
</style>
