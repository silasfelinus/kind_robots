<template>
  <div class="bg-base">
    <h1 class="text-2xl font-bold">Register</h1>
    <form class="space-y-4" @submit.prevent="register">
      <input
        v-model="username"
        type="text"
        placeholder="Username"
        required
        class="border rounded p-2"
      />
      <input v-model="email" type="email" placeholder="Email" required class="border rounded p-2" />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
        class="border rounded p-2"
      />
      <!-- Additional fields as needed -->
      <button type="submit" class="bg-blue-500 text-white rounded p-2">Register</button>
    </form>
    <p v-if="status" class="mt-2">{{ status }}</p>
    <p v-if="error" class="mt-2 text-red-500">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useUserStore } from '../../../stores/userStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import { useStatusStore, StatusType } from '../../../stores/statusStore'

const userStore = useUserStore()
const errorStore = useErrorStore()
const statusStore = useStatusStore()

const username = ref('')
const email = ref('')
const password = ref('')

const status = ref('')
const error = ref('')

const register = async () => {
  statusStore.setStatus(StatusType.INFO, 'Registering user...')
  try {
    const userData = {
      username: username.value,
      email: email.value,
      password: password.value
      // Additional data as needed
    }

    await userStore.addUsers([userData])

    statusStore.setStatus(StatusType.SUCCESS, 'Registration successful')
    status.value = 'Registration successful'
  } catch (e) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Registration failed: ' + e)
    error.value = 'Registration failed: ' + e
  }
}
</script>
