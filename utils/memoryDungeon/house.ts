/**
 * The House That Remembers: stable, save-safe 36-room authored dungeon.
 * 6x6 is the atlas budget, not a demand for row-major movement.
 * Exactly two meaningful choices per room, except the three Memory Hearth endings.
 */
export type HouseRoomId = `HD-${string}`
export type HouseKind =
  | 'entry'
  | 'lore'
  | 'puzzle'
  | 'treasure'
  | 'choice'
  | 'combat'
  | 'companion'
  | 'shortcut'
  | 'rest'
  | 'secret'
  | 'hazard'
  | 'guardian'
  | 'climax'
  | 'exit'
export type HouseEnding = 'release' | 'renew' | 'break'
export type HouseCombatOrigin = 'HD-09' | 'HD-19' | 'HD-22' | 'HD-28' | 'HD-32'
export interface HouseChoice {
  id: string
  label: string
  outcome: string
  gain?: { lanterns?: number; wildflowers?: number; hearts?: number }
}
export interface HouseRoom {
  id: HouseRoomId
  title: string
  kind: HouseKind
  opening: string
  artPrompt: string
  imagePath: string
  exits: readonly HouseRoomId[]
  choices: readonly HouseChoice[]
}
export interface HouseProgress {
  current: HouseRoomId
  visited: HouseRoomId[]
  decisions: Record<string, string>
  ending: HouseEnding | null
  wardenPassed: boolean
  combatOrigin: HouseCombatOrigin | null
  chimeClaimed: boolean
}

