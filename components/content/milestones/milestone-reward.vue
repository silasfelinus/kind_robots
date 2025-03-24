<!-- /components/milestone-reward.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore } from '@/stores/errorStore'
import { useConfetti } from '@/utils/useConfetti'

const props = defineProps<{ id: number }>()

const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()
const { triggerConfetti } = useConfetti()

onMounted(async () => {
  const milestoneId = props.id
  const { userId } = userStore

  if (milestoneStore.hasMilestone(userId, milestoneId)) return

  const result = await milestoneStore.recordMilestone(userId, milestoneId)
  if (!result.success) {
    errorStore.setError(ErrorType.GENERAL_ERROR, result.message)
    return
  }

  const fetched = await milestoneStore.fetchMilestoneById(milestoneId)
  if (fetched.success && fetched.data) {
    const target = milestoneStore.milestones.find((m) => m.id === milestoneId)
    if (target) {
      target.isActive = true
      triggerConfetti()
    }
  }
})
</script>
