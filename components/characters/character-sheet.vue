<!-- /components/builders/character-sheet.vue -->
<template>
  <section
    class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-300"
  >
    <header
      class="flex shrink-0 flex-col gap-3 border-b border-base-300 bg-base-200 p-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Character Sheet
        </p>

        <h2
          class="mt-1 flex items-center gap-2 text-2xl font-black text-base-content"
        >
          <Icon name="kind-icon:mask" class="h-7 w-7 text-primary" />
          {{ sheet.name || 'Unnamed Character' }}
        </h2>

        <p class="mt-1 max-w-3xl text-sm text-base-content/70">
          {{ sheetSubtitle }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-if="hasPortrait"
          class="btn rounded-xl"
          type="button"
          @click="showPortrait = !showPortrait"
        >
          <Icon
            :name="showPortrait ? 'kind-icon:blueprint' : 'kind-icon:palette'"
            class="h-4 w-4"
          />
          {{ showPortrait ? 'Show Sheet' : 'Show Portrait' }}
        </button>

        <button
          v-if="isBuilderMode && allowArt"
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="!canCreateArt"
          @click="emit('select-card', 'art')"
        >
          <Icon name="kind-icon:palette" class="h-4 w-4" />
          {{ hasPortrait ? 'Edit Portrait' : 'Create Portrait' }}
        </button>
      </div>
    </header>

    <Transition name="sheet-fade" mode="out-in">
      <!-- Portrait view -->
      <section
        v-if="showPortrait && hasPortrait"
        key="portrait"
        class="relative min-h-0 flex-1 overflow-hidden bg-base-200"
      >
        <img
          v-if="sheet.imagePath"
          :src="sheet.imagePath"
          :alt="`${sheet.name || 'Character'} portrait`"
          class="h-full min-h-128 w-full object-cover"
        />

        <div
          v-else
          class="flex h-full min-h-128 w-full items-center justify-center bg-base-300 p-4 text-center"
        >
          <div class="rounded-2xl border border-base-300 bg-base-100 p-5">
            <Icon
              name="kind-icon:palette"
              class="mx-auto h-14 w-14 text-primary"
            />
            <p class="mt-3 text-sm font-bold text-base-content">
              Portrait image record attached.
            </p>
            <p class="mt-1 text-xs text-base-content/60">
              No image path was provided, but artImageId exists.
            </p>
          </div>
        </div>

        <div
          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300 via-base-300/90 to-transparent p-4 pt-28"
        >
          <article
            class="rounded-2xl border border-base-100/20 bg-base-100/85 p-4 shadow-xl backdrop-blur"
          >
            <p
              class="text-xs font-bold uppercase tracking-[0.22em] text-primary"
            >
              Portrait Mode
            </p>

            <h3 class="mt-1 text-3xl font-black text-base-content">
              {{ sheet.name || 'Unnamed Character' }}
            </h3>

            <p class="mt-1 text-sm text-base-content/70">
              {{ identityLine }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="badge in badges"
                :key="badge"
                class="badge badge-primary badge-outline rounded-xl"
              >
                {{ badge }}
              </span>
            </div>

            <button
              class="btn btn-primary mt-4 rounded-xl"
              type="button"
              @click="showPortrait = false"
            >
              <Icon name="kind-icon:blueprint" class="h-4 w-4" />
              Return to Sheet
            </button>
          </article>
        </div>
      </section>

      <!-- Sheet view -->
      <section v-else key="sheet" class="min-h-0 flex-1 overflow-y-auto p-3">
        <div class="grid grid-cols-1 gap-3 2xl:grid-cols-[16rem_minmax(0,1fr)]">
          <!-- Sidebar -->
          <aside class="flex flex-col gap-3">
            <!-- Portrait thumbnail -->
            <article class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <div
                class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300"
              >
                <img
                  v-if="sheet.imagePath"
                  :src="sheet.imagePath"
                  alt="Character portrait"
                  class="h-full w-full object-cover"
                />

                <div
                  v-else
                  class="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
                >
                  <Icon
                    name="kind-icon:mask"
                    class="h-14 w-14 text-primary/70"
                  />
                  <p class="text-sm font-bold text-base-content/70">
                    Portrait Pending
                  </p>
                  <p class="text-xs text-base-content/50">
                    Complete the sheet to unlock portrait creation.
                  </p>
                </div>
              </div>
            </article>

            <!-- Completion checklist -->
            <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h3 class="flex items-center gap-2 font-black text-base-content">
                <Icon name="kind-icon:check" class="h-5 w-5 text-primary" />
                Completion
              </h3>

              <div class="mt-3 flex flex-col gap-2">
                <button
                  v-for="item in completionItems"
                  :key="item.key"
                  class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-3 py-2 text-left transition hover:bg-primary/10 disabled:hover:bg-base-200"
                  type="button"
                  :disabled="!isBuilderMode"
                  @click="emit('select-card', item.cardKey)"
                >
                  <span class="text-sm text-base-content/70">
                    {{ item.label }}
                  </span>

                  <Icon
                    :name="item.done ? 'kind-icon:check' : 'kind-icon:circle'"
                    :class="
                      item.done
                        ? 'h-4 w-4 text-success'
                        : 'h-4 w-4 text-base-content/30'
                    "
                  />
                </button>
              </div>
            </article>
          </aside>

          <!-- Main content -->
          <main class="flex min-w-0 flex-col gap-3">
            <!-- Identity block -->
            <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p
                    class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                  >
                    Identity
                  </p>
                  <h3 class="mt-1 text-xl font-black text-base-content">
                    {{ sheet.name || 'Awaiting Name' }}
                  </h3>
                  <p class="mt-1 text-sm text-base-content/70">
                    {{ identityLine }}
                  </p>
                </div>

                <button
                  v-if="isBuilderMode && hasIdentityContent"
                  class="btn btn-xs rounded-lg"
                  type="button"
                  @click="emit('remove-section', 'identity-group')"
                >
                  <Icon name="kind-icon:x" class="h-3 w-3" />
                  Clear
                </button>
              </div>

              <div
                class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
              >
                <sheet-cell
                  label="Name"
                  icon="kind-icon:signature"
                  :value="sheet.name"
                  placeholder="Name card waiting"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'name')"
                />

                <sheet-cell
                  label="Honorific"
                  icon="kind-icon:crown"
                  :value="sheet.honorific"
                  placeholder="adventurer"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'name')"
                />

                <sheet-cell
                  label="Role"
                  icon="kind-icon:mask"
                  :value="sheet.role"
                  placeholder="Role card waiting"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'role')"
                />

                <sheet-cell
                  label="Species"
                  icon="kind-icon:species"
                  :value="sheet.species"
                  placeholder="Origin card waiting"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'origin')"
                />

                <!-- schema: class -->
                <sheet-cell
                  label="Class"
                  icon="kind-icon:sparkles"
                  :value="sheet.class"
                  placeholder="Calling pending"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'origin')"
                />

                <sheet-cell
                  label="Alignment"
                  icon="kind-icon:compass"
                  :value="sheet.alignment"
                  placeholder="Morally loading"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'origin')"
                />

                <!-- schema: gender -->
                <sheet-cell
                  label="Gender"
                  icon="kind-icon:person"
                  :value="sheet.gender"
                  placeholder="Identity card waiting"
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'identity')"
                />

                <sheet-cell
                  label="Presentation"
                  icon="kind-icon:eye"
                  :value="sheet.presentation"
                  placeholder="Presentation pending"
                  wide
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'identity')"
                />
              </div>
            </section>

            <!-- Narrative + Stats/Skills columns -->
            <section
              class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]"
            >
              <!-- Narrative panels -->
              <div class="flex min-w-0 flex-col gap-3">
                <sheet-panel
                  label="Personality"
                  icon="kind-icon:heart"
                  :value="sheet.personality"
                  placeholder="No personality yet. Suspiciously smooth."
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'personality')"
                />

                <sheet-panel
                  label="Drive"
                  icon="kind-icon:target"
                  :value="sheet.drive"
                  placeholder="No drive yet. Currently powered by vibes."
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'personality')"
                />

                <sheet-panel
                  label="Backstory"
                  icon="kind-icon:story"
                  :value="sheet.backstory"
                  placeholder="No backstory yet. The void is politely waiting."
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'background')"
                />

                <sheet-panel
                  label="Achievements"
                  icon="kind-icon:award"
                  :value="sheet.achievements"
                  placeholder="No achievements yet."
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'background')"
                />

                <sheet-panel
                  label="Quirks"
                  icon="kind-icon:bug"
                  :value="sheet.quirks"
                  placeholder="No quirks yet. That cannot last."
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'background')"
                />

                <sheet-panel
                  label="Art Prompt"
                  icon="kind-icon:palette"
                  :value="sheet.artPrompt"
                  placeholder="Portrait prompt not built yet."
                  :is-builder-mode="isBuilderMode"
                  @clear="emit('remove-section', 'art')"
                />
              </div>

              <!-- Stats + Skills sidebar -->
              <aside class="flex flex-col gap-3">
                <!-- Stat tiers -->
                <article
                  class="rounded-2xl border border-base-300 bg-base-100 p-4"
                >
                  <div class="flex items-center justify-between gap-3">
                    <h3
                      class="flex items-center gap-2 font-black text-base-content"
                    >
                      <Icon
                        name="kind-icon:activity"
                        class="h-5 w-5 text-primary"
                      />
                      Stats
                    </h3>

                    <button
                      v-if="isBuilderMode && hasStats"
                      class="btn btn-xs rounded-lg"
                      type="button"
                      @click="emit('remove-section', 'stats')"
                    >
                      <Icon name="kind-icon:x" class="h-3 w-3" />
                      Clear
                    </button>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-2">
                    <div
                      v-for="stat in characterStats"
                      :key="stat.key"
                      class="rounded-2xl border bg-base-200 p-3 transition"
                      :class="
                        stat.value !== 'COMMON'
                          ? 'border-primary/30'
                          : 'border-dashed border-base-300 opacity-60'
                      "
                    >
                      <p class="truncate text-sm font-bold text-base-content">
                        {{ stat.label }}
                      </p>

                      <p
                        class="mt-1 text-sm font-black uppercase tracking-wide"
                        :class="
                          stat.value !== 'COMMON'
                            ? 'text-primary'
                            : 'text-base-content/30'
                        "
                      >
                        {{ stat.value }}
                      </p>
                    </div>
                  </div>
                </article>

                <!-- Starting Skills (3 skill slots) -->
                <article
                  class="rounded-2xl border border-base-300 bg-base-100 p-4"
                >
                  <h3
                    class="flex items-center gap-2 font-black text-base-content"
                  >
                    <Icon name="kind-icon:bolt" class="h-5 w-5 text-primary" />
                    Starting Skills
                  </h3>

                  <div class="mt-3 flex flex-col gap-3">
                    <article
                      v-for="slot in rewardSlots"
                      :key="slot.key"
                      class="group rounded-2xl border bg-base-200 p-3 transition"
                      :class="
                        skillForSlot(slot.key)
                          ? 'border-base-300'
                          : 'border-dashed border-base-300 opacity-60'
                      "
                    >
                      <div class="flex gap-3">
                        <!-- Icon / image -->
                        <div
                          class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300"
                        >
                          <img
                            v-if="skillForSlot(slot.key)?.imagePath"
                            :src="skillForSlot(slot.key)?.imagePath"
                            :alt="skillForSlot(slot.key)?.label"
                            class="h-full w-full object-cover"
                          />

                          <Icon
                            v-else
                            :name="skillForSlot(slot.key)?.icon || slot.icon"
                            class="h-7 w-7 text-primary"
                          />
                        </div>

                        <!-- Label + power -->
                        <div class="min-w-0 flex-1">
                          <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                              <p
                                class="text-xs font-bold uppercase tracking-[0.16em]"
                                :class="rarityColor(slot.rarity)"
                              >
                                {{ slot.label }}
                              </p>

                              <p
                                class="mt-1 font-black"
                                :class="
                                  skillForSlot(slot.key)
                                    ? 'text-base-content'
                                    : 'italic text-base-content/40'
                                "
                              >
                                {{
                                  skillForSlot(slot.key)?.label ||
                                  'Empty skill slot'
                                }}
                              </p>
                            </div>

                            <button
                              v-if="isBuilderMode && skillForSlot(slot.key)"
                              class="btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100"
                              type="button"
                              @click="emit('remove-reward', slot.key)"
                            >
                              <Icon name="kind-icon:x" class="h-3 w-3" />
                            </button>
                          </div>

                          <p
                            class="mt-2 line-clamp-3 text-sm"
                            :class="
                              skillForSlot(slot.key)
                                ? 'text-base-content/70'
                                : 'italic text-base-content/40'
                            "
                          >
                            {{
                              skillForSlot(slot.key)?.power ||
                              slot.description ||
                              `${slot.rarity} skill.`
                            }}
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                </article>
              </aside>
            </section>
          </main>
        </div>
      </section>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, resolveComponent } from 'vue'
