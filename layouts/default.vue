<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800 space-y-4 md:space-y-0 md:space-x-4">
    <!-- Sidebar -->
    <div
      class="md:w-1/5 h-full flex flex-col overflow-y-auto shadow-lg bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 rounded-r-xl p-4 space-y-4"
    >
      <div class="mb-4">
        <img
          src="/images/fulltitle.png"
          class="mx-auto w-full h-auto shadow-lg hover:shadow-2xl transition-shadow duration-500 rounded-xl"
          alt="Title"
        />
        <home-nav></home-nav>
        <theme-selector />
      </div>
      <h1 class="mt-8 text-3xl font-semibold text-center">Welcome to Kind Robots</h1>
      <p class="mt-2 text-xl text-dark text-center">Please Select your Bot:</p>
      <bot-selector />
      <div class="mt-24 mx-auto max-w-4xl">
        <bot-carousel />
      </div>
    </div>

    <!-- Main Content -->
    <main
      class="md:w-3/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative p-4 space-y-4"
    >
      <transition name="fade" mode="out-in">
        <div>
          <slot />
        </div>
      </transition>
    </main>
  </div>
</template>

<style>
/* Fade animation for layout transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Flip animation for the title image and bot-carousel transition */
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(90deg);
}
</style>
