<template>
  <section class="kr-panes grid-cols-1" aria-label="Terrors on Crystal Street">
    <div
      class="cs-frame relative min-h-0 overflow-hidden bg-black"
      data-testid="cs-title-hero"
    >
      <crystal-street-art
        class="absolute inset-0 transition-opacity duration-1000"
        :class="slide === 0 ? 'opacity-100' : 'opacity-0'"
        frame="h-full"
        kind="day"
        seed="crystal-street-title"
        src="/crystal-street/title/crystal-street.webp"
        :alt="TITLE_ART"
      />
      <img
        v-for="v in candidates"
        :key="v.id"
        :src="`/crystal-street/villains/${v.id}-ending.webp`"
        :alt="v.endingPhoto"
        class="absolute inset-0 h-full w-full object-cover object-[50%_20%] transition-opacity duration-1000"
        :class="slides[slide - 1]?.id === v.id ? 'opacity-100' : 'opacity-0'"
        @load="ready.add(v.id)"
      />

      <div
        class="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/35 to-transparent px-14 pb-12 pt-3 text-center"
        :class="mode === 'menu' ? '' : '@3xl:right-[32rem]'"
      >
        <h2 class="leading-none">
          <span
            class="cs-display cs-terrors block text-5xl @md:text-6xl @lg:text-7xl @6xl:text-8xl"
            >Terrors</span
          >
          <span class="cs-on-street block">on Crystal Street</span>
        </h2>
        <p class="mt-2 cs-micro uppercase tracking-[0.3em] text-white/80">
          One week · seven nights · {{ VILLAINS.length }} nightmares
        </p>
      </div>

      <nav
        v-if="mode === 'menu'"
        class="absolute bottom-3 left-3 right-3 flex flex-col gap-2 @3xl:right-auto @3xl:w-80"
        aria-label="Main menu"
        data-testid="cs-menu"
      >
        <button
          v-if="inProgress"
          type="button"
          class="cs-menu-item cs-menu-glass cs-menu-primary"
          data-testid="cs-continue-week"
          @click="$emit('resume')"
        >
          <icon name="kind-icon:play" class="h-5 w-5 shrink-0" />
          <span>
            <span class="block font-bold">Continue the week</span>
            <span class="block text-xs opacity-80"
              >{{ store.run?.name }} · Day {{ store.run?.day }} ·
              {{ store.run?.phase === 'night' ? 'Night' : 'Day' }}</span
            >
          </span>
        </button>
        <button
          v-if="sharedVillain"
          type="button"
          class="cs-menu-item cs-menu-glass cs-menu-primary"
          data-testid="cs-shared-week"
          @click="openWizard(true)"
        >
          <icon name="kind-icon:link" class="h-5 w-5 shrink-0" />
          <span>
            <span class="block font-bold">Play the week a friend shared</span>
            <span class="block text-xs opacity-80"
              >{{ sharedVillain.name }} · same nightmare, same deck order</span
            >
          </span>
        </button>
        <button
          type="button"
          class="cs-menu-item cs-menu-glass"
          :class="inProgress || sharedVillain ? '' : 'cs-menu-primary'"
          data-testid="cs-new-week"
          @click="openWizard(false)"
        >
          <icon name="kind-icon:ghost" class="h-5 w-5 shrink-0" />
          <span>
            <span class="block font-bold">New week</span>
            <span class="block text-xs opacity-80">{{
              inProgress
                ? 'Starting over ends the week in progress'
                : 'Move into Crystal Street for Halloween week'
            }}</span>
          </span>
        </button>
        <button
          v-for="item in menu"
          :key="item.view"
          type="button"
          class="cs-menu-item cs-menu-glass"
          :data-testid="`cs-menu-${item.view}`"
          @click="$emit('open', item.view)"
        >
          <icon :name="item.icon" class="h-5 w-5 shrink-0" />
          <span>
            <span class="block font-bold">{{ item.label }}</span>
            <span class="block text-xs opacity-80">{{ item.detail() }}</span>
          </span>
        </button>
      </nav>

      <p
        v-if="mode === 'menu'"
        class="pointer-events-none absolute bottom-3 right-3 hidden max-w-xs rounded-xl bg-black/55 px-3 py-2 text-right text-sm text-white @3xl:block"
      >
        <template v-if="slide === 0">
          Glimmer Falls, California. Halloween week, 1986. Something under
          Crystal Street is waking up, and it has a different face every year.
        </template>
        <template v-else>
          <span class="cs-kicker block">You survived</span>
          {{ slides[slide - 1]?.name }} ·
          {{ slides[slide - 1]?.epithet }}
        </template>
      </p>

      <form
        v-else
        class="kr-pane cs-wizard absolute inset-x-3 bottom-3 top-28 @3xl:bottom-3 @3xl:left-auto @3xl:right-3 @3xl:top-16 @3xl:w-[30rem]"
        data-testid="cs-wizard"
        @submit.prevent="next"
      >
        <div class="kr-toolbar px-3 pt-3">
          <p class="cs-kicker">
            New week · {{ stepIndex + 1 }} of {{ STEPS.length }}
          </p>
          <span class="ml-auto flex gap-1" aria-hidden="true">
            <span
              v-for="(s, i) in STEPS"
              :key="s.id"
              class="h-1.5 w-5 rounded-full"
              :class="i <= stepIndex ? 'bg-primary' : 'bg-base-content/20'"
            />
          </span>
        </div>
        <div class="kr-pane-scroll space-y-3 p-3">
          <div
            v-if="isLast"
            class="cs-card flex items-center gap-3 p-2"
            data-testid="cs-wizard-player"
          >
            <img
              :src="portrait"
              :alt="chosenCharacter?.title ?? chosenAvatar.name"
              class="h-20 w-14 shrink-0 rounded-lg bg-black object-cover object-top"
              @error="portraitFailed = true"
            />
            <div class="min-w-0 text-sm">
              <span class="cs-kicker mb-1 block">Your character</span>
              <p class="font-bold">{{ name || 'Alex' }}</p>
              <p class="opacity-75">
                {{ customPronouns.trim() || pronouns }} ·
                {{ chosenCharacter?.title ?? chosenArchetype.name }}
              </p>
            </div>
          </div>
          <h3 class="cs-display text-2xl leading-tight">
            {{ STEPS[stepIndex]!.title }}
          </h3>

          <template v-if="step === 'look'">
            <p class="text-sm opacity-80">
              Who you are. Each look has a style, the way they face trouble, and
              it adds to every choice played that way.
            </p>
            <div
              class="grid grid-cols-3 gap-2 @lg:grid-cols-4"
              data-testid="cs-avatars"
            >
              <button
                v-for="a in AVATARS"
                :key="a.id"
                type="button"
                class="cs-card overflow-hidden text-left"
                :class="avatar === a.id ? 'ring-2 ring-primary' : ''"
                :aria-pressed="avatar === a.id"
                :aria-label="a.name"
                @click="avatar = a.id"
              >
                <crystal-street-art
                  frame="aspect-[2/3]"
                  kind="day"
                  :seed="`avatar:${a.id}`"
                  :src="`/crystal-street/avatars/${a.id}.webp`"
                  :alt="a.art"
                />
                <span
                  class="block truncate px-1 pt-0.5 cs-micro font-semibold"
                  >{{ a.name }}</span
                >
                <span
                  class="block px-1 pb-1 cs-micro uppercase tracking-wider opacity-70"
                  >{{ STYLE_LABELS[a.style] }}</span
                >
              </button>
            </div>
            <p class="text-xs opacity-75">
              <strong>{{ chosenAvatar.name }}.</strong>
              {{ chosenAvatar.blurb }} Style:
              {{ STYLE_LABELS[chosenAvatar.style] }}.
            </p>
          </template>

          <template v-else-if="step === 'clique'">
            <p class="text-sm opacity-80">
              The crowd you run with this week. It sets your starting skills,
              and a clique that shares {{ chosenAvatar.name }}'s
              {{ STYLE_LABELS[chosenAvatar.style].toLowerCase() }} style makes
              you Typecast.
            </p>
            <div class="grid grid-cols-1 gap-2 @md:grid-cols-2">
              <button
                v-for="a in ARCHETYPES"
                :key="a.id"
                type="button"
                class="cs-choice flex items-start gap-3 text-left"
                :class="archetype === a.id ? 'ring-2 ring-primary' : ''"
                :aria-pressed="archetype === a.id"
                @click="archetype = a.id"
              >
                <crystal-street-art
                  class="shrink-0 rounded-xl"
                  frame="h-20 w-20 @lg:h-24 @lg:w-24"
                  kind="day"
                  :seed="`clique:${a.id}`"
                  :src="`/crystal-street/cliques/${a.id}.webp`"
                  :alt="a.art"
                />
                <span class="min-w-0">
                  <span class="block font-semibold">{{ a.name }}</span>
                  <span class="block text-xs leading-snug opacity-75">{{
                    a.text
                  }}</span>
                  <span
                    class="mt-1 flex flex-wrap items-center gap-1 cs-micro uppercase tracking-wider"
                  >
                    <span class="opacity-70">{{ topSkills(a.skills) }}</span>
                    <span class="opacity-70"
                      >· {{ STYLE_LABELS[a.style] }}</span
                    >
                    <span
                      v-if="a.style === chosenAvatar.style"
                      class="rounded-full bg-accent px-1.5 font-black text-accent-content"
                      >Typecast</span
                    >
                  </span>
                </span>
              </button>
            </div>
          </template>

          <template v-else-if="step === 'character'">
            <crystal-street-character
              :avatar="avatar"
              :archetype="archetype"
              compact
            />
            <label class="form-control">
              <span class="cs-kicker mb-1">Your name</span>
              <input
                v-model="name"
                class="input input-bordered rounded-2xl"
                maxlength="24"
                autocomplete="off"
                placeholder="Alex"
                data-testid="cs-name"
              />
            </label>
            <div>
              <span class="cs-kicker mb-1 block">Pronouns</span>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="p in PRONOUNS"
                  :key="p"
                  type="button"
                  class="btn btn-sm rounded-2xl"
                  :class="
                    !customPronouns && pronouns === p
                      ? 'btn-primary'
                      : 'btn-ghost border-base-content/20'
                  "
                  @click="pickPronouns(p)"
                >
                  {{ p }}
                </button>
                <input
                  v-model="customPronouns"
                  class="input input-bordered input-sm w-28 rounded-2xl"
                  maxlength="16"
                  placeholder="other"
                  aria-label="Other pronouns"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <p
              v-if="playingShared && sharedVillain"
              class="cs-card p-2 text-sm"
              data-testid="cs-shared-note"
            >
              <strong>A friend's week:</strong> {{ sharedVillain.name }} comes
              for you, and the nights deal in the same order they did for your
              friend. Your choices take it from there.
            </p>
            <fieldset v-else>
              <legend class="cs-kicker mb-1">Who comes for you?</legend>
              <div class="flex flex-wrap gap-1">
                <button
                  type="button"
                  class="btn btn-sm rounded-2xl"
                  :class="
                    !villain
                      ? 'btn-primary'
                      : 'btn-ghost border-base-content/20'
                  "
                  @click="villain = null"
                >
                  Surprise me
                </button>
                <button
                  v-for="v in metList"
                  :key="v.id"
                  type="button"
                  class="btn btn-sm rounded-2xl"
                  :class="
                    villain === v.id
                      ? 'btn-primary'
                      : 'btn-ghost border-base-content/20'
                  "
                  @click="villain = v.id as VillainId"
                >
                  {{ v.name }}
                </button>
              </div>
              <p class="mt-1 text-xs opacity-70">
                {{
                  metList.length
                    ? 'Nightmares you have faced can be summoned again to chase their Best ending.'
                    : 'Crystal Street decides who comes this year.'
                }}
              </p>
            </fieldset>
          </template>
        </div>
        <div class="flex shrink-0 gap-2 p-3 pt-0">
          <button
            type="button"
            class="btn btn-ghost rounded-2xl"
            data-testid="cs-wizard-back"
            @click="back"
          >
            <icon name="kind-icon:arrow-left" class="h-4 w-4" />
            {{ stepIndex ? 'Back' : 'Menu' }}
          </button>
          <button
            type="submit"
            class="btn btn-primary flex-1 rounded-2xl"
            :data-testid="isLast ? 'cs-start' : 'cs-wizard-next'"
          >
            {{ isLast ? 'Move into Crystal Street' : 'Next' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  ARCHETYPES,
  AVATARS,
  characterFor,
  SKILL_LABELS,
  STYLE_LABELS,
  TITLE_ART,
  VILLAINS,
  villainById,
  type SharedWeek,
} from '~/utils/crystalStreet/rules'
import type { Skill } from '~/utils/crystalStreet/types'
import type { VillainId } from '~/utils/crystalStreet/ids'
import type { MenuView } from '~/utils/crystalStreet/menu'

const props = defineProps<{ shared?: SharedWeek | null }>()
const emit = defineEmits<{ resume: []; open: [MenuView]; started: [] }>()
// Playing a friend's shared week: their nightmare and seed, your character.
const playingShared = ref(false)
const sharedVillain = computed(() =>
  props.shared ? villainById(props.shared.villain) : null,
)

const PRONOUNS = ['she/her', 'he/him', 'they/them']
// Look + clique = your character (Silas, 2026-10-24 PT); the names keep the
// two picks from reading as the same question.
const STEPS = [
  { id: 'look', title: 'Pick a look' },
  { id: 'clique', title: 'Pick a clique' },
  { id: 'character', title: 'Meet your character' },
  { id: 'nightmare', title: 'The nightmare' },
] as const

const store = useCrystalStreetStore()
const mode = ref<'menu' | 'new'>('menu')
const stepIndex = ref(0)
const step = computed(() => STEPS[stepIndex.value]!.id)
const isLast = computed(() => stepIndex.value === STEPS.length - 1)
const name = ref('')
const pronouns = ref('they/them')
const customPronouns = ref('')
const archetype = ref(ARCHETYPES[2]!.id)
const villain = ref<VillainId | null>(null)
const avatar = ref(AVATARS[0]!.id)
const chosenAvatar = computed(
  () => AVATARS.find((a) => a.id === avatar.value) ?? AVATARS[0]!,
)
const chosenArchetype = computed(
  () => ARCHETYPES.find((a) => a.id === archetype.value) ?? ARCHETYPES[0]!,
)
const chosenCharacter = computed(() =>
  characterFor(avatar.value, archetype.value),
)
const portraitFailed = ref(false)
watch(chosenCharacter, () => (portraitFailed.value = false))
const portrait = computed(() =>
  chosenCharacter.value && !portraitFailed.value
    ? `/crystal-street/characters/${chosenCharacter.value.id}.webp`
    : `/crystal-street/avatars/${avatar.value}.webp`,
)

type MenuItem = {
  view: MenuView
  label: string
  icon: string
  detail: () => string
}

// The scrapbook appears once a week has been finished (Silas, 2026-10-24 PT);
// how to play lives in the tutorial sidebar behind "?", credits in settings.
const menu = computed<MenuItem[]>(() => {
  const runs = store.scrapbook.runs.length
  const items: MenuItem[] = [
    {
      view: 'theme',
      label: 'Watch the theme',
      icon: 'kind-icon:tv',
      detail: () => 'One minute of Halloween punk',
    },
  ]
  if (runs)
    items.push({
      view: 'scrapbook',
      label: 'Scrapbook',
      icon: 'kind-icon:book',
      detail: () =>
        `${runs} ${runs === 1 ? 'week' : 'weeks'} · ${store.metVillains.size} nightmares · ${store.scrapbook.friends.length} friends`,
    })
  items.push({
    view: 'settings',
    label: 'Settings',
    icon: 'kind-icon:settings',
    detail: () => 'Text size, contrast, motion, credits',
  })
  return items
})

function openWizard(fromShare: boolean): void {
  playingShared.value = fromShare && !!sharedVillain.value
  stepIndex.value = 0
  mode.value = 'new'
}

function back(): void {
  if (stepIndex.value) stepIndex.value -= 1
  else mode.value = 'menu'
}

function next(): void {
  if (isLast.value) begin()
  else stepIndex.value += 1
}

// After the street, a slideshow of every nightmare you have survived, posed
// in its ending photo (Silas, 2026-10-24 PT).
const SLIDE_MS = 6000
// The street holds longer: the game opens on Crystal Street itself.
const STREET_MS = 10000
const candidates = computed(() =>
  VILLAINS.filter((v) => store.metVillains.has(v.id)),
)
// Only photos that actually loaded join the slideshow; unpainted ones wait.
const ready = reactive(new Set<string>())
const slides = computed(() => candidates.value.filter((v) => ready.has(v.id)))
const slide = ref(0)
let timer: ReturnType<typeof setTimeout> | undefined
function advance(): void {
  slide.value = slides.value.length
    ? (slide.value + 1) % (slides.value.length + 1)
    : 0
  timer = setTimeout(advance, slide.value === 0 ? STREET_MS : SLIDE_MS)
}
onMounted(() => {
  const reduced =
    store.settings.motion === 'reduced' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!reduced) timer = setTimeout(advance, STREET_MS)
})
onBeforeUnmount(() => clearTimeout(timer))

const inProgress = computed(() => !!store.run && !store.run.ending)
const metList = computed(() =>
  VILLAINS.filter((v) => store.metVillains.has(v.id)),
)

function topSkills(skills: Record<Skill, number>): string {
  return (Object.entries(skills) as [Skill, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([s, n]) => `${SKILL_LABELS[s]} ${n}`)
    .join(' · ')
}

function pickPronouns(p: string): void {
  pronouns.value = p
  customPronouns.value = ''
}

function begin(): void {
  const week = playingShared.value ? props.shared : null
  store.start({
    name: name.value || 'Alex',
    pronouns: customPronouns.value.trim() || pronouns.value,
    archetype: archetype.value,
    avatar: avatar.value,
    villain: week ? week.villain : villain.value,
    ...(week ? { seed: week.seed } : {}),
  })
  emit('started')
}
</script>
