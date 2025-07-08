// /stores/sandboxStore.ts
import { defineStore } from 'pinia'

type SandboxItem = {
  icon: string
  label: string
  id?: string | number
  [key: string]: any
}

export const useSandboxStore = defineStore('sandboxStore', () => {
  const theme = ref<'default' | 'cosmic' | 'garden' | 'arcade'>('default')

  // Data categories
  const environment = ref<SandboxItem[]>([])
  const contextTools = ref<SandboxItem[]>([
    { icon: 'kind-icon:wand', label: 'Animate' },
    { icon: 'kind-icon:bolt', label: 'Zap' },
    { icon: 'kind-icon:gear', label: 'Configure' }
  ])
  const persistables = ref<SandboxItem[]>([
    { icon: 'kind-icon:tree', label: 'Tree' },
    { icon: 'kind-icon:house', label: 'House' },
    { icon: 'kind-icon:flame', label: 'Fire' }
  ])

  // Core actions
  function saveScene() {
    const state = {
      theme: theme.value,
      environment: environment.value,
      contextTools: contextTools.value,
      persistables: persistables.value
    }
    localStorage.setItem('sandboxScene', JSON.stringify(state))
  }

  function loadScene() {
    const raw = localStorage.getItem('sandboxScene')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      theme.value = data.theme || 'default'
      environment.value = data.environment || []
      contextTools.value = data.contextTools || []
      persistables.value = data.persistables || []
    } catch (err) {
      console.warn('Failed to load sandboxScene from localStorage:', err)
    }
  }

  function resetScene() {
    environment.value = []
    contextTools.value = []
    persistables.value = []
  }

  function toggleItem(list: Ref<SandboxItem[]>, item: SandboxItem) {
    const index = list.value.findIndex(i => i.label === item.label)
    if (index >= 0) list.value.splice(index, 1)
    else list.value.push(item)
  }

  return {
    theme,
    environment,
    contextTools,
    persistables,
    saveScene,
    loadScene,
    resetScene,
    toggleItem
  }
})
