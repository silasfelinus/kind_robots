<!-- /components/content/story/avatar-image.vue -->
<template>
  <div v-if="hydrated" class="relative w-full h-full">
    <div class="flip-card h-full w-full" @click.stop="handleAvatarClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            v-if="resolvedImage"
            :src="resolvedImage"
            alt="Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center bg-base-300"
          >
            <Icon name="kind-icon:person" class="w-full h-full text-accent" />
          </div>
        </div>
        <div class="flip-card-back">
          <img
            v-if="resolvedImage"
            :src="resolvedImage"
            alt="Avatar (back)"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center bg-base-300"
          >
            <Icon name="kind-icon:person" class="w-full h-full text-accent" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const flipped = ref(false)
const hydrated = ref(false)
const resolvedImage = ref<string | null>(null)

const userStore = useUserStore()
const errorStore = useErrorStore()

const FALLBACK = '/images/kindart.webp'

const fetchAvatar = async () => {
  const result = await userStore.userImage()
  resolvedImage.value = result === FALLBACK ? null : result
  console.debug('[avatar-image] resolvedImage →', resolvedImage.value)
}

watch(
  () => [userStore.user?.artImageId, userStore.user?.avatarImage],
  async ([newArtId, newAvatar], [oldArtId, oldAvatar]) => {
    console.info(
      `[avatar-image] User image changed — artImageId: ${oldArtId} → ${newArtId}, avatarImage: ${oldAvatar} → ${newAvatar}`,
    )
    await fetchAvatar()
  },
)

onMounted(async () => {
  hydrated.value = true
  await fetchAvatar()
})

const handleAvatarClick = () => {
  try {
    console.group('[avatar-image] click debug')
    console.log('user:', userStore.user?.username)
    console.log('user.avatarImage:', userStore.user?.avatarImage)
    console.log('user.artImageId:', userStore.user?.artImageId)
    console.log('resolvedImage.value:', resolvedImage.value)
    console.log('hydrated:', hydrated.value)
    console.groupEnd()
    flipped.value = !flipped.value
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle'
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
