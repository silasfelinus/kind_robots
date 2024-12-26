<template>
  <div
    class="bg-base-300 flex flex-col items-center rounded-2xl h-full p-4 sm:p-8"
  >
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
        log out </a
      >?
    </div>
    <form class="space-y-6 w-full max-w-md mx-auto" @submit.prevent="register">
      <div v-if="step === 1">
        <!-- Pick a Username Section -->
        <h1 class="text-4xl font-bold mb-4 text-center">Pick a</h1>
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
          type="button"
          class="w-full bg-primary text-lg text-base-100 py-2 rounded hover:bg-primary-dark transition duration-300 mb-4"
          @click="generateUsername"
        >
          Generate Random Username
        </button>
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
        <!-- Password and Confirmation Section -->
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
          <p v-if="passwordError" class="text-sm text-warning mt-2">
            {{ passwordError }}
          </p>
        </div>

        <div class="relative group mb-4">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm Password"
            class="w-full p-4 border rounded-lg text-lg bg-base-200 placeholder-base-content"
            aria-label="Confirm Password"
            autocomplete="new-password"
            @input="validateConfirmPassword"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon
              name="kind-icon:eye"
              :class="
                showConfirmPassword
                  ? 'text-base-300 cursor-pointer hover:text-warning'
                  : 'text-base-300 cursor-pointer hover:text-success'
              "
              title="Show/Hide Confirm Password"
              @click="toggleConfirmPasswordVisibility"
            />
          </div>
          <p v-if="confirmPasswordError" class="text-sm text-warning mt-2">
            {{ confirmPasswordError }}
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
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/userStore';
import { useErrorStore, ErrorType } from '~/stores/errorStore';
import { generateUsername } from '~/utils/generateUsername';

// Store setup
const userStore = useUserStore();
const errorStore = useErrorStore();

userStore.initializeUser();

// Reactive state
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const usernameWarning = ref(false);
const error = ref('');
const isLoading = ref(false);
const statusMessage = ref('');
const confirmPasswordError = ref('');
const showPassword = ref(false);
const passwordError = ref('');
const step = ref(1);
const showConfirmPassword = ref(false);

// Auto-generate username on load and validate uniqueness
const generateUsernameHandler = async () => {
  try {
    isLoading.value = true;
    let newUsername = '';
    let isUnique = false;

    // Keep generating until a unique username is found
    while (!isUnique) {
      newUsername = generateUsername();
      const usernames = await userStore.getUsernames();
      isUnique = !usernames.includes(newUsername);
    }

    username.value = newUsername;
    usernameWarning.value = false;
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? `Error generating username: ${e.message}`
        : 'An unknown error occurred during username generation.';
    errorStore.setError(ErrorType.UNKNOWN_ERROR, message);
    username.value = ''; // Clear username if generation fails
  } finally {
    isLoading.value = false;
  }
};

// Automatically generate a username when the component mounts
onMounted(async () => {
  await generateUsernameHandler();
});

// Check if a username is already taken
const checkUsernameAvailability = async () => {
  try {
    const usernames = await userStore.getUsernames();
    usernameWarning.value = usernames.includes(username.value);

    if (usernameWarning.value) {
      error.value = `Username "${username.value}" already exists.`;
    } else {
      error.value = '';
    }
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? `Error checking username availability: ${e.message}`
        : 'An unknown error occurred while checking username availability.';
    errorStore.setError(ErrorType.UNKNOWN_ERROR, message);
  }
};

// Validate the strength of the password
const validatePassword = () => {
  if (!password.value) {
    passwordError.value = '';
    return;
  }

  const minLength = /^.{8,}$/;
  const hasNumber = /\d/;
  const hasLetter = /[a-zA-Z]/;

  if (!minLength.test(password.value)) {
    passwordError.value = 'At least 8 characters';
  } else if (!hasNumber.test(password.value)) {
    passwordError.value = 'Include at least one number';
  } else if (!hasLetter.test(password.value)) {
    passwordError.value = 'Include at least one letter';
  } else {
    passwordError.value = '';
  }
};

// Ensure password confirmation matches the original
const validateConfirmPassword = () => {
  if (password.value && password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match';
  } else {
    confirmPasswordError.value = '';
  }
};

// Navigate between steps in the form
const goToStep = (nextStep: number) => {
  if (nextStep === 2) {
    statusMessage.value = `Welcome, ${username.value}!`;
  }
  step.value = nextStep;
};

// Submit the registration form
const register = async () => {
  if (!username.value || usernameWarning.value) return;

  isLoading.value = true;
  statusMessage.value = 'Registering user...';

  try {
    // Register the user
    const registerResponse = await userStore.register({
      username: username.value,
      email: email.value || undefined,
      password: password.value || undefined,
    });

    if (!registerResponse.success) throw new Error(registerResponse.message || 'Registration failed.');

    // Automatically log the user in after registration
    const loginResponse = await userStore.login({
      username: username.value,
      password: password.value || undefined,
    });

    if (!loginResponse.success) throw new Error(loginResponse.message || 'Login failed.');
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? `Registration or login failed: ${e.message}`
        : 'An unknown error occurred.';
    errorStore.setError(ErrorType.REGISTRATION_ERROR, message);
  } finally {
    isLoading.value = false;
  }
};

// Check if the form is valid for submission
const isFormValid = computed(() => {
  return (
    username.value &&
    !usernameWarning.value &&
    (!password.value || !passwordError.value) &&
    password.value === confirmPassword.value
  );
});

// Toggle visibility for password fields
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// Computed property to check if the user is logged in
const isLoggedIn = computed(() => userStore.isLoggedIn);
</script>
