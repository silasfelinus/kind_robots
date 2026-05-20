<!-- /components/content/milestones/milestone-popup.vue -->
<template>
  <div
    v-if="milestone && !userStore.isGuest"
    class="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 backdrop-blur-sm"
    aria-labelledby="milestone-popup"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="rounded-2xl p-10 text-center border border-accent bg-base-100 max-w-lg mx-auto shadow-xl"
    >
      <h2 id="milestone-popup" class="text-3xl font-semibold mb-6 text-primary">
        🎉 Congratulations, {{ userStore.username }}!
      </h2>

      <Icon
        :name="milestone.icon ?? 'kind-icon:map'"
        class="h-20 w-20 mx-auto mb-6 text-primary"
      />
      <p class="text-xl font-medium mb-4 text-gray-800">
        🌟 You earned the
        <span class="font-bold">{{ milestone.label }}</span> milestone! 🌟
      </p>
      <p class="my-4 text-gray-700">{{ milestone.message }}</p>

      <div
        class="karma-award flex flex-col items-center bg-accent bg-opacity-10 p-4 rounded-xl"
      >
        <p class="text-lg font-semibold text-accent">
          Bonus: +{{ milestone.karma }}
        </p>
        <div class="flex items-center mt-2">
          <Icon name="kind-icon:jellybean" class="p-2 h-12 w-12 text-accent" />
          <p class="text-lg ml-2">You Found 1 Jellybean!</p>
        </div>
      </div>

      <button
        class="mt-6 bg-primary text-white px-6 py-2 rounded-2xl border"
        @click="acknowledgeMilestone"
      >
        Awesome! Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/milestones/milestone-popup.vue
import { computed, watch, nextTick } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import confetti from 'canvas-confetti'

type MilestoneRecordLike = {
  milestoneId: number
}

type MilestoneLike = {
  id: number
  label: string
  message?: string | null
  icon?: string | null
  karma?: number | null
}

const userStore = useUserStore()
const milestoneStore = useMilestoneStore()


const milestone = computed<MilestoneLike | null>(() => {
  const m = milestoneStore.unconfirmedMilestones?.[0]
  return (m ?? null) as MilestoneLike | null
})

watch(milestone, async (newMilestone, oldMilestone) => {
  if (newMilestone && !oldMilestone && !userStore.isGuest) {
    await nextTick()
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    })
    console.log(
      `[milestone-popup] Confetti triggered for ${newMilestone.label}`,
    )
  }
})

const acknowledgeMilestone = async (): Promise<void> => {
  const current = milestone.value

  if (!current) {
    console.warn('[milestone-popup] Tried to acknowledge, but no milestone found')
    return
  }

  console.log(
    `[milestone-popup] Acknowledging milestone: ${current.label} (id: ${current.id})`,
  )

  await milestoneStore.confirmMilestone(current.id)
}

</script>
