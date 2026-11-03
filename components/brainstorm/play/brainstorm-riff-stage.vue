<template>
  <div class="bs-stage" data-testid="brainstorm-stage">
    <div
      v-if="store.detailState === 'loading' && !detail"
      class="bs-stage-empty"
    >
      Pulling up a chair…
    </div>
    <div v-else-if="!detail" class="bs-stage-empty">
      <p>{{ store.detailError || 'That table is gone.' }}</p>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="emit('back')"
      >
        Back to the tables
      </button>
    </div>

    <template v-else>
      <header class="bs-prompt">
        <div class="bs-prompt-kind">
          <span aria-hidden="true">{{ flavor.icon }}</span>
          {{ flavor.label }}
        </div>
        <h2 class="bs-prompt-title" data-testid="brainstorm-prompt-title">
          {{ detail.riff.title }}
        </h2>
        <p v-if="detail.riff.vibe" class="bs-prompt-vibe">
          {{ detail.riff.vibe }}
        </p>
        <div v-if="detail.riff.crossovers.length" class="flex flex-wrap gap-1">
          <span
            v-for="persona in detail.riff.crossovers"
            :key="persona.id"
            class="badge badge-secondary badge-sm"
          >
            {{ persona.title }}
          </span>
        </div>
        <div class="bs-prompt-row">
          <div class="join" role="group" aria-label="Sort lines">
            <button
              v-for="option in sorts"
              :key="option.id"
              type="button"
              class="btn btn-xs join-item"
              :class="store.sort === option.id ? 'btn-accent' : 'btn-ghost'"
              :data-testid="`brainstorm-sort-${option.id}`"
              @click="store.sort = option.id"
            >
              {{ option.label }}
            </button>
          </div>
          <span class="bs-prompt-count">💬 {{ visibleLines.length }}</span>
          <button
            type="button"
            class="btn btn-ghost btn-xs ml-auto"
            data-testid="brainstorm-share"
            @click="share"
          >
            {{ copied ? 'Link copied' : '🔗 Invite' }}
          </button>
        </div>
      </header>

      <div class="kr-scroll bs-feed" data-testid="brainstorm-feed">
        <p v-if="!visibleLines.length" class="bs-feed-empty">
          Empty table. First line gets the best seat.
        </p>
        <div v-else class="bs-feed-grid">
          <brainstorm-line-card
            v-for="(line, index) in visibleLines"
            :key="line.id"
            :line="line"
            :stem="detail.riff.stem"
            :rank="rankFor(index, line.points)"
          />
        </div>
      </div>

      <div
        v-if="store.sparks.length"
        class="bs-sparks"
        data-testid="brainstorm-sparks"
      >
        <div class="bs-sparks-head">
          <span>⚡ The coach's angles: pick one, then write your own line</span>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            @click="store.sparks = []"
          >
            Hide
          </button>
        </div>
        <kr-choice-hand
          :choices="sparkChoices"
          :deal-key="store.sparkDealKey"
          question="Which way do you want to take it?"
          tuck
          testid-prefix="brainstorm-spark"
          @play="playSpark"
        />
      </div>

      <form
        class="bs-dock"
        data-testid="brainstorm-composer"
        @submit.prevent="send"
      >
        <transition name="bs-cheer">
          <p
            v-if="cheerVisible"
            :key="store.cheerKey"
            class="bs-cheer"
            role="status"
          >
            {{ store.cheer }}
          </p>
        </transition>
        <p v-if="store.draftSpark" class="bs-spark-hint">
          <strong>⚡ {{ store.draftSpark.title }}:</strong>
          {{ store.draftSpark.text }}
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            @click="store.clearSpark()"
          >
            ✕
          </button>
        </p>
        <p
          v-if="store.postError || store.sparkError"
          class="bs-dock-error"
          role="alert"
        >
          {{ store.postError || store.sparkError }}
        </p>
        <div class="bs-dock-row">
          <button
            type="button"
            class="bs-table-btn"
            :class="{ 'is-on': store.tableMode }"
            :aria-label="
              store.tableMode ? 'Table mode on' : 'Set up table mode'
            "
            data-testid="brainstorm-table-mode"
            @click="tableOpen = true"
          >
            👥
          </button>
          <label class="bs-input">
            <span v-if="stemText" class="bs-input-stem">{{ stemText }}</span>
            <input
              ref="inputEl"
              v-model="store.draft"
              :maxlength="limits.line"
              :placeholder="placeholder"
              :disabled="!detail.riff.isOpen"
              enterkeyhint="send"
              data-testid="brainstorm-line-input"
            />
          </label>
          <button
            type="button"
            class="bs-pad bs-pad-b"
            :disabled="store.sparkState === 'thinking'"
            :aria-label="'Spark me: ask the coach for angles'"
            data-testid="brainstorm-spark-me"
            @click="store.requestSparks()"
          >
            <span class="bs-pad-key">B</span>
            <span class="bs-pad-label">
              {{ store.sparkState === 'thinking' ? 'Hmm…' : 'Spark' }}
            </span>
          </button>
          <button
            type="submit"
            class="bs-pad bs-pad-a"
            :disabled="store.posting || !store.draft.trim()"
            aria-label="Send your line"
            data-testid="brainstorm-send"
          >
            <span class="bs-pad-key">A</span>
            <span class="bs-pad-label">{{ store.posting ? '…' : 'Send' }}</span>
          </button>
        </div>
      </form>
    </template>

    <dialog class="modal" :open="tableOpen" @close="tableOpen = false">
      <div class="modal-box">
        <h3 class="text-xl font-black">Table mode</h3>
        <p class="mt-2 text-sm opacity-80">
          Pass one device around the table. Add the players in turn order and
          each line goes under whoever's turn it is.
        </p>
        <textarea
          v-model="playersDraft"
          class="textarea textarea-bordered mt-3 w-full"
          rows="4"
          placeholder="One name per line"
          data-testid="brainstorm-table-players"
        />
        <div class="modal-action">
          <button
            v-if="store.tableMode"
            type="button"
            class="btn btn-ghost"
            @click="endTable"
          >
            Turn off
          </button>
          <button type="button" class="btn btn-primary" @click="saveTable">
            Seat everyone
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close table mode">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'
import { useBrainstormRiffStore } from '@/stores/brainstormRiffStore'
import {
  BRAINSTORM_RIFF_FLAVORS,
  BRAINSTORM_RIFF_LIMITS,
  type BrainstormLineSort,
} from '@/utils/brainstormRiffs'

