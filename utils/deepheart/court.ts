import type { EventDef, StatKey } from './types'

// The gods look unmistakably human. Animal-person ancestry remains the norm for
// every mortal society; this is a deliberate supernatural visual exception.
export type CourtChoiceKey = 'bargain' | 'expose' | 'defy'
export type CourtChoice = {
  label: string
  stat: StatKey
  dc: number
  success: string
  failure: string
  epilogue: string
  revealLink: string
}
export type CourtDeity = {
  id: string
  name: string
  epithet: string
  pronouns: string
  layer: number
  seat: string
  power: string
  look: string
  voice: string
  impact: string
  encounter: string
  choices: Record<CourtChoiceKey, CourtChoice>
}
export type CourtRelation = {
  id: string
  from: string
  to: string
  kind: 'kinship' | 'affair' | 'grudge' | 'breakup' | 'former' | 'plot' | 'scheme' | 'revenge'
  label: string
  detail: string
}

export const COURT_DEITIES: CourtDeity[] = [
  {
    "id": "aveline",
    "name": "Duchess Aveline",
    "epithet": "Mistress of Names",
    "pronouns": "she/her",
    "layer": 0,
    "seat": "The Registry in the Ossuary Gate",
    "power": "Can remove, trade, or restore a name, and with it the right to belong.",
    "look": "A visibly human-looking adult woman with deep plum-brown skin, straight cobalt-blue bobbed hair, sculpted eyebrows and pale gold eyes; sharp white clerical suit, black lacquered fingernails, tiny silver seal earrings.",
    "voice": "A gracious clerk who can destroy a family with a misplaced apostrophe.",
    "impact": "Her registry decides who legally lives in the lower wards and who is classified as salvage.",
    "encounter": "In a midnight registry, a human-faced duchess offers to register the party as people. A queue of animal folk holds torn birth certificates.",
    "choices": {
      "bargain": {
        "label": "Trade a memory for safe passage",
        "stat": "wit",
        "dc": 12,
        "success": "Aveline files the party under protected persons. The liftkeepers bow to paperwork they have never read.",
        "failure": "She accepts the memory and changes one letter. The wrong door opens for you.",
        "epilogue": "Your names are engraved on every lift door. The registry asks for interest in memories.",
        "revealLink": "court-link-aveline-ilex"
      },
      "expose": {
        "label": "Read the sealed family appendix aloud",
        "stat": "wit",
        "dc": 15,
        "success": "Her public ledger exposes an old court affair; the queue of nameless workers starts chanting their own names.",
        "failure": "The letters wriggle off the page. Aveline smiles at your embarrassment.",
        "epilogue": "The registry loses its monopoly. In every lower ward, neighbours begin to write their own names.",
        "revealLink": "court-link-aveline-vireo"
      },
      "defy": {
        "label": "Refuse every title she offers",
        "stat": "mag",
        "dc": 16,
        "success": "For a breath, the registry cannot find a category for someone who asks permission from nobody.",
        "failure": "She strikes a name from your passport. The guards remember only your debt.",
        "epilogue": "You leave your legal identity behind and inspire the first strike of the nameless.",
        "revealLink": "court-link-aveline-serein"
      }
    }
  },
  {
    "id": "ilex",
    "name": "Prince Ilex",
    "epithet": "The Weight of the World",
    "pronouns": "he/him",
    "layer": 0,
    "seat": "The Toll Lifts",
    "power": "Controls gravity, stairs and which floors are allowed to touch.",
    "look": "A visibly human-looking adult man with warm tan skin, long straight black hair tied in a high knot, narrow rectangular glasses and a long charcoal military coat lined in fluorescent teal; delicate gold weight chains at the belt.",
    "voice": "A charming transit minister who can turn a staircase into a border.",
    "impact": "His tollkeepers charge fortunes to move food, medicine and refugees between floors.",
    "encounter": "On a suspended freight lift, a man with no muzzle calmly adjusts gravity while porter crews demand the right to cross.",
    "choices": {
      "bargain": {
        "label": "Negotiate an open-lift charter",
        "stat": "wit",
        "dc": 13,
        "success": "Ilex stamps your charter. The porters race medicine downward as the toll bell falls silent.",
        "failure": "He agrees to one trial shift and charges everyone else twice.",
        "epilogue": "Your charter turns the freight lifts into public roads, although Ilex still owns the brakes.",
        "revealLink": "court-link-aveline-ilex"
      },
      "expose": {
        "label": "Show the court his secret food treaty",
        "stat": "wit",
        "dc": 15,
        "success": "A forged famine schedule spills from his coat. The porters know exactly whom to confront.",
        "failure": "The papers drift upward beyond your reach while the prince applauds politely.",
        "epilogue": "The toll crews publish the secret treaty. The prince now descends by public stairs.",
        "revealLink": "court-link-ilex-vireo"
      },
      "defy": {
        "label": "Cut the weight-chain from his belt",
        "stat": "spd",
        "dc": 17,
        "success": "The lift lands with a shout of freedom. Every chain in the shaft rings once.",
        "failure": "Gravity reverses and the party crashes against the roof.",
        "epilogue": "You break his monopoly, leaving the whole vertical world to argue over who maintains the lifts.",
        "revealLink": "court-link-ilex-cauline"
      }
    }
  },
  {
    "id": "serein",
    "name": "Lady Serein",
    "epithet": "Matron of Interest",
    "pronouns": "she/her",
    "layer": 1,
    "seat": "The Flooded Exchange",
    "power": "Can lend tomorrow to yesterday, charging interest in years of life.",
    "look": "A visibly human-looking broad-shouldered adult woman with rich dark-brown skin, a short platinum buzz cut, sharp cheekbones and green lipstick; sea-glass rings and a severe oxblood tailored waistcoat.",
    "voice": "A patient lender who reads the small print in her own eulogies.",
    "impact": "Her debt houses own water rights, crops and most orphanages below the flood line.",
    "encounter": "A human-faced creditor counts the breaths of flood refugees at a glass-walled exchange. Everyone owes her a tomorrow.",
    "choices": {
      "bargain": {
        "label": "Refinance the flood ward’s water",
        "stat": "wit",
        "dc": 13,
        "success": "The compound interest becomes a shared public fund. Serein actually laughs.",
        "failure": "The small print charges each household a year it has not lived yet.",
        "epilogue": "You purchase the ward’s debts and forgive them. Serein calls it reckless; the market calls it liberation.",
        "revealLink": "court-link-serein-ilex"
      },
      "expose": {
        "label": "Read her cancelled marriage contract",
        "stat": "wit",
        "dc": 15,
        "success": "The marriage and the debt were the same document. The court sees every signature.",
        "failure": "Every signature turns into your own name. The refugees look away.",
        "epilogue": "You reveal how marital titles became mortgages. The flood ward refuses its inherited bills.",
        "revealLink": "court-link-serein-ludo"
      },
      "defy": {
        "label": "Destroy the hourglass collateral",
        "stat": "mag",
        "dc": 17,
        "success": "Years of stolen futures surge back into the refugees like warm rain.",
        "failure": "The hourglass shatters into sharp debt slips that cut your party.",
        "epilogue": "The future is no longer a security deposit. Serein begins collecting stories instead.",
        "revealLink": "court-link-serein-vireo"
      }
    }
  },
  {
    "id": "vireo",
    "name": "Lord Vireo",
    "epithet": "The Last Supper",
    "pronouns": "he/him",
    "layer": 1,
    "seat": "The Cistern Banquets",
    "power": "Can multiply food for a feast, or turn every banquet into a famine.",
    "look": "A visibly human-looking stocky adult man with freckled pale copper skin, a tumble of short red curls, one gold tooth and violet under-eye shadow; stained emerald velvet jacket and a neon-pink chef sash.",
    "voice": "A hospitable aristocrat who considers a famine a regrettable scheduling issue.",
    "impact": "His dining houses supply food to the working caverns and blacklist every disobedient borough.",
    "encounter": "A human-faced host invites starving mine workers to a banquet while insisting they admire the menu first.",
    "choices": {
      "bargain": {
        "label": "Demand rations before invitations",
        "stat": "wit",
        "dc": 12,
        "success": "The platters multiply and leave through the workers’ door. Vireo signs a public ration promise.",
        "failure": "The food arrives after the mine shift ends. He asks for applause anyway.",
        "epilogue": "Every feast now pays a community kitchen first. Vireo discovers admiration cannot be eaten.",
        "revealLink": "court-link-ilex-vireo"
      },
      "expose": {
        "label": "Unseal the guest list of forbidden lovers",
        "stat": "wit",
        "dc": 15,
        "success": "Old court names spill across the table, including the duchess he insists is merely a cousin.",
        "failure": "The cutlery points at you. Vireo calls the accusation tasteless.",
        "epilogue": "Your testimony makes the royal banquet a hearing. The old family scandal finally breaks into daylight.",
        "revealLink": "court-link-aveline-vireo"
      },
      "defy": {
        "label": "Feed the workers from his own plate",
        "stat": "mag",
        "dc": 16,
        "success": "Each slice shared with a worker grows another loaf. The feast escapes his control.",
        "failure": "The food turns to ash before the first hungry child can taste it.",
        "epilogue": "The banquet hall becomes a public pantry. Vireo is welcome only when he brings his own dish.",
        "revealLink": "court-link-ludo-vireo"
      }
    }
  },
  {
    "id": "cauline",
    "name": "Countess Cauline",
    "epithet": "Seamstress of the Hour",
    "pronouns": "she/her",
    "layer": 2,
    "seat": "The Clockwork Tenements",
    "power": "Can unpick a minute and sew it into another person’s life.",
    "look": "A visibly human-looking elderly short woman with olive-brown skin, dramatic silver curls, purple eyes behind round cracked spectacles and a black lace dress layered with luminous orange thread.",
    "voice": "A weary grandmother who keeps time like a jealous seamstress keeps scissors.",
    "impact": "She sells stolen work-hours as extra years to the upper floors and calls it tradition.",
    "encounter": "A tiny human-faced countess mends a torn hour by hand while exhausted miners sleep standing up.",
    "choices": {
      "bargain": {
        "label": "Purchase one free hour for every miner",
        "stat": "wit",
        "dc": 14,
        "success": "Cauline stitches a minute into every shift. The machinery stops for the first proper break in years.",
        "failure": "She adds a holiday that arrives once a century.",
        "epilogue": "The mines gain a daily hour of rest. Cauline finds herself unable to remember the original contract.",
        "revealLink": "court-link-cauline-vireo"
      },
      "expose": {
        "label": "Unpick the century she stole",
        "stat": "wit",
        "dc": 16,
        "success": "An heirloom reveals a decade hidden in a child’s wedding dress. Cauline’s old revenge becomes public.",
        "failure": "Your witness forgets the hour before the hearing begins.",
        "epilogue": "The stolen century returns to ordinary families. The countess has to live in linear time.",
        "revealLink": "court-link-ilex-cauline"
      },
      "defy": {
        "label": "Break the clock that binds the tenants",
        "stat": "mag",
        "dc": 18,
        "success": "The clock stops. For an instant nobody works, dies or owes a thing.",
        "failure": "It accelerates. Your party loses precious breath to the frantic gears.",
        "epilogue": "You stop the counting machine, but the tenements must invent a fair schedule themselves.",
        "revealLink": "court-link-ludo-cauline"
      }
    }
  },
  {
    "id": "ludo",
    "name": "Consort Ludo",
    "epithet": "Prince of False Faces",
    "pronouns": "they/them",
    "layer": 2,
    "seat": "The Masked Broadcast",
    "power": "Can change how a crowd remembers a person, a lie, or a revolution.",
    "look": "A visibly human-looking slender adult with medium-brown skin, long raven-black locs threaded with bright pink wire, violet eyeliner and a white asymmetrical punk tailcoat covered in broken mirror buttons.",
    "voice": "A theatrical publicist who can rewrite a coronation as an embarrassing breakup.",
    "impact": "Their gossip sheets turn court rivalries into propaganda and make dissidents vanish into punchlines.",
    "encounter": "A tall human-faced performer broadcasts court gossip from a broken theatre. Masked audience members clap a beat too late.",
    "choices": {
      "bargain": {
        "label": "Make the working wards the headline",
        "stat": "wit",
        "dc": 14,
        "success": "Ludo gives the microphone to the liftworkers, and their voices fill every shaft.",
        "failure": "The workers appear in the gossip sheets as comic villains. The applause continues.",
        "epilogue": "The undercity gets its own independent broadcast. Ludo keeps sending unsolicited scripts.",
        "revealLink": "court-link-serein-ludo"
      },
      "expose": {
        "label": "Reveal the family behind the false masks",
        "stat": "wit",
        "dc": 16,
        "success": "The masks fall, revealing an old adoption, a forged proposal, and one spectacular revenge plot.",
        "failure": "Every mask displays your face. The crowd chants your name with the wrong story attached.",
        "epilogue": "Their false court genealogy is published in full. The nobles spend a century arguing with the footnotes.",
        "revealLink": "court-link-ludo-aveline"
      },
      "defy": {
        "label": "Pull the wire from the broadcast throne",
        "stat": "spd",
        "dc": 17,
        "success": "The stage lights burst into sparks and every borrowed voice returns to its owner.",
        "failure": "The broadcast repeats your confession in the most humiliating possible voice.",
        "epilogue": "The theatre becomes a meeting hall. Ludo watches from the back row, genuinely impressed.",
        "revealLink": "court-link-ludo-vireo"
      }
    }
  }
]

