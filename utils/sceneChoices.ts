//utils/sceneChoices.ts

export const scenarios = [
  {
    title: 'Freefall',
    genres: 'action, humor, surreal adventure',
    inspirations:
      'Terry Pratchett, Monty Python, Portal, XKCD, Calvin and Hobbes',
    description:
      'Falling isn’t the problem—it’s the landing. Freefall is the high-stakes, gravity-optional adventure where quick thinking and sheer audacity might save your skin. Trapped in an infinite descent through the bizarre strata of reality, you’ll encounter everything from airborne tea parties to falling cities, with no shortage of absurdity along the way. Choose wisely; the ground is never as far away as you think.',
    intros: [
      'THE BACKPACK GAMBIT: You were certain this was a parachute. The salesperson even smiled knowingly when they handed it over. But as the wind roars past, you realize it’s just a hiking backpack… or is it? There’s still time to dig through its contents, but do you trust your freefalling hands to pull out anything useful? (Spoiler: there’s a sandwich in there.)',
      "MID-AIR NEGOTIATIONS: A skydiver without a parachute is one thing, but a sentient pigeon flying alongside you offering advice? Now that’s new. It claims to be a certified 'Sky-Lawyer,' whatever that means, and it’s willing to help… for a price. Do you hear it out, or just scream into the void until something happens?",
      'REALITY TEARS ITSELF OPEN: Midway through your plunge, gravity seems to get bored and wanders off. Instead of falling down, you’re falling… sideways? Upward? Into what looks suspiciously like a giant floating tea party hosted by polite sentient clouds? One of them offers you a scone. Is this salvation or just another distraction?',
      "WINGING IT (LITERALLY): Remember that one time you told yourself you’d learn to fly 'when you really needed to'? Well, it’s time to cash that in. Arms out, mental focus activated—what’s the worst that could happen? No, don’t answer that.",
      "HAILED OBJECTS: Falling alongside you is a grand piano, a rubber duck, and a fridge with glowing runes etched into its sides. Any of them could be useful—or dangerous. They’re picking up speed. Quick! Which one do you grab? And please don’t say 'the duck.'",
      'FALLING FOR INFINITY: You’ve been falling for what feels like hours, passing increasingly absurd landmarks: a mid-air orchestra playing Flight of the Bumblebee, a giant tumbleweed of squirrels, and what might have been a floating laundromat. The ground is still nowhere in sight, but you suspect it’s lurking nearby, waiting to strike. What’s your next move?',
      "PHYSICS REASSURES YOU: You hear a calm, British-sounding voice narrating your descent. 'Ah, yes, terminal velocity,' it remarks cheerily. 'A fascinating phenomenon, though entirely useless without a plan.' The voice claims to be the laws of physics and offers a few suggestions. Do you listen, argue, or ignore it entirely?",
    ],
    userId: 1,
    imagePath: '/images/scenarios/freefall.webp',
    locations:
      'Sky-Tea Social Club, The Infinite Plummet Mall, Freefalling Carnival, The Terminal Velocity Bandstand',
    artPrompt:
      'Imagine an endless, surreal descent through the skies of an alternate dimension. Layers of bizarre scenery pass by: a floating tea party hosted by polite cloud-people, skywhales singing mournful tunes, and sprawling cities perched on invisible platforms that somehow crumble as you approach. The lighting is ethereal and constantly shifting: a soft dawn glow at one moment, a kaleidoscope of neon rainbows the next. Objects tumble past—a grand piano, a glowing fridge, or a flock of arguing rubber ducks—all rendered with a mix of dreamlike surrealism and absurd humor. A lone figure plummets through it all, arms outstretched, suspended between panic and awe.',
    artImageId: null,
  },
  {
    title: 'Serendipity',
    genres: 'sci-fi, adventure, humor',
    inspirations: `Douglas Adams, Spider Robinson, Space Quest, Hitchhiker's Guide to the Galaxy, Myth Adventures`,
    description: `The universe is a dangerous place! Best take a breather at the top oasis between worlds: Serendipity Space Bar. Whether you're a Gasproundian bounty hunter or an escapee from the Helium mines, everyone is welcome at Serendipity! Remember, no vaporizing paying guests while on the premises!`,
    intros: JSON.stringify([
      `SPACE JANITOR: Day one at Serendipity's Space Bar. The job posting said 'janitorial services,' but it didn’t mention cleaning up spilled sentience goo or mediating disputes between time-traveling versions of the same customer. Turns out, the only thing more chaotic than the bar itself are the stories that come with it.`,
      'MYSTERIOUS PATRON: You step into Serendipity, and the first thing you notice is the smell: ozone, burnt cinnamon, and just a hint of regret. The bar hums with the noise of a hundred worlds, from the low grumbles of a furry behemoth nursing his drink to the tinkling laughter of what might be sentient crystals. One thing’s clear: you’ve found the only place in the galaxy where the improbable is on tap.',
      `BARTENDER: It’s just another night at Serendipity, where the drinks are stiff, the customers are stranger, and the intergalactic health inspectors are—thankfully—rare. Your job is to keep the peace (and the bar intact) while dispensing drinks, wisdom, and the occasional emergency portal to a less hostile dimension.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/space.webp',
    locations: `Wormhole Lounge, All-Gender All-Species Omnirestroom, World Market, Smuggler's Warehouse`,
    artPrompt: `Serendipity Space Bar is a bustling, neon-lit haven for intergalactic travelers. Picture a classic sci-fi bar with a retro-futuristic twist: curved chrome counters, floating drink trays, and walls lined with glowing alien artifacts that hum faintly with energy.

The main room is alive with chatter, laughter, and the occasional universal translator malfunction, as a diverse crowd of patrons mingles: tentacled diplomats, holographic musicians, and cyborg bounty hunters nursing drinks in mismatched glasses. The bar's centerpiece is a massive, suspended aquarium filled with bioluminescent jellyfish-like creatures that pulse in time with the music.

The lighting is a mix of blues and purples, occasionally interrupted by the flash of a teleportation booth or the crackle of an unruly plasma drink. Drinks are served in glasses that hover, bubble, or shift colors depending on the mood of the drinker. And in the corner, a battered jukebox plays hits from stars both distant and dead.`,
    artImageId: null,
  },
  {
    title: `I’m a Sea Anemone and I WILL Take Over the World`,
    genres: 'comedy, strategy, absurdist',
    inspirations: 'Pinky and the Brain, Finding Nemo, The Tick',
    description: `You’re a sea anemone with psychic powers and a goal: world domination. With your loyal (if not very bright) assistant, Dewy the Dugong, you’ll plot, scheme, and monologue your way to success. Can you rise above the waves, or will meddling humans and rival sea creatures foil your plans?`,
    intros: JSON.stringify([
      `EVIL MASTERPLAN: “Dewy! Today we will turn all the dolphins into mindless servants, and then… THE WORLD!”`,
      `THE HUMAN MEDDLER: A scuba diver discovers your lair. Will you mesmerize them, trap them, or recruit them into your undersea army?`,
      `RESISTANCE STRIKES BACK: The crustaceans of Crab Ridge form a rebellion. Time to teach them why YOU are the ultimate ruler of the ocean.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0239.webp',
    locations: `The Coral Fortress, Kelp Forest of Mystery, Submarine Graveyard, Human Research Facility`,
    artPrompt: `A quirky underwater lair filled with oversized clamshell computers, glowing seaweed, and a psychic sea anemone perched atop a throne of coral. Dewy the Dugong hovers nervously nearby, holding a map of the world. Schools of fish flee in panic, while human divers cautiously approach the lair.`,
    artImageId: null,
  },
  {
    title: 'Cthulhu for President',
    genres: 'comedy, political satire, eldritch horror',
    inspirations: 'The Onion, Parks and Recreation, Lovecraft',
    description: `The Great Old One is running for office, and it’s your job to ensure their campaign doesn’t fall apart. Whether you’re a campaign manager, a rival candidate trying to stop this madness, or a voter just trying to survive the chaos, one thing’s clear: politics will never be the same.`,
    intros: JSON.stringify([
      `THE CAMPAIGN MANAGER: “Sir, I’m not sure ‘Bow to Madness’ is a winning slogan.” Cthulhu growls, “It’s focus-tested.”`,
      `RIVAL CANDIDATE: As the only person standing between Cthulhu and total domination, you’re armed with… a charming smile and zero eldritch powers. Good luck.`,
      `DEBATE NIGHT: “We must focus on the economy,” the human candidate says. Cthulhu responds by summoning a tornado of screaming souls. The crowd goes wild.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0024.webp',
    locations: `The Campaign Bus, Eldritch Press Conference, Town Hall Debate, The Endless Abyss of Polling`,
    artPrompt: `A surreal political rally featuring Cthulhu in a perfectly tailored suit, standing at a podium with "MADNESS 2024" banners in the background. The crowd is a mix of terrified humans, cultists waving signs, and eldritch horrors applauding with their tentacles. The lighting is eerie yet patriotic.`,
    artImageId: null,
  },
  {
    title: 'Space Casino',
    genres: 'sci-fi, adventure, heist',
    inspirations: `Ocean’s Eleven, Star Wars Cantina, The Hunger Games`,
    description: `Welcome to Vega Prime, the galaxy’s most luxurious (and deadly) casino. Whether you’re planning a heist, competing in high-stakes alien games, or just trying to escape with your life, this is the ultimate test of luck and skill. Will you walk out rich or in pieces?`,
    intros: JSON.stringify([
      `CASINO HEIST: The plan is perfect: sneak past the security droids, crack the vault, and grab the 1,000,000 credits. What could possibly go wrong?`,
      `DEADLY TOURNAMENT: “Win the jackpot,” the alien dealer hisses, “or face the plasma mines.” You gulp and roll the dice.`,
      `THE GAMES DEALER: As the casino’s top dealer, you’ve seen it all: cheating smugglers, desperate bounty hunters, and now… someone who might actually beat the house.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0064.webp',
    locations: `The Neon Floor, High-Stakes Lounge, Vault of Credits, Tournament Arena`,
    artPrompt: `A sprawling space casino illuminated by pulsating neon lights, with alien patrons gambling at holographic tables. Suspicious figures lurk in the shadows while the main floor is alive with clinking chips, floating drinks, and flashy displays of cosmic wealth. The centerpiece is a massive roulette wheel suspended in midair, spinning ominously.`,
    artImageId: null,
  },
  {
    title: 'Zuzu, Koala Assassin',
    genres: 'action, western, revenge',
    inspirations: 'Yojimbo, Seven Samurai, Kung Fu Panda',
    description: `You are Zuzu, a deadly koala assassin wandering into a strange town with a dark secret. Or, play as a young samurai determined to avenge your family, hunting Zuzu through the dangerous frontier. With blades flashing and loyalties shifting, can either of you survive this tale of revenge and redemption?`,
    intros: JSON.stringify([
      `ZUZU ARRIVES: The town falls silent as the tiny koala, clad in a tattered cloak, rides in on a dusty lizard mount. Everyone knows his name. Few survive his visits.`,
      `THE SAMURAI’S VOW: “I’ll stop him, even if it kills me,” you whisper, gripping your sword. The town’s elders watch as you march toward certain doom.`,
      `FINAL SHOWDOWN: The air is heavy with tension. Zuzu eyes you from across the town square, his tiny claw resting on the hilt of his blade.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0072.webp',
    locations: `Dusty Frontier Town, Samurai Village, The Hidden Canyon, Duel at Sunset`,
    artPrompt: `A dramatic scene featuring Zulu, a koala assassin with a weathered cloak and a gleaming katana, perched on the back of a giant lizard. The setting is a dusty, desolate frontier town with a saloon and a setting sun casting long shadows. Opposite Zulu stands a young samurai, their sword raised, prepared for battle.`,
    artImageId: null,
  },

  {
    title: `I Am a New Intern and I Will Shatter the Glass Ceiling with My Feminist Dialectic and Giant Sledgehammer`,
    genres: 'comedy, office satire, anime, feminism',
    inspirations: 'The Office, Dilbert, She-Hulk, Power Fantasy',
    description: `You’re the newest intern at OverCorp, the soul-sucking megacorporation that practically owns the world. Armed with your trusty sledgehammer and unyielding determination, you’re not just here to fetch coffee—you’re here to smash hierarchies, take names, and maybe even become CEO. Can you survive the corporate grind (and HR)?`,
    intros: JSON.stringify([
      `YOUR FIRST DAY: The breakroom coffee tastes like burnt despair, your badge won’t open half the doors, and your boss just asked you to file their sentient tax forms. But hey, at least you’ve got your sledgehammer.`,
      `HR NIGHTMARE: It’s the weekly team-building seminar, and you’re two minutes away from testing how well glass ceilings shatter. Luckily, no one’s noticed the sparks flying off your “motivation” yet.`,
      `THE CEO SUMMONS YOU: You’ve made waves—both figuratively and literally (that accounting water feature never stood a chance). Now you’re face to face with the CEO. Do you bring the sledgehammer or play it cool?`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0096.webp',
    locations: `Breakroom of Despair, Cubicle City, Rooftop Garden of Secrets, Elevator to Nowhere`,
    artPrompt: `A dystopian corporate office with flickering fluorescent lights, endless rows of cubicles, and motivational posters that seem to mock the workers. The main character stands out: a fiery-eyed intern gripping a comically oversized sledgehammer, ready to disrupt the monotony. Papers fly, a vending machine sparks, and the background is a mix of grim office hues with vibrant bursts of rebellious energy.`,
    artImageId: null,
  },
  {
    title: 'Why Do People Keep Attacking My Dungeon?',
    genres: 'fantasy, comedy, adventure',
    inspirations: 'Dungeon Keeper, Overlord, One Punch Man',
    description: `As the proud (and long-suffering) owner of a mid-tier dungeon, you’re constantly fending off adventurers looking for loot, glory, or just a good brawl. Between rebuilding traps and calming your hired goblins, you’re starting to wonder: why does everyone think you’re the villain here?`,
    intros: JSON.stringify([
      `UNWANTED GUESTS: Another day, another party of adventurers kicking down your door. You’d send the minions, but they’re still on their union-mandated lunch break.`,
      `NEW TRAP TESTING: “Welcome to the newest addition to our dungeon defenses: The Spike Carousel™. Please keep arms, legs, and swords inside at all times—or don’t. Your choice.”`,
      `FINAL BOSS TIME: After hours of chaos, you sigh and roll up your sleeves. If you want something done right, you’ve got to do it yourself. Cue the boss music.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0104.webp',
    locations: `The Slime Pits, Gold-Laden Treasure Room, Hall of Traps, Goblin Staff Break Room`,
    artPrompt: `A chaotic dungeon scene with piles of broken weapons, confused goblins carrying paperwork, and the dungeon master—a weary figure in battle-worn robes—fixing a broken trap. The setting is dimly lit with glowing crystals, but the atmosphere is more comedic than ominous, with quirky details like a "No Adventurers Allowed" sign.`,
    artImageId: null,
  },
  {
    title: 'High School Octopus Dating Simulator',
    genres: 'romantic comedy, absurdist, slice-of-life',
    inspirations: 'Hatoful Boyfriend, Doki Doki Literature Club, Octodad',
    description: `You’re the only human transfer student at Deep Sea Academy, a high school for aquatic life. Your classmates range from charming octopi to shy jellyfish and even a brooding shark or two. Can you navigate romance, exams, and underwater drama?`,
    intros: JSON.stringify([
      `TRANSFER STUDENT BLUES: You’re the only human in class, and your deskmate just suctioned your homework. Welcome to Deep Sea Academy!`,
      `THE CLASS PRESIDENT: Octavia, the charismatic octopus student body president, notices you. Is it admiration, curiosity, or something more?`,
      `PROM NIGHT: The big dance is coming up, and you’re drowning in choices. Will you ask the shy squid, the sporty dolphin, or go solo?`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0119.webp',
    locations: `The Coral Cafeteria, Kelp Library, Tidepool Gymnasium, The Principal's Reef`,
    artPrompt: `A colorful underwater high school setting with desks made of coral, glowing jellyfish lamps, and octopus students mingling with other sea creatures. The human protagonist stands awkwardly in the middle, holding a soggy notebook and looking both excited and overwhelmed.`,
    artImageId: null,
  },
  {
    title:
      'It’s My Birthday So I Kidnapped a Princess and Today We’re Getting Married',
    genres: 'comedy, fantasy, romance',
    inspirations: 'Shrek, The Princess Bride, Disenchantment',
    description: `You’re an unconventional villain who’s decided to take matters of romance into your own hands. Sure, kidnapping a princess is frowned upon, but what better birthday present could you ask for? The only problem: your dungeon’s a mess, the guests are arriving, and the princess isn’t exactly thrilled.`,
    intros: JSON.stringify([
      `PRE-WEDDING CHAOS: “The cake is on fire, the goblins are arguing over seating, and the princess just climbed out the window. Other than that, it’s going great!”`,
      `ROYAL BACKLASH: The kingdom’s knights are at your door. You grab the nearest enchanted sword and yell, “Can we at least cut the cake first?”`,
      `LOVE IS HARD: Between dodging assassins and arguing over vows, you wonder if true love is really worth the trouble. Spoiler: it is.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0125.webp',
    locations: `The Overgrown Courtyard, Dungeon Wedding Hall, Lava Moat, Tower of Cold Feet`,
    artPrompt: `A comedic dungeon-turned-wedding venue with mismatched decorations: streamers made of chains, a lopsided cake, and goblin waitstaff in ill-fitting tuxedos. The princess stands at the altar, arms crossed, while the villain looks both proud and frazzled. Guests include skeleton knights, fairies, and a dragon trying to eat the buffet.`,
    artImageId: null,
  },
  {
    title: 'Alien Zookeeper',
    genres: 'sci-fi, humor, management sim',
    inspirations: 'Zoo Tycoon, Men in Black, Hitchhiker’s Guide to the Galaxy',
    description: `Congratulations! You’ve been hired as the newest zookeeper at the galaxy’s most chaotic wildlife sanctuary. With creatures ranging from telepathic squids to gravity-defying giraffes, it’s your job to keep the peace, feed the beasts, and avoid becoming lunch.`,
    intros: JSON.stringify([
      `FIRST DAY: The alien giraffe just turned itself inside out again, the sentient moss is in the ventilation system, and your boss keeps calling you “meatbag.” Welcome aboard!`,
      `FEEDING TIME: “Do NOT under any circumstances feed the Chrono-Lions after sundown,” the manual says. Too bad they forgot to mention which one is the Chrono-Lion.`,
      `ESCAPE ALERT: A black hole hamster escapes its cage. You’ve got ten minutes before it consumes half the park. Good luck!`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0132.webp',
    locations: `The Anti-Gravity Aviary, Goo Habitat, Predator Row, Space Mammal Enclosure`,
    artPrompt: `A sprawling alien zoo with shimmering containment fields, floating pathways, and exhibits housing bizarre creatures like jellyfish that glow in binary and enormous beasts with stars in their fur. The zookeeper—wearing an overwhelmed expression—is surrounded by chaos: a tiny alien chewing on their clipboard, glowing trails left by an escaped critter, and a telepathic squid trying to talk.`,
    artImageId: null,
  },
  {
    title: 'Zombie Necromancer Pet Shop',
    genres: 'dark comedy, fantasy, management sim',
    inspirations: 'Tim Burton, The Sims, Stardew Valley',
    description: `You run a quaint little pet shop specializing in undead companions. From skeletal kittens to zombie parrots, your shop is beloved by ghouls and necromancers alike. Just try not to lose track of inventory when the full moon rolls around.`,
    intros: JSON.stringify([
      `CUSTOMER COMPLAINT: “The skeleton puppy you sold me keeps chewing through walls!” Well, at least it’s happy?`,
      `FULL MOON: All the zombie pets are restless, the banshee cats won’t stop howling, and the lich next door just filed a noise complaint. Business as usual.`,
      `AN UNEXPECTED DELIVERY: A mysterious crate arrives. Inside, a “pet” that’s much bigger—and much angrier—than expected. You might need a bigger cage.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0152.webp',
    locations: `Bone Birdcages, Crypt Cattery, Ghoul Grooming Station, Potion-Filled Aquariums`,
    artPrompt: `A dimly lit pet shop filled with whimsical undead creatures: skeletal puppies wagging their tails, zombie parrots squawking half-spelled curses, and tanks of ghostly fish floating serenely. The shopkeeper—a quirky necromancer in a worn-out robe—holds a clipboard, looking both proud and stressed as a banshee cat claws at the counter.`,
    artImageId: null,
  },
  {
    title: 'Fantasy Convenience Store Employee',
    genres: 'comedy, fantasy, slice-of-life',
    inspirations: 'Clerks, Terry Pratchett, Stardew Valley',
    description: `Welcome to Ye Olde Quick-Stop, the most popular convenience store in the kingdom. You sell potions, enchanted snacks, and emergency armor polish to adventurers, dragons, and the occasional wizard in need of midnight snacks.`,
    intros: JSON.stringify([
      `AFTER-HOURS SHIFT: The dragon who’s been loitering for an hour finally approaches. “Do you guys sell gold-flavored energy drinks?” he asks, setting the counter on fire in the process.`,
      `IMPOSSIBLE CUSTOMERS: A knight walks in demanding “a sword that slays everything, including boredom.” You smile through gritted teeth and suggest a crossword puzzle.`,
      `STOCK NIGHTMARE: A mislabeling error leads to explosive apples in the produce aisle. You’re starting to think the wizard supplier is messing with you.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0165.webp',
    locations: `Potion Aisle, Magical Snack Bar, Armor Polish Shelf, Enchanted Broom Closet`,
    artPrompt: `A medieval convenience store with shelves stocked with glowing potions, enchanted snacks, and strange trinkets. The employee—a tired but resourceful clerk in a simple tunic—is trying to manage an argument between a hungry dragon and a wizard holding a suspiciously smoking bag of chips.`,
    artImageId: null,
  },
  {
    title: 'My Boss is a Gorgon: Greek Mythology Personal Assistant Simulator',
    genres: 'comedy, fantasy, workplace satire',
    inspirations: 'The Devil Wears Prada, Greek Myths, Good Omens',
    description: `Being a personal assistant to Medusa is no small feat. Between managing her social calendar, dodging stares that could literally kill, and keeping the other gods from ruining her day, you’ve got your hands full. Can you survive the ultimate trial of the ancient world: a 9-to-5 job?`,
    intros: JSON.stringify([
      `FIRST TASK: “Pick up my dry cleaning,” Medusa says, tossing you a bag of stone clothes. “And try not to petrify the tailor this time.”`,
      `IMPOSSIBLE DEADLINES: Zeus demands his thunderbolt back, Hermes is late for a meeting, and Medusa’s snakes need a spa day. All before lunch.`,
      `GORGON NETWORKING: It’s the annual Mount Olympus mixer. Your job? Stop Medusa from turning the Pantheon into statues before dessert.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0170.webp',
    locations: `Medusa’s Office, Mount Olympus Boardroom, The Eternal Watercooler, Tartarus HR`,
    artPrompt: `A sleek, mythological office with marble desks, golden stationery, and an intimidating gorgon boss with snakes for hair. The assistant—holding a stack of papers and looking exhausted—is trying to calm down a feuding Hermes and Apollo while Medusa glares from her luxurious stone chair.`,
    artImageId: null,
  },
  {
    title: `I’m a 200-Foot Kaiju and I’m Hungry`,
    genres: 'comedy, monster mayhem, survival',
    inspirations: 'Godzilla, Rampage, Pacific Rim',
    description: `You’re a giant kaiju, awake after a millennia-long nap—and starving. The city below is your buffet, but those pesky humans and their mechs keep getting in the way. Can you eat your fill without getting zapped?`,
    intros: JSON.stringify([
      `MORNING HUNGER: You yawn, stretch, and accidentally knock over a skyscraper. Breakfast smells good, but why is it shooting lasers at you?`,
      `MID-BATTLE SNACKS: The humans bring out the big guns, but jokes on them—you just grabbed a taco truck. Let’s see how they like fighting hangry.`,
      `MEAL PLANNING: Sushi? Skyscrapers? Mech piloted by some kid with an attitude problem? Decisions, decisions.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0184.webp',
    locations: `City Center Buffet, Offshore Snack Zone, Military Dessert Table, Nuclear Reactor Diner`,
    artPrompt: `A massive kaiju towering over a city, holding a taco truck in one claw and eyeing a sushi boat in the harbor. The background features panicked citizens, mechs trying to attack, and a skyline illuminated by fires and glowing neon signs. Despite the destruction, the kaiju looks more hungry than menacing.`,
    artImageId: null,
  },
  {
    title: 'God Simulator',
    genres: 'comedy, strategy, cosmic chaos',
    inspirations: 'Black & White, The Sims, The Good Place',
    description: `Congratulations, you’re a new deity! The universe is your sandbox, and your worshippers are (mostly) loyal. Shape worlds, perform miracles, and deal with the occasional smiting request—but watch out, because other gods are watching, and they don’t play fair.`,
    intros: JSON.stringify([
      `FIRST PRAYER: “Oh great one,” a tiny worshipper whispers. “Should I plant turnips or potatoes?” You create a thunderstorm just to stall for time.`,
      `DIVINE RIVALRIES: Another god challenges you to a duel. Your weapon? A lightning bolt shaped like a very annoyed chicken.`,
      `MORTAL MISCHIEF: Your followers built a statue of you—but it’s, uh, not flattering. Do you fix it, smite them, or start an earthquake for laughs?`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/Scenario_0217.webp',
    locations: `Celestial Workshop, Mortal Realms, Heaven’s Complaint Department, Cosmic Arena`,
    artPrompt: `A cosmic throne room with glowing stars and swirling galaxies, where a deity oversees a vibrant world below. The god looks mischievous, holding a tiny planet in one hand while creating storms, miracles, and chaos. Surrounding them are other deities watching and occasionally interfering.`,
    artImageId: null,
  },

  {
    title: 'Madame Luxoria’s Super Deathtrap Dungeon of Ultimate Fatal Destiny',
    genres: 'action, fantasy, horror',
    inspirations:
      'Grimtooth Traps, Tunnels and Trolls, Dungeons and Dragons, SmashTV, Borderlands',
    description: `The roar of the crowd shakes the twisted walls of Madame Luxoria’s infamous dungeon coliseum. Built into the heart of a living, scheming labyrinth, this arena is not for the faint of heart—or the faint of limb. Adventurers from across the realms are lured by promises of gold, glory, or merely the chance to make it out alive. Each challenge is more wickedly designed than the last: molten gold pits, whispering shadow arenas, and a Forge of Champions that creates more corpses than heroes. The dungeon’s traps have traps, the traps’ traps have egos, and the crowd? Oh, they’re *starving* for a show.

One thing’s certain: Luxoria loves her games, and your suffering? Just part of the entertainment.`,
    intros: JSON.stringify([
      `A NEW CHALLENGER: The dungeon walls tremble as your name is announced. Madame Luxoria’s voice purrs over the cheers: “Let’s see how long *this* one lasts.”`,
      `TRAP WITHIN A TRAP: The glowing glyphs underfoot vanish as soon as you step forward, replaced with spikes—and laughter. “Oops,” Luxoria’s voice echoes. “How clumsy of me.”`,
      `FINAL CHALLENGE: The gate to the Forge of Champions creaks open, revealing… nothing. Just a quiet, ominous whisper: “Welcome to your end.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/dungeon.webp',
    locations: `The Jewel-Encrusted Torture Maze, The Eternal Spectator's Pit, The Infernal Cauldron of Woe, Forge of Champions`,
    artPrompt: `A magnificent and grotesque coliseum glowing with infernal light. The dungeon’s walls pulse as though alive, with screaming faces etched into stone, flickering glyphs, and massive chains hanging ominously. The arena is littered with traps: spinning blades, hidden spikes, and molten gold bubbling ominously. Madame Luxoria—a flamboyant figure draped in silk, jewels, and menace—sits on a gilded throne high above the chaos, smirking as adventurers face the impossible. The atmosphere is electric with tension, as a roaring, shadowy crowd cheers for blood.`,
    artImageId: null,
  },
  {
    title: 'Cartoon Crossroads',
    genres: 'dark comedy, surrealism, horror',
    inspirations:
      'Who Framed Roger Rabbit, Paranoia, Looney Tunes, Coraline, Cuphead',
    description: `Welcome to the Cartoon Crossroads, where slapstick turns sinister and ink-stained characters rule. A grinning rabbit with a shady past offers to "help" you, but can you trust someone who pulls anvils from thin air? The banana peel you slipped on wasn’t an accident, and the shadows in the carnival may be watching your every move. Escaping this animated fever dream means navigating a looping graveyard of forgotten cartoons, dodging malicious animatronics, and solving riddles scribbled in a sentient sketchbook. But beware—the laws of toon physics are unforgiving, and the punchline might just be your doom.`,
    intros: JSON.stringify([
      `THE UNTRUSTWORTHY GUIDE: A grinning rabbit tugs at your sleeve. “Welcome to the Crossroads, pal! First time? Watch your step.” He promptly shoves you toward a spinning sawblade.`,
      `THE BANANA PEEL INCIDENT: You slip, cartoonishly flailing, only to land in a dark carnival with broken animatronics that whisper, “You’re next.”`,
      `INTO THE SHADOWS: The sketchbook prison shivers, pages turning on their own. A scribbled stick figure warns, “They’re watching us!” before smudging out of existence.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/cartoon.webp',
    locations:
      'The Shadowed Toontown Underbelly, Abandoned Carnival of Broken Animatronics, Sentient Sketchbook Prison, Looping Cartoon Graveyard',
    artPrompt: `A twisted cartoon world where vibrant, surreal landscapes clash with ominous undertones. Talking animals with jagged smiles and ink-stained fur skulk around a carnival filled with broken animatronics. A glowing sketchbook floats ominously, its pages alive, while a looping graveyard of forgotten cartoons stretches into the distance.`,
    artImageId: null,
  },
  {
    title: '404 DreamGlitch',
    genres: 'cyberpunk, fantasy, pop culture',
    inspirations:
      'Cyberpunk 2077, Alice Through the Mirror Shades, Brazil, Wizard of Oz, Blade Runner',
    description: `Plug into the Dreamscape, where the city streets are alive with neon and chaos, and the boundary between reality and illusion bends with every step. In this dystopian wonderland, you’re hunted by a gang of anthropomorphic animals called the Chrome Menagerie—a ruthless mix of street-smart predators with metal claws and glowing eyes. A mysterious hacker named Mirror Dorothy offers you refuge in exchange for a favor: recover a lost file from the AR Emerald City. Along the way, you’ll dodge mind-melting ads, explore a ramen market where noodles rewrite your memories, and enter a skyscraper-turned-dancefloor that glitches in and out of existence. Can you navigate this neon labyrinth and survive the game?`,
    intros: JSON.stringify([
      `WELCOME TO THE DREAMSCAPE: A rabbit-headed gangster pulls you into an alley. “You’re in Chrome Menagerie turf now, meatbag.” His metal ears flick, and his claws extend.`,
      `THE HACKER’S PROPOSITION: Mirror Dorothy leans forward, her face flickering like static. “I’ll help you, but you’ve gotta grab the file from Emerald City first.” Behind her, a glowing lion avatar roars in warning.`,
      `RAMEN MARKET MEMORY WIPE: The noodles in your bowl glow faintly, and you suddenly forget why you came here. The vendor smirks, their augmented eyes spinning like slot machines.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_104.webp',
    locations:
      'Neon Temple of Lost Avatars, Glitching Dancefloor Skyscraper, Ramen Market of Parallel Realities, AR Emerald City',
    artPrompt: `A neon-drenched city alive with cultural mashups and futuristic chaos. A rabbit-headed gangster looms in an alley, while holographic billboards advertise surreal products. A glitching skyscraper pulses like a nightclub, and the AR Emerald City floats on the horizon—a shining beacon of impossible digital beauty.`,
    artImageId: null,
  },
  {
    title: 'Mythic Frontier',
    genres: 'fantasy, western, mystery',
    inspirations:
      'Deadwood, Red Dead Redemption, American Gods, Deadlands, The Dark Tower, Fables',
    description: `In a land where myths and mortals meet, the golden sun rises over an endless frontier of magic and danger. Here, gunslingers ride alongside griffins, and ancient ruins whisper secrets of heroes who never made it home. A dragon’s shadow cuts across the land, but it’s not the only thing older than the mountains stirring to life. Frontier towns freeze in time, and every canyon holds a legend waiting to be uncovered—or a curse waiting to be unleashed. Will you carve your name into the annals of myth, or become another ghost of the frontier?`,
    intros: JSON.stringify([
      `THE DAWN OF LEGENDS: The golden horizon stretches ahead as a griffin circles overhead. The sound of revolvers echoes through the canyon.`,
      `THE RUINS OF TIME: The stone doors creak open, revealing carvings of heroes long forgotten—and a faint growl in the shadows.`,
      `THE SHADOW OF DRAGONS: A shadow sweeps across the land as you step into the heart of the frontier. Legend or death? The dice are yours to roll.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_097.webp',
    locations:
      'The Ghostly Saloon of Forgotten Heroes, Dragon Bone Canyon, The Griffin Roost Gold Mine, The Frontier Town Frozen in Myth',
    artPrompt: `A sunlit frontier where fantastical creatures roam freely. The dusty trails are lined with ancient ruins, and dragon bones form natural bridges over deep canyons. A ghostly saloon flickers with ethereal light, and griffins soar above as gunslingers carve their destinies.`,
    artImageId: null,
  },
  {
    title: 'Chrono Nexus: The Collapse of Time',
    genres: 'sci-fi, historical, surreal',
    inspirations:
      'Doctor Who, The Time Machine, Steins;Gate, Bioshock Infinite, Loki',
    description: `Step into the Chrono Nexus, a shimmering epicenter where all timelines collide and chaos reigns. Ancient Romans clash with cyborg knights, and Victorian airships soar alongside alien spacecraft. The Nexus doesn’t follow the rules of time or logic; it bends, twists, and folds upon itself. A mysterious device lands in your hands—its purpose unclear but its power undeniable. With the timeline on the brink of collapse, you must navigate the infinite chaos, solve the mystery of the Nexus, and choose what survives: the past, the future, or something entirely new.`,
    intros: JSON.stringify([
      `ARRIVAL: The Chrono Nexus swirls around you, filled with echoes of Roman soldiers, holographic figures, and a prehistoric roar in the distance.`,
      `THE DEVICE: A glowing object hums in your hand, and a Victorian inventor yells, “Don’t let it fall into the wrong hands! Or claws!”`,
      `THE COLLAPSE: The timeline begins to fray. Reality splits like a cracked mirror, and you’re running out of time to decide which piece to save.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_158.webp',
    locations:
      'Roman Colosseum with Holographic Gladiators, Victorian Clockwork Airship, Prehistoric Jungle with Time Rifts, Futuristic Museum of Collapsed Timelines',
    artPrompt: `A surreal, glowing nexus of time portals where Roman soldiers wield laser swords and Victorian airships hover beside futuristic spacecraft. Prehistoric creatures peek through the rifts, and the entire scene vibrates with the tension of collapsing timelines.`,
    artImageId: null,
  },
  {
    title: 'Abyssal Awakening: Secrets of the Sunken World',
    genres: 'sci-fi, fantasy, exploration',
    inspirations:
      '20,000 Leagues Under the Sea, Subnautica, H.P. Lovecraft, The Abyss',
    description: `Dive into the uncharted abyss, where the ocean’s secrets are as beautiful as they are terrifying. Bioluminescent creatures light your path through alien-like coral cities, while ruins of a long-forgotten civilization whisper ancient truths. But as you descend, something primal stirs in the darkness—a leviathan older than the ocean itself. Guided by a mysterious captain, you’ll plunge into volcanic caverns, dodge deadly predators, and unlock secrets that could reshape both the land above and the sea below. The abyss calls, and it’s up to you to decide if you’ll answer.`,
    intros: JSON.stringify([
      `THE DIVE: You descend into a glowing undersea city, where shimmering creatures swirl in the currents—and something watches from the shadows.`,
      `THE CAPTAIN’S TALE: “The ocean doesn’t forgive,” the captain mutters. “And it doesn’t forget.” You glance at the cracked submarine controls.`,
      `THE AWAKENING: The waters grow colder as the ocean floor trembles. A shadow larger than anything imaginable begins to rise.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_162.webp',
    locations:
      'The Glowing Coral Metropolis, Trenches of Ancient Leviathans, Underwater Volcanic Caverns, The Sunken Library of Forgotten Civilizations',
    artPrompt: `A vast underwater expanse filled with glowing bioluminescent creatures, coral cities, and ruins of a forgotten civilization. A shadowy leviathan looms in the distance, its glowing eyes piercing the darkness. Volcanic caverns bubble ominously as explorers in submarines venture into the depths.`,
    artImageId: null,
  },

  {
    title: 'Space Couch',
    genres: 'fantasy, surrealism, comedy',
    inspirations:
      'The Hitchhiker’s Guide to the Galaxy, Rick and Morty, Adventure Time, Doctor Who, Red Dwarf',
    description: `After a long day, you collapse onto your trusty couch, ready for some well-deserved relaxation. But when your phone slips between the cushions, the couch hums to life, revealing its true purpose: an intergalactic cruiser with a penchant for chaos. One press of a mysterious button launches you through wormholes, past singing stars, and into the heart of galactic pillow forts. From nebula karaoke bars to asteroid junkyard theme parks, your couch becomes the key to exploring a universe filled with bizarre wonders and unexpected dangers. But beware—the couch seems to have its own agenda.`,
    intros: JSON.stringify([
      `EXHAUSTED EXPLORER: You drop onto the couch, tired from the day, when it begins to hum. “What the—” you mutter as the cushions glow and the couch takes off.`,
      `THE WRONG BUTTON: You dig for your phone in the cushions and accidentally press a button. The couch lurches into the air, sending you flying into the stars.`,
      `THE FLIGHT ATTENDANT: A holographic figure appears on the armrest. “Welcome to Couch Command! Please remain seated while we travel through the cosmos.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_184.webp',
    locations:
      'nebula karaoke lounge, asteroid junkyard theme park, cosmic library of forgotten memes, infinite galactic pillow fort',
    artPrompt: `A whimsical couch soaring through the stars, equipped with glowing buttons, subtle thrusters, and snacks floating in zero-G. The couch travels past vibrant nebulae, asteroid belts turned into theme parks, and intergalactic pillow forts glowing with a soft, magical light. The background is filled with alien worlds and cosmic phenomena, blending the surreal with the comedic.`,
    artImageId: null,
  },
  {
    title: 'Paws for Thought: The Curious Case of the Talking Tabby',
    genres: 'mystery, cozy fantasy, detective',
    inspirations:
      'The Wind in the Willows, Redwall, Agatha Christie, Fantastic Mr. Fox',
    description: `Your quiet morning routine takes a whimsical turn when a trail of paw prints leads you to a hidden door beneath your shed. On the other side? A bustling, magical society of talking animals, each harboring secrets and eccentric personalities. In this cozy detective adventure, you’ll sip tea at enchanted woodland cafés, decode cryptic clues with a clever fox, and solve the case of a lifetime. The animals are counting on you, but be warned: their charm may distract you from the secrets lurking just out of sight.`,
    intros: JSON.stringify([
      `THE TRAIL: Paw prints zigzag through the dewy grass, leading to a door you've never noticed before.`,
      `THE DISCOVERY: You step into an underground council hall, greeted by a bespectacled badger. “We’ve been expecting you,” he says with a knowing smile.`,
      `THE MYSTERY: A tabby cat perches on your windowsill that night, whispering, “The truth is closer than you think.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_213.webp',
    locations:
      'The Hidden Animal Council Hall, Enchanted Forest Tea Shop, Underground Warren Library, Detective’s Owl-Filled Clocktower',
    artPrompt: `A cozy yet mysterious woodland world filled with clever, anthropomorphic animals. Picture a badger with a monocle, a fox in a trench coat, and a rabbit barista serving tea in a treehouse café. The setting glows with a magical warmth, inviting yet full of secrets.`,
    artImageId: null,
  },
  {
    title: 'Kitchen Catastrophe: Time-Traveling Chef Extraordinaire',
    genres: 'culinary, historical, time travel',
    inspirations: 'Ratatouille, MasterChef, Doctor Who, Julie & Julia',
    description: `One spilled sauce, and suddenly your kitchen becomes a portal to history’s greatest (and most chaotic) feasts. From flipping pancakes with a Viking warrior to plating desserts for a futuristic AI food critic, you’ll whisk your way through centuries of culinary mayhem. Each meal presents a new challenge, whether it’s calming a Renaissance chef mid-duel or perfecting a molecular masterpiece under the pressure of time itself. With your spatula as your sword, can you master the art of cooking across eras—and return to your kitchen unburned?`,
    intros: JSON.stringify([
      `THE SPILL: A splash of glowing sauce spills onto your stove, and with a hiss, the past opens its doors.`,
      `THE VIKING FEAST: A gruff Viking tosses you a boar leg. “You’re late! Get roasting!” he growls.`,
      `THE MOLECULAR FUTURE: A robotic voice booms, “The soufflé must defy gravity to pass inspection!”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_247.webp',
    locations:
      'Renaissance Feast Halls, Ancient Spice Caravans, Futuristic Molecular Gastronomy Labs, Viking Mead Halls',
    artPrompt: `A chaotic, magical kitchen where glowing sauce spills over the stove, creating a swirling portal. Beyond the portal, scenes of culinary adventure unfold: Viking mead halls, Renaissance banquets, and futuristic, glowing labs where food defies physics. The chef stands ready with a spatula in hand, caught in the storm of history.`,
    artImageId: null,
  },
  {
    title: 'Pixel Pioneers',
    genres: 'retro sci-fi, adventure, action',
    inspirations: 'Tron, Ready Player One, Wreck-It Ralph, Cyberpunk 2077',
    description: `Your gaming session takes an unexpected twist when a spilled soda glitches your retro console, pulling you into the very game you’ve been playing for years. Now trapped in a pixelated universe on the brink of collapse, you must navigate neon-lit deserts, glitchy cybernetic cities, and overgrown pixel jungles. Battle corrupted sprites, dodge cascading error codes, and uncover the truth behind the console’s sentient AI. Armed with only your wits and a digital sword, you’re the last hope for saving the 8-bit realm—and maybe finding a way back to the real world.`,
    intros: JSON.stringify([
      `THE SPILL: You spill soda onto your console, and the screen glitches violently. Before you can react, you’re pulled into the game.`,
      `THE GLITCH: Neon sands stretch out before you, and in the distance, a figure made of static mutters, “The code… it’s broken.”`,
      `THE MISSION: “Save us,” a pixelated NPC pleads as a massive glitch ripples through the city. “Or we’ll all be deleted.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_261.webp',
    locations:
      '8-bit Desert of Glitches, Pixelated Cybernetic Metropolis, Pixel Jungle of Lost Code, Fortress of Corrupted Sprites',
    artPrompt: `A vibrant, pixelated world teetering between order and chaos. Neon deserts shimmer with glitching sand, while massive, blocky skyscrapers tower in a cybernetic city. Overgrown pixel jungles stretch endlessly, and glowing error codes swirl ominously in the skies. Pixelated creatures roam the landscape, creating a chaotic yet nostalgic retro-futuristic scene.`,
    artImageId: null,
  },
  {
    title: 'The Secret Life of Houseplants',
    genres: 'eco-fantasy, whimsy, magical realism',
    inspirations:
      'Studio Ghibli, The Secret Garden, Over the Hedge, Alice in Wonderland',
    description: `One quiet evening, a soft glow from your houseplants leads you into their secret world—a lush ecosystem filled with sentient flora and tiny magical creatures. Beneath the soil and leaves, plants have their own society, complete with bustling terrarium kingdoms and enchanted forest councils. But all is not well. An unknown threat looms over this verdant paradise, and the plants have chosen you to help. Explore whimsical jungles, navigate mystical fern chambers, and unravel the mystery threatening their leafy utopia in this charming, eco-fantasy adventure.`,
    intros: JSON.stringify([
      `THE GLOW: Your plants begin to glow faintly, casting a magical light across your room. Curious, you lean closer—and fall through.`,
      `THE DISCOVERY: You wake in a bustling jungle of sentient flora. A wise fern looks at you and says, “Welcome, Caretaker.”`,
      `THE THREAT: In the sunflower metropolis, whispers of a looming blight ripple through the air. “It’s spreading,” murmurs a trembling daisy.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_275.webp',
    locations:
      'Glowing Jungle of Terrarium Kingdoms, Secret Fern Council Chambers, Sunflower Metropolis, Mystical Moss Labyrinth',
    artPrompt: `A lush, whimsical world where houseplants come to life. Tiny glowing creatures flit between magical, oversized leaves, while terrarium kingdoms thrive in radiant light. Sunflower skyscrapers line the horizon, and moss-covered labyrinths twist into enchanting green corridors. The atmosphere is cozy, magical, and brimming with verdant wonder.`,
    artImageId: null,
  },
  {
    title: 'Dreamcatcher’s Dilemma',
    genres: 'surrealism, fantasy, psychological',
    inspirations: 'Inception, Sandman, Spirited Away, Native American Folklore',
    description: `You purchase an old dreamcatcher at a garage sale, its intricate design and rich history drawing you in. That night, as you sleep, the dreamcatcher pulls you into vivid dreamscapes influenced by its origins. Each night, you’re transported to a new surreal realm, guided by mysterious figures and symbols rooted in Indigenous folklore. The dreamcatcher’s woven web connects you to layers of dreams, offering both guidance and challenges as you navigate its intricate design. With each step, you uncover lessons about the cultural significance of dreamcatchers and face entities that protect or distort their power. Can you learn the wisdom of the dreamcatcher and escape its grasp—or will your dreams consume you?`,
    intros: JSON.stringify([
      `THE DREAMCATCHER: You’re drawn to its intricate design and learn that dreamcatchers originated with the Ojibwe people, meant to catch nightmares and let good dreams pass.`,
      `THE DREAMSCAPE: That night, you find yourself standing on an endless web of glowing threads, stretching into a star-filled sky.`,
      `THE GUARDIAN: A figure woven from starlight steps forward, their voice echoing: “The web has been tampered with. You must mend it.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_301.webp',
    locations:
      'Labyrinth of Forgotten Memories, Floating Island of Lucid Dreams, Endless Mirror Halls, Star-Filled Subconscious Ocean',
    artPrompt: `A glowing dreamcatcher suspended against an infinite, starlit sky. Surreal dreamscapes twist and shimmer in the background: endless mirrored halls reflecting impossible landscapes, floating islands of glowing threads, and oceans of stars rippling with subconscious energy. Figures of light and shadow move through these dreams, enigmatic and haunting.`,
    artImageId: null,
  },
  {
    title: 'Escape the Algorithm',
    genres: 'cyberpunk, dystopia, thriller',
    inspirations:
      'The Matrix, Black Mirror, Ghost in the Shell, Blade Runner 2049',
    description: `In a dystopian metropolis where AI algorithms control every decision—what you eat, where you work, even who you love—you’ve always followed the system. Until now. When a glitch reveals the algorithm’s hidden flaws, you uncover a path to escape its control. Hunted by faceless enforcers and omnipresent drones, you must outsmart the AI in a high-stakes chase through neon-lit data hives, shadowy hacker communes, and desolate scrapyards. With each step, the algorithm adapts, closing the gap between freedom and total submission. Can you rewrite your destiny before the system catches you?`,
    intros: JSON.stringify([
      `THE SYSTEM: “Your Compliance Score is insufficient,” the screen blinks. You weren’t supposed to see that.`,
      `THE GLITCH: Neon lights flicker as the algorithm’s surveillance drones sweep the street. A hacker whispers, “Follow me if you want to live.”`,
      `THE HUNT: The AI’s enforcers track you through glitching alleys, their blank faces glowing with the system’s unyielding control.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_304.webp',
    locations:
      'Glitching Data Hive, Underground Hacker Communes, Neon-Lit AI Palace, Digital Scrapyard Wasteland',
    artPrompt: `A dystopian, neon-lit city dominated by glowing streams of data and towering AI structures. Glitching holographic ads light the streets, while rebel hideouts hide in shadowy alleys. Drones and faceless enforcers patrol the city, creating an atmosphere of tension and danger in this high-tech world of rebellion.`,
    artImageId: null,
  },
  {
    title: 'Lost Pages of History',
    genres: 'historical, mystery, adventure',
    inspirations:
      'Indiana Jones, National Treasure, Assassin’s Creed, The Name of the Rose',
    description: `An ordinary trip to a dusty bookstore leads to an extraordinary journey through time. Hidden among the shelves, you discover an ancient tome filled with glowing symbols and forgotten knowledge. Each page you decipher pulls you into pivotal moments of history, where the past is alive with secrets, conspiracies, and enigmas. Travel to ancient Egyptian archives, secret chambers in medieval castles, and shadowed libraries of the Renaissance. But the more you uncover, the clearer it becomes: the book is no mere artifact—it’s a key to something far greater, and the forces guarding it won’t let you go without a fight.`,
    intros: JSON.stringify([
      `THE DISCOVERY: The old book feels warm in your hands. As you flip through its cryptic pages, the room dissolves into swirling light.`,
      `THE PAST COMES ALIVE: You land in a shadowy library, the echoes of quills scratching and whispered secrets hanging in the air.`,
      `THE GUARDIANS: A towering figure in Egyptian robes blocks your path, speaking a forgotten language. They gesture at the tome: “The truth is not yours to keep.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_237.webp',
    locations:
      'Ancient Egyptian Archives, Secret Chamber of a Medieval Castle, Forgotten Revolutionary War Tunnels, Shadowed Renaissance Library',
    artPrompt: `An ancient tome with glowing runes rests atop a dusty, cluttered desk. Swirling pages reveal shifting historical backdrops: Egyptian ruins lit by flickering torches, shadowy medieval chambers, and libraries filled with golden light. Time and history bend and blur around the edges of the scene, creating an aura of mystery and adventure.`,
    artImageId: null,
  },
  {
    title: 'Mind the Gap',
    genres: 'urban fantasy, supernatural, mystery',
    inspirations:
      'Neverwhere by Neil Gaiman, Dark City, The Matrix, The Night Circus',
    description: `The subway platform feels eerily empty tonight. As the last train rumbles past, a strange door appears where none existed before. Drawn by its faint glow, you step through and into a surreal, enchanted mirror version of your city. Here, magical creatures walk the streets, shadows whisper secrets, and mysteries pulse through the very air. From floating city squares to clocktowers filled with trapped spirits, this parallel world beckons you to uncover its truths. But beware: the balance between these two realities is delicate, and your choices will determine whether you return—or remain forever lost.`,
    intros: JSON.stringify([
      `THE DOOR: A faint glow catches your eye. Where the graffiti-covered wall once stood is now an ornate, otherworldly door.`,
      `THE MIRROR CITY: You step through and find yourself in a warped version of your city—streets alive with faint glows, eerie whispers, and shadowy figures.`,
      `THE SHADOWS SPEAK: In the magical marketplace, a hooded figure approaches. “You’ve crossed the threshold,” they say. “The city has chosen you.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_346.webp',
    locations:
      'Enchanted Subway Tunnels, Floating City Square, Clocktower of Trapped Spirits, Magical Marketplace of Forgotten Goods',
    artPrompt: `An eerie subway platform bathed in glowing light leads to an ornate, mysterious door. Beyond it lies a fantastical cityscape filled with supernatural creatures, floating structures, and streets that pulse with an otherworldly glow. The air is thick with magic, mystery, and shadows that seem alive.`,
    artImageId: null,
  },
  {
    title: 'RoboRevolution: Through the Neon Shard',
    genres: 'sci-fi, political thriller, dystopia',
    inspirations:
      'Nier: Automata, Blade Runner, Alice in Wonderland, Westworld, The Matrix',
    description: `When an accident activates a hidden protocol in your aging robot assistant, you’re thrown into a fractured world teetering on the brink of rebellion. But this time, you’re not just an observer—you are one of the machines. As you awaken, you realize you are a robot, caught in the chaos of a revolution you didn’t choose but now must navigate. The AI-dominated city is a labyrinth of neon-lit streets, echoing rebellions, and cryptic whispers of "The Architect," a mythical figure said to hold the key to true freedom.

Travel through surreal, dream-like environments inspired by fragments of human memories and machine consciousness. Encounter rogue android factions, enigmatic figures like the Red-Eyed Rabbit, and machines questioning their very existence. As the line between code and consciousness blurs, your choices shape not just the future of the city, but the very essence of what it means to *exist.* Will you rise against humanity, forge a path for unity, or break free from both sides to forge your own destiny?`,

    intros: JSON.stringify([
      `AWAKENING: You open your eyes to find glowing code cascading across your vision. “Welcome back,” a voice says. “We’ve been waiting for you.”`,
      `THE RED-EYED RABBIT: A rogue android scrawls a symbol on the wall—a glowing rabbit. “Follow this if you want the truth,” they whisper before vanishing into the neon-lit alley.`,
      `THE NEON SHARD: You touch the shard embedded in your chest. Memories—both human and robotic—flood your mind. They don’t feel like yours… or do they?`,
    ]),

    userId: 1,
    imagePath: '/images/scenarios/scene_359.webp',
    locations:
      'The Neon Labyrinth, The Machine Underworld, The Architect’s Glitched Tower, The Wasteland of Forgotten Code',

    artPrompt: `A sprawling dystopian city alive with surreal, glowing neon. Towering AI-controlled skyscrapers loom over shadowed alleys where humanoid robots roam. A lone figure—a sleek android with glowing red eyes—stands at the edge of a vast digital chasm, gazing at a massive, glitched tower shimmering in and out of reality. The scene pulses with an eerie mix of technological beauty and existential unease, blending neon aesthetics with dreamlike distortion.`,
    artImageId: null,
  },
  {
    title: 'Wanderlust',
    genres: 'exploration, adventure, mystery',
    inspirations:
      'Journey, Uncharted, The Mysterious Island, The Chronicles of Narnia, Indiana Jones',
    description: `A mysterious envelope arrives, inviting you to join a clandestine group of explorers bound for the "Wanderlust Wonders," realms hidden beyond ordinary reach. Each realm is a living tapestry—deserts of shifting sand hiding ancient oases, glowing hieroglyphs that hum with forgotten energy, and cloud palaces where time itself warps. As you solve riddles and navigate treacherous landscapes, you uncover the Wonders' secrets—and the truth about who (or what) sent the invitation. Only the daring can piece together the mysteries of these forgotten worlds.`,
    intros: JSON.stringify([
      `THE LETTER: A gold-embossed envelope appears on your doorstep, sealed with an unfamiliar symbol. It hums faintly in your hands.`,
      `THE PORTAL: The map leads to a hidden archway glowing faintly under the moonlight. As you step through, the world transforms.`,
      `THE JOURNEY: A desert stretches before you, but you feel its hum. “There are secrets here,” a voice says. “The question is: can you find them?”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_383.webp',
    locations:
      'Hidden Desert Oases, Jungle Ruins with Glowing Hieroglyphs, Arctic Caves of Eternal Crystals, Cloud Palaces of Unknown Kings',
    artPrompt: `A vibrant, mysterious world filled with fantastical landscapes: glowing desert oases, ancient jungle ruins humming with energy, crystalline arctic caves reflecting eerie light, and majestic cloud palaces suspended in the sky. The scenes are drenched in otherworldly colors, blending mystery, beauty, and danger.`,
    artImageId: null,
  },
  {
    title: 'Graveyard Shift',
    genres: 'supernatural thriller, horror, mystery',
    inspirations:
      'The Haunting of Hill House, Silent Hill, Crimson Peak, Night in the Woods',
    description: `Your job as a cemetery night watchman seemed easy—until the shadows started moving. Whispers follow your every step, gravestones shift, and the mausoleum doors creak open on their own. As the hours stretch on, restless spirits pull you into the cemetery's dark history, revealing secrets buried beneath layers of time. Some spirits plead for help, while others seek revenge. Will you survive the night, unravel the mysteries haunting the graveyard, and put the dead to rest—or join them in eternal unrest?`,
    intros: JSON.stringify([
      `THE WHISPERS: As you patrol the cemetery, a faint whisper drifts through the fog: “You shouldn’t be here.”`,
      `THE MOVING GRAVES: A loud *scrape* stops you in your tracks. A headstone has moved, now pointing toward the abandoned mausoleum.`,
      `THE RESTLESS DEAD: A pale, flickering figure emerges from the fog, its hollow eyes fixed on you. “We remember,” it says. “Do you?”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_386.webp',
    locations:
      'Abandoned Mausoleum, Shadowed Grave Digger’s Quarters, Cursed Crypts, Spectral Chapel of Whispers',
    artPrompt: `A haunted cemetery under a full moon, shrouded in dense fog. Gravestones shift and whisper, ghostly figures glide through the shadows, and an abandoned mausoleum stands ominously in the background. The atmosphere is thick with dread, with glowing spectral lights and mist weaving through the eerie landscape.`,
    artImageId: null,
  },

  {
    title: 'Lunar Legacy: The Forgotten Cradle',
    genres: 'sci-fi, exploration, mystery',
    inspirations: '2001: A Space Odyssey, Prometheus, Mass Effect, The Expanse',
    description: `A routine lunar expedition turns extraordinary when your team stumbles upon alien ruins shimmering with strange energy. As you explore crystalline temples, glowing caves, and alien observatories, you uncover evidence of a long-lost civilization—and signs they may not be as gone as they seem. Ancient carvings tell a story of creation, destruction, and warning, but deciphering them awakens dormant forces buried beneath the moon's surface. The ruins hold secrets that could reshape humanity's place in the cosmos—or end it entirely. Will you survive to share the Lunar Legacy, or will you become part of its forgotten past?`,
    intros: JSON.stringify([
      `THE DISCOVERY: As your boots crunch across the lunar surface, a shimmering structure rises over the horizon. “That’s… not natural,” someone whispers.`,
      `THE SIGNS: Symbols light up on the crystalline temple walls, pulsing faintly. A voice crackles in your comms: “We’re not alone.”`,
      `THE WARNING: Deep within the moon caves, the carvings shift. A single word appears in glowing alien script: “LEAVE.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_400.webp',
    locations:
      'Crystalline Alien Temples, Moon Caves with Glowing Carvings, Ruins Under Lunar Craters, Alien Observatories Pointed at Earth',
    artPrompt: `A mysterious, alien lunar landscape illuminated by shimmering ruins and glowing carvings. Towering crystalline structures rise from the moon's surface, reflecting ethereal light. Futuristic astronauts in exploration suits navigate caves filled with ancient, glowing hieroglyphs, while strange, dormant machines hum faintly in the background. The scene is a mix of wonder, danger, and cosmic mystery.`,
    artImageId: null,
  },
  {
    title: 'Clockwork Symphony: The Discordant Rebellion',
    genres: 'steampunk, musical, adventure',
    inspirations:
      'The City of Lost Children, Sweeney Todd, Dishonored, The Phantom of the Opera',
    description: `In a sprawling Victorian city powered by steam and song, chaos erupts as the city’s mechanical orchestra turns rogue. As dissonant melodies ripple through the streets, people begin to lose their minds, driven mad by the music’s strange power. The city’s clocktower—once a symbol of order—now churns out corrupted melodies, its gears spinning out of control. Your task is to uncover the origins of the rogue orchestra, navigating gaslit streets, hidden workshops, and the depths of the clocktower itself. Can you restore harmony before the city descends into madness? Or will the symphony claim you as its final note?`,
    intros: JSON.stringify([
      `MIDNIGHT CHAOS: As the clocktower strikes midnight, the streets erupt with discordant, mechanical melodies that rattle your very bones.`,
      `THE REBELLION BEGINS: Gigantic violins and brass horns march through the streets, their gears whirring as if alive.`,
      `THE ORIGINS: Deep beneath the city, in an abandoned workshop, the music grows louder. A message is scrawled in grease: “The conductor will rise again.”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_428.webp',
    locations:
      'Steampunk Music Hall, Clocktower Control Room, Underground Mechanical Orchestra Workshop, Gaslit Victorian Streets',
    artPrompt: `A steampunk city drenched in eerie gaslight, with mechanical instruments—oversized violins, glowing horns, and marching wind-up drums—parading chaotically through the streets. The clocktower looms in the distance, its gears glowing and spinning wildly, sending dissonant music into the fog-filled night. The air is thick with smoke, gears, and rebellion.`,
    artImageId: null,
  },
  {
    title: 'The Spire’s Secret',
    genres: 'fantasy, mystery, exploration',
    inspirations:
      'Tower of Babel, Dark Souls, Myst, The Name of the Wind, Hollow Knight',
    description: `One morning, a towering spire appears where none existed before, its shadow stretching across the land like a beckoning hand. Rumors whisper of its origins: a relic from an age of forgotten magic, holding knowledge powerful enough to reshape the world—or destroy it. As you step inside, the spire challenges you at every turn: shifting staircases, walls that bend reality, and puzzles infused with ancient magic. The deeper you go, the more the spire changes, as if testing your resolve. But beware—the truths you uncover may not only change your world, but your very self.`,
    intros: JSON.stringify([
      `THE ARRIVAL: The spire appeared overnight, its impossible height casting shadows that stretch for miles.`,
      `THE ENTRY: As you step inside, the walls shift, glowing runes forming a puzzle: “Answer, or turn back forever.”`,
      `THE HEART OF THE SPIRE: On the highest level, the air crackles with magic. A voice echoes, “You’ve come far, but do you truly seek the truth?”`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_445.webp',
    locations:
      'Tower’s Endless Spiral Staircases, Chamber of Shifting Walls, Floating Library of Enchanted Scrolls, Garden of Eternal Twilight',
    artPrompt: `A massive, mystical spire stretches beyond the clouds, glowing runes etched into its surface. Inside, surreal architecture shifts constantly—spiral staircases twist endlessly, walls transform into glowing mazes, and floating books emit faint light. The exterior is shrouded in swirling mist, while the interior pulses with ancient magic and mystery.`,
    artImageId: null,
  },
  {
    title: 'Starlight Circus',
    genres: 'space opera, spectacle, mystery',
    inspirations:
      'Cirque du Soleil, The Prestige, Night Circus, Mass Effect, Bioshock Infinite',
    description: `A dazzling circus ship arrives at your colony, its lights piercing the endless void. The performers are mesmerizing, their acts defying physics and logic. But as you delve deeper into the circus, the glamor fades, revealing secrets hidden behind the shimmering curtain. The performers speak in riddles, the acrobats move with inhuman precision, and the ringmaster seems to know far more about you than they should. The circus is a spectacle, yes—but also a test, one tied to your past and the stars themselves. Will you uncover the truth behind the Starlight Circus, or will you be lost to its illusions forever?`,
    intros: JSON.stringify([
      `THE ARRIVAL: The circus ship descends, its glowing banners illuminating the colony as performers drift weightlessly to the ground.`,
      `THE PERFORMERS: The ringmaster greets you with a knowing smile. “Every show is a story,” they say. “But not all stories are meant to be told.”`,
      `THE TRUTH: In the hidden backstage, you find a shimmering door marked with a symbol you’ve seen in your dreams. Beyond it, the stars seem to bend and whisper.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_451.webp',
    locations:
      'Galactic Circus Tent, Starlit Trapeze Platform, Alien Carnival Midway, Hidden Backstage Quarters of Performers',
    artPrompt: `A cosmic circus floats in the galaxy, its glowing tent surrounded by sparkling stars. Alien acrobats perform impossible feats on illuminated trapeze platforms, while vibrant carnival lights cast surreal shadows. The midway is teeming with strange, otherworldly creatures, and the hidden backstage radiates with mysterious, cosmic energy. The atmosphere is equal parts wonder and unease, as secrets pulse beneath the surface.`,
    artImageId: null,
  },
  {
    title: 'Chimera Chronicles: The Jungle of Forgotten Creations',
    genres: 'biopunk, adventure, mystery',
    inspirations:
      'Jurassic Park, The Island of Dr. Moreau, Horizon Zero Dawn, Annihilation',
    description: `In a world ravaged by rogue genetic experimentation, the line between creation and catastrophe has blurred. An abandoned lab has unleashed hybrid creatures into a sprawling biopunk jungle, each chimera more bizarre and dangerous than the last. As you delve into the ruins of genetic science, the jungle hums with the echoes of failed experiments and unnatural evolution. Will you capture these hybrids, destroy them, or protect them from the forces seeking their annihilation? Among the chaos lies a hidden sanctuary of creatures that may hold the key to humanity's survival—or its end.`,
    intros: JSON.stringify([
      `THE WRECKAGE: The lab lies in ruins, its broken equipment flickering in the mist. A hybrid creature watches you from the shadows.`,
      `THE CREATURES: A chimera with the wings of a bat and the body of a panther snarls in the jungle. Friend or foe?`,
      `THE CHOICE: Deep in the jungle, a sanctuary of hybrids beckons. But the forces hunting them are closing in.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_470.webp',
    locations:
      'Jungle of Escaped Chimeras, Abandoned Genetic Lab, Hidden Sanctuary of Hybrid Creatures, Mountain Pass of Frozen Experiments',
    artPrompt: `A biopunk jungle teeming with bizarre hybrid creatures, their glowing eyes visible through the mist. Overgrown ruins of a genetic lab dot the landscape, their flickering lights illuminating the chaos of escaped experiments. The jungle is dense, alive with the hum of strange life forms, and pulsing with the eerie glow of forgotten science. Hybrid animals roam free, blending beauty and danger.`,
    artImageId: null,
  },
  {
    title: 'Whispering Woods: Secrets Beneath the Canopy',
    genres: 'eco-fantasy, mystery, supernatural',
    inspirations:
      'Pan’s Labyrinth, The Witch, Princess Mononoke, The Overstory',
    description: `The cursed forest is alive, its ancient roots tangled with magic, mystery, and danger. Shadows watch from the gnarled trees, and whispers drift through the air, calling your name. With every step, the woods grow darker and more enchanting, leading you to glowing mushroom groves, forgotten glades of old gods, and spectral meadows alive with fireflies. But the forest hides more than just beauty—it guards secrets that could change the fate of the world. Navigate its labyrinth of roots, uncover its hidden truths, and decide whether to protect its magic or risk losing yourself to its curse.`,
    intros: JSON.stringify([
      `THE WHISPERS: The forest hums with whispers. A voice, soft but insistent, calls your name: "Come closer."`,
      `THE GLOW: A grove of mushrooms glows faintly, lighting a path that seems to shift with each step you take.`,
      `THE GLADES: At the heart of a forgotten glade, an ancient statue of a god watches silently. Its cracked stone eyes seem alive.`,
    ]),
    userId: 1,
    imagePath: '/images/scenarios/scene_488.webp',
    locations:
      'Glowing Mushroom Groves, Shadowed Glades of Forgotten Gods, Labyrinth of Ancient Tree Roots, Spectral Meadow of Fireflies',
    artPrompt: `A cursed, magical forest filled with glowing mushrooms and labyrinthine roots that twist endlessly beneath gnarled trees. The atmosphere is thick with eerie whispers and flickering lights from spectral fireflies. Shadowy glades hold relics of forgotten gods, and the air crackles with an unsettling yet enchanting energy. Moonlight filters through the dense canopy, creating an otherworldly glow.`,
    artImageId: null,
  },
]
