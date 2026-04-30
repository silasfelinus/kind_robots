<!-- /components/content/user/login-page.vue -->
<template>
  <div
    class="flex justify-center items-center min-h-dvh px-4 py-8"
    style="
      background:
        radial-gradient(
          ellipse 80% 60% at 50% 0%,
          rgba(99, 179, 237, 0.07) 0%,
          transparent 70%
        ),
        var(--fallback-b1, oklch(var(--b1)));
    "
  >
    <!-- Card -->
    <div
      class="w-full max-w-md rounded-2xl border border-white/[0.07] bg-base-200 p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.45)] animate-card-in"
    >
      <!-- Brand Header -->
      <div class="mb-8 text-center">
        <div class="flex justify-center gap-1.5 mb-4">
          <span class="block w-2 h-2 rounded-full bg-accent animate-dot-1" />
          <span class="block w-2 h-2 rounded-full bg-secondary animate-dot-2" />
          <span class="block w-2 h-2 rounded-full bg-primary animate-dot-3" />
        </div>
        <h1
          class="font-display text-3xl font-black tracking-tight text-base-content leading-none mb-1"
        >
          Kind Robots
        </h1>
        <p class="text-sm text-base-content/50 tracking-wide">
          Sign in to continue
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="store.loading"
        class="flex flex-col items-center gap-3 py-6 text-info text-sm tracking-wide"
      >
        <Icon name="kind-icon:bubble-loading" class="text-2xl animate-spin" />
        <span>Authenticating…</span>
      </div>

      <!-- Login Form -->
      <form
        v-if="!store.isLoggedIn"
        class="flex flex-col gap-5"
        :autocomplete="stayLoggedIn ? 'on' : 'off'"
        @submit.prevent="handleLogin"
      >
        <!-- Username -->
        <div class="flex flex-col gap-1.5">
          <label
            for="login"
            class="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-base-content/50"
          >
            Username
          </label>
          <input
            id="login"
            v-model="login"
            type="text"
            autocomplete="username"
            placeholder="your username"
            required
            class="w-full rounded-xl border border-white/9 bg-base-300 px-4 py-2.5 text-sm text-base-content outline-none placeholder:text-white/20 transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label
            for="password"
            class="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-base-content/50"
          >
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
            class="w-full rounded-xl border border-white/9 bg-base-300 px-4 py-2.5 text-sm text-base-content outline-none placeholder:text-white/20 transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <!-- Stay Logged In -->
        <LoginPersister />

        <!-- Actions -->
        <div class="flex items-center gap-4 mt-1">
          <button
            type="submit"
            class="flex-1 rounded-xl bg-accent py-2.5 px-6 text-sm font-semibold text-base-100 tracking-wide transition-all duration-150 hover:opacity-90 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(99,179,237,0.3)] active:translate-y-0"
          >
            Sign In
          </button>
          <NuxtLink
            to="/register"
            class="whitespace-nowrap text-sm text-base-content/50 transition-colors duration-150 hover:text-accent"
          >
            Create account
          </NuxtLink>
        </div>
      </form>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-7">
        <span class="flex-1 h-px bg-white/[0.07]" />
        <span
          class="text-[0.7rem] uppercase tracking-wider text-base-content/40"
          >or</span
        >
        <span class="flex-1 h-px bg-white/[0.07]" />
      </div>

      <!-- Google Login -->
      <div class="flex justify-center">
        <GoogleLogin />
      </div>

      <!-- Error Panel -->
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1.5"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-1.5"
      >
        <div
          v-if="errorMessage"
          class="flex items-start gap-3 mt-6 rounded-xl border border-warning/25 bg-warning/6 p-3.5"
        >
          <div
            class="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/20 text-[0.65rem] font-bold text-warning"
          >
            !
          </div>
          <div class="flex-1">
            <p class="text-sm leading-snug text-warning/90">
              {{ errorMessage }}
            </p>
            <div v-if="userNotFound" class="mt-1.5 flex items-center gap-1.5">
              <NuxtLink
                to="/register"
                class="text-xs text-warning underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                Register
              </NuxtLink>
              <span class="text-warning/30 text-xs">·</span>
              <button
                class="text-xs text-warning underline underline-offset-2 hover:opacity-75 transition-opacity bg-transparent border-none p-0 font-sans cursor-pointer"
                @click="handleRetryLogin"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/util/login-form.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/userStore'
import { useErrorStore, ErrorType } from '~/stores/errorStore'

const store = useUserStore()
const router = useRouter()

const login = ref('')
const password = ref('')
const errorStore = useErrorStore()
const errorMessage = ref('')
const userNotFound = ref(false)

const stayLoggedIn = computed({
  get: () => store.stayLoggedIn,
  set: (value: boolean) => store.setStayLoggedIn(value),
})

const handleLogin = async () => {
  errorMessage.value = ''
  userNotFound.value = false

  try {
    const credentials = {
      username: login.value,
      password: password.value || undefined,
    }

    const result = await store.login(credentials)

    if (!result.success) {
      errorMessage.value = result.message || 'Login failed'
      userNotFound.value = result.message?.includes('User not found') || false
    } else {
      await router.push('/dashboard')
    }
  } catch (error) {
    errorStore.setError(ErrorType.AUTH_ERROR, error)
    errorMessage.value = errorStore.message || 'An unexpected error occurred'
  }
}

const handleRetryLogin = () => {
  login.value = ''
  password.value = ''
  errorMessage.value = ''
  userNotFound.value = false
  errorStore.clearError()
}
</script>

<style scoped>
/* Keyframes + display font only — all layout/color/spacing is Tailwind */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');

.font-display {
  font-family: 'Syne', sans-serif;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-card-in {
  animation: card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes dot-pop {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-dot-1 {
  animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}
.animate-dot-2 {
  animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
.animate-dot-3 {
  animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
</style>