export const COURT_LINKS: CourtRelation[] = [
  {
    "id": "court-link-aveline-ilex",
    "from": "aveline",
    "to": "ilex",
    "kind": "kinship",
    "label": "Half-siblings / shared crown",
    "detail": "Aveline holds the names; Ilex holds the stairs. Their treaty divided power before anyone else could vote."
  },
  {
    "id": "court-link-aveline-vireo",
    "from": "aveline",
    "to": "vireo",
    "kind": "affair",
    "label": "Cousins / secret former affair",
    "detail": "The cousins’ youthful affair was formally erased from the registry, then revived by a leaked banquet guest list."
  },
  {
    "id": "court-link-aveline-serein",
    "from": "aveline",
    "to": "serein",
    "kind": "grudge",
    "label": "Enemy of the census",
    "detail": "Aveline erased debtors’ names; Serein kept charging their descendants. Each blames the other for a century of revolt."
  },
  {
    "id": "court-link-serein-ilex",
    "from": "serein",
    "to": "ilex",
    "kind": "breakup",
    "label": "Annulled marriage",
    "detail": "Their wedding contract secretly transferred lift tolls as collateral. The divorce failed to unwind the debt."
  },
  {
    "id": "court-link-serein-ludo",
    "from": "serein",
    "to": "ludo",
    "kind": "former",
    "label": "Ex-lovers / leaking letters",
    "detail": "Ludo once courted Serein for the love letters; she still knows the names behind their masks."
  },
  {
    "id": "court-link-serein-vireo",
    "from": "serein",
    "to": "vireo",
    "kind": "plot",
    "label": "Secret dinner alliance",
    "detail": "Food loans and compound interest made famine profitable to both households."
  },
  {
    "id": "court-link-ilex-vireo",
    "from": "ilex",
    "to": "vireo",
    "kind": "scheme",
    "label": "Food-lift monopoly",
    "detail": "Ilex limits which floors food can reach; Vireo controls the cargo that goes up and down."
  },
  {
    "id": "court-link-ilex-cauline",
    "from": "ilex",
    "to": "cauline",
    "kind": "revenge",
    "label": "Stolen century",
    "detail": "Cauline held back a century of Ilex’s inheritance, and he built the toll lifts to punish the clock districts."
  },
  {
    "id": "court-link-cauline-vireo",
    "from": "cauline",
    "to": "vireo",
    "kind": "kinship",
    "label": "Estranged mother and heir",
    "detail": "Vireo learned his public generosity from his mother, and his willingness to starve a ward from her silences."
  },
  {
    "id": "court-link-ludo-cauline",
    "from": "ludo",
    "to": "cauline",
    "kind": "kinship",
    "label": "Adopted ward / forged birth",
    "detail": "Cauline adopted Ludo after a scandal; their birth certificate was written by Aveline three times."
  },
  {
    "id": "court-link-ludo-vireo",
    "from": "ludo",
    "to": "vireo",
    "kind": "grudge",
    "label": "Poisoned anniversary feast",
    "detail": "Ludo sabotaged the chef’s great anniversary broadcast to avenge Serein’s humiliation."
  },
  {
    "id": "court-link-ludo-aveline",
    "from": "ludo",
    "to": "aveline",
    "kind": "plot",
    "label": "Fake engagement",
    "detail": "Ludo and Aveline staged an engagement to humiliate Ilex; the court still cannot agree whether either meant it."
  }
]

