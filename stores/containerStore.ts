// src/stores/containerStore.ts
import { defineStore } from 'pinia';

export const useContainerStore = defineStore({
  id: 'container',
  state: () => ({
    bgColor: 'bg-base-200',
    margin: 'm-6',
    padding: 'p-8',
    borderRadius: 'rounded-xl',
    border: 'border-2',
    shadow: 'shadow-md',
    transition: 'transition-transform',
    backdrop: 'backdrop-blur-md',
    outerBgColor: 'bg-base-200',
  }),
  getters: {
    containerColors() {
      return ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-base-200', 'bg-info', 'bg-base-200'];
    },
    containerMargins() {
      return ['m-0', 'm-2', 'm-4', 'm-6', 'm-8'];
    },
    containerPaddings() {
      return ['p-0', 'p-2', 'p-4', 'p-6', 'p-8'];
    },
    containerBorderRadius() {
      return ['rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl'];
    },
    containerBorders() {
      return ['border-0', 'border-2', 'border-4', 'border-8'];
    },
    containerShadows() {
      return ['shadow-none', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl'];
    },
    containerTransitions() {
      return ['transition-transform', 'transition-shadow', 'transition-all'];
    },
    containerBackdrops() {
      return ['backdrop-blur-none', 'backdrop-blur-md', 'backdrop-blur-lg'];
    },
  },
});