export const HOUSE_ROOMS: Record<string, HouseRoom> = {
  'HD-01': {
    id: 'HD-01',
    title: 'Porch of Borrowed Faces',
    kind: 'entry',
    opening:
      "The house does not ask who you are. It asks whose name you brought. An empty chair appears on the porch for every answer you don't give.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Living Grimm manor porch, borrowed reflections in brass door-knocker, root arches and empty chairs. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-01.webp',
    exits: ['HD-02', 'HD-07'],
    choices: [
      {
        id: 'name',
        label: 'Offer your borrowed name',
        outcome:
          'The threshold admits a visitor who knows that a name may have two rightful witnesses.',
      },
      {
        id: 'silence',
        label: "Refuse to surrender someone else's name",
        outcome:
          'The house calls you a guest instead of an owner, which turns out to be a useful distinction.',
      },
    ],
  },
  'HD-02': {
    id: 'HD-02',
    title: 'Umbrella Stand',
    kind: 'lore',
    opening:
      "The rack holds umbrellas wet with other people's last rain. One drips salt water in a town where the sea has never reached.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Elegant dusty umbrella stand dripping different tiny weather systems inside enchanted foyer. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-02.webp',
    exits: ['HD-03'],
    choices: [
      {
        id: 'weather',
        label: 'Describe the rain you actually remember',
        outcome:
          'The stand recalls a research-office drizzle from Earth without asking who deserves it.',
      },
      {
        id: 'shelter',
        label: 'Leave a dry umbrella for the next guest',
        outcome:
          'A housekeeper nods from somewhere beyond the wall; care leaves a mark even in an archive.',
      },
    ],
  },
  'HD-03': {
    id: 'HD-03',
    title: 'Boot-Rack Maze',
    kind: 'puzzle',
    opening:
      'Pairs of boots line the floor, but the Rack remembers owners by the roads they walked, not the size of their feet. Three boots lead home; three lead back into the house.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Twisted fairytale boot-rack labyrinth, muddy footprints forming inspectable routes. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-03.webp',
    exits: ['HD-04'],
    choices: [
      {
        id: 'route',
        label: 'Sort the boots by the mud of their journeys',
        outcome:
          'You trace the mill path, the river ford and the old orchard. A small wardrobe later recognizes your method.',
      },
      {
        id: 'ask',
        label: 'Ask the boots which feet they miss',
        outcome:
          'The left boots all answer first. You learn that their owners left willingly, even where the court said they were taken.',
      },
    ],
  },
  'HD-04': {
    id: 'HD-04',
    title: 'Clockwork Pantry',
    kind: 'treasure',
    opening:
      'A clock strikes dinner with no one at the table. The pantry offers food enough for one traveler, then asks which hungry person will not eat.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Clockwork pantry with tiny automaton cook, turning brass clock, single bread and empty place setting. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-04.webp',
    exits: ['HD-05'],
    choices: [
      {
        id: 'share',
        label: 'Divide the rations with the absent guest',
        outcome:
          'The pantry gives you a lantern in gratitude for admitting there is a shortage.',
        gain: { lanterns: 1 },
      },
      {
        id: 'record',
        label: 'Write down who did not get supper',
        outcome:
          "The meal is not a victory, but the missing place gains a name in the House's ledger.",
      },
    ],
  },
  'HD-05': {
    id: 'HD-05',
    title: "The Wolf's Latch",
    kind: 'choice',
    opening:
      "A gate was put here to keep wolves out. The scratches are on the inside: someone barred the village's protectors from reaching the road.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Iron latch with claw scratches on interior, moonlit silhouettes of guardians outside. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-05.webp',
    exits: ['HD-06'],
    choices: [
      {
        id: 'open',
        label: "Unlatch the defenders' forgotten patrol route",
        outcome:
          'Wind carries the smell of rain and wool blankets. The village loses one comfortable lie.',
      },
      {
        id: 'test',
        label: 'Ask who paid to have the latch installed',
        outcome:
          'A ledger shows the charge was for protection against witnesses, not predators.',
      },
    ],
  },
  'HD-06': {
    id: 'HD-06',
    title: 'Broom Closet Exit',
    kind: 'shortcut',
    opening:
      "Oren's immaculate emergency plan is tucked between a broom and a ceremonial coffin. A sign lists departure times, including one that has already happened.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Comedic dark fantasy broom closet with perfect maps and formidable hooded headsman organizing supplies. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-06.webp',
    exits: ['HD-01', 'HD-13'],
    choices: [
      {
        id: 'route',
        label: "Follow Oren's accurately labelled return path",
        outcome:
          'You memorize a safe shortcut back to the porch. Oren corrects your spelling without removing his hood.',
      },
      {
        id: 'stock',
        label: 'Restock the emergency water cask',
        outcome:
          'Someone else will be able to escape without a heroic last stand.',
      },
    ],
  },
  'HD-07': {
    id: 'HD-07',
    title: 'Family Portrait Hall',
    kind: 'lore',
    opening:
      'Portraits crowd the hall. Each family has one painted guest nobody recalls inviting, and none of the guests seem to know who painted them.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Tall portrait hall with dignified fantasy families and barely perceptible extra figure in each oil portrait. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-07.webp',
    exits: ['HD-08'],
    choices: [
      {
        id: 'count',
        label: 'Count the uninvited guests',
        outcome:
          'You find eleven visitors who signed contracts but vanished from the official count.',
      },
      {
        id: 'speak',
        label: 'Ask a painted stranger what they wanted',
        outcome:
          'They wanted a room where nobody would ask whether a memory was legally theirs.',
      },
    ],
  },
  'HD-08': {
    id: 'HD-08',
    title: 'Staircase of Three Apologies',
    kind: 'puzzle',
    opening:
      'Three apologies are pinned to the steps. The sincerest sounds least polished, because the people who suffered helped write it.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Skewed grand staircase with three illustrated parchment apologies and spectral listeners. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-08.webp',
    exits: ['HD-09'],
    choices: [
      {
        id: 'harm',
        label: 'Sort the apologies by what was repaired',
        outcome:
          'The staircase lets you ascend after you name the person harmed before the person forgiven.',
      },
      {
        id: 'listen',
        label: 'Ask the person harmed to choose the order',
        outcome:
          'A voice declines to forgive but still opens the stair. The House makes room for that answer.',
      },
    ],
  },
  'HD-09': {
    id: 'HD-09',
    title: 'Hearth-Guard',
    kind: 'combat',
    opening:
      'A coal-shaped defender bars the hearth. It has burned nobody yet, but its warning markings pulse in a fair three-beat pattern.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Animated fiery hearth guardian with glowing protective sigils telegraphing a fair duel. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-09.webp',
    exits: ['HD-10'],
    choices: [
      {
        id: 'parley',
        label: 'Offer to put the fire out safely',
        outcome:
          'The guard lowers its sparks when you demonstrate where the children are sleeping.',
      },
      {
        id: 'study',
        label: 'Learn the three-beat warning before moving on',
        outcome:
          "You memorize the coal's cooling pattern; a later Warden telegraph becomes less mysterious.",
      },
      {
        id: 'duel',
        label: 'Challenge the Hearth-Guard to a telegraphed matching duel',
        outcome:
          'The hearth admits a defender can change their mind after fair combat.',
      },
    ],
  },
  'HD-10': {
    id: 'HD-10',
    title: "Scylla's Inventory",
    kind: 'companion',
    opening:
      'Scylla has prepared seven emergency wardrobes, two court complaints, and a waterproof plan. Oren calmly removes the duplicate provisions and adds breakfast.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Sturdy farm-built proper mermaid princess Scylla with crisp coat examining inventory; hooded headsman Oren with ledger. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-10.webp',
    exits: ['HD-11'],
    choices: [
      {
        id: 'manifest',
        label: "Trust the twins' manifest and mark the service route",
        outcome:
          'A private service shortcut becomes obvious. Scylla is delighted; Oren had already labelled it.',
      },
      {
        id: 'improvise',
        label: 'Let Char improvise while Scylla manages the supplies',
        outcome:
          'The twins disagree eloquently, then save a stranded maid together.',
      },
    ],
  },
  'HD-11': {
    id: 'HD-11',
    title: "Char's Wardrobe",
    kind: 'companion',
    opening:
      "Char's clothes are genuine subculture, not a dress-up gag: patched velvet, silverwork, old boots and handmade protective sigils. She dares you to call one a costume.",
    artPrompt:
      "Western animated mature Grimm fantasy, a single story scene: Authentic goth mermaid princess Char matching Scylla's facial structure and broad sturdy physique, handmade gothic streetwear with protective charms. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-11.webp',
    exits: ['HD-12'],
    choices: [
      {
        id: 'respect',
        label: 'Ask Char how her protective charm was made',
        outcome:
          'She teaches the labor behind each protective stitch and gives you an unexpectedly practical ward.',
      },
      {
        id: 'help',
        label: 'Repair the buckled boot instead of admiring it',
        outcome:
          'Char lends you a needle as heavy as a tiny dagger. The gesture earns a laugh and her trust.',
      },
    ],
  },
  'HD-12': {
    id: 'HD-12',
    title: "Servants' Passage",
    kind: 'shortcut',
    opening:
      "A narrow corridor connects a forgotten servant's kitchen to a grand hallway without asking whether servants were permitted to use the doors.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Root-lined concealed service tunnel with hand-painted floor marks and dim lamps. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-12.webp',
    exits: ['HD-07', 'HD-13'],
    choices: [
      {
        id: 'open',
        label: 'Keep the service passage accessible to everyone',
        outcome:
          'The workers have a free path between the galleries again. The nearest officer is deeply irritated.',
      },
      {
        id: 'map',
        label: 'Map its bends for safe future retreats',
        outcome:
          'The passage becomes a known loop, rather than a secret the next visitor must pay to discover.',
      },
    ],
  },
  'HD-13': {
    id: 'HD-13',
    title: 'Letterpress Kitchen',
    kind: 'puzzle',
    opening:
      'The recipe is missing its middle line. A printing press stamps dinner menus on every dish, each with a different missing instruction.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Gothic kitchen with letterpress, culinary ciphers, enchanted pies and fractured recipe plates. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-13.webp',
    exits: ['HD-14'],
    choices: [
      {
        id: 'sequence',
        label: 'Read the ingredient sequence backward',
        outcome:
          'You reconstruct the missing recipe without needing to guess which of three nearly identical pans is cursed.',
      },
      {
        id: 'invite',
        label: 'Ask a servant to read the smudged line',
        outcome:
          'The servant knows the whole recipe by memory and finally receives credit for inventing it.',
      },
    ],
  },
  'HD-14': {
    id: 'HD-14',
    title: 'First Memory Jar',
    kind: 'treasure',
    opening:
      "A glass jar holds the sound of the village's last festival. The laughter belongs to people who may prefer not to remember the day.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Translucent glass memory jar projecting a village festival with uncertain faces. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-14.webp',
    exits: ['HD-15'],
    choices: [
      {
        id: 'witness',
        label: 'Listen without taking the memory',
        outcome:
          "The village's festival returns to the Chronicle as testimony, not somebody else's loot.",
        gain: { wildflowers: 1 },
      },
      {
        id: 'seal',
        label: 'Protect the jar until its speakers can consent',
        outcome:
          'The House records a request for witnesses instead of a theft.',
      },
    ],
  },
  'HD-15': {
    id: 'HD-15',
    title: 'The Polite Guest',
    kind: 'choice',
    opening:
      'A cursed dinner guest insists on signing away their grief. Their host insists this is hospitality. Both ask you to witness.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Formal dinner table with courteous ghostly guest, hovering pen and unsigned consent form. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-15.webp',
    exits: ['HD-16'],
    choices: [
      {
        id: 'decline',
        label: 'Refuse to sign for somebody else',
        outcome:
          'The host is furious; the guest looks relieved to be treated as a person.',
      },
      {
        id: 'question',
        label: 'Ask whether consent can be withdrawn',
        outcome:
          'The host admits the original contract had no exit clause. You note the omission.',
      },
    ],
  },
  'HD-16': {
    id: 'HD-16',
    title: 'Thornbound Housekeeper',
    kind: 'combat',
    opening:
      'The housekeeper wears armor made of returned keys. She is defending residents against memory thieves, and suspects that you may be one.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Rootwood armored housekeeper with many dangling keys, defensive stance, humane face and long thorn broom. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-16.webp',
    exits: ['HD-17'],
    choices: [
      {
        id: 'return-name',
        label: 'Return the name you found in the portraits',
        outcome:
          'She pockets the name as gently as a letter. A later guardian may recognize your intention.',
      },
      {
        id: 'inspect',
        label: 'Ask who ordered the house locked',
        outcome:
          'She shows you the order, signed by a council that no longer exists.',
      },
    ],
  },
  'HD-17': {
    id: 'HD-17',
    title: 'Gallery of Unsent Letters',
    kind: 'lore',
    opening:
      'Some letters explain why villagers asked the House to hold pain. Others explain why they were never allowed to ask for it back.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Long archive gallery with sealed letters drifting above unread desks, warm and moody light. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-17.webp',
    exits: ['HD-18'],
    choices: [
      {
        id: 'read',
        label: "Read both sides of the village elder's bargain",
        outcome:
          "You learn the difference between shelter and captivity. The Warden's terms now have witnesses.",
      },
      {
        id: 'preserve',
        label: 'Archive the unsent responses together',
        outcome:
          "Neither side's account can be erased without leaving an obvious empty space.",
      },
    ],
  },
  'HD-18': {
    id: 'HD-18',
    title: 'Quiet Bedchamber',
    kind: 'rest',
    opening:
      'The mattress smells of thyme and clean linen. A sign does not promise safety, only one night without questions. The walls listen but keep their distance.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Cozy candlelit fairytale rest room with simple bed and blooming thyme against intimidating hall. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-18.webp',
    exits: ['HD-19', 'HD-25'],
    choices: [
      {
        id: 'rest',
        label: 'Take an honest rest and recover',
        outcome:
          'You recover one heart, up to the expedition limit, and leave no debt to the house.',
        gain: { hearts: 1 },
      },
      {
        id: 'listen',
        label: 'Stay awake to hear the building settle',
        outcome:
          'You learn which staircase creaks when visitors speak their own names.',
      },
    ],
  },
  'HD-19': {
    id: 'HD-19',
    title: 'Mirror Corridor',
    kind: 'puzzle',
    opening:
      'The mirrors show a pair of identical paintings, then reverse one line. You can solve the old Echo Chamber with real card matching or reason through its mirrored geometry.',
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Endless gothic mirror hall showing recognizable reversed tile geometry and memory cards. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-19.webp',
    exits: ['HD-20'],
    choices: [
      {
        id: 'match',
        label: 'Solve the mirrored memory-card chamber',
        outcome:
          'The hallway demands actual matching skill; your cleared pairs become the proof of passage.',
      },
      {
        id: 'geometry',
        label: 'Follow the visible reversed handrail',
        outcome:
          'You bypass the optional match board by observing which reflection disagrees with the real wall.',
      },
    ],
  },
  'HD-20': {
    id: 'HD-20',
    title: "Missing Daughter's Room",
    kind: 'choice',
    opening:
      "A young woman's room contains letters she wrote after leaving home. Her family kept calling her missing long after she chose to go.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Quiet bedroom with packed traveling bag, window to old forest, handwritten letters facedown. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-20.webp',
    exits: ['HD-21'],
    choices: [
      {
        id: 'testify',
        label: 'Tell the family she left of her own accord',
        outcome: 'The truth hurts, but it respects her right to leave.',
      },
      {
        id: 'protect',
        label: 'Keep her address private',
        outcome:
          "You return the letters but not her location. A family's longing does not overrule her safety.",
      },
    ],
  },
  'HD-21': {
    id: 'HD-21',
    title: 'Parlor of Embarrassments',
    kind: 'lore',
    opening:
      "A mirror repeats Morrow's first humiliating attempts at being you. The laughter is loud enough to hide how frightened they were.",
    artPrompt:
      'Western animated mature Grimm fantasy, a single story scene: Vintage parlor with ornate mirror showing awkward Earth office scenes as memory echoes. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.',
    imagePath: '/images/memory-dungeon/house/rooms/hd-21.webp',
    exits: ["HD-22"],
    choices: [{"id":"archive","label":"Keep the humiliating memory as evidence","outcome":"The Chronicle records Morrow's early harm without pretending it is their whole character."},{"id":"turn","label":"Turn the mirror toward the empty room","outcome":"The laughter stops. You are still allowed to feel angry, but you stop inviting an audience."}],
  },
  'HD-22': {
    id: 'HD-22',
    title: "Index Collector",
    kind: 'combat',
    opening: "The Collector counts each unpaired card with cold precision. Its next sweep is announced two turns ahead, not sprung as a surprise.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Tall paper-armored bureaucratic collector with glowing marked card-column pattern over its gauntlet. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-22.webp',
    exits: ["HD-23"],
    choices: [{"id":"challenge","label":"Demand the Collector justify its seizure","outcome":"The Collector produces a rulebook missing the page authorizing possession of a person."},{"id":"feint","label":"Study the visible two-turn attack pattern","outcome":"You identify the safe column. Remembering the tell is better than being lucky."},{"id":"duel","label":"Fight the Collector using the remembered safe columns","outcome":"The Collector yields its stamp rather than claiming the lives it was sent to count."}],
  },
  'HD-23': {
    id: 'HD-23',
    title: "Small Wardrobe Door",
    kind: 'secret',
    opening: "A wardrobe is smaller on the outside than its boots. It recognizes the mud-sorting method from the entrance maze.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Tiny wardrobe inset in cavernous walls, paired boots and secret glowing lock. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-23.webp',
    exits: ["HD-24"],
    choices: [{"id":"boots","label":"Use the Boot-Rack clue to unlock the wardrobe","outcome":"The lock recognizes the old routes. Inside is a route-map, not a chest of infinite treasure."},{"id":"knock","label":"Knock and wait for its owner","outcome":"A hidden attendant opens the door and explains why the shortcut was built."}],
  },
  'HD-24': {
    id: 'HD-24',
    title: "Dry Cellar Return",
    kind: 'shortcut',
    opening: "This stair leads back to a room you have already visited. A painted arrow announces NO HEROISM REQUIRED.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Safe brick cellar staircase with practical return signage and warmly glowing root-path. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-24.webp',
    exits: ["HD-13","HD-31"],
    choices: [{"id":"mark","label":"Mark this loop for other expeditions","outcome":"The route remains visible on later returns. Nobody has to rediscover a safe exit."},{"id":"retreat","label":"Test the passage without abandoning your progress","outcome":"It carries you safely to the central hall and back; your choices remain remembered."}],
  },
  'HD-25': {
    id: 'HD-25',
    title: "The Bargain Ledger",
    kind: 'puzzle',
    opening: "The ledger lists promises by the date they were made, not the day they were enforced. Two names have been moved to the wrong pages.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Enormous ledger lit by little candles, two misordered dated records and ink stains. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-25.webp',
    exits: ["HD-26"],
    choices: [{"id":"compare","label":"Compare signatures against both Earth photos","outcome":"The dates make sense: a stranger harmed your old life before learning how to live in it."},{"id":"recount","label":"Ask the records who consented and who inherited a debt","outcome":"The balance shifts when you refuse to treat silence as agreement."}],
  },
  'HD-26': {
    id: 'HD-26',
    title: "Wolf-Mother's Defense",
    kind: 'choice',
    opening: "The village wanted guardians, then renamed their payment tribute. The patrol leader asks why service becomes robbery in a story told by comfortable people.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Wolf guardian leader in worn traveling armor protecting frightened families at a doorway. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-26.webp',
    exits: ["HD-27"],
    choices: [{"id":"testify","label":"Record the patrol's evidence and name its witnesses","outcome":"Their account becomes admissible before the Warden. Defense and consent are no longer separable."},{"id":"shelter","label":"Offer food and a safe road without a formal hearing","outcome":"The patrol accepts the kindness but keeps its petition. A debt need not be made invisible to be forgiven."}],
  },
  'HD-27': {
    id: 'HD-27',
    title: "Unclaimed Portrait",
    kind: 'treasure',
    opening: "An empty painted chair is signed for by someone who never sat there. If you take the painting, the person might never learn they were expected.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Haunting painted empty chair and silhouetted absent subject in ornate cracked portrait frame. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-27.webp',
    exits: ["HD-28"],
    choices: [{"id":"keep","label":"Copy the blank portrait rather than taking it","outcome":"A lantern glows in the frame's shadow; you may keep its light without stealing the record.","gain":{"lanterns":1}},{"id":"leave","label":"Leave the portrait for its unclaimed subject","outcome":"The House records that an unknown guest still has somewhere to return."}],
  },
  'HD-28': {
    id: 'HD-28',
    title: "Twinned Guard",
    kind: 'combat',
    opening: "Two armored figures each protect the other's marked cards. They ask which one must be defeated first, but neither will call it victory.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Two identical armored root guardians guarding mirrored glowing matching cards and each other's shields. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-28.webp',
    exits: ["HD-29"],
    choices: [{"id":"separate","label":"Ask the guards to move apart before combat","outcome":"Without the false assumption of a single enemy, you spot the symmetry of their defense."},{"id":"cooperate","label":"Suggest they protect the same door together","outcome":"They hesitate, then allow you a route while they revise their shared oath."},{"id":"duel","label":"Challenge both guards in a paired-memory contest","outcome":"The guards drop their mirrored defense only after seeing the pairs you actually remembered."}],
  },
  'HD-29': {
    id: 'HD-29',
    title: "The Indenture Room",
    kind: 'lore',
    opening: "Contracts here belong to people who asked for relief from memories. No record shows that any of them agreed to lose the right to remember.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Archive room with opened contracts and tangled living roots growing through broken locks. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-29.webp',
    exits: ["HD-30"],
    choices: [{"id":"read","label":"Record the absence of revocation terms","outcome":"The lack is evidence. It does not invalidate every need for protection, but it ends the fiction that everyone could leave."},{"id":"repair","label":"Offer a new consent clause","outcome":"A pen writes only after each named participant has spoken. It may take longer than a royal decree."}],
  },
  'HD-30': {
    id: 'HD-30',
    title: "Lantern Landing",
    kind: 'rest',
    opening: "The landing has enough seats for your party and one empty place. Oren checks rations. Scylla makes tea. Char quietly repairs a stranger's ward.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Warm lantern-lit landing with sturdy mermaid twins proper and goth, masked hooded headsman with supply ledger. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-30.webp',
    exits: ["HD-31"],
    choices: [{"id":"rest","label":"Recover and redistribute supplies","outcome":"You recover one heart without resetting the House's rooms or taking another person's rations.","gain":{"hearts":1}},{"id":"talk","label":"Hear what each companion thinks the House owes","outcome":"For once they agree: truth without care can become another kind of theft."}],
  },
  'HD-31': {
    id: 'HD-31',
    title: "Cellar of the Forgot",
    kind: 'hazard',
    opening: "Fog rises through the floorboards, hiding the newest door but not the paths you have already walked. The House is afraid of the last room.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Dense low fog over known stone passage with still-visible safe lantern markers. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-31.webp',
    exits: ["HD-32"],
    choices: [{"id":"mark","label":"Mark safe routes before the fog grows","outcome":"Your remembered map does not vanish. The cellar loses the power to make you start from zero."},{"id":"breathe","label":"Stop and count the steps instead of running","outcome":"You notice the fog repeats on every seventh breath, revealing a clear passage."}],
  },
  'HD-32': {
    id: 'HD-32',
    title: "Rootbound Warden",
    kind: 'guardian',
    opening: "The Rootbound Warden stands between you and a library that once sheltered the unwanted. It has kept records safe and residents captive. The Warden asks for proof that opening the doors would not simply make the strong richer.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Colossal living rootwood guardian with glass memory jar, defensive stance by archive doors and telegraphed glowing memory cards. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-32.webp',
    exits: ["HD-33"],
    choices: [{"id":"fight","label":"Challenge the Warden in memory-card combat","outcome":"A fair duel begins. Victory earns passage, not permission to rewrite another person's past."},{"id":"petition","label":"Present the witness testimony and request revocable consent","outcome":"The Warden reads the rescued names and steps aside without violence. The house agrees that a locked kindness is still a lock."}],
  },
  'HD-33': {
    id: 'HD-33',
    title: "The Last Kind Lie",
    kind: 'choice',
    opening: "The village elders once asked the House to keep one terrible truth secret. The people protected by that lie are now old enough to choose what to know.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Candlelit village council table with sealed memory jars and elderly witnesses struggling with a decision. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-33.webp',
    exits: ["HD-34"],
    choices: [{"id":"reveal","label":"Tell the survivors what the elders concealed","outcome":"The truth unsettles families, but now belongs to the people who must live with it."},{"id":"consent","label":"Let each survivor choose when to hear","outcome":"The House prepares individual witnesses and refuses to sell revelation as spectacle."}],
  },
  'HD-34': {
    id: 'HD-34',
    title: "Broken Doorway",
    kind: 'puzzle',
    opening: "The door ahead bears two near-identical seals. The root marks are reversed, and the House admits it has been showing the wrong way out for years.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Mysterious broken paired seal doorway with reversed root crescents and honest readable puzzle geometry. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-34.webp',
    exits: ["HD-35"],
    choices: [{"id":"compare","label":"Use the paired marks, not their apparent age","outcome":"A route opens when you notice the mirrored notch from Briar's border clues."},{"id":"ask","label":"Ask the House why the false doorway exists","outcome":"It was built for people who needed to leave without being found. You leave both paths intact."}],
  },
  'HD-35': {
    id: 'HD-35',
    title: "Memory Hearth",
    kind: 'climax',
    opening: "The hearth holds the names, grief and joys that people entrusted to the House. Its fire is almost out. The Warden will honor a choice only if you state whose consent matters.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Grand rootwood memory hearth with glass memory jars held in a ring of fire and gathered villagers, anxious hope. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-35.webp',
    exits: ["HD-36"],
    choices: [{"id":"release","label":"Return the stored memories to their owners","outcome":"The records are released to named people; many regain agency, and some old protections painfully fall away."},{"id":"renew","label":"Negotiate a revocable memory commons with witnesses","outcome":"The House becomes a steward, not a jailer. Each person can reclaim or leave a memory, and every agreement can end."},{"id":"break","label":"Break the mechanism that owns remembrance","outcome":"Nobody may own memory by decree. The House becomes dangerous and free, and tomorrow's villagers must invent a kinder safety."}],
  },
  'HD-36': {
    id: 'HD-36',
    title: "Bramble Chime Exit",
    kind: 'exit',
    opening: "A small chime hangs from a living branch. The House will let you carry it only after your choice at the Memory Hearth. Its sound can open the regional gate, but cannot undo the bargain you've made.",
    artPrompt: "Western animated mature Grimm fantasy, a single story scene: Forest-root exit with tiny glowing golden bell above doorway and three winding roads beyond. Nuanced human and fantasy subjects, no readable lettering, no watermark, no collage.",
    imagePath: '/images/memory-dungeon/house/rooms/hd-36.webp',
    exits: [],
    choices: [{"id":"carry","label":"Carry the Bramble Chime back into Briar Marches","outcome":"The House releases its chime. It belongs to your journey, not to an unlimited trophy pile."},{"id":"entrust","label":"Ask Oren to carry the chime for everyone","outcome":"Oren records the handoff with intimidating precision; the Bramble Chime is yours to use, but the witnesses know who carries it."}],
  },
}
export const HOUSE_ENTRY: HouseRoomId = 'HD-01'
export const HOUSE_EXIT_POINTS: readonly HouseRoomId[] = [
  'HD-01', 'HD-06', 'HD-12', 'HD-24', 'HD-36',
]

