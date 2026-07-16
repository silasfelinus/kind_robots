// utils/rulerHooked/content.ts
//
// The bundled, read-only game content for the PoC (data-model.md §6). Declarative
// data, not code: adding an arc/card/region is editing this file, never the engine
// (decks.md §8). Kept as a typed TS module (rather than @nuxt/content markdown) so
// it type-checks with the engine and loads with zero I/O for the offline guarantee.
//
// Grounds in the merged specs' worked examples: the warlock/druid north-woods
// choice (compositing.md §6, decks.md §2) and the heir-elopes arc (decks.md §4.2).

import type { ContentBundle } from '~/types/ruler-hooked'

export const RULER_HOOKED_CONTENT: ContentBundle = {
  contentVersion: '2026.07-poc',

  regions: {
    regions: {
      sky: { z: 0, states: ['open'], times: ['day', 'night', 'golden'] },
      far_shore: {
        z: 1,
        driver: { slider: 'nature', ramp: ['industrial', 'farmed', 'pristine'] },
        states: ['pristine', 'farmed', 'industrial'],
        times: ['day', 'night'],
      },
      treeline: {
        z: 2,
        driver: { slider: 'nature', ramp: ['overbuilt', 'logged', 'tended', 'wild'] },
        states: ['wild', 'tended', 'logged', 'overbuilt'],
        times: ['day', 'night', 'golden'],
      },
      village_edge: {
        z: 3,
        driver: { slider: 'prosperity', ramp: ['hamlet', 'township', 'boomtown'] },
        states: ['hamlet', 'township', 'boomtown'],
        times: ['day', 'night'],
      },
      castle_grounds: {
        z: 4,
        driver: { slider: 'treasury', ramp: ['humble', 'flourishing', 'gaudy'] },
        states: ['humble', 'flourishing', 'gaudy'],
        times: ['day', 'night'],
      },
      lake: { z: 5, states: ['clear'], times: ['day', 'night'] },
      near_bank: { z: 6, states: ['grassy'] },
      ruler: { z: 7, states: ['fishing'] },
    },
  },

  characters: [
    { slug: 'warlock-vex', name: 'Vex', honorific: 'the Developer', alignment: 'comically-evil',
      role: 'land developer', drive: 'progress at any cost', quirks: 'weirdly reasonable pitch' },
    { slug: 'druid-sela', name: 'Sela', honorific: 'the Keeper', alignment: 'earnest-good',
      role: 'druid preservationist', drive: 'protect the wild', quirks: 'a bit of a zealot' },
    { slug: 'heir-robin', name: 'Robin', honorific: 'the Heir', alignment: 'sweet-rebel',
      role: 'the ruler’s child', drive: 'marry for love', quirks: 'sneaks out at dawn' },
    { slug: 'sweetheart-ash', name: 'Ash', honorific: 'the Sweetheart', alignment: 'nervous-kind',
      role: 'a commoner angler', drive: 'be worthy of Robin', quirks: 'talks to the fish' },
  ],

  rewards: [
    { slug: 'druid-charm', name: 'Druid’s Charm', rewardType: 'SKILL', rarity: 'UNCOMMON',
      effect: 'The lake teems; fishing yields improve while the wild thrives.' },
    { slug: 'gilded-lure', name: 'Gilded Lure', rewardType: 'ITEM', rarity: 'RARE',
      effect: 'Unlocks the legendary-fish table at the far shore.' },
    { slug: 'buildpermit-scroll', name: 'Building Permit', rewardType: 'ITEM', rarity: 'COMMON',
      effect: 'Vex breaks ground faster; development choices land harder.' },
  ],

  decks: [
    {
      id: 'kingdom-core',
      title: 'Kingdom Interruptions',
      description: 'The everyday decisions of a monarch who would rather fish.',
      cards: [
        {
          id: 'warlock-druid-north',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 3,
          once: true,
          characters: ['warlock-vex', 'druid-sela'],
          title: 'The North Woods Question',
          body: 'Vex unrolls blueprints across your tackle box. Across the clearing, Sela just waits, watering can in hand.',
          art: 'card-warlock-druid-north',
          trigger: { minTurn: 2, forbids: { flags: ['northWoodsSettled'] } },
          choices: [
            {
              id: 'develop',
              text: 'Let Vex build. Progress!',
              effects: {
                sliders: { nature: -25, prosperity: +15, treasury: +8 },
                regionOverride: { far_shore: 'industrial' },
                flags: { set: ['northWoodsSettled', 'metWarlock'] },
                counters: { warlockFavors: +1 },
                grant: [{ reward: 'buildpermit-scroll' }],
              },
              result: 'Vex cackles and breaks ground before you finish your sentence.',
            },
            {
              id: 'preserve',
              text: 'The druids keep it. Let it grow.',
              effects: {
                sliders: { nature: +18, prosperity: -6, joy: +5 },
                regionOverride: { far_shore: 'pristine' },
                flags: { set: ['northWoodsSettled', 'metDruids'] },
                counters: { druidFavors: +1 },
                grant: [{ reward: 'druid-charm' }],
              },
              result: 'Sela plants a grove in your honor. The frogs approve.',
            },
            {
              id: 'defer',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -3 } },
              requeue: true,
              result: 'They both sigh and wander off. For now.',
            },
          ],
        },
        {
          id: 'harvest-festival',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          title: 'The Harvest Festival',
          body: 'The village wants to throw a festival at your expense.',
          choices: [
            { id: 'fund', text: 'Fund it grandly.', effects: { sliders: { joy: +8, treasury: -6 }, counters: { festivals: +1 } }, result: 'Bunting everywhere. Someone gifts you a lure.' },
            { id: 'modest', text: 'Keep it modest.', effects: { sliders: { joy: +2 } }, result: 'A pleasant, forgettable afternoon.' },
            { id: 'skip', text: 'Not now — fishing.', effects: {}, requeue: true, result: 'The village shrugs and waits.' },
          ],
        },
        {
          id: 'rival-angler',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          title: 'A Rival Angler',
          body: 'A boastful noble challenges you to a catch-off.',
          choices: [
            { id: 'accept', text: 'Accept. Obviously.', effects: { counters: { fishCaught: +2 }, sliders: { joy: +4 } }, result: 'You win by a whisker. As kings do.' },
            { id: 'decline', text: 'Rulers don’t compete. (You’re nervous.)', effects: { sliders: { order: +2 } }, result: 'Dignity intact, ego bruised.' },
          ],
        },
      ],
    },
  ],

  arcs: [
    {
      id: 'child-elopes',
      title: 'The Heir’s Secret Sweetheart',
      characters: ['heir-robin', 'sweetheart-ash'],
      start: { trigger: { minTurn: 4, chance: 0.9 } },
      steps: [
        {
          id: 'elope-1',
          kind: 'arc-step',
          characters: ['heir-robin'],
          title: 'A Note in a Fish',
          body: 'Robin has been sneaking out at dawn. A note, wrapped around a trout, says they mean to elope with a commoner angler named Ash.',
          choices: [
            { id: 'bless', text: 'Bless the match.', effects: { arc: { advance: 'elope-blessing' }, flags: { set: ['blessedMatch'] }, sliders: { joy: +6 } }, result: 'You wink. Robin beams.' },
            { id: 'forbid', text: 'Forbid it — think of the realm!', effects: { arc: { advance: 'elope-defiance' }, sliders: { joy: -8, order: +5 } }, result: 'Robin’s door slams. The realm is very orderly and very sad.' },
          ],
        },
        {
          id: 'elope-blessing',
          kind: 'arc-step',
          characters: ['heir-robin', 'sweetheart-ash'],
          title: 'A Lakeside Wedding',
          body: 'Ash asks, trembling, to fish beside you as family.',
          choices: [
            { id: 'welcome', text: 'Hand Ash a rod. Welcome home.', effects: { arc: { complete: 'child-elopes' }, sliders: { joy: +10 }, counters: { fishCaught: +1 } }, result: 'Three lines in the water. The best kind of court.' },
          ],
        },
        {
          id: 'elope-defiance',
          kind: 'arc-step',
          characters: ['heir-robin'],
          title: 'The Empty Chair',
          body: 'Robin left anyway, at dawn, with the tide.',
          choices: [
            { id: 'relent', text: 'Send the royal boat to bring them home — with a blessing.', effects: { arc: { complete: 'child-elopes' }, sliders: { joy: +6, order: -3 } }, result: 'They return, married, laughing. You pretend you planned it.' },
            { id: 'stew', text: 'Let them go. Fish alone.', effects: { arc: { complete: 'child-elopes' }, sliders: { joy: -4 } }, result: 'The lake is quiet. Too quiet.' },
          ],
        },
      ],
    },
  ],

  endings: [
    {
      outcomeKey: 'druid-utopia',
      victoryType: 'VICTORY',
      title: 'The Angler’s Grove',
      body: 'Your kingdom is a garden. You have caught every fish. Twice.',
      trigger: { requires: { sliders: { nature: { gte: 80 }, joy: { gte: 65 } } } },
    },
    {
      outcomeKey: 'warlock-metropolis',
      victoryType: 'MIXED',
      title: 'Boomtown by the Lake',
      body: 'The skyline is impressive. The fish are… fewer. But impressive.',
      trigger: { requires: { sliders: { prosperity: { gte: 80 } } } },
    },
  ],
}
