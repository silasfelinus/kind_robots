<!-- /components/content/milestones/milestone-popup.vue -->
<template>
  <div
    v-if="milestone && !userStore.isGuest"
    class="pointer-events-auto fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    aria-labelledby="milestone-popup"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-accent/40 bg-base-100 shadow-2xl shadow-accent/20"
      @click.stop
    >
      <!-- Coloured top band -->
      <div
        class="bg-linear-to-r from-primary via-secondary to-accent px-6 py-5 text-center"
      >
        <span
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/30"
        >
          <Icon
            :name="milestone.icon ?? 'kind-icon:map'"
            class="h-9 w-9 text-white drop-shadow"
          />
        </span>
        <h2
          id="milestone-popup"
          class="mt-3 text-2xl font-black text-white drop-shadow"
        >
          Milestone Unlocked!
        </h2>
        <p class="mt-0.5 text-sm font-semibold text-white/80">
          {{ userStore.username }}
        </p>
      </div>

      <!-- Body -->
      <div class="p-6 text-center">
        <p class="text-xl font-black text-base-content">
          {{ milestone.label }}
        </p>

        <p
          v-if="milestone.message"
          class="mt-3 text-sm leading-relaxed text-base-content/65"
        >
          {{ milestone.message }}
        </p>

        <!-- Karma / jellybean reward -->
        <div
          class="mx-auto mt-5 flex max-w-xs items-center justify-center gap-4 rounded-2xl border border-accent/30 bg-accent/8 px-5 py-4"
        >
          <Icon name="kind-icon:jellybean" class="h-10 w-10 text-accent" />
          <div class="text-left">
            <p
              class="text-xs font-black uppercase tracking-wider text-accent/70"
            >
              Reward
            </p>
            <p class="text-lg font-black text-accent">
              +{{ milestone.karma ?? 0 }} karma
            </p>
            <p class="text-xs text-base-content/55">You found 1 Jellybean!</p>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary mt-6 w-full rounded-2xl font-black shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0"
          @click.stop="acknowledgeMilestone"
        >
          <Icon name="kind-icon:check" class="h-5 w-5" />
          Awesome, thanks!
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
    console.log(
      `[milestone-popup] Confetti triggered for ${newMilestone.label}`,
    )
  }
})

const acknowledgeMilestone = async (): Promise<void> => {
  const current = milestone.value
  if (!current) {
    console.warn(
      '[milestone-popup] Tried to acknowledge, but no milestone found',
    )
    return
  }
  console.log(
    `[milestone-popup] Acknowledging milestone: ${current.label} (id: ${current.id})`,
  )
  await milestoneStore.confirmMilestone(current.id)
}
</script>
