<template>
  <div>
    <ami-loader />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/userStore'
import { errorHandler } from './server/api/utils/error'
import { useArtStore } from './stores/artStore'
import { useTagStore } from '@/stores/tagStore'
import { useNsfwStore } from '@/stores/nsfwStore'

const tagStore = useTagStore()
const userStore = useUserStore()
const artStore = useArtStore()
const nsfwStore = useNsfwStore()

const user = computed(() => userStore.user)
const username = computed(() => userStore.username)

onMounted(() => {
  try {
    // Initialize user data
    nsfwStore.initialize()
    userStore.initializeUser()
    artStore.init()
    tagStore.initializeTags()
  } catch (error: any) {
    errorHandler({ success: false, message: `Initialization failed: ${error}` })
  }
})
</script>