const emit = defineEmits<{ back: [] }>()

const store = useBrainstormRiffStore()
const limits = BRAINSTORM_RIFF_LIMITS
const sorts: Array<{ id: BrainstormLineSort; label: string }> = [
  { id: 'hot', label: '🔥 Hot' },
  { id: 'top', label: '🏆 Top' },
  { id: 'new', label: '✨ New' },
]
const inputEl = ref<HTMLInputElement | null>(null)
const copied = ref(false)
const cheerVisible = ref(false)
const tableOpen = ref(false)
const playersDraft = ref('')
let cheerTimer: ReturnType<typeof setTimeout> | null = null

const detail = computed(() => store.detail)
const flavor = computed(
  () =>
    BRAINSTORM_RIFF_FLAVORS.find(
      (entry) => entry.id === detail.value?.riff.flavor,
    ) ?? BRAINSTORM_RIFF_FLAVORS[0]!,
)
const visibleLines = computed(() => store.sortedLines)
const stemText = computed(() =>
  (detail.value?.riff.stem || '').replace(/\s*(?:…|\.{2,})\s*$/, '').trim(),
)
const placeholder = computed(() => {
  if (store.activePlayer) return `${store.activePlayer}, show me what you got…`
  if (detail.value?.riff.flavor === 'list') return 'Add one to the list…'
  return 'Finish the line…'
})
const sparkChoices = computed<KrHandChoice[]>(() =>
  store.sparks.map((spark) => ({
    id: spark.id,
    label: spark.title,
    hint: spark.text,
    details: [spark.text],
    icon: '⚡',
  })),
)

function rankFor(index: number, points: number) {
  if (store.sort === 'new' || points <= 0) return undefined
  return ['👑 #1', '🥈 #2', '🥉 #3'][index]
}

function playSpark(choice: KrHandChoice) {
  const spark = store.sparks.find((entry) => entry.id === choice.id)
  if (!spark) return
  store.pickSpark(spark)
  void nextTick(() => inputEl.value?.focus())
}

async function send() {
  const sent = await store.submitLine()
  if (!sent) return
  cheerVisible.value = true
  if (cheerTimer) clearTimeout(cheerTimer)
  cheerTimer = setTimeout(() => {
    cheerVisible.value = false
  }, 2600)
  void nextTick(() => inputEl.value?.focus())
}

async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

function saveTable() {
  store.setTablePlayers(playersDraft.value.split(/\n|,/))
  tableOpen.value = false
}

function endTable() {
  store.setTableMode(false)
  tableOpen.value = false
}

watch(tableOpen, (open) => {
  if (open) playersDraft.value = store.tablePlayers.join('\n')
})
</script>

<style scoped>
.bs-stage {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.bs-stage-empty {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  font-weight: 800;
}

.bs-prompt {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.85rem 1rem 0.6rem;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--color-primary) 22%, var(--color-base-100)),
    var(--color-base-100)
  );
  box-shadow: 0 2px 0 color-mix(in oklch, black 35%, transparent);
}

