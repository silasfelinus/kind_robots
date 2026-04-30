<!-- /components/content/user/login-page.vue -->
<template>
  <section
    class="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-base-300 px-3 py-4 text-base-content sm:px-6 sm:py-8"
  >
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style="background-image: url('/images/utility/login.png')"
    />

    <div
      class="absolute inset-0 bg-linear-to-b from-base-300/10 via-base-300/15 to-base-300/45"
    />

    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_58%)]"
    />

    <div
      class="pointer-events-none absolute left-4 top-5 hidden rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-md sm:block"
    >
      ✨ empathy.exe loaded
    </div>

    <div
      class="pointer-events-none absolute bottom-5 right-4 hidden rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-md md:block"
    >
      🦋 tiny robot sanctuary
    </div>

    <main
      class="relative z-10 flex w-full max-w-md flex-col rounded-4xl border border-white/45 bg-base-100/88 p-4 shadow-[0_24px_80px_rgba(20,25,70,0.34)] backdrop-blur-xl sm:p-6 lg:max-w-lg"
    >
      <div
        class="absolute -inset-px -z-10 rounded-4xl bg-linear-to-br from-primary/35 via-secondary/20 to-accent/35 opacity-70 blur-sm"
      />

      <div
        class="mb-5 rounded-3xl border border-white/50 bg-white/25 p-4 text-center shadow-inner backdrop-blur-md sm:p-5"
      >
        <div class="mb-3 flex items-center justify-center gap-2">
          <span
            class="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(59,130,246,0.9)] animate-dot-1"
          />
          <Icon
            name="kind-icon:butterfly"
            class="h-10 w-10 text-secondary drop-shadow-lg sm:h-12 sm:w-12 animate-float"
          />
          <span
            class="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_rgba(236,72,153,0.9)] animate-dot-3"
          />
        </div>

        <h1
          class="font-display text-4xl font-black leading-none tracking-tight text-primary drop-shadow-sm sm:text-5xl"
        >
          Kind Robots
        </h1>

        <p class="mt-3 text-lg font-extrabold text-secondary sm:text-xl">
          Welcome back, friend 💜
        </p>

        <p class="mt-1 text-sm font-medium text-base-content/70 sm:text-base">
          Sign in and let the tiny robots resume being suspiciously helpful.
        </p>
      </div>

      <div
        v-if="store.loading"
        class="mb-5 flex flex-col items-center gap-3 rounded-2xl border border-info/30 bg-info/10 px-4 py-6 text-info"
      >
        <Icon name="kind-icon:bubble-loading" class="text-3xl animate-spin" />
        <span class="text-sm font-bold tracking-wide">
          Authenticating the human...
        </span>
      </div>

      <form
        v-if="!store.isLoggedIn"
        class="flex flex-col gap-4"
        :autocomplete="stayLoggedIn ? 'on' : 'off'"
        @submit.prevent="handleLogin"
      >
        <label for="login" class="flex flex-col gap-2">
          <span class="pl-1 text-sm font-black text-base-content/80">
            Username
          </span>
          <span
            class="flex items-center gap-3 rounded-2xl border border-base-300/80 bg-base-100/90 px-4 py-3 shadow-sm transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20"
          >
            <Icon
              name="kind-icon:person"
              class="h-5 w-5 shrink-0 text-primary"
            />
            <input
              id="login"
              v-model="login"
              type="text"
              autocomplete="username"
              placeholder="Enter your username"
              required
              class="min-w-0 flex-1 bg-transparent text-base font-semibold text-base-content outline-none placeholder:text-base-content/35"
            />
          </span>
        </label>

        <label for="password" class="flex flex-col gap-2">
          <span class="pl-1 text-sm font-black text-base-content/80">
            Password
          </span>
          <span
            class="flex items-center gap-3 rounded-2xl border border-base-300/80 bg-base-100/90 px-4 py-3 shadow-sm transition-all duration-200 focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/20"
          >
            <Icon
              name="kind-icon:lock"
              class="h-5 w-5 shrink-0 text-secondary"
            />
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
              class="min-w-0 flex-1 bg-transparent text-base font-semibold text-base-content outline-none placeholder:text-base-content/35"
            />
          </span>
        </label>

        <div
          class="rounded-2xl border border-base-300/70 bg-base-200/65 px-3 py-2"
        >
          <LoginPersister />
        </div>

        <button
          type="submit"
          class="group mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-primary via-secondary to-accent px-6 py-3.5 text-lg font-black text-primary-content shadow-[0_14px_34px_rgba(80,80,220,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(80,80,220,0.42)] active:translate-y-0"
        >
          <span>Sign In</span>
          <Icon
            name="kind-icon:sparkles"
            class="h-5 w-5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110"
          />
        </button>

        <div
          class="flex flex-col items-center justify-center gap-2 text-sm font-semibold text-base-content/70 sm:flex-row"
        >
          <span>New here?</span>
          <NuxtLink
            to="/register"
            class="rounded-full bg-secondary/10 px-3 py-1 font-black text-secondary transition hover:bg-secondary/20"
          >
            Create account
          </NuxtLink>
        </div>
      </form>

      <div class="my-5 flex items-center gap-3">
        <span class="h-px flex-1 bg-base-content/15" />
        <span
          class="rounded-full border border-base-content/10 bg-base-100/80 px-3 py-1 text-xs font-black uppercase tracking-widest text-base-content/45"
        >
          or
        </span>
        <span class="h-px flex-1 bg-base-content/15" />
      </div>

      <div
        class="flex justify-center rounded-2xl border border-base-300/70 bg-base-100/70 p-2 shadow-sm"
      >
        <GoogleLogin />
      </div>

      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div
          v-if="errorMessage"
          class="mt-5 flex items-start gap-3 rounded-2xl border border-warning/35 bg-warning/15 p-4 shadow-sm"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning/25 text-warning"
          >
            <Icon name="kind-icon:warning" class="h-6 w-6" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-black text-warning">
              Oops, the gate robot got suspicious.
            </p>
            <p class="mt-1 text-sm leading-snug text-base-content/75">
              {{ errorMessage }}
            </p>

            <div
              v-if="userNotFound"
              class="mt-3 flex flex-wrap items-center gap-2"
            >
              <NuxtLink
                to="/register"
                class="btn btn-warning btn-xs rounded-full"
              >
                Register
              </NuxtLink>
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-full text-warning"
                @click="handleRetryLogin"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </transition>
    </main>
  </section>
</template>

<script setup lang="ts">
// /components/content/user/login-page.vue
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useErrorStore, ErrorType } from '~/stores/errorStore'
import { useUserStore } from '~/stores/userStore'

const store = useUserStore()
const router = useRouter()
const errorStore = useErrorStore()

const login = ref('')
const password = ref('')
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
      errorMessage.value =
        result.message || 'That username or password does not look right.'
      userNotFound.value = result.message?.includes('User not found') || false
      return
    }

    await router.push('/dashboard')
  } catch (error) {
    errorStore.setError(ErrorType.AUTH_ERROR, error)
    errorMessage.value =
      errorStore.message ||
      'Something unexpected happened. The robots deny involvement.'
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
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');

.font-display {
  font-family: 'Syne', sans-serif;
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

@keyframes gentle-float {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-6px) rotate(3deg);
  }
}

.animate-dot-1 {
  animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.animate-dot-3 {
  animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
}

.animate-float {
  animation: gentle-float 4.5s ease-in-out infinite;
}
</style>
