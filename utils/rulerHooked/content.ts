// utils/rulerHooked/content.ts
//
// The bundled, read-only game content for the PoC (data-model.md §6). Declarative
// data, not code: adding an arc/card/region is editing this file, never the engine
// (decks.md §8). Kept as a typed TS module (rather than @nuxt/content markdown) so
// it type-checks with the engine and loads with zero I/O for the offline guarantee.
//
// Grounds in the merged specs' worked examples: the warlock/druid north-woods
// choice (compositing.md §6, decks.md §2) and the heir-elopes arc (decks.md §4.2).
//
// CONTENT-DEPTH PASS (ruler-hooked/t-014, 2026-08-16): the original PoC shipped a
// single deck of 3 free-draw cards plus one 3-step arc (6 cards total) — enough to
// prove the loop, but too thin for the brief's "different characters/events appear
// on different runs" promise. This pass adds a second deck (lake-mysteries), two
// more arcs, and a batch of new kingdom-core cards, all through this same data
// path — no engine changes. New characters/rewards follow the existing self-
// authored CharacterRef/RewardRef shape (matching the Character/Reward model field
// names per decks.md §1); the original four characters are reused across several
// of the new cards rather than replaced, per the brief's "reuse existing
// Characters where they fit."

import type { ContentBundle } from '~/types/ruler-hooked'

