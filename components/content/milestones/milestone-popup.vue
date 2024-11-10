<template>
  <div class="flex justify-center items-center bg-base-400">
    <!-- Button to Toggle Popup -->
    <button
      v-if="!showPopup"
      class="bg-primary text-white rounded-2xl p-4 m-4 border"
      @click="togglePopup"
    >
      <Icon :name="milestone?.icon ?? 'kind-icon:map'" class="h-16 w-16" />
    </button>

    <!-- Popup Content -->
    <div
      v-if="showPopup"
      class="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50"
    >
      <div
        class="bg-base-400 rounded-2xl p-10 text-center relative max-w-lg mx-auto shadow-xl"
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
            <Icon
              name="kind-icon:jellybean"
              class="p-2 h-16 w-16 text-accent"
            />
          </div>
          <button
            class="bg-primary text-white rounded-2xl border px-6 py-3 mt-6 hover:bg-primary-focus transition"
            @click="togglePopup"
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
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore, type Milestone } from '@/stores/milestoneStore'
import { useErrorStore } from '@/stores/errorStore'
import { useConfetti } from '@/utils/useConfetti'

const props = defineProps<{ id: number }>()
const { triggerConfetti } = useConfetti()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()
const milestone = ref<Milestone | null>(null)
const showPopup = ref(false)

const togglePopup = () => {
  showPopup.value = !showPopup.value
  if (showPopup.value) {
    triggerConfetti()
  }
}

const validateMilestoneRecord = async () => {
  try {
    if (
      milestone.value &&
      milestoneStore.hasMilestone(userStore.userId, milestone.value.id)
    ) {
      console.log('Milestone already rewarded, closing popup.')
      showPopup.value = false
      return 'success'
    }

    if (milestone.value) {
      triggerConfetti()
      console.log('Attempting to record milestone...')

      const result = await milestoneStore.recordMilestone(
        userStore.userId,
        milestone.value.id,
      )

      if (result.success) {
        console.log('Milestone successfully recorded.')
      } else {
        throw new Error(result.message || 'Failed to record milestone')
      }
    }
  } catch (error: unknown) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
    console.error('Failed to validate milestone', errorStore.message)
  }
}

const validateUserRecord = async () => {
  try {
    const result = await userStore.updateKarmaAndMana()
    if (!result.success) throw new Error(result.message)
  } catch (error: unknown) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
    console.error('Failed to validate user record', errorStore.message)
  }
}

onMounted(async () => {
  const response = await milestoneStore.fetchMilestoneById(props.id || 10)

  if (response.success && response.data) {
    milestone.value = response.data
  } else {
    milestone.value = null
    errorStore.setError(ErrorType.GENERAL_ERROR, response.message)
  }

  showPopup.value = true
  if (userStore.userId !== 0) {
    await Promise.all([validateMilestoneRecord(), validateUserRecord()])
  }
})
</script>
