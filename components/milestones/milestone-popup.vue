<!-- /components/content/milestones/milestone-popup.vue -->
<template>
  <div
    v-if="milestone && !userStore.isGuest"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm pointer-events-auto"
    aria-labelledby="milestone-popup"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="pointer-events-auto mx-auto w-full max-w-lg rounded-2xl border border-accent bg-base-100 p-10 text-center shadow-xl"
      @click.stop
    >
      <h2 id="milestone-popup" class="mb-6 text-3xl font-semibold text-primary">
        🎉 Congratulations, {{ userStore.username }}!
      </h2>

      <Icon
        :name="milestone.icon ?? 'kind-icon:map'"
        class="mx-auto mb-6 h-20 w-20 text-primary"
      />

      <p class="mb-4 text-xl font-medium text-base-content">
        🌟 You earned the
        <span class="font-bold">{{ milestone.label }}</span>
        milestone! 🌟
      </p>

      <p class="my-4 text-base-content/70">
        {{ milestone.message }}
      </p>

      <div
        class="flex flex-col items-center rounded-xl bg-accent/10 p-4"
      >
        <p class="text-lg font-semibold text-accent">
          Bonus: +{{ milestone.karma ?? 0 }}
        </p>

        <div class="mt-2 flex items-center">
          <Icon name="kind-icon:jellybean" class="h-12 w-12 p-2 text-accent" />
          <p class="ml-2 text-lg">You Found 1 Jellybean!</p>
        </div>
      </div>

      <button
        type="button"
        class="mt-6 rounded-2xl border border-primary bg-primary px-6 py-2 font-semibold text-primary-content transition hover:bg-primary/90 active:scale-95"
        @click.stop="acknowledgeMilestone"
      >
        Awesome! Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/milestones/milestone-popup.vue
import { computed, nextTick, watch } from 'vue'
import confetti from 'canvas-confetti'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

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