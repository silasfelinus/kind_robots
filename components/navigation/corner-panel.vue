<!-- /components/content/navigation/corner-panel.vue -->
<template>
  <!-- Root: isolated stacking above header layers -->
  <div ref="panelRef" class="relative z-[80]">
    <!-- Toggle row -->
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
            :ref="(el) => setTriggerRef(item.id, el as HTMLElement)"
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
      </div>
    </div>
  </div>

  <!-- Floating submenu rendered to <body> so it won't be clipped -->
  <Teleport to="body">
    <div
      v-if="activePanel"
      class="fixed z-[95] pointer-events-none"
      :style="{ top: `${floatPos.top}px`, right: `${floatPos.right}px` }"
    >
      <div
        :ref="setFloatPanelRef"
        class="pointer-events-auto bg-base-100 shadow-lg rounded-xl p-3 text-sm space-y-2
               w-[16rem] max-w-[min(90vw,24rem)]"
        role="dialog"
        :aria-labelledby="`panel-${activePanel}`"
        @click.stop
      >
        <!-- Tokens Panel -->
        <template v-if="activePanel === 'tokens'">
          <div class="font-bold">🧪 Mana: {{ userStore.user?.mana ?? 0 }}</div>
          <p class="text-xs text-base-content/70">
            Role: {{ userStore.user?.Role || 'Guest' }}
          </p>
          <NuxtLink to="/subscriptions" class="block hover:underline" @click="closeAfterRoute">
            💳 Manage Subscription
          </NuxtLink>
          <NuxtLink to="/credits" class="block hover:underline" @click="closeAfterRoute">
            ⚡ Boost Mana Credits
          </NuxtLink>
        </template>

        <!-- Account Panel -->
        <template v-else-if="activePanel === 'account'">
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
            <NuxtLink to="/dashboard"  class="block hover:underline" @click="closeAfterRoute">📂 Dashboard</NuxtLink>
            <NuxtLink to="/themes"     class="block hover:underline" @click="closeAfterRoute">🎨 Themes</NuxtLink>
            <NuxtLink to="/milestones" class="block hover:underline" @click="closeAfterRoute">🏆 Milestones</NuxtLink>
            <NuxtLink to="/inbox"      class="block hover:underline" @click="closeAfterRoute">📬 Inbox</NuxtLink>
            <NuxtLink to="/addchat"    class="block hover:underline" @click="closeAfterRoute">➕ New Chat</NuxtLink>
            <button class="btn btn-xs btn-error mt-2 w-full" @click="logoutAndClose">🚪 Logout</button>
          </template>
          <template v-else>
            <NuxtLink to="/register" class="block hover:underline" @click="closeAfterRoute">✏️ Set Designer Name</NuxtLink>
            <NuxtLink to="/password" class="block hover:underline" @click="closeAfterRoute">🔒 Set Password</NuxtLink>
            <NuxtLink to="/register" class="block hover:underline" @click="closeAfterRoute">📝 Register</NuxtLink>
          </template>
        </template>

        <!-- Directory Panel -->
        <template v-else-if="activePanel === 'directory'">
          <div class="font-bold mb-2">📁 Site Map</div>
          <div class="flex flex-col gap-1">
            <NuxtLink to="/addart"     class="hover:underline" @click="closeAfterRoute">🖼️ Art</NuxtLink>
            <NuxtLink to="/bots"       class="hover:underline" @click="closeAfterRoute">🤖 Bots</NuxtLink>
            <NuxtLink to="/pitches"    class="hover:underline" @click="closeAfterRoute">🎤 Pitches</NuxtLink>
            <NuxtLink to="/stories"    class="hover:underline" @click="closeAfterRoute">📖 Stories</NuxtLink>
            <NuxtLink to="/wonderlab"  class="hover:underline" @click="closeAfterRoute">🧪 Wonderlab</NuxtLink>
            <NuxtLink to="/dominions"  class="hover:underline" @click="closeAfterRoute">🧪 Dominion Generator</NuxtLink>
            <NuxtLink to="/forum"      class="hover:underline" @click="closeAfterRoute">💬 Forum</NuxtLink>
            <NuxtLink to="/memory"     class="hover:underline" @click="closeAfterRoute">🧠 Memory</NuxtLink>
            <NuxtLink to="/characters" class="hover:underline" @click="closeAfterRoute">🧍 Characters</NuxtLink>
          </div>
        </template>

        <!-- Sources Panel -->
        <template v-else-if="activePanel === 'sources'">
          <div class="font-bold mb-1">📦 Modeller Sources</div>
          <div class="flex items-center gap-2">
            <input type="checkbox" class="checkbox" />
            <NuxtLink to="/artmodel-manager" class="hover:underline" @click="closeAfterRoute">🎨 Select Art Modeller</NuxtLink>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" class="checkbox" />
            <NuxtLink to="/textmodel-manager" class="hover:underline" @click="closeAfterRoute">📝 Select Text Modeller</NuxtLink>
          </div>
        </template>

        <!-- About Panel -->
        <template v-else-if="activePanel === 'about'">
          <div class="font-bold mb-1">ℹ️ Info</div>
          <NuxtLink to="/about"    class="block hover:underline" @click="closeAfterRoute">🌐 About</NuxtLink>
          <NuxtLink to="/sponsor"  class="block hover:underline" @click="closeAfterRoute">💖 Sponsors</NuxtLink>
          <NuxtLink to="/giftshop" class="block hover:underline" @click="closeAfterRoute">🛍️ Giftshop</NuxtLink>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const panelRef = ref<HTMLElement | null>(null)
