<template>
  <div class="flex items-center h-36 w-36">
    <WelcomeMessage />
    <icon name="tabler:user" class="text-base-200 text-2xl ml-2 cursor-pointer" @click="toggleVisibility" />
    <LoginWindow v-if="isVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isVisible = ref(false);

const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
};
</script>