export function houseRoom(id: string): HouseRoom | null {
  return HOUSE_ROOMS[id] ?? null
}

export function houseExits(
  roomId: HouseRoomId,
  progress: HouseProgress,
): HouseRoomId[] {
  const forward = [...(HOUSE_ROOMS[roomId]?.exits ?? [])]
  const backtrack = Object.values(HOUSE_ROOMS)
    .filter((room) =>
      room.exits.includes(roomId) && progress.visited.includes(room.id),
    )
    .map((room) => room.id)
  const exits = [...new Set([...forward, ...backtrack])]
  if (roomId === 'HD-10' && progress.decisions['HD-10'] === 'manifest')
    exits.push('HD-25')
  if (roomId === 'HD-25' && progress.decisions['HD-10'] === 'manifest')
    exits.push('HD-10')
  if (roomId === 'HD-26' && progress.decisions['HD-26'] === 'testify')
    exits.push('HD-34')
  if (roomId === 'HD-34' && progress.decisions['HD-26'] === 'testify')
    exits.push('HD-26')
  return [...new Set(exits)].filter((exit) =>
    !(exit === 'HD-33' && roomId === 'HD-32' && !progress.wardenPassed) &&
    !(exit === 'HD-36' && roomId === 'HD-35' && progress.ending === null),
  )
}

