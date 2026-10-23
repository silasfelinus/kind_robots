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
  '2,4': {
    title: 'The Signpost Has Two Arrows',
    opening:
      'A battered sign points EAST to the Vault and ALSO EAST to certain disappointment. Someone has nailed the second arrow on backward. A courier crouches beneath it, attempting to read a letter addressed to a person who has not been born yet.',
    artPrompt:
      'Wide storybook fantasy shot of a crooked two-arrow sign, a night courier with a sealed letter, and a lanternlit travelers camp, rich original woodcut-meets-painterly game art, no text',
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
      'Pip, a traveling courier with a pocketful of crooked keys, is arguing with a hollow stump. Every answer comes back in Pip\'s own voice, except the stump keeps correcting their memory of yesterday.',
    artPrompt:
      'Whimsical forest hollow, expressive traveling courier Pip with brass keys speaking to a hollow speaking stump, dusk light, large character portrait composition',
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
      'Character-led fantasy market scene, eccentric woodland merchant Mosswick and hand-labeled lanterns, thick black account book, warm lamplight, no readable writing',
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
      'Large dignified brass-armored knight with battered round shield in a fairy forest crossroads, shield reflection ominously empty, cinematic game dialogue portrait',
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
      'Close fantasy adventure shot of worn stone with two leaf glyphs and a sun glyph, luminous moss, old gardener silhouette, readable symbols without lettering',
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
      'Traveling courier Pip at wooden forest junction holding two sealed contradictory letters, ominous brass tower silhouette beyond the branches, dramatic close composition',
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
      'An official in an ink-stained traveling desk introduces itself as the Index. It keeps everyone\'s names safely filed, then forgets to mention who owns the files. A blank line waits beside your description.',
    artPrompt:
      'Uncanny fantasy archivist in portable roll-top desk at forest roadside, cascading index cards and ink quills, faintly eerie bureaucratic charm, strong visual novel composition',
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
      'Expressive small moss-cloaked fairy challenger with tiny dueling cards and leaf-shaped blade in forest clearing, playful but earnest story scene',
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
          '“The Knight\'s,” it whispers. “He promised no one would be erased.” The Sprite keeps its challenge open until you duel or make amends.',
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
      'Huge thorn-wrapped forest gate with faint buried golden bell glow, weathered tiny wooden oracle mask and winding roots, haunting illustrated game environment',
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
