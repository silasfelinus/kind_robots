import type { MorrowShiftSite } from '../morrowShift/types'

/**
 * e05 rows 7–8: the Servants' Jetty and the Hidden Landward Gate. Row 7 is
 * the workers who already know the way up; row 8 follows Char's chalk to the
 * ancient anchor, the boots and the gate at 8,8, whose three choices (and
 * the line about Char's fate) come from the campaign.
 */
export const SCYLLAS_SHORE_ROWS_7_8: readonly MorrowShiftSite[] = [
  {
    key: '1,7',
    place: 'Net Loft',
    title: 'Six Painted Pearls',
    speaker: 'Tansy Dunlin',
    kind: 'treasure',
    instant: true,
    opening:
      'In the net loft, the jetty menders straighten the palace’s tangled coronets between jobs, hung on hooks like a silver catch. Tansy Dunlin is unpicking one Scylla knows: Char’s, with the bent prong from the year she wore it upside down to annoy a duke. Six of its pearls are painted pebbles. The paint is new. ‘Not my business, Highness,’ Tansy says. ‘Mending is.’',
    artSubject:
      'A low underwater net loft lit by pearly lamp-jellies, dozens of small silver coronets hanging on hooks among mending nets like a glittering catch; a weathered mer-woman net-mender with rolled sleeves unpicks one coronet with a bone hook, while Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, leans in to look; luminous underwater royal childhood style.',
    choices: [
      {
        id: 'notice',
        label: 'Hold the coronet up to the lamp',
        outcome:
          'Six pearls sold, one at a time, for something Char couldn’t ask anyone to buy her. Tansy fishes a seventh, a real one, from under her bench and presses it into Scylla’s palm. ‘She dropped it. You give it back. I’m not getting between you two.’',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'Close view of a small silver coronet held up to a glowing lamp-jelly, six of its pearls plainly painted pebbles, a single real pearl resting in a young mermaid’s open palm below it.',
      },
    ],
  },
  {
    key: '2,7',
    place: 'Harbour Slate',
    title: 'Which Boat Is Da’s?',
    speaker: 'Tibby Dunlin',
    kind: 'puzzle',
    opening:
      'Tibby Dunlin, seven and gap-toothed, wants to wave her father off, but she can’t read the harbour slate. ‘Da says his boat’s never logged twice. And it never goes out empty, ’cause empty boats get searched.’ The slate reads: COCKLE, kelp bales, bell three, logged twice. DABCHICK, empty, bell five, logged once. SPRAT, lamp oil, bell six, logged once.',
    artSubject:
      'A big chalked harbour slate on a barnacled post at an underwater jetty, kelp barges and small boats moored along it in green-blue light; a gap-toothed little mer-girl tugs at the hand of Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, who studies the slate; luminous underwater royal childhood style.',
    choices: [
      {
        id: 'care',
        label: 'Point her to the Dabchick, the empty boat at bell five',
        outcome:
          'They wave the Dabchick off until it’s gone. A guard on the harbour wall watches a princess and a dock child wave goodbye to an empty boat, and makes a note. Tibby’s da, it turns out, was on the Sprat.',
        effects: { danger: 1 },
        artSubject:
          'A princess and a small mer-girl waving at an empty little boat drifting away from the jetty, while a bored guard on the harbour wall behind them raises an eyebrow.',
      },
      {
        id: 'risk',
        label: 'Point her to the Sprat, the lamp-oil boat at bell six',
        outcome:
          'At bell six the Sprat slips out, riding low for a boat of lamp oil, and a big hand waves from the stern. Tibby is radiant. Scylla notes how heavy that boat sits, and what else a boat nobody bothers to search might carry.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'A small boat riding low in the water as it pulls away from the jetty light, a big hand waving from its stern, a delighted gap-toothed mer-girl waving back beside a thoughtful young princess.',
      },
      {
        id: 'cockle',
        label: 'Point her to the Cockle, the kelp boat at bell three',
        outcome:
          'The Cockle’s crew wave back, politely mystified. Tibby’s lip wobbles; the boat she wanted is already past the jetty light. Scylla promises she’ll know next time, and isn’t sure there will be one.',
        effects: { trust: -1 },
        artSubject:
          'A kelp-laden barge crew waving back in confusion at a little mer-girl whose lip is wobbling, a young princess crouched beside her looking stricken.',
      },
    ],
  },
  {
    key: '3,7',
    place: 'Jetty Keepsake Chest',
    title: 'Things the Sea Brought Back',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'Under the jetty stairs the workers keep a chest of drift from land: a bootlace, a bottle cap, a pink comb with three teeth left, a little cardboard square printed with numbers. The jetty children think it the greatest treasure in the sea. Scylla, who has lived up there, knows exactly what every one of them is for, and for a moment it is very hard to breathe.',
    artSubject:
      'Beneath wooden jetty stairs underwater, a battered sea chest lid propped open to show a bootlace, a bottle cap, a broken pink comb and a small paper bus ticket laid on velvet; three wide-eyed mer-children crowd round Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, who holds the ticket very carefully; luminous underwater royal childhood style.',
    choices: [
      {
        id: 'notice',
        label: 'Tell the children what the bus ticket is for',
        outcome:
          '‘It lets you ride in a box on wheels, in the rain, with strangers, and nobody talks.’ The children are horrified and delighted. Scylla doesn’t tell them she misses it. Tibby solemnly declares the ticket hers.',
        effects: { trust: 1 },
        artSubject:
          'Mer-children recoiling in delighted horror around a young princess who is miming holding a bus rail, a small paper ticket pinched between her fingers.',
      },
    ],
  },
  {
    key: '4,7',
    place: 'Rope Locker',
    title: 'Eel in the Rope Locker',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'The only way down to the undercroft where the Dunlins live is through the rope locker, and tonight a glimmer eel as long as a mooring line has coiled itself in the hawsers. Frightened, glimmer eels blaze like lighthouses; the guards on the harbour wall would see it from their stools. It opens one pale eye at Scylla and begins, faintly, to glow.',
    artSubject:
      'A cramped underwater rope locker of coiled hawsers, a huge pale eel looped through the coils with one moon-coloured eye open and its body beginning to glow from within; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, frozen in the hatchway; luminous underwater royal childhood style with an ominous edge.',
    choices: [
      {
        id: 'care',
        label: 'Hold perfectly still in the dark until it settles',
        outcome:
          'It takes the length of a long, long tide-song. The eel noses her tail, decides she is furniture, and dims. Scylla slips through with cramped fins and a lamp burned down to nothing.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A princess holding utterly still in a dark rope locker while a dim eel rests its head across her tail, a guttering lamp beside her.',
      },
      {
        id: 'risk',
        label:
          'Hum it the nursery lullaby, the one that works on anything small',
        outcome:
          'It isn’t small, but it is a baby. It flushes a happy, blinding gold, and a guard’s head turns on the wall; then a hatch below bangs open and Tansy hauls Scylla through by the wrist, scolding. The eel follows the tune for the rest of the night.',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'A glimmer eel glowing blinding gold with pleasure among the ropes as a net-mender yanks a startled princess down through a floor hatch by the wrist.',
      },
    ],
  },
  {
    key: '5,7',
    place: 'Pay-Night Bench',
    title: 'What the Petition Doesn’t Say',
    speaker: 'The night crew',
    kind: 'memory',
    opening:
      'The night crew eat supper on the long bench under the jetty lamps, and make room for a princess without fuss, which is how Scylla knows Char has sat here before. Talk turns to Councilor Salter’s petition, the one letting princesses choose whom to marry and where to go. A cook with a burn-scarred hand asks, friendly as anything, whether it says a word about jetty folk.',
    artSubject:
      'A long wooden bench under swaying lamp-jellies on an underwater jetty, tired mer-workers sharing bowls of kelp stew, a cook with a scarred hand leaning toward Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, squeezed in among them; warm, luminous underwater royal childhood style.',
    choices: [
      {
        id: 'care',
        label: 'Admit it doesn’t, and ask what it ought to say',
        outcome:
          'They tell her: leave to visit family landward, a boat that’s allowed, letters that needn’t be smuggled. Scylla writes it on her wrist in squid ink. The cook nods, not quite satisfied, which is fair.',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'A young princess writing in dark ink along her own wrist while jetty workers lean in and count points on their fingers.',
      },
      {
        id: 'risk',
        label: 'Promise them you’ll have a line added for them',
        outcome:
          'The bench lifts a cheer and the cook shakes her hand with the scarred one. It is a good promise. Scylla knows exactly how many days she has left beneath the sea to keep it, and that the number may be three.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Jetty workers raising their bowls in a cheer while a scarred cook shakes a young princess’s hand, a guard’s lantern turning their way far down the jetty.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Word came down the kitchen stairs that Princess Scylla signed it in her own name, in front of the portraits. The cook says so as if handing her something.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Word is both princesses signed. Someone saw Char’s name on it, and says it looked a lot like Scylla’s handwriting.',
      },
      {
        flag: 'e05:5,5:care',
        text: 'At the end of the bench someone is humming the farewell song, and looks up as if Scylla might join in again.',
      },
      {
        flag: 'e05:5,5:risk',
        text: 'When the cook starts humming the farewell song, the man beside him elbows him quiet and glances at Scylla.',
      },
    ],
  },
  {
    key: '6,7',
    place: 'Fin-Mender’s Booth',
    title: 'Socks',
    speaker: 'Agnes Tully',
    kind: 'merchant',
    opening:
      'Agnes Tully patches the workers’ borrowed fins, and under her counter keeps a sideline nobody in the sea should need: land goods. Wool socks, a cork, a tin of boot wax. ‘Your sister bought the wax,’ she says. ‘Paid in pearls.’ Scylla stares at the socks. The first time, they forgot socks. She remembers every blister of the first mile.',
    artSubject:
      'A cluttered underwater booth hung with patched fins like laundry, a shrewd older mer-woman fin-mender laying out two pairs of grey wool socks on her counter beside a cork and a tin; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, staring at the socks as if they were relics; luminous underwater royal childhood style, quietly funny.',
    choices: [
      {
        id: 'care',
        label: 'Pay a pearl from your own circlet for two pairs',
        outcome:
          'Agnes bites the pearl, approves, and wraps the socks in kelp paper. Scylla’s circlet now has a gap like a missing tooth, and someone at court will ask about it before the week is out.',
        effects: { supplies: 2, danger: 1 },
        artSubject:
          'A young princess prising a pearl from her own circlet while the fin-mender waits with two parcels of socks wrapped in kelp paper.',
      },
      {
        id: 'risk',
        label: 'Haggle, since you know what socks cost up there',
        outcome:
          '‘Up there they practically give them away,’ Scylla says, which is true and lands badly. Agnes sells her one pair, slowly, and remarks that she hadn’t known the princesses had ever been up there at all.',
        effects: { supplies: 1, trust: -1, danger: 1 },
        artSubject:
          'The fin-mender narrowing her eyes across the counter at a young princess who has just realised she said too much, one pair of socks between them.',
      },
      {
        id: 'one-pair',
        label: 'Buy just one pair, for Char',
        outcome:
          'One pair, folded small. If there’s a road, Scylla will manage it in bare boots; she has done worse. Agnes, wrapping them, says that’s either very generous or very sad, and she won’t charge extra for guessing which.',
        effects: { supplies: 1, trust: 1 },
        artSubject:
          'A single pair of grey wool socks being folded small into a young princess’s satchel, the fin-mender watching her with a crooked, knowing smile.',
      },
    ],
  },
  {
    key: '7,7',
    place: 'Jetty Undercroft',
    title: 'A Bunk Kept Made',
    speaker: 'Marl Dunlin',
    kind: 'memory',
    opening:
      'Under the jetty, among crates the palace rolls call stores, live the Dunlins: Marl, Tansy, Tibby, and one bunk kept made for Fenn, who went landward four years ago and writes when drift allows. ‘Your sister’s been asking how the letters go up,’ Marl says. ‘I told her find out herself, if she wants it that much.’ He turns his cap in his hands. ‘If either of you ever gets up there, Highness. Fenn.’',
    artSubject:
      'A snug family home built among stacked crates beneath an underwater jetty, hammocks, a shell stove and one neatly made empty bunk with a folded blanket; a big mer-dockhand turns his cap in his hands, his wife and small gap-toothed daughter beside him, facing Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze; warm lamplight, luminous underwater royal childhood style.',
    choices: [
      {
        id: 'care',
        label: 'Promise to carry their message landward to Fenn',
        outcome:
          'Tansy writes it on oilcloth: we’re well, Tibby lost a tooth, come home or don’t but write. Scylla folds it into her satchel. It weighs nothing. It is the heaviest thing she owns, because the only way to keep that promise is to go.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A net-mender’s hands pressing a folded oilcloth letter into a young princess’s hands, the made empty bunk behind them.',
      },
      {
        id: 'risk',
        label: 'Ask them straight out for the workers’ secret route',
        outcome:
          'Marl is quiet a long time, then scratches it on a slate: the Sprat’s channel, the old customs arch, the anchor. ‘That’s our living. A princess goes missing by it, they close it, and nobody’s letters go anywhere.’ He wipes the slate. ‘Your sister near had it on her own.’',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A big dockhand scratching a rough route map on a slate by lamplight, his wife watching with folded arms, a young princess leaning in to memorise it.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla weighs every promise now. She once held a chain for as long as holding could matter, and it was not long enough to keep Char.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Tibby has the stillness of a child told to wait. Scylla has seen faces at a train window wait just like that, and sealed a gate on them so her sister would live.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'On the palace rolls this undercroft is marked STORES. Scylla once sent a sea down a channel because a map said nobody lived at the end of it.',
      },
    ],
  },
  {
    key: '8,7',
    place: 'Signal Mirror',
    title: 'Her Own Face, Mostly',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'At the end of the jetty hangs a tide-worn mirror the workers tilt to flash the surface when a boat is coming up. Scylla catches herself in it: pearl circlet, young cheeks, Char’s face in paler colours. Only the eyes are wrong. They belong to a woman who has held a chain in a flooding fountain, and they look out of this girl as if apologising for the intrusion.',
    artSubject:
      'A large tide-worn mirror on a swivel at the very end of an underwater jetty, its silver pitted and clouded, reflecting Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, whose reflected eyes look far older than her face; the dark water above lit only by faint surface glimmer; luminous, slightly uncanny underwater style.',
    choices: [
      {
        id: 'notice',
        label: 'Tilt the mirror toward the surface',
        outcome:
          'She flashes once, the way the workers do. Long seconds later, from impossibly far above, a pinprick of light flashes back. Someone up there is answering. Land is real, and waiting, and has no idea who is coming.',
        effects: { evidence: 1 },
        artSubject:
          'A young princess tilting a big pitted mirror upward on its swivel, a single tiny point of answering light far above in the dark water.',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Her cheeks are still pink from racing Char up the Pearl Stair and losing by a fin, honestly, with nothing said. The girl in the mirror looks almost happy about it.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'She stopped on the Pearl Stair to hint at what’s coming, and Char has been watching her sideways ever since. The girl in the mirror has caught the habit.',
      },
    ],
  },
  {
    key: '1,8',
    place: 'Kelp Curtain',
    title: 'Follow the Skulls',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'Behind the jetty’s last piling a curtain of kelp hides a passage the palace forgot, and someone has chalked a small skull on the rock every twenty strokes. Char, obviously. Further in, the skulls begin to wear tiny crowns. Further still, one crowned skull is rolling its eyes. Char knows exactly who is following her, and has opinions about how long it’s taking.',
    artSubject:
      'A dim rock passage glimpsed through a parted curtain of tall swaying kelp, a trail of small chalk skulls on the stone receding into the dark, the nearer ones wearing tiny chalk crowns and one rolling its eyes; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, pushing through the kelp; luminous underwater royal childhood style, playful and eerie.',
    choices: [
      {
        id: 'notice',
        label: 'Follow the skulls',
        outcome:
          'The last skull before the dark has an arrow and, beneath it in Char’s spiky hand, KEEP UP. Scylla laughs out loud in the passage, then has to press the back of her wrist to her mouth for a moment, for reasons that are not funny at all.',
        effects: { trust: 1 },
        artSubject:
          'A young princess laughing with her wrist pressed to her mouth before a chalk skull, an arrow and two chalked words on dark rock.',
      },
    ],
    echoes: [
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s oilcloth letter crackles in her satchel as she pushes through the kelp, addressed to a boy who will be a man by now.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'Marl’s slate map matches Char’s skulls turn for turn. Her sister found it alone. Scylla had to ask.',
      },
    ],
  },
  {
    key: '2,8',
    place: 'Old Customs Arch',
    title: 'Not Yours, Not Mine',
    speaker: 'Char (a note)',
    kind: 'puzzle',
    opening:
      'The passage ends at a barnacled customs arch with three shells set in its keystone: one carved with a crown, one scratched with a skull, one as plain as a pebble. A note is tied to the bars in Char’s spiky hand: ‘Press the wrong one and the arch rings for the guards. Hint, since you’ll dither: not the one you’d press. Not the one I’d press. Hurry up. C.’',
    artSubject:
      'An ancient barnacle-crusted stone arch with rusted bars across a sea passage, three shells set in its keystone, one carved with a crown, one scratched with a skull, one plain; a scrap of note tied to the bars with black lace ribbon; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, reaching up uncertainly; luminous underwater style, faintly ominous.',
    choices: [
      {
        id: 'care',
        label: 'Press the crowned shell; it’s the proper one',
        outcome:
          'Somewhere far behind her a bell begins to ring. Scylla flattens herself in the weed while two guards swim past the kelp curtain arguing about echoes. Char’s hint, she realises, was a precise description of her.',
        effects: { danger: 1 },
        artSubject:
          'A princess pressed flat among sea-weed at the foot of the arch while two lantern-carrying guards swim past the kelp beyond, unseeing.',
      },
      {
        id: 'risk',
        label: 'Press the skull; it’s Char’s mark',
        outcome:
          'No bell. Instead the skull shell squirts squid ink straight into her face. Under the note, smaller, Char has written I KNEW IT. Scylla spends a while blinking ink out of her eyes and trying to stay cross.',
        effects: { supplies: -1 },
        artSubject:
          'A young princess recoiling from a burst of black squid ink out of a skull-scratched shell, her face streaked, the note fluttering on the bars.',
      },
      {
        id: 'plain-shell',
        label: 'Press the plain shell, neither yours nor hers',
        outcome:
          'The plain shell clicks and the arch swings inward without a sound. On the inside of the bars Char has chalked one more crowned skull, this one smiling, as if pleased despite herself.',
        effects: { evidence: 2 },
        artSubject:
          'The barred arch swinging silently open into the dark, a smiling chalk skull wearing a tiny crown drawn on the inner side of the bars.',
      },
    ],
  },
  {
    key: '3,8',
    place: 'Headsman’s Crate',
    title: 'Counted Three Times',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Halfway down the passage, Oren Pike sits on an upturned crate, hood on, axe across his knees, ledger open. Of course he knows. ‘Two princesses, one passage, no permission,’ he says. ‘I have counted it three times and it does not improve.’ Then he turns the ledger round. He has already worked out what they would need, to the ounce, and filed it under PREPOSTEROUS, PROVISIONED.',
    artSubject:
      'A narrow sea passage lit by one lantern, where Oren Pike, a very tall broad merman with an eel-grey tail, his whole head covered by a rough brown cloth executioner hood with two eyeholes, a heavy axe across his knees and a leather apron of pouches, sits on an upturned crate holding out an open ledger; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, hovers before him; luminous underwater royal childhood style, gentle and wry.',
    choices: [
      {
        id: 'care',
        label: 'Tell Oren the truth: you have lived this road once already',
        outcome:
          'He hears all of it without moving, the way only a man in a hood can. Then he licks his pencil and adds a line: ROPE, EXTRA. ‘I don’t know if I believe you,’ he says. ‘I’ll pack as if I do.’',
        effects: { trust: 2, supplies: 1, danger: 1 },
        artSubject:
          'The hooded headsman writing carefully in his ledger by lantern light while a young princess talks, her hands knotted together.',
      },
      {
        id: 'risk',
        label: 'Ask him to hold Char back if you can’t',
        outcome:
          'The hood turns slowly. ‘I’m headsman to you both, Highness. I keep the axe for you both. I don’t keep either of you.’ He closes the ledger gently, which is worse than a slam. ‘She asked me the same about you this morning. I told her the same.’',
        effects: { trust: -2, evidence: 1 },
        artSubject:
          'The hooded headsman gently closing his ledger, his eyeholes turned on a young princess who looks suddenly very small.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,4:care',
        text: 'Three packs sit at his feet now. The third is the smallest, labelled OREN in tidy capitals, as if he might otherwise forget whose it is.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'He has re-weighed Char’s pack. He doesn’t mention the difference. He just puts the missing rope back, and looks at Scylla through the eyeholes for one long count.',
      },
    ],
  },
  {
    key: '4,8',
    place: 'Tide-Clock Passage',
    title: 'The Clock That Runs Late',
    speaker: 'Scylla',
    kind: 'challenge',
    opening:
      'Past the arch the passage narrows to a throat of rock where the sea pulls hard toward open water, except at slack tide. An old bronze tide clock in the wall says when. Its hand is still forty strokes from slack. But the water on Scylla’s scales already feels slack, now, and she remembers another tide, years from here, that went quiet just before it turned.',
    artSubject:
      'A narrow throat of dark rock in the sea with streamers of weed all dragged one way by a hard current, an old green-bronze tide clock set into the wall with its single hand short of a carved mark; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, gripping the rock beside it, looking ahead; ominous tidal-clock mood in a luminous underwater style.',
    choices: [
      {
        id: 'care',
        label: 'Trust the clock and wait for its mark',
        outcome:
          'She waits. The water stirs, sulks, then slackens properly on the mark, and she swims through safe and slow, her lamp lost to a snag. Patience, she tells herself, is wisdom. Somewhere ahead, Char went through without waiting, and is fine.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A young princess clinging patiently to the rock by the bronze clock as its hand creeps to the mark, a snagged lamp drifting away into the dark.',
      },
      {
        id: 'risk',
        label: 'Go now, on what your body remembers',
        outcome:
          'The water holds, then grabs her tail at the far end and slams her into rock; she claws through bruised. Behind her the clock’s hand reaches slack only now. It runs late. And Char, she knows, timed everything by the palace clocks.',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'A princess wrenched sideways by a sudden current against the far end of the rock throat, looking back at the bronze clock whose hand is only now reaching its mark.',
      },
    ],
    echoes: [
      {
        flag: 'e05:6,6:care',
        text: 'Wenna Brack has been here since Scylla told her about the gate: fresh chalk beside the clock reads CHECK AGAINST WATER, NOT BRONZE, underlined twice.',
      },
      {
        flag: 'e05:6,6:risk',
        text: 'Scylla smoothed tomorrow’s dial flat with one turn of a brass screw. She doesn’t know whether this old clock answers to that one, and not knowing is a current of its own.',
      },
    ],
  },
  {
    key: '5,8',
    place: 'Ancient Anchor',
    title: 'Two Pairs of Boots',
    speaker: 'Scylla',
    kind: 'treasure',
    opening:
      'Where the passage widens, an anchor older than the palace leans against the rock, flukes furred green, its ring big enough to swim through. Behind it, wrapped in oilcloth and smelling of new wax, are two pairs of boots. One heel is stitched with a tiny skull. The other, absurdly, with a tiny crown. Char measured both against her own feet. They are, of course, the same feet.',
    artSubject:
      'A colossal ancient ship’s anchor furred with green weed leaning against cave rock in deep blue light, its great ring big enough to swim through; behind it an oilcloth bundle folded open to reveal two pairs of small new leather boots, one heel stitched with a skull, the other with a crown; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, kneeling to look; luminous underwater style, aching and tender.',
    choices: [
      {
        id: 'care',
        label: 'Unwrap your pair, then wrap it back just as she left it',
        outcome:
          'No feet to try them on yet, so Scylla holds them where her feet will be, if the land agrees. Right size. Right everything. She wraps them back, laces crossed the way Char crosses them. Char will know anyway. Char always knows.',
        effects: { supplies: 1, trust: 1 },
        artSubject:
          'A young mermaid holding a small pair of crown-stitched boots against the end of her tail where feet would be, smiling and close to tears beside the great anchor.',
      },
      {
        id: 'risk',
        label: 'Read the note tucked into Char’s left boot',
        outcome:
          '‘If she won’t come, go anyway. Don’t look back at the gate. She’ll be crying and so will you.’ Scylla puts it back exactly. Char’s plan has a version without her in it, and Char wrote it down so she would never have to say it aloud.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A young princess reading a small folded note drawn from a skull-stitched boot, her face gone still, the huge anchor looming over her in blue gloom.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last anchor Scylla held was the one she was holding when the sea took Char. She lays her palm on this one’s cold fluke and waits for her hand to stop shaking.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The last anchor she held, she held shut. Char lived; the train stayed below. She can still feel its lit windows somewhere behind her ribs.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The last anchor she held, she used to swing a sea aside. She still doesn’t know whether the yard at the end of that channel was as empty as it was supposed to be.',
      },
      {
        flag: 'e05:4,4:care',
        text: 'Tucked behind the boots is a third pair, enormous and plainly cobbled, tagged in Oren’s printed hand: SIZE CONFIRMED TWICE.',
      },
    ],
  },
  {
    key: '6,8',
    place: 'Chalk Grotto',
    title: 'Char’s Plan, Annotated',
    speaker: 'Char',
    kind: 'companion',
    opening:
      'In a grotto beside the gate Char has chalked the whole escape on the wall: the arch, the anchor, the gate at the dawn tide, the cove, a stick figure in boots labelled ME and another labelled YOU, LATE. She doesn’t turn round. ‘Don’t manage it. Just look.’ It’s a good plan, nearly the one Scylla remembers. One line is wrong: Char has timed the gate by the palace clocks, which run late out here.',
    artSubject:
      'A shadowy grotto wall covered in a big chalk diagram of an escape route with arrows, an anchor, a gate and two stick figures in boots; Char, her identical twin with dark violet scales, black lace and a sardonic grin, chalk in hand with her back half-turned, and Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, studying the wall; luminous underwater royal childhood style.',
    choices: [
      {
        id: 'care',
        label: 'Look at all of it, and say only what she asks',
        outcome:
          'Char walks her through every line, fiercely proud, and asks what Scylla thinks. ‘It’s good,’ says Scylla, which is true. Char glows. The wrong line stays on the wall, timed by a clock Scylla knows is late, because Char never asked about that.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char glowing with pride as she sweeps her chalk along the drawn route, Scylla nodding beside her, eyes lingering on one line near the gate.',
      },
      {
        id: 'risk',
        label: 'Tell her the gate time is wrong, and don’t say how you know',
        outcome:
          'Char’s chalk stops. ‘Since when do you know tides better than the palace?’ She fixes the line anyway, hard enough to snap the chalk, and doesn’t look at Scylla for a while. The plan is safer. The sisters are a little further apart.',
        effects: { danger: -1, evidence: 1, trust: -1 },
        artSubject:
          'Char scrubbing out and redrawing one chalk line so hard the chalk snaps in her fingers, refusing to look at her twin beside her.',
      },
    ],
  },
  {
    key: '7,8',
    place: 'Moonlit Seam',
    title: 'A Ribbon of Light',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'Through a crack in the rock beside the gate, under a moon worn down to nothing, a ribbon of starlight comes down into the sea, and with it the smell of land: wet stone, woodsmoke, something frying. The first time, Scylla didn’t know what frying was. Now she knows bread, and queues, and buses that never come, and how kind strangers can be at counters, and what it costs to get there.',
    artSubject:
      'A single narrow ribbon of pale starlight falling through a crack in cave rock into dark water, motes drifting in it; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, floating beneath it with her face tipped up and eyes closed; luminous, aching underwater style.',
    choices: [
      {
        id: 'notice',
        label: 'Hold your hand in the starlight',
        outcome:
          'It is colder than she remembers, and no warmer than the water. Scylla holds her hand in it until her fingers ache, as if land could be held to its word. Behind her, Char is whistling the farewell song, badly, on purpose.',
        effects: { evidence: 1 },
        artSubject:
          'A young mermaid’s open hand held up into a narrow shaft of starlight in dark water, her sister a dim violet shape in the background.',
      },
    ],
  },
  {
    key: '8,8',
    place: 'Hidden Landward Gate',
    title: 'The Landward Gate',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Through the gate’s old bronze bars, the far lamps of the shore lie on the dark water like a road; the tide runs landward at dawn. Char holds both pairs of boots by the laces. ‘Out there, land. Back there, Mother, the jetty, tomorrow’s ball with two empty chairs, everyone who’d pay for us.’ And Scylla’s secret, which would give Char the truth and cost her the not-knowing. ‘So, Scyl. Choosing for me, or standing with me while I choose?’',
    artSubject:
      'A massive weed-furred green-bronze gate in a sea cave, on a moonless night, the far lamps of a distant shore glimmering through its bars across the water like a road; Char, her identical twin with dark violet scales, black lace and a sardonic grin, holds two pairs of small leather boots dangling by their laces, waiting; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, faces her; the ancient anchor looms behind; luminous underwater royal childhood style, the tide paused.',
    choices: [],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla knows how this face looks at the far end of the road it’s asking her to take. Char is grinning at her with it, impatient, entirely alive.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Far ahead, in the future she left, a train still waits under a fountain with hands against its windows. Every road from this gate runs somewhere near it.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Far ahead, in the future she left, a yard that was meant to be empty lies under the sea. Scylla has learned what it costs to decide for people who aren’t in the room.',
      },
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s letter to Fenn is in her satchel. A promise to carry something landward is also, quietly, a vote.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'Marl’s route is in her head now. If the princesses go, it is the jetty that will be asked how.',
      },
    ],
  },
]
