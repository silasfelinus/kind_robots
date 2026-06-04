<!-- /components/content/navigation/channel-select.vue -->
<template>
  <div ref="menuRef" class="relative">
    <button
      ref="buttonRef"
      class="btn btn-sm rounded-xl"
      :class="
        showMenu
          ? 'btn-secondary'
          : 'btn-ghost border border-base-300 bg-base-100'
      "
      type="button"
      :aria-expanded="showMenu"
      :title="`Explore: ${activeChannel.label}`"
      @click.stop="toggleMenu"
    >
      <Icon :name="activeChannel.icon" class="h-4 w-4 shrink-0" />
      <Icon
        :name="showMenu ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
        class="h-3.5 w-3.5 opacity-50"
      />
    </button>

    <Teleport to="body">
      <Transition name="fade-up">
        <div
          v-if="showMenu"
          ref="panelRef"
          class="fixed z-90 max-h-[min(34rem,calc(100vh-1rem))] w-[calc(100vw-1rem)] max-w-104 overflow-y-auto overflow-x-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
          :style="menuStyle"
          @click.stop
        >
          <div
            class="flex items-center gap-2 border-b border-base-300 bg-base-200/60 px-3 py-2"
          >
            <NuxtLink
              :to="homeChannel.path"
              class="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-sm"
              :class="
                isChannelActive(homeChannel)
                  ? 'border-primary bg-primary text-primary-content shadow-sm'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              :title="homeChannel.label"
              @click="closeMenu"
            >
              <Icon
                :name="homeChannel.icon"
                class="h-4 w-4 transition-transform group-hover:scale-110"
              />
            </NuxtLink>

            <div class="flex min-w-0 flex-1 flex-col items-center">
              <p
                class="text-[0.55rem] font-black uppercase tracking-[0.22em] text-base-content/40"
              >
                Explore
              </p>
              <p class="truncate text-sm font-bold text-base-content">
                {{ activeChannel.label }}
              </p>
            </div>

            <NuxtLink
              :to="sanctuaryChannel.path"
              class="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content hover:shadow-sm"
              :class="
                isChannelActive(sanctuaryChannel)
                  ? 'border-secondary bg-secondary text-secondary-content shadow-sm'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              :title="sanctuaryChannel.label"
              @click="closeMenu"
            >
              <Icon
                :name="sanctuaryChannel.icon"
                class="h-4 w-4 transition-transform group-hover:scale-110"
              />
            </NuxtLink>
          </div>

          <div class="space-y-3 p-3">
            <div class="grid grid-cols-3 gap-1.5">
              <NuxtLink
                :to="artChannel.path"
                class="group relative flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content hover:shadow-md"
                :class="
                  isChannelActive(artChannel)
                    ? 'border-secondary bg-secondary text-secondary-content shadow-sm'
                    : 'border-base-300 bg-linear-to-b from-base-100 to-base-200/60 text-base-content'
                "
                @click="closeMenu"
              >
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all group-hover:scale-110"
                  :class="
                    isChannelActive(artChannel)
                      ? 'border-secondary-content/30 bg-secondary-content/20 text-secondary-content'
                      : 'border-base-300 bg-base-100 text-base-content'
                  "
                >
                  <Icon :name="artChannel.icon" class="h-5 w-5" />
                </span>

                <span class="text-sm font-black">
                  {{ artChannel.label }}
                </span>

                <span
                  v-if="artChannel.summary"
                  class="px-1 text-center text-[0.58rem] leading-snug opacity-40 transition-opacity group-hover:opacity-100"
                >
                  {{ artChannel.summary }}
                </span>
              </NuxtLink>

              <NuxtLink
                :to="builderChannel.path"
                class="group relative flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-md"
                :class="
                  isChannelActive(builderChannel)
                    ? 'border-primary bg-primary text-primary-content shadow-sm'
                    : 'border-base-300 bg-linear-to-b from-base-100 to-base-200/60 text-base-content'
                "
                @click="closeMenu"
              >
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all group-hover:scale-110"
                  :class="
                    isChannelActive(builderChannel)
                      ? 'border-primary-content/30 bg-primary-content/20 text-primary-content'
                      : 'border-base-300 bg-base-100 text-base-content'
                  "
                >
                  <Icon :name="builderChannel.icon" class="h-5 w-5" />
                </span>

                <span class="text-sm font-black">
                  {{ builderChannel.label }}
                </span>

                <span
                  v-if="builderChannel.summary"
                  class="px-1 text-center text-[0.58rem] leading-snug opacity-40 transition-opacity group-hover:opacity-100"
                >
                  {{ builderChannel.summary }}
                </span>
              </NuxtLink>

              <NuxtLink
                :to="storiesChannel.path"
                class="group relative flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-accent-content hover:shadow-md"
                :class="
                  isChannelActive(storiesChannel)
                    ? 'border-accent bg-accent text-accent-content shadow-sm'
                    : 'border-base-300 bg-linear-to-b from-base-100 to-base-200/60 text-base-content'
                "
                @click="closeMenu"
              >
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all group-hover:scale-110"
                  :class="
                    isChannelActive(storiesChannel)
                      ? 'border-accent-content/30 bg-accent-content/20 text-accent-content'
                      : 'border-base-300 bg-base-100 text-base-content'
                  "
                >
                  <Icon :name="storiesChannel.icon" class="h-5 w-5" />
                </span>

                <span class="text-sm font-black">
                  {{ storiesChannel.label }}
                </span>

                <span
                  v-if="storiesChannel.summary"
                  class="px-1 text-center text-[0.58rem] leading-snug opacity-40 transition-opacity group-hover:opacity-100"
                >
                  {{ storiesChannel.summary }}
                </span>
              </NuxtLink>
            </div>

            <div>
              <p
                class="mb-1.5 px-0.5 text-[0.6rem] font-black uppercase tracking-widest text-base-content/40"
              >
                Projects
              </p>

              <div class="grid grid-cols-3 gap-1.5">
                <NuxtLink
                  v-for="channel in bottomProjectChannels"
                  :key="channel.key"
                  :to="channel.path"
                  class="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content hover:shadow-sm"
                  :class="
                    isChannelActive(channel)
                      ? 'border-secondary bg-secondary text-secondary-content shadow-sm'
                      : 'border-base-300 bg-base-100 text-base-content'
                  "
                  @click="closeMenu"
                >
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all group-hover:scale-110"
                    :class="
                      isChannelActive(channel)
                        ? 'border-secondary-content/30 bg-secondary-content/20 text-secondary-content'
                        : 'border-base-300 bg-base-200 text-base-content'
                    "
                  >
                    <Icon :name="channel.icon" class="h-4 w-4" />
                  </span>

                  <span
                    class="max-w-full truncate text-center text-[0.65rem] font-bold leading-none"
                  >
                    {{ channel.label }}
                  </span>

                  <span
                    v-if="channel.summary"
                    class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-secondary/95 px-2 text-center text-[0.6rem] leading-snug text-secondary-content opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {{ channel.summary }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type CSSProperties,
} from 'vue'
import { useRoute } from 'vue-router'

