<script setup lang="ts">
import { onMounted } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const props = defineProps<{ id: number }>()
const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

const checkAndRecordMilestone = async () => {
  try {
    // Fetch milestone data by ID
    const response = await milestoneStore.fetchMilestoneById(props.id || 10)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Milestone not found')
    }

    const milestone = response.data

    // Check if the user already has this milestone
    if (milestoneStore.hasMilestone(userStore.userId, milestone.id)) {
      console.log('Milestone already achieved.')
      return
    }

    // Record the milestone if not already achieved
    const recordResult = await milestoneStore.recordMilestone(
      userStore.userId,
      milestone.id,
    )
    if (recordResult.success) {
      console.log('Milestone recorded successfully.')
    } else {
      throw new Error(recordResult.message || 'Failed to record milestone')
    }
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
    console.error('Error handling milestone:', errorStore.message)
  }
}

// Optionally, run on mount
onMounted(() => checkAndRecordMilestone())
</script>
