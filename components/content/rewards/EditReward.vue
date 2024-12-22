<template>
  <div class="bg-base-300 p-4 rounded">
    <h2 class="text-xl mb-4 font-bold">Edit Reward</h2>
    <form @submit.prevent="editReward">
      <!-- Large Icon Preview -->
      <div class="flex justify-center mb-6">
        <Icon
          :name="editedReward.icon || 'default-icon'"
          class="text-[12rem] mb-4"
        />
      </div>

      <!-- Form Fields -->
      <div v-for="field in formFields" :key="field.id" class="mb-4">
        <label
          :for="field.id"
          class="block text-sm font-medium text-gray-600 mb-1"
        >
          {{ field.label }}
        </label>
        <input
          :id="field.id"
          v-model="editedReward[field.id as keyof typeof editedReward]"
          :required="field.required"
          :type="field.type || 'text'"
          class="p-2 rounded bg-base-200 w-full"
        />
      </div>

      <!-- Update Button -->
      <button type="submit" class="bg-primary text-default p-3 rounded w-full">
        Update Reward
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRewardStore } from './../../../stores/rewardStore'

const rewardStore = useRewardStore()

// Initialize editedReward as a ref based on selectedReward
const editedReward = ref({ ...rewardStore.selectedReward })

// Watch selectedReward for changes and update editedReward
watch(
  () => rewardStore.selectedReward,
  (newReward) => {
    editedReward.value = { ...newReward }
  },
  { immediate: true }, // Initialize on load
)

// Form fields definition for reusability
const formFields = [
  { id: 'Icon', label: 'Icon', required: true },
  { id: 'text', label: 'Text', required: true },
  { id: 'power', label: 'Power', required: true },
  { id: 'rarity', label: 'Rarity', type: 'number' },
]

const editReward = async () => {
  if (editedReward.value.id) {
    await rewardStore.updateRewardById(
      editedReward.value.id,
      editedReward.value,
    )
  }
}
</script>
