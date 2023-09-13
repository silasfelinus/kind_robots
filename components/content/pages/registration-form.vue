<template>
  <div class="bg-base-200 flex flex-col items-center p-4 rounded-2xl">
    <h1 class="text-3xl font-bold text-primary mb-4">Join Kind Robots</h1>
    <form class="space-y-4 w-full max-w-sm" @submit.prevent="register">
      <div class="relative">
        <input
          v-model="username"
          type="text"
          placeholder="Username"
          required
          class="w-full p-2 border rounded text-lg bg-base-100 placeholder-base-300"
          @input="checkUsernameAvailability"
        />
        <p v-if="usernameWarning" class="absolute text-xs text-warning right-2 bottom-1">
          Username already exists
        </p>
      </div>
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
        class="w-full p-2 border rounded text-lg bg-base-100 placeholder-base-300"
      />
      <div class="relative group">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Password"
          required
          class="w-full p-2 border rounded text-lg bg-base-100 placeholder-base-300"
          @input="validatePassword"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          <icon
            v-if="!showPassword"
            name="eye"
            class="text-base-300 cursor-pointer"
            @click="togglePasswordVisibility"
          />
          <icon
            v-if="showPassword"
            name="eye-off"
            class="text-base-300 cursor-pointer"
            @click="togglePasswordVisibility"
          />
        </div>
        <p v-if="passwordError" class="absolute text-xs text-warning right-2 bottom-1">
          {{ passwordError }}
        </p>
      </div>
      <input
        v-model="confirmPassword"
        :type="showConfirmPassword ? 'text' : 'password'"
        placeholder="Confirm Password"
        required
        class="w-full p-2 border rounded text-lg bg-base-100 placeholder-base-300"
        @input="validateConfirmPassword"
      />
      <button
        type="submit"
        :disabled="!isFormValid"
        class="w-full bg-primary text-lg text-base-100 p-2 rounded hover:bg-primary-dark transition duration-300"
      >
        Register
      </button>
    </form>
    <p v-if="status" class="mt-2 text-lg text-info">{{ status }}</p>
    <p v-if="error" class="mt-2 text-lg text-warning">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import { useStatusStore, StatusType } from '../../../stores/statusStore'

const userStore = useUserStore()
const errorStore = useErrorStore()
const statusStore = useStatusStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const usernameWarning = ref(false)
const passwordError = ref('')
const status = ref('')
const error = ref('')

const isFormValid = computed(() => {
  return (
    username.value &&
    !usernameWarning.value &&
    password.value &&
    !passwordError.value &&
    password.value === confirmPassword.value
  )
})

const checkUsernameAvailability = async () => {
  // Fetch the list of usernames and check if the entered username exists
  const usernames = await userStore.getUsernames()
  usernameWarning.value = usernames.includes(username.value)
}

const validatePassword = () => {
  const minLength = /^.{8,}$/
  const hasNumber = /\d/
  const hasLetter = /[a-zA-Z]/

  if (!minLength.test(password.value)) {
    passwordError.value = 'At least 8 characters'
  } else if (!hasNumber.test(password.value)) {
    passwordError.value = 'Include at least one number'
  } else if (!hasLetter.test(password.value)) {
    passwordError.value = 'Include at least one letter'
  } else {
    passwordError.value = ''
  }
}

const validateConfirmPassword = () => {
  if (password.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
  } else {
    passwordError.value = ''
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const register = async () => {
  if (!isFormValid.value) return

  statusStore.setStatus(StatusType.INFO, 'Registering user...')
  try {
    const userData = {
      username: username.value,
      email: email.value,
      password: password.value
    }

    const response = await userStore.register(userData)
    if (response.success) {
      statusStore.setStatus(StatusType.SUCCESS, 'Welcome to Kind Robots!')
      status.value = 'Welcome to Kind Robots!'
    } else {
      status.value = ''
      error.value = 'Registration failed. Please try again.'
    }
  } catch (e) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Registration failed: ' + e)
    error.value = 'Registration failed: ' + e
  }
}
</script>

<style scoped>
.bg-primary-dark {
  background-color: var(--color-primary-dark);
}
</style>
