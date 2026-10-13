<template>
  <section class="kr-panel space-y-4 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-warning">
          Dynasty collection
        </p>
        <h3 class="font-serif text-2xl font-bold">Items of Power</h3>
        <p class="mt-1 max-w-2xl text-sm opacity-75">
          Earned relics survive a new campaign. Choose the next run's loadout
          before restarting. Equipped items are locked in for the current run.
        </p>
      </div>
      <span
        class="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
      >
        {{ court.relicVault.nextLoadout.length }} / {{ court.relicVault.slots }}
        slots prepared
      </span>
    </div>
    <p v-if="notice" class="kr-note p-3 text-sm" role="status">{{ notice }}</p>
    <div
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3"
    >
      <article
        v-for="entry in relicEntries"
        :key="entry.id"
        class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-2xl border border-base-content/15 bg-base-100 p-3"
      >
        <div
          class="grid min-h-28 place-items-center rounded-xl border border-warning/30 bg-gradient-to-br from-amber-800/40 via-base-300 to-slate-800/30"
          :aria-label="entry.name + ' placeholder illustration'"
        >
          <span class="font-serif text-4xl text-warning" aria-hidden="true">
            {{ entry.id === 'eye-of-elder-crow' ? '◉' : '⌛' }}
          </span>
        </div>
        <div class="flex min-w-0 flex-col gap-2">
          <strong class="font-serif text-lg">{{ entry.name }}</strong>
          <p class="text-xs opacity-75">{{ entry.description }}</p>
          <p class="text-xs font-semibold text-warning">
            {{
              court.relicVault.owned.includes(entry.id)
                ? 'Collected'
                : 'Locked: story reward from Day ' + entry.unlockDay + ' onward'
            }}
          </p>
          <p v-if="activeRelics.includes(entry.id)" class="text-xs font-bold">
            Active this run
          </p>
          <button
            v-if="court.relicVault.owned.includes(entry.id)"
            type="button"
            class="btn btn-sm btn-outline mt-auto"
            @click="toggleNext(entry.id)"
          >
            {{
              court.relicVault.nextLoadout.includes(entry.id)
                ? 'Unequip for next run'
                : 'Equip for next run'
            }}
          </button>
          <button
            v-else-if="canClaim(entry.id)"
            type="button"
            class="btn btn-sm btn-warning mt-auto"
            @click="claim(entry.id)"
          >
            Claim earned relic
          </button>
        </div>
      </article>
    </div>
    <p class="text-xs opacity-70">
      The second slot unlocks through a later story milestone. The Eye marks the
      false briefing. The Hourglass shortens one outbound trip per day, not its
      return journey. These relic illustrations are placeholders until final art
      arrives.
    </p>
    <button
      v-if="canUnlockSecondSlot"
      type="button"
      class="btn btn-sm btn-outline"
      @click="unlockSecond"
    >
      Claim second relic slot
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEmperorOfDustStore } from '~/stores/emperorOfDustStore'
import { dayAt } from '~/utils/emperorOfDust/engine'
import { RELICS } from '~/utils/emperorOfDust/relics'
import type { RelicId } from '~/utils/emperorOfDust/relics'

const court = useEmperorOfDustStore()
const notice = ref('')
const relicEntries = (
  Object.entries(RELICS) as [RelicId, (typeof RELICS)[RelicId]][]
).map(([id, definition]) => ({ id, ...definition }))
const activeRelics = computed(() => court.campaign?.equippedRelics ?? [])
const canUnlockSecondSlot = computed(
  () =>
    court.relicVault.slots === 1 &&
    !!court.campaign &&
    dayAt(court.campaign.hour) >= 41 &&
    (court.campaign.flags ?? []).includes('relic-second-slot-earned'),
)

function canClaim(id: RelicId): boolean {
  const campaign = court.campaign
  const definition = RELICS[id]
  return (
    !!campaign &&
    dayAt(campaign.hour) >= definition.unlockDay &&
    (campaign.flags ?? []).includes(definition.unlockFlag)
  )
}

function perform(fn: () => void, success: string) {
  try {
    fn()
    notice.value = success
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : 'Could not update relics.'
  }
}

function toggleNext(id: RelicId) {
  const loadout = court.relicVault.nextLoadout
  const next = loadout.includes(id)
    ? loadout.filter((existing) => existing !== id)
    : [...loadout, id]
  perform(
    () => court.setNextRelics(next),
    'Next campaign loadout saved. Current run is unchanged.',
  )
}

function claim(id: RelicId) {
  perform(() => court.claimRelic(id), 'Relic added to the collection.')
}

function unlockSecond() {
  perform(
    () => court.unlockSecondRelicSlot(),
    'A second relic slot is now available.',
  )
}
</script>
