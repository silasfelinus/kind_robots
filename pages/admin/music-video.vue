<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-canvas space-y-3 p-2 sm:p-4">
      <header-page-bar>
        <div class="flex items-center gap-2">
          <icon name="kind-icon:music" class="kr-icon-5" />
          <span class="text-sm font-bold">Music Videos</span>
          <span class="badge badge-ghost badge-sm">Admin studio</span>
        </div>
      </header-page-bar>

      <div v-if="!ready" class="kr-panel p-4 text-sm">
        Loading Music Videos...
      </div>
      <div v-else-if="!userStore.isAdmin" class="kr-note kr-note-error p-4" role="alert">
        Administrator access required
      </div>
      <MusicVideoStudio v-else />
    </div>
  </main>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const ready = ref(false)

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
})
</script>
