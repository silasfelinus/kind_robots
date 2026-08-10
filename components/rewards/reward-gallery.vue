<!-- /components/content/rewards/reward-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-base font-bold text-base-content">
            {{ title }}
          </h2>

          <div
            v-if="rewardStore.selectedReward"
            class="flex min-w-0 items-center gap-2"
          >
            <p class="truncate text-sm text-base-content/70">
              Selected:
              <span class="font-semibold text-primary">
                {{ selectedRewardTitle }}
              </span>
            </p>

            <button
              class="btn btn-primary btn-xs shrink-0 rounded-xl"
              type="button"
              @click="continueWithSelected"
            >
              <Icon name="kind-icon:story" class="h-3 w-3" />
              Continue
            </button>
          </div>

          <!-- Inline, not a second line. The subtitle is orientation text and
               was costing a full row of a 768px-tall screen; `hidden md:inline`
               drops it entirely where the room is tightest. -->
          <p v-else class="truncate text-sm text-base-content/60">
            <span class="hidden md:inline">{{ subtitle }}</span>
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

    <kr-card-flip
      v-model="infoRewardOpen"
      :label="infoReward?.name || 'Reward'"
    >
      <template #back="{ close, commit }">
        <kr-card-back
          v-if="infoReward"
          v-model:editing="infoRewardEditing"
          :title="infoReward.name || 'Unnamed Reward'"
          :subtitle="infoReward.collection || ''"
          :description="infoReward.description || ''"
          :source="infoReward"
          :art-src="infoReward.imagePath || ''"
          :badges="infoRewardBadges"
          :can-interact="true"
          interact-label="Encounter"
          @back="commit"
          @interact="interactWithInfoReward"
        >
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoReward.effect" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Effect</dt>
                <dd class="whitespace-pre-wrap">{{ infoReward.effect }}</dd>
              </div>
              <div v-if="infoReward.rarity">
                <dt class="font-black uppercase opacity-55">Rarity</dt>
                <dd>{{ infoReward.rarity }}</dd>
              </div>
              <div v-if="infoReward.rewardType">
                <dt class="font-black uppercase opacity-55">Type</dt>
                <dd>{{ infoReward.rewardType }}</dd>
              </div>
            </dl>
          </template>

          <!--
            REVIEWS LIVE ON THE BACK. Silas, 2026-08-10: "back: the rest of the
            info, image, those buttons, and the review section."

            They were not deleted, they were stranded -- reactable-card gates
            its reaction button on `props.selected`, and since the card back
            landed, clicking a tile sets the info id rather than the store's
            current record, so nothing in a grid is ever "selected". Exactly
            the same gate that hid edit/clone/delete.

            allowReviews is still honoured here: a record that opted out of
            reviews on the tile must not get them back on the back.
          -->
          <template #reviews>
            <reaction-card
              v-if="infoReward.allowReviews !== false"
              :target-id="infoReward.id"
              target-type="reward"
              reaction-category="REWARD"
              :target-title="infoReward.name || 'Unnamed Reward'"
              compact
            />
          </template>
        </kr-card-back>

        <div v-else class="p-6 text-center text-sm opacity-60">
          <p>That Reward is no longer available.</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-3 rounded-xl"
            @click="close"
          >
            Close
          </button>
        </div>
      </template>
    </kr-card-flip>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
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
        <div class="flex flex-col gap-3 kr-panel-flat p-3">
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

              <span v-else class="badge badge-ghost badge-sm">Private</span>

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
        class="flex h-full flex-col items-center justify-center gap-3 kr-panel-muted text-center text-base-content/60"
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

      <!-- Row stays bespoke: a horizontal filmstrip is not one of kr-gallery's
           cards/heroes/icons grids. -->
      <div v-else-if="isRowMode" :class="layoutClass">
        <reward-card
          v-for="reward in filteredRewards"
          :key="reward.id"
          :reward="reward"
          :selected="rewardStore.selectedReward?.id === reward.id"
          :earned-karma="earnedKarmaByRewardId[reward.id]"
          v-bind="rewardCardProps"
          @open="selectReward"
          @edit="startEditingRewardById"
          @delete="handleRewardDeleted"
        />
      </div>

      <!-- t-060: the shared shell owns the grid and the Cards/Heroes/Icons bar;
           reward-card stays the card. -->
      <kr-gallery
        v-else
        :items="galleryItems"
        :mode="galleryMode"
        empty-label="rewards"
        @update:mode="galleryMode = $event"
      >
        <template #toolbar>
          <!-- WRAP, do not stack. This was `grid grid-cols-1 ...
                 lg:grid-cols-[...]`, so below lg every control claimed a
                 full-width row of its own -- four filters became four rows on a
                 phone, which is most of why /rewards spent 54% of a 390px
                 viewport before its first card. flex-wrap puts as many on a
                 line as fit and only breaks when it must.

                 AND THE CHILDREN HAVE TO AGREE -- see the longer note on the
                 same block in bot-gallery.vue. A `w-full` child fills its line
                 and forces the next one to wrap, so the controls kept stacking
                 after the container was fixed; the search box had no responsive
                 escape at all and took a row of its own even on desktop. This
                 toolbar carries TWO selects rather than one, so it was paying
                 an extra row for it. -->
          <div
            v-if="showControls && !isDropdownMode"
            class="flex flex-wrap items-center gap-1.5"
          >
            <!-- `px-4 py-2` with a bold label made this the tallest thing on
                 the row and forced its height onto every neighbour. Same
                 control, sized like the selects beside it. -->
            <label
              v-if="userStore.isAdmin"
              class="flex cursor-pointer items-center gap-1.5 kr-panel-flat px-2 py-1"
            >
              <span class="text-xs font-bold">Mature</span>

              <input
                v-model="showMature"
                type="checkbox"
                class="toggle toggle-accent toggle-xs"
              />
            </label>

            <select
              v-model="selectedCollection"
              class="select select-bordered select-sm w-auto max-w-44 bg-base-100"
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
              class="select select-bordered select-sm w-auto max-w-44 bg-base-100"
              aria-label="Filter rewards by rarity"
            >
              <option value="all">All rarities</option>

              <option v-for="rarity in rarities" :key="rarity" :value="rarity">
                {{ rarity }}
              </option>
            </select>

            <!-- Icon until selected, per Silas 2026-08-10. Was `flex-1`, so it
                 claimed every pixel the rarity select and the buttons beside it
                 did not. -->
            <kr-search-field
              v-model="searchQuery"
              label="Search rewards"
              placeholder="Search rewards..."
            />

            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              :disabled="!rewardStore.selectedReward"
              @click="clearSelectedReward"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Clear
            </button>
          </div>
        </template>

        <template #item="{ item }">
          <reward-card
            v-if="rewardById.get(Number(item.id))"
            :reward="rewardById.get(Number(item.id))!"
            :selected="rewardStore.selectedReward?.id === item.id"
            :earned-karma="earnedKarmaByRewardId[Number(item.id)]"
            :variant="MODE_VARIANT[galleryMode]"
            v-bind="rewardCardProps"
            @open="selectReward"
            @edit="startEditingRewardById"
            @delete="handleRewardDeleted"
          />
        </template>
      </kr-gallery>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { MODE_VARIANT, type GalleryMode } from '@/utils/galleryVocabulary'
