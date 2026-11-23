<template>
  <section
    class="dh-builder kr-panes"
    data-testid="dh-builder"
    aria-label="Choose your party"
  >
    <div class="dh-builder-roster">
      <div class="kr-toolbar flex-wrap gap-2 px-1 pb-2">
        <div class="join" role="tablist" aria-label="Pick">
          <button
            type="button"
            role="tab"
            class="btn btn-sm join-item"
            :class="mode === 'hero' ? 'btn-primary' : 'btn-ghost'"
            :aria-selected="mode === 'hero'"
            data-testid="dh-mode-hero"
            @click="showHero"
          >
            Hero
          </button>
          <button
            type="button"
            role="tab"
            class="btn btn-sm join-item"
            :class="mode === 'party' ? 'btn-primary' : 'btn-ghost'"
            :aria-selected="mode === 'party'"
            data-testid="dh-mode-party"
            @click="mode = 'party'"
          >
            Companions {{ dh.companions.length }}/3
          </button>
        </div>
        <button
          v-if="mode === 'hero'"
          type="button"
          class="btn btn-sm btn-secondary rounded-2xl"
          data-testid="dh-create-custom"
          @click="dh.createCustomHero()"
        >
          Create original hero
        </button>
        <select
          id="dh-role-filter"
          v-model="dh.roleFilter"
          class="select select-sm rounded-2xl"
          aria-label="Filter by role"
        >
          <option value="all">Every role</option>
          <option v-for="r in roles" :key="r.id" :value="r.id">
            {{ r.label }}
          </option>
        </select>
      </div>
      <div class="dh-roster-grid kr-pane-scroll" data-testid="dh-roster">
        <button
          v-for="c in shown"
          :key="c.id"
          type="button"
          class="dh-roster-card"
          :class="{
            'is-hero': c.id === dh.hero.presetId,
            'is-party': dh.companions.includes(c.id),
            'is-focus': c.id === dh.focus,
          }"
          :aria-pressed="
            mode === 'hero'
              ? c.id === dh.hero.presetId
              : dh.companions.includes(c.id)
          "
          :data-testid="`dh-pick-${c.id}`"
          @click="pick(c.id)"
        >
          <DeepheartPortrait
            :id="c.id"
            size="sm"
            caption
            :badge="badgeFor(c.id)"
          />
        </button>
      </div>
    </div>

    <aside class="dh-builder-detail kr-pane-scroll" aria-label="Delver details">
      <div class="dh-detail-hero">
        <DeepheartPortrait
          :id="focused.id"
          :name="focused.id === CUSTOM_HERO_ID ? dh.hero.name : undefined"
          :custom-role="dh.hero.custom?.role"
          size="lg"
          class="dh-detail-portrait"
        />
        <div class="dh-detail-identity">
          <h2 class="pf-display text-xl leading-tight text-primary">
            {{ focused.name }}
          </h2>
          <p class="text-sm">{{ role.label }} · {{ pronoun }}</p>
          <p
            v-if="
              focused.id === CUSTOM_HERO_ID ||
              dh.chronicle.met.includes(focused.id)
            "
            class="pk-prose mt-1 line-clamp-2 text-xs"
          >
            {{ focused.blurb }}
          </p>
        </div>
      </div>

      <dl class="dh-stats">
        <template v-for="key in statKeys" :key="key">
          <dt>{{ STAT_LABEL[key] }}</dt>
          <dd>
            <span class="dh-stat-bar">
              <span :style="{ width: `${statPercent(key)}%` }" />
            </span>
            <span class="tabular-nums">{{ statValue(key) }}</span>
          </dd>
        </template>
      </dl>

      <div class="dh-detail-block">
        <p>
          <strong>{{ role.skill.name }}.</strong> {{ role.skill.text }}
        </p>
        <p class="opacity-80">{{ role.perk }}</p>
      </div>

      <div v-if="knownLikes.length || knownDislike" class="flex flex-wrap gap-1">
        <span
          v-for="v in knownLikes"
          :key="v"
          class="badge badge-accent badge-sm"
          >Likes {{ VALUE_LABEL[v] }}</span
        >
        <span v-if="knownDislike" class="badge badge-error badge-sm"
          >Dislikes {{ VALUE_LABEL[knownDislike] }}</span
        >
      </div>

      <p v-if="dh.romanceOn && knownRomance" class="text-sm" data-testid="dh-romance-note">
        <Icon name="kind-icon:heart" class="size-4 text-secondary" />
        {{ romanceNote }}
      </p>

      <ul v-if="focusSupports.length" class="dh-detail-list">
        <li v-for="s in focusSupports" :key="s.name">
          <strong>{{ s.name }}</strong> with {{ otherName(s) }}
          <span class="opacity-70">({{ s.kind }})</span>
        </li>
      </ul>

      <form
        v-if="focused.id === dh.hero.presetId"
        class="dh-hero-form"
        aria-label="Customize your hero"
        @submit.prevent
      >
        <label class="form-control" for="dh-hero-name">
          <span class="label-text text-xs">Name</span>
          <input
            id="dh-hero-name"
            :value="dh.hero.name"
            :placeholder="focused.name"
            class="input input-sm rounded-2xl"
            maxlength="24"
            @input="dh.setHeroName(($event.target as HTMLInputElement).value)"
          />
        </label>
        <fieldset v-if="dh.hero.custom">
          <legend class="text-xs">Identity</legend>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="g in genders"
              :key="g"
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                dh.hero.gender === g
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-content/20'
              "
              :aria-pressed="dh.hero.gender === g"
              @click="dh.setHeroGender(g)"
            >
              {{ IDENTITY[g] }}
            </button>
          </div>
        </fieldset>
        <fieldset v-if="dh.romanceOn && dh.hero.custom">
          <legend class="text-xs">Drawn to</legend>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="g in genders"
              :key="g"
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                dh.hero.drawnTo.includes(g)
                  ? 'btn-secondary'
                  : 'btn-ghost border border-base-content/20'
              "
              :aria-pressed="dh.hero.drawnTo.includes(g)"
              :data-testid="`dh-drawn-${g}`"
              @click="dh.toggleDrawnTo(g)"
            >
              {{ GENDER_LABEL[g] }}
            </button>
          </div>
        </fieldset>
        <label v-if="dh.hero.custom" class="form-control" for="dh-custom-role">
          <span class="label-text text-xs">Your class</span>
          <select
            id="dh-custom-role"
            class="select select-sm rounded-2xl"
            :value="dh.hero.custom.role"
            @change="
              dh.setCustomRole(
                ($event.target as HTMLSelectElement).value as RoleId,
              )
            "
          >
            <option v-for="r in roles" :key="r.id" :value="r.id">
              {{ r.label }}
            </option>
          </select>
        </label>
        <label
          v-if="dh.hero.custom"
          class="form-control"
          for="dh-custom-appearance"
        >
          <span class="label-text text-xs">Visual species and appearance</span>
          <input
            id="dh-custom-appearance"
            class="input input-sm rounded-2xl"
            maxlength="120"
            :value="dh.hero.custom.appearance"
            placeholder="Adult silver fox with a scar and travel cloak"
            @input="
              dh.setCustomAppearance(($event.target as HTMLInputElement).value)
            "
          />
        </label>
        <fieldset v-if="dh.hero.custom" data-testid="dh-custom-points">
          <legend class="text-xs">
            Train your strengths · {{ dh.unspentPoints }} points remaining
          </legend>
          <div
            v-for="key in statKeys"
            :key="key"
            class="flex items-center justify-between gap-2 py-0.5 text-xs"
          >
            <span
              >{{ STAT_LABEL[key] }} ·
              {{ dh.hero.custom.points[key] ?? 0 }}</span
            >
            <div class="join">
              <button
                type="button"
                class="btn btn-xs join-item"
                :disabled="!(dh.hero.custom.points[key] ?? 0)"
                :aria-label="`Reduce ${STAT_LABEL[key]}`"
                @click="dh.adjustCustomPoint(key, -1)"
              >
                −
              </button>
              <button
                type="button"
                class="btn btn-xs join-item"
                :disabled="dh.unspentPoints === 0"
                :aria-label="`Raise ${STAT_LABEL[key]}`"
                @click="dh.adjustCustomPoint(key, 1)"
              >
                +
              </button>
            </div>
          </div>
        </fieldset>
        <label class="form-control" for="dh-hero-boon">
          <span class="label-text text-xs">Boon</span>
          <select
            id="dh-hero-boon"
            :value="dh.hero.boon"
            class="select select-sm rounded-2xl"
            @change="
              dh.setBoon(($event.target as HTMLSelectElement).value as StatKey)
            "
          >
            <option v-for="key in statKeys" :key="key" :value="key">
              +{{ key === 'hp' ? 10 : 3 }} {{ STAT_LABEL[key] }}
            </option>
          </select>
        </label>
      </form>
    </aside>

    <footer class="dh-builder-party" aria-label="Your party">
      <div class="dh-party-slots">
        <DeepheartPortrait
          :id="dh.hero.presetId"
          :custom-role="dh.hero.custom?.role"
          size="sm"
          caption
          badge="Hero"
          :name="dh.hero.name || undefined"
          class="dh-slot"
        />
        <button
          v-for="i in 3"
          :key="i"
          type="button"
          class="dh-slot dh-slot-empty"
          :aria-label="
            dh.companions[i - 1]
              ? `Remove ${nameOf(dh.companions[i - 1]!)}`
              : 'Empty companion slot'
          "
          @click="
            dh.companions[i - 1]
              ? dh.toggleCompanion(dh.companions[i - 1]!)
              : (mode = 'party')
          "
        >
          <DeepheartPortrait
            v-if="dh.companions[i - 1]"
            :id="dh.companions[i - 1]!"
            size="sm"
            caption
            :badge="
              dh.romanceOn && dh.chronicle.romances.includes(dh.companions[i - 1]!)
                ? '♥'
                : ''
            "
          />
          <span v-else class="text-2xl opacity-40">+</span>
        </button>
      </div>

      <div class="dh-party-info">
        <div class="flex flex-wrap gap-1" aria-label="Synergies">
          <span
            v-for="s in dh.builderSynergies"
            :key="s.id"
            class="badge badge-primary badge-sm"
            :title="s.text"
            >{{ s.name }}</span
          >
          <span
            v-for="s in knownBuilderSupports"
            :key="s.name"
            class="badge badge-accent badge-sm"
            :title="s.scene"
            >{{ s.name }}</span
          >
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="pf-display text-lg tabular-nums text-primary"
            data-testid="dh-score"
          >
            {{ dh.partyScore.total }}
          </span>
          <select
            id="dh-goal"
            :value="dh.goal"
            class="select select-xs rounded-2xl"
            aria-label="What to optimize for"
            @change="
              dh.optimize(
                ($event.target as HTMLSelectElement).value as PartyGoal,
              )
            "
          >
            <option v-for="[g, label] in availableGoals" :key="g" :value="g">
              {{ label }}
            </option>
          </select>
          <button
            type="button"
            class="btn btn-xs btn-secondary rounded-2xl"
            data-testid="dh-optimize"
            @click="dh.optimize()"
          >
            Optimize
          </button>
          <button
            type="button"
            class="btn btn-xs btn-ghost rounded-2xl"
            @click="dh.randomParty()"
          >
            Random
          </button>
        </div>
        <div
          v-if="dh.suggestions.length"
          class="flex flex-wrap gap-1"
          aria-label="Suggested parties"
        >
          <button
            v-for="s in dh.suggestions"
            :key="s.companions.join()"
            type="button"
            class="btn btn-xs rounded-2xl border border-primary/40"
            :title="s.lines.map((l) => `${l.label} ${l.points}`).join(' · ')"
            data-testid="dh-suggestion"
            @click="dh.useSuggestion(s)"
          >
            {{ s.companions.map(nameOf).join(', ') }} · {{ s.total }}
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          @click="dh.screen = 'title'"
        >
          Back
        </button>
        <button
          type="button"
          class="btn btn-primary rounded-2xl"
          :disabled="!dh.companions.length"
          data-testid="dh-begin"
          @click="dh.startDelve()"
        >
          <Icon name="kind-icon:dungeon" class="size-5" />
          Begin the delve
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { baseStat } from '~/utils/deepheart/engine'
import { GOAL_LABEL, type PartyGoal } from '~/utils/deepheart/party'
import {
  CHARACTERS,
  GENDER_LABEL,
  ROLES,
  SUPPORTS,
  VALUE_LABEL,
  character,
  shortName,
} from '~/utils/deepheart/roster'
import { CUSTOM_HERO_ID } from '~/utils/deepheart/types'
import type { Gender, RoleId, StatKey, Support } from '~/utils/deepheart/types'

