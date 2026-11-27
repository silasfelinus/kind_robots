<template>
  <section
    v-if="run"
    class="dh-delve"
    data-testid="dh-delve"
    :aria-label="layer.name"
  >
    <header class="dh-party-strip" aria-label="Party">
      <div
        v-for="m in run.party"
        :key="m.id"
        class="dh-member"
        :class="{ 'is-actor': actor?.id === m.id, 'is-down': m.down }"
        :data-testid="`dh-member-${m.id}`"
      >
        <DeepheartPortrait
          :id="m.id"
          :name="m.id === run.hero.presetId ? engine.heroName(run) : undefined"
          :custom-role="run.hero.custom?.role"
          size="xs"
          :down="m.down"
          class="w-10 shrink-0"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-bold">
            {{ engine.nameOf(run, m.id) }}
            <Icon
              v-if="run.partners.includes(m.id) && dh.romanceOn"
              name="kind-icon:heart"
              class="size-3 text-secondary"
            />
          </p>
          <div class="dh-hp" :title="`${m.hp} of ${engine.maxHp(run, m.id)}`">
            <span :style="{ width: `${hpPercent(m.id, m.hp)}%` }" />
          </div>
          <p class="text-[0.6rem] tabular-nums opacity-75">
            {{ m.hp }}/{{ engine.maxHp(run, m.id) }}
            <span v-if="m.poison" class="text-success">· poisoned</span>
            <span v-if="m.cooldown" class="opacity-70">· {{ m.cooldown }}</span>
          </p>
        </div>
      </div>
      <div class="dh-where">
        <p class="pf-display text-sm text-primary">{{ layer.name }}</p>
        <p class="text-xs opacity-75 tabular-nums">
          Room {{ Math.min(run.depth + 1, 7) }} of 7 · {{ run.gold }} gold ·
          {{ run.potions }} potions · Mercy {{ run.mercy }} · Sacrifices
          {{ run.sacrifices ?? 0 }}
        </p>
      </div>
    </header>

    <div class="dh-stage">
      <div v-if="campFaces.length && !campMomentArt" class="dh-camp-faces">
        <DeepheartPortrait
          v-for="id in campFaces"
          :id="id"
          :key="id"
          size="lg"
          class="dh-camp-face"
        />
      </div>
      <div
        v-else-if="roomArt"
        class="dh-room-plate"
        :class="{ 'is-discovery': !!campMomentArt }"
      >
        <PlaybookKitArt :art="roomArt" tone="primary" />
      </div>
      <template v-if="run.phase === 'map'">
        <p class="dh-prompt">Choose a door.</p>
        <DeepheartHand
          :choices="doorCards"
          :deal-key="`doors-${run.layer}-${run.depth}`"
          :animate="animate"
          testid-prefix="dh-door"
          @play="(id: string) => dh.chooseDoor(Number(id))"
        />
      </template>

      <DeepheartFight v-else-if="run.phase === 'fight'" />

      <DeepheartPuzzle v-else-if="run.phase === 'puzzle'" />

      <template v-else-if="run.phase === 'treasure'">
        <p class="dh-prompt">{{ treasureLine }}</p>
        <DeepheartHand
          :choices="treasureCards"
          :deal-key="`treasure-${run.turns}`"
          :animate="animate"
          testid-prefix="dh-treasure"
          @play="(id: string) => dh.openTreasure(id as engine.TreasureChoice)"
        />
      </template>

      <template v-else-if="run.phase === 'choice' && ev">
        <div class="dh-scene">
          <h2 class="pf-display text-xl text-primary">{{ ev.title }}</h2>
          <p class="pk-prose">{{ ev.text }}</p>
        </div>
        <DeepheartHand
          :choices="eventCards"
          :deal-key="`event-${ev.id}-${run.turns}`"
          :animate="animate"
          testid-prefix="dh-option"
          @play="(id: string) => dh.chooseOption(id)"
        />
      </template>

      <template v-else-if="run.phase === 'camp'">
        <div class="dh-scene">
          <h2 class="pf-display text-xl text-primary">Campfire</h2>
          <p
            v-if="dh.lastLine"
            class="pk-prose dh-line"
            data-testid="dh-camp-line"
          >
            {{ dh.lastLine }}
          </p>
          <p v-else class="pk-prose">
            The fire is warm. There is time for {{ run.camp?.talks ?? 0 }} more
            {{ run.camp?.talks === 1 ? 'conversation' : 'conversations' }}.
          </p>
        </div>
        <DeepheartHand
          v-if="campCards.length"
          :choices="campCards"
          :deal-key="`camp-${run.turns}-${run.camp?.talks}`"
          :animate="animate"
          testid-prefix="dh-camp"
          @play="playCamp"
        />
        <button
          type="button"
          class="btn btn-primary btn-sm self-center rounded-2xl"
          data-testid="dh-break-camp"
          @click="dh.leaveCamp()"
        >
          Break camp
        </button>
      </template>

      <template v-else-if="run.phase === 'loot' && loot">
        <div class="dh-scene">
          <h2 class="pf-display text-xl text-primary">{{ loot.name }}</h2>
          <p class="pk-prose">{{ loot.text }}. Who takes it?</p>
        </div>
        <DeepheartHand
          :choices="lootCards"
          :deal-key="`loot-${loot.id}-${run.turns}`"
          :animate="animate"
          testid-prefix="dh-loot"
          @play="(id: string) => dh.equip(id === 'sell' ? null : id)"
        />
      </template>

      <template v-else-if="run.phase === 'finale'">
        <div class="dh-scene">
          <h2 class="pf-display text-xl text-secondary">The Deepheart</h2>
          <p class="pk-prose">
            It beats on a pillar of cooling stone, red and slow and enormous.
            Everything you did on the way down has led here. What now?
          </p>
        </div>
        <DeepheartHand
          :choices="finaleCards"
          deal-key="finale"
          :animate="animate"
          testid-prefix="dh-ending"
          @play="(id: string) => dh.chooseEnding(id as EndingId)"
        />
      </template>

      <template v-else-if="run.phase === 'court'">
        <div class="dh-scene">
          <h2 class="pf-display text-xl text-secondary">
            {{
              run.courtSelected ? 'The last bargain' : 'The Court at the Bottom'
            }}
          </h2>
          <p class="pk-prose">
            {{
              run.courtSelected
                ? 'Your patron makes one final offer. Negotiate, expose, or defy, and roll the dice.'
                : 'The human-faced nobles arrive with gifts, threats, and family scandals. Whose audience will you accept?'
            }}
          </p>
        </div>
        <DeepheartHand
          :choices="courtCards"
          :deal-key="`court-${run.courtSelected ?? 'select'}`"
          :animate="animate"
          testid-prefix="dh-court"
          @play="(id: string) => dh.chooseCourtOption(id)"
        />
      </template>

      <DeepheartEnding v-else-if="run.phase === 'ended'" />
    </div>

    <footer class="dh-delve-foot">
      <ul class="dh-notices" aria-live="polite" data-testid="dh-notices">
        <li
          v-for="(n, i) in run.notices.slice(-4)"
          :key="i"
          :class="`is-${n.tone}`"
        >
          {{ n.text }}
        </li>
      </ul>
      <div class="flex gap-1">
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="dh.screen = 'saves'"
        >
          <Icon name="kind-icon:save" class="size-4" /> Save
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="dh.screen = 'title'"
        >
          <Icon name="kind-icon:home" class="size-4" /> Menu
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { ENEMIES, LAYERS, item } from '~/utils/deepheart/dungeon'
import { encounterArt, enemyArt, ROOM_ART } from '~/utils/deepheart/art'
import { DEEPHEART } from '~/utils/playbookKit/games/deepheart'
import { deepheartArtSrc } from '~/utils/deepheart/renderedArt'
import * as engine from '~/utils/deepheart/engine'
import { ROLES, character } from '~/utils/deepheart/roster'
import { roleFor } from '~/utils/deepheart/party'
import type { EndingId, RoomKind } from '~/utils/deepheart/types'
import type { DhCard } from './deepheart-hand.vue'