import { useRewardStore } from '@/stores/rewardStore'
import type { Rarity } from '@/stores/rewardStore'
import { useUserStore } from '@/stores/userStore'

// Earned karma comes from useEarnedKarma (t-066). This gallery wrote the first
// copy of that fetch under t-019 and invited the other consumers to copy it;
// the composable is that invitation answered properly, so there is one
// implementation instead of twelve.

type GalleryVariant = 'grid' | 'dashboard' | 'row' | 'dropdown'

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
    variant: 'grid',
    title: 'Rewards',
    subtitle: 'Pick a story reward, boon, curse, artifact, or plot grenade.',
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
const isRowMode = computed(() => props.variant === 'row')

/** Which of Cards/Heroes/Icons the shared grid is showing. */
const galleryMode = ref<GalleryMode>('cards')

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

  return (
    reward.collection ||
    reward.rewardType ||
    reward.effect ||
    reward.name ||
    'Reward selected.'
  )
})

const selectedRewardDescription = computed(() => {
  const reward = selectedReward.value

  if (!reward) return 'No reward selected.'

  return (
    reward.description ||
    reward.effect ||
    reward.name ||
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
    : 'Create a new story reward, boon, curse, artifact, or plot grenade.'
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

// Fetch earned karma for the broader visible set (pre search/collection/rarity
// refinement) rather than re-fetching on every keystroke — those filters only
// narrow an already-fetched set. useEarnedKarma keys its watch on the id list,
// so a refilter that yields the same rewards does not re-request.
const { earnedKarma: earnedKarmaByRewardId } = useEarnedKarma('reward', () =>
  visibleRewards.value.map((reward) => reward.id),
)

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

/*
 * interface-vision t-060 — grid renders through the shared kr-gallery shell
 * while reward-card stays the card, so t-064's reactions, earned karma and
 * edit/archive actions survive the adoption. earnedKarma stays an explicit
 * per-item binding rather than joining rewardCardProps, because it is looked up
 * per reward id.
 */
const galleryItems = computed<GalleryItem[]>(() =>
  filteredRewards.value.map((reward) => ({
    id: reward.id,
    title: reward.name || `Reward ${reward.id}`,
    source: reward,
  })),
)

/** Slot props give back a GalleryItem, so map the id to the real record. */
const rewardById = computed(
  () => new Map(filteredRewards.value.map((r) => [r.id, r])),
)

/** The card's shared props in one place so row and grid cannot drift. */
/*
 * Icons is a browse view: a text-forward row whose art is a 3rem square.
 * Three floating action circles over that is the "cramped displays" Silas
 * photographed -- the buttons were larger than the artwork. Actions stay on
 * Cards and Heroes, where there is room for them.
 */
const rewardCardProps = computed(() => ({
  showImage: props.showImages,
  compact: isCompact.value,
  showActions: props.showCardActions && galleryMode.value !== 'icons',
  showDescription: props.showDescriptions,
  showMeta: props.showMeta,
  allowEdit: props.allowEdit,
  allowDelete: props.allowDelete,
}))

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
        (reward.name || '').toLowerCase().includes(query) ||
        (reward.description || '').toLowerCase().includes(query) ||
        (reward.flavorText || '').toLowerCase().includes(query) ||
        (reward.effect || '').toLowerCase().includes(query) ||
        (reward.rewardType || '').toLowerCase().includes(query) ||
        (reward.collection || '').toLowerCase().includes(query) ||
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
  return reward.name || `Reward #${reward.id}`
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
  if (isDropdownMode.value) {
    await rewardStore.selectReward(id)
    return
  }

  infoRewardId.value = id
}

/* Interact LEAVES: the encounter surface is a working space, not a panel. */
async function interactWithInfoReward() {
  const id = infoRewardId.value
  infoRewardOpen.value = false
  if (id) await rewardStore.startRewardInteraction(id)
}
/*
 * INFO FIRST, INTERACTION AFTER -- the same frame Bots and Resources use, and
 * the reason kr-card-back exists as one component rather than one per gallery.
 * Picking turns the card over; the model-specific thing you came to do is a
 * button on the back.
 *
 * THE DROPDOWN BRANCH STAYS FIRST. This gallery is also embedded as a PICKER,
 * where a click has to pick and nothing else -- an info panel there would be
 * in the way. verifyCardActionContract puts that decision in the gallery ("A
 * card is an entry point. It emits; the gallery decides what that means"),
 * which is exactly what lets browse and picker disagree.
 *
 * The id IS the open state so the two cannot drift apart; only the false
 * direction is writable, because the flip closes itself on Escape and the
 * backdrop and needs somewhere to put that.
 */
const infoRewardId = ref<number | null>(null)
const infoRewardEditing = ref(false)

const infoReward = computed(
  () =>
    rewardStore.rewards.find((entry) => entry.id === infoRewardId.value) ??
    null,
)

const infoRewardOpen = computed({
  get: () => infoRewardId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      infoRewardId.value = null
      infoRewardEditing.value = false
    }
  },
})

const infoRewardBadges = computed(() => {
  const reward = infoReward.value
  if (!reward) return []

  return [reward.rewardType, reward.rarity]
    .map((entry) => String(entry ?? '').trim())
    .filter((entry) => entry.length > 0)
})

async function continueWithSelected() {
  const id = rewardStore.selectedReward?.id

  if (!id) return

  await rewardStore.startRewardInteraction(id)
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
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: 0.75rem;
}

.reward-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.reward-row > * {
  min-width: min(200px, 80vw);
  max-width: 280px;
}
</style>
