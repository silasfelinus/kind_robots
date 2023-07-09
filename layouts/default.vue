<template>
  <div class="h-screen flex flex-col sm:flex-row">
    <!-- Left Sidebar -->
    <aside class="w-full sm:w-1/4 bg-secondary-200 p-4 flex flex-col">
      <header class="mb-4">
        <bot-spinner />
      </header>
      <div class="flex-grow overflow-auto"></div>
    </aside>

    <!-- Main Content -->
    <main class="w-full sm:w-3/4 p-4 flex flex-col">
      <header class="text-2xl font-bold text-primary mb-4">
        <slot name="title" />
      </header>

      <div class="flex flex-wrap">
        <slot class="w-full md:w-1/2" />
      </div>
      <footer class="mt-4">
        <slot name="footer" />
      </footer>
    </main>
  </div>
</template>
