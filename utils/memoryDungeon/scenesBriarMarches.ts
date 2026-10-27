import type { BriarScene } from './scenes'

export const BRIAR_MARCHES_FIRST_BATCH: Record<string, BriarScene> = {
  '1,5': {
    title: "A Sleepwalker's Warning",
    opening:
      'An elder walks the lane asleep with a lit candle balanced on one palm. Behind them a shadow wearing their childhood face repeats every footstep half a beat late. Their bare feet are taking them toward the flooded ditch, though the shadow is carefully avoiding it.',
    artPrompt:
      'An elderly man in a nightshirt walks barefoot along a wet forest lane at night with his eyes closed, a lit candle balanced on one open palm. A shadow shaped like a small child follows half a step behind him. Just ahead, a flooded ditch glints in the moonlight. Cold blue moonlight and a small warm candle flame. Wide shot from the side. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'guide',
        label: 'Guide the sleeper home without waking their shadow',
        outcome:
          'You carry the candle and shepherd the elder along the dry stones. By dawn the shadow has lost its way, and the elder remembers the path to a hidden crossing.',
      },
      {
        id: 'wake',
        label: 'Wake them and hear what the dream was warning about',
        outcome:
          'The elder wakes furious, then frightened. The dream spoke of a keeper who files away every unspoken apology. You save them from the ditch, but leave the shadow with a reason to remember you.',
      },
    ],
  },
  '1,6': {
    title: 'Hair-Ladder Loft',
    opening:
      'From a cramped watchtower window hangs a magnificent rope of braided hair. Its owner, a stubborn old tower keeper, shouts that the ladder was meant for rescuers, not thieves, while a pair of traveling merchants argue over who gets to sell it.',
    artPrompt:
      'Tall illustrated watchtower among fairy-tale trees, practical silver-haired tower keeper at window, long braided hair-ladder hanging beside arguing merchants, original folk-horror fantasy visual novel artwork',
    choices: [
      {
        id: 'rescue',
        label: 'Help the keeper climb down before the merchants cut the braid',
        outcome:
          'The keeper descends safely, gathers the braid as a keepsake, and teaches you a knot that will hold in wet weather. They owe you a true account of the tower.',
      },
      {
        id: 'inspect',
        label: 'Ask who paid for the ladder and who owns the way down',
        outcome:
          'The merchants produce three incompatible receipts. You expose their forgery and leave the keeper with the ladder intact. The law of the road has acquired an inconvenient precedent.',
      },
    ],
  },
  '1,7': {
    title: 'The Floating Oak',
    opening:
      'An ancient oak has lifted its roots clear of the earth and is trying to cross the road on tiptoe. The woodcutters pursuing it insist this is a theft: its timber was already sold. The oak insists it was never asked.',
    artPrompt:
      'An enormous ancient oak walks across a dirt forest road on the tips of its lifted roots. Three small woodcutters with axes and rolled papers run after it. Twilight forest, blue-violet sky and a low warm sun between the trunks. Wide shot from road level. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'shelter',
        label: 'Hide the oak in the abandoned orchard',
        outcome:
          "You distract the woodcutters while the tree folds itself among the orchard's shadows. It promises shade to anyone fleeing an unjust bargain, including you.",
      },
      {
        id: 'mediate',
        label: 'Negotiate compensation without treating a tree as property',
        outcome:
          'The woodcutters keep their advance but lose the claim to the living oak. They leave muttering about employment, and the tree asks you to remember the difference between timber and a person.',
      },
    ],
  },
  '2,7': {
    title: 'Three Quiet Stones',
    opening:
      "The three carved stones wait where the moss inscription promised: two leaves and a sun, arranged in an order no weather can erase. A gardener keeps watch but will not touch them. 'The puzzle is yours,' they say, 'and so are the consequences of rushing.'",
    artPrompt:
      'Three standing stones in a wet forest glade, carved with a leaf, a second leaf and a sun with rays. Ruined moss-covered walls stand behind them. An old gardener in a straw hat watches from the edge of the glade, hands folded on a spade. Misty morning light. Wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'rehearse',
        label: 'Repeat the order aloud before touching the stones',
        outcome:
          'The gardener nods as you speak leaf, leaf, sun. The stones remain ready for your own attempt, and a second path through the grove briefly becomes visible.',
      },
      {
        id: 'question',
        label: 'Ask whom the light is meant to protect',
        outcome:
          "'The people who travel after you,' the gardener replies. You now understand the purpose of the seal, but the actual stone sequence still needs solving.",
      },
    ],
  },
  '2,2': {
    title: 'Old Wolf Track',
    opening:
      'Fresh wolf prints lead from the village toward the House, then return bearing the deep marks of heavy burdens. The claw scars on nearby trees face outward, toward something approaching the homes, not inward toward prey.',
    artPrompt:
      'A muddy woodland trail runs from a small village toward a distant manor grown from roots. Fresh wolf paw prints follow the trail beside deep drag marks from heavy loads. Long claw scratches score the birch trunks on the side facing the village. Grey overcast morning light. Low-angle wide shot along the trail. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'observe',
        label: 'Follow the prints and document which way the claws point',
        outcome:
          'You sketch the path and discover that the supposed raiders have been walking guard duty. The evidence could overturn a village accusation if you carry it carefully.',
      },
      {
        id: 'report',
        label: 'Tell the villagers that the tracks do not match their story',
        outcome:
          'Several doors close before you finish. One frightened child listens from a window. Someone now knows there is a witness who questions the official version.',
      },
    ],
  },
  '2,1': {
    title: "Widow's Silhouette",
    opening:
      'In a narrow clearing a widow has hired the shape of a lost spouse to guard the last cottage they shared. The silhouette performs its duties beautifully and forgets every day that it cannot enter the front door. Tonight it has noticed.',
    artPrompt:
      'Small lonely cottage and tall silhouetted figure at the locked doorway, elderly widow under lantern holding a folded coat, atmospheric original dark illustrated fairy-tale encounter',
    choices: [
      {
        id: 'invite',
        label: 'Ask the widow to give the silhouette a chair by the fire',
        outcome:
          "For the first time the guardian hears the invitation it wanted. It takes no food and leaves no footprints, but the widow's house becomes a place that welcomes guests.",
      },
      {
        id: 'truth',
        label:
          'Explain gently that a memory cannot carry all the duties of a person',
        outcome:
          'The widow asks you to say it again, slower. She releases the shape from its watch; it bows to her once and walks into the night without needing another order.',
      },
    ],
  },
  '3,1': {
    title: 'Sleepless Orchard',
    opening:
      'An orchard keeps its fruit awake by ringing a brass bell at dusk. The apples have begun answering with an entirely different rhythm, and the keeper fears the trees are trying to vote themselves free of the harvest.',
    artPrompt:
      'A moonlit apple orchard with small brass bells hanging among the red apples on every branch. A weary grey-haired orchard keeper in a thick brown travelling coat stands between the rows with one hand cupped to her ear, a large brass hand bell at her feet. Cold blue moonlight, a warm lantern on a post. Medium-wide shot at eye level. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'listen',
        label: 'Count the answering bells before picking anything',
        outcome:
          'You learn that the third chime means a tree has refused the harvest. The keeper marks the orchard map so no fruit is stolen under your watch.',
      },
      {
        id: 'harvest',
        label: 'Help gather only the fruit the trees willingly release',
        outcome:
          "Three apples fall at once and none protest. The keeper gives you one silver wildflower for a night's work, while the unpicked branches keep their own plans.",
      },
    ],
  },
  '4,1': {
    title: 'Rain Mirror',
    opening:
      'Rain has filled an old cart rut with a mirror-bright pool. Its reflection shows you with a lantern that you do not own, heading toward a doorway that has not been built. A second reflection stands behind you in your borrowed fey body.',
    artPrompt:
      'Low cinematic fantasy closeup of a puddle reflecting an impossible future lantern and doorway behind an androgynous changeling traveler, rain-soaked forest track, mysterious illustrated visual novel style',
    choices: [
      {
        id: 'study',
        label: 'Study the doorway instead of taking the promised lantern',
        outcome:
          "You memorize the lintel's shape. The pool empties before you can ask whose future it showed, leaving a direction you can recognize later.",
      },
      {
        id: 'offer',
        label: 'Leave a silver flower for the unseen traveler in the water',
        outcome:
          'The reflection accepts the flower without touching the surface. When you look again, the traveler has turned their back on the door, as though someone has been warned.',
      },
    ],
  },
  '6,1': {
    title: 'Rootbound Threshold',
    opening:
      "A root archway leads to the service entrance of the House That Remembers. Along its stones someone has etched emergency directions in a very precise hand. Every one of them ends with 'ask the headsman.'",
    artPrompt:
      'A low archway of thick living tree roots forms a side door into a huge dark manor of roots and grey stone. Neat chiselled arrows and tally marks run along the stones of the arch. Beyond it stands Oren Pike, a very tall broad man whose whole head is covered by a rough brown cloth executioner hood with two eyeholes, a heavy ceremonial axe and a leather apron of pouches. Grey dusk light, one lantern hanging by the door. Wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '4,3',
        choice: 'plan',
        line: 'Oren has already calculated how many steps you will need to reach this marker, including a reasonable pause for lunch.',
      },
    ],
    choices: [
      {
        id: 'follow',
        label: 'Follow the written route and check the safety markers',
        outcome:
          "The steps lead to a stable return path instead of a treasure cache. Oren's handwriting is unmistakable once you have met him; someone has been keeping the exits honest.",
      },
      {
        id: 'mark',
        label: 'Mark a safer return route for the next lost traveler',
        outcome:
          'You tie a bright ribbon where it can be seen from the House. The next visitor will find a way out that you did not have, even if the keeper objects.',
      },
    ],
  },
  '7,1': {
    title: 'Wrongful Gallows',
    opening:
      'A bare gallows grows a fresh branch whenever someone repeats the village accusation against a stranger. Below it sits the accused, writing down every charge so no one can quietly change the words tomorrow.',
    artPrompt:
      'Haunting fairy-tale gallows tree with newly sprouting branches over a calm prisoner holding written charges, distant village torches, expressive cinematic dark fantasy illustration',
    choices: [
      {
        id: 'appeal',
        label: 'Read the charges aloud and demand a living witness',
        outcome:
          "The branches stop growing at the word 'witness.' The accused asks you to carry the list to the village; a lie has finally been forced to keep the same shape twice.",
      },
      {
        id: 'free',
        label: "Open the gate, then stay to defend the accused's escape",
        outcome:
          'You lead the prisoner out without a fight, but your face joins the official notices. Their freedom is real; so is the attention you have earned from the Index.',
      },
    ],
  },
  '7,2': {
    title: 'Splinter Court',
    opening:
      'Saplings have brought a case against their parent oak for stealing sunlight from the public footpath. The oak submits a hundred-year weather record as evidence. The court clerk is a beetle with a terrifying collection of stamps.',
    artPrompt:
      'Quaint enchanted grove courthouse of rooted oak and young saplings, beetle clerk with tiny ink stamps, sunbeams falling across public forest path, whimsical dark storybook illustration',
    callbacks: [
      {
        at: '2,2',
        choice: 'observe',
        line: 'The court clerk accepts your map of wolf patrol tracks as supporting evidence that not every official accusation matches what happened.',
      },
    ],
    choices: [
      {
        id: 'shade',
        label:
          'Give the saplings an opening in the canopy without killing the oak',
        outcome:
          'A gap of honest sunlight appears on the road, and the court orders everyone to maintain it. The saplings remember you as a mediator, not a conqueror.',
      },
      {
        id: 'record',
        label: 'Study the old weather evidence before issuing a ruling',
        outcome:
          "The records show the path moved, not the oak. You expose the surveyor's mistake and earn a map annotation the Thorn Patrol may be forced to acknowledge.",
      },
    ],
  },
  '4,5': {
    title: "The Shoemaker's Child",
    opening:
      'A child sits on a doorstep repairing shoes too large for their hands. Instead of coins, customers pay with stories about where the boots have been. A polished pair waiting by the door belongs to someone who has not returned.',
    artPrompt:
      'A child of about ten with rolled sleeves sits on a cottage doorstep stitching a pair of oversized leather boots. A wooden rack of worn shoes stands beside the door, and one polished pair of black boots waits apart on the step. Warm late-afternoon light, ivy on the stone wall. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'pay',
        label: 'Tell a truthful story about the world you came from',
        outcome:
          'The child listens without laughing at computers or rain on pavement. In exchange, they stitch a stronger sole into your borrowed boots and promise not to sell your memory.',
      },
      {
        id: 'search',
        label: 'Look for the missing owner of the polished boots',
        outcome:
          "Inside one shoe you find a train ticket bearing tomorrow's date. The child asks you to keep the boots unclaimed until the traveler is found.",
      },
    ],
  },
  '5,3': {
    title: 'Last Breadcrumb',
    opening:
      'A breadcrumb trail winds between the roots in the shape of a perfect spiral. The bird rearranging it knows exactly which children will follow and claims to be helping them get home. Its nest, unfortunately, faces the wrong direction.',
    artPrompt:
      "A clever black forest bird with a white-tipped beak stands among mossy tree roots, placing breadcrumbs into a neat spiral path on the forest floor. Two small children in wool cloaks wait at the outer end of the spiral. The bird's twig nest sits in the branches above, facing away from the path. Soft green afternoon light. High-angle shot looking down. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.",
    choices: [
      {
        id: 'correct',
        label: "Rebuild the trail so it leads away from the bird's nest",
        outcome:
          "The bird complains about wasted architecture, then concedes the route is safer. You leave a path the children can use without ever meeting the nest's other inhabitants.",
      },
      {
        id: 'ask',
        label: 'Ask the bird whom it is actually feeding',
        outcome:
          "'Something old,' it admits. Its candor costs you a restful night but reveals that the forest's hungriest creature dislikes the sound of bells.",
      },
    ],
  },
  '5,6': {
    title: "Bone Crow's Bargain",
    opening:
      'A skeletal crow sits on a gravestone, carefully removing one letter from each forgotten name. It claims the letters are payment for remembering the dead. The gravekeeper insists it is making a second burial out of the first.',
    artPrompt:
      'A skeletal crow perches on a chipped grey gravestone in a forest graveyard, pecking at the carved face of the stone, small stone chips scattered at its base. A gravekeeper in a long black coat holds up a lantern two steps away. Evening mist and lantern light. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '5,3',
        choice: 'ask',
        line: 'The crow hears your story of the bird and asks whether people who keep names should ever be permitted to eat them.',
      },
    ],
    choices: [
      {
        id: 'restore',
        label: 'Help the gravekeeper return the missing letters',
        outcome:
          'You spend the afternoon fitting names back together. The crow keeps one feather for itself and watches in silence, no longer certain that subtraction is the same as care.',
      },
      {
        id: 'bargain',
        label: 'Offer the crow a story it has never heard before',
        outcome:
          'It returns one name in exchange for a truthful memory of rain-soaked pavement. The gravekeeper will now recognize your voice if you come back for the rest.',
      },
    ],
  },
  '6,7': {
    title: 'The Red Swan',
    opening:
      'A scarlet swan glides against the river current with a silver box tied beneath one wing. Every person it passes becomes briefly certain that they have forgotten someone important. The swan claims it was hired only to carry the box.',
    artPrompt:
      'A scarlet swan glides against the current of a dark misty river, a small locked silver box tied beneath one wing with string. Worried travellers in cloaks stand along the reedy bank watching it pass. Early morning fog and pale light. Wide shot from the bank. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'unfasten',
        label: 'Help the swan set the box down without opening it',
        outcome:
          'The moment the box touches earth the borrowed grief stops spreading. The swan remembers the name of its employer and tells you which shore they used.',
      },
      {
        id: 'follow',
        label: 'Follow the current to learn who is paying the swan',
        outcome:
          'The swan grants you passage downriver and shows you a hidden landing. You choose knowledge over immediate relief for everyone still standing upstream.',
      },
    ],
  },
  '7,5': {
    title: "The Fawn's Trial",
    opening:
      'An antlered youth stands accused of leading hunters into their own traps. The hunters admit setting those traps, then insist it was dishonest to remember where they were. A magistrate waits with a scale that measures testimony, not truth.',
    artPrompt:
      'Young antlered woodland traveler before an impromptu forest trial, weary hunters and uneven brass scales on a stump, richly illustrated fairy tale justice scene',
    callbacks: [
      {
        at: '2,2',
        choice: 'observe',
        line: 'The wolf track sketch provides a convenient example of how a trail can prove protection rather than predation.',
      },
    ],
    choices: [
      {
        id: 'tracks',
        label:
          'Present the observed tracks and let the witnesses contradict themselves',
        outcome:
          'The hunters describe two different paths; the magistrate records both. The youth is released, though the court is furious that careful observation has become a legal defense.',
      },
      {
        id: 'confess',
        label:
          'Argue that setting a deadly trap creates the responsibility to mark it',
        outcome:
          'The magistrate orders warning ribbons on the paths. The youth must guide the work and will resent you for the labor, but fewer strangers will be hurt tomorrow.',
      },
    ],
  },
}
