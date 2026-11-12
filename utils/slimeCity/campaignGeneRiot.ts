// The Ninth Life Protocol: fifteen bespoke, consequential story beats.
// These belong to Gene Riot's authored SOLO campaign, not Alliance Tower.
import type { EpilogueKey } from './campaignEpilogues'
import type { BoutTerms } from './city'
import type { CampaignProgress, CampaignSave } from './campaign'

export type GeneRiotPick = 'left' | 'right'
export interface GeneRiotOption {
  id: GeneRiotPick
  label: string
  outcome: string
  terms: BoutTerms
}
export interface GeneRiotScene {
  id: string
  title: string
  speaker: string
  text: string
  choices: readonly [GeneRiotOption, GeneRiotOption]
  callback?: {
    chapter: number
    beat: number
    choice: GeneRiotPick
    text: string
  }
}
type GeneRiotJournal = GeneRiotPick[][]

export const GENE_RIOT_CHAPTERS: readonly (readonly GeneRiotScene[])[] = [
  [
    {
      id: 'the-negative',
      title: "A PICTURE YOU DIDN'T TAKE",
      speaker: 'Calico Nine',
      text: 'The safehouse kitchen smells of burnt toast and bleach. An Undertow drone has photographed every child leaving by the back door. Nine lays its developed film on the table. Her youngest sister, Lark, asks why none of the faces in it have names. The printer at the other end of the wire is still running.',
      choices: [
        {
          id: 'left',
          label: 'Let the families decide what gets erased',
          outcome:
            'Nine knocks on each door. The families choose which images can be used as evidence and which must disappear. It costs a night of planning, but the neighborhood agrees to shelter the escapees.',
          terms: {
            playerHp: 1,
          },
        },
        {
          id: 'right',
          label: "Swap the printer's cartridge before dawn",
          outcome:
            'Rue uses an identical spool of street-festival pictures. It fools the drone for now, but the real negatives remain in Undertow custody.',
          terms: {
            enemyArmor: -1,
          },
        },
      ],
    },
    {
      id: 'the-tunnel-tax',
      title: 'THE PRICE OF A SHORTCUT',
      speaker: 'Rue',
      text: 'A drainage crew offers a path under the surveillance checkpoints. Its foreman demands one vial of growth serum for every passenger. Rue, who designed the serum before defecting, says it will leave the older clones unable to heal for a week.',
      callback: {
        chapter: 0,
        beat: 0,
        choice: 'left',
        text: 'The parents you trusted last night arrive carrying bolt cutters and three suspiciously clean ladders.',
      },
      choices: [
        {
          id: 'left',
          label: 'Open the public service tunnel',
          outcome:
            "Nine calls in the neighborhood. The crew clears the blockage without serum, though the noise alerts Undertow's patrol.",
          terms: {
            enemyArmor: 1,
            playerHp: 1,
          },
        },
        {
          id: 'right',
          label: "Pay with Rue's emergency reserves",
          outcome:
            "Rue counts out the vials without meeting Nine's eyes. The shortcut is silent; the clinic loses the serum it expected tomorrow.",
          terms: {
            enemyArmor: -1,
            playerHp: -1,
          },
        },
      ],
    },
    {
      id: 'one-eye-open',
      title: 'THE OPERATOR WITH ONE EYE OPEN',
      speaker: 'Lark',
      text: 'The final camera feed is being watched by a technician who looks exactly like Nine, except for the surgical scar through her eyebrow. She is another escaped model, hired to keep the others trapped. Lark wants to warn her. Rue points out that the vault door closes in four minutes.',
      callback: {
        chapter: 0,
        beat: 1,
        choice: 'right',
        text: 'Rue checks the empty medical case twice. She knows what paying for speed will cost when someone gets hurt.',
      },
      choices: [
        {
          id: 'left',
          label: 'Tell the technician who the cameras belong to',
          outcome:
            'Nine uses the intercom to recite the names the lab erased. The operator cuts the feed herself, but Undertow has time to mobilize.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Pull the cable and take the evidence',
          outcome:
            "The monitor dies on the operator's startled face. Nine secures the ledger map and walks out without learning whether the other clone escaped.",
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
  ],
  [
    {
      id: 'visitor-pass',
      title: 'PROPERTY OF THE FOUNDRY',
      speaker: 'Rue',
      text: "The Ironjaw foundry issues each visitor a paper badge. Under Nine's photograph it prints PROPERTY: EXPERIMENTAL LINE NINE. Rue notices the old serial number matches a living girl in the workers' infirmary. A foreman tells them not to touch the badge dispenser.",
      callback: {
        chapter: 0,
        beat: 2,
        choice: 'left',
        text: "An encrypted message from the scarred operator reaches the forge: 'They keep a copy of every name here too.'",
      },
      choices: [
        {
          id: 'left',
          label: 'Ask the workers to testify together',
          outcome:
            'The workers leave their stations for twelve dangerous minutes. Their signatures turn a manufacturing dispute into a public case.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Forge a maintenance order',
          outcome:
            "Nine slips through the locked wing using the foreman's credentials. The owners will blame the next shift for the missing file.",
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
    {
      id: 'the-second-mold',
      title: 'THE SECOND MOLD',
      speaker: 'Dr. Bell',
      text: 'Dr. Bell built the first body printer. Now she lives under it, changing coolant filters for the children she once described as viable units. The machine can print lungs for the sick girl upstairs, but its ownership beacon would alert every laboratory in the city.',
      callback: {
        chapter: 1,
        beat: 0,
        choice: 'left',
        text: 'A forge worker brings witness statements signed in three languages. Bell reads each name before offering to help.',
      },
      choices: [
        {
          id: 'left',
          label: 'Disconnect the beacon and keep the printer',
          outcome:
            'Bell opens the casing. It takes time and leaves the rescue team exposed, but the infirmary gains a working medical tool.',
          terms: {
            playerHp: 2,
          },
        },
        {
          id: 'right',
          label: 'Smash the transmitter with the mold inside',
          outcome:
            'The beacon dies immediately. So does the fragile replacement lung; Bell refuses to call the mission a clean victory.',
          terms: {
            enemyArmor: -2,
            playerHp: -1,
          },
        },
      ],
    },
    {
      id: 'the-infirmary-door',
      title: 'THE GIRL BEHIND THE DOOR',
      speaker: 'Lark',
      text: "At the infirmary, the girl with Nine's old serial number refuses to leave. She says the foundry is the only place where someone knows her medication schedule. Ironjaw guards are approaching. Nine can either make the escape safe or make it fast.",
      callback: {
        chapter: 1,
        beat: 1,
        choice: 'left',
        text: 'Bell has repaired the breathing machine. She asks the patient where she wants to wake up tomorrow.',
      },
      choices: [
        {
          id: 'left',
          label: 'Escort the infirmary out as one group',
          outcome:
            'The workers roll beds into a line and stand between them and the guards. The retreat is slow, but nobody is left as a bargaining chip.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: "Steal the patrol's access keys",
          outcome:
            'Nine can outrun the guards and open the service door. Three workers volunteer to stay and cover the escape.',
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
  ],
  [
    {
      id: 'the-parade-map',
      title: 'A PARADE ROUTE IN RED INK',
      speaker: 'Qube',
      text: "The Anarkissed have painted a thirty-foot catgirl puppet for a march on the gene bank. Qube shows Nine the route on a pizza box. A red mark at the end is not confetti: it's an explosive charge under the steps where the youngest supporters plan to stand.",
      callback: {
        chapter: 1,
        beat: 2,
        choice: 'left',
        text: "The infirmary staff volunteers as medics. Their wheelchairs become the parade's first line of defense.",
      },
      choices: [
        {
          id: 'left',
          label: 'Move the children and reveal the bomb',
          outcome:
            "Qube is furious about losing the surprise. The marchers stay, this time knowing exactly what they've been asked to risk.",
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Turn the march into a decoy',
          outcome:
            "Rue sends a false route to the guards. The bank's gate will be exposed, but thousands of supporters remain uninformed.",
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
    {
      id: 'the-giant-head',
      title: 'WHO IS INSIDE THE GIANT HEAD?',
      speaker: 'Lark',
      text: "Inside the puppet's papier-mâché head sits a scared teenager carrying the detonator. She was told the fuse controlled a fireworks show. Her name is Moth. Qube admits the adults kept the real plan out of her hands because she might object.",
      callback: {
        chapter: 2,
        beat: 0,
        choice: 'left',
        text: 'Moth says her little brother was among the children Nine warned. She hands over the detonator without being asked twice.',
      },
      choices: [
        {
          id: 'left',
          label: 'Give Moth the whole plan and a vote',
          outcome:
            'Moth demands the explosives be moved to an empty freight tunnel. The Anarkissed grumble, but they change the route.',
          terms: {
            playerHp: 1,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Take the detonator and keep marching',
          outcome:
            'The immediate danger is gone. Moth leaves the puppet without saying goodbye. Qube calls it command; Lark calls it a habit.',
          terms: {
            enemyArmor: -1,
          },
        },
      ],
    },
    {
      id: 'the-silent-fuse',
      title: 'TWENTY SECONDS OF SILENCE',
      speaker: 'Calico Nine',
      text: 'At the gene bank, the alarm sounds a full minute early. The crowd scatters. In a glass booth, an old lab director waits with the door locked and a stack of records beside a shredder. Nine has the charge, the key, and one clean chance.',
      callback: {
        chapter: 2,
        beat: 1,
        choice: 'left',
        text: "Moth has rigged the freight tunnel to carry the blast away from the street. She waits for Nine's signal.",
      },
      choices: [
        {
          id: 'left',
          label: 'Open the doors and evacuate the archives',
          outcome:
            'The records come out under a rain of alarm lights. The director escapes with one folder, but everyone who worked at the bank sees what was kept there.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Blow the vault shutter before the shredder starts',
          outcome:
            'The records survive in the vault. The blast seals the street, and the Anarkissed will have to face the families who were caught outside.',
          terms: {
            enemyArmor: -2,
            playerHp: -1,
          },
        },
      ],
    },
  ],
  [
    {
      id: 'first-witness',
      title: 'THE WITNESS WITH THE TIN CUP',
      speaker: 'Tallow',
      text: 'Tallow of the Bloodfairies has kept a copy of her own indenture contract inside a tin cup for seventeen years. She agrees to testify against the lab on one condition: Nine must not hand the court the names of the workers who signed under threats.',
      callback: {
        chapter: 2,
        beat: 2,
        choice: 'left',
        text: 'The archive evacuation left behind a dozen names of former guards willing to testify. Tallow asks whether they were ever given a choice.',
      },
      choices: [
        {
          id: 'left',
          label: 'Let Tallow redact the threatened workers',
          outcome:
            'Nine watches Tallow black out half the page. The evidence will be harder to prosecute, but the witnesses will actually show up.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Submit the entire contract as proof',
          outcome:
            'The court receives a complete chain of ownership. Two workers vanish before the hearing, afraid their old signatures will be used against them.',
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
    {
      id: 'the-invoice',
      title: 'INVOICE FOR A LIFE',
      speaker: 'Rue',
      text: 'The witnesses are billed for the chairs they sit on, the air in their holding room, and the time they spend in court. The invoices come from Meat Exchange. Rue could cancel them with a forged seal, but Tallow says a forged acquittal is one more thing the Exchange can buy.',
      callback: {
        chapter: 3,
        beat: 0,
        choice: 'left',
        text: "Tallow's protected witnesses arrive together, each carrying a heavily redacted page. No one has disappeared overnight.",
      },
      choices: [
        {
          id: 'left',
          label: 'Put the invoices on public display',
          outcome:
            'The hearing stops while the public reads the charges. The judge is embarrassed, the Exchange furious, and the witnesses stay.',
          terms: {
            playerHp: 2,
          },
        },
        {
          id: 'right',
          label: "Forge the Exchange's cancellation seal",
          outcome:
            'The doors open before anyone notices the forgery. Rue warns Nine that somebody will eventually come looking for the missing payment.',
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
    {
      id: 'under-oath',
      title: "WHAT THE COURT CAN'T HEAR",
      speaker: 'Lark',
      text: 'The final witness is a child who knows where the lab buried failed printings. She will speak only if Nine promises not to make the whole city stare at her. Outside, the court broadcaster has already sold exclusive rights to the testimony.',
      callback: {
        chapter: 3,
        beat: 1,
        choice: 'left',
        text: "A reporter who read the invoice exhibition offers to surrender the broadcast contract and testify about the Exchange's control of the court.",
      },
      choices: [
        {
          id: 'left',
          label: 'Record testimony in a closed room',
          outcome:
            "The child's statement is sealed for the trial. It cannot become a spectacle, but it gives the defense time to prepare.",
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Broadcast the evidence before it is buried',
          outcome:
            'The story spreads across the city by nightfall. The child asks Nine not to visit again.',
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
  ],
  [
    {
      id: 'number-zero',
      title: 'LOT ZERO',
      speaker: 'Brass Voss',
      text: "The Exchange's auction catalog lists one lot before all the others: a blank birth certificate. In a smaller typeface are the words RIGHTS TO FUTURE ISSUE. Brass Voss, the auctioneer, welcomes Nine as the original manufacturer's representative.",
      callback: {
        chapter: 3,
        beat: 2,
        choice: 'left',
        text: "The child's sealed testimony has named the auction's storage rooms. A court clerk slips Nine the floor plan.",
      },
      choices: [
        {
          id: 'left',
          label: 'Challenge the legality of Lot Zero in public',
          outcome:
            'Nine forces Voss to explain exactly what the buyers think they own. The auction stalls, and every bidder hears the objection.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Buy the first lot with forged credit',
          outcome:
            "Rue signs away a fictitious company. The blank certificate is in Nine's hands, but Voss notices the signature.",
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
    {
      id: 'the-bidder',
      title: 'THE BIDDER IN THE BACK ROW',
      speaker: 'Dr. Bell',
      text: "Dr. Bell recognizes the last bidder. It is the person who funded the first clone clinic and later sold the patents to pay for their own child's treatment. The bidder has brought a small case with the original naming ledger inside. Bell asks Nine not to mistake guilt for an excuse.",
      callback: {
        chapter: 4,
        beat: 0,
        choice: 'left',
        text: "The public challenge has forced the auction into recess. Bell has enough time to ask the bidder who paid for the child's medicine.",
      },
      choices: [
        {
          id: 'left',
          label: 'Offer immunity for the original ledger',
          outcome:
            'The bidder places the case on the table. They will face a hearing, but not a mob. Bell finally tells Nine what she remembers about the first clinic.',
          terms: {
            playerHp: 2,
          },
        },
        {
          id: 'right',
          label: 'Take the case while the bidder is distracted',
          outcome:
            'Nine gets the ledger and leaves the buyer to answer for the auction. The case is missing its last page.',
          terms: {
            enemyArmor: -2,
          },
        },
      ],
    },
    {
      id: 'the-name-room',
      title: 'THE ROOM WITH NO LABELS',
      speaker: 'Calico Nine',
      text: 'The final room has rows of blank cards, one for every person the Exchange intends to own. Lark reaches for a stack and finds her own handwriting on the back. She wrote those names years ago as a clinic exercise. Voss turned the exercise into an inventory.',
      callback: {
        chapter: 4,
        beat: 1,
        choice: 'left',
        text: "Bell's recovered ledger includes the key to the printing machine. The blanks can be voided without erasing the names they were meant to hold.",
      },
      choices: [
        {
          id: 'left',
          label: 'Give the names back to the people they belong to',
          outcome:
            'Nine calls the clinic families into the room. Each takes their own card; the ownership ledger loses its buyers one by one.',
          terms: {
            playerHp: 2,
            enemyArmor: 1,
          },
        },
        {
          id: 'right',
          label: 'Destroy every blank and every machine',
          outcome:
            'Nothing remains for Voss to sell tonight. Lark carries away one unburned card, uncertain whether the names can ever be recovered.',
          terms: {
            enemyArmor: -2,
            playerHp: -1,
          },
        },
      ],
    },
  ],
] as const

export function geneRiotJournal(progress: CampaignProgress): GeneRiotJournal {
  return progress.journey ?? []
}
export function geneRiotScene(
  progress: CampaignProgress,
): GeneRiotScene | null {
  const next = geneRiotJournal(progress)[progress.wins]?.length ?? 0
  return GENE_RIOT_CHAPTERS[progress.wins]?.[next] ?? null
}
export function geneRiotChoice(
  progress: CampaignProgress,
  chapter: number,
  beat: number,
): GeneRiotPick | null {
  return progress.journey?.[chapter]?.[beat] ?? null
}
export function geneRiotSceneText(
  progress: CampaignProgress,
  scene: GeneRiotScene,
): string {
  const callback = scene.callback
  return callback &&
    geneRiotChoice(progress, callback.chapter, callback.beat) ===
      callback.choice
    ? callback.text + ' ' + scene.text
    : scene.text
}
export function geneRiotLastOutcome(progress: CampaignProgress): string | null {
  const chapter = progress.wins
  const beat = (progress.journey?.[chapter]?.length ?? 0) - 1
  const scene = GENE_RIOT_CHAPTERS[chapter]?.[beat]
  const choice = progress.journey?.[chapter]?.[beat]
  return scene?.choices.find((option) => option.id === choice)?.outcome ?? null
}
export function chooseGeneRiotScene(
  save: CampaignSave,
  id: GeneRiotPick,
): CampaignSave {
  const progress = save.catgirls
  const scene = geneRiotScene(progress)
  if (!scene?.choices.some((choice) => choice.id === id)) return save
  const chapter = progress.wins
  const journey = Array.from({ length: chapter + 1 }, (_, i) =>
    i === chapter
      ? [...(progress.journey?.[chapter] ?? []), id]
      : [...(progress.journey?.[i] ?? [])],
  )
  return { ...save, catgirls: { ...progress, journey } }
}
export function geneRiotBattleTerms(
  progress: CampaignProgress,
  terms: BoutTerms,
): BoutTerms {
  const picks = progress.journey?.[progress.wins] ?? []
  if (picks.length !== 3) return terms
  const next: BoutTerms = { ...terms }
  for (let beat = 0; beat < picks.length; beat++) {
    const effects = GENE_RIOT_CHAPTERS[progress.wins]?.[beat]?.choices.find(
      (option) => option.id === picks[beat],
    )?.terms
    if (!effects) continue
    for (const key of ['playerHp', 'enemyArmor'] as const) {
      const value = effects[key]
      if (value) next[key] = (next[key] ?? 0) + value
    }
  }
  return next
}
/** The crew journey's three authored endings (slime-city/t-059). */
export const GENE_RIOT_EPILOGUES: Record<EpilogueKey, string> = {
  left: 'When the names are returned, Lark opens a modest clinic inside the old auction house. The first rule on its door is written in twelve languages: ask before you keep a record.',
  right:
    'The machines are gone, but Rue has kept the only surviving map of the clone archives. She leaves it with Nine on the kitchen table. This time, Lark gets a vote before anyone opens it.',
  mixed:
    'Lark keeps a ledger of a different kind: where people can find clean medicine, honest witnesses and a room for the night. Nobody has to surrender a name to use it.',
}

export function geneRiotEpilogueKey(
  progress: CampaignProgress,
): EpilogueKey | null {
  if (progress.wins !== 5) return null
  const last = progress.journey?.[4]?.[2]
  const first = progress.journey?.[0]?.[0]
  const witness = progress.journey?.[3]?.[2]
  if (last === 'left' && witness === 'left') return 'left'
  if (last === 'right' && first === 'right') return 'right'
  return 'mixed'
}

export function geneRiotEpilogue(progress: CampaignProgress): string {
  const key = geneRiotEpilogueKey(progress)
  return key ? GENE_RIOT_EPILOGUES[key] : ''
}

/** Existing saves can lack journey entirely. Once present, every chapter must
 * contain a contiguous left/right prefix, never a forged future choice.
 */
export function validGeneRiotJourney(progress: CampaignProgress): boolean {
  if (progress.journey === undefined) return true
  if (!Array.isArray(progress.journey) || progress.journey.length > 5)
    return false
  for (let chapter = 0; chapter < progress.journey.length; chapter++) {
    const picks = progress.journey[chapter]
    if (
      !Array.isArray(picks) ||
      picks.length > 3 ||
      picks.some((pick) => pick !== 'left' && pick !== 'right') ||
      (chapter > progress.wins && picks.length > 0) ||
      (chapter < progress.wins && picks.length !== 0 && picks.length !== 3)
    )
      return false
  }
  return true
}
