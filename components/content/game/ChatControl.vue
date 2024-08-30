<template>
  <div class="chat-control">Channels:</div>
  {{ channels }}
</template>

<script setup>
import { useChannelStore } from './../../../stores/channelStore.js'

const channelStore = useChannelStore()
const channels = computed(() => channelStore.channels)
</script>

<style scoped>
.chat-control {
  padding: 1rem;
  background-color: #f9f9f9;
}
</style>
