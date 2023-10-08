<!-- MilestoneCheck.vue -->
<template>
  <div>
    <!-- Show MilestonePopup if not already achieved -->
    <milestone-popup
      v-if="currentMilestone"
      :show="showPopup"
      :milestone="currentMilestone"
      @on-close="handleClosePopup"
    />

    <!-- Show icon if already achieved -->
    <div v-else @click="toggleReveal">
      <icon name="mdi:trophy-outline" class="text-accent text-2xl" />
      <div v-if="reveal">🌟 You already have this achievement! 🌟</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMilestoneStore, Milestone } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

const props = defineProps({
  id: { type: Number, default: 10 }
})

const currentMilestone = ref<Milestone | null>(null)
const alreadyAchieved = computed(() => {
  return userStore.milestones.includes(props.id)
})

const showPopup = ref(false)
const reveal = ref(false)

onMounted(async () => {
  currentMilestone.value = await milestoneStore.fetchMilestoneById(props.id)

  // Award the milestone if it's not already achieved
  if (!alreadyAchieved.value && currentMilestone.value) {
    showPopup.value = true
    const result = await milestoneStore.awardMilestone(userStore.userId, currentMilestone.value.id)
    console.log('Award result:', result) // Debugging line
  }
})

const handleClosePopup = async () => {
  console.log('handleClosePopup called') // Debugging line
  showPopup.value = false
}

const toggleReveal = () => {
  reveal.value = !reveal.value
}
</script>
