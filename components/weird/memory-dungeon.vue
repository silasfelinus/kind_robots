<!-- /components/content/story/memory-dungeon.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-base-200"
  >
    <header class="shrink-0 border-b border-base-300 bg-base-100/95 p-2">
      <div
        class="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-stretch"
      >
        <div class="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content shadow"
            >
              <Icon name="kind-icon:brain" class="h-8 w-8" />
            </div>

            <div class="min-w-0">
              <h1
                class="truncate text-2xl font-black leading-tight text-primary sm:text-3xl"
              >
                Memory Dungeon
              </h1>
              <p class="line-clamp-2 text-sm text-base-content/70 sm:text-base">
                Match cursed artifacts, survive the dungeon, loot suspicious
                rewards, and irritate goblins professionally.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:min-w-2xl">
          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-2 text-center"
          >
            <div
              class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/60"
            >
              Score
            </div>
            <div class="text-xl font-black text-primary">
              {{ memoryStore.score }}
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-2 text-center"
          >
            <div
              class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/60"
            >
              Level
            </div>
            <div class="text-xl font-black text-secondary">
              {{ memoryStore.level }}
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-2 text-center"
          >
            <div
              class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/60"
            >
              Lives
            </div>
            <div class="flex justify-center gap-1 text-lg leading-none">
              <span
                v-for="life in memoryStore.maxLives"
                :key="life"
                :class="
                  life <= memoryStore.lives
                    ? 'opacity-100'
                    : 'opacity-25 grayscale'
                "
              >
                ♥
              </span>
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-2 text-center"
          >
            <div
              class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/60"
            >
              Streak
            </div>
            <div class="text-xl font-black text-accent">
              {{ memoryStore.streak }}
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-2 text-center"
          >
            <div
              class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/60"
            >
              Status
            </div>
            <div class="truncate text-sm font-black text-info sm:text-base">
              {{ memoryStore.runStatus }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-stretch"
      >
        <div class="rounded-2xl border border-info/30 bg-info/10 p-3">
          <div class="flex items-start gap-2">
            <Icon
              name="kind-icon:scroll"
              class="mt-1 h-5 w-5 shrink-0 text-info"
            />
            <p
              class="line-clamp-2 text-sm font-semibold leading-relaxed text-base-content sm:text-base"
            >
              {{ memoryStore.roundFlavor || fallbackRoundFlavor }}
            </p>
          </div>
        </div>

        <div
          class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <select
            v-model="memoryStore.selectedDifficulty"
            class="select select-bordered w-full rounded-2xl bg-base-100"
            :disabled="memoryStore.isLoading || memoryStore.boardLocked"
          >
            <option
              v-for="difficulty in memoryStore.difficulties"
              :key="difficulty.label"
              :value="difficulty"
            >
              {{ difficulty.label }}
            </option>
          </select>

          <button
            type="button"
            class="btn btn-primary rounded-2xl"
            :disabled="memoryStore.isLoading"
            @click="memoryStore.startDungeonRun()"
          >
            <Icon name="kind-icon:sword" class="h-5 w-5" />
            New Run
          </button>

          <button
            type="button"
            class="btn btn-secondary rounded-2xl"
            @click="leaderboardOpen = !leaderboardOpen"
          >
            <Icon name="kind-icon:trophy" class="h-5 w-5" />
            Scores
          </button>
        </div>
      </div>
    </header>

    <main
      class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 xl:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div
          class="grid shrink-0 grid-cols-1 gap-2 border-b border-base-300 p-2 lg:grid-cols-[minmax(0,1fr)_auto]"
        >
          <div class="rounded-2xl border border-warning/30 bg-warning/10 p-3">
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-warning/40 bg-base-100"
              >
                <img
                  v-if="memoryStore.challengeTarget"
                  :src="memoryStore.challengeTarget.imagePath"
                  :alt="memoryStore.challengeTarget.galleryName"
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="kind-icon:question"
                  class="h-7 w-7 text-warning"
                />
              </div>

              <div class="min-w-0">
                <div
                  class="text-xs font-black uppercase tracking-wide text-warning"
                >
                  Current Challenge
                </div>

                <p
                  v-if="memoryStore.challengeTarget"
                  class="mt-1 line-clamp-1 font-black text-base-content"
                >
                  Match the glowing target next for +{{
                    memoryStore.challengeBonus
                  }}
                </p>

                <p
                  v-else
                  class="mt-1 line-clamp-1 font-black text-base-content"
                >
                  The dungeon is choosing a victim.
                </p>

                <p class="mt-1 line-clamp-2 text-sm text-base-content/70">
                  {{ memoryStore.challengeFlavor || fallbackChallengeFlavor }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2 lg:w-[24rem]">
            <button
              v-for="powerup in memoryStore.powerups"
              :key="powerup.id"
              type="button"
              class="group rounded-2xl border border-base-300 bg-base-200 p-2 text-center transition hover:border-primary hover:bg-base-300 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="
                powerup.uses <= 0 ||
                memoryStore.boardLocked ||
                memoryStore.gameOver ||
                memoryStore.gameWon
              "
              :title="powerup.description"
              @click="memoryStore.usePowerup(powerup.id)"
            >
              <Icon
                :name="powerup.icon"
                class="mx-auto h-6 w-6 text-primary transition group-hover:scale-110"
              />
              <div class="mt-1 truncate text-xs font-black">
                {{ powerup.label }}
              </div>
              <div class="badge badge-primary badge-sm mt-1">
                {{ powerup.uses }}
              </div>
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          <div
            v-if="memoryStore.notification"
            :class="memoryStore.notificationClasses"
            class="mb-3 flex items-center justify-between gap-3"
          >
            <span>{{ memoryStore.notification.message }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              @click="memoryStore.clearNotification()"
            >
              Close
            </button>
          </div>

          <div
            v-if="memoryStore.isLoading"
            class="flex min-h-72 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
          >
            <div class="flex flex-col items-center gap-3 text-center">
              <span class="loading loading-spinner loading-lg text-primary" />
              <p class="max-w-sm text-sm font-semibold text-base-content/70">
                Summoning cursed rectangles from the gallery crypt...
              </p>
            </div>
          </div>

          <div
            v-else-if="!memoryStore.galleryImages.length"
            class="flex min-h-72 items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center"
          >
            <div class="max-w-md">
              <Icon
                name="kind-icon:warning"
                class="mx-auto h-12 w-12 text-warning"
              />
              <h2 class="mt-3 text-xl font-black">No dungeon cards loaded</h2>
              <p class="mt-2 text-sm text-base-content/70">
                The dungeon reached into the gallery barrel and found lint. Try
                starting a new run.
              </p>
              <button
                type="button"
                class="btn btn-primary mt-4 rounded-2xl"
                @click="memoryStore.startDungeonRun()"
              >
                Retry
              </button>
            </div>
          </div>

          <div
            v-else
            class="mx-auto grid justify-center gap-2 sm:gap-3"
            :style="memoryStore.gameBoardStyle"
          >
            <button
              v-for="card in memoryStore.galleryImages"
              :key="card.id"
              type="button"
              class="memory-card group relative aspect-square overflow-hidden rounded-2xl border border-base-300 bg-base-300 shadow-sm transition hover:scale-[1.02] hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{
                'border-success ring-2 ring-success/40': card.matched,
                'border-warning ring-2 ring-warning/50':
                  card.pairId === memoryStore.challengeTargetPairId &&
                  !card.matched,
                'cursor-not-allowed opacity-80':
                  memoryStore.boardLocked || memoryStore.gameOver,
              }"
              :disabled="
                memoryStore.boardLocked ||
                memoryStore.gameOver ||
                memoryStore.gameWon
              "
              @click="memoryStore.selectCard(card)"
            >
              <div
                class="memory-card-inner"
                :class="{ 'is-flipped': card.flipped || card.matched }"
              >
                <div class="memory-card-face memory-card-back">
                  <img
                    class="h-full w-full object-cover"
                    src="/images/kindtitle.webp"
                    alt="Memory card back"
                  />
                  <div
                    class="absolute inset-0 bg-linear-to-br from-primary/40 via-transparent to-secondary/40"
                  />
                  <div
                    class="absolute bottom-2 left-2 right-2 rounded-xl bg-base-100/85 px-2 py-1 text-[0.65rem] font-black text-base-content backdrop-blur"
                  >
                    Dungeon Card
                  </div>
                </div>

                <div class="memory-card-face memory-card-front">
                  <img
                    class="h-full w-full object-cover"
                    :src="card.imagePath"
                    :alt="card.galleryName"
                  />

                  <div
                    v-if="
                      card.pairId === memoryStore.challengeTargetPairId &&
                      !card.matched
                    "
                    class="absolute right-2 top-2 rounded-full bg-warning px-2 py-1 text-xs font-black text-warning-content shadow"
                  >
                    Quest
                  </div>

                  <div
                    v-if="card.matched"
                    class="absolute inset-0 flex items-center justify-center bg-success/35"
                  >
                    <div
                      class="rounded-full bg-success px-3 py-1 text-xs font-black text-success-content shadow"
                    >
                      Matched
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <aside
        class="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-2 overflow-hidden"
      >
        <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:magic" class="h-5 w-5 text-accent" />
            <h2 class="font-black text-accent">Dungeon Log</h2>
          </div>

          <p
            class="mt-2 rounded-2xl bg-base-200 p-3 text-sm font-medium leading-relaxed text-base-content/80"
          >
            {{ memoryStore.eventFlavor || fallbackEventFlavor }}
          </p>

          <div
            v-if="memoryStore.activeAward"
            class="mt-2 rounded-2xl border border-warning/40 bg-warning/10 p-3"
          >
            <div class="flex items-center gap-2 font-black text-warning">
              <Icon :name="memoryStore.activeAward.icon" class="h-5 w-5" />
              {{ memoryStore.activeAward.label }}
            </div>
            <p class="mt-1 text-sm text-base-content/80">
              {{ memoryStore.activeAward.description }}
            </p>
          </div>

          <div
            v-if="memoryStore.shielded || memoryStore.nextMatchDouble"
            class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1"
          >
            <div
              v-if="memoryStore.shielded"
              class="rounded-2xl border border-info/40 bg-info/10 p-2 text-sm font-bold text-info"
            >
              Shield active
            </div>

            <div
              v-if="memoryStore.nextMatchDouble"
              class="rounded-2xl border border-accent/40 bg-accent/10 p-2 text-sm font-bold text-accent"
            >
              Next match doubled
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-2xl bg-base-200 p-2 text-center">
              <div class="text-xs font-bold uppercase text-base-content/60">
                High Score
              </div>
              <div class="text-lg font-black text-primary">
                {{ memoryStore.highScore }}
              </div>
            </div>

            <div class="rounded-2xl bg-base-200 p-2 text-center">
              <div class="text-xs font-bold uppercase text-base-content/60">
                Multiplier
              </div>
              <div class="text-lg font-black text-secondary">
                x{{ memoryStore.comboMultiplier }}
              </div>
            </div>

            <div class="rounded-2xl bg-base-200 p-2 text-center">
              <div class="text-xs font-bold uppercase text-base-content/60">
                Pairs Left
              </div>
              <div class="text-lg font-black text-info">
                {{ memoryStore.remainingPairs }}
              </div>
            </div>

            <div class="rounded-2xl bg-base-200 p-2 text-center">
              <div class="text-xs font-bold uppercase text-base-content/60">
                Cards
              </div>
              <div class="text-lg font-black text-accent">
                {{ memoryStore.numberOfCards }}
              </div>
            </div>
          </div>

          <div
            v-if="memoryStore.gameWon || memoryStore.gameOver"
            class="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-center"
          >
            <p class="font-black text-primary">
              {{
                memoryStore.gameWon
                  ? 'Dungeon Cleared!'
                  : 'The Dungeon Ate You!'
              }}
            </p>

            <p class="mt-1 text-sm text-base-content/70">
              {{
                memoryStore.gameWon
                  ? 'Claim your weird reward, then advance before the goblins unionize.'
                  : 'A tragic tale. Very merchandisable.'
              }}
            </p>

            <div class="mt-3 flex flex-wrap justify-center gap-2">
              <button
                v-if="memoryStore.gameWon"
                type="button"
                class="btn btn-primary btn-sm rounded-2xl"
                @click="memoryStore.advanceLevel()"
              >
                Next Level
              </button>

              <button
                type="button"
                class="btn btn-secondary btn-sm rounded-2xl"
                @click="memoryStore.startDungeonRun()"
              >
                New Run
              </button>
            </div>
          </div>
        </section>

        <section
          v-if="memoryStore.gameWon"
          class="min-h-0 overflow-hidden rounded-2xl border border-accent/40 bg-accent/10 p-3"
        >
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:gift" class="h-5 w-5 text-accent" />
            <h2 class="font-black text-accent">Creative Reward</h2>
          </div>

          <div class="mt-2 grid grid-cols-1 gap-2">
            <label class="form-control">
              <div class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase tracking-wide"
                >
                  Reward Mode
                </span>
              </div>

              <select
                :value="memoryStore.rewardMode"
                class="select select-bordered select-sm rounded-2xl bg-base-100"
                :disabled="memoryStore.rewardLoading"
                @change="setRewardMode"
              >
                <option value="manual">Manual only</option>
                <option value="text">Generate text</option>
                <option value="image">Generate image</option>
                <option value="both">Generate text and image</option>
              </select>
            </label>

            <label
              class="flex items-center gap-2 rounded-2xl bg-base-100 p-2 text-sm font-semibold"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-accent"
                :checked="memoryStore.autoClaimRewards"
                @change="setAutoClaimRewards"
              />
              Auto-claim rewards on level clear
            </label>

            <button
              type="button"
              class="btn btn-accent rounded-2xl"
              :disabled="!memoryStore.canClaimReward"
              @click="memoryStore.claimLevelReward()"
            >
              <span
                v-if="memoryStore.rewardLoading"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="kind-icon:magic" class="h-5 w-5" />
              Claim Reward
            </button>
          </div>

          <div
            v-if="memoryStore.rewardError"
            class="mt-2 rounded-2xl border border-error/40 bg-error/10 p-2 text-sm font-semibold text-error"
          >
            {{ memoryStore.rewardError }}
          </div>

          <div
            v-if="memoryStore.rewardText || memoryStore.rewardTextLoading"
            class="mt-2 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-1 flex items-center gap-2 text-sm font-black text-primary"
            >
              <Icon name="kind-icon:scroll" class="h-4 w-4" />
              Reward Story
            </div>

            <p
              v-if="memoryStore.rewardText"
              class="text-sm leading-relaxed text-base-content/80"
            >
              {{ memoryStore.rewardText }}
            </p>

            <div
              v-else
              class="flex items-center gap-2 text-sm font-semibold text-base-content/60"
            >
              <span class="loading loading-spinner loading-xs" />
              The goblin scribe is generating nonsense with structure...
            </div>
          </div>

          <div
            v-if="memoryStore.rewardArt || memoryStore.rewardArtLoading"
            class="mt-2 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 flex items-center gap-2 text-sm font-black text-secondary"
            >
              <Icon name="kind-icon:art" class="h-4 w-4" />
              Reward Art
            </div>

            <div
              v-if="memoryStore.rewardArtLoading"
              class="flex items-center gap-2 rounded-2xl bg-base-200 p-3 text-sm font-semibold text-base-content/60"
            >
              <span class="loading loading-spinner loading-xs" />
              The art modeller is painting loot with suspicious confidence...
            </div>

            <div
              v-else-if="rewardImagePath"
              class="overflow-hidden rounded-2xl border border-base-300 bg-base-200"
            >
              <img
                :src="rewardImagePath"
                :alt="memoryStore.rewardTitle || 'Memory Dungeon reward art'"
                class="h-auto w-full object-cover"
              />
            </div>

            <p
              v-else
              class="rounded-2xl bg-base-200 p-3 text-sm text-base-content/70"
            >
              Reward art was created, but this component could not find an image
              path on the returned art object.
            </p>
          </div>

          <details class="mt-2 rounded-2xl bg-base-100 p-2">
            <summary class="cursor-pointer text-sm font-black">
              Reward prompts
            </summary>

            <div class="mt-2 grid gap-2">
              <div>
                <div class="text-xs font-bold uppercase text-base-content/60">
                  Text Prompt
                </div>
                <pre
                  class="max-h-32 overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-2 text-xs"
                  >{{ memoryStore.rewardTextPrompt }}</pre
                >
              </div>

              <div>
                <div class="text-xs font-bold uppercase text-base-content/60">
                  Art Prompt
                </div>
                <pre
                  class="max-h-32 overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-2 text-xs"
                  >{{ memoryStore.rewardArtPrompt }}</pre
                >
              </div>
            </div>
          </details>
        </section>

        <transition name="fade">
          <section
            v-if="leaderboardOpen"
            class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <h2 class="font-black text-primary">Leaderboard</h2>

              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl"
                @click="leaderboardOpen = false"
              >
                Close
              </button>
            </div>

            <div
              v-if="leaderboard.length"
              class="min-h-0 overflow-y-auto rounded-2xl bg-base-200"
            >
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Hero</th>
                    <th>Score</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(user, index) in leaderboard" :key="user.id">
                    <td>{{ index + 1 }}</td>
                    <td class="max-w-24 truncate">
                      {{ user.username }}
                    </td>
                    <td>{{ user.matchRecord ?? 'N/A' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-else
              class="rounded-2xl bg-base-200 p-4 text-center text-sm text-base-content/70"
            >
              No leaderboard goblins have reported in yet.
            </div>
          </section>
        </transition>
      </aside>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMemoryStore } from '@/stores/memoryStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const milestoneStore = useMilestoneStore()
const memoryStore = useMemoryStore()
const leaderboardOpen = ref(false)

const fallbackRoundFlavor =
  'You stand before a suspiciously symmetrical dungeon. Every door has a twin. This feels like a design pattern.'

const fallbackEventFlavor =
  'The dungeon waits. It is probably pretending to be mysterious because it forgot where it put the treasure.'

const fallbackChallengeFlavor =
  'The dungeon has opinions. Obey them for points.'

const leaderboard = computed(() => milestoneStore.highMatchScores)

const rewardImagePath = computed(() => {
  const art = memoryStore.rewardArt as Record<string, unknown> | null

  if (!art) return ''

  const directPath =
    typeof art.path === 'string'
      ? art.path
      : typeof art.imagePath === 'string'
        ? art.imagePath
        : ''

  if (directPath) return directPath

  const image = art.ArtImage || art.artImage || art.image

  if (image && typeof image === 'object') {
    const imageRecord = image as Record<string, unknown>

    if (typeof imageRecord.path === 'string') return imageRecord.path
    if (typeof imageRecord.imagePath === 'string') return imageRecord.imagePath
  }

  return ''
})

function setRewardMode(event: Event) {
  const target = event.target as HTMLSelectElement | null

  if (!target) return

  if (
    target.value === 'manual' ||
    target.value === 'text' ||
    target.value === 'image' ||
    target.value === 'both'
  ) {
    memoryStore.setRewardMode(target.value)
  }
}

function setAutoClaimRewards(event: Event) {
  const target = event.target as HTMLInputElement | null

  if (!target) return

  memoryStore.setAutoClaimRewards(target.checked)
}

onMounted(async () => {
  await memoryStore.initialize()

  if (!milestoneStore.highMatchScores.length) {
    await milestoneStore.fetchHighMatchScores()
  }
})
</script>

<style scoped>
.memory-card {
  width: var(--memory-card-size, 100%);
  perspective: 1000px;
}

.memory-card-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.45s ease;
}

.memory-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.memory-card-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 1rem;
  backface-visibility: hidden;
}

.memory-card-back {
  transform: rotateY(0deg);
}

.memory-card-front {
  transform: rotateY(180deg);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
