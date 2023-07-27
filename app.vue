<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800 bg-gray-200">
    <nuxt-link to="/welcome">
      <img src="/images/kindtitle.webp" class="mx-auto rounded" alt="Title" />
    </nuxt-link>
    <transition name="fade"> <nuxt-page /> </transition>

    <status-notifier />
  </div>
</template>
