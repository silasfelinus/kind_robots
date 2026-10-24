<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @3xl:grid-rows-1"
    aria-label="Start a week on Crystal Street"
  >
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
        class="absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/35 to-transparent px-4 pb-12 pt-3 text-center"
      >
        <h2 class="leading-none">
          <span
            class="cs-display cs-terrors block text-6xl @lg:text-7xl @3xl:text-8xl"
            >Terrors</span
          >
          <span
            class="cs-kicker block text-base tracking-[0.35em] text-white @3xl:text-xl"
            >on Crystal Street</span
          >
        </h2>
        <p class="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/80">
          One week · seven nights · {{ VILLAINS.length }} nightmares
        </p>
      </div>
      <div
        class="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 text-white"
      >
        <p class="mr-auto max-w-md text-sm">
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
        <span
          v-if="slides.length"
          class="flex gap-1"
          aria-hidden="true"
          data-testid="cs-title-slides"
        >
          <span
            v-for="i in slides.length + 1"
            :key="i"
            class="h-1.5 w-3 rounded-full"
            :class="slide === i - 1 ? 'bg-accent' : 'bg-white/30'"
          />
        </span>
      </div>
    </div>

    <nav
      v-if="mode === 'menu'"
      class="kr-pane cs-frame"
      aria-label="Main menu"
      data-testid="cs-menu"
    >
      <div class="kr-pane-scroll space-y-2 p-3">
        <button
          v-if="inProgress"
          type="button"
          class="cs-menu-item cs-menu-primary"
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
          type="button"
          class="cs-menu-item"
          :class="inProgress ? '' : 'cs-menu-primary'"
          data-testid="cs-new-week"
          @click="mode = 'new'"
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
          v-for="item in MENU"
          :key="item.view"
          type="button"
          class="cs-menu-item"
          :data-testid="`cs-menu-${item.view}`"
          @click="$emit('open', item.view)"
        >
          <icon :name="item.icon" class="h-5 w-5 shrink-0" />
          <span>
            <span class="block font-bold">{{ item.label }}</span>
            <span class="block text-xs opacity-80">{{ item.detail() }}</span>
          </span>
        </button>
      </div>
    </nav>

    <form v-else class="kr-pane cs-frame" @submit.prevent="begin">
      <div class="kr-toolbar px-3 pt-3">
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="mode = 'menu'"
        >
          <icon name="kind-icon:arrow-left" class="h-4 w-4" /> Menu
        </button>
      </div>
      <div class="kr-pane-scroll space-y-4 p-3">
        <h2 class="cs-display text-2xl">New week</h2>
        <div class="grid grid-cols-1 gap-3 @lg:grid-cols-2">
          <label class="form-control">
            <span class="cs-kicker mb-1">Your name</span>
            <input
              v-model="name"
              class="input input-bordered input-sm rounded-2xl"
              maxlength="24"
              autocomplete="off"
              placeholder="Alex"
            />
          </label>
          <div>
            <span class="cs-kicker mb-1 block">Pronouns</span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="p in PRONOUNS"
                :key="p"
                type="button"
                class="btn btn-xs rounded-2xl"
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
                class="input input-bordered input-xs w-24 rounded-2xl"
                maxlength="16"
                placeholder="other"
                aria-label="Other pronouns"
              />
            </div>
          </div>
        </div>

        <fieldset>
          <legend class="cs-kicker mb-1">Pick your look</legend>
          <div class="flex gap-2 overflow-x-auto pb-1" data-testid="cs-avatars">
            <button
              v-for="a in AVATARS"
              :key="a.id"
              type="button"
              class="cs-card w-20 shrink-0 overflow-hidden text-left @3xl:w-24"
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
                class="block truncate px-1 py-0.5 text-[10px] font-semibold"
                >{{ a.name }}</span
              >
            </button>
          </div>
          <p class="mt-1 text-xs opacity-75">
            <strong>{{ chosenAvatar.name }}.</strong> {{ chosenAvatar.blurb }}
          </p>
        </fieldset>

        <fieldset>
          <legend class="cs-kicker mb-1">Who are you this week?</legend>
          <div class="grid grid-cols-2 gap-2 @xl:grid-cols-3">
            <button
              v-for="a in ARCHETYPES"
              :key="a.id"
              type="button"
              class="cs-choice text-left"
              :class="archetype === a.id ? 'ring-2 ring-primary' : ''"
              :aria-pressed="archetype === a.id"
              @click="archetype = a.id"
            >
              <span class="block font-semibold">{{ a.name }}</span>
              <span class="block text-[11px] leading-snug opacity-75">{{
                a.text
              }}</span>
              <span
                class="mt-1 block text-[10px] uppercase tracking-wider opacity-70"
                >{{ topSkills(a.skills) }}</span
              >
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="cs-kicker mb-1">The nightmare</legend>
          <div class="flex flex-wrap gap-1">
            <button
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                !villain ? 'btn-primary' : 'btn-ghost border-base-content/20'
              "
              @click="villain = null"
            >
              Surprise me
            </button>
            <button
              v-for="v in metList"
              :key="v.id"
              type="button"
              class="btn btn-xs rounded-2xl"
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
            Nightmares you have faced can be summoned again to chase their Best
            ending.
          </p>
        </fieldset>
      </div>
      <div class="shrink-0 p-3 pt-0">
        <button
          type="submit"
          class="btn btn-primary w-full rounded-2xl"
          data-testid="cs-start"
        >
          Move into Crystal Street
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  ARCHETYPES,
  AVATARS,
  COMPANIONS,
  SKILL_LABELS,
  TITLE_ART,
  VILLAINS,
} from '~/utils/crystalStreet/rules'
import type { Skill } from '~/utils/crystalStreet/types'
import type { VillainId } from '~/utils/crystalStreet/ids'
import type { MenuView } from '~/utils/crystalStreet/menu'

