<template>
  <transition name="fade-slide">
    <div
      
      class="message-card"
      :class="[
        bgClass,
        'z-10 p-1 rounded-lg border flex items-center space-x-2',
      ]"
    >
      

      <img :src="imageSrc" :alt="altText" class="rounded-full w-10 h-10" />
      <div>
        <div class="text-xs font-semibold">
          {{ username }}
        </div>
        <div class="text-md">
          {{ message }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
const { bgClass, imageSrc, altText, username, message } = defineProps<{
  bgClass: string
  imageSrc: string
  altText: string
  username: string
  message: string
}>()


</script>