import {
  characterStatFields,
  type CharacterRewardDraft,
  type CharacterSheetDraft,
  type RewardPromptSlot,
} from '@/stores/helpers/characterHelper'

// ---------------------------------------------------------------------------
// Props / emits
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    sheet: CharacterSheetDraft
    rewardSlots: RewardPromptSlot[]
    isBuilderMode?: boolean
    canCreateArt?: boolean
    allowArt?: boolean
  }>(),
  {
    isBuilderMode: false,
    canCreateArt: false,
    allowArt: true,
  },
)

const emit = defineEmits<{
  'remove-section': [key: string]
  'remove-reward': [slotKey: string]
  'select-card': [key: string]
}>()

// ---------------------------------------------------------------------------
// Local state
// ---------------------------------------------------------------------------

const showPortrait = ref(false)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const hasPortrait = computed(() =>
  Boolean(props.sheet.imagePath || props.sheet.artImageId),
)

// Reads the six rarity-tier fields from the sheet (luck, might, wits, etc.)
// characterStatFields from characterHelper provides { key, label } pairs
const characterStats = computed(() =>
  characterStatFields.map((stat) => ({
    key: stat.key,
    label: stat.label,
    value: props.sheet[stat.key] as string,
  })),
)

// Stats are "set" when any tier has been raised above COMMON.
// Allocating 1–6 always produces at least UNCOMMON through MYTHIC,
// so this is a clean "has this card been played" check.
const hasStats = computed(() =>
  characterStats.value.some((stat) => stat.value !== 'COMMON'),
)

