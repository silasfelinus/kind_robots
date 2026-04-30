<!-- /components/content/story/avatar-image.vue -->
<template>
  <div v-if="hydrated" class="relative w-full h-full">
    <div class="flip-card h-full w-full" @click="handleAvatarClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            :src="resolvedImage"
            alt="Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
        </div>
        <div class="flip-card-back">
          <img
            :src="resolvedImage"
            alt="Avatar (back)"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const flipped = ref(false)
const hydrated = ref(false)
const resolvedImage = ref('/images/botcafe.webp')

const userStore = useUserStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

async function resolveAvatar() {
  console.log('[avatar-image] resolveAvatar called')
  console.log('[avatar-image] userStore.user:', userStore.user)
  console.log('[avatar-image] userStore.userId:', userStore.userId)
  console.log('[avatar-image] userStore.avatarImage:', userStore.avatarImage)
  console.log(
    '[avatar-image] userStore.user?.artImageId:',
    userStore.user?.artImageId,
  )

  const result = await userStore.userImage()
  console.log('[avatar-image] userImage() resolved to:', result)
  resolvedImage.value = result
}

onMounted(async () => {
  hydrated.value = true
  await resolveAvatar()
})

watch(
  () => [userStore.user?.artImageId, userStore.user?.avatarImage],
  async ([newArtId, newAvatar], [oldArtId, oldAvatar]) => {
    if (newArtId !== oldArtId || newAvatar !== oldAvatar) {
      console.log('[avatar-image] relevant user fields changed, resolving')
      await resolveAvatar()
    }
  },
)
const handleAvatarClick = () => {
  try {
    flipped.value = !flipped.value
    displayStore.toggleBigMode()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to toggle big mode'
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }
}
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
  cursor: pointer;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 1rem;
  overflow: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
