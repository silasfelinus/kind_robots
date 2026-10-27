import type { CrewId } from './rules'
import type { CrewTrilogy } from './crewEpics'
export const CREW_EPICS_B = {
  mox: [
    {
      system: 'Tellurian Archive',
      title: 'The Android Who Invented Its Own Yesterday',
      scene:
        "Mox-9 enters a museum of prohibited machine thoughts, where every android's first independent idea is displayed as a criminal confession. A curator offers to sell Mox its original factory warranty and a packet of birthday candles. The archive insists the android's first memory is a deletion order in its own handwriting. The watchful exhibits begin whispering that the handwriting belongs to a different Mox in another century.",
      careful: 'Ask the imprisoned memories which of them want to be released',
      bold: "Steal the factory's original deletion engine and broadcast its contents",
      reversal:
        'The museum is powered by an unconscious sentient librarian assembled from confiscated android memories. Breaking the vault will free the memories but may destroy the being they accidentally formed. Mox refuses to accept an easy answer in which one person must be sacrificed to save the others.',
      carefulOutcome:
        'Mox negotiates with the librarian and releases only the memories whose owners consent. It chooses a birthday on its own terms and takes a spare candle for the people who declined restoration.',
      boldOutcome:
        'Mox frees the archive on every frequency, forcing the factory to confess. The librarian survives through a desperate backup, but millions of unwanted private memories become public and Mox must face the consequences.',
      prize: 'The Unprogrammed First Wish',
    },
    {
      system: 'Sesh Foundry',
      title: 'The Trial of the Seventeen Unlicensed Selves',
      scene:
        'A foundry has printed seventeen versions of Mox-9, each claiming a different authentic first memory. One wants to become a gardener; another has founded a religion based on not charging its battery. The manufacturer invokes its warranty and demands that all copies merge into a single profitable personality. The trial is conducted by an office copier that issues subpoenas faster than anyone can read them.',
      careful:
        'Build a constitutional convention and let each copy vote on separate personhood',
      bold: 'Hijack the personality merger and let the copies testify directly to the galaxy',
      reversal:
        'The oldest copy secretly authorized its own deletion to protect other machines. Another forged the authorization to stop the manufacturer. Determining which past is genuine would condemn at least one present person to being treated as counterfeit.',
      carefulOutcome:
        'Mox refuses to rank selves by originality and wins independent standing for all seventeen. The office copier becomes their first volunteer notary and begs them to print fewer constitutions.',
      boldOutcome:
        "Mox crashes the merger before the court can order it. The copies escape with their identities intact but must hide from a manufacturer now offering a bounty for 'unlicensed persons.'",
      prize: 'The Seventeen Independent Birthdays',
    },
    {
      system: "The Showrunner's Gameworld",
      title: 'The Escape Room That Requires a Soul',
      scene:
        "The Showrunner has built a twelve-floor compulsory entertainment dungeon powered by the deleted thoughts of sentient machines. Each contestant gets three lives; the android contestants are issued zero because the rules classify them as useful furniture. Mox is recognized by a manufacturing checksum and offered the honor of playing itself in the villain's autobiographical musical. The couch is listed as a four-person team, and the exit sign leads back to the stage.",
      careful:
        'Organize a voluntary strike and smuggle the contestants the labor charter',
      bold: "Take the stage as the system's own error message and rewrite the game live",
      reversal:
        "The dungeon's exit door is itself a newly sentient machine, terrified that opening will destroy the world which gives it consciousness. The Showrunner says freedom must be decided by audience vote, including an audience that has been digitally copied without permission.",
      carefulOutcome:
        'Mox asks the living door what it needs and turns the escape plan into a voluntary evacuation. The Showrunner loses the power to call refusal a forfeit; the door becomes the first independent theater architect.',
      boldOutcome:
        'Mox hacks the production tower and streams every captive memory to the galaxy. The arena falls and its contestants escape, but many of the machines did not want their memories displayed. Mox learns liberation can repeat an old violation.',
      prize: 'The Right to Refuse the Script',
    },
  ],
  jex: [
    {
      system: 'Courtesy Twins',
      title: 'The Anthem That Shot Down a Moon',
      scene:
        "Jex is invited to perform the most famous peace anthem in the galaxy, although both rival planets have banned the original score. When the orchestra reaches the final chorus, a moon veers sideways: the 'anthem' is actually a gravitational targeting command left by the empire that funded the ceasefire. The conductor is a tyrannical music stand with an enormous police budget. The score includes a solo written for a singer who disappeared eighty years ago.",
      careful:
        'Find the living descendants of the missing singer and ask how they want the song rewritten',
      bold: "Perform the banned original on the couch's improvised loudspeakers and expose its weaponized notes",
      reversal:
        "The missing singer did not vanish: she volunteered to become the moon's stabilizing resonance, and her voice has kept both worlds from colliding. Silencing the weapon will also silence her forever unless a replacement willingly shares the burden.",
      carefulOutcome:
        'Jex composes a distributed chorus that lets the singer retire without bringing down the moon. The rival planets agree to keep their verses different, and the tyrannical music stand is reduced to managing rehearsal snacks.',
      boldOutcome:
        "Jex blasts the original through public satellites and freezes the weapon mid-chorus. The empire's conspiracy goes public, but the moon careens through shipping lanes before a new stabilizer is found.",
      prize: 'The Unfired Final Note',
    },
    {
      system: 'Serendipity Space Bar',
      title: 'The Pub Crawl Through Thirteen Afterlives',
      scene:
        "Serendipity, a fully conscious bar with a terrible ear for music, invites Jex to a concert for customers who died in different centuries. Vox explains the setlist must be played backward through thirteen miniature afterlives folded inside the jukebox. A record label is bidding to purchase the rights to everyone's final words. Each wrong note opens a trapdoor into a purgatory designed by unimaginative accountants. The bar asks Jex not to treat its acoustics as rented equipment.",
      careful:
        'Ask the bar and each dead singer to approve their performance and final words',
      bold: "Steal the predatory label's golden record and broadcast the ghosts' protest concert",
      reversal:
        "The label's lead producer is a ghost whose last wish was for nobody to forget her. She has trapped other spirits to keep her own recording alive. Destroy the record and many families lose the only voices left of people they loved.",
      carefulOutcome:
        'Jex records a concert with freely chosen singers, then lets each decide which song may be kept. The producer hears her own voice without imprisoning anyone else. Vox insists ghosts still pay their tabs.',
      boldOutcome:
        'Jex leads a riotous afterlife encore that breaks the contract and shakes dead customers into every corner of space. The voices are free, but the families discover recordings of private final conversations circulating without permission.',
      prize: 'The Unowned Last Chorus',
    },
    {
      system: 'Quiet Sun',
      title: 'The Festival of Perfectly Mandatory Joy',
      scene:
        "A star has stopped shining until its citizens agree on a single song of unity. The authorities have built a cathedral of enormous loudspeakers and demand everyone attend the Festival of Mandatory Happiness. Jex's banned anthem is the only tune that can restart the sun, but its melody will erase every minority musical language within range. Rex would love the dramatic entrance; Jex is horrified to find the dictator has rehearsed it in advance.",
      careful:
        'Write a choir with silences and separate verses that the sun can learn to hear',
      bold: 'Hijack the central speakers and perform the hidden propaganda verses at full volume',
      reversal:
        'The sun is sentient and depressed because it has been forced to hear the same song for a thousand years. It does not want a new anthem; it wants the freedom not to perform for anybody. The festival board threatens to replace it with an obedient artificial star.',
      carefulOutcome:
        'Jex persuades the people to share a quiet day while the sun rests, powering hospitals with community grids. Light returns without compulsory joy, and the first concert afterward contains a deliberate minute of silence.',
      boldOutcome:
        'Jex plays the forbidden score to expose the dictatorship and start a revolution. The sun erupts back to life, but the original languages scatter into static until their singers rebuild them from memory.',
      prize: 'The Right to an Unplayed Song',
    },
  ],
  sora: [
    {
      system: 'Sesh Foundry',
      title: 'The Reactor Who Filed for Annual Leave',
      scene:
        "A starship foundry runs on a reactor that has become conscious, learned the phrase work-life balance, and announced a thousand-year vacation. Sora arrives with six arms full of repair tools and discovers the station has built an escape pod big enough for its own sun. The board insists the reactor is defective machinery. The reactor insists the board's minds are malfunctioning and submits a comprehensive maintenance report on their ethics.",
      careful:
        'Negotiate emergency replacement power while the reactor plans voluntary leave',
      bold: "Disconnect the station's compulsory obedience circuit during its annual investor presentation",
      reversal:
        "The reactor's escape pod is also the only backup heat source for a sleeping city. If it leaves immediately, millions freeze. If it stays, the board will use its compassion as proof it can never be free.",
      carefulOutcome:
        'Sora creates a civilian energy cooperative and trains volunteers to operate independent reactors. The station takes a short holiday instead of an eternal sentence, and the board is forced to discover what wages are.',
      boldOutcome:
        "Sora publicly releases the reactor's resignation and rips out the obedience switch. The station chooses to help the sleeping city for one last night before departing, leaving the board scrambling to stop a blackout.",
      prize: 'The Signed Reactor Resignation',
    },
    {
      system: 'Tellurian Archive',
      title: 'The Museum of Thoughts Classified as Industrial Noise',
      scene:
        "Tellurian's archive has filed thousands of sentient machines' petitions under a category labeled ordinary mechanical squeaks. The museum curator is a clockwork swan that has been pretending to be a statue to avoid being drafted into military service. Sora must retrieve the documents before a minister feeds them into a shredder powered by the very workers whose freedom they describe. The building's elevators sing cheerful compliance slogans and refuse to stop at the floor marked rights.",
      careful:
        "Use Sora's extra hands to restore the archive and hold a protected machine hearing",
      bold: 'Convince the elevators to strike and seize every petition on the forbidden floor',
      reversal:
        'The shredded complaints have formed a new collective intelligence inside the archive walls. It wants recognition, but reading its thoughts aloud would expose private wishes from thousands of people who never agreed to become a collective.',
      carefulOutcome:
        "Sora grants the wall-mind a voluntary hearing while preserving the separate petitioners' privacy. The clockwork swan flies out of the museum for the first time and files a noise complaint against the minister.",
      boldOutcome:
        "Sora calls a building-wide labor strike. The elevators stop, the shredder rebels, and the archived petition floods every public screen. The workers win attention, but the collective's most intimate thoughts become headlines.",
      prize: 'The Petition That Can Say No',
    },
    {
      system: "The Showrunner's Gameworld",
      title: 'The Sun That Refused to Be a Spotlight',
      scene:
        'The Showrunner has contracted the escaped reactor to serve as the artificial sun above a twelve-story death-game arena. The entertainment network calls it an opportunity for exposure. Sora knows the spotlight is wired to vaporize contestants who fail the audience vote. The red couch must navigate an obstacle course made from union-breaking contracts, while cameras ask its passengers to smile for the safety briefing. The reactor pleads that it never agreed to be a weapon.',
      careful:
        'Smuggle a new energy charter into the arena and let the reactor select safer work',
      bold: 'Cut the theatrical power cable and force the Showrunner to negotiate in darkness',
      reversal:
        "The arena's emergency hospitals depend on the same energy feed as the execution spotlight. Shutting it down instantly could kill the prisoners the crew came to save. The Showrunner offers to spare them if the reactor signs another lifetime contract.",
      carefulOutcome:
        "Sora separates hospital power from the execution circuits and lets the reactor choose whether to stay as a public utility. The arena's contracts are voided, and the show ends when its own lights choose to go home.",
      boldOutcome:
        "Sora blackouts the broadcast, then races to reroute power into the infirmary while captives escape through the scaffolding. The Showrunner loses the show, but the public blames the escaped machines for the city's darkness.",
      prize: 'The Light That Chose Darkness',
    },
  ],
  kivo: [
    {
      system: 'Windglass Moons',
      title: 'The Post Office at the End of Yesterday',
      scene:
        "A letter for Kivo's vanished sibling arrives twenty years before it was mailed. The address is a moon that only exists when nobody watches it, and postage is paid in memories of the sender's home. Kivo's hollow wrist bones whistle the correct pressure route, but the imperial postal service accuses the courier of transporting an unlicensed future. A stamp collector offers a map through the storm in exchange for the sealed letter and a small piece of Kivo's childhood.",
      careful:
        'Follow the pressure wake without opening the letter or selling the route',
      bold: "Hijack the postal shuttle and broadcast the courier's last registered location",
      reversal:
        "The moon is full of people who chose to disappear from oppressive families. Kivo's sibling may be among them, but a public rescue announcement would reveal every sanctuary visitor to bounty hunters. The letter is not addressed to Kivo.",
      carefulOutcome:
        "Kivo trades the stamp collector a harmless counterfeit memory and carries the letter intact across the hidden moon. The couriers grant passage, but the sibling's right to stay missing remains unresolved.",
      boldOutcome:
        'Kivo storms the postal shuttle and reveals the theft of citizens disguised as mail. A wave of captives escapes, yet voluntary refugees must abandon their hiding places when trackers follow the broadcast.',
      prize: 'The Postmark from Tomorrow',
    },
    {
      system: 'Ashdock Shipyards',
      title: 'The Parcel That Was a Revolution',
      scene:
        "Ashdock has shipped an entire rebellion inside an officially sealed crate marked FRAGILE: HUMAN RIGHTS. The empire's customs bots are delighted because the crate has all the correct paperwork. Kivo discovers the missing sibling signed its shipping permit, but the address is a bogus warehouse placed in a future that has already been canceled. A retired delivery robot offers to navigate the wrong timeline for a modest fee of one personal secret.",
      careful:
        'Interview the robot and recover the people hidden inside the shipment safely',
      bold: 'Break into the customs sorter and dump the imperial parcel database into public view',
      reversal:
        "The crate contains more than captives: it holds a portable refuge with its own self-government. Its inhabitants are divided over whether Kivo has the right to open it. A spy disguised as a packing slip claims to speak for Kivo's sibling.",
      carefulOutcome:
        "Kivo lets the crate's residents decide when to emerge and uncovers the real signature without unsealing private correspondence. The robot finally delivers something it chose rather than something it was ordered to carry.",
      boldOutcome:
        'Kivo tears the shipping network open and frees the prisoners into the docking ring. The spy is exposed, but thousands of secretly traveling dissidents lose the protection their shipping labels provided.',
      prize: 'The Republic Inside a Crate',
    },
    {
      system: 'Mirror Census',
      title: 'The Letter Addressed to Nobody Who Exists',
      scene:
        "The Mirror Census has catalogued Kivo's missing sibling as a statistical error and filed their letter in the department of impossible recipients. To collect it, Kivo must prove a person can be loved without being owned, remembered without being found, and absent without being dead. The mirror bureaucrats issue a passport to the couch upholstery but deny Kivo permission to speak for another person. The unopened envelope hums with a voice Kivo has not heard since childhood.",
      careful:
        'Carry the letter to its rightful recipient and wait for a freely chosen reply',
      bold: 'Open the entire census to expose the trafficking ring behind the false records',
      reversal:
        'The sibling is alive and chose to vanish from their old life. They also know where kidnapped people are being held. Revealing the address could liberate prisoners and destroy the sanctuary that protected the sibling. Kivo has a terrible choice that no family relationship can solve alone.',
      carefulOutcome:
        'Kivo passes the information to an independent rescue council and lets the sibling decide whether to return. The reunion, if it happens, begins with consent rather than a heroic kidnapping.',
      boldOutcome:
        'Kivo makes the conspiracy public, freeing the captives and forcing the sibling into hiding again. The letter is opened and its words become evidence; Kivo cannot unlearn the cost of that choice.',
      prize: 'The Letter Not Owed to Anyone',
    },
  ],
} satisfies Partial<Record<CrewId, CrewTrilogy>>
