<!-- /components/content/art/corner-panel.vue -->
<template>
  <div class="absolute top-0 right-0 z-50 p-1 flex gap-1 items-center">
    <!-- Boost Tokens -->
    <button class="btn btn-xs btn-circle" @click="toggle('tokens')">
      <Icon name="kind-icon:bolt" />
    </button>

    <!-- Add Credits -->
    <button class="btn btn-xs btn-circle" @click="toggle('credits')">
      <Icon name="kind-icon:coin" />
    </button>

    <!-- Designer/Login -->
    <button class="btn btn-xs btn-circle" @click="toggle('account')">
      <Icon name="kind-icon:user" />
    </button>

    <!-- Add Sources -->
    <button class="btn btn-xs btn-circle" @click="toggle('sources')">
      <Icon name="kind-icon:plus" />
    </button>

    <!-- Dynamic dropdown content -->
    <div
      v-if="activePanel"
      class="absolute top-full right-0 mt-1 w-48 bg-base-100 shadow-lg rounded-xl p-2 z-50 space-y-2"
    >
      <div v-if="activePanel === 'tokens'">💥 Boost tokens info here</div>
      <div v-if="activePanel === 'credits'">💳 Add credits or view balance</div>
      <div v-if="activePanel === 'account'">👤 Login or switch designer</div>
      <div v-if="activePanel === 'sources'">📦 Add text/image sources</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activePanel = ref<string | null>(null)

function toggle(panel: string) {
  activePanel.value = activePanel.value === panel ? null : panel
}
</script>
