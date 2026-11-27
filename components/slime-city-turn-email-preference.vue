<template>
  <div v-if="pvp.emailAccountId" class="sc-turn-email">
    <b>EMAIL NOTIFICATIONS</b>
    <label v-for="option in options" :key="option.field">
      <input
        type="checkbox"
        :checked="pvp.emailPreference?.[option.field] ?? false"
        :disabled="
          pvp.emailBusy ||
          !pvp.emailPreference ||
          (!pvp.emailPreference.eligible && !pvp.emailPreference[option.field])
        "
        :data-testid="option.testId"
        @change="change(option.field, $event)"
      />
      <span>{{ option.label }}</span>
    </label>
    <small v-if="pvp.emailMessage" role="status">{{ pvp.emailMessage }}</small>
    <small v-else-if="pvp.emailPreference && !pvp.emailPreference.eligible">
      <NuxtLink to="/account">Verify your email</NuxtLink> to enable notifications.
    </small>
    <small v-else>Optional · one email per event.</small>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useSlimeCityPvpStore } from '~/stores/slimeCityPvp'

const pvp = useSlimeCityPvpStore()
const options = [
  {
    field: 'enabled',
    label: "It's my turn",
    testId: 'slime-turn-email-opt-in',
  },
  {
    field: 'challengeEnabled',
    label: 'A friend challenges me',
    testId: 'slime-challenge-email-opt-in',
  },
] as const

watch(() => pvp.emailAccountId, () => pvp.loadEmailPreference(), {
  immediate: true,
})

async function change(
  field: 'enabled' | 'challengeEnabled',
  event: Event,
) {
  const input = event.target as HTMLInputElement
  await pvp.saveEmailPreference(field, input.checked)
  input.checked = pvp.emailPreference?.[field] ?? false
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
