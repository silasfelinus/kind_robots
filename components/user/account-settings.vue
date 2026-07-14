<!-- /components/user/account-settings.vue -->
<!--
  Self-service account center: change password, verify email, tune privacy &
  consent, and manage newsletter opt-in (double opt-in). Reads the current user
  from userStore and writes through accountStore's dedicated endpoints.
-->
<template>
  <section
    class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6"
  >
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-black">Account &amp; Privacy</h1>
      <p class="text-sm text-base-content/70">
        You're in control. Change what you share, who can reach you, and what
        lands in your inbox.
      </p>
    </header>

    <div
      v-if="!userStore.isLoggedIn || userStore.isGuest"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm font-semibold text-warning"
    >
      Sign in to manage your account settings.
    </div>

    <template v-else>
      <!-- Query-string banners (from email links) -->
      <div
        v-if="banner"
        class="rounded-2xl border p-3 text-sm font-semibold"
        :class="banner.ok ? okClass : errClass"
      >
        {{ banner.text }}
      </div>

      <!-- ── Security ─────────────────────────────────────────────── -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5">
        <h2 class="mb-1 text-lg font-black">Security</h2>
        <p class="mb-4 text-sm text-base-content/70">
          Update your password and verify your email address.
        </p>

        <!-- Email verify status -->
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-200 p-3"
        >
          <div class="flex items-center gap-2 text-sm">
            <Icon
              :name="emailVerified ? 'kind-icon:check' : 'kind-icon:mail'"
              class="h-5 w-5"
              :class="emailVerified ? 'text-success' : 'text-warning'"
            />
            <span v-if="!userEmail">No email on file — add one in your profile.</span>
            <span v-else-if="emailVerified">
              {{ userEmail }} is verified.
            </span>
            <span v-else>{{ userEmail }} is not verified yet.</span>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="verifyFeedback" class="text-xs text-base-content/70">
              {{ verifyFeedback }}
            </span>
            <button
              v-if="userEmail && !emailVerified"
              type="button"
              class="btn btn-outline btn-sm rounded-xl"
              :disabled="account.isSaving"
              @click="onSendVerification"
            >
              <span v-if="account.isSaving" class="loading loading-spinner loading-xs" />
              Send verification email
            </button>
          </div>
        </div>

        <!-- Change password -->
        <form class="grid grid-cols-1 gap-3 sm:grid-cols-2" @submit.prevent="onChangePassword">
          <label v-if="hasPassword" class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-sm font-bold text-base-content/70">Current password</span>
            <input
              v-model="pw.current"
              type="password"
              autocomplete="current-password"
              class="input input-bordered w-full rounded-xl bg-base-200"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-bold text-base-content/70">New password</span>
            <input
              v-model="pw.next"
              type="password"
              autocomplete="new-password"
              class="input input-bordered w-full rounded-xl bg-base-200"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-bold text-base-content/70">Confirm new password</span>
            <input
              v-model="pw.confirm"
              type="password"
              autocomplete="new-password"
              class="input input-bordered w-full rounded-xl bg-base-200"
            />
          </label>
          <div class="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              class="btn btn-primary btn-sm rounded-xl"
              :disabled="account.isSaving || !canSubmitPassword"
            >
              <span v-if="account.isSaving" class="loading loading-spinner loading-xs" />
              {{ hasPassword ? 'Update password' : 'Set password' }}
            </button>
            <span v-if="pwFeedback" class="text-sm" :class="pwOk ? 'text-success' : 'text-error'">
              {{ pwFeedback }}
            </span>
          </div>
        </form>
      </div>

      <!-- ── Privacy & Consent ────────────────────────────────────── -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5">
        <h2 class="mb-1 text-lg font-black">Privacy &amp; Consent</h2>
        <p class="mb-4 text-sm text-base-content/70">
          Consent is the default here. Choose what you see and what others can
          do.
        </p>

        <div class="flex flex-col divide-y divide-base-300">
          <label class="flex items-center justify-between gap-4 py-3">
            <span>
              <span class="block font-semibold">Public by default</span>
              <span class="block text-xs text-base-content/60">
                New creations start visible to everyone.
              </span>
            </span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              :checked="consent.isPublic"
              :disabled="account.isSaving"
              @change="onConsentToggle('isPublic', $event)"
            />
          </label>

          <label class="flex items-center justify-between gap-4 py-3">
            <span>
              <span class="block font-semibold">Show mature content</span>
              <span class="block text-xs text-base-content/60">
                Reveal content flagged mature while you browse.
              </span>
            </span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              :checked="consent.showMature"
              :disabled="account.isSaving"
              @change="onConsentToggle('showMature', $event)"
            />
          </label>

          <label class="flex items-center justify-between gap-4 py-3">
            <span>
              <span class="block font-semibold">List me in the public directory</span>
              <span class="block text-xs text-base-content/60">
                Let others find you on the members page.
              </span>
            </span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              :checked="consent.listInDirectory"
              :disabled="account.isSaving"
              @change="onConsentToggle('listInDirectory', $event)"
            />
          </label>

          <label class="flex items-center justify-between gap-4 py-3">
            <span>
              <span class="block font-semibold">Allow friend requests</span>
              <span class="block text-xs text-base-content/60">
                Others can ask to connect with you.
              </span>
            </span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              :checked="consent.allowFriendRequests"
              :disabled="account.isSaving"
              @change="onConsentToggle('allowFriendRequests', $event)"
            />
          </label>

          <div class="flex items-center justify-between gap-4 py-3">
            <span>
              <span class="block font-semibold">Who can message me</span>
              <span class="block text-xs text-base-content/60">
                Choose who may start a direct conversation.
              </span>
            </span>
            <select
              class="select select-bordered select-sm rounded-xl bg-base-200"
              :value="consent.messagePolicy"
              :disabled="account.isSaving"
              @change="onMessagePolicy($event)"
            >
              <option value="EVERYONE">Everyone</option>
              <option value="FRIENDS">Friends only</option>
              <option value="NONE">No one</option>
            </select>
          </div>
        </div>
        <p v-if="consentFeedback" class="mt-3 text-sm" :class="consentOk ? 'text-success' : 'text-error'">
          {{ consentFeedback }}
        </p>
      </div>

      <!-- ── Newsletter ───────────────────────────────────────────── -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5">
        <h2 class="mb-1 text-lg font-black">Updates &amp; Promotions</h2>
        <p class="mb-4 text-sm text-base-content/70">
          Can we email you updates? Pick a rhythm — we only send what you ask
          for, and we'll email you once to confirm.
        </p>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            v-for="opt in newsletterOptions"
            :key="opt.value"
            type="button"
            class="btn btn-sm rounded-xl"
            :class="newsletterFreq === opt.value ? 'btn-primary' : 'btn-outline'"
            :disabled="account.isSaving"
            @click="onNewsletter(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <p class="mt-3 text-sm">
          <span v-if="newsletterFreq === 'NEVER'" class="text-base-content/60">
            You're not subscribed to updates.
          </span>
          <span v-else-if="newsletterConfirmed" class="text-success">
            Subscribed — {{ frequencyLabel(newsletterFreq) }}.
          </span>
          <span v-else class="text-warning">
            Pending — check your email to confirm {{ frequencyLabel(newsletterFreq) }} updates.
          </span>
        </p>
        <p v-if="newsletterFeedback" class="mt-2 text-sm" :class="newsletterOk ? 'text-success' : 'text-error'">
          {{ newsletterFeedback }}
        </p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import {
  useAccountStore,
  type MessagePolicy,
  type NewsletterFrequency,
} from '@/stores/accountStore'

