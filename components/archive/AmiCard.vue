<template>
  <div
    class="card max-w-sm rounded overflow-hidden shadow-lg relative cursor-pointer transition-shadow duration-300 ease-in-out hover:shadow-2xl"
  >
    <img
      class="avatar w-16 h-16 rounded-full border-2 border-white absolute top-0 right-0 mt-4 mr-4"
      :src="avatar"
      alt="Avatar"
    />
    <img class="w-full" :src="image" alt="AMIbot" />
    <div class="content px-6 py-4">
      <div class="title font-bold text-2xl mb-2">{{ title }}</div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  image: {
    type: String,
    default: '/images/amibot/amibot1.png'
  },
  title: {
    type: String,
    default: 'AmiCard'
  },
  avatar: {
    type: String,
    default: '/images/acrocats/PXL_20220903_023602144.jpg'
  }
})
</script>

<style scoped>
.card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  padding: 20px;
}

.avatar {
  border: 2px solid #ffffff;
}

.content {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
}
</style>
