<template>
  <div class="p-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    <!-- Display Folders via Store -->
    <section>
      <h2 class="text-2xl font-bold mb-4">Folders from API</h2>
      <PhotoprismFolders />
    </section>

    <!-- Display Folders via Store -->
    <section>
      <h2 class="text-2xl font-bold mb-4">Folders from Store</h2>
      <PhotoStore />
    </section>

    <!-- Display Photo Gallery Component -->
    <section>
      <h2 class="text-2xl font-bold mb-4">Photo Gallery</h2>
      <PhotoGallery />
    </section>

    <!-- Image Upload Component -->
    <section>
      <h2 class="text-2xl font-bold mb-4">Image Upload</h2>
      <ImageUpload />
    </section>

        <!-- Image Upload Component -->
        <section>
      <h2 class="text-2xl font-bold mb-4">API Folders</h2>
      <ApiFolders />
    </section>
  </div>
</template>

<style scoped>
/* Responsive grid layout handled by Tailwind */
</style>
