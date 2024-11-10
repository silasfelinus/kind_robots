

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const props = defineProps<{ id: number }>()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()

const milestoneAchieved = ref(false)

const checkAndRecordMilestone = async () => {
  try {
    // Fetch the milestone by ID
    const response = await milestoneStore.fetchMilestoneById(props.id)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Milestone not found')
    }

    const milestone = response.data

    // Check if the user already has this milestone
    if (milestoneStore.hasMilestone(userStore.userId, milestone.id)) {
      console.log('Milestone already rewarded.')
      milestoneAchieved.value = true
      return
    }

    // Record the milestone for the user
    const recordResult = await milestoneStore.recordMilestone(
      userStore.userId,
      milestone.id
    )
    if (recordResult.success) {
      console.log('Milestone successfully recorded.')
      milestoneAchieved.value = true
    } else {
      throw new Error(recordResult.message || 'Failed to record milestone')
    }
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
    console.error('Error recording milestone:', errorStore.message)
  }
}

onMounted(() => {
  // Automatically check and record milestone on mount if desired
  checkAndRecordMilestone()
})
</script>
