<template>
  <transition name="fade-scale" mode="out-in">
    <div
      v-if="showPopup"
      class="fixed left-4 top-1/4 bg-white shadow-lg rounded-2xl border border-gray-300 p-6 sm:max-w-[66%] md:max-w-[33%] w-full"
      role="dialog"
      aria-live="assertive"
      tabindex="-1"
    >
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-semibold text-accent flex items-center space-x-2">
          <Icon v-if="currentMilestone?.icon" :name="currentMilestone.icon" class="text-2xl" />
          <span>🎉 Congratulations!</span>
        </h2>
        <button class="text-gray-500 hover:text-gray-700" aria-label="Close popup" @click="closePopup">
          <Icon name="kind-icon:close" />
        </button>
      </div>
      <p class="text-gray-700">
        You've achieved a new milestone:
        <span class="font-bold">{{ currentMilestone?.label }}</span>
      </p>
      <p class="text-gray-500 text-sm mt-2">
        {{ currentMilestone?.message }}
      </p>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'
import type { Milestone } from '@prisma/client'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const popupQueue = ref<Milestone[]>([])
const showPopup = ref(false)
const currentMilestone = ref<Milestone | null>(null)
const queueLimit = 5 // Limit the number of milestones queued
let isInitialized = ref(false) // Track initialization state

// Computed property to get unconfirmed milestones for the current user
const unconfirmedMilestones = computed(() => {
  const userId = userStore.userId
  return milestoneStore.milestoneRecords.filter(
    (record) => record.userId === userId && !record.isConfirmed
  )
})

// Function to display the next milestone in the queue
const nextMilestone = () => {
  if (popupQueue.value.length > 0) {
    currentMilestone.value = popupQueue.value.shift()!
    showPopup.value = true
  }
}

// Process unconfirmed milestones only after initialization
watchEffect(async () => {
  if (!isInitialized.value) return

  for (const record of unconfirmedMilestones.value) {
    const response = await milestoneStore.fetchMilestoneById(record.milestoneId)
    if (response.success && response.data) {
      if (popupQueue.value.length < queueLimit) {
        popupQueue.value.push(response.data)
      }
      record.isConfirmed = true
    } else {
      console.warn(`Could not fetch milestone with ID ${record.milestoneId}`)
    }
  }

  if (!showPopup.value) nextMilestone()
  milestoneStore.saveMilestoneRecordsToLocalStorage()
})

// Close the popup and check if there are more milestones to display
const closePopup = () => {
  showPopup.value = false
  currentMilestone.value = null
  if (popupQueue.value.length > 0) setTimeout(nextMilestone, 300)
}

// Initialize the component
onMounted(() => {
  isInitialized.value = true
})
</script>

<style>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-scale-enter,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
