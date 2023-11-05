import { defineStore } from 'pinia';
import { type Gallery } from '@prisma/client';

interface GalleryState {
  galleries: Gallery[];
  currentGallery: Gallery | null;
  currentImage: string;
}

interface GalleryStore extends GalleryState {
  // Getters
  currentGalleryContent: () => string | null;
  currentGalleryDescription: () => string | null;
  currentGalleryMediaId: () => string | null;
  currentGalleryURL: () => string | null;
  currentGalleryIsMature: () => boolean;
  currentGalleryCustodian: () => string | null;
  currentGalleryUserId: () => number | null;
  currentGalleryHighlightImage: () => string | null;
  allGalleryNames: () => string[];
  randomImage: () => string | null;
  randomGallery: () => string | null;
  imagePathsByGalleryName: (galleryName: string) => string[];

  // Actions
  fetchGalleries: () => Promise<void>;
  setGalleryByName: (name: string) => void;
}

export const useGalleryStore = defineStore({
  id: 'gallery',

  state: (): GalleryState => ({
    galleries: JSON.parse(localStorage.getItem('galleries') || '[]'),
    currentGallery: JSON.parse(localStorage.getItem('currentGallery') || 'null'),
    currentImage: localStorage.getItem('currentImage') || '',
  }),

  getters: {
    currentGalleryContent(state: GalleryState): string | null {
      return state.currentGallery?.content || null;
    },

    currentGalleryDescription(): string | null {
      return this.currentGallery?.description || null;
    },

    currentGalleryMediaId(): string | null {
      return this.currentGallery?.mediaId || null;
    },

    currentGalleryURL(): string | null {
      return this.currentGallery?.url || null;
    },

    currentGalleryIsMature(): boolean {
      return this.currentGallery?.isMature || false;
    },

    currentGalleryCustodian(): string | null {
      return this.currentGallery?.custodian || null;
    },

    currentGalleryUserId(): number | null {
      return this.currentGallery?.userId || null;
    },

    currentGalleryHighlightImage(): string | null {
      return this.currentGallery?.highlightImage || null;
    },

    allGalleryNames(): string[] {
      return this.galleries.map((gallery) => gallery.name);
    },

    randomImage(): string | null {
      if (this.currentGallery && this.currentGallery.imagePaths) {
        const images = this.currentGallery.imagePaths.split(',');
        const randomIndex = Math.floor(Math.random() * images.length);
        return `/images/${this.currentGallery.name}/${images[randomIndex]}`;
      }
      return null;
    },

    randomGallery(state: GalleryState): Gallery | null {
      const otherGalleries = state.galleries.filter((g) => g.name !== state.currentGallery?.name);
      return otherGalleries[Math.floor(Math.random() * otherGalleries.length)] || null;
    },

    imagePathsByGalleryName(state: GalleryState): (galleryName: string) => string[] {
      return (galleryName: string) => {
        const gallery = state.galleries.find((g) => g.name === galleryName);
        return gallery && gallery.imagePaths ? gallery.imagePaths.split(',') : [];
      };
    },
  },

  actions: {
    async fetchGalleries(this: GalleryStore) {
      const response = await fetch('/api/galleries');
      if (response.ok) {
        this.galleries = await response.json();
        localStorage.setItem('galleries', JSON.stringify(this.galleries));
      }
    },

    setGalleryByName(this: GalleryStore, name: string) {
      const selectedGallery = this.galleries.find((gallery: Gallery) => gallery.name === name);
      if (selectedGallery) {
        this.currentGallery = selectedGallery;
        this.currentImage = selectedGallery.imagePaths?.split(',')[0] || '';
        localStorage.setItem('currentGallery', JSON.stringify(this.currentGallery));
        localStorage.setItem('currentImage', this.currentImage);
      }
    },

    changeToRandomImage(this: GalleryStore) {
      if (this.currentGallery && this.currentGallery.imagePaths) {
        const images = this.currentGallery.imagePaths.split(',');
        let newImage = this.currentImage;

        while (newImage === this.currentImage && images.length > 1) {
          const randomIndex = Math.floor(Math.random() * images.length);
          newImage = `/images/${this.currentGallery.name}/${images[randomIndex]}`;
        }

        this.currentImage = newImage;
      }
    },

    setRandomGallery(this: GalleryStore) {
      const randomGallery = this.randomGallery;
      if (randomGallery) {
        this.setGalleryByName(randomGallery.name);
      }
    },
  },
});

export type { Gallery };
