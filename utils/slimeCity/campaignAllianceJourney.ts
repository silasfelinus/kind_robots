// The same five-chapter Journey admits an ally-specific decision before each
// Alliance battle. Every directed pairing has an authored conflict; switching
// an ally before a fight reopens that chapter's decision, never older chapters.
import type { BoutTerms } from './city'
import type { CampaignSave } from './campaign'
import { TEAMS, type TeamId } from './prototypes'
import { ALLIANCE_LATER_ARCS } from './campaignAllianceLater'

export type AllianceStoryPick = 'protect' | 'gamble'
export interface AllianceStoryDecision {
  ally: TeamId
  pick: AllianceStoryPick
}
export interface AllianceStoryChoice {
  id: AllianceStoryPick
  label: string
  outcome: string
  terms: string
}
export interface AllianceStoryScene {
  id: string
  title: string
  speaker: string
  text: string
  ally: TeamId
  chapter: number
  choices: [AllianceStoryChoice, AllianceStoryChoice]
}
type Thread = {
  title: string
  speaker: string
  conflict: string
  protect: [label: string, outcome: string]
  gamble: [label: string, outcome: string]
}
const thread = (
  title: string,
  speaker: string,
  conflict: string,
  protect: Thread['protect'],
  gamble: Thread['gamble'],
): Thread => ({ title, speaker, conflict, protect, gamble })

/** Directed relationships. Riot leading Bloodfairies is a different story from
 * Bloodfairies leading Riot, even when both decks contain the same cards. */
export const ALLIANCE_THREADS: Record<
  TeamId,
  Partial<Record<TeamId, Thread>>
