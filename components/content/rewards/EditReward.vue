<template>
  <div class="bg-base-300 p-4 rounded">
    <h2 class="text-xl mb-2">Edit Reward</h2>
    <form @submit.prevent="editReward">
      <!-- Form Fields -->
      <div v-for="field in formFields" :key="field.id" class="mb-2">
        <label
          :for="field.id"
          class="block text-sm font-medium text-gray-600"
          >{{ field.label }}</label
        >
        <input
          :id="field.id"
          v-model="editedReward[field.id as keyof typeof editedReward]"
          :required="field.required"
          :type="field.type || 'text'"
          class="p-2 rounded bg-base-300"
        />
      </div>
      <button type="submit" class="bg-primary text-default p-2 rounded">
        Update Reward
      </button>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRewardStore } from './../../../stores/rewardStore'

const rewardStore = useRewardStore()

// Initialize editedReward as a ref based on currentReward
const editedReward = ref({ ...rewardStore.currentReward })

// Watch currentReward for changes and update editedReward
watch(
  () => rewardStore.currentReward,
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
