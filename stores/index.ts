// stores/index.ts

export * from './botStore'
export * from './errorStore'
export * from './galleryStore'
export * from './resourceStore'
export * from './screenStore'
export * from './statusStore'
export * from './themeStore'
export * from './userStore'
export * from './gameStore'
export * from './dreamStore'

export interface Store {
  loadStore: () => Promise<any>
  status: Ref<'loading' | 'loaded' | 'error'>
}
