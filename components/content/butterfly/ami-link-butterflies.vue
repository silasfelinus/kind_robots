<!-- /components/content/butterfly/ami-link-butterflies.vue -->
<template>
  <div class="space-x-4">
    <button class="btn btn-primary" @click="handleButtonClick">
      {{ buttonText }}
    </button>
  </div>
  <AmiSwarm v-if="showAmiSwarm" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter() // Import the router

const buttonText = ref('Home of AMIbot')
const showAmiSwarm = ref(false) // Control display of AmiSwarm

const handleButtonClick = () => {
  showAmiSwarm.value = !showAmiSwarm.value // Toggle AmiSwarm visibility

  if (showAmiSwarm.value) {
    buttonText.value = 'No More butterflies?'
    router.push('/kindrobots/amibot')
  } else {
    buttonText.value = 'Release The Butterflies'
    router.push('/')
  }
}
</script>