const dh = useDeepheartStore()
const mode = ref<'hero' | 'party'>('hero')

// One function, not a two-statement inline handler: the production
// template compiler rejects newline-separated statements in @click.
function showHero() {
  mode.value = 'hero'
  dh.focus = dh.hero.presetId
}

const statKeys: StatKey[] = ['hp', 'atk', 'def', 'mag', 'spd', 'wit']
const genders: Gender[] = ['w', 'm', 'n']
const STAT_LABEL: Record<StatKey, string> = {
  hp: 'Health',
  atk: 'Attack',
  def: 'Defence',
  mag: 'Magic',
  spd: 'Speed',
  wit: 'Wits',
}
const IDENTITY: Record<Gender, string> = {
  w: 'Woman',
  m: 'Man',
  n: 'Nonbinary',
}
const STAT_MAX: Record<StatKey, number> = {
  hp: 75,
  atk: 20,
  def: 16,
  mag: 21,
  spd: 17,
  wit: 20,
}

const roles = Object.values(ROLES)
const availableGoals = computed(() =>
  Object.entries(GOAL_LABEL).filter(
    ([id]) => id !== 'romance' || dh.chronicle.romances.length > 0,
  ),
)

const shown = computed(() =>
  CHARACTERS.filter((c) => {
    if (dh.roleFilter === 'all') return true
    return c.role === dh.roleFilter
  }),
)

