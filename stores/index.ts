// stores/index.ts
// stores/index.ts
import type { Ref } from 'vue'

export * from './botStore'
export * from './errorStore'
export * from './galleryStore'
export * from './resourceStore'
export * from './screenStore'
export * from './statusStore'
export * from './themeStore'
export * from './userStore'
export * from './choiceStore'
export * from './dreamStore'

export interface Store<T = unknown> {
  loadStore: () => Promise<T> // Replace `T` with a more specific type if possible
  status: Ref<'loading' | 'loaded' | 'error'>
}

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

export const loadTagStore = async () => {
  const { useTagStore } = await import('@/stores/tagStore');
  return useTagStore();
};

