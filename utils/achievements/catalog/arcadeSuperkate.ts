import type { GameAchievementDef } from '../gameAchievements'

export const SPECTRUM_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'superkate-spectrum',
    key: 'rainbow-rescue',
    tier: 1,
    label: 'The Colors Are Free',
    message:
      'Superkate dropped five stranded bubbles and brought their colors home!',
    tooltip: 'Drop at least five unanchored bubbles in one Spectrum match.',
    subtleHint:
      'Free a cluster by removing the color holding it to the ceiling.',
    icon: 'kind-icon:rainbow',
    rule: { kind: 'mastery', id: 'rainbow-rescue' },
    artPrompt:
      'A gleaming rainbow hairbrush beside five translucent glass color bubbles tumbling safely onto an iridescent salon floor, a smiling tiny cat-eared robot applauds. Bold expressive ink and premium western cartoon cel painting. Square achievement badge, no text.',
  },
  {
    game: 'superkate-spectrum',
    key: 'color-alchemist',
    tier: 2,
    label: 'Color Alchemist',
    message:
      'A six-bubble color cascade! Superkate could teach the Prism Sorter a few things.',
    tooltip: 'Pop six matching color bubbles in a single shot.',
    subtleHint: 'One precision shot can connect a much larger family.',
    icon: 'kind-icon:flask',
    rule: { kind: 'mastery', id: 'color-alchemist' },
    artPrompt:
      'Six iridescent transparent magenta and cyan glass bubbles bursting into matching geometric stars beside a sparkling stylist mixing bowl, vivid palette of gold and violet, crisp western-animation badge illustration, no writing.',
  },
  {
    game: 'superkate-spectrum',
    key: 'true-spectrum',
    tier: 3,
    label: 'Every Shade Belongs',
    message:
      'Superkate restored the six districts and helped Kind Robots City reclaim every color.',
    tooltip: 'Complete Story Stage 30 of Superkate Spectrum.',
    subtleHint: 'The Prism Sorter has one more story to hear.',
    icon: 'kind-icon:crown',
    rule: { kind: 'mastery', id: 'true-spectrum' },
    artPrompt:
      'A rainbow-haired adult stylist with violet and teal cat-eye glasses stands on the balcony of a glowing futuristic city, surrounded by diverse cheerful citizens and helpful robots choosing their own distinct colors. Bold premium Saturday morning western cartoon badge, no letters.',
  },
]
