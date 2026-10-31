import type { BoutTerms } from './city'
import { TEAMS, type TeamId } from './prototypes'

export type CampaignApproach = 'conviction' | 'cunning'
export type CampaignResult = 'player' | 'enemy' | 'draw'

export interface CampaignChapter {
  foe: TeamId
  title: string
  scene: string
  victory: string
  defeat: string
  choices: [
    { id: 'conviction'; label: string; terms: BoutTerms },
    { id: 'cunning'; label: string; terms: BoutTerms },
  ]
}

export interface FactionCampaign {
  team: TeamId
  title: string
  prologue: string
  principle: string
  triumph: string
  compromise: string
  chapters: [
    CampaignChapter,
    CampaignChapter,
    CampaignChapter,
    CampaignChapter,
    CampaignChapter,
  ]
}

function chapter(
  foe: TeamId,
  title: string,
  scene: string,
  victory: string,
  defeat: string,
  labels: [string, string],
  terms: [BoutTerms, BoutTerms],
): CampaignChapter {
  return {
    foe,
    title,
    scene,
    victory,
    defeat,
    choices: [
      { id: 'conviction', label: labels[0], terms: terms[0] },
      { id: 'cunning', label: labels[1], terms: terms[1] },
    ],
  }
}

export const FACTION_CAMPAIGNS: Record<TeamId, FactionCampaign> = {
  catgirls: {
    team: 'catgirls',
    title: 'THE NINTH LIFE PROTOCOL',
    prologue:
      'The Gene Riot stole their own birth certificates. Now five powerful crews hold different pieces of the genetic ownership ledger. Calico Nine asks you to help them steal the rest.',
    principle: 'Break the ownership machine without becoming its new owner.',
    triumph:
      'The clones publish every original name. Chimera Heights becomes a refuge that cannot be patented. Even the city learns to pronounce freedom correctly.',
    compromise:
      'The lab is gone, but the Gene Riot keeps its keys. Their people are safe; the next generation will decide whether to open those doors.',
    chapters: [
      chapter(
        'undertow',
        'EYES IN THE DRAINS',
        'A spy drone photographs escaped catgirls entering a safehouse. The Undertow claims the film is for their protection.',
        'The spy network surrenders its footage and a map of hidden laboratories.',
        'The surveillance feed outlives the raid. Every safehouse becomes a target.',
        [
          'Return the film to its subjects',
          'Swap the footage for false copies',
        ],
        [
          { playerHp: 1, enemyMana: 1 },
          { playerMana: 2, rivalTrap: true },
        ],
      ),
      chapter(
        'ironjaw',
        'A BODY IN THE FURNACE',
        'The Ironjaw forge has a mold that can print new catgirl bodies. The original engineer refuses to turn it off.',
        'The forge workers smuggle the mold into a cooperative clinic.',
        'The mold is sold to a private buyer, with a body still inside.',
        [
          'Help the workers destroy the patent',
          'Steal the mold through the coolant duct',
        ],
        [
          { playerHp: 2, enemyArmor: 1 },
          { playerMana: 1, enemyArmor: -1 },
        ],
      ),
      chapter(
        'riot',
        'CLONE PARADE',
        'The Riot Saints march with a giant paper catgirl. Their harmless protest is secretly wired to explode outside the gene bank.',
        'The parade becomes a jailbreak instead of a funeral.',
        'The blast gives the gene bank an excuse to tighten its security.',
        [
          'Lead the march away from civilians',
          'Redirect the blast through the armored gate',
        ],
        [
          { playerHp: 1, enemyMana: 1 },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'bloodfairies',
        'A THOUSAND TINY WITNESSES',
        'Punk Bloodfairies offer to testify against the lab, provided their own blood-contracts disappear from the evidence.',
        'The tiny witnesses join the rescue without losing their own histories.',
        'The fairies scatter. The trial has no witnesses.',
        [
          'Keep every testimony intact',
          'Trade copies of the contracts for a swarm escort',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyMana: 2 },
        ],
      ),
      chapter(
        'exchange',
        'THE PRICE OF A NAME',
        'The Meat Exchange owns the last page of the ledger: the names of children not yet born. The auction opens at midnight.',
        'The ledger is destroyed. Nobody in the city can purchase a person ever again.',
        'The Exchange files a lien on the next thousand lives.',
        [
          'Expose every buyer at the auction',
          'Seize the auctioneer’s master key',
        ],
        [
          { playerHp: 2, enemyArmor: 1 },
          { playerMana: 2, enemyMana: 2 },
        ],
      ),
    ],
  },
  bloodfairies: {
    team: 'bloodfairies',
    title: 'MOSHPIT REPUBLIC',
    prologue:
      'The rooftops belong to whoever can fly. The city disagrees. Mx. Thimble Vex has five nights to unite the punk bloodfairies before landlords turn every roof into a gated luxury terrace.',
    principle: 'Build an uprising loud enough to hear its quietest voice.',
    triumph:
      'Needle Alley declares itself a republic of open rooftops. There is no president, only an aggressively democratic drum circle.',
    compromise:
      'The rooftops are free, but the new republic rents access to fund its defense. Thimble keeps an eye on the invoice book.',
    chapters: [
      chapter(
        'riot',
        'THE WRONG KIND OF LOUD',
        'The Riot Saints challenge a bloodfairy band to a demolition contest, threatening to flatten an inhabited music hall.',
        'The crowd makes a stage out of the wrecking ball and keeps the hall standing.',
        'The hall disappears beneath an accidental encore.',
        [
          'Turn the protest into a rescue concert',
          'Hijack the explosives for a louder finale',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyMana: 2 },
        ],
      ),
      chapter(
        'catgirls',
        'FUR AND FANG',
        'Gene Riot scouts guard the hospital where wounded fairies are being secretly dissected.',
        'The clinic doors open to every species and size.',
        'The surgeons escape with their collection jars.',
        [
          'Help the clone nurses strike',
          'Steal the tissue database during the riot',
        ],
        [
          { playerHp: 1, enemyArmor: 1 },
          { playerMana: 2, rivalTrap: true },
        ],
      ),
      chapter(
        'undertow',
        'THE ANTI-RIOT FREQUENCY',
        'The Undertow has discovered a sound that stops every fairy wing in the district. It plays from the sewer vents.',
        'The silence is broken by a thousand overlapping voices.',
        'The district goes quiet; no wing rises.',
        [
          'Broadcast a choir of missing voices',
          'Sabotage the central transmitter',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 1, enemyArmor: -1 },
        ],
      ),
      chapter(
        'ironjaw',
        'THE SKY BRIDGE PICKET',
        'Ironjaw engineers have built a bridge across the alley roofs. Their bosses plan to charge a toll for crossing the sky.',
        'The bridge becomes a shared public walkway.',
        'The bridge opens under private security.',
        ['Walk the picket with the ogre workers', 'Cut the toll gates loose'],
        [
          { playerHp: 1, enemyArmor: 1 },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'exchange',
        'NO GODS, NO LANDLORDS',
        'The Meat Exchange files a deed for the moonlight itself and orders the fairies to pay rent every night.',
        'The land registry catches fire. The rooftops remain free.',
        'The landlords keep the sky on a payment plan.',
        ['Make the tenants collective owners', 'Forge a deed to the whole sky'],
        [
          { playerHp: 2, enemyMana: 2 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
    ],
  },
  ironjaw: {
    team: 'ironjaw',
    title: 'THE LAST SHIFT',
    prologue:
      'Ironjaw Chrome Ogres were built to work until they break. Forewoman Rivet finds a hidden power switch labeled PROPERTY OF THE EXCHANGE. Her crew votes to strike.',
    principle: 'No machine, no person, and no ogre gets discarded.',
    triumph:
      'The Foundry becomes a worker-run forge. Its first product is a clock that announces when everybody gets to go home.',
    compromise:
      'Rivet buys the Foundry’s debt and puts it in the workers’ hands. Nobody knows whether liberation should require receipts.',
    chapters: [
      chapter(
        'exchange',
        'THE COMPANY STORE',
        'The Meat Exchange pays the forge wages in coupons that can only be spent on company oxygen.',
        'The workers tear up the coupons and begin paying each other fairly.',
        'The paymaster walks away with the oxygen tanks.',
        ['Defend the striking assembly', 'Intercept the armored payroll wagon'],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
      chapter(
        'undertow',
        'GHOST IN THE SHIFT CLOCK',
        'Undertow spies rewrote the clock so the ogres have worked six extra years without pay.',
        'The missing years become evidence in every worker’s hands.',
        'The evidence disappears into a drainage archive.',
        [
          'Let every worker read their own record',
          'Wipe the clock and trigger a city audit',
        ],
        [
          { playerHp: 1, enemyMana: 1 },
          { playerMana: 2, rivalTrap: true },
        ],
      ),
      chapter(
        'riot',
        'SAFETY THIRD',
        'The Riot Saints offer to blow up the foreman’s office. Unfortunately the office also holds the emergency furnace controls.',
        'The forge survives the blast and the bosses lose their locks.',
        'The furnace roars without anyone able to stop it.',
        [
          'Secure the emergency controls first',
          'Blow through the locked blast doors',
        ],
        [
          { playerHp: 2, enemyArmor: 1 },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'catgirls',
        'LIVING BLUEPRINT',
        'Gene Riot technicians discover Ironjaw cybernetics are built from stolen clone tissue.',
        'Catgirls and ogres recover the blueprints as common property.',
        'The lab leaves with living spare parts.',
        [
          'Give the clone engineers a vote',
          'Steal the factory prototype scanner',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 1, enemyArmor: -1 },
        ],
      ),
      chapter(
        'bloodfairies',
        'THE FACTORY SINGS',
        'A bloodfairy choir occupies the forge rafters and refuses to let the line restart until every worker is counted.',
        'The forge switches on to the sound of its own workers singing.',
        'The choir is chased out and the owners reclaim the controls.',
        [
          'Include the smallest workers in the union',
          'Retake the main generator by force',
        ],
        [
          { playerHp: 2, enemyMana: 2 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
    ],
  },
  riot: {
    team: 'riot',
    title: 'THE BEAUTIFUL CATASTROPHE',
    prologue:
      'Saint Kaboom finds a municipal ordinance outlawing joy after ten in the evening. She decides to throw the first legally impossible festival in Slime City.',
    principle: 'Make noise without making other people collateral.',
    triumph:
      'Slime City gets a festival nobody can charge admission to. The emergency services have never been so appreciated.',
    compromise:
      'The festival becomes famous, franchised, and remarkably well insured. Saint Kaboom hates the merchandise but loves the fireworks.',
    chapters: [
      chapter(
        'ironjaw',
        'A SPARK IN THE SCRAP',
        'Ironjaw security confiscates the parade’s mobile stage for being too much of a fire hazard.',
        'The workers weld a new stage that belongs to every neighborhood.',
        'The stage is melted into a giant corporate logo.',
        [
          'Convince the welders to join the parade',
          'Steal back the stage with a bang',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
      chapter(
        'exchange',
        'FIREWORKS ON CREDIT',
        'The Meat Exchange offers unlimited fireworks, with interest calculated per explosion.',
        'The first free fireworks cooperative opens on Crown Market.',
        'Every boom is followed by a bill.',
        [
          'Invite debtors to cancel the contract',
          'Rig the bank vault to shower confetti',
        ],
        [
          { playerHp: 1, enemyArmor: 1 },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'bloodfairies',
        'MOSHPIT DIPLOMACY',
        'Punk Bloodfairies demand their own stage and threaten to tear down the sound system.',
        'Two musical scenes share one impossible headliner.',
        'The show becomes a faction brawl.',
        [
          'Give each band an equal set',
          'Challenge Thimble to a battle of amplifiers',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 1, enemyArmor: -1 },
        ],
      ),
      chapter(
        'undertow',
        'THE PARADE IS A LIE',
        'Undertow Intelligence replaces the parade map with a route through a police ambush.',
        'The spies join the march after their deception is exposed.',
        'The parade is led into a cordon of silent sirens.',
        ['Warn every marching crew', 'Flood the spy network with fake routes'],
        [
          { playerHp: 2, rivalTrap: true },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'catgirls',
        'GRAND FINALE, NO CASUALTIES',
        'Gene Riot doctors warn that the planned fireworks will ignite a clinic full of escaped clones.',
        'The festival becomes the loudest rescue operation in the city’s history.',
        'The festival gets remembered for who it left behind.',
        [
          'Move the show and protect the clinic',
          'Redirect the blast over the corporate tower',
        ],
        [
          { playerHp: 2, enemyMana: 2 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
    ],
  },
  undertow: {
    team: 'undertow',
    title: 'THE CITY THAT LISTENS',
    prologue:
      'The Drain Oracle has heard every secret in Slime City. Then somebody begins broadcasting lies in their voice. Five crews are buying fragments of the stolen signal.',
    principle: 'Tell the truth without handing a new tyrant every microphone.',
    triumph:
      'Every household gets its own switch to silence the surveillance feed. The Oracle hears a city that no longer needs to whisper.',
    compromise:
      'The Oracle wins control of the signal and promises to use it gently. They are the only one who knows whether that promise can be trusted.',
    chapters: [
      chapter(
        'catgirls',
        'THE CAT WHO KNEW TOO MUCH',
        'The Gene Riot hides a technician who can prove the surveillance leak came from an Exchange laboratory.',
        'The witness tells the truth in public and survives.',
        'The witness is vanished into a data capsule.',
        [
          'Protect the witness through the tunnels',
          'Clone the evidence without revealing her',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, rivalTrap: true },
        ],
      ),
      chapter(
        'bloodfairies',
        'WHISPERS WITH WINGS',
        'Bloodfairies have turned every rooftop into a transmitter that plays the Oracle’s private recordings.',
        'The stolen recordings become a public hearing rather than a weapon.',
        'The city starts believing every recording is real.',
        [
          'Invite the fairies to hear the originals',
          'Scramble their signal from the drains',
        ],
        [
          { playerHp: 1, enemyArmor: 1 },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'exchange',
        'THE LEDGER OF EARS',
        'Meat Exchange brokers auction private conversations to the highest bidder.',
        'The bidder list becomes evidence of the sale of privacy.',
        'The Exchange sells the same secrets twice.',
        [
          'Tell everyone whose secrets were sold',
          'Steal the ledger before the auction',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
      chapter(
        'ironjaw',
        'STATIC IN THE STEEL',
        'Ironjaw helmets receive commands from a signal none of their wearers can shut off.',
        'The workers pull the receivers free and choose their own orders.',
        'The signal keeps marching through the foundry.',
        [
          'Give workers manual shutoff switches',
          'Reverse the signal onto the foreman',
        ],
        [
          { playerHp: 2, enemyArmor: 1 },
          { playerMana: 2, enemyMana: 1 },
        ],
      ),
      chapter(
        'riot',
        'THE LAST BROADCAST',
        'Saint Kaboom announces a citywide pirate radio concert. The false Oracle plans to overwrite the signal at the finale.',
        'The false voice ends in front of a listening city.',
        'Slime City wakes up hearing only lies.',
        [
          'Broadcast the raw proof to everyone',
          'Hijack the transmission with a perfect forgery',
        ],
        [
          { playerHp: 2, enemyMana: 2 },
          { playerMana: 2, rivalTrap: true },
        ],
      ),
    ],
  },
  exchange: {
    team: 'exchange',
    title: 'HOSTILE TAKEOVER OF HEAVEN',
    prologue:
      'Auditor Prime Gilt inherits the Meat Exchange and discovers its oldest asset is Slime City itself. To keep it, she must defeat five insolvent crews and decide what ownership actually means.',
    principle: 'Decide whether a city is worth more than its inhabitants.',
    triumph:
      'Gilt liquidates the Exchange and distributes its shares to the people it claimed to own. For once, the books balance.',
    compromise:
      'Gilt wins every hostile takeover and becomes the city’s richest ruler. The quarterly report is spectacular. The streets are less enthusiastic.',
    chapters: [
      chapter(
        'riot',
        'THE COST OF A BOOM',
        'Riot Saints have demolished a bank that held all the city’s unpaid medical bills.',
        'Gilt forgives the debts and buys a seat at the parade.',
        'The bank is rebuilt with even higher interest.',
        [
          'Write the debts off in public',
          'Insure the next explosion and collect',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
      chapter(
        'ironjaw',
        'THE LABOR LIABILITY',
        'The Ironjaw strike will bankrupt a factory the Exchange claims to own.',
        'The ogres become shareholders in their own workplace.',
        'Gilt acquires a factory full of unwilling workers.',
        [
          'Offer the workers controlling shares',
          'Buy the foreman’s master switch',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
      chapter(
        'undertow',
        'TRADE SECRETS',
        'The Drain Oracle offers the Exchange a file containing every contract it ever forged.',
        'Gilt publishes the forgeries and removes the liens.',
        'The Exchange keeps its most poisonous asset hidden.',
        [
          'Bring the forged contracts to court',
          'Buy the archive and keep it sealed',
        ],
        [
          { playerHp: 2, enemyMana: 1 },
          { playerMana: 2, rivalTrap: true },
        ],
      ),
      chapter(
        'catgirls',
        'THE VALUE OF A LIFE',
        'The Gene Riot challenges the legal right to own a person, threatening the Exchange’s oldest portfolio.',
        'The clones leave the registry with their own names.',
        'Gilt discovers that a monopoly on life requires guards.',
        [
          'Void the genetic ownership clauses',
          'Take the laboratory as collateral',
        ],
        [
          { playerHp: 2, enemyMana: 2 },
          { playerMana: 2, enemyArmor: 1 },
        ],
      ),
      chapter(
        'bloodfairies',
        'THE FINAL AUDIT',
        'The bloodfairies steal the Exchange’s gold seal and declare every rooftop debt cancelled. Gilt must choose what sort of corporation survives.',
        'The Exchange writes its last bill and becomes something better.',
        'The fairies paint the stock exchange with the words NEVER AGAIN.',
        ['Let the debtors vote on the future', 'Repossess the city’s rooftops'],
        [
          { playerHp: 2, enemyMana: 2 },
          { playerMana: 3, enemyArmor: 1 },
        ],
      ),
    ],
  },
}

export interface CampaignProgress {
  wins: number
  losses: number
  decisions: CampaignApproach[]
  lastResult: CampaignResult | null
  lastScene: string | null
}

export type CampaignSave = Record<TeamId, CampaignProgress>

export function createCampaignSave(): CampaignSave {
  return Object.fromEntries(
    TEAMS.map((team) => [
      team.id,
      { wins: 0, losses: 0, decisions: [], lastResult: null, lastScene: null },
    ]),
  ) as CampaignSave
}

export function campaignChapter(
  save: CampaignSave,
  team: TeamId,
): CampaignChapter | null {
  return FACTION_CAMPAIGNS[team].chapters[save[team].wins] ?? null
}

/** Results from other modes, teams, or stale chapters cannot skip the story. */
export function resolveCampaignBattle(
  save: CampaignSave,
  team: TeamId,
  chapterIndex: number,
  opponent: TeamId,
  choice: CampaignApproach,
  result: CampaignResult,
): CampaignSave {
  const chapter = campaignChapter(save, team)
  if (!chapter || save[team].wins !== chapterIndex || chapter.foe !== opponent)
    return save
  if (!chapter.choices.some((option) => option.id === choice)) return save
  const old = save[team]
  const won = result === 'player'
  return {
    ...save,
    [team]: {
      ...old,
      wins: old.wins + (won ? 1 : 0),
      losses: old.losses + (result === 'enemy' ? 1 : 0),
      decisions: won ? [...old.decisions, choice] : [...old.decisions],
      lastResult: result,
      lastScene:
        result === 'player'
          ? chapter.victory
          : result === 'enemy'
            ? chapter.defeat
            : 'Neither side won the fight. The dispute remains unresolved.',
    },
  }
}

export function campaignEnding(
  save: CampaignSave,
  team: TeamId,
): string | null {
  if (save[team].wins !== 5) return null
  const ideal =
    save[team].decisions.filter((id) => id === 'conviction').length >= 3
  return ideal
    ? FACTION_CAMPAIGNS[team].triumph
    : FACTION_CAMPAIGNS[team].comp
}

export function describeTerms(terms: BoutTerms): string {
  const labels: string[] = []
  if (terms.playerMana) labels.push('Your mana ' + signed(terms.playerMana))
  if (terms.enemyMana) labels.push('Rival mana ' + signed(terms.enemyMana))
  if (terms.playerHp) labels.push('Your HP ' + signed(terms.playerHp))
  if (terms.enemyArmor) labels.push('Rival armor ' + signed(terms.enemyArmor))
  if (terms.rivalTrap) labels.push('Rival starts with a hidden trap')
  return labels.join(' · ') || 'Standard rules'
}

function signed(value: number): string {
  return (value > 0 ? '+' : '') + value
}
