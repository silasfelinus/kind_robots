// /stores/seeds/scenarioSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const scenarioChoices: ChoiceEntry[] = [
  {
    label: 'title',
    model: 'Scenario',
    options: [
      {
        text: 'The Vending War',
        icon: 'mdi:vending-machine',
        description:
          'Two sentient vending machines feud across a post-capitalist wasteland.',
      },
      {
        text: 'Library of Regrets',
        icon: 'mdi:book-alert',
        description:
          'Every unwritten choice is cataloged. Your overdue books have teeth.',
      },
      {
        text: 'Beneath the Carousel City',
        icon: 'mdi:castle',
        description:
          'An underground society lives in the reflections of abandoned carnival mirrors.',
      },
      {
        text: 'Echoes of a Future That Never Was',
        icon: 'mdi:robot-industrial-outline',
        description:
          'Ruins of a utopia scrapped by bad PR and worse algorithms.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'description',
    model: 'Scenario',
    options: [
      {
        text: 'Negotiate peace between ghosts and machines.',
        icon: 'mdi:ghost',
        description: 'You don’t speak their language. Neither do they.',
      },
      {
        text: 'The world resets at dawn. Only you remember.',
        icon: 'mdi:refresh-auto',
        description: 'You’re trapped in a polite apocalypse.',
      },
      {
        text: 'Everyone forgot your name—but remember your scent.',
        icon: 'mdi:nose',
        description: 'Lavender and existential dread.',
      },
      {
        text: 'Celestial bar where timelines collide.',
        icon: 'mdi:glass-cocktail',
        description: 'One drink might change your entire fate.',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'intros',
    model: 'Scenario',
    options: [
      {
        text: 'The sky cracked like a soft-boiled egg. Destiny fell out drunk.',
        icon: 'mdi:weather-lightning-rainy',
        description: 'You could blame the sky. But you know better.',
      },
      {
        text: 'Hands stained with stardust. Someone else’s signature.',
        icon: 'mdi:star-four-points-circle',
        description: 'You woke up guilty. And glittery.',
      },
      {
        text: '“New user detected,” whispers a chime in your dream.',
        icon: 'mdi:bell-badge-outline',
        description: 'Welcome to the strange app of fate.',
      },
      {
        text: 'Your reflection smirks first.',
        icon: 'mdi:mirror-variant',
        description: 'Who’s the real protagonist here?',
      },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'genre',
    model: 'Scenario',
    options: [
      {
        text: 'Psychedelic Sci-Fi',
        icon: 'mdi:eye-circle',
        description: 'Colorful brain-bending logic with glittering doom.',
      },
      {
        text: 'Urban Wizardry',
        icon: 'mdi:wand',
        description: 'Concrete rituals and spell-scribbled alleyways.',
      },
      {
        text: 'Post-Mythic Memoir',
        icon: 'mdi:book-open-page-variant-outline',
        description: 'After the gods leave, who tells the story?',
      },
      {
        text: 'Doomed Cozycore',
        icon: 'mdi:tea',
        description: 'Snacks. Blankets. Impending catastrophe.',
      },
    ],
    selected: null,
    custom: '',
  },
]
