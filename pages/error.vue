<template>
  <div
    class="flex flex-1 min-h-full w-full items-center justify-center bg-cover bg-center"
    style="background-image: url('/images/background/error.png')"
  >
    <div class="bg-base-100/60 p-8 rounded-2xl text-center shadow-lg">
      <h1 class="text-4xl font-bold text-primary mb-4">Page Not Found</h1>

      <p class="text-secondary mb-8">
        It looks like this page doesn't exist. Please use the buttons below to
        navigate.
      </p>

      <div class="flex space-x-4 justify-center">
        <button
          class="text-white bg-primary px-4 py-2 rounded-lg shadow-md hover:bg-secondary transition-colors"
          @click="goBack"
        >
          Go Back
        </button>

        <button
          class="text-white bg-primary px-4 py-2 rounded-lg shadow-md hover:bg-secondary transition-colors flex items-center space-x-2"
          @click="goHome"
        >
          <Icon name="kind-icon:home" class="w-5 h-5" />
          <span>Go to Home</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>
