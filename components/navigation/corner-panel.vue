<!-- /components/content/navigation/corner-panel.vue -->
<template>
  <div ref="root" class="relative z-50 w-full">
    <div class="flex flex-wrap justify-end items-start gap-2">
      <div v-for="item in menuItems" :key="item.id" class="relative">
        <button
          class="btn btn-xs flex items-center gap-2 px-3"
          :aria-expanded="activePanel === item.id"
          :aria-controls="`panel-${item.id}`"
          @click.stop="toggle(item.id)"
        >
          <ClientOnly>
            <Icon :name="item.icon" class="inline-block h-4 w-4" />
            <template #fallback>
              <span aria-hidden="true" class="inline-block h-4 w-4"></span>
            </template>
          </ClientOnly>

          <span class="text-xs font-semibold">{{ item.label }}</span>

          <ClientOnly>
            <Icon
              :name="
                activePanel === item.id
                  ? 'kind-icon:chevron-up'
                  : 'kind-icon:chevron-down'
              "
              class="inline-block h-3 w-3"
            />
            <template #fallback>
              <span aria-hidden="true" class="inline-block h-3 w-3"></span>
            </template>
          </ClientOnly>
        </button>

        <div
          v-if="activePanel === item.id"
          :id="`panel-${item.id}`"
          class="absolute right-0 top-full mt-2 bg-base-100 rounded-xl border border-base-content/10 shadow-lg p-3 w-72 max-w-[calc(100vw-2rem)] text-sm text-right"
        >
          <!-- TOKENS -->
          <div v-if="item.id === 'tokens'" class="space-y-2">
            <div class="flex justify-between items-center font-bold">
              <span class="text-xs text-base-content/70">Mana</span>
              <span>{{ userStore.user?.mana ?? 0 }}</span>
            </div>
            <div class="text-xs text-base-content/60">
              Role: {{ userStore.user?.Role || 'Guest' }}
            </div>
            <NuxtLink
              to="/subscriptions"
              class="block hover:underline"
              @click="close"
            >
              Manage Subscription
            </NuxtLink>
            <NuxtLink
              to="/credits"
              class="block hover:underline"
              @click="close"
            >
              Boost Mana Credits
            </NuxtLink>
          </div>

          <!-- ACCOUNT -->
          <div v-else-if="item.id === 'account'" class="space-y-2">
            <div v-if="userStore.isLoggedIn" class="space-y-2">
              <div class="flex justify-between items-start">
                <div class="text-left">
                  <div class="font-bold">{{ userStore.user?.username }}</div>
                  <div class="text-xs text-base-content/70">
                    {{ userStore.user?.designerName }}
                  </div>
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
                @click="close"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/themes"
                class="block hover:underline"
                @click="close"
              >
                Themes
              </NuxtLink>
              <NuxtLink
                to="/milestones"
                class="block hover:underline"
                @click="close"
              >
                Milestones
              </NuxtLink>
              <NuxtLink
                to="/inbox"
                class="block hover:underline"
                @click="close"
              >
                Inbox
              </NuxtLink>
              <NuxtLink
                to="/addchat"
                class="block hover:underline"
                @click="close"
              >
                New Chat
              </NuxtLink>
              <button class="btn btn-xs btn-error w-full mt-2" @click="logout">
                Logout
              </button>
            </div>
            <div v-else class="space-y-1">
              <NuxtLink
                to="/register"
                class="block hover:underline"
                @click="close"
              >
                Set Designer Name
              </NuxtLink>
              <NuxtLink
                to="/password"
                class="block hover:underline"
                @click="close"
              >
                Set Password
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="block hover:underline"
                @click="close"
              >
                Register
              </NuxtLink>
            </div>
          </div>

          <!-- DIRECTORY -->
          <div v-else-if="item.id === 'directory'" class="space-y-1">
            <div class="font-bold mb-1">Site Map</div>
            <NuxtLink
              v-for="link in directoryLinks"
              :key="link.to"
              :to="link.to"
              class="block hover:underline"
              @click="close"
            >
              {{ link.label }}
            </NuxtLink>
          </div>

          <!-- SOURCES -->
          <div v-else-if="item.id === 'sources'" class="space-y-2">
            <div class="font-bold">Modeller Sources</div>
            <div class="flex items-center justify-between gap-2">
              <NuxtLink
                to="/artmodel-manager"
                class="hover:underline"
                @click="close"
              >
                Select Art Modeller
              </NuxtLink>
              <input type="checkbox" class="checkbox" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <NuxtLink
                to="/textmodel-manager"
                class="hover:underline"
                @click="close"
              >
                Select Text Modeller
              </NuxtLink>
              <input type="checkbox" class="checkbox" />
            </div>
          </div>

          <!-- ABOUT -->
          <div v-else-if="item.id === 'about'" class="space-y-1">
            <NuxtLink to="/about" class="block hover:underline" @click="close">
              About
            </NuxtLink>
            <NuxtLink
              to="/sponsor"
              class="block hover:underline"
              @click="close"
            >
              Sponsors
            </NuxtLink>
            <NuxtLink
              to="/giftshop"
              class="block hover:underline"
              @click="close"
            >
              Giftshop
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const root = ref<HTMLElement | null>(null)
const activePanel = ref<string | null>(null)

function toggle(id: string) {
  activePanel.value = activePanel.value === id ? null : id
}

function close() {
  activePanel.value = null
}

function handleOutside(e: Event) {
  const t = e.target as Node
  if (!root.value) return
  if (!root.value.contains(t)) activePanel.value = null
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') activePanel.value = null
}

function logout() {
  userStore.logout()
  close()
}

onMounted(() => {
  window.addEventListener('pointerdown', handleOutside, true)
  window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handleOutside, true)
  window.removeEventListener('keydown', handleKey)
})

const menuItems = [
  { id: 'tokens', icon: 'kind-icon:mana-potion', label: 'Tokens' },
  { id: 'account', icon: 'kind-icon:person', label: 'Account' },
  { id: 'directory', icon: 'kind-icon:folder-tree', label: 'Directory' },
  { id: 'sources', icon: 'kind-icon:butterfly', label: 'Sources' },
  { id: 'about', icon: 'kind-icon:info-circle', label: 'About' },
] as const

const directoryLinks = [
  { to: '/addart', label: 'Art' },
  { to: '/bots', label: 'Bots' },
  { to: '/pitches', label: 'Pitches' },
  { to: '/stories', label: 'Stories' },
  { to: '/wonderlab', label: 'Wonderlab' },
  { to: '/dominions', label: 'Dominion Generator' },
  { to: '/forum', label: 'Forum' },
  { to: '/memory', label: 'Memory' },
  { to: '/characters', label: 'Characters' },
]
</script>
