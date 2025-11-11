<!-- /components/navigation/corner-panel.vue -->
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
          <div v-if="item.id === 'account'" class="text-left">
            <div class="flex gap-4 items-start">
              <div class="flex-1 space-y-1">
                <div class="font-bold">
                  {{ userStore.user?.username || 'Guest' }}
                </div>
                <div class="text-xs text-base-content/70">
                  {{ userStore.user?.designerName }}
                </div>

                <div class="mt-2 flex items-center gap-2 text-xs">
                  <Icon
                    name="kind-icon:mana-potion"
                    class="inline-block h-3 w-3"
                  />
                  <span class="font-semibold">
                    Mana: {{ userStore.user?.mana ?? 0 }}
                  </span>
                </div>

                <div class="mt-1 flex items-center gap-2 text-xs">
                  <Icon
                    name="kind-icon:jellybean"
                    class="inline-block h-3 w-3"
                  />
                  <span>
                    Jellybeans: {{ milestoneStore.milestoneCountForUser }} / 11
                  </span>
                </div>
              </div>

              <div class="flex-1">
                <div v-if="userStore.isLoggedIn" class="space-y-1">
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
                    to="/chats"
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

                  <button
                    class="btn btn-xs btn-error w-full mt-2"
                    @click="logout"
                  >
                    Logout
                  </button>
                </div>

                <div v-else class="space-y-1">
                  <NuxtLink
                    to="/register"
                    class="block hover:underline"
                    @click="close"
                  >
                    Register
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="item.id === 'directory'" class="space-y-2 text-left">
            <div class="grid grid-cols-2 gap-1">
              <NuxtLink
                v-for="link in directoryLinks"
                :key="link.to"
                :to="link.to"
                class="hover:underline text-xs"
                @click="close"
              >
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>

          <div v-else-if="item.id === 'settings'" class="space-y-2 text-left">
            <div class="font-bold mb-1 text-right">Settings</div>

            <div class="space-y-1">
              <NuxtLink
                to="/about"
                class="block hover:underline"
                @click="close"
              >
                About
              </NuxtLink>
              <NuxtLink
                to="/amibot"
                class="block hover:underline"
                @click="close"
              >
                The AMI Project
              </NuxtLink>
              <NuxtLink
                to="/giftshop"
                class="block hover:underline"
                @click="close"
              >
                Giftshop
              </NuxtLink>
            </div>

            <div
              class="mt-2 pt-2 border-t border-base-content/10 space-y-2 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <NuxtLink
                  to="/artmodel-manager"
                  class="hover:underline"
                  @click="close"
                >
                  Select Art Modeller
                </NuxtLink>
                <input type="checkbox" class="checkbox checkbox-xs" />
              </div>
              <div class="flex items-center justify-between gap-2">
                <NuxtLink
                  to="/textmodel-manager"
                  class="hover:underline"
                  @click="close"
                >
                  Select Text Modeller
                </NuxtLink>
                <input type="checkbox" class="checkbox checkbox-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const userStore = useUserStore()
const milestoneStore = useMilestoneStore()

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
  { id: 'account', icon: 'kind-icon:person', label: 'Account' },
  { id: 'directory', icon: 'kind-icon:folder-tree', label: 'Directory' },
  { id: 'settings', icon: 'kind-icon:butterfly', label: 'Settings' },
] as const

const directoryLinks = [
  { to: '/artgallery', label: 'Art' },
  { to: '/bots', label: 'Bots' },
  { to: '/pitches', label: 'Pitches' },
  { to: '/stories', label: 'Stories' },
  { to: '/wonderlab', label: 'Wonderlab' },
  { to: '/dominions', label: 'Dominion Generator' },
  { to: '/forum', label: 'Forum' },
  { to: '/memory', label: 'Memory' },
  { to: '/characters', label: 'Characters' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/icons', label: 'Icons' },
]
</script>
