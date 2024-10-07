<template>
  <div class="relative h-full flex flex-col">
    <!-- Left Sidebar Toggle -->
    <div
      class="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-secondary text-white rounded-r-lg cursor-pointer"
      @click="toggleLeftSidebar"
    >
      <span v-if="displayStore.sidebarLeftState === 'open'"> &#8249; </span>
      <span v-if="displayStore.sidebarLeftState === 'compact'"> &#8810; </span>
      <span v-if="displayStore.sidebarLeftState === 'hidden'"> &#8250; </span>
    </div>

    <!-- Right Sidebar Toggle (Mobile: Also toggles tutorial) -->
    <div
      class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-secondary text-white rounded-l-lg cursor-pointer"
      @click="isMobile ? toggleTutorial() : toggleRightSidebar()"
    >
      <span v-if="displayStore.sidebarRightState === 'open' && !isMobile">
        &#8250;
      </span>
      <span v-if="displayStore.sidebarRightState === 'hidden' && !isMobile">
        &#8249;
      </span>
      <span v-if="isMobile"> &#x1F4D6; <!-- Tutorial icon for mobile --> </span>
    </div>

    <!-- Mobile View (no flip card) -->
    <div v-if="isMobile" class="flex-grow overflow-y-auto">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl"
      />
      <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
    </div>

    <!-- Fullscreen mode (Desktop) -->
    <div
      v-else-if="isFullScreen"
      class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow"
    >
      <NuxtPage class="h-full w-full" />
    </div>

    <!-- Flip-card mode (Desktop) -->
    <div
      v-else
      class="flip-card-inner h-full z-10 flex-grow"
      :class="{ 'is-flipped': !showTutorial }"
    >
      <div class="flip-card-front rounded-2xl h-full w-full">
        <SplashTutorial class="h-full w-full" />
      </div>
      <div class="flip-card-back rounded-2xl overflow-y-auto h-full w-full">
        <NuxtPage class="h-full w-full" />
      </div>
    </div>
  </div>
</template>
