<template>
  <!-- Popup Content -->
  <div
    v-if="showPopup"
    class="fixed inset-0 flex justify-center items-center border border-red-500 z-50"
  >
    <div
      class="rounded-2xl p-10 text-center relative border-accent bg-base-100 max-w-lg mx-auto shadow-xl"
    >
      <h2 class="text-3xl font-semibold mb-6">
        Congratulations, {{ userStore.username }}!
      </h2>
      <div v-if="milestone">
        <Icon
          :name="milestone.icon ?? 'kind-icon:map'"
          class="h-20 w-20 mx-auto mb-6 text-primary"
        />
        <p class="text-xl font-medium mb-4">
          🌟 You earned the {{ milestone.label }} milestone! 🌟
        </p>
        <p class="my-4 text-gray-700">{{ milestone.message }}</p>
        <div class="karma-award flex flex-col items-center">
          <p class="text-lg font-semibold">Bonus: +{{ milestone.karma }}</p>
          <p class="text-lg mb-4">You Found 1 Jellybean!</p>
          <Icon name="kind-icon:jellybean" class="p-2 h-16 w-16 text-accent" />
        </div>

        <!-- Checkbox -->
        <label class="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            v-model="checkboxChecked"
            class="checkbox checkbox-primary"
          />
          <span class="text-sm">Do not show this popup again</span>
        </label>

        <!-- Confirm Button -->
        <button
          class="bg-primary text-white rounded-2xl border px-6 py-3 mt-6 hover:bg-primary-focus transition"
          @click="confirmMilestone"
        >
          Yay! (Close)
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from './../../../stores/userStore' // Assuming this is the store
import { useMilestoneStore } from './../../../stores/milestoneStore'

const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const showPopup = ref(true)
const milestone = milestoneStore.currentMilestone // Example binding to the current milestone
const checkboxChecked = ref(false) // Tracks the checkbox state

const confirmMilestone = () => {
  if (milestone) {
    // Update isConfirmed
    milestoneStore.updateMilestone({
      id: milestone.id,
      isConfirmed: true,
    })

    // If checkbox is checked, set a flag in the user store
    if (checkboxChecked.value) {
      userStore.updatePreferences({ hideMilestonePopups: true })
    }

    // Close the popup
    showPopup.value = false
  }
}
</script>


<style>
/* Full-screen overlay styling */
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
