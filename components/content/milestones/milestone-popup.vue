<template>
  <div class="z-50 flex justify-center items-center bg-base-400">
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
      class="fixed inset-0 flex justify-center items-center z-50 bg-black"
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
            @click="confirmMilestone"
          >
            Yay! (Close)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

// milestonePopup.vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useConfetti } from '@/utils/useConfetti'

const { triggerConfetti } = useConfetti()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const showPopup = ref(false)

// Access the first unconfirmed milestone using a computed property
const milestone = computed(
  () => milestoneStore.unconfirmedMilestones[0] || null,
)

const togglePopup = () => {
  showPopup.value = !showPopup.value
  if (showPopup.value) {
    triggerConfetti()
  }
}

const confirmMilestone = () => {
  if (milestone.value) {
    milestoneStore.confirmMilestone(milestone.value.id)
    showPopup.value = false
  }
}

onMounted(() => {
  if (milestone.value) {
    showPopup.value = true
    triggerConfetti()
  } else {
    showPopup.value = false
  }
})
</script>
