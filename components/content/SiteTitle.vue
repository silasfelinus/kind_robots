<template>
  <header class="flex items-center justify-between bg-secondary-200 text-accent px-6 py-4">
    <div class="flex items-center space-x-4">
      <nuxt-link to="/">
        <img class="w-32 h-32" src="/images/kindtitle.webp" alt="Logo" />
      </nuxt-link>
    </div>
    <div class="space-x-4">
      <side-nav />
    </div>
  </header>
</template>

<script setup>
const pageTitle = ref('')

const route = useRoute()
const router = useRouter()
</script>