const hasIdentityContent = computed(() =>
  Boolean(
    props.sheet.name ||
    props.sheet.honorific !== 'adventurer' ||
    props.sheet.role ||
    props.sheet.species ||
    props.sheet.class || // schema: class
    props.sheet.alignment ||
    props.sheet.gender || // schema: gender
    props.sheet.presentation,
  ),
)

const identityLine = computed(() =>
  [
    props.sheet.honorific || 'adventurer',
    props.sheet.species || 'unknown species',
    props.sheet.class || 'unclassed', // schema: class
    props.sheet.role || 'plot-adjacent citizen',
  ].join(' · '),
)

const badges = computed(
  () =>
    [
      props.sheet.genre,
      props.sheet.gender, // schema: gender
      props.sheet.presentation,
      props.sheet.alignment,
    ].filter(Boolean) as string[],
)

const sheetSubtitle = computed(() => {
  if (!props.isBuilderMode) return identityLine.value
  if (props.canCreateArt) {
    return 'The sheet is complete enough for portrait creation. Save it, paint it, or keep tinkering.'
  }
  return 'Choose prompt cards to fill the sheet. Completed sections can be cleared to restore their cards.'
})

const completionItems = computed(() => [
  {
    key: 'role',
    cardKey: 'role',
    label: 'Role',
    done: Boolean(props.sheet.role?.trim()),
  },
  {
    key: 'name',
    cardKey: 'name',
    label: 'Name',
    done: Boolean(props.sheet.name?.trim()),
  },
  {
    key: 'origin',
    cardKey: 'origin',
    label: 'Origin',
    done: Boolean(props.sheet.species?.trim() && props.sheet.class?.trim()), // schema: class
  },
  {
    key: 'identity',
    cardKey: 'identity',
    label: 'Identity',
    done: Boolean(
      props.sheet.gender?.trim() || props.sheet.presentation?.trim(),
    ), // schema: gender
  },
  {
    key: 'personality',
    cardKey: 'personality',
    label: 'Personality',
    done: Boolean(props.sheet.personality?.trim()),
  },
  {
    key: 'stats',
    cardKey: 'stats',
    label: 'Stats',
    done: hasStats.value,
  },
  {
    key: 'background',
    cardKey: 'background',
    label: 'Backstory',
    done: Boolean(props.sheet.backstory?.trim()),
  },
  {
    key: 'skills',
    cardKey: 'common-skill',
    label: 'Skills',
    done: props.rewardSlots.every((slot) => Boolean(skillForSlot(slot.key))),
  },
  {
    key: 'portrait',
    cardKey: 'art',
    label: 'Portrait',
    done: Boolean(
      props.sheet.artPrompt?.trim() ||
      props.sheet.imagePath ||
      props.sheet.artImageId,
    ),
  },
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function skillForSlot(slotKey: string): CharacterRewardDraft | null {
  return props.sheet.rewards?.find((r) => r.slotKey === slotKey) ?? null
}

// Returns a text-color class based on rarity tier
function rarityColor(rarity: string): string {
  switch (rarity) {
    case 'MYTHIC':
      return 'text-warning'
    case 'LEGENDARY':
      return 'text-warning/80'
    case 'EPIC':
      return 'text-secondary'
    case 'RARE':
      return 'text-primary'
    case 'UNCOMMON':
      return 'text-success'
    default:
      return 'text-base-content/50'
  }
}

// ---------------------------------------------------------------------------
// Inline sub-components
// ---------------------------------------------------------------------------

/**
 * SheetCell — compact labeled field for the identity grid.
 * Optionally spans two columns via `wide`.
 */
const SheetCell = defineComponent({
  name: 'SheetCell',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    value: { type: String, default: '' },
    placeholder: { type: String, required: true },
    wide: { type: Boolean, default: false },
    isBuilderMode: { type: Boolean, default: false },
  },
  emits: ['clear'],
  setup(p, { emit: ce }) {
    const Icon = resolveComponent('Icon')

    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-200 p-3 transition',
            p.value
              ? 'border-base-300'
              : 'border-dashed border-base-300 opacity-70',
            p.wide ? 'md:col-span-2' : '',
          ],
        },
        [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('div', { class: 'min-w-0' }, [
              h(
                'p',
                {
                  class:
                    'flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-base-content/50',
                },
                [
                  h(Icon, { name: p.icon, class: 'h-4 w-4 text-primary' }),
                  p.label,
                ],
              ),
              h(
                'p',
                {
                  class: [
                    'mt-2 whitespace-pre-wrap text-sm',
                    p.value
                      ? 'font-semibold text-base-content'
                      : 'italic text-base-content/40',
                  ],
                },
                p.value || p.placeholder,
              ),
            ]),
            p.value && p.isBuilderMode
              ? h(
                  'button',
                  {
                    class:
                      'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                    type: 'button',
                    onClick: () => ce('clear'),
                  },
                  [h(Icon, { name: 'kind-icon:x', class: 'h-3 w-3' })],
                )
              : null,
          ]),
        ],
      )
  },
})

