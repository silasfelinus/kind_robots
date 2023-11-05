// ~/stores/screenStore.ts
import { defineStore } from 'pinia';

export const LayoutType = {
  BADGE: 'badge',
  CARD: 'card',
  HERO: 'hero',
  FULL: 'full',
  CAROUSEL: 'carousel',
} as const;

export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType];

export enum ScreenType {
  MOBILE,
  TABLET,
  DESKTOP,
}
const layoutOrder: LayoutType[] = ['badge', 'card', 'hero', 'full', 'carousel'];

export const useScreenStore = defineStore({
  id: 'screen',
  state: () => ({
    activeSection: 'home',
    showModelCarousel: false,
    showAmiSwarm: false,
    showRainEffect: false,
    showSoapBubbles: false,
    currentLayout: 'badge',
    currentScreenType: ScreenType.MOBILE,
  }),
  getters: {
    anyEffectActive(): boolean {
      return this.showAmiSwarm || this.showRainEffect || this.showSoapBubbles;
    },
  },
  actions: {
    setActiveSection(section: string) {
      this.activeSection = section;
    },

    toggleModelCarousel() {
      this.showModelCarousel = !this.showModelCarousel;
    },
    // Set screen type
    setScreenType(screenType: ScreenType) {
      this.currentScreenType = screenType;
    },
    toggleAmiSwarm() {
      this.showAmiSwarm = !this.showAmiSwarm;
    },
    toggleRainEffect() {
      this.showRainEffect = !this.showRainEffect;
    },
    toggleSoapBubbles() {
      this.showSoapBubbles = !this.showSoapBubbles;
    },
    disableAllEffects() {
      this.showAmiSwarm = false;
      this.showRainEffect = false;
      this.showSoapBubbles = false;
    },
    loadStore() {
      try {
        return 'loaded screen';
      } catch (error) {
        console.error('Error loading store:', error);
        throw error;
      }
    },

    // Set a specific layout
    setLayout(layout: LayoutType) {
      this.currentLayout = layout;
    },

    // Step up layout
    stepUpLayout() {
      const currentIndex = layoutOrder.indexOf(this.currentLayout as LayoutType);
      if (currentIndex < layoutOrder.length - 1) {
        this.currentLayout = layoutOrder[currentIndex + 1];
      }
    },

    // Step down layout
    stepDownLayout() {
      const currentIndex = layoutOrder.indexOf(this.currentLayout as LayoutType);
      if (currentIndex > 0) {
        this.currentLayout = layoutOrder[currentIndex - 1];
      }
    },
  },
});
