<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-3"
    role="dialog"
    aria-modal="true"
    :aria-label="`Dawn of Day ${report.day}`"
  >
    <div
      class="w-full max-w-2xl overflow-hidden rounded-3xl border border-warning/30 bg-base-100 shadow-2xl"
    >
      <div class="emperor-sky relative h-28 sm:h-36" aria-hidden="true">
        <span class="emperor-sun" />
        <span
          class="absolute inset-x-0 bottom-3 text-center font-serif text-3xl font-bold text-amber-50 drop-shadow"
          >Day {{ report.day }}</span
        >
      </div>
      <div class="max-h-[60vh] space-y-3 overflow-y-auto p-4">
        <p
          v-if="!report.quests.length && !report.events.length"
          class="text-sm opacity-75"
        >
          A quiet night. Nobody came home, and nothing went wrong.
        </p>
        <article
          v-for="quest in report.quests"
          :key="quest.questId"
          class="rounded-xl border p-3"
          :class="tierClass(quest.tier)"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <strong class="font-serif text-lg">{{
              title(quest.questId)
            }}</strong>
            <span class="text-xs font-bold uppercase">{{
              tierLabel(quest.tier)
            }}</span>
          </div>
          <p class="mt-1 text-sm">{{ outcome(quest.questId, quest.tier) }}</p>
          <p v-if="quest.party.length" class="mt-1 text-xs opacity-70">
            {{ quest.party.map(nameOf).join(', ') }} · {{ quest.chance }}%
            chance
          </p>
          <ul class="mt-1 space-y-0.5 text-xs">
            <li
              v-for="injury in quest.injuries"
              :key="injury.followerId"
              class="text-error"
            >
              {{ nameOf(injury.followerId) }} is injured for
              {{ injury.days }} day(s).
            </li>
            <li
              v-for="id in quest.deaths"
              :key="id"
              class="font-bold text-error"
            >
              {{ nameOf(id) }} did not come home.
            </li>
            <li
              v-for="id in quest.revealedTraits"
              :key="id"
              class="text-warning"
            >
              Revealed: {{ traitLine(id) }}
            </li>
          </ul>
        </article>
        <img
          v-if="betrayalArt"
          :src="betrayalArt"
          alt="Young Komodo in an abbey robe, holding up the imperial seal"
          class="mx-auto block max-h-80 w-auto rounded-xl bg-base-200 object-contain"
        />
        <ul v-if="report.events.length" class="space-y-1 text-sm">
          <li v-for="(event, i) in report.events" :key="i">{{ event }}</li>
        </ul>
        <p class="rounded-xl bg-base-200 p-3 text-sm">
          Taxes +{{ report.taxes }} brass · wages −{{ report.wages }} brass<span
            v-if="report.loanTaken"
          >
            · the Ledger covered the shortfall</span
          >
        </p>
      </div>
      <div class="border-t border-base-content/10 p-3 text-right">
        <button type="button" class="btn btn-warning" @click="emit('close')">
          To the throne room
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { castArtUrl } from '~/utils/emperorOfDust/fortress/castArt'
import { questDef } from '~/utils/emperorOfDust/fortress/content'
import {
  FOLLOWERS,
  followerDef,
} from '~/utils/emperorOfDust/fortress/followers'
import type {
  DawnReport,
  QuestReport,
} from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ report: DawnReport }>()
const emit = defineEmits<{ close: [] }>()

/** Day 41 is the dawn Young Komodo betrays the throne (engine actEnd). */
const betrayalArt = computed(() =>
  props.report.day === 41
    ? castArtUrl('npcs/young-komodo/illustrated/betrayal')
    : undefined,
)

const nameOf = (id: string) => followerDef(id)?.name ?? id
const title = (id: string) => questDef(id)?.title ?? id
const outcome = (id: string, tier: QuestReport['tier']) => {
  const outcomes = questDef(id)?.outcomes ?? {}
  return (
    outcomes[tier] ??
    (tier === 'triumph' ? outcomes.success : undefined) ??
    (tier === 'expired' ? 'Nobody went. The chance passed.' : '')
  )
}
const tierLabel = (tier: QuestReport['tier']) =>
  ({
    triumph: 'Triumph',
    success: 'Success',
    partial: 'Partial',
    failure: 'Failure',
    expired: 'Expired',
  })[tier]
const tierClass = (tier: QuestReport['tier']) =>
  ({
    triumph: 'border-success bg-success/10',
    success: 'border-success/50 bg-success/5',
    partial: 'border-warning/50 bg-warning/5',
    failure: 'border-error/50 bg-error/5',
    expired: 'border-base-content/20 bg-base-200/60',
  })[tier]
const traitLine = (id: string) => {
  const trait = FOLLOWERS.flatMap((def) => def.traits).find((t) => t.id === id)
  if (!trait) return id
  const owner = nameOf(id.split('-')[0] ?? '')
  return `${owner}: ${trait.name} (${trait.amount > 0 ? 'strength' : 'weakness'})`
}
</script>

<style scoped>
.emperor-sky {
  background: linear-gradient(180deg, #1e1b3a, #3b2a4a);
  animation: emperor-dawn 2.4s ease-out forwards;
}
.emperor-sun {
  position: absolute;
  left: 50%;
  bottom: -2.5rem;
  width: 5rem;
  height: 5rem;
  margin-left: -2.5rem;
  border-radius: 9999px;
  background: radial-gradient(circle, #fde68a, #f59e0b 60%, transparent 70%);
  animation: emperor-sunrise 2.4s ease-out forwards;
}
@keyframes emperor-dawn {
  0% {
    background: linear-gradient(180deg, #0b0a1a, #1e1b3a);
  }
  60% {
    background: linear-gradient(180deg, #3b2a4a, #b45309);
  }
  100% {
    background: linear-gradient(180deg, #7c5a3a, #f2b35b);
  }
}
@keyframes emperor-sunrise {
  from {
    transform: translateY(2rem);
    opacity: 0.2;
  }
  to {
    transform: translateY(-1.5rem);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .emperor-sky,
  .emperor-sun {
    animation-duration: 1ms;
  }
}
</style>
