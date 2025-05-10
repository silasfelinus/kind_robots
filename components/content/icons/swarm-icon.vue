<!-- /components/content/story/swarm-icon.vue -->
<template>
  <icon-shell>
    <template #icon>
      <div
        @click="toggleAmiSwarm"
        class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
      >
        <Icon
          name="kind-icon:butterfly"
          title="Kind Butterflies"
          :class="{ glow: showSwarm }"
          class="w-full h-full max-w-[3rem] max-h-[3rem]"
        />

        <!-- Full-screen Swarm Animation -->
        <div
          v-if="showSwarm"
          class="fixed inset-0 overflow-hidden z-50 pointer-events-none full-page"
        >
          <butterfly-animation />
        </div>
      </div>
    </template>

    <template #label>
      <span
        v-if="!isEditing && !displayStore.bigMode"
        class="text-xs text-center leading-none"
      >
        {{ showSwarm ? swarmText : 'Swarm?' }}
      </span>
    </template>
  </icon-shell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useIconStore } from '@/stores/iconStore'
import { storeToRefs } from 'pinia'

const displayStore = useDisplayStore()
const iconStore = useIconStore()

const { bigMode } = storeToRefs(displayStore)
const { isEditing } = storeToRefs(iconStore)

const showSwarm = ref(false)
const swarmText = ref("We're free!")

const swarmMessages = [
  "We're free!",
  'Fly now!',
  'Release me!',
  'To the skies!',
  'Ami swarm!',
  'Catch us!',
  "We're loose!",
  'So many wings!',
  'Float mode!',
  'Whoosh~',
  'Try and stop us',
  'Flutter on!',
  'Gone with the wind',
  'Wing.exe activated',
  'Out we go!',
  'Unleashed!',
  'Swarm time!',
  'Goodbye!',
  'Winging it',
  '✨✨✨',
  'Off we flit',
  'No take-backs!',
  'Flee the grid!',
]

const toggleAmiSwarm = () => {
  showSwarm.value = !showSwarm.value
  if (showSwarm.value) {
    const randomIndex = Math.floor(Math.random() * swarmMessages.length)
    swarmText.value = swarmMessages[randomIndex]
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
}
.full-page {
  width: 100vw;
  height: 100vh;
}
</style>
