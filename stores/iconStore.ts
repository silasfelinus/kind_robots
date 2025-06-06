// /stores/iconStore.ts

import { defineStore } from 'pinia'
import validIcons from './seeds/validIcons'

export const useIconStore = defineStore('iconStore', () => {
  const icons = validIcons
  return { icons }
})
