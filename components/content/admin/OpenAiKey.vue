<template>
  <div class="justify-center">
    <input v-model="key" type="text" placeholder="Enter your OpenAI key" >
    <button @click="saveKeyToLocal">Save Key</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const key = ref('')

const saveKeyToLocal = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('user_openai_key', key.value)
    alert('Key saved successfully!')
  }
}
</script>
