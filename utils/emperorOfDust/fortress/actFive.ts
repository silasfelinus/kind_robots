import type {
  AudienceDef,
  AudienceOption,
  DayDef,
  DueDef,
  Effects,
  FlagAid,
  KingdomFactionId,
  QuestDef,
  SceneLine,
  SceneVariant,
} from './types'
import { D42_RUNNER_VARIANTS } from './actTwo'
import { MOLE_ASSEMBLY_TURNS_OUT } from './moles'

// Act V, Days 41-50, "The Hideout" (conductor DAY-PLAN.md): the court on the
// run after Young Komodo's betrayal. The hideout (engine selectHideout, flag
// `hideout:<id>`) decides who sets terms on Day 42 and which host quest goes
// on the wall; Day 49 decides whose peace it is, and Day 50's last dispatch
// decides whether the horror under the Abbey sleeps. endings.ts reads the
// result. Endings never name who later destroys Hollow Bell (Book One).

const VELLUM = { name: 'Keeper Vellum', npc: 'abelard-vellum' }

/**
 * What Act V's alliances and preparations bring to the Day 50 roads (t-040).
 * Every source the run holds is added to the party's totals and named in the
 * quest room's odds; a bonus with a `stat` only counts where the road needs
 * that stat. Ten days of choices, counted honestly.
 */
export const FINALE_AID: FlagAid[] = [
  {
    flags: ['verge-allied'],
    label: 'The Black Verge rides at your flank',
    bonus: 3,
    stat: 'might',
  },
  {
    flags: ['watch-returned'],
    label: 'The Watch came down off the ridge',
    bonus: 2,
    stat: 'might',
  },
  {
    flags: ['watch-inside-tower'],
    label: 'The Watch holds a door from inside',
    bonus: 2,
  },
  {
    flags: ['reedlight-lantern'],
    label: 'Reedlight’s lantern, which does not speak back',
    bonus: 3,
    stat: 'heart',
  },
  {
    flags: ['d50-moles-dig'],
    label: 'The burrows dig under the wall',
    bonus: 2,
  },
  {
    anyFlags: ['abbey-road-watched', 'crow-sightings'],
    label: 'The Crows counted every lantern on the Abbey road',
    bonus: 1,
  },
  {
    flags: ['d42-courier-sent'],
    label: 'The courier’s soot map of the kitchens',
    bonus: 2,
    stat: 'lore',
  },
  {
    flags: ['d44-powder-to-crypt'],
    label: 'A keg of powder for the brick tunnel',
    bonus: 2,
    stat: 'might',
  },
  // t-039: the drowned fen and the Pack at the wall are roads too.
  {
    flags: ['d44-dike-blown'],
    label: 'The fen went down the Abbey’s deep well',
    bonus: 2,
  },
  {
    flags: ['d47-pack-rides'],
    label: 'The Pack rides at the Abbey wall',
    bonus: 2,
    stat: 'might',
  },
]