> = {
  catgirls: {
    bloodfairies: thread(
      'THE UNLISTED CHORUS',
      'Moxie of the Bloodfairies',
      'The band offers backstage passes to fugitives whose lab serials glow under the stage lights.',
      [
        'Hide the escapees in the chorus',
        'The drummer keeps time while the fugitives slip out through the instrument cases.',
      ],
      [
        'Sing their stolen serial numbers',
        'The crowd learns the hunters’ inventory numbers, but the broadcast gives the lab a trail.',
      ],
    ),
    ironjaw: thread(
      'HATCHLING PROTOCOL',
      'Forewoman Rivet',
      'Ironjaw has the access key to a hatchery where the same laboratory keeps your youngest kin.',
      [
        'Carry the hatchlings to warm shelter',
        'The hatchlings escape under stolen thermal blankets while Rivet holds the doors.',
      ],
      [
        'Raid the hatchery server instead',
        'You steal the living inventory and its security map, leaving the hatchery guards exposed.',
      ],
    ),
    riot: thread(
      'THE ESCAPE ACT',
      'Saint Kaboom',
      'Anarkiss has built a stage cage out of real transport crates with the lab’s seal still on them.',
      [
        'Smuggle survivors through the trapdoor',
        'The audience applauds an escape trick without knowing the fugitives are real.',
      ],
      [
        'Reveal the hunters to the audience',
        'The hunters become the unwilling stars of a very public humiliation.',
      ],
    ),
    undertow: thread(
      'THE NAMES UNDER WATER',
      'The Drain Oracle',
      'Undertow can delete the records naming your crew as lab property, or publish the scientists behind them.',
      [
        'Erase the escapees’ records',
        'The files vanish, and the hunters lose their lists of faces.',
      ],
      [
        'Publish the researchers’ identities',
        'The scientists are exposed, but their frightened assistants scatter with the keys.',
      ],
    ),
    exchange: thread(
      'THE CLONE CLAUSE',
      'The Ledger Keeper',
      'The Exchange produces a deed claiming ownership of every clone in your family.',
      [
        'Burn the deed with its witnesses present',
        'The bound names curl into ash, even if the Exchange loses its collateral.',
      ],
      [
        'Use the deed to seize its owners',
        'You trade one forged signature for a dozen hunters trapped in their own contract.',
      ],
    ),
  },
  bloodfairies: {
    catgirls: thread(
      'THE STOLEN HARMONIES',
      'Moxie of the Bloodfairies',
      'A choir of escaped catgirls knows the missing verse of your banned song, but recording it identifies them.',
      [
        'Keep the singers anonymous',
        'The chorus sounds through a curtain, and none of their faces reach the camera.',
      ],
      [
        'Broadcast the forbidden verse',
        'Your song interrupts the city feed while the lab scrambles to recover its singers.',
      ],
    ),
    ironjaw: thread(
      'A FURNACE FOR THE BACKLINE',
      'Forewoman Rivet',
      'The cold-blooded roadies cannot keep time in the freezer venue; the stage is powered by the foundry’s confiscated heat.',
      [
        'Warm the musicians before the set',
        'Rivet diverts the stolen heat into the dressing room and the band gets its hands back.',
      ],
      [
        'Overload the venue’s amplifiers',
        'The speakers roar with stolen furnace power, and every rival hears the opening chord.',
      ],
    ),
    riot: thread(
      'THE DANGEROUS SUPPORT ACT',
      'Saint Kaboom',
      'Anarkiss offers a spectacular warm-up act that might bring down the roof before your first chorus.',
      [
        'Rehearse a safe shared finale',
        'The two crews practice their exits and leave room for the fans to dance.',
      ],
      [
        'Stage the unlicensed detonation',
        'Anarkiss blows the rival barricade apart exactly on the downbeat.',
      ],
    ),
    undertow: thread(
      'THE LEAKED SETLIST',
      'The Drain Oracle',
      'Undertow has the route of a raid targeting your next concert, written between notes of a leaked setlist.',
      [
        'Evacuate the fans quietly',
        'The crowd follows a secret encore into the side streets while security searches the empty venue.',
      ],
      [
        'Turn the raid into a trap',
        'The band plays a false last song and draws the raid straight into the floodlights.',
      ],
    ),
    exchange: thread(
      'THE CONTRACT IN RED INK',
      'The Ledger Keeper',
      'Your touring contract pays in Meat, but the encore clause names an organ donor instead of an opening act.',
      [
        'Shred the contract in public',
        'The fans tear copies of the contract into confetti as the Exchange loses its leverage.',
      ],
      [
        'Forge a new owner of the debt',
        'The Exchange discovers its own collectors have signed away their salaries.',
      ],
    ),
  },
  ironjaw: {
    catgirls: thread(
      'THE SAME WHITE COATS',
      'Forewoman Rivet',
      'Your lizard crew recognizes the lab coat insignia on the catgirls’ pursuers: the same people built your cages.',
      [
        'Extract the remaining subjects',
        'Warm blankets and a stolen truck carry the last captives out of the testing wing.',
      ],
      [
        'Steal the doctors’ access implants',
        'The scientists lose their doors and the workers gain the keys.',
      ],
    ),
    bloodfairies: thread(
      'SHIFT CHANGE IN FOUR-FOUR',
      'Moxie of the Bloodfairies',
      'The band offers to lead the picket, but the factory owners promise to cut power to the workers’ incubators.',
      [
        'Protect the nursery during the strike',
        'The musicians hold a candlelit vigil while workers carry the incubators to safety.',
      ],
      [
        'Turn the assembly line into percussion',
        'Every hammer strike lands on the beat, and the owners hear the rebellion through the walls.',
      ],
    ),
    riot: thread(
      'FIREWORKS AT THE PICKET',
      'Saint Kaboom',
      'Anarkiss has enough illegal fireworks to end the lockout, and none of the permits to survive it.',
      [
        'Build a safe passage around the gates',
        'The crowd moves past the foundry in a corridor of bright but harmless flares.',
      ],
      [
        'Blow the gate at shift change',
        'The gate falls with a theatrical crash and every camera turns toward the explosion.',
      ],
    ),
    undertow: thread(
      'THE COOLANT UNDERGROUND',
      'The Drain Oracle',
      'Undertow knows the coolant tunnels, where a single flood could disable the foundry and freeze your sleepers.',
      [
        'Route warm water to the sleepers',
        'The workers keep their heat while the stolen coolant drains harmlessly away.',
      ],
      [
        'Flood the supervisors’ control room',
        'The owners lose every switch on the floor and the alarms wake the district.',
      ],
    ),
    exchange: thread(
      'THE PRICE OF BODY HEAT',
      'The Ledger Keeper',
      'The Exchange has securitized your crew’s body heat, collecting interest for every hour a worker stays alive.',
      [
        'Void the workers’ thermal debts',
        'The debt certificates burn in the furnace they were written to own.',
      ],
      [
        'Sell the debt back to its authors',
        'The collectors discover they owe interest on their own pulse.',
      ],
    ),
  },
  riot: {
    catgirls: thread(
      'THE TRAPDOOR REFUGE',
      'Saint Kaboom',
      'The escape artist’s prop cage carries actual catgirl fugitives; the lab has bought front-row tickets.',
      [
        'Keep the hidden passengers safe',
        'The cage drops beneath the stage before the hunters recognize its occupants.',
      ],
      [
        'Unmask the hunters in the spotlight',
        'The lab’s pursuit team gets its own involuntary curtain call.',
      ],
    ),
    bloodfairies: thread(
      'THE ENCORE THAT COSTS MEAT',
      'Moxie of the Bloodfairies',
      'The touring punk band refuses to play until the Anarkiss crowd gets water and a clear fire exit.',
      [
        'Build the exit into the choreography',
        'The crowd learns the evacuation dance without realizing it is a real drill.',
      ],
      [
        'Hijack the rival sound tower',
        'The band’s opening scream takes over the enemy speakers and drowns out their orders.',
      ],
    ),
    ironjaw: thread(
      'THE COLD-BLOODED FRONT ROW',
      'Forewoman Rivet',
      'A freezing foundry yard has turned your Ironjaw dancers motionless; the rival crew is selling the heaters as VIP tickets.',
      [
        'Warm the whole front row',
        'Rivet routes the heaters beneath the benches and the crowd comes back to life.',
      ],
      [
        'Launch the pyro before the permit check',
        'The sudden heat wakes the dancers and blinds the rival inspectors.',
      ],
    ),
    undertow: thread(
      'PIRATE RADIO MATINEE',
      'The Drain Oracle',
      'Undertow can broadcast your underground show or reveal that the district marshals plan to trap the audience inside.',
      [
        'Broadcast a genuine exit warning',
        'Fans follow the Oracle’s directions through hidden service halls.',
      ],
      [
        'Broadcast a fake second stage',
        'The marshals raid an empty lot while your real crowd takes the grandstand.',
      ],
    ),
    exchange: thread(
      'THE SPONSOR FROM BELOW',
      'The Ledger Keeper',
      'The Exchange sponsors your midnight spectacular with Meat vouchers that bind every ticket holder to a debt.',
      [
        'Return the cursed tickets',
        'The crowd gets its Meat back and the Ledger Keeper loses a roomful of names.',
      ],
      [
        'Turn the debt ritual on its broker',
        'The sponsor reads the contract aloud and signs himself into the act.',
      ],
    ),
  },
  undertow: {
    catgirls: thread(
      'THE TAGS IN THE STATIC',
      'The Drain Oracle',
      'The catgirls’ implanted trackers whistle through Undertow’s receivers every time a hunter approaches.',
      [
        'Disable the trackers quietly',
        'The escaped crew disappears from the hunters’ monitors without leaving a flare.',
      ],
      [
        'Spoof the tracker convoy',
        'An entire pursuit squad chases phantom pings toward the rival barricade.',
      ],
    ),
    bloodfairies: thread(
      'THE FREQUENCY BELOW THE SONG',
      'Moxie of the Bloodfairies',
      'A Bloodfairy bassline resonates with the tunnels, making hidden doors audible to anyone who listens.',
      [
        'Use the bass to guide evacuees',
        'People follow the low notes to air and daylight instead of another locked gate.',
      ],
      [
        'Tune the bass to jam surveillance',
        'Every rival earpiece fills with feedback as Undertow crosses the cameras.',
      ],
    ),
    ironjaw: thread(
      'HEAT IN THE SEWERS',
      'Forewoman Rivet',
      'Ironjaw sleepers are hiding in Undertow’s coolant lines, where the next tide will freeze their tails.',
      [
        'Reopen the warm-water bypass',
        'The sleepers reach dry concrete with enough heat to fight another day.',
      ],
      [
        'Reverse the coolant against the guards',
        'The guards flee the freezing flood while the crew steals their access codes.',
      ],
    ),
    riot: thread(
      'THE STAGE UNDER THE STORM DRAIN',
      'Saint Kaboom',
      'Anarkiss wants to mount a secret show inside the storm drain that houses Undertow’s last clean relay.',
      [
        'Keep the relay intact through the show',
        'The audience dances around a protected relay that keeps the whole district talking.',
      ],
      [
        'Use the crowd to drown the microphones',
        'A full-throated chorus hides the sound of the crew cutting the rival feed.',
      ],
    ),
    exchange: thread(
      'THE LEDGER’S SECOND FACE',
      'The Ledger Keeper',
      'The Exchange offers a mirror ledger listing every informant you have protected, with prices already attached.',
      [
        'Destroy the price list',
        'The informants keep their names and the Exchange loses its leverage.',
      ],
      [
        'Swap the real book for a forgery',
        'The rival collectors chase imaginary debts while your contacts disappear.',
      ],
    ),
  },
  exchange: {
    catgirls: thread(
      'THE SIGNATURE THAT BREATHES',
      'The Ledger Keeper',
      'Catgirl clones share one lab signature, and the Exchange proposes charging each copy rent for existing.',
      [
        'Grant the clones their own names',
        'The ledger splits into separate identities that no creditor can repossess.',
      ],
      [
        'Sell the original signature to itself',
        'The buyers pay a fortune for a legal paradox and lose control of the copies.',
      ],
    ),
    bloodfairies: thread(
      'THE CURSED PRESSING',
      'Moxie of the Bloodfairies',
      'A Bloodfairy record spins backward and chants the Exchange’s debtors’ names; the audience has not heard the final verse.',
      [
        'Break the pressing before it plays',
        'The singers leave the stage with their names intact and the ritual goes hungry.',
      ],
      [
        'Press the curse into a rival anthem',
        'The rival collectors hear their own names in the groove and abandon the auction.',
      ],
    ),
    ironjaw: thread(
      'THE LAST FURNACE TITHE',
      'Forewoman Rivet',
      'Ironjaw workers are the furnace’s living fuel; the Exchange has sold their warmth to an investor beneath the city.',
      [
        'Release the workers from the furnace',
        'The lizards crawl out alive while the investor’s account freezes.',
      ],
      [
        'Transmute the heat into counterfeit Meat',
        'The furnace prints its own impossible currency and the creditor cannot tell which bills are real.',
      ],
    ),
    riot: thread(
      'THE MIDNIGHT COLLECTION',
      'Saint Kaboom',
      'Anarkiss has booked the Exchange’s occult auction hall without noticing the audience is listed as inventory.',
      [
        'Lead the audience outside alive',
        'The dancers escape through the service doors before the auctioneer counts their tickets.',
      ],
      [
        'Make the auctioneer part of the act',
        'A spotlight reveals the hidden bidder and the crowd turns the sale into a riot.',
      ],
    ),
    undertow: thread(
      'THE BLACKMAIL DIVIDEND',
      'The Drain Oracle',
      'Undertow has cracked the Exchange’s secret debts, including the one that keeps its eldest creditor alive.',
      [
        'Release the debtors’ secrets to them',
        'Each debtor gets the only copy of their record and the creditor loses his grip.',
      ],
      [
        'Write the creditor into the debt',
        'The ancient collector discovers his own soul is marked overdue.',
      ],
    ),
  },
}

