<!-- /components/builders/character-sheet.vue -->
<template>
  <section class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200">
    <header class="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 bg-base-100/80 p-4">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-base-content/50">
          Character Sheet
        </p>

        <h2 class="mt-1 truncate text-2xl font-black text-base-content">
          {{ sheet.name || 'Unnamed Character' }}
        </h2>

        <p class="mt-1 truncate text-sm text-base-content/70">
          {{ identityLine }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap justify-end gap-2">
        <button
          v-if="hasPortrait"
          class="btn btn-sm rounded-xl"
          type="button"
          @click="showPortrait = !showPortrait"
        >
          <Icon
            :name="showPortrait ? 'kind-icon:blueprint' : 'kind-icon:palette'"
            class="h-4 w-4"
          />
          {{ showPortrait ? 'Sheet' : 'Portrait' }}
        </button>

        <button
          class="btn btn-sm rounded-xl"
          type="button"
          @click="emit('remove-section', 'art')"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Art
        </button>
      </div>
    </header>

    <Transition name="sheet-fade" mode="out-in">
      <section
        v-if="showPortrait && hasPortrait"
        key="portrait"
        class="relative min-h-0 flex-1 overflow-hidden bg-base-300"
      >
        <img
          :src="sheet.imagePath || ''"
          :alt="`${sheet.name || 'Character'} portrait`"
          class="h-full w-full object-cover"
        />

        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base-300 via-base-300/90 to-transparent p-4 pt-24">
          <div class="rounded-2xl border border-base-100/20 bg-base-100/80 p-4 shadow-xl backdrop-blur">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">
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
              View Character Sheet
            </button>
          </div>
        </div>
      </section>

      <section
        v-else
        key="sheet"
        class="min-h-0 flex-1 overflow-y-auto p-4"
      >
        <div class="mx-auto flex max-w-6xl flex-col gap-4">
          <section class="grid grid-cols-1 gap-4 xl:grid-cols-[16rem_1fr]">
            <article class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
              <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300">
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
                  <Icon name="kind-icon:mask" class="h-14 w-14 text-primary/70" />

                  <p class="text-sm font-bold text-base-content/70">
                    Portrait Pending
                  </p>

                  <p class="text-xs text-base-content/50">
                    Finish the portrait card to replace this sketch box.
                  </p>
                </div>
              </div>

              <button
                v-if="sheet.imagePath"
                class="btn btn-sm rounded-xl"
                type="button"
                @click="showPortrait = true"
              >
                <Icon name="kind-icon:palette" class="h-4 w-4" />
                Portrait View
              </button>
            </article>

            <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <sheet-field
                  label="Name"
                  icon="kind-icon:signature"
                  card-key="name"
                  :value="sheet.name"
                  placeholder="Awaiting name card"
                  @remove="emit('remove-section', 'name')"
                />

                <sheet-field
                  label="Honorific"
                  icon="kind-icon:crown"
                  card-key="name"
                  :value="sheet.honorific"
                  placeholder="adventurer"
                  @remove="emit('remove-section', 'name')"
                />

                <sheet-field
                  label="Role"
                  icon="kind-icon:mask"
                  card-key="role"
                  :value="sheet.role"
                  placeholder="Awaiting role card"
                  @remove="emit('remove-section', 'role')"
                />

                <sheet-field
                  label="Species"
                  icon="kind-icon:species"
                  card-key="species"
                  :value="sheet.species"
                  placeholder="Awaiting origin card"
                  @remove="emit('remove-section', 'species')"
                />

                <sheet-field
                  label="Class"
                  icon="kind-icon:sparkles"
                  card-key="species"
                  :value="sheet.characterClass"
                  placeholder="Awaiting class"
                  @remove="emit('remove-section', 'species')"
                />

                <sheet-field
                  label="Alignment"
                  icon="kind-icon:compass"
                  card-key="species"
                  :value="sheet.alignment"
                  placeholder="Morally loading..."
                  @remove="emit('remove-section', 'species')"
                />

                <sheet-field
                  label="Gender"
                  icon="kind-icon:person"
                  card-key="identity"
                  :value="sheet.genderIdentity"
                  placeholder="Awaiting identity card"
                  @remove="emit('remove-section', 'identity')"
                />

                <sheet-field
                  label="Presentation"
                  icon="kind-icon:eye"
                  card-key="identity"
                  :value="sheet.presentation"
                  placeholder="Awaiting presentation"
                  wide
                  @remove="emit('remove-section', 'identity')"
                />
              </div>
            </article>
          </section>

          <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem]">
            <div class="flex flex-col gap-4">
              <sheet-panel
                label="Personality"
                icon="kind-icon:heart"
                card-key="personality"
                :value="sheet.personality"
                placeholder="No personality yet. Suspiciously smooth."
                @remove="emit('remove-section', 'personality')"
              />

              <sheet-panel
                label="Drive"
                icon="kind-icon:target"
                card-key="personality"
                :value="sheet.drive"
                placeholder="No drive yet. They are currently powered by vibes."
                @remove="emit('remove-section', 'personality')"
              />

              <sheet-panel
                label="Backstory"
                icon="kind-icon:story"
                card-key="background"
                :value="sheet.backstory"
                placeholder="No backstory yet. The void is politely waiting."
                @remove="emit('remove-section', 'background')"
              />

              <sheet-panel
                label="Achievements"
                icon="kind-icon:award"
                card-key="background"
                :value="sheet.achievements"
                placeholder="No achievements yet."
                @remove="emit('remove-section', 'background')"
              />

              <sheet-panel
                label="Quirks"
                icon="kind-icon:bug"
                card-key="background"
                :value="sheet.quirks"
                placeholder="No quirks yet. That cannot last."
                @remove="emit('remove-section', 'background')"
              />

              <sheet-panel
                label="Art Prompt"
                icon="kind-icon:palette"
                card-key="art"
                :value="sheet.artPrompt"
                placeholder="Portrait prompt not built yet."
                @remove="emit('remove-section', 'art')"
              />
            </div>

            <aside class="flex flex-col gap-4">
              <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="flex items-center gap-2 font-black text-base-content">
                    <Icon name="kind-icon:activity" class="h-5 w-5 text-primary" />
                    Stats
                  </h3>

                  <button
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
                    v-for="stat in sheet.stats"
                    :key="stat.key"
                    class="rounded-2xl border border-base-300 bg-base-200 p-3"
                    :class="stat.value ? 'border-primary/30' : 'border-dashed opacity-70'"
                  >
                    <p class="truncate text-sm font-bold text-base-content">
                      {{ stat.name || 'Stat' }}
                    </p>

                    <p class="mt-1 text-3xl font-black text-primary">
                      {{ stat.value || '—' }}
                    </p>
                  </div>
                </div>
              </article>

              <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <h3 class="flex items-center gap-2 font-black text-base-content">
                  <Icon name="kind-icon:gift" class="h-5 w-5 text-primary" />
                  Starting Rewards
                </h3>

                <div class="mt-3 flex flex-col gap-3">
                  <reward-slot
                    v-for="slot in rewardSlots"
                    :key="slot.key"
                    :slot="slot"
                    :reward="rewardForSlot(slot.key)"
                    @remove="emit('remove-reward', slot.key)"
                  />
                </div>
              </article>

              <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <h3 class="flex items-center gap-2 font-black text-base-content">
                  <Icon name="kind-icon:check" class="h-5 w-5 text-primary" />
                  Completion
                </h3>

                <div class="mt-3 flex flex-col gap-2">
                  <div
                    v-for="item in completionItems"
                    :key="item.key"
                    class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-3 py-2"
                  >
                    <span class="text-sm text-base-content/70">
                      {{ item.label }}
                    </span>

                    <Icon
                      :name="item.done ? 'kind-icon:check' : 'kind-icon:circle'"
                      :class="item.done ? 'h-4 w-4 text-success' : 'h-4 w-4 text-base-content/30'"
                    />
                  </div>
                </div>
              </article>
            </aside>
          </section>
        </div>
      </section>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'

