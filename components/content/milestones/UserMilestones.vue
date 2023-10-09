<template>
  <div>
    <div class="bg-base-200 rounded-2xl border p-2 m-2">
      <div class="text-center rounded-t-xl p-2 m-2">
        <h1 class="text-lg mb-4">
          {{ userStore.username }}'s Earned Milestones: {{ unlockedMilestones }}
        </h1>
      </div>
      <div v-if="rewardMilestone"><milestone-reward :milestone="rewardMilestone" /></div>
      <div v-if="unlockedMilestones.length > 0" class="grid grid-cols-3 gap-4">
        <MilestoneCard
          v-for="milestone in unlockedMilestones"
          :key="milestone.id"
          :milestone="milestone"
          :achieved="true"
        />
      </div>
      <locked-milestones />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

const milestones = computed(() => milestoneStore.milestones)
const rewardMilestone = milestones.value[9]
const userMilestones = computed(() => userStore.milestones)

const unlockedMilestones = computed(() => {
  return milestones.value.filter((milestone) =>
    userMilestones.value ? userMilestones.value.includes(milestone.id) : false
  )
})
</script>
