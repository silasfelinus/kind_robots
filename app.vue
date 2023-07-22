<template>
  <div class="flex flex-col h-screen bg-white text-gray-600">
    <!-- Header -->
    <header
      class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md px-2 py-1 sm:px-6 lg:px-8"
    >
      <div
        class="container mx-auto flex items-center justify-between sm:justify-around lg:justify-between"
      >
        <bot-selector class="hidden sm:flex" />
        <theme-manager class="hidden sm:flex" />
        <button id="menuBtn" class="md:hidden lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
        <nav id="sideNav" class="md:flex">
          <butterfly-toggle />
        </nav>
      </div>
    </header>
    <!-- Display loading bar when a page is loading -->
    <NuxtLoadingBar />

    <div class="flex flex-col flex-grow overflow-hidden">
      <!-- Center page (main content) -->
      <main class="flex-grow p-2 sm:p-4 overflow-auto">
        <site-title class="text-lg sm:text-xl font-bold" />
        <NuxtPage />
        <side-nav />
      </main>
    </div>

    <!-- Collapsible footer -->
    <footer class="p-2 sm:p-4 border-t flex-shrink-0">
      <dream-status />
    </footer>
  </div>
</template>

<script>
export default {
  mounted() {
    document.getElementById('menuBtn').addEventListener('click', this.toggleMenu)
  },
  beforeUnmount() {
    document.getElementById('menuBtn').removeEventListener('click', this.toggleMenu)
  },
  methods: {
    toggleMenu() {
      const sideNav = document.getElementById('sideNav')
      sideNav.classList.toggle('hidden')
    }
  }
}
</script>
