<!-- MilestoneComponent.vue -->
<template>
  <div>
    <!-- Toggle between MilestonePopup and icon -->
    <div @click="toggleReveal">
      <icon v-if="!reveal" name="mdi:trophy-outline" class="text-accent text-2xl h-16 w-16" />
      <div
        v-else
        class="popup flex flex-col items-center bg-base-400 border rounded-2xl m-6 p-6 text-lg z-100 relative"
      >
        <!-- Close Button -->
        <div class="absolute top-2 right-2">
          <button @click="closePopup">
            <icon name="mdi:close" class="text-warning text-2xl" />
          </button>
        </div>
        <!-- NEW Alert -->
        <div v-if="isNew" class="absolute top-2 left-2 bg-warning text-white p-1 rounded">NEW</div>
        <!-- Popup Content -->
        <div v-if="currentMilestone">
          <icon :name="currentMilestone.icon" class="h-64 w-64" />
          <p>🌟You earned the {{ currentMilestone.label }} milestone!🌟</p>
          {{ currentMilestone.message }}
          <div class="karma-award">
            <p>Bonus: +{{ currentMilestone.karma }}</p>
            <p>You Found 1 Jellybean!</p>
            <icon
              name="tdesign:bean"
              class="p-2 m-2 min-h-32 max-h-64 min-w-32 max-w-64 text-accent"
            />
          </div>
          <button class="bg-primary text-white rounded-2xl border px-4 py-2" @click="closePopup">
            Add to Collection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useConfetti } from '@/utils/useConfetti'
import { useMilestoneStore, Milestone } from '@/stores/milestoneStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()
const processed = ref(false)

// Define props with more descriptive names
const props = defineProps({
  id: { type: Number, default: 10 }
})

const currentMilestone = ref<Milestone | null>(null)
const reveal = ref(!userStore.milestones.includes(props.id))
const isNew = computed(() => processed)

const { triggerConfetti } = useConfetti()

const toggleReveal = () => {
  reveal.value = !reveal.value
}

const closePopup = () => {
  if (isNew.value) {
    triggerConfetti()
    userStore.addMilestone(props.id)
  }
  reveal.value = false
}

onMounted(() => {
  if (!userStore.milestones.includes(props.id)) {
    console.log('There is a reward that needs to be applied!')
    console.log('reveal status:', reveal)
  }
})
</script>