/**
 * SheetPanel — full-width narrative field with heading and prose body.
 */
const SheetPanel = defineComponent({
  name: 'SheetPanel',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    value: { type: String, default: '' },
    placeholder: { type: String, required: true },
    isBuilderMode: { type: Boolean, default: false },
  },
  emits: ['clear'],
  setup(p, { emit: ce }) {
    const Icon = resolveComponent('Icon')

    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-100 p-4 transition',
            p.value
              ? 'border-base-300'
              : 'border-dashed border-base-300 opacity-70',
          ],
        },
        [
          h('div', { class: 'flex items-start justify-between gap-3' }, [
            h(
              'h3',
              { class: 'flex items-center gap-2 font-black text-base-content' },
              [
                h(Icon, { name: p.icon, class: 'h-5 w-5 text-primary' }),
                p.label,
              ],
            ),
            p.value && p.isBuilderMode
              ? h(
                  'button',
                  {
                    class:
                      'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                    type: 'button',
                    onClick: () => ce('clear'),
                  },
                  [h(Icon, { name: 'kind-icon:x', class: 'h-3 w-3' }), 'Clear'],
                )
              : null,
          ]),
          h(
            'p',
            {
              class: [
                'mt-3 whitespace-pre-wrap text-sm leading-relaxed',
                p.value
                  ? 'text-base-content/75'
                  : 'italic text-base-content/40',
              ],
            },
            p.value || p.placeholder,
          ),
        ],
      )
  },
})
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.99);
}
</style>
