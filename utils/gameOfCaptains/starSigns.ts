/**
 * The Couchscope: twelve wholly fictional star constellations.
 * Four playful answers choose a sign; captain selection never overrides it.
 * Each constellation has three gated, authored episodic quests.
 */
export const STAR_QUEST_CHAPTERS = [1, 4, 7] as const

export const STAR_QUESTIONS = [
  {
    prompt: 'The moon has filed a formal grievance against sunrise. How do you close the ticket?',
    cue: 'FORM HR-01 · CONFLICT MANAGEMENT',
    options: [
      {
        label: 'Offer the moon a blanket and an impartial mediator',
        flavor: 'Empathy, pending budget approval',
      },
      {
        label: 'Audit the sun for undisclosed conflicts of interest',
        flavor: 'Due diligence, possibly excessive',
      },
      {
        label: 'Reschedule sunrise for Thursday without consulting anyone',
        flavor: 'Executive decisiveness',
      },
    ],
  },
  {
    prompt: 'Next-week-you arrives on the couch requesting retroactive leave. HR demands a response.',
    cue: 'FORM HR-02 · IDENTITY VERIFICATION',
    options: [
      {
        label: 'Provide tea and ask about their work-life balance',
        flavor: 'Unbillable emotional labor',
      },
      {
        label: 'Cross-check memories, signatures and the time-stamped badge',
        flavor: 'An inconveniently thorough investigation',
      },
      {
        label: 'Declare a mandatory zero-gravity team-building exercise',
        flavor: 'Conflict resolved through organized spectacle',
      },
    ],
  },
  {
    prompt: 'Your interns discover a planet-sized lost-property depot. Headquarters wants measurable results.',
    cue: 'FORM HR-03 · ASSET STEWARDSHIP',
    options: [
      {
        label: 'Return every object to its owner, including the dangerous ones',
        flavor: 'Accountability without an expense limit',
      },
      {
        label: 'Catalog the artifacts before anyone can erase the records',
        flavor: 'Documentation is its own reward',
      },
      {
        label: 'Wear the royal crown from the restricted inventory',
        flavor: 'Leadership initiative, legally questionable',
      },
    ],
  },
  {
    prompt: 'You are authorized to approve one miracle. Finance has forwarded you the invoice.',
    cue: 'FORM HR-04 · EXECUTIVE RESOURCE ALLOCATION',
    options: [
      {
        label: 'Rescue someone the quarterly report forgot to include',
        flavor: 'Impact outside the approved metrics',
      },
      {
        label: 'Publish the one truth the board has been suppressing',
        flavor: 'Transparency without a communications plan',
      },
      {
        label: 'Fund a new ending for everyone, then resign',
        flavor: 'Transformational change and a severance request',
      },
    ],
  },
] as const

export type StarAnswers = [number, number, number, number]
export type StarSignId =
  | 'northern-sloth'
  | 'princess-mantic-shrimp'
  | 'velvet-comet'
  | 'clockwork-minnow'
  | 'royal-dust-bunny'
  | 'laughing-leviathan'
  | 'nebular-teapot'
  | 'three-headed-librarian'
  | 'feral-umbrella'
  | 'last-lantern'
  | 'moonlit-upholsterer'
  | 'cosmic-turnip'
export type StarAssessment = {
  answers: StarAnswers
  sign: StarSignId
}
export type StarQuest = {
  id: string
  title: string
  setup: string
  ending: string
}
export type StarSign = {
  id: StarSignId
  name: string
  epithet: string
  myth: string
  omen: string
  glyph: string
  quests: readonly [StarQuest, StarQuest, StarQuest]
}

