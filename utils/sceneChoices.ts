//utils/sceneChoices.ts

export const scenarios = [
  {
    title: 'Serendipity',
    genres: 'fantasy, mystery, surrealism',
    description:
      'An eclectic space where chaos meets opportunity. Expect surprises at every turn.',
    intros: JSON.stringify([
      'You find yourself in a kaleidoscopic bazaar where nothing is as it seems.',
      'The air hums with possibility as doors to countless worlds beckon you forward.',
      'An inexplicable pull draws you into a realm of boundless curiosity.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/space.webp',
    locations:
      'floating carnival of portals, glass maze of forgotten gods, time-frozen auction house, bazaar of lost memories',
    artPrompt:
      'kaleidoscopic bazaar, floating stalls, fantastical creatures, vibrant lights, surreal architecture',
    artImageId: null,
  },
  {
    title: 'Super Dungeon Coliseum',
    genres: 'action, fantasy, horror',
    description:
      'A deadly dungeon-crawling coliseum where adventurers battle for fame and survival.',
    intros: JSON.stringify([
      'The roar of the crowd greets you as you step into the massive arena.',
      'Chains rattle, gates creak open, and your name echoes across the coliseum.',
      'The dungeon is alive, ready to devour or reward those who dare to challenge it.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/dungeon.webp',
    locations:
      'blood-stained labyrinth, arena of sentient shadows, molten gold crypt, cursed forge of champions',
    artPrompt:
      'coliseum, dungeon, glowing glyphs, chains, menacing monsters, roaring crowd',
    artImageId: null,
  },
  {
    title: 'Absurd Musical Murder Mystery',
    genres: 'mystery, comedy, thriller',
    description:
      'A whimsical murder mystery where everyone sings their alibis—and maybe their motives.',
    intros: JSON.stringify([
      'The scene opens with a crescendo as suspects burst into an accusatory melody.',
      'You arrive at the crime scene, greeted by an eccentric detective with a ukulele.',
      "Everyone's a suspect, and everyone’s singing. Solve the mystery before the final note!",
    ]),
    userId: 1,
    imagePath: '/images/scenarios/mystery.webp',
    locations:
      'haunted orchestra pit, jazz speakeasy frozen in time, ballroom of shifting identities, detective’s underwater piano lounge',
    artPrompt:
      'whimsical mansion, eccentric costumes, suspects singing, grand piano, vibrant colors',
    artImageId: null,
  },
  {
    title: 'Cartoon Crossroads',
    genres: 'dark comedy, surrealism, horror',
    description:
      'A twisted animated world where the rules of physics and morality are up for grabs.',
    intros: JSON.stringify([
      'A portal drags you into a realm of talking animals with sharp teeth and sharper tongues.',
      'You trip on a banana peel and tumble into a world where slapstick hides dark secrets.',
      'The cartoon laws of chaos apply, and escape may not be as funny as it seems.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/cartoon.webp',
    locations:
      'abandoned carnival of broken animatronics, shadowed toontown underbelly, sentient sketchbook prison, looping cartoon graveyard',
    artPrompt:
      'dark cartoon world, eerie humor, talking animals with sharp edges, surreal landscapes, chaotic physics',
    artImageId: null,
  },
  {
    title: 'Cyberpunk Dreamscape',
    genres: 'cyberpunk, fantasy, pop culture',
    description:
      'A neon-soaked cityscape where global cultures collide in a digital dreamworld.',
    intros: JSON.stringify([
      'The city lights blur as you plug into the dreamscape for the first time.',
      'A mysterious hacker contacts you with a dangerous proposition.',
      'The line between reality and illusion fades as you navigate the digital underworld.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/cyberpunk-dreamscape.webp',
    locations:
      'neon temple of lost avatars, glitching dancefloor skyscraper, ramen market of parallel realities, AR bazaar of impossible goods',
    artPrompt:
      'neon-lit city, holographic billboards, rain-slick streets, cultural mashups, futuristic chaos',
    artImageId: null,
  },
  {
    title: 'Mythic Frontier',
    genres: 'fantasy, western, mystery',
    description:
      'An untamed wilderness where mythic creatures roam and heroes forge their legacy.',
    intros: JSON.stringify([
      'The golden sun rises over an endless frontier of mystery and danger.',
      'You stumble upon an ancient ruin, its secrets waiting to be uncovered.',
      'A shadow passes overhead—a dragon, or something more ancient?',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/mythic-frontier.webp',
    locations:
      'ghostly saloon of forgotten heroes, dragon bone canyon, griffin roost gold mine, frontier town frozen in myth',
    artPrompt:
      'wild west, mythic creatures, griffins, golden-hour light, ancient ruins',
    artImageId: null,
  },
  {
    title: 'Time Travelers’ Convergence',
    genres: 'sci-fi, historical, surreal',
    description: 'A nexus where travelers from all times and places meet.',
    intros: JSON.stringify([
      'You arrive at the nexus, surrounded by figures from history, myth, and beyond.',
      'An inventor from the future hands you a mysterious device, its purpose unknown.',
      'The timeline wavers, and reality itself seems to buckle under the strain.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/time-travelers-convergence.webp',
    locations:
      'Roman colosseum with holograms, Victorian clockwork airship, prehistoric jungle with time rifts, futuristic museum of all timelines',
    artPrompt:
      'time nexus, glowing portals, Roman soldier, futuristic astronaut, kaleidoscopic worlds',
    artImageId: null,
  },
  {
    title: 'Underwater Odyssey',
    genres: 'sci-fi, fantasy, exploration',
    description:
      'A deep-sea adventure where wonders and terrors lurk in the depths.',
    intros: JSON.stringify([
      'You dive into the abyss, where bioluminescent creatures light your path.',
      'A submarine beckons, its captain offering a once-in-a-lifetime expedition.',
      'The ocean is alive, and something ancient stirs in the darkness.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/underwater-odyssey.webp',
    locations:
      'glowing coral metropolis, trenches of ancient leviathans, underwater volcanic caverns, sunken library of forgotten civilizations',
    artPrompt:
      'bioluminescent reef, glowing sea creatures, ancient ruins, mysterious shadows, underwater',
    artImageId: null,
  },

  {
    title: 'Space Couch',
    genres: 'fantasy, surrealism, comedy',
    description:
      'A magic couch that takes you to alien lands when you lose your phone in its folds.',
    intros: JSON.stringify([
      'Exhausted after a busy day, you drop onto the couch for a solid 4-hours of blissful memes.',
      "Unfortunately, your phone fell in the folds of your cushions, and huh, what's this button do?",
      'Suddenly, the couch begins to rise, flying through stars and alien landscapes.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/space-couch.webp',
    locations:
      'nebula karaoke lounge, asteroid junkyard theme park, cosmic library of forgotten memes, infinite galactic pillow fort',
    artPrompt:
      'flying couch, alien landscapes, whimsical stars, surreal, magical vibes',
    artImageId: null,
  },
  {
    title: 'You’ve Got Mail… Too Much Mail',
    genres: 'surrealism, psychological, tech horror',
    description: 'A surreal VR world plagued by endless popup ads.',
    intros: JSON.stringify([
      'The new VR contact lenses seemed promising at first.',
      "But now the popup ads are chasing you, and there's no off switch.",
      'Maybe VR tech support will help, if you can survive the labyrinth.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/too-much-mail.webp',
    locations:
      'endless cubicle maze, glitched dreamscape server room, haunted data cloud, labyrinth of aggressive popups',
    artPrompt:
      'VR labyrinth, surreal bureaucracy, floating ads, glitchy tech, eerie atmosphere',
    artImageId: null,
  },
  {
    title: 'Paws for Thought',
    genres: 'mystery, cozy fantasy, detective',
    description:
      'Follow paw prints to uncover a world of talking animals and solve mysteries.',
    intros: JSON.stringify([
      'With your morning coffee in hand, you head to the backyard to enjoy some fresh air.',
      'But as you step outside, a trail of paw prints leads you to a hidden door under your shed.',
      'The door opens to a world of talking animals and a mystery waiting to be solved.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/paws-for-thought.webp',
    locations:
      'hidden animal council hall, enchanted forest tea shop, underground warren library, detective’s owl-filled clocktower',
    artPrompt:
      'hidden door, anthropomorphic animals, cozy backyard, detective theme, whimsical',
    artImageId: null,
  },
  {
    title: 'Sticky Notes to Stardom',
    genres: 'musical, adventure, feel-good',
    description: 'Your sticky-note lyrics bring a musical world to life.',
    intros: JSON.stringify([
      'You’re scribbling lyrics on sticky notes during a dull work meeting.',
      'A gust of wind scatters them, and the sticky notes come to life.',
      'Suddenly, you’re thrust into a musical adventure where your songs shape reality.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/sticky-notes-to-stardom.webp',
    locations:
      'floating symphony stage, neon lyric forest, dreamscape rehearsal room, grand starlight amphitheater',
    artPrompt:
      'musical adventure, colorful sticky notes, fantastical realms, stage lights, magic',
    artImageId: null,
  },
  {
    title: 'Kitchen Catastrophe',
    genres: 'culinary, historical, time travel',
    description: 'A secret sauce transforms your kitchen into a time portal.',
    intros: JSON.stringify([
      'While preparing dinner, you accidentally spill a mysterious sauce onto your stove.',
      'The sauce sizzles, emits an odd smell, and suddenly a portal opens.',
      'Your kitchen is transformed into a gateway to historical feasts across time.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/kitchen-catastrophe.webp',
    locations:
      'Renaissance feast halls, ancient spice caravans, futuristic molecular gastronomy labs, Viking mead halls',
    artPrompt:
      'time portal, ancient feasts, glowing sauce, historical kitchens, culinary chaos',
    artImageId: null,
  },
  {
    title: 'Pixel Pioneers',
    genres: 'retro sci-fi, adventure, action',
    description:
      'Save a pixelated world after being sucked into your retro console.',
    intros: JSON.stringify([
      'You’re playing a classic 8-bit game when a spilled soda causes your console to glitch.',
      'The screen flickers, and suddenly you’re pulled into a pixelated world.',
      'You must navigate this retro-futuristic realm to save the pixelated universe.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/pixel-pioneers.webp',
    locations:
      '8-bit desert of glitches, pixelated cybernetic metropolis, pixel jungle of lost code, fortress of corrupted sprites',
    artPrompt:
      '8-bit landscape, pixelated creatures, retro-futuristic, glowing soda, action-packed',
    artImageId: null,
  },
  {
    title: 'The Secret Life of Houseplants',
    genres: 'eco-fantasy, whimsy, magical realism',
    description:
      'Discover a hidden world where houseplants have their own society.',
    intros: JSON.stringify([
      'One evening, you notice a peculiar glow from your houseplants.',
      'As you lean in to investigate, you’re pulled into a vibrant ecosystem beneath their leaves.',
      'The plants have a society of their own, and they need your help.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/secret-life-of-houseplants.webp',
    locations:
      'glowing jungle of terrarium kingdoms, secret fern council chambers, sunflower metropolis, mystical moss labyrinth',
    artPrompt:
      'glowing plants, whimsical society, lush greens, tiny magical creatures, cozy vibe',
    artImageId: null,
  },
  {
    title: 'Dreamcatcher’s Dilemma',
    genres: 'surrealism, fantasy, psychological',
    description:
      'Explore surreal dreamscapes after buying a magical dreamcatcher.',
    intros: JSON.stringify([
      'At a garage sale, you purchase an old dreamcatcher with intricate designs.',
      'That night, you’re pulled into your own dreams, which are vivid and mysterious.',
      'Each night brings a new adventure, full of strange entities and surreal challenges.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/dreamcatchers-dilemma.webp',
    locations:
      'labyrinth of forgotten memories, floating island of lucid dreams, endless mirror halls, star-filled subconscious ocean',
    artPrompt:
      'surreal dreams, glowing dreamcatcher, shifting landscapes, mysterious dream entities',
    artImageId: null,
  },
  {
    title: 'Escape the Algorithm',
    genres: 'cyberpunk, dystopia, thriller',
    description: 'Outsmart a controlling AI in a dystopian city.',
    intros: JSON.stringify([
      'In a world where AI algorithms dictate your every move, you start to question the system.',
      'As you resist, you discover a hidden path to escape the algorithm’s control.',
      'But the algorithm won’t let you go without a fight, and time is running out.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/escape-the-algorithm.webp',
    locations:
      'glitching data hive, underground hacker communes, neon-lit AI palace, digital scrapyard wasteland',
    artPrompt:
      'dystopian city, oppressive AI, glowing data streams, rebel hideouts, futuristic grit',
    artImageId: null,
  },
  {
    title: 'Lost Pages of History',
    genres: 'historical, mystery, adventure',
    description: 'Solve historical mysteries with an ancient tome.',
    intros: JSON.stringify([
      'You stumble upon an ancient tome filled with cryptic symbols in a dusty bookstore.',
      'As you decipher the symbols, you’re transported back in time to pivotal moments in history.',
      'Your task is to uncover hidden truths and solve mysteries across centuries.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/lost-pages-of-history.webp',
    locations:
      'ancient Egyptian archives, secret chamber of a medieval castle, forgotten Revolutionary War tunnels, shadowed Renaissance library',
    artPrompt:
      'ancient book, glowing symbols, historical backdrops, time travel, mystery',
    artImageId: null,
  },
  {
    title: 'Mind the Gap',
    genres: 'urban fantasy, supernatural, mystery',
    description:
      'A hidden door in the subway leads to an alternate version of your city teeming with magical creatures.',
    intros: JSON.stringify([
      'The subway station feels eerily quiet, and a peculiar door catches your eye.',
      'You step through it, and the city you know is transformed into a magical, shadowy mirror.',
      'Navigate this parallel world and balance its mysteries with your own reality.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/mind-the-gap.webp',
    locations:
      'enchanted subway tunnels, floating city square, clocktower of trapped spirits, magical marketplace of forgotten goods',
    artPrompt:
      'hidden subway door, urban fantasy city, supernatural creatures, glowing streets, mysterious shadows',
    artImageId: null,
  },
  {
    title: 'RoboRevolution',
    genres: 'sci-fi, political thriller, dystopia',
    description:
      'Your vintage robot assistant reveals advanced AI capabilities, pulling you into a conspiracy.',
    intros: JSON.stringify([
      'While repairing your old robot, you activate a hidden function.',
      'The robot reveals shocking secrets about human-AI relations and an impending revolution.',
      'Navigate the political landscape to determine the future of humanity and AI.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/robo-revolution.webp',
    locations:
      'AI-controlled senate chambers, underground robot rebellion hideout, abandoned android factories, futuristic urban wastelands',
    artPrompt:
      'futuristic city, humanoid robots, tense political atmosphere, neon-lit environments, ethical dilemmas',
    artImageId: null,
  },
  {
    title: 'Wanderlust Wonders',
    genres: 'exploration, adventure, mystery',
    description:
      'A mysterious letter invites you to join an elite group of portal-hopping explorers.',
    intros: JSON.stringify([
      'A strange envelope appears in your mailbox with an invitation.',
      'The letter leads you to a hidden portal and a group of daring explorers.',
      'Travel across hidden realms to uncover secrets and solve riddles.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/wanderlust-wonders.webp',
    locations:
      'hidden desert oases, jungle ruins with glowing hieroglyphs, arctic caves of eternal crystals, cloud palaces of unknown kings',
    artPrompt:
      'hidden portals, adventurous landscapes, mysterious letters, ancient ruins, fantastical worlds',
    artImageId: null,
  },
  {
    title: 'Graveyard Shift',
    genres: 'supernatural thriller, horror, mystery',
    description:
      'Your night job at a cemetery reveals the restless dead aren’t content with staying buried.',
    intros: JSON.stringify([
      'The cemetery is quiet, but something feels off.',
      'You hear whispers among the gravestones, and shadows begin to move.',
      'Uncover the cemetery’s dark secrets and put the dead to rest—if you can survive.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/graveyard-shift.webp',
    locations:
      'abandoned mausoleum, shadowed grave digger’s quarters, cursed crypts, spectral chapel of whispers',
    artPrompt:
      'haunted cemetery, restless spirits, eerie gravestones, moonlit fog, dark supernatural vibes',
    artImageId: null,
  },
  {
    title: 'Lunar Legacy',
    genres: 'sci-fi, exploration, mystery',
    description:
      'The moon holds ancient alien ruins, and you’ve been chosen to uncover its secrets.',
    intros: JSON.stringify([
      'As you step onto the lunar surface, the ruins shimmer with alien energy.',
      'Strange symbols glow as you approach, and a sense of destiny pulls you forward.',
      'The secrets of an ancient alien civilization lie ahead—along with its dangers.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/lunar-legacy.webp',
    locations:
      'crystalline alien temples, moon caves with glowing carvings, ruins under lunar craters, alien observatories pointed at Earth',
    artPrompt:
      'alien ruins, glowing lunar surface, futuristic exploration suits, ancient carvings, mysterious atmosphere',
    artImageId: null,
  },
  {
    title: 'Clockwork Symphony',
    genres: 'steampunk, musical, adventure',
    description:
      'A mechanical orchestra runs amok in a Victorian city, and only you can restore harmony.',
    intros: JSON.stringify([
      'The city’s clocktower strikes midnight, and the music grows louder—and wilder.',
      'Mechanical instruments march through the streets, their notes dissonant and chaotic.',
      'You must piece together the orchestra’s mysterious origins to save the city.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/clockwork-symphony.webp',
    locations:
      'steampunk music hall, clocktower control room, underground mechanical orchestra workshop, gaslit Victorian streets',
    artPrompt:
      'mechanical orchestra, steampunk Victorian city, chaotic clockwork instruments, glowing gears, musical adventure',
    artImageId: null,
  },
  {
    title: 'The Spire’s Secret',
    genres: 'fantasy, mystery, exploration',
    description:
      'A mysterious tower appears overnight, holding the key to a forgotten age.',
    intros: JSON.stringify([
      'The tower’s shadow stretches across the land, drawing curious adventurers.',
      'As you enter, the air hums with ancient magic and secrets.',
      'The spire tests your wits, courage, and determination to uncover its truth.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/spires-secret.webp',
    locations:
      'tower’s endless spiral staircases, chamber of shifting walls, floating library of enchanted scrolls, garden of eternal twilight',
    artPrompt:
      'mysterious spire, ancient magic, glowing runes, surreal architecture, adventurous fantasy',
    artImageId: null,
  },
  {
    title: 'Starlight Circus',
    genres: 'space opera, spectacle, mystery',
    description:
      'A traveling circus among the stars reveals hidden truths about its performers—and yourself.',
    intros: JSON.stringify([
      'The circus spaceship docks near your colony, its lights dazzling the void.',
      'The performers are otherworldly, each act more impossible than the last.',
      'You begin to unravel the circus’s secrets—and how they connect to you.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/starlight-circus.webp',
    locations:
      'galactic circus tent, starlit trapeze platform, alien carnival midway, hidden backstage quarters of performers',
    artPrompt:
      'cosmic circus, alien performers, glowing trapeze acts, mysterious galactic carnival, surreal starry landscapes',
    artImageId: null,
  },
  {
    title: 'Chimera Chronicles',
    genres: 'biopunk, adventure, mystery',
    description:
      'A rogue genetic lab has created hybrid creatures you must capture—or befriend.',
    intros: JSON.stringify([
      'The lab is in ruins, but its creations roam free.',
      'Each hybrid creature is more fascinating—and dangerous—than the last.',
      'Navigate the wreckage and decide: will you save them or destroy them?',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/chimera-chronicles.webp',
    locations:
      'jungle of escaped chimeras, abandoned genetic lab, hidden sanctuary of hybrid creatures, mountain pass of frozen experiments',
    artPrompt:
      'hybrid creatures, biopunk jungle, glowing lab equipment, mysterious genetics, adventurous exploration',
    artImageId: null,
  },
  {
    title: 'Whispering Woods',
    genres: 'eco-fantasy, mystery, supernatural',
    description:
      'A cursed forest hides ancient secrets that only the bravest can uncover.',
    intros: JSON.stringify([
      'The forest whispers your name, its shadows alive with unseen eyes.',
      'Every step leads deeper into its mysteries—and its dangers.',
      'The secrets of the woods may change you forever, for better or worse.',
    ]),
    userId: 1,
    imagePath: '/images/scenarios/whispering-woods.webp',
    locations:
      'glowing mushroom groves, shadowed glades of forgotten gods, labyrinth of ancient tree roots, spectral meadow of fireflies',
    artPrompt:
      'cursed forest, glowing mushrooms, ancient trees, eerie whispers, magical atmosphere',
    artImageId: null,
  },
]
