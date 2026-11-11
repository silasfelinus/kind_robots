// THE CITY THAT LISTENS: the Undertow's spy story, told through a TRUTH /
// LEVERAGE meter. Truth puts what the Drain Oracle hears back into the open;
// leverage keeps it in the drains as a weapon. Choices shape narrative
// callbacks, the real Solo Clash boss terms and two Story-only deck additions;
// nothing here pays Meat or grants cards. Follows the Ironjaw THE LAST SHIFT
// and Anarkiss THE BEAUTIFUL CATASTROPHE pattern.
import type { CampaignProgress, CampaignSave } from './campaign'
import type { BoutTerms } from './city'
import { CARDS } from './prototypes'
import { soloProblems } from './alliance'

export type UndertowPick = 'left' | 'right'
export interface UndertowChoice {
  id: UndertowPick
  label: string
  outcome: string
}
export interface UndertowBeat {
  id: string
  title: string
  speaker: string
  text: string
  choices: readonly [UndertowChoice, UndertowChoice]
}

export const UNDERTOW_CHAPTERS: readonly (readonly UndertowBeat[])[] = [
  // vs the Gene Riot: THE CAT WHO KNEW TOO MUCH
  [
    {
      id: 'a-voice-in-the-pipes',
      title: 'A VOICE IN THE PIPES',
      speaker: 'The Drain Oracle',
      text: 'Every drain in Slime City runs to the Oracle’s pool, and so does every whisper. Tonight the pipes carry their own voice back to them, ordering frog troopers to raid a Gene Riot safehouse. The Oracle never gave that order. Somebody is wearing their voice.',
      choices: [
        {
          id: 'left',
          label: 'Warn the safehouse in your own, real voice',
          outcome:
            'The Oracle surfaces in a catgirl bathtub at three in the morning and explains, dripping, that the raid is fake. Calico Nine does not trust them, but she moves her people anyway.',
        },
        {
          id: 'right',
          label: 'Let the fake raid run and watch who profits',
          outcome:
            'Frog troopers hop in, find nothing, hop out. The Oracle listens to every pipe in the block and learns which landlord was paid in Meat to leave the back door unlocked.',
        },
      ],
    },
    {
      id: 'the-technician',
      title: 'THE TECHNICIAN',
      speaker: 'Calico Nine',
      text: 'The Gene Riot is hiding Dr. Bell’s old technician, the one who wired the surveillance feed into the lab. She can prove the leak started in a Meat Exchange laboratory, and every crew in the city would pay to have her quiet. Calico Nine wants a promise before the Undertow gets near her.',
      choices: [
        {
          id: 'left',
          label: 'Promise she testifies in public, by her own name',
          outcome:
            'Calico Nine spits on her palm. The Oracle, who has no palms worth mentioning, offers a wet fin instead. The deal holds: the technician will speak, and the Undertow will guard the microphone.',
        },
        {
          id: 'right',
          label: 'Smuggle her into the drains as a private asset',
          outcome:
            'An eel courier carries the technician through the storm grates in a rubber drysuit. She is safe, she is dry-ish, and she now belongs to the Undertow, which nobody explains to the catgirls.',
        },
      ],
    },
    {
      id: 'film-in-the-bathwater',
      title: 'FILM IN THE BATHWATER',
      speaker: 'Calico Nine',
      text: 'A spy drone has photographed every escaped catgirl in the safehouse, and the roll of film is now floating somewhere in the Undertow’s sewer. Calico Nine is standing at the grate with forty clawed friends. She wants it back, or she wants the sewer drained.',
      choices: [
        {
          id: 'left',
          label: 'Fish out the film and hand it over undeveloped',
          outcome:
            'A Sewer Watcher dives for it and surfaces with the roll in its teeth. Calico Nine burns it on the spot. The catgirls leave a bowl of milk at the grate. It is not a peace treaty, but it is close.',
        },
        {
          id: 'right',
          label: 'Develop a copy before returning the roll',
          outcome:
            'The Undertow keeps forty faces in a waterproof folder labeled INSURANCE. Calico Nine gets the original and a bad feeling. The folder stays in the Oracle’s pool, very still.',
        },
      ],
    },
  ],
  // vs Queen Pin and the Bloodfairies: WHISPERS WITH WINGS
  [
    {
      id: 'rooftop-transmitters',
      title: 'ROOFTOP TRANSMITTERS',
      speaker: 'Queen Safety Pin',
      text: 'Queen Pin and the Bloodfairies have stolen a crate of the Oracle’s private recordings and wired every rooftop antenna into a pirate speaker. The whole district hears its own secrets set to a drum machine, and nobody can tell the real tapes from the fake ones.',
      choices: [
        {
          id: 'left',
          label: 'Fly up and play them the original tapes',
          outcome:
            'Frog troopers climb the fire escapes with a waterlogged reel-to-reel. Queen Pin listens to the originals, swears, and admits half her crate is forged. The real ones go back to the people on them.',
        },
        {
          id: 'right',
          label: 'Jam the rooftops from the storm drains',
          outcome:
            'The Oracle hums one low note up every drainpipe at once. Every antenna buzzes, every fairy wing stalls, and the district goes silent. Queen Pin will remember who turned her music off.',
        },
      ],
    },
    {
      id: 'the-wing-stopping-note',
      title: 'THE WING-STOPPING NOTE',
      speaker: 'Mx. Thimble Vex',
      text: 'Somebody has found a sound that freezes a bloodfairy mid-flight, and it is coming out of Undertow vents. Thimble Vex has three fairies in splints and a jar full of fury. The Oracle knows the sound is real. They also know it is the best weapon the drains have ever owned.',
      choices: [
        {
          id: 'left',
          label: 'Publish the frequency so every fairy can tune it out',
          outcome:
            'The note goes on posters, in songs, on the back of Meat coupons. By Friday every punk in the district has earplugs tuned to it. The Undertow loses a weapon and gains a very loud thank-you.',
        },
        {
          id: 'right',
          label: 'Keep the frequency and deny it exists',
          outcome:
            'The vents go quiet and the Oracle says nothing at all. Vex does not believe the silence, and neither does anyone else. The note sits in a locked tank, waiting for a reason.',
        },
      ],
    },
    {
      id: 'public-hearing',
      title: 'THE PUBLIC HEARING',
      speaker: 'Queen Safety Pin',
      text: 'Queen Pin offers a deal: a public hearing under the rooftop speakers where anyone can play a recording and anyone can call it a lie. It is chaos, it is very loud, and the forger who stole the Oracle’s voice is almost certainly going to be in the crowd.',
      choices: [
        {
          id: 'left',
          label: 'Hold the hearing and let the crowd judge',
          outcome:
            'Two hundred fairies, frogs and catgirls shout over each other until dawn. Three recordings are proven fake. The real Oracle gets booed once and cheered twice, which they call a good night.',
        },
        {
          id: 'right',
          label: 'Plant a Sewer Watcher by the stage to tag the forger',
          outcome:
            'The hearing is a riot, but the Watcher marks a figure in a butcher’s apron slipping out before the last tape. Nobody else knows the Undertow has a lead, and the Oracle intends to keep it that way.',
        },
      ],
    },
  ],
  // vs the Meat Exchange: THE LEDGER OF EARS
  [
    {
      id: 'auction-of-whispers',
      title: 'AUCTION OF WHISPERS',
      speaker: 'Auditor Prime Gilt',
      text: 'Beneath Crown Market, in a chapel lined with hooks, the Meat Exchange auctions private conversations by the pound. Bids are payable in Meat. The butcher-priests weigh each secret on a brass scale, and the Thing That Hungers below the floor eats whatever goes unsold.',
      choices: [
        {
          id: 'left',
          label: 'Tell everyone whose secrets are on the block',
          outcome:
            'Eel couriers slide a note under every door on the auction list. By midnight the chapel is packed with angry people who came to bid on themselves. Gilt has never seen a worse turnout for a sale.',
        },
        {
          id: 'right',
          label: 'Outbid them with secrets the Exchange cannot afford to hear',
          outcome:
            'The Oracle bids one whisper about Gilt’s own ledger. The chapel goes silent. The Exchange withdraws every lot, and the Undertow walks out owning the auctioneer.',
        },
      ],
    },
    {
      id: 'the-butcher-forger',
      title: 'THE BUTCHER FORGER',
      speaker: 'The Drain Oracle',
      text: 'The figure in the apron is a butcher-priest with a throat full of stolen recordings, and he can speak in any voice he has eaten. He is the forger. He also knows where the Exchange keeps its ledger of ears, and he would very much like not to be fed to the floor.',
      choices: [
        {
          id: 'left',
          label: 'Give him sanctuary if he confesses in public',
          outcome:
            'He confesses at the hearing in his own thin voice, which nobody has heard in years. Half the crowd still wants him in the river. The Oracle stands in front of him anyway.',
        },
        {
          id: 'right',
          label: 'Turn him into a double agent inside the chapel',
          outcome:
            'He goes back to his hooks and his brass scale and starts whispering Exchange business down the drain every night. He is terrified. He is also the best informant the Undertow has ever had.',
        },
      ],
    },
    {
      id: 'the-ledger-of-ears',
      title: 'THE LEDGER OF EARS',
      speaker: 'Auditor Prime Gilt',
      text: 'The ledger is a book bound in something that still twitches, and it lists every conversation the Exchange has ever sold and to whom. Gilt offers a trade: the Undertow can have the book, if the buyers’ names stay private. The thing under the floor shifts, impatient.',
      choices: [
        {
          id: 'left',
          label: 'Refuse the deal and read the buyers’ names aloud',
          outcome:
            'The Oracle reads the list from the chapel pulpit, one name at a time, while the floor growls. Crown Market learns exactly who has been buying its neighbors. The ledger stops twitching.',
        },
        {
          id: 'right',
          label: 'Take the book and keep the names for later',
          outcome:
            'The ledger goes down the drain in a lead box. Every buyer in the city now owes the Undertow a favor and does not yet know it. Gilt smiles like someone who has just been out-invested.',
        },
      ],
    },
  ],
  // vs the Ironjaw Chrome Lizards: STATIC IN THE STEEL
  [
    {
      id: 'helmets-that-hum',
      title: 'HELMETS THAT HUM',
      speaker: 'Forewoman Rivet',
      text: 'The Ironjaw lizards broke out of a bio-lab’s reptile wing years ago, but the lab left something in their safety helmets: a receiver that hums orders straight into a cold-blooded skull. Rivet’s crew has started working double shifts in their sleep. Somebody is still sending.',
      choices: [
        {
          id: 'left',
          label: 'Show the crew the receivers in their own helmets',
          outcome:
            'A frog trooper pries one open at the shift change and holds it up to the lights. Two hundred lizards take their helmets off at once. Rivet says nobody is putting one back on until she says so.',
        },
        {
          id: 'right',
          label: 'Tap the receivers and listen to who is sending',
          outcome:
            'The Undertow splices a wire into the foundry signal. The orders come from an office above Crown Market, and the Oracle now hears every command before the lizards do.',
        },
      ],
    },
    {
      id: 'the-six-year-clock',
      title: 'THE SIX-YEAR CLOCK',
      speaker: 'Old Basker',
      text: 'Old Basker has kept the foundry clock since the breakout, and he knows it is wrong. Somebody rewrote the time so the lizards have worked six extra years for Meat coupons that are only good at the company store. He suspects Undertow fingers on the gears.',
      choices: [
        {
          id: 'left',
          label: 'Admit an Undertow agent did it, and say who paid',
          outcome:
            'The Oracle names the agent, the fee and the Exchange office that paid it. It costs the Undertow a spy and most of its reputation in the foundry. Basker resets the clock with his tail.',
        },
        {
          id: 'right',
          label: 'Quietly fix the clock and let the foreman take the blame',
          outcome:
            'The clock jumps forward six years overnight and the foreman cannot explain it. The lizards riot at the right man for the wrong reason. The Undertow’s agent keeps his job.',
        },
      ],
    },
    {
      id: 'reverse-the-signal',
      title: 'REVERSE THE SIGNAL',
      speaker: 'Forewoman Rivet',
      text: 'Rivet wants the transmitter shut down for good. The Oracle could hand every lizard a manual shutoff switch, or flip the signal around so the foreman’s own office starts receiving orders from the foundry floor. The blast furnace roars behind her while she waits.',
      choices: [
        {
          id: 'left',
          label: 'Give every worker a switch they control',
          outcome:
            'Frog troopers spend all night soldering switches onto two hundred helmets. In the morning the lizards decide for themselves what to listen to. Mostly, it turns out, the Bloodfairies.',
        },
        {
          id: 'right',
          label: 'Reverse the signal onto the foreman’s office',
          outcome:
            'The foreman wakes up humming "more breaks, more pay" and signs it before lunch. The lizards cheer. The receivers stay in their helmets, and the Undertow still holds the dial.',
        },
      ],
    },
  ],
  // vs Anarkiss, the Riot Saints: THE LAST BROADCAST
  [
    {
      id: 'pirate-radio-big-top',
      title: 'PIRATE RADIO BIG TOP',
      speaker: 'Saint Kaboom',
      text: 'Saint Kaboom is throwing a citywide pirate radio concert from the demolition circus big top: fire-eaters, wall-of-death riders and a human cannonball on the hour. Every radio in Slime City will tune in, and the false Oracle plans to take the signal at the finale.',
      choices: [
        {
          id: 'left',
          label: 'Tell Kaboom about the forger before the show',
          outcome:
            'Kaboom listens to the whole thing upside down on a trapeze, then hires the Undertow as stage security. Frog troopers in sequined vests patrol the ring. They are not good at it, but they are trying.',
        },
        {
          id: 'right',
          label: 'Hide eel couriers in the sound cables and say nothing',
          outcome:
            'The Undertow threads itself through every cable under the big top. Kaboom notices the cables are wet and blames the elephants. The Oracle now owns half the circus switchboard.',
        },
      ],
    },
    {
      id: 'the-cannonball-relay',
      title: 'THE CANNONBALL RELAY',
      speaker: 'Firebrand Dolly',
      text: 'The forger’s rig is on the top floor of a condemned tower across the river, and the only way there in time is to fire somebody out of the cannon. Firebrand Dolly volunteers, as she always does. She can carry the raw proof, or a perfect forgery of the forger’s own voice.',
      choices: [
        {
          id: 'left',
          label: 'Fire Dolly across with the raw recordings',
          outcome:
            'Dolly lands in a shower of glitter and window glass with a waterproof tin of original tapes. The proof is ugly, unedited and true. She plugs it straight into the forger’s rig.',
        },
        {
          id: 'right',
          label: 'Fire Dolly across with a forged confession',
          outcome:
            'Dolly lands with a tape in which the forger, in his own stolen voice, confesses to everything and a few things he did not do. It is perfect. Only the Oracle knows how perfect.',
        },
      ],
    },
    {
      id: 'every-microphone',
      title: 'EVERY MICROPHONE',
      speaker: 'The Drain Oracle',
      text: 'At the finale the false voice cuts in, and for one breath the Oracle holds every speaker, radio and drainpipe in Slime City at once. They could give each household a switch to silence the feed forever, or keep the whole signal and promise, very sincerely, to use it gently.',
      choices: [
        {
          id: 'left',
          label: 'Hand every household its own off switch',
          outcome:
            'The broadcast ends with a click in every kitchen in the city. For the first time in living memory, Slime City cannot be overheard. The Oracle sinks back into their pool and listens to the quiet.',
        },
        {
          id: 'right',
          label: 'Keep the signal and promise to use it gently',
          outcome:
            'The false voice stops mid-word and the real Oracle says goodnight to the whole city at once. Every speaker is theirs now. They promise to be kind. They are the only one who can check.',
        },
      ],
    },
  ],
] as const

