// MOSHPIT REPUBLIC: a labor uprising expressed through a Call & Response
// coalition meter. Choices influence narrative callbacks and Clash boss
// conditions; the 3rd-stage card spotlight never grants free evolutions.
import type { CampaignProgress, CampaignSave } from './campaign'
import type { BoutTerms } from './city'
import { CARDS } from './prototypes'
import { soloProblems } from './alliance'

export type BloodfairyPick = 'left' | 'right'
export interface BloodfairyChoice {
  id: BloodfairyPick
  label: string
  outcome: string
}
export interface BloodfairyBeat {
  id: string
  title: string
  speaker: string
  text: string
  choices: readonly [BloodfairyChoice, BloodfairyChoice]
}
export const BLOODFAIRY_CHAPTERS: readonly (readonly BloodfairyBeat[])[] = [
  [
    {
      id: 'last-night-at-needle',
      title: 'LAST NIGHT AT THE NEEDLE',
      speaker: 'Mx. Thimble Vex',
      text: "The landlord's notice is stapled through the music hall's only fire map. It says the Anarkissed may demolish the building after the next show. Brine the janitor is packing up the floorboards: they were made from her grandmother's stage. Thimble knows the audience would riot if they found out.",
      choices: [
        {
          id: 'left',
          label: 'Tell the dancers before the show',
          outcome:
            'Brine interrupts rehearsal with the notice. The dancers vote to stay and make an escape plan; ticket money is lost but nobody walks into the show blind.',
        },
        {
          id: 'right',
          label: 'Hide the notice and sell out the room',
          outcome:
            'The queue wraps around the block. Brine counts the receipts but refuses to stand on stage, knowing the crowd is buying an evening on borrowed time.',
        },
      ],
    },
    {
      id: 'the-roof-has-a-vote',
      title: 'EVERY ROOF HAS A VOTE',
      speaker: 'Purl',
      text: "Anarkiss promoter Purl offers a replacement venue: a gleaming arena on top of the demolished hall. She wants naming rights and exclusive access to its sound system. Outside, the hall's wheelchair ramp is being dismantled by men in Anarkiss sequin jackets.",
      choices: [
        {
          id: 'left',
          label: 'Make the roof accessible before signing anything',
          outcome:
            'Thimble demands a ramp and publicly controlled sound equipment. Purl withdraws her offer, but the people who never reached the old balcony begin organizing the new stage.',
        },
        {
          id: 'right',
          label: "Use Purl's speakers against the demolition crew",
          outcome:
            'A feedback loop sends the demolition machines into retreat. Purl can identify every cable Thimble touched; her invoice will arrive with the police.',
        },
      ],
    },
    {
      id: 'the-first-chorus',
      title: 'THE FIRST CHORUS',
      speaker: 'Brine',
      text: "The wrecking ball is hung from the hall's ceiling rig, waiting for midnight. Brine has one bolt left holding her grandmother's sign above the door. The band can save the sign or use the rig to knock the Anarkissed's fuses into the flooded orchestra pit.",
      choices: [
        {
          id: 'left',
          label: 'Save the sign and bring everyone outside',
          outcome:
            'The crew holds a last concert under the stars. Brine carries the old sign into the alley as the audience turns the demolition site into a picket.',
        },
        {
          id: 'right',
          label: 'Redirect the wrecking ball toward the fuses',
          outcome:
            "The fuses die in the water, and the demolition stops. The sign comes down with the rig; Brine doesn't applaud when the crowd chants Thimble's name.",
        },
      ],
    },
  ],
  [
    {
      id: 'a-bed-for-every-body',
      title: 'A BED FOR EVERY BODY',
      speaker: 'Dr. Flick',
      text: 'The clone nurses have chained themselves to the doors of a clinic where small bodies are catalogued as disposable. Dr. Flick wants bloodfairy medicine for the patients, but Thimble has only enough for one ward. A girl named Pipkin holds a note reading: NO MORE SAMPLE JARS.',
      choices: [
        {
          id: 'left',
          label: 'Share the medicine and let the nurses allocate it',
          outcome:
            'Flick opens the ward roster to the patients. The supply is thin, yet no one must bargain for their own treatment.',
        },
        {
          id: 'right',
          label: 'Take the specimen index first',
          outcome:
            "A courier smuggles the index out under a fake medical seal. The patients remain locked inside while the crew hunts their captors' addresses.",
        },
      ],
    },
    {
      id: 'the-tiny-door',
      title: 'THE TINY DOOR',
      speaker: 'Pipkin',
      text: "The clinic's smallest patients can escape through a ventilation hatch, but the hatch ends above a busy street. Pipkin has tied bedsheets into a rope. Her surgeon says only the healthy may leave because injured patients are expensive to transport.",
      choices: [
        {
          id: 'left',
          label: 'Carry the injured down first',
          outcome:
            "The nurses build a pulley with donated belts. Every trip draws attention, but the hospital's priority list is written by patients for the first time.",
        },
        {
          id: 'right',
          label: 'Send fast scouts through the vent',
          outcome:
            "Thimble's quickest fliers reach the street with evidence before anyone notices. Pipkin watches the injured patients wait behind the grate.",
        },
      ],
    },
    {
      id: 'the-last-jar',
      title: 'THE LAST JAR',
      speaker: 'Dr. Flick',
      text: 'In the storage room, a single jar holds the tissue that could regrow the wings of half the ward. It is labeled PROPERTY OF THE CLINIC. The lab guard offers to surrender if the Bloodfairies promise he can keep the research patent.',
      choices: [
        {
          id: 'left',
          label: "Give the jar to the patients' committee",
          outcome:
            'Pipkin insists no one can claim tissue without asking the people it came from. The guard drops his badge and leaves the laboratory keys on the floor.',
        },
        {
          id: 'right',
          label: 'Take the patent and use it as leverage',
          outcome:
            'The guard signs over the invention before fleeing. The patients may get their wings, but the paper still claims one person can own the cure.',
        },
      ],
    },
  ],
  [
    {
      id: 'a-frequency-for-falling',
      title: 'THE FREQUENCY FOR FALLING',
      speaker: 'Scab',
      text: 'An Undertow transmitter has silenced the east rooftops. Fairy wings stop moving halfway through each stroke. Scab, a sound engineer who cannot hear with his left ear, has built a receiver that turns the hostile signal into a visible waveform. He cannot run it alone.',
      choices: [
        {
          id: 'left',
          label: 'Let the rooftops set the broadcast frequency',
          outcome:
            'Dozens of people send Scab a recording of their own breathing. Their imperfect rhythm breaks the first layer of the Undertow signal.',
        },
        {
          id: 'right',
          label: 'Hijack the emergency broadcast network',
          outcome:
            "The city hears Thimble's battle cry before the Undertow can block it. Emergency services lose their channel for a dangerous minute.",
        },
      ],
    },
    {
      id: 'the-song-we-forgot',
      title: 'THE SONG WE FORGOT',
      speaker: 'Tallow',
      text: "The sound weapon works because it was trained on the Bloodfairies' first protest anthem. Tallow, who wrote it, admits she sold the original recording to pay the hall's rent. She expects Thimble to exile her from the band. Scab places the old record on a turntable and asks who gets to write the next verse.",
      choices: [
        {
          id: 'left',
          label: 'Let Tallow explain and invite new verses',
          outcome:
            'The crowd answers with words the old anthem never held. Tallow stays, but the history of her mistake remains part of the song.',
        },
        {
          id: 'right',
          label: 'Erase the old recording and name a new singer',
          outcome:
            'The weapon loses its clean sample. Tallow leaves the stage quietly, carrying the last surviving sheet music.',
        },
      ],
    },
    {
      id: 'the-thousand-voice-reveal',
      title: 'THE THOUSAND-VOICE REVEAL',
      speaker: 'Mx. Thimble Vex',
      text: "Scab's soundboard lights up with hundreds of small names. The choir can become a WALL OF SOUND, a singer who never strikes but gives strength to every ally, or BACKUP SINGERS who flood nearby lanes with their own tiny rebellion. Neither can happen until the Riot Choir earns its third evolution in battle. But tonight the union must choose what sort of chorus it wants to become.",
      choices: [
        {
          id: 'left',
          label: 'Make room for everyone in the choir',
          outcome:
            'Thimble yields the microphone. The singers arrange themselves by who has been heard least, not by who can shout loudest.',
        },
        {
          id: 'right',
          label: 'Build an unstoppable touring machine',
          outcome:
            'Scab wires the amplifier through the entire neighborhood. The sound reaches every roof; the city will remember exactly whose hand held the switch.',
        },
      ],
    },
  ],
  [
    {
      id: 'bridge-built-from-debts',
      title: 'A BRIDGE BUILT FROM DEBTS',
      speaker: 'Axle',
      text: 'The Ironjaw crew built a sky bridge so workers could cross between the roofs without going down to the toll streets. Their managers have fitted it with a gate demanding payment from every fairy wing. Axle, the night foreman, brings the original drawings with grease on every page.',
      choices: [
        {
          id: 'left',
          label: 'Hold a bridge-workers assembly',
          outcome:
            'Axle invites the welders, roof cleaners and tenants to vote on opening the gate. It takes hours; the first barricade is built by the people who use the bridge.',
        },
        {
          id: 'right',
          label: 'Cut the toll counter out of its mount',
          outcome:
            'The gate is open before the managers wake. Axle sees the exposed live wire beneath it and makes the fliers take a longer route.',
        },
      ],
    },
    {
      id: 'the-picket-above-the-city',
      title: 'THE PICKET ABOVE THE CITY',
      speaker: 'Brine',
      text: 'The strike line hangs fifty feet above a street full of impatient commuters. The city paper photographs the fairies as tiny terrorists blocking traffic. Brine recognizes the photographer: he used to work the ticket booth at the music hall. He says a scandal would help sales.',
      choices: [
        {
          id: 'left',
          label: 'Give the commuters a safe crossing',
          outcome:
            'The strikers hang temporary ropes under the bridge. People cross slowly, and half the commuters return with hot tea for the welders.',
        },
        {
          id: 'right',
          label: 'Turn the photograph into a threat',
          outcome:
            "Thimble makes the reporter promise to print the factory owner's accounts. The headline lands, but the original photo of the picketers is buried.",
        },
      ],
    },
    {
      id: 'the-welder-with-the-key',
      title: 'THE WELDER WITH THE KEY',
      speaker: 'Axle',
      text: 'Axle holds the master key to the bridge. The welders have elected her to keep it, but the managers are offering her enough money to leave the foundry forever. Thimble can ask her to stay or let her go. The gate hinges wait for the last weld.',
      choices: [
        {
          id: 'left',
          label: 'Hand the key to a rotating crew of workers',
          outcome:
            'Axle gets to choose her own future. Six workers learn the gate, and the bridge no longer depends on a single exhausted hero.',
        },
        {
          id: 'right',
          label: 'Keep Axle as the heroic keeper',
          outcome:
            "The crowd chants Axle's name. She does not take the money, but she sleeps beside the gate because nobody else knows how to open it.",
        },
      ],
    },
  ],
  [
    {
      id: 'who-owns-the-moonlight',
      title: 'WHO OWNS THE MOONLIGHT?',
      speaker: 'Brass Voss',
      text: "A surveyor from the Meat Exchange has measured every rooftop shadow and filed a deed for moonlight. The first bill is already pinned to the music hall's surviving sign. Brass Voss offers Thimble a concession: only the rich will pay for the light, and the union may keep a percentage.",
      choices: [
        {
          id: 'left',
          label: 'Publish the deed and invite every tenant to contest it',
          outcome:
            'Voss has to explain to the whole district how light became a rentable product. The union refuses a profitable exemption from its own principles.',
        },
        {
          id: 'right',
          label: 'Accept the concession to fund the defense',
          outcome:
            'The treasury fills. Brine circles the word ONLY on the invoice, wondering how long anyone remains rich enough to be the exception.',
        },
      ],
    },
    {
      id: 'the-new-committee',
      title: 'THE NEW COMMITTEE',
      speaker: 'Purl',
      text: 'The uprising has won enough roofs for an election. Purl proposes a permanent executive committee with an emergency power to suspend strikes. She smiles as she offers Thimble the chair. Tallow places a battered songbook on the table and asks if a committee can fire the audience.',
      choices: [
        {
          id: 'left',
          label: 'Give the assembly the power to remove every officer',
          outcome:
            'Thimble writes a recall rule on the back of the set list. The union may be slow tomorrow, but nobody can lock its members out.',
        },
        {
          id: 'right',
          label: 'Take temporary command until the crisis ends',
          outcome:
            'The guards stop arguing and obey. The word temporary is written in ink too small for the audience to read.',
        },
      ],
    },
    {
      id: 'the-last-encore',
      title: 'THE LAST ENCORE',
      speaker: 'Mx. Thimble Vex',
      text: 'At midnight the Exchange shuts off the streetlights, claiming the dark is now private property too. The crowd fills every roof from Needle Alley to the foundry. Thimble stands beside the microphone and hears two different songs: one wants a place where anyone can sing; the other wants to make the city listen forever.',
      choices: [
        {
          id: 'left',
          label: 'Pass the microphone into the crowd',
          outcome:
            'The first note comes from someone Thimble has never met. The last note is sung from a rooftop that has never belonged to anyone.',
        },
        {
          id: 'right',
          label: 'Turn the amplifier up until the Exchange surrenders',
          outcome:
            'The deed burns under a wall of sound and Voss flees. Thimble keeps the master switch, just in case the city needs another lesson.',
        },
      ],
    },
  ],
] as const

