<template>
  <div class="grid gap-3 @4xl:grid-cols-2">
    <section class="kr-panel space-y-3 p-4">
      <h2 class="font-serif text-2xl font-bold">Saves</h2>
      <p class="text-xs opacity-70">
        The court saves itself after every order. Slots keep a run, with all its
        dawns, until you overwrite them.
      </p>
      <ul class="space-y-2">
        <li
          v-for="(slot, i) in court.slots"
          :key="i"
          class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-content/15 bg-base-100 p-3 text-sm"
        >
          <span>
            <strong>Slot {{ i + 1 }}</strong>
            <span v-if="slot" class="block text-xs opacity-70">
              {{ slot.label }} · Day {{ slot.book.current.day }} ·
              {{ new Date(slot.savedAt).toLocaleString() }}
            </span>
            <span v-else class="block text-xs opacity-60">Empty</span>
          </span>
          <span class="flex gap-1">
            <button
              type="button"
              class="btn btn-xs btn-outline"
              @click="save(i)"
            >
              Save here
            </button>
            <button
              v-if="slot"
              type="button"
              class="btn btn-xs btn-warning"
              @click="act(() => court.loadFromSlot(i), `Loaded slot ${i + 1}.`)"
            >
              Load
            </button>
            <button
              v-if="slot"
              type="button"
              class="btn btn-xs btn-ghost"
              @click="act(() => court.clearSlot(i), `Cleared slot ${i + 1}.`)"
            >
              Clear
            </button>
          </span>
        </li>
      </ul>
      <div class="border-t border-base-content/10 pt-3">
        <button
          v-if="!confirmNew"
          type="button"
          class="btn btn-sm btn-ghost"
          @click="confirmNew = true"
        >
          Start a new reign…
        </button>
        <span v-else class="flex flex-wrap items-center gap-2 text-sm">
          The current run will be replaced (slots are kept).
          <button type="button" class="btn btn-sm btn-error" @click="startOver">
            Begin again
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            @click="confirmNew = false"
          >
            Keep ruling
          </button>
        </span>
      </div>
    </section>

    <section class="kr-panel space-y-3 p-4">
      <h2 class="font-serif text-2xl font-bold">Rewind</h2>
      <p class="text-xs opacity-70">
        Return to the dawn of an earlier day. Everything after it is undone, and
        the wasteland rolls fresh: chores, quest results and injuries may come
        out differently. Secrets you uncovered and relics you earned stay yours.
      </p>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="day in court.rewindableDays"
          :key="day"
          type="button"
          class="btn btn-xs"
          :class="pendingDay === day ? 'btn-warning' : 'btn-outline'"
          @click="pendingDay = day"
        >
          Day {{ day }}
        </button>
      </div>
      <p v-if="pendingDay" class="flex flex-wrap items-center gap-2 text-sm">
        Rewind to dawn of Day {{ pendingDay }}?
        <button type="button" class="btn btn-sm btn-warning" @click="rewind">
          Rewind
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          @click="pendingDay = null"
        >
          Cancel
        </button>
      </p>
    </section>

    <section class="@container kr-panel space-y-3 p-4 @4xl:col-span-2">
      <h2 class="font-serif text-2xl font-bold">Items of Power</h2>
      <p class="text-xs opacity-70">
        Relics belong to you, not to a run. Choose up to
        {{ court.relicVault.slots }} for your next reign. Secrets uncovered:
        {{ court.codex.revealed.length }}.
      </p>
      <div class="grid gap-2 @md:grid-cols-2">
        <article
          v-for="(relic, id) in RELICS"
          :key="id"
          class="rounded-xl border border-base-content/15 bg-base-100 p-3 text-sm"
        >
          <strong class="font-serif text-lg">{{ relic.name }}</strong>
          <p class="text-xs opacity-75">{{ relic.description }}</p>
          <p class="mt-1 text-xs font-semibold">
            <template v-if="court.relicVault.owned.includes(id)">
              Collected<span v-if="run.equippedRelics.includes(id)">
                · equipped this reign</span
              >
            </template>
            <template v-else>Not yet earned</template>
          </p>
          <button
            v-if="court.claimable.includes(id)"
            type="button"
            class="btn btn-xs btn-warning mt-2"
            @click="act(() => court.claimRelic(id), `${relic.name} is yours.`)"
          >
            Claim
          </button>
          <label
            v-if="court.relicVault.owned.includes(id)"
            class="mt-2 flex items-center gap-2 text-xs"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-xs checkbox-warning"
              :checked="court.relicVault.nextLoadout.includes(id)"
              @change="toggleRelic(id)"
            />
            Bring to the next reign
          </label>
        </article>
      </div>
    </section>
    <p v-if="message" class="kr-note p-2 text-sm @4xl:col-span-2" role="status">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { RELICS } from '~/utils/emperorOfDust/fortress/relics'
import type { RelicId } from '~/utils/emperorOfDust/fortress/relics'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const message = ref('')
const confirmNew = ref(false)
const pendingDay = ref<number | null>(null)

function act(action: () => void, done: string) {
  try {
    action()
    message.value = done
  } catch (cause) {
    message.value =
      cause instanceof Error ? cause.message : 'That did not work.'
  }
}

function save(slot: number) {
  act(
    () => court.saveToSlot(slot, `Day ${court.day}`),
    `Saved to slot ${slot + 1}.`,
  )
}

function startOver() {
  act(() => court.newRun(), 'A new reign begins.')
  confirmNew.value = false
}

function rewind() {
  const day = pendingDay.value
  if (!day) return
  act(() => court.rewind(day), `Rewound to dawn of Day ${day}.`)
  pendingDay.value = null
}

function toggleRelic(id: RelicId) {
  const current = court.relicVault.nextLoadout
  const next = current.includes(id)
    ? current.filter((entry) => entry !== id)
    : [...current, id]
  act(() => court.setNextRelics(next), 'Your next reign’s relics are chosen.')
}
</script>
