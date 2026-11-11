import {
  CAMPAIGN_ECHOES,
  FACTION_CAMPAIGNS,
  type CampaignApproach,
  type CampaignSave,
} from './campaign'
import type { TeamId } from './prototypes'

interface RivalReaction {
  victory: string
  defeat: string
}

/** One authored reaction to each possible outcome of thirty rival conflicts. */
export const CAMPAIGN_RIVAL_REACTIONS: Record<
  TeamId,
  readonly RivalReaction[]
> = {
  catgirls: [
    {
      victory: 'The cameras are dark. We have forgotten how silence sounds.',
      defeat: 'You smashed one lens, but the backups still know every door.',
    },
    {
      victory:
        'The workers chose you over their foreman. The furnace will remember.',
      defeat: 'The mold is still in my furnace. We can print another prisoner.',
    },
    {
      victory:
        'That parade became a jailbreak. A magnificent use for a marching band.',
      defeat:
        'Your parade tangled itself in its own fuse. Read the label next time.',
    },
    {
      victory:
        'The witnesses kept their names. Our old blood contracts will not survive this.',
      defeat:
        'The witnesses scattered. Their silence will be expensive to recover.',
    },
    {
      victory:
        'No one can auction another unborn name tonight. There goes our inventory.',
      defeat:
        'The ledger is mine. Your people should have read the fine print.',
    },
  ],
  bloodfairies: [
    {
      victory:
        'The hall still stands, and somehow your band is louder than the demolition.',
      defeat:
        'You saved your speakers, not your hall. The wreckers return at dawn.',
    },
    {
      victory:
        'The patients have their names back. I wish we found them before the scalpels.',
      defeat: 'Our hospital stays locked. Shout until your wings give out.',
    },
    {
      victory:
        'The silence machine is broken. The rooftops sound angry and alive.',
      defeat:
        'The vents hum again. You cannot organize a movement that cannot fly.',
    },
    {
      victory:
        'The bridge belongs to workers now. You made a tollgate into a street party.',
      defeat:
        "The toll still stands. Flying above it won't stop the bill collectors.",
    },
    {
      victory:
        'The moonlight deed burned. Who knew an audit could be so flammable?',
      defeat:
        "The stars don't accept petitions. Your nighttime rent is overdue.",
    },
  ],
  ironjaw: [
    {
      victory:
        'The store takes real wages now. Management calls it a financial catastrophe.',
      defeat:
        'The company still owns your oxygen. Mind how loudly you complain.',
    },
    {
      victory:
        'Six stolen years just landed on the payroll. The clocks are finally honest.',
      defeat:
        'You won an argument with a clock. Your missing wages are still missing.',
    },
    {
      victory:
        "The emergency furnace controls survived. I'm disappointed there were no casualties.",
      defeat:
        "The foreman's office stands. The emergency shutoff is still ours.",
    },
    {
      victory:
        'The serum works and the stolen tissue is free. Our lawyers are panicking.',
      defeat: 'That serum answers to our lab. Did you ask who owns the cells?',
    },
    {
      victory:
        'The night shift has a chorus. The factory cannot pretend it forgot.',
      defeat:
        'The rafters are empty. Your missing workers remain on a broken clock.',
    },
  ],
  riot: [
    {
      victory:
        'Your stage is back. I even saw someone install a sensible fire exit.',
      defeat: 'The stage stays impounded. March without a soundtrack.',
    },
    {
      victory:
        'Your fireworks are debt-free. Somehow the smoke looks more expensive.',
      defeat: 'The invoice grows. Every spark earns us more interest.',
    },
    {
      victory:
        'Two bands on one stage. Your crowd might actually survive sharing applause.',
      defeat: 'The tower stays ours. Listen from the parking lot.',
    },
    {
      victory:
        'The police ambush is public knowledge. No more barricades dressed as confetti.',
      defeat:
        'You followed the map. You supplied the panic. Try reading next time.',
    },
    {
      victory:
        "The clinic is safe. You're the first demolition crew with an evacuation plan.",
      defeat:
        'The clinic almost burned. Leave fireworks to people with insurance.',
    },
  ],
  undertow: [
    {
      victory:
        'The technician is safe and the leak has a name. You asked the right question.',
      defeat:
        "You still don't know where she hides. Information is terrible to lose.",
    },
    {
      victory:
        'Those recordings are private again. Privacy makes an awful revolutionary anthem.',
      defeat:
        'The rooftops keep broadcasting. Secrets sound loud from other mouths.',
    },
    {
      victory:
        'Every stolen conversation has a buyer attached. The auction house cannot hide.',
      defeat:
        'The recordings remain for sale. Anonymity is our premium product.',
    },
    {
      victory:
        'The helmets are free of our signal. The soldiers look relieved.',
      defeat:
        'Our orders still reach the steel. Disconnecting one voice changes little.',
    },
    {
      victory:
        'The pirate signal is yours again. The city finally heard a real Oracle.',
      defeat:
        'The false Oracle remains on air. The city likes a confident liar.',
    },
  ],
  exchange: [
    {
      victory:
        "The books are ash. The city's unpaid bills burned remarkably fast.",
      defeat: 'The ledgers survived. You improved demand for secure storage.',
    },
    {
      victory:
        'The strike changed our books. Perhaps the workers should write them.',
      defeat:
        'The factory remains ours. Your workers may reapply for their jobs.',
    },
    {
      victory:
        'Those forged contracts are evidence now. Even I cannot sell that as victory.',
      defeat:
        'The files remain private. An uncomfortable truth is still an asset.',
    },
    {
      victory:
        "The court ruled that a person isn't inventory. My oldest column vanished.",
      defeat: "The portfolio stands. The law can change; my interest won't.",
    },
    {
      victory:
        'Those rooftop debts are gone. An auditor celebrating zero balance is a first.',
      defeat:
        'The gold seal is mine. You should have stolen contracts, not stationery.',
    },
  ],
}