const CHAPTER_STAKES: Record<
  TeamId,
  readonly [string, string, string, string, string]
> = {
  catgirls: [
    'The first escape corridor is closing tonight.',
    'The lab has begun buying witnesses from the neighborhoods.',
    'An entire nursery of experimental subjects is on the move.',
    'The hunters have tracked the route to the final safehouse.',
    'The lab owners demand a public surrender before dawn.',
  ],
  bloodfairies: [
    'The band needs a venue before its illegal debut.',
    'The second show is surrounded by inspectors with confiscation orders.',
    'The mid-tour blackout threatens to silence every free stage.',
    'The last road crew has gone missing at the city gates.',
    'The final encore will either open the streets or seal them shut.',
  ],
  ironjaw: [
    'The first stolen warm room is about to be reclaimed.',
    'The foundry managers cut the heat from the workers’ nursery.',
    'The shift committee must choose how to occupy the furnaces.',
    'A new lab convoy is hunting the escaped workers.',
    'The factory owners announce a permanent lockout at dawn.',
  ],
  riot: [
    'Tonight’s rehearsal has attracted undercover inspectors.',
    'The paying crowd is already pressed against the barricades.',
    'The third act begins with a blackout and a missing stagehand.',
    'The city plans to cancel the final permit inspection by force.',
    'The midnight finale is the only stage the crowd has left.',
  ],
  undertow: [
    'The first encrypted relay is already under surveillance.',
    'A second leak names everyone who helped the resistance.',
    'The tide has exposed a tunnel the city erased from its maps.',
    'The network’s oldest witness has vanished behind a locked gate.',
    'The last broadcast must reach every district before the auction.',
  ],
  exchange: [
    'Tonight’s first auction has a living name on the receipt.',
    'The debt collectors are demanding payment from families who have none.',
    'A sealed vault begins singing in the language of the drowned.',
    'The creditor council has hidden the true price of a citywide contract.',
    'The final sale will decide who owns the city’s next sunrise.',
  ],
}

