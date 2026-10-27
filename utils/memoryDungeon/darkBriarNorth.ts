import type { DarkBriarScene } from './darkBriar'

/** Northern ridge: prophecy, rescue, weather, the ethics of knowing. */
export const DARK_BRIAR_NORTH: Record<string, DarkBriarScene> = {
  '1,1': {
    key: '1,1',
    title: 'The Star With Two Norths',
    opening:
      'An astronomer insists her telescope points home in both directions. The needle belongs to the child she adopted, who has been told she was rescued from a future that never happened.',
    artPrompt:
      'A dark stone observatory above a forest at night with two bright north stars in the sky. A middle-aged astronomer adjusts a brass telescope while a young adult woman beside her watches the two star clusters. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'investigate',
        label: 'Compare the two star charts',
        outcome:
          "One chart follows a road that exists only when the daughter chooses it; the astronomer admits that safety was her wish, not the girl's.",
      },
      {
        id: 'ask',
        label: 'Let the daughter choose a north',
        outcome:
          'She picks neither star and sets out at dawn with provisions, leaving her mother a promise to write when she arrives.',
      },
    ],
  },
  '2,1': {
    key: '2,1',
    title: 'The Weather That Belongs to Someone',
    opening:
      'Snow falls inside a greenhouse while the orchard outside bakes. A weather keeper has saved the harvest by transferring winter to the one family who could least afford fuel.',
    artPrompt:
      'A glass greenhouse full of falling snow stands in the middle of a hot summer orchard. An orchard keeper with frost-covered pruning shears stands at its door. Beside it a small cottage glows with firelight, its garden rows dry and cracked. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'share',
        label: 'Ask the farms to share the winter',
        outcome:
          'The farmers agree to divide the cold and the firewood. No single harvest is perfectly protected, but nobody will freeze alone.',
      },
      {
        id: 'trace',
        label: 'Find the original weather bargain',
        outcome:
          'You discover the keeper asked for perfect weather, and the Reimaginer translated perfection into a person who would bear every storm.',
      },
    ],
  },
  '3,1': {
    key: '3,1',
    title: 'The Surveyor of Roads Not Taken',
    opening:
      'A road surveyor has mapped three routes for every traveler: the journey they made, the journey they were promised, and the journey they still could make. His measuring chain has grown teeth.',
    artPrompt:
      'A fey surveyor with long ears unrolls three layered translucent maps at a fork in a fern-lined road. A measuring chain with tiny metal teeth coils around his wrist. Night-blue light. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'compare',
        label: 'Compare the route you chose in Briar',
        outcome:
          'He shows the path your earlier choice made possible for somebody else. The maps differ because you were never the sole traveler.',
      },
      {
        id: 'cut',
        label: "Free the chain from the surveyor's wrist",
        outcome:
          'The chain becomes ordinary iron and the map loses its predictions. The surveyor thanks you for restoring a useful kind of ignorance.',
      },
    ],
  },
  '4,1': {
    key: '4,1',
    title: 'A Watchtower Without a Watcher',
    opening:
      'The alarm bell has rung daily since the garrison left. The nearby town obeys every curfew because nobody remembers how to distinguish an alarm from an invitation.',
    artPrompt:
      'An empty stone watchtower stands above a silent woodland village, a great brass bell swinging in its open top. Villagers peer out from behind shuttered windows below. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'silence',
        label: 'Silence the bell for one evening',
        outcome:
          'People cautiously come outside. A real danger still approaches at dusk, forcing them to organize a watch of their own.',
      },
      {
        id: 'teach',
        label: "Find the old bellmaker's code",
        outcome:
          'You teach residents the difference between fire, flood and supper. They insist on adding a fourth signal for unreasonable rulers.',
      },
    ],
  },
  '5,1': {
    key: '5,1',
    title: 'The Seed Vault of Borrowed Springs',
    opening:
      'A forest conservator keeps seedlings from a hundred unrealized springs. Every time she plants one, somebody elsewhere remembers a childhood in a garden that no longer exists.',
    artPrompt:
      'A seed vault under thick thorn roots, with rows of glass bowls holding glowing seeds. A botanist woman in heavy leather gloves lifts one seedling, and faint pale spring blossoms drift in the air around her. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'catalogue',
        label: 'Track the seeds back to their owners',
        outcome:
          'You catalogue the borrowed memories before planting anything. The gardener argues that a living tree is evidence too.',
      },
      {
        id: 'share',
        label: 'Plant the seeds in a public nursery',
        outcome:
          'Children and elders are invited to tend the nursery together; no one inherits an entire stolen childhood as their own.',
      },
    ],
  },
  '6,1': {
    key: '6,1',
    title: "The Mason's Absent Bridge",
    opening:
      'A bridge-builder is blamed for a collapse that has not happened. People have been evacuated for years while an immaculate unused span gathers vines.',
    artPrompt:
      'A pristine stone bridge spans a dark ravine, overgrown with vines and clean of footprints. A tired stonemason holding a mortar bucket stands at its foot looking up at it. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'inspect',
        label: 'Inspect the untouched foundation',
        outcome:
          "The foundation is sound. The prediction was the Warden's attempt to avoid paying the mason for completed work.",
      },
      {
        id: 'cross',
        label: 'Help the mason lead the first crossing',
        outcome:
          "The bridge holds. Travelers cheer; the Warden's unpaid invoice does not disappear just because the crossing succeeded.",
      },
    ],
  },
  '7,1': {
    key: '7,1',
    title: 'The Guard Who Outlived the Threat',
    opening:
      'A sentinel watches the forest for a queen who vanished decades ago. A polished empty armor suit now issues his orders in her voice and accepts all his reports.',
    artPrompt:
      'On a rocky ridge, an old sentinel in a worn grey cloak stands beside an ancient signal fire, facing an empty suit of polished royal armor that stands upright with one gauntlet raised. A huge moon hangs behind them. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'listen',
        label: 'Ask what he remembers of the queen',
        outcome:
          'He can name her jokes but not a single command she ever gave. He begins to suspect the armor learned obedience without understanding it.',
      },
      {
        id: 'replace',
        label: 'Offer to stand watch while he rests',
        outcome:
          'At sunrise he returns as a volunteer instead of a servant. The armor continues giving orders to nobody.',
      },
    ],
  },
  '8,1': {
    key: '8,1',
    title: 'The Whitewing Cipher',
    opening:
      'Two identical white feathers fall from separate skies. One belonged to a messenger who told the truth; the other belonged to a message altered so no one would be hurt.',
    artPrompt:
      'Two identical white feathers fall above a flat cliff-top stone carved with a gull that is missing one feather. Rooks fly far off over the sea. Medium close-up. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'read',
        label: 'Read both messages aloud to the witnesses',
        outcome:
          'The town hears both an unpleasant warning and a hopeful lie. Their rescue plan finally accounts for danger and courage.',
      },
      {
        id: 'preserve',
        label: 'Keep the lie as evidence',
        outcome:
          'The forged message is sealed beside the true one, preserving proof of a kindness that still caused harm.',
      },
    ],
  },
  '1,2': {
    key: '1,2',
    title: 'The Orchard of False Winters',
    opening:
      'An elderly beekeeper remembers a blizzard she never survived. Her bees have been carrying that winter from house to house, making every family remember a different lost relative.',
    artPrompt:
      'An elderly beekeeper kneels beneath bare fruit trees beside grey wooden hives. Her bees glitter white in the air like falling snow. Medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'follow',
        label: 'Trace the bees to their keeper',
        outcome:
          'She discovers the hive was sent to comfort mourners. The borrowed grief is real, but belongs to somebody else.',
      },
      {
        id: 'wait',
        label: 'Sit with the beekeeper through the storm',
        outcome:
          'She tells you the stories behind the names instead of exchanging them. The snow melts slowly, but nothing is erased.',
      },
    ],
  },
  '2,2': {
    key: '2,2',
    title: 'The Infirmary That Counts Blessings',
    opening:
      'A healer has cured every illness in the valley and started charging patients for the number of healthy days they have left. A recovered soldier refuses to let anyone pay for his survival.',
    artPrompt:
      'A warm infirmary with rows of sunlit beds. A weary doctor in a white apron argues with a healthy broad-shouldered former soldier under a green glass lamp. Long tally-mark shadows stretch across the floor. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'audit',
        label: "Open the clinic's day ledger",
        outcome:
          "You find that the days were never the healer's to sell. Former patients organize a free ward and ask the doctor to help run it.",
      },
      {
        id: 'confront',
        label: 'Invite the soldier to challenge the fee',
        outcome:
          'His public refusal encourages others, but the healer panics that she may lose the magic sustaining the ward.',
      },
    ],
  },
  '3,2': {
    key: '3,2',
    title: 'The Rookery of Unsung Names',
    opening:
      'A young messenger has taught the rooks to deliver letters to the dead. The birds return with real replies written in handwritings no survivor recognizes.',
    artPrompt:
      'A tall dark tower rookery full of black rooks. A young messenger holds up sealed envelopes to the birds while other rooks fly in carrying envelopes in their beaks. Medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'verify',
        label: 'Find living witnesses to the replies',
        outcome:
          'Three answers are genuine memories the rooks overheard. The fourth is a promise none of you can authenticate.',
      },
      {
        id: 'honor',
        label: 'Deliver the unanswered letter anyway',
        outcome:
          'The recipient is alive under a changed name. Their relief is quiet, and they ask that the new address remain private.',
      },
    ],
  },
  '4,2': {
    key: '4,2',
    title: "Mosswick's Shop of Unpriced Things",
    opening:
      "Mosswick still sells lanterns, but he no longer accepts flowers. His shelves hold promises made by customers who forgot they had made them, and he refuses to display the owner's names.",
    artPrompt:
      'Mosswick, a stooped old man with a long grey braided beard and a patched moss-green coat, stands at a moss-covered stall where brass lanterns light rows of sealed glass jars, each holding a small curl of light. He rests one hand protectively over a jar. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'barter',
        label: 'Trade an honest question instead of coin',
        outcome:
          'Mosswick gives you a lantern and a warning: the House values questions that leave people free to refuse.',
      },
      {
        id: 'safeguard',
        label: "Help him hide the owners' names",
        outcome:
          'You build a ledger that lets customers reclaim their promises without letting the Warden search for them.',
      },
    ],
  },
}
