import { useRandomAnimal } from './randomAnimal'

export function useRandomSkill() {
  const animalGenerator = useRandomAnimal() // Get access to randomAnimal()

  const skills = [
    'Expert swordsmanship',
    'Master of stealth',
    'Proficient in alchemy',
    'World-class knot tying',
    'Lightning-fast reflexes',
    'Top-tier karaoke performance',
    'Crafting magical artifacts',
    'Haggling with market vendors',
    'Dodging responsibility gracefully',
    'Cooking gourmet meals with limited ingredients',
    'Building shelters from almost nothing',
    'Interpreting ancient texts',
    'Whistling symphonies',
    'Deciphering cryptic riddles',
    'Taming wild beasts',
    'Making the perfect cup of tea',
    'Juggling flaming torches',
    'Memorizing useless trivia',
    'Convincing anyone of anything (almost)',
    'Navigating labyrinths blindfolded',
    'Fletching arrows with uncanny precision',
    'Painting portraits that come to life',
    'Whittling figurines out of stone',
    'Carving elaborate ice sculptures',
    'Climbing impossible heights',
    'Disabling traps with style',
    'Playing the lute enchantingly',
    'Sewing disguises on the go',
    'Composing impromptu limericks',
    'Summoning tiny whirlwinds',
    'Making one-liners during combat',
    'Puppeteering shadows for storytelling',
    'Brewing untested potions',
    'Repairing ancient machines',
    'Dueling with umbrellas',
    'Catching arrows mid-flight',
    'Training pets to deliver letters',
    'Camouflaging perfectly into surroundings',
    'Commanding respect with a raised eyebrow',
    'Sketching landscapes from memory',
    'Tapping into forgotten languages',
    'Reading lips from across a crowded room',
    'Dancing the tango of deception',
    'Balancing on narrow ledges without flinching',
    'Breathing fire (with practice)',
    'Tracking footsteps across frozen tundras',
    'Inventing new board games on a whim',
    'Making origami masterpieces',
    'Mixing cocktails that mesmerize',
    'Reciting epic poetry at just the right moment',
    'Unleashing war cries that echo for miles',
    'Extracting venom safely',
    'Mapping uncharted territories',
    'Defusing tense situations with humor',
    'Handcrafting intricate jewelry',
    'Throwing knives with pinpoint accuracy',
    'Outrunning predators (or so they say)',
    'Composing haunting melodies',
    'Wrangling angry toddlers',
    'Training animals like a circus master',
    `Riding ${animalGenerator.randomAnimal()} bareback`,
    `Communicating telepathically with ${animalGenerator.randomAnimal()}`,
    `Juggling ${animalGenerator.randomAnimal()} figurines`,
    `Teaching ${animalGenerator.randomAnimal()} tricks`,
    `Breeding ${animalGenerator.randomAnimal()} hybrids`,
  ]

  function randomSkill() {
    return skills[Math.floor(Math.random() * skills.length)]
  }

  return { randomSkill }
}
