import { defineStore } from 'pinia'

// Use as const to ensure the type is preserved as tuple of literal types
export const allowedLayouts = ['default', 'alternative'] as const;
export type LayoutKey = typeof allowedLayouts[number];

// Function to get the layout from local storage and validate it
const getStoredLayout = (key: string, defaultValue: LayoutKey): LayoutKey => {
  if (import.meta.client) {
    const storedValue = localStorage.getItem(key);
    // Ensure that the value is either a valid layout key or the default value
    return allowedLayouts.includes(storedValue as LayoutKey) ? storedValue as LayoutKey : defaultValue;
  }
  return defaultValue;
}

interface LayoutState {
  currentLayout: LayoutKey
}

export const useLayoutStore = defineStore({
  id: 'layoutStore',
  state: (): LayoutState => ({
    currentLayout: getStoredLayout('currentLayout', 'default'),
  }),

  actions: {
    setLayout(newLayout: LayoutKey) {
      if (allowedLayouts.includes(newLayout)) {
        this.currentLayout = newLayout;
        if (import.meta.client) {
          localStorage.setItem('currentLayout', newLayout);
        }
      } else {
        console.warn(`Invalid layout option: ${newLayout}`);
      }
    }
  },
});
