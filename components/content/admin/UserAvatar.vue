<template>
  <div>
    <img
      :src="avatarUrl"
      :alt="username + ' avatar'"
      class="min-w-8 min-h-8 rounded-full"
      @error="setDefaultAvatar"
    >
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const username = ref(userStore.username)

const defaultAvatar = '/images/kindart.webp' // Replace with your default avatar path
const initialAvatarUrl = computed(() => userStore.avatarImage || defaultAvatar)
const avatarUrl = ref(initialAvatarUrl.value)

const setDefaultAvatar = () => {
  avatarUrl.value = defaultAvatar
}

onMounted(() => {
  username.value = userStore.username
  avatarUrl.value = initialAvatarUrl.value
})
</script>
