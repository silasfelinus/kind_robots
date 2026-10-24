<template>
  <section class="kr-panes grid-cols-1" :aria-label="title">
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">{{ title }}</h2>
      </div>
      <div
        v-if="section === 'guide'"
        class="kr-pane-scroll grid grid-cols-1 gap-3 p-3 @3xl:grid-cols-2"
        data-testid="cs-guide"
      >
        <article
          v-for="part in RULES"
          :key="part.title"
          class="cs-card space-y-1 p-3"
        >
          <h3 class="cs-kicker">{{ part.title }}</h3>
          <p
            v-for="line in part.lines"
            :key="line"
            class="text-sm leading-relaxed"
          >
            {{ line }}
          </p>
        </article>
      </div>
      <div v-else class="kr-pane-scroll space-y-3 p-3" data-testid="cs-credits">
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">Made at Kind Robots</h3>
          <p class="text-sm leading-relaxed">
            Terrors on Crystal Street was dreamed up by Silas Knight and built
            with AI collaborators at Kind Robots, a project about turning AI
            toward creativity and human benefit. It runs entirely in your
            browser: no accounts, no tracking, your weeks saved on this device.
          </p>
        </article>
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">The art</h3>
          <p class="text-sm leading-relaxed">
            Every nightmare, friend and place was painted from a written prompt
            in the Kind Robots art studio. The cover is Masking Up from the
            Hollywood Monsters Recast coloring book. Scenes still waiting for
            paint are drawn live in code.
          </p>
        </article>
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">The remix</h3>
          <p class="text-sm leading-relaxed">
            Many of the nightmares start from classic horror villains, flipped
            or bent to ask what the old scripts leaned on and what a queerer
            angle gives back. Queerness is never the monster here. Every
            character is original; the films below are homage, not license.
          </p>
          <p class="text-xs leading-relaxed opacity-80">
            {{ films }}
          </p>
        </article>
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">Thanks</h3>
          <p class="text-sm leading-relaxed">
            To every midnight-movie audience that ever talked back to the
            screen, and to everyone who survived the 80s by finding their crew.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ACTIONS_PER_DAY,
  BEST_WINS,
  CREW_LIMIT,
  TIER_HOW,
  TIER_LABELS,
  VILLAINS,
  ENDING_TIERS,
} from '~/utils/crystalStreet/rules'

const props = defineProps<{ section: 'guide' | 'credits' }>()

const title = computed(() =>
  props.section === 'guide' ? 'How to play' : 'Credits',
)

const RULES = [
  {
    title: 'The week',
    lines: [
      'Each week runs from Saturday to Halloween: seven days, seven nights, one nightmare.',
      'Choose who you are (Jock, Brain, Theatre Kid, Burnout, Prep or Weirdo) and pick a nightmare you have already met, or let Crystal Street surprise you.',
    ],
  },
  {
    title: 'Days',
    lines: [
      `You get ${ACTIONS_PER_DAY} actions a day. Pick a place on the Glimmer Falls map to play a daylight adventure, follow a lead, meet a friend, train a skill, rest at home, or shop at Oddment and Daughters, the traveling pawnshop.`,
    ],
  },
  {
    title: 'Nights',
    lines: [
      'At nightfall dread rises. The nightmare reveals itself on the first night and brings its own scenes on nights two, four and six.',
      'Other nights pull from the decks it shares with its kind (paranormal, slasher, creature, cosmic, tech, camp, cult, dream), and some outcomes drag you into a second card the same night.',
    ],
  },
  {
    title: 'Dice',
    lines: [
      'Every choice rolls two dice plus your skill, +1 if a friend in your crew shares it, your best gear, and any bonus the choice names. Nights subtract one, and one more for every four dread.',
      'You need 7, 9 or 11, and the odds are shown on every choice. Double six always works; snake eyes never does.',
    ],
  },
  {
    title: 'Nerve, dread and friends',
    lines: [
      'Nerve is your health: run out and you are Taken. Dread makes nights harder.',
      `Up to ${CREW_LIMIT} friends can join your crew. Each helps with their skills and brings a perk, but perks do not stack, so a full crew is broad rather than invincible. A friend shaken by a bad night gives no help until dawn.`,
    ],
  },
  {
    title: 'Halloween',
    lines: [
      'On the last night you face it: fight it, trick it, or, if you found all three of its leads, reach its heart.',
      `The Best ending needs the heart and at least ${BEST_WINS} night wins that week.`,
    ],
  },
  {
    title: 'Endings and the scrapbook',
    lines: ENDING_TIERS.map(
      (tier) => `${TIER_LABELS[tier]}: ${TIER_HOW[tier]}`,
    ),
  },
  {
    title: 'Collecting',
    lines: [
      'Every week is pasted into your scrapbook. Nightmares you face open in the monster gallery with their backstories, and every ending you find stays in the endings reel. There is one Best ending for each nightmare.',
    ],
  },
]

const films = computed(() =>
  [
    ...new Set(
      VILLAINS.map((v) => `${v.inspiration.film} (${v.inspiration.year})`),
    ),
  ]
    .sort()
    .join(' · '),
)
</script>
