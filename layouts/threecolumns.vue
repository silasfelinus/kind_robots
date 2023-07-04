<template>
  <div class="h-screen flex flex-col sm:flex-row">
    <!-- Right Sidebar -->
    <aside class="w-full sm:w-1/4 bg-primary-200 p-4 overflow-auto">
      <image-nav />
    </aside>
    <!-- Left Sidebar -->
    <aside class="w-full sm:w-1/4 bg-primary-200 p-4 overflow-auto">
      <bot-gallery />
    </aside>
    <aside class="w-full sm:w-1/4 bg-primary-200 p-4 overflow-auto">
      <bot-card />
    </aside>

    <!-- Center Content -->
    <main class="w-full sm:w-2/4 p-4 flex flex-col overflow-auto">
      <header class="text-2xl font-bold text-primary mb-4">
        <div class="container mx-auto flex items-center justify-between">
          <site-title class="text-xl font-bold" />
          <!-- AMI Link -->
          <AmiLink2 class="z-190 fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto" />
          <div class="flex items-center justify-end">
            <ThemeChange>
              <span class="mr-2">Change Theme</span>
            </ThemeChange>
          </div>
        </div>
        <slot name="title" />
      </header>
      <section class="flex-grow">
        <slot />
      </section>
      <footer class="mt-4">
        <dream-status class="md:block" />
        <slot name="footer" />
      </footer>
    </main>
  </div>
</template>
