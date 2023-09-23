<template>
  <div>
    <h2 class="text-xl font-bold">Locked Milestones</h2>
    <div class="grid grid-cols-3 gap-4">
      <div v-for="milestone in lockedMilestones" :key="milestone.id" class="flip-card">
        <div class="flip-card-inner">
          <!-- Front Side -->
          <div
            class="flip-card-front bg-base-200 rounded-xl p-2 transition duration-300 ease-in-out relative"
          >
            <div class="text-center">
              <icon :name="milestone.icon" class="text-6xl mb-2" />
              <div class="text-xl font-bold text-gray-700">
                {{ milestone.label }}
              </div>
              <div v-if="milestone.subtleHint" class="text-sm text-gray-500">
                {{ milestone.subtleHint }}
              </div>
            </div>
          </div>
          <!-- Back Side -->
          <div
            class="flip-card-back bg-base-200 rounded-xl p-2 transition duration-300 ease-in-out relative"
          >
            <div class="text-center">
              <div class="text-xl font-bold text-gray-700">
                {{ milestone.tooltip }}
              </div>
              <nuxt-link :to="milestone.pageHint" class="text-blue-500 hover:underline">
                Go to {{ milestone.pageHint }}
              </nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useUserStore } from '@/stores/userStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const milestones = computed(() => milestoneStore.milestones)
const userMilestones = computed(() => userStore.milestones)

const lockedMilestones = computed(() => {
  return milestones.value.filter((milestone) => !userMilestones.value.includes(milestone.id))
})

// Initialize milestones when the component is mounted
onMounted(() => {
  milestoneStore.initializeMilestones()
})
</script>
<style scoped>
.flip-card {
  perspective: 1000px;
}
.flip-card-inner {
  transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform-style: preserve-3d;
  position: relative;
  width: 100%;
  height: 100%;
}
.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}
.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.flip-card-back {
  transform: rotateY(180deg);
}
</style>
