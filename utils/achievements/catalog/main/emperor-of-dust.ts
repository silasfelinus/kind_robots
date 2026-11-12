// /utils/achievements/catalog/main/emperor-of-dust.ts

import type { GameAchievementDef } from '../../gameAchievements'

export const EMPEROR_OF_DUST_ACHIEVEMENTS: GameAchievementDef[] = [
  // Emperor of Dust (ADMIN-ONLY: /admin/emperor-of-dust, requiredRole ADMIN)
  {
    game: 'emperor-of-dust',
    key: 'orders-carried-out',
    tier: 1,
    label: 'Orders Carried Out',
    message:
      'Your first party rode out from the Tower and came home with good news.',
    tooltip: 'In Emperor of Dust, dispatch a party whose mission succeeds.',
    subtleHint:
      'The right leader, enough Horde, and an approach that suits them.',
    icon: 'kind-icon:flag',
    rule: { kind: 'event' },
    artPrompt:
      'A dusty expedition of anthropomorphic animal folk, a lean jackal scout, a broad tortoise engineer and a sharp-eyed otter captain, rides back toward a brass-banded Emperor’s Tower at dusk waving a ragged victory banner, as cheering Horde troops of many species spill out of the gate to greet them. Ash, brass and the last hundred days palette: ash-gray skies, brass lanterns, salvage and patched leather. Expressive animal folk, illustrated character design, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'emperor-of-dust',
    key: 'day-well-ruled',
    tier: 2,
    label: 'A Day Well Ruled',
    message:
      'Aqueduct, toll road and Mirefen lanterns: every Day 1 petition ended in success.',
    tooltip:
      'In Emperor of Dust, succeed at all three Day 1 incidents in one run: the Broken Aqueduct, the Painted Wagons at the Toll and the Lanterns on the Mirefen Road.',
    subtleHint: 'Three petitions, three deadlines, and one Horde to share.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt:
      'From the balcony of the Emperor’s Tower at nightfall, Young Komodo, a lanky young komodo dragon adviser in a patched brass-buttoned coat, sweeps a clawed hand over the wasteland below: clear water rushing again through a mended aqueduct toward Hollow Bell, painted wagons rolling freely through an open toll gate, and a line of lanterns moving safely along the Mirefen road. Ash, brass and the last hundred days palette, ragged banners, brass lanterns, expressive animal folk, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'emperor-of-dust',
    key: 'merciful-court',
    tier: 3,
    label: 'The Merciful Court',
    message:
      'You repaired, parleyed and escorted, and every kindness held. The wasteland still has a chance.',
    tooltip:
      'In Emperor of Dust, succeed at all three Day 1 incidents in one run using only the kind orders: repair the channel, offer safe passage and escort the refugees.',
    subtleHint: 'The gentlest orders are also the hardest rolls.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt:
      'Dawn beneath the Emperor’s Tower: swamp refugees carrying paper lanterns, punk hyena raiders beside their painted wagons and dusty townsfolk of Hollow Bell, all anthropomorphic animal folk, gather peacefully around a newly repaired stone water channel, sharing bread and cups of clear water, while a single brass lantern is held high at the center like a beacon. Ash, brass and the last hundred days palette warming to gold, ragged banners, patched leather, expressive animal folk, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.',
  },
]
