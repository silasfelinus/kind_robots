<template>
  <div class="flex flex-col bg-base-200">
    <!-- Navbar -->
    <nav class="flex flex-wrap justify-between items-center p-4 text-default">
      <div class="logo text-2xl font-bold md:inline-block hidden">KindRobots</div>
      <div class="logo text-xl font-bold md:hidden">Kind Robots</div>
      <new-dashboard class="flex flex-row bg-base-200 border rounded-2xl m-1 w-full md:w-auto" />
    </nav>

    <slot class="w-full h-full flex bg-base-200 rounded-2xl p-1 m-1" />

    <!-- Footer -->
    <footer class="p-4 bg-base-200 text-default text-center">
      <room-title />
      <page-info />
      <random-link />

      <footer-toggle />
      KindRobots © 2023
    </footer>
  </div>
</template>
