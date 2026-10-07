<!-- /components/music-video/music-video-gallery.vue -->
<template>
  <div class="space-y-6">
    <section v-if="userStore.isLoggedIn" class="space-y-3">
      <h2 class="kr-text-black-lg text-base-content">Your videos</h2>
      <div v-if="store.myVideos.length" :class="grid">
        <MusicVideoCard
          v-for="video in store.myVideos"
          :key="video.id"
          :video="video"
        />
      </div>
      <p v-else class="kr-panel-dashed kr-text-dim-sm p-6 text-center">
        Nothing yet. Remix one from the gallery below to start your own.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="kr-text-black-lg text-base-content">Gallery</h2>
      <div v-if="store.sharedVideos.length" :class="grid">
        <MusicVideoCard
          v-for="video in store.sharedVideos"
          :key="video.id"
          :video="video"
        />
      </div>
      <p
        v-else-if="!store.loading"
        class="kr-panel-dashed kr-text-dim-sm p-6 text-center"
      >
        No public music videos yet.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { useUserStore } from '@/stores/userStore'

const store = useMusicVideoStore()
const userStore = useUserStore()
const grid =
  'grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))]'
</script>
