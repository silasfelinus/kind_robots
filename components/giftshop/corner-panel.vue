<template>
  <div
    ref="panelRef"
    class="absolute right-2 top-1 z-40 pointer-events-auto"
    
  >
    <div class="flex gap-2 items-start">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="relative flex items-center"
      >
<div
  :class="[
    'tooltip',
    activePanel === item.id ? 'tooltip-top' : 'tooltip-bottom'
  ]"
  :data-tip="item.tooltip"
>

            <span v-if="item.id === 'tokens'" class="text-xs font-bold">
              {{ userStore.user?.mana ?? 0 }}
            </span>
            <Icon :name="item.icon" class="inline" />
          </button>
        </div>

        <!-- Dropdown Panel -->
<div
  v-if="activePanel === item.id"
  class="absolute top-full mt-2 right-0 max-w-[calc(100vw-1rem)] w-64 bg-base-100 shadow-lg rounded-xl p-3 z-[1000] text-sm space-y-2"
>

          <!-- Tokens Panel -->
          <div v-if="item.id === 'tokens'">
            <div class="font-bold">🧪 Mana: {{ userStore.user?.mana ?? 0 }}</div>
            <p class="text-xs text-base-content/70">
              Role: {{ userStore.user?.Role || 'Guest' }}
            </p>
            <NuxtLink to="/subscriptions" class="block hover:underline">💳 Manage Subscriptions</NuxtLink>
            <NuxtLink to="/boost" class="block hover:underline">⚡ Boost Tokens</NuxtLink>
          </div>

          <!-- Account Panel -->
          <div v-else-if="item.id === 'account'">
            <template v-if="userStore.isLoggedIn">
              <div class="flex justify-between items-center">
                <div class="font-bold">
                  👤 {{ userStore.user?.username }}
                  <br />
                  <span class="text-sm text-base-content/70">({{ userStore.user?.designerName }})</span>
                </div>
                <div class="text-right">
                  <div class="text-xs text-base-content/60">Mana</div>
                  <div class="font-bold text-primary">{{ userStore.user?.mana ?? 0 }}</div>
                </div>
              </div>
              <NuxtLink to="/dashboard" class="block hover:underline">📂 Dashboard</NuxtLink>
              <NuxtLink to="/themes" class="block hover:underline">🎨 Themes</NuxtLink>
              <NuxtLink to="/milestones" class="block hover:underline">🏆 Milestones</NuxtLink>
              <NuxtLink to="/inbox" class="block hover:underline">📬 Inbox</NuxtLink>
              <NuxtLink to="/addchat" class="block hover:underline">➕ New Chat</NuxtLink>
              <button class="btn btn-xs btn-error mt-2 w-full" @click="userStore.logout">🚪 Logout</button>
            </template>
            <template v-else>
              <NuxtLink to="/register" class="block hover:underline">✏️ Set Designer Name</NuxtLink>
              <NuxtLink to="/password" class="block hover:underline">🔒 Set Password</NuxtLink>
              <NuxtLink to="/register" class="block hover:underline">📝 Register</NuxtLink>
            </template>
          </div>

          <!-- Directory Panel -->
          <div v-else-if="item.id === 'directory'">
            <div class="font-bold mb-2">📁 Site Map</div>
            <div class="flex flex-col gap-1">
              <NuxtLink to="/art" class="hover:underline">🖼️ Art</NuxtLink>
              <NuxtLink to="/bots" class="hover:underline">🤖 Bots</NuxtLink>
              <NuxtLink to="/pitches" class="hover:underline">🎤 Pitches</NuxtLink>
              <NuxtLink to="/stories" class="hover:underline">📖 Stories</NuxtLink>
              <NuxtLink to="/wonderlab" class="hover:underline">🧪 Wonderlab</NuxtLink>
              <NuxtLink to="/forum" class="hover:underline">💬 Forum</NuxtLink>
              <NuxtLink to="/memory" class="hover:underline">🧠 Memory</NuxtLink>
              <NuxtLink to="/characters" class="hover:underline">🧍 Characters</NuxtLink>
            </div>
          </div>

          <!-- Sources Panel -->
          <div v-else-if="item.id === 'sources'">
            <div class="font-bold mb-1">📦 Modeller Sources</div>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="checkbox" />
              <NuxtLink to="/artmodel-manager" class="hover:underline">🎨 Select Art Modeller</NuxtLink>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="checkbox" />
              <NuxtLink to="/textmodel-manager" class="hover:underline">📝 Select Text Modeller</NuxtLink>
            </label>
          </div>

          <!-- About Panel -->
          <div v-else-if="item.id === 'about'">
            <div class="font-bold mb-1">ℹ️ Info</div>
            <NuxtLink to="/about" class="block hover:underline">🌐 About</NuxtLink>
            <NuxtLink to="/sponsor" class="block hover:underline">💖 Sponsors</NuxtLink>
            <NuxtLink to="/giftshop" class="block hover:underline">🛍️ Giftshop</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/userStore'


const userStore = useUserStore()


const panelRef = ref<HTMLElement | null>(null)
const activePanel = ref<string | null>(null)

function toggle(panel: string) {
  activePanel.value = activePanel.value === panel ? null : panel
}

function closePanel() {
  activePanel.value = null
}

function handleClickOutside(event: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    closePanel()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})



const menuItems = [
  { id: 'tokens', icon: 'kind-icon:mana-potion', tooltip: `${userStore.user?.mana ?? 0} Mana` },
  { id: 'account', icon: 'kind-icon:person', tooltip: userStore.user?.designerName || 'Account' },
  { id: 'directory', icon: 'kind-icon:folder-tree', tooltip: 'Site Map' },
  { id: 'sources', icon: 'kind-icon:butterfly', tooltip: 'Modeller Sources' },
  { id: 'about', icon: 'kind-icon:info-circle', tooltip: 'About / Sponsors' },
]
</script>

<style scoped>
.tooltip {
  font-family: 'Chicago', sans-serif;
  font-size: 0.75rem;
}
</style>
