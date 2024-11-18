<template>
  <!-- Popup Content -->
  <div
    v-if="showPopup"
    class="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 backdrop-blur-sm"
    aria-labelledby="milestone-popup"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="rounded-2xl p-10 text-center relative border border-accent bg-base-100 max-w-lg mx-auto shadow-xl transition-transform transform scale-100 fade-scale-enter"
    >
      <h2 id="milestone-popup" class="text-3xl font-semibold mb-6 text-primary">
        🎉 Congratulations, {{ userStore.username }}!
      </h2>
      <div v-if="milestone">
        <Icon
          :name="milestone.icon ?? 'kind-icon:map'"
          class="h-20 w-20 mx-auto mb-6 text-primary"
        />
        <p class="text-xl font-medium mb-4 text-gray-800">
          🌟 You earned the <span class="font-bold">{{ milestone.label }}</span> milestone! 🌟
        </p>
        <p class="my-4 text-gray-700">{{ milestone.message }}</p>
        <div class="karma-award flex flex-col items-center bg-accent bg-opacity-10 p-4 rounded-xl">
          <p class="text-lg font-semibold text-accent">Bonus: +{{ milestone.karma }}</p>
          <div class="flex items-center mt-2">
            <Icon name="kind-icon:jellybean" class="p-2 h-12 w-12 text-accent" />
            <p class="text-lg ml-2">You Found 1 Jellybean!</p>
          </div>
        </div>

        <!-- Checkbox -->
        <label class="flex items-center space-x-2 mt-6 cursor-pointer">
          <input
            type="checkbox"
            v-model="checkboxChecked"
            class="checkbox checkbox-primary"
          />
          <span class="text-sm text-gray-700">Do not show this popup again</span>
        </label>

        <!-- Confirm Button -->
        <button
          class="bg-primary text-white rounded-2xl border px-8 py-3 mt-8 hover:bg-primary-focus transition focus:ring focus:ring-primary-focus"
          @click="confirmMilestone"
        >
          🎉 Yay! (Close)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore } from '@/stores/errorStore'

const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()
const showPopup = ref(true)
const milestone = milestoneStore.currentMilestone // Example binding to the current milestone
const checkboxChecked = ref(false) // Tracks the checkbox state

const confirmMilestone = async () => {
  if (milestone) {
    try {
      // Update isConfirmed for the milestone
      await milestoneStore.updateMilestone({
        id: milestone.id,
        isConfirmed: true,
      })

      // Update user preferences if "Do not show again" is checked
      if (checkboxChecked.value) {
        await userStore.updatePreferences({ hideMilestonePopups: true })
      }

      // Close the popup
      showPopup.value = false
    } catch (error) {
      errorStore.logError(error) // Log error to error store
    }
  }
}
</script>

<style scoped>
/* Transition styling for the popup */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-scale-enter,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
