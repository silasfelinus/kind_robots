<template>
  <section
    class="overflow-hidden rounded-2xl border border-base-content/15 bg-base-200 shadow-lg"
    aria-label="Zuzu character, equipment and relationships"
  >
    <div class="relative">
      <img
        src="/zuzu-gamebook/scenes/zuzu-alone.webp"
        alt="Zuzu the grey koala ronin on the frontier"
        class="aspect-[16/9] w-full object-cover"
      />
      <div
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 text-white"
      >
        <p class="text-[10px] font-black uppercase tracking-[.22em] opacity-80">
          The traveling ronin
        </p>
        <h3 class="font-serif text-xl font-black">Zuzu · Character sheet</h3>
      </div>
    </div>
    <div class="space-y-4 p-4">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="flex justify-between gap-2">
            <span>Health</span>
            <strong>{{ sheet.hp }} / {{ sheet.maxHp }}</strong>
          </div>
          <progress
            class="progress progress-error mt-2 w-full"
            :value="sheet.hp"
            :max="sheet.maxHp"
            :aria-label="'Health ' + sheet.hp + ' of ' + sheet.maxHp"
          />
        </div>
        <div class="rounded-xl bg-base-300 px-3 py-2">
          <p class="text-xs opacity-70">Provisions</p>
          <strong class="font-serif text-2xl">{{ sheet.provisions }}</strong>
        </div>
      </div>
      <div class="flex justify-between gap-2 text-xs opacity-75">
        <span>{{ sheet.resolvedEncounters }} / 15 encounters</span>
        <span
          >Seed <code>{{ seed }}</code></span
        >
      </div>

      <details
        class="group rounded-xl border border-base-content/15 bg-base-300/60"
        open
      >
        <summary
          class="cursor-pointer px-3 py-3 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="kind-icon:dice" class="size-4 text-warning" />
            Skills and techniques
          </span>
        </summary>
        <div class="grid grid-cols-2 gap-2 border-t border-base-content/10 p-3">
          <div
            v-for="skill in skillNames"
            :key="skill"
            class="flex items-center justify-between rounded-lg bg-base-200 px-2 py-2 text-xs"
          >
            <span class="capitalize">{{ skill }}</span>
            <strong>+{{ sheet.skills[skill] }}</strong>
          </div>
        </div>
        <div
          v-if="sheet.techniques.length || sheet.conditions.length"
          class="space-y-2 border-t border-base-content/10 px-3 py-3 text-xs"
        >
          <p
            v-for="technique in sheet.techniques"
            :key="technique.id"
            class="flex flex-wrap justify-between gap-1"
          >
            <strong class="text-success">{{ technique.name }}</strong>
            <span>Learned · {{ technique.skill }}</span>
          </p>
          <p
            v-for="condition in sheet.conditions"
            :key="condition.id"
            class="flex flex-wrap justify-between gap-1"
          >
            <strong class="text-error">{{ condition.name }}</strong>
            <span>Injury · {{ condition.penaltySkill }}</span>
          </p>
        </div>
        <p class="px-3 pb-3 text-[11px] leading-relaxed opacity-65">
          Skills reflect your earned history. Saved dice use the rules of their
          original expedition version; this sheet does not rescore past rolls.
        </p>
      </details>

      <details
        class="group rounded-xl border border-base-content/15 bg-base-300/60"
        open
      >
        <summary
          class="cursor-pointer px-3 py-3 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="kind-icon:bag" class="size-4 text-warning" />
            Inventory ·
            {{ sheet.inventory.filter((item) => item.available).length }}
            available
          </span>
        </summary>
        <div class="space-y-2 border-t border-base-content/10 px-3 py-3">
          <p v-if="!sheet.inventory.length" class="text-xs opacity-65">
            The pack is empty. Explore to earn supplies and evidence.
          </p>
          <div
            v-for="item in sheet.inventory"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 p-3 text-xs"
          >
            <div class="min-w-0 flex-1">
              <p class="font-bold" :class="item.available ? '' : 'opacity-60'">
                {{ item.name }}
              </p>
              <p class="mt-1 opacity-65">
                {{
                  item.kind === 'evidence'
                    ? 'Evidence · kept as a clue'
                    : rewardDescription(item.id)
                }}
              </p>
              <p v-if="!item.available" class="mt-1 font-bold opacity-65">
                Already used
              </p>
            </div>
            <button
              v-if="item.kind !== 'evidence'"
              type="button"
              class="btn btn-outline btn-xs"
              :disabled="!canUse(item.id)"
              :aria-label="'Use ' + item.name"
              @click="$emit('useReward', item.id)"
            >
              Use
            </button>
          </div>
          <p
            v-if="sheet.inventory.some((item) => item.kind !== 'evidence')"
            class="text-[11px] leading-relaxed opacity-65"
          >
            Restoratives can only be consumed once, while the journey continues,
            and when they will actually restore health or provisions.
          </p>
        </div>
      </details>

      <details
        class="group rounded-xl border border-base-content/15 bg-base-300/60"
      >
        <summary
          class="cursor-pointer px-3 py-3 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="kind-icon:users" class="size-4 text-warning" />
            Allies and contacts · {{ sheet.relationships.length }}
          </span>
        </summary>
        <div class="space-y-2 border-t border-base-content/10 px-3 py-3">
          <p class="text-[11px] leading-relaxed opacity-65">
            People met along the road are not automatically traveling
            companions. Only relationships earned in your recorded encounters
            appear here.
          </p>
          <p
            v-if="!sheet.relationships.length"
            class="rounded-lg bg-base-200 p-3 text-xs opacity-70"
          >
            No established contacts yet. The road may change that.
          </p>
          <div
            v-for="contact in sheet.relationships"
            :key="contact.id"
            class="flex items-center justify-between gap-2 rounded-lg bg-base-200 px-3 py-2 text-xs"
          >
            <div>
              <p class="font-bold">{{ contact.name }}</p>
              <p class="mt-0.5 opacity-60">
                {{
                  contact.traveling
                    ? 'Traveling companion'
                    : 'Contact · not traveling'
                }}
              </p>
            </div>
            <span
              class="badge badge-sm"
              :class="
                contact.disposition === 'trusted'
                  ? 'badge-success'
                  : 'badge-warning'
              "
              >{{ contact.disposition }}</span
            >
          </div>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  canUseJourneyReward,
  type JourneyCharacterSheet,
} from '~/utils/shiftingLands/progression'
import type { Skill } from '~/utils/shiftingLands/journey'

const props = defineProps<{
  sheet: JourneyCharacterSheet
  seed: number
  phase: string
}>()
defineEmits<{ useReward: [rewardId: string] }>()

const skillNames: readonly Skill[] = [
  'steel',
  'awareness',
  'wits',
  'bearing',
  'resolve',
  'insight',
]
function rewardDescription(id: string): string {
  if (id === 'willow-bark-dose') return 'Medicine · restores up to 2 health'
  if (id === 'recovered-rations')
    return 'Supplies · restores up to 2 provisions'
  return 'Earned supply'
}
function canUse(id: string): boolean {
  if (['complete', 'fallen', 'retired'].includes(props.phase)) return false
  if (id === 'willow-bark-dose' && props.sheet.hp >= props.sheet.maxHp)
    return false
  if (id === 'recovered-rations' && props.sheet.provisions >= 30) return false
  return canUseJourneyReward(props.sheet, id)
}
</script>
