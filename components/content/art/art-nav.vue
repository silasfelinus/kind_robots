// /components/content/art/art-nav.vue
<template>
  <div
    class="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-6 w-full max-w-4xl mx-auto"
  >
    <NavCard
      title="Add Art"
      icon="kind-icon:plus"
      to="/addart"
      description="Upload your own image or generate art using our tools."
    />

    <NavCard
      title="Gallery"
      icon="kind-icon:gallery"
      to="/artgallery"
      description="Browse your past artwork and saved creations."
    />

    <NavCard
      title="Edit Art"
      icon="kind-icon:sparkles"
      to="/editor"
      description="Choose an image and transform it with text or presets."
    />
  </div>
</template>
