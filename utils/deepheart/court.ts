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
  // Reality editors outlive the people harmed by their passing whims.
  immortal: true
  mythicEcho: string
  obsession: string
  immortalTruth: string
}
export type CourtRelation = {
  id: string
  from: string
  to: string
  kind:
    | 'kinship'
    | 'affair'
    | 'grudge'
    | 'breakup'
    | 'former'
    | 'plot'
    | 'scheme'
    | 'revenge'
  label: string
  detail: string
}

export const COURT_DEITIES: CourtDeity[] = [
  {
    id: 'aveline',
    name: 'Duchess Aveline',
    epithet: 'Mistress of Names',
    pronouns: 'she/her',
    layer: 0,
    seat: 'The Registry in the Ossuary Gate',
    power:
      'She rewrites the name of a person, city or law until the physical world insists it has always been so. A forged surname can erase a street.',
    look: 'A visibly human-looking adult woman with deep plum-brown skin, straight cobalt-blue bobbed hair, sculpted eyebrows and pale gold eyes; sharp white clerical suit, black lacquered fingernails, tiny silver seal earrings.',
    voice:
      'A gracious clerk who can destroy a family with a misplaced apostrophe.',
    impact:
      'Her registry decides who legally lives in the lower wards and who is classified as salvage.',
    encounter:
      'In a midnight registry, a human-faced duchess offers to register the party as people. A queue of animal folk holds torn birth certificates.',
    choices: {
      bargain: {
        label: 'Trade a memory for safe passage',
        stat: 'wit',
        dc: 12,
        success:
          'Aveline files the party under protected persons. The liftkeepers bow to paperwork they have never read.',
        failure:
          'She accepts the memory and changes one letter. The wrong door opens for you.',
        epilogue:
          'Your names are engraved on every lift door. The registry asks for interest in memories.',
        revealLink: 'court-link-aveline-ilex',
      },
      expose: {
        label: 'Read the sealed family appendix aloud',
        stat: 'wit',
        dc: 15,
        success:
          'Her public ledger exposes an old court affair; the queue of nameless workers starts chanting their own names.',
        failure:
          'The letters wriggle off the page. Aveline smiles at your embarrassment.',
        epilogue:
          'The registry loses its monopoly. In every lower ward, neighbours begin to write their own names.',
        revealLink: 'court-link-aveline-vireo',
      },
      defy: {
        label: 'Refuse every title she offers',
        stat: 'mag',
        dc: 16,
        success:
          'For a breath, the registry cannot find a category for someone who asks permission from nobody.',
        failure:
          'She strikes a name from your passport. The guards remember only your debt.',
        epilogue:
          'You leave your legal identity behind and inspire the first strike of the nameless.',
        revealLink: 'court-link-aveline-serein',
      },
    },
    mythicEcho: 'Hera / Mnemosyne',
    obsession:
      'She has outlived nineteen revolutions and privately scores their slogans. Last month she renamed a riot "a wedding" to see whether the guests would notice.',
    immortalTruth:
      'Her name may be erased, but she steps back into existence through the next signature on any contract.',
    immortal: true,
  },
  {
    id: 'ilex',
    name: 'Prince Ilex',
    epithet: 'The Weight of the World',
    pronouns: 'he/him',
    layer: 0,
    seat: 'The Toll Lifts',
    power:
      'He folds gravity, distance and direction between floors. An offended prince can turn an entire city staircase into a border or make tomorrow’s elevator arrive yesterday.',
    look: 'A visibly human-looking adult man with warm tan skin, long straight black hair tied in a high knot, narrow rectangular glasses and a long charcoal military coat lined in fluorescent teal; delicate gold weight chains at the belt.',
    voice:
      'A charming transit minister who can turn a staircase into a border.',
    impact:
      'His tollkeepers charge fortunes to move food, medicine and refugees between floors.',
    encounter:
      'On a suspended freight lift, a man with no muzzle calmly adjusts gravity while porter crews demand the right to cross.',
    choices: {
      bargain: {
        label: 'Negotiate an open-lift charter',
        stat: 'wit',
        dc: 13,
        success:
          'Ilex stamps your charter. The porters race medicine downward as the toll bell falls silent.',
        failure:
          'He agrees to one trial shift and charges everyone else twice.',
        epilogue:
          'Your charter turns the freight lifts into public roads, although Ilex still owns the brakes.',
        revealLink: 'court-link-aveline-ilex',
      },
      expose: {
        label: 'Show the court his secret food treaty',
        stat: 'wit',
        dc: 15,
        success:
          'A forged famine schedule spills from his coat. The porters know exactly whom to confront.',
        failure:
          'The papers drift upward beyond your reach while the prince applauds politely.',
        epilogue:
          'The toll crews publish the secret treaty. The prince now descends by public stairs.',
        revealLink: 'court-link-ilex-vireo',
      },
      defy: {
        label: 'Cut the weight-chain from his belt',
        stat: 'spd',
        dc: 17,
        success:
          'The lift lands with a shout of freedom. Every chain in the shaft rings once.',
        failure: 'Gravity reverses and the party crashes against the roof.',
        epilogue:
          'You break his monopoly, leaving the whole vertical world to argue over who maintains the lifts.',
        revealLink: 'court-link-ilex-cauline',
      },
    },
    mythicEcho: 'Zeus / Janus',
    obsession:
      'He holds weekly trials to determine which floor should be the top floor. He has not chosen the same winner twice.',
    immortalTruth:
      'Every fatal fall turns into a landing on another stair he has invented. He can be trapped by a shared route but never killed.',
    immortal: true,
  },
  {
    id: 'serein',
    name: 'Lady Serein',
    epithet: 'Matron of Interest',
    pronouns: 'she/her',
    layer: 1,
    seat: 'The Flooded Exchange',
    power:
      'She lends years, unborn tomorrows and unrealised possibilities at compound interest. When she forecloses, yesterday itself changes to support the claim.',
    look: 'A visibly human-looking broad-shouldered adult woman with rich dark-brown skin, a short platinum buzz cut, sharp cheekbones and green lipstick; sea-glass rings and a severe oxblood tailored waistcoat.',
    voice: 'A patient lender who reads the small print in her own eulogies.',
    impact:
      'Her debt houses own water rights, crops and most orphanages below the flood line.',
    encounter:
      'A human-faced creditor counts the breaths of flood refugees at a glass-walled exchange. Everyone owes her a tomorrow.',
    choices: {
      bargain: {
        label: 'Refinance the flood ward’s water',
        stat: 'wit',
        dc: 13,
        success:
          'The compound interest becomes a shared public fund. Serein actually laughs.',
        failure:
          'The small print charges each household a year it has not lived yet.',
        epilogue:
          'You purchase the ward’s debts and forgive them. Serein calls it reckless; the market calls it liberation.',
        revealLink: 'court-link-serein-ilex',
      },
      expose: {
        label: 'Read her cancelled marriage contract',
        stat: 'wit',
        dc: 15,
        success:
          'The marriage and the debt were the same document. The court sees every signature.',
        failure:
          'Every signature turns into your own name. The refugees look away.',
        epilogue:
          'You reveal how marital titles became mortgages. The flood ward refuses its inherited bills.',
        revealLink: 'court-link-serein-ludo',
      },
      defy: {
        label: 'Destroy the hourglass collateral',
        stat: 'mag',
        dc: 17,
        success:
          'Years of stolen futures surge back into the refugees like warm rain.',
        failure:
          'The hourglass shatters into sharp debt slips that cut your party.',
        epilogue:
          'The future is no longer a security deposit. Serein begins collecting stories instead.',
        revealLink: 'court-link-serein-vireo',
      },
    },
    mythicEcho: 'Hades / Plutus',
    obsession:
      'She arranges disastrous weddings so she can refinance the annulments. She considers grief an improperly denominated asset.',
    immortalTruth:
      'When a god attempts to kill her, the universe simply records an outstanding balance and returns her at closing.',
    immortal: true,
  },
  {
    id: 'vireo',
    name: 'Lord Vireo',
    epithet: 'The Last Supper',
    pronouns: 'he/him',
    layer: 1,
    seat: 'The Cistern Banquets',
    power:
      'He creates abundance and scarcity by rewriting how much food a feast has ever contained. A spoiled dinner can become a famine across three floors.',
    look: 'A visibly human-looking stocky adult man with freckled pale copper skin, a tumble of short red curls, one gold tooth and violet under-eye shadow; stained emerald velvet jacket and a neon-pink chef sash.',
    voice:
      'A hospitable aristocrat who considers a famine a regrettable scheduling issue.',
    impact:
      'His dining houses supply food to the working caverns and blacklist every disobedient borough.',
    encounter:
      'A human-faced host invites starving mine workers to a banquet while insisting they admire the menu first.',
    choices: {
      bargain: {
        label: 'Demand rations before invitations',
        stat: 'wit',
        dc: 12,
        success:
          'The platters multiply and leave through the workers’ door. Vireo signs a public ration promise.',
        failure:
          'The food arrives after the mine shift ends. He asks for applause anyway.',
        epilogue:
          'Every feast now pays a community kitchen first. Vireo discovers admiration cannot be eaten.',
        revealLink: 'court-link-ilex-vireo',
      },
      expose: {
        label: 'Unseal the guest list of forbidden lovers',
        stat: 'wit',
        dc: 15,
        success:
          'Old court names spill across the table, including the duchess he insists is merely a cousin.',
        failure:
          'The cutlery points at you. Vireo calls the accusation tasteless.',
        epilogue:
          'Your testimony makes the royal banquet a hearing. The old family scandal finally breaks into daylight.',
        revealLink: 'court-link-aveline-vireo',
      },
      defy: {
        label: 'Feed the workers from his own plate',
        stat: 'mag',
        dc: 16,
        success:
          'Each slice shared with a worker grows another loaf. The feast escapes his control.',
        failure:
          'The food turns to ash before the first hungry child can taste it.',
        epilogue:
          'The banquet hall becomes a public pantry. Vireo is welcome only when he brings his own dish.',
        revealLink: 'court-link-ludo-vireo',
      },
    },
    mythicEcho: 'Dionysus / Ceres',
    obsession:
      'His immortality has reduced cuisine to novelty: he now serves meals that remember eating the diner.',
    immortalTruth:
      'Every poisoned feast merely restores him to the opening course. Hunger belongs to mortals, never to him.',
    immortal: true,
  },
  {
    id: 'cauline',
    name: 'Countess Cauline',
    epithet: 'Seamstress of the Hour',
    pronouns: 'she/her',
    layer: 2,
    seat: 'The Clockwork Tenements',
    power:
      'She cuts, folds and resews hours. Whole districts can live the same morning until they sign her contracts, while a stolen minute can age a building a century.',
    look: 'A visibly human-looking elderly short woman with olive-brown skin, dramatic silver curls, purple eyes behind round cracked spectacles and a black lace dress layered with luminous orange thread.',
    voice:
      'A weary grandmother who keeps time like a jealous seamstress keeps scissors.',
    impact:
      'She sells stolen work-hours as extra years to the upper floors and calls it tradition.',
    encounter:
      'A tiny human-faced countess mends a torn hour by hand while exhausted miners sleep standing up.',
    choices: {
      bargain: {
        label: 'Purchase one free hour for every miner',
        stat: 'wit',
        dc: 14,
        success:
          'Cauline stitches a minute into every shift. The machinery stops for the first proper break in years.',
        failure: 'She adds a holiday that arrives once a century.',
        epilogue:
          'The mines gain a daily hour of rest. Cauline finds herself unable to remember the original contract.',
        revealLink: 'court-link-cauline-vireo',
      },
      expose: {
        label: 'Unpick the century she stole',
        stat: 'wit',
        dc: 16,
        success:
          'An heirloom reveals a decade hidden in a child’s wedding dress. Cauline’s old revenge becomes public.',
        failure: 'Your witness forgets the hour before the hearing begins.',
        epilogue:
          'The stolen century returns to ordinary families. The countess has to live in linear time.',
        revealLink: 'court-link-ilex-cauline',
      },
      defy: {
        label: 'Break the clock that binds the tenants',
        stat: 'mag',
        dc: 18,
        success:
          'The clock stops. For an instant nobody works, dies or owes a thing.',
        failure:
          'It accelerates. Your party loses precious breath to the frantic gears.',
        epilogue:
          'You stop the counting machine, but the tenements must invent a fair schedule themselves.',
        revealLink: 'court-link-ludo-cauline',
      },
    },
    mythicEcho: 'Chronos / the Fates',
    obsession:
      'She holds endless retirement parties for people who have never been allowed to retire. She knows every outcome and remains offended by surprises.',
    immortalTruth:
      'She cannot reach her own final hour. Each time death approaches she unpicks the stitch and begins the day again.',
    immortal: true,
  },
  {
    id: 'ludo',
    name: 'Consort Ludo',
    epithet: 'Prince of False Faces',
    pronouns: 'they/them',
    layer: 2,
    seat: 'The Masked Broadcast',
    power:
      'They overwrite collective memory, and public history visibly rearranges itself to match the new performance. A false rumour can build a real monument overnight.',
    look: 'A visibly human-looking slender adult with medium-brown skin, long raven-black locs threaded with bright pink wire, violet eyeliner and a white asymmetrical punk tailcoat covered in broken mirror buttons.',
    voice:
      'A theatrical publicist who can rewrite a coronation as an embarrassing breakup.',
    impact:
      'Their gossip sheets turn court rivalries into propaganda and make dissidents vanish into punchlines.',
    encounter:
      'A tall human-faced performer broadcasts court gossip from a broken theatre. Masked audience members clap a beat too late.',
    choices: {
      bargain: {
        label: 'Make the working wards the headline',
        stat: 'wit',
        dc: 14,
        success:
          'Ludo gives the microphone to the liftworkers, and their voices fill every shaft.',
        failure:
          'The workers appear in the gossip sheets as comic villains. The applause continues.',
        epilogue:
          'The undercity gets its own independent broadcast. Ludo keeps sending unsolicited scripts.',
        revealLink: 'court-link-serein-ludo',
      },
      expose: {
        label: 'Reveal the family behind the false masks',
        stat: 'wit',
        dc: 16,
        success:
          'The masks fall, revealing an old adoption, a forged proposal, and one spectacular revenge plot.',
        failure:
          'Every mask displays your face. The crowd chants your name with the wrong story attached.',
        epilogue:
          'Their false court genealogy is published in full. The nobles spend a century arguing with the footnotes.',
        revealLink: 'court-link-ludo-aveline',
      },
      defy: {
        label: 'Pull the wire from the broadcast throne',
        stat: 'spd',
        dc: 17,
        success:
          'The stage lights burst into sparks and every borrowed voice returns to its owner.',
        failure:
          'The broadcast repeats your confession in the most humiliating possible voice.',
        epilogue:
          'The theatre becomes a meeting hall. Ludo watches from the back row, genuinely impressed.',
        revealLink: 'court-link-ludo-vireo',
      },
    },
    mythicEcho: 'Hermes / Dionysus',
    obsession:
      'They have staged their own assassination dozens of times, mostly to complain about the audience reaction.',
    immortalTruth:
      'Killing the performer only brings them back at the curtain call wearing a more elaborate costume.',
    immortal: true,
  },
  {
    id: 'astraea',
    name: 'Magistrate Astraea',
    epithet: 'Justice Before the Crime',
    pronouns: 'she/her',
    layer: 0,
    seat: 'The Tribunal of Uncommitted Acts',
    mythicEcho: 'Athena / Nemesis',
    immortal: true,
    power:
      'She reverses cause and verdict. A guilty sentence can summon the crime into existence, and an acquittal can undo a ruin that already happened.',
    look: 'A visibly human-looking adult Black woman with cropped silver hair, storm-grey eyes and a square athletic build, wearing a pearl-white barrister coat with electric orange stitching, an asymmetrical bronze collar and enormous cracked marble earrings.',
    voice:
      'A mercilessly logical judge who cannot forgive anyone, especially herself.',
    impact:
      'Her predictive courts imprison animal-folk workers for rebellions they have not yet attempted.',
    obsession:
      'She conducts the same perfect trial every century, changing one variable each time; the accused have never survived to tell her that perfection is the problem.',
    immortalTruth:
      'Execution only creates a precedent for her return. Each death is appealed to an earlier version of the trial and overturned.',
    encounter:
      'In the tribunal, a distinctly human-faced magistrate reads the verdict before calling witnesses. A miner is awaiting sentence for a protest scheduled next week.',
    choices: {
      bargain: {
        label: 'Negotiate a moratorium on future crimes',
        stat: 'wit',
        dc: 13,
        success:
          'Astraea signs a stay of sentence. The miner walks out before the crime can be invented.',
        failure:
          'The court postpones the trial until after the punishment; the guards call it progress.',
        epilogue:
          'You bind her courts to evidence from the present. She is furious at the novelty.',
        revealLink: 'court-link-astraea-aveline',
      },
      expose: {
        label: 'Show her the forged first verdict',
        stat: 'wit',
        dc: 16,
        success:
          'The earliest sentence carries Aveline’s handwriting. Every court clock stutters.',
        failure:
          'The record rewrites itself with your signature, and the bailiff demands an explanation.',
        epilogue:
          'You expose the first trial as a family prank. The undercity tears down the future-prisons.',
        revealLink: 'court-link-astraea-ilex',
      },
      defy: {
        label: 'Refuse the trial and defend the miner',
        stat: 'def',
        dc: 17,
        success:
          'Astraea declares you guilty of courage, then discovers no penalty for it exists.',
        failure:
          'The courtroom folds into a cell; you force open its door with bruised hands.',
        epilogue:
          'You make her hear an unpredicted verdict: the people judge their judge.',
        revealLink: 'court-link-astraea-marsyn',
      },
    },
  },
  {
    id: 'marsyn',
    name: 'General Marsyn',
    epithet: 'The War Nobody Won',
    pronouns: 'he/him',
    layer: 0,
    seat: 'The Parade Ground Without an Exit',
    mythicEcho: 'Ares / Mars',
    immortal: true,
    power:
      'He turns disputes into literal battlefields. An angry word becomes a sword, a workplace grievance becomes a siege and a ceasefire can erase the trenches overnight.',
    look: 'A visibly human-looking older man with olive-brown skin, a scarred face, short salt-and-pepper beard, pale green eyes and a barrel chest; red leather bomber jacket covered in toy medals and a gold laurel crown spray-painted black.',
    voice:
      'A genial commander who treats a mass evacuation as an exciting new sport.',
    impact:
      'He recruits the unemployed into theatrical wars with real injuries and gives their families commemorative ribbons.',
    obsession:
      'He is so bored by immortality he has begun ranking wars by costume design. He would trade a kingdom for one honest surprise.',
    immortalTruth:
      'No wound lasts; his body rebuilds with the next drumbeat. Only a peace agreement made without him can silence the drums.',
    encounter:
      'At a crowded barracks, a strangely human-looking general turns an argument about wages into rows of spears that grow from the floor. The workers are terrified.',
    choices: {
      bargain: {
        label: 'Propose an armistice lottery',
        stat: 'wit',
        dc: 12,
        success:
          'Marsyn agrees to a contest of songs and the spears turn into microphones.',
        failure:
          'He calls the lottery a declaration of war and orders a very festive mobilisation.',
        epilogue:
          'Your peace treaty becomes the general’s most popular annual event. It contains no battles.',
        revealLink: 'court-link-marsyn-ilex',
      },
      expose: {
        label: 'Reveal who profits from his wars',
        stat: 'wit',
        dc: 15,
        success:
          'The quartermaster ledger shows Vireo feeding both armies while the general poses for portraits.',
        failure:
          'Marsyn awards you a medal for enemy propaganda and charges admission to the hearing.',
        epilogue:
          'The war industry loses its myth. Marsyn has to ask why nobody wishes to enlist.',
        revealLink: 'court-link-marsyn-vireo',
      },
      defy: {
        label: 'Walk calmly across his battlefield',
        stat: 'spd',
        dc: 17,
        success:
          'Each weapon becomes a flower as the crowd refuses to applaud. Marsyn looks almost frightened.',
        failure:
          'The floor erupts into a trench, and your party scrambles to climb out.',
        epilogue:
          'You end a war by declining to fight it. The general spends an era trying to understand.',
        revealLink: 'court-link-astraea-marsyn',
      },
    },
  },
  {
    id: 'nerion',
    name: 'Duke Nerion',
    epithet: 'Lord of the Second Sea',
    pronouns: 'he/him',
    layer: 1,
    seat: 'The Balcony of Reversed Tides',
    mythicEcho: 'Poseidon / Neptune',
    immortal: true,
    power:
      'He redraws coastlines and the direction of water. With a sulk he can make a waterfall run uphill, place an ocean in a drinking glass or flood an entire legal district.',
    look: 'A visibly human-looking middle-aged man with tawny skin, long wavy silver-grey hair, broad shoulders, dark blue eyes and silver tide-lines tattooed across his neck, in a tailored indigo coat with tarnished nautical epaulettes.',
    voice:
      'A wounded romantic who confuses municipal flood control with emotional honesty.',
    impact:
      'He moves the waterline whenever an ex-lover visits, and entire market wards must move with it.',
    obsession:
      'He keeps recreating the exact tide of his first disastrous honeymoon and cannot understand why the guests have stopped coming.',
    immortalTruth:
      'He drowns nightly and steps back out of the next wave. His titles can be taken, but he cannot sink forever.',
    encounter:
      'A human-faced duke stands on an indoor balcony while water climbs upward around the flood ward. He demands that the market apologise for being downstream.',
    choices: {
      bargain: {
        label: 'Arrange a fair tide schedule',
        stat: 'wit',
        dc: 13,
        success:
          'The waves settle into predictable hours, and the barge market gets a day without alarms.',
        failure:
          'Nerion promises reasonable tides but defines “reasonable” as whatever reminds him of love.',
        epilogue:
          'The waters obey a public tide clock instead of the duke’s moods. He buys a wristwatch.',
        revealLink: 'court-link-nerion-serein',
      },
      expose: {
        label: 'Read the waterlogged divorce charter',
        stat: 'wit',
        dc: 16,
        success:
          'The contract reveals that a creditor sold Nerion his own ocean three times.',
        failure:
          'The ink swims off the page and joins a cloud above your heads.',
        epilogue:
          'You expose the ocean mortgage. The flood wards claim their water as a commons.',
        revealLink: 'court-link-nerion-ilex',
      },
      defy: {
        label: 'Redirect his rising waterfall',
        stat: 'mag',
        dc: 18,
        success:
          'The waterfall freezes sideways, letting the market escape while Nerion stares at the new horizon.',
        failure: 'A reverse current slams the party against a railing.',
        epilogue:
          'You prove water can choose another path. He spends the next century following its example.',
        revealLink: 'court-link-nerion-caldera',
      },
    },
  },
  {
    id: 'veloura',
    name: 'Lady Veloura',
    epithet: 'The People’s Beloved',
    pronouns: 'she/her',
    layer: 1,
    seat: 'The Cathedral of Applause',
    mythicEcho: 'Aphrodite / Venus',
    immortal: true,
    power:
      'She can rewrite what a crowd calls beautiful, shameful or worthy of devotion. Statues change faces overnight and beloved institutions crumble when she withdraws admiration.',
    look: 'A visibly human-looking curvy adult woman with freckled pale skin, rose-pink tightly curled hair, dark violet eyes, a gap-toothed smile and an iridescent magenta evening jacket over a punk lace gown, wearing chipped silver bangles.',
    voice:
      'A heartbreakingly charming socialite who collects admirers but has never listened to one.',
    impact:
      'Her prestige magic decides which neighbourhoods receive charity, whose testimony is believed and which working families are fashionable enough to help.',
    obsession:
      'She has staged seven thousand breakups, each to see whether the next reconciliation can earn a more sincere standing ovation.',
    immortalTruth:
      'When torn from every portrait she appears in the next mirror. She has never experienced rejection that lasted longer than a century.',
    encounter:
      'At a concert hall turned food bank, a human-faced goddess changes the audience’s taste in a blink. The workers’ families are suddenly invisible to everyone in the queue.',
    choices: {
      bargain: {
        label: 'Make the workers the guests of honour',
        stat: 'wit',
        dc: 13,
        success:
          'Veloura crowns the soup-kitchen cooks. Donations arrive faster than gossip.',
        failure:
          'She makes the workers a fashionable cause for an afternoon, then forgets their names.',
        epilogue:
          'You convince the goddess to share attention instead of hoarding it. The food bank survives the season.',
        revealLink: 'court-link-veloura-vireo',
      },
      expose: {
        label: 'Unmask her manufactured love letters',
        stat: 'wit',
        dc: 16,
        success:
          'Ludo’s ink is visible beneath every supposedly spontaneous declaration. The hall gasps.',
        failure:
          'Your testimony is transformed into an advertisement for her next gala.',
        epilogue:
          'The court learns its great romances were sold as sponsorship packages. Veloura has to write her own apology.',
        revealLink: 'court-link-veloura-ludo',
      },
      defy: {
        label: 'Praise the people she erased',
        stat: 'mag',
        dc: 17,
        success:
          'The enchanted crowd remembers the workers, and no glamour can make them look away again.',
        failure:
          'The applause swells until your words disappear underneath it.',
        epilogue:
          'You break her monopoly on admiration. She learns that affection cannot be collected like tax.',
        revealLink: 'court-link-veloura-astraea',
      },
    },
  },
  {
    id: 'caldera',
    name: 'Foundry Saint Caldera',
    epithet: 'Keeper of the Last Spark',
    pronouns: 'they/them',
    layer: 2,
    seat: 'The Furnace Without Fuel',
    mythicEcho: 'Hephaestus / Vulcan / Hestia',
    immortal: true,
    power:
      'They rewrite the rules of heat and matter. Ice can forge iron, warm homes can freeze in summer, and a broken machine can become a law that cannot be disobeyed.',
    look: 'A visibly human-looking stocky nonbinary adult with deep mahogany skin, a shaved head, one brass prosthetic arm, copper eye makeup, heavy soot-smudged workwear and an elaborate necklace of tiny glowing furnace keys.',
    voice:
      'A brilliant inventor who mistakes other people’s survival for product testing.',
    impact:
      'They sell miracles of warmth to furnace owners while the tenants who built the machines shiver below.',
    obsession:
      'They have spent ten thousand years building the perfect hearth and deliberately dismantling it after each compliment.',
    immortalTruth:
      'Their body can be forged anew from ash, steam or a nail. Death merely gives them an excuse to redesign the replacement.',
    encounter:
      'In the heatworks, a human-faced foundry saint turns a white-hot forge into ice while miners plead for heat in their homes.',
    choices: {
      bargain: {
        label: 'License a free hearth for each household',
        stat: 'wit',
        dc: 14,
        success:
          'Caldera signs a public furnace charter. The tenements glow with honest warmth.',
        failure:
          'The free hearths require a proprietary fuel only Caldera can sell.',
        epilogue:
          'You put heat itself into the commons, and the saint must invent something people truly want.',
        revealLink: 'court-link-caldera-cauline',
      },
      expose: {
        label: 'Show the forged machine ownership deeds',
        stat: 'wit',
        dc: 16,
        success:
          'Each patent bears the name of a worker erased by the court. The saint drops their wrench.',
        failure:
          'The contracts reassemble into a flattering statue of their creator.',
        epilogue:
          'The workers reclaim their inventions. Caldera grudgingly signs their names in molten brass.',
        revealLink: 'court-link-caldera-marsyn',
      },
      defy: {
        label: 'Rekindle the furnace against their will',
        stat: 'mag',
        dc: 18,
        success:
          'The cold flame burns blue, heating every home instead of the palace.',
        failure:
          'The fire leaps into the roof beams and the party staggers back from the heat.',
        epilogue:
          'You teach the immortal inventor that a hearth is successful only when people can sit beside it.',
        revealLink: 'court-link-caldera-nysa',
      },
    },
  },
  {
    id: 'nysa',
    name: 'Duchess Nysa',
    epithet: 'The Spring That Won’t End',
    pronouns: 'she/her',
    layer: 2,
    seat: 'The Orchard of Borrowed Seasons',
    mythicEcho: 'Persephone / Proserpina / Demeter',
    immortal: true,
    power:
      'She can make a season last a millennium, grow a forest through solid stone, or rewind a field from harvest to seed. Every return of spring revives old arguments alongside the flowers.',
    look: 'A visibly human-looking adult woman with copper-brown skin, thick black braids threaded with living white flowers, a small gap between her front teeth, a plump build and a moss-green velvet gown over worn combat boots.',
    voice:
      'A tender gardener who believes everything must bloom, including grief and old relationships.',
    impact:
      'Her eternal spring destroys tenements and vineyards as steadily as any army; farmers are punished for wanting winter or rest.',
    obsession:
      'She restages the same family reunion every equinox, rewinding the guests until somebody says exactly what she hoped to hear.',
    immortalTruth:
      'Every death becomes another season of her life. She can suffer and mourn, but no winter can finish her.',
    encounter:
      'In the deep root gardens, a human-faced duchess sings to vines that are breaking through a workers’ neighbourhood. She calls the disaster a family blessing.',
    choices: {
      bargain: {
        label: 'Agree on a shared calendar of seasons',
        stat: 'wit',
        dc: 14,
        success:
          'Nysa allows one real winter. The gardens sleep peacefully and the families repair their homes.',
        failure:
          'She permits winter for exactly one heartbeat before spring returns.',
        epilogue:
          'You give the world seasons again, including the right to fallow fields and grieving hearts.',
        revealLink: 'court-link-nysa-vireo',
      },
      expose: {
        label: 'Reveal the reunion that caused the overgrowth',
        stat: 'wit',
        dc: 16,
        success:
          'The family record shows Nysa imprisoned her former spouse inside the first greenhouse.',
        failure:
          'She rewinds the accusation until everyone remembers complimenting her garden.',
        epilogue:
          'The court learns how the eternal spring began. Nysa has to hear that love can include departure.',
        revealLink: 'court-link-nysa-serein',
      },
      defy: {
        label: 'Let the roots choose where to grow',
        stat: 'mag',
        dc: 18,
        success:
          'The vines turn from houses toward open stone. The goddess gasps at a garden that says no.',
        failure:
          'Roots coil around the party’s boots, and the floor cracks beneath them.',
        epilogue:
          'You persuade the deep gardens to grow wild beyond her ownership. Nysa visits, but no longer commands.',
        revealLink: 'court-link-caldera-nysa',
      },
    },
  },
]

