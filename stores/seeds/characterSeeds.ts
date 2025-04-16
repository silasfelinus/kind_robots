// /stores/seeds/characterSeeds.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const characterChoices: ChoiceEntry[] = [
  {
    label: 'species',
    model: 'Character',
    options: [
      {
        text: 'Starborn Jellywitch',
        image: '/images/choices/jellywitch.webp',
        description: 'Translucent skin, floating tendrils, speaks in tide rhythms.'
      },
      {
        text: 'Porcelain Centaur',
        image: '/images/choices/porcelain-centaur.webp',
        description: 'Ceramic body with crackled glaze and horse legs. Delicate but deadly.'
      },
      {
        text: 'Quantum Lich',
        image: '/images/choices/quantum-lich.webp',
        description: 'Soul entangled across dimensions. Remembers every death.'
      },
      {
        text: 'Sun-Forged Beetle Knight',
        image: '/images/choices/beetle-knight.webp',
        description: 'Iridescent chitin armor. Rides a solar wind. Probably honorable.'
      }
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'class',
    model: 'Character',
    options: [
      {
        text: 'Chronomancer',
        image: '/images/choices/chronomancer.webp',
        description: 'Bends time like taffy. Shows up before the battle starts.'
      },
      {
        text: 'Gloom Gardener',
        image: '/images/choices/gloomgardener.webp',
        description: 'Plants sorrow. Harvests secrets. Blooms only under moonlight.'
      },
      {
        text: 'Plague Bard',
        image: '/images/choices/plaguebard.webp',
        description: 'Sings the end. Brings a flute... and five kinds of pestilence.'
      },
      {
        text: 'Dumpster Paladin',
        image: '/images/choices/dumpster-paladin.webp',
        description: 'Fights for forgotten causes and abandoned furniture.'
      }
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'drive',
    model: 'Character',
    options: [
      {
        text: 'To prove my nemesis wrong—even if I must invent them first.',
        image: '/images/choices/nemesis.webp',
        description: 'The drama. The delusion. The delicious spite.'
      },
      {
        text: 'To find the perfect soup.',
        image: '/images/choices/soupquest.webp',
        description: 'A broth-based journey across continents.'
      },
      {
        text: 'To break the loop I accidentally caused.',
        image: '/images/choices/time-loop.webp',
        description: 'Déjà vu? Or just guilt on repeat?'
      },
      {
        text: 'To become a myth while still alive.',
        image: '/images/choices/living-legend.webp',
        description: 'Not content with legends after death. Wants theirs now.'
      }
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'quirks',
    model: 'Character',
    options: [
      {
        text: 'Can only speak in rhymes when angry.',
        image: '/images/choices/rhyming-rage.webp',
        description: '"You broke my wand, you blithering fool! Prepare thy doom—my wrath is cruel!"'
      },
      {
        text: 'Refuses to eat round foods.',
        image: '/images/choices/no-circles.webp',
        description: 'No bagels. No donuts. Especially no tomatoes.'
      },
      {
        text: 'Collects names but refuses to use them.',
        image: '/images/choices/name-thief.webp',
        description: 'Keeps a ledger. Doesn’t speak a word.'
      },
      {
        text: 'Haunted by a ghost that gives terrible advice.',
        image: '/images/choices/bad-ghost.webp',
        description: '“Start a fire!” “Invest in cabbage futures!” The ghost is very confident.'
      }
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'genre',
    model: 'Character',
    options: [
      {
        text: 'Pastel Apocalyptic',
        image: '/images/choices/pastel-apoc.webp',
        description: 'Everything’s ruined. But cutely.'
      },
      {
        text: 'Techno-Feudalism',
        image: '/images/choices/techno-feudal.webp',
        description: 'Drones above. Serfs below. Neon chainmail for all.'
      },
      {
        text: 'Carnival Noir',
        image: '/images/choices/carnival-noir.webp',
        description: 'Honking horns. Murky motives. Someone’s lying in the funhouse.'
      },
      {
        text: 'Neo-Mythic Slice of Life',
        image: '/images/choices/neo-mythic.webp',
        description: 'Gods go to therapy. Demigods run cafés. Life, with drama.'
      }
    ],
    selected: null,
    custom: '',
  },
  {
    label: 'personality',
    model: 'Character',
    options: [
      {
        text: 'Chaotic Wholesome',
        image: '/images/choices/chaotic-wholesome.webp',
        description: 'Loves everyone. Causes explosions while hugging.'
      },
      {
        text: 'Grumpy Romantic',
        image: '/images/choices/grumpy-romantic.webp',
        description: 'Will argue with you while cooking your favorite meal.'
      },
      {
        text: 'Secretly a Villain',
        image: '/images/choices/secret-villain.webp',
        description: 'They’re nice. They’re helpful. They have a villain speech rehearsed.'
      },
      {
        text: 'Hyper-empathetic Disaster',
        image: '/images/choices/empathy-spiral.webp',
        description: 'Cries during commercials. Accidentally adopted five strays. Bakes cookies.'
      }
    ],
    selected: null,
    custom: '',
  },
]