const userStore = useUserStore()
const account = useAccountStore()
const route = useRoute()

const okClass = 'border-success/40 bg-success/10 text-success'
const errClass = 'border-error/40 bg-error/10 text-error'

// ── Email / password state ──────────────────────────────────────────────────
const userEmail = computed(() => userStore.user?.email ?? '')
const emailVerified = computed(() => !!userStore.user?.emailVerified)
const hasPassword = computed(() => !!userStore.user?.password)

const pw = reactive({ current: '', next: '', confirm: '' })
const pwFeedback = ref('')
const pwOk = ref(false)

const canSubmitPassword = computed(
  () => pw.next.length >= 8 && pw.next === pw.confirm,
)

async function onChangePassword() {
  pwFeedback.value = ''
  if (pw.next !== pw.confirm) {
    pwOk.value = false
    pwFeedback.value = 'Passwords do not match.'
    return
  }
  const res = await account.changePassword(
    pw.next,
    hasPassword.value ? pw.current : undefined,
  )
  pwOk.value = res.success
  pwFeedback.value = res.message
  if (res.success) {
    pw.current = ''
    pw.next = ''
    pw.confirm = ''
  }
}

const verifyFeedback = ref('')
async function onSendVerification() {
  const res = await account.sendVerificationEmail()
  verifyFeedback.value = res.message
}

