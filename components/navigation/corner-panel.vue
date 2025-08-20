<!-- /components/content/navigation/center-panel.vue -->
<template>
  <!-- Overlay-ready root: relative so absolutely-positioned panels anchor correctly -->
  <div ref="panelRef" class="relative z-50">
    <!-- Icon row + dropdowns; no layout shift because dropdowns are absolute -->
    <div class="flex gap-2 items-start">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="relative flex flex-col items-end"
      >
        <!-- Toggle button with tooltip -->
        <div
          :class="[
            'tooltip',
            activePanel === item.id ? 'tooltip-top' : 'tooltip-bottom',
          ]"
          :data-tip="item.tooltip"
        >
          <button
            class="btn btn-xs flex items-center gap-1 px-2"
            @click.stop="toggle(item.id)"
            :aria-expanded="activePanel === item.id"
            :aria-controls="`panel-${item.id}`"
          >
            <span v-if="item.id === 'tokens'" class="text-xs font-bold">
              {{ userStore.user?.mana ?? 0 }}
            </span>
            <Icon :name="item.icon" class="inline" />
          </button>
        </div>

        <!-- Dropdown Panel (absolute; no layout impact) -->
        <div
          v-if="activePanel === item.id"
          :id="`panel-${item.id}`"
          class="absolute top-full mt-2 w-64 max-w-[calc(100vw-1rem)] bg-base-100 shadow-lg rounded-xl p-3 z-50 text-sm space-y-2"
          style="inset-inline-end: 0"
          role="dialog"
          aria-modal="false"
          @click.stop
        >
          <!-- Tokens Panel -->
          <div v-if="item.id === 'tokens'">
            <div class="font-bold">
              🧪 Mana: {{ userStore.user?.mana ?? 0 }}
            </div>
            <p class="text-xs text-base-content/70">
              Role: {{ userStore.user?.Role || 'Guest' }}
            </p>
            <NuxtLink
              to="/subscriptions"
              class="block hover:underline"
              @click="closeSoon"
            >
              💳 Manage Subscription
            </NuxtLink>
            <NuxtLink
              to="/credits"
              class="block hover:underline"
              @click="closeSoon"
            >
              ⚡ Boost Mana Credits
            </NuxtLink>
          </div>

          <!-- Account Panel -->
          <div v-else-if="item.id === 'account'">
            <template v-if="userStore.isLoggedIn">
              <div class="flex justify-between items-center">
                <div class="font-bold">
                  👤 {{ userStore.user?.username }}<br />
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
              <NuxtLink
                to="/dashboard"
                class="block hover:underline"
                @click="closeSoon"
                >📂 Dashboard</NuxtLink
              >
              <NuxtLink
                to="/themes"
                class="block hover:underline"
                @click="closeSoon"
                >🎨 Themes</NuxtLink
              >
              <NuxtLink
                to="/milestones"
                class="block hover:underline"
                @click="closeSoon"
                >🏆 Milestones</NuxtLink
              >
              <NuxtLink
                to="/inbox"
                class="block hover:underline"
                @click="closeSoon"
                >📬 Inbox</NuxtLink
              >
              <NuxtLink
                to="/addchat"
                class="block hover:underline"
                @click="closeSoon"
                >➕ New Chat</NuxtLink
              >
              <button
                class="btn btn-xs btn-error mt-2 w-full"
                @click="logoutAndClose"
              >
                🚪 Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink
                to="/register"
                class="block hover:underline"
                @click="closeSoon"
                >✏️ Set Designer Name</NuxtLink
              >
              <NuxtLink
                to="/password"
                class="block hover:underline"
                @click="closeSoon"
                >🔒 Set Password</NuxtLink
              >
              <NuxtLink
                to="/register"
                class="block hover:underline"
                @click="closeSoon"
                >📝 Register</NuxtLink
              >
            </template>
          </div>

          <!-- Directory Panel -->
          <div v-else-if="item.id === 'directory'">
            <div class="font-bold mb-2">📁 Site Map</div>
            <div class="flex flex-col gap-1">
              <NuxtLink to="/addart" class="hover:underline" @click="closeSoon"
                >🖼️ Art</NuxtLink
              >
              <NuxtLink to="/bots" class="hover:underline" @click="closeSoon"
                >🤖 Bots</NuxtLink
              >
              <NuxtLink to="/pitches" class="hover:underline" @click="closeSoon"
                >🎤 Pitches</NuxtLink
              >
              <NuxtLink to="/stories" class="hover:underline" @click="closeSoon"
                >📖 Stories</NuxtLink
              >
              <NuxtLink
                to="/wonderlab"
                class="hover:underline"
                @click="closeSoon"
                >🧪 Wonderlab</NuxtLink
              >
              <NuxtLink
                to="/dominions"
                class="hover:underline"
                @click="closeSoon"
                >🧪 Dominion Generator</NuxtLink
              >
              <NuxtLink to="/forum" class="hover:underline" @click="closeSoon"
                >💬 Forum</NuxtLink
              >
              <NuxtLink to="/memory" class="hover:underline" @click="closeSoon"
                >🧠 Memory</NuxtLink
              >
              <NuxtLink
                to="/characters"
                class="hover:underline"
                @click="closeSoon"
                >🧍 Characters</NuxtLink
              >
            </div>
          </div>

          <!-- Sources Panel -->
          <div v-else-if="item.id === 'sources'">
            <div class="font-bold mb-1">📦 Modeller Sources</div>
            <div class="flex items-center gap-2">
              <input type="checkbox" class="checkbox" />
              <NuxtLink
                to="/artmodel-manager"
                class="hover:underline"
                @click="closeSoon"
                >🎨 Select Art Modeller</NuxtLink
              >
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" class="checkbox" />
              <NuxtLink
                to="/textmodel-manager"
                class="hover:underline"
                @click="closeSoon"
                >📝 Select Text Modeller</NuxtLink
              >
            </div>
          </div>

          <!-- About Panel -->
          <div v-else-if="item.id === 'about'">
            <div class="font-bold mb-1">ℹ️ Info</div>
            <NuxtLink
              to="/about"
              class="block hover:underline"
              @click="closeSoon"
              >🌐 About</NuxtLink
            >
            <NuxtLink
              to="/sponsor"
              class="block hover:underline"
              @click="closeSoon"
              >💖 Sponsors</NuxtLink
            >
            <NuxtLink
              to="/giftshop"
              class="block hover:underline"
              @click="closeSoon"
              >🛍️ Giftshop</NuxtLink
            >
          </div>
        </div>
        <!-- /Dropdown Panel -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* Overlay-only center-panel */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
async function closeSoon() {
  // allow the router to grab the click first
  await nextTick()
  closePanel()
}
function logoutAndClose() {
  userStore.logout()
  closePanel()
}

/* Outside interactions (capture phase to avoid racing link clicks) */
function handlePointerDownCapture(e: PointerEvent) {
  const root = panelRef.value
  if (!root) return
  const path = (e.composedPath?.() || []) as EventTarget[]
  if (path.includes(root)) return // started inside
  closePanel()
}
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePanel()
}

onMounted(() => {
  window.addEventListener('pointerdown', handlePointerDownCapture, true)
  window.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handlePointerDownCapture, true)
  window.removeEventListener('keydown', handleKeydown)
})

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
