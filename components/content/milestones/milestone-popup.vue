<template>
  <div
    v-if="showPopup"
    class="fixed left-4 top-1/4 bg-white shadow-lg rounded-2xl border border-gray-300 p-6 max-w-md"
  >
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-xl font-semibold text-gray-800">🎉 Congratulations!</h2>
      <button class="text-gray-500 hover:text-gray-700" @click="closePopup">
        <span class="material-icons">close</span>
      </button>
    </div>
    <p class="text-gray-700">
      You've achieved a new milestone:
      <span class="font-bold">{{ newMilestone?.label }}</span>
    </p>
    <p class="text-gray-500 text-sm mt-2">
      {{ newMilestone?.message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'
import type { Milestone } from '@prisma/client'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const showPopup = ref(false)
const newMilestone = ref<Milestone | null>(null)

// Watch milestone records for new achievements
watch(
  () => milestoneStore.milestoneRecords,
  async (newRecords) => {
    const userId = userStore.userId
    const latestRecord = newRecords.find(
      (record) => record.userId === userId && !record.isConfirmed,
    )

    if (latestRecord) {
      // Fetch the full milestone details using the milestoneId
      const milestone = await milestoneStore.fetchMilestoneById(
        latestRecord.milestoneId,
      )
      if (milestone?.success && milestone.data) {
        newMilestone.value = milestone.data.milestone
        showPopup.value = true

        // Mark the milestone as confirmed to avoid re-triggering
        latestRecord.isConfirmed = true
        milestoneStore.saveMilestoneRecordsToLocalStorage()
      }
    }
  },
  { immediate: true, deep: true },
)

// Close popup function
const closePopup = () => {
  showPopup.value = false
  newMilestone.value = null
}
</script>