const knownBuilderSupports = computed(() =>
  dh.builderSupports.filter((support) =>
    dh.chronicle.supports.includes([support.a, support.b].sort().join('+')),
  ),
)

const focused = computed(() =>
  dh.focus === CUSTOM_HERO_ID
    ? {
        ...character('idris'),
        id: CUSTOM_HERO_ID,
        name: dh.hero.name.trim() || 'Your original delver',
        role: dh.hero.custom?.role ?? 'warrior',
        gender: dh.hero.gender,
        blurb:
          dh.hero.custom?.appearance ||
          'An original adventurer, defined by your choices, not a preset biography.',
        likes: [],
      }
    : character(dh.focus),
)
const knownLikes = computed(() =>
  focused.value.id === CUSTOM_HERO_ID
    ? []
    : focused.value.likes.filter((value) =>
        dh.chronicle.values[focused.value.id]?.includes(value),
      ),
)
const knownDislike = computed(() => {
  if (focused.value.id === CUSTOM_HERO_ID) return null
  const dislike = focused.value.dislikes
  return dh.chronicle.values[focused.value.id]?.includes(dislike)
    ? dislike
    : null
})
const knownRomance = computed(
  () =>
    focused.value.id !== CUSTOM_HERO_ID &&
    dh.chronicle.romances.includes(focused.value.id),
)
const role = computed(() => ROLES[focused.value.role])
const pronoun = computed(
  () => ({ w: 'she/her', m: 'he/him', n: 'they/them' })[focused.value.gender],
)

