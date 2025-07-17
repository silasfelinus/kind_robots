<!-- /components/content/art/corner-panel.vue -->
<template>
<div class="absolute top-0 right-0 z-50 p-1 w-[5.5rem]" @click.self="closePanel">
    <div class="flex gap-2 items-start">
      <!-- Menu Icons -->
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="relative flex items-center gap-2"
      >
        <div
          class="tooltip tooltip-top fixed z-[9999]"
          :data-tip="item.tooltip"
        >
          <button
            class="btn btn-xs flex items-center gap-1 px-2"
            @click.stop="toggle(item.id)"
          >
            <span
              v-if="item.id === 'tokens'"
              class="text-xs font-bold"
            >
              {{ userStore.user?.mana ?? 0 }}
            </span>
            <Icon :name="item.icon" class="inline" />
          </button>
        </div>

        <!-- Dropdown Panel -->
        <div
          v-if="activePanel === item.id"
          class="mt-2 w-64 bg-base-100 shadow-lg rounded-xl p-3 z-50 text-sm space-y-2"
        >
          <!-- Tokens Panel -->
          <div v-if="item.id === 'tokens'">
            <div class="font-bold">
              🧪 Mana: {{ userStore.user?.mana ?? 0 }}
            </div>
            <p class="text-xs text-base-content/70">
              Role: {{ userStore.user?.Role || 'Guest' }}
            </p>
            <NuxtLink to="/subscriptions" class="block hover:underline">
              💳 Manage Subscriptions
            </NuxtLink>
            <NuxtLink to="/boost" class="block hover:underline">
              ⚡ Boost Tokens
            </NuxtLink>
          </div>

          <!-- Account -->
          <div v-if="item.id === 'account'">
            <template v-if="userStore.isLoggedIn">
              <div class="flex justify-between items-center">
                <div class="font-bold">
                  👤 {{ userStore.user?.username }}
                  <br />
                  <span class="text-sm text-base-content/70">
                    ({{ userStore.user?.designerName }})
                  </span>
                </div>
                <div class="text-right">
                  <div class="text-xs text-base-content/60">Mana</div>
                  <div class="font-bold text-primary">
                    {{ userStore.user?.mana ?? 0 }}
                  </div>
                </div>
              </div>
              <NuxtLink to="/dashboard" class="block hover:underline">
                📂 Dashboard
              </NuxtLink>
              <NuxtLink to="/themes" class="block hover:underline">
                🎨 Themes
              </NuxtLink>
              <NuxtLink to="/milestones" class="block hover:underline">
                🏆 Milestones
              </NuxtLink>
              <NuxtLink to="/inbox" class="block hover:underline">
                📬 Inbox
              </NuxtLink>
              <NuxtLink to="/addchat" class="block hover:underline">
                ➕ New Chat
              </NuxtLink>
              <button
                class="btn btn-xs btn-error mt-2 w-full"
                @click="userStore.logout"
              >
                🚪 Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink to="/register" class="block hover:underline">
                ✏️ Set Designer Name
              </NuxtLink>
              <NuxtLink to="/password" class="block hover:underline">
                🔒 Set Password
              </NuxtLink>
              <NuxtLink to="/register" class="block hover:underline">
                📝 Register
              </NuxtLink>
            </template>
          </div>

          <!-- Directory -->
          <div v-if="item.id === 'directory'">
            <div class="font-bold mb-2">📁 Site Map</div>
            <div class="flex flex-col gap-1">
              <NuxtLink to="/art" class="hover:underline">🖼️ Art</NuxtLink>
              <NuxtLink to="/bots" class="hover:underline">🤖 Bots</NuxtLink>
              <NuxtLink to="/pitches" class="hover:underline">
                🎤 Pitches
              </NuxtLink>
              <NuxtLink to="/stories" class="hover:underline">
                📖 Stories
              </NuxtLink>
              <NuxtLink to="/wonderlab" class="hover:underline">
                🧪 Wonderlab
              </NuxtLink>
              <NuxtLink to="/forum" class="hover:underline">
                🧪 Forum
              </NuxtLink>
              <NuxtLink to="/memory" class="hover:underline">
                🧠 Memory
              </NuxtLink>
              <NuxtLink to="/characters" class="hover:underline">
                🧍 Characters
              </NuxtLink>
            </div>
          </div>

          <!-- Sources -->
          <div v-if="item.id === 'sources'">
            <div class="font-bold mb-1">📦 Modeller Sources</div>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="checkbox" />
              <NuxtLink to="/artmodel-manager" class="hover:underline">
                🎨 Select Art Modeller
              </NuxtLink>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="checkbox" />
              <NuxtLink to="/textmodel-manager" class="hover:underline">
                📝 Select Text Modeller
              </NuxtLink>
            </label>
          </div>

          <!-- About -->
          <div v-if="item.id === 'about'">
            <div class="font-bold mb-1">ℹ️ Info</div>
            <NuxtLink to="/about" class="block hover:underline">
              🌐 About
            </NuxtLink>
            <NuxtLink to="/sponsor" class="block hover:underline">
              💖 Sponsors
            </NuxtLink>
            <NuxtLink to="/giftshop" class="block hover:underline">
              💖 Giftshop
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/corner-panel.vue
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const activePanel = ref<string | null>(null)

function toggle(panel: string) {
  activePanel.value = activePanel.value === panel ? null : panel
}

function closePanel() {
  activePanel.value = null
}

const menuItems = [
  {
    id: 'tokens',
    icon: 'kind-icon:mana-potion',
    tooltip: `${userStore.user?.mana ?? 0} Mana`,
  },
  {
    id: 'account',
    icon: 'kind-icon:person',
    tooltip: userStore.user?.designerName || 'Account',
  },
  {
    id: 'directory',
    icon: 'kind-icon:folder-tree',
    tooltip: 'Site Map',
  },
  {
    id: 'sources',
    icon: 'kind-icon:butterfly',
    tooltip: 'Modeller Sources',
  },
  {
    id: 'about',
    icon: 'kind-icon:info-circle',
    tooltip: 'About / Sponsors',
  },
]
</script>

<style scoped>
.tooltip {
  font-family: 'Chicago', sans-serif;
  font-size: 0.75rem;
}
</style>