export function houseWitnessEvidence(
  progress: HouseProgress,
  briarDecisions: Readonly<Record<string, string>>,
): boolean {
  return Boolean(
    progress.decisions['HD-16'] === 'return-name' ||
      progress.decisions['HD-17'] === 'read' ||
      progress.decisions['HD-26'] === 'testify' ||
      briarDecisions['4,6'] === 'testify',
  )
}

export function newHouseProgress(): HouseProgress {
  return {
    current: HOUSE_ENTRY,
    visited: [HOUSE_ENTRY],
    decisions: {},
    ending: null,
    wardenPassed: false,
    combatOrigin: null,
    chimeClaimed: false,
  }
}

export function restoreHouseProgress(input: unknown): HouseProgress | null {
  if (!input || typeof input !== 'object') return null
  const v = input as Partial<HouseProgress>
  const initial = newHouseProgress()
  const visited = Array.isArray(v.visited)
    ? [...new Set(v.visited.filter((id): id is HouseRoomId =>
        typeof id === 'string' && Boolean(HOUSE_ROOMS[id]),
      ))]
    : []
  const current = typeof v.current === 'string' && HOUSE_ROOMS[v.current]
    ? v.current
    : HOUSE_ENTRY
  const decisions: Record<string, string> = {}
  if (v.decisions && typeof v.decisions === 'object')
    for (const [key, choice] of Object.entries(v.decisions))
      if (HOUSE_ROOMS[key]?.choices.some((item) => item.id === choice))
        decisions[key] = choice
  return {
    ...initial,
    current,
    visited: [...new Set([HOUSE_ENTRY, ...visited, current])],
    decisions,
    ending: v.ending === 'release' || v.ending === 'renew' || v.ending === 'break'
      ? v.ending : null,
    wardenPassed: v.wardenPassed === true,
    combatOrigin: v.combatOrigin === 'HD-09' || v.combatOrigin === 'HD-19' ||
      v.combatOrigin === 'HD-22' || v.combatOrigin === 'HD-28' || v.combatOrigin === 'HD-32'
      ? v.combatOrigin : null,
    chimeClaimed: v.chimeClaimed === true,
  }
}

