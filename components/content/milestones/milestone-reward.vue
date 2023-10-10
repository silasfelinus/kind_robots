<template>
  <div class="flex justify-center items-center bg-base-400">
    <!-- Button to Toggle Popup -->
    <button
      v-if="!showPopup"
      class="bg-primary text-white rounded-2xl p-4 m-4 border"
      @click="togglePopup"
    >
      <icon :name="milestone?.icon || 'default-icon'" class="h-64 w-64" />
    </button>

    <!-- Popup Content -->
    <div
      v-if="showPopup"
      class="flex justify-center rounded-2xl items-center z-50 bg-base-200 p-2 m-2 border"
    >
      <div class="bg-base-400 rounded-2xl p-6 m-6 text-center relative">
        <h2 class="text-2xl font-semibold mb-4">Congratulations, {{ userStore.username }}!</h2>
        <div v-if="milestone?.icon">
          <icon :name="milestone.icon" class="h-64 w-64 mx-auto mb-4" />
          <p class="text-xl font-medium">🌟 You earned the {{ milestone.label }} milestone! 🌟</p>
          <p class="my-4">{{ milestone.message }}</p>
          <div class="karma-award flex flex-col items-center">
            <p class="text-lg font-semibold">Bonus: +{{ milestone.karma }}</p>
            <p class="text-lg">You Found 1 Jellybean!</p>
            <icon name="tdesign:bean" class="p-2 m-2 h-16 w-16 text-accent" />
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
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore, Milestone } from '@/stores/milestoneStore'
import { errorHandler } from '@/server/api/utils/error'
import { useConfetti } from '@/utils/useConfetti'

const props = defineProps<{ id: number }>()
const { triggerConfetti } = useConfetti()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const milestone = ref<Milestone | null>(null)

const fetchMilestoneById = async (id: number) => {
  try {
    const result = await milestoneStore.fetchMilestoneById(id)
    if (result.success && result.data) {
      milestone.value = result.data
    } else {
      throw new Error(result.message || 'Data is undefined')
    }
  } catch (error: any) {
    const { message } = errorHandler({ error })
    console.error('Failed to fetch milestone', message)
  }
}

const showPopup = ref(false)

const togglePopup = () => {
  showPopup.value = !showPopup.value
}

const closePopup = () => {
  showPopup.value = false
}

const validateMilestoneRecord = async () => {
  try {
    if (milestone.value && milestoneStore.hasMilestone(userStore.userId, milestone.value.id)) {
      console.log('Milestone already rewarded, closing popup.')
      showPopup.value = false // Close the popup if milestone already rewarded
      return 'success'
    }
    if (milestone.value) {
      triggerConfetti()
      const result = await milestoneStore.recordMilestone(userStore.userId, milestone.value.id)
      if (result.success) {
        console.log('Successfully validated milestone', result)
      } else {
        throw new Error(result.message)
      }
    }
  } catch (error: any) {
    const { message } = errorHandler({ error })
    console.error('Failed to validate milestone', message)
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
  } catch (error: any) {
    const { message } = errorHandler({ error })
    console.error('Failed to validate user record', message)
  }
}

onMounted(async () => {
  await fetchMilestoneById(props.id || 10)
  showPopup.value = true
  if (userStore.userId !== 0) {
    await Promise.all([validateMilestoneRecord(), validateUserRecord()])
  }
})
</script>
