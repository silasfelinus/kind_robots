<template>
  <div
    class="flex min-h-dvh w-full items-center justify-center bg-cover bg-center"
    style="background-image: url('/images/background/error.png')"
  >
    <div class="rounded-2xl bg-base-100/60 p-8 text-center shadow-lg">
      <h1 class="mb-4 text-4xl font-bold text-primary">Page Not Found</h1>

      <p class="mb-8 text-secondary">
        It looks like this page doesn't exist. Please use the buttons below to
        navigate.
      </p>

      <div class="flex justify-center space-x-4">
        <button
          class="rounded-lg bg-primary px-4 py-2 text-white shadow-md transition-colors hover:bg-secondary"
          @click="goBack"
        >
          Go Back
        </button>

        <button
          class="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white shadow-md transition-colors hover:bg-secondary"
          @click="goHome"
        >
          <Icon name="kind-icon:home" class="h-5 w-5" />
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
