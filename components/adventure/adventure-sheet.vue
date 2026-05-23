<!-- components/adventure/adventure-sheet.vue -->
<!--
  Live compact character sheet sidebar.
  Reads entirely from adventureStore.sheet and adventureStore.completedCards.
  Clicking a completed section's Clear button calls store.removeSection(cardKey),
  returning that card to the hand.
  No emits.
-->
<template>
  <aside class="flex h-full flex-col gap-3 overflow-y-auto">
    <!-- Portrait thumbnail -->
    <div
      class="shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <div class="relative aspect-3/2 w-full overflow-hidden bg-base-300">
        <img
          v-if="sheet.imagePath"
          :src="sheet.imagePath"
          :alt="`Portrait of ${sheet.name || 'Unnamed Entity'}`"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <Icon name="kind-icon:mask" class="h-10 w-10 text-primary/20" />
          <p class="text-xs text-base-content/30 italic">
            Portrait pending.<br />The canvas is patient.
          </p>
        </div>
      </div>

      <!-- Name plate -->
      <div class="px-3 py-2.5">
        <p class="font-black text-base-content leading-tight">
          {{ sheet.name || 'Unnamed Entity' }}
        </p>
        <p class="mt-0.5 text-xs text-base-content/50 truncate">
          {{ identityLine }}
        </p>
      </div>
    </div>

    <!-- Completion progress -->
    <div class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="mb-2 flex items-center justify-between">
        <p
          class="text-xs font-bold uppercase tracking-widest text-base-content/40"
        >
          Progress
        </p>
        <p class="text-xs font-black tabular-nums text-primary">
          {{ completedCount }}/{{ totalRequired }}
        </p>
      </div>

      <!-- Progress bar -->
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-base-300">
        <div
          class="h-full rounded-full bg-primary transition-all duration-500"
          :style="{ width: `${progressPct}%` }"
        />
      </div>

      <!-- Card completion dots -->
      <div class="mt-2 flex flex-wrap gap-1.5">
        <div
          v-for="card in REQUIRED_CARDS"
          :key="card.key"
          :title="card.label"
          class="h-2 w-2 rounded-full transition-all duration-300"
          :class="
            store.completedCards[card.key]
              ? 'bg-success'
              : store.activeCardKey === card.key
                ? 'bg-primary animate-pulse'
                : 'bg-base-300'
          "
        />
      </div>
    </div>

    <!-- Sheet sections -->
    <div class="flex flex-col gap-2">
      <!-- Identity block -->
      <sheet-section
        v-if="hasIdentity"
        label="Identity"
        icon="kind-icon:mask"
        card-key="name"
      >
        <div class="grid grid-cols-1 gap-1">
          <sheet-field label="Name" :value="sheet.name" />
          <sheet-field label="Honorific" :value="sheet.honorific" />
          <sheet-field label="Title" :value="sheet.title" />
          <sheet-field label="Role" :value="sheet.role" />
          <sheet-field label="Genre" :value="sheet.genre" />
        </div>
      </sheet-section>

      <!-- Origin block -->
      <sheet-section
        v-if="hasOrigin"
        label="Origin"
        icon="kind-icon:species"
        card-key="origin"
      >
        <div class="grid grid-cols-1 gap-1">
          <sheet-field label="Species" :value="sheet.species" />
          <sheet-field label="Calling" :value="sheet.class" />
          <sheet-field label="Alignment" :value="sheet.alignment" />
        </div>
      </sheet-section>

      <!-- Identity/presentation block -->
      <sheet-section
        v-if="hasPresentation"
        label="Presence"
        icon="kind-icon:person"
        card-key="identity"
      >
        <div class="grid grid-cols-1 gap-1">
          <sheet-field label="Gender" :value="sheet.gender" />
          <sheet-field label="Presentation" :value="sheet.presentation" long />
        </div>
      </sheet-section>

      <!-- Personality block -->
      <sheet-section
        v-if="hasPersonality"
        label="Personality"
        icon="kind-icon:heart"
        card-key="personality"
      >
        <div class="grid grid-cols-1 gap-1">
          <sheet-field label="Personality" :value="sheet.personality" long />
          <sheet-field label="Drive" :value="sheet.drive" long />
        </div>
      </sheet-section>

      <!-- Stats block -->
      <sheet-section
        v-if="hasStats"
        label="Stats"
        icon="kind-icon:activity"
        card-key="stats"
      >
        <div class="grid grid-cols-3 gap-1.5">
          <div
            v-for="stat in sheet.stats"
            :key="stat.key"
            class="flex flex-col items-center rounded-xl bg-base-200 px-2 py-1.5"
          >
            <span class="text-base leading-none">{{ stat.display }}</span>
            <span
              class="mt-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-base-content/40"
            >
              {{ stat.name }}
            </span>
            <span
              class="mt-0.5 text-xs font-black"
              :class="statValueColor(stat.value)"
            >
              {{ stat.value || '—' }}
            </span>
          </div>
        </div>
      </sheet-section>

      <!-- Background block -->
      <sheet-section
        v-if="hasBackground"
        label="Background"
        icon="kind-icon:story"
        card-key="background"
      >
        <div class="grid grid-cols-1 gap-1">
          <sheet-field label="Backstory" :value="sheet.backstory" long />
          <sheet-field label="Achievements" :value="sheet.achievements" long />
          <sheet-field label="Quirks" :value="sheet.quirks" />
        </div>
      </sheet-section>

      <!-- Skills block -->
      <div
        v-if="hasAnySkill"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <p
          class="mb-2 text-xs font-bold uppercase tracking-widest text-base-content/40"
        >
          Skills
        </p>
        <div class="flex flex-col gap-2">
          <div
            v-for="(reward, slotKey) in sheet.rewards"
            :key="slotKey"
            class="group flex items-start gap-2 rounded-xl border border-base-300 bg-base-200 p-2"
          >
            <Icon
              :name="reward.icon"
              class="mt-0.5 h-4 w-4 shrink-0 text-primary"
            />
            <div class="min-w-0 flex-1">
              <p
                class="text-xs font-black text-base-content leading-tight truncate"
              >
                {{ reward.label }}
              </p>
              <p
                class="text-[0.6rem] font-bold uppercase tracking-wider"
                :class="rarityColor(reward.rarity)"
              >
                {{ reward.rarity }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 text-base-content/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-error"
              @click="store.removeSection(slotKey)"
            >
              <Icon name="kind-icon:x" class="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom spacer -->
    <div class="h-2 shrink-0" />
  </aside>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, resolveComponent } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import type { Rarity } from '@/stores/rewardStore'

