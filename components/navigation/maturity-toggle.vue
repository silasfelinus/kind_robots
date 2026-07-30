<!-- /components/navigation/maturity-toggle.vue -->
<template>
  <button
    v-if="userStore.isLoggedIn"
    type="button"
    class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border"
    :class="
      showMature
        ? 'border-warning/60 bg-warning/15 text-warning'
        : 'border-base-300 bg-base-100 text-base-content/60'
    "
    :aria-label="buttonLabel"
    :aria-pressed="showMature"
    :title="buttonTitle"
    :disabled="isUpdating"
    @click="toggleMature"
  >
    <span v-if="isUpdating" class="loading loading-spinner loading-xs" />
    <Icon
      v-else
      :name="showMature ? 'kind-icon:eye' : 'kind-icon:eye-off'"
      class="h-5 w-5"
    />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useUserStore } from '@/stores/userStore'

const accountStore = useAccountStore()
const userStore = useUserStore()

const isUpdating = ref(false)
const updateError = ref('')

const showMature = computed(() => userStore.showMature)
const buttonLabel = computed(() =>
  showMature.value ? 'Hide mature content' : 'Show mature content',
)
const buttonTitle = computed(() => updateError.value || buttonLabel.value)

async function toggleMature(): Promise<void> {
  if (isUpdating.value) return

  isUpdating.value = true
  updateError.value = ''

  try {
    const result = await accountStore.updateConsent({
      showMature: !showMature.value,
    })

    if (!result.success) {
      updateError.value = result.message || 'Could not update mature content.'
    }
  } finally {
    isUpdating.value = false
  }
}
</script>