export type CharacterSheetStat = {
  key: string
  name: string
  value: number
}

export type CharacterSheetReward = {
  slotKey: string
  label: string
  text: string
  power: string
  collection: string
  rewardType: 'SKILL' | 'ITEM' | string
  rarityType: 'COMMON' | 'RARE' | string
  rarity: number
  icon: string
  imagePath: string
  artImageId: number | null
  artPrompt: string
  id?: number
}

export type CharacterSheetDraft = {
  name: string
  honorific: string
  title: string
  role: string
  genre: string
  species: string
  characterClass: string
  alignment: string
  genderIdentity: string
  presentation: string
  personality: string
  drive: string
  backstory: string
  achievements: string
  skills: string
  inventory: string
  quirks: string
  artPrompt: string
  imagePath: string | null
  stats: CharacterSheetStat[]
  goalStats: CharacterSheetStat[]
  rewards?: CharacterSheetReward[]
}

type RewardSlot = {
  key: string
  label: string
  rewardType: 'SKILL' | 'ITEM'
  rarityType: 'COMMON' | 'RARE'
  rarity: number
  icon: string
}

const props = defineProps<{
  sheet: CharacterSheetDraft
}>()

const emit = defineEmits<{
  'remove-section': [key: string]
  'remove-reward': [slotKey: string]
}>()