export const CAMPAIGN_APPROACH_REFLECTIONS: Record<
  TeamId,
  Record<CampaignApproach, string>
> = {
  catgirls: {
    conviction: "We protected people, not patents. That's still our priority.",
    cunning: 'A stolen key matters only if we know who owns the door.',
  },
  bloodfairies: {
    conviction: 'The quietest wings get the first verse of the encore.',
    cunning: 'Stealing a stage means making room for everyone to sing.',
  },
  ironjaw: {
    conviction:
      'Nobody gets written off our shift. Put every name on the board.',
    cunning: 'A blueprint is a weapon until the workers own its design.',
  },
  riot: {
    conviction: 'We came to create a spectacle, not a casualty list.',
    cunning:
      'Every trick has a fuse. Our friends deserve to see where it leads.',
  },
  undertow: {
    conviction: 'Truth is safer when witnesses control their own story.',
    cunning: 'Secrets are tools, not trophies. Remember where we aimed them.',
  },
  exchange: {
    conviction: 'A debt erased is a life returned. That belongs in the books.',
    cunning: 'Ownership means nothing unless we account for its cost.',
  },
}

export interface CampaignAftermath {
  chapterIndex: number
  chapterTitle: string
  foe: TeamId
  rivalSpeaker: string
  playerSpeaker: string
  rivalLine: string
  playerLine: string | null
  approach: CampaignApproach | null
  result: 'player' | 'enemy'
}

/** Last completed fight only. Old saves with no failed-choice field remain valid. */
export function campaignAftermathFor(
  save: CampaignSave,
  team: TeamId,
): CampaignAftermath | null {
  const progress = save[team]
  const result = progress.lastResult
  if (result !== 'player' && result !== 'enemy') return null
  const index = result === 'player' ? progress.wins - 1 : progress.wins
  const chapter = FACTION_CAMPAIGNS[team].chapters[index]
  const reaction = CAMPAIGN_RIVAL_REACTIONS[team][index]
  if (!chapter || !reaction || !progress.lastScene) return null
  const attempted = progress.lastApproach
  const wonChoice = result === 'player' ? progress.decisions[index] : null
  const choice =
    attempted === 'conviction' || attempted === 'cunning'
      ? attempted
      : wonChoice === 'conviction' || wonChoice === 'cunning'
        ? wonChoice
        : null
  return {
    chapterIndex: index,
    chapterTitle: chapter.title,
    foe: chapter.foe,
    rivalSpeaker: CAMPAIGN_ECHOES[chapter.foe].conviction.speaker,
    playerSpeaker: CAMPAIGN_ECHOES[team].conviction.speaker,
    rivalLine: result === 'player' ? reaction.victory : reaction.defeat,
    playerLine: choice ? CAMPAIGN_APPROACH_REFLECTIONS[team][choice] : null,
    approach: choice,
    result,
  }
}
