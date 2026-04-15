// /stores/debugStore.ts
import { defineStore } from 'pinia'
import { reactive } from 'vue'

type Region = 'header' | 'left' | 'right' | 'footer'
type LayoutPreset = 'mobile' | 'tablet' | 'desktop' | 'all'

export const useDebugStore = defineStore('debugStore', () => {
  const state = reactive({
    enabled: true,

    showHeader: true,
    showLeft: true,
    showRight: false,
    showFooter: true,

    fillerHeader: true,
    fillerLeft: true,
    fillerMain: true,
    fillerRight: true,
    fillerFooter: true,
  })

  function toggle(region: Region) {
    if (region === 'header') state.showHeader = !state.showHeader
    if (region === 'left') state.showLeft = !state.showLeft
    if (region === 'right') state.showRight = !state.showRight
    if (region === 'footer') state.showFooter = !state.showFooter
  }

  function toggleFiller(region: Region | 'main') {
    if (region === 'header') state.fillerHeader = !state.fillerHeader
    if (region === 'left') state.fillerLeft = !state.fillerLeft
    if (region === 'main') state.fillerMain = !state.fillerMain
    if (region === 'right') state.fillerRight = !state.fillerRight
    if (region === 'footer') state.fillerFooter = !state.fillerFooter
  }

  function setPreset(preset: LayoutPreset) {
    if (preset === 'mobile') {
      state.showHeader = true
      state.showLeft = false
      state.showRight = false
      state.showFooter = true
    }

    if (preset === 'tablet') {
      state.showHeader = true
      state.showLeft = true
      state.showRight = false
      state.showFooter = true
    }

    if (preset === 'desktop') {
      state.showHeader = true
      state.showLeft = true
      state.showRight = true
      state.showFooter = true
    }

    if (preset === 'all') {
      state.showHeader = true
      state.showLeft = true
      state.showRight = true
      state.showFooter = true
    }
  }

  function reset() {
    state.showHeader = true
    state.showLeft = true
    state.showRight = false
    state.showFooter = true

    state.fillerHeader = true
    state.fillerLeft = true
    state.fillerMain = true
    state.fillerRight = true
    state.fillerFooter = true
  }

  function disable() {
    state.enabled = false
  }

  function enable() {
    state.enabled = true
  }

  return {
    ...state,
    toggle,
    toggleFiller,
    setPreset,
    reset,
    disable,
    enable,
  }
})