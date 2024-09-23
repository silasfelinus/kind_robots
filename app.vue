<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isKindLoaderInitialized" @page-ready="handlePageReady" />

    <!-- Main content is displayed only when the page is ready -->
    <div v-if="isPageReady">
      <!-- Header -->
      <header
        class="w-full bg-base-200 flex justify-between items-center transition-all duration-500 ease-in-out sticky top-0 z-30"
        :style="{ height: `${displayStore.headerVh}vh` }"
      >
        <!-- Sidebar Toggle -->
        <div class="absolute top-4 left-4 p-1 z-40 text-white">
          <sidebar-toggle
            class="text-4xl"
            @click="displayStore.toggleSidebar('sidebarLeft')"
          />
        </div>

        <nav-links />

<!-- Next Button -->
              <button
                v-if="showTutorial"
                class="absolute top-4 right-4 bg-info text-base-200 py-2 px-4 rounded-lg shadow-md hover:bg-info-focus transition duration-300 flex items-center z-50"
                @click="handlePageTransition"
              >
                Launch
              </button>

              <!-- Back Button -->
              <button
                v-if="!showTutorial"
                class="absolute top-4 right-4 bg-secondary text-base-200 py-2 px-4 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 flex items-center z-50"
                @click="handlePageReturn"
              >
                <div class="triangle-left"></div>
                <span>Instructions</span>
              </button>
            </div>
      </header>

      <!-- Main Layout with strong margin and padding -->
      <div class="flex-1 w-full flex p-4 md:p-8 lg:p-12  box-border">
        <kind-sidebar-simple />
        <main class="flex-grow overflow-y-auto relative">
          <div class="flex justify-center items-center">
            <div
              class="w-full max-w-4xl rounded-2xl bg-base-200 relative flip-card shadow-lg p-4 lg:p-8"
              style="box-sizing: border-box;"
            >
              <div
                class="flip-card-inner"
                :class="{ 'is-flipped': !showTutorial }"
              >
                <!-- Conditional rendering of tutorial or page content -->
                <div v-if="showTutorial" key="tutorial" class="flip-card-front rounded-2xl mx-10">
                  <SplashTutorial @page-transition="handlePageTransition" />
                </div>
                <div v-else key="content" class="flip-card-back rounded-2xl mx-10">
                  <NuxtPage />
                </div>
              </div>

              
          </div>
        </main>
      </div>

      <!-- Footer (Stick to Bottom) -->
      <footer
        v-if="displayStore.footer !== 'hidden'"
        :style="{ height: `${displayStore.footerVh}vh` }"
        class="w-full bg-gray-800 text-accent mt-auto flex-none p-4"
      >
        created by Silas Knight silas@kindrobots.org
      </footer>
    </div>
  </div>
</template>
