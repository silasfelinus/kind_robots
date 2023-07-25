<template>
  <div class="container mx-auto px-4">
    <div class="flex flex-col min-h-screen justify-between">
      <div>
        <nuxt-link to="/welcome">
          <img src="/images/kindtitle.webp" class="mx-auto rounded" alt="Title" />
        </nuxt-link>
      </div>
      <nuxt-page />
    </div>
    <loading-bar />
  </div>
</template>
