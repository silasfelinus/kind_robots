<template>
  <div>
    <ami-loader />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/userStore'
import { errorHandler } from './server/api/utils/error'
import { useArtStore } from './stores/artStore'
import { useChannelStore } from './stores/channelStore'
import { useTagStore } from '@/stores/tagStore'
import { useMatureStore } from '@/stores/matureStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBotStore } from '@/stores/botStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { usePitchStore } from '@/stores/pitchStore'

const layoutStore = useLayoutStore()

const tagStore = useTagStore()
const userStore = useUserStore()
const artStore = useArtStore()
const matureStore = useMatureStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const pitchStore = usePitchStore()
const channelStore = useChannelStore()

onMounted(() => {
  try {
    // Initialize user data
    layoutStore.initialize()
    botStore.loadStore()
    matureStore.initialize()
    userStore.initializeUser()
    artStore.init()
    tagStore.initializeTags()
    themeStore.initTheme()
    pitchStore.initializePitches()
    channelStore.initializeChannels()
  } catch (error: any) {
    errorHandler({ success: false, message: `Initialization failed: ${error}` })
  }
})
</script>