const isTeam = (id: unknown): id is TeamId =>
  typeof id === 'string' && TEAMS.some((team) => team.id === id)

export function validAllianceStoryDecisions(
  raw: unknown,
  team: TeamId,
  wins: number,
): boolean {
  if (raw === undefined) return true
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const entries = Object.entries(raw)
  return (
    entries.length <= 5 &&
    entries.every(([key, entry]) => {
      if (!/^[0-4]$/.test(key) || Number(key) > wins) return false
      if (!entry || typeof entry !== 'object' || Array.isArray(entry))
        return false
      const value = entry as Record<string, unknown>
      return (
        Object.keys(value).every(
          (field) => field === 'ally' || field === 'pick',
        ) &&
        isTeam(value.ally) &&
        value.ally !== team &&
        (value.pick === 'protect' || value.pick === 'gamble')
      )
    })
  )
}

/** Resolve an individual authored scene, not the original premise repeated
 * five times. Older saves still refer only to ally and pick. */
function sceneBeat(team: TeamId, ally: TeamId, chapter: number) {
  const first = ALLIANCE_THREADS[team][ally]
  if (!first || chapter < 0 || chapter > 4) return null
  if (chapter === 0)
    return {
      title: first.title,
      crisis: first.conflict,
      protect: first.protect,
      gamble: first.gamble,
    }
  const late = ALLIANCE_LATER_ARCS[team][ally]?.beats[chapter - 1]
  if (!late) return null
  const shortTitle = late.crisis
    .replace(/^(A|An|The) /, '')
    .split(/[.,;:]/)[0]!
    .slice(0, 58)
    .trim()
    .toUpperCase()
  return {
    title: shortTitle,
    crisis: late.crisis,
    protect: late.protect,
    gamble: late.gamble,
  }
}

