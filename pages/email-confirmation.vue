<template>
  <main class="flex min-h-full w-full items-center justify-center p-4 sm:p-8">
    <section class="kr-panel flex w-full max-w-2xl flex-col items-center gap-5 p-6 text-center sm:p-10">
      <div
        class="flex h-16 w-16 items-center justify-center rounded-full"
        :class="result.ok ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
      >
        <Icon
          :name="result.ok ? 'kind-icon:check' : 'kind-icon:alert'"
          class="h-9 w-9"
        />
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-base-content/50">
          Email confirmation
        </p>
        <h1 class="text-3xl font-black sm:text-4xl">{{ result.title }}</h1>
        <p class="mx-auto max-w-xl text-base text-base-content/70">
          {{ result.message }}
        </p>
      </div>

      <div
        class="kr-note w-full"
        :class="result.ok ? 'kr-note-success' : 'kr-note-warning'"
      >
        {{ result.detail }}
      </div>

      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink to="/account" class="btn btn-primary rounded-xl">
          Open account settings
        </NuxtLink>
        <NuxtLink to="/" class="btn btn-outline rounded-xl">
          Return home
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'

type EmailActionResult = {
  ok: boolean
  title: string
  message: string
  detail: string
}

const route = useRoute()

function queryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '')
  return typeof value === 'string' ? value : ''
}

const action = computed(() => queryValue(route.query.action))
const status = computed(() => queryValue(route.query.status))

const result = computed<EmailActionResult>(() => {
  const succeeded = status.value === 'success'

  if (action.value === 'newsletter') {
    return succeeded
      ? {
          ok: true,
          title: "You're subscribed",
          message:
            "Your notification preference was confirmed. We'll only send the updates you selected.",
          detail:
            'The confirmation is complete, even if you opened this link in a browser where you are not signed in.',
        }
      : {
          ok: false,
          title: 'That confirmation link is no longer valid',
          message:
            'The link may have expired or already been used. Your existing notification settings were not changed by this attempt.',
          detail:
            'Open account settings to choose a notification frequency and request a fresh confirmation email.',
        }
  }

  if (action.value === 'email-verification') {
    return succeeded
      ? {
          ok: true,
          title: 'Email verified',
          message:
            'Your email address is now verified and connected to your Kind Robots account.',
          detail:
            'You can safely close this page or continue to your account settings.',
        }
      : {
          ok: false,
          title: 'That verification link is no longer valid',
          message:
            'The link may have expired or already been used. You can request another verification email from your account settings.',
          detail:
            'No account information was changed by this attempt.',
        }
  }

  return {
    ok: false,
    title: 'This email link is incomplete',
    message:
      'Open the full link from the Kind Robots email so we can show the correct confirmation result.',
    detail: 'No account information was changed.',
  }
})

useHead(() => ({
  title: `${result.value.title} | Kind Robots`,
}))
</script>
