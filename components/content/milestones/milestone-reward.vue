<template>
  <div class="flex justify-center items-center bg-base-400">
    <!-- Button to Toggle Popup -->
    <button
      v-if="!showPopup"
      class="bg-primary text-white rounded-2xl p-4 m-4 border"
      @click="togglePopup"
    >
      <Icon :name="milestone?.icon || 'kind-icon:map'" class="h-16 w-16" />
    </button>

    <!-- Popup Content -->
    <div
      v-if="showPopup"
      class="flex justify-center rounded-2xl items-center z-40 bg-base-300 p-2 m-2 border"
    >
      <div class="bg-base-400 rounded-2xl p-6 m-6 text-center relative">
        <h2 class="text-2xl font-semibold mb-4">
          Congratulations, {{ userStore.username }}!
        </h2>
        <div v-if="milestone?.icon">
          <Icon :name="milestone.icon" class="h-16 w-16 mx-auto mb-4" />
          <p class="text-xl font-medium">
            🌟 You earned the {{ milestone.label }} milestone! 🌟
          </p>
          <p class="my-4">
            {{ milestone.message }}
          </p>
          <div class="karma-award flex flex-col items-center">
            <p class="text-lg font-semibold">Bonus: +{{ milestone.karma }}</p>
            <p class="text-lg">You Found 1 Jellybean!</p>
            <Icon
              name="kind-icon:jellybean"
              class="p-2 m-2 h-16 w-16 text-accent"
            />
          </div>
          <button
            class="bg-primary text-white rounded-2xl border px-4 py-2 mt-4"
            @click="closePopup"
          >
            Yay! (Close)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import {
  useMilestoneStore,
  type Milestone,
} from './../../../stores/milestoneStore'
import { useErrorStore } from './../../../stores/errorStore'
import { useConfetti } from './../../../utils/useConfetti'

const props = defineProps<{ id: number }>()
const { triggerConfetti } = useConfetti()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore() // Initialize errorStore
const milestone = ref<Milestone | null>(null)

const showPopup = ref(false)

const togglePopup = () => {
  showPopup.value = !showPopup.value
}

const closePopup = () => {
  showPopup.value = false
}

const validateMilestoneRecord = async () => {
  try {
    if (
      milestone.value &&
      milestoneStore.hasMilestone(userStore.userId, milestone.value.id)
    ) {
      console.log('Milestone already rewarded, closing popup.')
      showPopup.value = false // Close the popup if milestone already rewarded
      return 'success'
    }
    if (milestone.value) {
      triggerConfetti()
      const result = await milestoneStore.recordMilestone(
        userStore.userId,
        milestone.value.id,
      )
      if (result.success) {
        console.log('Successfully validated milestone', result)
      } else {
        throw new Error(result.message)
      }
    }
  } catch (error: unknown) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error) // Use errorStore for error handling
    console.error('Failed to validate milestone', errorStore.message)
  }
}

const validateUserRecord = async () => {
  try {
    const result = await userStore.updateKarmaAndMana()
    if (result.success) {
      console.log('Successfully validated user', result)
    } else {
      throw new Error(result.message)
    }
  } catch (error: unknown) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error) // Use errorStore for error handling
    console.error('Failed to validate user record', errorStore.message)
  }
}

onMounted(async () => {
  await milestoneStore.fetchMilestoneById(props.id || 10)
  showPopup.value = true
  if (userStore.userId !== 0) {
    await Promise.all([validateMilestoneRecord(), validateUserRecord()])
  }
})
</script>