type ChannelRoute = {
  key: string
  label: string
  path: string
  icon: string
  summary?: string
}

const route = useRoute()

const showMenu = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const menuStyle = ref<CSSProperties>({
  left: '0.5rem',
  top: '3.5rem',
})

const homeChannel: ChannelRoute = {
  key: 'home',
  label: 'Home',
  path: '/',
  icon: 'kind-icon:home',
}

const sanctuaryChannel: ChannelRoute = {
  key: 'sanctuary',
  label: 'Sanctuary',
  path: '/sanctuary',
  icon: 'kind-icon:butterfly',
  summary: 'help us reach our goal to make the world a better place.',
}

const utilityChannels: ChannelRoute[] = [homeChannel, sanctuaryChannel]

const artChannel: ChannelRoute = {
  key: 'art',
  label: 'Art',
  path: '/art',
  icon: 'kind-icon:palette',
  summary: 'Generate and browse AI artwork.',
}

const builderChannel: ChannelRoute = {
  key: 'builder',
  label: 'Builder',
  path: '/builder',
  icon: 'kind-icon:blueprint',
  summary: 'Build easily with our step by step builder.',
}

const labChannel: ChannelRoute = {
  key: 'wonder',
  label: 'Lab',
  path: '/wonder',
  icon: 'kind-icon:foundry',
  summary: 'Peak behind the curtain at our wonderlab',
}