export function allianceStoryScene(
  save: CampaignSave,
  team: TeamId,
  ally: TeamId,
): AllianceStoryScene | null {
  const chapter = save[team].wins
  const config = ALLIANCE_THREADS[team][ally]
  const current = sceneBeat(team, ally, chapter)
  if (team === ally || !config || !current) return null
  const recorded = save[team].allianceJourney?.[chapter]
  if (recorded?.ally === ally) return null
  const previous = save[team].allianceJourney?.[chapter - 1]
  const priorBeat = previous?.ally
    ? sceneBeat(team, previous.ally, chapter - 1)
    : null
  const recalled =
    previous?.ally === ally && priorBeat
      ? 'Last chapter: ' +
        (previous.pick === 'protect'
          ? priorBeat.protect[1]
          : priorBeat.gamble[1])
      : previous
        ? 'Last chapter your partner was ' +
          (TEAMS.find((crew) => crew.id === previous.ally)?.name ??
            previous.ally) +
          '. This crew needs a different bargain.'
        : 'This partnership has never survived a night together.'
  return {
    id: team + ':' + ally + ':' + chapter,
    title: current.title,
    speaker: config.speaker,
    text:
      CHAPTER_STAKES[team][chapter]! + ' ' + current.crisis + ' ' + recalled,
    ally,
    chapter,
    choices: [
      {
        id: 'protect',
        label: current.protect[0],
        outcome: current.protect[1],
        terms: 'BOSS +3 · RIVAL +2',
      },
      {
        id: 'gamble',
        label: current.gamble[0],
        outcome: current.gamble[1],
        terms: 'RIVAL −4 · BOSS −2',
      },
    ],
  }
}

