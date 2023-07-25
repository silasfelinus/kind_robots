// stores/index.ts

export * from './botStore'
export * from './errorStore'
export * from './galleryStore'
export * from './mediaStore'
export * from './projectStore'
export * from './promptStore'
export * from './reactionStore'
export * from './resourceStore'
export * from './screenfxStore'
export * from './statusStore'
export * from './themeStore'
export * from './userStore'
export * from './gameStore'
export * from './dreamStore'

export interface Store {
  loadStore: () => Promise<any>
  status: Ref<'loading' | 'loaded' | 'error'>
}
