<template>
  <div>
    <div ref="flipContainer" class="flex-grow flip-container w-full">
      <div class="flip-front sidebar-content w-full">
        <img alt="Kind Robots Logo" src="/images/fulltitle.png" class="mx-auto rounded-l" />
        <home-nav />
        <theme-selector />
      </div>
    </div>
    <!-- Main Content -->
    <main
      class="w-full h-full flex bg-primary shadow-inner rounded-l-xl p-4 justify-center items-center"
    >
      <slot />
    </main>
  </div>
</template>