export const STAR_SIGNS: readonly StarSign[] = [
  {
    id: 'northern-sloth',
    name: 'The Northern Sloth',
    epithet: 'The Patient Star That Refuses to Hurry',
    glyph: '✳',
    myth: 'It took nine thousand years to climb one celestial tree. The tree moved closer out of respect.',
    omen: 'Your gentlest choice may change an entire orbit.',
    quests: [
      {
        id: 'sloth-vigil',
        title: 'The Planet That Needs a Nap',
        setup:
          'A sleepless world is being charged interest for its dreams. The Sloth points toward the only quiet room in the system.',
        ending: 'The planet sleeps for the first time in a century.',
      },
      {
        id: 'sloth-hour',
        title: 'The Longest Minute',
        setup:
          'A distress signal arrives one minute too early, and a patient star keeper insists the pause is the answer.',
        ending: 'The survivors discover that waiting was an action.',
      },
      {
        id: 'sloth-accord',
        title: 'The Right to Rest',
        setup:
          'At the jump gate, the empire intends to abolish downtime. Only a captain beneath the Northern Sloth can present the star keeper’s testimony.',
        ending: 'The galaxy signs a treaty guaranteeing a little peace.',
      },
    ],
  },
  {
    id: 'princess-mantic-shrimp',
    name: 'The Princess Mantic Shrimp',
    epithet: 'The Tiny Crown with a Catastrophic Punch',
    glyph: '♛',
    myth: 'A jewel-bright warrior-princess punched a hole in the night to let the lost find home.',
    omen: 'A small gesture may leave an enormous crater.',
    quests: [
      {
        id: 'shrimp-coronation',
        title: 'The Royal Prawn Uprising',
        setup:
          'A fist-sized heir refuses a throne made from stolen moons. Her ceremonial claws could crack the palace.',
        ending: 'The heir takes her crown on her own conditions.',
      },
      {
        id: 'shrimp-punch',
        title: 'A Knock on the Palace Door',
        setup:
          'A sealed fortress recognizes the Princess’s constellation, but the old royal greeting looks suspiciously like an explosion.',
        ending:
          'The fortress learns the difference between force and authority.',
      },
      {
        id: 'shrimp-legacy',
        title: 'The Smallest Rebellion',
        setup:
          'A future empress asks why a captain born under the tiny princess should decide who deserves power.',
        ending:
          'The tiny princess leaves an enormous constitutional amendment.',
      },
    ],
  },
  {
    id: 'velvet-comet',
    name: 'The Velvet Comet',
    epithet: 'A Dramatic Entrance, a Soft Landing',
    glyph: '✦',
    myth: 'A comet wore a velvet cape to its own extinction and arrived late enough to miss it.',
    omen: 'Every grand exit has a secret second act.',
    quests: [
      {
        id: 'comet-encore',
        title: 'Encore at the End of Time',
        setup:
          'A traveling troupe performs the last five seconds of history on repeat, begging for a captain with a flair for entrances.',
        ending: 'The stage curtain opens onto tomorrow.',
      },
      {
        id: 'comet-cape',
        title: 'The Stolen Tail',
        setup:
          'A cosmic costume thief has stolen the Comet’s luminous train and sold it to a casino billboard.',
        ending: 'A stolen light returns to the night.',
      },
      {
        id: 'comet-last-act',
        title: 'The Curtain Will Rise Again',
        setup:
          'The final audience has paid to see the universe end. The Comet offers one alternative performance.',
        ending: 'The universe earns an encore.',
      },
    ],
  },
  {
    id: 'clockwork-minnow',
    name: 'The Clockwork Minnow',
    epithet: 'Keeper of the Seconds Between Seconds',
    glyph: '⌘',
    myth: 'A little silver fish swam upstream through time until all the clocks ran kindly.',
    omen: 'A tiny correction may rescue a century.',
    quests: [
      {
        id: 'minnow-tide',
        title: 'The Hourglass Aquarium',
        setup:
          'The fish who run the city clocks are trapped in yesterday’s water.',
        ending: 'The clocks begin marking time for everyone.',
      },
      {
        id: 'minnow-second',
        title: 'The Missing Second',
        setup:
          'A missing heartbeat of history has been auctioned off to the highest temporal bidder.',
        ending: 'An unowned second is returned to the public.',
      },
      {
        id: 'minnow-paradox',
        title: 'The Future’s Spare Key',
        setup:
          'A future version of the galaxy has left an emergency exit inside a clockwork fish.',
        ending: 'The future remembers who opened the door.',
      },
    ],
  },
  {
    id: 'royal-dust-bunny',
    name: 'The Royal Dust Bunny',
    epithet: 'Monarch of Things Nobody Notices',
    glyph: '♧',
    myth: 'A dust bunny declared a kingdom under a discarded couch and invited every lost thing to stay.',
    omen: 'What was overlooked will prove essential.',
    quests: [
      {
        id: 'bunny-court',
        title: 'The Kingdom Under the Cushions',
        setup:
          'A forgotten court holds a trial about who owns the miniature rooms behind the couch.',
        ending: 'The overlooked people receive seats at their own table.',
      },
      {
        id: 'bunny-heirloom',
        title: 'The Lost Crown of Small Things',
        setup:
          'A pawnshop planet has pawned the royal dust crown for a vacuum cleaner.',
        ending: 'A humble crown finds its rightful keepers.',
      },
      {
        id: 'bunny-throne',
        title: 'No Throne Too Small',
        setup:
          'An empire demands the little kingdom surrender its identity to a larger map.',
        ending: 'The tiny nation remains independent.',
      },
    ],
  },
  {
    id: 'laughing-leviathan',
    name: 'The Laughing Leviathan',
    epithet: 'The Deep Sea That Knows the Punchline',
    glyph: '≈',
    myth: 'A star-whale laughed so hard at the first war that its waves washed the weapons away.',
    omen: 'A well-timed joke may outlast a fleet.',
    quests: [
      {
        id: 'leviathan-song',
        title: 'The Whale Who Swallowed a War',
        setup:
          'A colossal singer has swallowed a battle fleet and refuses to perform the encore.',
        ending: 'The fleet returns without its reasons to fight.',
      },
      {
        id: 'leviathan-echo',
        title: 'The Sea of Shared Laughter',
        setup:
          'A colony has criminalized jokes after one exposed its governor’s secret submarine.',
        ending: 'The colony laughs in public again.',
      },
      {
        id: 'leviathan-truce',
        title: 'The Final Punchline',
        setup:
          'The villain wants a world-ending joke. The Leviathan insists on changing its audience.',
        ending: 'The final joke ends a feud instead.',
      },
    ],
  },
  {
    id: 'nebular-teapot',
    name: 'The Nebular Teapot',
    epithet: 'Tea for Every Impossible Guest',
    glyph: '☕',
    myth: 'When the first black hole was lonely, the Teapot invited it to supper and kept its secrets.',
    omen: 'Hospitality may open a locked cosmos.',
    quests: [
      {
        id: 'teapot-invitation',
        title: 'The Black Hole’s Tea Party',
        setup:
          'A silent singularity invites the couch to a banquet for people it has already swallowed.',
        ending: 'A previously lost guest returns with a recipe.',
      },
      {
        id: 'teapot-guest',
        title: 'A Place at the Table',
        setup:
          'Two hostile civilizations are offered the same final chair at a star-sized supper.',
        ending: 'Both delegations discover an extra seat.',
      },
      {
        id: 'teapot-covenant',
        title: 'The Invitation That Cannot Expire',
        setup:
          'The last star table is being dismantled before the final peace talks.',
        ending: 'An invitation outlives the empire that issued it.',
      },
    ],
  },
  {
    id: 'three-headed-librarian',
    name: 'The Three-Headed Librarian',
    epithet: 'One Truth, Three Incompatible Footnotes',
    glyph: '⌑',
    myth: 'Three heads catalogued every possible ending and then argued over which was the beginning.',
    omen: 'A disputed record can still save someone.',
    quests: [
      {
        id: 'librarian-book',
        title: 'The Book That Unwrote Its Reader',
        setup:
          'A banned volume is erasing the people who check it out of the library.',
        ending: 'The missing readers regain their names.',
      },
      {
        id: 'librarian-index',
        title: 'The Unauthorized Index',
        setup:
          'An imperial archive has deleted the last page of every rebellion.',
        ending: 'The erased pages become a public record.',
      },
      {
        id: 'librarian-truth',
        title: 'Three Versions of Forever',
        setup:
          'The villain submits three mutually exclusive official endings. Your constellation recognizes the forged one.',
        ending: 'The record cannot be silently revised again.',
      },
    ],
  },
  {
    id: 'feral-umbrella',
    name: 'The Feral Umbrella',
    epithet: 'Shelter with a Rebellious Handle',
    glyph: '☂',
    myth: 'An umbrella learned to fly so it could shelter every person beneath a meteor shower.',
    omen: 'Protection need not mean obedience.',
    quests: [
      {
        id: 'umbrella-storm',
        title: 'The Weather Strike',
        setup:
          'A world’s thunderstorms have unionized and are demanding protective equipment.',
        ending: 'The storms receive a safer schedule.',
      },
      {
        id: 'umbrella-roof',
        title: 'The Last Dry Place',
        setup:
          'A refugee station has one roof and a thousand conflicting promises.',
        ending: 'No traveler is left outside the shelter.',
      },
      {
        id: 'umbrella-canopy',
        title: 'A Galaxy Under One Canopy',
        setup:
          'The villain offers a shield that protects everyone only if nobody may ever leave.',
        ending: 'The shield becomes a choice, not a prison.',
      },
    ],
  },
  {
    id: 'last-lantern',
    name: 'The Last Lantern',
    epithet: 'A Light that Refuses to Take Credit',
    glyph: '✺',
    myth: 'The last lantern stayed lit after the stars fled, not to lead heroes but to find the missing.',
    omen: 'The lost have been waiting for this signal.',
    quests: [
      {
        id: 'lantern-beacon',
        title: 'The Lighthouse at Zero',
        setup:
          'A beacon shines from a star that never existed and sends the names of missing travelers.',
        ending: 'The missing travelers get a route home.',
      },
      {
        id: 'lantern-wick',
        title: 'The Unpaid Keepers',
        setup:
          'Lightkeepers must surrender their last flame to keep an imperial monument glowing.',
        ending: 'Their own lighthouse stays lit.',
      },
      {
        id: 'lantern-dawn',
        title: 'The Light After the Credits',
        setup:
          'At the finale, a final distress call arrives from the side the villain thinks is empty.',
        ending: 'A rescue signal becomes the galaxy’s dawn.',
      },
    ],
  },
  {
    id: 'moonlit-upholsterer',
    name: 'The Moonlit Upholsterer',
    epithet: 'The One Who Stitches Broken Worlds',
    glyph: '✄',
    myth: 'With thread made from moonbeams, a tailor repaired a tear in the cosmos and forgot to charge.',
    omen: 'Two damaged things may become something new.',
    quests: [
      {
        id: 'upholsterer-seam',
        title: 'A Hole in Tuesday',
        setup:
          'A missing piece of the week falls through a tear in space and into the backrest.',
        ending:
          'The calendar is whole again, although Tuesday feels different.',
      },
      {
        id: 'upholsterer-needle',
        title: 'The Dress Rehearsal for Reality',
        setup:
          'A tailor is accused of repairing worlds that did not ask to be fixed.',
        ending: 'The worlds agree on a new seam.',
      },
      {
        id: 'upholsterer-mending',
        title: 'The Universe Has a Loose Thread',
        setup:
          'The final jump gate is splitting into incompatible futures. Only a moonbeam stitch can hold the choice open.',
        ending: 'The futures remain different but connected.',
      },
    ],
  },
  {
    id: 'cosmic-turnip',
    name: 'The Cosmic Turnip',
    epithet: 'The Root that Holds the Stars Together',
    glyph: '✿',
    myth: 'A turnip grew so deep that it rooted every wandering world to somewhere it could call home.',
    omen: 'Belonging begins in unlikely soil.',
    quests: [
      {
        id: 'turnip-garden',
        title: 'The Vegetable That Declared Independence',
        setup:
          'A sentient harvest objects to being called a resource and starts its own space program.',
        ending: 'A garden sends its first diplomat into orbit.',
      },
      {
        id: 'turnip-root',
        title: 'The Root of the Problem',
        setup:
          'A supply planet has been eating its own roots to keep neighboring worlds alive.',
        ending: 'The starving world is finally allowed to grow.',
      },
      {
        id: 'turnip-home',
        title: 'A Place to Put Down Roots',
        setup:
          'The villain insists all displaced planets must be returned to the places they were born.',
        ending: 'Every world is permitted to choose its home.',
      },
    ],
  },
] as const

