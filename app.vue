<template>
  <!-- Main Content with scrollable area -->
  <main
    class="flex-grow overflow-y-auto p-1 transition-all duration-500 ease-in-out"
  >
    <transition name="fade" mode="out-in">
      <div v-if="pageReady" class="flex justify-center items-center">
        <div class="w-full max-w-4xl rounded-2xl p-1 bg-base-200">
          <nuxt-page />
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup></script>

<style>
html,
body,
#app {
  height: 100%;
}
</style>