/** TRUTH is what the Oracle hears put back in the open; LEVERAGE is what
 * stays in the drains as a weapon. Neither is Meat or wallet money. */
export interface UndertowSignalLedger {
  truth: number
  leverage: number
  signal: 'whisper' | 'static' | 'broadcast'
}
export function undertowLedger(
  progress: CampaignProgress,
): UndertowSignalLedger {
  const picks = (progress.journey ?? []).flat()
  const truth = picks.filter((id) => id === 'left').length
  const leverage = picks.filter((id) => id === 'right').length
  return {
    truth,
    leverage,
    signal:
      picks.length >= 9
        ? 'broadcast'
        : picks.length >= 3
          ? 'static'
          : 'whisper',
  }
}
export function undertowBeat(progress: CampaignProgress): UndertowBeat | null {
  const beat = progress.journey?.[progress.wins]?.length ?? 0
  return UNDERTOW_CHAPTERS[progress.wins]?.[beat] ?? null
}
export function undertowSceneText(
  progress: CampaignProgress,
  beat: UndertowBeat,
): string {
  const journal = progress.journey ?? []
  const lastChapter = progress.wins - 1
  const previous = journal[lastChapter]?.[2]
  const callback =
    lastChapter >= 0 && previous === 'left'
      ? [
          'A bowl of milk still sits by the Gene Riot grate, refilled every morning by somebody with claws.',
          'Fairies on the rooftops play the hearing tapes on repeat, and the real Oracle gets a cheer every time.',
          'Crown Market neighbors still read the buyers’ list aloud on street corners. Nobody bids on whispers anymore.',
          'Two hundred lizards flick their helmet switches in unison whenever a frog trooper walks past. It is a salute.',
        ][lastChapter]
      : lastChapter >= 0 && previous === 'right'
        ? [
            'The folder labeled INSURANCE sits in the Oracle’s pool, forty faces deep. The catgirls stopped leaving milk.',
            'A Sewer Watcher still shadows a butcher’s apron through the market. Queen Pin has not forgiven the jammed rooftops.',
            'A lead box in the drains holds every buyer’s name. Half the city owes the Undertow and the other half suspects it.',
            'The foundry signal still hums under every helmet, and the Undertow still holds the dial.',
          ][lastChapter]
        : null
  return (callback ? callback + ' ' : '') + beat.text
}
export function undertowLastOutcome(progress: CampaignProgress): string | null {
  const beats = progress.journey?.[progress.wins] ?? []
  if (!beats.length) return null
  return (
    UNDERTOW_CHAPTERS[progress.wins]?.[beats.length - 1]?.choices.find(
      (choice) => choice.id === beats[beats.length - 1],
    )?.outcome ?? null
  )
}
export function chooseUndertowBeat(
  save: CampaignSave,
  id: UndertowPick,
): CampaignSave {
  const progress = save.undertow
  const beat = undertowBeat(progress)
  if (!beat?.choices.some((choice) => choice.id === id)) return save
  const chapter = progress.wins
  const journey = Array.from({ length: chapter + 1 }, (_, i) =>
    i === chapter
      ? [...(progress.journey?.[i] ?? []), id]
      : [...(progress.journey?.[i] ?? [])],
  )
  return { ...save, undertow: { ...progress, journey } }
}
/** Applied once a chapter's three beats are decided. Truth turns the rival's
 * own people (rival boss life drops, and an organised witness network talks
 * one rival guard out of the fight); leverage feeds the crew mana from stolen
 * secrets, but a hoard that big leaks, and the rival arms a trap. */
