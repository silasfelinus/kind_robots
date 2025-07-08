// /stores/sandboxStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type SandboxItem = {
  icon: string
  label: string
  id?: string | number
  [key: string]: any
}

export const useSandboxStore = defineStore('sandboxStore', () => {
  const environment = ref<SandboxItem[]>([])

  function toggleEnvironment(item: SandboxItem) {
    const index = environment.value.findIndex((i) => i.label === item.label)
    if (index >= 0) environment.value.splice(index, 1)
    else environment.value.push(item)
  }

  function isEnvironmentSelected(label: string) {
    return environment.value.some((i) => i.label === label)
  }

  return {
    environment,
    toggleEnvironment,
    isEnvironmentSelected,
  }
})