function statValue(key: StatKey) {
  const id = focused.value.id
  return baseStat(id, key, id === dh.hero.presetId ? dh.hero : undefined)
}

function statPercent(key: StatKey) {
  return Math.min(100, Math.round((statValue(key) / STAT_MAX[key]) * 100))
}

const romanceNote = computed(() => {
  const c = focused.value
  if (c.id === dh.hero.presetId) {
    const drawn = dh.hero.drawnTo.map((g) => GENDER_LABEL[g]).join(', ')
    return drawn
      ? `Your hero is drawn to ${drawn}.`
      : 'Your hero is aromantic: deep oaths, no romance.'
  }
  if (!c.romanceable && c.partner)
    return `Married to ${character(c.partner).name}. Not romanceable.`
  if (!c.romanceable)
    return 'Aromantic. Can swear a deep platonic oath instead.'
  const drawn = c.drawnTo.map((g) => GENDER_LABEL[g]).join(', ')
  const yes = canRomance(dh.hero, c.id, [
    ...dh.companions.filter((x) => x !== c.id),
    c.id,
  ])
  const poly =
    c.poly && c.partner
      ? ` Courted together with ${character(c.partner).name}.`
      : ''
  return `Drawn to ${drawn}.${poly} ${yes ? 'A possible romance for your hero.' : 'Not a romance for this hero.'}`
})

