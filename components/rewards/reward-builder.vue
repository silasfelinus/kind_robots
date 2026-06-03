<!-- /components/rewards/reward-builder.vue -->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:gift" class="h-5 w-5 text-primary" />

        <h1 class="text-lg font-black tracking-tight">Reward Builder</h1>

        <span
          v-if="rewardType"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary capitalize"
        >
          {{ rewardType.toLowerCase() }}
        </span>

        <span
          v-if="rarity"
          class="rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize"
          :class="rarityClass(rarity)"
        >
          {{ rarity.toLowerCase() }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="isSaving"
          @click="showResetConfirm = true"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-primary gap-1.5 rounded-xl"
          :disabled="!canSave || isSaving"
          @click="doSave"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:save" class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm"
      >
        <reward-sheet />
      </aside>

      <main class="flex flex-1 flex-col overflow-hidden">
        <reward-stage class="flex-1 overflow-y-auto" />
      </main>
    </div>

    <reward-hand
      class="shrink-0 border-t border-base-300 bg-base-100/80 backdrop-blur-sm"
    />

    <Transition name="fade">
      <div
        v-if="showResetConfirm"
        class="absolute inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm"
        @click.self="showResetConfirm = false"
      >
        <div
          class="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-2xl"
        >
          <p class="mb-1 text-lg font-black">Reset reward?</p>

          <p class="mb-6 text-sm text-base-content/60">
            Clears everything and starts fresh.
          </p>

          <div class="flex gap-3">
            <button
              type="button"
              class="btn btn-outline rounded-xl"
              @click="showResetConfirm = false"
            >
              Cancel
            </button>

            <button
              type="button"
              class="btn btn-error rounded-xl"
              @click="doReset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="saveMessage"
        class="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg"
        :class="
          saveError
            ? 'bg-error text-error-content'
            : 'bg-success text-success-content'
        "
      >
        {{ saveMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { REWARD_CARDS } from '@/stores/helpers/rewardCards'
import type {
  BuilderProjectConfig,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useUserStore } from '@/stores/userStore'

const builder = useBuilderStore()
const rewardStore = useRewardStore()
const userStore = useUserStore()

const rewardBuilderKey = 'reward'

const isMobile = ref(false)
const showResetConfirm = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const savedRewardId = ref<number | null>(null)

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function sheetNumber(key: string): number | null {
  const value = builder.sheet[key]

  return typeof value === 'number' ? value : null
}

function sheetBoolean(key: string, fallback = false): boolean {
  const value = builder.sheet[key]

  return typeof value === 'boolean' ? value : fallback
}

const rewardType = computed(() => {
  return sheetText('rewardType') || 'SKILL'
})

const rarity = computed(() => {
  return sheetText('rarity') || 'COMMON'
})

const isSaving = computed(() => {
  return Boolean(builder.isSaving || rewardStore.isSaving)
})

const canSave = computed(() => {
  return (
    Boolean(sheetText('text').trim()) &&
    Boolean(sheetText('power').trim()) &&
    !isSaving.value
  )
})

function defaultRewardSheet(): BuilderSheet {
  const form = rewardStore.rewardForm as Record<string, unknown>

  return {
    rewardType:
      typeof form.rewardType === 'string' ? form.rewardType : 'SKILL',
    rarity: typeof form.rarity === 'string' ? form.rarity : 'COMMON',
    text: typeof form.text === 'string' ? form.text : '',
    power: typeof form.power === 'string' ? form.power : '',
    collection:
      typeof form.collection === 'string'
        ? form.collection
        : 'starting-character-reward',
    icon: typeof form.icon === 'string' ? form.icon : 'kind-icon:gift',
    description:
      typeof form.description === 'string' ? form.description : '',
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    imagePath: typeof form.imagePath === 'string' ? form.imagePath : null,
    artImageId:
      typeof form.artImageId === 'number' ? form.artImageId : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : userStore.userId || userStore.user?.id || 10,
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    isMature: typeof form.isMature === 'boolean' ? form.isMature : false,
  }
}

const rewardBuilderConfig: BuilderProjectConfig = {
  key: rewardBuilderKey,
  label: 'Reward Builder',
  title: 'Reward Builder',
  modelType: 'reward',
  storageKey: 'kindrobots.builder.reward.v1',
  cards: REWARD_CARDS,
  splash: {
    title: 'Reward Builder',
    subtitle: 'Create skills, items, titles, powers, and story trouble.',
    tagline: 'A prize, a problem, or both. Ideally both.',
    description:
      'Build a reward one card at a time: type, rarity, name, power, collection, visibility, and optional art.',
    imagePath: '/images/rewards/splash.webp',
    ctaLabel: 'Start Reward',
    secondaryLabel: 'Surprise Me',
  },
  defaultSheet: defaultRewardSheet,
  coreCardKeys: ['type', 'rarity', 'name', 'power'],
  requiredCardKeys: ['type', 'rarity', 'name', 'power'],
  finalCardKey: 'art',
  artPurpose: 'reward',
  artImageRole: 'object',
  artTitle: 'Reward Image Designer',
  artDescription:
    'Create, upload, select, or generate art for this reward.',
  clearFieldDefaults: {
    imagePath: null,
    artImageId: null,
    userId: 10,
    isPublic: true,
    isMature: false,
  },
  persistActiveCard: true,
  allowCompletedCardsInDeck: false,
  suggestContext: {
    builder: 'reward',
    tone: 'Punchy, flavorful, useful in interactive narrative play.',
  },
}

function updateBreakpoint() {
  if (typeof window === 'undefined') return

  isMobile.value = window.innerWidth < 1024
}

function rarityClass(value: string): string {
  const map: Record<string, string> = {
    COMMON: 'border-base-300 text-base-content/50',
    UNCOMMON: 'border-green-400/50 text-green-600',
    RARE: 'border-blue-400/50 text-blue-600',
    EPIC: 'border-purple-400/50 text-purple-600',
    LEGENDARY: 'border-yellow-400/50 text-yellow-600',
    MYTHIC: 'border-red-400/50 text-red-600',
  }

  return map[value] ?? 'border-base-300'
}

function syncSheetToRewardForm() {
  const resolvedUserId =
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  rewardStore.setRewardForm({
    rewardType: rewardType.value,
    rarity: rarity.value,
    text: sheetText('text'),
    power: sheetText('power'),
    collection: sheetText('collection') || 'starting-character-reward',
    icon: sheetText('icon') || 'kind-icon:gift',
    description: sheetText('description'),
    artPrompt: sheetText('artPrompt'),
    imagePath:
      typeof builder.sheet.imagePath === 'string'
        ? builder.sheet.imagePath
        : undefined,
    artImageId: sheetNumber('artImageId') ?? undefined,
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    isMature: sheetBoolean('isMature', false),
  })
}

function initializeBuilder() {
  builder.registerBuilder(rewardBuilderConfig)
  builder.setBuilder(rewardBuilderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard('type')
  }
}

onMounted(() => {
  initializeBuilder()
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateBreakpoint)
})

function doReset() {
  showResetConfirm.value = false
  savedRewardId.value = null
  saveMessage.value = ''
  saveError.value = false
  rewardStore.startAddingReward()
  builder.resetBuilder(true)
  builder.selectCard('type')
}

async function doSave() {
  saveMessage.value = ''
  saveError.value = false
  builder.clearError()
  syncSheetToRewardForm()

  const result = await rewardStore.saveReward()

  if (result?.id) {
    savedRewardId.value = result.id
    saveMessage.value = 'Reward saved.'
    saveError.value = false
    builder.setStatus('Reward saved.')
  } else {
    saveMessage.value =
      builder.lastError ?? rewardStore.error ?? 'Save failed.'
    saveError.value = true
  }

  window.setTimeout(() => {
    saveMessage.value = ''
  }, 3000)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}

.slide-up-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>