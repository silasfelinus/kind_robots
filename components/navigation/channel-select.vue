<!-- /components/content/navigation/channel-select.vue -->
<template>
  <div ref="menuRef" class="relative flex">
    <button
      ref="buttonRef"
      class="btn btn-sm flex h-9 min-h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-xl p-0 sm:h-full sm:w-full sm:min-w-0 sm:flex-1"
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
      <Icon :name="activeChannel.icon" class="h-6 w-6 shrink-0" />
    </button>

    <Teleport to="body">
      <Transition name="fade-up">
        <div
          v-if="showMenu"
          ref="panelRef"
          class="fixed z-110 max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-120 overflow-y-auto overflow-x-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
          :style="menuStyle"
          @click.stop
        >
          <div
            class="flex items-center gap-2 border-b border-base-300 bg-base-200/70 px-3 py-2"
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
                class="text-[0.55rem] font-black uppercase tracking-[0.24em] text-base-content/40"
              >
                Explore
              </p>
              <p class="truncate text-sm font-black text-base-content">
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

          <div class="space-y-3 p-2 sm:p-3">
            <section
              class="rounded-2xl border border-primary/30 bg-primary/10 p-2 sm:p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-2 px-1">
                <p
                  class="text-[0.6rem] font-black uppercase tracking-widest text-primary"
                >
                  Creation Tools
                </p>
                <p class="text-[0.58rem] font-bold text-base-content/45">
                  Lab · Builder · Art · Bots
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NuxtLink
                  v-for="channel in creationChannels"
                  :key="channel.key"
                  :to="channel.path"
                  class="group relative flex min-h-24 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border p-2 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-md sm:min-h-28"
                  :class="
                    isChannelActive(channel)
                      ? 'border-primary bg-primary text-primary-content shadow-sm'
                      : 'border-primary/20 bg-linear-to-b from-base-100 to-primary/5 text-base-content'
                  "
                  @click="closeMenu"
                >
                  <span
                    class="absolute inset-x-4 top-0 h-px bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100"
                  />

                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all group-hover:scale-110"
                    :class="
                      isChannelActive(channel)
                        ? 'border-primary-content/30 bg-primary-content/20 text-primary-content'
                        : 'border-primary/20 bg-base-100 text-primary'
                    "
                  >
                    <Icon :name="channel.icon" class="h-5 w-5" />
                  </span>

                  <span class="max-w-full truncate text-sm font-black">
                    {{ channel.label }}
                  </span>

                  <span
                    v-if="channel.summary"
                    class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/95 px-2 text-center text-[0.6rem] font-semibold leading-snug text-primary-content opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {{ channel.summary }}
                  </span>
                </NuxtLink>
              </div>
            </section>

            <section
              class="rounded-2xl border border-secondary/30 bg-secondary/10 p-2 sm:p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-2 px-1">
                <p
                  class="text-[0.6rem] font-black uppercase tracking-widest text-secondary"
                >
                  World Content
                </p>
                <p class="text-[0.58rem] font-bold text-base-content/45">
                  Rewards · Dreams · Characters · Scenarios
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NuxtLink
                  v-for="channel in worldChannels"
                  :key="channel.key"
                  :to="channel.path"
                  class="group relative flex min-h-24 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border p-2 text-center transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content hover:shadow-md sm:min-h-28"
                  :class="
                    isChannelActive(channel)
                      ? 'border-secondary bg-secondary text-secondary-content shadow-sm'
                      : 'border-secondary/20 bg-linear-to-b from-base-100 to-secondary/5 text-base-content'
                  "
                  @click="closeMenu"
                >
                  <span
                    class="absolute inset-x-4 top-0 h-px bg-secondary/40 opacity-0 transition-opacity group-hover:opacity-100"
                  />

                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all group-hover:scale-110"
                    :class="
                      isChannelActive(channel)
                        ? 'border-secondary-content/30 bg-secondary-content/20 text-secondary-content'
                        : 'border-secondary/20 bg-base-100 text-secondary'
                    "
                  >
                    <Icon :name="channel.icon" class="h-5 w-5" />
                  </span>

                  <span class="max-w-full truncate text-sm font-black">
                    {{ channel.label }}
                  </span>

                  <span
                    v-if="channel.summary"
                    class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-secondary/95 px-2 text-center text-[0.6rem] font-semibold leading-snug text-secondary-content opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {{ channel.summary }}
                  </span>
                </NuxtLink>
              </div>
            </section>
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
  summary: 'Help us reach our goal to make the world a better place.',
}

const utilityChannels: ChannelRoute[] = [homeChannel, sanctuaryChannel]

const labChannel: ChannelRoute = {
  key: 'lab',
  label: 'Lab',
  path: '/memory',
  icon: 'kind-icon:dungeon',
  summary: 'Explore behind the scenes, and play our match game.',
}

const builderChannel: ChannelRoute = {
  key: 'builder',
  label: 'Builder',
  path: '/builder',
  icon: 'kind-icon:blueprint',
  summary: 'Build easily with our step by step builder.',
}

const artChannel: ChannelRoute = {
  key: 'art',
  label: 'Art',
  path: '/art',
  icon: 'kind-icon:palette',
  summary: 'Generate and browse AI artwork.',
}

const botsChannel: ChannelRoute = {
  key: 'bots',
  label: 'Bots',
  path: '/bots',
  icon: 'kind-icon:robot-color',
  summary:
    'Build personalities, assistants, gremlins, and conversational accomplices.',
}

const rewardsChannel: ChannelRoute = {
  key: 'rewards',
  label: 'Rewards',
  path: '/rewards',
  icon: 'kind-icon:trophy',
  summary: 'Earn and collect rewards for your creations.',
}

const dreamsChannel: ChannelRoute = {
  key: 'dreams',
  label: 'Dreams',
  path: '/dreams',
  icon: 'kind-icon:moon',
  summary: 'Explore imagined places and dreamscapes.',
}

const charactersChannel: ChannelRoute = {
  key: 'characters',
  label: 'Characters',
  path: '/characters',
  icon: 'kind-icon:mask',
  summary: 'Design and meet the cast of your world.',
}

const scenariosChannel: ChannelRoute = {
  key: 'scenarios',
  label: 'Scenarios',
  path: '/scenarios',
  icon: 'kind-icon:story',
  summary: 'Create story situations, prompts, encounters, and playable scenes.',
}

const creationChannels: ChannelRoute[] = [
  labChannel,
  builderChannel,
  artChannel,
  botsChannel,
]

const worldChannels: ChannelRoute[] = [
  rewardsChannel,
  dreamsChannel,
  charactersChannel,
  scenariosChannel,
]

const allChannels = computed<ChannelRoute[]>(() => [
  ...utilityChannels,
  ...creationChannels,
  ...worldChannels,
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

function isChannelActive(channel: ChannelRoute): boolean {
  if (route.path === channel.path) return true
  return channel.path !== '/' && route.path.startsWith(`${channel.path}/`)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function updateMenuPosition(): void {
  const button = buttonRef.value
  if (!button) return

  const rect = button.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 8
  const menuWidth = Math.min(480, viewportWidth - margin * 2)
  const estimatedMenuHeight = Math.min(500, viewportHeight - margin * 2)

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

async function toggleMenu(): Promise<void> {
  showMenu.value = !showMenu.value

  if (!showMenu.value) return

  await nextTick()
  updateMenuPosition()
}

function closeMenu(): void {
  showMenu.value = false
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return
  if (menuRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closeMenu()
}

function handleWindowChange(): void {
  if (!showMenu.value) return
  updateMenuPosition()
}

function handleKeydown(event: KeyboardEvent): void {
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