const showPortrait = ref(false)

const rewardSlots: RewardSlot[] = [
  {
    key: 'common-skill',
    label: 'Common Skill',
    rewardType: 'SKILL',
    rarityType: 'COMMON',
    rarity: 1,
    icon: 'kind-icon:bolt',
  },
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    rewardType: 'SKILL',
    rarityType: 'RARE',
    rarity: 3,
    icon: 'kind-icon:comet',
  },
  {
    key: 'common-item',
    label: 'Common Item',
    rewardType: 'ITEM',
    rarityType: 'COMMON',
    rarity: 1,
    icon: 'kind-icon:backpack',
  },
  {
    key: 'rare-item',
    label: 'Rare Item',
    rewardType: 'ITEM',
    rarityType: 'RARE',
    rarity: 3,
    icon: 'kind-icon:gem',
  },
]

const hasPortrait = computed(() => Boolean(props.sheet.imagePath))

const identityLine = computed(() => {
  return [
    props.sheet.honorific || 'adventurer',
    props.sheet.species || 'unknown species',
    props.sheet.characterClass || 'unclassed',
    props.sheet.role || 'plot-adjacent citizen',
  ].join(' · ')
})

const badges = computed(() => {
  return [
    props.sheet.genre,
    props.sheet.genderIdentity,
    props.sheet.presentation,
    props.sheet.alignment,
  ].filter(Boolean)
})

const completionItems = computed(() => [
  {
    key: 'name',
    label: 'Name',
    done: Boolean(props.sheet.name.trim()),
  },
  {
    key: 'origin',
    label: 'Origin',
    done: Boolean(props.sheet.species.trim() && props.sheet.characterClass.trim()),
  },
  {
    key: 'identity',
    label: 'Identity',
    done: Boolean(props.sheet.genderIdentity.trim() || props.sheet.presentation.trim()),
  },
  {
    key: 'personality',
    label: 'Personality',
    done: Boolean(props.sheet.personality.trim()),
  },
  {
    key: 'stats',
    label: 'Stats',
    done: props.sheet.stats.every((stat) => stat.value >= 1 && stat.value <= 6),
  },
  {
    key: 'background',
    label: 'Background',
    done: Boolean(props.sheet.backstory.trim()),
  },
  {
    key: 'rewards',
    label: 'Rewards',
    done: rewardSlots.every((slot) => Boolean(rewardForSlot(slot.key))),
  },
  {
    key: 'portrait',
    label: 'Portrait',
    done: Boolean(props.sheet.artPrompt.trim() || props.sheet.imagePath),
  },
])

function rewardForSlot(slotKey: string) {
  return props.sheet.rewards?.find((reward) => reward.slotKey === slotKey) ?? null
}

function rewardFallbackIcon(slot: RewardSlot) {
  if (slot.rewardType === 'SKILL' && slot.rarityType === 'RARE') return 'kind-icon:comet'
  if (slot.rewardType === 'SKILL') return 'kind-icon:bolt'
  if (slot.rewardType === 'ITEM' && slot.rarityType === 'RARE') return 'kind-icon:gem'
  return 'kind-icon:backpack'
}

const SheetField = defineComponent({
  name: 'SheetField',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    value: { type: String, default: '' },
    placeholder: { type: String, required: true },
    cardKey: { type: String, required: true },
    wide: { type: Boolean, default: false },
  },
  emits: ['remove'],
  setup(componentProps, { emit: componentEmit }) {
    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-200 p-3 transition',
            componentProps.value ? 'border-base-300' : 'border-dashed border-base-300 opacity-70',
            componentProps.wide ? 'md:col-span-2 xl:col-span-2' : '',
          ],
        },
        [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('div', { class: 'min-w-0' }, [
              h('p', { class: 'flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-base-content/50' }, [
                h(resolveIcon(), {
                  name: componentProps.icon,
                  class: 'h-4 w-4 text-primary',
                }),
                componentProps.label,
              ]),
              h(
                'p',
                {
                  class: [
                    'mt-2 whitespace-pre-wrap text-sm',
                    componentProps.value ? 'font-semibold text-base-content' : 'italic text-base-content/40',
                  ],
                },
                componentProps.value || componentProps.placeholder,
              ),
            ]),
            componentProps.value
              ? h(
                  'button',
                  {
                    class: 'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                    type: 'button',
                    onClick: () => componentEmit('remove', componentProps.cardKey),
                  },
                  [
                    h(resolveIcon(), {
                      name: 'kind-icon:x',
                      class: 'h-3 w-3',
                    }),
                  ],
                )
              : null,
          ]),
        ],
      )
  },
})