.bs-prompt-kind {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.bs-prompt-title {
  font-size: clamp(1.4rem, 5.5vw, 2.4rem);
  font-weight: 900;
  line-height: 1.05;
  text-shadow: 0 3px 0 color-mix(in oklch, black 40%, transparent);
}

.bs-prompt-vibe {
  font-size: 0.9rem;
  color: color-mix(in oklch, var(--color-base-content) 75%, transparent);
}

.bs-prompt-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-top: 0.2rem;
}

.bs-prompt-count {
  font-size: 0.8rem;
  font-weight: 800;
}

.bs-feed {
  padding: 0.85rem;
}

.bs-feed-empty {
  padding: 2rem 1rem;
  text-align: center;
  font-weight: 800;
  color: color-mix(in oklch, var(--color-base-content) 70%, transparent);
}

.bs-feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 13.5rem), 1fr));
  gap: 0.8rem;
}

.bs-sparks {
  --hand-accent: var(--color-secondary);
  --hand-accent-2: var(--color-accent);
  --hand-band: var(--color-base-100);
  --hand-band-ink: var(--color-base-content);
  --hand-card-max: 9.5rem;
  --hand-card-vh: 24;
  flex-shrink: 0;
  overflow: clip;
  padding: 0.4rem 0.6rem 0;
  border-top: 1px solid
    color-mix(in oklch, var(--color-secondary) 35%, transparent);
  background: color-mix(
    in oklch,
    var(--color-secondary) 8%,
    var(--color-base-200)
  );
}

.bs-sparks-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-secondary);
}

.bs-dock {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem 0.7rem 0.75rem;
  background: var(--color-base-100);
  box-shadow: 0 -2px 0 color-mix(in oklch, black 30%, transparent);
}

.bs-dock-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bs-input {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.25rem 0.9rem;
  background: var(--color-base-200);
  box-shadow: inset 0 2px 4px color-mix(in oklch, black 45%, transparent);
}

.bs-input:focus-within {
  box-shadow:
    inset 0 2px 4px color-mix(in oklch, black 45%, transparent),
    0 0 0 2px var(--color-accent);
}

.bs-input-stem {
  flex-shrink: 0;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 800;
  color: var(--color-accent);
}

.bs-input input {
  min-width: 0;
  flex: 1 1 auto;
  min-height: 2.6rem;
  background: transparent;
  font-size: 1rem;
  font-weight: 700;
  outline: none;
}

.bs-table-btn {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  background: var(--color-base-300);
}

.bs-table-btn.is-on {
  background: var(--color-secondary);
}

.bs-pad {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.bs-pad:disabled {
  opacity: 0.55;
}

.bs-pad-key {
  display: grid;
  width: 2.9rem;
  height: 2.9rem;
  place-items: center;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 900;
  transition: transform 90ms ease;
}

.bs-pad:not(:disabled):active .bs-pad-key {
  transform: translateY(3px);
  box-shadow: 0 1px 0 color-mix(in oklch, black 50%, transparent);
}

.bs-pad-a .bs-pad-key {
  color: var(--color-primary-content);
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in oklch, var(--color-primary) 70%, white),
    var(--color-primary) 60%
  );
  box-shadow: 0 4px 0 color-mix(in oklch, var(--color-primary) 45%, black);
}

.bs-pad-b .bs-pad-key {
  color: var(--color-secondary-content);
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in oklch, var(--color-secondary) 70%, white),
    var(--color-secondary) 60%
  );
  box-shadow: 0 4px 0 color-mix(in oklch, var(--color-secondary) 45%, black);
}

.bs-pad-label {
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.bs-spark-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.9rem;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
  background: color-mix(in oklch, var(--color-secondary) 16%, transparent);
}

.bs-spark-hint strong {
  color: var(--color-secondary);
}

.bs-dock-error {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-error);
}

.bs-cheer {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  translate: -50% 0;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  white-space: nowrap;
  font-weight: 900;
  color: var(--color-secondary-content);
  background: var(--color-secondary);
  box-shadow: 0 6px 20px color-mix(in oklch, black 45%, transparent);
  pointer-events: none;
}

.bs-cheer-enter-active,
.bs-cheer-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.3, 1.6, 0.5, 1);
}

.bs-cheer-enter-from,
.bs-cheer-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

@media (min-width: 1024px) {
  .bs-prompt {
    padding: 1.1rem 1.5rem 0.75rem;
  }

  .bs-feed {
    padding: 1.1rem 1.5rem;
  }

  .bs-dock {
    padding: 0.75rem 1.5rem 0.9rem;
  }
}
</style>
