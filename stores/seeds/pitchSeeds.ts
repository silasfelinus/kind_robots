// /stores/seeds/pitchSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const pitchChoices: ChoiceEntry[] = [
  {
    label: 'title',
    model: 'Pitch',
    options: [
      { text: 'The Moon is a Rented Timeshare', image: '/images/choices/pitch-moonshare.webp', description: 'Everyone gets one week to rule the tides.' },
      { text: 'My Shadow Has a Podcast', image: '/images/choices/pitch-shadowcast.webp', description: 'And it’s getting better ratings than I am.' },
      { text: 'Goblins in Business Casual', image: '/images/choices/pitch-goblinbiz.webp', description: 'Fantasy startup culture meets dungeon crawling.' },
      { text: 'Dreams for Sale (By the Pound)', image: '/images/choices/pitch-dreamsale.webp', description: 'What would you pay for a memory that never happened?' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'pitch',
    model: 'Pitch',
    options: [
      { text: 'A city built on the back of a sleeping god, whose dreams shape reality nightly.', image: '/images/choices/pitch-godcity.webp' },
      { text: 'An auction house for ideas where creatives bid with their memories.', image: '/images/choices/pitch-ideaauction.webp' },
      { text: 'Aliens mistake improv theater for Earth’s ruling body.', image: '/images/choices/pitch-improv-alien.webp' },
      { text: 'A society that communicates only via edible pastries.', image: '/images/choices/pitch-cakecode.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'PitchType',
    model: 'Pitch',
    options: [
      { text: 'ARTPITCH', image: '/images/choices/pitch-art.webp', description: 'Visual-driven inspiration' },
      { text: 'BRAINSTORM', image: '/images/choices/pitch-brainstorm.webp', description: 'Idea cloud or collaborative session' },
      { text: 'TEXTPITCH', image: '/images/choices/pitch-text.webp', description: 'Text-based prompt starter' },
      { text: 'WEIRDLANDIA', image: '/images/choices/pitch-weirdlandia.webp', description: 'Absurd or chaotic pitches' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'flavorText',
    model: 'Pitch',
    options: [
      { text: 'This one smells like ozone and regret.', image: '/images/choices/flavor-ozone.webp' },
      { text: 'Inspired by a conversation between a crow and a vending machine.', image: '/images/choices/flavor-vending.webp' },
      { text: 'Might be cursed. Definitely charming.', image: '/images/choices/flavor-charming.webp' },
      { text: 'Guaranteed to derail your plot—in a good way.', image: '/images/choices/flavor-derail.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'imagePrompt',
    model: 'Pitch',
    options: [
      { text: 'foggy skyline with floating windows and pink constellations', image: '/images/choices/imgprompt-fogsky.webp' },
      { text: 'neon-lit ramen stand under a black hole', image: '/images/choices/imgprompt-ramenhole.webp' },
      { text: 'fractured cathedral orbiting a planet made of glass', image: '/images/choices/imgprompt-cathedral.webp' },
      { text: 'retro anime poster featuring a robot octopus and a jazz saxophone', image: '/images/choices/imgprompt-robotjazz.webp' },
    ],
    selected: null,
    custom: '',
  },
]
