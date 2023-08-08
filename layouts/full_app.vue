<template>
  <div class="container">
    <!-- Welcome Image -->
    <nuxt-link to="#bot-carousel" class="logo-link">
      <img src="/images/fulltitle.png" alt="Title" />
    </nuxt-link>

    <!-- Bot Carousel Section -->
    <section id="bot-carousel">
      <bot-carousel />
    </section>

    <!-- Main Content Section -->
    <section id="main-content">
      <transition name="fade" mode="out-in">
        <div>
          <slot />
        </div>
      </transition>
    </section>

    <!-- Kind Nav Section -->
    <section id="kind-nav">
      <kind-nav />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '../stores/botStore'

const botStore = useBotStore()
botStore.loadStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

.logo-link {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.logo-link:hover {
  transform: scale(1.1);
}

section {
  margin-bottom: 20px;
}

/* Fade animation for layout transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