const floatPanelRef = ref<HTMLElement | null>(null)
const activePanel = ref<string | null>(null)

const triggers = new Map<string, HTMLElement>()
const floatPos = ref({ top: 0, right: 0 })

function setTriggerRef(id: string, el: HTMLElement | null) {
  if (el) triggers.set(id, el)
  else triggers.delete(id)
}
function setFloatPanelRef(el: HTMLElement | null) {
  floatPanelRef.value = el
}

async function toggle(panel: string) {
  activePanel.value = activePanel.value === panel ? null : panel
  await nextTick()
  if (activePanel.value) positionFloating(activePanel.value)
}
function closePanel() {
  activePanel.value = null
}

/** Close AFTER the router consumes the click **/
function closeAfterRoute() {
  setTimeout(() => closePanel(), 0)
}
function logoutAndClose() {
  userStore.logout()
  closePanel()
}

function positionFloating(id: string) {
  const el = triggers.get(id)
  if (!el) return
  const rect = el.getBoundingClientRect()
  const gap = 8 // px below the button
  // Align panel's right edge to button's right edge
  floatPos.value = {
    top: Math.round(rect.bottom + gap),
    right: Math.round(window.innerWidth - rect.right),
  }
}

function onWindowScrollOrResize() {
  if (activePanel.value) positionFloating(activePanel.value)
}

/** Outside interactions (capture) */
function handlePointerDownCapture(e: PointerEvent) {
  const root = panelRef.value
  const floatRoot = floatPanelRef.value
  if (!root) return
  const t = e.target as Node
  // If press started inside any relevant area, ignore
  if ((root && root.contains(t)) || (floatRoot && floatRoot.contains(t))) return
  closePanel()
}
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePanel()
}

onMounted(() => {
  window.addEventListener('pointerdown', handlePointerDownCapture, true)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', onWindowScrollOrResize, true)
  window.addEventListener('resize', onWindowScrollOrResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handlePointerDownCapture, true)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', onWindowScrollOrResize, true)
  window.removeEventListener('resize', onWindowScrollOrResize)
})

const menuItems = [
  { id: 'tokens',    icon: 'kind-icon:mana-potion', tooltip: `${userStore.user?.mana ?? 0} Mana` },
  { id: 'account',   icon: 'kind-icon:person',      tooltip: userStore.user?.designerName || 'Account' },
  { id: 'directory', icon: 'kind-icon:folder-tree', tooltip: 'Site Map' },
  { id: 'sources',   icon: 'kind-icon:butterfly',   tooltip: 'Modeller Sources' },
  { id: 'about',     icon: 'kind-icon:info-circle', tooltip: 'About / Sponsors' },
]
</script>

<style scoped>
.tooltip {
  font-family: 'Chicago', sans-serif;
  font-size: 0.75rem;
}
</style>
