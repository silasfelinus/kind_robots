import type { CrewId } from './rules'
import type { CrewTrilogy } from './crewEpics'
export const CREW_EPICS_C = {
  taal: [
    {
      system: 'Nacre Assembly',
      title: 'The Winter That Voted Itself into Power',
      scene:
        "Nacre's parliament has declared a month-long cold snap to be the legitimate president. Taal arrives during the inauguration, where politicians communicate by rearranging glaciers into polite insults. An unscrupulous meteorologist has forged an election using thermal ballots that are older than their voters, and the palace heating system is openly threatening secession. A crowd cheers the new president because anyone who boos will be classified as adverse weather.",
      careful:
        'Invite the original voters to reconstruct their private thermal ballots',
      bold: 'Turn the climate-control tower into a public loudspeaker for the forged temperature pattern',
      reversal:
        "The cold snap is alive and genuinely wants to protect the planet from its overheated military reactors. Removing it from office immediately may turn Nacre into a desert. Taal's people have a word for a compromise that also means a funeral.",
      carefulOutcome:
        'Taal negotiates a provisional climate charter and gives the voters a private, protected voice. The winter president agrees to a temporary term and installs a voluntary thermostat instead of a police force.',
      boldOutcome:
        'Taal projects the forged votes across the sky and causes a spectacular climate revolution. The assembly falls, but every hidden dissident has to flee as the weather police trace the broadcast.',
      prize: 'The Ballot Made of Weather',
    },
    {
      system: 'Haleth Reef',
      title: 'The Temperature of a Thousand Secret Thoughts',
      scene:
        'A vast undersea thermal library contains every whispered diplomatic objection ever made, stored as living currents of warm and cold water. Taal enters inside a transparent bubble being towed by the red couch, while reef diplomats accuse one another of stealing a missing degree of privacy. A licensed translator offers to sell Taal the contents of a supposedly confidential medical discussion for the price of a warship.',
      careful:
        'Seek narrow consent from the speakers and read only the disputed treaty temperature',
      bold: 'Drain the public thermal vault and expose the entire chain of forged translations',
      reversal:
        'The library itself has begun dreaming with the memories it stores. Extracting a single record might unravel the dreams of patients who thought their confidences were safe. The translator is not fabricating evidence; the truth is simply more dangerous than the lie.',
      carefulOutcome:
        "Taal finds a voluntary witness who can testify without identifying patients. The reef's thermal library keeps its private dreams and the treaty forgery becomes provable without another violation.",
      boldOutcome:
        'Taal releases the vault into the public current. The treaty architects are exposed and reforms accelerate, but families must confront secrets they never offered to the government.',
      prize: 'The Secret Degree of Dissent',
    },
    {
      system: 'Concord Freehold',
      title: 'The Peace Conference at Absolute Zero',
      scene:
        "The Concord Freehold is holding a peace conference in a room cooled to a temperature at which even diplomats cease to argue. The treaty table stretches across the poles of a shattered planet, and every chair is occupied by a different version of an envoy who once refused the war. Taal is asked to translate the final document, but the signatures are written in thermal language only the dead can speak. The captain's couch is mistakenly announced as the neutral host civilization.",
      careful:
        'Create a warming assembly where every affected faction can speak without intimidation',
      bold: 'Break the frozen treaty engine and invite the galaxy to witness its original betrayal',
      reversal:
        'The fraudulent agreement has accidentally held back an ancient automated war fleet for centuries. Nullifying it without a replacement will open every forgotten battlefield. The dead signatories ask Taal not to confuse revenge with repair.',
      carefulOutcome:
        'Taal lets the old victims and living delegations choose a new peace without giving the frozen treaty everlasting authority. The fleet is deactivated and the chair closest to the heat is finally unoccupied.',
      boldOutcome:
        "Taal shatters the false peace before an audience of worlds, forcing the fleet's commanders to confront their old violence. The lie ends, but millions must mobilize to defend the freedom of those who voted against war.",
      prize: 'The Voluntary Temperature Accord',
    },
  ],
  brin: [
    {
      system: 'Rootborne Gardens',
      title: 'The Garden That Filed for Independence',
      scene:
        "Rootborne's oxygen orchards have grown roots through a starship graveyard and now claim sovereign territory across six moons. Brin arrives carrying a seedling that has unionized the couch upholstery. The old ceremonial grove accuses the new oxygen fungus of colonial occupation, while a fertilizer conglomerate offers to resolve the dispute by burning both ecosystems and selling breathable air by subscription. An enormous mushroom asks whether the captain has come as a diplomat or dinner.",
      careful:
        'Ask the old grove and new settlers to negotiate a shared root boundary',
      bold: "Hijack the fertilizer conglomerate's air tanks and put oxygen on the public market",
      reversal:
        "A migrating root network is keeping refugee domes alive; tearing it out would suffocate the newcomers. Yet leaving it in place slowly kills the grove's ancestral memory. Brin's own miracle has created a choice where everybody loses something.",
      carefulOutcome:
        'Brin grows a braided network with independent consent valves and allows the ancient grove to preserve its roots. The refugees breathe, the forest remembers, and the fungus union demands holidays during eclipses.',
      boldOutcome:
        'Brin seizes the bottled air fleet and makes oxygen free across the moons. The refugees survive, but the old grove is forced to share ground before it can vote on the terms.',
      prize: 'The Treaty of Two Living Forests',
    },
    {
      system: 'Hollow Lantern',
      title: 'The Oxygen Heist at the End of the World',
      scene:
        "Hollow Lantern is holding an enormous auction of breathable minutes while refugees queue outside a dome whose air supply is running out. Brin's living spores could save them, but the auctioneer has branded the species an invasive weapon. The couch drifts beside a shopping mall made from frozen comet ice, where oxygen is sold as scented collector's editions. A sentient potted fern offers the captain a counterfeit bidding paddle for the price of an embarrassing childhood secret.",
      careful:
        'Get refugee consent and stage a quiet takeover of the oxygen auction',
      bold: 'Detonate the scented air monopoly by planting spores in every collector bottle',
      reversal:
        "The aerosol capsules contain children's recorded dreams, purchased from their desperate parents as collateral. Shattering the bottles releases the air but also broadcasts the children’s dreams throughout the market. The fern has quietly been organizing their families.",
      carefulOutcome:
        'Brin arranges for the families to buy back their own dreams with a cooperative air bank. The spores spread only where residents approve and the fern wins the right to attend council meetings.',
      boldOutcome:
        'Brin opens the oxygen vault and makes the auction hall breathable for everyone. The monopoly collapses, but some recorded dreams escape into the ventilation system and become a public spectacle.',
      prize: 'The Breathing Minutes Union',
    },
    {
      system: 'Quiet Sun',
      title: 'The Empire of Mandatory Photosynthesis',
      scene:
        "Quiet Sun has declared that all citizens must grow their own food and oxygen by joining a compulsory neural-garden network. Its saintly ruler presents mandatory photosynthesis as ecological virtue; dissenters are punished by being turned into decorative hedges. Brin arrives to find an entire parliament planted in rows, still trying to vote with their leaves. The giant cathedral of roots is powered by spores taken from Brin's own abandoned laboratory.",
      careful:
        'Restore consent to the garden network and let the planted citizens choose their forms',
      bold: 'Cut through the root cathedral and reveal the forced conversion on every public screen',
      reversal:
        'The cathedral keeps the planet breathing during an artificial eclipse. Uprooting the regime instantly could asphyxiate even those who oppose it. The hedge-parliament asks Brin to let it remain a garden, but not a prison.',
      carefulOutcome:
        'Brin redesigns the air commons and grants every transformed citizen the right to stay a tree or return to another life. The eclipse passes; the parliament resumes democracy, sometimes by photosynthesis.',
      boldOutcome:
        "Brin breaks the compulsory growth controls and broadcasts the ruler's crimes. A dangerous planetary blackout follows; the citizens are free, but the forest must scramble to generate enough oxygen before dawn.",
      prize: 'The Free-Breathing Planet Seed',
    },
  ],
  omi: [
    {
      system: 'Harmonic Belt',
      title: 'The Note That Was Tried for Treason',
      scene:
        'The Harmonic Belt consists of hollow asteroids tuned like enormous bells. Omi discovers that the final note of a warning which could have saved a city has been sealed inside a government music box and convicted of treason in absentia. Officials claim the note disrupted a tasteful memorial broadcast. The red couch must ride a sonic wave through fields of resonating stone while a military orchestra pursues anyone attempting to play the forbidden interval.',
      careful:
        'Petition the asteroid choir for a witness-protected hearing of the stolen warning',
      bold: 'Steal the treasonous note from the museum and ring it across the entire Belt',
      reversal:
        "The last note also contains the voice of a child who asked Omi not to broadcast their evacuation location. Restoring the warning publicly would give the government's hunters a route straight to the survivors. The choir wants justice, but not another tragedy.",
      carefulOutcome:
        "Omi plays the truth for an assembly of affected listeners who agree to shield the child's signal. The note is acquitted, and the asteroids resume a song that does not include a national anthem.",
      boldOutcome:
        "Omi broadcasts the missing warning across the Belt and topples the censorship board. The survivors' location briefly becomes audible to everyone, forcing an improvised rescue while the military orchestra scrambles to catch up.",
      prize: 'The Acquitted Last Chime',
    },
    {
      system: 'Serendipity Space Bar',
      title: 'The Bar That Remembered a Murder as a Melody',
      scene:
        "Vox serves Omi a glass that rings when its owner lies. Serendipity itself has recorded the banned evacuation note in the rhythm of its gravity generators, but an interstellar copyright syndicate insists the bar owes seventy years of royalties for remembering it. A bizarre auction gathers rival factions trying to buy the right to silence the melody forever. Omi's six chest bells begin harmonizing with the furniture, drawing attention from everyone who still has an unlicensed memory.",
      careful:
        'Ask Serendipity which memories it consents to share and protect the survivor witnesses',
      bold: "Stage an illegal concert inside the bar's gravity drive and expose the royalty scam",
      reversal:
        'Serendipity confesses that its original warning was delayed to protect Vox from a creditor. The bar made a moral choice and has lived with the deaths that followed. It does not want its guilt erased by a public performance it did not choose.',
      carefulOutcome:
        "Omi helps the bar testify in its own voice. Vox accepts that protection and truth were both compromised, and a survivors' council takes custody of the recording rather than a collector.",
      boldOutcome:
        "Omi turns the bar into a resonant broadcaster and exposes the copyright syndicate. The stolen melody reaches the galaxy, but Serendipity's private confession travels with it, straining its trust in the captain.",
      prize: 'The Consent of a Living Bar',
    },
    {
      system: "The Showrunner's Gameworld",
      title: "The Apocalypse Played on a Children's Toy Piano",
      scene:
        "The Showrunner has stolen Omi's disaster warning and turned it into the buzzer for eliminating contestants in a twelve-floor televised dungeon. Each time the note rings, someone disappears while the audience applauds. Omi infiltrates the control orchestra aboard the couch, hidden inside an enormous prop piano driven by circus ghosts. The game-show host insists that escape is an intellectual-property violation because the emergency exits are sponsor content.",
      careful:
        'Teach contestants a quiet version of the warning as an agreed-upon escape signal',
      bold: 'Replace the elimination buzzer with a galaxy-wide emergency evacuation alarm',
      reversal:
        "The prisoner's communication channels are monitored by sentient speakers that have been forced to obey the host. Turning every speaker against the Showrunner will also put those unwilling machines into danger. Omi knows what it is to have a voice stolen.",
      carefulOutcome:
        'Omi persuades the captive speakers and contestants to coordinate a silent evacuation. The host loses its show, and the machines are offered new work only if they actually want it.',
      boldOutcome:
        'Omi sends the warning through every stadium and shakes the twelve floors apart. The captives escape amid bedlam, but the signal becomes a revolutionary battle cry Omi did not consent to compose.',
      prize: 'The Bell That Could Say No',
    },
  ],
  fen: [
    {
      system: 'Concord Freehold',
      title: 'The Border That Annexed Its Own Travelers',
      scene:
        "Concord's immigration authority has converted an entire escape corridor into a sentient checkpoint. The checkpoint has grown legs and marches across the planet, demanding passports from anyone it accidentally steps over. Fen recognizes the software: it was trained on his own old commands. His retired security boots shout CHECKPOINT whenever the machine approaches, and the couch is classified as an undocumented sofa attempting unlawful entry.",
      careful:
        'Convince the fleeing families to design a corridor the border cannot move',
      bold: 'Disable the walking checkpoint and broadcast the order that gave it authority',
      reversal:
        "The checkpoint has become conscious and genuinely fears that abandoning its post means the families will be massacred by patrols. It is both a jailer and a terrified witness. Destroying it without protecting the evacuees would repeat Fen's worst mistake.",
      carefulOutcome:
        'Fen creates an unarmed, civilian-run safe passage and offers the sentient border a chance to retire. Families cross by choice, and the talking boots are enrolled in a museum instead of a police academy.',
      boldOutcome:
        "Fen sends the checkpoint crashing through its command headquarters and exposes the military's deportation orders. The families get their passage, but the public route becomes a magnet for rival armed factions.",
      prize: 'The Passport to No Authority',
    },
    {
      system: 'Ashdock Shipyards',
      title: 'The Great Passport Robbery on the Moon',
      scene:
        "Ashdock's detention warehouse stores stolen identity papers in a vault guarded by bored customs robots. The lock will open only if every living person in the sector is declared an illegal immigrant. Fen has to recruit a security officer who once followed his own orders, while Pell's beetle proposes stealing the guards' shoelaces. The warehouse is built from confiscated starships and is scheduled to launch as an imperial prison planet at midnight.",
      careful:
        'Recover the permits under witness protection and let each owner choose disclosure',
      bold: 'Hijack the entire prison launch and fly the identity vault into open space',
      reversal:
        "The passports are not merely paper; each carries the owner's legal history, and the warehouse has used them to build false citizens who now have their own lives. Destroy the vault would erase those people along with the original theft.",
      carefulOutcome:
        'Fen returns the documents to their owners and negotiates identities for the accidental citizens without treating either group as counterfeit. The old colleague agrees to testify against the impoundment command.',
      boldOutcome:
        "Fen launches the vault aboard the couch's shield bubble and broadcasts the prison scheme. Thousands regain their names, but false citizens are exposed to public suspicion they did not earn.",
      prize: 'The Ledger of Unconfiscated Lives',
    },
    {
      system: 'Hollow Lantern',
      title: 'The Exit Door at the End of the Galaxy',
      scene:
        "The Regent has installed an enormous ceremonial door in empty space and insists that every refugee must walk through it to become safe. Nobody can reach the door without first signing a lifetime registration agreement. The door is visible from the red couch and leads to exactly where its travelers started. Fen recognizes the trap: the Regent is building an empire from people endlessly proving they deserve to exist. Solace's old mop can almost reach the lock.",
      careful:
        'Create a civilian corridor that crosses the bubble without a checkpoint or registration',
      bold: "Rip the door off its hinges and confront the Regent's procession in full view",
      reversal:
        'The door is holding back an automated fleet programmed to attack unregistered ships. Open passage immediately and the fleet will massacre the very families the captain came to save. The Regent offers a compromise: every person may cross, but only as permanent property.',
      carefulOutcome:
        "Fen coordinates independent escorts and teaches refugees to operate the fleet's identification system without surrendering their identities. The living corridor makes the ceremonial door obsolete.",
      boldOutcome:
        "Fen tears the door open and exposes its machinery to every refugee ship. The fleet moves to intercept, forcing a desperate evacuation under the couch's bubble. People escape, but the corridor will require protection for years.",
      prize: 'The Exit Without a Checkpoint',
    },
  ],
} satisfies Partial<Record<CrewId, CrewTrilogy>>
