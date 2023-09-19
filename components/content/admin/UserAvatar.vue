<template>
  <div>
    <img :src="avatarImage" :alt="username + ' avatar'" class="w-16 h-16 rounded-full" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
let avatarImage = ref(userStore.avatarImage)
let username = ref(userStore.username)

onMounted(() => {
  avatarImage.value = userStore.avatarImage
  username.value = userStore.username
})
</script>
