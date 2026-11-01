import type { ExpeditionEncounter } from './expeditionLocal'
import { ACT_TWO_MISSIONS } from './actTwo'
import { ACT_THREE_MISSIONS } from './actThree'

/**
 * Supplemental local incidents for Acts II/III. Keep the underlying galactic
 * encounter IDs and skills stable for save compatibility and pinned endings.
 * The first major and minor encounter in each late world get its own authored
 * local story instead of a verbatim galactic joke.
 */
const LOCAL_SIDES: Readonly<Record<string, readonly [string, string]>> = {
  'concord-intake': [
    "The Desk That Filed Itself",
    "A desk declared an employee is ordered to inventory its own legs before petitioners may be heard.",
  ],
  'courtesy-reactor': [
    "The Twin Candles",
    "The shared medical rail carries two emergency candles; each parliament insists the other light its candle first.",
  ],
  'sesh-backups': [
    "The Suitcase of Originality",
    "Four hundred sentient backups all claim a single scuffed suitcase at lost luggage as proof they are the original.",
  ],
  'serendipity-tab': [
    "The Anonymous Tip Jar",
    "Vox finds a stack of future-dated coins in the bar tip jar, each marked with a refugee family's initials.",
  ],
  'insult-compiler': [
    "The Bridesmaid Armrest",
    "The couch translator demands to be a bridesmaid at a treaty wedding it accidentally invented.",
  ],
  'warranty': [
    "The Satisfaction Coffin",
    "An insurance counter offers unsafe replacement pressure suits shaped like decorative coffins.",
  ],
  'hoa': [
    "The Fourth Moonrise",
    "A walking navigation buoy has a final notice for excessive moonlight, but its fourth moon keeps arriving late.",
  ],
  'season-two': [
    "The Door That Was a Backdrop",
    "A painted emergency exit on the Showrunner's set receives applause each time somebody collides with it.",
  ],
  'committee-end': [
    "The Boarding-Order Anthem",
    "An evacuation committee commissions an eleven-minute anthem with only eight minutes before the next solar flare.",
  ],
  'gig-orchard': [
    "Surge Pricing for Rain",
    "The oxygen app charges the orchard an hourly fee for rain and rates every cloud for tardiness.",
  ],
  'overdue': [
    "The Missing Verb",
    "The Archive repossesses the word knead from a bakery, leaving six terrified cooks staring at flour.",
  ],
  'merger': [
    "The Thermostat's Proxy Vote",
    "Residents classified as thermostats attempt to cast twelve thousand proxy votes. Lawyers demand batteries.",
  ],
  'jump-gate-permit': [
    "A Petition from Tomorrow",
    "A small blue planet brings a complaint about a couch transit that has not happened yet.",
  ],
  'serendipity-last-call': [
    "The Sleeper Booth Lottery",
    "Vox proposes a lottery for the final bed, but the bar's sentient gravity gives tickets to the exhausted.",
  ],
  'gameworld-finale': [
    "The Unionized Trapdoor",
    "A trapdoor joins the performers' union and refuses to drop contestants without informed consent.",
  ],
  'cushion-recall': [
    "The Upholstery Witness",
    "A scarlet cushion testifies at its own product recall hearing on a conveyor heading into a shredder.",
  ],
  'twins-summit': [
    "The Diplomatic Standing Desk",
    "A standing desk accommodates every delegate but insists each speaker first sit down.",
  ],
  'foundry-strike': [
    "The Bubble Lunch Break",
    "The couch's protective bubble requests a lunch break while promising the passengers will remain safe.",
  ],
  'inquiry': [
    "The Exhibit That Objected",
    "An evidence box objects to being called neutral when it was packed by the nemesis's staff.",
  ],
  'windglass-exodus': [
    "The Unread Road Sign",
    "A road sign promises to point everywhere except toward the fleeing families it protects.",
  ],
  'deposit-copy': [
    "The Unauthorized Foreword",
    "A counterfeit memoir arrives with a foreword written by someone who has never boarded the couch.",
  ],
}
const MISSIONS = [...ACT_TWO_MISSIONS, ...ACT_THREE_MISSIONS]
const BY_ID = new Map(MISSIONS.map((mission) => [mission.id, mission]))

export function laterLocalEncounter(
  missionId: string,
  encounter: ExpeditionEncounter,
): ExpeditionEncounter {
  const mission = BY_ID.get(missionId)
  const side = LOCAL_SIDES[missionId]
  if (!mission || !side) return encounter
  if (encounter.priority === 'minor') {
    return {
      ...encounter,
      title: side[0],
      setup: side[1],
      commandResult:
        'The officer asks the affected locals what a fair outcome would look like. ' +
        mission.note,
      redshirtResult:
        'The redshirt tries to claim credit for the solution and finds their name added to the complaint docket at ' +
        mission.system +
        '.',
      secretResult:
        'The crew secures a second, independent witness to the local problem of ' +
        mission.stake +
        '.',
    }
  }
  return {
    ...encounter,
    title: mission.title + ': The Field Hearing',
    setup: mission.dilemma,
    commandResult:
      'The command team protects the residents right to describe the problem before anyone takes charge. ' +
      mission.note,
    redshirtResult:
      'The redshirt files an unauthorized shortcut and discovers nobody asked the couch to represent them at ' +
      mission.system +
      '.',
    secretResult: 'A crew member finds a protected record about ' + mission.stake + '.',
  }
}

export const LATE_LOCAL_ROUTE_IDS = Object.freeze(Object.keys(LOCAL_SIDES))
