import {
  CAMPAIGN_ECHOES,
  campaignChapter,
  type CampaignApproach,
  type CampaignSave,
} from './campaign'
import type { TeamId } from './prototypes'

interface RivalExchange {
  rival: string
  reply: string
}

/** Five authored confrontations per crew; chapter order matches the campaign bible. */
export const CAMPAIGN_RIVAL_EXCHANGES: Record<
  TeamId,
  readonly RivalExchange[]
> = {
  catgirls: [
    {
      rival:
        'Every camera is a witness. Why are your people afraid to be seen?',
      reply:
        "Because we weren't asked. Hand over the film before someone else learns our names.",
    },
    {
      rival:
        "The mold only prints what's in the blueprint. Don't blame the furnace for its owner.",
      reply:
        'When the blueprint is a living person, the furnace has a choice too.',
    },
    {
      rival: "Relax, it's a parade! The fuse is mostly ceremonial.",
      reply:
        'Then let the people who will be standing under it vote on the fireworks.',
    },
    {
      rival: "Give us our contracts and we'll testify to anything.",
      reply:
        'I want your testimony, not your silence. You get to decide what stays in the record.',
    },
    {
      rival:
        "The ledger lists products. The law doesn't recognize your objection.",
      reply:
        'Those are children, not products. You can make the law hear them tonight.',
    },
  ],
  bloodfairies: [
    {
      rival: 'Your bass broke every window on my parade float. Respect.',
      reply: 'Then stop aiming a demolition rig at a building full of people.',
    },
    {
      rival: 'The hospital is ours until we find out who hurt these patients.',
      reply:
        "Keep guarding the door. We're here to make sure the patients get their names back.",
    },
    {
      rival:
        'The frequency was designed to keep the city quiet. Consider it a public service.',
      reply:
        "Silence is easy when the people you're silencing fall out of the sky.",
    },
    {
      rival:
        "Airspace isn't free. We installed a bridge and someone has to pay for it.",
      reply: "Our wings don't come with turnstiles. Neither should the roofs.",
    },
    {
      rival:
        "I've purchased the moonlight. Your unpaid invoices are magnificent.",
      reply:
        "Send the bill to the stars. We're playing for every roof in the city.",
    },
  ],
  ironjaw: [
    {
      rival: "Oxygen costs money. The company doesn't run on gratitude.",
      reply:
        'Funny, the forge ran on our lungs for years without paying us interest.',
    },
    {
      rival:
        'The clock is accurate according to the people who own timekeeping.',
      reply:
        "Show me the six stolen years. I'll show you the names of the workers who lived them.",
    },
    {
      rival: 'One big bang and the foreman gets the message!',
      reply:
        "The emergency controls are in that office. We'll deliver the message without burying the shift.",
    },
    {
      rival:
        'That serum was brewed from our tissue. You need to stop using it.',
      reply:
        "You're right. Help us wean the crew off it without hurting anyone who already took it.",
    },
    {
      rival: "We won't stop singing until every missing worker gets a name.",
      reply:
        "Then sing louder. The factory hasn't heard the night shift in years.",
    },
  ],
  riot: [
    {
      rival:
        'That stage failed our safety inspection. A shocking result, I know.',
      reply:
        'A parade without a stage is a traffic jam. Show me how we can make it safe.',
    },
    {
      rival: 'Buy now, explode now, pay forever. Everybody wins.',
      reply:
        "Your invoice has more fuses than our fireworks. We're changing the terms.",
    },
    {
      rival: "Give us a stage or we'll take the sound tower apart.",
      reply: 'The city can handle two bands. Can it handle two egos?',
    },
    {
      rival: 'The parade route is definitely legitimate. Trust the map.',
      reply: 'The map has police barricades drawn as confetti. Nice try.',
    },
    {
      rival: 'One spark reaches that clinic and nobody walks out.',
      reply:
        "Then we move the show. A finale isn't worth a single missing patient.",
    },
  ],
  undertow: [
    {
      rival:
        "We can protect the technician. You don't need to know where she's hiding.",
      reply:
        "If I don't know where she is, I can't know whether she's safe. That's the problem.",
    },
    {
      rival: 'We broadcast the recordings because secrets are a form of rent.',
      reply:
        "There's a difference between exposing power and exposing somebody's private grief.",
    },
    {
      rival: 'People will pay a lot to hear what the city whispers.',
      reply: 'And now the city knows who has been selling its words.',
    },
    {
      rival:
        'The helmets issue orders, not questions. Their wearers signed the contract.',
      reply: "A signature isn't consent when the helmet won't come off.",
    },
    {
      rival: 'The Oracle on that frequency sounds exactly like you.',
      reply:
        "Then let's give the city a way to tell the difference before the last song.",
    },
  ],
  exchange: [
    {
      rival:
        "You can't burn a bank without burning its books. That's basic arithmetic.",
      reply:
        "The debts were real, and so were the people behind them. We're counting both.",
    },
    {
      rival: 'A strike costs everyone money. Why should your shareholders pay?',
      reply:
        "Because the workers built the shares. They've been waiting to collect.",
    },
    {
      rival:
        "I can prove every forgery. I just need to know what you'll do with the names.",
      reply:
        'Keep the evidence safe and let the people named in it decide what gets published.',
    },
    {
      rival:
        'Your oldest asset is a person with a birthday. Explain that to the auditors.',
      reply:
        "Then the asset was misclassified. Let's see what the board does when I correct it.",
    },
    {
      rival: 'Every rooftop debt is gone. We even stole your corporate seal.',
      reply:
        "Then you just made an auditor's worst nightmare. An honest balance sheet.",
    },
  ],
}