const SheetPanel = defineComponent({
  name: 'SheetPanel',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    value: { type: String, default: '' },
    placeholder: { type: String, required: true },
    cardKey: { type: String, required: true },
  },
  emits: ['remove'],
  setup(componentProps, { emit: componentEmit }) {
    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-100 p-4 transition',
            componentProps.value ? 'border-base-300' : 'border-dashed border-base-300 opacity-70',
          ],
        },
        [
          h('div', { class: 'flex items-start justify-between gap-3' }, [
            h('h3', { class: 'flex items-center gap-2 font-black text-base-content' }, [
              h(resolveIcon(), {
                name: componentProps.icon,
                class: 'h-5 w-5 text-primary',
              }),
              componentProps.label,
            ]),
            componentProps.value
              ? h(
                  'button',
                  {
                    class: 'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                    type: 'button',
                    onClick: () => componentEmit('remove', componentProps.cardKey),
                  },
                  [
                    h(resolveIcon(), {
                      name: 'kind-icon:x',
                      class: 'h-3 w-3',
                    }),
                    'Clear',
                  ],
                )
              : null,
          ]),
          h(
            'p',
            {
              class: [
                'mt-3 whitespace-pre-wrap text-sm leading-relaxed',
                componentProps.value ? 'text-base-content/75' : 'italic text-base-content/40',
              ],
            },
            componentProps.value || componentProps.placeholder,
          ),
        ],
      )
  },
})

const RewardSlot = defineComponent({
  name: 'RewardSlot',
  props: {
    slot: { type: Object as () => RewardSlot, required: true },
    reward: { type: Object as () => CharacterSheetReward | null, default: null },
  },
  emits: ['remove'],
  setup(componentProps, { emit: componentEmit }) {
    return () =>
      h(
        'article',
        {
          class: [
            'group rounded-2xl border bg-base-200 p-3 transition',
            componentProps.reward ? 'border-base-300' : 'border-dashed border-base-300 opacity-70',
          ],
        },
        [
          h('div', { class: 'flex gap-3' }, [
            h('div', { class: 'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300' }, [
              componentProps.reward?.imagePath
                ? h('img', {
                    src: componentProps.reward.imagePath,
                    alt: componentProps.reward.label,
                    class: 'h-full w-full object-cover',
                  })
                : h(resolveIcon(), {
                    name: componentProps.reward?.icon || rewardFallbackIcon(componentProps.slot),
                    class: 'h-7 w-7 text-primary',
                  }),
            ]),
            h('div', { class: 'min-w-0 flex-1' }, [
              h('div', { class: 'flex items-start justify-between gap-2' }, [
                h('div', { class: 'min-w-0' }, [
                  h('p', { class: 'text-xs font-bold uppercase tracking-[0.16em] text-base-content/50' }, componentProps.slot.label),
                  h(
                    'p',
                    {
                      class: [
                        'mt-1 font-black',
                        componentProps.reward ? 'text-base-content' : 'italic text-base-content/40',
                      ],
                    },
                    componentProps.reward?.label || 'Empty reward slot',
                  ),
                ]),
                componentProps.reward
                  ? h(
                      'button',
                      {
                        class: 'btn btn-xs rounded-lg opacity-70 transition group-hover:opacity-100',
                        type: 'button',
                        onClick: () => componentEmit('remove', componentProps.slot.key),
                      },
                      [
                        h(resolveIcon(), {
                          name: 'kind-icon:x',
                          class: 'h-3 w-3',
                        }),
                      ],
                    )
                  : null,
              ]),
              h(
                'p',
                {
                  class: [
                    'mt-2 line-clamp-3 text-sm',
                    componentProps.reward ? 'text-base-content/70' : 'italic text-base-content/40',
                  ],
                },
                componentProps.reward?.power || `${componentProps.slot.rarityType} ${componentProps.slot.rewardType}, rarity ${componentProps.slot.rarity}.`,
              ),
            ]),
          ]),
        ],
      )
  },
})

function resolveIcon() {
  return 'Icon'
}
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