/** Each voice is a member who can hold Thimble accountable; each volume
 * point buys immediate power at the cost of backlash. Neither is wallet money.
 */
export interface ChorusLedger {
  voices: number
  volume: number
  stage: 'spark' | 'chorus' | 'anthem'
}
export function bloodfairyLedger(progress: CampaignProgress): ChorusLedger {
  const picks = (progress.journey ?? []).flat()
  const voices = picks.filter((id) => id === 'left').length
  const volume = picks.filter((id) => id === 'right').length
  return {
    voices,
    volume,
    stage:
      picks.length >= 9 ? 'anthem' : picks.length >= 3 ? 'chorus' : 'spark',
  }
}
export function bloodfairyBeat(
  progress: CampaignProgress,
): BloodfairyBeat | null {
  const beat = progress.journey?.[progress.wins]?.length ?? 0
  return BLOODFAIRY_CHAPTERS[progress.wins]?.[beat] ?? null
}
export function bloodfairySceneText(
  progress: CampaignProgress,
  beat: BloodfairyBeat,
): string {
  const journal = progress.journey ?? []
  const lastChapter = progress.wins - 1
  const previous = journal[lastChapter]?.[2]
  const callback =
    lastChapter >= 0 && previous === 'left'
      ? [
          'Brine has brought the workers who stood beside the crew at the previous showdown. They will stay if their voices still count.',
          'Pipkin has sent medicine from the clinic, with a note asking who makes the rules for the next rescue.',
          'Tallow has written a verse for every person who was silenced at the transmitter.',
          'Axle arrives with six copies of the bridge key. None of them will accept another private toll.',
        ][lastChapter]
      : lastChapter >= 0 && previous === 'right'
        ? [
            'Brine is still repairing what was lost at the hall. She asks whether the next victory will leave another invoice.',
            'Pipkin has sent a list of people still waiting at the clinic. No one signs their names.',
            'Tallow has left the original songbook by the door. Not everyone is ready to sing it.',
            'Axle carries the only bridge key. She looks too tired to hold another barricade.',
          ][lastChapter]
        : null
  return (callback ? callback + ' ' : '') + beat.text
}
export function bloodfairyLastOutcome(
  progress: CampaignProgress,
): string | null {
  const beats = progress.journey?.[progress.wins] ?? []
  if (!beats.length) return null
  return (
    BLOODFAIRY_CHAPTERS[progress.wins]?.[beats.length - 1]?.choices.find(
      (choice) => choice.id === beats[beats.length - 1],
    )?.outcome ?? null
  )
}
export function chooseBloodfairyBeat(
  save: CampaignSave,
  id: BloodfairyPick,
): CampaignSave {
  const progress = save.bloodfairies
  const beat = bloodfairyBeat(progress)
  if (!beat?.choices.some((choice) => choice.id === id)) return save
  const chapter = progress.wins
  const journey = Array.from({ length: chapter + 1 }, (_, i) =>
    i === chapter
      ? [...(progress.journey?.[i] ?? []), id]
      : [...(progress.journey?.[i] ?? [])],
  )
  return { ...save, bloodfairies: { ...progress, journey } }
}
/** Called once per chapter, after all three narrative beats are decided.
 * Long-term coalition voice and volume reshape the actual Solo Clash boss
 * starting life. A loud solo run has its own offensive payoff but is fragile.
 */
