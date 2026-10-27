import type {
  AudienceDef,
  DayDef,
  DueDef,
  QuestDef,
  SceneLine,
  SceneVariant,
} from './types'
import type { EpilogueSubject } from './epilogue'

// Act III, Days 21-30, "Kind Roads" (conductor DAY-PLAN.md): the Black
// Verge at the border, the mission road, the Abbess at court, Flint’s trial,
// Mara's secret page and the terms of shelter before the faction wars
// resolve on the map. Harm to children stays off-screen: neat empty cots,
// tracks that only lead in, a door kept locked (WORLD-GUIDE.md).
//
// Playtest rewrite (t-037): kindness is the trap only if the kindness is
// real. The Abbey runs a true fever ward and some children do come home; the
// census sum on Day 25 is the one hard tell before Mara's page on Day 29.
// Credible people (Dunmore, Kiyo, Hester) argue both sides; Komodo mostly
// stops defending it.

/** A line a scene says differently when the run holds one earlier answer. */
type Aside = { flag: string; line: string }

/**
 * Scene variants for independent groups of asides. From each group a run
 * hears at most one aside, the first whose flag it holds; the gates are
 * disjoint, so order never matters. `build` swaps the picked asides into the
 * scene's lines (same number of lines, as every scene variant must keep).
 */
const asideVariants = (
  groups: readonly (readonly Aside[])[],
  build: (picked: (string | undefined)[]) => SceneLine[],
): SceneVariant[] => {
  type Combo = {
    flags: string[]
    notFlags: string[]
    picked: (string | undefined)[]
  }
  let combos: Combo[] = [{ flags: [], notFlags: [], picked: [] }]
  for (const group of groups)
    combos = combos.flatMap((combo) => [
      ...group.map((aside, i) => ({
        flags: [...combo.flags, aside.flag],
        notFlags: [
          ...combo.notFlags,
          ...group.slice(0, i).map((earlier) => earlier.flag),
        ],
        picked: [...combo.picked, aside.line],
      })),
      {
        flags: combo.flags,
        notFlags: [...combo.notFlags, ...group.map((aside) => aside.flag)],
        picked: [...combo.picked, undefined],
      },
    ])
  return combos
    .filter((combo) => combo.flags.length)
    .map(({ flags, notFlags, picked }) => ({
      flags,
      ...(notFlags.length ? { notFlags } : {}),
      lines: build(picked),
    }))
}

const joinLine = (base: string, extra: string | undefined): string =>
  extra ? `${base} ${extra}` : base

// Day 25: the Abbess's opening, with what she has heard from the court.
const ABBESS_SPEECH =
  'I walked here to say this. The wasteland is cruel to little ones. The Abbey takes them in. We ask only to be left to our work.'
const abbessOpening = (asides: (string | undefined)[]): SceneLine[] => [
  'The Abbess walks into the hall on her own feet, road dust on her hem. Two young Abbey sisters follow with bread for the Yard. She is smaller than her reputation. In passing she touches a kitchen child’s head. The child leans in like a cat.',
  'Foreman Dunmore Ash stops halfway across the hall. He is looking at the taller sister.',
  {
    who: 'Foreman Dunmore Ash',
    npc: 'dunmore-ash',
    text: 'That’s Moll. She came to my Yard at six with lice and no shoes, Majesty. The sisters walked her up the mission road in the hungry year. I never saw her again. Until now.',
  },
  'The sister bobs to him. She is seventeen, broad in the shoulder, with all her teeth. She carries the heaviest basket.',
  joinLine(joinLine(ABBESS_SPEECH, asides[0]), asides[1]),
]

// Day 30: Sister Marrow at the gate, and who in the hall speaks for her.
const MARROW_OFFER =
  '“Blankets. Hot milk. Two to a cot, if it comes to that. It has before.”'
const HESTER_DEFAULT =
  'A mother on my roads had a boy who walked to the Abbey with a sister in grey. She came here asking after him. Ask how often she’s seen his face.'
const marrowLines = (asides: (string | undefined)[]): SceneLine[] => [
  'Sister Marrow walks in out of the dark with road mud on her habit and a counting cord at her belt. She bows to each envoy, lowest to the burrow delegate.',
  '“The Abbess sends her wagons, Your Majesty. Shelter whichever grown folk you like. Tonight the Abbey takes the children of all three peoples behind our walls until the war is done.”',
  joinLine(MARROW_OFFER, asides[0]),
  {
    who: 'Hester Plowright',
    npc: 'hester-plowright',
    text: asides[1] ?? HESTER_DEFAULT,
  },
  {
    who: 'Foreman Dunmore Ash',
    npc: 'dunmore-ash',
    text: 'Three to a bed and no milk, Majesty. Or hot milk on a wagon. I know what I’d want for mine.',
  },
  {
    who: 'Young Komodo',
    npc: 'young-komodo',
    text: 'If you send them, Your Majesty, count them onto the wagons yourself. Then count them off.',
  },
]

// Day 30: the hall before the envoys speak; the Watch remembers the dry well.
const DUNMARK_GATE =
  'The fortress can shelter one of them properly, Majesty. Not two. Spread the Watch over three camps and I lose all three, and the gate. The rest fend for themselves.'
const termsOpening = (dunmark: string): SceneLine[] => [
  'Night comes early. The hall is lit like a camp. Three envoys before the throne, in order of arrival. Hester Plowright of the Freeholds, mud to her knees. A Saltroad drover, Oriel Saltmarsh’s seal on a cord. An elderly burrow delegate in a quilted vest, eyeing the ceiling like it might fall.',
  'The Freeholds, the Saltroad and the Moles have each sent an envoy. One question from all three: if war comes tonight, will the crown open its gates?',
  {
    who: 'Captain Ferro Dunmark',
    npc: 'ferro-dunmark',
    text: dunmark,
  },
  {
    who: 'Young Komodo',
    npc: 'young-komodo',
    text: 'Choose by strength, Your Majesty. The weak are gone by morning whatever we do. The strong remember who opened the gate.',
  },
]

export const ACT_THREE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d22-ford-bodies',
    title: 'Bodies at the Ford',
    summary:
      'Three travellers came out of the Eastern Ford at dawn. The Old Houses already blame the Moles. Learn who the dead were before the wrong people hang.',
    region: 'east-ford',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['tracking', 'records', 'medicine'],
    // t-043: the map that blew across the throne room on Day 14 was this Ford.
    aid: [
      {
        flags: ['maps-copied'],
        label: 'The Archive’s copy of the Ford before it moved',
        bonus: 1,
        stat: 'wits',
      },
    ],
    rewards: {
      success: {
        affinity: { moles: 10 },
        local: { lamplight: 2 },
        flags: ['ford-bodies-identified'],
      },
      partial: { flags: ['ford-bodies-identified'] },
      failure: {
        affinity: { moles: -15 },
        local: { 'old-houses': 2 },
        flags: ['moles-blamed'],
      },
    },
    expired: {
      affinity: { moles: -10 },
      flags: ['moles-blamed'],
    },
    outcomes: {
      success:
        'Not Moles. Not knives. River water in the lungs. Each wore a mission-road token, the kind the Abbey gives parents who visit. Their boots were worn through at the toe. They walked a long way after the Abbey sent them home. Where, the court does not know.',
      partial:
        'The searchers recover two mission-road tokens lodged in the reeds. They bear different dates but the same punched hole. Before anyone can inspect the far bank, the current rises and takes the last tracks.',
      failure:
        'The party came back with nothing. The Old Houses filled the silence: the Moles did it. The burrows will remember.',
      expired:
        'No one comes to the ford. By supper an Old House clerk has blamed the Mole Revolutionaries. A burrow warden brings the accusation back to court with river silt on the paper.',
    },
  },
  {
    id: 'q-d23-blue-lantern',
    title: 'Follow the Blue Lantern',
    summary:
      'A blue lantern moves along the old rail line every third night. Smugglers, the Ledger says. Follow it.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'high' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'tunnels'],
    rewards: {
      triumph: {
        brass: 35,
        affinity: { rustline: 10 },
        flags: ['blue-lantern-route'],
      },
      success: {
        brass: 20,
        affinity: { rustline: 5 },
        flags: ['blue-lantern-route'],
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The blue lantern led to a Rustline cache: tincture, lamp glass, a crate of clean needles. The smuggler was a girl of fifteen with a burned hand. She offered the crown a fifth before anyone drew.',
      success:
        'The lantern carries medicine past the Ledger’s tolls to the Freehold farms. Now the court knows the route. So does its purse.',
      partial:
        'The blue lantern vanishes through a hatch beneath a boarded tollhouse. A farmer insists the cellar belongs to nobody. At dawn fresh bootprints cross the frost between the door and the road.',
      failure:
        'The lantern goes out under the rail bridge. The party returns with soot on their gloves and boiled herbs in their coats. The Freehold clinic still has no medicine.',
      expired:
        'The unguarded route changes overnight. At the tollhouse a used bandage lies beside an empty medicine bottle. Whoever carried the blue lantern now trusts another road.',
    },
  },
  {
    id: 'q-d24-mission-road',
    title: 'The Mission Road',
    summary:
      'Bett Ormond last saw her son Dov on the mission road, walking toward the Abbey with a sister in grey. Walk the road.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking'],
    rewards: {
      success: {
        local: { lamplight: 2 },
        affinity: { freeholds: 5 },
        flags: ['mission-road-tracks'],
      },
      failure: { affinity: { abbey: -5 } },
    },
    expired: { affinity: { freeholds: -5 } },
    outcomes: {
      success:
        'The road was swept. Not well enough. Small bare footprints, many, going up to the Abbey gate. Coming down, fewer, in new boots, in step with a grown pair.',
      partial:
        'The mission road has been freshly swept, even between the stones. A wheel rut leads to the Abbey gate and ends at its threshold. Sister Marrow says the courtyard was cleaned for guests.',
      failure:
        'Two sisters meet the investigators halfway up the mission road and escort them home through the rain. They offer tea and a dry place to sleep. The party returns unsure whether they were protected or turned away.',
      expired:
        'Bett Ormond stands by the empty escort bench until dusk, then folds the Abbey directions into her coat. The next morning she asks whether a letter has arrived. The courier has nothing for her.',
    },
  },
  {
    id: 'q-d24-coldbrook-visit',
    title: 'A Visit to the Children',
    summary:
      'Wenna Coldbrook begged the crown to leave the Abbey be. Go anyway. See all three Coldbrook children with your own eyes.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { abbey: -10, freeholds: 10 },
        flags: ['coldbrook-visit', 'abbey-cots-empty'],
      },
      failure: { affinity: { abbey: -5 } },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'Sister Marrow showed them the dormitory, three cots made tight, then the schoolroom. The two older Coldbrooks were there, scrubbed, reading aloud. They ran to their mother. The youngest was in the fever ward, below. The party was not let down the stair.',
      partial:
        'Sister Marrow speaks through the half-open gate and promises a supervised visit next week. She sends the family a clean blanket and a school exercise. The child who wrote it did not sign a name.',
      failure:
        'The sisters say the children have gone to bed early after a fever round. They show three folded coats in the schoolroom but decline the stairs to the infirmary. There is no proof of harm and no proof all is well.',
      expired:
        'No one takes the road. Wenna keeps the visit papers on her kitchen shelf and says the youngest needs rest. She says it again when the next Abbey letter arrives, before she opens it.',
    },
  },
  {
    id: 'q-d26-dry-well',
    title: 'A Friendly Raid',
    summary:
      'Gristle Vane wants help against a worse band: the dry-well jackals. They take people, not goats.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, freeholds: 5 },
        strength: { jackalwire: 1 },
        flags: ['dry-well-cleared'],
      },
      failure: {
        affinity: { jackalwire: -5 },
        strength: { freeholds: -1 },
      },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'The dry-well jackals are scattered. Vane threw a feast in their own camp and sat the freed Freehold farmers at the head of the table. He served them himself. Badly.',
      partial:
        'The raiders retreat into the dry well and drag a painted wagon across its mouth. Farmers bring the crown a map of the escape route. Vane offers to settle the account before the raiders find another gate.',
      failure:
        'The raiders keep the dry well. Two Freehold families reach the ford before dawn with their doors strapped to a cart. Vane leaves his feast untouched and asks for another chance.',
      expired:
        'The crown sends no escort. Vane attacks with his own riders and returns with one painted wagon less. The freed farmers know whose banner they did not see.',
    },
  },
  {
    id: 'q-d27-flint-evidence',
    title: 'The Case Against Flint',
    summary:
      'The Old Houses say Duchess Flint passed grain to the Moles. Read the ledgers before the court judges her.',
    region: 'hollow-bell',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [{ stat: 'wits', band: 'high' }],
    danger: 'none',
    tags: ['records'],
    rewards: {
      success: {
        local: { lamplight: 3, 'old-houses': -2 },
        flags: ['flint-cleared'],
      },
      failure: { flags: ['flint-doubted'] },
    },
    expired: { flags: ['flint-doubted'] },
    outcomes: {
      success:
        'The grain went to the Moles, yes. From the Old Houses’ own granary, at three times market price. Flint was trying to stop it.',
      partial:
        'The grain accounts disagree. One bears Flint’s signature; another names a broker dead three years. The Old Houses demand a verdict before either book can be traced.',
      failure:
        'The auditors return clean accounts bearing the Old House seal. Flint’s witnesses were not asked to sign. By evening the tower steps are crowded with people holding missing receipts.',
      expired:
        'The ledger packet sits unopened through the hearing. Flint is judged by rumor instead. A junior clerk keeps the sealed packet beneath her desk in case someone still wants the facts.',
    },
  },
  {
    id: 'q-d28-rot-cure',
    title: 'Charms Against Rot',
    summary:
      'The Black Verge envoys offer a cure for the grain rot in the Yard’s stores. Test it before anyone eats.',
    region: 'black-verge',
    faction: 'black-verge',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['medicine'],
    rewards: {
      success: {
        local: { yard: 3 },
        affinity: { 'black-verge': 5 },
        flags: ['verge-cure-tested'],
      },
      failure: {
        local: { yard: -3 },
        flags: ['verge-cure-tainted'],
      },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'The charm kills the rot. The grain stays cold to the touch. Always. The Yard eats it anyway.',
      partial:
        'The charm arrests mold along the outer sacks, but the grain tastes of iron. Dunmore keeps one loaf beneath a glass bell. He wants the court to decide whether to serve the rest.',
      failure:
        'Two of the testers walked to the north gate in their sleep and stood facing the Verge until dawn. Neither remembers it. Both are cold to the touch.',
      expired:
        'No one tests the charm. By the third morning the rot climbs the next storeroom wall, leaving a tide mark on the sacks. The Yard asks which families will lose their rations first.',
    },
  },
  {
    id: 'q-d30-hold-the-line',
    title: 'Hold the Border Line',
    summary:
      'War is coming between the factions. The map changes tomorrow. Stand with the weakest of the court’s friends.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        strength: { freeholds: 2, saltroad: 1 },
        affinity: { freeholds: 10, saltroad: 5 },
      },
      success: {
        strength: { freeholds: 1, saltroad: 1 },
        affinity: { freeholds: 5 },
      },
      failure: { strength: { freeholds: -1 } },
    },
    expired: { strength: { freeholds: -1 } },
    outcomes: {
      triumph:
        'The line held and the raiders left their dead in the ditch. Two factions sent riders to see who had held it. They saw the crown’s colours.',
      success:
        'The line held at the Freehold fence posts. Dunmark brought back every rider and one horse fewer. The Yard ate the horse.',
      partial:
        'The line bent at the fence posts. It held, just. Three farms behind it burned anyway.',
      failure:
        'The line broke at the fence posts. The Freeholds paid in barns.',
      expired: 'Nobody stood on the line. The Freeholds stood alone.',
    },
    // Whoever the crown sheltered that night stood on the line beside it.
    outcomeVariants: {
      success: [
        {
          flags: ['sheltered-freeholds'],
          text: 'The line held at the Freehold fence posts. Hester’s people stood behind the Watch with pitchforks and did not run. Dunmark brought every rider home.',
        },
        {
          flags: ['sheltered-saltroad'],
          text: 'The line held at the salt wagons, chained nose to tail across the Ford road. The Saltroad lost two oxen and no drivers. Oriel sent the bill anyway.',
        },
        {
          flags: ['sheltered-moles'],
          text: 'The line held over the burrow mouths. At dusk the Moles came up behind the raiders. The fighting ended underground. The court did not ask how.',
        },
      ],
      failure: [
        {
          flags: ['d30-children-to-abbey'],
          text: 'The line broke at the fence posts. The Freeholds paid in barns. Their children were on the Abbey’s wagons by then. Hester says that is the only reason she can stand.',
        },
      ],
    },
  },
  {
    // t-061: posted by Day 28's The Post Comes Back audience.
    id: 'q-d28-returned-letters',
    title: 'Ninety-One Letters',
    summary:
      'Carry the Archive’s sack of returned letters down the mission road and put each one back in the hand that wrote it. Bring Keeper Vellum the names.',
    region: 'mission-road',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'low',
    tags: ['records', 'tracking'],
    rewards: {
      triumph: {
        local: { lamplight: 3, yard: 1 },
        affinity: { abbey: -5 },
        flags: ['d28-letters-delivered', 'd28-empty-houses'],
      },
      success: {
        local: { lamplight: 2 },
        flags: ['d28-letters-delivered'],
      },
      partial: { local: { lamplight: 1 } },
      failure: { local: { lamplight: -1 }, flags: ['d28-letters-lost'] },
    },
    expired: { local: { lamplight: -2 }, flags: ['d28-letters-lost'] },
    outcomes: {
      triumph:
        'Eighty-six letters went home into the hands that wrote them. Five houses on the road stood empty, stoves cold, doors on the latch. The party brought Vellum eighty-six names and five addresses. He wrote the five on a page by themselves and locked it in his desk.',
      success:
        'Most of the letters went home. Mothers read the brown line on the step and went inside. A father on the high bend asked the party to stay for supper. He did not ask why. Vellum has the names.',
      partial:
        'Rain on the mission road. Half the sack came back with the ink run grey. The other half was delivered. Vellum dries the wet ones on a line across the Archive and will not let anyone take them down.',
      failure:
        'Two sisters in grey met the party at the post-house and asked, kindly, for the sack. The party gave it to them. Nobody can say afterward why. Vellum asked twice. Then he stopped asking.',
      expired:
        'The sack sat in the Archive two more days. On the third a woman came to the post-house and asked whether anything had come from her girl. The clerk said no. He had been told to say no.',
    },
  },
]

