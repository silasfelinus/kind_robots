export const loadPromptStore = async () => {
  const { usePromptStore } = await import('@/stores/promptStore')
  return usePromptStore()
}

export const loadArtStore = async () => {
  const { useArtStore } = await import('@/stores/artStore')
  return useArtStore()
}

export const loadBotStore = async () => {
  const { useBotStore } = await import('@/stores/botStore')
  return useBotStore()
}

export const loadGalleryStore = async () => {
  const { useGalleryStore } = await import('@/stores/galleryStore')
  return useGalleryStore()
}

export const loadComponentStore = async () => {
  const { useComponentStore } = await import('@/stores/componentStore')
  return useComponentStore()
}

export const loadChatStore = async () => {
  const { useChatStore } = await import('~/stores/chatStore')
  return useChatStore()
}

export const loadUserStore = async () => {
  const { useUserStore } = await import('@/stores/userStore')
  return useUserStore()
}

export const loadTagStore = async () => {
  const { useTagStore } = await import('@/stores/tagStore')
  return useTagStore()
}

export const loadDisplayStore = async () => {
  const { useDisplayStore } = await import('@/stores/displayStore')
  return useDisplayStore()
}

export const loadPitchStore = async () => {
  const { usePitchStore } = await import('@/stores/pitchStore')
  return usePitchStore()
}

export const loadContentStore = async () => {
  const { useContentStore } = await import('@/stores/contentStore')
  return useContentStore()
}

export const loadDreamStore = async () => {
  const { useDreamStore } = await import('@/stores/dreamStore')
  return useDreamStore()
}

export const loadErrorStore = async () => {
  const { useErrorStore } = await import('@/stores/errorStore')
  return useErrorStore()
}

export const loadMilestoneStore = async () => {
  const { useMilestoneStore } = await import('@/stores/milestoneStore')
  return useMilestoneStore()
}

export const loadReactionStore = async () => {
  const { useReactionStore } = await import('@/stores/reactionStore')
  return useReactionStore()
}

export const loadResourceStore = async () => {
  const { useResourceStore } = await import('@/stores/resourceStore')
  return useResourceStore()
}

export const loadRewardStore = async () => {
  const { useRewardStore } = await import('@/stores/rewardStore')
  return useRewardStore()
}

export const loadThemeStore = async () => {
  const { useThemeStore } = await import('@/stores/themeStore')
  return useThemeStore()
}
