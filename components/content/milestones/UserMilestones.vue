<template>
  <div>
    <div class="bg-base-200 rounded-2xl border p-2 m-2">
      <div class="text-center rounded-t-xl p-2 m-2">
        <h1 class="text-lg mb-4">
          {{ userStore.username }}'s Earned Milestones: {{ userMilestones }}
        </h1>
      </div>
      <milestone-check :id="10" />
      <div v-if="unlockedMilestones.length > 0" class="grid grid-cols-3 gap-4">
        <MilestoneCard
          v-for="milestone in unlockedMilestones"
          :key="milestone.id"
          :milestone="milestone"
          :achieved="true"
        />
      </div>
    </div>
    <locked-milestones />
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

const unlockedMilestones = computed(() =>
  milestones.value.filter((milestone) => userMilestones.value.includes(milestone.id))
)

const isMilestoneAchieved = (milestoneId: number) => {
  console.log('Checking milestoneId', milestoneId, 'against', userMilestones.value) // Debug
  return userMilestones.value ? userMilestones.value.includes(milestoneId) : false
}
</script>
