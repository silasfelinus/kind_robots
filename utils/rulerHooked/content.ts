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
import {
  RULER_PRESET_IDS,
  RULER_LAYER_FALLBACK_STATE,
} from '~/utils/rulerHooked/rulerPresets'
import { ADVISOR_CHARACTER_SLUG } from '~/utils/rulerHooked/advisor'

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
      // States = the cosmetic preset ids (t-021) plus the one already-rendered
      // layer name (RULER_LAYER_FALLBACK_STATE = 'fishing') that every preset
      // currently degrades to — resolveScene() picks the state directly from
      // save.ruler.cosmetics.presetId, never from this list's order/first
      // entry, but the list stays authored here so it reads as real data
      // (compositor.ts's ruler special-case, assetCandidates' fallbackState).
      ruler: {
        z: 7,
        states: [...RULER_PRESET_IDS, RULER_LAYER_FALLBACK_STATE],
      },
    },
  },

  characters: [
    {
      // The standing advisor (ruler-hooked/t-028) -- present every reign,
      // not tied to any one card/arc the way the cast below is. Slug kept in
      // sync with advisor.ts's ADVISOR_CHARACTER_SLUG rather than duplicated
      // as a literal, so the two can never drift apart.
      slug: ADVISOR_CHARACTER_SLUG,
      name: 'Quill',
      honorific: 'the Steward',
      alignment: 'wry-devoted',
      role: 'castle steward and advisor',
      drive: 'keep the reign (and the ruler) intact',
      quirks: 'narrates your fishing like court proceedings',
    },
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
          art: 'card-harvest-festival',
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
          art: 'card-rival-angler',
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
          art: 'card-warlock-return',
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
          art: 'card-druid-sanctuary',
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
          art: 'card-tax-season',
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
          art: 'card-guard-captain-wall',
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
          art: 'card-bard-ballad',
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
          art: 'card-smuggler-dock',
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
          art: 'card-duck-census',
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
          art: 'card-rival-angler-2',
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
          art: 'card-robin-ash-garden',
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
        {
          id: 'vex-model-village',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['warlock-vex'],
          title: 'Lakeview Terraces',
          body: 'Vex sets a scale model on your tackle box: forty identical cottages climbing the treeline, each with a tiny balcony facing the water. “Everyone deserves a lake view,” he says. “At a reasonable monthly rate.”',
          art: 'card-vex-model-village',
          trigger: {
            minTurn: 8,
            requires: { flags: ['metWarlock'] },
            forbids: { flags: ['terracesSettled'] },
          },
          choices: [
            {
              id: 'approve-terraces',
              text: 'Approve all forty.',
              effects: {
                sliders: { prosperity: +12, nature: -14, joy: +2 },
                regionOverride: { treeline: 'overbuilt' },
                flags: { set: ['terracesSettled', 'terracesBuilt'] },
                counters: { warlockFavors: +1 },
              },
              result:
                'The first balcony goes up by noon. By evening someone on it is shouting at you to keep the splashing down.',
            },
            {
              id: 'orchard-terraces',
              text: 'Twenty cottages, and the orchard stays between them.',
              effects: {
                sliders: { prosperity: +6, nature: -4, joy: +4 },
                regionOverride: { treeline: 'tended' },
                flags: { set: ['terracesSettled'] },
              },
              result:
                'Vex calls the result “boutique.” He means it as a compliment to himself.',
            },
            {
              id: 'refuse-terraces',
              text: 'The treeline stays a treeline.',
              effects: {
                sliders: { nature: +4, prosperity: -5 },
                flags: { set: ['terracesSettled'] },
              },
              result:
                'Vex packs the model away with tender care. He has a cupboard for refused models. It is a large cupboard.',
            },
            {
              id: 'defer-terraces',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Vex leaves the model on the dock. A duck moves in.',
            },
          ],
        },
        {
          id: 'sela-tree-sit',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 3,
          once: true,
          characters: ['druid-sela', 'captain-cordelia'],
          title: 'The Last Oak',
          body: 'Sela has chained herself to the last old oak above the new terraces. The builders are on their lunch break. Cordelia is waiting for a word from you, and the oak is waiting for nothing at all.',
          art: 'card-sela-tree-sit',
          trigger: { requires: { flags: ['terracesBuilt'] } },
          choices: [
            {
              id: 'halt-building',
              text: 'Halt the building. The oak stays.',
              effects: {
                sliders: { nature: +8, prosperity: -6 },
                counters: { druidFavors: +1 },
                flags: { set: ['oakSpared'] },
              },
              result:
                'The builders finish lunch, then keep finishing it for the rest of the week. Sela unchains herself and plants an acorn in every lunch pail.',
            },
            {
              id: 'remove-sela',
              text: 'Have Cordelia carry her off. Gently.',
              effects: {
                sliders: { order: +6, joy: -6, nature: -4 },
                counters: { cordeliaFavors: +1 },
                flags: { set: ['selaEvicted'] },
              },
              result:
                'Cordelia is very gentle. Sela is very loud. The oak comes down at dusk, and the frogs go quiet.',
            },
            {
              id: 'join-sela',
              text: 'Climb up and fish from the branch beside her.',
              effects: {
                sliders: { joy: +6, order: -4, nature: +3 },
                counters: { fishCaught: +1 },
                flags: { set: ['oakSpared'] },
              },
              result:
                'From the oak you can cast clean over the terraces. Sela admits you have good form. The building waits, unsure of the etiquette.',
            },
          ],
        },
        {
          id: 'lake-watch',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['captain-cordelia'],
          title: 'A Watch on the Water',
          body: 'Cordelia wants a night watch on the lake: rowboats, lanterns, and every able angler on a rota. “Smugglers by moonlight,” she says. “Possibly worse. Mostly smugglers.”',
          art: 'card-lake-watch',
          trigger: { minTurn: 7 },
          choices: [
            {
              id: 'conscript-anglers',
              text: 'Every angler takes a shift.',
              effects: {
                sliders: { order: +10, joy: -6 },
                counters: { cordeliaFavors: +1 },
                flags: { set: ['lakeWatch'] },
              },
              result:
                'The lake glitters with lanterns every night. The fish, unused to being watched, grow extremely self-conscious.',
            },
            {
              id: 'volunteer-watch',
              text: 'Volunteers only.',
              effects: { sliders: { order: +4, joy: +2 } },
              result:
                'Six volunteers, four rowboats, one very enthusiastic grandmother. Cordelia makes her sergeant.',
            },
            {
              id: 'refuse-watch',
              text: 'The lake doesn’t need guarding.',
              effects: { sliders: { order: -4, nature: +2 } },
              result:
                'Cordelia nods stiffly and stands the watch herself, alone, every night, to make a point.',
            },
            {
              id: 'defer-watch',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Cordelia drafts the rota anyway, in pencil.',
            },
          ],
        },
        {
          id: 'brack-lures',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          once: true,
          characters: ['smuggler-brack'],
          title: 'Fell Off a Barge',
          body: 'Brack opens a crate of foreign lures, each gleaming and individually wrapped. “Fell off a barge,” he says. “Several barges. In a very orderly line.”',
          art: 'card-brack-lures',
          trigger: { minTurn: 9, requires: { flags: ['metSmuggler'] } },
          choices: [
            {
              id: 'buy-gold-lure',
              text: 'Buy the gold one. Ask nothing.',
              effects: {
                sliders: { treasury: -6, order: -4 },
                grant: [{ reward: 'gilded-lure' }],
              },
              result:
                'It is the finest lure you have ever held. Somewhere across the border, a duke is having a very bad morning.',
            },
            {
              id: 'tip-cordelia',
              text: 'Buy nothing, and mention it to Cordelia.',
              effects: {
                sliders: { order: +6 },
                flags: { set: ['smugglerReported'] },
              },
              result:
                'Brack is gone before the guard arrives. He leaves you the cheapest lure, as a professional courtesy.',
            },
            {
              id: 'fish-with-brack',
              text: 'Close the crate and fish with him a while.',
              effects: {
                sliders: { joy: +5 },
                counters: { fishCaught: +1 },
                flags: { set: ['brackFriend'] },
              },
              result:
                'Brack knows every cove on the lake and three that are not on it. He shows you one.',
            },
          ],
        },
        {
          id: 'brack-trial',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 3,
          once: true,
          characters: ['smuggler-brack', 'captain-cordelia'],
          title: 'Trial by Tackle',
          body: 'Cordelia has finally caught Brack, mostly because he was napping. He claims the ancient right of trial by fishing. Nobody can find the law that says so. Nobody can find the one that says otherwise.',
          art: 'card-brack-trial',
          trigger: { minTurn: 8, requires: { flags: ['smugglerReported'] } },
          choices: [
            {
              id: 'grant-trial',
              text: 'Grant it. Biggest catch by sundown walks free.',
              effects: {
                sliders: { joy: +8, order: -2 },
                counters: { fishCaught: +1 },
                flags: { set: ['brackTrialWon'] },
              },
              result:
                'Brack lands a perch the size of a footstool and walks free. Cordelia shakes his hand, then counts her fingers.',
            },
            {
              id: 'exile-brack',
              text: 'Exile him across the border.',
              effects: {
                sliders: { order: +8, treasury: -2 },
                flags: { set: ['brackExiled'] },
              },
              result:
                'Brack rows away singing. The coves fall very quiet, and so do the night markets.',
            },
            {
              id: 'pardon-brack',
              text: 'Pardon him into royal service. Customs, specifically.',
              effects: {
                sliders: { treasury: +6, order: -3 },
                flags: { set: ['metSmuggler', 'brackPardoned'] },
                grant: [{ reward: 'smugglers-map' }],
              },
              result:
                'Brack becomes the best customs officer the realm has ever had. He knows every trick. He invented most of them.',
            },
          ],
        },
        {
          id: 'thistle-fish-exports',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['envoy-thistle'],
          title: 'Export Rights',
          body: 'Thistle is back, gloves off, literally. Her kingdom has developed a taste for your lake’s fish and would like the right to net them. “Not all of them,” she says. “Most of them.”',
          art: 'card-thistle-fish-exports',
          trigger: { requires: { flags: ['envoyTreatySigned'] } },
          choices: [
            {
              id: 'sell-netting-rights',
              text: 'Sell the netting rights.',
              effects: {
                sliders: { treasury: +12, prosperity: +6, nature: -10 },
                flags: { set: ['fishExports'] },
              },
              result:
                'Foreign nets stretch across the far shore by morning. The fish you catch get smaller, and the coins get larger.',
            },
            {
              id: 'rustfish-only',
              text: 'They can have the rustfish. Only the rustfish.',
              effects: { sliders: { treasury: +4, prosperity: +2 } },
              result:
                'Thistle counts to nine under her breath, then agrees. The rustfish, which grows to fit its container, is about to get a much larger one.',
            },
            {
              id: 'refuse-exports',
              text: 'The lake’s fish stay in the lake.',
              effects: { sliders: { nature: +4, prosperity: -4, joy: +2 } },
              result:
                'Thistle departs with a cool nod. Gristle follows her halfway to the gate, adding up what you just declined.',
            },
            {
              id: 'defer-exports',
              text: '…I’m fishing. Ask me later.',
              effects: { sliders: { order: -2 } },
              requeue: true,
              result: 'Thistle waits in the gatehouse, counting.',
            },
          ],
        },
        {
          id: 'fish-tithe',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 2,
          characters: ['taxman-gristle'],
          title: 'A Levy on Fish',
          body: 'Gristle proposes a tithe on every fish landed in the kingdom, payable in fish. “Or in coin,” he adds, “at a rate I will calculate later, privately.”',
          art: 'card-fish-tithe',
          trigger: {
            minTurn: 6,
            cooldown: 10,
            requires: { counters: { taxHikes: { gte: 1 } } },
          },
          choices: [
            {
              id: 'levy-fish',
              text: 'Levy it.',
              effects: {
                sliders: { treasury: +8, joy: -6 },
                counters: { taxHikes: +1 },
              },
              result:
                'Anglers start fishing at night, in disguise. Gristle starts patrolling at night, also in disguise. They keep meeting.',
            },
            {
              id: 'exempt-suppers',
              text: 'Exempt anyone fishing for their supper.',
              effects: { sliders: { treasury: +3, joy: +2 } },
              result:
                'Everyone is now fishing for their supper, all day, very loudly.',
            },
            {
              id: 'refuse-levy',
              text: 'Not one fish, Gristle.',
              effects: { sliders: { joy: +5, treasury: -3 } },
              result:
                'Gristle writes something small in the ledger’s margin and underlines it twice.',
            },
          ],
        },
        {
          id: 'fen-satire',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 3,
          once: true,
          characters: ['bard-fen'],
          title: 'A Song in the Square',
          body: 'Fen is in the square with a new song. The chorus is about a ruler who hears every complaint “down a fishing line, at a great distance, mid-yawn.” The crowd already knows the words.',
          art: 'card-fen-satire',
          trigger: { minTurn: 6, requires: { sliders: { joy: { lte: 40 } } } },
          choices: [
            {
              id: 'join-chorus',
              text: 'Join the chorus.',
              effects: { sliders: { joy: +10, order: -4 } },
              result:
                'You sing the yawn yourself. The square loses its mind, and Fen adds a verse in your honor on the spot.',
            },
            {
              id: 'ban-song',
              text: 'Ban the song.',
              effects: {
                sliders: { order: +6, joy: -8 },
                flags: { set: ['fenBanned'] },
              },
              result:
                'By sundown the song is banned and everyone is humming it. Humming, Cordelia reports, is not technically singing.',
            },
            {
              id: 'answer-song',
              text: 'Commission a reply verse, at royal expense.',
              effects: {
                sliders: { joy: +4, treasury: -4 },
                grant: [{ reward: 'bards-ballad' }],
              },
              result:
                'Fen writes the reply too, and charges double. Both songs are good. One is better, and it is not yours.',
            },
          ],
        },
        {
          id: 'mossy-price',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 3,
          once: true,
          characters: ['witch-mossy'],
          title: 'Mossy Names Her Price',
          body: 'Mossy turns up with an empty basket and a grin. Her price, it turns out, is the first fish you catch every new moon, forever, plus one story about it, told well.',
          art: 'card-mossy-price',
          trigger: { requires: { flags: ['bogBloomed'] } },
          choices: [
            {
              id: 'pay-price',
              text: 'Pay it. A deal is a deal.',
              effects: {
                sliders: { nature: +6, joy: +2 },
                counters: { fishCaught: -1 },
                flags: { set: ['mossyPaid'] },
              },
              result:
                'Mossy takes the fish and the story. She says the story was the better catch, which stings.',
            },
            {
              id: 'send-fen',
              text: 'Offer her a night of Fen’s stories instead.',
              effects: {
                sliders: { joy: +4, nature: +2 },
                counters: { balladsSung: +1 },
                flags: { set: ['mossyPaid'] },
              },
              result:
                'Mossy and Fen talk until dawn. Neither will say about what. Each looks a little frightened of the other afterward.',
            },
            {
              id: 'refuse-price',
              text: 'Refuse. You never agreed to forever.',
              effects: {
                sliders: { nature: -10, order: +4 },
                regionOverride: { treeline: 'tended' },
                flags: { set: ['mossyRefused'] },
              },
              result:
                'Mossy shrugs and leaves. Overnight, half the vines wither back to ordinary green. She never mentioned that part either.',
            },
          ],
        },
        {
          id: 'public-dock',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          once: true,
          characters: ['sweetheart-ash'],
          title: 'A Dock for Everyone',
          body: 'Ash, cap in hand, asks whether the old village dock might be mended. It rotted through years ago, and since then the only good fishing on the lake has been off the royal one. “Which is yours,” Ash adds. “Which is fine. Just crowded. For the fish.”',
          art: 'card-public-dock',
          trigger: { minTurn: 6, requires: { cardsSeen: ['elope-1'] } },
          choices: [
            {
              id: 'fund-dock',
              text: 'Rebuild it with royal timber.',
              effects: {
                sliders: { joy: +8, treasury: -6, prosperity: +3 },
                flags: { set: ['publicDock'] },
              },
              result:
                'The new dock is full by dawn: grandparents, children, three herons, and one rival noble pretending he isn’t there.',
            },
            {
              id: 'share-royal-dock',
              text: 'Open the royal dock on market days.',
              effects: { sliders: { joy: +4, order: -2 } },
              result:
                'Market days get crowded, and loud, and the fishing is somehow better for it.',
            },
            {
              id: 'decline-dock',
              text: 'The village can mend its own dock.',
              effects: { sliders: { treasury: +2, joy: -4 } },
              result: 'Ash thanks you anyway and goes to borrow a hammer.',
            },
          ],
        },
        {
          id: 'vex-sela-truce',
          deck: 'kingdom-core',
          kind: 'interrupt',
          weight: 3,
          once: true,
          characters: ['warlock-vex', 'druid-sela'],
          title: 'An Unlikely Joint Venture',
          body: 'Vex and Sela arrive together, which has never happened, holding one blueprint between them, which should not be possible. It is a lodge built among the trees: nothing felled, gardens on every roof, and a gift shop.',
          art: 'card-vex-sela-truce',
          trigger: {
            minTurn: 12,
            requires: {
              counters: { warlockFavors: { gte: 1 }, druidFavors: { gte: 1 } },
            },
          },
          choices: [
            {
              id: 'approve-lodge',
              text: 'Approve it, gift shop and all.',
              effects: {
                sliders: { prosperity: +8, nature: +4, treasury: -4 },
                flags: { set: ['ecoLodge'] },
              },
              result:
                'Guests come from three kingdoms to look at trees. Sela gives the tours. Vex runs the till. Each insists it was their idea.',
            },
            {
              id: 'reject-lodge',
              text: 'The woods are not for sale, even nicely.',
              effects: { sliders: { nature: +2, prosperity: -3, order: +2 } },
              result:
                'They leave arguing about whose fault that was. Normal service resumes.',
            },
            {
              id: 'let-them-explain',
              text: 'Ask each to explain what the other gets out of it.',
              effects: { sliders: { joy: +6 }, counters: { fishCaught: +2 } },
              result:
                'They are still explaining at sunset. You catch two fish.',
            },
          ],
        },
        {
          id: 'quill-day-off',
          deck: 'kingdom-core',
          kind: 'ambient',
          weight: 2,
          once: true,
          characters: ['steward-quill'],
          title: 'The Steward’s Request',
          body: 'Quill asks, with visible discomfort, for a single day off. He has not taken one since your coronation. He has drafted a forty-page handover for it.',
          art: 'card-quill-day-off',
          trigger: { minTurn: 15 },
          choices: [
            {
              id: 'grant-day-off',
              text: 'Take the day. Take two.',
              effects: {
                sliders: { joy: +4, order: -4 },
                flags: { set: ['quillRested'] },
              },
              result:
                'Nothing burns down. Three things nearly do. Quill comes back sunburned and twice as sharp.',
            },
            {
              id: 'fish-with-quill',
              text: 'Spend it fishing, with me.',
              effects: {
                sliders: { joy: +6 },
                counters: { fishCaught: +1 },
                flags: { set: ['quillRested'] },
              },
              result:
                'Quill narrates his own catch like court proceedings, then goes quiet for a long while, smiling at the water.',
            },
            {
              id: 'deny-day-off',
              text: 'The kingdom cannot spare you.',
              effects: { sliders: { order: +4, joy: -3 } },
              result:
                '“Of course,” says Quill, and sharpens his quill a little harder than necessary.',
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
          art: 'card-nix-riddle',
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
          art: 'card-sunken-cache',
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
          art: 'card-golden-hour-catch',
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
          art: 'card-nix-warning',
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
        {
          id: 'nix-old-name',
          deck: 'lake-mysteries',
          kind: 'interrupt',
          weight: 2,
          once: true,
          characters: ['lake-spirit-nix'],
          title: 'The Lake’s Old Name',
          body: 'Nix rises beside the dock with a single wet word on its tongue: the lake’s name from before the castle. “Will you call it that,” it asks, “or will you go on calling it yours?”',
          art: 'card-nix-old-name',
          trigger: { minTurn: 12, requires: { flags: ['nixAnswered'] } },
          choices: [
            {
              id: 'restore-old-name',
              text: 'Call it by its old name.',
              effects: {
                sliders: { nature: +6, joy: +4, order: -2 },
                flags: { set: ['lakeNameRestored'] },
                grant: [{ reward: 'nix-pearl' }],
              },
              result:
                'Nix sets something cold and round in your palm and sinks without another question. That is how you know it was pleased.',
            },
            {
              id: 'keep-royal-name',
              text: 'It is the Royal Lake. It stays the Royal Lake.',
              effects: { sliders: { order: +6, nature: -2 } },
              result: 'Nix asks, “For how long?” and does not wait to hear.',
            },
            {
              id: 'ask-nix-back',
              text: 'Ask Nix what it would call you.',
              effects: {
                sliders: { joy: +6 },
                flags: { set: ['nixQuestioned'] },
              },
              result:
                'Nix considers this for a long time, then answers with a question you will be turning over for weeks.',
            },
          ],
        },
        {
          id: 'drowned-surface',
          deck: 'lake-mysteries',
          kind: 'interrupt',
          weight: 3,
          title: 'Something Floats Up',
          body: 'A whole school of pale carp floats up beside the village dock, belly-up. Then, slowly, they turn over and swim away. The village would like a royal statement about this.',
          art: 'card-drowned-surface',
          trigger: {
            minTurn: 8,
            cooldown: 10,
            requires: { sliders: { nature: { lt: 35 } } },
          },
          choices: [
            {
              id: 'clean-water',
              text: 'Pay to clean the water.',
              effects: { sliders: { nature: +12, treasury: -8 } },
              result:
                'Barrels of sludge are hauled out by the dozen. The carp that floated up stay floated. The rest stop doing it.',
            },
            {
              id: 'blame-vex',
              text: 'Blame Vex. Publicly.',
              effects: {
                sliders: { order: +4, prosperity: -6, joy: +2 },
                flags: { set: ['vexBlamed'] },
              },
              result:
                'Vex issues a statement blaming the carp. It is very well written.',
            },
            {
              id: 'carp-are-fine',
              text: 'Announce that the carp are fine. They swam off, didn’t they?',
              effects: { sliders: { nature: -4, joy: -4 } },
              result: 'They did swim off. Toward the village wells.',
            },
          ],
        },
        {
          id: 'heron-delegation',
          deck: 'lake-mysteries',
          kind: 'ambient',
          weight: 2,
          once: true,
          title: 'The Heron Delegation',
          body: 'Seven herons land on the dock in a row, each on one leg, all facing you. After a long silence the tallest drops a fish at your feet. It is, you realize, an offer.',
          art: 'card-heron-delegation',
          trigger: {
            minTurn: 5,
            requires: { sliders: { nature: { gte: 55 } } },
          },
          choices: [
            {
              id: 'grant-shallows',
              text: 'Give them the reed shallows. Officially.',
              effects: {
                sliders: { nature: +6, prosperity: -2 },
                flags: { set: ['heronShallows'] },
              },
              result:
                'The herons accept with one synchronized blink. The reed beds are theirs now, and they patrol them better than Cordelia.',
            },
            {
              id: 'share-the-dock',
              text: 'Offer to share the dock.',
              effects: { sliders: { joy: +4 }, counters: { fishCaught: +1 } },
              result:
                'Seven herons and one monarch, fishing in silence. It is the most productive meeting of your reign.',
            },
            {
              id: 'shoo-herons',
              text: 'Shoo them off.',
              effects: { sliders: { order: +2, nature: -2 } },
              result:
                'They leave in a row, slowly, with enormous dignity. The fish stays behind, like a receipt.',
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
          art: 'card-elope-1',
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
          art: 'card-elope-blessing',
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
          art: 'card-elope-defiance',
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
          art: 'card-envoy-1',
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
          art: 'card-envoy-generous',
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
          art: 'card-envoy-tough',
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
          art: 'card-bog-1',
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
          art: 'card-bog-accept',
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
          art: 'card-bog-refuse',
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