const dh = useDeepheartStore()
const kit = usePlaybookKitStore()
const run = computed(() => dh.run)
const layer = computed(() => LAYERS[run.value?.layer ?? 0]!)
const actor = computed(() =>
  run.value ? engine.currentActor(run.value) : null,
)
const animate = computed(() => kit.settings.motion !== 'reduced')
const ev = computed(() => (run.value ? engine.currentEvent(run.value) : null))
const loot = computed(() => (run.value?.loot ? item(run.value.loot) : null))
const campFaces = computed(() =>
  run.value?.phase === 'camp' && dh.lastLine ? dh.lastFaces : [],
)
const campMomentArt = computed(() => {
  if (run.value?.phase !== 'camp' || !dh.lastMoment) return null
  const art = DEEPHEART.moments.find((m) => m.id === dh.lastMoment)?.art
  // A moment without delivered art keeps the painted camp-room backdrop.
  return art?.src ? art : null
})
const roomArt = computed(() => {
  const current = run.value
  if (!current || current.phase === 'ended') return null
  if (current.phase === 'map')
    return DEEPHEART.moments.find((moment) => moment.id === layer.value.moment)
      ?.art
  if (current.phase === 'fight' && current.combat?.boss) {
    const art = enemyArt(layer.value.boss)
    if (art) return art
  }
  if (current.phase === 'choice' && ev.value) {
    if (ev.value.id.startsWith('fairy-')) {
      const ruler = DEEPHEART.cast.find((member) => member.id === ev.value?.id)
      if (ruler?.portrait.src) return ruler.portrait
    }
    const art = encounterArt(ev.value)
    if (art) return art
  }
  if (current.phase === 'fight') {
    const art = DEEPHEART.moments.find(
      (moment) => moment.id === layer.value.moment,
    )?.art
    if (art?.src) return art
  }
  return campMomentArt.value ?? ROOM_ART[current.room?.kind ?? 'boss']
})