export function validStarAnswers(raw: unknown): raw is StarAnswers {
  return (
    Array.isArray(raw) &&
    raw.length === STAR_QUESTIONS.length &&
    raw.every((v) => Number.isInteger(v) && v >= 0 && v < 3)
  )
}

/** All twelve signs are reachable across the 81 possible answer combinations. */
export function calculateStarSign(answers: StarAnswers): StarSign {
  const index =
    (answers[0] + answers[1] * 3 + answers[2] * 5 + answers[3] * 7) %
    STAR_SIGNS.length
  return STAR_SIGNS[index]!
}

export function createStarAssessment(raw: unknown): StarAssessment | null {
  if (!validStarAnswers(raw)) return null
  return {
    answers: [...raw] as StarAnswers,
    sign: calculateStarSign(raw).id,
  }
}

export function validStarAssessment(raw: unknown): raw is StarAssessment {
  if (!raw || typeof raw !== 'object') return false
  const value = raw as Partial<StarAssessment>
  return (
    validStarAnswers(value.answers) &&
    value.sign === calculateStarSign(value.answers).id
  )
}

export function starSignFor(id: StarSignId): StarSign {
  return STAR_SIGNS.find((s) => s.id === id)!
}

/** The sign's 2nd and 3rd quests are sequential, never accessible to other signs. */
export function availableStarQuest(
  assessment: StarAssessment | undefined,
  chapter: number,
  completed: readonly string[],
): StarQuest | null {
  if (!assessment || !validStarAssessment(assessment)) return null
  const quests = starSignFor(assessment.sign).quests
  const index = quests.findIndex(
    (quest) => !completed.includes('star-quest:' + quest.id),
  )
  if (index < 0 || chapter < STAR_QUEST_CHAPTERS[index]!) return null
  return quests[index]!
}
