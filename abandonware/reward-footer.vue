<!-- /components/navigation/reward-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[1fr_auto] items-stretch gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <textarea
          ref="rewardMeasureRef"
          v-model="customDirection"
          class="textarea textarea-bordered h-full min-h-0 w-full resize-none overflow-y-auto bg-base-100 text-sm"
          placeholder="What happens when this reward enters the story?"
          @input="queuePromptOffsetRefresh"
        />

        <button
          class="btn h-full min-h-0 w-28 bg-primary font-semibold text-white hover:bg-primary/90"
          :disabled="!rewardStore.selectedReward"
          @click="openRewardMode"
        >
          Rewards
        </button>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1.25fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">🎁 Reward Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            @click="openRewardMode"
          >
            Open Rewards
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
            >
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Selected Reward
              </div>

              <div class="mt-2 font-semibold text-base-content">
                {{ selectedRewardText }}
              </div>

              <div class="mt-1 text-base-content/70">
                {{ selectedRewardPower }}
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
            >
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Selected Character
              </div>

              <div class="mt-2 font-semibold text-base-content">
                {{ selectedCharacterText }}
              </div>
            </div>

            <div
              class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-2 text-sm font-semibold">Reward Direction</div>

              <textarea
                ref="rewardMeasureRef"
                v-model="customDirection"
                class="textarea textarea-bordered min-h-28 w-full resize-none overflow-y-auto bg-base-100 text-sm"
                placeholder="Describe how this reward changes the scene..."
                @input="queuePromptOffsetRefresh"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Reward Prompt Preview
        </div>

        <div
          class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm leading-relaxed whitespace-pre-wrap"
        >
          {{
            rewardPromptPreview || 'Pick a reward to preview its story prompt.'
          }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1.2fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">🎁 Reward Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            @click="openRewardMode"
          >
            Open Rewards
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Reward
              </div>

              <div class="mt-2 text-sm font-semibold">
                {{ selectedRewardText }}
              </div>

              <div class="mt-2 line-clamp-3 text-sm text-base-content/70">
                {{ selectedRewardPower }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Character
              </div>

              <div class="mt-2 text-sm font-semibold">
                {{ selectedCharacterText }}
              </div>

              <div class="mt-2 text-sm text-base-content/70">
                {{ rewardStatus }}
              </div>
            </div>
          </div>

          <div class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 text-sm font-semibold">Reward Direction</div>

            <textarea
              ref="rewardMeasureRef"
              v-model="customDirection"
              class="textarea textarea-bordered min-h-32 w-full resize-none overflow-y-auto bg-base-100 text-sm"
              placeholder="What does the reward do, reveal, tempt, unlock, or ruin?"
              @input="queuePromptOffsetRefresh"
            />
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Prompt Preview
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm whitespace-pre-wrap"
            >
              {{ rewardPromptPreview || 'No reward selected yet.' }}
            </div>

            <button
              class="btn btn-success rounded-xl"
              type="button"
              :disabled="!rewardStore.selectedReward"
              @click="openRewardMode"
            >
              Use in Reward Workshop
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/reward-footer.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/characterStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'

const router = useRouter()
const characterStore = useCharacterStore()
const displayStore = useDisplayStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()

const footerKey = 'reward'
const rewardDashboardKey = 'reward' as const

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const customDirection = ref('')
const rewardMeasureRef = ref<HTMLTextAreaElement | null>(null)
let rewardResizeObserver: ResizeObserver | null = null

const selectedRewardText = computed(
  () => rewardStore.selectedReward?.text || 'No reward selected',
)

const selectedRewardPower = computed(
  () =>
    rewardStore.selectedReward?.power ||
    'Pick a reward to define the story effect.',
)

const selectedCharacterText = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'No character selected'

  return character.name
    ? `${character.name} the ${character.honorific || 'Unremarkable'}`.trim()
    : 'Unnamed character'
})

const rewardStatus = computed(() => {
  if (!rewardStore.selectedReward) return 'Waiting for a reward.'
  if (!characterStore.selectedCharacter) {
    return 'Ready as a general story item.'
  }

  return 'Ready for character encounter.'
})

const rewardPromptPreview = computed(() => {
  const reward = rewardStore.selectedReward

  if (!reward) return ''

  const character = characterStore.selectedCharacter
  const direction = customDirection.value.trim()

  const characterLine = character
    ? `Character: ${character.name || 'Unnamed'} the ${
        character.honorific || 'Unremarkable'
      }. ${character.species || 'Unknown species'} / ${
        character.class || 'Unknown class'
      }.`
    : 'Character: No specific character selected.'

  return [
    `Reward: ${reward.text}`,
    `Power: ${reward.power}`,
    `Collection: ${reward.collection}`,
    `Rarity: ${reward.rarity}`,
    characterLine,
    direction ? `Player direction: ${direction}` : '',
    '',
    'Generate a scene where this reward matters. It should change the situation, reveal something, tempt someone, unlock a new option, or create a consequence.',
  ]
    .filter(Boolean)
    .join('\n')
})

function refreshPromptOffset() {
  if (displayStore.footerComponent !== footerKey) {
    displayStore.clearPromptOffset(footerKey)
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset(footerKey)
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset(footerKey)
    return
  }

  const el = rewardMeasureRef.value

  if (!el) {
    displayStore.clearPromptOffset(footerKey)
    return
  }

  displayStore.refreshPromptOffset(
    footerKey,
    el.scrollHeight,
    el.clientHeight,
    footerState.value === 'compact' ? 1.5 : 2.5,
  )
}

function queuePromptOffsetRefresh() {
  nextTick(() => {
    refreshPromptOffset()
  })
}

async function openRewardMode() {
  navStore.setDashboardTab(rewardDashboardKey, 'overview')
  await router.push('/rewards')
}

watch(
  () => [
    footerState.value,
    displayStore.footerComponent,
    customDirection.value,
    rewardStore.selectedReward?.id,
    characterStore.selectedCharacter?.id,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

onMounted(() => {
  queuePromptOffsetRefresh()

  rewardResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (rewardMeasureRef.value) {
    rewardResizeObserver.observe(rewardMeasureRef.value)
  }
})

onBeforeUnmount(() => {
  rewardResizeObserver?.disconnect()
  rewardResizeObserver = null
  displayStore.clearPromptOffset(footerKey)
})
</script>