const focusSupports = computed(() =>
  dh.focus === CUSTOM_HERO_ID
    ? []
    : SUPPORTS.filter(
        (s) =>
          (s.a === dh.focus || s.b === dh.focus) &&
          dh.chronicle.supports.includes([s.a, s.b].sort().join('+')),
      ),
)

function otherName(s: Support) {
  return character(s.a === dh.focus ? s.b : s.a).name
}

function nameOf(id: string) {
  return shortName(character(id))
}

function badgeFor(id: string) {
  if (id === dh.hero.presetId) return 'Hero'
  if (dh.companions.includes(id)) return 'Party'
  return ''
}

function pick(id: string) {
  if (mode.value === 'hero') {
    dh.chooseHero(id)
    mode.value = 'party'
  } else if (id === dh.hero.presetId) dh.focus = id
  else dh.toggleCompanion(id)
}
</script>

<style scoped>
.dh-builder {
  display: grid;
  height: 100%;
  min-height: 0;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  grid-template-areas: 'roster' 'detail' 'party';
}
@container (min-width: 56rem) {
  .dh-builder {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-areas: 'roster detail' 'party party';
  }
}
.dh-builder-roster {
  grid-area: roster;
  display: flex;
  min-height: 0;
  flex-direction: column;
}
.dh-roster-grid {
  display: grid;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  align-content: start;
  padding: 0.25rem;
}
.dh-roster-card {
  border-radius: var(--radius-box);
  outline-offset: 2px;
  transition: transform 120ms ease;
}
.dh-roster-card:hover,
.dh-roster-card:focus-visible {
  transform: translateY(-2px);
}
.dh-roster-card.is-party {
  outline: 2px solid var(--color-accent);
}
.dh-roster-card.is-hero {
  outline: 2px solid var(--color-primary);
}
.dh-roster-card.is-focus {
  box-shadow: 0 0 0 4px
    color-mix(in oklch, var(--color-primary) 35%, transparent);
}
.dh-builder-detail {
  grid-area: detail;
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.6rem;
  overflow-y: auto;
  border-radius: var(--radius-box);
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 85%, transparent);
  padding: 0.85rem;
}
.dh-detail-hero {
  position: relative;
  flex: 0 0 auto;
  height: clamp(10rem, 27vh, 17rem);
  min-height: 0;
  overflow: hidden;
  border-radius: var(--radius-box);
}
.dh-detail-portrait {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
}
.dh-detail-identity {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: 3.5rem 0.8rem 0.8rem;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.92) 70%);
  color: white;
}
.dh-stats {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 0.6rem;
  font-size: 0.75rem;
}
.dh-stats dd {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.dh-stat-bar {
  flex: 1;
  height: 0.4rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-content) 12%, transparent);
  overflow: clip;
}
.dh-stat-bar > span {
  display: block;
  height: 100%;
  background: var(--color-primary);
}
.dh-detail-block {
  display: grid;
  gap: 0.25rem;
  font-size: 0.85rem;
}
.dh-detail-list {
  display: grid;
  gap: 0.2rem;
  font-size: 0.8rem;
}
.dh-hero-form {
  display: grid;
  gap: 0.5rem;
  border-top: 1px solid
    color-mix(in oklch, var(--color-base-content) 12%, transparent);
  padding-top: 0.6rem;
}
.dh-builder-party {
  grid-area: party;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--radius-box);
  border: 1px solid color-mix(in oklch, var(--color-primary) 30%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 92%, transparent);
  padding: 0.6rem;
}
.dh-party-slots {
  display: flex;
  gap: 0.4rem;
}
.dh-slot {
  width: 4.25rem;
}
.dh-slot-empty {
  display: grid;
  aspect-ratio: 3 / 4;
  place-items: center;
  border-radius: var(--radius-box);
  border: 1px dashed
    color-mix(in oklch, var(--color-base-content) 30%, transparent);
}
.dh-party-info {
  display: grid;
  flex: 1;
  min-width: 14rem;
  gap: 0.35rem;
}
</style>
