<!-- /components/milestone-popup.vue -->
<template>
  <div
    v-if="milestone"
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
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const userStore = useUserStore()
const milestoneStore = useMilestoneStore()

const milestone = computed(() => milestoneStore.activeMilestones[0])

const acknowledgeMilestone = async () => {
  await userStore.updateKarmaAndMana()

  if (!milestone.value) return

  await milestoneStore.confirmMilestone(milestone.value.id)

  milestone.value.isActive = false // hide from popup queue
}
</script>
