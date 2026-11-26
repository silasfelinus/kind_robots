<template>
  <div v-if="accountId" class="sc-turn-email">
    <label>
      <input
        type="checkbox"
        :checked="preference?.enabled ?? false"
        :disabled="
          busy || !preference || (!preference.eligible && !preference.enabled)
        "
        data-testid="slime-turn-email-opt-in"
        @change="change"
      />
      <b>Email me when it's my turn</b>
    </label>
    <small v-if="message" role="status">{{ message }}</small>
    <small v-else-if="preference && !preference.eligible">
      <NuxtLink to="/account">Verify your email</NuxtLink> to enable turn
      emails.
    </small>
    <small v-else
      >Optional · one email when your rival hands over the turn.</small
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'

type Preference = { enabled: boolean; eligible: boolean }
const user = useUserStore()
const accountId = computed(() =>
  user.isLoggedIn && !user.isGuest ? user.userId : null,
)
const preference = ref<Preference | null>(null)
const busy = ref(false)
const message = ref('')
const path = '/api/slime-city/pvp/turn-email'
watch(
  accountId,
  async (id) => {
    preference.value = null
    message.value = ''
    busy.value = false
    if (!id) return
    busy.value = true
    try {
      const result = await performFetch<Preference>(path)
      if (accountId.value !== id) return
      if (!result.success || !result.data)
        throw new Error('Could not load email settings.')
      preference.value = result.data
    } catch {
      if (accountId.value === id)
        message.value = 'Could not load email settings.'
    } finally {
      if (accountId.value === id) busy.value = false
    }
  },
  { immediate: true },
)

async function change(event: Event) {
  const input = event.target as HTMLInputElement
  const id = accountId.value
  if (!id || busy.value || !preference.value) return
  busy.value = true
  message.value = ''
  try {
    const result = await performFetch<Preference>(path, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: input.checked }),
    })
    if (accountId.value !== id) return
    if (!result.success || !result.data)
      throw new Error('Could not save email settings.')
    preference.value = result.data
  } catch {
    if (accountId.value === id) {
      input.checked = preference.value?.enabled ?? false
      message.value = 'Could not save email settings. Try again.'
    }
  } finally {
    if (accountId.value === id) busy.value = false
  }
}
</script>

<style scoped>
.sc-turn-email {
  display: grid;
  gap: 0.25rem;
  padding: 0.55rem;
  border: 1px solid #586e68;
  border-radius: 0.5rem;
  background: #112933;
  font-size: 0.8rem;
}
.sc-turn-email label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sc-turn-email input {
  accent-color: #c5ff59;
}
.sc-turn-email small {
  color: #b5dfd1;
}
.sc-turn-email a {
  text-decoration: underline;
}
</style>
