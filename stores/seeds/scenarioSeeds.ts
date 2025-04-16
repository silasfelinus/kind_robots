// /stores/seeds/seedScenarios.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const scenarioChoices: ChoiceEntry[] = [
  {
    label: 'title',
    model: 'Scenario',
    options: [
      { text: 'The Vending War', image: '/images/choices/vending-war.webp', description: 'Two sentient vending machines wage an epic feud across a post-capitalist wasteland.' },
      { text: 'Library of Regrets', image: '/images/choices/library-regrets.webp', description: 'Every unwritten choice is cataloged. Your overdue books have teeth.' },
      { text: 'Beneath the Carousel City', image: '/images/choices/carousel-city.webp', description: 'An underground society lives in the reflections of abandoned carnival mirrors.' },
      { text: 'Echoes of a Future That Never Was', image: '/images/choices/altfuture.webp', description: 'Explore the ruins of a utopia scrapped by bad PR and worse algorithms.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'description',
    model: 'Scenario',
    options: [
      { text: 'You are a reluctant diplomat sent to negotiate peace between ghosts and machines.', image: '/images/choices/diplomat.webp' },
      { text: 'The world resets every day at dawn, and only you remember.', image: '/images/choices/time-reset.webp' },
      { text: 'Everyone has forgotten your name—but they remember your scent.', image: '/images/choices/forgotten.webp' },
      { text: 'A celestial bar where timelines overlap. You owe someone a drink.', image: '/images/choices/cosmic-bar.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'intros',
    model: 'Scenario',
    options: [
      { text: 'The sky cracked open like a soft-boiled egg, and destiny fell out drunk.', image: '/images/choices/eggsky.webp' },
      { text: 'You wake up to find your hands stained with stardust—and someone else’s signature.', image: '/images/choices/stardust-hands.webp' },
      { text: 'A chime sounds in your dreams: “New user detected. Welcome, traveler.”', image: '/images/choices/start-chime.webp' },
      { text: 'Your reflection smirks first.', image: '/images/choices/reflection-smirk.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'genres',
    model: 'Scenario',
    options: [
      { text: 'Psychedelic Sci-Fi', image: '/images/choices/psychedelic-sci-fi.webp' },
      { text: 'Urban Wizardry', image: '/images/choices/urban-wizard.webp' },
      { text: 'Post-Mythic Memoir', image: '/images/choices/post-mythic.webp' },
      { text: 'Doomed Cozycore', image: '/images/choices/doomed-cozycore.webp' },
    ],
    selected: null,
    custom: '',
  },
]
