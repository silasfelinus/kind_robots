<!-- /components/user/password-reset.vue -->
<!--
  Public password recovery. Two modes:
  - No ?token in the URL: ask for an email and send a reset link.
  - ?token=... present: set a new password by consuming the token.
-->
<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-black">
        {{ hasToken ? 'Choose a new password' : 'Reset your password' }}
      </h1>
      <p class="text-sm text-base-content/70">
        {{
          hasToken
            ? 'Pick a new password for your account.'
            : "Enter your email and we'll send you a reset link."
        }}
      </p>
    </header>

    <!-- Request-link mode -->
    <form
      v-if="!hasToken"
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5"
      @submit.prevent="onRequest"
    >
      <label class="flex flex-col gap-1">
        <span class="text-sm font-bold text-base-content/70">Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="input input-bordered w-full rounded-xl bg-base-200"
        />
      </label>
      <button
        type="submit"
        class="btn btn-primary btn-sm rounded-xl"
        :disabled="account.isSaving || !email"
      >
        <span
          v-if="account.isSaving"
          class="loading loading-spinner loading-xs"
        />
        Send reset link
      </button>
    </form>

    <!-- Set-new-password mode -->
    <form
      v-else
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5"
      @submit.prevent="onReset"
    >
      <label class="flex flex-col gap-1">
        <span class="text-sm font-bold text-base-content/70">New password</span>
        <input
          v-model="next"
          type="password"
          autocomplete="new-password"
          class="input input-bordered w-full rounded-xl bg-base-200"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-bold text-base-content/70"
          >Confirm password</span
        >
        <input
          v-model="confirm"
          type="password"
          autocomplete="new-password"
          class="input input-bordered w-full rounded-xl bg-base-200"
        />
      </label>
      <button
        type="submit"
        class="btn btn-primary btn-sm rounded-xl"
        :disabled="account.isSaving || next.length < 8 || next !== confirm"
      >
        <span
          v-if="account.isSaving"
          class="loading loading-spinner loading-xs"
        />
        Set new password
      </button>
    </form>

    <div
      v-if="feedback"
      class="rounded-2xl border p-3 text-sm font-semibold"
      :class="
        ok
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-error/40 bg-error/10 text-error'
      "
    >
      {{ feedback }}
      <NuxtLink v-if="ok && hasToken" to="/login" class="link ml-1"
        >Sign in →</NuxtLink
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'

const account = useAccountStore()
const route = useRoute()

const token = computed(() => String(route.query.token ?? ''))
const hasToken = computed(() => token.value.length > 0)

const email = ref('')
const next = ref('')
const confirm = ref('')
const feedback = ref('')
const ok = ref(false)

async function onRequest() {
  const res = await account.requestPasswordReset(email.value)
  ok.value = res.success
  feedback.value = res.message
}

async function onReset() {
  if (next.value !== confirm.value) {
    ok.value = false
    feedback.value = 'Passwords do not match.'
    return
  }
  const res = await account.resetPassword(token.value, next.value)
  ok.value = res.success
  feedback.value = res.message
}
</script>
