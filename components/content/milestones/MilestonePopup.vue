<!-- MilestonePopup.vue -->
<template>
  <div
    v-if="show"
    class="popup flex flex-col items-center bg-base-400 border rounded-2xl m-6 p-6 text-lg z-100 max-w-lg mx-auto relative"
  >
    <!-- Close Button -->
    <div class="absolute top-2 right-2">
      <button @click="closePopup">
        <icon name="mdi:close" class="text-warning text-2xl" />
      </button>
    </div>
    <!-- Popup Content -->
    <div class="popup-content w-full text-center">
      <h2>Congratulations {{ userStore.username }}!</h2>
      <icon :name="milestone.icon" class="h-64 w-64" />
      <p>🌟You earned the {{ milestone.label }} milestone!🌟</p>
      {{ milestone.message }}
      <div class="karma-award">
        <p>Bonus: +{{ milestone.karma }}</p>
        <p>You Found 1 Jellybean!<icon name="fluent-emoji-high-contrast:beans" /></p>
      </div>
      <button class="bg-primary text-white rounded-2xl border px-4 py-2" @click="closePopup">
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useConfetti } from '@/utils/useConfetti'

const props = defineProps({
  show: { type: Boolean, default: false },
  milestone: { type: Object, default: () => ({}) },
  onClose: { type: Function, default: () => {} } // Custom event to handle close
})
const jellybeanIcon = ''

const userStore = useUserStore()
const { triggerConfetti } = useConfetti()

const closePopup = () => {
  if (!alreadyAchieved.value) {
    triggerConfetti()
  }
  props.onClose()
}
</script>
