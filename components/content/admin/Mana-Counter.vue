<!-- Mana Counter Component -->
<template>
  <div class="flex items-center space-x-2">
    <icon name="game-icons:standing-potion" class="text-lg" />
    <span>{{ mana }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
let mana = ref(userStore.mana)

onMounted(() => {
  mana.value = userStore.mana
})
</script>
