import type { Pitch } from '@prisma/client'
import { PitchType } from '@prisma/client'

// Upgraded samplePitches to use the full Pitch model structure
export const samplePitches: Pitch[] = [
  {
    id: 1,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Pickup Lines at a Funeral',
    pitch: "I hear you're newly single...",
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 2,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Sinister movie taglines for feel-good films',
    pitch: 'Feel the Warmth: A heartwarming tale of arson and friendship!',
    designer: null,
    flavorText: null,
    description: ' ',
    imagePrompt: ' ',
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 3,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Terrible Ideas for Role-Playing Characters',
    pitch: 'Chair: The non-sentient chair',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 4,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Awkward Elevator Conversations',
    pitch: "So, how's your day going, floor 7?",
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 5,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unfortunate Superhero Names',
    pitch: 'Captain Obvious: "Look, a crime!"',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 6,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Failed Reality TV Shows',
    pitch: 'Extreme Ironing: The Ultimate Wrinkle Challenge',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 7,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Scented Candles',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Eau de Wet Dog',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 8,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Inappropriate Icebreakers',
    pitch: 'So, what’s your Wi-Fi password?',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 9,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unrealistic Fortune Cookie Fortunes',
    pitch: 'You will find true love during your next dentist appointment.',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 10,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Absurd Self-Help Books',
    pitch: 'How to Overthink Everything: A Guide',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 11,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Ridiculous Conspiracy Theories',
    pitch: 'The moon is made of gluten-free cheese',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 12,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unfortunate Band Names',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'The Tone-Deaf Turtles',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 13,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Yoga Poses',
    pitch: 'The Confused Flamingo',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 14,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Terrible Tourist Attractions',
    pitch: 'The Museum of Unfinished Paintings',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 15,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unusual Cooking Shows',
    pitch: 'Cooking with Cardboard: A Recycling Adventure',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 16,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Awkward Superpowers',
    pitch: 'The ability to turn wine back into water',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 17,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Pet Tricks',
    pitch: 'Teaching your goldfish to fetch',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 18,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Absurd Dating Apps',
    pitch: 'Tinder for Tacos: Find your perfect crunch',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 19,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unconventional Theme Parks',
    pitch: 'Introvert Island: No Rides, Just Books',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 20,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unfortunate Children’s Book Titles',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Where’s Waldo: Quarantine Edition',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 21,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Exercise Programs',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Couch Potato Pilates',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 22,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unusual College Courses',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'The Philosophy of Memes',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 23,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Absurd Job Interview Questions',
    pitch: 'If you were a tree, how would you do this job?',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 24,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Sports',
    pitch: 'Competitive Napping',
    description: ' ',
    imagePrompt: ' ',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 25,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unrealistic Video Games',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Laundry Simulator 3000',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 26,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unfortunate Perfume Names',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Eau de Desperation',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 27,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Celebrity Endorsements',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Stephen Hawking for Skateboards',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 28,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Absurd Product Ideas for Vampires',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'Sunscreen SPF 0',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 29,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Places for a First Date',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'The DMV',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 30,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unfortunate Food Truck Concepts',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'The Broccoli Bar',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
  {
    id: 31,
    createdAt: new Date(),
    updatedAt: null,
    title: 'Unlikely Reality TV Challenges',
    description: ' ',
    imagePrompt: ' ',
    pitch: 'The Great American Tax Filing Race',
    designer: null,
    flavorText: null,
    highlightImage: null,
    PitchType: PitchType.BRAINSTORM,
    isMature: false,
    isPublic: true,
    userId: 1,
    artImageId: null,
    examples: null
  },
]