export const COURT_CHOICE_KEYS: CourtChoiceKey[] = ['bargain', 'expose', 'defy']

export function courtDeity(id: string): CourtDeity | undefined {
  return COURT_DEITIES.find((deity) => deity.id === id)
}

export const COURT_EVENTS: EventDef[] = COURT_DEITIES.map((deity): EventDef => ({
  id: `fairy-${deity.id}`,
  layer: deity.layer,
  title: `An Audience with ${deity.name}`,
  text: deity.encounter,
  reveal: `court-meet-${deity.id}`,
  options: [
    {
      id: 'bargain',
      label: deity.choices.bargain.label,
      hint: `Persuade · d20 + Wits vs ${deity.choices.bargain.dc}`,
      tag: 'curious',
      effects: {},
      check: {
        stat: 'wit',
        dc: deity.choices.bargain.dc,
        win: { gold: 20, mercy: 1 },
        lose: { gold: -10 },
        winText: deity.choices.bargain.success,
        loseText: deity.choices.bargain.failure,
      },
      result: '',
    },
    {
      id: 'expose',
      label: deity.choices.expose.label,
      hint: `Investigate · d20 + Wits vs ${deity.choices.expose.dc}`,
      tag: 'bold',
      effects: {},
      check: {
        stat: 'wit',
        dc: deity.choices.expose.dc,
        win: { gold: 25 },
        lose: { hurt: 0.07 },
        winText: deity.choices.expose.success,
        loseText: deity.choices.expose.failure,
      },
      result: '',
    },
    {
      id: 'defy',
      label: deity.choices.defy.label,
      hint: `Defy · d20 + ${deity.choices.defy.stat.toUpperCase()} vs ${deity.choices.defy.dc}`,
      tag: 'bold',
      effects: {},
      check: {
        stat: deity.choices.defy.stat,
        dc: deity.choices.defy.dc,
        win: { mercy: 1, boon: { wit: 1 } },
        lose: { hurt: 0.12 },
        winText: deity.choices.defy.success,
        loseText: deity.choices.defy.failure,
      },
      result: '',
    },
    {
      id: 'walk',
      label: 'Walk away',
      hint: 'A refusal is an answer too',
      effects: {},
      result: `${deity.name} watches you leave, baffled by a person who wants nothing from the court.`,
    },
  ],
}))
