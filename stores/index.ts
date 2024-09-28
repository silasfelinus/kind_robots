// stores/index.ts


export const loadPromptStore = async () => {
  const { usePromptStore } = await import('@/stores/promptStore');
  return usePromptStore();
};

export const loadArtStore = async () => {
  const { useArtStore } = await import('@/stores/artStore');
  return useArtStore();
};

export const loadBotStore = async () => {
  const { useBotStore } = await import('@/stores/botStore');
  return useBotStore();
};

export const loadGalleryStore = async () => {
  const { useGalleryStore } = await import('@/stores/galleryStore');
  return useGalleryStore();
};

export const loadComponentStore = async () => {
  const { useComponentStore } = await import('@/stores/componentStore');
  return useComponentStore();
};

export const loadUserStore = async () => {
  const { useUserStore } = await import('@/stores/userStore');
  return useUserStore();
};

export const loadTagStore = async () => {
  const { useTagStore } = await import('@/stores/tagStore');
  return useTagStore();
};

export const loadDisplayStore = async () => {
  const { useDisplayStore } = await import('@/stores/displayStore');
  return useDisplayStore();
};
