import type { BriarScene } from './scenes'

export const BRIAR_MARCHES_SECOND_BATCH: Record<string, BriarScene> = {
  '1,4': {
    title: 'The Courier in Red',
    opening:
      "A courier in a red hood grips a sealed letter so tightly the wax has cracked. The grandmother waiting at the cottage has sent the courier on this route fourteen times, but the same wolf quietly escorts her through the thorns on each trip. Tonight the wolf refuses to approach the door. 'She doesn't want me eaten,' the courier says. 'She wants me to sign for something.'",
    artPrompt:
      'An adult courier in a red hooded cloak stands at the crooked door of a small thatched cottage, gripping an envelope with a cracked red wax seal. A grey wolf watches from the thorn bushes behind, ears forward, several steps back from the path. Twilight blue sky, warm lamplight in the cottage window. Medium-wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '2,2',
        choice: 'observe',
        line: 'Your sketch of the outward-facing claw marks convinces the courier to stop calling the wolf a raider.',
      },
    ],
    choices: [
      {
        id: 'inspect',
        label: 'Ask to see the contract before the courier knocks',
        outcome:
          'The wax lists delivery of a name, not a parcel. You copy the language and ask the courier to wait while you find the living person it might erase.',
      },
      {
        id: 'knock',
        label:
          'Stand beside the courier and demand the grandmother explain the price',
        outcome:
          'Grandmother speaks from behind a barred door: she was promised safety for every child in the village. You make her say aloud who was left outside the promise.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '1,3': {
    title: 'The Bent Spoon',
    opening:
      'An exhausted field cook is boiling rainwater in a dented pot. They possess a spoon that tastes of whatever meal its holder most desperately misses. Nobody can live on its enchantment, though people have paid all their wages to remember a birthday dinner. The cook has forgotten whether they ever tasted the food they sell.',
    artPrompt:
      "A weary middle-aged field cook with rolled sleeves and broad calloused hands sits by a roadside campfire, holding up a bent silver spoon that gives off a soft golden glow. A dented iron pot of rainwater boils over the flames. Dark woodland behind, warm firelight on the cook's face from below. Medium close-up. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.",
    callbacks: [
      {
        at: '1,4',
        choice: 'inspect',
        line: "The cook remembers preparing meals for the courier's grandmother, years before the agreement was written.",
      },
    ],
    choices: [
      {
        id: 'return',
        label:
          'Give the spoon back to the cook with an offer to share real food',
        outcome:
          'The cook breaks the spell long enough to remember the taste of bread baked yesterday. In gratitude, they pack a small lantern and promise to open their kitchen to travelers.',
        gain: { lanterns: 1 },
      },
      {
        id: 'keep',
        label:
          'Accept one remembered taste, then leave the spoon with its owner',
        outcome:
          'You taste something from Earth, startlingly mundane. The cook watches your face and understands that longing is not the same thing as hunger.',
      },
    ],
  },
  '1,2': {
    title: 'Forty-Five Bells',
    opening:
      'Every bird in the misty firs wears a tiny bell. The bells never ring together; their staggered toll counts something happening beyond sight. A gravekeeper claims forty-five rings warn of a hunting party, but a child insists the count is a roll call of people the forest is trying not to forget.',
    artPrompt:
      'Dark painterly fairytale fir forest many birds with little brass bells flying in patterned lines, cloaked gravekeeper and attentive child listening, mist-covered tower in distance, visual puzzle art',
    callbacks: [
      {
        at: '7,1',
        choice: 'appeal',
        line: 'You recognize the cadence of a name being erased, just as you heard beneath the wrongful gallows.',
      },
    ],
    choices: [
      {
        id: 'count',
        label:
          'Count the last sequence instead of following the armed watchers',
        outcome:
          'There are forty-four chimes and one silent wing. The child points toward a missing-name ledger, and the gravekeeper agrees the warning may be about a person.',
      },
      {
        id: 'warn',
        label: 'Ring the spare bell so the distant patrol can hear it',
        outcome:
          'A patrol changes course toward you, away from the cottage. The gravekeeper is displeased, but the courier gains a safer passage tonight.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '2,3': {
    title: 'The Storm Bride',
    opening:
      'A wedding procession circles the abandoned mill even though the groom vanished three storms ago. The bride refuses to be called a widow because no one has found a body. The village priest insists the vows belong to the weather itself now, and the rain keeps arriving in a shape like a familiar face.',
    artPrompt:
      'Western animated mature fairy-tale bride in storm-worn travel dress leading eerie candlelit procession around abandoned mill, stormcloud rain silhouette of missing partner, lush dramatic scene',
    callbacks: [
      {
        at: '5,1',
        choice: 'shelter',
        line: 'The bride has heard of the newlyweds in Honeymoon Gutter, and asks why their story allows escape while hers demands repetition.',
      },
    ],
    choices: [
      {
        id: 'investigate',
        label:
          "Follow the rain-marked bootprints toward the mill's lower gears",
        outcome:
          'The bootprints stop at a dry door. Inside you hear someone working the machinery, not a ghost weeping. The bride asks for evidence before hope.',
      },
      {
        id: 'pause',
        label:
          'Convince the procession to rest until someone can verify the story',
        outcome:
          'The bride agrees to one night without marching. Several exhausted mourners sleep for the first time in weeks, while the storm waits patiently outside.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '3,3': {
    title: 'The Memory Mill',
    opening:
      "The mill turns against the river, grinding scraps of written testimony into pale flour. A miller says the flour makes bread that tastes like someone's childhood, but each loaf erases one line from the town's public records. The wheel has begun repeating the same three missing words with every turn.",
    artPrompt:
      'A tall wooden water mill on a dark river at night, its great wheel turning against the current. Pale flour drifts above the millstones and glows faintly white. An overworked miller in a flour-dusted apron stands in the doorway holding a round loaf. Three large carved marks on the wheel rim glow brighter than the rest. Moonlight from above. Wide shot from the riverbank. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '2,3',
        choice: 'investigate',
        line: "The dry door from the bride's procession opens beside the lower wheel; someone may have been working here in secret.",
      },
    ],
    choices: [
      {
        id: 'restore',
        label:
          "Reassemble the three missing words from the miller's surviving notes",
        outcome:
          'You restore the name of a vanished worker to the ledger. The mill slows, and the miller must admit the village ate more than bread this winter.',
      },
      {
        id: 'halt',
        label: 'Shut the sluice gate before another memory is ground away',
        outcome:
          "The mill stops and the village loses a night's food. You save the remaining written names, though the next person at the door will be hungry.",
        gain: { lanterns: 1 },
      },
    ],
  },
  '5,1': {
    title: 'Honeymoon Gutter',
    opening:
      "Two newlyweds hide beneath a bridge wearing each other's wedding clothes, determined to confuse the law. A registrar has declared that one of them must transform into a beast before their marriage can be recognized. Neither knows which, and they intend to stay stubbornly human through the ceremony.",
    artPrompt:
      'Fairy tale stone bridge dusk, two laughing sturdy adult newlyweds hiding in mismatched formal outfits and exchanging wedding garments, stern royal registrar with long parchment approaching, whimsical dark graphic novel style',
    callbacks: [
      {
        at: '2,3',
        choice: 'pause',
        line: 'The procession finally rested last night. The couple asks whether there is a way to marry without having to repeat the same story forever.',
      },
    ],
    choices: [
      {
        id: 'shelter',
        label: 'Lead them through the dry culvert before the registrar arrives',
        outcome:
          'The couple escapes the transformation ceremony, but the registrar adds your description to the wanted notices. They leave you a silver flower knotted into a ribbon.',
        gain: { wildflowers: 1 },
      },
      {
        id: 'challenge',
        label: 'Ask the registrar to show the clause that requires a beast',
        outcome:
          "The law names 'one party of another kind,' but never defines the word. Both newlyweds claim they already disagree enough to qualify. The registrar storms off to appeal.",
      },
    ],
  },
  '8,2': {
    title: 'The Great Hunger',
    opening:
      "A gaunt traveler waits at the crossroads and asks only one question: 'Have you eaten?' Behind them hovers a famine spirit drawn to false answers, not empty stomachs. The traveler admits stealing a crust last week. The spirit will follow until someone decides whether survival counts as theft.",
    artPrompt:
      'Dark animated Gothic fairytale crossroads cold hungry wanderer with simple pack, abstract famine spirit made of empty dinner plates, distant winter fields, humane unsettling adult adventure art',
    callbacks: [
      {
        at: '3,3',
        choice: 'halt',
        line: 'The hungry traveler knows what happens when a mill stops to protect its records; tonight you will need to decide who shares the loss.',
      },
    ],
    choices: [
      {
        id: 'confess',
        label: 'Tell the spirit what food you have taken and why',
        outcome:
          'The spirit loosens its grip when it hears a truthful account of need. The traveler sits with you to write down the rules that made hunger a crime.',
      },
      {
        id: 'share',
        label: 'Feed the traveler first, then make the spirit negotiate',
        outcome:
          'The traveler eats in silence. The spirit protests that no bargain was offered; you insist the meal was not for sale. It leaves behind a lantern no longer needed for its haunting.',
        gain: { lanterns: 1 },
      },
    ],
  },
  '6,5': {
    title: 'The Thornsong Locks',
    opening:
      'An iron harp grows out of the fence, strung with thorns that ring out notes instead of drawing blood. The keeper offers two keys, one opening a shortcut and the other closing a path used by wolves. The instrument remembers the count of bells and the rhythm of the protective patrol.',
    artPrompt:
      'An iron harp grows out of a wooden fence at the edge of a forest path, its strings made of long thorny vines that glow faint gold. Two iron keys hang from a hook on the fence, one long and straight, one short with a round bow. A shadowed shortcut path leads away behind it. Grey-blue dusk light. Medium close-up. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '2,2',
        choice: 'observe',
        line: "The wolves' return tracks explain why the right-hand gate should never be locked during a patrol.",
      },
    ],
    choices: [
      {
        id: 'study',
        label: 'Replay the bell rhythm and choose the key for the public road',
        outcome:
          'The harp answers the pattern you learned in the northern woods. A gate opens toward safe ground, and the keeper records that you did not bar the wolves.',
      },
      {
        id: 'protect',
        label: 'Ask the keeper who would be endangered by either lock',
        outcome:
          'The keeper admits the wolves use the narrower path to defend a nearby house. You leave both keys hanging until those residents can consent.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '6,6': {
    title: 'The Debtwell',
    opening:
      "A well returns everything dropped into it exactly seven days later. A desperate traveler has been feeding it coins every morning, borrowing next week's money to settle yesterday's debts. At the bottom, a voice keeps receipts for promises nobody meant to make.",
    artPrompt:
      'A round stone well beneath an oak at dawn. A desperate traveller in a threadbare coat kneels at its rim counting copper coins into his palm. Seven small paper slips are weighted with pebbles along the rim, and coins glint deep in the water. Pale dawn light, a lantern on the rim. Medium shot from beside the well. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '5,1',
        choice: 'challenge',
        line: "The couple's legal loophole reminds you to read the well's fine print rather than the inscription above the rope.",
      },
    ],
    choices: [
      {
        id: 'audit',
        label:
          'Lay out the seven dated receipts and identify which coins are not yet owed',
        outcome:
          'The well reluctantly returns a coin that belongs to no lender. The traveler uses it to buy a meal instead of borrowing another impossible tomorrow.',
        gain: { wildflowers: 1 },
      },
      {
        id: 'refuse',
        label:
          "Refuse the well's loan and explain the hidden interest to the traveler",
        outcome:
          'The voice calls you ungrateful. The traveler stops dropping coins and discovers the silence is worth more than the borrowed money.',
      },
    ],
  },
  '7,7': {
    title: "The Tailor's Measure",
    opening:
      "The royal tailor's measuring tape wraps itself around every visitor's promises instead of their waist. A courier is accused of wearing a borrowed identity; the tape measures them as two people. The tailor swears the instrument has never made an error, but its scale keeps moving when someone tells the truth.",
    artPrompt:
      "Inside a cramped tailor's shop hung with coats on lines, a sturdy grey-haired tailor with pins between her lips watches a cloth measuring tape float in two loops around a slim androgynous courier. Bolts of wool and velvet fill the shelves. Warm window light from the left. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.",
    callbacks: [
      {
        at: '1,4',
        choice: 'inspect',
        line: "The courier's grandmother signed the same formula used by the mysterious measuring tape; it is older than this tailor's shop.",
      },
    ],
    choices: [
      {
        id: 'verify',
        label:
          'Ask the tailor to measure the same promise before and after it is spoken',
        outcome:
          'The tape grows shorter once the promise is understood by both parties. The tailor agrees that consent changes the shape of a contract.',
      },
      {
        id: 'repair',
        label: 'Help the courier mend a coat without demanding their true name',
        outcome:
          'The patched coat fits anyone who needs it and belongs to no one forever. The tailor gives you a silver thread for being less curious than the court.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '7,8': {
    title: 'Echo of the Barn',
    opening:
      'An abandoned barn remembers a childhood the village insists never occurred. Inside, chalk marks on the beams describe secret games played by a group whose names have vanished from school records. The roof creaks with laughter whenever someone says the children were imaginary.',
    artPrompt:
      'Inside an abandoned wooden barn, moonbeams fall through gaps in the rafters onto old chalk hopscotch squares on the floor and small chalk handprints on the beams. Dust floats in the light above empty hay bales. Cold blue moonlight. Wide interior shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '7,7',
        choice: 'verify',
        line: "The tailor's discovery makes the vanishing childhood look less like magic and more like an agreement that can be unmade.",
      },
    ],
    choices: [
      {
        id: 'open',
        label:
          'Open the doors and invite surviving neighbors to see the chalkmarks',
        outcome:
          'An elderly villager recognizes the rules of a game they invented. The laughter becomes a chorus of remembered names, frightening the clerk who said no children existed.',
      },
      {
        id: 'protect',
        label:
          'Photograph the markings, then leave the barn undisturbed until the witnesses agree',
        outcome:
          "The evidence is safe without turning another person's grief into a spectacle. A villager promises to bring you the missing attendance list.",
        gain: { lanterns: 1 },
      },
    ],
  },
  '1,8': {
    title: 'The Last Apple',
    opening:
      "Only one apple hangs from the orchard's final living branch. The fruit remembers the hands that once worked here: a baker's hands, a thief's, a queen's, and a child's whose name has been scratched from the harvest ledger. The tree asks what being the last should mean.",
    artPrompt:
      'Atmospheric Grimm fairy tale last glowing apple on ancient gnarled tree above empty orchard, indistinct remembered hands in leaves, warm and eerie painterly fantasy landscape',
    callbacks: [
      {
        at: '1,7',
        choice: 'shelter',
        line: 'The walking oak has found a place to rest near this last apple. Its shade shelters the new sapling.',
      },
    ],
    choices: [
      {
        id: 'plant',
        label: "Plant the apple's seeds so the orchard can feed people again",
        outcome:
          'The flesh vanishes into fertile soil. A sapling pushes through the frost, promising a harvest you may never see; a new path may grow beside it.',
      },
      {
        id: 'share',
        label:
          'Divide the apple with the village workers whose history it carries',
        outcome:
          'Nobody receives enough to be full, but each remembers one forgotten name. They insist on writing them down this time.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '2,8': {
    title: "The Witch's Calendar",
    opening:
      'A village tribunal has charged a witch with causing the winter she predicted in a public almanac. The witch has brought twenty years of weather records, but the magistrate insists proof of foresight is the same as proof of guilt. Snow has started falling through the courtroom roof.',
    artPrompt:
      'Dark whimsical fairytale open-air court under falling snow, unflinching older witch displaying detailed weather calendar before pompous magistrate, villagers in winter coats, original cinematic adventure art',
    callbacks: [
      {
        at: '1,8',
        choice: 'plant',
        line: "The witch says the orchard's new sapling may survive winter if the village stops confiscating seeds.",
      },
    ],
    choices: [
      {
        id: 'evidence',
        label: "Compare the records with the season's actual storms",
        outcome:
          'You show the villagers that the witch warned them early enough to prepare. The magistrate dismisses the case only after demanding credit for the forecast.',
      },
      {
        id: 'bargain',
        label:
          'Ask the witch what promise would make the village safer next winter',
        outcome:
          'She requests a communal granary and one seat for a child at every planning meeting. The village may consider the terms inconvenient, but not magical.',
        gain: { lanterns: 1 },
      },
    ],
  },
  '4,8': {
    title: 'The Tin Wedding',
    opening:
      'A metal blossom grows from a cracked roadside shrine. A wedding party passed this way years ago, swearing to remember one another even if the kingdom edited their names. One vow remains trapped in the flower, and the shrine asks whether it should belong to the lovers or to whoever finds it.',
    artPrompt:
      'A cracked stone roadside shrine with a small rusted tin flower growing out of it, thin pale ribbons tied to its stem. Old wedding petals and a dropped white glove lie along a foggy woodland path. Soft grey morning light. Medium close-up. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '2,3',
        choice: 'investigate',
        line: "The bride's mill passage bears the same tin-thread motif as the shrine, linking two disappearances.",
      },
    ],
    choices: [
      {
        id: 'return',
        label:
          'Carry the metal flower toward the family named in the faded vow',
        outcome:
          'The shrine releases its claim and the blossom warms in your hands. Someone who knew the couple may finally learn where their procession went.',
      },
      {
        id: 'keep',
        label: 'Record the vow before taking the flower as evidence',
        outcome:
          'You keep a copy of the promise without pretending it belongs to you. An old inscription becomes legible: a vow can shelter people only when it remains freely chosen.',
        gain: { wildflowers: 1 },
      },
    ],
  },
  '5,8': {
    title: 'The Shrewd Attorney',
    opening:
      'A clever attorney has bought the rights to every loaf of bread baked with remembered words. They offer to defend the hungry in court, provided the clients surrender their future thanks. A stack of contracts stands as tall as the attorney, and the ink keeps forming new clauses.',
    artPrompt:
      'Dark animated fairytale courtroom under crooked tree charismatic sharp-eyed short attorney in patched judicial robes with towering contracts and loaf of bread as exhibit, absurd and threatening graphic-novel scene',
    callbacks: [
      {
        at: '3,3',
        choice: 'halt',
        line: "The mill's stopped gears have left the attorney without fresh flour claims. They are furious that the town learned to keep records.",
      },
    ],
    choices: [
      {
        id: 'challenge',
        label:
          "Read the clauses aloud and demand the clients' consent before payment",
        outcome:
          "The contracts shrink whenever a client asks a question. The attorney complains that informed agreement is a terrible business model and releases the day's claims.",
      },
      {
        id: 'negotiate',
        label:
          'Ask for a public ledger with every hidden charge written in plain speech',
        outcome:
          'The attorney cannot refuse without admitting a trick. The clients gain copies of their debts; you earn a lantern for staying to make the first entries.',
        gain: { lanterns: 1 },
      },
    ],
  },
  '8,3': {
    title: 'The Gilded Throne',
    opening:
      'A miniature throne has appeared on a stump. Anyone who sits on it becomes monarch of the surrounding three footsteps, and every nearby neighbor receives a bill for the privilege. The village children hold an election to decide whether a kingdom this small should exist at all.',
    artPrompt:
      'Whimsical mature Grimm fantasy tiny gilded throne on mossy stump surrounded by outraged villagers and children with paper ballots, theatrical dark storybook videogame scene',
    callbacks: [
      {
        at: '7,1',
        choice: 'appeal',
        line: 'The children remember what happened at the gallows when no witness was allowed to speak, and insist this election have observers.',
      },
    ],
    choices: [
      {
        id: 'vote',
        label: 'Let the children decide whether the miniature kingdom survives',
        outcome:
          'The vote is close, but the throne loses its power when the voters reject its debts. A child appoints you honorary keeper of its empty cushion.',
      },
      {
        id: 'dismantle',
        label:
          'Dismantle the throne and return the gold to those who were charged',
        outcome:
          'No royal proclamation survives the argument. The neighbors receive their coins back, and one old bell rings without demanding a tax.',
        gain: { wildflowers: 1 },
      },
    ],
  },
}
