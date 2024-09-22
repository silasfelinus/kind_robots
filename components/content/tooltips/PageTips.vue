<template>
  <div
    class="tutorial-cards-container fixed bottom-0 right-0 z-40 flex flex-col-reverse items-end space-y-2 space-y-reverse p-2"
  >
    <!-- Bot Message Cards -->
    <div class="flex w-full justify-between items-center">
      <div class="flex flex-col-reverse items-end space-y-2 space-y-reverse">
        <!-- AMIbot Message Card -->
        <PageCard
          bg-class="bg-base-200 shadow-2xl border-accent backdrop-blur-lg"
          image-src="/images/amibotsquare1.webp"
          alt-text="AMI"
          username="AMIbot"
          :message="page.amitip"
        />

        <!-- DottiBot Message Card -->
        <PageCard
          bg-class="bg-base-200 shadow-2xl border-secondary backdrop-blur-lg"
          image-src="/images/avatars/dottie1.webp"
          alt-text="Dotti"
          username="DottiBot"
          :message="page.dottitip"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
