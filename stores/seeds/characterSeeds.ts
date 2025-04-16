// /stores/seeds/characterSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const characterChoices: ChoiceEntry[] = [
  {
    label: 'species',
    model: 'Character',
    options: [
      { text: 'Starborn Jellywitch', image: '/images/choices/jellywitch.webp', description: 'Translucent skin, floating tendrils, speaks in tide rhythms.' },
      { text: 'Porcelain Centaur', image: '/images/choices/porcelain-centaur.webp', description: 'Ceramic body with crackled glaze and horse legs. Delicate but deadly.' },
      { text: 'Quantum Lich', image: '/images/choices/quantum-lich.webp', description: 'Their soul is entangled across dimensions. They don’t fear death—they remember it.' },
      { text: 'Sun-Forged Beetle Knight', image: '/images/choices/beetle-knight.webp', description: 'Clad in iridescent chitin armor, rides a solar wind.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'class',
    model: 'Character',
    options: [
      { text: 'Chronomancer', image: '/images/choices/chronomancer.webp', description: 'Bends time like taffy. Shows up to the fight before it starts.' },
      { text: 'Gloom Gardener', image: '/images/choices/gloomgardener.webp', description: 'Plants sorrow. Harvests secrets. Blooms under moonlight.' },
      { text: 'Plague Bard', image: '/images/choices/plaguebard.webp', description: 'Sings the end of things. Carries a flute and several plagues.' },
      { text: 'Dumpster Paladin', image: '/images/choices/dumpster-paladin.webp', description: 'Fights for forgotten causes and abandoned furniture.' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'drive',
    model: 'Character',
    options: [
      { text: 'To prove my nemesis wrong—even if I must invent them first.', image: '/images/choices/nemesis.webp' },
      { text: 'To find the perfect soup.', image: '/images/choices/soupquest.webp' },
      { text: 'To break the loop I accidentally caused.', image: '/images/choices/time-loop.webp' },
      { text: 'To become a myth while still alive.', image: '/images/choices/living-legend.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'quirks',
    model: 'Character',
    options: [
      { text: 'Can only speak in rhymes when angry.', image: '/images/choices/rhyming-rage.webp' },
      { text: 'Refuses to eat round foods.', image: '/images/choices/no-circles.webp' },
      { text: 'Collects names but refuses to use them.', image: '/images/choices/name-thief.webp' },
      { text: 'Haunted by a ghost that gives terrible advice.', image: '/images/choices/bad-ghost.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'genre',
    model: 'Character',
    options: [
      { text: 'Pastel Apocalyptic', image: '/images/choices/pastel-apoc.webp' },
      { text: 'Techno-Feudalism', image: '/images/choices/techno-feudal.webp' },
      { text: 'Carnival Noir', image: '/images/choices/carnival-noir.webp' },
      { text: 'Neo-Mythic Slice of Life', image: '/images/choices/neo-mythic.webp' },
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'personality',
    model: 'Character',
    options: [
      { text: 'Chaotic Wholesome', image: '/images/choices/chaotic-wholesome.webp', description: 'Loves people. May explode things to help them.' },
      { text: 'Grumpy Romantic', image: '/images/choices/grumpy-romantic.webp', description: 'Complains while making you soup.' },
      { text: 'Secretly a Villain', image: '/images/choices/secret-villain.webp', description: 'Very nice. Definitely not monologuing in the mirror.' },
      { text: 'Hyper-empathetic Disaster', image: '/images/choices/empathy-spiral.webp', description: 'Feels everything. Doesn’t sleep. Bakes cookies.' },
    ],
    selected: null,
    custom: '',
  },
]
