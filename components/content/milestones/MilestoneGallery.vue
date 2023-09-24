<template>
  <div>
    <milestone-check />
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MilestoneCard
        v-for="milestone in milestones"
        :key="milestone.id"
        :milestone="milestone"
        :achieved="isMilestoneAchieved(milestone.id)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const milestones = computed(() => milestoneStore.milestones)
const userMilestones = computed(() => userStore.milestones)

const isMilestoneAchieved = (milestoneId: number) => {
  console.log('Checking milestoneId', milestoneId, 'against', userMilestones.value) // Debug
  return userMilestones.value ? userMilestones.value.includes(milestoneId) : false
}

// Initialize milestones when the component is mounted
onMounted(() => {
  milestoneStore.initializeMilestones()
})
</script>
