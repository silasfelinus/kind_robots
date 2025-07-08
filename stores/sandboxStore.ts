// /stores/sandboxStore.ts
import { defineStore } from 'pinia'

export const useSandboxStore = defineStore('sandboxStore', () => {
  const theme = ref<'default' | 'cosmic' | 'garden' | 'arcade'>('default')

  const environment = ref<any[]>([])
  const contextTools = ref<any[]>([])
  const persistables = ref<any[]>([])

  function saveScene() {
    localStorage.setItem('sandboxScene', JSON.stringify({
      environment: environment.value,
      context: contextTools.value,
      persistables: persistables.value,
      theme: theme.value
    }))
  }

  function loadScene() {
    const raw = localStorage.getItem('sandboxScene')
    if (!raw) return
    const data = JSON.parse(raw)
    environment.value = data.environment || []
    contextTools.value = data.context || []
    persistables.value = data.persistables || []
    theme.value = data.theme || 'default'
  }

  return {
    theme,
    environment,
    contextTools,
    persistables,
    saveScene,
    loadScene
  }
})