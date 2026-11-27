import type { PersonalCampaign } from './personalAccidentCampaigns'

export const PSYCHIC_CAMPAIGNS: Record<string, PersonalCampaign> = {
  'psychic-fire': {
    chapters: [
      [
        'The extinguisher by the bed',
        'Firekeeper directs the students away from the smoke while a friend helps her steady her breathing.',
        'The shutter recorder reveals that the academy deleted an earlier report of unsafe fire training.',
        'The squad claims the extinguisher stores and decides who may enter the cleared corridor.',
      ],
      [
        'A controlled flame',
        'Researchers help Firekeeper practice a safe cutoff before carrying the burned volunteers from the laboratory.',
        'The lab records show a sponsor pressured her to demonstrate powers without adequate support.',
        'The squad retains the experimental equipment and demands an unrestricted training area.',
      ],
      [
        'The sparks at the crossing',
        'Medics clear a route while Firekeeper redirects the heat away from the trapped passengers.',
        "The transit logs identify the contractor who disabled the crossing's fire alarms.",
        'The squad threatens to close the crossing whenever its orders are ignored.',
      ],
      [
        'A warning without panic',
        "The engineer broadcasts the warning while Firekeeper accepts a friend's offer to stay beside her.",
        'The rooftop recording preserves the report describing the unsafe demonstrations the sponsor concealed.',
        'The squad broadcasts its fury and makes the officials answer to it.',
      ],
      [
        'The furnace of remembered dreams',
        'Workers lead Firekeeper out of the overheating tunnel before she exhausts herself; the rescue continues without her.',
        'The buried files establish who ignored the early warnings about her training conditions.',
        'The squad takes control of the furnace and denies the researchers a way to shut it down.',
      ],
      [
        'The last candle',
        'Firekeeper keeps a small guiding flame steady while the ballroom guests find the exit.',
        'The prom audience hears testimony about the training failures instead of blaming the student who struggled.',
        "The squad holds the ballroom hostage to its leader's anger.",
      ],
    ],
    endings: [
      'Firekeeper develops control with trusted friends and professional support, without treating fear or shame as a training method.',
      "The hidden reports bring the academy's unsafe training practices into public scrutiny.",
      'The guests escape, but Firekeeper still sleeps beside the extinguisher and needs time to feel safe.',
      'Firekeeper lets the city feel the force of her rage. A friend who used to help her asks whether they can still approach.',
    ],
  },
  'psychic-air': {
    chapters: [
      [
        'The stairwell opens',
        'Weightless levitates a damaged beam while students decide how to carry the injured down to the ground.',
        'The shutter archive contains a disciplinary report punishing their private levitation practice.',
        'The squad takes the upper walkway and claims the right to close the stairs.',
      ],
      [
        'Learning to land',
        'Researchers help Weightless guide the unstable equipment into a safe landing zone.',
        "The lab's test logs expose a sponsor's decision to remove emergency catches from its equipment.",
        'The squad claims the lift controls and demands access to the laboratory.',
      ],
      [
        'A crossing without a fall',
        'Medics secure the passengers before Weightless lifts the broken crossing clear of the road.',
        'The transit archive reveals that the city ignored repeated warnings about the elevated platform.',
        'The squad closes the bridge and keeps the stranded travelers waiting for its permission.',
      ],
      [
        'The public flight',
        'The engineer broadcasts the warning while Weightless flies openly above the roof to guide the rescuers.',
        "The rooftop footage preserves the maintenance inspector's suppressed report about the platform.",
        'The squad takes control of the aerial route and threatens to withdraw its support.',
      ],
      [
        'The weight of the city',
        'Workers secure the machinery together while Weightless lowers it onto a stable floor.',
        'The buried archive reveals the unsafe gravity experiments that caused the tunnel failure.',
        'The squad retains the gravity controls and makes the rescue crews dependent on them.',
      ],
      [
        'The ballroom above the street',
        'Weightless helps the last guests cross the balcony, offering an ordinary staircase as well as a lifted route.',
        "The prom audience receives the original structural reports rather than the sponsor's assurances.",
        'The squad suspends the ballroom platform and requires officials to submit to its demands.',
      ],
    ],
    endings: [
      'Weightless tells their parents the truth and flies in daylight, leaving room for the family to ask questions.',
      'The original safety reports trigger an independent investigation of the elevated routes.',
      'The guests escape, but Weightless still has a conversation waiting at the apartment stairwell.',
      'Weightless teaches the city what falling feels like. The people who used to wave from the pavement now watch the sky in fear.',
    ],
  },
  'psychic-earth': {
    chapters: [
      [
        'The stone beneath the school',
        'Groundtruth listens to a fallen cornerstone and finds the route the trapped students used moments before.',
        "The recovered stone carries a memory of the official who ordered the academy's safety report buried.",
        'The squad retains the cornerstone and refuses to disclose what it remembers.',
      ],
      [
        'The borrowed foundation',
        'Researchers evacuate with samples whose histories Groundtruth helps them document instead of destroying them.',
        "The lab's provenance records link a foundation sample to the hidden crime at city hall.",
        "The squad takes the samples as leverage against the city's founders.",
      ],
      [
        'Footprints in the paving',
        'Medics follow the evacuation trail revealed by the broken paving stones.',
        "The crossing's original masonry preserves testimony that contradicts the official account of the city's founding.",
        'The squad claims the road and demands payment from the descendants of the founders.',
      ],
      [
        'A witness made of stone',
        "The engineer broadcasts Groundtruth's account alongside independent testimony from the people who can corroborate it.",
        'The rooftop transmitter preserves a recording of the suppressed city hall archive.',
        'The squad demands that the city accept its account without independent examination.',
      ],
      [
        "The cornerstone's companion",
        'Workers help Groundtruth retrieve a matching foundation stone from the failing tunnel before it is lost.',
        'The buried building records establish who erased the original occupants from the municipal record.',
        'The squad seals the evidence chamber and reserves the truth for its own negotiations.',
      ],
      [
        'The dance on borrowed ground',
        "Groundtruth helps the guests escape while preserving the damaged foundation for the city's investigators.",
        'The ballroom witnesses hear testimony from the descendants whose histories were erased.',
        'The squad demands a public oath of atonement before it releases the academy.',
      ],
    ],
    endings: [
      'Groundtruth reveals the city hall crime in public and works with the people whose histories the foundation concealed.',
      "The stone's evidence is corroborated by recovered records, allowing the city to confront its founding honestly.",
      'The ballroom is safe, but the city has yet to hear the complete history of its cornerstone.',
      "Groundtruth makes the city's foundations shake. Survivors demand a say in the rebuilding rather than another judgment from above.",
    ],
  },
  'psychic-water': {
    chapters: [
      [
        'The tide inside the room',
        "Calm Waters asks a friend to take over the rescue when the trapped students' fear becomes overwhelming.",
        'The shutter logs show the sponsor exploited his emotional responses during a previous exercise.',
        "The squad makes the students feel its leader's certainty rather than asking for their trust.",
      ],
      [
        'A boundary at the laboratory',
        'Researchers establish a quiet refuge for Calm Waters before he redirects the flood away from the damaged equipment.',
        "The lab archive contains an unauthorized record of his family's private emotional history.",
        'The squad retains the emotional-monitoring equipment and demands control over its subjects.',
      ],
      [
        'A crossing with dry ground',
        'Medics give passengers space to recover while Calm Waters redirects the rising tide without absorbing every distress call.',
        "The crossing logs reveal the sponsor's attempt to use public anxiety to justify a dangerous diversion.",
        "The squad amplifies the crowd's fear and orders it to obey.",
      ],
      [
        'The weather report from home',
        "The engineer broadcasts the warning while Calm Waters disconnects from the listeners' emotions.",
        'The rooftop archive preserves the research on compulsory emotional synchronization.',
        'The squad sends a shared wave of grief across the district and calls the response agreement.',
      ],
      [
        'The lighthouse foundation',
        'Workers help Calm Waters drain the failing chamber, then take the controls while he rests.',
        "The buried archive records the experiment that used his mother's tides without her knowledge.",
        'The squad claims the flood controls and demands that the city share its distress.',
      ],
      [
        'A dance with breathing room',
        'Calm Waters helps the ballroom volunteers establish a quiet refuge where no one has to explain how they feel.',
        "The prom witnesses receive the records of the sponsor's nonconsensual emotional trials.",
        "The squad insists that the guests experience its leader's grief before leaving.",
      ],
    ],
    endings: [
      'Calm Waters sets boundaries around his empathy and chooses when to help, trusting other people to share the burden.',
      'The recovered research exposes the unauthorized emotional trials and returns private records to their subjects.',
      'The ballroom is safe, but Calm Waters still needs distance from the lighthouse and its painful memories.',
      'Calm Waters makes the city feel his grief. Even people who love him can no longer tell where their feelings begin.',
    ],
  },
  'psychic-discipline': {
    chapters: [
      [
        'Stillness before the bell',
        "The Librarian anticipates the shutter's next movement and teaches the students a safe moment to cross.",
        "The archive reveals an unauthorized sponsor's copy of her secret school's first lesson.",
        'The squad keeps the copied training record and denies the students access.',
      ],
      [
        'The stolen lesson',
        "Researchers leave the laboratory after The Librarian guides them through the panicked security team's movements.",
        "The lab's training contracts show that the school's technique was sold without its teachers' consent.",
        'The squad takes the training library and reserves its lessons for loyal recruits.',
      ],
      [
        'A pause at the crossing',
        "Medics wait for a safe opening The Librarian identifies, then adapt the movement to the passengers' needs.",
        "The transit records reveal that private guards used the school's methods to obstruct a public evacuation.",
        "The squad uses the guards' formation to control entry to the crossing.",
      ],
      [
        'A lesson over the radio',
        'The engineer broadcasts the warning while The Librarian explains how ordinary people can recognize an opening to safety.',
        "The rooftop archive contains the private security company's copied instruction manuals.",
        'The squad advertises an exclusive discipline program for its own officials.',
      ],
      [
        'The library beneath the library',
        "Workers recover the school's original books from the tunnel before securing the damaged passage.",
        'The buried documents identify the patron who tried to make the secret school a private enforcement unit.',
        'The squad takes the books and restricts access to the techniques.',
      ],
      [
        'The open reading room',
        'The Librarian teaches the ballroom volunteers how to coordinate the last evacuation without requiring a pledge.',
        "The prom witnesses see the original lesson records and the sponsor's unauthorized copies.",
        'The squad demands that the academy recognize its monopoly over mental martial arts.',
      ],
    ],
    endings: [
      'The Librarian reopens her school in the public library, where anyone can learn and anyone can leave.',
      'The teachers recover control of their original records and the copied contracts face public review.',
      'The guests escape, but several displaced teachers still need a safe place to reopen their classes.',
      'The Librarian takes what she wants without being touched. The reading room she once loved is locked to everyone else.',
    ],
  },
  'psychic-genius': {
    chapters: [
      [
        'The answer nobody gave him',
        'Mindsight asks the trapped students for their own observations instead of taking the answers from their minds.',
        'The shutter records expose an exam-monitoring sponsor that secretly sampled student thoughts.',
        "The squad takes the sponsor's archive and keeps the students' private answers.",
      ],
      [
        'A test without borrowed thoughts',
        'Researchers evacuate with their notes after Mindsight demonstrates a rescue plan he worked out independently.',
        'The lab archive contains the records of stolen research and unauthorized telepathic examinations.',
        "The squad takes the research data and demands access to every scientist's conclusions.",
      ],
      [
        'A witness at the crossing',
        'Medics tell Mindsight what they need rather than having him infer it from frightened passengers.',
        "The transit logs reveal a contractor's manipulation of testimony taken during an earlier evacuation.",
        'The squad decides whose account is true without allowing the witnesses to speak.',
      ],
      [
        'The confession on air',
        'The engineer broadcasts the warning and Mindsight admits that he used powers to cheat at school.',
        'The rooftop archive establishes which officials profited from unauthorized mental examinations.',
        'The squad publishes its own version of the exams and suppresses contradictory testimony.',
      ],
      [
        'A problem he cannot solve alone',
        "Workers complete the shutdown with Mindsight by sharing separate observations and checking one another's calculations.",
        'The buried records expose the hidden student profiles purchased from the sponsor.',
        'The squad takes the profile archive and makes its approval the condition for further research.',
      ],
      [
        'An examination at the prom',
        'Mindsight helps the ballroom volunteers follow their own evacuation plan without reading their thoughts.',
        'The prom audience receives the evidence of unauthorized examinations, with private memories protected.',
        'The squad declares that Mindsight knows what the guests need better than they do.',
      ],
    ],
    endings: [
      "Mindsight confesses his cheating and earns his place through work he can defend without entering another person's mind.",
      'The independent inquiry exposes the stolen student profiles and returns control of the records to their subjects.',
      'The guests escape, but Mindsight still has a set of examinations to take without his power.',
      'Mindsight decides that no one else knows enough to question him. His former teachers stop offering advice.',
    ],
  },
  'psychic-birthright': {
    chapters: [
      [
        'The bell she already heard',
        'Second Sight leads the students away from the shutter she saw failing in a vision, allowing them to choose their route.',
        "The shutter logs contain her ignored prediction alongside the officials' instructions to dismiss it.",
        "The squad claims the school's warning system and demands unquestioned obedience.",
      ],
      [
        'The forecast in the lab',
        'Researchers help Second Sight test an alternate escape route rather than treating one vision as destiny.',
        "The laboratory archive reveals that the sponsor selectively reported her family's predictions.",
        'The squad seizes the prediction files and restricts access to possible futures.',
      ],
      [
        'A street that might survive',
        'Medics adjust their route when Second Sight describes the danger, then verify that the path is clear.',
        'The crossing records establish that an earlier warning was ignored despite corroborating evidence.',
        'The squad closes the crossing and requires passengers to accept its preferred future.',
      ],
      [
        'The warning with a timestamp',
        'The engineer broadcasts the warning and its uncertainty so listeners can take their own precautions.',
        'The rooftop archive preserves the dated prediction and the decision to suppress it.',
        'The squad announces that only its seer may decide which warnings the city hears.',
      ],
      [
        'A different ending below',
        'Workers help Second Sight stabilize the tunnel, proving that a vision can be changed through cooperation.',
        'The buried files identify the officials who concealed the predicted prom disaster.',
        'The squad keeps the emergency controls and requires the city to obey its forecast.',
      ],
      [
        'The prom that does not burn',
        'Second Sight stays with the evacuation volunteers until the last guest is safe, watching the predicted disaster fail to happen.',
        'The ballroom witnesses compare the original prediction with the recovered suppression orders.',
        'The squad demands tribute from the officials who dismissed its visions.',
      ],
    ],
    endings: [
      'Second Sight fights for a future worth living in, even when the people she saves doubt what she saw.',
      'The dated warnings and recovered orders reach an independent inquiry into the ignored crisis.',
      'The guests escape, but Second Sight still has dreams of the futures they did not prevent.',
      'Second Sight makes the city pay for disbelieving her. Its leaders now request permission before making their own plans.',
    ],
  },
  'psychic-social': {
    chapters: [
      [
        'A headline she will not print',
        'The Confidante helps the students escape without repeating the private thoughts she heard in their panic.',
        "The shutter recorder contains a sponsor's unauthorized archive of academy gossip.",
        "The squad retains the private thoughts as leverage over the school's officials.",
      ],
      [
        'The missing quotation marks',
        'Researchers leave the laboratory with control over their own interview notes while The Confidante checks which statements may be printed.',
        'The lab records identify the buyer who commissioned the unauthorized collection of surface thoughts.',
        'The squad takes the archive and offers exclusive gossip to its allies.',
      ],
      [
        'A story about the rescue',
        'Medics guide the passengers clear while The Confidante gathers accounts from those willing to talk on the record.',
        'The crossing archive reveals that a fabricated rumor diverted commuters into the danger zone.',
        'The squad publishes a story about the crossing without asking its witnesses for comment.',
      ],
      [
        'The correction in the news',
        'The engineer broadcasts the emergency warning while The Confidante corrects the secret she once published.',
        "The rooftop recording exposes the sponsor's instructions to plant private information in the school paper.",
        "The squad threatens to publish every official's secrets unless it gets the transmitter.",
      ],
      [
        'The locked notebook',
        'Workers recover the private interview records and allow the subjects to decide which details may be disclosed.',
        'The buried archive contains the original correspondence showing who ordered the false gossip campaign.',
        'The squad takes the notebook and demands silence from everyone named in it.',
      ],
      [
        'The dance that stays private',
        'The Confidante helps the guests reach the exits and leaves their personal conversations out of her article.',
        "The prom witnesses receive evidence of the unauthorized gossip operation without seeing one another's private thoughts.",
        'The squad announces a special edition featuring secrets the guests never agreed to share.',
      ],
    ],
    endings: [
      'The Confidante apologizes publicly and builds a newspaper where private thoughts are not treated as public property.',
      'The gossip operation is exposed, and the people whose secrets were taken regain control over their accounts.',
      'The ballroom is safe, but the friend she betrayed has not yet answered her letter.',
      "The Confidante becomes the city's most feared columnist. Her newsroom is full of tips and empty of friends.",
    ],
  },
}
