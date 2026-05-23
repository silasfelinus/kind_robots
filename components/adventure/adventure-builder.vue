<!-- components/adventure/adventure-builder.vue -->
<!--
  Top-level adventure character builder.
  Layout:
    Header  — title, sheet toggle (mobile), save / reset
    Body    — [ adventure-sheet sidebar ] + [ adventure-stage ]
    Footer  — adventure-hand (card tray)

  Owns: save flow (rewards then character), reset, mobile sidebar toggle.
  All step/card flow lives in adventureStore.
  No emits.
-->
<template>
  <section
    class="builder flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-base-200"
  >
    <!-- Header -->
    <header
      class="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-200 px-4 py-3"
    >
      <!-- Sheet toggle (mobile only) -->
      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-xl lg:hidden"
        :class="showSheet ? 'btn-active' : ''"
        :aria-label="
          showSheet ? 'Hide character sheet' : 'Show character sheet'
        "
        @click="showSheet = !showSheet"
      >
        <Icon name="kind-icon:blueprint" class="h-4 w-4" />
      </button>

      <!-- Title -->
      <div class="min-w-0 flex-1">
        <h2
          class="flex items-center gap-2 text-lg font-black text-base-content leading-tight"
        >
          <Icon
            name="kind-icon:sparkles"
            class="h-5 w-5 text-primary shrink-0"
          />
          <span class="truncate">
            {{ adventureStore.sheet.name || 'New Character' }}
          </span>
        </h2>
        <p class="text-xs text-base-content/40 truncate">
          {{ headerSubtitle }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex shrink-0 items-center gap-2">
        <!-- Reset -->
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-xl text-base-content/40 hover:text-error"
          :disabled="isSaving"
          @click="confirmReset"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <!-- Save -->
        <button
          type="button"
          class="btn btn-sm btn-primary rounded-xl gap-1.5"
          :disabled="isSaving || !canSave"
          @click="saveCharacter"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:save" class="h-4 w-4" />
          {{ saveLabel }}
        </button>
      </div>
    </header>

    <!-- Save feedback -->
    <Transition name="feedback-slide">
      <div
        v-if="saveMessage || saveError"
        class="shrink-0 border-b px-4 py-2 text-sm font-semibold"
        :class="
          saveError
            ? 'border-error/30 bg-error/10 text-error'
            : 'border-success/30 bg-success/10 text-success'
        "
      >
        {{ saveError || saveMessage }}
      </div>
    </Transition>

    <!-- Main body -->
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- Sheet sidebar — always visible lg+, toggle on mobile -->
      <Transition name="sheet-slide">
        <div
          v-show="showSheet || isDesktop"
          class="sheet-sidebar shrink-0 overflow-y-auto border-r border-base-300 bg-base-100 p-3"
          :class="showSheet ? 'w-64' : 'hidden lg:block lg:w-64'"
        >
          <adventure-sheet />
        </div>
      </Transition>

      <!-- Stage column -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- Adventure stage — hero zone + choices + nav -->
        <div class="min-h-0 flex-1 overflow-hidden p-2">
          <adventure-stage />
        </div>

        <!-- Card hand tray -->
        <div class="shrink-0 border-t border-base-300 bg-base-200 py-1">
          <adventure-hand />
        </div>
      </div>
    </div>

    <!-- Reset confirmation modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showResetConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showResetConfirm = false"
        >
          <div class="absolute inset-0 bg-base-300/60 backdrop-blur-sm" />

          <div
            class="relative w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl"
          >
            <h3 class="text-lg font-black text-base-content">
              Clear the sheet?
            </h3>
            <p class="mt-2 text-sm text-base-content/60">
              All answers, stats, and skills will be discarded. The character
              will return to a state of pure potential. Which sounds better than
              it is.
            </p>
            <div class="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-xl"
                @click="showResetConfirm = false"
              >
                Keep it
              </button>
              <button
                type="button"
                class="btn btn-sm btn-error rounded-xl"
                @click="doReset"
              >
                Clear everything
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import { useUserStore } from '@/stores/userStore'
import { handleError, performFetch } from '@/stores/utils'
import type { Rarity } from '@/stores/generatorStore'
import type { RolledReward } from '@/stores/generatorStore'

// ── Stores ──────────────────────────────────────────────────────────────────

const adventureStore = useAdventureStore()
const userStore = useUserStore()

// ── UI state ────────────────────────────────────────────────────────────────

const showSheet = ref(false)
const showResetConfirm = ref(false)
const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')
const savedCharId = ref<number | null>(null)

// Detect desktop breakpoint for sidebar visibility
const isDesktop = ref(false)

function updateBreakpoint() {
  isDesktop.value = window.innerWidth >= 1024
}

// ── Computed ────────────────────────────────────────────────────────────────

const canSave = computed(
  () =>
    Boolean(adventureStore.sheet.name?.trim()) && adventureStore.allComplete,
)

const saveLabel = computed(() =>
  isSaving.value
    ? 'Saving...'
    : savedCharId.value
      ? 'Update Character'
      : 'Save Character',
)

const headerSubtitle = computed(() => {
  if (adventureStore.allComplete) return 'Sheet complete. Ready to save.'
  const done = Object.keys(adventureStore.completedCards).length
  const total = 10
  return `${done} of ${total} cards placed`
})

// ── Save ────────────────────────────────────────────────────────────────────

async function saveCharacter() {
  if (!canSave.value || isSaving.value) return

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    // 1. Save each reward draft
    const savedRewardIds = await saveRewards()

    // 2. Build the character payload — field names match Prisma model directly
    const s = adventureStore.sheet

    const body: Record<string, unknown> = {
      name: s.name.trim(),
      honorific: s.honorific.trim() || 'adventurer',
      title: s.title.trim() || null,
      role: s.role.trim() || null,
      genre: s.genre.trim() || null,
      species: s.species.trim() || null,
      class: s.class.trim() || null,
      alignment: s.alignment.trim() || null,
      gender: s.gender.trim() || null,
      presentation: s.presentation.trim() || null,
      personality: s.personality.trim() || null,
      drive: s.drive.trim() || null,
      backstory: s.backstory.trim() || null,
      achievements: s.achievements.trim() || null,
      quirks: s.quirks.trim() || null,
      artPrompt: s.artPrompt.trim() || null,
      artImageId: s.artImageId || null,
      imagePath: s.imagePath || null,
      // Rarity tiers
      luck: s.luck,
      might: s.might,
      wits: s.wits,
      grace: s.grace,
      charm: s.charm,
      empathy: s.empathy,
      // Meta
      userId: userStore.userId || s.userId || 10,
      isPublic: s.isPublic,
      isMature: s.isMature,
      isActive: true,
      experience: 0,
      level: 1,
      // Linked rewards
      rewardIds: savedRewardIds,
    }

    const method = savedCharId.value ? 'PATCH' : 'POST'
    const endpoint = savedCharId.value
      ? `/api/characters/${savedCharId.value}`
      : '/api/characters'

    type CharResponse = { id: number }

    const response = await performFetch<CharResponse>(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to save character.')
    }

    savedCharId.value = response.data.id
    saveMessage.value = `Character #${response.data.id} committed to the record. The ledger has been updated.`

    // Clear message after 5s
    setTimeout(() => {
      saveMessage.value = ''
    }, 5000)
  } catch (error) {
    handleError(error, 'saving adventure character')
    saveError.value =
      error instanceof Error
        ? error.message
        : 'The save failed. The ledger is unmoved.'
  } finally {
    isSaving.value = false
  }
}