const storiesChannel: ChannelRoute = {
  key: 'stories',
  label: 'Stories',
  path: '/stories',
  icon: 'kind-icon:story',
  summary:
    'Bring characters, places, treasures, and art into one narrative space.',
}

const bottomProjectChannels: ChannelRoute[] = [
  {
    key: 'bots',
    label: 'Bots',
    path: '/bots',
    icon: 'kind-icon:robot-color',
    summary:
      'Build personalities, assistants, gremlins, and conversational accomplices.',
  },
  {
    key: 'rewards',
    label: 'Rewards',
    path: '/rewards',
    icon: 'kind-icon:trophy',
    summary: 'Earn and collect rewards for your creations.',
  },
  {
    key: 'dreams',
    label: 'Locations',
    path: '/dreams',
    icon: 'kind-icon:moon',
    summary: 'Explore imagined places and dreamscapes.',
  },
  {
    key: 'characters',
    label: 'Characters',
    path: '/characters',
    icon: 'kind-icon:mask',
    summary: 'Design and meet the cast of your world.',
  },
  {
    key: 'brainstorm',
    label: 'Brainstorm',
    path: '/brainstorm',
    icon: 'kind-icon:brain',
    summary: 'Catch loose ideas before they escape into the walls.',
  },
  {
    key: 'memory',
    label: 'Memory',
    path: '/wonderlab',
    icon: 'kind-icon:dungeon',
    summary:
      'Experiment, test reactions, and let the robots touch the shiny buttons.',
  },
]

const allChannels = computed<ChannelRoute[]>(() => [
  ...utilityChannels,
  artChannel,
  builderChannel,
  labChannel,
  storiesChannel,
  ...bottomProjectChannels,
])

const fallbackChannel: ChannelRoute = {
  key: 'home',
  label: 'Home',
  path: '/',
  icon: 'kind-icon:home',
}

const activeChannel = computed<ChannelRoute>(() => {
  return (
    allChannels.value.find((channel) => isChannelActive(channel)) ??
    fallbackChannel
  )
})

function isChannelActive(channel: ChannelRoute) {
  if (route.path === channel.path) return true
  return channel.path !== '/' && route.path.startsWith(`${channel.path}/`)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function updateMenuPosition() {
  const button = buttonRef.value
  if (!button) return

  const rect = button.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 8
  const menuWidth = Math.min(416, viewportWidth - margin * 2)
  const estimatedMenuHeight = Math.min(544, viewportHeight - margin * 2)

  const left = clamp(
    rect.right - menuWidth,
    margin,
    viewportWidth - menuWidth - margin,
  )

  const opensDown = rect.bottom + margin + estimatedMenuHeight <= viewportHeight

  menuStyle.value = opensDown
    ? {
        left: `${left}px`,
        top: `${rect.bottom + margin}px`,
      }
    : {
        left: `${left}px`,
        bottom: `${viewportHeight - rect.top + margin}px`,
      }
}

async function toggleMenu() {
  showMenu.value = !showMenu.value

  if (!showMenu.value) return

  await nextTick()
  updateMenuPosition()
}

function closeMenu() {
  showMenu.value = false
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (menuRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closeMenu()
}

function handleWindowChange() {
  if (!showMenu.value) return
  updateMenuPosition()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  closeMenu()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleWindowChange)
  window.addEventListener('scroll', handleWindowChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleWindowChange)
  window.removeEventListener('scroll', handleWindowChange, true)
})
</script>
