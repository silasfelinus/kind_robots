<template>
  <div v-if="pitch" class="flex flex-col items-center rounded-2xl hover:shadow-lg p-4 bg-base-200">
    <div class="mb-4">
      <label for="title" class="block text-sm font-medium text-gray-600">Title</label>
      <input id="title" v-model="localPitch.title" class="mt-1 p-2 w-full rounded-md bg-base-100" />
    </div>
    <div class="mb-4">
      <label for="pitch" class="block text-sm font-medium text-gray-600">Pitch</label>
      <textarea
        id="pitch"
        v-model="localPitch.pitch"
        rows="3"
        class="mt-1 p-2 w-full rounded-md bg-base-100"
      ></textarea>
    </div>
    <div class="mb-4">
      <label for="flavorText" class="block text-sm font-medium text-gray-600">Flavor Text</label>
      <input
        id="flavorText"
        v-model="localPitch.flavorText"
        class="mt-1 p-2 w-full rounded-md bg-base-100"
      />
    </div>
    <div class="mb-4">
      <label for="designer" class="block text-sm font-medium text-gray-600">Designer</label>
      <input
        id="designer"
        v-model="localPitch.designer"
        class="mt-1 p-2 w-full rounded-md bg-base-100"
      />
    </div>
    <div v-if="isOrphan || isOwner" @click="toggleAdoption">
      <span>{{ isOrphan ? 'Adopt' : 'Put Up for Adoption' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Pitch, usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'

const { pitch } = defineProps<{
  pitch: Pitch
}>()

const pitchStore = usePitchStore()
const userStore = useUserStore()

// Create a local copy of the pitch
const localPitch = ref({ ...pitch })

// Check ownership and roles
const isOwner = computed(() => pitch.userId === userStore.userId)
const isAdmin = computed(() => userStore.role === 'ADMIN')
const isOrphan = computed(() => pitch.isOrphan || pitch.userId === 0)

// Watch for changes in localPitch and update the store
watch(
  localPitch,
  (newPitch) => {
    pitchStore.updatePitch(newPitch.id, newPitch)
  },
  { deep: true }
)

const toggleAdoption = () => {
  if (isOrphan.value) {
    console.log(`Adopting pitch ${localPitch.value.id}`)
    localPitch.value.userId = userStore.userId
    localPitch.value.isOrphan = false
  } else if (isOwner.value) {
    console.log(`Putting up pitch ${localPitch.value.id} for adoption`)
    localPitch.value.isOrphan = true
  }
  pitchStore.updatePitch(localPitch.value.id, {
    userId: localPitch.value.userId,
    isOrphan: localPitch.value.isOrphan
  })
}
</script>
