import type { AlienGuide } from './alienFieldGuide'

export type CollectorChoice = 'a' | 'b' | 'c'
export type CollectorEnding = 'bond' | 'chaos' | 'retreat'
export type CollectorOption = {
  id: CollectorChoice
  label: string
  consequence: string
  ending: CollectorEnding
  echo: string
}
export type CollectorIncident = {
  at: number
  title: string
  scene: string
  complication: string
  illustrationKey: string
  options: readonly [CollectorOption, CollectorOption, CollectorOption]
}

export const COLLECTOR_INCIDENTS: readonly CollectorIncident[] = [
  {
    at: 5,
    title: 'The Couch Has Acquired a Following',
    scene:
      'Five unrelated species have followed the long red couch into a lopsided parade. The force bubble has become a mobile birdbath, and someone has ordered matching hats.',
    complication:
      'A tiny marcher carries a banner announcing the captain as its "legal nest." Behind it walks something much too large to fit through any door.',
    illustrationKey: 'aliens/milestone-5',
    options: [
      {
        id: 'a',
        label: 'DECLARE IT A ROYAL PROCESSION',
        consequence:
          'The captain waves from a cushion. The marchers invent an anthem in six incompatible time signatures. Local news reports that the couch has annexed a puddle.',
        ending: 'chaos',
        echo: 'Passing birds still address the captain as Regent of the Puddle.',
      },
      {
        id: 'b',
        label: 'ASK WHO THE BANNER BELONGS TO',
        consequence:
          'It belongs to the little creature’s grandmother, who has searched for it for three generations. Their reunion turns the parade into a mobile family picnic.',
        ending: 'bond',
        echo: 'A family picnic delegation recommends the couch to nervous visitors.',
      },
      {
        id: 'c',
        label: 'DISGUISE THE COUCH AS A BUS STOP',
        consequence:
          'The procession boards an imaginary bus, realizes its mistake and wanders off in six directions. The captain inherits a very authoritative timetable.',
        ending: 'retreat',
        echo: 'A bus timetable listing no actual buses circulates among the aliens.',
      },
    ],
  },
  {
    at: 12,
    title: 'The Intergalactic Census Calls',
    scene:
      'A census official in a novelty squid hat boards the couch with a stack of forms taller than its backrest. Twelve species have named the same red sofa as their next of kin.',
    complication:
      'The official asks whether the safety bubble is a household, an ecosystem or a legally recognized soup. Its pen refuses to write the word furniture.',
    illustrationKey: 'aliens/milestone-12',
    options: [
      {
        id: 'a',
        label: 'FILE A GROUP ADOPTION CERTIFICATE',
        consequence:
          'The family tree blocks three customs lanes. The clerk stamps APPROVED on every page, including the space between the pages.',
        ending: 'bond',
        echo: 'The couch receives birthday invitations addressed to All Residents, Including Moss.',
      },
      {
        id: 'b',
        label: 'INSIST THE COUCH IS SOUP',
        consequence:
          'A chef arrives to taste the shield. Three inspectors argue about garnish until the captain becomes the subject of an emergency cookbook recall.',
        ending: 'chaos',
        echo: 'Several stations advertise a new delicacy called Upholstery Bisque.',
      },
      {
        id: 'c',
        label: 'REQUEST AN EXTENSION UNTIL TUESDAY',
        consequence:
          'The clerk consults seven calendars and discovers none contain Tuesday. Administration withdraws to investigate; the forms vanish into a diplomatic briefcase.',
        ending: 'retreat',
        echo: 'Census drones ask when Tuesday will finally occur.',
      },
    ],
  },
  {
    at: 25,
    title: 'Unauthorized Wildlife Fan Club',
    scene:
      'Twenty-five documented alien species have formed a club in the folded room behind the couch. The first motion: determine whether the captain is a domesticated animal.',
    complication:
      'A microscopic choir conducts roll call at unbearable volume. Outside, a shy elder holds a carefully folded dissenting opinion.',
    illustrationKey: 'aliens/milestone-25',
    options: [
      {
        id: 'a',
        label: 'INVITE THE ELDER TO SPEAK',
        consequence:
          'The elder asks members to stop describing each other as collectibles. The club renames itself Friends of the Red Couch and elects its smallest member president.',
        ending: 'bond',
        echo: 'The Friends of the Red Couch send thoughtful introductions to visiting aliens.',
      },
      {
        id: 'b',
        label: 'RUN FOR CLUB PRESIDENT',
        consequence:
          'The captain wins by a vote cast by the upholstery. The new constitution requires a ceremonial nap every seventeen minutes, including during combat.',
        ending: 'chaos',
        echo: 'The upholstered electorate keeps issuing mandatory nap orders.',
      },
      {
        id: 'c',
        label: 'RESIGN BEFORE BEING NOMINATED',
        consequence:
          'The members accept the resignation, discover the captain was never nominated, and dissolve into six disagreeing book groups.',
        ending: 'retreat',
        echo: 'Rival reading circles claim to possess the captain’s unpublished memoir.',
      },
    ],
  },
  {
    at: 50,
    title: 'The Counterfeit Couch Appears',
    scene:
      'A second long red couch drifts into view, woven entirely from sleeping aliens with miniature force bubbles. Its embroidered label reads MOST COUCH CONTEST.',
    complication:
      'The imitation yawns, accidentally producing a constellation of pillows. An upholstered referee loudly demands a challenger.',
    illustrationKey: 'aliens/milestone-50',
    options: [
      {
        id: 'a',
        label: 'ACCEPT THE UPHOLSTERY DUEL',
        consequence:
          'Both couches compete to become more comfortable. The resulting softness transforms a nearby asteroid belt into a mattress showroom. The judges call it a draw.',
        ending: 'chaos',
        echo: 'Furniture advertisements quote the infamous Upholstery Duel.',
      },
      {
        id: 'b',
        label: 'ASK WHETHER THE OTHER COUCH IS TIRED',
        consequence:
          'The imitation admits it has been carrying passengers without a break for millennia. Two couches spend a whole afternoon doing absolutely nothing.',
        ending: 'bond',
        echo: 'A rested living couch recommends the red sofa to weary travelers.',
      },
      {
        id: 'c',
        label: 'PRETEND TO BE AN ORDINARY BENCH',
        consequence:
          'The living couch loses interest and wanders away to challenge a remarkably smug ottoman.',
        ending: 'retreat',
        echo: 'Rumors spread about a wandering furniture tournament.',
      },
    ],
  },
  {
    at: 75,
    title: 'The Congress of Things with Feet',
    scene:
      'Delegates with zero to seventeen feet assemble behind the couch for a diplomatic summit. Each delegation has brought exactly the wrong number of chairs.',
    complication:
      'The footless representatives object to the title. The seventeen-footed delegation objects to every aisle being too narrow.',
    illustrationKey: 'aliens/milestone-75',
    options: [
      {
        id: 'a',
        label: 'LET EVERYONE REDESIGN THE FLOOR PLAN',
        consequence:
          'The delegates invent a room that folds to any shape, including a respectful absence of floors. Universal access passes by unanimous applause.',
        ending: 'bond',
        echo: 'Traveling delegates remember the Foldable Room Accord.',
      },
      {
        id: 'b',
        label: 'COUNT EVERY FOOT AS A VOTE',
        consequence:
          'The seventeen-footed bloc attempts a coup. The footless caucus counters with interpretive floating, forcing a constitutional recount.',
        ending: 'chaos',
        echo: 'The captain remains a footnote in the Seventeen-Foot Referendum.',
      },
      {
        id: 'c',
        label: 'DECLARE AN INDEFINITE TEA BREAK',
        consequence:
          'Delegates scatter to find suitable cups. The summit never officially adjourns, but everyone gets home satisfied.',
        ending: 'retreat',
        echo: 'Invitations to the same unfinished tea break arrive from distant stations.',
      },
    ],
  },
  {
    at: 100,
    title: 'One Empty Page Remains',
    scene:
      'A hundred species have left their marks in the scrapbook. The last page is blank, yet a shadow keeps turning it from the other side.',
    complication:
      'The book rustles without moving. A small voice asks: "Does an undiscovered thing exist if nobody names it?"',
    illustrationKey: 'aliens/milestone-100',
    options: [
      {
        id: 'a',
        label: 'LEAVE THE FINAL PAGE OPEN',
        consequence:
          'The voice is relieved. It has waited for someone who can accept a question without answering it. Outside the bubble, a previously impossible trail of stars appears.',
        ending: 'bond',
        echo: 'The final page points toward the last undiscovered lifeform.',
      },
      {
        id: 'b',
        label: 'COPYRIGHT THE SHADOW',
        consequence:
          'The shadow hires an attorney, who hires another attorney, who turns out to be the shadow. A temporary black hole opens in the stationery aisle.',
        ending: 'chaos',
        echo: 'A legendary shadow sends invoices for the captain’s own silhouette.',
      },
      {
        id: 'c',
        label: 'CLOSE THE BOOK AND TAKE A NAP',
        consequence:
          'The rustling stops. A gentle tapping resumes after the nap, and the empty page remains intact for whenever the crew feels ready.',
        ending: 'retreat',
        echo: 'The last page has learned to wait politely through naps.',
      },
    ],
  },
]