export const ACT_FIVE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d41-stragglers',
    title: 'Find the Stragglers',
    summary:
      'Half the court scattered when the fortress fell. Some lie in ditches between here and the tower. Bring them in before the plum riders do.',
    region: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'urgent'],
    rewards: {
      success: {
        local: { yard: 3, 'gate-watch': 2 },
        flags: ['stragglers-found'],
      },
      partial: { local: { yard: 1 } },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3, 'gate-watch': -2 } },
    outcomes: {
      success:
        'Eleven cooks, four guards and one angry goat came in from the dark. The Yard cooks again.',
      partial: 'A few came in. The rest had chosen other roads.',
      failure:
        'The ditches were empty. Or the people in them did not want finding.',
      expired: 'Nobody went looking. The stragglers stopped waiting.',
    },
  },
  // Day 42: one host quest per hideout, posted by accepting the host's terms.
  {
    id: 'q-d42-tunnel-props',
    title: 'Shore Up the Tunnels',
    summary:
      'Granny Umber’s price: prop the long tunnel before the badlands drop it on everyone.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 1,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tunnels', 'repair'],
    rewards: {
      success: { affinity: { moles: 10 }, strength: { moles: 1 } },
      failure: { affinity: { moles: -5 } },
    },
    expired: { affinity: { moles: -10 } },
    outcomes: {
      success:
        'The props hold. Granny Umber knocks on one and listens. She nods.',
      failure: 'A section came down. Nobody was under it. This time.',
      expired: 'The Moles propped it themselves. They say so. Often.',
    },
  },
  {
    id: 'q-d42-crow-watch',
    title: 'Stand the Crow Watch',
    summary:
      'Elder Corvane wants the court on the ledges at night. Every crow watches the Abbey road. So will you.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['weather', 'tracking'],
    rewards: {
      success: {
        affinity: { 'storm-crows': 10 },
        flags: ['abbey-road-watched'],
      },
      failure: { affinity: { 'storm-crows': -5 } },
    },
    expired: { affinity: { 'storm-crows': -10 } },
    outcomes: {
      success:
        'Three nights on the ledges. On the third, a line of lanterns went up the Abbey road. None came down.',
      failure: 'The watch fell asleep. The crows did not. They told Corvane.',
      expired: 'The crows stood the watch alone. They noted it.',
    },
  },
  {
    id: 'q-d42-bell-water',
    title: 'Water for the Bell',
    summary:
      'Hollow Bell hides the court in its chapel cellars. The town is running dry. The aqueduct needs hands.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': 10 },
        strength: { 'hollow-bell': 1 },
      },
      failure: { affinity: { 'hollow-bell': -5 } },
    },
    expired: { affinity: { 'hollow-bell': -10 } },
    outcomes: {
      success:
        'The aqueduct runs. Mara Reedbell rings the chapel bell once, quietly. For the court.',
      failure: 'The leak won. The town is rationing again.',
      expired:
        'The town carried water by hand. Nobody complained where you could hear.',
    },
  },
  {
    id: 'q-d42-wagon-wheels',
    title: 'Wheels for the Wagon Circle',
    summary:
      'Gristle Vane hides the court among the painted wagons. The court keeps them rolling.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { jackalwire: 10 },
        strength: { jackalwire: 1 },
      },
      failure: { affinity: { jackalwire: -5 } },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'Every wagon rolls. Vane paints a small crown on the axle of his own.',
      failure: 'Two wagons are still on blocks. Vane is counting.',
      expired: 'The Pack fixed its own wheels. Then it raised its prices.',
    },
  },
  {
    id: 'q-d42-caravan-guard',
    title: 'Ride With the Caravan',
    summary:
      'The safest place in the kingdom never stops moving. Oriel Saltmarsh wants guards for the night road.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['defense'],
    rewards: {
      success: {
        brass: 20,
        affinity: { saltroad: 10 },
        strength: { saltroad: 1 },
      },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { affinity: { saltroad: -10 } },
    outcomes: {
      success:
        'The caravan made the salt flats by dawn. Not a wheel lost. Not a guest.',
      failure: 'Riders took two wagons on the night road.',
      expired: 'Oriel hired guards elsewhere. She mentions the price daily.',
    },
  },
  {
    id: 'q-d42-barn-harvest',
    title: 'Bring In the Harvest',
    summary:
      'Hester Plowright hides the court in her root cellar. The court brings in her last field before riders burn it.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['urgent'],
    rewards: {
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
      },
      failure: { affinity: { freeholds: -5 } },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'The field is in. Hester hands every reaper a warm egg, like pinning on a medal.',
      failure: 'Half the field burned before the sheaves were stood.',
      expired: 'Hester and her sister brought it in alone. It took all night.',
    },
  },
  {
    id: 'q-d42-rail-salvage',
    title: 'Salvage for the Station',
    summary:
      'Jinx Coupler shelters the court in the collapsed rail station. The price: help strip an engine before anyone else does.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['repair', 'tunnels'],
    rewards: {
      success: {
        brass: 15,
        affinity: { rustline: 10 },
        strength: { rustline: 1 },
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: { affinity: { rustline: -10 } },
    outcomes: {
      success:
        'The engine is stripped to the bolts. Jinx keeps the shiny ones.',
      failure: 'Someone else got to the engine first.',
      expired: 'Jinx stripped it alone. Slowly. She remembers.',
    },
  },
  {
    id: 'q-d42-cave-forage',
    title: 'Forage for the Cave',
    summary:
      'Nobody shelters the court. A handful of revolutionaries and a cold cave are what is left. Find food.',
    region: 'storm-crow-heights',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 4 },
    requirements: [
      { stat: 'wits', band: 'low' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tracking'],
    rewards: {
      success: { local: { yard: 3 }, flags: ['cave-fed'] },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3 } },
    outcomes: {
      success:
        'Roots, a snared hare, somebody’s abandoned flour. Tonight nobody is hungry.',
      failure: 'The hills were bare. The cave ate the last of the bread.',
      expired: 'Nobody went. The cave slept hungry.',
    },
  },
  {
    id: 'q-d44-komodo-bargain',
    title: 'What Komodo Bought',
    summary:
      'Komodo sold the fortress for something. Find out what. Start with his ledgers and the people holding them.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['records', 'tracking'],
    rewards: {
      success: {
        local: { lamplight: 3 },
        affinity: { abbey: -10 },
        flags: ['komodo-bargain-known'],
      },
      partial: { flags: ['komodo-bargain-known'] },
      failure: { affinity: { abbey: -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'It is all in his neat hand. The Abbess promised that what sleeps under the Abbey would sleep through every life now living, if her order got the throne and the payments kept coming. In the margin Komodo underlined the price twice: “Cheaper than war.”',
      partial:
        'One page survived: the Abbess’s promise, and Komodo’s note beside it. “Cheaper than war.” The rest was ash.',
      failure: 'The ledgers were gone. So was everyone who held them.',
      expired: 'Nobody asked. Komodo’s reasons stayed unread.',
    },
  },
  {
    id: 'q-d46-well-that-spoke',
    title: 'The Well That Spoke',
    summary:
      'A dry well halfway up the mission road. Pilgrims say it answers back. It runs down toward the Abbey crypt. Find the way through.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'lore', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tunnels', 'records'],
    rewards: {
      success: { local: { lamplight: 2 }, flags: ['crypt-path-found'] },
      partial: { flags: ['crypt-path-found'] },
      failure: { affinity: { abbey: -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'The well does speak. It repeats you a heartbeat late, in a voice almost yours. Forty steps down is a door with no lock on this side. The party marked the way.',
      partial:
        'The party marked the way to the door and came up fast. Nobody says what the well said back.',
      failure: 'The rope came back up. No bucket. No knot.',
      expired:
        'Nobody went down. At night you can hear the well from the road.',
    },
  },
  {
    id: 'q-d48-bell-clapper',
    title: 'The Bell’s Lost Clapper',
    summary:
      'The Silent Bell has no clapper. Someone took it long ago to stop it ringing. The Archive thinks it knows where. Bring it home before the last fire.',
    region: 'mirefen',
    faction: 'mire-mothers',
    // One day, so the clapper is home for the Day 49 vote (t-040).
    durationDays: 1,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'mid', hidden: true },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tracking', 'records'],
    rewards: {
      triumph: {
        affinity: { 'mire-mothers': 10 },
        flags: [
          'clapper-recovered',
          'relic-eye-earned',
          'relic-hourglass-earned',
        ],
      },
      success: {
        affinity: { 'mire-mothers': 5 },
        flags: ['clapper-recovered'],
      },
      failure: { affinity: { 'mire-mothers': -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The clapper lay in the Mirefen’s deepest pool, in prayer cloth older than the Abbey. The Mire Mothers kept it there on purpose. They gave it up on purpose. Older treasures lay beside it. Those came home too.',
      success:
        'The clapper lay in the Mirefen’s deepest pool, in prayer cloth older than the Abbey. It is heavy. It hums when nobody touches it.',
      failure: 'The fen kept it. The fen keeps most things.',
      expired: 'Nobody went. The clapper stayed in the fen.',
    },
  },
  {
    id: 'q-d50-last-dispatch',
    title: 'The Last Dispatch',
    summary:
      'The Abbess has called down whatever sleeps beneath her crypt. Go to the Abbey. Face her. Put it back to sleep. Whoever goes may not come back.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'lore', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense', 'urgent'],
    aid: FINALE_AID,
    rewards: {
      triumph: { flags: ['horror-sealed', 'abbess-unmasked'] },
      success: { flags: ['horror-sealed'] },
      partial: { flags: ['horror-sealed'] },
      failure: { flags: ['horror-wakes'] },
    },
    expired: { flags: ['horror-wakes'] },
    outcomes: {
      triumph:
        'The Abbess smiled at the party to the end. The thing under the floor stopped keeping time. The crypt door is shut. The party carried her habit out for all to see.',
      success:
        'The crypt door is shut. Whatever kept time beneath the floor has stopped. The Abbess is gone. The sisters will not say where.',
      partial:
        'The door is shut. Barely. The party came home fewer, and older.',
      failure:
        'The party came back up the stair. The door is still open. The singing has not stopped.',
      expired: 'Nobody went to the Abbey. Nobody had to. It came to everyone.',
    },
  },
  {
    id: 'q-d50-crypt-path',
    title: 'The Way Through the Well',
    summary:
      'The well on the mission road runs to the crypt’s back door. A small party can reach the Abbess unseen.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tunnels'],
    aid: FINALE_AID,
    rewards: {
      triumph: { flags: ['horror-sealed', 'abbess-unmasked'] },
      success: { flags: ['horror-sealed'] },
      // t-041: a partial on the well road still shuts the door, the hard way.
      partial: { flags: ['horror-sealed'] },
      failure: { flags: ['horror-wakes'] },
    },
    expired: {},
    outcomes: {
      triumph:
        'They came up through the floor behind the Abbess mid-song. The crypt is shut. The sisters scattered at dawn.',
      success: 'The back door led to the right room. The crypt is shut.',
      partial:
        'They reached the room late and shut the door on the singing from the wrong side. They came back up the well one at a time, counting each other in the dark.',
      failure:
        'The well led somewhere. Not the crypt. The party came back silent.',
      expired: 'Nobody took the well road.',
    },
  },
  {
    id: 'q-d50-ring-the-bell',
    title: 'Ring the Silent Bell',
    summary:
      'The clapper is home. Carry it up the Abbey tower, past the sisters on the stair. Ring the bell that has been silent a hundred years. The Archive believes the sound put the thing to sleep the first time. Whoever climbs may not come down.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'high',
    // t-041: a hundred-year-old tower with the Abbey's sisters on the stair.
    // Whoever climbs may not come down.
    lethal: true,
    tags: ['defense'],
    aid: FINALE_AID,
    rewards: {
      triumph: { flags: ['horror-sealed', 'bell-rung'] },
      success: { flags: ['horror-sealed', 'bell-rung'] },
      // A partial seals the horror but cracks the bell: no Bell Restored.
      partial: { flags: ['horror-sealed'] },
      failure: { flags: ['horror-wakes'] },
    },
    expired: {},
    outcomes: {
      triumph:
        'The Silent Bell rang once. Every bell in the kingdom answered, down to the tin ones on goats. Under the Abbey, something turned over in its sleep. Then it was still.',
      success:
        'The Silent Bell rang once. Under the Abbey, something went quiet.',
      partial:
        'The Silent Bell rang once and split down its whole length on the note. Under the Abbey, something went quiet. Hollow Bell will never hear it again.',
      failure:
        'The clapper struck. The bell cracked down its whole length without a sound.',
      expired: 'The clapper stayed in its cloth. Nobody climbed.',
    },
  },
]

type HostTerms = {
  hideout: string
  speaker: string
  npc?: string
  /** The host faction; the nameless cave has none and feeds the Yard instead. */
  faction?: KingdomFactionId
  lines: SceneLine[]
  questId: string
  accept: { label: string; response: string }
  /** The question that opens what the host is not saying about the terms. */
  ask: { label: string; response: string }
  truth: SceneLine[]
  /** Accept and bargain again, reworded once the truth is out. */
  acceptAgain: { label: string; response: string }
  bargainAgain: { label: string; response: string }
  /**
   * What taking the host's terms costs beyond the work (t-039), on both
   * accept answers, asked or not: the host's terms do not change because
   * the crown did not ask.
   */
  acceptEffects?: Effects
  /**
   * What the reworded bargain buys beyond the host's silence (t-040), merged
   * into `bargainAgain` so it does what its label says.
   * @example bargainEffects: { affinity: { abbey: -5 }, flags: ['d42-abbey-wagons-dropped'] }
   */
  bargainEffects?: Effects
  /** Brass for either bargain; HOST_BARGAIN when omitted. */
  bargainCost?: number
  /** The Day 46 dawn lines when the host comes to collect (HOST_COLLECT). */
  collect?: { paid: string; unpaid: string; kept: string }
  /** Paths that only exist once the emperor has asked. */
  paths: AudienceOption[]
}

/** Brass the host takes instead of hands. */
export const HOST_BARGAIN = 30
/** The dawn the host comes to collect from a court that took its terms. */
export const HOST_COLLECT_DAY = 46
/** What the host takes on that dawn if the promised work was never done. */
export const HOST_DEMAND = 20

const HOST_COLLECT = {
  paid: 'Your host came to collect at dawn. The work the crown promised was never done. Twenty brass instead, counted twice.',
  unpaid:
    'Your host came to collect at dawn. The work was never done and the strongbox was empty. Nobody raised a voice. Breakfast was thinner.',
  kept: 'Your host passed the court’s fire at dawn and nodded once. The crown kept its terms. Out here that is rarer than brass.',
}

const HOST_DUES: DueDef[] = []

/**
 * Accepting a host's terms is a promise of hands (t-040): if the host's
 * quest has not come home a success by the Day 46 dawn, the host collects
 * HOST_DEMAND brass, and an empty strongbox costs the host's goodwill. Work
 * done is remembered. Paying in brass on Day 42 owes nothing later.
 */
const hostDue = (host: HostTerms): DueDef => {
  const lines = host.collect ?? HOST_COLLECT
  const goodwill = (amount: number): Effects =>
    host.faction
      ? {
          affinity: { [host.faction]: amount } as Partial<
            Record<KingdomFactionId, number>
          >,
        }
      : { local: { yard: Math.sign(amount) * 2 } }
  return {
    id: `host-due:${host.hideout}`,
    title: 'The host’s terms',
    day: HOST_COLLECT_DAY,
    when: {
      notFlags: [
        'host-terms-paid',
        `quest:${host.questId}:success`,
        `quest:${host.questId}:triumph`,
      ],
    },
    cost: HOST_DEMAND,
    warning: `Do the host’s work by Day ${HOST_COLLECT_DAY}, or the host collects ${HOST_DEMAND} brass.`,
    line: lines.paid,
    unpaid: {
      line: lines.unpaid,
      effects: { ...goodwill(-10), flags: ['host-demand-unpaid'] },
    },
    lapsed: {
      line: lines.kept,
      effects: { ...goodwill(5), flags: ['host-terms-kept'] },
    },
  }
}

/** Day 42's host terms, one audience per hideout (flag `hideout:<id>`). */
const hostTerms = (host: HostTerms): AudienceDef => {
  HOST_DUES.push(hostDue(host))
  const accept = (label: string, response: string): AudienceOption => ({
    id: 'accept',
    label,
    effects: {
      ...host.acceptEffects,
      ...(host.faction
        ? {
            affinity: { [host.faction]: 5 } as Partial<
              Record<KingdomFactionId, number>
            >,
          }
        : { local: { yard: 2 } }),
      flags: ['host-terms-accepted', ...(host.acceptEffects?.flags ?? [])],
      schedule: [`host-due:${host.hideout}`],
    },
    response,
    postsQuests: [host.questId],
  })
  const bargain = (
    label: string,
    response: string,
    extra: Effects = {},
  ): AudienceOption => ({
    id: 'bargain',
    label,
    requires: { cost: host.bargainCost ?? HOST_BARGAIN },
    effects: {
      ...extra,
      flags: ['host-terms-paid', ...(extra.flags ?? [])],
    },
    response,
  })
  return {
    id: `d42-terms-${host.hideout}`,
    title: 'Lost Without a Banner',
    speaker: host.speaker,
    ...(host.npc ? { npc: host.npc } : {}),
    ...(host.faction ? { faction: host.faction } : {}),
    requires: { flags: [`hideout:${host.hideout}`] },
    lines: host.lines,
    options: [
      accept(host.accept.label, host.accept.response),
      bargain(
        'Pay in brass. The crown pays its own way.',
        'The brass changes hands. Your host looks at you differently. Not kinder. More careful.',
      ),
      {
        id: 'ask',
        label: host.ask.label,
        effects: {},
        response: host.ask.response,
        next: 'price',
      },
    ],
    beats: [
      {
        id: 'price',
        lines: host.truth,
        options: [
          accept(host.acceptAgain.label, host.acceptAgain.response),
          bargain(
            host.bargainAgain.label,
            host.bargainAgain.response,
            host.bargainEffects,
          ),
          ...host.paths,
        ],
      },
    ],
  }
}

const vellumSays = (text: string): SceneLine => ({
  who: 'Keeper Vellum',
  npc: 'abelard-vellum',
  text,
})

/**
 * One line a story flag swaps (`on`) for the line that stands without it
 * (`off`). Line for line, so a variant never changes the scene's length.
 */
type FlagLines = { flag: string; on: SceneLine; off: SceneLine }
type LinePart = SceneLine | FlagLines

const isFlagLines = (part: LinePart): part is FlagLines =>
  typeof part === 'object' && 'flag' in part

/**
 * A scene whose room changes piece by piece with the run (t-039): who came
 * to the last fire, who lost a rank, who went home. Every combination of the
 * parts' flags gets its own exact variant, so each piece reads true at once.
 */
const composed = (
  parts: LinePart[],
): { lines: SceneLine[]; variants: SceneVariant[] } => {
  const keys = [...new Set(parts.filter(isFlagLines).map((part) => part.flag))]
  const linesFor = (held: string[]) =>
    parts.flatMap((part) =>
      isFlagLines(part)
        ? [held.includes(part.flag) ? part.on : part.off]
        : [part],
    )
  const variants: SceneVariant[] = []
  for (let mask = (1 << keys.length) - 1; mask > 0; mask -= 1) {
    const held = keys.filter((_, i) => mask & (1 << i))
    variants.push({
      flags: held,
      notFlags: keys.filter((key) => !held.includes(key)),
      lines: linesFor(held),
    })
  }
  return { lines: linesFor([]), variants }
}

/** Reedlight's lantern on the well rope (t-039): the light it was made for. */
const LANTERN_AID = {
  questId: 'q-d46-well-that-spoke',
  label: 'Reedlight’s lantern on the well rope',
  bonus: 2,
  stat: 'lore' as const,
}

/** Day 47's departures by choice (t-039): a follower who goes home lives. */
const KIYO_HOME = {
  follower: 'F003',
  reason:
    'Kiyo went home to her boy on the forty-seventh night. She left the needles threaded.',
}
const SAFFRON_HOME = {
  follower: 'F002',
  reason:
    'Saffron Kett went home to the canyon on the forty-seventh night. The Pack rode out for the Abbey wall at dawn.',
}

/** Ferro Dunmark's rank, as Day 43 left it. */
const DEMOTED = 'd43-dunmark-demoted'

/**
 * Who bought the tower (t-028, `buyer:<id>`): the Abbey by default, else the
 * Black Verge or House Vask. These scenes swap only the lines that name who
 * holds the tower; the Abbess is still the patron behind every buyer.
 */
const swapLines = (
  lines: SceneLine[],
  swaps: Record<number, SceneLine>,
): SceneLine[] => lines.map((line, i) => swaps[i] ?? line)

const D41_STAYED: SceneLine[] = [
  '“They’re not traitors, Majesty. Most of them. The grey sisters came to the kitchens the first night with hot soup and clean blankets. Said the tower needs cooks whoever sits in it.”',
  '“My sister is one of them. And a boy I taught to bake. They’ll be feeding the Abbess’s guards by now. They’ll be good at it.”',
  '“If the crown goes back, somebody asks what to do with them. Better tonight, by the fire. Not later, by a rope.”',
  {
    who: 'A Gate Watch sergeant',
    text: '“Soup is soup, Foreman. My lads came over the wall with arrows in the air. Yours stayed for supper.”',
  },
  vellumSays(
    '“The record can hold either word, Majesty. Stayed. Or turned. Not both. It keeps the one you choose a long time.”',
  ),
]

const D43_ESCORT: SceneLine[] = [
  '“You sent me with him, Majesty. Doubled the Watch and put me at his stirrup. I watched him the whole mission road. I’ve gone over every hour since.”',
  '“He talked about the price of oats. He asked after my mother. At the Abbey gate he thanked me for the company and said the emperor had been very thorough. He went in. The sisters closed the gate between us. Kindly.”',
  '“By the time I rode back the tower was flying grey. I was the escort. I escorted him to it.”',
  vellumSays(
    '“You did as ordered, Captain. So did he, in his way. That is the trouble with orders.”',
  ),
]

const D45_ENVOY: SceneLine[] = [
  'The Envoy comes alone, on foot, leading a horse too tired to ride. Plum coat muddy to the knee. The white gloves are gone. Their hands are pale as candle wax.',
  'The court goes quiet. Everyone at this fire has been hunted by plum riders this month. Some have lost people to them.',
  '“We bargained with the Abbess too, Majesty. For cures. For the condition. We did not read the price.”',
  '“Now our manors are full of a singing nobody can stop. Our sick sit up in their beds at night, all together, and sing in a language none of us taught them. The Verge asks help of the crown it hunted.”',
  '“Help means this. When you go to shut her door, the Verge rides at your flank. The same riders. And if there is a cure on the other side of that door, our sick have it first.”',
  vellumSays(
    '“The riders who burned the Freehold farms this month were paid in Abbey cures, Majesty. Everyone here knows it. The Envoy knows we know.”',
  ),
]

const D47_FLOUR: SceneLine[] = [
  'Late, the one fire down to coals, Dunmore Ash brings you one of his cooks by the collar. A thin young rabbit, flour to the elbows, a letter crumpled in his fist.',
  'Behind them, the Gate Watch sergeant who caught him explains it, loud, to anyone awake.',
  '“He was leaving it at the stone on the road, Majesty,” says Dunmore. “For the grey sisters. It says where we are. How many. Good clear hand. I taught him his letters.”',
  '“I’m asking you for nothing. I brought him because it’s the law and I’m the foreman. Do what the law says.”',
  {
    who: 'A Gate Watch sergeant',
    text: '“The law says one thing for a man who sells the camp, Majesty. Every soldier at this fire knows what. So does he.”',
  },
]

const D48_MARA: SceneLine[] = [
  'Mara Reedbell walked all night to the court, mayoral sash in her pocket so nobody on the road would know her. Her hand-bell is muffled in a sock.',
  'She sits on the ground by the fire unasked. A mayor never does. She takes the sock off the bell and holds it. She does not ring it.',
  '“Hollow Bell is named for a hollow bell, Majesty. The great one in the Abbey tower. The town paid for it when the town was young. Our grandmothers said the Abbey stole its voice.”',
  '“Bring the clapper home and the town will ring for you. Whatever happens after.”',
]

/** Day 49's fire seats only who is really there (t-039). */
const D49_COALITION = composed([
  'Around the fire sit envoys of everyone still on the map. Nobody has a chair. Everyone has an opinion. Several brought their own supper, to owe nobody.',
  {
    flag: 'd42-abbey-crates-opened',
    on: 'Oriel Saltmarsh burned six wagons on the salt flats this month and has drafted nothing. She watches the grey blankets on the envoys’ shoulders. Granny Umber has a charter fully drafted, in her vest, in triplicate. Elder Corvane’s claws are empty. He came to bargain.',
    off: 'Oriel Saltmarsh has a charter half drafted on a salt manifest. Granny Umber has one fully drafted, in her vest, in triplicate. Elder Corvane’s claws are empty. He came to bargain.',
  },
  {
    flag: DEMOTED,
    on: 'Sergeant Dunmark stands behind your crate. He put his captain’s knot in your hand six days ago. He stands where the captain would have, where an advisor used to stand.',
    off: 'Captain Dunmark stands behind your crate, where an advisor used to stand.',
  },
  {
    flag: 'd44-dike-blown',
    on: 'Sister Reedlight did not come. A heron you have never met stands where the firelight ends, a green lantern on a pole. She does not sit.',
    off: 'Sister Reedlight has set her lantern on the ground between the Moles and the Crows. Nobody looks at it.',
  },
  {
    flag: 'verge-allied',
    on: 'The Envoy of the Black Verge stands at the edge of the light with bare hands. Nobody offers them the fire. They do not ask. They all want one answer. Whose peace, if there is one?',
    off: 'They all want one answer. Whose peace, if there is one?',
  },
  vellumSays(
    '“Whatever you choose, Majesty, I write it down tonight. In case nobody is left tomorrow to remember it differently.”',
  ),
])

/** Who each peace leaves out, and the rule that outranks every peace. */
const D49_LEFT_OUT = composed([
  {
    who: 'Granny Umber',
    npc: 'granny-umber',
    text: '“The Crows’ peace leaves out everybody who can’t pay for rain. Which is everybody I know.”',
  },
  {
    who: 'Elder Corvane',
    npc: 'elder-corvane',
    text: '“The Moles’ peace leaves out everybody with a harvest to bring in while the assembly debates the harvest.”',
  },
  {
    who: 'Ferro Dunmark',
    npc: 'ferro-dunmark',
    text: '“Open roads leave out whoever stands on a road when the next riders come. The Watch’s peace keeps them alive. I won’t pretend it keeps them happy.”',
  },
  {
    flag: 'd44-dike-blown',
    on: {
      who: 'The heron with the lantern',
      text: '“Sister Reedlight sends one sentence. Every peace at this fire leaves out the fen. After the north water she would like to hear the crown say it.”',
    },
    off: {
      who: 'Sister Reedlight',
      npc: 'sister-reedlight',
      text: '“Every peace at this fire leaves out the fen. We are used to it. Once, we would like not to be.”',
    },
  },
  {
    who: 'Mayor Mara Reedbell',
    npc: 'mara-reedbell',
    text: '“And the Bell’s peace puts one small town at the heart of everything. A lot of weight for a town that just got its water back.”',
  },
  {
    who: 'Ferro Dunmark',
    npc: 'ferro-dunmark',
    text: '“One more thing, Majesty. Whatever we sign tonight is a peace for the living. Bury two more by tomorrow night and nobody remembers what was signed. They remember the names.”',
  },
  'Then they all look at you again.',
])

/** One road, every hand on it (t-039): the front door's honest edge. */
const FRONT_DOOR = {
  questId: 'q-d50-last-dispatch',
  label: 'Every hand at the front door',
  bonus: 2,
}

/** The last fire, as the act left the court (t-039). */
const D50_ROADS = composed([
  'Everyone who can still fight is at the fire. The roads to the Abbey are drawn in the dirt with a stick. Every few minutes someone rubs one out and draws it again, different. It does not help.',
  {
    flag: 'crown-in-exile',
    on: 'From the north, faint, comes the singing. Everyone pretends not to hear it. Dunmore Ash stands at the edge of the fire with his ladle. He stood up for the speech on the first night. He stands up now.',
    off: 'From the north, faint, comes the singing. Everyone pretends not to hear it.',
  },
  {
    flag: DEMOTED,
    on: 'Sergeant Dunmark wears a borrowed gorget and no captain’s knot. Vellum has his book. Your host has brought out the last of the good food. Your host thinks this is the end too.',
    off: 'Captain Dunmark wears a gorget again. Borrowed. Vellum has his book. Your host has brought out the last of the good food. Your host thinks this is the end too.',
  },
  {
    flag: 'watch-returned',
    on: 'Twenty-two of the Watch sit behind him in a line, helmets in their laps. They came down off the ridge for this.',
    off: 'Behind him sit the few of the Watch who never rode out. There is room in the line.',
  },
  {
    flag: 'verge-allied',
    on: 'Plum riders water their horses at the stream below the camp. The court’s people walk past them with their hands near their knives. The riders let them.',
    off: 'The stream below the camp runs black. The horses drink, then lift their heads toward the north and stop drinking.',
  },
  {
    flag: 'd47-pack-rides',
    on: 'Down the valley forty Pack riders wait with their fires out. Saffron is not with them. The front door is the obvious way. There may be others, if the court has earned them.',
    off: 'The front door is the obvious way. There may be others, if the court has earned them.',
  },
])

export const ACT_FIVE_DAYS: readonly DayDef[] = [
  {
    day: 41,
    title: 'Ash Under the Grain',
    advisor: VELLUM,
    briefings: [
      {
        id: 'tower-taken',
        source: 'A Gate Watch runner',
        text: 'The tower flies the Abbey’s grey banner this morning.',
        truth: true,
        variants: [
          {
            flags: ['buyer:black-verge'],
            text: 'The tower flies the plum banner of the Black Verge this morning.',
          },
          {
            flags: ['buyer:old-houses'],
            text: 'The tower flies the black swan of House Vask this morning.',
          },
        ],
      },
      {
        id: 'komodo-sorry',
        source: 'A Saltroad drover',
        text: 'Young Komodo has already sent a letter of apology.',
        truth: false,
      },
      {
        id: 'riders-out',
        source: 'The host’s lookouts',
        text: 'Plum riders are searching the roads around the tower.',
        truth: true,
        variants: [
          {
            flags: ['hideout:mole-tunnels'],
            source: 'Mole sappers at the listening holes',
          },
          {
            flags: ['hideout:crow-cave'],
            source: 'Crow sentries on the cave lip',
          },
          {
            flags: ['hideout:bell-cellars'],
            source: 'The bell-ringer’s boy, from the chapel loft',
          },
          {
            flags: ['hideout:wagon-circle'],
            source: 'Pack outriders',
          },
          {
            flags: ['hideout:moving-caravan'],
            source: 'The caravan’s rear guard',
          },
          {
            flags: ['hideout:freehold-barn'],
            source: 'A Freehold girl in the hayloft',
          },
          {
            flags: ['hideout:rail-station'],
            source: 'Rustline lookouts on the water tower',
          },
          {
            flags: ['hideout:nameless-cave'],
            source: 'The one revolutionary still awake',
          },
        ],
      },
    ],
    komodo:
      'Majesty. I read every report that came in overnight. Twice. Young Komodo left you a seat at someone else’s fire. Nothing more. It is a start. The Archive has begun on less.',
    quests: ['q-d41-stragglers'],
    audiences: [
      {
        id: 'd41-roll-call',
        title: 'Who Came With You',
        speaker: 'The court in hiding',
        lines: [
          'Someone has lit a fire. Around it, in borrowed blankets, sits what is left of an imperial court: a few followers, a few guards, a cook still holding a ladle. The smoke goes up into a dark that isn’t yours.',
          'Nobody has unpacked. Bundles sit at their feet, ready to go either way.',
          'They are all looking at you. Nobody says “What now?”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'The cook is Dunmore Ash, foreman of the Yard. He never says more than he needs to. “Forty of the Yard came out through the kitchens with me, Majesty. Sixty didn’t. Somebody ought to say something. Not me.”',
          },
          vellumSays(
            '“Whatever is said tonight, Majesty, I write down. So nobody is surprised later.”',
          ),
        ],
        options: [
          {
            id: 'ask-missing',
            label: 'Ask Dunmore about the sixty who stayed.',
            effects: {},
            response:
              'Dunmore lays the ladle across his knees. For him, that is a speech.',
            next: 'stayed',
          },
          {
            id: 'speech',
            label:
              'Tell them the truth. The crown is still here. The counting can wait.',
            effects: {
              local: { yard: 2, 'gate-watch': 2, ledger: -1 },
              flags: ['crown-in-exile'],
            },
            response:
              'It is not a good speech. It is short. Your voice cracks once. By the end the cook has put down the ladle and is standing. The court’s clerk has not started counting. He looks at the bundles and does the sum in his head anyway.',
          },
          {
            id: 'count',
            label: 'Count the brass and the bread first.',
            effects: { local: { ledger: 2 } },
            response:
              'Less than you hoped. More than you feared. Somebody writes it down. Habit.',
          },
        ],
        beats: [
          {
            id: 'stayed',
            speaker: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            lines: D41_STAYED,
            variants: [
              {
                flags: ['buyer:black-verge'],
                lines: swapLines(D41_STAYED, {
                  1: '“My sister is one of them. And a boy I taught to bake. They’ll be feeding plum riders by now. Riders eat a lot. They’ll be good at it.”',
                }),
              },
              {
                flags: ['buyer:old-houses'],
                lines: swapLines(D41_STAYED, {
                  1: '“My sister is one of them. And a boy I taught to bake. They’ll be feeding Lady Vask’s sons by now, off the good plates. They’ll be good at it.”',
                }),
              },
            ],
            options: [
              {
                id: 'speech',
                label:
                  'Tell the fire the crown is still here. For those who came and those who couldn’t.',
                effects: {
                  local: { yard: 2, 'gate-watch': 2, ledger: -1 },
                  flags: ['crown-in-exile'],
                },
                response:
                  'It is not a good speech. It is short. Your voice cracks once. By the end Dunmore is standing. After a moment, so is the sergeant.',
              },
              {
                id: 'count',
                label: 'Count the brass and bread first. The sixty can wait.',
                effects: { local: { ledger: 2 } },
                response:
                  'Less than you hoped. More than you feared. Dunmore says nothing. He stirs.',
              },
              {
                id: 'door-open',
                label:
                  'Send word to the tower kitchens: anyone who walks out eats here. No questions.',
                effects: {
                  local: { yard: 3, 'gate-watch': -2 },
                  flags: ['d41-kitchen-door-open'],
                },
                response:
                  'Dunmore writes it in flour on the back of a board. A stablehand carries it into the dark. The sergeant spits in the fire. “That’s how spies get fed.”',
              },
              {
                id: 'names',
                label:
                  'Have Vellum write down every name that stayed. The crown decides later.',
                effects: {
                  local: { 'gate-watch': 2, lamplight: 1, yard: -3 },
                  flags: ['d41-stayers-listed'],
                },
                response:
                  'Vellum writes sixty names in his slow, even hand. Dunmore watches. He does not ask to see the page. He does not hand you soup again that night.',
              },
            ],
          },
        ],
      },
      {
        id: 'd41-archive-saved',
        title: 'The Books That Got Out',
        speaker: 'Keeper Abelard Vellum',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['archive-evacuated'] },
        lines: [
          'Keeper Vellum carried the last crate the whole way himself. Mud to the knee, he sets it by the fire like it is sleeping. Opens it.',
          'Packed in straw: the Archive’s oldest maps, two hundred years of tax rolls, one ledger bound in Komodo’s brass-buttoned style.',
          '“His hand, Majesty. Every page. I matched it that night. I am sorry I was not faster.”',
          '“A working ledger. Payments, letters, names. Some of the names sit at this fire.”',
        ],
        options: [
          {
            id: 'ask-names',
            label: 'Ask whose names are in it.',
            effects: {},
            response:
              'Vellum takes a long time choosing the page. Not the first one he turns to.',
            next: 'names',
          },
          {
            id: 'read',
            label: 'Read it together. Tonight.',
            effects: {
              local: { lamplight: 3 },
              flags: ['komodo-ledger-saved'],
            },
            response:
              'You read until the fire is embers. Komodo kept careful accounts of everything. Including you.',
          },
        ],
        beats: [
          {
            id: 'names',
            lines: [
              '“Lady Vask’s house took his money two years and asked nothing. Factor Tallow lent against the Abbey’s credit, and he signed for it. A sergeant of the Watch. A clerk of my own Archive. A stablehand asleep twenty feet from you.”',
              '“And a column with your name on top, Majesty. Headed: What the emperor will forgive. Kept current to the last week.”',
              '“A ledger like this is a weapon. I would like to shelve it. Weapons do not always stay shelved.”',
            ],
            options: [
              {
                id: 'read',
                label: 'Read it together tonight. Then shelve it.',
                effects: {
                  local: { lamplight: 3 },
                  flags: ['komodo-ledger-saved'],
                },
                response:
                  'You read until the fire is embers. Komodo kept careful accounts of everything. Including you. The forgiveness column is longer than you guessed.',
              },
              {
                id: 'publish',
                label:
                  'Copy the payments to every faction. Let the kingdom see who was bought.',
                effects: {
                  local: { lamplight: 2, 'old-houses': -3, ledger: -2 },
                  affinity: { abbey: -5 },
                  flags: ['komodo-ledger-saved', 'd41-ledger-published'],
                },
                response:
                  'Vellum copies it himself. It takes all night. Within the week the stablehand is gone from camp. Lady Vask writes that she was always the crown’s friend. Her hand shakes.',
              },
              {
                id: 'burn',
                label:
                  'Burn it. The court can’t rebuild if everyone at the fire is a name in his book.',
                effects: {
                  local: { lamplight: -3, yard: 2, 'old-houses': 1 },
                  flags: ['d41-ledger-burned'],
                },
                response:
                  'Vellum does not stop you. He watches the pages curl, the archive keys silent at his belt. Then he sits alone at the edge of the firelight until dawn.',
              },
            ],
          },
        ],
      },
      {
        // Callback: the emperor let Komodo ride out on the crown's business (Day 40).
        id: 'd41-trusted-road',
        title: 'The Leave You Gave',
        speaker: 'Keeper Abelard Vellum',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['komodo-leave-granted'] },
        lines: [
          'When the camp is asleep, Vellum sits beside you with a sheaf of gate-logs he should not have been able to save.',
          '“I have read how it was done, Majesty. It was not clever. I keep coming back to that.”',
          '“He rode out with the crown’s leave. Every gate on the mission road opened, because you said he rode on the crown’s business. At the Abbey he gave the sisters your seal. They gave it to the tower guard. The guard opened the doors. Nobody disobeyed anyone.”',
          '“I need to know what to write. Whether trust failed. Or only him.”',
        ],
        options: [
          {
            id: 'ask-gate',
            label: 'Ask what Komodo said to the guard at the last gate.',
            effects: {},
            response:
              'Vellum finds the page without looking. He has read it many times.',
            next: 'last-gate',
          },
          {
            id: 'trust-stands',
            label:
              'Write that trust was not the mistake. The crown keeps trusting people.',
            effects: {
              local: { yard: 2, 'gate-watch': -1 },
              flags: ['d41-trust-kept'],
            },
            response:
              'Vellum writes it. He adds a smaller line underneath and does not show you. That night a guard you hardly know stands the watch. You sleep anyway.',
          },
          {
            id: 'two-hands',
            label:
              'Write that no order goes out under one seal again. Every command needs two hands.',
            effects: {
              local: { 'gate-watch': 2, lamplight: 1, yard: -2 },
              flags: ['d41-two-hands'],
            },
            response:
              '“Two hands,” Vellum says, and writes it. By noon the cook needs a countersignature for flour. Nobody calls it a bad rule. Out loud.',
          },
        ],
        beats: [
          {
            id: 'last-gate',
            lines: [
              '“That he was sorry for the hour. That the emperor would understand by morning. Then he asked the guard’s name. Wrote it down.”',
              '“He was polite to every guard on that road, Majesty. That is harder to forgive than the seal.”',
              '“There is a third thing I could write. Some of the orders under that seal were his. The land grants. The pardons. The Watch commissions. I could write that none of them stand.”',
            ],
            options: [
              {
                id: 'trust-stands',
                label:
                  'Write that trust was not the mistake. The crown keeps trusting people.',
                effects: {
                  local: { yard: 2, 'gate-watch': -1 },
                  flags: ['d41-trust-kept'],
                },
                response:
                  'Vellum writes it and underlines it. He never underlines. “It will be quoted against you,” he says. “I hope it is quoted for you too.”',
              },
              {
                id: 'two-hands',
                label: 'Write that every command needs two hands from now on.',
                effects: {
                  local: { 'gate-watch': 2, lamplight: 1, yard: -2 },
                  flags: ['d41-two-hands'],
                },
                response:
                  '“Two hands,” Vellum says, and writes it. By noon the cook needs a countersignature for flour. The Watch countersign each other.',
              },
              {
                id: 'void-seal',
                label:
                  'Write that every order under the old seal is void. The good ones too.',
                effects: {
                  local: { lamplight: 2, 'old-houses': -3 },
                  flags: ['d41-seal-voided'],
                },
                response:
                  'Vellum writes it slowly. He knows what it does. By morning every Old House land grant under that seal is paper. Lady Vask replies within the week. Two words. Neither is polite.',
              },
            ],
          },
        ],
      },
      {
        // Callback: the emperor kept Komodo at court on the last night (Day 40).
        id: 'd41-midnight-gate',
        title: 'Who Opened the Gate',
        speaker: 'A young sentry of the Gate Watch',
        faction: 'gate-watch',
        requires: { flags: ['komodo-asked-to-stay'] },
        lines: [
          'A young sentry in a scorched Watch tabard has sat outside the firelight all evening. Not eating. When the camp goes quiet she comes and kneels. Unasked. Rehearsed.',
          '“I had the gate at midnight, Majesty. The advisor came down to check it. Said you’d asked him to stay, and he had, and now he’d like the road a moment. For the air.”',
          '“He had the seal. He always had the seal. I lifted the bar. He went out. They came in.”',
          '“I walked here to be judged. I’d rather it was you.”',
        ],
        options: [
          {
            id: 'ask-words',
            label: 'Ask what Komodo said to her on his way out.',
            effects: {},
            response:
              'She swallows. She has said the words to herself until they stopped being words.',
            next: 'last-words',
          },
          {
            id: 'forgive',
            label:
              'Tell her the fault is the crown’s. You kept him by the fire yourself.',
            effects: {
              local: { 'gate-watch': -1, yard: 2 },
              flags: ['d41-crown-owns-the-gate'],
            },
            response:
              'She does not understand. Then she puts her face in her hands. In the morning she is first up, splitting wood. All day.',
          },
          {
            id: 'judge',
            label:
              'She broke her watch. Strip her tabard in front of the fire.',
            effects: {
              local: { 'gate-watch': 2, yard: -2 },
              flags: ['d41-sentry-stripped'],
            },
            response:
              'The sergeant does it quick, not cruel. She folds the tabard herself before handing it over. Nobody at the fire looks at you for a while.',
          },
          {
            id: 'repost',
            label: 'Put her back on the gate. Tonight. Same post.',
            effects: {
              local: { 'gate-watch': -2, yard: 1 },
              flags: ['d41-sentry-reposted'],
            },
            response:
              'The sergeant opens his mouth. Shuts it. She takes the bar in both hands. All night she does not sit.',
          },
        ],
        beats: [
          {
            id: 'last-words',
            lines: [
              '“He said: tell the emperor I stayed, as asked. Then he said: lift it all the way, please. The horses are tall.”',
              '“He thanked me, Majesty. He always thanked the gate.”',
              {
                who: 'A Gate Watch sergeant',
                text: '“He wrote that line in advance. He made you carry his joke, girl. Majesty, the Watch wants somebody to answer for that gate. It can’t be him.”',
              },
              vellumSays(
                '“It can be the record, Sergeant. The record answers for a great deal, if allowed to say what happened.”',
              ),
            ],
            options: [
              {
                id: 'forgive',
                label:
                  'Tell her the fault is the crown’s. You asked him to stay.',
                effects: {
                  local: { 'gate-watch': -1, yard: 2 },
                  flags: ['d41-crown-owns-the-gate'],
                },
                response:
                  'The sergeant looks at you like you handed him a live coal. The sentry does not cry. Next morning she is first up, splitting wood. All day.',
              },
              {
                id: 'judge',
                label:
                  'She lifted the bar. Strip her tabard in front of the fire.',
                effects: {
                  local: { 'gate-watch': 2, yard: -2 },
                  flags: ['d41-sentry-stripped'],
                },
                response:
                  'The sergeant does it quick, not cruel. She folds the tabard herself before handing it over. Nobody at the fire looks at you for a while.',
              },
              {
                id: 'witness',
                label:
                  'Let her tell the camp what happened, word for word. They decide.',
                effects: {
                  local: { lamplight: 2, 'gate-watch': -1 },
                  flags: ['d41-sentry-testified'],
                },
                response:
                  'She tells it standing by the fire. Twice. The first time her voice goes. Nobody decides anything. A cook brings her a bowl. Her first meal in three days.',
              },
              {
                id: 'repost',
                label:
                  'Give her the bar again. Tonight. The joke was his. The gate is hers.',
                effects: {
                  local: { 'gate-watch': -2, yard: 1 },
                  flags: ['d41-sentry-reposted'],
                },
                response:
                  'The sergeant opens his mouth. Shuts it. She takes the bar in both hands. All night she does not sit. At dawn she lifts it halfway for the wood party, and no higher.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 42,
    title: 'Lost Without a Banner',
    advisor: VELLUM,
    briefings: [
      {
        id: 'loyal-houses',
        source: 'A message from the tower',
        text: 'The Old Houses refuse to recognise the Abbess.',
        truth: false,
        variants: [
          {
            flags: ['buyer:black-verge'],
            text: 'The Old Houses refuse to recognise the Black Verge.',
          },
          {
            flags: ['buyer:old-houses'],
            text: 'The Old Houses refuse to recognise Lady Vask.',
          },
        ],
      },
      {
        id: 'host-terms',
        source: 'Your host',
        text: 'The people sheltering the court want to talk terms.',
        truth: true,
        variants: [
          {
            flags: ['hideout:mole-tunnels'],
            source: 'Granny Umber',
            text: 'The assembly sheltering the court wants to talk terms. It voted on you last night.',
          },
          {
            flags: ['hideout:crow-cave'],
            source: 'Elder Corvane',
            text: 'The Conclave sheltering the court wants to talk terms. Crows put everything in writing.',
          },
          {
            flags: ['hideout:bell-cellars'],
            source: 'Mayor Mara Reedbell',
            text: 'Hollow Bell is hiding the court under its chapel. The mayor wants to talk terms.',
          },
          {
            flags: ['hideout:wagon-circle'],
            source: 'Captain Gristle Vane',
            text: 'The Pack sheltering the court wants to talk terms. Vane has already counted the spoons.',
          },
          {
            flags: ['hideout:moving-caravan'],
            source: 'Oriel Saltmarsh',
            text: 'The caravan carrying the court wants to talk terms before the next stop.',
          },
          {
            flags: ['hideout:freehold-barn'],
            source: 'Hester Plowright',
            text: 'The Freeholders hiding the court want to talk terms before the harvest comes in.',
          },
          {
            flags: ['hideout:rail-station'],
            source: 'Jinx Coupler',
            text: 'The salvagers sheltering the court want to talk terms. Everything here has a price chalked on it.',
          },
          {
            flags: ['hideout:nameless-cave'],
            source: 'The revolutionaries',
            text: 'The handful of rebels sharing their cave want to talk terms. There are not many terms to talk.',
          },
        ],
      },
      {
        id: 'income-gone',
        source: 'The court’s purse',
        text: 'No taxes reached the court this morning.',
        truth: true,
      },
    ],
    komodo:
      'Every host has a price, Majesty. The honest ones name it the second day. Pay it. A banner is cloth until someone stands behind it.',
    quests: [],
    audiences: [
      hostTerms({
        hideout: 'mole-tunnels',
        bargainEffects: { affinity: { moles: 5 } },
        collect: {
          paid: 'Granny Umber came to your blanket at dawn with her slate. The long tunnel was never propped. Twenty brass, counted into two piles. One for each side of the vote.',
          unpaid:
            'Granny Umber came at dawn with her slate. The props were never set and the strongbox was empty. She wrote one line. That night the thirty met without her.',
          kept: 'Granny Umber knocked on the third prop at dawn and listened. Then she crossed the court off her slate. Paid in full.',
        },
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        lines: [
          'The tunnels smell of wet clay and lamp smoke. Meeting notices on every prop: wages, water, too many meetings.',
          'Granny Umber gives you the driest chamber and a hot mug. She peers at you over thick spectacles. You are a motion she has not decided to second.',
          '“Twenty years we dug under your tower, Majesty. Twenty years we wanted it empty. Now it’s empty, and the wrong people sit in it.”',
          '“Stay as long as you like. But down here everybody digs. Even emperors.”',
          {
            who: 'A young Mole organiser',
            text: '“Some of us dug to bring the crown down, Granny. Not to tuck it in.”',
          },
        ],
        questId: 'q-d42-tunnel-props',
        accept: {
          label: 'Accept her terms. Pick up a shovel.',
          response:
            '“Good,” says Granny Umber. “Mind the third prop. It sulks.”',
        },
        ask: {
          label: 'Ask how the assembly voted on sheltering you.',
          response:
            'Granny Umber taps her cane twice. The young organiser leaves.',
        },
        truth: [
          '“Thirty-one to thirty, Majesty. The thirty-first was me. I’m old. They know it.”',
          '“The thirty would’ve sent you up the mission road with a ribbon on. There’s a price on your head in grey brass. It’d feed every burrow in the badlands through winter.”',
          '“I didn’t win that vote for you. I won it for me. I told them a crown that owes the Moles beats a crown the Abbess owns. Prove me right, or I lose the next one.”',
          vellumSays(
            '“They will want it in writing, Majesty. The Moles always do. I have read all their manifestos. Twice.”',
          ),
        ],
        acceptAgain: {
          label: 'Take a shovel with the rest of them. Deeds first.',
          response:
            '“Deeds first,” says Granny Umber. “Mind the third prop. It sulks. So do the thirty.”',
        },
        bargainAgain: {
          label:
            'Pay the burrows in brass. Give the thirty something besides your head.',
          response:
            'Granny Umber counts it into two exact piles, one per side of the vote. “That’ll keep them arguing,” she says. “Arguing keeps our hands off people.”',
        },
        paths: [
          {
            id: 'sign-charter',
            label:
              'Sign the assembly’s charter. After the war, the crown answers to councils.',
            effects: {
              affinity: { moles: 10 },
              local: { 'old-houses': -3 },
              flags: ['d42-mole-charter-signed'],
            },
            response:
              'Granny Umber has the charter out of her vest before you finish. You sign it on a crate by lamplight. By morning thirty-one votes are thirty-five. One day Lady Vask will read a copy and say nothing for a long time.',
          },
          {
            id: 'face-thirty',
            label: 'Face the thirty yourself. Tonight. No guards.',
            effects: {
              affinity: { moles: 5 },
              local: { 'gate-watch': -2, yard: 1 },
              flags: ['d42-faced-the-thirty'],
            },
            response:
              'You stand in a chamber of people who would sell you and say you know it. The first hour goes badly. The second, better. Two of the thirty walk you back to your blanket. Escort or guard, they don’t say.',
          },
        ],
      }),
      hostTerms({
        hideout: 'crow-cave',
        bargainEffects: { flags: ['d42-messenger-silenced'] },
        collect: {
          paid: 'Elder Corvane sent a young crow at dawn. The court never stood its watch. Twenty brass went into the stone basin. Nobody counted it aloud.',
          unpaid:
            'Elder Corvane came down off his ledge at dawn. The watch was never stood and the strongbox was empty. He wrote it in the Conclave’s book. Crows put everything in writing.',
          kept: 'Elder Corvane stopped by the court’s fire at dawn. “Clean,” he said. He went back up to his ledge.',
        },
        speaker: 'Elder Corvane of the Storm Crows',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'The cave smells of rain and feathers. Water runs down one wall into a stone basin. The Crows drink by rank. No hurry.',
          'Elder Corvane watches you from a ledge above the fire. The copper chimes on his mantle are silent. The younger crows read that as weather coming.',
          '“The Crows keep what they shelter, Majesty. We have kept worse than an emperor. And better.”',
          '“In return, the court keeps watch with us. The Abbey road needs more eyes. Ours are old.”',
        ],
        questId: 'q-d42-crow-watch',
        accept: {
          label: 'Accept his terms. Stand the watch.',
          response:
            'Corvane nods once. “Clean,” he says. Then he goes back to watching the road.',
        },
        ask: {
          label: 'Ask who else the Crows are keeping.',
          response:
            'Corvane looks at you a long time. Nobody has asked him that before.',
        },
        truth: [
          '“There is a sister of the Abbey in the next cave. A messenger. Grey robe. Polite. She came in from the rain two nights before you.”',
          '“The Crows keep what they shelter. Her too. We take no sides in a storm. We sell rain to whoever stands in the field.”',
          '“She asked where you are. We did not tell her. We did not tell you where she was. Until now. That is neutral.”',
          vellumSays(
            '“A messenger knows the Abbey’s roads, Majesty. By now she knows ours.”',
          ),
        ],
        acceptAgain: {
          label:
            'Keep the watch with the Crows. Leave their other guest alone.',
          response:
            'Corvane nods once. “Clean,” he says. That night the sister sings softly in the next cave. You do not go and look.',
        },
        bargainAgain: {
          label:
            'Pay the Conclave to keep its other guest quiet and its eyes on the road.',
          response:
            'The brass goes into the stone basin. Crows keep brass there. Corvane does not count it. He doesn’t need to.',
        },
        paths: [
          {
            id: 'take-messenger',
            label:
              'Demand the Abbey’s messenger. Shelter does not cover spies.',
            effects: {
              affinity: { 'storm-crows': -10 },
              local: { 'gate-watch': 2 },
              flags: ['d42-abbey-messenger-taken'],
            },
            response:
              'Corvane does not stop you. Or help. The sister comes quietly, smiling, and tells your guards their mothers’ names. By morning the court sleeps at the draughty end of the cave.',
          },
          {
            id: 'send-word',
            label:
              'Send the messenger home with a letter: the crown knows what sleeps under the Abbey floor.',
            effects: {
              affinity: { 'storm-crows': 5 },
              local: { 'gate-watch': -2 },
              flags: ['d42-letter-to-abbess'],
            },
            response:
              'You write four lines. The sister reads them, thanks you, and walks into the rain with your letter against her heart. Corvane watches her down the mountain. “Bold,” he says. It is not praise.',
          },
        ],
      }),
      hostTerms({
        hideout: 'bell-cellars',
        bargainEffects: { affinity: { 'hollow-bell': 5 } },
        collect: {
          paid: 'Mara Reedbell came down the cellar stair at dawn. The aqueduct still leaks. Twenty brass for the hands that never came. She wrote a receipt. Mayors do.',
          unpaid:
            'Mara Reedbell came down the cellar stair at dawn. The aqueduct still leaks and the strongbox was empty. She said nothing. The council met over your heads. Every word came through the boards.',
          kept: 'At dawn the chapel tap ran clear. Mara Reedbell brought a cup of it down the cellar stair and set it by your blanket.',
        },
        speaker: 'Mayor Mara Reedbell of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'The chapel cellars are cool and crowded: last year’s cider, the town’s records in oilcloth, an imperial court asleep between the casks.',
          'Above, the town’s small bell is silent on your account. The children are told it is broken. They are told not to tell anyone it isn’t.',
          'Mara Reedbell comes down the stair with a lamp and wipes her hands on her mended sash.',
          '“Stay, Majesty. Hollow Bell has hidden worse than a crown, and been ashamed of most of it. But this town gave its water to the war. The aqueduct has to run.”',
        ],
        questId: 'q-d42-bell-water',
        accept: {
          label: 'Accept her terms. Send hands to the aqueduct.',
          response:
            'Mara smiles for the first time in days. “Then you’re welcome here. As long as the Bell stands.”',
        },
        ask: {
          label: 'Ask whether anyone else has asked the Bell for you.',
          response:
            'Mara sets the lamp on a cider barrel. Her hand stays on it.',
        },
        truth: [
          '“Sister Marrow came to the chapel door last night. Kind as anything. Brought a cask of the Abbey’s deep-well water. For the children.”',
          '“She said the Abbess would keep Hollow Bell in water a hundred years, for one guest in a cellar. She didn’t say which guest. She didn’t need to.”',
          '“I told her no. I haven’t told the council. If they hear it from anyone but me, Majesty, I’m not mayor by Thursday, and you’re not in this cellar by Friday.”',
          vellumSays(
            '“The Bell has taken that water before, Majesty. The mayor remembers what it cost better than any archive.”',
          ),
        ],
        acceptAgain: {
          label: 'Keep her secret. Send hands to the aqueduct.',
          response:
            'Mara breathes out. “Then you’re welcome here,” she says. “As long as the Bell stands.” She pours the Abbey’s cask into the gutter. Slowly.',
        },
        bargainAgain: {
          label:
            'Pay the town for its trouble. Make the next cask easier to refuse.',
          response:
            'Mara puts the brass in the chapel box uncounted. “For the wards,” she says. “They’ll drink our own water and never know why it tastes better.”',
        },
        paths: [
          {
            id: 'tell-council',
            label:
              'Tell the council about the Abbess’s offer yourself. Tonight. Let them vote.',
            effects: {
              affinity: { 'hollow-bell': -5 },
              local: { lamplight: 2 },
              flags: ['d42-bell-council-told'],
            },
            response:
              'The council meets in the cellar beside your blanket. There is nowhere else. Eleven to four, they keep you. Mara does not look at you during the count. After, she climbs to the bell that is not broken. She does not ring it.',
          },
          {
            id: 'take-water',
            label:
              'Take the Abbey’s water for the children. Send Marrow nothing but thanks.',
            effects: {
              affinity: { 'hollow-bell': 5, abbey: 5 },
              local: { lamplight: -2 },
              flags: ['d42-abbey-water-taken'],
            },
            response:
              'The children drink it. Cold, clean, faintly sweet. Mara watches with her hands folded tight. That evening Sister Marrow is seen at the edge of town, smiling, counting cellar windows.',
          },
        ],
      }),
      hostTerms({
        hideout: 'wagon-circle',
        bargainEffects: { affinity: { jackalwire: 5 } },
        collect: {
          paid: 'Gristle Vane came round at dawn with his hat out. Two wagons still sat on blocks. Twenty brass. He bit every bit.',
          unpaid:
            'Gristle Vane came round at dawn with his hat out. The wagons still sat on blocks and the strongbox was empty. He laughed. The drum stopped. The court slept in shifts that night.',
          kept: 'Every wagon in the circle rolled at dawn. Gristle Vane painted a second small crown on his axle, beside the first.',
        },
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'The painted wagons have closed into a ring in the canyon, wheel to wheel. The court’s blankets sit inside like a yolk.',
          'Somebody is always playing something. Tonight a fiddle, badly. A drum, well.',
          'Captain Gristle Vane drops off a wagon roof in his feathered greatcoat and bows so low his ear-chain rings.',
          '“Nobody finds the Pack unless the Pack wants finding, Majesty. But a circle that stops rolling is a target. You’re the most valuable thing we’ve ever parked.”',
        ],
        questId: 'q-d42-wagon-wheels',
        accept: {
          label: 'Accept his terms. Get grease on your hands.',
          response:
            'Vane grins all his teeth. “An emperor with grease on his hands. The Pack will sing about it.”',
        },
        ask: {
          label: 'Ask what the Pack has been offered for you.',
          response: 'Vane’s grin does not move. The drum stops.',
        },
        truth: [
          '“A wagonload of grey brass. The southern tolls forever, under the Abbess’s seal. And medicine, all the pups can drink. That part I had to think about.”',
          '“I said no. I like you, and a Pack that sells its guests never sells again. But I’m a raider, Majesty. The canyon is listening. Give me something to tell it.”',
          '“What does the crown offer, with no tower?”',
          vellumSays(
            '“Those tolls are the Saltroad’s grain and medicine, Majesty. Promise him anything, somebody else pays.”',
          ),
        ],
        acceptAgain: {
          label:
            'Offer what the crown has: hands, grease, and a debt it will remember.',
          response:
            'Vane thinks. Then he roars. “An emperor with grease on his hands. The Pack will sing about it.” The drum starts again.',
        },
        bargainAgain: {
          label: 'Pay brass now, while the crown still has some.',
          response:
            'Vane bites a brass bit and pockets the rest. “Cash,” he says. “Cash never asks what happens after.”',
        },
        paths: [
          {
            id: 'promise-tolls',
            label:
              'Promise the Pack the southern toll bridge for good, after the war.',
            effects: {
              affinity: { jackalwire: 10, saltroad: -10 },
              flags: ['d42-pack-tolls-promised'],
            },
            response:
              'By morning the promise is painted on Vane’s wagon in letters a foot high. On the Saltroad, a factor reading the night’s dispatches puts down her pen.',
          },
          {
            id: 'dare',
            label:
              'Tell him the crown is not for bidding. If the Pack wants to sell, let it sell.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { 'gate-watch': 2, yard: 1 },
              flags: ['d42-dared-the-pack'],
            },
            response:
              'The circle goes quiet. Then Vane laughs, too loud. Nobody is selling anybody. The fiddle starts again. That night the court sleeps in shifts. So does the Pack.',
          },
        ],
      }),
      hostTerms({
        hideout: 'moving-caravan',
        bargainEffects: {
          affinity: { abbey: -5 },
          flags: ['d42-abbey-wagons-dropped'],
        },
        collect: {
          paid: 'Oriel Saltmarsh counted the court at dawn, out loud, as always. The night road had gone unguarded. Twenty brass, also counted out loud.',
          unpaid:
            'Oriel Saltmarsh counted the court at dawn. The night road had gone unguarded and the strongbox was empty. She counted the court again. Slower. As cargo.',
          kept: 'Oriel Saltmarsh counted the court at dawn and stopped at you. “Guard,” she said. Then she went on counting.',
        },
        speaker: 'Oriel Saltmarsh of the Saltroad',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'The caravan never stops more than an hour. The court sleeps rocking under tarpaulins in the salt wagons. Brine, wet canvas, somebody’s goat.',
          'Oriel Saltmarsh walks the line twice an hour, counting wagons out loud. You are a wagon now. She counts you too.',
          '“Nobody catches what keeps moving, Majesty. But the night road needs guards. You brought some.”',
          '“Plainly: every hour you ride with us, the Abbess may decide the Saltroad is her enemy. Make the hour worth it.”',
        ],
        questId: 'q-d42-caravan-guard',
        accept: {
          label: 'Accept her terms. Ride guard on the night road.',
          response:
            '“Splendid,” says Oriel. “We leave in twenty minutes. We always leave in twenty minutes.”',
        },
        ask: {
          label: 'Ask what the back half of the caravan carries.',
          response:
            'Oriel’s beak clacks once. She stops counting. She never stops counting.',
        },
        truth: [
          '“Medicine and grain up front. The back six carry sealed Abbey freight. Grey cloth, lamp oil, and crates I’m paid well not to open.”',
          '“The Abbey has paid on time for eleven years, Majesty. Nobody else has. Half my drivers eat because of those six wagons.”',
          '“So you ride to war against the Abbess in a caravan making her deliveries. You should know. You won’t like it.”',
          vellumSays(
            '“Eleven years, Majesty. Elder Corvane would give the same number for the carts on the mission road.”',
          ),
        ],
        acceptAgain: {
          label:
            'Guard the whole caravan, the back six too. Drivers have to eat.',
          response:
            '“Splendid,” says Oriel, flat. “We leave in twenty minutes. We always leave in twenty minutes.”',
        },
        bargainAgain: {
          label:
            'Pay the Saltroad to drop the back six at the next waystation.',
          response:
            'Oriel counts the brass out loud, like everything. The six wagons stay at a waystation with a note. The caravan moves faster. Quieter.',
        },
        paths: [
          {
            id: 'open-crates',
            label:
              'Open the Abbey’s crates tonight. See what the Saltroad carries.',
            effects: {
              affinity: { saltroad: -5, abbey: -10 },
              local: { lamplight: 2 },
              flags: ['d42-abbey-crates-opened'],
            },
            response:
              'The crates hold small iron bed-frames and stacks of small grey blankets, all folded the same. Oriel looks a long time. Then she burns the six wagons on the salt flats. She speaks to no one until morning.',
          },
        ],
      }),
      hostTerms({
        hideout: 'freehold-barn',
        bargainEffects: { affinity: { freeholds: 5 } },
        collect: {
          paid: 'Hester Plowright came down the ladder at dawn with a slate. The last field burned standing. Twenty brass. She put it under the eggs.',
          unpaid:
            'Hester Plowright came down the ladder at dawn. The field burned standing and the strongbox was empty. She took the quilt off the apple crate and folded it. The jar of wildflowers went too.',
          kept: 'At dawn there was a warm egg beside every blanket in the root cellar. One each. Hester had counted.',
        },
        speaker: 'Hester Plowright of the Border Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        lines: [
          'The root cellar smells of earth and apples. Hester has put a quilt on the throne, an apple crate. Beside it, a jar of wildflowers. She will deny it later.',
          'Through the boards you hear her sister’s hens. Above them, far off, a rider’s horn.',
          'Hester Plowright stands at the foot of the ladder, basket on her arm, planted like a fence post.',
          '“You can hide here,” she says. “But the last field still stands. I won’t lose it to riders on your account.”',
        ],
        questId: 'q-d42-barn-harvest',
        accept: {
          label: 'Accept her terms. Bring in the field.',
          response:
            'Hester hands you a scythe like a sceptre. “Before dawn,” she says.',
        },
        ask: {
          label: 'Ask why riders would bother burning one field.',
          response:
            'Hester sets the basket down. She counts the eggs before she answers. She doesn’t want to answer.',
        },
        truth: [
          '“They’re not after the field, Majesty. They’re after the barn with an emperor in the cellar. Yesterday they burned the Pardoes’ hayricks, two farms over. Tied a grey ribbon on the gate.”',
          '“A ribbon on every gate until somebody talks. That’s what they told the Pardoes. Nobody has talked. Nobody will. But the Freeholds count grudges. This one counts against you too.”',
          '“So bring in my field. Then nobody can say the crown came here and only took.”',
          vellumSays(
            '“The Pardoes have four children, Majesty. I counted them at the gate this morning. I’m sorry. I count things.”',
          ),
        ],
        acceptAgain: {
          label:
            'Bring in her field before dawn. Stand on it if the riders come.',
          response:
            'Hester hands you a scythe like a sceptre. “Before dawn,” she says. “If they come, stand where they can see the crown.”',
        },
        bargainAgain: {
          label:
            'Pay the Pardoes for their hayricks. Put a price on the grudge.',
          response:
            'Hester takes the brass to the Pardoes herself. She comes back with less of it and a basket of eggs. In the Freeholds, a receipt.',
        },
        paths: [
          {
            id: 'decoy',
            label:
              'Send the Watch to fire an empty barn on the far ridge. Let the riders chase smoke.',
            effects: {
              affinity: { freeholds: -5 },
              local: { 'gate-watch': 2 },
              flags: ['d42-decoy-barn'],
            },
            response:
              'It works. The riders chase a fire east all night. The Pardoes sleep. Nobody tells you whose barn it was until morning. Then Hester does. By name. Twice.',
          },
          {
            id: 'ribbon',
            label:
              'Ride to the Pardoes’ gate yourself. Take the ribbon down in daylight.',
            effects: {
              affinity: { freeholds: 10 },
              local: { 'gate-watch': -2 },
              flags: ['d42-ribbon-taken-down'],
            },
            response:
              'You untie the ribbon with your own hands. The Pardoe children watch from the window. By noon the valley knows the emperor is near. By dusk three farms put out an extra bowl. So does somebody who will tell the riders.',
          },
        ],
      }),
      hostTerms({
        hideout: 'rail-station',
        // Taking Jinx's terms means Jinx's half goes to the grey buyer.
        acceptEffects: {
          local: { lamplight: -1 },
          flags: ['d42-engine-half-sold'],
        },
        bargainEffects: {
          affinity: { rustline: 5 },
          flags: ['d42-engine-bought'],
        },
        collect: {
          paid: 'Jinx Coupler chalked a price on the court’s blankets at dawn. Somebody else stripped the engine. Twenty brass. Jinx bit the shiny ones.',
          unpaid:
            'Jinx Coupler chalked a price on the court’s blankets at dawn. The strongbox was empty. By noon two blankets were sold. Back to the court, at a markup.',
          kept: 'Jinx Coupler left a jar of shiny bolts by the court’s fire at dawn. A gift, Jinx said. Twice.',
        },
        speaker: 'Jinx Coupler of the Rustline',
        npc: 'jinx-coupler',
        faction: 'rustline',
        lines: [
          'The collapsed station is shining junk and the smell of oil. Rails run in through one wall and stop mid-floor. Like the train got tired.',
          'Jinx Coupler sorts bolts by the court’s only lantern into heaps only Jinx understands, humming to them.',
          '“Stay as long as you like, Majesty. Everything here is for sale but the roof. The roof is mostly gone.”',
          '“There’s an engine on the east siding nobody has stripped. Strip it with me. Fair shares. Meaning mine.”',
        ],
        questId: 'q-d42-rail-salvage',
        accept: {
          label: 'Accept the terms. Pick up a wrench.',
          response:
            'Jinx tosses you a wrench. “The shiny bolts are mine,” the magpie says. “All of them.” At dusk a grey cart stops at the east siding. Jinx goes out to it alone.',
        },
        ask: {
          label: 'Ask who the engine belonged to.',
          response:
            'Jinx turns a bolt in the lantern light and does not look at you. “Belonged,” the magpie says. “Past tense. Good word.”',
        },
        truth: [
          '“Grey paint under the rust, Majesty. Abbey engine. Hauled the night carts up the mission road for years. Then the line flooded.”',
          '“There’s already a buyer for the parts. Wears grey. Pays in grey brass. Asks politely. They want it running again. I want paying. You see the difficulty.”',
          '“Sell to them, the court eats all winter. Keep it, I’m poorer and you’re safer. Or break it, if you like breaking things. I don’t.”',
          vellumSays(
            '“If the Abbey wants a dead engine running, Majesty, I would like to know what it will carry.”',
          ),
        ],
        acceptAgain: {
          label:
            'Strip it with Jinx. Fair shares. What Jinx does with Jinx’s half is Jinx’s business.',
          response:
            'Jinx tosses you a wrench. “Fair shares,” the magpie says. “Meaning mine.” At dusk the grey cart comes for Jinx’s half. You hear it go up the mission road. Half an engine. Enough to start.',
        },
        bargainAgain: {
          label: 'Pay Jinx for the whole engine. Every part stays here, dead.',
          response:
            'Jinx weighs the brass in one claw and the engine in the other. Sighs. “Terrible customer,” they say. “You pay.” The grey cart comes at dusk and goes away empty. Its driver smiles anyway.',
        },
        paths: [
          {
            id: 'sell-grey',
            label:
              'Sell to the grey buyer. The court needs brass more than principles.',
            effects: {
              brass: 25,
              affinity: { rustline: 5, abbey: 5 },
              local: { lamplight: -2 },
              flags: ['d42-engine-sold-grey'],
            },
            response:
              'The buyer comes at dusk with a smile and a cart. Jinx counts the brass three times. Two nights later, far up the mission road, you hear an engine that should not run. Running.',
          },
          {
            id: 'wreck',
            label:
              'Break it where it stands. Nothing rides it up that road again.',
            effects: {
              affinity: { rustline: -10 },
              local: { 'gate-watch': 1, lamplight: 1 },
              flags: ['d42-engine-wrecked'],
            },
            response:
              'It takes all night and most of the court. Jinx watches, coat bristling, bottle caps rattling. Not a claw lifted. By morning the engine is scrap. The magpie won’t sell you a nail all week.',
          },
        ],
      }),
      hostTerms({
        hideout: 'nameless-cave',
        bargainEffects: { local: { yard: 2 } },
        collect: {
          paid: 'Nobody had foraged. At dawn the widow went down to the farm with twenty of the crown’s brass and came back with bread. The farm asked whose brass it was.',
          unpaid:
            'Nobody had foraged and the strongbox was empty. The widow cut the last loaf into nine. Then into ten. The deserter would not take his.',
          kept: 'The widow laid out the food at dawn and cut it even. Everyone in the cave got the same share. Out here that is a constitution.',
        },
        speaker: 'A handful of revolutionaries',
        lines: [
          'Nobody came to shelter the court. Four Mole revolutionaries, a Freehold widow and a Gate Watch deserter found you on the road and brought you to a cold cave in the foothills.',
          'The cave has one good wall, a spring that tastes of iron, and a horse painted on the ceiling. Older than anything else you own.',
          'The Moles whisper about whether this counts as collaborating. The deserter won’t take off his helmet. The widow takes charge. Somebody has to.',
          '“We have no terms,” says the widow. “No food either. That’s the first problem.”',
        ],
        questId: 'q-d42-cave-forage',
        accept: {
          label: 'Accept that there are no terms. Go find food.',
          response:
            'The deserter laughs. Then the widow. Then everyone. It is a terrible cave. It is yours.',
        },
        ask: {
          label: 'Ask the deserter why he left the Watch.',
          response:
            'The deserter takes off his helmet. He is younger than his voice.',
        },
        truth: [
          '“I was on the north wall the night it fell, Majesty. I saw them come in. I saw who opened the gate. I ran.”',
          '“I ran the wrong way first. Then this way. These four found me in a ditch. The widow said a deserter can carry like anyone.”',
          '“I’m not asking for anything. You should know somebody in this cave ran. Before you trust the rest of us.”',
          {
            who: 'The Freehold widow',
            text: '“He’s carried more water than the Moles, Majesty, and complained less. I’d keep him. But it’s your cave now.”',
          },
        ],
        acceptAgain: {
          label:
            'Find food first. Everyone in this cave forages. The deserter too.',
          response:
            'The deserter laughs. Then the widow. Then everyone. It is a terrible cave. It is yours, and all of them are in it.',
        },
        bargainAgain: {
          label: 'Spend the crown’s brass on bread from the nearest farm.',
          response:
            'The widow goes down with the brass. She comes back with bread, cheese, and word that the farm will tell nobody. “For now,” she says. “Best price in the Freeholds.”',
        },
        paths: [
          {
            id: 'pardon',
            label:
              'Pardon him out loud. Let the Moles hear what a crown can still do.',
            effects: {
              local: { yard: 2, 'gate-watch': -2 },
              flags: ['d42-deserter-pardoned'],
            },
            response:
              'You say it in front of all six. The Moles stop arguing for a whole minute. The deserter does not thank you. He goes out and comes back with firewood bigger than he is. Again. Again. Until you stop him.',
          },
          {
            id: 'send-away',
            label:
              'Send him away. A court with nothing can’t afford one more who runs.',
            effects: {
              local: { 'gate-watch': 2, yard: -2 },
              flags: ['d42-deserter-sent-away'],
            },
            response:
              'He nods like he expected it. Helmet on. Into the dark. The widow says nothing. By morning one of the Moles is gone too. So is the good blanket.',
          },
        ],
      }),
      {
        // Callback: the crown paid a Pack informant for the camp map (Day 1).
        id: 'd42-cage-wagon',
        title: 'The Ration Card',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { flags: ['hideout:wagon-circle', 'pack-camp-mapped'] },
        lines: [
          'When the fiddle stops, Vane crouches by your blanket. In his paw is an old ration card, soft with handling. The Pack’s camp is drawn on the back in charcoal.',
          '“Found this when your tower fell, Majesty. Pinned above the Gate Watch fire all these years. Somebody drew our camp for the crown your first day in that chair.”',
          '“We know whose paw drew it. She’s in the cage wagon. Still has a bandage on that paw. Some things don’t heal.”',
          '“So. Tell me she sold us on her own, and the Pack deals with her the Pack’s way. Or tell me the crown paid her. Then she’s only a fool, and the debt is yours.”',
        ],
        options: [
          {
            id: 'confess',
            label: 'The crown paid her. The debt is the crown’s, not hers.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { yard: 1 },
              flags: ['d42-informant-spared'],
            },
            response:
              'Vane looks at you. Then at the card. He tears it in half. By morning the cage wagon stands open and empty. Nobody in the circle hums when you pass.',
          },
          {
            id: 'deny',
            label: 'Lie. The crown has never paid an informant in its life.',
            effects: {
              affinity: { jackalwire: 5 },
              local: { 'gate-watch': 1 },
              flags: ['d42-informant-denied'],
            },
            response:
              '“That’s what I thought,” says Vane. He pats your knee and goes. Before dawn the cage wagon rolls out, curtains drawn. It comes back empty. Nobody says where it went.',
          },
          {
            id: 'buy',
            label:
              'Buy her out of the cage and the canyon. Nobody says who paid whom.',
            requires: { cost: 25 },
            effects: { flags: ['d42-informant-bought'] },
            response:
              'Vane takes the brass without arguing. He wanted a third answer too. She leaves at dawn on a Saltroad cart, bandaged paw in her lap. She does not look back.',
          },
        ],
      },
      {
        // Callback: the crown chose the Saltroad over Thistledown (Day 33).
        id: 'd42-thistledown',
        title: 'Thistledown’s Count',
        speaker: 'Hester Plowright of the Border Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        requires: { flags: ['hideout:freehold-barn', 'thistledown-abandoned'] },
        lines: [
          'Hester comes down the ladder after midnight with a lamp and a slate. A list in chalk, in her square hand.',
          '“You chose the other road at noon on the thirty-third day, Majesty. I’m not asking why. I know why. The Saltroad’s winter stock outweighed one village in anybody’s ledger.”',
          '“But this is what it cost. Eleven barns. Nine wells fouled. Two people. Know their names. Abel Tansy, who was seventy. Cress Pardoe, who went back for the goats.”',
          '“I’m hiding you anyway. I wanted you to know I know what I’m doing.”',
        ],
        options: [
          {
            id: 'names',
            label: 'Say their names back to her. Ask what Thistledown needs.',
            effects: {
              affinity: { freeholds: 2 },
              flags: ['d42-thistledown-named'],
            },
            response:
              'You say them. “Names are free, Majesty,” Hester says. “That’s why I wrote them down.” She rubs the slate clean with her sleeve and writes: seed, timber, a well-digger. “That. When you have a crown again.”',
          },
          {
            id: 'repay',
            label:
              'Send what brass the court can spare to Thistledown tonight. Pay a well-digger. The court goes thin.',
            requires: { cost: 30 },
            effects: {
              affinity: { freeholds: 10 },
              flags: ['d42-thistledown-repaid'],
            },
            response:
              'Hester counts it once and puts it under the eggs. “Doesn’t buy back a barn,” she says. “It buys a well-digger. Thistledown has been drinking from the river.” In the morning the court eats half rations. Nobody has to ask why.',
          },
          {
            id: 'same-road',
            label: 'Tell her the truth. You would choose the same road again.',
            effects: {
              affinity: { freeholds: -10 },
              local: { ledger: 2 },
              flags: ['d42-thistledown-justified'],
            },
            response:
              'Hester looks at you a long time. “Honest,” she says. “I’ll give you honest.” She leaves you the lamp. She does not come down again until the field is in.',
          },
        ],
      },
      {
        // Callback: the crown made only the mill families pay (Day 1).
        id: 'd42-mill-doors',
        title: 'The Mill Families',
        speaker: 'Mayor Mara Reedbell of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        requires: { flags: ['hideout:bell-cellars', 'mara-millers-levy'] },
        lines: [
          'The court has eaten bread from every oven in Hollow Bell but one. The mill families’ doors are shut. Their flour goes elsewhere.',
          'Mara brings the news down herself. Flour on her sleeve from the ward ovens.',
          '“They remember the order, Majesty. Your first morning. The mill families paid for my aqueduct. The wards drank. The crown took the blame, as I asked.”',
          '“Now there’s no crown to blame. Only a guest in my cellar. They sell their flour up the mission road at the Abbey’s price, and tell everyone why.”',
        ],
        options: [
          {
            id: 'repay',
            label:
              'Repay the mill families their levy from the crown’s own purse.',
            requires: { cost: 25 },
            effects: {
              affinity: { 'hollow-bell': 3 },
              local: { 'old-houses': 2 },
              flags: ['d42-millers-repaid'],
            },
            response:
              'Mara takes the brass to the mill herself. By evening the doors open. Flour comes down the cellar stair with a note from the miller’s wife. One word: “Late.”',
          },
          {
            id: 'order',
            label:
              'Order them to sell to the town. The crown is still the crown.',
            effects: {
              affinity: { 'hollow-bell': 5 },
              local: { 'old-houses': -2, 'gate-watch': 1 },
              flags: ['d42-millers-ordered'],
            },
            response:
              'You write the order on a cider label and seal it with a seal that may mean nothing now. The millers obey. Mara says that is good news about the crown, or bad news about millers.',
          },
          {
            id: 'free',
            label:
              'Let them sell where they like. The crown is done giving millers orders.',
            effects: {
              affinity: { 'hollow-bell': -5 },
              local: { ledger: 2 },
              flags: ['d42-millers-free'],
            },
            response:
              '“Free trade,” says Mara, like naming a disease. The flour goes up the mission road all week. So do two of the miller’s sons.',
          },
        ],
      },
      {
        // Callback: the Yard paid for the rain covenant in bonded runners (Act II).
        id: 'd42-bonded-runners',
        title: 'The Third Runner',
        speaker: 'A runner bonded to the Conclave',
        faction: 'storm-crows',
        requires: { flags: ['hideout:crow-cave', 'covenant-paid-in-runners'] },
        // Who went up, for how long, and what the Day 34 gate cost (t-036).
        variants: D42_RUNNER_VARIANTS,
        lines: [
          'A young stoat in a Conclave sash brings you water in the morning. She stands holding the bowl. Not leaving.',
          '“You won’t know me, Majesty. You sent three of us from the Yard to pay for the rain. I was the third.”',
          '“They treat us all right. They feed us. We run the high paths in storms with letters. Two of us fell. The Crows sang for them. Decent of them.”',
          '“The bond runs seven more years. I’m not asking anything. I wanted the emperor to see one of us. Once.”',
        ],
        options: [
          {
            id: 'thank',
            label: 'Thank her. Tell her the rain she paid for still falls.',
            effects: {
              affinity: { 'storm-crows': 5 },
              local: { yard: -2 },
              flags: ['d42-runner-thanked'],
            },
            response:
              'She nods, takes the bowl, and goes. That afternoon she runs the high path in the rain, satchel on her back, sure-footed as a goat. You watch until she is gone.',
          },
          {
            id: 'redeem',
            label: 'Buy out her bond with whatever the crown has left.',
            requires: { cost: 30 },
            effects: {
              affinity: { 'storm-crows': -5 },
              local: { yard: 3 },
              flags: ['d42-runner-redeemed'],
            },
            response:
              'Corvane takes the brass without a word and strikes one name from a slate. The runner does not cry. She sits by the court’s fire, the sash in her lap. Her hands have nothing to do.',
          },
          {
            id: 'ask-corvane',
            label:
              'Ask Corvane, as a guest, to shorten every Yard runner’s bond.',
            requires: { affinity: { 'storm-crows': 'friendly' } },
            effects: {
              affinity: { 'storm-crows': -10 },
              local: { yard: 2 },
              flags: ['d42-bonds-shortened'],
            },
            response:
              '“Two years,” says Corvane, at last. “For courtesy.” He strikes the number on every runner’s slate himself. He never shares the watch fire with you again.',
          },
        ],
      },
      {
        // Callback: the crown pardoned the Mole courier (Day 38).
        id: 'd42-the-courier',
        title: 'The Boy Who Carried Letters',
        speaker: 'The young Mole courier',
        faction: 'moles',
        requires: { flags: ['hideout:mole-tunnels', 'prisoner-pardoned'] },
        lines: [
          'The Mole with the lantern at the tunnel mouth is sixteen, blinking at even this much light. You have seen him before. In chains, in your throne room, on the thirty-eighth day.',
          '“You pardoned me, Majesty. I gave you the name and you let me go. Three days later he did exactly what I said.”',
          '“The sisters still think I’m his runner. They don’t know I’m down here. If I went up the mission road tonight with a letter, they’d open the gate. Like always.”',
          '“I could carry one more letter. Or stay down here and dig and never carry anything again.”',
          '“My name’s Tobin. Tobin Umber. Granny says it’s your choice. She’s my gran. She says it’s still your choice.”',
          'At the far end of the gallery Granny Umber is sorting props. She does not look up. Her paws have stopped moving.',
        ],
        options: [
          {
            id: 'keep',
            label: 'Keep him here. He has carried enough.',
            effects: {
              affinity: { moles: 5 },
              flags: ['d42-courier-kept'],
            },
            response:
              'Tobin breathes out like he has held it since the thirty-eighth day. Granny Umber hands him a shovel without a word. Among Moles, that is welcome home.',
          },
          {
            id: 'send',
            label:
              'Send him up the mission road one last time. Bring back the Abbey kitchens on paper.',
            effects: {
              affinity: { moles: -5 },
              local: { lamplight: 2 },
              flags: ['d42-courier-sent'],
            },
            response:
              'He goes at dusk with a blank letter in a brass-buttoned envelope. Two nights later he is back, the Abbey kitchens drawn on his arm in soot. He doesn’t sleep for a day. He won’t say what he heard on the stair. Granny Umber copies the map off his arm and won’t speak to you until he does.',
          },
        ],
      },
      {
        // Callback: the crown left the Saltroad waystation to the riders (Day 33).
        id: 'd42-waystation-graves',
        title: 'The Waystation Drivers',
        speaker: 'Oriel Saltmarsh of the Saltroad',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        requires: { flags: ['hideout:moving-caravan', 'waystation-abandoned'] },
        lines: [
          'At the salt flats waystation the caravan stops for its hour. Little is left of the waystation. Somebody has swept the yard anyway.',
          'Oriel walks you along the line of graves at the edge of the flats. She says nothing. She counts them, like everything.',
          '“Twelve drivers held this yard on the thirty-third day, Majesty, waiting for the crown’s Watch. The crown went to Thistledown. I’d have chosen the same in your boots. Probably.”',
          '“Their families ride in the third wagon. They know who you are. They haven’t said a word to you, because I asked. I’m wondering whether to stop asking.”',
          '“They don’t want brass, Majesty. Not first. They want the sergeant who rode for Thistledown that noon to come to the third wagon and say why. He’s at your fire. He has a name. So did they.”',
        ],
        options: [
          {
            id: 'face',
            label:
              'Go to the third wagon yourself. The order was the crown’s, not his.',
            effects: {
              affinity: { saltroad: 5 },
              flags: ['d42-faced-the-drivers'],
            },
            response:
              'It takes most of the hour. A driver’s mother says the worst, and says it well. She asks for the sergeant twice. You stay in the door. When the caravan moves she rides the box beside you. Silent. She does not move away.',
          },
          {
            id: 'pay',
            label:
              'Pay the families a driver’s wage for the winter. Brass the court does not have.',
            requires: { cost: 30 },
            effects: {
              affinity: { saltroad: 10 },
              flags: ['d42-drivers-paid'],
            },
            response:
              'Oriel counts the brass out to each family, out loud. Nobody thanks you. A child asks if you are the emperor. You say yes. The child asks why you’re so small.',
          },
          {
            id: 'quiet',
            label: 'Ask Oriel to keep them quiet.',
            effects: {
              affinity: { saltroad: -5 },
              flags: ['d42-drivers-silenced'],
            },
            response:
              '“As you like,” says Oriel. The third wagon stays quiet across the salt. It is the loudest wagon in the caravan.',
          },
          {
            id: 'send-sergeant',
            label:
              'Send the sergeant to the third wagon. He rode. He can answer.',
            effects: {
              affinity: { saltroad: 10 },
              local: { 'gate-watch': -3 },
              flags: ['d42-sergeant-sent'],
            },
            response:
              'He goes without a word. An hour. When the caravan moves he walks beside the third wagon, not the court’s. Nobody tells him to come back. At the fire the Watch eats with its backs to you.',
          },
        ],
      },
    ],
  },
  {
    day: 43,
    title: 'Defectors’ Hymn',
    advisor: VELLUM,
    briefings: [
      {
        id: 'watch-split',
        source: 'The host’s lookouts',
        text: 'Some of the Gate Watch rode out with Young Komodo on the last night.',
        truth: true,
        variants: [
          {
            flags: ['d40-komodo-held'],
            text: 'Some of the Gate Watch rode out after Young Komodo when his cell was found empty.',
          },
          {
            flags: ['komodo-escorted'],
            text: 'Some of the Gate Watch rode out with Young Komodo on the last night. The crown sent them with him.',
          },
        ],
      },
      {
        id: 'dunmark-dead',
        source: 'A frightened stablehand',
        text: 'Captain Dunmark died defending the gate.',
        truth: false,
      },
      {
        id: 'rider-coming',
        source: 'The host’s lookouts',
        text: 'One rider in Gate Watch colours is coming in under a white rag.',
        truth: true,
      },
    ],
    komodo:
      'Not everyone who left with him chose him, Majesty. Some only chose the open gate. Hear the rider out before you decide which he is.',
    quests: [],
    audiences: [
      {
        id: 'd43-defector',
        title: 'Defectors’ Hymn',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'The rider under the white rag is Captain Dunmark. Coat torn. Gorget gone. His horse is lame in the off foreleg.',
          'He kneels in the dirt unasked. He has never knelt. Not even on the day of the oath.',
          '“Half my Watch rode out on an order under your seal, Majesty. I rode along to see where it led. The Abbey. The sisters gave us supper and cots and good blankets. In the morning I counted us. We were fewer.”',
          '“I came back. Some of them want to. Twenty-two wait on the ridge for your answer. They’ll see it from there, whatever it is.”',
          vellumSays(
            '“They obeyed the seal, Majesty. In law, they obeyed you. Someone here will say they deserted. It won’t be quite true.”',
          ),
        ],
        // The last night's precautions, remembered (t-040).
        variants: [
          {
            flags: ['d40-komodo-held'],
            lines: [
              'The rider under the white rag is Captain Dunmark. Coat torn. Gorget gone. His horse is lame in the off foreleg.',
              'He kneels in the dirt unasked. He has never knelt. Not even on the day of the oath.',
              '“The cell was empty at midnight, Majesty. Half my Watch rode after him. Holloway said she knew his road. She did. The Abbey. The sisters had supper waiting, and cots. In the morning I counted us. We were fewer.”',
              '“I came back. Some of them want to. Twenty-two wait on the ridge for your answer. They’ll see it from there, whatever it is.”',
              vellumSays(
                '“They rode after a prisoner, Majesty. They stayed for the soup. Someone here will say they deserted. It will be half true.”',
              ),
            ],
          },
          {
            flags: ['d40-seals-checked'],
            lines: [
              'The rider under the white rag is Captain Dunmark. Coat torn. Gorget gone. His horse is lame in the off foreleg.',
              'He kneels in the dirt unasked. He has never knelt. Not even on the day of the oath.',
              '“Half my Watch rode out behind the soup cart, Majesty. The pass was one you read. The cart was empty. I rode along to see where it led. The Abbey. Supper, cots, good blankets. In the morning I counted us. We were fewer.”',
              '“I came back. Some of them want to. Twenty-two wait on the ridge for your answer. They’ll see it from there, whatever it is.”',
              vellumSays(
                '“They escorted a cart you passed, Majesty. In law, they obeyed you. Someone here will say they deserted. It won’t be quite true.”',
              ),
            ],
          },
          {
            flags: ['d40-watch-recalled'],
            lines: [
              'The rider under the white rag is Captain Dunmark. Coat torn. Gorget gone. His horse is lame in the off foreleg.',
              'He kneels in the dirt unasked. He has never knelt. Not even on the day of the oath.',
              '“You tore the order, Majesty. We stood the walls. At midnight Holloway lifted the bar from inside and rode out in front, and half my Watch went after her to fetch her back. I went after them. The Abbey. Supper, cots. In the morning I counted us. We were fewer.”',
              '“I came back. Some of them want to. Twenty-two wait on the ridge for your answer. They’ll see it from there, whatever it is.”',
              vellumSays(
                '“No seal sent them, Majesty. They went after one of their own. Someone here will say they deserted. This time it will be nearer true.”',
              ),
            ],
          },
        ],
        options: [
          {
            id: 'ask-ridge',
            label:
              'Ask Dunmark which of the twenty-two knew what the order was.',
            effects: {},
            response:
              'Dunmark looks up at the ridge. Back at you. “One,” he says. “Maybe two. I can name one.”',
            next: 'knew',
          },
          {
            id: 'welcome',
            label: 'Bring them all in. Nobody is turned away tonight.',
            effects: {
              local: { 'gate-watch': 5 },
              flags: ['watch-returned'],
            },
            response:
              'Dunmark whistles once. Twenty-two guards come down off the ridge. Slowly. Then all at once.',
          },
          {
            id: 'dunmark',
            label: 'Dunmark may stay. The others chose.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'Dunmark bows his head. He does not argue. He walks up the ridge alone to tell them.',
          },
          {
            id: 'turn',
            label:
              'Send them back to the tower. Have them open the gate from inside.',
            requires: { local: { 'gate-watch': 8 } },
            effects: {
              local: { 'gate-watch': 2 },
              flags: ['watch-inside-tower'],
            },
            response:
              'Dunmark’s eyes go bright. “Yes, Majesty,” he says. “They’ll like that better than forgiveness.”',
          },
          {
            id: 'oath',
            label:
              'Climb the ridge yourself. Say the oath again: “I will never spend you cheaply.”',
            requires: { flags: ['oath-of-care'] },
            effects: {
              local: { 'gate-watch': 3, yard: -1 },
              flags: ['watch-returned', 'd43-oath-renewed'],
            },
            response:
              'You climb the ridge on foot. Twenty-two guards watch you come. When you say it, some say it back. One cries and is furious about it. They come down behind you in a line.',
          },
          {
            id: 'ask-escort',
            label:
              'Ask what he saw at Komodo’s stirrup, all the way to the Abbey.',
            requires: { flags: ['komodo-escorted'] },
            effects: {},
            response:
              'Dunmark’s jaw works. He has waited for this question since the gate. He still has no answer.',
            next: 'escort',
          },
        ],
        beats: [
          {
            id: 'knew',
            lines: [
              '“Sergeant Holloway. Twenty years in the Watch. Two medals. A daughter in the Yard. She read the order first. She said nothing. She rode out in front.”',
              '“She’s on the ridge with the others. Says she believed the advisor. He had the seal, and the seal is the emperor. She may even mean it.”',
              '“Take them all back, the Watch learns a sergeant can open the gate and be forgiven. Send them all away, it learns twenty-one honest fools went out with her. I don’t envy you, Majesty. Choose quick.”',
              vellumSays(
                '“The Archive could look for her name in what he left, Captain. Given a week. We do not have a week.”',
              ),
            ],
            options: [
              {
                id: 'welcome',
                label:
                  'Bring them all in, Holloway too. Nobody is turned away tonight.',
                effects: {
                  local: { 'gate-watch': 5 },
                  flags: ['watch-returned'],
                },
                response:
                  'Dunmark whistles once. Twenty-two guards come off the ridge. Slowly. Then all at once. Holloway comes last and salutes. You return it. Dunmark watches you both.',
              },
              {
                id: 'dunmark',
                label: 'Dunmark may stay. The others chose.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Dunmark bows his head. He does not argue. He walks up the ridge alone to tell them. Comes back alone. Sits apart from the fire all night.',
              },
              {
                id: 'sift',
                label: 'Bring in the twenty-one. Holloway stays on the ridge.',
                effects: {
                  local: { 'gate-watch': 3, yard: -1 },
                  flags: ['watch-returned', 'd43-holloway-left'],
                },
                response:
                  'Dunmark goes up to tell her himself. From the fire you watch them a long while, two grey shapes against the sky. Twenty-one come down. One walks off along the ridge toward nowhere. Her daughter in the Yard skips supper.',
              },
              {
                id: 'trial',
                label:
                  'Bring them all in. Holloway answers for the order before the whole Watch.',
                effects: {
                  local: { 'gate-watch': 3, lamplight: 1, yard: -2 },
                  flags: ['watch-returned', 'd43-holloway-tried'],
                },
                response:
                  'The trial is held at the fire, a cook’s ladle for a gavel. Holloway answers every question. Guilty of believing a seal. Sentence: carry water for the camp until the war ends. She does. Every day. Without a word.',
              },
              {
                id: 'turn',
                label:
                  'Send them all back to the tower, Holloway first. Open the gate from inside.',
                requires: { local: { 'gate-watch': 8 } },
                effects: {
                  local: { 'gate-watch': 2 },
                  flags: ['watch-inside-tower'],
                },
                response:
                  'Dunmark’s eyes go bright. “Holloway first,” he says. “Yes. She’ll understand that better than forgiveness. So will they.”',
              },
            ],
          },
          {
            id: 'escort',
            lines: D43_ESCORT,
            variants: [
              {
                flags: ['buyer:black-verge'],
                lines: swapLines(D43_ESCORT, {
                  2: '“By the time I rode back the tower was flying plum. Riders on the walls. Our walls. I was the escort. I escorted him to it.”',
                }),
              },
              {
                flags: ['buyer:old-houses'],
                lines: swapLines(D43_ESCORT, {
                  2: '“By the time I rode back the tower was flying Vask’s black swan. Her sons on our walls. I was the escort. I escorted him to it.”',
                }),
              },
            ],
            options: [
              {
                id: 'absolve',
                label:
                  'The escort was the crown’s idea, not his failure. Tell him. Bring his people home.',
                effects: {
                  local: { 'gate-watch': 5 },
                  flags: ['watch-returned', 'd43-dunmark-absolved'],
                },
                response:
                  'Dunmark stands. It takes two tries. He whistles once. Twenty-two guards come off the ridge. He counts them in out loud, every one. He could not count them at the Abbey.',
              },
              {
                id: 'demote',
                label:
                  'A captain who rides a day beside a traitor and sees nothing does not command. Tell him so.',
                effects: {
                  local: { 'gate-watch': 1, 'old-houses': 1 },
                  flags: ['watch-returned', 'd43-dunmark-demoted'],
                },
                response:
                  'He takes off his captain’s knot and puts it in your hand. No word. He walks up the ridge to bring the twenty-two down himself, a sergeant now. They come. None of them look at you.',
              },
              {
                id: 'dunmark',
                label: 'Dunmark may stay. The others chose.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Dunmark bows his head. He walks up the ridge alone to tell them. He never tells you what he said.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 44,
    title: 'The Crow’s Real Name',
    advisor: VELLUM,
    briefings: [
      {
        id: 'crows-letters',
        source: 'Elder Corvane',
        text: 'The Storm Crows watched letters go up the mission road all year.',
        truth: true,
      },
      {
        id: 'ledger-left',
        source: 'A Lamplight clerk',
        text: 'Komodo left his working ledgers behind in the tower.',
        truth: true,
      },
      {
        id: 'komodo-coin',
        source: 'A tavern rumour',
        text: 'Young Komodo sold the throne for a cart of brass.',
        truth: false,
      },
    ],
    komodo:
      'He did not sell you for brass, Majesty. Nobody that careful sells for brass. Find out what he thought he was buying. It may matter more than what he sold.',
    quests: ['q-d44-komodo-bargain'],
    audiences: [
      {
        id: 'd44-crow-name',
        title: 'The Crow’s Real Name',
        speaker: 'Elder Corvane of the Storm Crows',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'Elder Corvane arrives at dawn on foot. For a crow, that is formal. The young crows who carried him wait in the rocks.',
          'He folds his wings and looks at you a long time. His clouded eyes move over the court, the fire, the empty place where an advisor stood.',
          '“We had a name for your advisor, Majesty. All year. The crow who walks.”',
          '“He carried letters up the mission road at night, twice a week. Never once looked up to see who was watching. We thought you knew. We thought it was your errand.”',
        ],
        options: [
          {
            id: 'ask-carts',
            label:
              'Ask what else moved on the mission road while the Crows watched.',
            effects: {},
            response: 'Corvane’s copper chimes stir. There is no wind.',
            next: 'carts',
          },
          {
            id: 'why',
            label: 'Ask why the Crows never told the throne.',
            effects: { affinity: { 'storm-crows': -5 } },
            response:
              '“Nobody asked,” says Corvane. “Crows answer questions. We do not volunteer.”',
          },
          {
            id: 'thanks',
            label: 'Thank him. Ask what else the Crows have seen.',
            effects: {
              affinity: { 'storm-crows': 5 },
              flags: ['crow-sightings'],
            },
            response:
              'Corvane tells you, at length. Eleven years of night carts to the Abbey.',
          },
        ],
        beats: [
          {
            id: 'carts',
            lines: [
              '“Carts, Majesty. Eleven years of carts. Up full at night: grain, lamp oil, bolts of grey cloth. Down before dawn. Empty, or nearly.”',
              '“Twice a year, before the long rains, a cart went up with its cover tied down. The sisters walked beside it, singing. It never came down.”',
              '“The Crows sold the Abbey its rain all that time. Good rain, on time, for the deep well. We did not ask what the well was for. We answer questions. Nobody asked.”',
              vellumSays(
                '“Eleven years of rain. Eleven years of carts. The Conclave kept both ledgers. Majesty, the coalition will want to know who sold the Abbess her water.”',
              ),
            ],
            options: [
              {
                id: 'why',
                label: 'Ask him cold: why did the Crows never tell the throne?',
                effects: { affinity: { 'storm-crows': -5 } },
                response:
                  '“Nobody asked,” says Corvane. “You ask now. That is something. Not enough. Something.”',
              },
              {
                id: 'thanks',
                label:
                  'Thank him for telling you now. Ask what else the Crows have seen.',
                effects: {
                  affinity: { 'storm-crows': 5 },
                  flags: ['crow-sightings'],
                },
                response:
                  'Corvane tells you, at length, in a voice like rain on slate. Vellum fills nine pages and asks for more ink.',
              },
              {
                id: 'confess',
                label:
                  'Make the Crows say it all before the coalition, in their own voice.',
                effects: {
                  affinity: { 'storm-crows': -10 },
                  local: { lamplight: 2 },
                  flags: ['crow-sightings', 'd44-crows-confess'],
                },
                response:
                  'Corvane is silent a long time. “Crows do not confess,” he says. “But we answer questions. Ask me before the fire. I will answer.” His chimes stay silent all day.',
              },
              {
                id: 'keep-secret',
                label:
                  'Keep the Crows’ part between this fire and the record. The coalition needs the Crows more than this.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { lamplight: -2 },
                  flags: ['crow-sightings', 'd44-crow-secret-kept'],
                },
                response:
                  'Corvane bows. Vellum writes something. Then he draws a line through it, one stroke, and blots it.',
              },
            ],
          },
        ],
      },
      {
        id: 'd44-coal-powder',
        title: 'Two Kegs',
        speaker: 'Coal Harrow, captain of the Mole sappers',
        faction: 'moles',
        requires: { flags: ['hideout:mole-tunnels'] },
        lines: [
          'Coal Harrow finds the emperor in the props gallery, where the court sleeps. He has a keg under each arm. Full, this time. Nobody stops him. It is his tunnel.',
          'You can hear the Abbey singing in the fen water now, if you put your ear to the wall. The Mothers are holding their dikes against it and doing nothing else.',
          '“Two kegs, Majesty. Enough for one hole. Not two.”',
          '“The north dike sits over the Abbey’s deep well. The one the Crows sold rain to. Open the dike and the fen goes down that well. Whatever she’s waking wakes wet. Wet things are slow.”',
          '“Or both kegs go to the surveyors, for the brick tunnel to the crypt. A door for your people. Your choice which. I haven’t got a third.”',
          {
            who: 'Granny Umber',
            npc: 'granny-umber',
            text: '“This is my tunnel too, Coal. Tell the emperor the part about the lantern-houses. Forty of them on the north water. Children in most.”',
          },
          '“They’ve got boats,” Coal says. He does not look at her.',
          vellumSays(
            '“Majesty. The Archive has a page for every flood in this country. None of them stayed an accident for long.”',
          ),
        ],
        options: [
          {
            id: 'ask-umber',
            label: 'Ask Granny Umber what the assembly would do.',
            effects: {},
            response:
              'Granny Umber sits down on a crate of the court’s papers. Nobody tells her not to.',
            next: 'umber',
          },
          {
            id: 'dike',
            label:
              'Blow the north dike. Drown her well. The fen pays for the Abbey’s quiet.',
            effects: {
              affinity: { moles: 10, 'mire-mothers': -20 },
              strength: { 'mire-mothers': -1 },
              flags: ['d44-dike-blown'],
            },
            response:
              'The whole hideout feels it, a cough deep in the rock. By dawn the reed beds are a lake. Up the mission road the singing stops for an hour, then comes back thick, like a voice under a blanket. Coal Harrow sleeps for the first time in a week. Granny Umber does not come to supper.',
          },
          {
            id: 'crypt',
            label: 'Both kegs go to the surveyors, for the crypt road.',
            effects: {
              affinity: { moles: -5, 'mire-mothers': 5 },
              flags: ['d44-powder-to-crypt'],
            },
            response:
              'The surveyors carry the kegs down the old drain toward the mission road. Coal Harrow watches them go. Then he goes up the stair and out, and does not come back that night.',
          },
          {
            id: 'seize',
            label:
              'Take the kegs. Nobody in this tunnel lights anything without the crown.',
            effects: {
              affinity: { moles: -10 },
              local: { 'gate-watch': 2 },
              flags: ['d44-powder-seized'],
            },
            response:
              'Coal hands them over. Too easily. At supper Granny Umber counts the sappers and comes up one short.',
          },
          {
            id: 'guest',
            label:
              'Remind Coal the burrows disowned him. He is a guest here, and so are his kegs.',
            requires: { flags: ['d33-coal-disowned'] },
            effects: {
              affinity: { moles: 5 },
              flags: ['d44-powder-to-crypt', 'd44-coal-sent-off'],
            },
            response:
              'Coal sets the kegs down carefully, the way you set down something you mean to come back for. Then he goes up the stair. The surveyors take the powder to the crypt road before he can change his mind.',
          },
        ],
        beats: [
          {
            id: 'umber',
            speaker: 'Granny Umber of the Mole Revolutionaries',
            npc: 'granny-umber',
            lines: [
              '“The assembly would vote. It would take all night, and the singing would get louder while we argued.”',
              '“I hated the Mothers before your grandmother was born. I hate them now. I am not drowning their children to win an argument. Even a good argument. Coal’s is good. That’s what frightens me.”',
              '“Give the powder to the crypt road. Then come with me to the fen at dawn and ask the Mothers to hold their dikes for us too. They’ll say no. Ask anyway.”',
            ],
            options: [
              {
                id: 'her-way',
                label:
                  'Her way. The powder goes to the crypt, and the crown walks to the fen at dawn.',
                effects: {
                  affinity: { moles: 5, 'mire-mothers': 10 },
                  flags: ['d44-powder-to-crypt', 'd44-fen-asked'],
                },
                response:
                  'At dawn you stand on the dike with an old mole and a lantern-witch. Nobody bows. Reedlight says no, as promised. Then she says she will hold the north dike anyway, for the children. She does not say whose.',
              },
              {
                id: 'dike',
                label: 'Coal’s way. Blow the north dike.',
                effects: {
                  affinity: { moles: 10, 'mire-mothers': -20 },
                  strength: { 'mire-mothers': -1 },
                  flags: ['d44-dike-blown'],
                },
                response:
                  'Granny Umber gets up off the crate and walks away down the tunnel. The bang comes an hour later. By dawn the reed beds are a lake. Up the mission road the singing comes back thick, like a voice under a blanket.',
              },
              {
                id: 'seize',
                label: 'Nobody’s way. The crown keeps the kegs.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 2 },
                  flags: ['d44-powder-seized'],
                },
                response:
                  'Coal hands them over. Too easily. At supper Granny Umber counts the sappers and comes up one short.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 45,
    title: 'Aid to an Enemy',
    advisor: VELLUM,
    briefings: [
      {
        id: 'verge-fleeing',
        source: 'The host’s lookouts',
        text: 'The plum riders are pulling off every road, back toward the Black Verge.',
        truth: true,
        variants: [
          {
            flags: ['buyer:black-verge'],
            text: 'The plum riders are leaving the tower walls by night, back toward the Black Verge.',
          },
        ],
      },
      {
        id: 'verge-won',
        source: 'A Gate Watch rumour',
        text: 'The Black Verge Court has made peace with the Abbess.',
        truth: false,
        variants: [
          {
            flags: ['buyer:black-verge'],
            text: 'The Black Verge will hold the tower for the Abbess to the last rider.',
          },
        ],
      },
      {
        id: 'envoy-asks',
        source: 'A rider in plum',
        text: 'The Envoy of the Black Verge asks to speak with the emperor in hiding.',
        truth: true,
      },
    ],
    komodo:
      'The riders are running, Majesty. Riders who hunted you all month do not run from you. Something frightened the Verge. I would like to know what.',
    quests: [],
    audiences: [
      {
        id: 'd45-envoy',
        title: 'Aid to an Enemy',
        speaker: 'The Envoy of the Black Verge',
        npc: 'the-verge-envoy',
        faction: 'black-verge',
        lines: D45_ENVOY,
        variants: [
          {
            flags: ['buyer:black-verge'],
            lines: swapLines(D45_ENVOY, {
              1: 'The court goes quiet. Five nights ago plum riders came through the tower gate at a walk. They have hunted this fire ever since. Some here have lost people to them.',
              3: '“Now our manors are full of a singing nobody can stop. Our sick sit up in their beds at night, all together, and sing in a language none of us taught them. The Verge sits in your tower, Majesty. It asks help of the crown it robbed.”',
            }),
          },
        ],
        options: [
          {
            id: 'ask-singing',
            label: 'Ask the Envoy who is singing.',
            effects: {},
            response:
              'The Envoy is quiet. They take a folded handkerchief from their coat and unfold it. Nothing in it. They fold it again.',
            next: 'singing',
          },
          {
            id: 'aid',
            label: 'Help them. The enemy beneath the Abbey is everyone’s.',
            effects: {
              affinity: { 'black-verge': 20 },
              strength: { 'black-verge': 1 },
              local: { 'old-houses': -2 },
              flags: ['verge-allied'],
            },
            response:
              'The Envoy bows to the dirt. “The Verge does not forget a debt,” they say. “Of either kind.”',
          },
          {
            id: 'terms',
            label: 'Help them if the riders leave the Ford for good.',
            requires: { affinity: { 'black-verge': 'wary' } },
            effects: {
              affinity: { 'black-verge': 5, freeholds: 10 },
              flags: ['verge-allied', 'ford-returned'],
            },
            response:
              'The Envoy closes their eyes. “The Ford,” they say. “And the fields beside it.”',
          },
          {
            id: 'refuse',
            label: 'Refuse. The Verge can sing.',
            effects: {
              affinity: { 'black-verge': -20, freeholds: 5 },
            },
            response:
              'The Envoy stands straight and leaves without a word. Behind them, faint, someone is humming.',
          },
          {
            id: 'sable',
            label: 'Let Sable Thorne answer the Envoy.',
            requires: { follower: 'F016' },
            effects: {},
            response:
              'Sable rises on the far side of the fire. The Envoy sees them and, for the first time all evening, forgets to stand straight.',
            next: 'sable',
          },
          {
            id: 'ask-sable',
            label:
              'Ask after Sable Thorne, whom the crown sent home to the Verge.',
            requires: { flags: ['sable-returned'] },
            effects: {},
            response: 'The Envoy’s pale hands fold together. Tight.',
            next: 'sent-home',
          },
        ],
        beats: [
          {
            id: 'singing',
            lines: [
              '“My sister. Her children. Half the old families of the Verge. Everyone who took the cure. They don’t suffer, Majesty. That’s the worst of it. They’re perfectly happy. They don’t know us.”',
              '“The Abbess said the cure would take the hunger away. It did. It took everything else too, and fed it to something under her floor.”',
              '“I hunted you because she paid us. In cures, for the ones not yet sick. I would do it again, for them. Now you know what you’re helping. If you help.”',
              {
                who: 'A Freehold farmer at the fire',
                text: '“They burned the Pardoes’ ricks and the Tansy barn and laughed doing it. Let them sing.”',
              },
            ],
            options: [
              {
                id: 'aid',
                label:
                  'Help them. The enemy beneath the Abbey is everyone’s. So are its victims.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  strength: { 'black-verge': 1 },
                  local: { 'old-houses': -2 },
                  flags: ['verge-allied'],
                },
                response:
                  'The Envoy bows lower than any courtier ever has. “The Verge does not forget a debt,” they say. “Of either kind.” The farmer gets up and leaves the fire.',
              },
              {
                id: 'terms',
                label: 'Help them if the riders leave the Ford for good.',
                requires: { affinity: { 'black-verge': 'wary' } },
                effects: {
                  affinity: { 'black-verge': 5, freeholds: 10 },
                  flags: ['verge-allied', 'ford-returned'],
                },
                response:
                  'The Envoy closes their eyes. “The Ford,” they say. “And the fields beside it.” The farmer does not thank you. He stays at the fire.',
              },
              {
                id: 'kneel',
                label:
                  'Help them, if the Envoy kneels here and hears every Freeholder the riders burned.',
                effects: {
                  affinity: { 'black-verge': 5, freeholds: 5 },
                  local: { yard: 1 },
                  flags: ['verge-allied', 'd45-envoy-knelt'],
                },
                response:
                  'The Envoy kneels until midnight. Freeholders come one at a time and say what burned. The Envoy repeats each thing back exactly. No one is asked to forgive. Nobody does. In the morning plum riders are roofing a barn.',
              },
              {
                id: 'refuse',
                label: 'Refuse. The Verge can sing.',
                effects: {
                  affinity: { 'black-verge': -20, freeholds: 5 },
                },
                response:
                  'The Envoy stands straight and leaves without a word. The farmer claps once, alone. Behind the Envoy, faint, someone is humming.',
              },
            ],
          },
          {
            id: 'sable',
            speaker: 'Sable Thorne',
            npc: 'F016',
            lines: [
              'Sable Thorne steps into the firelight, raised for a court and gone from it. The court has never seen them this still.',
              '“Hello, Envoy. You came all this way to ask the crown for help. And for me, I suppose, while you’re here.”',
              '“I left the Verge so nobody could press the condition on me. Now it sings in the houses I grew up in. I can’t leave that either.”',
              '“Help them, Majesty. Not for the Envoy. For the ones in the beds. But make the Verge give me up first. In writing. Tonight, while it needs you.”',
            ],
            options: [
              {
                id: 'sable-terms',
                label:
                  'Help them on Sable’s terms: the Verge renounces every claim on Sable, in writing.',
                effects: {
                  affinity: { 'black-verge': 10 },
                  flags: ['verge-allied', 'd45-sable-released'],
                },
                response:
                  'The Envoy writes it with Vellum’s pen on Vellum’s paper. The hand does not shake. Sable reads it twice, folds it away, and stands alone at the edge of the light.',
              },
              {
                id: 'aid',
                label:
                  'Help them without conditions. Sable’s freedom is not the Verge’s to sell.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  strength: { 'black-verge': 1 },
                  local: { 'old-houses': -2 },
                  flags: ['verge-allied'],
                },
                response:
                  'The Envoy bows. Sable looks at you, surprised. Then away. “That was either kind,” they say, “or careless with me. I’ll decide which later.”',
              },
              {
                id: 'refuse',
                label:
                  'Refuse. Sable owes the Verge nothing. Neither does the crown.',
                effects: {
                  affinity: { 'black-verge': -20, freeholds: 5 },
                },
                response:
                  'The Envoy leaves without a word. Sable watches them go and does not thank you. Much later you hear Sable humming. They stop the moment they notice.',
              },
            ],
          },
          {
            id: 'sent-home',
            lines: [
              '“You sent Sable home to us, Majesty, as we asked. We were grateful. We gave Sable the cure the first month. So they would never run again.”',
              '“Sable sings with the others now. Very well. They always had a good voice.”',
              vellumSays(
                '“The crown returned Sable on the Verge’s promise of their safety, Majesty. I can read you the promise. It is well written.”',
              ),
            ],
            options: [
              {
                id: 'sable-first',
                label:
                  'Help them. The first one the court brings out of the singing is Sable.',
                effects: {
                  affinity: { 'black-verge': 5 },
                  flags: ['verge-allied', 'd45-sable-first'],
                },
                response:
                  'The Envoy closes their eyes. “Yes,” they say. “If anyone can be brought out.” The Verge has never said if before. Not in your hearing.',
              },
              {
                id: 'aid',
                label: 'Help them. The crown owes Sable that much.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  strength: { 'black-verge': 1 },
                  local: { 'old-houses': -2 },
                  flags: ['verge-allied'],
                },
                response:
                  'The Envoy bows. “The Verge does not forget a debt,” they say. You are thinking of a different debt.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse. The Verge kept its promise to Sable the way it keeps all of them. It can sing.',
                effects: {
                  affinity: { 'black-verge': -20, freeholds: 5 },
                },
                response:
                  'The Envoy stands straight and leaves without a word. Behind them, faint, someone is humming. A good voice.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 46,
    title: 'The Well That Spoke',
    advisor: VELLUM,
    briefings: [
      {
        id: 'well-water',
        source: 'A thirsty drover',
        text: 'The well has filled with clean water again.',
        truth: false,
      },
      {
        id: 'well-voice',
        source: 'Pilgrims on the mission road',
        text: 'The dry well on the mission road has started answering back.',
        truth: true,
      },
      {
        id: 'well-crypt',
        source: 'The Archive’s maps',
        text: 'The oldest maps show a passage from that well toward the Abbey crypt.',
        truth: true,
      },
    ],
    komodo:
      'A well that answers leads somewhere, Majesty. The old maps agree. Send the ones who read best in the dark.',
    quests: ['q-d46-well-that-spoke'],
    audiences: [
      {
        id: 'd46-reedlight',
        title: 'A Lantern From the Fen',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        lines: [
          'A heron in a green cloak steps out of the dark at the edge of the firelight. Nobody saw her come. She holds a lantern of green glass. The flame does not move when the wind does.',
          'Half the court reaches for something to throw. The other half has been to the Mirefen. They don’t.',
          '“The Mothers have always known what sleeps under the Abbey, Majesty. Longer than there has been an Abbey. We sank the bell’s clapper ourselves, so nobody could ring it the wrong way.”',
          '“Take the lantern. It burns down there, where nothing else will. The well your people go into speaks back. Carry a light that doesn’t.”',
        ],
        // The court that drowned the fen meets the fen anyway (t-039).
        variants: [
          {
            flags: ['d44-dike-blown'],
            lines: [
              'A heron in a green cloak steps out of the dark at the edge of the firelight. Her hems are wet to the knee. She holds a lantern of green glass. The flame does not move when the wind does. The Moles at the fire stop talking.',
              '“Forty lantern-houses stood on the north water, Majesty. Thirty-one stand. We counted the children twice. One short. A girl called Fennet. She went back for a heron chick.”',
              '“I am not here for you. The thing under the hill does not care who drowned whom. We sank the bell’s clapper ourselves, long ago, so nobody could ring it the wrong way.”',
              '“Take the lantern. It burns down there, where nothing else will. The well your people go into speaks back. Carry a light that doesn’t.”',
            ],
          },
        ],
        options: [
          {
            id: 'ask-burns',
            label: 'Ask what the lantern burns on.',
            effects: {},
            response: 'Reedlight smiles. The lantern brightens.',
            next: 'price',
          },
          {
            id: 'take',
            label: 'Take the lantern and the Mothers’ help.',
            effects: {
              affinity: { 'mire-mothers': 10 },
              flags: ['reedlight-lantern'],
              questAid: [LANTERN_AID],
            },
            response:
              'Reedlight sets the lantern in your hands. It is warm. It smells of rain.',
          },
          {
            id: 'refuse',
            label: 'Refuse. The crown has had enough of bargains with covens.',
            effects: { affinity: { 'mire-mothers': -10 } },
            response:
              'Reedlight tilts her long head. “Then find your way in the dark,” she says. Then she is gone.',
          },
          {
            id: 'umber',
            label:
              'Let Granny Umber speak to the witch standing in her tunnels.',
            requires: { flags: ['hideout:mole-tunnels'] },
            effects: {},
            response:
              'Somebody runs for Granny Umber. Nobody explains. The whole tunnel has gone quiet.',
            next: 'umber',
          },
          {
            id: 'ask-road',
            label:
              'Ask about the lanterns that turned back on the Mirefen road, your first day.',
            requires: { flags: ['mire-road-closed'] },
            effects: {},
            response: 'Reedlight’s lantern dims. The flame lies down flat.',
            next: 'forty-one',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“A promise, Majesty. Not yours. Not yet. The flame was lit from one made long ago, between the fen and whatever lies under the hill.”',
              '“Whoever carries it owes the fen one favour. Later. A small one, usually. The Mothers decide what small means.”',
              '“Not every Mother agrees I should give it. Some would rather the Abbess woke her thing, and the crown burned, and the fen took the ashes. I am not one of them. But they exist.”',
              vellumSays(
                '“A debt with no sum on it, Majesty. The Archive has a whole shelf of those. Most were paid by somebody who never signed.”',
              ),
            ],
            options: [
              {
                id: 'take',
                label: 'Take the lantern and the favour that comes with it.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  flags: ['reedlight-lantern'],
                  questAid: [LANTERN_AID],
                },
                response:
                  'Reedlight sets the lantern in your hands. The glass is warm. For a moment you feel the fen counting you.',
              },
              {
                id: 'my-debt',
                label:
                  'Take the lantern. The debt is the emperor’s alone. Not the court’s. Not the kingdom’s.',
                effects: {
                  affinity: { 'mire-mothers': 5 },
                  flags: ['reedlight-lantern', 'd46-debt-personal'],
                  questAid: [LANTERN_AID],
                },
                response:
                  'Reedlight tilts her long head. “That is not how debts work,” she says. “It is how emperors should talk.” The flame leans toward you. It stays leaning.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse it. The crown will not owe the fen a favour nobody can name.',
                effects: { affinity: { 'mire-mothers': -10 } },
                response:
                  'Reedlight tilts her long head. “Then find your way in the dark,” she says. “It is darker than you think.” She is gone.',
              },
            ],
          },
          {
            id: 'umber',
            speaker: 'Granny Umber of the Mole Revolutionaries',
            npc: 'granny-umber',
            lines: [
              'Granny Umber comes up the tunnel with her cane, sees the heron, and stops dead. The lamp-boy walks into her back.',
              '“Not in my tunnels. Two hundred years the Mothers flooded our burrows and called it weather. They took the Silverbank cell in one night. With a song.”',
              {
                who: 'Sister Reedlight',
                npc: 'sister-reedlight',
                text: '“And the Moles dug under our fen two hundred years and called it politics, Granny. We could argue until the Abbess wakes. She’d enjoy that.”',
              },
              '“She would,” says Granny Umber, at last. “That’s the only reason I haven’t hit you with this cane.” To you: “Your court, Majesty. Your call. Do we carry a witch’s light down a Mole’s road?”',
            ],
            options: [
              {
                id: 'take',
                label:
                  'Take the lantern. The thing under the Abbey is older than this feud.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  flags: ['reedlight-lantern'],
                  questAid: [LANTERN_AID],
                },
                response:
                  'Reedlight sets the lantern in your hands. Granny Umber watches it pass and says nothing. From her, a speech. That night the Moles post a guard on your chamber. You are not sure which guest it protects.',
              },
              {
                id: 'truce',
                label:
                  'Ask them both for one night’s truce. The lantern lights the Moles’ props as well as the well.',
                effects: {
                  affinity: { 'mire-mothers': 5, moles: 5 },
                  flags: ['reedlight-lantern', 'd46-fen-mole-truce'],
                  questAid: [LANTERN_AID],
                },
                response:
                  'It takes an hour and a lot of tea. The green lantern ends up on the third prop, the one that sulks. The Moles mutter. Nobody floods anybody. For one night the fen lights the tunnels.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse it. Not in the tunnels that sheltered the crown.',
                effects: { affinity: { 'mire-mothers': -10 } },
                response:
                  'Reedlight bows to Granny Umber, not to you, and goes up into the dark. Granny bangs her cane once. The matter is closed.',
              },
            ],
          },
          {
            id: 'forty-one',
            lines: [
              '“You closed the road your first day. Forty-one of us turned back into the fen at night, with raiders on the ridge.”',
              '“Thirty-four came home. Seven did not. One was a reed-cutter with a broken leg. I carried him most of the way to your tower.”',
              '“I am not here to collect, Majesty. The thing under the Abbey does not care who closed which road. But you should know the number. You were a new crown. You did not know us. Now you do.”',
            ],
            options: [
              {
                id: 'take',
                label: 'Take the lantern. Say the number back to her.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  flags: ['reedlight-lantern'],
                  questAid: [LANTERN_AID],
                },
                response:
                  '“Seven,” you say. Reedlight sets the lantern in your hands. It is heavier than it looks.',
              },
              {
                id: 'open-road',
                label:
                  'Take the lantern. Swear this crown will never close the Mirefen road again.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['reedlight-lantern', 'd46-mire-road-sworn'],
                  questAid: [LANTERN_AID],
                },
                response:
                  'Reedlight bows lower than on the first day. In the dark behind her, seven green lights go up one after another. They hold. They go out.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse it. The crown made its choice that day. No shaming it into another.',
                effects: { affinity: { 'mire-mothers': -10 } },
                response:
                  'Reedlight does not argue. She did not argue then. She walks into the dark with the lantern. You find yourself counting to forty-one.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 47,
    title: 'Oaths and Knives',
    advisor: VELLUM,
    briefings: [
      {
        id: 'quiet-night',
        source: 'The host’s lookouts',
        text: 'No riders on any road tonight.',
        truth: true,
        // The Abbey's messenger in the Crow cave knows the court's roads (t-039).
        variants: [
          {
            flags: ['d42-letter-to-abbess'],
            text: 'No riders on any road tonight. Grey lanterns on the cave road, though, the way your letter went. Moving slowly. Counting.',
          },
          {
            flags: ['hideout:crow-cave'],
            notFlags: ['d42-abbey-messenger-taken'],
            text: 'No riders on any road tonight. Grey lanterns on the cave road, though. They stop below the ledges and go back.',
          },
        ],
      },
      {
        id: 'komodo-returning',
        source: 'A hopeful guard',
        text: 'Young Komodo has asked to come back.',
        truth: false,
        variants: [
          {
            flags: ['d40-komodo-called-friend'],
            text: 'Young Komodo has asked to come back. He says you called him a friend, and meant it.',
          },
        ],
      },
      {
        id: 'fires-lit',
        source: 'The camp',
        text: 'For the first time since the tower, the court has lit one fire for everyone.',
        truth: true,
      },
    ],
    komodo:
      'A quiet night, Majesty. Perhaps the last. People will want to say things to you while they can. Let them.',
    quests: [],
    audiences: [
      {
        id: 'd47-kiyo',
        title: 'A Letter for Later',
        speaker: 'Kiyo',
        requires: { follower: 'F003' },
        lines: [
          'One fire for everyone, the first since the tower. Kiyo sits beside you with her kettle and does not pour. The people nearest go quiet. Kiyo always pours.',
          '“If it goes bad at the Abbey, somebody needs to know about my boy. He’s small. He wants to be a hero and he can’t finish a cup of tea.”',
          '“He crossed the straits asleep in a basket and never knew we were afraid. I’d like him never to know it now.”',
          '“I wrote him a letter for when he’s older. Will you keep it, Majesty? You’re the only person I know who used to have a vault. That’ll have to do.”',
        ],
        options: [
          {
            id: 'ask-boy',
            label: 'Ask her to tell you about him, while there is time.',
            effects: {},
            response:
              'Kiyo pours after all. Two cups. She puts one in your hands.',
            next: 'boy',
          },
          {
            id: 'keep',
            label: 'Keep the letter safe.',
            effects: { flags: ['kiyo-letter-kept'] },
            response:
              'Kiyo hands you a small envelope with a beetle drawn on the front. “Don’t read it,” she says. “It’s mostly about beetles.”',
          },
          {
            id: 'home',
            label:
              'Send her home to him tonight, before the Abbey. The infirmary keeps her needle.',
            effects: { flags: ['kiyo-sent-home'], dismiss: [KIYO_HOME] },
            response:
              'Kiyo looks at the fire a long time. “Not yet,” she says. “Please. After.” You say it again. She packs the kettle last. At dawn the infirmary has a needle and nobody to hold it.',
          },
        ],
        beats: [
          {
            id: 'boy',
            lines: [
              '“He collects beetles. Not to keep. He counts them and lets them go. He cries if anyone steps on one. Even by accident. Even a horse.”',
              '“He thinks his mother sells tea. I do. He doesn’t know I sew up soldiers by lamplight with the same hands I pour with.”',
              '“If I don’t come back, somebody will tell him I was brave. I’d rather he heard I was careful, and kind to beetles, and I chose this. Tell him that? Not brave. Careful.”',
              vellumSays(
                '“The Archive could keep a copy of the letter, Kiyo. In case the vault does not survive the emperor.”',
              ),
              '“No copies,” says Kiyo, sharp. Then, softer: “Thank you, Keeper. No copies. It’s his.”',
            ],
            options: [
              {
                id: 'keep',
                label:
                  'Keep the letter safe. Promise to tell him: careful, not brave.',
                effects: { flags: ['kiyo-letter-kept'] },
                response:
                  'Kiyo hands you a small envelope with a beetle drawn on it. “Don’t read it,” she says. “It’s mostly about beetles.” She drinks her tea. Her hands are steady now.',
              },
              {
                id: 'carry',
                label:
                  'Promise to carry it to him yourself. Across the straits if need be. Crown or no crown.',
                effects: {
                  local: { yard: 1 },
                  flags: ['kiyo-letter-kept', 'd47-letter-sworn'],
                },
                response:
                  '“You’d cross the straits,” Kiyo says, “for a letter about beetles.” She looks at you over her cup. “Yes. You would. That’s why I asked you and not the Keeper.”',
              },
              {
                id: 'home',
                label:
                  'Send her home to him tonight. Careful means alive. The infirmary keeps her needle.',
                effects: { flags: ['kiyo-sent-home'], dismiss: [KIYO_HOME] },
                response:
                  'Kiyo looks at the fire a long time. “That’s not fair,” she says. “Using my word.” She packs the kettle last. She leaves the needle case on your crate, open, every needle threaded. At dawn the infirmary has a needle and nobody to hold it.',
              },
            ],
          },
        ],
      },
      {
        id: 'd47-saffron',
        title: 'An Old Insignia',
        speaker: 'Saffron Kett',
        requires: { follower: 'F002' },
        lines: [
          'Saffron Kett sits on an upturned crate at the edge of the firelight, an unused wrench in her lap. She turns her welded Pack insignia over and over in her fingers.',
          '“Vane wants me home, Majesty. To the Pack. He sent a fiddler with the message. That’s how the Pack says it means it.”',
          '“He says the canyon needs a machinist more than a crown does. The wagons are falling apart. The pups learn to fix them from someone who learned from me. Badly.”',
          '“And he sent terms. Pack terms. I come home tonight, and the Pack rides for the Abbey wall at dawn. Forty riders. I stay, and the Pack stays in the canyon. Vane says I’m worth forty riders to you. He means it as a compliment.”',
          '“He might be right. I hate it when he’s right. It doesn’t happen often, and he’s unbearable for weeks.”',
        ],
        options: [
          {
            id: 'ask-want',
            label: 'Ask what she wants. Not Vane.',
            effects: {},
            response:
              'Saffron stops turning the insignia. She looks at it like it asked the question.',
            next: 'want',
          },
          {
            id: 'stay',
            label:
              'Ask her to stay until the end. The Pack stays in the canyon.',
            effects: { flags: ['saffron-stays'] },
            response:
              'Saffron pins the insignia back on her apron. “Until the end,” she says. “Then we argue about it.” The fiddler goes back up the canyon alone, playing nothing.',
          },
          {
            id: 'go',
            label:
              'Send her home tonight. Forty riders at the wall for one machinist.',
            effects: {
              affinity: { jackalwire: 10 },
              flags: ['saffron-free', 'd47-pack-rides'],
              dismiss: [SAFFRON_HOME],
            },
            response:
              'Saffron stops turning the insignia. “Forty riders,” she says. “That’s the going rate, then.” She leaves the wrench on the crate. By midnight the fiddler is playing her out of camp. She does not look back. She would have.',
          },
          {
            id: 'bridge',
            label:
              'Remind her that at the Two Bridges, the court let her choose the route.',
            requires: { flags: ['saffron-chose-route'] },
            effects: { flags: ['saffron-stays', 'd47-bridge-remembered'] },
            response:
              'Saffron goes quiet. “The trestle,” she says. “Nobody ever let me choose a route. Not the Pack. Not anyone.” She pins the insignia back on. “Until the end. Then the canyon. I’ll build them a bridge that stays up.”',
          },
        ],
        beats: [
          {
            id: 'want',
            lines: [
              '“I want to finish something. I built bridges for this crown. Half burned. I mended engines, and the Abbey got one running anyway. Once, I’d like to build a thing and see it standing a year later.”',
              '“The Pack would let me build anything, so long as it has wheels and somebody to rob at the end of it.”',
              '“And I want to see the Abbey door shut. I want both. Tomorrow I can have one.”',
            ],
            options: [
              {
                id: 'stay',
                label:
                  'Ask her to stay until the end. Then she builds whatever she likes. The Pack stays home.',
                effects: { flags: ['saffron-stays'] },
                response:
                  'Saffron pins the insignia back on her apron. “Until the end,” she says. “Then we argue about it. Fair warning: I argue with drawings.” The fiddler goes back up the canyon alone.',
              },
              {
                id: 'go',
                label:
                  'Send her home tonight to build wheels. The Pack rides to the wall in her place.',
                effects: {
                  affinity: { jackalwire: 10 },
                  flags: ['saffron-free', 'd47-pack-rides'],
                  dismiss: [SAFFRON_HOME],
                },
                response:
                  '“So I don’t get both,” Saffron says. “Nobody does.” She leaves the wrench on the crate, handle toward you. By midnight the fiddler is playing her out of camp.',
              },
              {
                id: 'commission',
                label:
                  'Promise her the new crown’s first building is hers to design, wherever she lives.',
                effects: {
                  local: { yard: 1, ledger: -1 },
                  flags: ['saffron-stays', 'd47-saffron-commission'],
                },
                response:
                  'Saffron laughs out loud. The whole camp jumps. “A commission,” she says. “From an emperor in a ditch.” She pins the insignia beside the court’s badge and takes out a pencil. It stays in her hand all evening.',
              },
            ],
          },
        ],
      },
      {
        id: 'd47-letter-in-the-flour',
        title: 'A Letter in the Flour',
        speaker: 'Foreman Dunmore Ash of the Yard',
        npc: 'dunmore-ash',
        faction: 'yard',
        lines: D47_FLOUR,
        // He came through the door the crown opened on Day 41 (t-039).
        variants: [
          {
            flags: ['d41-kitchen-door-open'],
            lines: [
              ...D47_FLOUR.slice(0, 2),
              '“He was leaving it at the stone on the road, Majesty,” says Dunmore. “For the grey sisters. It says where we are. How many. Good clear hand. I taught him his letters. He came out of the tower kitchens on the forty-third night. Through the door you opened. I wrote the board myself. In flour.”',
              ...D47_FLOUR.slice(3),
            ],
          },
        ],
        options: [
          {
            id: 'ask-why',
            label: 'Ask the cook why.',
            effects: {},
            response:
              'The cook can’t get it out. Dunmore takes the letter from his fist and smooths it flat on his knee.',
            next: 'why',
          },
          {
            id: 'exile',
            label:
              'Take the Yard’s apron off him. Send him down the road with nothing.',
            effects: {
              local: { 'gate-watch': 1, yard: -1 },
              flags: ['d47-cook-exiled'],
            },
            response:
              'He goes at first light. No apron. No letter. The sergeant follows a mile to be sure he keeps walking. At the fork the cook takes the Abbey road. The sergeant comes back and says nothing.',
          },
          {
            id: 'example',
            label:
              'Make an example of him at dawn, where the whole camp can see.',
            effects: {
              local: { 'gate-watch': 3, yard: -3 },
              flags: ['d47-cook-made-example'],
            },
            response:
              'Nobody sleeps. At dawn it is done, quick, at the edge of the trees. The camp is quiet all day. Dunmore cooks breakfast for everyone. He eats none of it.',
          },
        ],
        beats: [
          {
            id: 'why',
            lines: [
              'On the back, smaller, in the same clear hand, is something else. Dunmore reads it out. Slowly. He has to.',
              '“My mam and my sisters are in the tower kitchens. The sisters told them they eat every day the emperor’s camp is found. Not any day it isn’t.”',
              '“It’s been six days,” the cook says. “I can count. I’m sorry. I’m sorry. I’d do it again.”',
              {
                who: 'A Gate Watch sergeant',
                text: '“Every man at this fire has someone in that tower, boy.”',
              },
              vellumSays(
                '“Then the sisters have made this offer more than once, Majesty. He is only the one we caught.”',
              ),
            ],
            options: [
              {
                id: 'exile',
                label:
                  'Send him down the road with nothing. The camp can’t keep him.',
                effects: {
                  local: { 'gate-watch': 1, yard: -1 },
                  flags: ['d47-cook-exiled'],
                },
                response:
                  'He goes at first light, without his apron. At the fork he takes the tower road. Toward his mother. Nobody stops him. Nobody says if they hope he gets there.',
              },
              {
                id: 'example',
                label:
                  'Make an example of him. Every family in that tower is a lever. The camp must see it does not work.',
                effects: {
                  local: { 'gate-watch': 3, yard: -3 },
                  flags: ['d47-cook-made-example'],
                },
                response:
                  'Nobody sleeps. At dawn it is done, quick, at the edge of the trees. Nobody else leaves a letter at the stone. Nobody in the Yard sings at work for the rest of the war.',
              },
              {
                id: 'false-letter',
                label:
                  'Let him leave the letter with the wrong valley in it. His family eats. The sisters search the wrong hills.',
                effects: {
                  local: { yard: 2, 'gate-watch': -1 },
                  flags: ['d47-false-letter'],
                },
                response:
                  'Vellum forges it in the cook’s hand. It takes an hour. He blots it twice. The letter goes to the stone at dawn. Three nights later lanterns search an empty valley far to the west. Nobody asks what the sisters do when they find it empty.',
              },
              {
                id: 'mercy',
                label:
                  'Forgive him before the camp. Let everyone with family in the tower say so.',
                effects: {
                  local: { yard: 3, 'gate-watch': -3 },
                  flags: ['d47-cook-forgiven'],
                },
                response:
                  'You say it standing. The sergeant walks away from the fire and stays gone all night. Before dawn eleven people come to you one by one. Family in the tower. The sisters have spoken to them. They have written nothing. Yet.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 48,
    title: 'The Bell’s Lost Clapper',
    advisor: VELLUM,
    briefings: [
      {
        id: 'clapper-fen',
        source: 'The Archive',
        text: 'The Silent Bell’s clapper was sunk in the Mirefen on purpose.',
        truth: true,
      },
      {
        id: 'abbey-singing',
        source: 'Every lookout',
        text: 'You can hear the singing from the Abbey on the Saltroad now.',
        truth: true,
      },
      {
        id: 'clapper-melted',
        source: 'A sister who fled the Abbey',
        text: 'The Abbess had the clapper melted down years ago.',
        truth: false,
      },
    ],
    komodo:
      'A bell silenced on purpose, Majesty, means somebody knew what its ringing could do. I would like to hear it.',
    quests: ['q-d48-bell-clapper'],
    audiences: [
      {
        id: 'd48-mara',
        title: 'The Town’s Bell',
        speaker: 'Mayor Mara Reedbell of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: D48_MARA,
        // The Abbey's water, taken for the children on Day 42 (t-039).
        variants: [
          {
            flags: ['d42-abbey-water-taken'],
            lines: [
              'Mara Reedbell comes down the cellar stair after midnight, sash in her pocket, her hand-bell muffled in a sock. She sits on the bottom step. She does not ring the bell.',
              '“The children who drank Sister Marrow’s water hum in their sleep now, Majesty. Not loud. The same four notes. Their mothers sit up with them. I sit up with mine.”',
              ...D48_MARA.slice(2),
            ],
          },
        ],
        options: [
          {
            id: 'ask-last',
            label:
              'Ask what her grandmothers said happened the last time it rang.',
            effects: {},
            response:
              'Mara turns the hand-bell over. “They said a lot of things,” she says. “Grandmothers do. One of them I believe.”',
            next: 'last-ring',
          },
          {
            id: 'promise',
            label: 'Promise the town its bell will ring again.',
            effects: {
              affinity: { 'hollow-bell': 10 },
              flags: ['bell-promised'],
            },
            response:
              'Mara takes your hand in both of hers. “Then we’ll ring it,” she says. “As long as the Bell stands.”',
          },
          {
            id: 'honest',
            label: 'Promise only to try.',
            effects: { affinity: { 'hollow-bell': 3 } },
            response:
              'Mara nods. “That’s more than anyone else has promised,” she says.',
          },
          {
            id: 'ask-page',
            label:
              'Ask whether the town ever learned about the page you burned for her.',
            requires: { flags: ['mara-protected'] },
            effects: {},
            response:
              'Mara goes still. Then she puts the hand-bell down in the dirt.',
            next: 'page',
          },
        ],
        beats: [
          {
            id: 'last-ring',
            lines: [
              '“It rang once, a hundred years ago, the night something under the Abbey turned over in its sleep. The whole valley felt it. Cups walked off tables.”',
              '“The ringer was a young woman from the Bell. My great-grandmother’s cousin. She climbed the tower and rang until the thing was still. She didn’t come down. They found the rope. And her shoes at the top of the stair, neatly paired.”',
              '“Afterwards the Abbey took the clapper down. For safety, they said. Then the Mothers took it and sank it. Everyone has protected everyone from that bell for a hundred years.”',
              vellumSays(
                '“The Archive has the same story, Majesty, with fewer shoes. It agrees on the part that matters. Somebody has to stand at the top and keep ringing.”',
              ),
            ],
            options: [
              {
                id: 'promise',
                label:
                  'Promise the town its bell will ring again, whatever it costs.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  flags: ['bell-promised'],
                },
                response:
                  'Mara takes your hand in both of hers. “Then we’ll ring it,” she says. “As long as the Bell stands.” She does not ask who will climb. She doesn’t need to.',
              },
              {
                id: 'not-theirs',
                label:
                  'Promise it will ring, and that nobody from Hollow Bell climbs.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  flags: ['bell-promised', 'd48-no-bell-ringer'],
                },
                response:
                  'Mara looks at you a long time. “Then who?” You do not answer. She nods. That is an answer. “Then we’ll ring it as long as the Bell stands. And we’ll know whose people climbed.”',
              },
              {
                id: 'honest',
                label:
                  'Promise only to try. You will not promise a stair like that.',
                effects: { affinity: { 'hollow-bell': 3 } },
                response:
                  'Mara nods. “More than anyone else has promised,” she says. “Less than my grandmother’s cousin did. I like you better for it.”',
              },
            ],
          },
          {
            id: 'page',
            lines: [
              '“No. You burned it, and I let you, and the town never learned whose children paid for its water in the drought. They think I’m a good mayor. Some days I almost do.”',
              '“If that bell rings, Majesty, and people come up the hill to hear it, I want to stand in front of them and tell them. I’ve wanted to for years. Tell me not to. Or tell me to. I can’t decide alone anymore.”',
              vellumSays(
                '“There is no page anymore, Mayor. Only you. That is how the important records are usually kept.”',
              ),
            ],
            options: [
              {
                id: 'tell-them',
                label: 'Tell her to tell them when the bell rings. All of it.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['bell-promised', 'd48-mara-will-confess'],
                },
                response:
                  'Mara wipes the dirt off the bell with her sleeve. “All of it,” she says. “Then they decide if they want me ringing it.” She walks home that night without the sock on the bell.',
              },
              {
                id: 'keep-ash',
                label:
                  'Tell her the page is ash and stays ash. The town needs a mayor more than a confession.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -2 },
                  flags: ['bell-promised', 'd48-mara-secret-kept'],
                },
                response:
                  'Mara nods, slow, the way she nodded the day the page burned. “Then we’ll ring it,” she says. “As long as the Bell stands.” She does not sound glad.',
              },
              {
                id: 'honest',
                label:
                  'Tell her it is not the crown’s to decide. Promise only to try for the bell.',
                effects: { affinity: { 'hollow-bell': 3 } },
                response:
                  'Mara looks at you. Then she laughs, short and tired. “No,” she says. “I suppose it never was.” She puts the sock back on the bell.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 49,
    title: 'Whose Peace?',
    advisor: VELLUM,
    briefings: [
      {
        id: 'abbess-surrenders',
        source: 'A hopeful herald',
        text: 'The Abbess has offered to surrender the tower tomorrow.',
        truth: false,
        variants: [
          {
            flags: ['buyer:black-verge'],
            text: 'The Black Verge has offered to give back the tower tomorrow.',
          },
          {
            flags: ['buyer:old-houses'],
            text: 'Lady Vask has offered to give back the tower tomorrow.',
          },
        ],
      },
      {
        id: 'coalition-here',
        source: 'Your host',
        text: 'Every faction still standing has sent someone to the hideout.',
        truth: true,
      },
      {
        id: 'tomorrow',
        source: 'Every lookout',
        text: 'The singing under the Abbey will be loudest tomorrow night.',
        truth: true,
      },
    ],
    komodo:
      'Tomorrow is the Abbey, Majesty. Tonight is everything after. Whoever you stand beside tonight shapes the kingdom you come back to. Unless the memorial row grows by two. Then the names shape it, whatever was signed. Choose as if you will come back.',
    quests: [],
    audiences: [
      {
        id: 'd49-whose-peace',
        title: 'Whose Peace?',
        speaker: 'The coalition in hiding',
        // Who really came to the last fire (t-039).
        ...D49_COALITION,
        options: [
          {
            id: 'ask-left-out',
            label:
              'Before you choose, ask each of them who their peace leaves out.',
            effects: {},
            response:
              'A long silence. Then everybody talks at once. Vellum later records it as “a frank exchange of views”.',
            next: 'left-out',
          },
          {
            id: 'roads',
            label:
              'Open roads: every faction governs its own country, together.',
            effects: {
              affinity: { saltroad: 5, freeholds: 5 },
              flags: ['peace-roads'],
            },
            response:
              'A long, suspicious silence. Then Oriel Saltmarsh starts drafting a charter on the back of a salt manifest.',
          },
          {
            id: 'bell',
            label: 'A restored Bell: Hollow Bell at the heart of the kingdom.',
            requires: {
              flags: ['clapper-recovered'],
              affinity: { 'hollow-bell': 'friendly' },
            },
            effects: {
              affinity: { 'hollow-bell': 10 },
              flags: ['peace-bell'],
            },
            response:
              'Mara Reedbell stands and does not know what to do with her hands. Everyone else, for once, agrees.',
          },
          {
            id: 'iron',
            label: 'An iron peace: the Gate Watch keeps order everywhere.',
            requires: { local: { 'gate-watch': 12 } },
            effects: {
              local: { 'gate-watch': 3, 'old-houses': 2 },
              affinity: { moles: -10 },
              flags: ['peace-iron'],
            },
            response:
              'Dunmark salutes. Granny Umber does not. The fire goes colder on one side.',
          },
          {
            id: 'crows',
            label:
              'The Crows’ bargain: rain for the kingdom, at the Crows’ price.',
            requires: { affinity: { 'storm-crows': 'friendly' } },
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['peace-crows'],
            },
            response:
              'Elder Corvane spreads his wings over the fire. For a moment the smoke goes sideways, like rain.',
          },
          {
            id: 'witchwater',
            label:
              'The Witchwater throne: the Mire Mothers sit beside the crown.',
            requires: { affinity: { 'mire-mothers': 'friendly' } },
            effects: {
              affinity: { 'mire-mothers': 10, abbey: -10 },
              flags: ['peace-witchwater'],
            },
            response:
              'Sister Reedlight bows her long neck. Far off in the fen, green lanterns go up one after another.',
          },
          {
            id: 'tunnels',
            label: 'Tunnels and councils: the Moles’ assemblies, everywhere.',
            requires: { affinity: { moles: 'friendly' } },
            effects: {
              affinity: { moles: 10 },
              local: { 'old-houses': -3 },
              flags: ['peace-tunnels'],
            },
            response:
              'Granny Umber bangs her cane three times. The motion carries. Corvane looks at the fire and says nothing at all.',
          },
        ],
        beats: [
          {
            id: 'left-out',
            ...D49_LEFT_OUT,
            options: [
              {
                id: 'roads',
                label:
                  'Open roads: every faction governs its own country, together.',
                effects: {
                  affinity: { saltroad: 5, freeholds: 5 },
                  flags: ['peace-roads'],
                },
                response:
                  'A long, suspicious silence. Dunmark looks at the road beyond the firelight. Then Oriel Saltmarsh starts a charter on the back of a salt manifest.',
              },
              {
                id: 'bell',
                label: 'A restored Bell. Hollow Bell carries the weight.',
                requires: {
                  flags: ['clapper-recovered'],
                  affinity: { 'hollow-bell': 'friendly' },
                },
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  flags: ['peace-bell'],
                },
                response:
                  'Mara Reedbell stands and does not know what to do with her hands. Everyone else, for once, agrees. That frightens Mara more than the Abbess does.',
              },
              {
                id: 'iron',
                label: 'An iron peace. Alive is better than happy.',
                requires: { local: { 'gate-watch': 12 } },
                effects: {
                  local: { 'gate-watch': 3, 'old-houses': 2 },
                  affinity: { moles: -10 },
                  flags: ['peace-iron'],
                },
                response:
                  'Dunmark salutes. Granny Umber does not. She folds her three charters into her vest, one at a time. The fire goes colder on her side.',
              },
              {
                id: 'crows',
                label:
                  'The Crows’ bargain. Rain for everyone. The crown pays for those who can’t.',
                requires: { affinity: { 'storm-crows': 'friendly' } },
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['peace-crows'],
                },
                response:
                  'Elder Corvane spreads his wings over the fire. The smoke goes sideways, like rain. Granny Umber mutters that she’ll believe it when it’s wet.',
              },
              {
                id: 'witchwater',
                label:
                  'The Witchwater throne. This once, the fen is not left out.',
                requires: { affinity: { 'mire-mothers': 'friendly' } },
                effects: {
                  affinity: { 'mire-mothers': 10, abbey: -10 },
                  flags: ['peace-witchwater'],
                },
                response:
                  'Sister Reedlight bows her long neck low. Far off in the fen, green lanterns go up one after another. The Moles at the fire shift away from them.',
              },
              {
                id: 'tunnels',
                label:
                  'Tunnels and councils. Let the harvest wait for the vote.',
                requires: { affinity: { moles: 'friendly' } },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -3 },
                  flags: ['peace-tunnels'],
                },
                response:
                  'Granny Umber bangs her cane three times. The motion carries. Corvane folds his wings and looks at the harvest moon.',
              },
              {
                id: 'no-crown',
                label:
                  'Nobody’s peace. Lay the crown down tonight. Let this fire govern.',
                effects: {
                  affinity: { moles: 5, freeholds: 5 },
                  local: { 'old-houses': -3, 'gate-watch': -2 },
                  flags: ['peace-roads', 'd49-crown-laid-down'],
                },
                response:
                  'Nobody speaks. Then Granny Umber laughs so hard she has to be helped up. Dunmark takes off his gorget and holds it, lost. Oriel crosses out every emperor on her manifest. By morning there is a charter. Your name is on it once, at the bottom, with everyone else’s.',
              },
            ],
          },
        ],
      },
      {
        id: 'd49-the-record',
        title: 'What the Record Says',
        speaker: 'Keeper Abelard Vellum',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        lines: [
          'After the coalition goes to its blankets, Vellum sits with you by the coals. The Archive’s great book lies open on his knees. His pen is dry.',
          '“Every emperor has an entry, Majesty. I write it the night before anything that may end a reign. A custom. Most emperors never learn of it.”',
          '“Your predecessor’s says: Kept the tower. That is all. He was pleased with it.”',
          '“I would write yours tonight, while you can still tell me I have it wrong. What should it say you were?”',
        ],
        options: [
          {
            id: 'order',
            label: '“Kept the kingdom standing, whatever it cost.”',
            effects: {
              local: { 'gate-watch': 2, yard: -1 },
              flags: ['d49-record-order'],
            },
            response:
              'Vellum writes it in his slow, even hand. “Whatever it cost,” he says. “I will leave room underneath, Majesty. For the costs.”',
          },
          {
            id: 'promises',
            label:
              '“Kept the crown’s promises, and said so when it could not.”',
            effects: {
              local: { lamplight: 2, 'old-houses': -1 },
              flags: ['d49-record-promises'],
            },
            response:
              'Vellum writes it and reads it back. Then he reads it back again, slower, to hear it twice.',
          },
          {
            id: 'names',
            label: '“Write the names of the people at this fire instead.”',
            effects: {
              local: { yard: 2, 'old-houses': -2 },
              flags: ['d49-record-names'],
            },
            response:
              'It takes him until dawn. He does not complain once. When he is done your name is not on the page. He shows you. You do not mind.',
          },
          {
            id: 'ask-komodo',
            label: 'Ask what he wrote for Young Komodo.',
            requires: { flags: ['komodo-bargain-known'] },
            effects: {},
            response:
              'Vellum turns back many pages, slowly, to one near the end. It is not in his usual ink.',
            next: 'komodo-entry',
          },
        ],
        beats: [
          {
            id: 'komodo-entry',
            lines: [
              '“Advisors do not get entries, Majesty. I wrote one for him anyway, the night we learned what he bought. I am not proud of it.”',
              '“It says: Believed the price was worth paying. Paid it with other people’s lives and his own good name, and never once with his own life. Cheaper than war.”',
              '“He would say that last line was his whole argument. And correct. He may be right. That is why I wrote it in ink.”',
            ],
            options: [
              {
                id: 'not-cheaper',
                label:
                  '“Write, under his, that the emperor did not think it was cheaper.”',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['d49-record-answers-komodo'],
                },
                response:
                  'Vellum writes it under Komodo’s entry, in the same ink. He closes the book like it is sleeping. “That will do,” he says.',
              },
              {
                id: 'order',
                label:
                  '“Kept the kingdom standing, whatever it cost.” Under his, if you like.',
                effects: {
                  local: { 'gate-watch': 2, yard: -1 },
                  flags: ['d49-record-order'],
                },
                response:
                  'Vellum writes it. Then he looks at the two entries side by side a long time. “They rhyme, Majesty,” he says. “I am not sure you meant them to.”',
              },
              {
                id: 'names',
                label:
                  '“Write the names of the people at this fire instead. His too, at the end.”',
                effects: {
                  local: { yard: 2, 'old-houses': -2 },
                  flags: ['d49-record-names'],
                },
                response:
                  'It takes him until dawn. The last name on the page is Komodo’s, in small, careful letters. Vellum does not ask why. You could not have told him.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 50,
    title: 'The Last Dispatch',
    advisor: VELLUM,
    briefings: [
      {
        id: 'abbess-calls',
        source: 'Every lookout',
        text: 'Lanterns are moving up the Abbey tower. The Abbess is calling something up.',
        truth: true,
      },
      {
        id: 'komodo-there',
        source: 'Captain Dunmark',
        text: 'Young Komodo is at the Abbey. He is trying to stop her.',
        truth: true,
        variants: [{ flags: [DEMOTED], source: 'Sergeant Dunmark' }],
      },
      {
        id: 'too-late',
        source: 'A despairing guard',
        text: 'It is already too late to do anything.',
        truth: false,
      },
    ],
    komodo:
      'It is not too late, Majesty. Only late. Send who you trust most, by whatever road you have. I will be here at the fire with the book, writing it down. Whatever happens, somebody remembers it right.',
    quests: ['q-d50-last-dispatch'],
    audiences: [
      {
        id: 'd50-roads-in',
        title: 'The Roads In',
        speaker: 'The court in hiding',
        // Who stands at the last fire, as the act left them (t-039).
        ...D50_ROADS,
        options: [
          {
            id: 'ask-cost',
            label: 'Ask Dunmark and Vellum what each road will cost.',
            effects: {},
            response:
              'Dunmark and Vellum look at each other across the fire. Dunmark speaks first. He is a soldier. The bad news is his job.',
            next: 'costs',
          },
          {
            id: 'front',
            label: 'The front door only. One road. Every hand on it.',
            effects: {
              questAid: [FRONT_DOOR],
            },
            response:
              'Nobody argues. Somebody starts handing out bread. It is the closest thing the court has to a war council. The well and the tower stay dark.',
          },
          {
            id: 'well',
            label: 'Send a small party down the well road too.',
            requires: { flags: ['crypt-path-found'] },
            effects: {},
            response:
              'The party ties ropes around their waists. They do not look at the well longer than they have to.',
            postsQuests: ['q-d50-crypt-path'],
          },
          {
            id: 'bell',
            label: 'Carry the clapper up the Abbey tower. Ring the bell.',
            requires: { flags: ['clapper-recovered'] },
            effects: { affinity: { 'hollow-bell': 5 } },
            response:
              'The clapper hums in its cloth when you lift it. It is heavy. It is almost singing.',
            postsQuests: ['q-d50-ring-the-bell'],
          },
        ],
        beats: [
          {
            id: 'costs',
            lines: [
              {
                who: 'Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“She expects us at the front door, Majesty. Half of us will be singing by the second courtyard. The other half might reach the crypt stair. I’d still go. I wanted you to hear it plain first.”',
              },
              vellumSays(
                '“The well is quieter. Narrower. Nobody who goes down it comes back up quickly. The bell is the oldest way. The Archive believes in it. The Archive is not the one climbing the tower.”',
              ),
              {
                who: 'Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“Every road you open is one more party that might not come back up. Two empty chairs and the peace you chose last night goes with them. One road, all of us on it, and the front door gets every hand we have.”',
              },
              {
                who: 'Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“Whichever road you choose, the people on it will want to hear it from you. Not from me. Not from the book.”',
              },
              'The fire cracks. Somebody at the edge of the light starts counting the people around it. Then stops.',
            ],
            options: [
              {
                id: 'front',
                label:
                  'The front door only. Everyone together. Nobody goes alone.',
                effects: {
                  questAid: [FRONT_DOOR],
                },
                response:
                  'Nobody argues. Somebody starts handing out bread. It is the closest thing the court has to a war council. Dunmark puts his hand on your shoulder once. Then takes it away.',
              },
              {
                id: 'well',
                label: 'Send a small party down the well road too.',
                requires: { flags: ['crypt-path-found'] },
                effects: {},
                response:
                  'The party ties ropes around their waists. They do not look at the well longer than they must. Vellum writes their names before they go. Slowly. Every letter right.',
                postsQuests: ['q-d50-crypt-path'],
              },
              {
                id: 'bell',
                label: 'Carry the clapper up the Abbey tower. Ring the bell.',
                requires: { flags: ['clapper-recovered'] },
                effects: { affinity: { 'hollow-bell': 5 } },
                response:
                  'The clapper hums in its cloth when you lift it. Heavy. Almost singing. Nobody asks who will be at the top of the stair. Everybody thinks it.',
                postsQuests: ['q-d50-ring-the-bell'],
              },
              {
                id: 'every-road',
                label:
                  'Every road at once: the well, the tower and the front door. The court spreads thin across all three.',
                requires: { flags: ['crypt-path-found', 'clapper-recovered'] },
                effects: {
                  local: { 'gate-watch': -2 },
                  flags: ['d50-every-road'],
                },
                response:
                  'Dunmark draws three lines in the dirt and rubs none out. The court divides in silence. Before they go, everyone looks at the ones taking other roads. Learning their faces.',
                postsQuests: ['q-d50-crypt-path', 'q-d50-ring-the-bell'],
              },
            ],
          },
        ],
      },
      {
        id: 'd50-if-you-find-him',
        title: 'If You Find Him',
        speaker: 'Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Before the parties leave, Dunmark finds you alone at the edge of camp. The singing is loudest there.',
          '“My scouts saw him at the Abbey gate last night, Majesty. Young Komodo. No coat. Arguing with the sisters. They were smiling at him. He was losing.”',
          '“If he’s trying to stop her, he’s left it late. If we find him on the stair, the party will want the crown’s orders. I’d rather they didn’t decide it in the dark.”',
          vellumSays(
            '“He kept careful accounts of everything, Captain. Including, I suspect, what he has to answer for. I would like him brought back to answer.”',
          ),
        ],
        options: [
          {
            id: 'bring-back',
            label:
              'Bring him back alive. He answers for the tower in front of everyone he sold.',
            effects: {
              local: { lamplight: 2, 'gate-watch': -1 },
              flags: ['d50-komodo-to-answer'],
            },
            response:
              'Dunmark nods. “Alive is harder,” he says. “I’ll tell them alive.” He goes to tell them. You hear one of the party laugh, not kindly. Then stop.',
          },
          {
            id: 'leave-him',
            label: 'Leave him to the Abbess. He chose her.',
            effects: {
              local: { 'gate-watch': 2, lamplight: -1 },
              flags: ['d50-komodo-left'],
            },
            response:
              '“As you say,” says Dunmark. You watch him decide not to argue. Later Vellum sits beside you, silent. He opens the great book to an empty page. He writes nothing for a long time.',
          },
          {
            id: 'let-him-fight',
            label:
              'If he is fighting her, let him fight. Whatever he was, tonight he is on the stair.',
            effects: {
              local: { 'gate-watch': -2, yard: 1 },
              flags: ['d50-komodo-spared'],
            },
            response:
              'Dunmark is quiet a long while. “He opened my gate,” he says. “He asked after my mother.” He goes to the party and tells them. Nobody argues.',
          },
          {
            id: 'message',
            label:
              'Give the party one message for him, if they find him: “It was not cheaper.”',
            requires: { flags: ['komodo-bargain-known'] },
            effects: {
              local: { lamplight: 2 },
              flags: ['d50-komodo-message'],
            },
            response:
              'Dunmark repeats it twice. Three of the party write it on their sleeves. Nobody asks if you want him alive or dead. After they go, you realise you have not decided.',
          },
        ],
      },
      {
        id: 'd50-burrows',
        title: 'The Burrows Turn Out',
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        requires: { standing: MOLE_ASSEMBLY_TURNS_OUT },
        lines: [
          'At dusk the ground of the camp starts to move. Then the moles come up through it: forty, sixty, more, with picks and lamps and bread in their aprons. Granny Umber comes up last and sits on a crate to get her breath.',
          '“The assembly voted. It took all night. Two hundred and six to forty.”',
          '“We dig under the Abbey wall from the old brick tunnel and come up wherever you need a door. Not everybody who goes down a new tunnel comes up it. Or we go home and hold the stairs for whoever comes back. Either way the burrows are with you. You earned that the slow way.”',
          vellumSays('“Majesty. I have the vote written down. Both numbers.”'),
        ],
        options: [
          {
            id: 'dig',
            label:
              'Dig. Bring the burrows to the Abbey wall. Not all of them come back up.',
            effects: {
              affinity: { moles: 10 },
              strength: { moles: -1 },
              flags: ['d50-moles-dig'],
            },
            response:
              'They go down the way they came, lamps last. Granny Umber counts them into the hole. She does not count aloud. For an hour you can hear them under your feet. Then you can’t.',
          },
          {
            id: 'stairs',
            label: 'Hold the stairs. Someone has to be home when this is over.',
            effects: {
              affinity: { moles: 5 },
              items: ['carbide-lamp'],
              flags: ['d50-moles-hold-stairs'],
            },
            response:
              'Granny Umber nods as if you passed something. “Somebody always holds the stairs,” she says. “Mostly it’s grandmothers.” She unhooks the lamp from her belt and puts it in your hand. “For whoever goes under. It burns blue where the air goes bad.”',
          },
          {
            id: 'lumen',
            label: 'Let Lumen Shale answer the assembly.',
            requires: { follower: 'F010' },
            effects: {},
            response:
              'Lumen steps up beside the crate. She has the funnel trumpet this time.',
            next: 'lumen',
          },
        ],
        beats: [
          {
            id: 'lumen',
            speaker: 'Lumen Shale',
            npc: 'F010',
            lines: [
              '“Forty said no. I want to hear the forty before anybody picks up a shovel. They might be right. They usually are about one thing.”',
              '“Then we vote again, on this, out loud. Two hundred and forty-six people should know what they are digging toward. And who is not coming back up.”',
            ],
            options: [
              {
                id: 'vote-dig',
                label: 'Hear the forty. Then vote again.',
                effects: {
                  affinity: { moles: 5 },
                  strength: { moles: -1 },
                  flags: ['d50-moles-voted', 'd50-moles-dig'],
                },
                response:
                  'They vote in the camp by lamplight, paws up. It takes an hour you do not have. Two hundred and thirty to sixteen. Then they go down, lamps last.',
              },
              {
                id: 'stairs',
                label: 'No vote. Send them home to hold the stairs.',
                effects: {
                  affinity: { moles: 5 },
                  items: ['carbide-lamp'],
                  flags: ['d50-moles-hold-stairs'],
                },
                response:
                  'Lumen lowers the trumpet. “Home, then,” she says to the crowd, and they go. Granny Umber is the last one down. She leaves her lamp on the crate, lit.',
              },
            ],
          },
        ],
      },
    ],
  },
]

/** Act V's obligations (t-040): each host collects what its terms promised. */
export const ACT_FIVE_DUES: readonly DueDef[] = HOST_DUES