/** Future opponents react to the choice already recorded in account-backed story progress. */
export const CAMPAIGN_RIVAL_MEMORY: Record<
  TeamId,
  Record<CampaignApproach, string>
> = {
  catgirls: {
    conviction:
      'I heard you gave the cameras back to the people they watched. That frightened the people paying for them.',
    cunning:
      'You stole plans from your last opponent. I wonder how many copies you kept.',
  },
  bloodfairies: {
    conviction:
      'Your last victory gave the rooftops a voice. The wrong people are listening now.',
    cunning:
      'You won with a dirty trick last time. The whole city has been trying to learn it.',
  },
  ironjaw: {
    conviction:
      'Your workers shared the spoils. The company owners have started locking every door.',
    cunning:
      'You raided a blueprint vault. Every foreman in the city sleeps with the lights on.',
  },
  riot: {
    conviction:
      'You cleared the civilians before the last explosion. The city still talks about that.',
    cunning:
      "Your last trick made headlines. Nobody believes the 'accidental' part anymore.",
  },
  undertow: {
    conviction:
      "You let a witness speak for themself. That's a new habit for your network.",
    cunning:
      "You turned a secret into a weapon. I don't intend to be the next target.",
  },
  exchange: {
    conviction:
      'You cancelled a debt instead of collecting it. Are you trying to ruin your reputation?',
    cunning:
      "You bought your last advantage. The next negotiation won't be as cheap.",
  },
}

export const CAMPAIGN_RETRY_VOICES: Record<TeamId, string> = {
  catgirls:
    "Nine checks the wounded and lifts her chin. 'They took the ground, not the evidence. We try again.'",
  bloodfairies:
    "Thimble dusts soot from a wing. 'That was a rehearsal. The next show has a better ending.'",
  ironjaw:
    "Rivet counts her crew twice. 'Nobody gets written off. We repair, regroup and return.'",
  riot: "Saint Kaboom salvages a bent party horn. 'New plan: fewer hospital visits, bigger applause.'",
  undertow:
    "The Oracle folds the intercepted map. 'We learned what they know. They don't know what we learned.'",
  exchange:
    "Gilt checks the loss column. 'An expensive lesson. It's only a bad investment if we ignore it.'",
}

export interface CampaignConversation {
  chapterIndex: number
  rivalTeam: TeamId
  rivalSpeaker: string
  playerSpeaker: string
  rivalLine: string
  playerLine: string
  rememberedChoice: string | null
  retryLine: string | null
}

/**
 * The conversation reads durable chapter victories and losses. It cannot
 * grant progress, reroll a bout, or reveal a future chapter out of sequence.
 */
export function campaignConversationFor(
  save: CampaignSave,
  team: TeamId,
): CampaignConversation | null {
  const chapter = campaignChapter(save, team)
  if (!chapter) return null
  const progress = save[team]
  const chapterIndex = progress.wins
  const exchange = CAMPAIGN_RIVAL_EXCHANGES[team][chapterIndex]
  if (!exchange) return null
  const lastChoice =
    chapterIndex > 0 ? progress.decisions[chapterIndex - 1] : null
  const rememberedChoice =
    lastChoice === 'conviction' || lastChoice === 'cunning'
      ? CAMPAIGN_RIVAL_MEMORY[team][lastChoice]
      : null
  return {
    chapterIndex,
    rivalTeam: chapter.foe,
    rivalSpeaker: CAMPAIGN_ECHOES[chapter.foe].conviction.speaker,
    playerSpeaker: CAMPAIGN_ECHOES[team].conviction.speaker,
    rivalLine: exchange.rival,
    playerLine: exchange.reply,
    rememberedChoice,
    retryLine:
      progress.lastResult === 'enemy' ? CAMPAIGN_RETRY_VOICES[team] : null,
  }
}
