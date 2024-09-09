// ~/stores/cardStore.ts
import { defineStore } from 'pinia'
import { useContentStore } from './contentStore'

// Define a type for grid settings
interface GridSettings {
  columns: number
  columnBreakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  newColumnPositions: number[]
}

// Define a type for the store
interface CardState {
  cardOrder: string[]
  gridSettings: GridSettings
  deletedPages: Set<string> // Use a set to manage deleted pages
}

// Default grid settings
const defaultGridSettings: GridSettings = {
  columns: 3,
  columnBreakpoints: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  newColumnPositions: [],
}

// Get stored grid state
const getStoredGridState = (
  key: string,
  defaultValue: CardState,
): CardState => {
  if (import.meta.client) {
    const storedValue = localStorage.getItem(key)
    try {
      const parsedValue = JSON.parse(storedValue || '{}')
      return parsedValue.cardOrder && parsedValue.gridSettings
        ? parsedValue
        : defaultValue
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

export const useCardStore = defineStore({
  id: 'cardStore',
  state: (): CardState => {
    const contentStore = useContentStore()
    const highlightPages = contentStore
      .pagesByTagAndSort('home', 'highlight')
      .map((page: Page) => page._id ?? '')

    return {
      cardOrder: getStoredGridState('gridState', {
        cardOrder: highlightPages, // Initialize with highlight pages
        gridSettings: defaultGridSettings,
        deletedPages: new Set(),
      }).cardOrder,
      gridSettings: getStoredGridState('gridState', {
        cardOrder: highlightPages,
        gridSettings: defaultGridSettings,
        deletedPages: new Set(),
      }).gridSettings,
      deletedPages: new Set(
        getStoredGridState('gridState', {
          cardOrder: highlightPages,
          gridSettings: defaultGridSettings,
          deletedPages: new Set(),
        }).deletedPages,
      ),
    }
  },

  actions: {
    setGridState(
      cardOrder: string[],
      gridSettings: GridSettings,
      deletedPages: Set<string>,
    ) {
      this.cardOrder = cardOrder
      this.gridSettings = gridSettings
      this.deletedPages = deletedPages
      if (import.meta.client) {
        localStorage.setItem(
          'gridState',
          JSON.stringify({
            cardOrder,
            gridSettings,
            deletedPages: Array.from(deletedPages),
          }),
        )
      }
    },

    addCard(cardId: string) {
      if (!this.cardOrder.includes(cardId)) {
        this.cardOrder.push(cardId)
        this.setGridState(this.cardOrder, this.gridSettings, this.deletedPages)
      }
    },

    removeCard(cardId: string) {
      this.cardOrder = this.cardOrder.filter((id) => id !== cardId)
      this.deletedPages.add(cardId)
      this.setGridState(this.cardOrder, this.gridSettings, this.deletedPages)
    },

    restoreCard(cardId: string) {
      if (this.deletedPages.has(cardId)) {
        this.deletedPages.delete(cardId)
        this.cardOrder.push(cardId)
        this.setGridState(this.cardOrder, this.gridSettings, this.deletedPages)
      }
    },

    setGridSettings(newSettings: GridSettings) {
      this.gridSettings = newSettings
      this.setGridState(this.cardOrder, this.gridSettings, this.deletedPages)
    },
  },
})
