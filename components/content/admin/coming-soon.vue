<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-base-200 rounded-2xl shadow-lg">
    <div
      v-for="(feature, index) in comingSoon"
      :key="index"
      class="p-4 rounded-2xl flex items-center justify-center transition-transform transform hover:scale-105 bg-secondary shadow-md"
    >
      <div class="text-center">
        <span class="block text-white text-lg font-semibold bg-primary p-2 rounded-lg">
          {{ feature }}
        </span>
        <span class="block mt-2 text-base text-gray-700">Coming Soon</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const comingSoon = [
  'Chat with AMI',
  'Make Art',
  'Edit User Data',
  'Critique Art',
  'Shopping Cart',
  'Achievements',
  'User Feed',
  'New Post',
  'Art Gallery',
  'Prompt Gallery',
  'Chatrooms',
  'Project Manager'
]
</script>
