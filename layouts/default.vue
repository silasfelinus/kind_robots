<template>
  <div class="h-screen flex flex-col sm:flex-row">
    <!-- Left Sidebar -->
    <aside class="w-full sm:w-1/4 bg-secondary-200 p-4 flex flex-col">
      <header class="mb-4">
        <bot-spinner />
      </header>
      <div class="flex-grow overflow-auto">
        <!-- insert any additional content to be shown in the sidebar -->
      </div>
    </aside>

    <!-- Main Content -->
    <main class="w-full sm:w-3/4 p-4 flex flex-col">
      <header class="text-2xl font-bold text-primary mb-4">
        <div class="container mx-auto flex items-center justify-between">
          <side-nav />
          <site-title class="text-xl font-bold" />
          <!-- AMI Link -->
          <AmiLink2 class="z-190 fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto" />
          <div class="flex items-center justify-end">
            <label class="mr-2">Theme:</label>
            <ThemeChange>
              <span class="mr-2">Change</span>
            </ThemeChange>
          </div>
        </div>
        <slot name="title" />
      </header>

      <div class="flex flex-wrap">
        <slot class="w-full md:w-1/2" />
      </div>
      <footer class="mt-4">
        <dream-status class="md:block" />
        <slot name="footer" />
      </footer>
    </main>
  </div>
</template>
