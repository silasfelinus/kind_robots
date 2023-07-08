<template>
  <div class="flex items-center justify-between bg-secondary-200 text-accent px-6 py-4">
    <div class="flex items-center space-x-4">
      <nuxt-link to="/">
        <img class="w-64 h-64" src="/images/kindtitle.webp" alt="Logo" />
      </nuxt-link>
    </div>
    <div class="space-x-4">
      <side-nav />
    </div>
  </div>
</template>

<script setup>
const pageTitle = ref('')

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const pageData = await $content(route.path).fetch()
  pageTitle.value = pageData.title
})
</script>
