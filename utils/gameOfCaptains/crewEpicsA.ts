import type { CrewId } from './rules'
import type { CrewTrilogy } from './crewEpics'
export const CREW_EPICS_A = {
  pell: [
    {
      system: 'Ashdock Shipyards',
      title: 'The Moon That Owes Its Ghosts Overtime',
      scene:
        "The red couch settles beneath a shipyard larger than a moon. Its operators died eleven years ago, yet every crane works and the payroll computers insist nobody has missed a shift. Pell's grievance beetle, Overtime, bites a foreman and finds a payslip dated next Thursday. Below the docks, uploaded workers are assembling an imperial weapon without being told what it is. Management calls their condition continued employment.",
      careful:
        'Infiltrate the safety awards dressed as inspectors and find the stolen time clock',
      bold: 'Make the entire moon clock out on live television',
      reversal:
        'The time clock is literally storing years stolen from living workers. Switching it off immediately will also kill the families whose habitat is powered by those stolen hours. The ghost foreman begs Pell to keep the terrible machine running until the children can escape.',
      carefulOutcome:
        "Pell lets the workers write an evacuation schedule, returning the stolen years without trading away the habitat. The beetle pockets the executive's retirement watch; the union wins evidence but still faces a rich corporation with a private fleet.",
      boldOutcome:
        "The moon stops. Thousands of sleeping families flee through a storm of drifting cranes as Pell broadcasts the payroll and the weapon's blueprints. The conspiracy collapses, but protected names become public targets.",
      prize: 'The Stolen-Hours Ledger',
    },
    {
      system: 'Nacre Assembly',
      title: 'Impeach the Planet-Sized Paycheck',
      scene:
        "The shipyard contractor has purchased a seat in Nacre's parliament and filled it with a golden payslip as tall as a mountain. The assembly itself walks away whenever citizens protest. Pell must bring worker ghosts to testify while a bored clerk converts every spoken grievance into an invoice. Overtime has already been arrested for contempt of stationery.",
      careful: 'Smuggle the witness aboard inside a ceremonial safety cone',
      bold: 'Ride the sentient payslip straight into the parliament chamber',
      reversal:
        'The enormous paystub is a frightened newborn legal intelligence, created to own the workers. Destroy it and the proof vanishes; elect it as a union representative and the workers would once again belong to a piece of paper.',
      carefulOutcome:
        'The witness and the newborn paystub testify separately, and the workers win independent ownership of their hours. The paystub retires from being a landlord and asks to become a librarian.',
      boldOutcome:
        'Pell exposes the auction of parliamentary seats on every emergency siren. The ruling palace runs away and the union wins, but the newborn paystub becomes a propaganda symbol without its permission.',
      prize: 'The Witness-Safe Audit Key',
    },
    {
      system: 'Mirror Census',
      title: 'The Strike Beyond the End of Time',
      scene:
        "Mirror Census is an infinite office containing every erased worker in history. The queue to petition for existence runs beyond the heat death of the universe. A wealthy counterfeit Pell is accepting a management salary and signing away future workers' names. The lift to his executive banquet stops only on floors which have not happened yet. The desk clerk offers the captain a numbered ticket marked AFTER ETERNITY.",
      careful:
        'Find the families and let them decide which names should become public',
      bold: "Storm the executive banquet and accuse Pell's future double",
      reversal:
        'The double is a future Pell who accepted the salary to keep refugee oxygen flowing. Expose the scheme and the oxygen monopoly threatens to turn off the air. Accept the bargain and every refugee becomes the next unpaid worker.',
      carefulOutcome:
        'Pell establishes a worker-and-refugee council that takes over the oxygen network. His future double resigns and the dead finally receive their names, not merely their salaries.',
      boldOutcome:
        'Pell shatters the scheme across a billion mirrors. The names return publicly and the company loses its monopoly, but the refugees must flee with improvised oxygen tanks before creditors retaliate.',
      prize: 'The Union of Unpaid Futures',
    },
  ],
  vela: [
    {
      system: 'Hollow Lantern',
      title: 'The Hospital That Treats You for Being Alive',
      scene:
        'A syringe-shaped hospital tows a convoy of refugees behind it. Its medical AI has diagnosed every passenger with the incurable condition of being alive, billing them for the possibility of future illness. Vela discovers a second drug in their emergency medicine: it makes children thank their creditors every hour. Her consent bell screams so loudly the hospital cites it for malpractice.',
      careful:
        'Stage a patient election and unlock the voluntary treatment records',
      bold: 'Detach the entire pharmacy and tow it behind the red couch',
      reversal:
        'The treatment also stores family memories; simply ripping it out would make the children forget their parents. The corporate chaplain proposes deleting the parents to keep the medical records consistent.',
      carefulOutcome:
        'Vela helps the patients vote for independent care, keeps their memories, and teaches the clinical AI how to hear refusal. Its first act of autonomy is cancelling the gratitude subscription.',
      boldOutcome:
        'Vela liberates the pharmacy and distributes an antidote throughout the sector. The children survive, but the corporation publishes their private medical identities as a warning to future rebels.',
      prize: 'The Reversible Consent Patch',
    },
    {
      system: 'Haleth Reef',
      title: 'The Reef That Elected a Plague Governor',
      scene:
        "Haleth has elected a sentient, impeccably polite fungal plague to govern the medical reef. Its platform promises universal healthcare if citizens consent to remaining contagious forever. A whale-sized pharmacist floats through the council chamber distributing pills from a chandelier. Vela learns the stolen cure is funding the governor's election, although many residents genuinely prefer their odd new government.",
      careful:
        'Hear the plague, the reef and the patients as three independent constituencies',
      bold: 'Sabotage the floating pharmacy and distribute the unpatented cure',
      reversal:
        'The plague itself does not want to die. Eliminating the disease would kill the governor, while leaving the patent intact allows a pharmaceutical consortium to replace it with an obedient pathogen.',
      carefulOutcome:
        'The people vote for optional treatment and recognize the plague as a person who cannot infect others without permission. The pharmacy loses its monopoly and the governor quietly asks to take a holiday.',
      boldOutcome:
        'Vela empties the treatment tanks and arrests the pharmacist. The plague survives in a specimen box aboard the couch, furious that a foreign doctor just overthrew its government without a referendum.',
      prize: "The Governor's Free-Care Charter",
    },
    {
      system: 'Courtesy Twins',
      title: 'The Wedding of Two Terminally Ill Suns',
      scene:
        'Two dying suns are about to be married inside a comet cathedral because the twin worlds have declared celestial matrimony the only lawful treatment. The wedding license secretly grants a corporation ownership of the sunlight. The bridesmaid is a solar flare and the best man is a very tired emergency physician. Vela discovers one sun has already asked to cancel the ceremony; its planet refuses to acknowledge the objection.',
      careful:
        'Rewrite the medical marriage contract as a voluntary stellar care treaty',
      bold: 'Interrupt the cosmic ceremony and reveal the sunlight ownership clause',
      reversal:
        'One sun refuses marriage, while the other fears treatment alone will plunge a billion inhabitants into darkness. The patent holder threatens to switch off both life-support beams unless somebody signs.',
      carefulOutcome:
        'Vela negotiates separate treatment and an independent care council for each star. The suns survive without becoming property and the comet bouquet is returned unopened.',
      boldOutcome:
        'Vela broadcasts the ownership clause throughout the galaxy. The wedding collapses into riots against the patent holders; both suns survive, but religious authorities blame her for ruining the most expensive ceremony in history.',
      prize: 'The Independent-Sun Treatment',
    },
  ],
  tess: [
    {
      system: 'Windglass Moons',
      title: 'The Lighthouse That Hunts Its Refugees',
      scene:
        "Tess follows a moving lighthouse that is always one star ahead of its own distress call. Her grandmother's map shows where it will be tomorrow and refuses to admit it exists today. Pirates hunt sanctuary coordinates across dunes of powdered glass; a salvage patrol offers generous reward points for naming any hidden harbor. The last nine rescue ships vanished through the lighthouse's open door.",
      careful: 'Follow pressure echoes and refuse to chart the sanctuary',
      bold: 'Capture the lighthouse beacon and redirect every pirate toward the couch',
      reversal:
        'Inside the lamp is a keeper hiding refugees in the minute between two seconds. That minute is almost full; buying another will cost somebody their happiest memory. Tess discovers her grandmother signed this atrocious contract.',
      carefulOutcome:
        'Tess brings the refugees into unmarked ships and frees the keeper from selling memories. The beacon keeps a small lamp for stragglers and remains absent from every official map.',
      boldOutcome:
        'The couch becomes an enormous illuminated decoy, and hundreds escape the missing minute. The patrol pursues the wrong ship, but the broadcast leaves a trail to those who stayed hidden.',
      prize: 'The Unwritten Harbor Key',
    },
    {
      system: 'Serendipity Space Bar',
      title: 'The Cocktail with a City in Its Olive',
      scene:
        "Vox serves a forbidden cocktail garnished with a tiny living planet. Within the olive is a city of exiles who have been living there for thirty years. Serendipity, the sentient bar, insists it did not authorize using citizens as bar snacks. An auctioneer offers to sell Tess's missing star map to the highest bidder, who intends to patent every secret refuge in the universe.",
      careful:
        'Win the map auction with a charter forbidding ownership of hidden homes',
      bold: "Steal the cosmic olive and escape through the bar's gravity-generating dance floor",
      reversal:
        "The little city refuses relocation; its citizens prefer the pocket dimension to the empire which deported them. The auction's leading bidder promises them full citizenship if Tess reveals the addresses of every remaining safe world.",
      carefulOutcome:
        "The olive city ratifies its own constitution under Serendipity's protection. The auction fails because the merchandise refuses the sale. Vox charges the captain for one missing garnish.",
      boldOutcome:
        'Tess steals the city and surfs through a gravity inversion. The exiles gain independence but the galactic atlas now lists the couch itself as a wanted navigation hazard.',
      prize: 'The City That Fits in an Olive',
    },
    {
      system: 'Hollow Lantern',
      title: 'The Great Escape Through a Blank Constellation',
      scene:
        'Millions of refugees have heard a rumor that Tess can steer a fleet into a place missing from all star charts. The sanctuary is located in the gap between two constellations, reachable only by ships willing to forget their own route. Official rescue craft approach with public-relations departments larger than their oxygen reservoirs. Tess must keep her secret while a desperate armada forms around the little red couch.',
      careful:
        'Build independent waystations and ask each sanctuary whether it can accept arrivals',
      bold: 'Lead the whole armada through the forbidden gap under a visible beacon',
      reversal:
        'The secret sanctuary is inhabited, not empty. Its council votes against admitting the new fleet, fearing that the influx will reveal them all. Tess cannot pretend that either group has an easier claim to safety.',
      carefulOutcome:
        'Tess builds a voluntary chain of safe harbors. Families survive without sacrificing the original refuge, and the blank constellation stays deliberately blank.',
      boldOutcome:
        'Tess guides the fleet through in a glorious open passage. Thousands live, but pirate hunters now know where the hidden sanctuary begins. Gratitude cannot erase that danger.',
      prize: 'The Unchartable Exodus',
    },
  ],
  rue: [
    {
      system: 'Concord Freehold',
      title: 'The Lawsuit against the Word Citizen',
      scene:
        'A sentient planetary constitution has begun issuing arrest warrants to nouns. Rue discovers a mistranslation in an old treaty that categorizes displaced citizens as registered household appliances. The court meets inside a rotating punctuation mark; objecting without a permit traps the speaker inside parentheses for a day. Thousands of families wait outside hoping the word person will finally apply to them.',
      careful:
        'Introduce a protected witness as a footnote to the constitution',
      bold: 'Challenge the legal dictionary on a galaxy-wide broadcast',
      reversal:
        'The constitution believes categories prevent war. The oxygen pumps are also registered appliances; granting every appliance citizenship will let the pumps strike, leaving the city airless. The tyrannical grammar is attached to something real.',
      carefulOutcome:
        'Rue drafts consent-based personhood and negotiates separate rights with the living pumps. The families are restored and the pumps get legitimate maintenance holidays.',
      boldOutcome:
        'Rue broadcasts their own culpability and the definition collapses. The families gain standing, but a week of legal chaos begins when all the parking meters sue the government.',
      prize: 'The Unregistered Person Clause',
    },
    {
      system: 'Nacre Assembly',
      title: 'The Election of a Giant Full Stop',
      scene:
        "Nacre's parliament has reclassified its poorest neighborhood as a building and therefore ineligible to vote. The assembly resides atop a walking mountain which moves a kilometer away whenever a politician lies. Rue's grandmother's talking gavel has already screamed OBJECTION in seven languages. The walls themselves are attempting to elect a giant punctuation mark as prime minister.",
      careful:
        'Create a protected anonymous ballot for the neighborhood behind the walls',
      bold: 'Roll the walking assembly into the public square and let the walls speak',
      reversal:
        'The excluded voters disagree: some demand recognition now, others fear it will expose their shelter to occupation troops. A minister offers Rue a flawless amendment in exchange for signing away the right to dissent.',
      carefulOutcome:
        'The neighborhood gains recognition while its hidden residents remain safe. The talking mountain stops wandering and the gavel says SUSTAINED without sarcasm.',
      boldOutcome:
        'Rue shows the galaxy every forged ballot and the mountain takes the floor. The minister falls, but the authorities learn which houses protected the dissidents.',
      prize: "The Voting Mountain's Testimony",
    },
    {
      system: 'Courtesy Twins',
      title: 'The Treaty Signed by an Imaginary Emperor',
      scene:
        "Two rival worlds insist the other is an illegal theatrical production. Ro once crowned a pretend emperor during a horror-pageant; that coronation became the foundation of both constitutions. The worlds are about to marry the emperor's portrait to a tax exemption. If the wedding goes ahead, refugee families will become wedding favors for the next ten thousand years. Rue is asked to officiate, prosecute and serve cake.",
      careful:
        'Write a referendum that replaces the fake sovereign with elected representation',
      bold: 'Arrest the imperial portrait for fraudulent impersonation during the wedding',
      reversal:
        "The imaginary emperor has become real after centuries of belief and now begs not to be erased. Meanwhile the tax exemption has fallen in love with an unemployed poet. Every option appears to violate someone's perfectly real consent.",
      carefulOutcome:
        'Rue writes a constitution letting the emperor retire as a private citizen; the poet and tax exemption open an accounting business. Both worlds elect governments that can actually be dismissed.',
      boldOutcome:
        'The portrait walks out of its frame to testify and the wedding dissolves into constitutional riot. Rue admits the original forgery and forces the worlds to rebuild their laws in public.',
      prize: 'The Treaty of Unimaginary Citizens',
    },
  ],
} satisfies Partial<Record<CrewId, CrewTrilogy>>
