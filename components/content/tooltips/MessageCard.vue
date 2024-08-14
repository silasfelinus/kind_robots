<template>
  <transition name="fade-slide">
    <div
      v-if="show"
      class="message-card"
      :class="[
        bgClass,
        'z-10 p-1 rounded-lg border flex items-center space-x-2',
      ]"
    >
      <button
        class="absolute top-0 right-0 m-1 text-sm"
        @click="$emit('remove-card')"
      >
        .
      </button>

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
const { show, bgClass, imageSrc, altText, username, message } = defineProps<{
  show: boolean
  bgClass: string
  imageSrc: string
  altText: string
  username: string
  message: string
}>()
const emit = defineEmits(['remove-card'])
const removeCard = () => {
  emit('remove-card')
}
</script>