export function validateHouseRooms(): string[] {
  const issues: string[] = []
  const keys = Object.keys(HOUSE_ROOMS)
  if (keys.length !== 36) issues.push('House must contain exactly 36 rooms')
  for (const [key, room] of Object.entries(HOUSE_ROOMS)) {
    if (room.id !== key || !/^HD-(0[1-9]|[12][0-9]|3[0-6])$/.test(key))
      issues.push(`Invalid room key ${key}`)
    if (!room.title || room.opening.length < 75 || room.artPrompt.length < 60)
      issues.push(`Missing authored atmosphere or original art at ${key}`)
    if (room.choices.length < 2 || new Set(room.choices.map((c) => c.id)).size !== room.choices.length)
      issues.push(`Choices are missing or duplicate at ${key}`)
    for (const choice of room.choices)
      if (!choice.label.trim() || !choice.outcome.trim())
        issues.push(`Missing player-facing outcome at ${key}`)
    for (const next of room.exits)
      if (!HOUSE_ROOMS[next]) issues.push(`Unreachable destination ${next} from ${key}`)
  }
  const found = new Set<string>([HOUSE_ENTRY])
  const q = [HOUSE_ENTRY]
  for (let i = 0; i < q.length; i++)
    for (const next of HOUSE_ROOMS[q[i]!]?.exits ?? [])
      if (!found.has(next)) { found.add(next); q.push(next) }
  for (const id of keys) if (!found.has(id)) issues.push(`Unreachable house room ${id}`)
  if (HOUSE_ROOMS['HD-35']?.choices.map((c) => c.id).join(',') !== 'release,renew,break')
    issues.push('House must provide release, renew and break consequences')
  return issues
}
