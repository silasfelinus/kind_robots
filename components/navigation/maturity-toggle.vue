<!-- /components/navigation/maturity-toggle.vue -->
<template>
  <div
    v-if="userStore.isLoggedIn"
    :class="variant === 'resource' ? 'space-y-1' : 'contents'"
  >
    <template v-if="variant === 'resource'">
      <label
        class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
        :title="buttonTitle"
      >
        <span class="flex min-w-0 items-center gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="
              showMature
                ? 'bg-warning/15 text-warning'
                : 'bg-base-200 text-base-content/55'
            "
          >
            <Icon
              :name="showMature ? 'kind-icon:eye' : 'kind-icon:eye-off'"
              class="h-5 w-5"
            />
          </span>

          <span class="min-w-0">
            <span class="block text-sm font-bold text-base-content">
              {{ label }}
            </span>
            <span class="block text-xs text-base-content/55">
              {{ showMature ? visibleText : hiddenText }}
            </span>
          </span>
        </span>

        <span class="flex shrink-0 items-center gap-2">
          <span v-if="isUpdating" class="loading loading-spinner loading-xs" />
          <input
            type="checkbox"
            class="toggle toggle-warning toggle-sm"
            :checked="showMature"
            :disabled="isUpdating"
            :aria-label="buttonLabel"
            @change="onToggleChange"
          />
        </span>
      </label>

      <p v-if="updateError" class="px-1 text-xs text-error">
        {{ updateError }}
      </p>
    </template>

    <button
      v-else
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
      @click="setShowMature(!showMature)"
    >
      <span v-if="isUpdating" class="loading loading-spinner loading-xs" />
      <Icon
        v-else
        :name="showMature ? 'kind-icon:eye' : 'kind-icon:eye-off'"
        class="h-5 w-5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useUserStore } from '@/stores/userStore'

type MaturityToggleVariant = 'icon' | 'resource'

const props = withDefaults(
  defineProps<{
    variant?: MaturityToggleVariant
    label?: string
    visibleText?: string
    hiddenText?: string
  }>(),
  {
    variant: 'icon',
    label: 'Mature resources',
    visibleText: 'Mature LoRAs and checkpoints are visible.',
    hiddenText: 'Mature LoRAs and checkpoints are hidden.',
  },
)

const accountStore = useAccountStore()
const userStore = useUserStore()

const isUpdating = ref(false)
const updateError = ref('')

const variant = computed(() => props.variant)
const label = computed(() => props.label)
const visibleText = computed(() => props.visibleText)
const hiddenText = computed(() => props.hiddenText)
const showMature = computed(() => userStore.showMature)
const buttonLabel = computed(() =>
  showMature.value ? 'Hide mature content' : 'Show mature content',
)
const buttonTitle = computed(() => updateError.value || buttonLabel.value)

async function setShowMature(value: boolean): Promise<void> {
  if (isUpdating.value || value === showMature.value) return

  isUpdating.value = true
  updateError.value = ''

  try {
    const result = await accountStore.updateConsent({ showMature: value })

    if (!result.success) {
      updateError.value = result.message || 'Could not update mature content.'
    }
  } finally {
    isUpdating.value = false
  }
}

function onToggleChange(event: Event): void {
  void setShowMature((event.target as HTMLInputElement).checked)
}
</script>