// ── Consent state ────────────────────────────────────────────────────────────
const consent = computed(() => ({
  isPublic: userStore.user?.isPublic ?? true,
  showMature: userStore.user?.showMature ?? false,
  listInDirectory: userStore.user?.listInDirectory ?? true,
  allowFriendRequests: userStore.user?.allowFriendRequests ?? true,
  messagePolicy: (userStore.user?.messagePolicy ?? 'EVERYONE') as MessagePolicy,
}))

const consentFeedback = ref('')
const consentOk = ref(false)

async function onConsentToggle(field: string, evt: Event) {
  const checked = (evt.target as HTMLInputElement).checked
  const res = await account.updateConsent({ [field]: checked })
  consentOk.value = res.success
  consentFeedback.value = res.success ? 'Saved.' : res.message
}

async function onMessagePolicy(evt: Event) {
  const value = (evt.target as HTMLSelectElement).value as MessagePolicy
  const res = await account.updateConsent({ messagePolicy: value })
  consentOk.value = res.success
  consentFeedback.value = res.success ? 'Saved.' : res.message
}

// ── Newsletter state ──────────────────────────────────────────────────────────
const newsletterOptions: { value: NewsletterFrequency; label: string }[] = [
  { value: 'NEVER', label: 'Never' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'DAILY', label: 'Daily' },
]

const newsletterFreq = computed(
  () => (userStore.user?.newsletterFrequency ?? 'NEVER') as NewsletterFrequency,
)
const newsletterConfirmed = computed(
  () => !!userStore.user?.newsletterConfirmedAt,
)
const newsletterFeedback = ref('')
const newsletterOk = ref(false)

function frequencyLabel(freq: NewsletterFrequency): string {
  return (
    {
      NEVER: 'never',
      SPECIAL: 'only on very special occasions',
      MONTHLY: 'monthly',
      WEEKLY: 'weekly',
      DAILY: 'daily',
    }[freq] ?? 'occasionally'
  )
}

async function onNewsletter(freq: NewsletterFrequency) {
  const res =
    freq === 'NEVER'
      ? await account.unsubscribeNewsletter()
      : await account.setNewsletterFrequency(freq)
  newsletterOk.value = res.success
  newsletterFeedback.value = res.message
}

// ── Banners from email-link redirects (?verify= / ?newsletter=) ──────────────
const banner = computed<{ ok: boolean; text: string } | null>(() => {
  const v = route.query.verify
  const n = route.query.newsletter
  if (v === 'success') return { ok: true, text: 'Your email is verified. Thank you!' }
  if (v === 'invalid')
    return { ok: false, text: 'That verification link is invalid or expired.' }
  if (n === 'success')
    return { ok: true, text: "You're subscribed. We'll only send what you asked for." }
  if (n === 'invalid')
    return { ok: false, text: 'That confirmation link is invalid or expired.' }
  return null
})

onMounted(() => {
  if (!userStore.initialized) userStore.initialize()
})
</script>
