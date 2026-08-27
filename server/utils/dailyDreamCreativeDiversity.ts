import type { DailyDreamBlueprint } from './dailyDreamFacetBlueprint'

// The legacy Facet-engine endpoint still exists beside the canonical Conductor
// Daily Dream pipeline. Keep it from collapsing every Facet combination into the
// same pitch skeleton and generic cinematic illustration language.
const STORY_ENGINES = [
  'KINETIC',
  'DISCOVERY',
  'RELATIONSHIP',
  'CAPER',
  'SURVIVAL',
  'MYTHIC',
  'COMPETITION',
  'JOURNEY',
] as const

const VISUAL_MEDIA = [
  'bold four-color superhero-comic rendering with muscular ink contours, saturated cel color, halftone texture, and dramatic foreshortening',
  'charcoal-and-chalk cosmic-horror drawing on rough paper, crushed blacks, pale luminous accents, smeared edges, and unsettling changes of scale',
  'luminous gouache storybook painting with matte pigment, simplified confident shapes, layered brush texture, and soft edge variation',
  'tactile stop-motion miniature aesthetic with sculpted clay and felt surfaces, handmade imperfections, practical miniature lighting, and shallow depth of field',
  'high-contrast risograph aesthetic with limited spot-color layers, coarse paper grain, slight registration offsets, and bold graphic silhouettes',
  'low-poly 3D diorama with faceted geometry, toy-scale materials, crisp ambient occlusion, clean volumetric lighting, and deliberately simplified forms',
  'cinematic photorealism with natural lens behavior, physically believable materials, volumetric atmosphere, restrained color grading, and fine environmental detail',
  'stained-glass mosaic aesthetic with strong leaded contours, jewel-tone translucent panes, fractured colored light, and geometric shape language',
  'watercolor-and-ink naturalist illustration with transparent washes, dry-brush texture, expressive line variation, visible paper tooth, and selective fine detail',
  'layered paper-cut collage with visible paper fibers, simplified cut shapes, physical layer shadows, tactile depth, and hand-cut irregular edges',
] as const

function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function facetValue(
  blueprint: DailyDreamBlueprint,
  taxonomy: string,
): string {
  const facet = blueprint.facets.find((entry) => entry.taxonomy === taxonomy)
  return String(facet?.value || facet?.title || '').trim()
}

function storyPitch(
  blueprint: DailyDreamBlueprint,
  engine: (typeof STORY_ENGINES)[number],
): string {
  const hero = blueprint.characters[0]?.name || 'a stranger'
  const foil = blueprint.characters[1]?.name || 'someone who wants the opposite'
  const reward = blueprint.rewards[0]?.name || 'an impossible gift'
  const secondReward = blueprint.rewards[1]?.name || 'a second impossible tool'
  const firstPlace = blueprint.locations[0]?.name || 'a place that should not exist'
  const secondPlace = blueprint.locations[1]?.name || firstPlace
  const theme = facetValue(blueprint, 'THEME') || 'the world’s central rule'

  switch (engine) {
    case 'KINETIC':
      return `${hero} has one narrowing chance to carry ${reward} through ${firstPlace} while the place changes around them. ${foil} can clear the way, seize the reward, or force the crisis into ${secondPlace}. Every consequence of ${theme} arrives in motion.`
    case 'DISCOVERY':
      return `${hero} discovers ${reward} at ${firstPlace} and tests what it can actually do. Each use exposes a new physical rule, while ${foil} follows a conflicting explanation toward ${secondPlace}. The truth of ${theme} can only be learned by going deeper.`
    case 'RELATIONSHIP':
      return `${hero} and ${foil} need ${reward} for incompatible reasons, and neither can reach ${secondPlace} alone. Their bargain changes as ${secondReward} makes the cost of ${theme} personal. The decisive turn is whether they choose the goal or each other.`
    case 'CAPER':
      return `${hero} plans an audacious theft of ${reward} from ${firstPlace}; ${foil} is the indispensable part of the plan who may also ruin it. The escape route through ${secondPlace} depends on using ${secondReward} at exactly the wrong-looking moment, with ${theme} driving the final reversal.`
    case 'SURVIVAL':
      return `${firstPlace} becomes dangerous in stages, forcing ${hero} and ${foil} toward ${secondPlace}. ${reward} can get one of them through the worst passage, while ${secondReward} changes who counts as safe. ${theme} expresses itself through bodies, terrain, pursuit, weather, hunger, or transformation.`
    case 'MYTHIC':
      return `${reward} awakens at ${firstPlace} and reveals that ${theme} operates at a scale nobody expected. ${hero} must choose whether to use it, destroy it, or carry it to ${secondPlace} before ${foil} makes the choice for them, while the visible consequences grow larger than either of them.`
    case 'COMPETITION':
      return `${firstPlace} hosts a contest whose prize is ${reward}, and ${hero} enters for a reason that clashes with ${foil}. The rules mutate when ${secondReward} appears, turning the final round toward ${secondPlace}. ${theme} reshapes the rivalry with every reversal.`
    case 'JOURNEY':
      return `${hero} must cross from ${firstPlace} to ${secondPlace} carrying ${reward}, with ${foil} joining for a different destination. Each leg reveals a different consequence of ${theme}, and ${secondReward} can bypass one obstacle only by creating another.`
  }
}

function withVisualDirection(prompt: string, direction: string): string {
  return `${direction}; ${prompt}`
}

export function diversifyDailyDreamCreativeDirection(
  blueprint: DailyDreamBlueprint,
  options: { dateKey: string; userId: number },
): DailyDreamBlueprint {
  const storyIndex =
    hashSeed(`${options.dateKey}:${options.userId}:story-engine`) %
    STORY_ENGINES.length
  const visualIndex =
    hashSeed(`${options.dateKey}:${options.userId}:visual-medium`) %
    VISUAL_MEDIA.length
  const engine = STORY_ENGINES[storyIndex]!
  const medium = VISUAL_MEDIA[visualIndex]!
  const facetStyle = facetValue(blueprint, 'STYLE')
  const direction = facetStyle
    ? `${medium}; honor the selected STYLE Facet (${facetStyle}) through shape language, costume, architecture, and detail without replacing the primary medium`
    : medium

  return {
    ...blueprint,
    pitch: storyPitch(blueprint, engine),
    artPrompt: withVisualDirection(blueprint.artPrompt, direction),
    narrator: blueprint.narrator
      ? {
          ...blueprint.narrator,
          artPrompt: withVisualDirection(
            blueprint.narrator.artPrompt,
            direction,
          ),
        }
      : null,
    characters: blueprint.characters.map((character) => ({
      ...character,
      artPrompt: withVisualDirection(character.artPrompt, direction),
    })),
    rewards: blueprint.rewards.map((reward) => ({
      ...reward,
      artPrompt: withVisualDirection(reward.artPrompt, direction),
    })),
  }
}

export const DAILY_DREAM_STORY_ENGINES = STORY_ENGINES
export const DAILY_DREAM_VISUAL_MEDIA = VISUAL_MEDIA