export function chooseAllianceStory(
  save: CampaignSave,
  team: TeamId,
  ally: TeamId,
  pick: AllianceStoryPick,
): CampaignSave {
  const chapter = save[team].wins
  if (
    chapter >= 5 ||
    !ALLIANCE_THREADS[team][ally] ||
    !['protect', 'gamble'].includes(pick)
  )
    return save
  const current = save[team].allianceJourney?.[chapter]
  if (current?.ally === ally && current.pick === pick) return save
  return {
    ...save,
    [team]: {
      ...save[team],
      allianceJourney: {
        ...save[team].allianceJourney,
        [chapter]: { ally, pick },
      },
    },
  }
}

/** A chapter decision is binding for that partner only; changing the ally
 * before a bout requires a fresh scene. One same-partner callback (not a
 * cumulative buff) rewards loyalty without creating runaway stat growth. */
export function allianceStoryBattleTerms(
  save: CampaignSave,
  team: TeamId,
  ally: TeamId,
  base: BoutTerms,
): BoutTerms {
  const chapter = save[team].wins
  const current = save[team].allianceJourney?.[chapter]
  if (!current || current.ally !== ally || team === ally) return base
  const last = save[team].allianceJourney?.[chapter - 1]
  const loyal = last?.ally === ally
  const protectedCrew = current.pick === 'protect'
  return {
    ...base,
    playerHp:
      (base.playerHp ?? 0) +
      (protectedCrew ? 1 : 0) +
      (loyal && last.pick === 'protect' ? 1 : 0),
    enemyMana: (base.enemyMana ?? 0) + (protectedCrew ? 1 : 0),
    playerMana: (base.playerMana ?? 0) - (protectedCrew ? 0 : 1),
    fewerRivals:
      (base.fewerRivals ?? 0) +
      (protectedCrew ? 0 : 1) +
      (loyal && last.pick === 'gamble' ? 1 : 0),
  }
}

export function allianceStoryConsequence(
  save: CampaignSave,
  team: TeamId,
  chapter: number,
): string | null {
  const record = save[team].allianceJourney?.[chapter]
  if (!record) return null
  const scene = sceneBeat(team, record.ally, chapter)
  if (!scene) return null
  return record.pick === 'protect' ? scene.protect[1] : scene.gamble[1]
}

/** A finale is earned from a finished Journey's final ally and preserved
 * chapter history. Changing the current deck later cannot rewrite it. */
export interface AllianceStoryFinale {
  title: string
  story: string
  ally: TeamId
  choice: AllianceStoryPick
  chaptersTogether: number
}

export function allianceStoryFinale(
  save: CampaignSave,
  team: TeamId,
): AllianceStoryFinale | null {
  if (save[team].wins !== 5) return null
  const finalePick = save[team].allianceJourney?.[4]
  if (!finalePick || finalePick.ally === team) return null
  const arc = ALLIANCE_LATER_ARCS[team][finalePick.ally]
  if (!arc) return null
  const history = Object.entries(save[team].allianceJourney ?? {})
    .filter(([chapter]) => Number(chapter) < 5)
    .map(([, decision]) => decision)
  const chaptersTogether = history.filter(
    (decision) => decision.ally === finalePick.ally,
  ).length
  const allyName =
    TEAMS.find((crew) => crew.id === finalePick.ally)?.name ?? finalePick.ally
  const loyalty =
    chaptersTogether === 5
      ? 'The two crews stayed together for all five chapters; neither can pretend this victory was won alone.'
      : chaptersTogether >= 3
        ? allyName +
          ' stood with you for ' +
          chaptersTogether +
          ' chapters. The partnership leaves a history deeper than the final fight.'
        : 'The final chapter brought ' +
          allyName +
          ' into a story already shaped by other allies. They know what their promise cost.'
  const decisionsProtected = history.filter(
    (decision) => decision.pick === 'protect',
  ).length
  const aftermath =
    decisionsProtected >= 3
      ? 'More than half the decisions protected people first, even when it strengthened the opposition.'
      : 'Most of the victories were gambles. The survivors keep the scars, and the right to tell that part of the story.'
  return {
    title: arc.finale.title,
    story: [
      finalePick.pick === 'protect' ? arc.finale.protect : arc.finale.gamble,
      loyalty,
      aftermath,
    ].join(' '),
    ally: finalePick.ally,
    choice: finalePick.pick,
    chaptersTogether,
  }
}
