<template>
  <div
    class="art-lab-container flex flex-col z-10"
    :style="{ height: displayStore.mainHeight }"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading -->
    <transition name="flip">
      <div v-if="!isLoading" class="flex flex-col h-full">
        <!-- Art Section Buttons (Fixed at the top) -->
        <div class="flex justify-center space-x-4 mb-4">
          <button
            class="btn btn-primary"
            @click="selectArtSection('art-maker')"
          >
            Art Maker
          </button>

          <button
            class="btn btn-secondary"
            @click="selectArtSection('art-collection')"
          >
            Art Collection
          </button>

          <button
            class="btn btn-accent"
            @click="selectArtSection('art-gallery')"
          >
            Art Gallery
          </button>
        </div>

        <!-- Art Sections -->
        <div class="art-sections flex-grow overflow-y-auto">
          <!-- Art Maker Screen -->
          <lazy-art-maker
            v-show="selectedArtSection === 'art-maker'"
            @close="handleSectionClose"
          ></lazy-art-maker>

          <!-- Art Collection Screen -->
          <lazy-art-collection
            v-show="selectedArtSection === 'art-collection'"
            @close="handleSectionClose"
          ></lazy-art-collection>

          <!-- Art Gallery Screen -->
          <lazy-art-gallery
            v-show="selectedArtSection === 'art-gallery'"
            @close="handleSectionClose"
          ></lazy-art-gallery>
        </div>
      </div>
    </transition>

    <!-- Debug Message -->
    <div v-if="debugMessage" class="text-blue-500 mt-4">
      {{ debugMessage }}
    </div>
  </div>
</template>

<style scoped>
.art-lab-container {
  width: 100%;
  overflow: hidden;
}

.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

.art-sections {
  height: 100%; /* Ensures it respects the parent's height */
  overflow-y: auto; /* Allow scrolling inside */
  padding: 1rem;
}

@media (max-width: 600px) {
  .art-sections {
    padding: 0.5rem;
  }
}
</style>
