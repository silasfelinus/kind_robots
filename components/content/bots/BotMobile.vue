<template>
  <div class="flex flex-col items-center p-1 m-1 h-screen bg-primary">
    <!-- Bot selector as a swipeable component -->
    <bot-bubble />

    <!-- Always display the component area, but conditionally show content -->
    <div class="relative w-full max-h-1/2 overflow-y-auto rounded-2xl m-1 p-1">
      <bot-chat />
    </div>
  </div>
</template>

<script setup>
import BotBubble from './BotBubble.vue'
import BotChat from './BotChat.vue'
</script>
