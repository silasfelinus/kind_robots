// /stores/maturityPreferenceStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'showDashboardMaturityToggle'

export const useMaturityPreferenceStore = defineStore(
  'maturityPreferenceStore',
  () => {
    const showDashboardMaturityToggle = ref(false)
    const initialized = ref(false)

    function initialize(): void {
      if (typeof window === 'undefined' || initialized.value) return

      showDashboardMaturityToggle.value =
        window.localStorage.getItem(STORAGE_KEY) === 'true'
      initialized.value = true
    }

    function setShowDashboardMaturityToggle(value: boolean): void {
      showDashboardMaturityToggle.value = value
      initialized.value = true

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, value.toString())
      }
    }

    return {
      showDashboardMaturityToggle,
      initialized,
      initialize,
      setShowDashboardMaturityToggle,
    }
  },
)
