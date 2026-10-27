import type { BriarScene } from './scenes'

/**
 * Final 17 fixed-coordinate authored encounters.
 * Four cross-world seals are inspectable only after the fourth reveal wave;
 * their paired puzzle completion awaits the matching worlds.
 * Other original fixed-site interactions (chest, dungeon, gate) remain separate.
 */
export const BRIAR_MARCHES_FINAL_BATCH: Record<string, BriarScene> = {
  '1,1': {
    title: 'North Star Twin',
    opening:
      'At the northern stone a seven-point star has been engraved twice. One copy has a missing notch, removed with a blade so delicate it could be a forgery or a mercy. A carved instruction reads: THE SECOND SKY REMEMBERS THE FIRST. The landscape beyond Briar keeps its answers.',
    artPrompt:
      'A frost-rimmed standing stone on a hilltop above a dark pine forest at night. Two seven-pointed stars are carved side by side into its face, and the left star has one point chipped away. A small brass chisel lies in the frost at its base. Pale starlight, two matching star clusters in the sky above. Wide shot from a low angle. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'trace',
        label: 'Copy the missing notch into the Chronicle',
        outcome:
          "You preserve the notch's angle. It may match another kingdom's lake star, but a sketch cannot open this seal alone.",
      },
      {
        id: 'protect',
        label: 'Shield the carving from a collector',
        outcome:
          'You hide the stone beneath woven branches. The twin-star comparison remains possible when another region is discovered.',
      },
    ],
  },
  '8,1': {
    title: 'Whitewing Cipher',
    opening:
      "A single white feather floats above the old border mark. Each time the wind turns it, the feather's reflection loses a barb. A cartographer claimed a counterpart on the Salt Cliffs before vanishing without taking their boots.",
    artPrompt:
      'A single white gull feather hovers above a salt-crusted wooden boundary post on a windy cliff edge. Its reflection in a tide pool below is missing one barb. A pair of worn leather boots stands empty beside the post. Indigo twilight, a thin band of orange light on the sea horizon. Close-up from low beside the pool. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'copy',
        label: 'Draw the absent barb, not the feather',
        outcome:
          'You note the error that survives in every reflection. A later border may show which feather is true.',
      },
      {
        id: 'release',
        label: 'Let the feather travel on the wind',
        outcome:
          'The feather departs east. You keep its reversed shadow in memory and deny the Index another captive specimen.',
      },
    ],
  },
  '5,2': {
    title: 'Sleeping Sigil',
    opening:
      "The House's rootwork has grown around half a sleeping seal. It exhales in time with the footsteps above it. Someone deliberately removed the other half, not to break the symbol but to stop it from being misused.",
    artPrompt:
      'Close view enchanted warm root-buried seal half-circle, sleeping gilded runes with one absent matching half, Grimm manor steps, cinematic forest light',
    choices: [
      {
        id: 'remember',
        label: "Count the seal's slow breaths",
        outcome:
          'You record a three-beat pattern useful when another realm offers the missing half. The roots keep sleeping.',
      },
      {
        id: 'guard',
        label: 'Ask the House to protect its half',
        outcome:
          'The root lifts and settles like a consenting hand. The mark waits behind living wood; it is not yours to pocket.',
      },
    ],
  },
  '6,2': {
    title: 'The House That Remembers',
    opening:
      'The Rootbound Vault is a front door pretending to be an ancient dungeon. Names are carved on its lintel in several hands, including the hands of people the royal records say never existed. The house politely asks which name you brought. Somewhere inside, a bell clears its throat.',
    artPrompt:
      'A sprawling dark manor grown from twisting tree roots and old grey stone, with a crooked wooden porch and a heavy stone lintel over the front door covered in small carved notches. A brass bell glows gold behind the upper windows. Moonlit forest clearing, cold blue light and warm window glow. Wide establishing shot from the path. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'witness',
        label: 'Promise to witness the residents before taking the Chime',
        outcome:
          'The door unlatches with a sound like a pen being put down. It remembers that you asked to listen. The House remains open for exploration.',
      },
      {
        id: 'demand',
        label: 'Demand to know who owns the stored memories',
        outcome:
          'A plaque turns to face the wall. "The owner is the wrong question," says a voice inside. You can still enter, but the House will remember your suspicion.',
      },
    ],
  },
  '8,4': {
    title: 'Thorn Gate',
    opening:
      'The gate hums a note too low for human hearing. Its thorns cradle an unused bell-shaped hollow. A mask embedded in the bark offers to stamp your travel papers without ever reading them, provided you never ask what the seal means.',
    artPrompt:
      'Great thornbound regional gate, empty bell hollow, tiny mask in bark, golden chime light through leaves, dark mature illustrated fairy tale landscape',
    choices: [
      {
        id: 'law',
        label: 'Insist on an honest crossing',
        outcome:
          'You refuse papers that pretend to grant rights you do not understand. The Bramble Chime, or a later earned alternative, must open the real gate.',
      },
      {
        id: 'witness',
        label: "Record the mask's false offer",
        outcome:
          'Your testimony joins the Chronicle. The gate keeps its rules intact, but the Index cannot later claim no one was warned.',
      },
    ],
  },
  '2,5': {
    title: 'Photograph: Dismissal',
    opening:
      'A damp paper photograph lies trapped in a fern, entirely out of place. It shows your own face leaving the research office with a cardboard box of desk things. The timestamp is from a day you remember working. Morrow, wearing your body, has been fired. For one painful moment, the proof feels like vindication.',
    artPrompt:
      'A damp paper photograph lies in green ferns on a forest floor, beaded with dew. In the photograph, an androgynous adult in their thirties with short dark hair and a grey cardigan carries a cardboard box of desk things out of a glass office entrance in grey drizzle. Soft overcast forest light. Close-up from above, painted ferns around a realistic printed photograph.',
    choices: [
      {
        id: 'archive',
        label: 'Archive the image with its exact date',
        outcome:
          "The Chronicle keeps your stolen career's first visible damage. You cannot reclaim the photograph twice, and knowing this does not yet tell you what happened next.",
      },
      {
        id: 'grieve',
        label: 'Admit that you are frightened for your life at home',
        outcome:
          'You let yourself mourn instead of celebrating the failure. The date and damaged research badge remain in the Chronicle for later comparison.',
      },
    ],
  },
  '3,6': {
    title: 'Creekside Cache',
    opening:
      'The chest is sealed with a love letter someone never sent. Inside are two silver wildflowers, a map that stops exactly where the water changes direction, and the apology of a person who was never asked to apologize.',
    artPrompt:
      'An iron-bound wooden chest wedged between mossy stones at the edge of a clear creek. On its lid lie two silver wildflowers and a folded envelope sealed with pink wax. Shallow water ripples around the stones. Soft morning light through willows. Close-up from low beside the water. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'read',
        label: 'Read the apology before choosing whether to open the chest',
        outcome:
          'The letter says "I was there." You learn that the promised witness survived. The chest\'s once-only flowers are still yours to claim separately.',
      },
      {
        id: 'leave',
        label: 'Fold the apology back into its envelope',
        outcome:
          "You protect the letter from the river without taking its owner's words. The once-only chest reward remains a separate decision.",
      },
    ],
  },
  '4,6': {
    title: "The Packmate's Petition",
    opening:
      'A weary courier holds out a list of villages whose children were escorted safely through wolf country. The village calls those escorts a tribute raid. "Words are cheaper than blankets," the courier says, "but they\'ve been charging us both."',
    artPrompt:
      "A weary adult courier in a grey wool coat stands at a village crossroads holding out a long paper roll toward a group of wary villagers. Beside the courier sits a large grey wolf wearing a leather harness loaded with bundles of children's blankets. Twilight, cottage windows glowing. Wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.",
    choices: [
      {
        id: 'testify',
        label: "Carry the patrol's evidence to the Index",
        outcome:
          'You copy dates and the names of saved travelers. The official wolf-tribute story now has a witness it cannot easily erase.',
      },
      {
        id: 'shelter',
        label: 'Offer the courier a safe route instead',
        outcome:
          "The courier accepts shelter but asks that the village's lies still be challenged. You retain the map of a route the patrol has protected.",
      },
    ],
  },
  '7,6': {
    title: 'Riverbank Chest',
    opening:
      "An abandoned river chest rattles when approached. Inside it a lantern burns without oil beside a ferry sketch. The drawing shows three passengers boarding, but only two shadows leaving. The ferryman's name has been scratched out.",
    artPrompt:
      'Wet driftwood chest among river reeds, warm golden lantern and old sketched ferry map, black water reflecting two shadows, painterly Western fairy tale',
    choices: [
      {
        id: 'inspect',
        label: 'Study the ferry sketch before opening the chest',
        outcome:
          'The third passenger was carrying a bell. You memorize their silhouette; the lantern inside remains a once-only reward.',
      },
      {
        id: 'call',
        label: 'Call across the water for the ferryman',
        outcome:
          'Something answers with the scrape of a pole. No fare is taken today. The chest may still be opened once.',
      },
    ],
  },
  '8,6': {
    title: 'Photograph: The Gathering',
    opening:
      "A second impossible photograph is wedged beneath a smooth stone. Your face sits at a crowded apartment gathering, speaking much too loudly while an old friend stares at the floor, hurt. The image gives no explanation, and Morrow's body has never felt farther from home.",
    artPrompt:
      'A paper photograph lies on a smooth dark stone in a mossy forest. In the photograph, an androgynous adult in their thirties with short dark hair and a grey cardigan talks loudly with raised hands at a crowded apartment party under warm lamplight, while a friend in a green sweater stares down at the floor. Close-up from above, painted moss around a realistic printed photograph.',
    choices: [
      {
        id: 'record',
        label: 'Preserve the gathering photograph beside the dismissal',
        outcome:
          "The Chronicle places this evening after the office dismissal, even if you discovered the images in reverse. The hurt friend's story remains unknown.",
      },
      {
        id: 'promise',
        label: "Promise to hear your friend's side someday",
        outcome:
          'You resist treating one humiliating image as the whole truth. The Chronicle still records the date, faces and evidence without excusing harm.',
      },
    ],
  },
  '3,7': {
    title: 'Greenwood Challenge',
    opening:
      "A knight keeps watch over an abandoned community garden that has grown across the old property line. The knight's own deed names the villagers as co-owners, but a newer royal map calls them trespassers. They offer a duel as court procedure, then quietly admit they hope you find another answer.",
    artPrompt:
      'Weathered armoured knight kneeling over disputed community-garden deed, wildflowers and partly ruined greenhouse in Grimm forest, friendly but tense, gold edged painted fantasy',
    choices: [
      {
        id: 'deed',
        label: 'Read the original deed aloud to the knight',
        outcome:
          'The knight lowers their sword. The common garden is recognized as shared ground, although the royal map still needs correction.',
      },
      {
        id: 'trial',
        label: 'Request a formal hearing instead of a duel',
        outcome:
          "The knight issues a summons using the villagers' own names. An investigation takes longer than combat but does not cost anyone a wound.",
      },
    ],
  },
  '4,7': {
    title: 'Stolen Laughter',
    opening:
      'A town full of mourners laughs at funerals. It is not cruelty: a former keeper sold the cemetery every tear to pay for new graves, and a family who tries to weep receives a bill. The mourners ask whether joy is also a kind of theft.',
    artPrompt:
      'Mourners in black stand among candles and carved graves on a rainy hillside cemetery, smiling crookedly while holding back tears. A widow in a black veil laughs into a handkerchief beside a fresh grave. Thorny climbing roses wind along the iron fence. Grey rain light and warm candle flames. Medium-wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'ledger',
        label: "Find the cemetery's original bargain",
        outcome:
          'A child remembers the price was paid in full decades ago. You take a copy of the old contract; the cemetery cannot charge for the same grief forever.',
      },
      {
        id: 'listen',
        label: 'Sit with the mourners without demanding tears',
        outcome:
          'Some laugh. Some are silent. They say your company was the first visit not to come with a collection notice.',
      },
    ],
  },
  '5,7': {
    title: "The Dam's Door",
    opening:
      'The mill family has nailed shut a sluice that releases more than river water: the water carries memories belonging to the villages below. Opening the gate too far will flood homes; keeping it closed will leave another village thirsty.',
    artPrompt:
      'Old Grimm dam spillway with water carrying faint faces and illuminated memories, divided villagers on banks, rusty sluice wheel, dramatic storm sky, compelling cinematic art',
    choices: [
      {
        id: 'negotiate',
        label: 'Organize a measured shared release',
        outcome:
          'The millers agree to open the sluice in stages with riverbank volunteers watching the houses. The harvest will be smaller, but no one is secretly sacrificed for a quick fix.',
      },
      {
        id: 'inspect',
        label: 'Inspect the silt for a lost third channel',
        outcome:
          'You find a half-buried bypass marked on a pre-Index map. The village can pursue a slower repair rather than vote between flood and drought.',
      },
    ],
  },
  '8,7': {
    title: 'Briar Sentry',
    opening:
      'From the southern watchtower the forest looks like a stitched quilt of places that refuse to stay sewn. The sentry has been told to guard the gate, but their orders never mention the riverbank refugees who built the tower.',
    artPrompt:
      'Watchtower over thorn-lined fairytale river shore and forest canopy, lone sentry pointing toward safe path, warm dawn, sophisticated graphic-novel environment',
    choices: [
      {
        id: 'route',
        label: 'Map the safe return route for the refugees',
        outcome:
          'The sentry reveals a marked path back to camp, with shallow crossings and no tollbooths. Travel across already discovered ground remains free.',
      },
      {
        id: 'witness',
        label: "Ask the sentry to record the tower's builders",
        outcome:
          "The sentry adds the refugees' names to the roll instead of the royal captain's. Your map now carries an inconvenient little truth.",
      },
    ],
  },
  '3,8': {
    title: 'Fallow Field',
    opening:
      'The field has no crops, yet bootprints cross it in the orderly pattern of a wedding procession. The prints are fresh after rain and old before sunrise. A tin flower lies beneath the grass, still smelling of candlewax.',
    artPrompt:
      'Abandoned fallow forest field crossed by spectral wedding footprints and one small tin flower, morning mist, melancholy strange fairy-tale atmosphere, painterly',
    choices: [
      {
        id: 'follow',
        label: "Follow the procession's broken rhythm",
        outcome:
          'You find the footprint of a fourth witness, missing from the official wedding registry. The clue points to the tin wedding nearby.',
      },
      {
        id: 'plant',
        label: 'Leave the tin flower where the procession can see it',
        outcome:
          'A voice thanks you from an empty row of chairs. The forgotten wedding is no longer quite alone.',
      },
    ],
  },
  '6,8': {
    title: "Pilgrim's Grave",
    opening:
      'A gravestone names someone who passed through Briar yesterday, very much alive. The date of death is tomorrow. The pilgrim stands beside you and asks you not to tell their family until they have decided what to do with the warning.',
    artPrompt:
      'A cloaked pilgrim kneels beside a weathered gravestone at the edge of a dark bramble wood, one hand resting on top of the stone. Small white glowing flowers grow at its base. Dusk light with cold blue shadows. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'shield',
        label: "Respect the pilgrim's request for privacy",
        outcome:
          'You copy the symbol and not the name. The pilgrim goes to seek their family with a choice still theirs to make.',
      },
      {
        id: 'warn',
        label: 'Offer to escort the pilgrim to their family',
        outcome:
          'You neither bury a living person nor declare a prophecy certain. The pilgrim accepts the escort, grateful you asked first.',
      },
    ],
  },
  '8,8': {
    title: 'Moonroot Knot',
    opening:
      "The final sigil is a dark root tied into a knot only moonlight can explain. Its reflection has a reversed loop; the missing half is said to grow below Moonwell Vale. A note etched in bark insists the knot must never be untied for someone else's convenience.",
    artPrompt:
      'Magical moonlit black fern and knotted living root mirror sigil with crescent reflected backwards, moody indigo/pearl dark storybook closeup, inspectable knot',
    choices: [
      {
        id: 'sketch',
        label: 'Sketch the reversed loop, not the whole knot',
        outcome:
          'You preserve a fair clue for the second knot beyond this forest. You cannot solve that other region by claiming this half.',
      },
      {
        id: 'respect',
        label: 'Let the root keep its own name',
        outcome:
          'The moonlit knot loosens just enough to be seen, then folds itself closed. It offers evidence, not ownership.',
      },
    ],
  },
}
