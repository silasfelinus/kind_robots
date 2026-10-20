<template>
  <div
    class="absolute inset-0 z-40 grid place-items-center bg-black/75 p-2 sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="`Dawn of Day ${report.day}`"
  >
    <div
      class="kr-panel @container flex max-h-full w-full max-w-5xl flex-col overflow-hidden p-0"
    >
      <div
        class="emperor-sky relative h-16 shrink-0 sm:h-24"
        aria-hidden="true"
      >
        <span class="emperor-sun" />
        <span
          class="eod-display absolute inset-x-0 bottom-2 z-10 text-center text-2xl text-amber-50 drop-shadow sm:text-3xl"
          >Dawn of Day {{ report.day }}</span
        >
      </div>

      <ol
        v-if="pages > 1"
        class="flex shrink-0 justify-center gap-1.5 pt-2"
        aria-label="Reports"
      >
        <li
          v-for="i in pages"
          :key="i"
          class="h-1.5 w-6 rounded-full"
          :class="i - 1 <= page ? 'bg-warning' : 'bg-base-content/25'"
          :aria-current="i - 1 === page ? 'step' : undefined"
        />
      </ol>

      <div class="kr-scroll min-h-0 flex-1 p-3 sm:p-4">
        <section
          v-if="onMapPage"
          class="space-y-3"
          aria-label="The map has changed"
        >
          <p
            class="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-warning"
          >
            The map room · end of {{ actName }}
          </p>
          <ul class="grid gap-3 @3xl:grid-cols-2">
            <li
              v-for="(card, i) in mapCards"
              :key="i"
              class="overflow-hidden rounded-lg border"
              :class="card.border"
            >
              <div
                class="relative h-28 bg-base-300 sm:h-36"
                :class="card.dim ? 'grayscale' : ''"
                :style="regionCropStyle(card.region)"
                role="img"
                :aria-label="`The painted map around ${card.regionName}`"
              >
                <span
                  class="eod-banner absolute right-3 top-0 grid h-14 w-10 place-items-center pb-2 font-serif text-lg font-bold"
                  :class="card.banner"
                  aria-hidden="true"
                  >{{ card.initial }}</span
                >
                <span
                  class="eod-display absolute bottom-2 left-2 rounded px-2 py-0.5 text-xs"
                  :class="card.ribbon"
                  >{{ card.label }}</span
                >
              </div>
              <div class="p-3">
                <h2 class="font-serif text-xl font-bold text-warning">
                  {{ card.title }}
                </h2>
                <p class="font-serif text-base italic leading-relaxed">
                  {{ card.text }}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <article
          v-else-if="current"
          :key="current.questId"
          class="grid gap-3 @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
        >
          <div class="relative">
            <EmperorFortressQuestImage
              :quest-id="current.questId"
              :region="questDef(current.questId)?.region ?? ''"
              :label="`${title(current.questId)}: ${tierLabel(current.tier)}`"
              :variant="outcomeVariant(current.tier)"
              :faded="current.tier === 'expired'"
              class="aspect-[16/10] w-full rounded-lg"
            />
            <span
              class="eod-display absolute left-2 top-2 rounded px-2 py-0.5 text-sm"
              :class="ribbonClass(current.tier)"
              >{{ tierLabel(current.tier) }}</span
            >
          </div>
          <div class="flex min-h-0 flex-col gap-2">
            <h2 class="font-serif text-2xl font-bold text-warning">
              {{ title(current.questId) }}
            </h2>
            <p class="font-serif text-base italic leading-relaxed sm:text-lg">
              {{ outcome(current.questId, current.tier) }}
            </p>
            <ul v-if="current.party.length" class="flex flex-wrap gap-2">
              <li
                v-for="id in current.party"
                :key="id"
                class="flex w-20 flex-col items-center gap-1 text-center"
              >
                <span
                  class="block h-24 w-20 overflow-hidden rounded-md border bg-base-200"
                  :class="
                    current.deaths.includes(id)
                      ? 'border-base-content/30 grayscale'
                      : injuryOf(id)
                        ? 'border-error/70'
                        : 'border-warning/50'
                  "
                >
                  <img
                    v-if="partyArt(id)"
                    :src="partyArt(id)"
                    :alt="`${nameOf(id)}, ${moodLine(id)}`"
                    class="h-full w-full object-cover object-top"
                  />
                </span>
                <span class="w-full truncate text-xs font-semibold">{{
                  nameOf(id)
                }}</span>
                <span
                  class="text-[10px]"
                  :class="
                    current.deaths.includes(id) || injuryOf(id)
                      ? 'text-error'
                      : 'opacity-70'
                  "
                  >{{ moodLine(id) }}</span
                >
              </li>
            </ul>
            <p v-if="current.party.length" class="text-xs opacity-70">
              {{ current.chance }}% chance of success
            </p>
            <div
              v-if="current.revealedTraits.length"
              class="rounded-md border border-warning/50 bg-warning/10 p-2"
            >
              <p
                class="text-[10px] font-semibold uppercase tracking-[0.2em] text-warning"
              >
                Learned on the road · into the Codex
              </p>
              <ul class="mt-1 space-y-1 text-xs">
                <li v-for="id in current.revealedTraits" :key="id">
                  <strong>{{ traitOwner(id) }}</strong>
                  <span class="opacity-70"> · {{ traitKind(id) }}</span>
                  <span class="block font-semibold">{{
                    codexTrait(id)?.trait.name
                  }}</span>
                  <span class="block opacity-85">{{
                    codexTrait(id)?.trait.text
                  }}</span>
                </li>
              </ul>
            </div>
          </div>
        </article>

        <section v-else class="space-y-3">
          <p
            v-if="!report.quests.length && !report.events.length"
            class="font-serif italic opacity-80"
          >
            A quiet night. Nobody came home, and nothing went wrong.
          </p>
          <img
            v-if="betrayalArt"
            :src="betrayalArt"
            alt="Young Komodo in an abbey robe, holding up the imperial seal"
            class="mx-auto block max-h-80 w-auto rounded-lg bg-base-200 object-contain"
          />
          <ul v-if="report.events.length" class="space-y-1.5 text-sm">
            <li
              v-for="(event, i) in report.events"
              :key="i"
              class="border-l-2 border-warning/60 pl-3"
            >
              {{ event }}
            </li>
          </ul>
          <ul
            v-if="report.quests.length"
            class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"
            aria-label="Last night's quests"
          >
            <li v-for="(quest, i) in report.quests" :key="quest.questId">
              <button
                type="button"
                class="block w-full overflow-hidden rounded-md border border-warning/25 text-left"
                @click="page = i + mapPages"
              >
                <EmperorFortressQuestImage
                  :quest-id="quest.questId"
                  :region="questDef(quest.questId)?.region ?? ''"
                  :label="title(quest.questId)"
                  :variant="outcomeVariant(quest.tier)"
                  :faded="quest.tier === 'expired'"
                  class="aspect-[16/9]"
                />
                <span class="block truncate px-2 pt-1 text-xs font-semibold">{{
                  title(quest.questId)
                }}</span>
                <span
                  class="block px-2 pb-1 text-[10px] font-bold uppercase"
                  :class="tierText(quest.tier)"
                  >{{ tierLabel(quest.tier) }}</span
                >
              </button>
            </li>
          </ul>
          <p class="eod-chip p-3 text-sm">
            Taxes +{{ report.taxes }} brass · wages −{{
              report.wages
            }}
            brass<span v-if="report.loanTaken">
              · the Ledger covered the shortfall</span
            >
          </p>
        </section>
      </div>

      <div
        class="flex shrink-0 items-center justify-between gap-2 border-t border-warning/20 p-3"
      >
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="page === 0"
          @click="page -= 1"
        >
          Back
        </button>
        <button
          v-if="page < pages - 1"
          type="button"
          class="eod-finish px-5 py-1.5 text-sm"
          @click="page += 1"
        >
          {{ page === pages - 2 ? 'The ledger' : 'Next report' }}
        </button>
        <button
          v-else
          type="button"
          class="eod-finish px-5 py-1.5 text-sm"
          @click="emit('close')"
        >
          To the morning briefing
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  castArtUrl,
  followerPortrait,
  illustration,
} from '~/utils/emperorOfDust/fortress/castArt'
import {
  outcomeVariant,
  regionCropStyle,
} from '~/utils/emperorOfDust/fortress/questArt'
import {
  factionName,
  mapEventText,
  regionName,
} from '~/utils/emperorOfDust/fortress/engine'
import { REGIONS } from '~/utils/emperorOfDust/fortress/factions'
import { questDef } from '~/utils/emperorOfDust/fortress/content'
import { followerDef } from '~/utils/emperorOfDust/fortress/followers'
import { codexEntry, codexTrait } from '~/utils/emperorOfDust/fortress/codex'
import type {
  DawnReport,
  MapEvent,
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

// The act-end map first, then one page per quest that came home or
// expired, then the ledger.
const page = ref(0)
const mapPages = computed(() => (props.report.map?.length ? 1 : 0))
const pages = computed(() => mapPages.value + props.report.quests.length + 1)
const onMapPage = computed(() => mapPages.value === 1 && page.value === 0)
const current = computed(() =>
  page.value < mapPages.value
    ? undefined
    : props.report.quests[page.value - mapPages.value],
)

const ACT_NAMES = ['', 'Act I', 'Act II', 'Act III', 'Act IV']
const actName = computed(
  () => ACT_NAMES[Math.floor((props.report.day - 1) / 10)] ?? 'the act',
)
const CARD_STYLE: Record<
  MapEvent['kind'],
  { label: string; border: string; ribbon: string; dim?: boolean }
> = {
  revealed: {
    label: 'A new banner',
    border: 'border-warning/60',
    ribbon: 'bg-warning text-warning-content',
  },
  wiped: {
    label: 'Wiped from the map',
    border: 'border-error/70',
    ribbon: 'bg-error text-error-content',
    dim: true,
  },
  taken: {
    label: 'Land changes hands',
    border: 'border-error/50',
    ribbon: 'bg-error/90 text-error-content',
  },
  held: {
    label: 'Held',
    border: 'border-success/50',
    ribbon: 'bg-success text-success-content',
  },
  'warned-wipe': {
    label: 'Warning',
    border: 'border-warning/40',
    ribbon: 'bg-base-300 text-warning',
  },
  'warned-raid': {
    label: 'Warning',
    border: 'border-warning/40',
    ribbon: 'bg-base-300 text-warning',
  },
}
const ORDER: MapEvent['kind'][] = [
  'revealed',
  'wiped',
  'taken',
  'held',
  'warned-wipe',
  'warned-raid',
]
const mapCards = computed(() =>
  [...(props.report.map ?? [])]
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .map((event) => {
      const region =
        event.region ??
        REGIONS.find((entry) => entry.controller === event.faction)?.id ??
        ''
      const banner = event.kind === 'taken' ? event.by : event.faction
      return {
        ...mapEventText(event),
        ...CARD_STYLE[event.kind],
        region,
        regionName: regionName(region),
        initial: factionName(banner ?? event.faction)
          .replace(/^The /, '')
          .charAt(0),
        banner:
          event.kind === 'wiped'
            ? 'eod-banner-gone'
            : event.kind.startsWith('warned')
              ? 'eod-banner-hostile'
              : 'eod-banner-neutral',
      }
    }),
)

const injuryOf = (id: string) =>
  current.value?.injuries.find((injury) => injury.followerId === id)
/** The party as they came home: the tier's mood, or their wound. */
const partyArt = (id: string) => {
  const quest = current.value
  if (!quest) return undefined
  if (quest.deaths.includes(id)) return followerPortrait(id, 'dead')
  if (injuryOf(id)) return followerPortrait(id, 'injured')
  const mood =
    quest.tier === 'triumph'
      ? 'excited'
      : quest.tier === 'success'
        ? 'happy'
        : quest.tier === 'failure'
          ? 'sad'
          : 'neutral'
  return illustration('followers', id, mood) ?? followerPortrait(id)
}
const moodLine = (id: string) => {
  if (current.value?.deaths.includes(id)) return 'did not come home'
  const injury = injuryOf(id)
  if (injury)
    return `injured, ${injury.days} day${injury.days === 1 ? '' : 's'}`
  return 'home safe'
}

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
const ribbonClass = (tier: QuestReport['tier']) =>
  ({
    triumph: 'bg-success text-success-content',
    success: 'bg-success/85 text-success-content',
    partial: 'bg-warning text-warning-content',
    failure: 'bg-error text-error-content',
    expired: 'bg-base-300 text-base-content',
  })[tier]
const tierText = (tier: QuestReport['tier']) =>
  ({
    triumph: 'text-success',
    success: 'text-success',
    partial: 'text-warning',
    failure: 'text-error',
    expired: 'opacity-60',
  })[tier]
const traitOwner = (id: string) => codexTrait(id)?.follower.name ?? id
const traitKind = (id: string) => codexEntry(id)?.kindLabel ?? ''
</script>

<style scoped>
.emperor-sky {
  background: linear-gradient(180deg, #1e1b3a, #3b2a4a);
  animation: emperor-dawn 2.4s ease-out forwards;
}
.emperor-sun {
  position: absolute;
  left: 82%;
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
