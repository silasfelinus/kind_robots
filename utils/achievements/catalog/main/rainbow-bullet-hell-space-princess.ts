// /utils/achievements/catalog/main/rainbow-bullet-hell-space-princess.ts
//
// Rainbow Bullet Hell Space Princess (/play/rainbow-bullet-hell-space-princess).
// The game queues each key as it happens (utils/arcade/games/rainbowAchievements.ts)
// and the cabinet awards it through arcadeStore.awardFeats. Keys that match a
// mastery goal or ending part are backfilled for players who already hold it.

import type { GameAchievementDef } from '../../gameAchievements'

const GAME = 'rainbow-bullet-hell-space-princess'
const STYLE =
  'C.A.T.S. starfighter princesses with their cat co-pilots in a neon rainbow ocean-space, glittering bullet-hell patterns of pink, teal and gold, chunky pixel-art shoot-em-up energy rendered as a lush painted illustration, centered emblem composition, every surface bare and unmarked.'

export const RAINBOW_BULLET_HELL_SPACE_PRINCESS_ACHIEVEMENTS: GameAchievementDef[] =
  [
    {
      game: GAME,
      key: 'first-light',
      tier: 1,
      label: 'First Light',
      message: 'Pinkwake Estuary is clear. The C.A.T.S. are airborne.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, clear Act I, Pinkwake Estuary.',
      subtleHint: 'Hold fire, hold focus, and mind the pink tide.',
      icon: 'kind-icon:sun',
      rule: { kind: 'event' },
      artPrompt: `A princess starfighter pilot with a ginger tabby co-pilot bursts out of a pink estuary dawn, the first sunrise of the campaign glowing behind her as a defeated estuary boss sinks in sparkling foam below. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'gold-wing',
      tier: 2,
      label: 'Gold Wing',
      message: 'An entire Act without a single hit. Gold medal.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, clear any Act without taking a hit.',
      subtleHint: 'Focus shrinks your heart. So does patience.',
      icon: 'kind-icon:star',
      rule: { kind: 'event' },
      artPrompt: `A gleaming gold-winged starfighter threads untouched through a dense spiral of rainbow bullets, a golden medal ribbon trailing from its tail fin and a calm cat co-pilot giving a thumbs-up paw from the cockpit. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'the-end',
      tier: 2,
      label: 'The End',
      message: 'Through the Eclipse Crown and out the other side.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, fly the whole campaign through the Eclipse Crown to THE END.',
      subtleHint: 'Eight Acts, nine bosses, one Crown.',
      icon: 'kind-icon:crown',
      rule: { kind: 'event' },
      artPrompt: `Four princess starfighters fly in formation away from a vast cracked eclipse crown floating over a glittering ocean horizon, credits-style starlight rolling across the sky as their cat co-pilots curl up asleep in the cockpits. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'guardian-breaker',
      tier: 3,
      label: 'Guardian Breaker',
      message: 'All eight Act guardians down in one flight.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, defeat all eight Act guardians in a single flight.',
      subtleHint: 'A guardian that escapes does not count.',
      icon: 'kind-icon:swords',
      rule: { kind: 'event' },
      artPrompt: `Eight shattered guardian masks of coral, glass, moonjelly and brass orbit a single triumphant princess starfighter, each mask cracked and drifting in a ring of rainbow sparks against a deep violet sea of stars. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'no-one-left',
      tier: 3,
      label: 'No One Left Behind',
      message: 'Every rescue, every captive, one flight.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, make every rescue in one flight, every palace captive included.',
      subtleHint: 'Station, courier, depot, relay, navigator, and the palace.',
      icon: 'kind-icon:hand-heart',
      rule: { kind: 'event' },
      artPrompt: `A princess starfighter tows a glowing chain of rescue pods out of a collapsing undersea palace, rescued sea creatures, pilots and a navigator waving from the pod windows while a fluffy Maine Coon co-pilot counts heads. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'every-ending',
      tier: 3,
      label: 'Every Ending',
      message: 'Restored, evacuated and severed. You have seen them all.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, see all three endings of the final choice.',
      subtleHint: 'The Crown asks one question. Answer it three ways.',
      icon: 'kind-icon:git-branch',
      rule: { kind: 'event' },
      artPrompt: `A triptych of the same eclipse crown over the ocean: one panel glowing awake and gentle, one empty with rescue pods streaming away, one cut loose with dark prism shards drifting, a princess pilot silhouetted in each. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'ace-of-eclipse',
      tier: 3,
      label: 'Ace of the Eclipse',
      message: 'THE END on Ace. The Motherland has no answer for you.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, reach THE END at Ace difficulty.',
      subtleHint: 'Cadet, Pilot, Ace. Only one counts here.',
      icon: 'kind-icon:trophy',
      rule: { kind: 'event' },
      artPrompt: `A battle-scarred ace princess starfighter hovers before a dimmed eclipse crown inside a storm of impossible bullet patterns, an ace insignia of crossed lightning bolts glowing on her wing and a sphynx co-pilot in a tiny leather jacket grinning. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'ending-restore',
      tier: 2,
      label: 'The Crown Wakes',
      message: 'You chose to restore the Crown. It woke, and it asked first.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, choose to restore the Eclipse Crown at the final choice.',
      subtleHint: 'Mend what the empire broke.',
      icon: 'kind-icon:sparkles',
      rule: { kind: 'event' },
      artPrompt: `The eclipse crown floats above a calm rainbow ocean, its facets lighting up one by one in soft gold as a princess starfighter hovers respectfully below and the wildlife fleet of glowing whales and moonjellies circles in peace. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'ending-evacuate',
      tier: 2,
      label: 'Everyone Out',
      message: 'You chose to evacuate. Every pod made it to open water.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, choose to evacuate at the final choice.',
      subtleHint: 'Sometimes the bravest move is the exit.',
      icon: 'kind-icon:rocket',
      rule: { kind: 'event' },
      artPrompt: `Hundreds of glowing rescue pods stream outward from a sleeping eclipse crown like a sunrise of lanterns over the sea, four princess starfighters flying escort at the edges and cat co-pilots pressing paws to the canopy glass. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'ending-sever',
      tier: 2,
      label: 'Cut Loose',
      message: 'You chose to sever the Crown. No one holds this Ocean now.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, choose to sever the Eclipse Crown at the final choice.',
      subtleHint: 'Some leashes are only good cut.',
      icon: 'kind-icon:scissors',
      rule: { kind: 'event' },
      artPrompt: `A princess starfighter slices through glowing control tethers binding an eclipse crown to the ocean floor, prism shards drifting dark around it as freed sea creatures scatter into open water in every direction. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'rebel-road',
      tier: 1,
      label: 'Rebel Road',
      message: 'At the memorial, the crew turned on the empire.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, fly the upper lane at the Act V memorial to turn on the empire.',
      subtleHint: 'Where the crew flies at the memorial is its answer.',
      icon: 'kind-icon:rebel',
      rule: { kind: 'event' },
      artPrompt: `Four princess starfighters peel upward away from a Motherland battle fleet above a quiet sea memorial of drifting wreckage, their wing colors flipped to rebel rainbow as a torn imperial banner sinks below. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'loyal-road',
      tier: 1,
      label: 'Loyal Road',
      message: 'At the memorial, the crew stayed the course. Orders kept.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, fly the lower lane at the Act V memorial to stay the course.',
      subtleHint: 'Where the crew flies at the memorial is its answer.',
      icon: 'kind-icon:flag',
      rule: { kind: 'event' },
      artPrompt: `Four princess starfighters hold a tight disciplined formation beneath a towering Motherland flagship over a solemn sea memorial, salute lights blinking on their wings while their cat co-pilots sit very straight. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'vault-run',
      tier: 1,
      label: 'Into the Vault',
      message: 'You took the salvage route through the trench.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, take the salvage vault route at the Act III trench fork.',
      subtleHint: 'At the fork, the crew follows where you fly.',
      icon: 'kind-icon:treasure',
      rule: { kind: 'event' },
      artPrompt: `A princess starfighter dives into a glowing deep-sea trench vault stacked with sunken treasure crates and salvage, golden light spilling across her canopy while a Siamese co-pilot navigates by whisker. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'kitty-power',
      tier: 1,
      label: 'Princess Kitty Power',
      message: 'Your first super. The co-pilot leapt in.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, charge to 100% and fire a super.',
      subtleHint: 'Fill the meter, then press B.',
      icon: 'kind-icon:cat',
      rule: { kind: 'event' },
      artPrompt: `A giant glowing spectral cat leaps from a princess starfighter cockpit claws first, wiping a whole screen of rainbow bullets away in a burst of sparkles and stars as the pilot cheers. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'full-squadron',
      tier: 2,
      label: 'Full Squadron',
      message: 'Four pilots, one Act, nobody left on the couch.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, clear an Act with four local pilots.',
      subtleHint: 'Bring three friends and three more cats.',
      icon: 'kind-icon:users',
      rule: { kind: 'event' },
      artPrompt: `Four distinct princess starfighters in pink, blue, gold and lilac fly wingtip to wingtip through a rainbow bullet storm, each cockpit shared with a different cat co-pilot, a ginger tabby, a Siamese, a Maine Coon and a sphynx. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'no-continue',
      tier: 3,
      label: 'Unbroken Flight',
      message: 'THE END with a silver medal or better on every Act.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, reach THE END with no continue spent in any Act.',
      subtleHint: 'Silver means no continues. Nine of them.',
      icon: 'kind-icon:path',
      rule: { kind: 'event' },
      artPrompt: `A single unbroken rainbow contrail loops across all nine Acts of an ocean-space map, from a pink estuary to an eclipse palace, ending at a princess starfighter crowned with a ring of nine silver medals. ${STYLE}`,
    },
    {
      game: GAME,
      key: 'all-gold',
      tier: 3,
      label: 'Pure Gold',
      message: 'Gold on all nine Acts. Not one hit, start to finish.',
      tooltip:
        'In Rainbow Bullet Hell Space Princess, earn a gold medal on all nine Acts in one flight.',
      subtleHint: 'Nine Acts. Zero hits.',
      icon: 'kind-icon:gem',
      rule: { kind: 'event' },
      artPrompt: `A radiant all-gold princess starfighter sits on a pedestal of nine stacked gold medals above a shimmering ocean, rainbow bullets frozen harmlessly in the air around it and a proud cat co-pilot wearing a tiny gold crown. ${STYLE}`,
    },
  ]
