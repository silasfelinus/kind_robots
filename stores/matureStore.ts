// @/stores/matureStore.ts
import { defineStore } from 'pinia';

export const useMatureStore = defineStore('matureStore', {
  state: () => ({
    showMature: false, // Initialize with a default value
  }),

  actions: {
    toggleMature() {
      this.showMature = !this.showMature;
      localStorage.setItem('showMature', JSON.stringify(this.showMature));
    },

    initialize() {
      const storedValue = localStorage.getItem('showMature');
      if (storedValue !== null) {
        this.showMature = JSON.parse(storedValue);
      }
    },
  },
});

export default useMatureStore;
