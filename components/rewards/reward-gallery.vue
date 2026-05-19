<!-- /components/content/rewards/reward-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p
            v-if="rewardStore.selectedReward"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ selectedRewardTitle }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span v-if="!isLoading" class="badge badge-ghost">
            {{ filteredRewards.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingReward"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading"
            @click="refreshRewards(true)"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div
        v-if="showControls && !isDropdownMode"
        class="grid grid-cols-1 gap-2 lg:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]"
      >
        <label
          v-if="userStore.isAdmin"
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <span class="label-text font-bold">Show Mature</span>

          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-accent toggle-sm"
          />
        </label>

        <select
          v-model="selectedCollection"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter rewards by collection"
        >
          <option value="all">All collections</option>

          <option
            v-for="collection in collections"
            :key="collection"
            :value="collection"
          >
            {{ collection }}
          </option>
        </select>

        <select
          v-model="selectedRarity"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter rewards by rarity"
        >
          <option value="all">All rarities</option>

          <option v-for="rarity in rarities" :key="rarity" :value="rarity">
            {{ rarity }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search rewards"
          placeholder="Search rewards..."
          class="input input-bordered input-sm w-full bg-base-100"
        />

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!rewardStore.selectedReward"
          @click="clearSelectedReward"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showRewardForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ formTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ formSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeRewardForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

      <add-reward :mode="formMode" @saved="handleRewardSaved" />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="rewardStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ rewardStore.error }}
        </p>
      </div>

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon :name="selectedRewardIcon" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Reward
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedRewardTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedRewardSubtitle }}
                </p>
              </div>
            </div>

            <button
              v-if="canEditSelected"
              class="btn btn-secondary btn-sm rounded-xl"
              type="button"
              @click="startEditingReward"
            >
              <Icon name="kind-icon:pencil" class="h-4 w-4" />
              <span class="hidden sm:inline">Edit</span>
            </button>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
            :value="rewardStore.selectedReward?.id ?? ''"
            aria-label="Select reward"
            @change="selectRewardFromEvent"
          >
            <option value="">Choose a reward</option>

            <option
              v-for="reward in filteredRewards"
              :key="reward.id"
              :value="reward.id"
            >
              {{ getRewardTitle(reward) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Reward</option>
          </select>

          <div
            v-if="rewardStore.selectedReward"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedRewardDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="rewardStore.selectedReward.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="rewardStore.selectedReward.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span class="badge badge-outline badge-sm">
                {{ rewardStore.selectedReward.rarity }}
              </span>

              <span
                v-if="rewardStore.selectedReward.collection"
                class="badge badge-secondary badge-sm"
              >
                {{ rewardStore.selectedReward.collection }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredRewards.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:gift" class="h-10 w-10" />

        <p class="text-lg font-bold">No rewards found.</p>

        <p class="max-w-xl text-sm opacity-70">
          No public or owned rewards match this gallery.
        </p>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingReward"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Reward
        </button>
      </div>

      <div v-else :class="layoutClass">
        <reward-card
          v-for="reward in filteredRewards"
          :key="reward.id"
          :reward="reward"
          :selected="rewardStore.selectedReward?.id === reward.id"
          :show-image="showImages"
          :compact="isCompact"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          @select="selectReward"
          @edit="startEditingRewardById"
          @delete="handleRewardDeleted"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import { useRewardStore } from '@/stores/rewardStore'
import type { Rarity } from '@/stores/rewardStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showHeader?: boolean
    showImages?: boolean
    showControls?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Rewards',
    subtitle: 'Pick a story item, boon, curse, artifact, or plot grenade.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const rewardStore = useRewardStore()
const userStore = useUserStore()

const selectedCollection = ref<string>('all')
const selectedRarity = ref<Rarity | 'all'>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showRewardForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const rarityOrder: Record<Rarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
}

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'reward-row' : 'reward-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return

    await userStore.updateUser({ showMature: value })
  },
})

const selectedReward = computed(() => {
  return rewardStore.selectedReward
})

const selectedRewardTitle = computed(() => {
  return selectedReward.value
    ? getRewardTitle(selectedReward.value)
    : 'No reward selected'
})