// t-061: the mission road post comes back in one sack.
const D28_RETURNED_LETTERS: AudienceDef = {
  id: 'd28-returned-letters',
  title: 'The Post Comes Back',
  speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
  npc: 'abelard-vellum',
  faction: 'lamplight',
  lines: [
    'Keeper Vellum takes a long time to cross the hall. Two archive clerks walk behind him with a mail sack slung between them. They set it down as if it might wake.',
    '“The Archive keeps the post-house on the mission road, Majesty. Sixty years. This sack came back up the road last night. Ninety-one letters.”',
    '“Parents write to their children at the Abbey. The Abbey writes back. That is how it has always been done.”',
    '“Every one of these was opened, read, folded again and sealed with the Abbey’s wax. Every one carries the same answer in the same brown hand. The child is well and asks that you do not visit.”',
    '“Some of these children were six when they went up that road. I have never met a six-year-old who asked for that.”',
    {
      who: 'Young Komodo',
      npc: 'young-komodo',
      text: 'The Abbey shelters half the valley’s orphans, Your Majesty. One tired sister with ninety letters and one pen writes one sentence ninety times. That is not a crime. It is a long night.',
    },
  ],
  options: [
    {
      id: 'ask-read',
      label: 'Ask Vellum to read one aloud.',
      effects: {},
      response:
        'Vellum chooses without looking. He unfolds it very slowly. The clerks stop breathing.',
      next: 'letter',
    },
    {
      id: 'carry',
      label:
        'Carry them back down the road. Put each letter in the hand that wrote it.',
      effects: { local: { lamplight: 1 } },
      response:
        'Vellum ties the sack with archive cord and presses his ring into the knot. “Ninety-one,” he says. “I will want ninety-one names back.”',
      postsQuests: ['q-d28-returned-letters'],
    },
    {
      id: 'abbey',
      label:
        'Send the sack to the Abbess with the crown’s compliments. Let her answer for her clerk.',
      effects: {
        affinity: { abbey: 5 },
        local: { lamplight: -2 },
        flags: ['d28-letters-to-abbey'],
      },
      response:
        'A sister in grey collects the sack before supper and thanks the court for its care. She lifts it alone. It took two clerks to carry it in.',
    },
    {
      id: 'vault',
      label:
        'Seal the sack in the Archive. The families can be told when the crown knows more.',
      effects: {
        local: { lamplight: 2, yard: -1 },
        flags: ['d28-letters-vaulted'],
      },
      response:
        'The sack goes into the vault under Vellum’s lamp. In the market a woman asks a clerk whether the post came. He says no. He has been told to say no.',
    },
    {
      id: 'maps',
      label:
        'Ask whether the Archive’s copied maps show where the Abbey post really goes.',
      requires: { flags: ['maps-copied'] },
      effects: { local: { lamplight: 1 }, flags: ['d28-post-track-mapped'] },
      response:
        'Vellum unrolls the old copy across the dais steps. The post-house is marked. So is a second track beyond it, uphill, that the Abbey’s own map leaves off. Vellum puts one claw on it and does not move it.',
    },
  ],
  beats: [
    {
      id: 'letter',
      lines: [
        'Vellum reads the way he does everything. Slowly. Each word set down like a stone.',
        '“Mattie. The hens are laying again. Your brother lost his front tooth and wants you to see the gap before it grows in. We kept your cot by the stove. Come home at harvest if the sisters can spare you. Mam.”',
        'Under it, in brown ink, in a neat hand: The child is well and asks that you do not visit.',
        '“Mattie Fenwick went up the road at six,” Vellum says. “The Archive has her intake. Four years ago. Ten-year-olds ask for things, Majesty. Not this.”',
        {
          who: 'Young Komodo',
          npc: 'young-komodo',
          text: 'Then the Fenwicks will want their letter back, Your Majesty. They will not want the answer.',
        },
      ],
      options: [
        {
          id: 'carry',
          label: 'Carry them all back. The Fenwicks first.',
          effects: { local: { lamplight: 1 } },
          response:
            'Vellum puts the Fenwick letter on top and ties the sack himself. His claws are slow on the cord. They do not shake.',
          postsQuests: ['q-d28-returned-letters'],
        },
        {
          id: 'abbey',
          label: 'Send them to the Abbess. Ask her whose hand this is.',
          effects: {
            affinity: { abbey: 5 },
            local: { lamplight: -2 },
            flags: ['d28-letters-to-abbey'],
          },
          response:
            'The Abbess answers by return, warmly. The hand is Sister Ondine’s, who has lovely penmanship and is very tired. The Abbess will see that she rests. The sack does not come back.',
        },
        {
          id: 'vault',
          label: 'Vault the sack. Nobody reads another one.',
          effects: {
            local: { lamplight: 2, yard: -1 },
            flags: ['d28-letters-vaulted'],
          },
          response:
            'Vellum folds Mattie’s letter along its old creases and puts it back. He locks the vault himself. He keeps the key on its own ring after that.',
        },
      ],
    },
  ],
}
export const ACT_THREE_DAYS: readonly DayDef[] = [
  {
    day: 21,
    title: 'A Captain’s Promise',
    briefings: [
      {
        id: 'verge-banners',
        source: 'The map room',
        text: 'A new banner hangs at the far border: the Black Verge Court.',
        truth: true,
      },
      {
        id: 'vane-offer',
        source: 'A Jackalwire runner',
        text: 'Gristle Vane wants an alliance against the riders in plum.',
        truth: true,
        // t-043: the tincture fee the crown stopped paying on Day 8.
        variants: [
          {
            flags: ['d03-tincture-fee-lapsed'],
            text: 'Gristle Vane wants an alliance against the riders in plum. He crossed the Saltroad bridge to ask, at the Pack’s price. Triple, since the crown stopped paying.',
          },
        ],
      },
      {
        id: 'verge-peaceful',
        source: 'A travelling preacher',
        text: 'The Black Verge Court sends word it wants nothing but trade.',
        truth: false,
      },
    ],
    komodo:
      'Courts that want only trade do not send riders ahead of merchants, Your Majesty. Vane asking for help is the most honest thing he has done. He is afraid.',
    quests: [],
    audiences: [
      {
        id: 'd21-captains-promise',
        title: 'A Captain’s Promise',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'Captain Vane comes up the carpet alone. Nobody has seen him do that. Feather greatcoat buttoned to the throat. In his hand, a plum-dyed bridle, finely stitched. No horse.',
          'You’ve seen the plum riders, Majesty. So have I. They came through the canyon at night and robbed nobody. Most frightening thing I ever saw a raider do.',
          'We found this on a rock in the morning. No rider. No horse. No blood. A good bridle, set down neat, like somebody meant to come back.',
          'The Pack will stand with the tower against them. For a price, naturally. I’m frightened. Not reformed.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He is telling the truth about being frightened, Your Majesty. I would like to know what he is telling the truth about being paid.',
          },
        ],
        options: [
          {
            id: 'alliance',
            label: 'Ally with the Pack, on the Pack’s terms.',
            effects: {
              affinity: { jackalwire: 20, freeholds: -10 },
              strength: { jackalwire: 1 },
              flags: ['pack-alliance'],
            },
            response:
              'Vane spits in his palm and holds it out. In the canyon, that is a great honor.',
          },
          {
            id: 'truce',
            label: 'Ally with the Pack, if it stops raiding the Freeholds.',
            requires: { affinity: { jackalwire: 'neutral' } },
            effects: {
              affinity: { jackalwire: 10, freeholds: 5 },
              flags: ['pack-truce'],
            },
            response:
              'Vane winces like you asked for his coat. “For a season. Then we talk again.”',
          },
          {
            id: 'refuse',
            label: 'Refuse. The crown does not ally with raiders.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { 'old-houses': 2 },
            },
            response:
              'Vane bows. “Then I hope the plum riders feel the same about crowns.”',
          },
          {
            id: 'ask-price',
            label: 'Ask what “a price, naturally” means. Plain words.',
            effects: {},
            response:
              'Vane likes being asked. He sits on the dais step without permission.',
            next: 'price',
          },
          {
            id: 'ask-saffron',
            label: 'Let Saffron speak to her old captain.',
            requires: { follower: 'F002' },
            effects: {},
            response:
              'Saffron pushes up her goggles and steps out from the followers’ bench. Vane’s face changes.',
            next: 'saffron',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“Three things. The crown’s colours on my wagons, so the Freeholds stop shooting at them. The southern bridge toll, legal, under your seal. And when the plum riders come, the Pack fights in front and you pay for every rider who doesn’t come home.”',
              '“Or.” He leans in. His ear-chain jangles. “Keep a few of my pups in your tower this winter. Guests. Fed, warm, safe. Every captain in the canyon would know the Pack can’t turn on you while its children eat your bread.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'That is a hostage, Your Majesty, offered as a kindness. Or a kindness offered as a hostage. I cannot tell which. Neither can he.',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'If the Pack’s pups sleep in my Yard, Majesty, my Watch guards them. From the riders, or from their father?',
              },
            ],
            options: [
              {
                id: 'alliance',
                label: 'Give him everything he asks. Ally on the Pack’s terms.',
                effects: {
                  affinity: { jackalwire: 20, freeholds: -10 },
                  strength: { jackalwire: 1 },
                  flags: ['pack-alliance'],
                },
                response:
                  'Vane spits in his palm. He grins when you take it. By nightfall a Freehold reeve sends the court one sheet: a painted wagon with a crown on it, crossed out twice.',
              },
              {
                id: 'pups-as-guests',
                label:
                  'Take the pups as guests of the crown, and the alliance.',
                effects: {
                  affinity: { jackalwire: 5 },
                  local: { yard: -1, 'gate-watch': 2 },
                  strength: { jackalwire: 1 },
                  flags: ['d21-pack-pups-guests', 'pack-alliance'],
                },
                response:
                  'That evening six young Jackalwire recruits walk into the Yard in a line, each holding the coat hem of the one ahead. The cooks feed them. Vane does not watch them go in.',
              },
              {
                id: 'tincture-debt',
                label:
                  'Remind him who paid for his pups’ tincture your first morning. The Pack owes you.',
                requires: { flags: ['pack-medicine'] },
                effects: {
                  affinity: { jackalwire: -5, freeholds: 5 },
                  strength: { jackalwire: 1 },
                  flags: ['d21-tincture-debt-called', 'pack-alliance'],
                },
                response:
                  'Vane’s ears go flat. “So it was a loan,” he says. “I thought it was the other thing.” He agrees to everything. He does not spit in his palm.',
              },
              {
                id: 'camp-threat',
                label:
                  'Tell him the crown knows where the Pack’s camp sleeps. The Pack stands with you for nothing.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {
                  affinity: { jackalwire: -10, freeholds: 5 },
                  local: { 'gate-watch': 2 },
                  strength: { jackalwire: 1 },
                  flags: ['d21-pack-threatened', 'pack-alliance'],
                },
                response:
                  'Vane looks at you a long moment. “The one with the bandaged paw,” he says. “Of course.” He will stand with the tower, and never turn his back on it. The young informant with the bandaged paw stops coming to the postern gate.',
              },
              {
                id: 'refuse',
                label: 'Refuse. No colours, no toll, no pups. No alliance.',
                effects: {
                  affinity: { jackalwire: -10 },
                  local: { 'old-houses': 2 },
                },
                response:
                  'Vane buttons his coat to the throat. “Then the plum riders can have the canyon first, and you after.” He leaves the bridle on your step.',
              },
            ],
          },
          {
            id: 'saffron',
            lines: [
              {
                who: 'Captain Gristle Vane',
                npc: 'gristle-vane',
                text: '“Kett.” He says it like the town he grew up in. “Still fixing things for crowns?”',
              },
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: 'Still fixing what you break, Captain. Your coat’s buttoned. You only button it when you’re hiding something.',
              },
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: 'The plum riders robbed nobody, Majesty. Didn’t need to. They offered to carry the Pack’s sick pups to their own physicians. Two mothers said yes. That bridle is what came back.',
              },
              '“They were very polite,” Vane says to the floor. “White gloves. Nobody ever offered us a doctor.”',
            ],
            options: [
              {
                id: 'pups-back',
                label:
                  'Swear the alliance. Swear to ask the Black Verge for those two pups.',
                effects: {
                  affinity: { jackalwire: 10, 'black-verge': -5 },
                  strength: { jackalwire: 1 },
                  flags: ['d21-verge-pups-asked', 'pack-alliance'],
                },
                response:
                  'Vane unbuttons his coat. Against his chest a third pup sleeps, wheezing. “This one I wouldn’t give them.” Saffron pulls her goggles down and keeps them down.',
              },
              {
                id: 'alliance',
                label: 'Ally on the Pack’s terms. The pups are his affair.',
                effects: {
                  affinity: { jackalwire: 20, freeholds: -10 },
                  strength: { jackalwire: 1 },
                  flags: ['pack-alliance'],
                },
                response:
                  'Vane spits in his palm. Saffron watches you take it and says nothing. From Saffron, that is a speech.',
              },
              {
                id: 'truce',
                label:
                  'Ally if the Pack stops raiding the Freeholds. Frightened or not.',
                requires: { affinity: { jackalwire: 'neutral' } },
                effects: {
                  affinity: { jackalwire: 10, freeholds: 5 },
                  flags: ['pack-truce'],
                },
                response:
                  '“For a season,” Vane says. “Then we talk again.” On his way out he cuffs Saffron’s ear like a kid sister’s. She lets him.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse. The crown does not ally with raiders, frightened or not.',
                effects: {
                  affinity: { jackalwire: -10 },
                  local: { 'old-houses': 2 },
                },
                response:
                  'Vane bows, one arm across his coat. “Frightened or not,” he says. “Remember you said that.” Saffron shuts herself in the workshop until dark.',
              },
            ],
          },
        ],
      },
      {
        id: 'd21-fen-weir',
        title: 'The Weir at Mirefen',
        speaker: 'Coal Harrow, captain of the Mole sappers',
        faction: 'moles',
        lines: [
          'A sapper comes up the hall with a powder keg on his shoulder. “Empty,” he says, before the Watch can draw. He sets it on the step anyway. His paws are black to the elbow.',
          'Behind him two sappers carry a door between them. On the door: wet bedding, a kettle, a child’s shoe. Everything that came out of the north galleries before the water did.',
          'Coal Harrow. Captain of sappers. Granny Umber didn’t send me. She’d say it was rude to come. She’s right.',
          'The Mire Mothers built a weir across the fen outflow after the raiders came. Their water has to go somewhere. It went into our north galleries. Eleven families sleep on the stairs now.',
          'One keg opens that weir. I want the crown to look the other way while I light it. Or lend me the Watch’s powder and look straight at it. Your choice how brave you are.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A weir is property, Your Majesty. A keg is a declaration. The Mothers will remember who held the match. So will the Moles, if you take it from them.',
          },
        ],
        options: [
          {
            id: 'ask-weir',
            label: 'Ask why the Mothers raised a weir at all.',
            effects: {},
            response:
              'Coal Harrow wipes his paws on his trousers. It does not help.',
            next: 'weir',
          },
          {
            id: 'blow-weir',
            label: 'Lend him the powder. Open the weir tonight.',
            effects: {
              affinity: { moles: 10, 'mire-mothers': -15 },
              local: { 'gate-watch': -1 },
              flags: ['d21-weir-blown'],
            },
            response:
              'The bang comes after midnight and rattles the cups in the Yard. By morning the north galleries drain. A long brown tongue of fen water lies across the Freehold road. Coal Harrow sends back the empty keg. Somebody has chalked a crown on it.',
          },
          {
            id: 'forbid',
            label: 'Forbid it. Nobody blows a weir in the crown’s country.',
            effects: {
              affinity: { moles: -10 },
              local: { 'gate-watch': 1 },
              flags: ['d21-weir-forbidden'],
            },
            response:
              '“Then the crown can come sleep on our stairs,” Coal says. He picks up his keg. The sappers carry the door back out. Nobody picks up the shoe.',
          },
          {
            id: 'pumps',
            label:
              'Pay for hand pumps in the north galleries. Leave the weir alone.',
            requires: { cost: 25 },
            effects: {
              affinity: { moles: 5 },
              local: { yard: -1 },
              flags: ['d21-pumps-paid'],
            },
            response:
              'Twelve hand pumps go north on a cart. The sappers work them in shifts, day and night. Coal Harrow calls it the crown’s answer to a flood: buckets. He takes them.',
          },
          {
            id: 'free-umber',
            label:
              'Release Granny Umber tonight. Ask Coal to wait for her word on the weir.',
            requires: {
              flags: ['mole-messenger-arrested'],
              notFlags: ['d21-umber-released'],
            },
            effects: {
              affinity: { moles: 15 },
              local: { 'gate-watch': -2 },
              flags: ['d21-umber-released'],
            },
            response:
              'Granny Umber comes up out of the cells on her own feet and thanks nobody. She looks at the keg. Then at Coal. He carries it home full.',
          },
        ],
        beats: [
          {
            id: 'weir',
            lines: [
              '“Raiders burned two lantern-houses at the fen edge. The Mothers raised the weir the next week. Deep water, they said. Raiders don’t swim.”',
              '“That’s their story. Ask the reed-cutters, they’ll tell you different. They say the Mothers raised the water to keep something under it.” He shrugs. “They say that about everything.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Fens keep secrets the way ledgers do, Your Majesty. Drain one and you find out what it owed.',
              },
            ],
            options: [
              {
                id: 'share-water',
                label:
                  'Ask the Mothers to open the weir one night in seven, with the Watch on the bank.',
                effects: {
                  affinity: { moles: 5, 'mire-mothers': -5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d21-weir-shared'],
                },
                response:
                  'The Mothers agree in a letter written on reed paper. One night in seven the water goes down the old channel and the galleries breathe. The Watch on the bank hears singing under the water. Nobody writes that down.',
              },
              {
                id: 'order-open',
                label:
                  'The crown stopped the Old Houses’ wheels for the burrows. It opens the weir the same way: by order, in daylight.',
                requires: { flags: ['d17-race-closed'] },
                effects: {
                  affinity: { moles: 10, 'mire-mothers': -10 },
                  local: { lamplight: 1 },
                  flags: ['d21-weir-ordered-open'],
                },
                response:
                  'The order goes up on the gate at noon. The Mothers lift the weir themselves, slowly, so everyone can watch them do it. Coal Harrow leaves his keg in the Yard. He says the crown can keep it. He does not say thank you.',
              },
              {
                id: 'blow-weir',
                label: 'Lend him the powder. Whatever is down there can swim.',
                effects: {
                  affinity: { moles: 10, 'mire-mothers': -15 },
                  local: { 'gate-watch': -1 },
                  flags: ['d21-weir-blown'],
                },
                response:
                  'The bang comes after midnight. By morning the north galleries drain and the fen is a foot lower. The reed-cutters stay home that night. Coal Harrow sends back the empty keg with a chalk crown on it.',
              },
              {
                id: 'forbid',
                label:
                  'Forbid it. If the fen keeps something down, the weir stays.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 1 },
                  flags: ['d21-weir-forbidden'],
                },
                response:
                  '“Something,” Coal says. “We’ve got eleven somethings on the stairs.” He takes the keg and goes. Nobody picks up the shoe.',
              },
              {
                id: 'pumps',
                label: 'Buy pumps for the galleries. Nobody touches the weir.',
                requires: { cost: 25 },
                effects: {
                  affinity: { moles: 5 },
                  local: { yard: -1 },
                  flags: ['d21-pumps-paid'],
                },
                response:
                  'Twelve hand pumps go north on a cart. The sappers work them in shifts. Coal Harrow calls it the crown’s answer to a flood: buckets. He takes them.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 22,
    title: 'Bodies at the Ford',
    briefings: [
      {
        id: 'ford-bodies',
        source: 'Eastern Ford ferrymen',
        text: 'Three travellers were pulled from the Ford at dawn.',
        truth: true,
      },
      {
        id: 'mole-knives',
        source: 'Lady Vask’s steward',
        text: 'The travellers were killed with Mole digging knives.',
        truth: false,
        variants: [
          {
            flags: ['mole-messenger-arrested'],
            text: 'The travellers were killed with Mole digging knives. The steward says the crown should have kept the whole choir, not one old woman.',
          },
          {
            flags: ['mole-talks-opened'],
            text: 'The travellers were killed with Mole digging knives. The steward says this is what talks with the burrows buy.',
          },
        ],
      },
      {
        id: 'tokens',
        source: 'A ferry boy',
        text: 'Each of the dead wore a wooden token on a string.',
        truth: true,
      },
    ],
    komodo:
      'The Old Houses would blame the Moles for the weather if it helped, Your Majesty. Find out who those travellers were. Before the Moles learn they are blamed.',
    quests: ['q-d22-ford-bodies'],
    audiences: [
      {
        id: 'd22-blame',
        title: 'Justice for the Ford',
        speaker: 'Lady Ottoline Vask of the Old Houses',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        lines: [
          'Lady Vask arrives in mourning grey. It suits her. Behind her a steward carries a velvet cushion. On it lies a short hooked knife, a root-knife from the burrows.',
          'Three dead at the Ford, Majesty, and the burrow tunnels run under it. This was on the bank beside them. The Old Houses ask for justice. Meaning arrests.',
          'Justice delayed is only a longer funeral. The Moles were told the Ford would be argued in council. They argued in the river instead.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The ferrymen say the dead wore wooden tokens, Your Majesty. Lady Vask brought a knife. Somebody chose which to carry up the hill.',
          },
        ],
        options: [
          {
            id: 'blame',
            label: 'Arrest the revolutionary cell nearest the Ford.',
            effects: {
              affinity: { moles: -15 },
              local: { 'old-houses': 3 },
              flags: ['moles-blamed'],
            },
            response:
              'Lady Vask inclines her head. The Moles hear before the arrests are made.',
          },
          {
            id: 'evidence',
            label: 'Nobody is arrested until the court knows who died.',
            effects: { local: { 'old-houses': -2, lamplight: 1 } },
            response:
              '“How judicious,” says Lady Vask. She says it the way others say “how unfortunate.”',
          },
          {
            id: 'ask-knife',
            label: 'Ask to hold the knife.',
            effects: {},
            response:
              'The steward carries the cushion up the dais steps like a crown that isn’t his.',
            next: 'knife',
          },
          {
            id: 'ask-tokens',
            label: 'Ask about the wooden tokens on the dead.',
            effects: {},
            response:
              'Lady Vask sighs, like you asked about the weather at a funeral. Someone sends for the ferry boy.',
            next: 'tokens',
          },
        ],
        beats: [
          {
            id: 'knife',
            lines: [
              'The knife is heavy. Clean. Bright hinge. No soil in it anywhere, and a burrow-digger’s root-knife lives in soil like a spoon lives in soup.',
              'One side of the grip is filed smooth, a neat patch, right where a cutler stamps his mark.',
              '“A burrow cutler might own a clean knife,” says Lady Vask. “Even a thief washes up. And many knives are filed, Majesty. Thieves file them.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Say what you noticed, Your Majesty, and you make an enemy of the Old Houses a week before the war. Say nothing, and you make it true.',
              },
            ],
            options: [
              {
                id: 'show-court',
                label:
                  'Hold the knife up to the gallery. Ask whose mark was filed off.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'old-houses': -3, lamplight: 2 },
                  flags: ['d22-knife-shown'],
                },
                response:
                  'The gallery goes silent. Lady Vask taps her rings once on the steward’s shoulder. He leaves at a walk that is nearly a run. By evening two Old House families close their accounts with the crown’s tailor. That is how Houses declare a feud.',
              },
              {
                id: 'quiet-word',
                label:
                  'Return the knife to Lady Vask in private. Let the charge die.',
                effects: {
                  local: { 'old-houses': 2, lamplight: -2 },
                  flags: ['d22-knife-returned'],
                },
                response:
                  'Lady Vask takes the knife back with perfect grace. No arrests. Nobody asks who filed the grip. You have a friend in the Old Houses tonight, one who knows what you saw.',
              },
              {
                id: 'blame',
                label:
                  'Arrest the revolutionary cell anyway. A clean knife proves nothing.',
                effects: {
                  affinity: { moles: -15 },
                  local: { 'old-houses': 3 },
                  flags: ['moles-blamed'],
                },
                response:
                  'The steward carries the knife out on its cushion like a relic. The Moles hear of it before the arrests. They hear about the knife, too.',
              },
              {
                id: 'evidence',
                label:
                  'Keep the knife. Nobody is arrested until the court knows who died.',
                effects: { local: { 'old-houses': -2, lamplight: 1 } },
                response:
                  '“How judicious,” says Lady Vask. She leaves the cushion behind. The closest she has ever come to forgetting something.',
              },
              {
                id: 'ask-tokens',
                label:
                  'Set the knife down. Ask about the wooden tokens on the dead.',
                effects: {},
                response:
                  'Lady Vask’s rings stop tapping. Someone sends for the ferry boy.',
                next: 'tokens',
              },
            ],
          },
          {
            id: 'tokens',
            speaker: 'A ferry boy from the Eastern Ford',
            lines: [
              'The ferry boy is soaked to the knees and scared of the carpet. He holds out three wooden discs on wet string. Each bears one burned mark: a bell with no clapper.',
              '“They was round their necks, Majesty. All three. Double knots. Like they wanted somebody to know where they’d been.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'Abbey trinkets. The sisters hand them to anyone who takes a loaf. They mean the dead were poor. Nothing else.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Mission tokens, Your Majesty. The Abbey gives them to parents who visit. The sisters write down everyone who comes to their gate. I would ask the Abbey before I arrested a single Mole.',
              },
            ],
            options: [
              {
                id: 'ask-ash',
                label:
                  'Let Ash Quill see the tokens. Ash knows papers, and lies on string.',
                requires: { follower: 'F007' },
                effects: {},
                response:
                  'Ash takes the tokens from the ferry boy like they might still be warm.',
                next: 'ash',
              },
              {
                id: 'write-abbey',
                label: 'Write to the Abbey. Ask whose tokens these were.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { lamplight: 1 },
                  flags: ['d22-tokens-asked'],
                },
                response:
                  'The answer comes in two days, by a sister on foot: three parents who visited in the spring, sent home with bread. One asked to stay the night with her son and was told no. Parents do not stay. The sister cries reading it out.',
              },
              {
                id: 'bury-tokens',
                label:
                  'Bury the three with their tokens. The river’s business stays the river’s.',
                effects: {
                  local: { yard: 1, lamplight: -1 },
                  flags: ['d22-tokens-buried'],
                },
                response:
                  'They are buried above the Ford, tokens on their chests. The Yard sends bread. A decent thing. Komodo arranges it. He looks easier than he has all week.',
              },
              {
                id: 'evidence',
                label:
                  'Nobody is arrested until the court knows who these three were.',
                effects: { local: { 'old-houses': -2, lamplight: 1 } },
                response:
                  '“How judicious,” says Lady Vask. The ferry boy gets a honey-cake. He carries it all the way down the hill. Does not eat it.',
              },
              {
                id: 'blame',
                label:
                  'Trinkets are trinkets. Arrest the revolutionary cell nearest the Ford.',
                effects: {
                  affinity: { moles: -15 },
                  local: { 'old-houses': 3 },
                  flags: ['moles-blamed'],
                },
                response:
                  'Lady Vask inclines her head. The ferry boy looks at the tokens, then at you. He pockets them.',
              },
            ],
          },
          {
            id: 'ash',
            lines: [
              'Ash Quill turns the tokens over in small, ink-stained paws. The big ears go flat.',
              {
                who: 'Ash Quill',
                npc: 'F007',
                text: 'These are real, Majesty. I’ve forged a hundred to move families past checkpoints. Never got the burn this clean. The Abbey gives one to every parent who visits a child.',
              },
              {
                who: 'Ash Quill',
                npc: 'F007',
                text: 'It means “seen, and sent home.” These three walked to the mission road to see their children. The Abbey sent them home. That road doesn’t cross the Ford. So after the Abbey they went somewhere else. I’d like to know where.',
              },
              '“How tiresome,” says Lady Vask. For once she does not mean you.',
            ],
            options: [
              {
                id: 'copy-stamp',
                label:
                  'Have Ash copy the burn for the Archive before the tokens are buried.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { lamplight: 2 },
                  flags: ['d22-token-stamp-copied'],
                },
                response:
                  'Ash traces the clapperless bell three times. Then puts the pencil down and walks out without leave. Ash comes back an hour later, eyes red, the copy done.',
              },
              {
                id: 'evidence',
                label: 'Arrest nobody. Find out who these three came to visit.',
                effects: { local: { 'old-houses': -2, lamplight: 1 } },
                response:
                  '“How judicious,” says Lady Vask. Ash is already at the map table, one claw on the road home from the Abbey, then the road to the Ford. Different roads.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 23,
    title: 'The Blue Lantern',
    briefings: [
      {
        id: 'blue-lantern',
        source: 'The Ledger’s factor',
        text: 'A blue lantern moves along the old rail line every third night: smugglers.',
        truth: true,
      },
      {
        id: 'medicine-cheap',
        source: 'Freehold reeves',
        text: 'Medicine is suddenly cheap on the Freehold farms.',
        truth: true,
      },
      {
        id: 'lantern-ghost',
        source: 'A rail-yard child',
        text: 'The blue lantern is carried by a ghost with no feet.',
        truth: false,
      },
    ],
    komodo:
      'Ghosts do not lower the price of medicine, Your Majesty. Somebody is moving goods past the Ledger’s tolls. The Ledger is upset. That tells you about the tolls.',
    quests: ['q-d23-blue-lantern'],
    audiences: [
      {
        id: 'd23-smugglers',
        title: 'Smugglers on the Rail Line',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Factor Tallow sets a brown bottle on the arm of the throne before the herald finishes her name. Dust-lung tincture at half the Ledger’s price. No Ledger stamp.',
          'Someone is moving medicine past our tolls, Majesty. Theft. From the crown as much as the Ledger.',
          'License the route to the Ledger and the crown takes a fifth. Or shut it. It must not stay free.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'Half my cooks’ children stopped coughing this month, Majesty. I didn’t ask why. Don’t you ask either.',
          },
        ],
        options: [
          {
            id: 'license',
            label: 'License the route to the Ledger.',
            effects: {
              brass: 20,
              local: { ledger: 3 },
              affinity: { freeholds: -5 },
              flags: ['rail-route-licensed'],
            },
            response:
              'Factor Tallow produces a license. She had already drafted it.',
          },
          {
            id: 'free',
            label: 'Medicine should be cheap. Leave the route alone.',
            effects: {
              local: { ledger: -3, yard: 1 },
              affinity: { freeholds: 5 },
            },
            response: 'Factor Tallow writes something down in a different ink.',
          },
          {
            id: 'crown-seal',
            label:
              'You once bought a crate from Jinx Coupler. Tell Jinx the crown knows whose lantern it is, and would rather buy than hang.',
            requires: { flags: ['rustline-crate-bought'] },
            effects: {
              brass: 20,
              affinity: { rustline: 5 },
              local: { ledger: -1 },
              flags: ['d23-lantern-under-seal'],
            },
            response:
              'Jinx answers that night on a square of tin. A lantern, a crown, a handshake. Under it: “a fifth to you, same as the Ledger offered, and you never saw us.” Factor Tallow hears by breakfast. She says nothing. Worse.',
          },
          {
            id: 'ask-cargo',
            label: 'Ask the Factor what else rides the blue lantern line.',
            effects: {},
            response:
              'Factor Tallow smiles. She has waited all morning for this. She opens her case.',
            next: 'manifest',
          },
        ],
        beats: [
          {
            id: 'manifest',
            lines: [
              'Inside: a seized manifest, water-stained, its cipher cracked by the Ledger in an afternoon. Tincture for the Freehold farms. Lamp glass for the Rustline. Bandages for the Yard.',
              '“And every third night, twelve jars of poppy syrup to the Mission kitchen,” says Factor Tallow. “Twelve jars. Every third night. The Ledger doesn’t care who drinks it, Majesty. Only that nobody paid the toll.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'Twelve jars is a fever ward, Majesty. My sister nursed the Ford camps in the fever winter. Forty cots go through twelve jars in three nights, and that’s rationed. Shut the line and my Yard coughs again. Tax it and the farms can’t pay.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Charity that pays no toll is still trade, Your Majesty. I would want to know what else the Abbey does not pay for.',
              },
            ],
            options: [
              {
                id: 'seize-syrup',
                label:
                  'Leave the line free. Have the Watch seize anything addressed to the Mission.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { ledger: -2, 'gate-watch': 1 },
                  flags: ['d23-mission-syrup-seized'],
                },
                response:
                  'That night the Watch takes twelve jars off the lantern line. By morning the Abbess has written, asking after “the children’s medicine.” That night every Abbey window stays lit until dawn. It never has before.',
              },
              {
                id: 'copy-manifests',
                label:
                  'License the route, if the Ledger copies every manifest to the Archive.',
                effects: {
                  brass: 10,
                  affinity: { freeholds: -5 },
                  local: { ledger: 1, lamplight: 2 },
                  flags: ['d23-manifests-copied'],
                },
                response:
                  'Factor Tallow agrees fast. She expected worse. From tomorrow, Freehold medicine costs a fifth more. Every jar riding north to the Mission is written down twice, by clerks paid not to wonder.',
              },
              {
                id: 'license',
                label:
                  'License the route to the Ledger. What the Abbey buys is its affair.',
                effects: {
                  brass: 20,
                  local: { ledger: 3 },
                  affinity: { freeholds: -5 },
                  flags: ['rail-route-licensed'],
                },
                response:
                  'Factor Tallow produces a license, already drafted. The Mission’s twelve jars are on it, taxed at a fifth. All legal.',
              },
              {
                id: 'free',
                label:
                  'Leave the whole line alone, jars and all. Cheap medicine is cheap medicine.',
                effects: {
                  local: { ledger: -3, yard: 1 },
                  affinity: { freeholds: 5 },
                },
                response:
                  'Factor Tallow writes something in a different ink. Dunmore unfolds his arms. That night the blue lantern passes on the rail line, on time. Nobody stops it.',
              },
            ],
          },
        ],
      },
      {
        id: 'd23-yard-sisters',
        title: 'Bread from the Sisters',
        speaker: 'Wenna Coldbrook',
        faction: 'freeholds',
        requires: { flags: ['coldbrooks-in-yard'] },
        lines: [
          'Wenna Coldbrook has lived in the Yard since her farm burned. Flour on her sleeves, an oven burn on one wrist. Behind her stands Tam, nine, narrow and serious, holding an uneaten honey-cake.',
          'The sisters come to the Yard every evening now, Majesty. Bread for all, sweets for the little ones. When the baby took the fever, Sister Marrow sat up with her. All night. I slept. First time since the farm.',
          'Now Tam wants to see the Abbey’s lessons. Just to see. The sisters say he can come home whenever he likes. The Yard thinks I’m ungrateful for asking you. Maybe I am.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'The sisters’ bread fed the Yard all winter, Majesty. Shut them out and my people will ask who did it.',
          },
        ],
        options: [
          {
            id: 'bar-sisters',
            label: 'Bar the sisters from the Yard.',
            effects: {
              affinity: { abbey: -10, freeholds: 5 },
              local: { yard: -2 },
              flags: ['d23-sisters-barred'],
            },
            response:
              'The sisters stop coming. So does the bread. That night the Yard eats thin soup and looks at Wenna. She keeps her children in.',
          },
          {
            id: 'let-him-visit',
            label: 'Let the boy visit, with a guard who never leaves him.',
            effects: {
              affinity: { abbey: 5 },
              local: { 'gate-watch': -1 },
              flags: ['d23-tam-visited'],
            },
            response:
              'Tam comes back at dusk, full of bread, with a slate of letters in his own hand. His guard, a steady veteran guard, says the lessons were lessons. One door stayed locked. The sisters called it the fever ward. He heard coughing behind it.',
          },
          {
            id: 'keep-bread',
            label:
              'The sisters feed the Yard. Thank them. Let Wenna decide for herself.',
            effects: {
              affinity: { abbey: 5 },
              local: { yard: 1 },
              flags: ['d23-sisters-welcome'],
            },
            response:
              'Wenna nods. She expected nothing else from a throne. Back to the ovens. The next evening Sister Marrow brings Tam a slate and chalk and shows him his letters.',
          },
          {
            id: 'ask-tam',
            label: 'Ask Tam what the sisters promised him.',
            effects: {},
            response:
              'Wenna pushes the boy one step forward, the way you push a boat off a bank.',
            next: 'tam',
          },
          {
            id: 'bread-at-gate',
            label: 'Take the bread. Keep the sisters outside the Yard gate.',
            effects: {
              affinity: { abbey: -3 },
              local: { yard: -1 },
              flags: ['d23-bread-at-gate'],
            },
            response:
              'The baskets come to the gate. The sisters wait outside until the last one is empty. Tam watches them through the bars every evening, chin on the crossbar.',
          },
        ],
        beats: [
          {
            id: 'tam',
            speaker: 'Tam Coldbrook',
            lines: [
              'The boy talks to the carpet, fast. The voice children use for a secret they were told is a present.',
              '“There’s a room at the bottom where the sick ones sleep. Nobody coughs down there. They said I could carry the soup down. They said I have steady hands.”',
              '“Sister Marrow says I could learn to read the medicine labels. She says not many can.”',
              {
                who: 'Wenna Coldbrook',
                text: 'Steady hands. He spills everything, Majesty. Everything. And he wants to carry soup down a stair to sick children he’s never met.',
              },
              'Tam looks at his mother like she has said something unfair. She has not.',
            ],
            options: [
              {
                id: 'ask-teodor',
                label:
                  'Let Brother Teodor answer. He served soup in that Abbey six years.',
                requires: { follower: 'F012' },
                effects: {},
                response:
                  'Teodor rises from the bench slowly, like a man getting up to identify a body.',
                next: 'teodor',
              },
              {
                id: 'bar-sisters',
                label: 'Bar the sisters from the Yard. Tonight.',
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  local: { yard: -2 },
                  flags: ['d23-sisters-barred'],
                },
                response:
                  'The Watch turns the sisters and their baskets back at the Yard gate. Thin soup. Grumbling. Tam cries for an hour, furious, like he was robbed.',
              },
              {
                id: 'let-him-visit',
                label:
                  'Let him visit, guarded. The crown needs to know what that room is.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d23-tam-visited'],
                },
                response:
                  'Tam comes back at dusk, full of bread. He carried soup to the top of the stair. Not down it. “Next time,” he says, happy. Wenna sits up all night watching him sleep.',
              },
              {
                id: 'keep-bread',
                label:
                  'It is a child’s story. Thank the sisters for the bread.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { yard: 1 },
                  flags: ['d23-sisters-welcome'],
                },
                response:
                  'Wenna takes Tam’s hand and walks out without bowing. Next evening Sister Marrow asks after the baby’s fever. Wenna answers her. She can’t not.',
              },
              {
                id: 'bread-at-gate',
                label:
                  'The bread comes to the gate. The sisters, and their stairs, stay outside it.',
                effects: {
                  affinity: { abbey: -3 },
                  local: { yard: -1 },
                  flags: ['d23-bread-at-gate'],
                },
                response:
                  'The baskets come to the gate. The sisters wait outside until the last one is empty. Tam watches them through the bars, chin on the crossbar. He does not forgive you for a week.',
              },
            ],
          },
          {
            id: 'teodor',
            lines: [
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'Six years I served soup on the top three floors, Majesty. Never below the third. Sister Marrow kept that key on her counting cord. I asked once. She said “fever ward”, and that I had a family to think of. I did. There was fever that year. I buried two of ours myself.',
              },
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'Sick children went down. I never saw one come back up. I never stood at that door long enough to be sure. Both of those are true.',
              },
              'Wenna has gone white. Tam doesn’t understand. He is finally eating his honey-cake.',
            ],
            options: [
              {
                id: 'move-family',
                label:
                  'Move the Coldbrooks into the keep, behind the Watch, tonight.',
                requires: { cost: 10 },
                effects: {
                  affinity: { abbey: -5, freeholds: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d23-coldbrooks-in-keep'],
                },
                response:
                  'Wenna carries the baby up the keep stairs. Teodor carries Tam. In the morning Sister Marrow is at the keep gate with a jar of fever syrup for the baby. She leaves it with the Watch and goes.',
              },
              {
                id: 'bar-sisters',
                label: 'Bar the sisters from the Yard. Every one of them.',
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  local: { yard: -2 },
                  flags: ['d23-sisters-barred'],
                },
                response:
                  'The sisters are turned back. The bread stops. Teodor ladles the thin soup himself and makes the Yard laugh twice. He eats none of it.',
              },
              {
                id: 'keep-bread',
                label:
                  'Teodor buried fever children too. Keep the bread coming.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { yard: 1 },
                  flags: ['d23-sisters-welcome'],
                },
                response:
                  'Teodor bows and sits. The sisters come to the Yard that evening as usual. He serves beside them, eyes on Sister Marrow’s counting cord.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 24,
    title: 'The Mother’s Petition',
    briefings: [
      {
        id: 'missing-boy',
        source: 'Bett Ormond, a Freehold mother',
        text: 'Her son Dov walked toward the Abbey with a sister in grey three weeks ago. No letter in his hand since.',
        truth: true,
        variants: [
          {
            flags: ['abbey-took-coldbrook-children'],
            text: 'Her son Dov walked toward the Abbey with a sister in grey three weeks ago. No letter in his hand since. The Coldbrook children went up the same road.',
          },
        ],
      },
      {
        id: 'abbey-letters',
        source: 'A sister of the Abbey',
        text: 'Every child at the Abbey writes home on the first of the month.',
        truth: false,
      },
      {
        id: 'notices',
        source: 'Hollow Bell’s notice board',
        text: 'Hollow Bell’s notice board holds eleven notices for missing children.',
        truth: true,
      },
    ],
    komodo:
      'Eleven notices is a great many for one town, Your Majesty. I would accuse nobody. I would walk the road.',
    quests: [],
    audiences: [
      {
        id: 'd24-mothers-petition',
        title: 'The Mother’s Petition',
        speaker: 'Bett Ormond, a Freehold mother',
        faction: 'freeholds',
        lines: [
          'Bett Ormond walked two days from the Freeholds to reach the hall. Muddy boots. She holds a folded letter out in both hands, the way people carry what they can’t read. Hester Plowright stands behind her, hat in her fists.',
          'My boy Dov went to the Abbey with a sister in grey, Majesty. Lessons, they said. Three meals. He’d write home every month.',
          'He hasn’t written. They sent me this and said it came from him. They say he’s well. They won’t let me see him.',
          'I can’t read it, Majesty. I was hoping somebody here could.',
          {
            who: 'Hester Plowright',
            npc: 'hester-plowright',
            text: 'I sent eight orphans up that road after the spring raids, Majesty. I’ve seen five since. Fat, lettered, polite to me. I don’t know about the other three. Neither does Bett.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Abbey writes a good letter, Your Majesty. I have read several. They all say the same thing.',
          },
        ],
        options: [
          {
            id: 'search',
            label: 'Send someone to walk the mission road.',
            effects: {},
            response:
              'She does not thank you. She sits on the throne-room step and waits.',
            postsQuests: ['q-d24-mission-road'],
          },
          {
            id: 'ask-abbey',
            label: 'Write to the Abbess. Ask politely.',
            effects: {
              affinity: { abbey: 5 },
              flags: ['asked-abbey-politely'],
            },
            response:
              'The answer comes in three days, by a sister on foot: Dov is well and busy, and will write himself at midwinter, when he has his letters. Bett has it read to her twice.',
          },
          {
            id: 'read-letter',
            label:
              'Take the letter. Read it yourself before you read it to her.',
            effects: {},
            response:
              'She hands it over like it was warm. She watches your eyes move down the lines.',
            next: 'letter',
          },
        ],
        beats: [
          {
            id: 'letter',
            lines: [
              'A good letter. Good paper, fine hand. Dov is well, and happy, and busy with his lessons, and sends his mother a hundred kisses.',
              'It is also two letters. The fine hand wrote everything but the name. “Dov” was added after, in different ink, in a space too large for it.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A busy house uses forms, Your Majesty. So do the Ledger and the Watch. Efficient, not wicked.',
              },
              '“Is he well?” Bett asks. “Does it say he’s well?”',
            ],
            options: [
              {
                id: 'ask-pip',
                label: 'Let Pip look at the ink before you answer her.',
                requires: { follower: 'F005' },
                effects: {},
                response:
                  'Pip takes the letter by the edges, like it might bruise. They take every page that way.',
                next: 'pip',
              },
              {
                id: 'tell-her',
                label:
                  'Tell her the truth: it is a form, with her son’s name written in.',
                effects: {
                  affinity: { freeholds: 5, abbey: -5 },
                  flags: ['d24-form-letter-told'],
                },
                response:
                  'She listens without moving. Then she takes the letter back and folds it small. She is out the gate toward the mission road before anyone thinks to stop her.',
              },
              {
                id: 'read-kindly',
                label:
                  'Read it to her as written. Let her have the kind version tonight.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { lamplight: -1 },
                  flags: ['d24-letter-read-kindly'],
                },
                response:
                  'She cries with relief, kisses your hand, thanks the Abbey by name. Afterward Komodo calls it the kindest thing done in this hall all month. He means it.',
              },
              {
                id: 'search',
                label:
                  'Send someone to walk the mission road, with this letter in their pocket.',
                effects: {},
                response:
                  'You tell her the letter goes with them. She does not thank you. She sits on the step, unlaces her boots at last, and waits.',
                postsQuests: ['q-d24-mission-road'],
              },
              {
                id: 'ask-abbey',
                label: 'Write to the Abbess, politely. Ask after Dov by name.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['asked-abbey-politely'],
                },
                response:
                  'The answer comes in three days: Dov is well and busy. This time his name matches the ink.',
              },
            ],
          },
          {
            id: 'pip',
            lines: [
              'Pip holds the letter so close that their antennae brush the paper. A long silence. With Pip, that means certainty.',
              {
                who: 'Pip Thread',
                npc: 'F005',
                text: 'Oak-gall ink on the name, Majesty, gone brown. The letter is lamp-black. And I know this hand. Not the fine one. The one that wrote the name.',
              },
              {
                who: 'Pip Thread',
                npc: 'F005',
                text: 'It’s the hand that keeps Hollow Bell’s register of unclaimed children. I’ve read every page of that register. Some twice. One had been replaced.',
              },
              '“Who is Hollow Bell?” Bett asks. Pip looks at you.',
            ],
            options: [
              {
                id: 'pip-copy',
                label:
                  'Have Pip copy both hands into the Archive’s book, side by side.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d24-two-hands-copied'],
                },
                response:
                  'Pip copies name and letter in two columns. Underlines nothing. The mother waits on the step. When it is done she asks again: is he well?',
              },
              {
                id: 'search',
                label:
                  'Walk the mission road. Take Pip’s reading of the hand with you.',
                effects: {},
                response:
                  'Pip writes a note for the party in tiny careful script. The mother watches Pip write, like the note is her son. She does not thank you.',
                postsQuests: ['q-d24-mission-road'],
              },
              {
                id: 'tell-her',
                label: 'Tell her everything Pip just said.',
                effects: {
                  affinity: { freeholds: 5, abbey: -5 },
                  flags: ['d24-form-letter-told'],
                },
                response:
                  'She listens to all of it, nodding, like directions. Then she folds the letter small and walks out toward the mission road. Pip watches from the window until she is gone.',
              },
            ],
          },
        ],
      },
      {
        id: 'd24-coldbrook',
        title: 'Wenna Comes Back',
        speaker: 'Wenna Coldbrook',
        faction: 'freeholds',
        requires: { flags: ['abbey-took-coldbrook-children'] },
        lines: [
          'Wenna Coldbrook comes in, baby on her hip, a bundle under her arm tied with a child’s hair ribbon. Her hem is worn ragged on one side from walking to the Abbey gate and back.',
          'That Freehold woman. Shouting at your gate about her boy. Make her stop, Majesty. Please.',
          'Sister Marrow says the little ones cry for a week when a mother shouts at the gate. I’ve been to that gate four times. I was quiet four times. I’ll be quiet forty.',
          'They gave me this, last time. For being good.',
        ],
        options: [
          {
            id: 'go-with-her',
            label: 'Send someone with her anyway. Insist on seeing all three.',
            effects: {},
            response:
              'Wenna begs you not to. You send them anyway. She walks ten steps behind the party the whole way, the baby on her hip.',
            postsQuests: ['q-d24-coldbrook-visit'],
          },
          {
            id: 'trust',
            label: 'Do as she asks. The Abbey has its rules.',
            effects: {
              affinity: { abbey: 5, freeholds: -10 },
              flags: ['wenna-turned-away'],
            },
            response:
              'Wenna lets out a breath she has held since the farm. “Thank you.” She goes back to the gate the next week, quiet, as she promised. Hester Plowright hears what the crown told her and stops bowing to you.',
          },
          {
            id: 'ask-bundle',
            label: 'Ask what the sisters gave her.',
            effects: {},
            response:
              'Wenna kneels on the step, sets the baby down, and unties the ribbon carefully, so it won’t crease.',
            next: 'bundle',
          },
        ],
        beats: [
          {
            id: 'bundle',
            lines: [
              'Inside: three sets of children’s clothes, washed, pressed, folded square. The shoes paired on top.',
              '“They have grey robes now, the sister said. They won’t need these. Something to remember them by.”',
              '“That’s only how the sisters talk,” Wenna says. She says it again. “They’re nine, and six, and four. They’re fed. Where would I put them?”',
            ],
            options: [
              {
                id: 'ask-kiyo',
                label: 'Let Kiyo speak with her, one mother to another.',
                requires: { follower: 'F003' },
                effects: {},
                response:
                  'Kiyo comes down from the infirmary, kettle still in her hand. She sets it on the step without a sound.',
                next: 'kiyo',
              },
              {
                id: 'demand-return',
                label:
                  'Write to the Abbess: the Coldbrook children come home this month.',
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  flags: ['d24-coldbrooks-demanded'],
                },
                response:
                  'The Abbess replies in three days. The children may go home whenever their mother sends for them. Wenna does not send. “They’re fed,” she says. “Where would I put them?”',
              },
              {
                id: 'pay-wenna',
                label:
                  'Give Wenna brass for a new start. Tell her the Abbey feeds them better than she could.',
                requires: { cost: 15 },
                effects: {
                  affinity: { abbey: 5, freeholds: -5 },
                  flags: ['d24-wenna-paid'],
                },
                response:
                  'Wenna takes the purse. The baby needs it. She leaves the bundle on the throne-room step. It is still there on the seventh day, ribbon and all.',
              },
              {
                id: 'go-with-her',
                label:
                  'Overrule her. Send someone to stay at the gate until they see all three faces.',
                effects: {},
                response:
                  'Wenna ties the ribbon again, neatly, and does not look at you. She holds the baby tight. The only one she kept.',
                postsQuests: ['q-d24-coldbrook-visit'],
              },
              {
                id: 'trust',
                label: 'Do as she asks. Take the clothes home, Wenna.',
                effects: {
                  affinity: { abbey: 5, freeholds: -10 },
                  flags: ['wenna-turned-away'],
                },
                response:
                  'Wenna ties the ribbon and thanks you twice. On the way out she passes Bett Ormond on the step. Neither woman looks at the other.',
              },
              {
                id: 'quiet-watch',
                label:
                  'Do as she asks. Then post one Watch rider on the mission road, out of sight of the gate.',
                effects: {
                  local: { 'gate-watch': -1 },
                  flags: ['d24-quiet-watch'],
                  schedule: ['quiet-watch-report'],
                },
                response:
                  'Wenna goes home grateful. She never learns that a Watch rider sleeps in a ditch above the mission road with a spyglass and a cold supper.',
              },
            ],
          },
          {
            id: 'kiyo',
            lines: [
              'Kiyo kneels beside Wenna the way she kneels beside the wounded. She looks at the folded clothes a long time. Does not touch them.',
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'I nursed beside the Abbey’s sisters in the fever winter, Majesty, at the Ford camps. Nobody else would go. They sat with the dying and sang to them. I liked them. I still do.',
              },
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'Where I come from we fold clothes this way once. For a child who won’t come back to wear them. This is not my country. I am often wrong about it. But if she goes back to that gate, she should leave the baby.',
              },
              'Wenna looks down at the baby. Then up at you.',
            ],
            options: [
              {
                id: 'house-wenna',
                label:
                  'Keep Wenna and the baby in the fortress, behind the Watch, until this is understood.',
                requires: { cost: 10 },
                effects: {
                  affinity: { abbey: -5, freeholds: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d24-wenna-sheltered'],
                },
                response:
                  'Kiyo holds the baby while Wenna eats, and keeps it an hour. Wenna does not thank you. She asked you not to.',
              },
              {
                id: 'go-with-her',
                label:
                  'Send someone with her to the gate. The baby stays here, with Kiyo.',
                effects: {},
                response:
                  'Wenna hands the baby to Kiyo like her own heart, and goes. All afternoon Kiyo sings to it in a language nobody at court knows. She never stops.',
                postsQuests: ['q-d24-coldbrook-visit'],
              },
              {
                id: 'trust',
                label: 'Do as Wenna asks. The Abbey has its rules.',
                effects: {
                  affinity: { abbey: 5, freeholds: -10 },
                  flags: ['wenna-turned-away'],
                },
                response:
                  'Wenna gathers the bundle and the baby and thanks you. Kiyo watches the mission road from the infirmary window until its last lamp goes out.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 25,
    title: 'A Visitor from the Mission',
    briefings: [
      {
        id: 'abbess-coming',
        source: 'The Gate Watch',
        text: 'The Abbess is on the road to the fortress, on foot, with two sisters.',
        truth: true,
      },
      {
        id: 'abbey-census',
        source: 'Young Komodo’s own runner',
        text: 'The Abbey’s census lists every child by name. Every child is accounted for.',
        truth: false,
        komodoLie: true,
        hindsight:
          'He had seen the census because he wrote it. He copied last winter’s pages himself, for the sisters’ tired eyes.',
        variants: [
          {
            flags: ['d08-coldbrooks-recorded'],
            text: 'The Abbey’s census lists every child by name, the Coldbrooks among them. Every child is accounted for.',
          },
        ],
      },
      {
        id: 'abbess-gift',
        source: 'The kitchens',
        text: 'The Abbess sent a cartload of bread ahead for the Yard.',
        truth: true,
        variants: [
          {
            flags: ['d23-sisters-barred'],
            text: 'The Abbess sent a cartload of bread ahead for the Yard. The Yard’s cough came back the week the sisters stopped coming. Two of the cooks’ children are in the infirmary.',
          },
        ],
      },
    ],
    komodo:
      'I have seen the Abbey’s census myself, Your Majesty. Very thorough. A remarkable woman. I hope the court receives her warmly. We need friends who feed people.',
    quests: [],
    audiences: [
      {
        id: 'd25-the-abbess',
        title: 'A Visitor from the Mission',
        speaker: 'The Abbess',
        npc: 'the-abbess',
        faction: 'abbey',
        lines: abbessOpening([]),
        // What the court did to the Abbey this week, in her own mouth.
        variants: asideVariants(
          [
            [
              {
                flag: 'd23-mission-syrup-seized',
                line: 'Your Watch took our syrup off the rail line, Your Majesty. Our fever ward cried for three nights. I don’t blame you. Someone told you something.',
              },
            ],
            [
              {
                flag: 'asked-abbey-politely',
                line: 'And thank you for your letter about the Ormond boy. It was courteous. Not every court writes.',
              },
            ],
          ],
          abbessOpening,
        ),
        options: [
          {
            id: 'honor',
            label: 'Honor the Abbess before the court.',
            effects: {
              affinity: { abbey: 15 },
              local: { yard: 2 },
              flags: ['abbess-honored'],
            },
            response:
              'The Abbess accepts it with a short nod, like a receipt. The Yard cheers her bread. Komodo bows lower than he bows to you.',
          },
          {
            id: 'tracks',
            label: 'Ask her about the tracks on the mission road.',
            requires: { flags: ['mission-road-tracks'] },
            effects: {
              affinity: { abbey: -10 },
              local: { lamplight: 2 },
              flags: ['abbess-questioned'],
            },
            response:
              '“Children walk up that road every week, Your Majesty. Most walk down it again, to farms that need hands. We sweep it because they track mud into the chapel.” Captain Dunmark writes that down.',
          },
          {
            id: 'cots',
            label:
              'Ask her why the youngest Coldbrook was kept from his mother.',
            requires: { flags: ['abbey-cots-empty'] },
            effects: {
              affinity: { abbey: -15, freeholds: 5 },
              flags: ['abbess-questioned', 'abbess-warned'],
            },
            response:
              'The Abbess does not smile. “Because he has the fever, and his mother would carry him home, and he would die on her road. I have buried children who went home too soon, Your Majesty. You have not.”',
          },
          {
            id: 'tax',
            label: 'The Abbey has never paid the crown’s tithe. It will now.',
            effects: {
              brass: 30,
              affinity: { abbey: -15 },
              local: { yard: -2 },
            },
            response:
              'She pays from a plain purse, counts it twice and asks for a receipt. “The bread was our tithe, Your Majesty. Now it is brass.” The baskets stop coming up the hill.',
          },
          {
            id: 'wenna-named',
            label:
              'Tell her Wenna Coldbrook asked the crown to stay away from her children.',
            requires: { flags: ['wenna-turned-away'] },
            effects: {
              affinity: { abbey: -5 },
              flags: ['d25-wenna-named'],
            },
            response:
              'The Abbess’s face eases. “She comes to us every week now. Sits with them an hour. Since she stopped shouting we have never once turned her away.” She says it to the whole hall.',
          },
          {
            id: 'ask-census',
            label: 'Ask to see the census Komodo spoke of this morning.',
            effects: {},
            response:
              'The Abbess turns to Komodo, delighted. A grandmother whose grandchild got named in the sermon.',
            next: 'census',
          },
          {
            id: 'ask-wants',
            label:
              'Ask what she wants, since she walked so far to ask nothing.',
            effects: {},
            response:
              'The Abbess laughs, small and warm, and folds her hands. “You are kind to wonder.”',
            next: 'offer',
          },
          {
            id: 'teodor',
            label: 'Let Brother Teodor greet his old Abbess.',
            requires: { follower: 'F012' },
            effects: { flags: ['talk-teodor-letters'] },
            response:
              'Teodor comes forward, hands folded. The Abbess’s face opens like a window.',
            next: 'teodor',
          },
          {
            // t-043: the crown copied the hill's plans first on Day 14.
            id: 'ask-hill',
            label:
              'Ask why one of her sisters came to the Archive for the plans of what stood on the Abbey’s hill.',
            requires: { flags: ['d14-abbey-maps-first'] },
            effects: {},
            response:
              'The Abbess stops smiling. She does not frown. Her face simply has nothing on it for a moment.',
            next: 'hill',
          },
        ],
        beats: [
          {
            id: 'hill',
            lines: [
              '“Because it is still standing, Your Majesty. Underneath.”',
              '“Old houses keep their cellars. We keep ours swept. There is a stair down there we closed before your grandmother was born. A sister wanted to be sure the plans showed it closed. They do not. Plans are old.”',
              '“You have them now. Locked away, I hear. Keep them locked. Some stairs are safer on paper than in anyone’s head.”',
              {
                who: 'Keeper Abelard Vellum',
                npc: 'abelard-vellum',
                text: 'The plan shows a stair from the old well to the lowest room, Majesty. It shows no door at the bottom. I looked twice.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Every hill has old foundations, Your Majesty. A gift returned costs nothing and buys a great deal.',
              },
            ],
            options: [
              {
                id: 'return-plans',
                label:
                  'Give her the plans back. A crown should not keep another house’s cellars.',
                effects: {
                  affinity: { abbey: 10 },
                  local: { lamplight: -2 },
                  flags: ['d25-hill-plans-returned'],
                },
                response:
                  'Keeper Vellum brings the case himself and puts it in her hands. He does not let go at once. The Abbess thanks him by name. On the road home a sister carries the case. Nobody else touches it.',
              },
              {
                id: 'keep-plans',
                label:
                  'Keep them locked in the Archive. The crown reads its own maps.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { lamplight: 1 },
                  flags: ['d25-hill-plans-kept'],
                },
                response:
                  '“Of course,” says the Abbess. “Read them often. Paper keeps better when someone reads it.” That week the Archive’s night porter is offered a better post in the Abbey kitchens. He declines. He tells Vellum. Vellum changes the lock.',
              },
              {
                id: 'honor',
                label: 'Let the stair be. Honor the Abbess before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess inclines her head. The Yard cheers her bread. Keeper Vellum goes back to the Archive before the cheering ends.',
              },
              {
                id: 'ask-wants',
                label: 'Leave the stair. Ask what she walked here for.',
                effects: {},
                response:
                  'The Abbess finds her smile again where she left it. “Yes. That.”',
                next: 'offer',
              },
            ],
          },
          {
            id: 'census',
            lines: [
              '“Our census? Young Komodo has been a help to us. He copied last winter’s pages himself, when our sisters’ eyes were tired. Every child, by name.”',
              '“You are welcome to read it, Your Majesty. It lives at the Abbey. Paper travels badly.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Last winter, Your Majesty, before your crowning. They were short of clerks and I was short of brass. I should have mentioned it.',
              },
              'He does not look at the Abbess. She does not look at him.',
            ],
            options: [
              {
                id: 'ask-number',
                label: 'Ask Komodo how many names he copied.',
                effects: {},
                response:
                  'Komodo looks up, surprised. An odd thing to ask a clerk.',
                next: 'komodo',
              },
              {
                id: 'send-clerk',
                label:
                  'Accept. The crown will send a clerk to the Abbey to read it.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { lamplight: 1 },
                  flags: ['d25-census-clerk'],
                  schedule: ['census-clerk-report'],
                },
                response:
                  '“Send whoever you like,” says the Abbess. “Come yourself. Mind the third stair. It’s loose. I keep meaning to have it seen to.”',
              },
              {
                id: 'honor',
                label:
                  'Thank her for her openness. Honor her before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess thanks the court for its trust. The Yard cheers her bread. Komodo bows lower than he bows to you.',
              },
              {
                id: 'tax',
                label:
                  'A house that keeps such good records can pay the crown’s tithe.',
                effects: {
                  brass: 30,
                  affinity: { abbey: -15 },
                  local: { yard: -2 },
                },
                response:
                  'The Abbess pays from a plain purse and counts it twice. “Write that in your census too,” she tells Komodo. The bread baskets stop coming up the hill.',
              },
              {
                id: 'ask-wants',
                label: 'Leave the census. Ask what she walked here for.',
                effects: {},
                response:
                  'The Abbess folds her hands. “I hoped you would ask.”',
                next: 'offer',
              },
            ],
          },
          {
            id: 'komodo',
            speaker: 'Young Komodo',
            npc: 'young-komodo',
            lines: [
              '“How many? A great many, Your Majesty. Two hundred and twelve, last winter.”',
              'The Abbess does not correct him.',
              {
                who: 'The Abbess',
                npc: 'the-abbess',
                text: 'Fewer this winter. Many go on to farms that need hands. Some go home. Some we bury. We write them all down.',
              },
              'Two hundred and twelve names. On the eighth day of your reign a sister told this court the Abbey had forty empty beds. Captain Dunmark does the sum on his fingers.',
            ],
            options: [
              {
                id: 'note-it',
                label:
                  'Thank Komodo. Have the Archive write down his words exactly.',
                effects: {
                  local: { lamplight: 2 },
                  flags: ['d25-komodo-census-noted'],
                },
                response:
                  'Komodo watches the scribe’s pen with polite interest. “I am flattered to be recorded.” All evening he is kind to you. He fills your cup himself.',
              },
              {
                id: 'trust-komodo',
                label:
                  'Thank him for helping the mission. The crown is lucky in its friends.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['d25-komodo-trusted'],
                },
                response:
                  '“The crown is kind,” says Komodo, and bows. On her way out the Abbess pats his arm once, the way you pat a horse that pulled well.',
              },
              {
                id: 'honor',
                label:
                  'Say nothing of numbers. Honor the Abbess before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess inclines her head. The Yard cheers her bread. Komodo bows and stays down a long time.',
              },
              {
                id: 'ask-wants',
                label:
                  'Let the number lie for now. Ask what she walked here for.',
                effects: {},
                response: 'The Abbess turns from Komodo to you. “Yes. That.”',
                next: 'offer',
              },
            ],
          },
          {
            id: 'offer',
            lines: [
              '“Then let me ask one thing after all.”',
              '“The map room says war is coming. War makes orphans the way rain makes mud. The Yard cannot feed them, though your Foreman will not say so. The Abbey can.”',
              '“One page, in your own hand. Any child without a parent may come to the Abbey, and nobody may stop them on the road. That is all.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'She’s right, Majesty. I can’t feed what’s coming. I’ve been trying to work out how to tell you.',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“Nobody may stop them on the road.” My Watch stops everything on the road, Majesty. That’s what it’s for. Why does one kind of traveller need a letter?',
              },
            ],
            options: [
              {
                id: 'sign-writ',
                label:
                  'Sign the writ. Children should not starve over a suspicion.',
                effects: {
                  affinity: { abbey: 10 },
                  local: { yard: 2, 'gate-watch': -2 },
                  flags: ['d25-orphan-writ'],
                },
                response:
                  'The Abbess folds your page into her sleeve like a handkerchief. That night the Yard bakes with her flour and sings. Captain Dunmark takes the night watch himself, facing the mission road.',
              },
              {
                id: 'writ-with-visits',
                label:
                  'Sign it, with a clause: any kin may visit any child, any hour, unannounced.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { yard: 1, lamplight: 1 },
                  flags: ['d25-orphan-writ', 'd25-visiting-clause'],
                  schedule: ['midnight-visit'],
                },
                response:
                  '“Any hour,” the Abbess agrees, and signs under you. She does not argue the clause at all. That is what Dunmark cannot stop thinking about.',
              },
              {
                id: 'refuse-writ',
                label: 'No writ. The crown will feed its own orphans, somehow.',
                requires: { cost: 20 },
                effects: {
                  affinity: { abbey: -10 },
                  local: { yard: -1, 'gate-watch': 1 },
                  flags: ['d25-orphans-kept'],
                  schedule: ['war-orphans'],
                },
                response:
                  '“Somehow,” the Abbess repeats, like a word a child made up. She leaves the bread anyway. The Yard eats it. By morning winter porridge is dearer on the Ledger’s board.',
              },
              {
                id: 'honor',
                label:
                  'Make no promises. Honor her before the court and leave it there.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess smiles. “Another time,” she says, like you agreed. She leaves the bread.',
              },
              {
                id: 'tax',
                label:
                  'Answer with your own request: the Abbey pays the crown’s tithe from today.',
                effects: {
                  brass: 30,
                  affinity: { abbey: -15 },
                  local: { yard: -2 },
                },
                response:
                  'She counts the brass out on the dais step. “The orphans will still come,” she says. “The bread will not.”',
              },
            ],
          },
          {
            id: 'teodor',
            lines: [
              '“Teodor. My dear. Your letters are such a comfort to an old woman. So beautiful about the court. Every week, without fail.”',
              'The hall goes still. Teodor’s round ears flatten.',
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'I told her about the soup, Majesty. Who ate, who was sick, which families slept in the Yard. How many beds.',
              },
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'I told myself it was harmless. It’s always harmless, every week, until you count the weeks.',
              },
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'He wrote that my cooks’ children were coughing, Majesty. The next week the sisters brought syrup to my door. I’ve wondered since who to thank.',
              },
            ],
            options: [
              {
                id: 'teodor-turned',
                label:
                  'Say nothing now. Tonight, tell Teodor to keep writing, and what to write.',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['d25-teodor-turned'],
                },
                response:
                  'You thank the Abbess for her kindness to your follower. That night Teodor sits in the Yard with your pen and a letter you dictated. He looks like a man told to set a small fire in his own house.',
              },
              {
                id: 'teodor-stops',
                label:
                  'Tell the Abbess, before the court, that Teodor’s letters end today.',
                effects: {
                  affinity: { abbey: -10 },
                  flags: ['d25-teodor-letters-stopped'],
                },
                response:
                  '“Of course,” says the Abbess. Then, softly, to Teodor: “You will be missed.” Teodor sits on the bench until dark. Relieved or not, nobody can tell.',
              },
              {
                id: 'honor',
                label: 'Let it pass. Honor the Abbess before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess squeezes Teodor’s hand on her way out. That week Teodor writes his letter as usual, and shows it to you first, unasked.',
              },
              {
                id: 'ask-wants',
                label:
                  'Leave the letters. Ask the Abbess what she walked here for.',
                effects: {},
                response:
                  'Teodor sits. The Abbess watches him do it, then turns to you.',
                next: 'offer',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 26,
    title: 'A Friendly Raid',
    briefings: [
      {
        id: 'vane-dead',
        source: 'A gleeful Old House cousin',
        text: 'Gristle Vane was killed by his own lieutenants last night.',
        truth: false,
      },
      {
        id: 'dry-well',
        source: 'Jackalwire runners',
        text: 'The dry-well jackals are raiding Freehold farms. They take people, not goats.',
        truth: true,
      },
      {
        id: 'mole-truce',
        source: 'Granny Umber’s cell',
        text: 'The revolutionary cells will talk truce, if the crown meant its talks.',
        truth: true,
        variants: [
          {
            flags: ['mole-messenger-arrested'],
            notFlags: ['d21-umber-released'],
            source: 'Chalk on the postern gate',
            text: 'No truce while the crown holds the old woman it took at the gate.',
          },
          {
            flags: ['moles-blamed'],
            text: 'The revolutionary cells will talk truce, if the crown meant its talks. First they want back the cell it took at the Ford.',
          },
        ],
      },
    ],
    komodo:
      'Vane will die old in bed, Your Majesty, out of spite. The dry-well jackals are another thing. Nobody bargains with them.',
    // Bett Ormond, two days after the crown read her letter.
    komodoVariants: [
      {
        flags: ['d24-form-letter-told'],
        text: 'Vane will die old in bed, Your Majesty, out of spite. The dry-well jackals are another thing. And the Freehold mother sleeps at the mission-road well now. The sisters bring her soup. She takes it.',
      },
      {
        flags: ['d24-letter-read-kindly'],
        text: 'Vane will die old in bed, Your Majesty, out of spite. The dry-well jackals are another thing. And the Freehold mother went home singing. Her reeve says she has the letter by heart.',
      },
    ],
    quests: [],
    audiences: [
      {
        id: 'd26-friendly-raid',
        title: 'A Friendly Raid',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'Vane does not swagger in today. Bandaged forearm. Two wagons fewer than last week. The look of a raider offended professionally.',
          'The dry-well jackals take people, Majesty. Not goats. Even raiders have rules. A goat you sell back. A person you ransom. These do neither.',
          'Help the Pack clear them out. I’ll ride in front. You stand at the back and look imperial.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'If they neither sell nor ransom what they take, Your Majesty, somebody is collecting it. I would want to know who before I burned the road there.',
          },
        ],
        options: [
          {
            id: 'help',
            label: 'Ride with the Pack against the dry well.',
            effects: {},
            response:
              'Vane grins with every tooth. “Bring your heaviest. Somebody they’ll have to walk around.”',
            postsQuests: ['q-d26-dry-well'],
          },
          {
            id: 'decline',
            label: 'Refuse. The Pack can handle its own kind.',
            effects: { affinity: { jackalwire: -10 } },
            response: '“Our own kind,” Vane repeats. He does not smile.',
          },
          {
            id: 'ask-where',
            label: 'Ask where the dry-well jackals take the people they catch.',
            effects: {},
            response:
              'Vane goes quiet. The ear-chain stops jangling. He brings a folded sack out of his coat.',
            next: 'where',
          },
          {
            id: 'help-mags',
            label: 'Ride with the Pack. Promise Mags Ironhide at the front.',
            requires: { follower: 'F013' },
            effects: { affinity: { jackalwire: 5 } },
            response:
              'Vane grins with every tooth. “The big one. The Watch veteran. I hoped you’d say her name.”',
            postsQuests: ['q-d26-dry-well'],
          },
        ],
        beats: [
          {
            id: 'where',
            lines: [
              '“North,” says Vane. “That’s what keeps me up. They walk them north, roped at the wrist. Three days later they come back with nobody, bellies full.”',
              '“We caught one last month. He had this. Good white flour. Nobody in the canyon’s seen that in years.”',
              'He shakes the sack out on the step. No stamp. White dust on the carpet. “Who mills white?” He counts on his claws. “The Abbey. Hollow Bell. The Ledger’s mill at the Ford. I’ve blamed all three, on different nights.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Clear the dry well and you close the road, Your Majesty. Follow it and you learn where it goes. Only one helps those already roped on it. I cannot say which.',
              },
            ],
            options: [
              {
                id: 'follow',
                label:
                  'Do not clear the well yet. Let them run. Have the Watch follow.',
                effects: {
                  affinity: { jackalwire: -5, freeholds: -5 },
                  local: { 'gate-watch': 1, lamplight: 1 },
                  flags: ['d26-dry-well-followed'],
                  schedule: ['dry-well-watch'],
                },
                response:
                  'Vane stares. “You’d let them take more,” he says, “to see where they go.” He laughs. No pleasure in it. “And they call us the raiders.” At dusk the Watch rides out. Orders: do not interfere, whatever they see.',
              },
              {
                id: 'help',
                label:
                  'Ride with the Pack. Bring every sack like this one back to court.',
                effects: {},
                response:
                  'Vane grins with every tooth and folds the sack away like a letter. “Bring your heaviest. And a cart for flour.”',
                postsQuests: ['q-d26-dry-well'],
              },
              {
                id: 'decline',
                label:
                  'Refuse. The Pack can handle its own kind. Nothing proves anything north.',
                effects: { affinity: { jackalwire: -10 } },
                response:
                  '“Our own kind,” Vane repeats. He leaves the sack on the step. At evening a kitchen child takes it to keep bread in.',
              },
              {
                id: 'help-mags',
                label:
                  'Ride with the Pack. Mags Ironhide goes in front. Bring back every sack.',
                requires: { follower: 'F013' },
                effects: { affinity: { jackalwire: 5 } },
                response:
                  'Vane folds the sack away like a letter. “The Watch veteran. Good. They can walk around her, if they can find the end of her.”',
                postsQuests: ['q-d26-dry-well'],
              },
            ],
          },
        ],
      },
      {
        id: 'd26-mole-truce',
        title: 'A Genuine Truce',
        speaker: 'Keel Understone, surveyor of the revolutionary cells',
        faction: 'moles',
        requires: {
          flags: ['mole-talks-opened'],
          affinity: { moles: 'wary' },
        },
        lines: [
          'The burrow cells send a surveyor with tunnel dust on their coat, a brass lantern held high, and a chain on one shoulder. Keel Understone unrolls a map across the step before anyone offers a chair.',
          'Granny Umber sent me. Your talks were real, so the cells meet you halfway. Water rights for the burrows. The cells stand down.',
          'I came to see if the crown keeps its word. If it does, I’d work for it. Against the witches, anyway.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Water rights are forever, Your Majesty. Truces last a season. At least make the season long.',
          },
        ],
        options: [
          {
            id: 'truce',
            label: 'Grant the burrows their water rights.',
            effects: {
              affinity: { moles: 20 },
              local: { 'old-houses': -3 },
              strength: { moles: 1 },
              recruitable: ['F009'],
              flags: ['mole-truce'],
            },
            response:
              'Keel nods once, the way surveyors nod at a wall that will hold. “Then I’ll stay a while.”',
          },
          {
            id: 'half',
            label: 'Half the water now, the rest next season.',
            effects: {
              affinity: { moles: 5 },
              flags: ['mole-half-truce'],
            },
            response:
              '“Half a wall,” says Keel, “is a good way to get wet.” They leave.',
          },
          {
            id: 'ask-survey',
            label: 'Ask Keel what the map shows.',
            effects: {},
            response:
              'Keel taps the map twice with the chain. That is how surveyors clear their throats.',
            next: 'survey',
          },
          {
            id: 'apology',
            label:
              'Apologise for the revolutionary cell the crown arrested at the Ford.',
            requires: { flags: ['moles-blamed'] },
            effects: {},
            response:
              'Keel goes still. They weigh whether it is worth speaking.',
            next: 'apology',
          },
        ],
        beats: [
          {
            id: 'survey',
            lines: [
              '“Two things. Here: the Old Houses dug a new cistern this spring. Fill it, the water table drops, and the burrow nurseries flood. That’s what the manifesto meant. Your court never read it that way.”',
              '“And here.” The chain moves north. “Under the Ford, a tunnel none of ours dug. Brick-lined. Older than your tower. Running toward the mission road. My crew went in forty paces. Came out. Wouldn’t go back. Wouldn’t say why.”',
              '“Neither would I. I’m not a coward. I’m a surveyor. Surveyors know when a wall is wrong.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Old drains, Your Majesty. The wasteland is full of them. Sign for the water. Leave the bricks to the rats.',
              },
            ],
            options: [
              {
                id: 'map-tunnel',
                label:
                  'No treaty yet. Ask Keel’s crew to go back and map the brick tunnel.',
                effects: {
                  affinity: { moles: -5 },
                  local: { lamplight: 2 },
                  flags: ['d26-brick-tunnel-mapped'],
                },
                response:
                  'Keel rolls up the map. “Danger first, then. Water later.” They go without goodbye. Three days later the map comes. It ends forty paces in, at a door, in careful ink.',
              },
              {
                id: 'truce',
                label: 'Grant the burrows their water rights, cistern and all.',
                effects: {
                  affinity: { moles: 20 },
                  local: { 'old-houses': -3 },
                  strength: { moles: 1 },
                  recruitable: ['F009'],
                  flags: ['mole-truce'],
                },
                response:
                  'Keel nods once, the way surveyors nod at a wall that will hold. “Then I’ll stay a while. And I’ll watch those bricks for you.”',
              },
              {
                id: 'half',
                label: 'Half the water now. The rest when the war is done.',
                effects: {
                  affinity: { moles: 5 },
                  flags: ['mole-half-truce'],
                },
                response:
                  '“Half a wall,” says Keel, “is a good way to get wet.” They roll up the map, brick tunnel and all.',
              },
            ],
          },
          {
            id: 'apology',
            lines: [
              '“The cell you arrested were my cousins,” says Keel. “They’re out now. One doesn’t talk any more. Granny says an apology costs nothing.”',
              '“I say it costs what you make it cost. So. What does it cost?”',
            ],
            options: [
              {
                id: 'reparations',
                label:
                  'Pay the cousins’ families for every day in the crown’s cells.',
                requires: { cost: 20 },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -2 },
                  flags: ['d26-ford-reparations'],
                },
                response:
                  'Keel counts the brass twice into a pouch that isn’t theirs to keep. “That’s for them. Now we talk water.” They unroll the map again.',
                next: 'survey',
              },
              {
                id: 'truce',
                label:
                  'Grant the water rights. That is what the apology costs.',
                effects: {
                  affinity: { moles: 20 },
                  local: { 'old-houses': -3 },
                  strength: { moles: 1 },
                  recruitable: ['F009'],
                  flags: ['mole-truce'],
                },
                response:
                  'Keel nods once. “Then I’ll stay a while. My cousin will want to meet you. He won’t say anything. That’s how you’ll know he means it.”',
              },
              {
                id: 'half',
                label:
                  'Half the water now. The crown has apologised. It has not surrendered.',
                effects: {
                  affinity: { moles: 5 },
                  flags: ['mole-half-truce'],
                },
                response:
                  '“Half an apology,” says Keel, “to go with half a wall.” They leave with the map.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 27,
    title: 'The Trial of Flint',
    briefings: [
      {
        id: 'flint-accused',
        source: 'The Old Houses',
        text: 'The Old Houses accuse Duchess Flint of passing crown grain to the Moles.',
        truth: true,
      },
      {
        id: 'flint-confessed',
        source: 'An Old House steward',
        text: 'Duchess Flint has already confessed.',
        truth: false,
      },
      {
        id: 'grain-sold',
        source: 'The Lamplight Archive',
        text: 'Someone sold grain to the Mole burrows at three times market price.',
        truth: true,
      },
    ],
    komodo:
      'Flint would be boiled before she confessed to a thing she did not do, Your Majesty. Grain at three times the price is not charity. Somebody profited. Not Flint.',
    quests: [],
    audiences: [
      {
        id: 'd27-trial',
        title: 'The Trial of Flint',
        speaker: 'Lady Ottoline Vask and Duchess Flint',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        requires: { follower: 'F004' },
        lines: [
          'The court has never held a trial. It shows. The Old Houses fill the gallery in their best coats. Lady Vask stands below the dais with ledger copies in black ribbon. Beside her, slow as always, Duchess Flint: shawl on her shoulders, signet ring turned inward.',
          'The Old Houses accuse your follower of theft from the crown, Majesty. Grain, to the Moles. We ask judgment.',
          'Foreman Dunmore Ash stands beside Lady Vask. He does not like the company. He came anyway.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'Forty sacks went down a flooded burrow, Majesty. Out of the crown store. Out of my Yard’s winter. My cooks’ children ate soup water that month. I’m not with the Houses. I’m with the soup.',
          },
          'Flint says nothing in her own defense. Only: “Read the ledgers.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Decide today, Your Majesty, whatever you decide. A trial that runs into the war will be decided by the war.',
          },
        ],
        options: [
          {
            id: 'acquit',
            label: 'Acquit her on her word.',
            effects: {
              local: { 'old-houses': -4 },
              affinity: { moles: 5 },
              flags: ['flint-acquitted'],
            },
            response: 'Flint bows slowly. Lady Vask does not.',
          },
          {
            id: 'investigate',
            label: 'Read the ledgers first.',
            effects: {},
            response:
              '“Good,” says Flint. It is the most she has said all day.',
            postsQuests: ['q-d27-flint-evidence'],
          },
          {
            id: 'censure',
            label: 'Censure her. The Yard went hungry for that grain.',
            effects: {
              local: { 'old-houses': 4, yard: 1 },
              flags: ['flint-censured'],
            },
            response:
              'Flint takes the censure without a word. Dunmore nods once and leaves before Lady Vask can thank him. The barracks remember it.',
          },
          {
            id: 'ask-flint',
            label: 'Ask Flint plainly why she will not defend herself.',
            requires: { follower: 'F004' },
            effects: {},
            response:
              'Flint turns her head toward you. It takes a while. The gallery waits.',
            next: 'silence',
          },
          {
            id: 'ask-levy',
            label: 'Ask Lady Vask if this is about the war levy.',
            requires: { flags: ['levy-houses'] },
            effects: {},
            response:
              'Lady Vask smiles for the first time today. You have finally said something worth her rings.',
            next: 'levy',
          },
        ],
        beats: [
          {
            id: 'silence',
            lines: [
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: 'If I explain what I did, Majesty, I must say who I did it for. Then the Houses will know where to look.',
              },
              'She lets out a long breath. She weighs each word before it leaves her mouth.',
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: 'I did give grain to the Moles. My own ration, forty days of it, to a burrow nursery the Ford flooded. That’s why my shawl hangs loose. That grain was mine to starve on.',
              },
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: 'The rest that went down those tunnels was sold at three times the price. Not by me. I was learning by whom. I had nearly learned it.',
              },
              'Lady Vask studies her rings.',
            ],
            options: [
              {
                id: 'pardon-public',
                label:
                  'Declare before the court: Flint gave her own bread, and the crown honours it.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'old-houses': -3, yard: 1 },
                  flags: ['d27-flint-ration-known'],
                },
                response:
                  'The back of the hall cheers. Dunmore does not. “Then the crown honours what it took from my kitchen,” he says, and goes. Flint closes her eyes. “Now they know I was looking.” That night Captain Dunmark moves her bed beside the Watch, unasked.',
              },
              {
                id: 'bury-it',
                label:
                  'Offer Lady Vask a bargain: drop the charge, and stop asking who sold the grain.',
                effects: {
                  local: { 'old-houses': 2, lamplight: -2 },
                  flags: ['d27-grain-buried'],
                },
                response:
                  'Lady Vask accepts smoothly. She came ready to. Flint walks free. At the door she stops, back to you. “You bought my freedom with their silence, Majesty. I’ll try to be worth it.”',
              },
              {
                id: 'investigate',
                label: 'Read the ledgers. Finish what Flint started.',
                effects: {},
                response:
                  '“Good,” says Flint. Lady Vask’s rings stop tapping. In the gallery an Old House cousin leaves early, in a hurry.',
                postsQuests: ['q-d27-flint-evidence'],
              },
              {
                id: 'acquit',
                label: 'Acquit her on her word. It has never once been wrong.',
                effects: {
                  local: { 'old-houses': -4 },
                  affinity: { moles: 5 },
                  flags: ['flint-acquitted'],
                },
                response:
                  'Flint bows slowly. Lady Vask does not. The ledger copies go home in their black ribbon, unread. Whoever sold that grain sleeps well tonight.',
              },
              {
                id: 'censure',
                label:
                  'Censure her anyway. Crown grain is crown grain, even when it is hers.',
                effects: {
                  local: { 'old-houses': 4, yard: 1 },
                  flags: ['flint-censured'],
                },
                response:
                  'Flint takes the censure without a word. “The law is the law,” says Lady Vask, pleased. Flint looks at you a long moment. She will remember. The barracks too.',
              },
            ],
          },
          {
            id: 'levy',
            lines: [
              '“Of course it’s the levy,” says Lady Vask. “You took from the Houses to pay for a war, Majesty. The Houses take back what they can. Politics. Your tortoise is only standing where it happens.”',
              '“Return a third of the levy, and the charge becomes a clerical error. The Houses forgive clerical errors.”',
              'Flint, beside her, says only: “Don’t buy me, Majesty. I’m not for sale. Neither are you.”',
            ],
            options: [
              {
                id: 'refund',
                label:
                  'Refund a third of the levy. Let the charge become a clerical error.',
                requires: { cost: 25 },
                effects: {
                  local: { 'old-houses': 3, yard: -2 },
                  flags: ['d27-levy-refunded'],
                },
                response:
                  'The charge is withdrawn before the brass is counted. Flint walks free without thanks. The Yard paid for this war in bread long before the Houses paid in brass. It hears by supper.',
              },
              {
                id: 'investigate',
                label:
                  'No refunds. Read the ledgers. Let them say who profited.',
                effects: {},
                response:
                  '“Good,” says Flint. Lady Vask inclines her head, calm. A page runs from the hall before the herald finishes the order.',
                postsQuests: ['q-d27-flint-evidence'],
              },
              {
                id: 'acquit',
                label: 'Acquit Flint. Tell the Houses the levy stands.',
                effects: {
                  local: { 'old-houses': -4 },
                  affinity: { moles: 5 },
                  flags: ['flint-acquitted'],
                },
                response:
                  'Flint bows slowly. Lady Vask does not. “Politics,” she says, “will continue.”',
              },
              {
                id: 'censure',
                label:
                  'Censure Flint. It costs less than a third of a levy. She can bear it.',
                effects: {
                  local: { 'old-houses': 4 },
                  flags: ['flint-censured'],
                },
                response:
                  'Flint takes the censure without a word. Lady Vask thanks you for your economy. The barracks learn exactly what Flint was worth to the crown.',
              },
            ],
          },
        ],
      },
      {
        id: 'd27-fen-count',
        title: 'What the Fen Counted',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        requires: { flags: ['mire-quiet-count'] },
        lines: [
          'Sister Reedlight comes in after the gallery empties. Green lantern lit at noon again. The flame still does not move. She waits until the doors are shut.',
          'On the Mirefen road your escort counted us, Your Majesty. Quietly, as you asked. Forty-one walked. Forty-one arrived. You are the first crown to count the fen and not sell the number.',
          'Someone came to buy it. An Abbey sister in grey, a cord of knots at her belt. She asked how many children walk with us, and how old.',
          'The fen does not love the Abbey. But the fen hears what moves under the mission road. It is getting louder. We would show you.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A witch warning you against nuns, Your Majesty. Ask what the warning costs before you ask what it shows.',
          },
        ],
        options: [
          {
            id: 'accept-help',
            label: 'Accept the fen’s help, whatever it shows.',
            effects: {
              affinity: { 'mire-mothers': 10, abbey: -5 },
              flags: ['d27-fen-watch'],
            },
            response:
              'Sister Reedlight bows. That night a line of small gold lights crosses the marsh to the edge of the Abbey’s land. They wait there until dawn, unblinking.',
          },
          {
            id: 'refuse-help',
            label:
              'Thank her. The crown will not trade one hidden thing for another.',
            effects: {
              affinity: { 'mire-mothers': -5 },
              local: { lamplight: 1 },
              flags: ['d27-fen-refused'],
            },
            response:
              'Sister Reedlight smiles. “The crown is careful. The Abbey is counting on it.” Her lantern does not flicker on the way out.',
          },
          {
            id: 'ask-price',
            label: 'Ask what the fen wants for its help.',
            effects: {},
            response:
              'Sister Reedlight looks pleased. A teacher whose pupil asked the question she was saving.',
            next: 'price',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“A name. Not a person. A name, freely given, written once in our book. The fen keeps names. It remembers its friends that way.”',
              '“Your own is best. Another’s will do, if freely given. A name is not a life, Your Majesty. Only a thread.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: '“Only a thread,” Your Majesty. Every rope in the world began that way.',
              },
            ],
            options: [
              {
                id: 'give-name',
                label: 'Write your own name in the fen’s book.',
                effects: {
                  affinity: { 'mire-mothers': 10, abbey: -5 },
                  local: { 'old-houses': -1 },
                  flags: ['d27-name-in-fen-book', 'd27-fen-watch'],
                },
                response:
                  'She opens a book bound in something green and soft. You write your name. The ink is warm. All day every candle in the fortress leans toward the throne. That night the gold lights cross the marsh.',
              },
              {
                id: 'false-name',
                label: 'Write a name that is not yours.',
                effects: {
                  affinity: { 'mire-mothers': 5, abbey: -5 },
                  flags: ['d27-false-name-given', 'd27-fen-watch'],
                },
                response:
                  'Sister Reedlight watches you write and closes the book. “Thank you,” she says, “whoever you are.” The gold lights cross the marsh that night anyway. The fen is patient.',
              },
              {
                id: 'refuse-help',
                label: 'No names. Not yours, not anyone’s.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { lamplight: 1 },
                  flags: ['d27-fen-refused'],
                },
                response:
                  '“The crown is careful,” she says. “The Abbey is counting on it.” She leaves with her lantern. The hall is colder than the weather explains.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 28,
    title: 'Charms Against Rot',
    briefings: [
      {
        id: 'rot',
        source: 'The Yard’s foreman',
        text: 'Grain rot is spreading through the Yard’s storerooms.',
        truth: true,
      },
      {
        id: 'verge-envoy',
        source: 'The Gate Watch',
        text: 'An envoy of the Black Verge Court waits at the gate in white gloves.',
        truth: true,
      },
      {
        id: 'verge-vampires',
        source: 'Tavern talk',
        text: 'Everyone in the Black Verge Court is a vampire.',
        truth: false,
      },
    ],
    komodo:
      'Some carry a condition, Your Majesty. Not all, and not the same one. What matters: they never offer anything free. Ask what the cure costs before you ask what it cures.',
    quests: [],
    audiences: [
      {
        id: 'd28-verge-envoy',
        title: 'Charms Against Rot',
        speaker: 'The Envoy of the Black Verge',
        npc: 'the-verge-envoy',
        faction: 'black-verge',
        lines: [
          'The Envoy of the Black Verge is tall, still and pale in a plum court coat. White gloves, never dirtied. They bow exactly as low as protocol requires. A servant sets a lacquered box on the step beside a sack of the Yard’s rotten grain.',
          'The Court has heard of your rot, Majesty. We have charms against it. A gift, between neighbours.',
          'The envoy touches the grain with one gloved finger. The grey bloom fades. The kernels under it are clean, faintly frosted.',
          'One small thing. A courtier of ours has wandered off. An exile, lovely manners. If they come to your gate, we would like them back.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'That’s half the winter stores, Majesty. Half. I don’t care whose gloves it comes in.',
          },
        ],
        options: [
          {
            id: 'pups',
            label: 'Ask the envoy for the two Pack pups the plum riders took.',
            requires: { flags: ['d21-verge-pups-asked'] },
            effects: {
              affinity: { 'black-verge': -5 },
              flags: ['d28-pups-asked'],
            },
            response:
              '“The little hyenas,” says the envoy, fondly. “Well. Warm. No more coughing.” A pause. “They will not want to come back. Their mothers would not know them.” The envoy does not offer them. That is your answer.',
          },
          {
            id: 'accept',
            label: 'Accept the charms, and the condition.',
            effects: {
              affinity: { 'black-verge': 15 },
              local: { yard: 3 },
              strength: { 'black-verge': 1 },
              flags: ['verge-cures-accepted', 'promised-sable'],
            },
            response:
              'The envoy bows. “The Court never forgets a neighbour.” The gloves stay on.',
          },
          {
            id: 'test',
            label: 'Take the charms to test first. Promise nothing.',
            effects: { affinity: { 'black-verge': 5 } },
            response: 'The envoy smiles. “Prudent.” The gloves stay on.',
            postsQuests: ['q-d28-rot-cure'],
          },
          {
            id: 'refuse',
            label: 'Refuse. The crown will deal with its own rot.',
            effects: { affinity: { 'black-verge': -10 }, local: { yard: -2 } },
            response:
              'The envoy removes one glove, finger by finger, and leaves.',
          },
          {
            id: 'ask-charm',
            label: 'Ask what the charm is made of.',
            effects: {},
            response:
              'The envoy is amused. The gloved fingers fold, one by one.',
            next: 'charm',
          },
          {
            id: 'ask-sable',
            label: 'Ask why the Court wants its courtier back so badly.',
            effects: { flags: ['d28-sable-debt-heard'] },
            response:
              'The envoy folds their gloved hands, one over the other. Neatly.',
            next: 'debt',
          },
        ],
        beats: [
          {
            id: 'charm',
            lines: [
              '“Made? It is not made, Majesty. It is given. A little warmth, from someone with warmth to spare. Grain never quite alive cannot rot.”',
              '“Some of us carry a condition that is always cold. Others do not, and give to those who are. An old arrangement. Everyone in it is a volunteer.”',
              '“Everyone,” the envoy repeats, pleasantly. You did not ask.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Yard will eat it either way, Your Majesty. Hungry people do not ask where warmth comes from. I doubt the crown can afford to.',
              },
            ],
            options: [
              {
                id: 'buy-charms',
                label:
                  'Take the charms. Pay in brass. Promise the Court nothing.',
                requires: { cost: 25 },
                effects: {
                  affinity: { 'black-verge': 5 },
                  local: { yard: 2 },
                  flags: ['d28-charms-bought'],
                },
                response:
                  'The envoy takes the purse between two gloved fingers. “Brass. How local.” By morning the rot stops. The cooks say the grain is cold in the hand. Always. Even from the oven.',
              },
              {
                id: 'test',
                label:
                  'Test the charm. Promise nothing until the crown knows whose warmth it is.',
                effects: { affinity: { 'black-verge': 5 } },
                response:
                  'The envoy smiles. “Prudent. Do let us know what your testers dream about.” The gloves stay on.',
                postsQuests: ['q-d28-rot-cure'],
              },
              {
                id: 'refuse',
                label:
                  'Refuse. The crown will not feed its Yard on someone else’s warmth.',
                effects: {
                  affinity: { 'black-verge': -10 },
                  local: { yard: -2 },
                },
                response:
                  'The envoy removes one glove, finger by finger, and leaves. Dunmore Ash watches the lacquered box go like a starving man watching a door close.',
              },
              {
                id: 'accept',
                label:
                  'Accept the charms, and the condition. The Yard is hungry now.',
                effects: {
                  affinity: { 'black-verge': 15 },
                  local: { yard: 3 },
                  strength: { 'black-verge': 1 },
                  flags: ['verge-cures-accepted', 'promised-sable'],
                },
                response:
                  'The envoy bows. “The Court never forgets a neighbour.” By evening the Yard is baking. The bread is good. Nobody can get warm.',
              },
            ],
          },
          {
            id: 'debt',
            lines: [
              '“Sable carries something of ours. A debt, in the blood. At a certain age every courtier is given the condition. Sable was given a date and left the night before.”',
              '“Unpaid, it makes them ill. Then dangerous to everyone near. Your Yard. Your followers. Your little ones.” The gloves refold. “Returning Sable would be a kindness, Majesty. To your court, and to Sable.”',
              '“We would take very good care of them.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'They may even be telling the truth, Your Majesty. That is what makes the Black Verge hard to refuse.',
              },
            ],
            options: [
              {
                id: 'accept',
                label:
                  'Accept the charms. Promise Sable back. It may be kinder.',
                effects: {
                  affinity: { 'black-verge': 15 },
                  local: { yard: 3 },
                  strength: { 'black-verge': 1 },
                  flags: ['verge-cures-accepted', 'promised-sable'],
                },
                response:
                  'The envoy bows. “The Court never forgets a neighbour, or a kindness.” By evening the Yard bakes. The envoy is still at the gate, watching the road.',
              },
              {
                id: 'test',
                label: 'Test the charms. Sable is not yours to promise.',
                effects: { affinity: { 'black-verge': 5 } },
                response:
                  'The envoy smiles. “Prudent.” The gloves stay on. At the gate they stop and watch the road a long time. Like they expect someone.',
                postsQuests: ['q-d28-rot-cure'],
              },
              {
                id: 'refuse',
                label:
                  'Refuse both. The crown keeps its own rot and its own guests.',
                effects: {
                  affinity: { 'black-verge': -10 },
                  local: { yard: -2 },
                },
                response:
                  'The envoy removes one glove, finger by finger. The hand under it is ordinary. That is worse. They leave.',
              },
            ],
          },
        ],
      },
      {
        id: 'd28-defector',
        title: 'A Plum Coat at the Gate',
        speaker: 'Sable Thorne',
        faction: 'black-verge',
        lines: [
          'Late in the day an exiled courtier in a moth-eaten plum coat walks up the carpet like someone who once had a herald. White gloves, mended at the fingertips. They stop exactly where petitioners should. Nobody else has, all month.',
          'I had hoped to arrive before my former colleagues, Majesty. I am late. I ask for sanctuary, with impeccable manners.',
          'If you send me back, I will go. I would much rather not.',
          'Through the open doors, across the courtyard, the envoy watches. Does not blink.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Sanctuary costs whoever says it, Your Majesty. The Black Verge has a long memory and very good gloves.',
          },
        ],
        options: [
          {
            id: 'sanctuary',
            label: 'Grant sanctuary, openly.',
            effects: {
              affinity: { 'black-verge': -15 },
              recruitable: ['F016'],
              flags: ['sable-sheltered'],
            },
            response:
              'Sable bows, perfectly. Across the yard the envoy watches. Does not blink.',
          },
          {
            id: 'hide',
            label: 'Hide Sable in the barracks. Say nothing.',
            requires: { cost: 20 },
            effects: {
              affinity: { 'black-verge': -5 },
              recruitable: ['F016'],
              flags: ['sable-hidden'],
            },
            response: 'The Watch is paid to forget a plum coat. Most do.',
          },
          {
            id: 'return',
            label: 'Return Sable to the envoy.',
            effects: {
              affinity: { 'black-verge': 20 },
              flags: ['sable-returned'],
            },
            response:
              'Sable does not argue. They walk to the envoy, head high. They do not look back.',
          },
          {
            id: 'ask-flight',
            label: 'Ask Sable what exactly they are running from.',
            effects: { flags: ['talk-sable-flight'] },
            response:
              'Sable takes off one glove and looks at the hand, like checking it is still there. The glove goes back on.',
            next: 'flight',
          },
        ],
        beats: [
          {
            id: 'flight',
            lines: [
              '“At a certain age the Court gives each courtier its condition. A great honour. There is a ceremony. Everyone wears white.”',
              '“I was given a date. I left the night before. They had begun, and did not finish. Some nights I run a fever that is not quite a fever. It passes. So far.”',
              '“They will tell you I am dangerous. I may be, a little. So is everyone at this court, Majesty. I only said so first.”',
            ],
            options: [
              {
                id: 'head-start',
                label:
                  'Neither shelter nor surrender. Give Sable a horse and a day’s head start.',
                requires: { cost: 10 },
                effects: {
                  affinity: { 'black-verge': -5 },
                  flags: ['d28-sable-head-start'],
                },
                response:
                  'Sable bows from the saddle, which is hard to do well. “A day,” they say, “is long to someone counting hours.” By nightfall the envoy sends two riders after them. At a walk.',
              },
              {
                id: 'confine',
                label:
                  'The envoy calls the fever dangerous. Shelter Sable behind a locked door.',
                requires: { flags: ['d28-sable-debt-heard'] },
                effects: {
                  affinity: { 'black-verge': -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d28-sable-confined'],
                },
                response:
                  'Sable inspects the lock on the old tower room, approves it, and asks for books. “Sensible. I would have done the same.” Not kindly said. Sable offers the crown no service.',
              },
              {
                id: 'sanctuary',
                label: 'Grant sanctuary, openly, fever and all.',
                effects: {
                  affinity: { 'black-verge': -15 },
                  recruitable: ['F016'],
                  flags: ['sable-sheltered'],
                },
                response:
                  'Sable bows, perfectly. For a moment the composure slips. They look young. Across the yard the envoy watches without blinking, then turns and walks away slow.',
              },
              {
                id: 'hide',
                label: 'Hide Sable in the barracks. Let the envoy guess.',
                requires: { cost: 20 },
                effects: {
                  affinity: { 'black-verge': -5 },
                  recruitable: ['F016'],
                  flags: ['sable-hidden'],
                },
                response:
                  'The Watch is paid to forget a plum coat. Most do. Sable sleeps in the barracks under a borrowed blanket and wakes, for once, without fever.',
              },
              {
                id: 'return',
                label: 'Return Sable to the envoy. It may be the kinder thing.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  flags: ['sable-returned'],
                },
                response:
                  'Sable does not argue. “Kinder,” they repeat, tasting it. They walk to the envoy, head high. The envoy takes their arm the way you take an invalid’s.',
              },
            ],
          },
        ],
      },
      D28_RETURNED_LETTERS,
    ],
  },
  {
    day: 29,
    title: 'The Mayor’s Secret',
    briefings: [
      {
        id: 'missing-page',
        source: 'The Lamplight Archive',
        text: 'A page has been cut from Hollow Bell’s town ledger: the year the drought began.',
        truth: true,
      },
      {
        id: 'mole-forgery',
        source: 'Young Komodo’s own runner',
        text: 'The cut page is a forgery from the burrows meant to ruin Mayor Reedbell.',
        truth: false,
        komodoLie: true,
        hindsight:
          'No one from the burrows touched that page. He wanted the ledger shut, and the burrows blamed for shutting it.',
        variants: [
          {
            flags: ['mole-truce'],
            text: 'The cut page is a forgery from the burrows. The burrows have their water now. They want Hollow Bell’s too.',
          },
        ],
      },
      {
        id: 'bell-water',
        source: 'Hollow Bell carters',
        text: 'Hollow Bell had water through the worst of the drought. Nobody else did.',
        truth: true,
      },
    ],
    komodo:
      'A forgery, Your Majesty. I am nearly sure. The Moles have every reason to ruin Mara. Leave the page alone. Some ledgers are better closed.',
    quests: [],
    audiences: [
      {
        id: 'd29-mayors-secret',
        title: 'The Mayor’s Secret',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Mara Reedbell comes without her sash. The town ledger is chained to her belt. It falls open where a page was cut close to the spine with a sharp knife. She sets her hand-bell on the dais step, mouth down. It cannot ring.',
          'You’ve heard about the page, Your Majesty. Of course you have.',
          'Hollow Bell had water when nobody else did. Water costs. I paid. I’d pay again. Do what you like with that.',
          {
            who: 'Keeper Abelard Vellum',
            npc: 'abelard-vellum',
            text: 'The page reached the Archive this morning, Majesty, in a plain envelope. Hollow Bell paper. Hollow Bell ink. The mayor’s own hand. Forty years I’ve kept records. Forgers hurry. This hand didn’t.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Or a very patient forgery, Keeper. The Moles had the whole drought to practise. Your Majesty, do not let a scrap of paper unmake the mayor who kept her town alive.',
          },
        ],
        options: [
          {
            id: 'pip',
            label: 'Let Pip read the page aloud.',
            requires: { follower: 'F005' },
            effects: {
              affinity: { abbey: -10, 'hollow-bell': -5 },
              local: { lamplight: 3 },
              flags: ['talk-pip-ledger', 'bell-abbey-ledger'],
            },
            response:
              'Pip reads in a small, steady voice. Water from the Abbey’s deep well, every season, for “the names of the town’s unclaimed children.” Mara does not look away. When Pip is done, she speaks.',
            next: 'price',
          },
          {
            id: 'expose',
            label: 'Expose the page to Hollow Bell.',
            effects: {
              affinity: { 'hollow-bell': -15 },
              local: { lamplight: 4 },
              flags: ['mara-exposed'],
            },
            response:
              'Mara nods. She expected nothing else. “They’ll choose another mayor,” she says. “They should.”',
          },
          {
            id: 'protect',
            label: 'Burn the page. The Bell needs its mayor.',
            effects: {
              affinity: { 'hollow-bell': 10 },
              local: { lamplight: -3 },
              flags: ['mara-protected'],
            },
            response:
              'Mara watches the page burn and says nothing. Komodo looks relieved.',
          },
          {
            id: 'bargain',
            label: 'Keep the page, and Mara’s debt to the crown.',
            effects: {
              brass: 20,
              affinity: { 'hollow-bell': 5 },
              flags: ['mara-owes-crown'],
            },
            response: '“A debt,” says Mara. “Well. I know how those work.”',
          },
          {
            id: 'ask-cost',
            label: 'Ask Mara what the water cost, in her own words.',
            effects: {},
            response:
              'Mara looks at the hand-bell, not at you. She starts like she is reading a page she knows by heart.',
            next: 'price',
          },
          {
            id: 'ask-keeper',
            label: 'Ask the Keeper who else knew the page had come.',
            effects: { flags: ['d29-runner-question'] },
            response:
              'Keeper Vellum thinks so long that a candle gutters and a page boy trims it.',
            next: 'envelope',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“Names. Every spring a sister brought a list of blanks. I filled them in. Children nobody would miss. Orphans. Runaways. A boy who stole from the mill twice.”',
              '“In return the Abbey’s deep well filled our cisterns all through the drought. Hollow Bell lived. Every ward. I told myself the children were fed and taught. The first year I believed it.”',
              '“The third year I stopped believing. I kept signing. The wards kept drinking.” She looks up, steady. “Tell me which of those children you’d have traded for the far wards, Majesty. I’ll tell you mine.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She saved a town, Your Majesty. Whatever else she did. Burn the page. Let her go on saving it.',
              },
            ],
            options: [
              {
                id: 'confession',
                label:
                  'Have Mara write it all down, in her own hand, for the crown.',
                effects: {
                  affinity: { abbey: -10, 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d29-mara-confession'],
                },
                response:
                  'Mara writes for an hour. Her hand never shakes. She signs, blots, and asks to go home and ring the evening bell. You let her. At dusk it rings on time, as always.',
              },
              {
                id: 'refuse-water',
                label:
                  'Order Hollow Bell to refuse the Abbey’s water today, whatever it costs the wards.',
                effects: {
                  affinity: { 'hollow-bell': -10, abbey: -10 },
                  local: { yard: -1 },
                  flags: ['d29-bell-refuses-water'],
                },
                response:
                  'Mara closes her eyes. “Then the far wards go thirsty first. They always do.” By week’s end Abbey sisters are at the Bell’s gate with water carts. Free. Asking nothing.',
              },
              {
                id: 'carry-blame',
                label:
                  'On your first morning she offered you her blame. Take this blame too: say the crown made the bargain.',
                requires: { flags: ['mara-millers-levy'] },
                effects: {
                  affinity: { 'hollow-bell': 5, abbey: -5 },
                  local: { lamplight: -2, yard: -2 },
                  flags: ['d29-crown-took-blame'],
                },
                response:
                  'Mara stares at you. For once she has nothing ready. Then she bows low, as on your first morning. By nightfall every tavern says the new emperor sold children for water. Untrue. The kind of untrue that sticks.',
              },
              {
                id: 'expose',
                label:
                  'Expose the page to Hollow Bell. The wards should know what they drank.',
                effects: {
                  affinity: { 'hollow-bell': -15 },
                  local: { lamplight: 4 },
                  flags: ['mara-exposed'],
                },
                response:
                  'Mara nods. She expected nothing else. “They’ll choose another mayor. They should. Tell them the water was good. It was the only good thing about it.”',
              },
              {
                id: 'protect',
                label:
                  'Burn the page. The Bell needs its mayor more than its truth.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -3 },
                  flags: ['mara-protected'],
                },
                response:
                  'Mara watches the page burn and says nothing. Komodo looks relieved. Then he catches your eye and puts on a solemn face.',
              },
              {
                id: 'bargain',
                label: 'Keep the page, and Mara’s debt with it.',
                effects: {
                  brass: 20,
                  affinity: { 'hollow-bell': 5 },
                  flags: ['mara-owes-crown'],
                },
                response:
                  '“A debt,” says Mara. “Well. I know how those work. I’ve been paying one for six years.”',
              },
              {
                // t-043: the Day 19 vote tied, and Mara broke it unseen.
                id: 'ask-tie',
                label:
                  'The vote on the crown’s protection tied. Ask which way she broke it.',
                requires: { flags: ['bell-vote-tied'] },
                effects: {},
                response:
                  'Mara picks up the hand-bell. Turns it mouth up. She still does not ring it.',
                next: 'tie',
              },
            ],
          },
          {
            id: 'tie',
            lines: [
              '“For the crown. I said I’d never say. There. Said.”',
              '“Not for love of you, Majesty. Every spring a sister walks down the mission road with a list. I wanted somebody bigger than me in the valley with a reason to watch her come.”',
              '“Then I sat in my kitchen and waited for you to look. You took your time. Somebody cut the page and put it in your hands, and here you are, looking.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A tied vote is a coin in the air, Your Majesty. Anyone can call it after it lands.',
              },
              'Mara sets the bell down. “Look, then. That’s what I voted for.”',
            ],
            options: [
              {
                id: 'confession',
                label:
                  'She wanted to be watched. Have her write it all down, in her own hand.',
                effects: {
                  affinity: { abbey: -10, 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d29-mara-confession'],
                },
                response:
                  'Mara writes for an hour. Near the end her hand stops once, over a name. Then it goes on. She signs, blots, and walks home to ring the evening bell. It rings on time.',
              },
              {
                id: 'expose',
                label:
                  'Expose the page to Hollow Bell. She voted for this. Let her town look too.',
                effects: {
                  affinity: { 'hollow-bell': -15 },
                  local: { lamplight: 4 },
                  flags: ['mara-exposed'],
                },
                response:
                  'Mara nods. “Good,” she says, and means it, and goes white anyway. By the next market the town has another mayor. Nine hands for him. Nobody ties.',
              },
              {
                id: 'protect',
                label:
                  'Burn the page. She has been watched enough. The Bell needs her.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -3 },
                  flags: ['mara-protected'],
                },
                response:
                  'Mara watches the page burn. “That isn’t what I voted for,” she says. She takes the ash home in her handkerchief. Komodo looks relieved.',
              },
              {
                id: 'bargain',
                label:
                  'Keep the page, and her debt. The crown is watching now.',
                effects: {
                  brass: 20,
                  affinity: { 'hollow-bell': 5 },
                  flags: ['mara-owes-crown'],
                },
                response:
                  '“A debt,” says Mara. “Fine. A debt watches too.” She leaves the hand-bell on the dais step, mouth down, and walks home without it.',
              },
            ],
          },
          {
            id: 'envelope',
            speaker: 'Keeper Abelard Vellum',
            npc: 'abelard-vellum',
            lines: [
              '“No one, Majesty. The Archive reported a page missing three days ago. The page came this morning. I told only the throne.”',
              '“Yet your advisor’s runner had decided before dawn it was a forgery from the burrows.” He blinks, slowly. “I only remark on it. Remarking is most of what keepers do.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Runners hear things in doorways, Keeper. That is what they are for.',
              },
              'Komodo’s claw taps the cover of his ledger twice. Then it is still.',
            ],
            options: [
              {
                id: 'seal-page',
                label:
                  'Leave the page sealed in the Archive. Decide nothing today.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d29-page-sealed'],
                },
                response:
                  'Keeper Vellum seals the page with his ring and locks it in a drawer. He wears the key. Mara goes home still mayor, not forgiven. Komodo is charming at supper. Twice, lightly, he asks where the Archive keeps its keys.',
              },
              {
                id: 'expose',
                label:
                  'Expose the page to Hollow Bell. Forgery or not, let the town judge.',
                effects: {
                  affinity: { 'hollow-bell': -15 },
                  local: { lamplight: 4 },
                  flags: ['mara-exposed'],
                },
                response:
                  'Mara nods. “They’ll choose another mayor. They should.” Keeper Vellum writes one line in his own book. He shows no one.',
              },
              {
                id: 'protect',
                label: 'Take Komodo’s advice. Burn the page.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -3 },
                  flags: ['mara-protected'],
                },
                response:
                  'Mara watches the page burn and says nothing. Komodo looks relieved. Keeper Vellum watches Komodo, not the fire.',
              },
              {
                id: 'bargain',
                label: 'Keep the page, and Mara’s debt to the crown.',
                effects: {
                  brass: 20,
                  affinity: { 'hollow-bell': 5 },
                  flags: ['mara-owes-crown'],
                },
                response:
                  '“A debt,” says Mara. “Well. I know how those work.” The Keeper hands you the page like a live coal.',
              },
              {
                id: 'ask-cost',
                label:
                  'Leave the runner for now. Ask Mara what the water cost.',
                effects: {},
                response:
                  'Mara looks at the hand-bell, not at you. She starts like she is reading a page she knows by heart.',
                next: 'price',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 30,
    title: 'Terms of Shelter',
    briefings: [
      {
        id: 'peace-signed',
        source: 'A hopeful herald',
        text: 'The factions have signed a peace at the Saltroad.',
        truth: false,
      },
      {
        id: 'war-coming',
        source: 'Every runner at once',
        text: 'Three factions are mustering at once. The map changes by tomorrow.',
        truth: true,
      },
      {
        id: 'freeholds-weak',
        source: 'Freehold reeves',
        text: 'The Freeholds cannot hold their border alone.',
        truth: true,
      },
    ],
    komodo:
      'No one has signed anything, Your Majesty. Tomorrow some banners on the map will be smaller. Some gone. Choose who shelters under the crown tonight.',
    quests: ['q-d30-hold-the-line'],
    audiences: [
      {
        id: 'd30-terms',
        title: 'Terms of Shelter',
        speaker: 'Envoys of three factions',
        faction: 'saltroad',
        lines: termsOpening(DUNMARK_GATE),
        variants: [
          {
            flags: ['d26-dry-well-followed'],
            lines: termsOpening(
              'My riders watched eleven people go by on a rope, Majesty. On your word. Now the fortress can shelter one of these properly. Not two. Don’t ask my riders to watch the rest go by.',
            ),
          },
        ],
        options: [
          {
            id: 'freeholds',
            label: 'Shelter the Freeholds.',
            effects: {
              affinity: { freeholds: 10 },
              strength: { freeholds: 1 },
              flags: ['sheltered-freeholds'],
            },
            response:
              'The Freehold envoy weeps openly. The other two leave without a word.',
          },
          {
            id: 'saltroad',
            label: 'Shelter the Saltroad.',
            effects: {
              affinity: { saltroad: 10 },
              strength: { saltroad: 1 },
              local: { ledger: 2 },
              flags: ['sheltered-saltroad'],
            },
            response:
              'Oriel Saltmarsh’s envoy bows. The caravans roll in by midnight.',
          },
          {
            id: 'moles',
            label: 'Shelter the Moles.',
            requires: { affinity: { moles: 'neutral' } },
            effects: {
              affinity: { moles: 15 },
              strength: { moles: 1 },
              local: { 'old-houses': -3 },
              flags: ['sheltered-moles'],
            },
            response:
              'The burrow envoy blinks up at the gate. He never once expected it to open.',
          },
          {
            id: 'ask-losses',
            label: 'Ask each envoy what they lose if the gate stays shut.',
            effects: {},
            response:
              'The three envoys look at one another. Nobody wants to go first. In the end they all speak at once.',
            next: 'losses',
          },
          {
            id: 'ask-gate',
            label:
              'Ask the Watch who else is waiting outside the gate tonight.',
            effects: {},
            response:
              'Captain Dunmark hesitates. He never hesitates. “A fourth envoy, Majesty. Nobody sent for her.”',
            next: 'marrow',
          },
        ],
        beats: [
          {
            id: 'losses',
            lines: [
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'Eleven farms, two wells, and everyone on them, Majesty. We have no walls. We have fences. Fences are for goats.',
              },
              {
                who: 'A Saltroad drover',
                text: 'The road. Lose the Saltroad tonight and medicine stops everywhere by spring. Your Yard too. Oriel says she isn’t begging. She says it’s arithmetic.',
              },
              {
                who: 'The burrow envoy',
                text: 'Nothing we haven’t lost before. We have tunnels. We survive. I came to see if the gate would open for us. Nobody ever asked what we’d lose.',
              },
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'The Moles flooded our east field last spring. I won’t sleep in a courtyard with them, Majesty. War or no war.',
              },
            ],
            // t-043: the trade-road copies the Ledger bought on Day 14.
            variants: [
              {
                flags: ['d14-ledger-owns-roads'],
                lines: [
                  {
                    who: 'Hester Plowright',
                    npc: 'hester-plowright',
                    text: 'Eleven farms, two wells, and everyone on them, Majesty. We have no walls. We have fences. Fences are for goats.',
                  },
                  {
                    who: 'A Saltroad drover',
                    text: 'The road. Lose the Saltroad tonight and medicine stops everywhere by spring. Your Yard too. Mind, we already pay the Ledger a toll to read our own roads, Majesty. You sold them the copies. Oriel says she isn’t begging. She says it’s arithmetic.',
                  },
                  {
                    who: 'The burrow envoy',
                    text: 'Nothing we haven’t lost before. We have tunnels. We survive. I came to see if the gate would open for us. Nobody ever asked what we’d lose.',
                  },
                  {
                    who: 'Hester Plowright',
                    npc: 'hester-plowright',
                    text: 'The Moles flooded our east field last spring. I won’t sleep in a courtyard with them, Majesty. War or no war.',
                  },
                ],
              },
            ],
            options: [
              {
                id: 'children-first',
                label:
                  'Shelter every child of all three peoples, and none of the grown.',
                requires: { notFlags: ['d30-children-to-abbey'] },
                effects: {
                  affinity: { freeholds: 5, saltroad: 5, moles: 5 },
                  local: { yard: -3 },
                  flags: ['d30-children-sheltered'],
                },
                response:
                  'The envoys stare. Then one by one they go into the dark and come back with their children. They kiss them at the gate and walk away alone. The Yard sleeps three to a bed tonight. Nobody sleeps.',
              },
              {
                id: 'freeholds',
                label: 'Shelter the Freeholds. They have only fences.',
                effects: {
                  affinity: { freeholds: 10 },
                  strength: { freeholds: 1 },
                  flags: ['sheltered-freeholds'],
                },
                response:
                  'Hester Plowright weeps openly and hates herself for it. The drover leaves without a word. The old tunnel delegate thanks you for asking and goes back into the dark.',
              },
              {
                id: 'saltroad',
                label: 'Shelter the Saltroad. The arithmetic is not wrong.',
                effects: {
                  affinity: { saltroad: 10 },
                  strength: { saltroad: 1 },
                  local: { ledger: 2 },
                  flags: ['sheltered-saltroad'],
                },
                response:
                  'The drover bows. The caravans roll in by midnight, medicine chests first. Hester Plowright leaves without a word. By morning a bare fence post stands outside the gate.',
              },
              {
                id: 'moles',
                label: 'Shelter the Moles. Somebody should finally ask.',
                requires: { affinity: { moles: 'neutral' } },
                effects: {
                  affinity: { moles: 15 },
                  strength: { moles: 1 },
                  local: { 'old-houses': -3 },
                  flags: ['sheltered-moles'],
                },
                response:
                  'The burrow envoy blinks up at the gate. He never expected it to open. Hester Plowright spits on your floor, precisely, and leaves.',
              },
              {
                // t-043: undo the Day 14 sale, at the Ledger's expense.
                id: 'buy-roads-back',
                label:
                  'Shelter the Saltroad, and buy its road maps back from the Ledger tonight.',
                requires: { flags: ['d14-ledger-owns-roads'], cost: 20 },
                effects: {
                  affinity: { saltroad: 15 },
                  strength: { saltroad: 1 },
                  local: { ledger: -2 },
                  flags: ['sheltered-saltroad', 'd30-roads-bought-back'],
                },
                response:
                  'Factor Tallow sells the copies back at cost and writes a small note in a small book. The drover burns them in the courtyard, one by one, while the caravans roll in. Hester Plowright watches the smoke go up. Then she leaves.',
              },
            ],
          },
          {
            id: 'marrow',
            speaker: 'Sister Marrow of the Abbey',
            npc: 'sister-marrow',
            lines: marrowLines([]),
            // Marrow remembers the court's week; Hester remembers Bett.
            variants: asideVariants(
              [
                [
                  {
                    flag: 'd23-tam-visited',
                    line: '“Tam Coldbrook asked to ride on the first wagon. He wants to carry the soup. I said I would ask you.”',
                  },
                  {
                    flag: 'd29-bell-refuses-water',
                    line: '“We took water carts to Hollow Bell this week. Free. The far wards drank. We would do the same for these.”',
                  },
                  {
                    flag: 'd25-orphans-kept',
                    line: '“The Abbess heard the crown will feed its own orphans. She sends the wagons anyway. In case somehow runs out.”',
                  },
                  {
                    flag: 'abbess-questioned',
                    line: '“The Abbess has not forgotten your questions. She says she is glad of them. Ask them again on the wagons, if you like.”',
                  },
                  {
                    flag: 'abbess-honored',
                    line: '“The Abbess remembers how this court honoured her. She asked me to come myself.”',
                  },
                ],
                [
                  {
                    flag: 'd24-letter-read-kindly',
                    line: 'A mother on my roads gets a letter every month from her boy. Same good paper. Same hundred kisses. This court read her the first one, Majesty.',
                  },
                  {
                    flag: 'd24-form-letter-told',
                    line: 'Bett Ormond sleeps at the mission-road well now. The sisters bring her soup. She takes it. Ask her how often she’s seen Dov’s face.',
                  },
                ],
              ],
              marrowLines,
            ),
            options: [
              {
                id: 'abbey-takes-children',
                label:
                  'Accept. The Abbey takes the children. Then decide which of the grown come in.',
                effects: {
                  affinity: { abbey: 10 },
                  local: { yard: 1 },
                  flags: ['d30-children-to-abbey'],
                  schedule: ['abbey-wagons-return'],
                },
                response:
                  'Sister Marrow counts the children onto the wagons with her cord, knot by knot. Sixty. The mothers hand up blankets. The wagons go north at a walk. Then the envoys turn back to you. The grown are still at the gate.',
                next: 'losses',
              },
              {
                id: 'send-away',
                label: 'Send Sister Marrow away. Hear the envoys out.',
                effects: { affinity: { abbey: -5 } },
                response:
                  '“Of course,” says Sister Marrow. She leaves the wagons at the gate all night, lamps lit, in case you change your mind.',
                next: 'losses',
              },
              {
                id: 'tear-writ',
                label:
                  'She carries the writ you signed for the Abbess. Tear it up in front of her, then hear the envoys.',
                requires: { flags: ['d25-orphan-writ'] },
                effects: {
                  affinity: { abbey: -10 },
                  local: { 'gate-watch': 2 },
                  flags: ['d30-writ-torn'],
                },
                response:
                  'You tear the page you signed five days ago into eight pieces. Sister Marrow picks every one off the carpet and pockets them. “The Abbess will want these.” She goes.',
                next: 'losses',
              },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * What Act III's answers bring back on a later dawn (t-037). Most are hidden:
 * the court learns them when they happen. The two the crown can see coming
 * (the Watch's report and the war orphans) sit in the ledger.
 */
export const ACT_THREE_DUES: readonly DueDef[] = [
  {
    id: 'midnight-visit',
    title: 'A visit at midnight',
    inDays: 2,
    hidden: true,
    line: 'Hester Plowright took the writ’s clause at its word and walked into the Abbey at midnight, unannounced. The children were asleep, two to a cot, fed. She counted forty heads. She came back and ate her supper without a word.',
  },
  {
    id: 'census-clerk-report',
    title: 'The clerk at the Abbey',
    inDays: 3,
    hidden: true,
    line: 'The crown’s clerk came back from the Abbey with ink to the wrist. Two hundred and twelve names, every one in a fair hand. They showed her every floor but one: the fever ward. She could not go down without a mask, and they had none to spare.',
  },
  {
    id: 'dry-well-watch',
    title: 'The Watch on the dry-well road',
    inDays: 2,
    warning:
      'The Watch rides behind the dry-well jackals and reports what it saw.',
    line: 'The Watch came back from the dry-well road. They followed eleven Freehold people on a rope to a crossroads below the mission road. Wagons without marks took them north. The Watch did not interfere. Orders.',
    effects: { local: { 'gate-watch': -1 } },
  },
  {
    id: 'war-orphans',
    title: 'Orphans at the Yard gate',
    day: 31,
    warning:
      'The war makes orphans by Day 31, and no Abbey writ sends them anywhere but the Yard.',
    line: 'The first war orphans reached the Yard gate at dawn. Dunmore found beds for nine. The rest sleep in the bakehouse against the warm wall.',
    effects: { local: { yard: -1 } },
  },
  {
    id: 'quiet-watch-report',
    title: 'The rider above the mission road',
    day: 31,
    hidden: true,
    line: 'The rider above the mission road came home. Wenna went in at noon twice and came out at dusk both times, slow, the baby asleep. The side gate opened four nights. Wagons went in heavy and came out light. Flour, the rider thinks. She will not swear to it.',
  },
  {
    id: 'abbey-wagons-return',
    title: 'The wagons come back',
    inDays: 4,
    hidden: true,
    line: 'The Abbey’s wagons came back down the mission road at dawn. Forty-one children of the three peoples, fed, in new boots. Sixty went up. Sister Marrow says the rest are still at lessons. Hester Plowright has the names of the nineteen.',
    effects: { affinity: { freeholds: -5 } },
  },
]

/**
 * Afterwards (t-037): the Abbey choices of Act III the epilogue remembers.
 * Spread into the epilogue's kingdom subjects; first matching variant wins.
 */
export const ACT_THREE_AFTERWARDS: readonly EpilogueSubject[] = [
  {
    id: 'war-children',
    name: 'The children of the war night',
    variants: [
      {
        when: { flags: ['d30-children-to-abbey'], endings: ['long-night'] },
        mood: 'sad',
        text: 'Sixty children went up the mission road on the night before the war. Forty-one came down in new boots. There are more voices in the singing now. Hester Plowright knows nineteen of them by name.',
      },
      {
        when: { flags: ['d30-children-to-abbey'] },
        mood: 'sad',
        text: 'Sixty children of three peoples went up the mission road the night before the war, to hot milk and two to a cot. Forty-one came down in new boots. Hester Plowright reads the other nineteen names at every council. She has not been asked to stop.',
      },
      {
        when: { flags: ['d30-children-sheltered'] },
        text: 'On the night before the war the Yard slept three to a bed. The mothers kissed their children at the gate and walked back to the fences. Most came back for them. The Yard keeps the extra beds made.',
      },
    ],
  },
  {
    id: 'ormond',
    name: 'Bett Ormond and her boy',
    variants: [
      {
        when: { endings: ['long-night'] },
        mood: 'sad',
        text: 'Bett Ormond sleeps at the mission-road well. She knows Dov’s voice in the singing. She has stopped asking anyone to read her anything.',
      },
      {
        when: { flags: ['d24-letter-read-kindly'] },
        text: 'Bett Ormond still gets a letter on the first of every month, in a fine hand. Dov is well, and busy. She keeps them in a tin. She can’t read them. She doesn’t need to.',
      },
      {
        when: { flags: ['d24-form-letter-told'] },
        text: 'Bett Ormond slept at the mission-road well until the snow. The sisters brought her soup. In spring Dov came down the road in new boots, taller, polite. He calls her ma’am. She takes him home anyway.',
      },
      {
        when: { flags: ['asked-abbey-politely'] },
        text: 'The Abbess answered the crown’s letter about Dov Ormond in three days. At midwinter a second letter came, in a child’s hand, spelled wrong. Bett keeps that one inside her coat.',
      },
      {
        text: 'The court never read Bett Ormond her letter. She waits at the Abbey gate on the first of every month. Some months a sister comes out and sits with her. Neither of them says much.',
      },
    ],
  },
  {
    id: 'yard-sisters',
    name: 'The sisters’ bread',
    variants: [
      {
        when: { flags: ['d23-sisters-barred'] },
        text: 'The sisters never came back to the Yard. The bread stopped and the cough came back, and then the cough went, the way coughs do. Two small graves went in behind the bakehouse first.',
      },
      {
        when: { flags: ['d23-bread-at-gate'] },
        text: 'The sisters’ baskets came to the Yard gate every evening until the war, and never through it. Tam Coldbrook watched them through the bars. He still stands at that gate at dusk, a grown man, chin on the crossbar.',
      },
      {
        when: { flags: ['d23-sisters-welcome'] },
        text: 'The sisters came to the Yard every evening, war or no war. The Yard ate their bread and taught its children their songs. The Yard has very few orphans now. It has stopped asking where they go.',
      },
    ],
  },
]