export function undertowBattleTerms(
  progress: CampaignProgress,
  terms: BoutTerms,
): BoutTerms {
  if ((progress.journey?.[progress.wins]?.length ?? 0) !== 3) return terms
  const { truth, leverage } = undertowLedger(progress)
  return {
    ...terms,
    enemyBossLife:
      (terms.enemyBossLife ?? 0) - Math.min(3, Math.floor(truth / 3)),
    playerMana: (terms.playerMana ?? 0) + Math.min(3, Math.floor(leverage / 3)),
    ...(truth >= 6 ? { fewerRivals: (terms.fewerRivals ?? 0) + 1 } : {}),
    ...(leverage >= 9 ? { rivalTrap: true } : {}),
  }
}
export function undertowEpilogue(progress: CampaignProgress): string {
  if (progress.wins !== 5) return ''
  const { truth, leverage } = undertowLedger(progress)
  const final = progress.journey?.[4]?.[2]
  if (truth >= 10 && final === 'left')
    return 'Every kitchen in Slime City has an off switch now, and most nights most of them are off. The Drain Oracle still hears the drains, but only what people choose to pour into them. The frog troopers have taken up choir.'
  if (leverage >= 10 && final === 'right')
    return 'The Drain Oracle hears everything, and Slime City has learned to speak kindly near the plumbing. No crew moves without the Undertow knowing first. The promise has held so far. Nobody else is in a position to check.'
  return 'Some of the city has switches and some of it does not, and the Oracle keeps a short list of what they still hear. The forger is gone, the ledger is closed, and the drains carry rumors again, not orders. Mostly.'
}
export function validUndertowJourney(progress: CampaignProgress): boolean {
  if (progress.journey === undefined) return true
  if (!Array.isArray(progress.journey) || progress.journey.length > 5)
    return false
  for (let i = 0; i < progress.journey.length; i++) {
    const picks = progress.journey[i]
    if (
      !Array.isArray(picks) ||
      picks.length > 3 ||
      picks.some((pick) => pick !== 'left' && pick !== 'right') ||
      (i > progress.wins && picks.length > 0) ||
      (i < progress.wins && picks.length !== 0 && picks.length !== 3)
    )
      return false
  }
  return true
}
/** The signal's choices field real Undertow cards in the next STORY Clash:
 * truth brings the Floodlight Sweep, leverage brings the Wiretap
 * Restraining Order. Nothing is added to the player's collection. */
export function undertowStoryDeck(
  progress: CampaignProgress,
  deck: string[],
): string[] {
  const { truth, leverage } = undertowLedger(progress)
  const additions = [
    ...(truth >= 3 ? ['s1-floodlight-sweep'] : []),
    ...(leverage >= 3 ? ['s1-wiretap-order'] : []),
  ]
  const next = [...deck]
  for (const id of additions) {
    if (
      next.includes(id) ||
      !CARDS.some((card) => card.id === id && card.team === 'undertow')
    )
      continue
    const protectedIds = new Set([...additions, ...(progress.rewards ?? [])])
    const slot = next.findLastIndex((cardId) => !protectedIds.has(cardId))
    if (slot >= 0) next[slot] = id
  }
  return soloProblems('undertow', next).length ? deck : next
}
