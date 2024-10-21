<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
    <StoreTest label="display-store" :load-store="loadDisplayStore" />
    <StoreTest label="user-store" :load-store="loadUserStore" />
    <StoreTest label="pitch-store" :load-store="loadPitchStore" />
    <StoreTest label="prompt-store" :load-store="loadPromptStore" />
    <StoreTest label="art-store" :load-store="loadArtStore" />
    <StoreTest label="bot-store" :load-store="loadBotStore" />
    <StoreTest label="gallery-store" :load-store="loadGalleryStore" />
    <StoreTest label="component-store" :load-store="loadComponentStore" />
    <StoreTest label="tag-store" :load-store="loadTagStore" />
    <StoreTest label="channel-store" :load-store="loadChannelStore" />
    <StoreTest label="chat-store" :load-store="loadChatStore" />
    <StoreTest label="dream-store" :load-store="loadDreamStore" />
    <StoreTest label="error-store" :load-store="loadErrorStore" />
    <StoreTest label="milestone-store" :load-store="loadMilestoneStore" />
    <StoreTest label="reaction-store" :load-store="loadReactionStore" />
    <StoreTest label="resource-store" :load-store="loadResourceStore" />
    <StoreTest label="reward-store" :load-store="loadRewardStore" />
    <StoreTest label="theme-store" :load-store="loadThemeStore" />
  </div>
</template>

<script setup lang="ts">
import {
  loadDisplayStore,
  loadUserStore,
  loadPitchStore,
  loadPromptStore,
  loadArtStore,
  loadBotStore,
  loadGalleryStore,
  loadComponentStore,
  loadTagStore,
  loadChannelStore,
  loadChatStore,
  loadDreamStore,
  loadErrorStore,
  loadMilestoneStore,
  loadReactionStore,
  loadResourceStore,
  loadRewardStore,
  loadThemeStore,
} from '@/stores'
</script>

<style scoped>
.grid {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
