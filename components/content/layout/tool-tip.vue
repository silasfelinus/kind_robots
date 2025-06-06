<!-- /components/content/layout/tool-tip.vue -->
<template>
  <div
    class="flex flex-col items-center p-8 bg-base-300 rounded-lg shadow-lg relative w-64 h-64"
  >
    <!-- Tip Toggles -->
    <div class="absolute bottom-0 right-0 mb-2 mr-2 flex flex-col items-end">
      <button
        v-if="tooltip && !tipStatus.Silas.seen"
        @click="toggleTip('Silas')"
      >
        <Icon
          name="solar:cat-bold"
          class="text-3xl"
          :class="tipStatus.Silas.show ? 'text-accent flash' : 'text-default'"
        />
      </button>
      <button v-if="amitip && !tipStatus.Ami.seen" @click="toggleTip('Ami')">
        <Icon
          name="kind-icon:butterfly"
          class="text-3xl"
          :class="tipStatus.Ami.show ? 'text-accent flash' : 'text-default'"
        />
      </button>
    </div>

    <!-- Display Tip -->
    <div v-if="currentTip" class="flex flex-col items-start w-full h-full">
      <h3 class="text-lg font-semibold">{{ currentTipType }} says:</h3>
      <p class="flex-1">
        {{ currentTip }}
      </p>
      <button @click="clearTip">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const { tooltip, amitip } = storeToRefs(usePageStore())

const currentTipType = ref<'Ami' | 'Silas' | null>(null)

const currentTip = computed(() => {
  return currentTipType.value === 'Silas'
    ? (tooltip.value ?? '')
    : currentTipType.value === 'Ami'
      ? (amitip.value ?? '')
      : ''
})

const tipStatus = reactive({
  Ami: { show: false, seen: true },
  Silas: { show: false, seen: true },
})

const toggleTip = (type: 'Ami' | 'Silas') => {
  for (const key in tipStatus) {
    tipStatus[key as 'Ami' | 'Silas'].show = false
  }
  tipStatus[type].show = true
  tipStatus[type].seen = true
  currentTipType.value = type
}

const clearTip = () => {
  currentTipType.value = null
}

watch(tooltip, (newTip) => {
  tipStatus.Silas.seen = !newTip
})

watch(amitip, (newTip) => {
  tipStatus.Ami.seen = !newTip
})
</script>

<style scoped>
.flash {
  animation: flash 1.5s infinite;
}

@keyframes flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
