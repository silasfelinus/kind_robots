<template>
  <div class="flex justify-center items-center bg-base-400">
    <!-- Button to Toggle Popup -->
    <button class="bg-primary text-white rounded-2xl px-4 py-2" @click="togglePopup">
      <icon :name="props.milestone.icon" class="h-64 w-64 mx-auto mb-4" />
    </button>

    <!-- Popup Content -->
    <div v-if="showPopup" class="flex justify-center items-center z-50">
      <div class="bg-base-400 rounded-2xl p-6 w-4/5 md:w-1/2 lg:w-1/3 text-center relative">
        <button class="absolute top-2 right-2 text-warning text-2xl" @click="closePopup">
          <icon name="mdi:close" />
        </button>
        <h2 class="text-2xl font-semibold mb-4">Congratulations, {{ userStore.username }}!</h2>
        <div v-if="props.milestone">
          <icon :name="props.milestone.icon" class="h-64 w-64 mx-auto mb-4" />
          <p class="text-xl font-medium">
            🌟 You earned the {{ props.milestone.label }} milestone! 🌟
          </p>
          <p class="my-4">{{ props.milestone.message }}</p>
          <div class="karma-award flex flex-col items-center">
            <p class="text-lg font-semibold">Bonus: +{{ props.milestone.karma }}</p>
            <p class="text-lg">You Found 1 Jellybean!</p>
            <icon name="tdesign:bean" class="p-2 m-2 h-16 w-16 text-accent" />
          </div>
          <button
            class="bg-primary text-white rounded-2xl border px-4 py-2 mt-4"
            @click="closePopup"
          >
            Add to Collection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore, Milestone } from '@/stores/milestoneStore'
import { errorHandler } from '@/server/api/utils/error'
import { useConfetti } from '@/utils/useConfetti'

// Define props and destructure them
const props = defineProps<{
  milestone: Milestone
}>()
const { triggerConfetti } = useConfetti()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()

const showPopup = ref(false)
const validationStatus = ref<'pending' | 'success' | 'failed'>('pending')

// Function to toggle the popup
const togglePopup = () => {
  showPopup.value = !showPopup.value
}

// Function to toggle the popup
const closePopup = () => {
  showPopup.value = false
}

const validateMilestoneRecord = async () => {
  try {
    if (milestoneStore.hasMilestone(userStore.userId, props.milestone.id)) {
      console.log('there is already a record')
      return (validationStatus.value = 'success')
    }

    const result = await milestoneStore.recordMilestone(userStore.userId, props.milestone.id)

    if (result.success) {
      triggerConfetti()
      console.log('Successfully validated milestone', result)
      validationStatus.value = 'success'
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    const { message } = errorHandler({ error })
    console.error('Failed to validate milestone', message)
    validationStatus.value = 'failed'
  }
}

const validateUserRecord = async () => {
  try {
    console.log('attempting to validate')
    const result = await userStore.updateKarmaAndMana()
    if (result.success) {
      console.log('Successfully updated records', result)
      triggerConfetti()
      validationStatus.value = 'success'
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    const { message } = errorHandler({ error })
    console.error('Failed to validate user', message)
    validationStatus.value = 'failed'
  }
}

onMounted(async () => {
  console.log('There is a reward that needs to be applied!')
  triggerConfetti()
  showPopup.value = true
  // If the user is not a guest (userId is not 0), validate the milestone and user records
  if (userStore.userId !== 0) {
    await Promise.all([validateMilestoneRecord(), validateUserRecord()])
  }
})
</script>