async function saveRewards(): Promise<number[]> {
  const ids: number[] = []

  for (const reward of Object.values(
    adventureStore.sheet.rewards,
  ) as RolledReward[]) {
    type RewardResponse = { id: number }

    const response = await performFetch<RewardResponse>('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: reward.label,
        text: reward.text,
        power: reward.power,
        rarity: reward.rarity as Rarity,
        rewardType: 'SKILL',
        icon: reward.icon,
        collection: 'adventure-starting-skill',
        userId: userStore.userId || 10,
        isPublic: adventureStore.sheet.isPublic,
        isMature: adventureStore.sheet.isMature,
        isActive: true,
      }),
    })

    if (response.success && response.data?.id) {
      ids.push(response.data.id)
    }
  }

  return ids
}

// ── Reset ────────────────────────────────────────────────────────────────────

function confirmReset() {
  showResetConfirm.value = true
}

function doReset() {
  showResetConfirm.value = false
  savedCharId.value = null
  saveMessage.value = ''
  saveError.value = ''
  adventureStore.resetAdventure(userStore.userId || 10)
  // Auto-draw first card
  adventureStore.randomCard()
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  // Set user ID on sheet
  adventureStore.sheet.userId = userStore.userId || 10

  // Breakpoint detection
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)

  // Auto-draw a card if nothing is active
  if (!adventureStore.activeCardKey && adventureStore.visibleCards.length) {
    adventureStore.randomCard()
  }
})
</script>

<style scoped>
.builder {
  container-type: inline-size;
}

/* Sidebar slide on mobile */
.sheet-slide-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.sheet-slide-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.sheet-slide-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* Feedback bar */
.feedback-slide-enter-active {
  transition:
    opacity 200ms ease,
    max-height 200ms ease;
  max-height: 60px;
  overflow: hidden;
}
.feedback-slide-leave-active {
  transition:
    opacity 300ms ease,
    max-height 300ms ease;
  max-height: 60px;
  overflow: hidden;
}
.feedback-slide-enter-from,
.feedback-slide-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Modal */
.modal-fade-enter-active {
  transition: opacity 200ms ease;
}
.modal-fade-leave-active {
  transition: opacity 150ms ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
