<template>
  <div>
    <div v-if="showPopup" class="popup">
      <div class="popup-content">
        <h2>Congratulations {{ userStore.username }}!</h2>
        <icon :name="milestone.icon" class="h-32 w-32" />
        <p>You've earned the {{ milestone.label }} milestone!</p>
        {{ milestone.message }}
        <div class="karma-award">
          <p>Old Karma: {{ oldKarma }}</p>
          <p>Bonus: +{{ milestone.karma }}</p>
          <p>New Karma: {{ userStore.karma }}</p>
        </div>
        <button @click="closePopup">Close</button>
      </div>
    </div>
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'
import { useConfetti } from '@/utils/useConfetti'

const props = defineProps({
  id: { type: Number, default: 10 }
})

const milestoneId = props.id || 1
const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

const isHandled = ref(false)
const showPopup = ref(false)
const milestone = ref(null)
const errorMessage = ref(null)

const { triggerConfetti } = useConfetti()

// Calculate old Karma
const oldKarma = computed(() => userStore.karma - milestone.value?.karma || 0)

watchEffect(async () => {
  if (!isHandled.value && userStore.isLoggedIn) {
    const userId = userStore.userId

    try {
      if (!milestoneStore.hasMilestone(userId, milestoneId)) {
        await milestoneStore.awardMilestone(userId, milestoneId)
        milestone.value = milestoneStore.milestones.find((m) => m.id === milestoneId)
        showPopup.value = true
        triggerConfetti()
      }
      isHandled.value = true
    } catch (error) {
      const { message } = errorHandler(error)
      errorMessage.value = message
    }
  }
})

const closePopup = () => {
  showPopup.value = false
}
</script>
