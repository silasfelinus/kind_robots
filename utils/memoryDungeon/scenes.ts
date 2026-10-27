import { BRIAR_MARCHES_FIRST_BATCH } from './scenesBriarMarches'
import { BRIAR_MARCHES_SECOND_BATCH } from './scenesBriarMarchesSecond'
import { BRIAR_MARCHES_FINAL_BATCH } from './scenesBriarMarchesFinal'

export interface BriarSceneChoice {
  id: string
  label: string
  outcome: string
  cost?: { wildflowers?: number; lanterns?: number }
  gain?: { wildflowers?: number; lanterns?: number }
  settleDuel?: boolean
}

export interface BriarScene {
  title: string
  opening: string
  artPrompt: string
  callbacks?: { at: string; choice: string; line: string }[]
  choices: readonly BriarSceneChoice[]
}

export const BRIAR_SCENES: Record<string, BriarScene> = {
  ...BRIAR_MARCHES_FIRST_BATCH,
  ...BRIAR_MARCHES_SECOND_BATCH,
  ...BRIAR_MARCHES_FINAL_BATCH,
  '4,4': {
    title: 'Their Identical Royal Highnesses',
    opening:
      'Two princesses have arrived with a carriage stuck firmly between two trees. One wears an immaculate traveling coat and a crown pinned squarely above a practical braid. Her sister has the same face, broad shoulders and knowing grin, but darker skin, a web of black lace, battered velvet, silver jewelry and a severe sweep of goth makeup. “Scylla,” says the proper one. “Char,” says the other. “Charybdis on formal occasions. We are identical, obviously.” Before you can explain the problem with your stolen life, both announce that they are helping.',
    artPrompt:
      'Scylla, a stout broad-shouldered adult woman with light brown skin, a chestnut braid and a small polished silver crown, in a tailored navy travel coat with brass buttons, and Char, her twin with the same broad face and sturdy build, deep brown skin, black hair in a high braid, layered black velvet and lace, silver rings and chains, black lipstick and dark eye makeup, push together at a gilded carriage wedged between two oak trunks on a forest road. Both are laughing, shoulders braced against the wood. Warm afternoon light through the leaves. Wide shot at eye level. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'escort',
        label: 'Accept the princesses as traveling companions',
        gain: { wildflowers: 1 },
        outcome:
          'Scylla draws up an escort proclamation. Char draws a skull over its seal. They give you a silver wildflower, insist the entire affair is settled, and send a summons to their headsman to handle the transport.',
      },
      {
        id: 'question',
        label: 'Ask why identical twins look so different',
        gain: { lanterns: 1 },
        outcome:
          'Both stare at you in the same scandalized way. “Different waters,” says Char. “Same face,” says Scylla. “That is how tides work.” They offer you a lantern to examine the evidence and then declare your new expedition official anyway.',
      },
    ],
  },
  '4,3': {
    title: 'The Headsman Keeps a Manifest',
    opening:
      'The royal headsman towers over a wagon wheel in his executioner’s hood, broad axe balanced against one shoulder. He never removes the mask. With one clean stroke he frees the wheel from a root, then unrolls a densely annotated travel manifest. “Three princesses’ worth of luggage,” he mutters, despite there being only two princesses. “One borrowed changeling. Four roads closed by narrative improbability. I have allowed for lunch.”',
    artPrompt:
      'Oren Pike, a very tall broad man whose whole head is covered by a rough brown cloth executioner hood with two eyeholes, a heavy ceremonial axe and a leather apron of pouches, stands beside a stuck carriage on a forest road. He holds a long unrolled scroll of supply lists in one hand, the axe resting against his shoulder, and a cut tree root lies beside the freed wheel. Two women in travelling clothes wait by the carriage behind him. Afternoon light through oaks. Medium-wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '4,4',
        choice: 'escort',
        line: 'He inspects Scylla’s escort proclamation and silently files it under UNNECESSARY BUT BINDING.',
      },
      {
        at: '4,4',
        choice: 'question',
        line: 'He sees your lantern. “They gave you the demonstration, then. Happens every spring.”',
      },
    ],
    choices: [
      {
        id: 'plan',
        label: 'Ask Oren for a workable itinerary',
        gain: { lanterns: 1 },
        outcome:
          'Oren divides the map into reachable stages, marks the dangerous crossings, and hands you a spare lantern. “The axe is for emergencies,” he explains. “The schedule prevents them.”',
      },
      {
        id: 'load',
        label: 'Help organize the supplies for the road',
        gain: { wildflowers: 1 },
        outcome:
          'You sort six parcels by destination, discover one mislabeled chest, and save Oren a return trip. Without a word he gives you a silver wildflower. This is apparently how royal commendations work.',
      },
    ],
  },
  '2,4': {
    title: 'The Signpost Has Two Arrows',
    opening:
      'A battered sign points EAST to the Vault and ALSO EAST to certain disappointment. Someone has nailed the second arrow on backward. A courier crouches beneath it, attempting to read a letter addressed to a person who has not been born yet.',
    artPrompt:
      "A crooked wooden post at a forest camp carries two arrow-shaped boards that both point east, one nailed on upside down. A young courier in a dark cloak crouches beneath it, studying a sealed envelope by lantern light. Behind, a travellers' camp with a campfire, bedrolls and a hanging kettle. Night, warm firelight. Wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.",
    choices: [
      {
        id: 'lend',
        label: 'Lend your lantern to deliver the letter',
        cost: { lanterns: 1 },
        gain: { wildflowers: 2 },
        outcome:
          'The courier vanishes into the wood with your lantern. Two silver flowers are left in its place. On the envelope: your handwriting, several years older.',
      },
      {
        id: 'copy',
        label: 'Keep your lantern and copy the impossible address',
        outcome:
          'You copy the address. The sign twists behind you until both arrows point to the same crooked road. The letter is still undelivered, but you know where its recipient should be.',
      },
    ],
  },
  '3,4': {
    title: 'An Unpaid Toll',
    opening:
      'A bell hangs over a dry creek. Beneath it a toll collector has set up a beautiful velvet chair but forgotten the actual bridge. They demand payment for every traveler who crosses the imaginary span.',
    artPrompt:
      'Full-scene strange forest road, velvet chair and empty bridge toll booth, exasperated toll collector holding a tiny bell, playful dark fantasy atmosphere',
    choices: [
      {
        id: 'challenge',
        label: 'Ask for a receipt for the nonexistent bridge',
        outcome:
          'The collector produces a receipt stamped PAID BY SOMEONE ELSE. For one moment you see the shape of a bridge in the mist. The collector begs you not to tell the auditors.',
      },
      {
        id: 'help',
        label: 'Help them draw the bridge on their ledger',
        gain: { wildflowers: 1 },
        outcome:
          'Your pencil completes the span. The collector looks relieved, offers you a flower, and admits that a drawn bridge is easier to maintain than a real one.',
      },
    ],
  },
  '3,5': {
    title: 'Pip and the Borrowed Voice',
    opening:
      "Pip, a traveling courier with a pocketful of crooked keys, is arguing with a hollow stump. Every answer comes back in Pip's own voice, except the stump keeps correcting their memory of yesterday.",
    artPrompt:
      'Pip, a small green-skinned goblin courier in a patched brown coat with a pocketful of crooked brass keys, leans toward a hollow tree stump in a mossy forest hollow, mid-argument, one finger raised. A faint warm glow comes from inside the stump. Dusk orange light slanting through the trees. Medium shot at eye level. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'light',
        label: 'Use a lantern to expose the voice inside',
        cost: { lanterns: 1 },
        gain: { wildflowers: 2 },
        outcome:
          'In the light, the borrowed voice shrinks into a moth. Pip releases it rather than pinning it to a page. They pay you in flowers and promise to remember the favor, provided memory remains legal.',
      },
      {
        id: 'listen',
        label: 'Let the stump finish the story',
        outcome:
          'The stump recalls a knight apologizing to a locked door. Pip says they did not ask for a tragedy but writes it down anyway. You now share a secret that belongs to neither of you.',
      },
    ],
  },
  '4,2': {
    title: 'Mosswick Sells Tomorrow',
    opening:
      'Mosswick has priced every object in the stall twice: once in wildflowers, once in promises. The promises are more expensive. A black ledger rests under the lanterns, open to a debt with your name missing.',
    artPrompt:
      'Mosswick, a stooped old man with a long grey braided beard and a patched moss-green coat, stands behind a wooden forest stall crowded with brass lanterns, bunches of wildflowers and small string-tied parcels. A thick black ledger lies open beneath the lanterns with one empty line marked by a red ribbon. Warm lantern light against a dark blue evening forest. Medium shot at eye level. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '2,4',
        choice: 'lend',
        line: 'He recognizes the courier lantern you gave away and lowers his voice. “That delivery cost someone a whole morning.”',
      },
    ],
    choices: [
      {
        id: 'ledger',
        label: 'Study the entry with the blank name',
        outcome:
          'Mosswick covers the price column but lets you read the date. It is tomorrow. “I sell warnings,” he says, “not refunds.” His lantern trade remains open.',
      },
      {
        id: 'promise',
        label: 'Promise to return with a true account',
        gain: { wildflowers: 1 },
        outcome:
          'Mosswick hands you a flower as earnest money, then marks a page with an empty silhouette. When you return, he expects a story worth more than the flower.',
      },
    ],
  },
  '5,4': {
    title: 'A Knight Who Mislaid His Oath',
    opening:
      'The Brass Knight is polishing a shield so diligently that no one notices its reflection shows an empty suit of armor. He asks whether you have seen a promise walking loose in the woods.',
    artPrompt:
      'A tall knight in dented brass plate armor kneels at a forest crossroads, polishing a battered round brass shield with a cloth. The reflection in the polished shield shows an empty suit of armor standing where he kneels. Mossy oaks and a fork of dirt roads behind him. Late afternoon gold light. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'truth',
        label: 'Tell him about the false toll and the missing bridge',
        outcome:
          'He winces at the word missing. “My oath was to guard a crossing. I never specified it had to exist.” He marks your map with the direction of the Vault.',
      },
      {
        id: 'errand',
        label: 'Agree to carry his sealed apology',
        gain: { wildflowers: 1 },
        outcome:
          'He gives you a silver flower and a letter addressed only to THE DOOR. You cannot read the apology without breaking his trust. He intends to ask about it again.',
      },
    ],
  },
  '2,6': {
    title: 'The Moss That Can Count',
    opening:
      'Three carved shapes climb the stone in a familiar rhythm: leaf, leaf, sun. An old gardener insists that the stones are not a password but the beginning of an argument with the light.',
    artPrompt:
      'A weathered standing stone covered in glowing green moss. Three shapes are carved into it in a column: a leaf, a second leaf, and a round sun with rays. An old gardener in a straw hat leans on a spade beside it. Soft late-afternoon light. Close shot of the stone with the gardener at the edge. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'trace',
        label: 'Trace the pattern into your journal',
        outcome:
          'You draw leaf, leaf, sun in the margin. The gardener nods. “Now you can remember it without asking the stones to do all the work.” The quiet stones lie farther down the path.',
      },
      {
        id: 'listen',
        label: 'Ask why the sun must come last',
        outcome:
          '“Because a forest that sees the sun first forgets to make shade.” Their answer does not change the order, but it changes what you think the pattern is protecting.',
      },
    ],
  },
  '3,2': {
    title: 'Vesper and the Unsent Map',
    opening:
      'Vesper sits beneath a tree, drawing a map on the blank side of a farewell letter. It has roads, a tower, and a small hole precisely where a person should be. Vesper folds the letter whenever you look too closely.',
    artPrompt:
      'Melancholy yet witty young fantasy cartographer Vesper beneath gnarled tree with folded half-finished map, pale afternoon light and distant ruin, emotionally expressive portrait',
    choices: [
      {
        id: 'ask',
        label: 'Ask who was erased from the road',
        outcome:
          '“Someone I promised not to find,” Vesper says. You do not get their name. Instead, Vesper draws an alternate path beside the tower and signs it with a question mark.',
      },
      {
        id: 'offer',
        label: 'Offer a wildflower for a copy of the missing route',
        cost: { wildflowers: 1 },
        gain: { lanterns: 1 },
        outcome:
          'Vesper trades you an oil-filled lantern from their pack. “A map is no use if you cannot see it.” They keep the flower pressed inside the farewell letter.',
      },
    ],
  },
  '6,4': {
    title: 'Pip Delivers a Contradiction',
    opening:
      'Pip has reappeared ahead of you with two envelopes, each bearing the seal of the Brass Knight. One apologizes to a door; the other orders it destroyed. Both have been sent.',
    artPrompt:
      'Pip, a small green-skinned goblin courier in a patched brown coat with a pocketful of crooked brass keys, stands at a wooden forest junction holding up two envelopes sealed with identical brass-coloured wax. A tall brass tower rises above the branches in the distance. Overcast grey light. Medium close-up at eye level. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '3,5',
        choice: 'light',
        line: 'Pip greets you warmly. “I still have my own voice thanks to you. I would rather not use it to lie.”',
      },
      {
        at: '5,4',
        choice: 'errand',
        line: 'The courier spots the sealed apology you carry and studies you with new suspicion.',
      },
    ],
    choices: [
      {
        id: 'carry',
        label: 'Carry the apology, not the destruction order',
        outcome:
          'Pip puts the destructive letter away. “Then we will find out whether a door can forgive.” One fewer threat walks toward the Vault, at the cost of knowing less about the Knight.',
      },
      {
        id: 'read',
        label: 'Read the destruction order and warn the Vault',
        outcome:
          'The order is signed by the Knight in a hand older than the armor. You may have saved the Vault a surprise, but Pip will have to explain why one of the letters arrived opened.',
      },
    ],
  },
  '7,4': {
    title: 'The Index of Unreliable Persons',
    opening:
      "An official in an ink-stained traveling desk introduces itself as the Index. It keeps everyone's names safely filed, then forgets to mention who owns the files. A blank line waits beside your description.",
    artPrompt:
      'The Index, a tall thin figure clad in layered sheets of paper like overlapping armor plates and an ink-stained black coat, sits inside a portable wooden roll-top desk at a forest roadside. Hundreds of small paper slips spill from its drawers and ink quills stand in a pot. One blank slip lies on the desk, turned toward the viewer. Pale morning mist between the trees. Medium shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    callbacks: [
      {
        at: '5,4',
        choice: 'errand',
        line: 'The Index asks to inspect the apology you are carrying. It claims unopened letters are especially dangerous to public order.',
      },
    ],
    choices: [
      {
        id: 'refuse',
        label: 'Keep your name off its list',
        outcome:
          'The Index sighs and files you under UNHELPFUL WITNESS. Somewhere nearby, a book closes. At least the entry cannot be rewritten without finding you first.',
      },
      {
        id: 'register',
        label: 'Give your name, but demand a copy',
        gain: { wildflowers: 1 },
        outcome:
          'You receive a carbon copy and one pressed silver flower used as an official bookmark. The copy has one extra sentence: YOU WERE HERE BEFORE.',
      },
    ],
  },
  '6,3': {
    title: 'The Vault Hears Everything',
    opening:
      'At the threshold, someone has scratched a dozen names into the masonry. Each has been crossed out by a different hand. The door waits for you to decide whose version deserves remembering.',
    artPrompt:
      'Ancient dungeon threshold between massive living roots, scratched-out name tablets, distant glowing vault hall, emotional cinematic fantasy entrance',
    callbacks: [
      {
        at: '6,4',
        choice: 'carry',
        line: 'The apology travels with you. Beneath the door you find a narrow opening shaped exactly like an envelope.',
      },
      {
        at: '7,4',
        choice: 'register',
        line: 'Your carbon copy stirs in your pocket. The crossed-out names appear on the back of the form.',
      },
    ],
    choices: [
      {
        id: 'remember',
        label: 'Copy the names before entering',
        outcome:
          'You copy every crossed-out name, including the one that looks almost like yours. The Vault will have a harder time convincing you that these people never existed.',
      },
      {
        id: 'protect',
        label: 'Leave the names hidden from the Index',
        outcome:
          'You rub loose moss across the inscription. Whoever wrote the names may thank you; whoever is trying to recover them may never know what was here.',
      },
    ],
  },
  '5,5': {
    title: 'The Sprite Has a Grievance',
    opening:
      'The Moss Sprite says the forest owes it a remembered favor. It challenges travelers because victories are the only events the Index cannot quietly erase from its records.',
    artPrompt:
      'A knee-high moss-covered sprite with a leaf cap, twig fingers and glinting green eyes stands on a tree stump in a forest clearing, holding up a tiny leaf-shaped blade and a fan of small painted tiles, glaring straight ahead. Dappled green afternoon light. Low-angle close shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'gift',
        label: 'Settle the grievance with one wildflower',
        cost: { wildflowers: 1 },
        settleDuel: true,
        outcome:
          'The Sprite accepts the flower as proof that someone heard it. It calls off the duel and promises to testify if the Index ever asks who you are.',
      },
      {
        id: 'question',
        label: 'Ask whose favor it is remembering',
        outcome:
          "“The Knight's,” it whispers. “He promised no one would be erased.” The Sprite keeps its challenge open until you duel or make amends.",
      },
    ],
  },
  '7,3': {
    title: 'Two Guards, One Ordersheet',
    opening:
      'The Thorn Patrol has a single order between them: stop anyone who knows the wrong name of the Vault. Neither guard is sure what the right name is, and neither will risk asking.',
    artPrompt:
      'Two tired but distinct fantasy sentries in thorn-wrapped armor arguing over one wrinkled order sheet beside mossy shortcut, expressive theatrical staging',
    choices: [
      {
        id: 'bribe',
        label: 'Pay a flower to end the patrol dispute',
        cost: { wildflowers: 1 },
        settleDuel: true,
        outcome:
          'The guards spend the flower on a new pen and agree to submit a query to the Index. They let you pass without a fight, though the paperwork will follow.',
      },
      {
        id: 'challenge',
        label: 'Ask whether they would arrest the Index itself',
        outcome:
          'They exchange an alarmed glance. One quietly admits that the Index has entered under three different names. The duel remains available if you want their respect.',
      },
    ],
  },
  '8,5': {
    title: 'The Gate Has a Heartbeat',
    opening:
      'Beneath the thorn gate the earth beats slowly, not with a heart but with a bell too deep to hear. A little wooden mask asks which memory you would sacrifice to open it sooner.',
    artPrompt:
      'A huge gate of woven thorn branches across a forest road, with a faint golden glow rising through the soil at its base. A small carved wooden mask is set into the bark at eye height, and thick roots wind across the ground. Night, cold blue light and warm gold glow from below. Low-angle wide shot. Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.',
    choices: [
      {
        id: 'wait',
        label: 'Refuse to sacrifice a memory; seek the Chime',
        outcome:
          'The mask creaks in what might be approval. “That is an answer,” it says, “although not the quickest.” The proper gate still waits for the Bramble Chime.',
      },
      {
        id: 'promise',
        label: 'Promise to return with a story worth keeping',
        gain: { wildflowers: 1 },
        outcome:
          'The mask drops a flower into your palm, payment in advance for an unverified future. The gate remains closed, but now there is a witness expecting your return.',
      },
    ],
  },
}

export function briarSceneOpening(
  scene: BriarScene,
  choices: Readonly<Record<string, string>>,
): string {
  const callback = scene.callbacks
    ?.filter((entry) => choices[entry.at] === entry.choice)
    .map((entry) => entry.line)
    .join(' ')
  return callback ? `${scene.opening} ${callback}` : scene.opening
}

export function canChooseBriarScene(
  choice: BriarSceneChoice,
  resources: { wildflowers: number; lanterns: number },
): boolean {
  return (
    resources.wildflowers >= (choice.cost?.wildflowers ?? 0) &&
    resources.lanterns >= (choice.cost?.lanterns ?? 0)
  )
}