const ROOM: Record<RoomKind, { label: string; icon: string; hint: string }> = {
  fight: { label: 'Monsters', icon: '⚔', hint: 'A fight, with spoils' },
  puzzle: { label: 'Sealed Door', icon: '❖', hint: 'A puzzle for your wits' },
  treasure: { label: 'Treasure', icon: '◈', hint: 'A chest, probably safe' },
  choice: { label: 'Strange Room', icon: '✧', hint: 'A choice to make' },
  camp: { label: 'Campfire', icon: '♨', hint: 'Rest, heal and talk' },
  boss: { label: 'Boss', icon: '♛', hint: 'The guardian of this layer' },
}

function hpPercent(id: string, hp: number) {
  return run.value ? Math.round((hp / engine.maxHp(run.value, id)) * 100) : 0
}

const doorCards = computed<DhCard[]>(() => {
  const r = run.value
  if (!r) return []
  return engine.doors(r).map((room, i) => {
    if (room.kind === 'boss') {
      const boss = ENEMIES[layer.value.boss]!
      return {
        id: String(i),
        label: boss.name,
        chip: 'Boss',
        image: enemyArt(boss.id)?.src ?? deepheartArtSrc('room:boss'),
        hint: ROOM.boss.hint,
        icon: ROOM.boss.icon,
      }
    }
    if (!room.known)
      return {
        id: String(i),
        label: 'Unknown door',
        chip: '?',
        hint: 'Scouts would know',
        icon: '?',
      }
    const info = ROOM[room.kind]
    return {
      id: String(i),
      label: info.label,
      chip: 'Scouted',
      image: deepheartArtSrc(`room:${room.kind}`),
      hint: info.hint,
      icon: info.icon,
    }
  })
})

const treasureLine = computed(() => {
  const t = run.value?.treasure
  if (!t) return ''
  if (!t.sensed) return 'An iron-bound chest. It is probably just a chest.'
  if (t.mimic) return 'Your party spots it: the chest is breathing. A mimic.'
  if (t.trap) return 'Your party spots a needle trap in the lock.'
  return 'Your party checks it carefully. It is safe.'
})

const TREASURE: Record<
  engine.TreasureChoice,
  { label: string; hint: string; icon: string }
> = {
  open: { label: 'Open it', hint: 'Gold, maybe gear', icon: '◈' },
  disarm: { label: 'Disarm and open', hint: 'Careful fingers', icon: '⚙' },
  fight: {
    label: 'Fight the mimic',
    hint: 'It guards a double hoard',
    icon: '⚔',
  },
  leave: { label: 'Leave it', hint: 'Better safe', icon: '↩' },
}

const treasureCards = computed<DhCard[]>(() =>
  run.value
    ? engine.treasureChoices(run.value).map((c) => ({ id: c, ...TREASURE[c] }))
    : [],
)

const eventCards = computed<DhCard[]>(() => {
  const r = run.value
  if (!r || !ev.value) return []
  return ev.value.options.map((o) => {
    const lock = engine.optionLock(r, o)
    return {
      id: o.id,
      label: o.label,
      chip: o.tag ? o.tag[0]!.toUpperCase() + o.tag.slice(1) : '',
      hint:
        lock ??
        (o.check
          ? `${o.hint} · Crew modifier +${engine.abilityModifier(r, o.check.stat)}`
          : o.hint),
      icon: '✧',
      disabled: !!lock,
    }
  })
})

const campCards = computed<DhCard[]>(() =>
  dh.campOptions.map((o, i) => {
    if (o.kind === 'shop')
      return {
        id: String(i),
        label: o.label,
        chip: 'Ottoline',
        hint: 'Heals half',
        icon: '⚱',
      }
    if (o.kind === 'support') {
      const [a] = o.key.split('+') as [string]
      return {
        id: String(i),
        label: o.label,
        chip: o.tier === 2 ? 'Bond II' : 'Bond I',
        hint:
          o.tier === 2
            ? 'A deeper trust strengthens their shared abilities'
            : 'Discover what binds these two together',
        portrait: a,
      }
    }
    const c = character(o.id)
    const chip =
      o.kind === 'romance'
        ? '♥ Romance'
        : o.kind === 'oath'
          ? 'Oath'
          : `Bond ${run.value?.affinity[o.id] ?? 0}/10`
    return {
      id: String(i),
      label: o.label,
      chip,
      hint: o.line,
      portrait: c.id,
      badge: o.kind === 'romance' ? '♥' : undefined,
    }
  }),
)