export const COURT_LINKS: CourtRelation[] = [
  {
    id: 'court-link-aveline-ilex',
    from: 'aveline',
    to: 'ilex',
    kind: 'kinship',
    label: 'Half-siblings / shared crown',
    detail:
      'Aveline holds the names; Ilex holds the stairs. Their treaty divided power before anyone else could vote.',
  },
  {
    id: 'court-link-aveline-vireo',
    from: 'aveline',
    to: 'vireo',
    kind: 'affair',
    label: 'Cousins / secret former affair',
    detail:
      'The cousins’ youthful affair was formally erased from the registry, then revived by a leaked banquet guest list.',
  },
  {
    id: 'court-link-aveline-serein',
    from: 'aveline',
    to: 'serein',
    kind: 'grudge',
    label: 'Enemy of the census',
    detail:
      'Aveline erased debtors’ names; Serein kept charging their descendants. Each blames the other for a century of revolt.',
  },
  {
    id: 'court-link-serein-ilex',
    from: 'serein',
    to: 'ilex',
    kind: 'breakup',
    label: 'Annulled marriage',
    detail:
      'Their wedding contract secretly transferred lift tolls as collateral. The divorce failed to unwind the debt.',
  },
  {
    id: 'court-link-serein-ludo',
    from: 'serein',
    to: 'ludo',
    kind: 'former',
    label: 'Ex-lovers / leaking letters',
    detail:
      'Ludo once courted Serein for the love letters; she still knows the names behind their masks.',
  },
  {
    id: 'court-link-serein-vireo',
    from: 'serein',
    to: 'vireo',
    kind: 'plot',
    label: 'Secret dinner alliance',
    detail:
      'Food loans and compound interest made famine profitable to both households.',
  },
  {
    id: 'court-link-ilex-vireo',
    from: 'ilex',
    to: 'vireo',
    kind: 'scheme',
    label: 'Food-lift monopoly',
    detail:
      'Ilex limits which floors food can reach; Vireo controls the cargo that goes up and down.',
  },
  {
    id: 'court-link-ilex-cauline',
    from: 'ilex',
    to: 'cauline',
    kind: 'revenge',
    label: 'Stolen century',
    detail:
      'Cauline held back a century of Ilex’s inheritance, and he built the toll lifts to punish the clock districts.',
  },
  {
    id: 'court-link-cauline-vireo',
    from: 'cauline',
    to: 'vireo',
    kind: 'kinship',
    label: 'Estranged mother and heir',
    detail:
      'Vireo learned his public generosity from his mother, and his willingness to starve a ward from her silences.',
  },
  {
    id: 'court-link-ludo-cauline',
    from: 'ludo',
    to: 'cauline',
    kind: 'kinship',
    label: 'Adopted ward / forged birth',
    detail:
      'Cauline adopted Ludo after a scandal; their birth certificate was written by Aveline three times.',
  },
  {
    id: 'court-link-ludo-vireo',
    from: 'ludo',
    to: 'vireo',
    kind: 'grudge',
    label: 'Poisoned anniversary feast',
    detail:
      'Ludo sabotaged the chef’s great anniversary broadcast to avenge Serein’s humiliation.',
  },
  {
    id: 'court-link-ludo-aveline',
    from: 'ludo',
    to: 'aveline',
    kind: 'plot',
    label: 'Fake engagement',
    detail:
      'Ludo and Aveline staged an engagement to humiliate Ilex; the court still cannot agree whether either meant it.',
  },
  {
    id: 'court-link-astraea-aveline',
    from: 'astraea',
    to: 'aveline',
    kind: 'kinship',
    label: 'A daughter written into law',
    detail:
      'Aveline insists Astraea was born from a noble marriage. The only birth certificate is an injunction signed by her own mother.',
  },
  {
    id: 'court-link-astraea-ilex',
    from: 'astraea',
    to: 'ilex',
    kind: 'plot',
    label: 'The case that invented a father',
    detail:
      'Ilex hired Astraea to prove that the judge could be her own parent. Her verdict created a new inheritance dispute.',
  },
  {
    id: 'court-link-astraea-marsyn',
    from: 'astraea',
    to: 'marsyn',
    kind: 'breakup',
    label: 'The eight-hundredth divorce',
    detail:
      'Astraea and Marsyn married to end a war. They have annulled and remarried eight hundred times as the war keeps rewriting its opening day.',
  },
  {
    id: 'court-link-marsyn-ilex',
    from: 'marsyn',
    to: 'ilex',
    kind: 'kinship',
    label: 'Son of a discarded victory',
    detail:
      'Ilex calls Marsyn his son; Marsyn insists he was born from the first war the prince lost. Both accounts are legally valid.',
  },
  {
    id: 'court-link-marsyn-vireo',
    from: 'marsyn',
    to: 'vireo',
    kind: 'scheme',
    label: 'The feast after every war',
    detail:
      'Vireo sells victory banquets to both sides while Marsyn keeps the fighting just interesting enough to renew the catering contract.',
  },
  {
    id: 'court-link-marsyn-ludo',
    from: 'marsyn',
    to: 'ludo',
    kind: 'plot',
    label: 'Publicity for an unwinnable war',
    detail:
      'Ludo edits defeat into heroic triumph so Marsyn can stage endless sequels. The families of the fallen remember otherwise.',
  },
  {
    id: 'court-link-nerion-serein',
    from: 'nerion',
    to: 'serein',
    kind: 'breakup',
    label: 'The ocean in the divorce',
    detail:
      'Serein and Nerion were briefly married. She won the ocean as collateral, then rented him the right to call himself its lord.',
  },
  {
    id: 'court-link-nerion-ilex',
    from: 'nerion',
    to: 'ilex',
    kind: 'grudge',
    label: 'Stairway versus coastline',
    detail:
      'Ilex claims the right to turn oceans into stairs. Nerion has flooded four elevators to prove his paperwork irrelevant.',
  },
  {
    id: 'court-link-nerion-caldera',
    from: 'nerion',
    to: 'caldera',
    kind: 'affair',
    label: 'A fire beneath the sea',
    detail:
      'Nerion and Caldera kept a secret affair by warming a private underwater city. Its residents are still paying the power bill.',
  },
  {
    id: 'court-link-nerion-nysa',
    from: 'nerion',
    to: 'nysa',
    kind: 'revenge',
    label: 'The drowned wedding garden',
    detail:
      'Nerion drowned Nysa’s bridal greenhouse after being omitted from the ceremony. Each spring she grows it back through his palace.',
  },
  {
    id: 'court-link-veloura-ludo',
    from: 'veloura',
    to: 'ludo',
    kind: 'kinship',
    label: 'Mirror-born siblings',
    detail:
      'Veloura and Ludo claim they are twins born from the same enchanted dressing-room mirror. Neither will say which one stepped out first.',
  },
  {
    id: 'court-link-veloura-vireo',
    from: 'veloura',
    to: 'vireo',
    kind: 'affair',
    label: 'The lover with a menu',
    detail:
      'Veloura and Vireo stage romantic banquets for one another while charging poor families to watch the rehearsals.',
  },
  {
    id: 'court-link-veloura-aveline',
    from: 'veloura',
    to: 'aveline',
    kind: 'plot',
    label: 'A marriage registered before meeting',
    detail:
      'Aveline filed a royal marriage between Veloura and a complete stranger to test whether admiration could manufacture a happy ending.',
  },
  {
    id: 'court-link-veloura-astraea',
    from: 'veloura',
    to: 'astraea',
    kind: 'grudge',
    label: 'Trial of public affection',
    detail:
      'Astraea prosecuted Veloura for altering a jury’s adoration. Veloura won by making the judge admire the word guilty.',
  },
  {
    id: 'court-link-caldera-cauline',
    from: 'caldera',
    to: 'cauline',
    kind: 'scheme',
    label: 'The stolen shift-hours',
    detail:
      'Cauline lends frozen hours to Caldera’s factories. The workers get paid for the minutes before the clocks start ticking.',
  },
  {
    id: 'court-link-caldera-marsyn',
    from: 'caldera',
    to: 'marsyn',
    kind: 'grudge',
    label: 'A weapon nobody ordered',
    detail:
      'Caldera built Marsyn an engine that turns threats into weapons. Marsyn refuses to return it because there is no warranty for divine war.',
  },
  {
    id: 'court-link-caldera-nysa',
    from: 'caldera',
    to: 'nysa',
    kind: 'former',
    label: 'An ex-spouse of every season',
    detail:
      'Caldera once married Nysa in a wedding that occurred in every season at once. Their breakup caused the first winter in the heatworks.',
  },
  {
    id: 'court-link-nysa-vireo',
    from: 'nysa',
    to: 'vireo',
    kind: 'kinship',
    label: 'The sibling whose harvest is missing',
    detail:
      'Nysa and Vireo are siblings; she grows food and he monopolises the feast. Their rivalry is the oldest famine in the undercity.',
  },
  {
    id: 'court-link-nysa-serein',
    from: 'nysa',
    to: 'serein',
    kind: 'revenge',
    label: 'Mortgage on the spring',
    detail:
      'Serein sold Nysa an eternal spring, then charged interest on every harvest. Nysa has spent centuries growing through the debt office.',
  },
  {
    id: 'court-link-nysa-ludo',
    from: 'nysa',
    to: 'ludo',
    kind: 'plot',
    label: 'The family reunion loop',
    detail:
      'Ludo writes a happier family reunion each year. Nysa rewinds reality until the entire court delivers the dialogue correctly.',
  },
]

export const COURT_CHOICE_KEYS: CourtChoiceKey[] = ['bargain', 'expose', 'defy']

export function courtDeity(id: string): CourtDeity | undefined {
  return COURT_DEITIES.find((deity) => deity.id === id)
}

export const COURT_EVENTS: EventDef[] = COURT_DEITIES.map(
  (deity): EventDef => ({
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
  }),
)
