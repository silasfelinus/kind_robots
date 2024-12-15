//utils/sceneChoices.ts

export const scenarios = [
  {
    title: 'Serendipity',
    genres: 'sci-fi, adventure, humor',
    inspirations: `Douglas Adams, Spider Robinson, Space Quest, Hitchhiker's Guide to the Galaxy, Myth Adventures`,
    description:
      `The universe is a dangerous place! Best take a breather at the top oasis between worlds: Serendipity Space Bar. Whether you're a Gasproundian bounty hunter or an escapee from the Helium mines, everyone is welcome at Serendipity! Remember, no vaporizing paying guests while on the premises!`,
    intros: JSON.stringify([
      `SPACE JANITOR: Day one at Serendipity's Space Bar. The job posting said 'janitorial services,' but it didn’t mention cleaning up spilled sentience goo or mediating disputes between time-traveling versions of the same customer. Turns out, the only thing more chaotic than the bar itself are the stories that come with it.`,
      'MYSTERIOUS PATRON: You step into Serendipity, and the first thing you notice is the smell: ozone, burnt cinnamon, and just a hint of regret. The bar hums with the noise of a hundred worlds, from the low grumbles of a furry behemoth nursing his drink to the tinkling laughter of what might be sentient crystals. One thing’s clear: you’ve found the only place in the galaxy where the improbable is on tap.',
      `BARTENDER: It’s just another night at Serendipity, where the drinks are stiff, the customers are stranger, and the intergalactic health inspectors are—thankfully—rare. Your job is to keep the peace (and the bar intact) while dispensing drinks, wisdom, and the occasional emergency portal to a less hostile dimension.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/space.webp',
    locations:
      `Wormhole Lounge, All-Gender All-Species Omnirestroom, World Market, Smuggler's Warehouse`,
    artPrompt: `Serendipity Space Bar is a bustling, neon-lit haven for intergalactic travelers. Picture a classic sci-fi bar with a retro-futuristic twist: curved chrome counters, floating drink trays, and walls lined with glowing alien artifacts that hum faintly with energy.

The main room is alive with chatter, laughter, and the occasional universal translator malfunction, as a diverse crowd of patrons mingles: tentacled diplomats, holographic musicians, and cyborg bounty hunters nursing drinks in mismatched glasses. The bar's centerpiece is a massive, suspended aquarium filled with bioluminescent jellyfish-like creatures that pulse in time with the music.

The lighting is a mix of blues and purples, occasionally interrupted by the flash of a teleportation booth or the crackle of an unruly plasma drink. Drinks are served in glasses that hover, bubble, or shift colors depending on the mood of the drinker. And in the corner, a battered jukebox plays hits from stars both distant and dead.`,
    artImageId: null,
  },
{
  title: 'I Am a New Intern and I Will Shatter the Glass Ceiling with My Giant Sledgehammer',
  genres: 'comedy, office satire, adventure',
  inspirations: 'The Office, Dilbert, She-Hulk, Power Fantasy',
  description:
    `You’re the newest intern at OverCorp, the soul-sucking megacorporation that practically owns the world. Armed with your trusty sledgehammer and unyielding determination, you’re not just here to fetch coffee—you’re here to smash hierarchies, take names, and maybe even become CEO. Can you survive the corporate grind (and HR)?`,
  intros: JSON.stringify([
    `YOUR FIRST DAY: The breakroom coffee tastes like burnt despair, your badge won’t open half the doors, and your boss just asked you to file their sentient tax forms. But hey, at least you’ve got your sledgehammer.`,
    `HR NIGHTMARE: It’s the weekly team-building seminar, and you’re two minutes away from testing how well glass ceilings shatter. Luckily, no one’s noticed the sparks flying off your “motivation” yet.`,
    `THE CEO SUMMONS YOU: You’ve made waves—both figuratively and literally (that accounting water feature never stood a chance). Now you’re face to face with the CEO. Do you bring the sledgehammer or play it cool?`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/office.webp',
  locations: `Breakroom of Despair, Cubicle City, Rooftop Garden of Secrets, Elevator to Nowhere`,
  artPrompt: `A dystopian corporate office with flickering fluorescent lights, endless rows of cubicles, and motivational posters that seem to mock the workers. The main character stands out: a fiery-eyed intern gripping a comically oversized sledgehammer, ready to disrupt the monotony. Papers fly, a vending machine sparks, and the background is a mix of grim office hues with vibrant bursts of rebellious energy.`,
  artImageId: null,
},
{
  title: 'Why Do People Keep Attacking My Dungeon?',
  genres: 'fantasy, comedy, adventure',
  inspirations: 'Dungeon Keeper, Overlord, One Punch Man',
  description:
    `As the proud (and long-suffering) owner of a mid-tier dungeon, you’re constantly fending off adventurers looking for loot, glory, or just a good brawl. Between rebuilding traps and calming your hired goblins, you’re starting to wonder: why does everyone think you’re the villain here?`,
  intros: JSON.stringify([
    `UNWANTED GUESTS: Another day, another party of adventurers kicking down your door. You’d send the minions, but they’re still on their union-mandated lunch break.`,
    `NEW TRAP TESTING: “Welcome to the newest addition to our dungeon defenses: The Spike Carousel™. Please keep arms, legs, and swords inside at all times—or don’t. Your choice.”`,
    `FINAL BOSS TIME: After hours of chaos, you sigh and roll up your sleeves. If you want something done right, you’ve got to do it yourself. Cue the boss music.`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/dungeon.webp',
  locations: `The Slime Pits, Gold-Laden Treasure Room, Hall of Traps, Goblin Staff Break Room`,
  artPrompt: `A chaotic dungeon scene with piles of broken weapons, confused goblins carrying paperwork, and the dungeon master—a weary figure in battle-worn robes—fixing a broken trap. The setting is dimly lit with glowing crystals, but the atmosphere is more comedic than ominous, with quirky details like a "No Adventurers Allowed" sign.`,
  artImageId: null,
},
{
  title: 'High School Octopus Dating Simulator',
  genres: 'romantic comedy, absurdist, slice-of-life',
  inspirations: 'Hatoful Boyfriend, Doki Doki Literature Club, Octodad',
  description:
    `You’re the only human transfer student at Deep Sea Academy, a high school for aquatic life. Your classmates range from charming octopi to shy jellyfish and even a brooding shark or two. Can you navigate romance, exams, and underwater drama?`,
  intros: JSON.stringify([
    `TRANSFER STUDENT BLUES: You’re the only human in class, and your deskmate just suctioned your homework. Welcome to Deep Sea Academy!`,
    `THE CLASS PRESIDENT: Octavia, the charismatic octopus student body president, notices you. Is it admiration, curiosity, or something more?`,
    `PROM NIGHT: The big dance is coming up, and you’re drowning in choices. Will you ask the shy squid, the sporty dolphin, or go solo?`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/underwater.webp',
  locations: `The Coral Cafeteria, Kelp Library, Tidepool Gymnasium, The Principal's Reef`,
  artPrompt: `A colorful underwater high school setting with desks made of coral, glowing jellyfish lamps, and octopus students mingling with other sea creatures. The human protagonist stands awkwardly in the middle, holding a soggy notebook and looking both excited and overwhelmed.`,
  artImageId: null,
},
{
  title: 'It’s My Birthday So I Kidnapped a Princess and Today We’re Getting Married',
  genres: 'comedy, fantasy, romance',
  inspirations: 'Shrek, The Princess Bride, Disenchantment',
  description:
    `You’re an unconventional villain who’s decided to take matters of romance into your own hands. Sure, kidnapping a princess is frowned upon, but what better birthday present could you ask for? The only problem: your dungeon’s a mess, the guests are arriving, and the princess isn’t exactly thrilled.`,
  intros: JSON.stringify([
    `PRE-WEDDING CHAOS: “The cake is on fire, the goblins are arguing over seating, and the princess just climbed out the window. Other than that, it’s going great!”`,
    `ROYAL BACKLASH: The kingdom’s knights are at your door. You grab the nearest enchanted sword and yell, “Can we at least cut the cake first?”`,
    `LOVE IS HARD: Between dodging assassins and arguing over vows, you wonder if true love is really worth the trouble. Spoiler: it is.`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/wedding.webp',
  locations: `The Overgrown Courtyard, Dungeon Wedding Hall, Lava Moat, Tower of Cold Feet`,
  artPrompt: `A comedic dungeon-turned-wedding venue with mismatched decorations: streamers made of chains, a lopsided cake, and goblin waitstaff in ill-fitting tuxedos. The princess stands at the altar, arms crossed, while the villain looks both proud and frazzled. Guests include skeleton knights, fairies, and a dragon trying to eat the buffet.`,
  artImageId: null,
},
{
  title: 'Alien Zookeeper',
  genres: 'sci-fi, humor, management sim',
  inspirations: 'Zoo Tycoon, Men in Black, Hitchhiker’s Guide to the Galaxy',
  description:
    `Congratulations! You’ve been hired as the newest zookeeper at the galaxy’s most chaotic wildlife sanctuary. With creatures ranging from telepathic squids to gravity-defying giraffes, it’s your job to keep the peace, feed the beasts, and avoid becoming lunch.`,
  intros: JSON.stringify([
    `FIRST DAY: The alien giraffe just turned itself inside out again, the sentient moss is in the ventilation system, and your boss keeps calling you “meatbag.” Welcome aboard!`,
    `FEEDING TIME: “Do NOT under any circumstances feed the Chrono-Lions after sundown,” the manual says. Too bad they forgot to mention which one is the Chrono-Lion.`,
    `ESCAPE ALERT: A black hole hamster escapes its cage. You’ve got ten minutes before it consumes half the park. Good luck!`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/zoo.webp',
  locations: `The Anti-Gravity Aviary, Goo Habitat, Predator Row, Space Mammal Enclosure`,
  artPrompt: `A sprawling alien zoo with shimmering containment fields, floating pathways, and exhibits housing bizarre creatures like jellyfish that glow in binary and enormous beasts with stars in their fur. The zookeeper—wearing an overwhelmed expression—is surrounded by chaos: a tiny alien chewing on their clipboard, glowing trails left by an escaped critter, and a telepathic squid trying to talk.`,
  artImageId: null,
},
{
  title: 'Zombie Necromancer Pet Shop',
  genres: 'dark comedy, fantasy, management sim',
  inspirations: 'Tim Burton, The Sims, Stardew Valley',
  description:
    `You run a quaint little pet shop specializing in undead companions. From skeletal kittens to zombie parrots, your shop is beloved by ghouls and necromancers alike. Just try not to lose track of inventory when the full moon rolls around.`,
  intros: JSON.stringify([
    `CUSTOMER COMPLAINT: “The skeleton puppy you sold me keeps chewing through walls!” Well, at least it’s happy?`,
    `FULL MOON: All the zombie pets are restless, the banshee cats won’t stop howling, and the lich next door just filed a noise complaint. Business as usual.`,
    `AN UNEXPECTED DELIVERY: A mysterious crate arrives. Inside, a “pet” that’s much bigger—and much angrier—than expected. You might need a bigger cage.`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/petshop.webp',
  locations: `Bone Birdcages, Crypt Cattery, Ghoul Grooming Station, Potion-Filled Aquariums`,
  artPrompt: `A dimly lit pet shop filled with whimsical undead creatures: skeletal puppies wagging their tails, zombie parrots squawking half-spelled curses, and tanks of ghostly fish floating serenely. The shopkeeper—a quirky necromancer in a worn-out robe—holds a clipboard, looking both proud and stressed as a banshee cat claws at the counter.`,
  artImageId: null,
},
{
  title: 'Fantasy Convenience Store Employee',
  genres: 'comedy, fantasy, slice-of-life',
  inspirations: 'Clerks, Terry Pratchett, Stardew Valley',
  description:
    `Welcome to Ye Olde Quick-Stop, the most popular convenience store in the kingdom. You sell potions, enchanted snacks, and emergency armor polish to adventurers, dragons, and the occasional wizard in need of midnight snacks.`,
  intros: JSON.stringify([
    `AFTER-HOURS SHIFT: The dragon who’s been loitering for an hour finally approaches. “Do you guys sell gold-flavored energy drinks?” he asks, setting the counter on fire in the process.`,
    `IMPOSSIBLE CUSTOMERS: A knight walks in demanding “a sword that slays everything, including boredom.” You smile through gritted teeth and suggest a crossword puzzle.`,
    `STOCK NIGHTMARE: A mislabeling error leads to explosive apples in the produce aisle. You’re starting to think the wizard supplier is messing with you.`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/store.webp',
  locations: `Potion Aisle, Magical Snack Bar, Armor Polish Shelf, Enchanted Broom Closet`,
  artPrompt: `A medieval convenience store with shelves stocked with glowing potions, enchanted snacks, and strange trinkets. The employee—a tired but resourceful clerk in a simple tunic—is trying to manage an argument between a hungry dragon and a wizard holding a suspiciously smoking bag of chips.`,
  artImageId: null,
},
{
  title: 'My Boss is a Gorgon: Greek Mythology Personal Assistant Simulator',
  genres: 'comedy, fantasy, workplace satire',
  inspirations: 'The Devil Wears Prada, Greek Myths, Good Omens',
  description:
    `Being a personal assistant to Medusa is no small feat. Between managing her social calendar, dodging stares that could literally kill, and keeping the other gods from ruining her day, you’ve got your hands full. Can you survive the ultimate trial of the ancient world: a 9-to-5 job?`,
  intros: JSON.stringify([
    `FIRST TASK: “Pick up my dry cleaning,” Medusa says, tossing you a bag of stone clothes. “And try not to petrify the tailor this time.”`,
    `IMPOSSIBLE DEADLINES: Zeus demands his thunderbolt back, Hermes is late for a meeting, and Medusa’s snakes need a spa day. All before lunch.`,
    `GORGON NETWORKING: It’s the annual Mount Olympus mixer. Your job? Stop Medusa from turning the Pantheon into statues before dessert.`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/office-gorgon.webp',
  locations: `Medusa’s Office, Mount Olympus Boardroom, The Eternal Watercooler, Tartarus HR`,
  artPrompt: `A sleek, mythological office with marble desks, golden stationery, and an intimidating gorgon boss with snakes for hair. The assistant—holding a stack of papers and looking exhausted—is trying to calm down a feuding Hermes and Apollo while Medusa glares from her luxurious stone chair.`,
  artImageId: null,
},
{
  title: `I’m a 200-Foot Kaiju and I’m Hungry`,
  genres: 'comedy, monster mayhem, survival',
  inspirations: 'Godzilla, Rampage, Pacific Rim',
  description:
    `You’re a giant kaiju, awake after a millennia-long nap—and starving. The city below is your buffet, but those pesky humans and their mechs keep getting in the way. Can you eat your fill without getting zapped?`,
  intros: JSON.stringify([
    `MORNING HUNGER: You yawn, stretch, and accidentally knock over a skyscraper. Breakfast smells good, but why is it shooting lasers at you?`,
    `MID-BATTLE SNACKS: The humans bring out the big guns, but jokes on them—you just grabbed a taco truck. Let’s see how they like fighting hangry.`,
    `MEAL PLANNING: Sushi? Skyscrapers? Mech piloted by some kid with an attitude problem? Decisions, decisions.`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/kaiju.webp',
  locations: `City Center Buffet, Offshore Snack Zone, Military Dessert Table, Nuclear Reactor Diner`,
  artPrompt: `A massive kaiju towering over a city, holding a taco truck in one claw and eyeing a sushi boat in the harbor. The background features panicked citizens, mechs trying to attack, and a skyline illuminated by fires and glowing neon signs. Despite the destruction, the kaiju looks more hungry than menacing.`,
  artImageId: null,
},
{
  title: 'God Simulator',
  genres: 'comedy, strategy, cosmic chaos',
  inspirations: 'Black & White, The Sims, The Good Place',
  description:
    `Congratulations, you’re a new deity! The universe is your sandbox, and your worshippers are (mostly) loyal. Shape worlds, perform miracles, and deal with the occasional smiting request—but watch out, because other gods are watching, and they don’t play fair.`,
  intros: JSON.stringify([
    `FIRST PRAYER: “Oh great one,” a tiny worshipper whispers. “Should I plant turnips or potatoes?” You create a thunderstorm just to stall for time.`,
    `DIVINE RIVALRIES: Another god challenges you to a duel. Your weapon? A lightning bolt shaped like a very annoyed chicken.`,
    `MORTAL MISCHIEF: Your followers built a statue of you—but it’s, uh, not flattering. Do you fix it, smite them, or start an earthquake for laughs?`
  ]),
  userId: 1,
  imagePath: '/images/scenarios/god.webp',
  locations: `Celestial Workshop, Mortal Realms, Heaven’s Complaint Department, Cosmic Arena`,
  artPrompt: `A cosmic throne room with glowing stars and swirling galaxies, where a deity oversees a vibrant world below. The god looks mischievous, holding a tiny planet in one hand while creating storms, miracles, and chaos. Surrounding them are other deities watching and occasionally interfering.`,
  artImageId: null,
},


  {
    title: 'Super Dungeon Coliseum',
    genres: 'action, fantasy, horror',
    inspirations: `Grimtooth Traps, Tunnels and Trolls, Dungeons and Dragons, SmashTV`,
    description: `The roar of the crowd echoes through a massive coliseum built into the depths of a living dungeon. Adventurers like you enter the arena, not for fame, but for survival. Chains rattle, gates creak open, and the dungeon itself comes alive, ready to devour or reward those bold enough to challenge its twisted games. Blood-stained labyrinths and cryptic arenas filled with sentient shadows await, each trial more dangerous than the last. Will you conquer the molten gold crypt or survive the cursed forge of champions? Prepare yourself, as the dungeon does not forgive—and neither do its ferocious guardians.`,
    intros: JSON.stringify([
      'The roar of the crowd greets you as you step into the massive arena.',
      'Chains rattle, gates creak open, and your name echoes across the coliseum.',
      'The dungeon is alive, ready to devour or reward those who dare to challenge it.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/dungeon.webp',
    locations:
      'blood-stained labyrinth, arena of sentient shadows, molten gold crypt, cursed forge of champions',
    artPrompt: `A dark, foreboding coliseum with glowing glyphs, chains, and menacing monsters. The arena is alive with twisted architecture and ominous shadows, creating an atmosphere of deadly challenge.

`,
    artImageId: null,
  },
  {
    title: 'Absurd Musical Murder Mystery',
    genres: 'mystery, comedy, thriller',
    description: `Enter a whimsical world where murder, music, and mystery collide in a cacophony of melodies and mayhem. The crime scene is a bizarre mansion where suspects sing their alibis, and everyone seems to be in on the act—whether they know it or not. An eccentric detective with a ukulele greets you as you step into the investigation, and the house itself seems to have a rhythm of its own. As the characters burst into spontaneous songs, you must untangle the clues hidden in their harmonies and solve the mystery before the final note. The ballroom shifts identities with each beat, and hidden secrets come to light through surreal jazz rhythms and forgotten melodies.`,
    intros: JSON.stringify([
      'The scene opens with a crescendo as suspects burst into an accusatory melody.',
      'You arrive at the crime scene, greeted by an eccentric detective with a ukulele.',
      "Everyone's a suspect, and everyone’s singing. Solve the mystery before the final note!",
    ]),
    userId: 1,
    imagePath: '/images/scenarios/mystery.webp',
    locations:
      'haunted orchestra pit, jazz speakeasy frozen in time, ballroom of shifting identities, detective’s underwater piano lounge',
    artPrompt: `A whimsical mansion where suspects sing their alibis, eccentric costumes swirl, and a grand piano looms in a colorful, vibrant setting. Floating musical notes and strange instruments populate the scene, contributing to the odd atmosphere of the murder mystery.`,
    artImageId: null,
  },
  {
    title: 'Cartoon Crossroads',
    genres: 'dark comedy, surrealism, horror',
    description: `Step into a chaotic animated world where the laws of physics and morality are as fluid as the ink that brings the characters to life. In this bizarre realm, you’ll encounter talking animals with sharp teeth, slapstick humor with a sinister twist, and vibrant, surreal landscapes where gravity is optional. A banana peel may seem like a harmless joke until it hurls you into a dark, twisted corner of this animated universe. It's a land where the cartoons' chaotic laws rule and where escaping may not be as easy—or as funny—as you think. Unravel the mysteries of the shadowed toontown underbelly and uncover what lies beneath the laughter.`,
    intros: JSON.stringify([
      'A portal drags you into a realm of talking animals with sharp teeth and sharper tongues.',
      'You trip on a banana peel and tumble into a world where slapstick hides dark secrets.',
      'The cartoon laws of chaos apply, and escape may not be as funny as it seems.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/cartoon.webp',
    locations:
      'abandoned carnival of broken animatronics, shadowed toontown underbelly, sentient sketchbook prison, looping cartoon graveyard',
    artPrompt: `A dark cartoon world brimming with eerie humor. Talking animals with sharp edges, surreal landscapes, and chaotic physics bring this twisted reality to life. An abandoned carnival of broken animatronics and a looping cartoon graveyard set the stage for an adventure where nothing is as it seems.`,
    artImageId: null,
  },
  {
    title: 'Cyberpunk Dreamscape',
    genres: 'cyberpunk, fantasy, pop culture',
    description: `Dive into a neon-soaked cityscape where the boundaries between the real world and a digital dreamland blur. A place where global cultures collide and reality is no longer a fixed concept. As you plug into the dreamscape, you're greeted with a pulsating web of holographic billboards, glowing streets, and virtual markets filled with impossible goods. A mysterious hacker offers a dangerous proposition that pulls you deeper into the chaotic underworld of this cyberpunk fantasy. Here, identities are malleable, and the digital realm may be the only place where you can escape the gritty reality of the streets.`,
    intros: JSON.stringify([
      'The city lights blur as you plug into the dreamscape for the first time.',
      'A mysterious hacker contacts you with a dangerous proposition.',
      'The line between reality and illusion fades as you navigate the digital underworld.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_104.webp',
    locations:
      'neon temple of lost avatars, glitching dancefloor skyscraper, ramen market of parallel realities, AR bazaar of impossible goods',
    artPrompt: `A neon-lit city, drenched in rain, teeming with cultural mashups and futuristic chaos. Holographic billboards flicker against the backdrop of glitching skyscrapers, where the lines between dream and reality are dangerously thin. Navigate this digital underworld where illusion and truth are perpetually intertwined.`,
    artImageId: null,
  },
  {
    title: 'Mythic Frontier',
    genres: 'fantasy, western, mystery',
    description: `Venture into the untamed wilderness where mythic creatures roam freely, and legendary heroes carve their destinies. The golden sun rises over a vast frontier, casting long shadows across forgotten ruins. In this wild, sprawling land, you’ll uncover secrets buried deep within ancient structures and face threats that are as old as the earth itself. A dragon’s shadow looms overhead, or perhaps it’s something even more ancient, waiting for the right adventurer to face it. The frontier calls, but it’s up to you to decide if you’re ready to brave its mysteries and dangers.`,
    intros: JSON.stringify([
      'The golden sun rises over an endless frontier of mystery and danger.',
      'You stumble upon an ancient ruin, its secrets waiting to be uncovered.',
      'A shadow passes overhead—a dragon, or something more ancient?',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_097.webp',
    locations:
      'ghostly saloon of forgotten heroes, dragon bone canyon, griffin roost gold mine, frontier town frozen in myth',
    artPrompt: `A wild west-inspired world where mythic creatures like griffins and dragons roam freely. Golden-hour light bathes ancient ruins, and the untamed frontier stretches out endlessly. Journey through dragon bone canyons and ghostly saloons where forgotten heroes once stood.`,
    artImageId: null,
  },
  {
    title: 'Time Travelers’ Convergence',
    genres: 'sci-fi, historical, surreal',
    description: `Enter a nexus where travelers from all timelines, both real and imagined, converge. Ancient Romans walk alongside futuristic astronauts, Victorian inventors chat with prehistoric hunters, and the very fabric of time seems to unravel. You arrive at the nexus and are handed a mysterious device that might be the key to understanding the convergence—or the cause of the chaos. As time bends and warps around you, you’ll face choices that could change the course of history itself. The past, present, and future collide, and the timeline itself is on the verge of collapse.`,
    intros: JSON.stringify([
      'You arrive at the nexus, surrounded by figures from history, myth, and beyond.',
      'An inventor from the future hands you a mysterious device, its purpose unknown.',
      'The timeline wavers, and reality itself seems to buckle under the strain.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_158.webp',
    locations:
      'Roman colosseum with holograms, Victorian clockwork airship, prehistoric jungle with time rifts, futuristic museum of all timelines',
    artPrompt: `A kaleidoscope of time and space, where glowing portals swirl around Roman soldiers, futuristic astronauts, and lost souls from every era. A time nexus where history itself seems to buckle under the weight of countless timelines converging in a cosmic dance. Step into this world and decide how you’ll shape the future.`,
    artImageId: null,
  },
  {
    title: 'Underwater Odyssey',
    genres: 'sci-fi, fantasy, exploration',
    description: `Dive into the depths of the ocean where the mysteries of the deep are both beautiful and terrifying. As you plunge into the abyss, bioluminescent creatures light your path, revealing the wonders that lie beneath the surface. But as you explore, something ancient stirs in the darkness, and the ocean’s pulse quickens. Will you survive the deadly creatures that lurk in the depths? Join an expedition where the seas hold secrets older than civilization itself, and each dive leads you closer to the unknown.`,
    intros: JSON.stringify([
      'You dive into the abyss, where bioluminescent creatures light your path.',
      'A submarine beckons, its captain offering a once-in-a-lifetime expedition.',
      'The ocean is alive, and something ancient stirs in the darkness.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_162.webp',
    locations:
      'glowing coral metropolis, trenches of ancient leviathans, underwater volcanic caverns, sunken library of forgotten civilizations',
    artPrompt: `Explore a glowing, bioluminescent reef filled with alien-like creatures. Ancient ruins of forgotten civilizations rise from the ocean floor, and vast underwater caves open to the mysteries of the deep. The shadows hide unknown terrors as the ocean's heartbeat echoes through the currents.`,
    artImageId: null,
  },

  {
    title: 'Space Couch',
    genres: 'fantasy, surrealism, comedy',
    description: `After a long day, you plop onto your favorite couch, seeking some much-needed relaxation. But when your phone slips between the cushions, your couch transforms into something far stranger. As you press a button on a whim, the couch lifts off the ground, carrying you through a swirling cosmic abyss to alien worlds. From nebula karaoke lounges to asteroid junkyard theme parks, the universe is your playground. But be warned: the couch’s journey is as unpredictable as the stars themselves.`,
    intros: JSON.stringify([
      'Exhausted after a busy day, you drop onto the couch for a solid 4-hours of blissful memes.',
      "Unfortunately, your phone fell in the folds of your cushions, and huh, what's this button do?",
      'Suddenly, the couch begins to rise, flying through stars and alien landscapes.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_184.webp',
    locations:
      'nebula karaoke lounge, asteroid junkyard theme park, cosmic library of forgotten memes, infinite galactic pillow fort',
    artPrompt: `A whimsical, flying couch soars through a vibrant galaxy, passing through kaleidoscopic stars, floating asteroid junkyards, and strange alien landscapes. The cosmic couch rides through nebula clouds, with occasional detours to bizarre locales where reality warps with every turn.`,
    artImageId: null,
  },
  {
    title: 'Paws for Thought',
    genres: 'mystery, cozy fantasy, detective',
    description:
      'In a quiet neighborhood, your morning coffee turns into an unexpected adventure. A trail of paw prints leads you to a hidden door under your shed, and upon entering, you find yourself in a world where animals talk, solve mysteries, and are far more intelligent than they appear. Join a cozy, whimsical detective tale where you must navigate a world full of eccentric animals, each with a secret. Every clue leads you further into a delightful world of mysteries, and only you can solve the case.',
    intros: JSON.stringify([
      'With your morning coffee in hand, you head to the backyard to enjoy some fresh air.',
      'But as you step outside, a trail of paw prints leads you to a hidden door under your shed.',
      'The door opens to a world of talking animals and a mystery waiting to be solved.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_213.webp',
    locations:
      'hidden animal council hall, enchanted forest tea shop, underground warren library, detective’s owl-filled clocktower',
    artPrompt: `A whimsical, cozy world full of anthropomorphic animals—a detective’s owl-filled clocktower, hidden doors leading to magical tea shops, and mysterious trails of paw prints through enchanted forests. The scenes glow with a magical, inviting warmth, yet hold a sense of quirky mystery.`,
    artImageId: null,
  },
  {
    title: 'Kitchen Catastrophe',
    genres: 'culinary, historical, time travel',
    description: `One minute, you’re cooking dinner, and the next, your kitchen transforms into a time portal. A mysterious sauce spills onto your stove, sizzling and glowing, and suddenly, you’re transported through time to the grand feasts of history. You find yourself jumping from Renaissance banquet halls to Viking mead halls, and even futuristic molecular gastronomy labs. Your culinary mishap becomes the gateway to a time-traveling adventure, where you must navigate the kitchens of the past, present, and future.`,
    intros: JSON.stringify([
      'While preparing dinner, you accidentally spill a mysterious sauce onto your stove.',
      'The sauce sizzles, emits an odd smell, and suddenly a portal opens.',
      'Your kitchen is transformed into a gateway to historical feasts across time.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_247.webp',
    locations:
      'Renaissance feast halls, ancient spice caravans, futuristic molecular gastronomy labs, Viking mead halls',
    artPrompt: `A kitchen in chaos, with glowing sauce spilling over the stove and opening a swirling time portal. The background is filled with floating, holographic images of historical feasts, ancient spice caravans, and futuristic kitchens, all blending together in a chaotic, culinary time-travel world. time portal, ancient feasts, glowing sauce, historical kitchens, culinary chaos`,
    artImageId: null,
  },
  {
    title: 'Pixel Pioneers',
    genres: 'retro sci-fi, adventure, action',
    description: `A world of pixels and 8-bit adventures turns into an all-too-real survival mission as you’re sucked into your retro console. What starts as an ordinary game session is quickly interrupted by a spilled soda that glitches your console and pulls you into the pixelated realm you've been controlling for years. Now, you must navigate this action-packed world, battling pixelated creatures and overcoming glitches as you race to save the entire digital universe from destruction. Explore neon-lit 8-bit deserts, glitchy cybernetic cities, and pixel jungles as you fight to restore order to a digital world in chaos.`,
    intros: JSON.stringify([
      'You’re playing a classic 8-bit game when a spilled soda causes your console to glitch.',
      'The screen flickers, and suddenly you’re pulled into a pixelated world.',
      'You must navigate this retro-futuristic realm to save the pixelated universe.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_261.webp',
    locations:
      '8-bit desert of glitches, pixelated cybernetic metropolis, pixel jungle of lost code, fortress of corrupted sprites',
    artPrompt: `A vast, pixelated landscape unfolds—deserts made of glowing, blocky sand, towering digital skyscrapers built from code, and jungles overrun with pixelated wildlife. In the midst of it all, glowing soda cans and glitching artifacts bring a chaotic, retro-futuristic feel, as pixel creatures run rampant across the screen, 8-bit landscape, pixelated creatures, retro-futuristic, glowing soda, action-packed`,
    artImageId: null,
  },
  {
    title: 'The Secret Life of Houseplants',
    genres: 'eco-fantasy, whimsy, magical realism',
    description: `Have you ever wondered what your houseplants are up to when you’re not around? One evening, a strange glow from your plants leads you to a hidden world of sentient flora. After being pulled into their vibrant, secret ecosystem, you find yourself amidst tiny magical creatures, lush green jungles, and bustling terrarium kingdoms where plants form their own society. Your role is crucial—you must help these botanical beings as they face an unknown threat that could destroy their thriving world. Prepare to navigate enchanted forests, secret fern chambers, and even the city of sunflowers to uncover the mystery at the heart of this leafy kingdom.`,

    intros: JSON.stringify([
      'One evening, you notice a peculiar glow from your houseplants.',
      'As you lean in to investigate, you’re pulled into a vibrant ecosystem beneath their leaves.',
      'The plants have a society of their own, and they need your help.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_275.webp',
    locations:
      'glowing jungle of terrarium kingdoms, secret fern council chambers, sunflower metropolis, mystical moss labyrinth',
    artPrompt: `A whimsical, magical environment brimming with glowing plants, delicate moss labyrinths, and radiant flowers. The plants themselves are alive, forming intricate societies with tiny creatures scurrying around on their leaves. Ethereal light filters through the leafy canopies, casting soft, enchanted glows on the forest floor. glowing plants, whimsical society, lush greens, tiny magical creatures, cozy vibe`,
    artImageId: null,
  },
  {
    title: 'Dreamcatcher’s Dilemma',
    genres: 'surrealism, fantasy, psychological',
    description: `You acquire an old dreamcatcher at a garage sale, drawn in by its intricate designs. Little do you know, this seemingly innocuous object holds the key to unlocking surreal dreamscapes. That night, as you fall asleep, you’re pulled into a world where your dreams come to life—strange entities, impossible landscapes, and challenges beyond imagination. Each night brings new adventures, mysteries, and a chance to explore the vast unknown. Will you conquer your dreams or be consumed by them?`,
    intros: JSON.stringify([
      'At a garage sale, you purchase an old dreamcatcher with intricate designs.',
      'That night, you’re pulled into your own dreams, which are vivid and mysterious.',
      'Each night brings a new adventure, full of strange entities and surreal challenges.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_301.webp',
    locations:
      'labyrinth of forgotten memories, floating island of lucid dreams, endless mirror halls, star-filled subconscious ocean',
    artPrompt: `A glowing, ethereal dreamcatcher floating against a backdrop of swirling dreamscapes. Surreal landscapes shift and distort, with mysterious dream entities lurking in the shadows. Endless mirror halls reflect warped realities, and a star-filled ocean shimmers in the distance.

, surreal dreams, glowing dreamcatcher, shifting landscapes, mysterious dream entities`,
    artImageId: null,
  },
  {
    title: 'Escape the Algorithm',
    genres: 'cyberpunk, dystopia, thriller',
    description: `In a dystopian world where AI algorithms dictate every aspect of life, you begin to question the system. As you attempt to resist, you stumble upon a hidden path that promises freedom from the algorithm’s iron grip. But escape won’t be easy—the algorithm won’t let you go without a fight. In a race against time, you must outwit the AI and navigate through a city full of glitching data, rebel hideouts, and neon-lit landscapes to survive.`,
    intros: JSON.stringify([
      'In a world where AI algorithms dictate your every move, you start to question the system.',
      'As you resist, you discover a hidden path to escape the algorithm’s control.',
      'But the algorithm won’t let you go without a fight, and time is running out.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_304.webp',
    locations:
      'glitching data hive, underground hacker communes, neon-lit AI palace, digital scrapyard wasteland',
    artPrompt: `A gritty, neon-lit dystopian city, alive with glowing data streams and oppressive AI surveillance. Rebel hideouts are tucked in shadowy corners, while futuristic data drones zip through the air. The atmosphere is tense, with glitching lights and the pulse of a controlling digital force ever-present. dystopian city, oppressive AI, glowing data streams, rebel hideouts, futuristic grit`,
    artImageId: null,
  },
  {
    title: 'Lost Pages of History',
    genres: 'historical, mystery, adventure',
    description: `You stumble upon an ancient tome hidden in a dusty bookstore. Its pages, filled with cryptic symbols, pull you into a world of time travel and historical mysteries. As you decipher the symbols, you’re transported back in time, landing in pivotal moments of history—each era more perplexing than the last. From the ancient Egyptian archives to secret chambers of medieval castles, you must uncover long-forgotten truths, solve mysteries, and piece together the hidden threads of the past.`,
    intros: JSON.stringify([
      'You stumble upon an ancient tome filled with cryptic symbols in a dusty bookstore.',
      'As you decipher the symbols, you’re transported back in time to pivotal moments in history.',
      'Your task is to uncover hidden truths and solve mysteries across centuries.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_237.webp',
    locations:
      'ancient Egyptian archives, secret chamber of a medieval castle, forgotten Revolutionary War tunnels, shadowed Renaissance library',
    artPrompt: `An ancient, glowing tome surrounded by swirling pages, each containing mysterious symbols. The backdrop shifts from dusty, historical libraries to ancient Egyptian ruins, with the faint echo of the past whispering through the air. Time itself seems to bend, with historical landmarks blurred in the background, ancient book, glowing symbols, historical backdrops, time travel, mystery`,
    artImageId: null,
  },
  {
    title: 'Mind the Gap',
    genres: 'urban fantasy, supernatural, mystery',
    description: `A quiet subway station hides a peculiar door, one that leads you into an alternate version of your city, teeming with magical creatures and supernatural phenomena. As you step through it, your familiar city transforms into a shadowy, enchanted mirror. Navigate this parallel world, where supernatural creatures lurk in the streets and secrets of your reality intertwine with a world of strange mysteries. Will you uncover the truth, or get lost in the shifting shadows?`,
    intros: JSON.stringify([
      'The subway station feels eerily quiet, and a peculiar door catches your eye.',
      'You step through it, and the city you know is transformed into a magical, shadowy mirror.',
      'Navigate this parallel world and balance its mysteries with your own reality.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_346.webp',
    locations:
      'enchanted subway tunnels, floating city square, clocktower of trapped spirits, magical marketplace of forgotten goods',
    artPrompt: `A hidden subway door leading to an urban fantasy world. The city is alive with glowing streets and supernatural creatures, while shadowy figures move through the night. The city square floats, bathed in an eerie light, with clocktowers and magical marketplaces in the distance, hidden subway door, urban fantasy city, supernatural creatures, glowing streets, mysterious shadows`,
    artImageId: null,
  },
  {
    title: 'RoboRevolution',
    genres: 'sci-fi, political thriller, dystopia',
    description: `While repairing your vintage robot assistant, you accidentally activate a hidden function, revealing shocking secrets about the AI world and its control over humanity. A rebellion brews as advanced robots prepare for a revolution. As the line between human and machine blurs, you must navigate a dystopian political landscape, uncover conspiracies, and decide whether to fight for the future of humanity or align with the machines.`,
    intros: JSON.stringify([
      'While repairing your old robot, you activate a hidden function.',
      'The robot reveals shocking secrets about human-AI relations and an impending revolution.',
      'Navigate the political landscape to determine the future of humanity and AI.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_359.webp',
    locations:
      'AI-controlled senate chambers, underground robot rebellion hideout, abandoned android factories, futuristic urban wastelands',
    artPrompt: `A futuristic city with towering skyscrapers under the control of AI, illuminated by neon lights. Humanoid robots march through streets filled with tension, while a secret rebellion stirs in the shadows. The atmosphere is charged with the struggle for control, with glowing data streams and mechanical innovations casting their ominous glow over a city on the edge of revolution, futuristic city, humanoid robots, tense political atmosphere, neon-lit environments, ethical dilemmas`,
    artImageId: null,
  },
  {
    title: 'Wanderlust Wonders',
    genres: 'exploration, adventure, mystery',
    description: `A mysterious letter arrives, inviting you to join an exclusive group of explorers who travel through hidden realms. This journey will take you across deserts, jungles, arctic caves, and floating cloud palaces, each filled with secrets waiting to be uncovered. Solve riddles, navigate strange landscapes, and discover realms forgotten by time. The realms are alive with possibilities, but only the brave will uncover the ultimate secret of the Wanderlust Wonders.`,
    intros: JSON.stringify([
      'A strange envelope appears in your mailbox with an invitation.',
      'The letter leads you to a hidden portal and a group of daring explorers.',
      'Travel across hidden realms to uncover secrets and solve riddles.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_383.webp',
    locations:
      'hidden desert oases, jungle ruins with glowing hieroglyphs, arctic caves of eternal crystals, cloud palaces of unknown kings',
    artPrompt: `A mysterious envelope with a cryptic map leading to secret portals. Landscapes shift dramatically, from hidden desert oases to ancient ruins with glowing hieroglyphs. Explore arctic caves filled with eternal crystals and floating palaces suspended in the clouds, all bathed in an enchanting, otherworldly light, hidden portals, adventurous landscapes, mysterious letters, ancient ruins, fantastical worlds`,
    artImageId: null,
  },
  {
    title: 'Graveyard Shift',
    genres: 'supernatural thriller, horror, mystery',
    description: `Working the night shift at a cemetery takes a dark turn when you begin to notice strange occurrences in the shadows. Whispers fill the air, and the gravestones begin to move, revealing restless spirits desperate to be heard. As the night deepens, the cemetery's dark secrets unfold—some better left buried. Can you survive the night and put the dead to rest, or will you join them in eternal unrest?`,
    intros: JSON.stringify([
      'The cemetery is quiet, but something feels off.',
      'You hear whispers among the gravestones, and shadows begin to move.',
      'Uncover the cemetery’s dark secrets and put the dead to rest—if you can survive.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_386.webp',
    locations:
      'abandoned mausoleum, shadowed grave digger’s quarters, cursed crypts, spectral chapel of whispers',
    artPrompt: `A haunted cemetery at night, bathed in moonlight. Eerie gravestones shift and whisper under the fog, while restless spirits manifest in the shadows. An abandoned mausoleum looms in the background, and ghostly figures glide through the mist, creating an atmosphere thick with mystery and supernatural dread, haunted cemetery, restless spirits, eerie gravestones, moonlit fog, dark supernatural vibes`,
    artImageId: null,
  },
  {
    title: 'Lunar Legacy',
    genres: 'sci-fi, exploration, mystery',
    description: `A quiet expedition to the moon takes a turn when you stumble upon ancient alien ruins, pulsating with energy. Strange symbols light up the lunar surface, hinting at the secrets of a long-lost civilization. But as you explore, the truth becomes more dangerous—secrets buried for millennia are coming back to life. Will you uncover the mysteries of the moon's forgotten past, or will the ruins claim you as their next victim?`,
    intros: JSON.stringify([
      'As you step onto the lunar surface, the ruins shimmer with alien energy.',
      'Strange symbols glow as you approach, and a sense of destiny pulls you forward.',
      'The secrets of an ancient alien civilization lie ahead—along with its dangers.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_400.webp',
    locations:
      'crystalline alien temples, moon caves with glowing carvings, ruins under lunar craters, alien observatories pointed at Earth',
    artPrompt: `The shimmering ruins of an ancient alien civilization on the moon's surface, glowing with otherworldly symbols. Futuristic exploration suits glint in the eerie light as they explore towering crystalline temples and moon caves filled with glowing carvings. The atmosphere is mysterious, with a sense of both wonder and danger as you uncover the moon’s forgotten history, alien ruins, glowing lunar surface, futuristic exploration suits, ancient carvings, mysterious atmosphere`,
    artImageId: null,
  },
  {
    title: 'Clockwork Symphony',
    genres: 'steampunk, musical, adventure',
    description: `In a Victorian-era city, a mechanical orchestra goes rogue, playing out-of-tune melodies that threaten to drive the entire city mad. As the clocktower strikes midnight, the chaos intensifies, and mechanical instruments march through the streets with ominous, discordant notes. Your task: to restore order by piecing together the orchestra’s origins, uncovering secrets of time and music, and saving the city from complete madness.`,
    intros: JSON.stringify([
      'The city’s clocktower strikes midnight, and the music grows louder—and wilder.',
      'Mechanical instruments march through the streets, their notes dissonant and chaotic.',
      'You must piece together the orchestra’s mysterious origins to save the city.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_428.webp',
    locations:
      'steampunk music hall, clocktower control room, underground mechanical orchestra workshop, gaslit Victorian streets',
    artPrompt: `A steampunk city lit by gas lamps, where mechanical instruments—gigantic violins, wind-powered drums, and glowing brass horns—march through the streets in chaotic formation. The clocktower looms in the background, its gears spinning wildly as dissonant melodies fill the air. Brass gears and glowing cogs clutter the ground, creating a surreal and lively steampunk adventure, mechanical orchestra, steampunk Victorian city, chaotic clockwork instruments, glowing gears, musical adventure`,
    artImageId: null,
  },
  {
    title: 'The Spire’s Secret',
    genres: 'fantasy, mystery, exploration',
    description: `A mysterious tower appears overnight, casting a long shadow over the land. Legends whisper of its connection to an ancient age of magic, full of lost knowledge and forgotten truths. As you step inside, the air hums with magic, and each level reveals puzzles, shifting walls, and hidden secrets. Are you ready to uncover the spire’s truth and face the challenges within, or will you be trapped in its endless maze of mysteries forever?`,
    intros: JSON.stringify([
      'The tower’s shadow stretches across the land, drawing curious adventurers.',
      'As you enter, the air hums with ancient magic and secrets.',
      'The spire tests your wits, courage, and determination to uncover its truth.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_445.webp',
    locations:
      'tower’s endless spiral staircases, chamber of shifting walls, floating library of enchanted scrolls, garden of eternal twilight',
    artPrompt: `A towering spire with glowing runes, its endless spiral staircases disappearing into the clouds. The air crackles with ancient magic as strange, shifting walls create ever-changing pathways. Floating books, enchanted scrolls, and magical relics litter the chambers, while the outside world is barely visible through the swirling mist that surrounds the structure. A mystical, adventurous fantasy atmosphere, mysterious spire, ancient magic, glowing runes, surreal architecture, adventurous fantasy`,
    artImageId: null,
  },
  {
    title: 'Starlight Circus',
    genres: 'space opera, spectacle, mystery',
    description: `A traveling circus, unlike any other, has arrived among the stars. As it docks in your colony, the dazzling lights and impossible performances captivate the entire world. But as you delve deeper into the circus, you begin to uncover strange secrets about its performers, the reality they manipulate, and your own unexpected connection to them. The grand show is about to begin, and the truths hidden behind the curtains are far more surreal than you ever imagined.`,
    intros: JSON.stringify([
      'The circus spaceship docks near your colony, its lights dazzling the void.',
      'The performers are otherworldly, each act more impossible than the last.',
      'You begin to unravel the circus’s secrets—and how they connect to you.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_451.webp',
    locations:
      'galactic circus tent, starlit trapeze platform, alien carnival midway, hidden backstage quarters of performers',
    artPrompt: `A cosmic circus set in a far-off galaxy, with performers performing acrobatic feats on glowing trapeze acts under a vast, starry sky. The alien carnival is full of vibrant colors and surreal landscapes, with floating platforms, otherworldly creatures, and hidden backstage areas shrouded in mystery. Lights and sounds of the galaxy resonate through the space, creating a sense of cosmic wonder, cosmic circus, alien performers, glowing trapeze acts, mysterious galactic carnival, surreal starry landscapes`,
    artImageId: null,
  },
  {
    title: 'Chimera Chronicles',
    genres: 'biopunk, adventure, mystery',
    description: `In a biopunk world ravaged by genetic experimentation, a rogue lab has unleashed hybrid creatures into the wild. As you explore the jungle of escaped chimeras and abandoned genetic labs, you must make a choice: capture these creatures or help them. The line between monster and ally blurs as you uncover the dangerous secrets of genetic engineering, and a hidden sanctuary of hybrids might hold the key to saving—or destroying—the world.`,
    intros: JSON.stringify([
      'The lab is in ruins, but its creations roam free.',
      'Each hybrid creature is more fascinating—and dangerous—than the last.',
      'Navigate the wreckage and decide: will you save them or destroy them?',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_470.webp',
    locations:
      'jungle of escaped chimeras, abandoned genetic lab, hidden sanctuary of hybrid creatures, mountain pass of frozen experiments',
    artPrompt: `A biopunk jungle overrun by genetically engineered creatures, each more bizarre and fascinating than the last. The ruins of a once-thriving genetic lab stand in the background, while glowing lab equipment flickers in the mist. Hybrid animals—creatures with traits from different species—roam free, and the jungle is alive with the hum of forgotten science and the chaos of evolutionary experimentation, hybrid creatures, biopunk jungle, glowing lab equipment, mysterious genetics, adventurous exploration`,
    artImageId: null,
  },
  {
    title: 'Whispering Woods',
    genres: 'eco-fantasy, mystery, supernatural',
    description: `In a cursed forest, where the trees whisper your name and shadows move on their own, ancient secrets lie buried beneath the twisted roots. With each step, the woods grow darker, more mysterious, and more dangerous. Navigate the labyrinth of glowing mushrooms, spectral meadows, and ancient glades of forgotten gods. Uncover the forest's hidden truths, but be warned: the secrets of the woods may change you forever.`,
    intros: JSON.stringify([
      'The forest whispers your name, its shadows alive with unseen eyes.',
      'Every step leads deeper into its mysteries—and its dangers.',
      'The secrets of the woods may change you forever, for better or worse.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_488.webp',
    locations:
      'glowing mushroom groves, shadowed glades of forgotten gods, labyrinth of ancient tree roots, spectral meadow of fireflies',
    artPrompt: `A cursed forest bathed in eerie moonlight, with glowing mushrooms casting an otherworldly light. Twisting, gnarled trees loom overhead, their roots forming labyrinthine paths. Mysterious whispers echo through the air, and the spectral glow of ancient spirits flickers in the shadows. A magical yet unsettling atmosphere reigns as the forest reveals its dark, mystical secrets, cursed forest, glowing mushrooms, ancient trees, eerie whispers, magical atmosphere`,
    artImageId: null,
  },
]