const emit = defineEmits<{ resume: []; open: [MenuView]; started: [] }>()

const PRONOUNS = ['she/her', 'he/him', 'they/them']
const store = useCrystalStreetStore()
const name = ref('')
const pronouns = ref('they/them')
const customPronouns = ref('')
const archetype = ref(ARCHETYPES[2]!.id)
const villain = ref<VillainId | null>(null)
const avatar = ref(AVATARS[0]!.id)
const chosenAvatar = computed(
  () => AVATARS.find((a) => a.id === avatar.value) ?? AVATARS[0]!,
)

const mode = ref<'menu' | 'new'>('menu')

const MENU: {
  view: MenuView
  label: string
  icon: string
  detail: () => string
}[] = [
  {
    view: 'gallery',
    label: 'Monster gallery',
    icon: 'kind-icon:mask',
    detail: () =>
      `${store.metVillains.size}/${VILLAINS.length} nightmares faced · backstories`,
  },
  {
    view: 'endings',
    label: 'Endings',
    icon: 'kind-icon:trophy',
    detail: () =>
      `${store.scrapbook.endings.length}/${VILLAINS.length * 4} found · ${store.bestFound} Best`,
  },
  {
    view: 'crew',
    label: 'Friends of Crystal Street',
    icon: 'kind-icon:users',
    detail: () => `${COMPANIONS.length} friends, every mood and poster`,
  },
  {
    view: 'scrapbook',
    label: 'Scrapbook',
    icon: 'kind-icon:book',
    detail: () =>
      `${store.scrapbook.runs.length} ${store.scrapbook.runs.length === 1 ? 'week' : 'weeks'} remembered`,
  },
  {
    view: 'guide',
    label: 'How to play',
    icon: 'kind-icon:question',
    detail: () => 'Days, nights, dice and the Best ending',
  },
  {
    view: 'settings',
    label: 'Settings',
    icon: 'kind-icon:settings',
    detail: () => 'Text size, contrast, motion, saved data',
  },
  {
    view: 'credits',
    label: 'Credits',
    icon: 'kind-icon:star',
    detail: () => 'Who made this and what it remixes',
  },
]

// After the street, a slideshow of every nightmare you have survived, posed
// in its ending photo (Silas, 2026-10-24 PT).
const SLIDE_MS = 6000
const candidates = computed(() =>
  VILLAINS.filter((v) => store.metVillains.has(v.id)),
)
// Only photos that actually loaded join the slideshow; unpainted ones wait.
const ready = reactive(new Set<string>())
const slides = computed(() => candidates.value.filter((v) => ready.has(v.id)))
const slide = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  const reduced =
    store.settings.motion === 'reduced' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) return
  timer = setInterval(() => {
    slide.value = slides.value.length
      ? (slide.value + 1) % (slides.value.length + 1)
      : 0
  }, SLIDE_MS)
})
onBeforeUnmount(() => clearInterval(timer))

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
  store.start({
    name: name.value || 'Alex',
    pronouns: customPronouns.value.trim() || pronouns.value,
    archetype: archetype.value,
    avatar: avatar.value,
    villain: villain.value,
  })
  emit('started')
}
</script>
