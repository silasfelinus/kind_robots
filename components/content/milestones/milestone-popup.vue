<template>
  <!-- Popup Content -->
  <div
    v-if="showPopup"
    class="fixed inset-0 flex justify-center items-center z-50"
  >
    <div class="rounded-2xl p-10 text-center relative border-accent rounded-2xl bg-base-100 max-w-lg mx-auto shadow-xl">
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
          <Icon
            name="kind-icon:jellybean"
            class="p-2 h-16 w-16 text-accent"
          />
        </div>
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
import { ref, onMounted, computed, watchEffect } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useConfetti } from '@/utils/useConfetti'

const { triggerConfetti } = useConfetti()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const showPopup = ref(false)

// Computed property to access the first unconfirmed milestone
const milestone = computed(() => milestoneStore.unconfirmedMilestones[0] || null)

watchEffect(() => {
  console.log('Milestone:', milestone.value); // Log for debugging
  if (milestone.value) {
    showPopup.value = true
    triggerConfetti()
  } else {
    showPopup.value = false
  }
});


// Function to confirm the milestone and close the popup
const confirmMilestone = () => {
  if (milestone.value) {
    milestoneStore.confirmMilestone(milestone.value.id)
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
