<template>
  <transition name="fade" mode="out-in">
    <div
      v-if="showPopup"
      class="fixed left-4 top-1/4 bg-white shadow-lg rounded-2xl border border-gray-300 p-6 sm:max-w-[66%] md:max-w-[33%] w-full"
    >
      <div class="flex justify-between items-center mb-2">
        <h2
          class="text-xl font-semibold text-gray-800 flex items-center space-x-2"
        >
          <Icon
            v-if="currentMilestone?.icon"
            :name="currentMilestone.icon"
            class="text-2xl"
          />
          <span>🎉 Congratulations!</span>
        </h2>
        <button class="text-gray-500 hover:text-gray-700" @click="closePopup">
          <Icon name="close" />
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
import { ref, watch } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'
import type { Milestone } from '@prisma/client'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const popupQueue = ref<Milestone[]>([])
const showPopup = ref(false)
const currentMilestone = ref<Milestone | null>(null)

const nextMilestone = () => {
  if (popupQueue.value.length > 0) {
    currentMilestone.value = popupQueue.value.shift()!
    showPopup.value = true
  }
}

watch(
  () => milestoneStore.milestoneRecords,
  async (newRecords) => {
    const userId = userStore.userId
    const newMilestones = newRecords.filter(
      (record) => record.userId === userId && !record.isConfirmed,
    )

    for (const record of newMilestones) {
      const milestone = await milestoneStore.fetchMilestoneById(
        record.milestoneId,
      )
      if (milestone?.success && milestone.data) {
        popupQueue.value.push(milestone.data.milestone)
        record.isConfirmed = true
      }
    }

    if (!showPopup.value) nextMilestone()
    milestoneStore.saveMilestoneRecordsToLocalStorage()
  },
  { immediate: true, deep: true },
)

const closePopup = () => {
  showPopup.value = false
  currentMilestone.value = null
  if (popupQueue.value.length > 0) setTimeout(nextMilestone, 300)
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
