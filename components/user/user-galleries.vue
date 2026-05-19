<!-- /components/content/user/user-galleries.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4">
      <h2 class="text-xl font-black">User Galleries</h2>
      <p class="text-sm text-base-content/60">
        Records where <span class="font-bold">userId</span> matches this
        profile. Each model gets one row.
      </p>
    </header>

    <div
      v-if="!activeUserId"
      class="flex min-h-48 flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
    >
      <div>
        <p class="text-lg font-black">No user selected.</p>
        <p class="mt-1 text-sm text-base-content/60">
          The shelves are waiting for an owner.
        </p>
      </div>
    </div>

    <div v-else class="min-h-0 flex-1 overflow-y-auto pr-1">
      <div class="flex flex-col gap-3">
        <article
          v-for="section in userOwnedSections"
          :key="section.key"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div
            class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
              >
                <Icon :name="section.icon" class="h-5 w-5 text-primary" />
              </div>

              <div class="min-w-0">
                <h3 class="truncate font-black">
                  {{ section.label }}
                </h3>

                <p class="text-xs text-base-content/60">
                  {{ section.items.length }}
                  {{
                    section.items.length === 1
                      ? 'matching item'
                      : 'matching items'
                  }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <NuxtLink
                :to="section.to"
                class="btn btn-ghost btn-xs rounded-xl"
              >
                <Icon name="kind-icon:external-link" class="h-4 w-4" />
                Open {{ section.label }}
              </NuxtLink>

              <button
                type="button"
                class="btn btn-xs rounded-xl"
                :class="
                  expandedSections[section.key] ? 'btn-primary' : 'btn-ghost'
                "
                :disabled="section.items.length === 0"
                @click="toggleSection(section.key)"
              >
                <Icon
                  :name="
                    expandedSections[section.key]
                      ? 'kind-icon:chevron-up'
                      : 'kind-icon:chevron-down'
                  "
                  class="h-4 w-4"
                />
                {{
                  expandedSections[section.key] ? 'Hide inline' : 'Show inline'
                }}
              </button>
            </div>
          </div>

          <div
            v-if="expandedSections[section.key]"
            class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-bold">
                Inline {{ section.label }} preview
              </p>

              <div class="join">
                <button
                  type="button"
                  class="btn join-item btn-xs"
                  :class="
                    sectionDisplayModes[section.key] === 'list'
                      ? 'btn-secondary'
                      : 'btn-ghost'
                  "
                  @click="setSectionDisplayMode(section.key, 'list')"
                >
                  List
                </button>

                <button
                  type="button"
                  class="btn join-item btn-xs"
                  :class="
                    sectionDisplayModes[section.key] === 'gallery'
                      ? 'btn-secondary'
                      : 'btn-ghost'
                  "
                  @click="setSectionDisplayMode(section.key, 'gallery')"
                >
                  Gallery
                </button>
              </div>
            </div>

            <component
              :is="section.galleryComponent"
              v-if="sectionDisplayModes[section.key] === 'gallery'"
              class="max-h-136 min-h-0 overflow-auto rounded-2xl border border-base-300 bg-base-100 p-2"
            />

            <div
              v-else
              class="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pr-1"
            >
              <div
                v-for="item in section.items"
                :key="`${section.key}-${item.id}`"
                class="rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-black">
                      {{ getItemTitle(item) }}
                    </p>

                    <p class="text-xs text-base-content/60">ID {{ item.id }}</p>
                  </div>

                  <span
                    v-if="getItemVisibility(item)"
                    class="badge badge-outline badge-xs"
                  >
                    {{ getItemVisibility(item) }}
                  </span>
                </div>

                <p
                  v-if="getItemSummary(item)"
                  class="mt-2 line-clamp-3 text-xs text-base-content/70"
                >
                  {{ getItemSummary(item) }}
                </p>
              </div>

              <div
                v-if="section.items.length === 0"
                class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center"
              >
                <p class="font-black">No {{ section.label }} yet.</p>
                <p class="mt-1 text-sm text-base-content/60">
                  Suspiciously tidy. Possibly goblin-cleaned.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/user/user-galleries.vue
import { computed, onMounted, reactive, resolveComponent, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useRewardStore } from '@/stores/rewardStore'

type SectionKey =
  | 'dreams'
  | 'art'
  | 'bots'
  | 'characters'
  | 'scenarios'
  | 'rewards'

type SectionDisplayMode = 'list' | 'gallery'

type UserOwnedItem = {
  id: number
  userId?: number | null
  title?: string | null
  name?: string | null
  label?: string | null
  username?: string | null
  description?: string | null
  subtitle?: string | null
  pitch?: string | null
  intro?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
}

type UserOwnedSection = {
  key: SectionKey
  label: string
  icon: string
  to: string
  galleryComponent: string | ReturnType<typeof resolveComponent>
  items: UserOwnedItem[]
}

const userStore = useUserStore()
const artStore = useArtStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const scenarioStore = useScenarioStore()
const rewardStore = useRewardStore()

const galleryComponents = {
  dreams: resolveComponent('DreamGallery'),
  art: resolveComponent('ArtGallery'),
  bots: resolveComponent('BotGallery'),
  characters: resolveComponent('CharacterGallery'),
  scenarios: resolveComponent('ScenarioGallery'),
  rewards: resolveComponent('RewardGallery'),
}

const expandedSections = reactive<Record<SectionKey, boolean>>({
  dreams: false,
  art: false,
  bots: false,
  characters: false,
  scenarios: false,
  rewards: false,
})

const sectionDisplayModes = reactive<Record<SectionKey, SectionDisplayMode>>({
  dreams: 'list',
  art: 'list',
  bots: 'list',
  characters: 'list',
  scenarios: 'list',
  rewards: 'list',
})

const activeUserId = computed(() => userStore.user?.id ?? null)

const artItems = computed(() => {
  return getUserOwnedItems(
    getStoreArray(artStore, ['artImages', 'safeArtImages', 'images']),
  )
})
const botItems = computed(() => {
  return getUserOwnedItems(getStoreArray(botStore, ['bots', 'botList']))
})

const characterItems = computed(() => {
  return getUserOwnedItems(
    getStoreArray(characterStore, ['characters', 'characterList']),
  )
})

const dreamItems = computed(() => {
  return getUserOwnedItems(getStoreArray(dreamStore, ['dreams', 'dreamList']))
})

const scenarioItems = computed(() => {
  return getUserOwnedItems(
    getStoreArray(scenarioStore, ['scenarios', 'scenarioList']),
  )
})

const rewardItems = computed(() => {
  return getUserOwnedItems(
    getStoreArray(rewardStore, ['rewards', 'rewardList']),
  )
})

const userOwnedSections = computed<UserOwnedSection[]>(() => {
  return [
    {
      key: 'dreams',
      label: 'Dreams',
      icon: 'kind-icon:sparkles',
      to: '/dreams',
      galleryComponent: galleryComponents.dreams,
      items: dreamItems.value,
    },
    {
      key: 'art',
      label: 'Art',
      icon: 'kind-icon:palette',
      to: '/art',
      galleryComponent: galleryComponents.art,
      items: artItems.value,
    },
    {
      key: 'bots',
      label: 'Bots',
      icon: 'kind-icon:bot',
      to: '/bots',
      galleryComponent: galleryComponents.bots,
      items: botItems.value,
    },
    {
      key: 'characters',
      label: 'Characters',
      icon: 'kind-icon:users',
      to: '/characters',
      galleryComponent: galleryComponents.characters,
      items: characterItems.value,
    },
    {
      key: 'scenarios',
      label: 'Scenarios',
      icon: 'kind-icon:map',
      to: '/scenarios',
      galleryComponent: galleryComponents.scenarios,
      items: scenarioItems.value,
    },
    {
      key: 'rewards',
      label: 'Rewards',
      icon: 'kind-icon:gift',
      to: '/rewards',
      galleryComponent: galleryComponents.rewards,
      items: rewardItems.value,
    },
  ]
})

function toggleSection(key: SectionKey) {
  expandedSections[key] = !expandedSections[key]
}

function setSectionDisplayMode(key: SectionKey, mode: SectionDisplayMode) {
  sectionDisplayModes[key] = mode
}

function getStoreArray(store: unknown, keys: string[]): unknown[] {
  const source = store as Record<string, unknown>

  for (const key of keys) {
    const value = source[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function getUserOwnedItems(source: unknown[] | undefined): UserOwnedItem[] {
  if (!source || !activeUserId.value) {
    return []
  }

  return source
    .filter((item): item is UserOwnedItem => {
      return isUserOwnedItem(item) && item.userId === activeUserId.value
    })
    .sort((a, b) => b.id - a.id)
}

function isUserOwnedItem(value: unknown): value is UserOwnedItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Partial<UserOwnedItem>

  return typeof item.id === 'number'
}

function getItemTitle(item: UserOwnedItem): string {
  return (
    item.title || item.name || item.label || item.username || `Item #${item.id}`
  )
}

function getItemSummary(item: UserOwnedItem): string {
  return item.description || item.subtitle || item.pitch || item.intro || ''
}

function getItemVisibility(item: UserOwnedItem): string {
  if (item.isMature) return 'Mature'
  if (item.isPublic) return 'Public'

  return ''
}

async function callStoreMethod(
  store: unknown,
  methodNames: string[],
): Promise<void> {
  const target = store as Record<string, unknown>

  for (const methodName of methodNames) {
    const method = target[methodName]

    if (typeof method === 'function') {
      await method.call(store)
      return
    }
  }
}

async function initializeUserOwnedGalleries(): Promise<void> {
  if (!activeUserId.value) return

  await Promise.allSettled([
    callStoreMethod(artStore, ['initialize', 'fetchAllArt', 'fetchArt']),
    callStoreMethod(botStore, ['initialize', 'fetchBots']),
    callStoreMethod(characterStore, ['initialize', 'fetchCharacters']),
    callStoreMethod(dreamStore, ['initialize', 'fetchDreams']),
    callStoreMethod(scenarioStore, ['initialize', 'fetchScenarios']),
    callStoreMethod(rewardStore, ['initialize', 'fetchRewards']),
  ])
}

watch(
  () => activeUserId.value,
  async () => {
    await initializeUserOwnedGalleries()
  },
  { immediate: true },
)

onMounted(initializeUserOwnedGalleries)
</script>
