// /stores/seeds/characterChoices.ts
import type { ChoiceEntry } from '@/stores/choiceStore'

export const characterChoices: ChoiceEntry[] = [
  {
    label: 'species',
    model: 'Character',
    options: [
      {
        text: 'Starborn Jellywitch',
        icon: 'mdi:jellyfish',
        description:
          'Translucent skin, floating tendrils, speaks in tide rhythms.',
      },
      {
        text: 'Porcelain Centaur',
        icon: 'mdi:horse-variant-fast',
        description:
          'Ceramic body with crackled glaze and horse legs. Delicate but deadly.',
      },
      {
        text: 'Quantum Lich',
        icon: 'mdi:skull-outline',
        description: 'Soul entangled across dimensions. Remembers every death.',
      },
      {
        text: 'Sun-Forged Beetle Knight',
        icon: 'mdi:shield-bug',
        description:
          'Iridescent chitin armor. Rides a solar wind. Probably honorable.',
      },
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
        icon: 'mdi:timeline-clock-outline',
        description:
          'Bends time like taffy. Shows up before the battle starts.',
      },
      {
        text: 'Gloom Gardener',
        icon: 'mdi:flower-outline',
        description:
          'Plants sorrow. Harvests secrets. Blooms only under moonlight.',
      },
      {
        text: 'Plague Bard',
        icon: 'mdi:music-circle-outline',
        description:
          'Sings the end. Brings a flute... and five kinds of pestilence.',
      },
      {
        text: 'Dumpster Paladin',
        icon: 'mdi:trash-can-outline',
        description: 'Fights for forgotten causes and abandoned furniture.',
      },
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
        icon: 'mdi:account-cancel-outline',
        description: 'The drama. The delusion. The delicious spite.',
      },
      {
        text: 'To find the perfect soup.',
        icon: 'mdi:food-turkey',
        description: 'A broth-based journey across continents.',
      },
      {
        text: 'To break the loop I accidentally caused.',
        icon: 'mdi:infinity',
        description: 'Déjà vu? Or just guilt on repeat?',
      },
      {
        text: 'To become a myth while still alive.',
        icon: 'mdi:book-open-variant',
        description: 'Not content with legends after death. Wants theirs now.',
      },
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
        icon: 'mdi:emoticon-angry-outline',
        description:
          '"You broke my wand, you blithering fool! Prepare thy doom—my wrath is cruel!"',
      },
      {
        text: 'Refuses to eat round foods.',
        icon: 'mdi:alpha-o-circle-outline',
        description: 'No bagels. No donuts. Especially no tomatoes.',
      },
      {
        text: 'Collects names but refuses to use them.',
        icon: 'mdi:book-lock-outline',
        description: 'Keeps a ledger. Doesn’t speak a word.',
      },
      {
        text: 'Haunted by a ghost that gives terrible advice.',
        icon: 'mdi:ghost-outline',
        description:
          '“Start a fire!” “Invest in cabbage futures!” The ghost is very confident.',
      },
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
        icon: 'mdi:weather-sunset',
        description: 'Everything’s ruined. But cutely.',
      },
      {
        text: 'Techno-Feudalism',
        icon: 'mdi:castle',
        description: 'Drones above. Serfs below. Neon chainmail for all.',
      },
      {
        text: 'Carnival Noir',
        icon: 'mdi:emoticon-confused-outline',
        description:
          'Honking horns. Murky motives. Someone’s lying in the funhouse.',
      },
      {
        text: 'Neo-Mythic Slice of Life',
        icon: 'mdi:book-heart-outline',
        description:
          'Gods go to therapy. Demigods run cafés. Life, with drama.',
      },
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
        icon: 'mdi:emoticon-happy-outline',
        description: 'Loves everyone. Causes explosions while hugging.',
      },
      {
        text: 'Grumpy Romantic',
        icon: 'mdi:heart-broken-outline',
        description: 'Will argue with you while cooking your favorite meal.',
      },
      {
        text: 'Secretly a Villain',
        icon: 'mdi:emoticon-devil-outline',
        description:
          'They’re nice. They’re helpful. They have a villain speech rehearsed.',
      },
      {
        text: 'Hyper-empathetic Disaster',
        icon: 'mdi:emoticon-cry-outline',
        description:
          'Cries during commercials. Accidentally adopted five strays. Bakes cookies.',
      },
    ],
    selected: null,
    custom: '',
  },
]