const store = useAdventureStore()
const sheet = computed(() => store.sheet)

// ── Required cards list (for progress dots) ─────────────────────────────────

const REQUIRED_CARDS = [
  { key: 'role', label: 'Role' },
  { key: 'name', label: 'Name' },
  { key: 'origin', label: 'Origin' },
  { key: 'identity', label: 'Identity' },
  { key: 'personality', label: 'Personality' },
  { key: 'stats', label: 'Stats' },
  { key: 'background', label: 'Background' },
  { key: 'common-skill', label: 'Common Skill' },
  { key: 'uncommon-skill', label: 'Uncommon Skill' },
  { key: 'rare-skill', label: 'Rare Skill' },
]

const totalRequired = REQUIRED_CARDS.length
const completedCount = computed(
  () => REQUIRED_CARDS.filter((c) => store.completedCards[c.key]).length,
)
const progressPct = computed(() =>
  Math.round((completedCount.value / totalRequired) * 100),
)

// ── Identity line ───────────────────────────────────────────────────────────

const identityLine = computed(() =>
  [
    sheet.value.honorific || 'adventurer',
    sheet.value.species || 'unknown species',
    sheet.value.class || 'unclassed',
  ].join(' · '),
)

// ── Section visibility ──────────────────────────────────────────────────────

const hasIdentity = computed(() =>
  Boolean(sheet.value.name || sheet.value.role || sheet.value.genre),
)
const hasOrigin = computed(() =>
  Boolean(sheet.value.species || sheet.value.class || sheet.value.alignment),
)
const hasPresentation = computed(() =>
  Boolean(sheet.value.gender || sheet.value.presentation),
)
const hasPersonality = computed(() =>
  Boolean(sheet.value.personality || sheet.value.drive),
)
const hasStats = computed(() => sheet.value.stats.some((s) => s.value > 0))
const hasBackground = computed(() =>
  Boolean(
    sheet.value.backstory || sheet.value.achievements || sheet.value.quirks,
  ),
)
const hasAnySkill = computed(() => Object.keys(sheet.value.rewards).length > 0)

// ── Stat value color ────────────────────────────────────────────────────────

function statValueColor(value: number): string {
  if (value >= 6) return 'text-warning'
  if (value === 5) return 'text-warning/70'
  if (value === 4) return 'text-secondary'
  if (value === 3) return 'text-primary'
  if (value === 2) return 'text-success'
  if (value === 1) return 'text-base-content/50'
  return 'text-base-content/20'
}

function rarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'MYTHIC':
      return 'text-warning'
    case 'LEGENDARY':
      return 'text-warning/70'
    case 'EPIC':
      return 'text-secondary'
    case 'RARE':
      return 'text-primary'
    case 'UNCOMMON':
      return 'text-success'
    default:
      return 'text-base-content/40'
  }
}

// ── Inline sub-components ───────────────────────────────────────────────────

/**
 * SheetSection — collapsible section with label and clear button.
 */
const SheetSection = defineComponent({
  name: 'SheetSection',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    cardKey: { type: String, required: true },
  },
  setup(p, { slots }) {
    const IconComp = resolveComponent('Icon')

    return () =>
      h(
        'div',
        { class: 'group rounded-2xl border border-base-300 bg-base-100 p-3' },
        [
          h('div', { class: 'mb-2 flex items-center justify-between gap-2' }, [
            h(
              'p',
              {
                class:
                  'flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-base-content/40',
              },
              [
                h(IconComp, {
                  name: p.icon,
                  class: 'h-3.5 w-3.5 text-primary',
                }),
                p.label,
              ],
            ),
            h(
              'button',
              {
                type: 'button',
                class:
                  'text-base-content/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-error text-xs',
                onClick: () => store.removeSection(p.cardKey),
              },
              [h(IconComp, { name: 'kind-icon:x', class: 'h-3 w-3' })],
            ),
          ]),
          slots.default?.(),
        ],
      )
  },
})

/**
 * SheetField — single labeled value row.
 */
const SheetField = defineComponent({
  name: 'SheetField',
  props: {
    label: { type: String, required: true },
    value: { type: String, default: '' },
    long: { type: Boolean, default: false },
  },
  setup(p) {
    return () =>
      p.value
        ? h('div', { class: 'flex flex-col gap-0' }, [
            h(
              'p',
              {
                class:
                  'text-[0.6rem] font-bold uppercase tracking-wider text-base-content/30',
              },
              p.label,
            ),
            h(
              'p',
              {
                class: [
                  'text-xs text-base-content/75',
                  p.long ? 'line-clamp-2' : 'truncate',
                ],
              },
              p.value,
            ),
          ])
        : null
  },
})
</script>
