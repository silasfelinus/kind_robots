<template>
  <main class="kr-surface">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center"><span class="kr-spinner-lg-primary" /></div>
    <div v-else-if="!user.isAdmin" class="kr-note kr-note-error mx-auto max-w-xl p-8 text-center">The Emperor's strategy chamber is private.</div>
    <div v-else class="kr-scroll mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-6">
      <header class="rounded-3xl border border-warning/30 bg-base-300 p-6 sm:p-10">
        <p class="text-xs font-bold uppercase tracking-widest text-warning">Private Zuzu-world prequel workshop</p>
        <h1 class="font-serif text-4xl font-black sm:text-6xl">Emperor of Dust</h1>
        <p class="font-serif text-2xl italic text-warning">One Hundred Days</p>
        <p class="mt-3 max-w-2xl">Before Zuzu reached Hollow Bell, a small empire ruled the roads. One hundred mornings. Too many petitions. Never enough good hands.</p>
        <p class="mt-4 text-sm font-semibold text-warning">Illustrated concept preview only. No playable campaign yet.</p>
      </header>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '~/stores/userStore'
const user = useUserStore()
onMounted(async () => { await user.initialize() })
</script>
