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

export interface Store<T = unknown> {
  loadStore: () => Promise<T> // Replace `T` with a more specific type if possible
  status: Ref<'loading' | 'loaded' | 'error'>
}