export const nextCollectorIncident = (
  guide: AlienGuide,
): CollectorIncident | null =>
  COLLECTOR_INCIDENTS.find(
    (incident) =>
      guide.discovered.length >= incident.at &&
      !guide.milestoneDecisions?.[String(incident.at)],
  ) ?? null

export const collectorEcho = (guide: AlienGuide): string | null => {
  const recent = [...guide.milestoneSeen]
    .reverse()
    .find(
      (at) =>
        guide.milestoneDecisions?.[String(at)] &&
        COLLECTOR_INCIDENTS.some((incident) => incident.at === at),
    )
  if (!recent) return null
  const story = COLLECTOR_INCIDENTS.find((incident) => incident.at === recent)
  const choice = guide.milestoneDecisions?.[String(recent)]
  return story?.options.find((option) => option.id === choice)?.echo ?? null
}

export function resolveCollectorIncident(
  guide: AlienGuide,
  at: number,
  choice: CollectorChoice,
): { guide: AlienGuide; ending: CollectorEnding; text: string } | null {
  const pending = nextCollectorIncident(guide)
  if (!pending || pending.at !== at) return null
  const selected = pending.options.find((option) => option.id === choice)
  if (!selected) return null
  return {
    guide: {
      ...guide,
      milestoneSeen: [...new Set([...guide.milestoneSeen, at])],
      milestoneDecisions: {
        ...(guide.milestoneDecisions ?? {}),
        [String(at)]: choice,
      },
    },
    ending: selected.ending,
    text: selected.consequence,
  }
}
