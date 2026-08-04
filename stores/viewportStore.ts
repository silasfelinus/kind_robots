// /stores/viewportStore.ts
import { defineStore } from 'pinia'
import { reactive, ref, toRefs } from 'vue'
import { handleError } from './utils'

export type ViewportSize = 'small' | 'medium' | 'large' | 'extraLarge'

function setCustomVh() {
  if (typeof window === 'undefined') return
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

export const useViewportStore = defineStore('viewportStore', () => {
  const state = reactive({
    viewportSize: 'large' as ViewportSize,
    isTouchDevice: false,
    isMobileViewport: true,
    isInitialized: false,
  })

  const viewportFrame = ref<number | null>(null)

  function applyViewportSize() {
    if (typeof window === 'undefined') return

    try {
      setCustomVh()

      state.isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0

      const width = window.innerWidth

      if (width < 768) {
        state.viewportSize = 'small'
        state.isMobileViewport = true
        return
      }

      if (width < 1024) {
        state.viewportSize = 'medium'
        state.isMobileViewport = false
        return
      }

      if (width < 1440) {
        state.viewportSize = 'large'
        state.isMobileViewport = false
        return
      }

      state.viewportSize = 'extraLarge'
      state.isMobileViewport = false
    } catch (error) {
      handleError(error, 'Viewport update failed.')
    }
  }

  function updateViewport() {
    if (typeof window === 'undefined') return

    if (viewportFrame.value !== null) {
      cancelAnimationFrame(viewportFrame.value)
    }

    viewportFrame.value = requestAnimationFrame(() => {
      applyViewportSize()
      viewportFrame.value = null
    })
  }

  function initialize() {
    if (typeof window === 'undefined' || state.isInitialized) return

    state.isInitialized = true

    try {
      applyViewportSize()

      window.addEventListener('resize', updateViewport, { passive: true })
      window.addEventListener('orientationchange', updateViewport, {
        passive: true,
      })
      window.visualViewport?.addEventListener('resize', updateViewport, {
        passive: true,
      })
    } catch (error) {
      state.isInitialized = false
      handleError(error, 'Viewport store initialization failed.')
    }
  }

  return {
    ...toRefs(state),
    initialize,
  }
})