export const RULER_HOOKED_CONTENT: ContentBundle = {
  contentVersion: '2026.08-content-depth',

  regions: {
    regions: {
      sky: { z: 0, states: ['open'], times: ['day', 'night', 'golden'] },
      far_shore: {
        z: 1,
        driver: {
          slider: 'nature',
          ramp: ['industrial', 'farmed', 'pristine'],
        },
        states: ['pristine', 'farmed', 'industrial'],
        times: ['day', 'night'],
      },
      treeline: {
        z: 2,
        driver: {
          slider: 'nature',
          ramp: ['overbuilt', 'logged', 'tended', 'wild'],
        },
        states: ['wild', 'tended', 'logged', 'overbuilt'],
        times: ['day', 'night', 'golden'],
      },
      village_edge: {
        z: 3,
        driver: {
          slider: 'prosperity',
          ramp: ['hamlet', 'township', 'boomtown'],
        },
        states: ['hamlet', 'township', 'boomtown'],
        times: ['day', 'night'],
      },
      castle_grounds: {
        z: 4,
        driver: {
          slider: 'treasury',
          ramp: ['humble', 'flourishing', 'gaudy'],
        },
        states: ['humble', 'flourishing', 'gaudy'],
        times: ['day', 'night'],
      },
      lake: { z: 5, states: ['clear'], times: ['day', 'night'] },
      near_bank: { z: 6, states: ['grassy'] },
      ruler: { z: 7, states: ['fishing'] },
    },
  },

  characters: [
    {
      slug: 'warlock-vex',
      name: 'Vex',
      honorific: 'the Developer',
      alignment: 'comically-evil',
      role: 'land developer',
      drive: 'progress at any cost',
      quirks: 'weirdly reasonable pitch',
    },
    {
      slug: 'druid-sela',
      name: 'Sela',
      honorific: 'the Keeper',
      alignment: 'earnest-good',
      role: 'druid preservationist',
      drive: 'protect the wild',
      quirks: 'a bit of a zealot',
    },
    {
      slug: 'heir-robin',
      name: 'Robin',
      honorific: 'the Heir',
      alignment: 'sweet-rebel',
      role: 'the ruler’s child',
      drive: 'marry for love',
      quirks: 'sneaks out at dawn',
    },
    {
      slug: 'sweetheart-ash',
      name: 'Ash',
      honorific: 'the Sweetheart',
      alignment: 'nervous-kind',
      role: 'a commoner angler',
      drive: 'be worthy of Robin',
      quirks: 'talks to the fish',
    },
    {
      slug: 'envoy-thistle',
      name: 'Thistle',
      honorific: 'the Envoy',
      alignment: 'imperious-diplomat',
      role: 'foreign trade envoy',
      drive: 'a treaty with your name on it',
      quirks: 'counts under her breath when annoyed',
    },
    {
      slug: 'taxman-gristle',
      name: 'Gristle',
      honorific: 'the Assessor',
      alignment: 'joyless-precise',
      role: 'royal tax collector',
      drive: 'a ledger that balances',
      quirks: 'sighs audibly at fun',
    },
    {
      slug: 'captain-cordelia',
      name: 'Cordelia',
      honorific: 'the Captain',
      alignment: 'stern-loyal',
      role: 'castle guard captain',
      drive: 'a kingdom that can defend itself',
      quirks: 'polishes her pauldron when nervous',
    },
    {
      slug: 'bard-fen',
      name: 'Fen',
      honorific: 'the Bard',
      alignment: 'gleeful-chaotic',
      role: 'traveling bard',
      drive: 'a ballad worth singing',
      quirks: 'narrates your life in rhyme, uninvited',
    },
    {
      slug: 'smuggler-brack',
      name: 'Brack',
      honorific: 'the Smuggler',
      alignment: 'charming-rogue',
      role: 'lake-side smuggler',
      drive: 'one last score, promise',
      quirks: 'always squinting at the horizon',
    },
    {
      slug: 'witch-mossy',
      name: 'Mossy',
      honorific: 'the Bog Witch',
      alignment: 'chaotic-generous',
      role: 'swamp witch',
      drive: 'a good trade and a better story',
      quirks: 'answers questions you didn’t ask',
    },
    {
      slug: 'lake-spirit-nix',
      name: 'Nix',
      honorific: 'of the Deep',
      alignment: 'ancient-neutral',
      role: 'lake spirit',
      drive: 'to be remembered correctly',
      quirks: 'speaks only in questions',
    },
  ],

  rewards: [
    {
      slug: 'druid-charm',
      name: 'Druid’s Charm',
      rewardType: 'SKILL',
      rarity: 'UNCOMMON',
      effect: 'The lake teems; fishing yields improve while the wild thrives.',
    },
    {
      slug: 'gilded-lure',
      name: 'Gilded Lure',
      rewardType: 'ITEM',
      rarity: 'RARE',
      effect: 'Unlocks the legendary-fish table at the far shore.',
    },
    {
      slug: 'buildpermit-scroll',
      name: 'Building Permit',
      rewardType: 'ITEM',
      rarity: 'COMMON',
      effect: 'Vex breaks ground faster; development choices land harder.',
    },
    {
      slug: 'treaty-seal',
      name: 'Thistlewood Seal',
      rewardType: 'ITEM',
      rarity: 'RARE',
      effect:
        'A signed trade accord. Prosperity and treasury choices land harder.',
    },
    {
      slug: 'smugglers-map',
      name: 'Smuggler’s Chart',
      rewardType: 'ITEM',
      rarity: 'UNCOMMON',
      effect:
        'Marks the lake’s hidden coves; unlocks the sunken-cache choices.',
    },
    {
      slug: 'mossy-hex',
      name: 'Mossy’s Hex',
      rewardType: 'MAGIC',
      rarity: 'RARE',
      effect: 'The bog answers when called; nature choices land harder.',
    },
    {
      slug: 'captains-pin',
      name: 'Captain’s Pin',
      rewardType: 'ITEM',
      rarity: 'UNCOMMON',
      effect: 'Cordelia’s trust, worn openly; order choices land harder.',
    },
    {
      slug: 'bards-ballad',
      name: 'A Ballad in Your Name',
      rewardType: 'SKILL',
      rarity: 'COMMON',
      effect: 'Fen’s song precedes you; joy choices land harder.',
    },
    {
      slug: 'nix-pearl',
      name: 'Nix’s Pearl',
      rewardType: 'MAGIC',
      rarity: 'LEGENDARY',
      effect:
        'A pearl that remembers the lake before the castle. Rare and strange.',
    },
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
              result:
                'Vex cackles and breaks ground before you finish your sentence.',
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
            {
              id: 'fund',
              text: 'Fund it grandly.',
              effects: {
                sliders: { joy: +8, treasury: -6 },
                counters: { festivals: +1 },
              },
              result: 'Bunting everywhere. Someone gifts you a lure.',
            },
            {
              id: 'modest',
              text: 'Keep it modest.',
              effects: { sliders: { joy: +2 } },
              result: 'A pleasant, forgettable afternoon.',
            },
            {
              id: 'skip',
              text: 'Not now — fishing.',
              effects: {},
              requeue: true,
              result: 'The village shrugs and waits.',
            },
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
            {
              id: 'accept',
              text: 'Accept. Obviously.',
              effects: { counters: { fishCaught: +2 }, sliders: { joy: +4 } },
              result: 'You win by a whisker. As kings do.',
            },
            {
              id: 'decline',
              text: 'Rulers don’t compete. (You’re nervous.)',
              effects: { sliders: { order: +2 } },
              result: 'Dignity intact, ego bruised.',
            },
          ],
        },
        {
          id: 'warlock-return',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['warlock-vex'],
          title: 'Vex’s Second Pitch',
          body: 'Vex is back with a bigger blueprint: a fleet of barges across the whole far shore. “You already said yes once,” he beams.',
          trigger: {
            minTurn: 10,
            requires: { flags: ['metWarlock'] },
            forbids: { flags: ['farShoreFleetSettled'] },
          },
          choices: [
            {
              id: 'expand',
              text: 'Approve the fleet. Go big.',
              effects: {
                sliders: { nature: -15, prosperity: +18, treasury: +10 },
                regionOverride: { far_shore: 'industrial' },
                flags: { set: ['farShoreFleetSettled'] },
                counters: { warlockFavors: +1 },
              },
              result: 'The lake gains a skyline. Vex gains a yacht.',
            },
            {
              id: 'cap-it',
              text: 'One barge, not a fleet. Compromise.',
              effects: {
                sliders: { nature: -4, prosperity: +6, treasury: +3 },
                flags: { set: ['farShoreFleetSettled'] },
              },
              result: 'Vex grumbles, then shrugs. “Fine. One barge. For now.”',
            },
            {
              id: 'defer-vex',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Vex leaves the blueprints. They get a little wet.',
            },
          ],
        },
        {
          id: 'druid-sanctuary',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['druid-sela'],
          title: 'Sela’s Sanctuary Request',
          body: 'Sela asks you to declare the treeline a permanent sanctuary — no more building, ever, anywhere near it.',
          trigger: {
            minTurn: 10,
            requires: { flags: ['metDruids'] },
            forbids: { flags: ['treelineSanctuarySettled'] },
          },
          choices: [
            {
              id: 'grant-sanctuary',
              text: 'Grant it. Forever, on your word.',
              effects: {
                sliders: { nature: +20, prosperity: -8, joy: +4 },
                regionOverride: { treeline: 'wild' },
                flags: { set: ['treelineSanctuarySettled'] },
                counters: { druidFavors: +1 },
              },
              result:
                'Sela cries actual tears. The trees, unbothered, keep being trees.',
            },
            {
              id: 'partial-sanctuary',
              text: 'Protect half of it. Meet in the middle.',
              effects: {
                sliders: { nature: +8, prosperity: -2 },
                flags: { set: ['treelineSanctuarySettled'] },
              },
              result: '“Half is not none,” Sela admits, grudgingly satisfied.',
            },
            {
              id: 'defer-sela',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Sela waits by the water, patient as moss.',
            },
          ],
        },
        {
          id: 'tax-season',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          characters: ['taxman-gristle'],
          title: 'Gristle’s Ledger',
          body: 'Gristle the tax assessor lays a ledger across your lap. “The treasury,” he says, “is a feeling, not a number, and I do not like the feeling.”',
          trigger: { minTurn: 3, cooldown: 8 },
          choices: [
            {
              id: 'raise-taxes',
              text: 'Raise the levy.',
              effects: {
                sliders: { treasury: +12, joy: -8 },
                counters: { taxHikes: +1 },
              },
              result: 'Gristle almost smiles. The village does not.',
            },
            {
              id: 'cut-taxes',
              text: 'Cut it instead.',
              effects: { sliders: { treasury: -8, joy: +6 } },
              result:
                'Cheering in the square. Gristle sighs, audibly, from the square.',
            },
            {
              id: 'defer-gristle',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Gristle recalculates, unhappily, from the dock steps.',
            },
          ],
        },
        {
          id: 'guard-captain-wall',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          characters: ['captain-cordelia'],
          title: 'Cordelia Wants a Wall',
          body: 'Captain Cordelia wants a proper wall around the village. “It’s not that I don’t trust the neighbors,” she says. “I don’t trust anyone.”',
          trigger: { minTurn: 5, cooldown: 10 },
          choices: [
            {
              id: 'fortify',
              text: 'Build the wall.',
              effects: {
                sliders: { order: +14, nature: -6, joy: -2 },
                regionOverride: { village_edge: 'township' },
                counters: { cordeliaFavors: +1 },
              },
              result: 'Stone goes up fast under a captain who means it.',
            },
            {
              id: 'open-borders',
              text: 'Leave the gates open.',
              effects: { sliders: { joy: +8, order: -6, prosperity: +4 } },
              result:
                'Cordelia posts extra patrols instead, muttering the whole time.',
            },
            {
              id: 'defer-cordelia',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Cordelia salutes anyway, out of habit, and marches off.',
            },
          ],
        },
        {
          id: 'bard-ballad',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 3,
          characters: ['bard-fen'],
          title: 'Fen’s New Ballad',
          body: 'Fen the bard wants to write a song about your reign. “Working title,” they say, “‘The Ruler Who Would Rather Fish.’”',
          choices: [
            {
              id: 'commission-flattering',
              text: 'Commission a flattering one.',
              effects: {
                sliders: { joy: +6, treasury: -4 },
                grant: [{ reward: 'bards-ballad' }],
              },
              result:
                'The ballad rhymes “crown” with “profound” four separate times.',
            },
            {
              id: 'commission-true',
              text: 'Tell them the true story instead.',
              effects: {
                sliders: { joy: +4, order: -3 },
                counters: { balladsSung: +1 },
              },
              result: 'The true story is mostly about fish. It slaps.',
            },
            {
              id: 'shoo-bard',
              text: 'Not today, Fen.',
              effects: { sliders: { joy: -2, order: +2 } },
              result:
                'Fen writes a sad little verse about being shooed. It also slaps.',
            },
          ],
        },
        {
          id: 'smuggler-dock',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['smuggler-brack'],
          title: 'Brack’s Proposition',
          body: 'A stranger at the castle dock offers to move goods through your harbor, quietly, for a cut. He introduces himself as Brack. This is probably a lie.',
          trigger: { minTurn: 5 },
          choices: [
            {
              id: 'allow-smuggling',
              text: 'Take the cut. Look away.',
              effects: {
                sliders: { treasury: +10, order: -8 },
                flags: { set: ['metSmuggler'] },
                grant: [{ reward: 'smugglers-map' }],
              },
              result:
                'Brack winks and vanishes into the reeds with your blessing.',
            },
            {
              id: 'report-to-cordelia',
              text: 'Report him to Cordelia.',
              effects: {
                sliders: { order: +8, treasury: -2 },
                flags: { set: ['smugglerReported'] },
              },
              result: 'Cordelia is delighted to have someone to arrest.',
            },
            {
              id: 'defer-brack',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Brack shrugs and melts back into the fog.',
            },
          ],
        },
        {
          id: 'duck-census',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 3,
          title: 'The Duck Census',
          body: 'A clerk insists the kingdom needs an official duck census. You are not sure why. Neither is the clerk.',
          choices: [
            {
              id: 'commission-census',
              text: 'Commission the census.',
              effects: {
                sliders: { treasury: -2, joy: +3 },
                counters: { ducksCounted: +12 },
              },
              result: 'Twelve ducks, officially. A thirteenth is disputed.',
            },
            {
              id: 'guess',
              text: 'Just guess a number.',
              effects: { sliders: { joy: +1 } },
              result:
                '“Forty,” you declare. The clerk writes it down, unconvinced.',
            },
            {
              id: 'ignore-census',
              text: 'Absolutely not.',
              effects: {},
              requeue: true,
              result: 'The ducks remain uncounted and unbothered.',
            },
          ],
        },
        {
          id: 'rival-angler-2',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          title: 'The Rival Returns',
          body: 'The boastful noble is back, and this time brought a bigger rod and a smaller sense of dignity.',
          trigger: { requires: { counters: { fishCaught: { gte: 3 } } } },
          choices: [
            {
              id: 'accept-again',
              text: 'Accept. Again. Obviously.',
              effects: { counters: { fishCaught: +3 }, sliders: { joy: +8 } },
              result:
                'A landslide victory. The noble demands a rematch, again.',
            },
            {
              id: 'decline-again',
              text: 'Decline, graciously.',
              effects: { sliders: { order: +4 } },
              result: 'You bow. It is, somehow, more infuriating than winning.',
            },
            {
              id: 'taunt',
              text: 'Taunt them instead.',
              effects: { sliders: { joy: +10, order: -5 } },
              result: 'Undignified. Extremely fun.',
            },
          ],
        },
        {
          id: 'robin-ash-garden',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          characters: ['heir-robin', 'sweetheart-ash'],
          title: 'The Newlyweds’ Garden',
          body: 'Robin and Ash ask for a plot near the lake to grow their own vegetables. “We don’t need much,” Robin says. “Just enough for us. And the fish, maybe.”',
          trigger: { requires: { flags: ['blessedMatch'] } },
          choices: [
            {
              id: 'grant-garden',
              text: 'Give them the best plot.',
              effects: {
                sliders: { nature: +6, joy: +8 },
                flags: { set: ['newlywedsGarden'] },
              },
              result:
                'Robin plants tomatoes badly. Ash plants them well, next to Robin’s, unbothered.',
            },
            {
              id: 'modest-plot',
              text: 'A modest plot will do.',
              effects: { sliders: { joy: +4 } },
              result: 'It is small. It is enough.',
            },
          ],
        },
      ],
    },
    {
      id: 'lake-mysteries',
      title: 'Lake Mysteries',
      description: 'What the water knows, and what it is willing to trade for.',
      cards: [
        {
          id: 'nix-riddle',
          deck: 'lake-mysteries',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['lake-spirit-nix'],
          title: 'A Question from the Deep',
          body: 'The water goes still, then a shape rises — not quite a fish, not quite a person. “What,” Nix asks, “do you actually want?”',
          trigger: {
            minTurn: 7,
            requires: { sliders: { nature: { gte: 20 } } },
          },
          choices: [
            {
              id: 'answer-honestly',
              text: '“To fish. Just to fish.”',
              effects: {
                sliders: { joy: +10, nature: +4 },
                flags: { set: ['nixAnswered'] },
              },
              result:
                'Nix considers this a very good answer and does not say why.',
            },
            {
              id: 'answer-dodge',
              text: '“To rule well, obviously.”',
              effects: {
                sliders: { order: +6, joy: -2 },
                flags: { set: ['nixAnswered'] },
              },
              result:
                'Nix tilts its head, unconvinced, and sinks back down anyway.',
            },
            {
              id: 'defer-nix',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -1 } },
              requeue: true,
              result: 'Nix waits. The deep is not in a hurry.',
            },
          ],
        },
        {
          id: 'sunken-cache',
          deck: 'lake-mysteries',
          kind: 'ambient',
          weight: 2,
          characters: ['smuggler-brack'],
          title: 'Brack’s Sunken Cache',
          body: 'The smuggler’s chart marks a spot in the lake with an X. Of course it does.',
          trigger: { requires: { rewards: ['smugglers-map'] } },
          choices: [
            {
              id: 'dive-for-it',
              text: 'Dive for the cache.',
              effects: {
                sliders: { treasury: +10, nature: -6 },
                counters: { treasuresFound: +1 },
              },
              result:
                'The lakebed gives up a chest, reluctantly, and a little mud.',
            },
            {
              id: 'leave-it',
              text: 'Let the lake keep its secrets.',
              effects: { sliders: { nature: +4, joy: +3 } },
              result: 'Some things are nicer as rumors.',
            },
          ],
        },
        {
          id: 'golden-hour-catch',
          deck: 'lake-mysteries',
          kind: 'ambient',
          weight: 2,
          title: 'The Lake Goes Gold',
          body: 'For a moment the whole lake turns gold, and something enormous and briefly-visible takes your line.',
          choices: [
            {
              id: 'reel-it-in',
              text: 'Reel it in, whatever it is.',
              effects: {
                sliders: { joy: +6 },
                counters: { legendaryCatches: +1 },
              },
              result:
                'It is, in the end, just a very large and very smug fish.',
            },
            {
              id: 'let-it-go',
              text: 'Let it go. Some things stay legends.',
              effects: { sliders: { joy: +3, nature: +2 } },
              result:
                'The lake settles back to ordinary blue, keeping its story.',
            },
          ],
        },
        {
          id: 'nix-warning',
          deck: 'lake-mysteries',
          kind: 'interrupt',
          weight: 3,
          characters: ['lake-spirit-nix'],
          title: 'Nix’s Warning',
          body: 'Nix surfaces again, less patient this time. “The water is thinning,” it says. “Fix it, or fish somewhere else, eventually.”',
          trigger: {
            requires: { sliders: { nature: { lt: 30 } } },
            cooldown: 6,
          },
          choices: [
            {
              id: 'heed-warning',
              text: 'Heed the warning. Course-correct.',
              effects: {
                sliders: { nature: +14, prosperity: -6 },
                flags: { set: ['heededNix'] },
              },
              result:
                'Nix nods, once, and sinks — satisfied, or as close as it gets.',
            },
            {
              id: 'dismiss-warning',
              text: 'It’s a lake. It’ll be fine.',
              effects: { sliders: { nature: -6, order: +3 } },
              result:
                'Nix does not argue. It just stops surfacing for a while.',
            },
            {
              id: 'defer-nix-warning',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -1 } },
              requeue: true,
              result:
                'Nix sinks, unbothered by the delay. The deep keeps its own time.',
            },
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
            {
              id: 'bless',
              text: 'Bless the match.',
              effects: {
                arc: { advance: 'elope-blessing' },
                flags: { set: ['blessedMatch'] },
                sliders: { joy: +6 },
              },
              result: 'You wink. Robin beams.',
            },
            {
              id: 'forbid',
              text: 'Forbid it — think of the realm!',
              effects: {
                arc: { advance: 'elope-defiance' },
                sliders: { joy: -8, order: +5 },
              },
              result:
                'Robin’s door slams. The realm is very orderly and very sad.',
            },
          ],
        },
        {
          id: 'elope-blessing',
          kind: 'arc-step',
          characters: ['heir-robin', 'sweetheart-ash'],
          title: 'A Lakeside Wedding',
          body: 'Ash asks, trembling, to fish beside you as family.',
          choices: [
            {
              id: 'welcome',
              text: 'Hand Ash a rod. Welcome home.',
              effects: {
                arc: { complete: 'child-elopes' },
                sliders: { joy: +10 },
                counters: { fishCaught: +1 },
              },
              result: 'Three lines in the water. The best kind of court.',
            },
          ],
        },
        {
          id: 'elope-defiance',
          kind: 'arc-step',
          characters: ['heir-robin'],
          title: 'The Empty Chair',
          body: 'Robin left anyway, at dawn, with the tide.',
          choices: [
            {
              id: 'relent',
              text: 'Send the royal boat to bring them home — with a blessing.',
              effects: {
                arc: { complete: 'child-elopes' },
                sliders: { joy: +6, order: -3 },
              },
              result:
                'They return, married, laughing. You pretend you planned it.',
            },
            {
              id: 'stew',
              text: 'Let them go. Fish alone.',
              effects: {
                arc: { complete: 'child-elopes' },
                sliders: { joy: -4 },
              },
              result: 'The lake is quiet. Too quiet.',
            },
          ],
        },
      ],
    },
    {
      id: 'envoy-treaty',
      title: 'The Thistlewood Accord',
      characters: ['envoy-thistle', 'taxman-gristle'],
      start: { trigger: { minTurn: 9, chance: 0.6 } },
      steps: [
        {
          id: 'envoy-1',
          kind: 'arc-step',
          characters: ['envoy-thistle', 'taxman-gristle'],
          title: 'An Envoy at the Gate',
          body: 'Thistle arrives with a treaty scroll and a fixed, diplomatic smile. Gristle trails her, muttering about tariffs, already suspicious of the wording.',
          choices: [
            {
              id: 'negotiate-generous',
              text: 'Offer generous terms. Build goodwill.',
              effects: {
                arc: { advance: 'envoy-generous' },
                sliders: { joy: +3 },
              },
              result:
                'Thistle’s smile finally reaches her eyes. Gristle’s does not.',
            },
            {
              id: 'negotiate-tough',
              text: 'Hold firm. Squeeze every clause.',
              effects: {
                arc: { advance: 'envoy-tough' },
                sliders: { order: +3 },
              },
              result: 'Gristle, for once, looks proud of you.',
            },
          ],
        },
        {
          id: 'envoy-generous',
          kind: 'arc-step',
          characters: ['envoy-thistle'],
          title: 'A Generous Accord',
          body: 'Thistle lays out the final terms — favorable to both sides, weighted a hair toward hers. She’s counting under her breath again.',
          choices: [
            {
              id: 'sign-generous',
              text: 'Sign it.',
              effects: {
                arc: { complete: 'envoy-treaty' },
                sliders: { prosperity: +16, treasury: +8, joy: +5 },
                regionOverride: { village_edge: 'township' },
                flags: { set: ['envoyTreatySigned'] },
                grant: [{ reward: 'treaty-seal' }],
              },
              result:
                'The ink is barely dry before the first trade caravan arrives.',
            },
          ],
        },
        {
          id: 'envoy-tough',
          kind: 'arc-step',
          characters: ['envoy-thistle', 'taxman-gristle'],
          title: 'A Hard Bargain',
          body: 'Thistle’s smile has thinned considerably. Gristle, astonishingly, is smiling instead.',
          choices: [
            {
              id: 'finalize-tough',
              text: 'Finalize it. Every clause in your favor.',
              effects: {
                arc: { complete: 'envoy-treaty' },
                sliders: { treasury: +16, prosperity: +3, joy: -4 },
                flags: { set: ['envoyTreatyHard'] },
                grant: [{ reward: 'treaty-seal' }],
              },
              result:
                'Thistle signs anyway. “Next time,” she says, “bring less Gristle.”',
            },
          ],
        },
      ],
    },
    {
      id: 'bog-witch-bargain',
      title: 'Mossy’s Bargain',
      characters: ['witch-mossy', 'captain-cordelia'],
      start: {
        trigger: {
          minTurn: 6,
          chance: 0.55,
          requires: { sliders: { nature: { gte: 20 } } },
        },
      },
      steps: [
        {
          id: 'bog-1',
          kind: 'arc-step',
          characters: ['witch-mossy', 'captain-cordelia'],
          title: 'A Bargain in the Reeds',
          body: 'Mossy the bog witch offers to green the whole far shore overnight — for a price she won’t quite name. Cordelia, arms crossed, clearly doesn’t like the sound of “won’t quite name.”',
          choices: [
            {
              id: 'accept-hex',
              text: 'Accept the hex. Ask no questions.',
              effects: {
                arc: { advance: 'bog-accept' },
                sliders: { nature: +10 },
                flags: { set: ['mossyHexAccepted'] },
              },
              result:
                'Mossy grins wide and spits in her palm to seal it. You regret shaking on it immediately.',
            },
            {
              id: 'refuse-hex',
              text: 'Refuse. Some prices aren’t worth guessing at.',
              effects: {
                arc: { advance: 'bog-refuse' },
                sliders: { order: +4, nature: -2 },
              },
              result:
                'Mossy shrugs, entirely unoffended, and starts humming instead.',
            },
          ],
        },
        {
          id: 'bog-accept',
          kind: 'arc-step',
          characters: ['witch-mossy'],
          title: 'The Hex Takes',
          body: 'The bog blooms unnervingly fast — vines climbing the treeline overnight, flowers that weren’t there at dusk. Cordelia quietly doubles the watch, just in case.',
          choices: [
            {
              id: 'complete-accept',
              text: 'Let it grow. Whatever it costs, later.',
              effects: {
                arc: { complete: 'bog-witch-bargain' },
                sliders: { nature: +12, joy: +4, order: -4 },
                regionOverride: { treeline: 'wild' },
                flags: { set: ['bogBloomed'] },
                grant: [{ reward: 'mossy-hex' }],
              },
              result:
                'The far shore has never been greener. Mossy hasn’t asked for her price yet. That’s the part that worries everyone.',
            },
          ],
        },
        {
          id: 'bog-refuse',
          kind: 'arc-step',
          characters: ['captain-cordelia'],
          title: 'Cordelia’s Watch',
          body: 'Mossy vanishes into the mist without another word. Cordelia visibly relaxes — the first time all week.',
          choices: [
            {
              id: 'complete-refuse',
              text: 'Thank Cordelia for her instincts.',
              effects: {
                arc: { complete: 'bog-witch-bargain' },
                sliders: { order: +10, joy: -2 },
                grant: [{ reward: 'captains-pin' }],
              },
              result:
                'Cordelia, who does not often get thanked, does not quite know what to do with that.',
            },
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
      trigger: {
        requires: { sliders: { nature: { gte: 80 }, joy: { gte: 65 } } },
      },
    },
    {
      outcomeKey: 'warlock-metropolis',
      victoryType: 'MIXED',
      title: 'Boomtown by the Lake',
      body: 'The skyline is impressive. The fish are… fewer. But impressive.',
      trigger: { requires: { sliders: { prosperity: { gte: 80 } } } },
    },
    {
      outcomeKey: 'thistlewood-empire',
      victoryType: 'MIXED',
      title: 'The Thistlewood Empire',
      body: 'The treasury overflows. Foreign banners fly beside your own. Somewhere, Gristle finally, genuinely smiles.',
      trigger: {
        requires: {
          sliders: { treasury: { gte: 85 }, prosperity: { gte: 70 } },
        },
      },
    },
    {
      outcomeKey: 'fishers-peace',
      victoryType: 'SECRET',
      title: 'The Ruler Who Never Ruled',
      body: 'Somewhere along the way you stopped ruling and started just… fishing, and it turns out the kingdom did fine either way.',
      trigger: {
        requires: {
          counters: { fishCaught: { gte: 20 } },
          sliders: { joy: { gte: 60 }, order: { lte: 40 } },
        },
      },
    },
  ],
}
