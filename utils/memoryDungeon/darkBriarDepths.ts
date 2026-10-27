import type { DarkBriarScene } from './darkBriar'

/** Deep south: wishes as social contracts, possible futures, ties to mermaid home. */
export const DARK_BRIAR_DEPTHS: Record<string, DarkBriarScene> = {
  '5,7': {
    key: '5,7',
    title: 'The Letter Delivered Too Early',
    opening:
      'A messenger brings news of a reconciliation that will not happen for three years unless the quarrelling siblings stop treating the letter as an order. The seal has no sender.',
    artPrompt:
      'Two grown siblings stand back to back in a forest meadow under a golden storm sky. An anxious messenger holds out a sealed envelope between them beside a wooden post box on the path. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'open',
        label: 'Ask the siblings to read the letter together',
        outcome:
          'They recognize the handwriting as their own, older and kinder. Neither is ready to forgive yet; both agree to keep talking.',
      },
      {
        id: 'return',
        label: 'Return the letter to its uncertain future',
        outcome:
          'The messenger folds it away. A possible happy ending remains possible precisely because nobody is compelled to perform it.',
      },
    ],
  },
  '6,7': {
    key: '6,7',
    title: 'The Gate That Charges in Regrets',
    opening:
      'An elderly gatekeeper takes a regret from every traveler as toll. The road is crowded with people who are brave only because they have forgotten the damage of their mistakes.',
    artPrompt:
      'An elderly gatekeeper at an ancient wooden gate holds a basket of small glowing glass orbs. Travellers stride through the gate with their chins up and empty hands. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'restore',
        label: 'Offer to give one regret back',
        outcome:
          'The traveler weeps, then returns to apologize to somebody they had been avoiding for years.',
      },
      {
        id: 'replace',
        label: 'Pay the keeper in work instead',
        outcome:
          'You repair the gate mechanism. The keeper discovers maintaining a road is harder than collecting feelings, and more useful.',
      },
    ],
  },
  '7,7': {
    key: '7,7',
    title: 'The Orchard Where Children Choose',
    opening:
      'A grove grants children the talents their parents wished for them. One young apprentice can sing beautifully but wants to build bridges, and her father is proud of the wrong miracle.',
    artPrompt:
      'A moonlit orchard of pale blue glowing blossoms with carpentry tools hanging from the branches. A determined teenage girl holds a hammer and a small wooden bridge model, her father beside her with a hand on her shoulder. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'support',
        label: 'Help her apprentice with the bridgewright',
        outcome:
          'The father watches her measure stone and discovers she is not rejecting him by wanting something different.',
      },
      {
        id: 'release',
        label: 'Ask the orchard to return the borrowed talent',
        outcome:
          "She keeps her singing voice by choice and gives up the command to use it for anybody else's dream.",
      },
    ],
  },
  '8,7': {
    key: '8,7',
    title: 'The Eastern Bell of Possible Fires',
    opening:
      "The watch bell rings for fires that could occur in alternate summers. Firefighters have extinguished hundreds of imaginary blazes and missed a neighbor's real smoke.",
    artPrompt:
      'A forest watchpost with a red fire wagon and leather buckets. Translucent orange flame shapes float among the branches overhead, while real grey smoke rises from a cottage chimney in the distance. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'triage',
        label: 'Look for the smoke that has a source',
        outcome:
          'The brigade saves the cottage. They write a new rule: care for actual people before competing with every imagined disaster.',
      },
      {
        id: 'keep',
        label: 'Keep the warning bell but change its use',
        outcome:
          'Residents create a schedule for checking homes and discussing hazards. Prophecy becomes preparation rather than panic.',
      },
    ],
  },
  '1,8': {
    key: '1,8',
    title: 'The Caves of Unchosen Heirs',
    opening:
      'In a tidal cave far from the sea sit three crowns belonging to monarchs who never ruled. Their descendants have claimed the authority of lives that were never lived.',
    artPrompt:
      'A dark cave with flooded stone shelves where three empty ceremonial crowns float above the water. Uncertain descendants in plain clothes hold up lanterns at the cave mouth. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'hear',
        label: 'Invite the descendants to tell their own stories',
        outcome:
          'One child abandons the crown. Another insists on using inherited prestige to rebuild a bridge. Nobody can inherit a choice.',
      },
      {
        id: 'seal',
        label: 'Leave the crowns behind a public record',
        outcome:
          'The families agree their claims may be studied but not used to rule people who never consented.',
      },
    ],
  },
  '2,8': {
    key: '2,8',
    title: 'The Inn Where Travelers Meet Their Doubles',
    opening:
      'An innkeeper has welcomed every possible version of a lost traveler. By morning each double leaves with the wrong coat and an argument about who belongs to the original world.',
    artPrompt:
      'A cozy inn common room full of adult travellers who look alike in pairs, each holding a cloak too large or too small for them. The innkeeper compares two identical pocket watches at the bar. Warm firelight. Wide interior shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'introduce',
        label: 'Have the doubles compare lived memories',
        outcome:
          'They agree none is an impostor merely for having taken another road. The innkeeper serves breakfast to all of them.',
      },
      {
        id: 'depart',
        label: 'Help them leave under separate names',
        outcome:
          'The doubles choose different destinations. Two exchange coats voluntarily, and the inn finally empties.',
      },
    ],
  },
  '3,8': {
    key: '3,8',
    title: 'The Lake That Reflects Tomorrow',
    opening:
      'The lake shows Char standing alone in a drowned palace. The reflection looks certain until a passing cloud changes the angle and reveals Scylla beside her, alive, at a different age.',
    artPrompt:
      "A mountain lake at the edge of a forest. Its still surface reflects a drowned underwater palace where Char, a stout woman with deep brown skin, a high black braid and black velvet and lace, stands beside Scylla, her twin with light brown skin and a greying chestnut braid. Faint blue-green scales line both twins' wrists. Wide shot from the shore. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.",
    choices: [
      {
        id: 'question',
        label: 'Ask whose memory the water is showing',
        outcome:
          'The lake offers possibilities, not testimony. You make a note to tell Scylla what you saw without claiming it must happen.',
      },
      {
        id: 'protect',
        label: 'Cover the reflection before it draws a crowd',
        outcome:
          'You prevent the prophecy becoming rumor. The person it concerns deserves to hear about it first.',
      },
    ],
  },
  '4,8': {
    key: '4,8',
    title: "The Cartographer's Last Blank",
    opening:
      'A mapmaker has left a single blank square on a completed atlas. Nobody can agree whether the square is empty or contains everybody who has not yet chosen where to live.',
    artPrompt:
      'A huge hand-painted atlas of a forest unfolded across a long table, with one square left as bare parchment. A mapmaker with ink-stained fingers leans over it while displaced travellers carrying bundles look on. Medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'leave',
        label: 'Keep the space blank for new arrivals',
        outcome:
          'The refugees plan a settlement without promising that every newcomer must stay. The mapmaker sets aside extra paper.',
      },
      {
        id: 'draw',
        label: 'Ask the displaced travelers to draw it',
        outcome:
          "Their overlapping sketches make a village unlike any kingdom's design. They decide the square can change as they do.",
      },
    ],
  },
  '5,8': {
    key: '5,8',
    title: 'The Glasshouse of Gentle Monsters',
    opening:
      'A warden has locked away creatures formerly called monsters to keep villagers safe. Several have learned to garden, but the gates open only when someone remembers an act of harm.',
    artPrompt:
      'A moonlit glass conservatory with heavy iron locks on its doors. Inside, gentle horned and furred creatures tend glowing night-blooming flowers in clay pots. A sorrowful warden in a long coat holds a large key outside. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'witness',
        label: 'Ask the villagers and gardeners to meet',
        outcome:
          'They agree on safeguards and supervised visits. Forgiveness is not mandatory; lifelong imprisonment is not the only form of safety.',
      },
      {
        id: 'inspect',
        label: 'Read the arrest histories aloud',
        outcome:
          'Two records describe real injury. The others describe fear. A new hearing begins with those differences acknowledged.',
      },
    ],
  },
  '6,8': {
    key: '6,8',
    title: 'The Lighthouse Beneath the River',
    opening:
      'An underwater lamp guides drowning memories toward dry land, but it has begun pulling living travelers into recollections they cannot survive. The lightkeeper begs for a way to separate need from longing.',
    artPrompt:
      'A lighthouse stands underwater on a riverbed, its lamp glowing up through black water. Pale figures rise from the river toward the beam, and living travellers on the bank are held back by ropes. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'screen',
        label: 'Build a separate landing for the living',
        outcome:
          'The lamp continues helping lost memories while boat crews keep breathing travelers safely on shore.',
      },
      {
        id: 'dim',
        label: 'Dim the beacon until everyone is accounted for',
        outcome:
          'The spirits protest. The keeper agrees that rescue must never require more victims.',
      },
    ],
  },
  '7,8': {
    key: '7,8',
    title: 'The Parliament of Stray Wishes',
    opening:
      'A council of small, discarded wishes has built a parliament inside a hollow tree. Each insists somebody meant well when making it, and none knows whose consent would make it law.',
    artPrompt:
      'Inside a vast hollow tree, tiny glowing creatures, each a bright orange spark with a small face, sit on a circle of root benches. Thick roots arch overhead in rows of rafters. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'hear',
        label: 'Let the wishes explain who would be changed',
        outcome:
          'A wish for universal kindness is revealed to erase dissent. The parliament votes to ask people instead of rewriting them.',
      },
      {
        id: 'refuse',
        label: 'Refuse to appoint yourself their monarch',
        outcome:
          'The wishes choose a temporary speaker and a rule allowing everyone affected to object. The tree brightens without growing a throne.',
      },
    ],
  },
  '8,8': {
    key: '8,8',
    title: 'The Moonroot Knot',
    opening:
      'The twin knot at the eastern edge is the last place where Briar still resembles itself. Pull one root and the future orchard thrives; pull the other and the drowned crown can be found. Both roots feed the same tree.',
    artPrompt:
      'Two thick roots twisted into one knot on a moonlit cliff. One root rises into a flowering orchard, and the other descends into a shimmering underwater palace with coral spires below the cliff. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'preserve',
        label: 'Protect both roots until their owners arrive',
        outcome:
          'The knot settles. You carry a witness account toward Scylla and Char, not a decision made on their behalf.',
      },
      {
        id: 'trace',
        label: 'Trace the roots to where they meet',
        outcome:
          "They join around a small human footprint: the Reimaginer followed a homesick person's request and mistook connection for ownership.",
      },
    ],
  },
}
