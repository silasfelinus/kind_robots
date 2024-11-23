<template>
  <div class="bg-base-300 flex flex-col items-center rounded-2xl h-full p-4 sm:p-8">
    <h1 class="text-6xl font-bold mb-6 text-center">Kind Robots</h1>
    <div v-if="isLoggedIn" class="text-lg mb-6 text-center">
      You are already logged in. Would you like to
      <a href="/dashboard" class="text-info underline hover:text-info-focus">
        go to the dashboard
      </a>
      or
      <a
        href="#"
        class="text-info underline hover:text-info-focus"
        @click="userStore.logout"
      >
        log out
      </a>?
    </div>
    <form class="space-y-6 w-full max-w-md mx-auto" @submit.prevent="register">
      <div v-if="step === 1">
        <!-- Updated Pick a Username Layout -->
        <h1 class="text-4xl font-bold mb-4 text-center">
          Pick a
        </h1>
        <div class="text-primary font-semibold text-5xl text-center mb-2">
          <adjective-flipper />
        </div>
        <h2 class="text-4xl text-center mb-6">username.</h2>

        <div class="relative mb-6">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            required
            class="w-full p-4 border rounded-lg text-lg bg-base-200 placeholder-base-content"
            aria-label="Username"
            autocomplete="username"
            @input="checkUsernameAvailability"
          />
          <p
            v-if="usernameWarning"
            class="absolute text-sm text-warning right-2 bottom-2"
          >
            Username already exists
          </p>
        </div>
        <button
          v-if="username && !usernameWarning"
          type="button"
          class="w-full bg-primary text-lg text-base-100 py-2 rounded hover:bg-primary-dark transition duration-300"
          @click="goToStep(2)"
        >
          That's my name!
        </button>
      </div>

      <div v-if="step === 2">
        <h2 class="text-3xl font-semibold text-primary mb-4 text-center">
          Welcome, {{ username }}!
        </h2>
        <button
          type="button"
          class="text-sm text-info underline mb-4 text-center"
          @click="goToStep(1)"
        >
          I want a different username
        </button>
        <p class="text-lg mb-2">Optional details:</p>
        <div class="relative group mb-4">
          <input
            v-model="email"
            type="email"
            placeholder="Email (optional)"
            class="w-full p-4 border rounded-lg text-lg bg-base-200 placeholder-base-content"
            aria-label="Email"
            autocomplete="email"
          />
        </div>
        <div class="relative group mb-4">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password (keep it blank if you prefer)"
            class="w-full p-4 border rounded-lg text-lg bg-base-200 placeholder-base-content"
            aria-label="Password"
            autocomplete="new-password"
            @input="validatePassword"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon
              name="kind-icon:eye"
              :class="
                showPassword
                  ? 'text-base-300 cursor-pointer hover:text-warning'
                  : 'text-base-300 cursor-pointer hover:text-success'
              "
              title="Show/Hide Password"
              @click="togglePasswordVisibility"
            />
          </div>
          <p
            v-if="passwordError"
            class="text-sm text-warning right-2 bottom-2 absolute"
          >
            {{ passwordError }}
          </p>
        </div>
        <button
          type="submit"
          :disabled="!isFormValid || isLoading"
          class="w-full bg-primary text-lg text-base-100 py-2 rounded hover:bg-primary-dark transition duration-300"
        >
          <span v-if="isLoading">Registering...</span>
          <span v-else>Register</span>
        </button>
      </div>
    </form>
  </div>
</template>


<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const userStore = useUserStore()
const errorStore = useErrorStore()

userStore.initializeUser()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const usernameWarning = ref(false)
const status = ref('')
const error = ref('')
const isLoading = ref(false)
const statusMessage = ref('')

const showPassword = ref(false)
const passwordError = ref('')
const step = ref(1)
const showConfirmPassword = ref(false)
const firstPasswordValid = ref(false)

const validatePassword = () => {
  if (!password.value) {
    passwordError.value = ''
    firstPasswordValid.value = false
    return
  }

  const minLength = /^.{8,}$/
  const hasNumber = /\d/
  const hasLetter = /[a-zA-Z]/

  if (!minLength.test(password.value)) {
    passwordError.value = 'At least 8 characters'
    firstPasswordValid.value = false
  } else if (!hasNumber.test(password.value)) {
    passwordError.value = 'Include at least one number'
    firstPasswordValid.value = false
  } else if (!hasLetter.test(password.value)) {
    passwordError.value = 'Include at least one letter'
    firstPasswordValid.value = false
  } else {
    passwordError.value = ''
    firstPasswordValid.value = true
  }
}

const validateConfirmPassword = () => {
  if (password.value && password.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
  } else {
    passwordError.value = ''
  }
}

const welcomeMessage = ref('')

const checkUsernameAvailability = async () => {
  try {
    const usernames = await userStore.getUsernames()
    usernameWarning.value = usernames.includes(username.value)
    if (usernameWarning.value) {
      error.value = `Username "${username.value}" already exists.`
    } else {
      error.value = ''
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      errorStore.setError(
        ErrorType.UNKNOWN_ERROR,
        `Error checking username availability: ${e.message}`,
      )
    } else {
      errorStore.setError(
        ErrorType.UNKNOWN_ERROR,
        'An unknown error occurred while checking username availability.',
      )
    }
  }
}

const goToStep = (nextStep: number) => {
  if (nextStep === 2) {
    welcomeMessage.value = `Welcome, ${username.value}!`
  }
  step.value = nextStep
}

const isFormValid = computed(() => {
  return (
    username.value &&
    !usernameWarning.value &&
    (step.value === 1 ||
      ((!password.value || !passwordError.value) &&
        password.value === confirmPassword.value))
  )
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const isLoggedIn = computed(() => userStore.isLoggedIn)

const clearExistingUserData = () => {
  localStorage.removeItem('api_key')
  localStorage.removeItem('token')
}
const register = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  statusMessage.value = 'Registering user...'
  try {
    clearExistingUserData()

    // Register user
    const registerResponse = await userStore.register({
      username: username.value,
    })
    if (registerResponse.success) {
      statusMessage.value = 'Welcome to Kind Robots!'
      status.value = 'Welcome to Kind Robots!'

      // Automatically log the user in
      try {
        const credentials = {
          username: username.value,
          password: password.value || undefined,
        }
        const loginResponse = await userStore.login(credentials)
        if (!loginResponse.success) {
          throw new Error(loginResponse.message || 'Login failed')
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          errorStore.setError(
            ErrorType.AUTH_ERROR,
            `Login failed: ${error.message}`,
          )
        } else {
          errorStore.setError(
            ErrorType.AUTH_ERROR,
            'An unknown error occurred during login.',
          )
        }
      }
    } else {
      status.value = ''
      error.value = 'Registration failed. Please try again.'
      errorStore.setError(
        ErrorType.REGISTRATION_ERROR,
        'Registration failed. Please try again.',
      )
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      errorStore.setError(
        ErrorType.REGISTRATION_ERROR,
        `Registration failed: ${e.message}`,
      )
    } else {
      errorStore.setError(
        ErrorType.REGISTRATION_ERROR,
        'An unknown error occurred during registration.',
      )
    }
  }
  isLoading.value = false
}
</script>

<style scoped>
.bg-primary-dark {
  background-color: var(--color-primary-dark);
}
</style>