const selectedRewardSubtitle = computed(() => {
  const reward = selectedReward.value

  if (!reward) return 'Choose a reward or add a new one.'

  return reward.collection || reward.power || reward.text || 'Reward selected.'
})

const selectedRewardDescription = computed(() => {
  const reward = selectedReward.value

  if (!reward) return 'No reward selected.'

  return (
    reward.power ||
    reward.text ||
    reward.collection ||
    'No reward description yet.'
  )
})

const selectedRewardIcon = computed(() => {
  return selectedReward.value?.icon || 'kind-icon:gift'
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Reward' : 'Add Reward'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this reward before it detonates the narrative.'
    : 'Create a new story item, boon, curse, artifact, or plot grenade.'
})

const canEditSelected = computed(() => {
  const reward = selectedReward.value

  if (!props.allowEdit || !reward?.id) return false
  if (userStore.isAdmin) return true

  return reward.userId === currentUserId.value
})

const galleryRewards = computed<Reward[]>(() => {
  let rewards = rewardStore.rewards

  if (!userStore.isAdmin) {
    rewards = rewards.filter((reward) => {
      return reward.isPublic || reward.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    rewards = rewards.filter((reward) => !reward.isMature)
  }

  return rewards
})

const visibleRewards = computed<Reward[]>(() => {
  return galleryRewards.value
})

const collections = computed(() => {
  const set = new Set<string>()

  for (const reward of visibleRewards.value) {
    const collection = reward.collection?.trim()

    if (collection) {
      set.add(collection)
    }
  }

  return Array.from(set).sort()
})

const rarities = computed(() => {
  const set = new Set<Rarity>()

  for (const reward of visibleRewards.value) {
    if (reward.rarity) {
      set.add(reward.rarity)
    }
  }

  return Array.from(set).sort((a, b) => {
    return rarityOrder[a] - rarityOrder[b]
  })
})

const filteredRewards = computed<Reward[]>(() => {
  let rewards = visibleRewards.value

  if (selectedCollection.value !== 'all') {
    rewards = rewards.filter((reward) => {
      return reward.collection === selectedCollection.value
    })
  }

  if (selectedRarity.value !== 'all') {
    rewards = rewards.filter((reward) => {
      return reward.rarity === selectedRarity.value
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    rewards = rewards.filter((reward) => {
      return (
        (reward.text || '').toLowerCase().includes(query) ||
        (reward.power || '').toLowerCase().includes(query) ||
        (reward.collection || '').toLowerCase().includes(query) ||
        (reward.label || '').toLowerCase().includes(query) ||
        (reward.artPrompt || '').toLowerCase().includes(query)
      )
    })
  }

  return rewards
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshRewards()
  }
})

function getRewardTitle(reward: Reward) {
  return reward.label || reward.text || reward.power || `Reward #${reward.id}`
}

async function refreshRewards(force = false) {
  isLoading.value = true

  try {
    await rewardStore.initialize({
      force,
      fetchRemote: true,
    })
  } finally {
    isLoading.value = false
  }
}

async function selectReward(id: number) {
  await rewardStore.selectReward(id)
}

function selectRewardFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingReward()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedReward()
    return
  }

  void selectReward(id)
}

function startAddingReward() {
  rewardStore.startAddingReward()
  formMode.value = 'add'
  showRewardForm.value = true
}

async function startEditingReward() {
  const id = rewardStore.selectedReward?.id

  if (!id) return

  await startEditingRewardById(id)
}

async function startEditingRewardById(id: number) {
  const reward = await rewardStore.startEditingReward(id)

  if (!reward) return

  formMode.value = 'edit'
  showRewardForm.value = true
}

function clearSelectedReward() {
  rewardStore.deselectReward()
  showRewardForm.value = false
}

function closeRewardForm() {
  showRewardForm.value = false
}

async function handleRewardSaved() {
  showRewardForm.value = false
  await refreshRewards(true)
}

function handleRewardDeleted(id: number) {
  if (rewardStore.selectedReward?.id === id) {
    rewardStore.deselectReward()
  }
}
</script>

<style scoped>
.reward-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 1rem;
}

.reward-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.reward-row > * {
  min-width: min(240px, 85vw);
  max-width: 340px;
}
</style>
