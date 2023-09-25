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

<template>
  <div class="bg-base-200 rounded-2xl p-2 m-2 border">
    <h3 class="text-lg font-bold">{{ idea.title }}</h3>
    <p class="text-base">{{ idea.example }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  idea: {
    title: {
      type: String,
      default: 'Shocking Idea'
    },
    example: {
      type: String,
      default: 'Hilarious Example'
    }
  }
})
</script>

<style scoped>
.card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);
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
