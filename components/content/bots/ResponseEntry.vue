<template>
  <div
    class="border rounded-xl m-2 flex items-center justify-between p-2"
    :class="roleClass"
  >
    <div
      class="flex items-center flex-none"
      :class="{ 'order-last': isUser, 'order-first': isAssistant }"
    >
      <img
        v-if="avatarImage"
        :src="avatarImage"
        alt="Avatar"
        class="w-16 h-16 object-cover rounded-xl border m-2"
      >
    </div>
    <div class="flex-grow m-2 p-2 text-xl">
      <p>{{ content }}</p>
    </div>
    <div
      v-if="isAssistant"
      class="flex-shrink-0"
    >
      <share-buttons
        :url="shareUrl"
        :text="content"
        :bot-name="botName"
        :subtitle="subtitle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  role: string
  content: string
  avatarImage: string
  botName: string
  subtitle: string
}>()

const isAssistant = computed(() => props.role === 'assistant')
const isUser = computed(() => props.role === 'user')
const roleClass = computed(() => (props.role === 'user' ? 'bg-primary text-default' : 'bg-secondary text-default'))
const shareUrl = '/botcafe'
</script>