export function bloodfairyBattleTerms(
  progress: CampaignProgress,
  terms: BoutTerms,
): BoutTerms {
  if ((progress.journey?.[progress.wins]?.length ?? 0) !== 3) return terms
  const { voices, volume } = bloodfairyLedger(progress)
  const self =
    Math.min(4, Math.floor(voices / 2)) - Math.min(2, Math.floor(volume / 5))
  const pressure = -Math.min(4, Math.floor(volume / 2))
  return {
    ...terms,
    playerHp: (terms.playerHp ?? 0) + self,
    enemyArmor: (terms.enemyArmor ?? 0) + pressure,
  }
}
export function bloodfairyEpilogue(progress: CampaignProgress): string {
  if (progress.wins !== 5) return ''
  const { voices, volume } = bloodfairyLedger(progress)
  const final = progress.journey?.[4]?.[2]
  if (voices >= 10 && final === 'left')
    return 'The first vote of the Moshpit Republic is not about its leader. It is whether any leader may cancel a concert. Thimble votes last, and loses. The party that follows takes three nights to end.'
  if (volume >= 10 && final === 'right')
    return 'Thimble keeps the master switch by the bed. The new rooftops are free, but nobody is sure who gets to turn the music off. Brine leaves a ballot box under the stage.'
  return 'Tallow prints a new songbook with the mistakes left in. Some roofs choose a rotating assembly; others hire a guard. At least every tenant can hear the arguments over the music.'
}
/** A true level-three reveal, using the existing authored Riot Choir
 * Wall of Sound / Backup Singers mechanical split. This preview changes
 * narrative alignment, not the player's earned card level.
 */
