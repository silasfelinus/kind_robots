// ~/stores/themeStore.ts
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('themeStore', {
  state: () => ({
    currentTheme: 'retro', // default theme
    botOverride: true, // new botOverride state
    firstThemeChanged: false,
    themes: [
      'light',
      'dark',
      'cupcake',
      'bumblebee',
      'emerald',
      'corporate',
      'synthwave',
      'retro',
      'cyberpunk',
      'valentine',
      'halloween',
      'garden',
      'forest',
      'aqua',
      'lofi',
      'pastel',
      'fantasy',
      'wireframe',
      'black',
      'luxury',
      'dracula',
      'cmyk',
      'autumn',
      'business',
      'acid',
      'lemonade',
      'night',
      'coffee',
      'winter',
    ],

    open: false,
  }),
  actions: {
    toggleMenu() {
      this.open = !this.open
    },
    changeTheme(theme: string) {
      if (!this.themes.includes(theme)) {
        console.error(
          `Invalid theme: "${theme}". Please provide a valid theme.`,
        )
        return
      }
      this.open = false
      this.currentTheme = theme
      if (!this.firstThemeChanged) {
        this.firstThemeChanged = true
      }
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    },
    initTheme() {
      if (
        typeof window === 'undefined' ||
        typeof localStorage === 'undefined'
      ) {
        // We're on the server, or localStorage is not available
        return
      }

      const savedTheme = localStorage.getItem('theme')
      const defaultTheme = savedTheme || 'retro'
      if (!this.themes.includes(defaultTheme)) {
        console.error(
          `Invalid theme: "${defaultTheme}" in local storage. Falling back to default theme.`,
        )
        this.changeTheme('retro')
        return
      }
      this.changeTheme(defaultTheme)
    },

    setBotOverride(value: boolean) {
      this.botOverride = value
    },
    updateBotTheme(botTheme: string) {
      if (this.botOverride) {
        this.changeTheme(botTheme)
      }
    },
    async initialize() {
      try {
        await this.initTheme()
        return `Loaded ${this.themes.length} themes`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    },
  },
})