function playCamp(id: string) {
  const option = dh.campOptions[Number(id)]
  if (option) dh.campAction(option)
}

const lootCards = computed<DhCard[]>(() => {
  const r = run.value
  if (!r || !loot.value) return []
  const cards: DhCard[] = r.party
    .filter((m) => !m.down)
    .map((m) => ({
      id: m.id,
      label: engine.nameOf(r, m.id),
      chip: m.item ? `Has ${item(m.item).name}` : 'Empty hands',
      hint:
        m.id === r.hero.presetId
          ? ROLES[roleFor(m.id, r.hero)].label
          : character(m.id).name,
      portrait: m.id,
    }))
  cards.push({
    id: 'sell',
    label: 'Sell it',
    chip: `${12 * (loot.value.layer + 1)} gold`,
    hint: 'Ottoline will buy it',
    icon: '¤',
  })
  return cards
})

const courtCards = computed<DhCard[]>(() =>
  run.value
    ? engine.courtOptions(run.value).map((option) => ({
        id: option.id,
        label: option.label,
        hint: option.hint,
        icon: '♜',
      }))
    : [],
)

const finaleCards = computed<DhCard[]>(() =>
  run.value
    ? engine
        .finaleOptions(run.value)
        .filter((o) => dh.romanceOn || o.ending !== 'hearthbound')
        .map((o) => ({ id: o.ending, label: o.label, hint: o.hint, icon: '♥' }))
    : [],
)
</script>

<style scoped>
.dh-delve {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.5rem;
}
.dh-party-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.dh-member {
  display: flex;
  min-width: 8.5rem;
  flex: 1 1 8.5rem;
  max-width: 13rem;
  align-items: center;
  gap: 0.4rem;
  border-radius: var(--radius-box);
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 85%, transparent);
  padding: 0.3rem;
}
.dh-member.is-actor {
  border-color: var(--color-primary);
  box-shadow: 0 0 12px
    color-mix(in oklch, var(--color-primary) 45%, transparent);
}
.dh-hp {
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-error) 25%, transparent);
  overflow: clip;
}
.dh-hp > span {
  display: block;
  height: 100%;
  background: var(--color-success);
  transition: width 200ms ease;
}
.dh-where {
  margin-left: auto;
  text-align: right;
}
.dh-stage {
  display: flex;
  min-height: 0;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.5rem;
  overflow-y: auto;
  border-radius: var(--radius-box);
  background:
    radial-gradient(
      80% 60% at 50% 100%,
      color-mix(in oklch, var(--color-primary) 14%, transparent),
      transparent 70%
    ),
    color-mix(in oklch, var(--color-base-200) 70%, transparent);
  padding: 0.75rem;
}
.dh-room-plate {
  width: 100%;
  height: clamp(4.5rem, 18vh, 9rem);
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: var(--radius-box);
}
.dh-room-plate.is-discovery {
  height: clamp(9rem, 30vh, 17rem);
}
.dh-camp-faces {
  display: flex;
  width: 100%;
  flex: 0 0 auto;
  align-items: stretch;
  justify-content: center;
  gap: 0.5rem;
}
.dh-camp-face {
  width: min(28vw, 10rem);
  height: clamp(8rem, 24vh, 15rem);
  aspect-ratio: 3 / 4;
}
.dh-room-plate :deep(.pk-art) {
  width: 100%;
  height: 100%;
}
.dh-prompt {
  text-align: center;
  font-family: var(--pf-display, ui-serif, Georgia, serif);
  font-size: 1.1rem;
  color: var(--color-primary);
}
.dh-scene {
  display: grid;
  gap: 0.35rem;
  max-width: 44rem;
  margin-inline: auto;
  text-align: center;
}
.dh-line {
  border-left: 3px solid var(--color-secondary);
  padding-left: 0.75rem;
  text-align: left;
  font-style: italic;
}
.dh-delve-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
}
.dh-notices {
  display: grid;
  min-width: 0;
  gap: 0.1rem;
  font-size: 0.75rem;
}
.dh-notices .is-good {
  color: var(--color-success);
}
.dh-notices .is-bad {
  color: var(--color-error);
}
.dh-notices .is-heart {
  color: var(--color-secondary);
}
.dh-notices .is-info {
  opacity: 0.85;
}
</style>