export function bloodfairyStageThreeReveal(
  progress: CampaignProgress,
): boolean {
  return progress.wins === 2 && (progress.journey?.[2]?.length ?? 0) === 2
}
export function validBloodfairyJourney(progress: CampaignProgress): boolean {
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

/** Chosen coalition tactics field real cards in the next STORY combat.
 * No permanent pack card is awarded here; Story rewards retain priority.
 * The choir may reach its actual level 3 through normal Clash card plays.
 */
export function bloodfairyStoryDeck(
  progress: CampaignProgress,
  deck: string[],
): string[] {
  const { voices, volume } = bloodfairyLedger(progress)
  const additions = [
    ...(voices >= 3 ? ['s1-riot-choir'] : []),
    ...(volume >= 3 ? ['s2-bloodfairies-bassquake-colossus'] : []),
  ]
  const next = [...deck]
  for (const id of additions) {
    if (
      next.includes(id) ||
      !CARDS.some((card) => card.id === id && card.team === 'bloodfairies')
    )
      continue
    // Story earned rewards enter at the front; replace only non-earned
    // cards from the tail, preserving earlier additions.
    const protectedIds = new Set([...additions, ...(progress.rewards ?? [])])
    const slot = next.findLastIndex((cardId) => !protectedIds.has(cardId))
    if (slot >= 0) next[slot] = id
  }
  return soloProblems('bloodfairies', next).length ? deck : next
}
