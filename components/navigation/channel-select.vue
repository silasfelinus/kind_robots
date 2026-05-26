<!-- /components/content/navigation/channel-select.vue -->
<template>
  <div ref="menuRef" class="relative">
    <button
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

    <Transition name="fade-up">
      <div
        v-if="showMenu"
        class="absolute right-0 top-full z-50 mt-2 w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
      >
        <div
          class="flex items-center justify-between gap-3 border-b border-base-300 bg-base-200/60 p-3"
        >
          <div class="flex items-center gap-2">
            <NuxtLink
              v-for="utility in utilityChannels"
              :key="utility.key"
              :to="utility.path"
              class="group flex h-11 w-11 items-center justify-center rounded-2xl border text-base-content transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-sm"
              :class="
                isChannelActive(utility)
                  ? 'border-primary bg-primary text-primary-content shadow-sm'
                  : 'border-base-300 bg-base-100'
              "
              :title="utility.label"
              :aria-label="utility.label"
              @click="closeMenu"
            >
              <Icon
                :name="utility.icon"
                class="h-5 w-5 transition-transform group-hover:scale-110"
              />
            </NuxtLink>
          </div>

          <div class="min-w-0 flex-1 text-right">
            <p
              class="truncate text-[0.6rem] font-black uppercase tracking-[0.22em] text-base-content/40"
            >
              Explore
            </p>
            <p class="truncate text-sm font-bold text-base-content">
              {{ activeChannel.label }}
            </p>
          </div>

          <button
            class="btn btn-xs btn-ghost rounded-xl"
            type="button"
            title="Close"
            @click="closeMenu"
          >
            <Icon name="kind-icon:close" class="h-4 w-4" />
          </button>
        </div>

        <div class="max-h-[65vh] space-y-3 overflow-y-auto p-3">
          <section
            v-for="group in channelGroups"
            :key="group.key"
            class="rounded-2xl border border-base-300 bg-base-200/40 p-3"
          >
            <div class="mb-3 flex items-start gap-2">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content"
              >
                <Icon :name="group.icon" class="h-5 w-5" />
              </span>

              <div class="min-w-0">
                <h3 class="text-sm font-black text-base-content">
                  {{ group.label }}
                </h3>
                <p class="text-xs leading-snug text-base-content/55">
                  {{ group.summary }}
                </p>
              </div>
            </div>

            <div
              class="grid gap-2"
              :class="
                group.variant === 'compact'
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2'
              "
            >
              <NuxtLink
                v-for="channel in group.channels"
                :key="channel.key"
                :to="channel.path"
                class="group flex min-w-0 rounded-2xl border transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-sm"
                :class="[
                  isChannelActive(channel)
                    ? 'border-primary bg-primary text-primary-content shadow-sm'
                    : 'border-base-300 bg-base-100 text-base-content',
                  group.variant === 'compact'
                    ? 'items-center gap-2 p-2'
                    : 'items-start gap-3 p-3',
                ]"
                @click="closeMenu"
              >
                <span
                  class="flex shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-110"
                  :class="[
                    isChannelActive(channel)
                      ? 'border-primary-content/30 bg-primary-content/20 text-primary-content'
                      : 'border-base-300 bg-base-200 text-base-content',
                    group.variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10',
                  ]"
                >
                  <Icon
                    :name="channel.icon"
                    :class="group.variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'"
                  />
                </span>

                <span class="min-w-0">
                  <span
                    class="block truncate font-black"
                    :class="group.variant === 'compact' ? 'text-xs' : 'text-sm'"
                  >
                    {{ channel.label }}
                  </span>
                  <span
                    v-if="group.variant !== 'compact' && channel.summary"
                    class="mt-0.5 line-clamp-2 block text-xs leading-snug opacity-70"
                  >
                    {{ channel.summary }}
                  </span>
                </span>
              </NuxtLink>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

type ChannelRoute = {
  key: string
  label: string
  path: string
  icon: string
  summary?: string
}

type ChannelGroup = {
  key: string
  label: string
  summary: string
  icon: string
  variant: 'cards' | 'compact'
  channels: ChannelRoute[]
}

const route = useRoute()

const showMenu = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const utilityChannels: ChannelRoute[] = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
    icon: 'kind-icon:home',
  },
  {
    key: 'themes',
    label: 'Themes',
    path: '/themes',
    icon: 'kind-icon:paintbrush',
  },
]

const projectChannels: ChannelRoute[] = [
  {
    key: 'builder',
    label: 'Builder',
    path: '/builder',
    icon: 'kind-icon:blueprint',
    summary: 'Assemble pages, systems, tools, and weird useful machinery.',
  },
  {
    key: 'lab',
    label: 'Lab',
    path: '/wonderlab',
    icon: 'kind-icon:foundry',
    summary:
      'Experiment, test reactions, and let the robots touch the shiny buttons.',
  },
  {
    key: 'brainstorm',
    label: 'Brainstorm',
    path: '/brainstorm',
    icon: 'kind-icon:brain',
    summary: 'Catch loose ideas before they escape into the walls.',
  },
  {
    key: 'bots',
    label: 'Bots',
    path: '/bots',
    icon: 'kind-icon:robot-color',
    summary:
      'Build personalities, assistants, gremlins, and conversational accomplices.',
  },
]

const storyChannels: ChannelRoute[] = [
  {
    key: 'stories',
    label: 'Stories',
    path: '/stories',
    icon: 'kind-icon:story',
    summary:
      'Bring characters, places, treasures, and art into one narrative space.',
  },
  {
    key: 'art',
    label: 'Art',
    path: '/art',
    icon: 'kind-icon:palette',
  },
  {
    key: 'dreams',
    label: 'Locations',
    path: '/dreams',
    icon: 'kind-icon:moon',
  },
  {
    key: 'rewards',
    label: 'Rewards',
    path: '/rewards',
    icon: 'kind-icon:trophy',
  },
  {
    key: 'characters',
    label: 'Characters',
    path: '/characters',
    icon: 'kind-icon:mask',
  },
]

const channelGroups: ChannelGroup[] = [
  {
    key: 'projects',
    label: 'Projects',
    summary: 'The workbench: build, test, brainstorm, and manage bots.',
    icon: 'kind-icon:toolbox',
    variant: 'cards',
    channels: projectChannels,
  },
  {
    key: 'stories',
    label: 'Stories',
    summary:
      'The worldbuilding stack: art, locations, rewards, and characters.',
    icon: 'kind-icon:story',
    variant: 'compact',
    channels: storyChannels,
  },
]

const allChannels = computed<ChannelRoute[]>(() => [
  ...utilityChannels,
  ...projectChannels,
  ...storyChannels,
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

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function closeMenu() {
  showMenu.value = false
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (menuRef.value?.contains(target)) return
  closeMenu()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
