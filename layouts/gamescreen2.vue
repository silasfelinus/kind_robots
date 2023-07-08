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
        <div class="container mx-auto flex items-center justify-between">
          <site-title />
          <div class="flex items-center justify-end">
            <ThemeManager />
          </div>
        </div>
        <slot name="title" />
      </header>

      <!-- Button Cards -->
      <div class="flex flex-col gap-4 bg-primary rounded-lg p-4">
        <button-card label="Button 1" description="Button 1 description" :color-id="1" />
        <button-card label="Button 2" description="Button 2 description" :color-id="2" />
        <button-card label="Button 3" description="Button 3 description" :color-id="3" />
        <button-card label="Button 4" description="Button 4 description" :color-id="4" />
      </div>

      <!-- Right Panel -->
      <!-- (You may want to add content here) -->

      <!-- Footer -->
      <footer class="flex justify-end px-6 py-4 bg-primary rounded-br-3xl">
        <AmiLink />
      </footer>
    </main>
  </div>
</template>
