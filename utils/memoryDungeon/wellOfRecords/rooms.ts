import type { DungeonRoomContent } from '../authoredDungeon/types'
import type { WellOfRecordsEntry, WellOfRecordsRoomId } from './types'

export const WELL_OF_RECORDS_ROOMS: readonly DungeonRoomContent<
  WellOfRecordsRoomId,
  WellOfRecordsEntry
>[] = [
  {
    id: 'WR-01',
    title: 'The Lip of the Well',
    kind: 'entry',
    speaker: 'Char and Scylla',
    opening:
      'Ten strokes below the throne the spiral stair begins, cut into the inside of the Well and railed with brass from somewhere that had trains. The first landing has a ticket barrier fused into the coral, its gate stamped ALL PASSENGERS MUST BE CLAIMED. Beyond it the shelves start: drawer after drawer in court hand, going down into dark that smells of lamp oil and wet paper. Scylla holds the lamp. Char reads the barrier twice and decides she has been called worse things than a passenger.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, hovers before a brass ticket barrier fused into a coral landing at the top of a spiral stair inside a dark well, Scylla, her identical twin with pale aquamarine scales and a pearl circlet, holding a lamp behind her, shelves of labelled drawers descending into darkness',
    echoes: [
      {
        flag: 'entry:by-choice',
        text: 'The line to the throne runs taut above them, and Scylla keeps a stroke behind, exactly where she promised. Up at the lip the conch has said nothing since Char spoke. The silence follows them down like a debt nobody has invoiced yet.',
      },
      {
        flag: 'entry:oracle-tested',
        text: 'From here Char can still see her chalk tally on the lip, nine crosses in ten, white against the stone. The conch’s voice comes down thin and offended. The lamp is low; the hour with the court logs cost them oil they could have used.',
      },
    ],
    choices: [
      {
        id: 'vault-the-barrier',
        label: 'Swim over the barrier unclaimed and lead the way down',
        outcome:
          'Char goes over the gate the way she used to go over the nursery rail, tail first and grinning. A bell rings somewhere far below, once, as if a drawer had been opened. Scylla follows by the turnstile, properly, and gets a small brass receipt she does not want.',
        gain: { danger: 1, trust: 1 },
        artSubject:
          'Char in black lace with dark violet scales flips tail-first over a brass ticket barrier on a coral landing while her aquamarine twin with a pearl circlet passes sedately through the turnstile beside it, lamp raised',
      },
      {
        id: 'read-the-barrier',
        label: 'Read the small print on the barrier before going through',
        outcome:
          'Under the stamp, in smaller court hand: Unclaimed persons are held in trust for the Crown pending ruling. Char reads it aloud in her flattest voice. Scylla says that cannot be legal. Char says that is what the small print is for, and pockets the knowledge like a stone.',
        gain: { evidence: 1 },
        artSubject:
          'Char with dark violet scales and black lace bends close to read small engraved lines on a brass ticket barrier by lamplight, her aquamarine twin holding the lamp near and frowning',
      },
    ],
  },
  {
    id: 'WR-02',
    title: 'The Catalogue of Owners',
    kind: 'lore',
    speaker: 'Char',
    opening:
      'A wall of catalogue drawers lines the second turn of the stair, every card typed on a station ticket machine and filed by owner, never by subject. Char pulls the drawer marked C and finds herself not there. CHARYBDIS: see SCYLLA (custody). See CROWN (property). See TIDE GATE. The next card along says the same thing in a different typeface and a different date. A third says only: see LOSSES, see RETURNS, cross-reference pending. Scylla reads over her shoulder and says nothing at all.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, holds a pulled catalogue drawer full of typed ticket-stock cards in a dim spiral stairwell lined with tiny brass-handled drawers, Scylla, her identical twin with aquamarine scales and a pearl circlet, reading over her shoulder by lamplight',
    autoChoiceId: 'count-the-cards',
    choices: [
      {
        id: 'count-the-cards',
        label: 'Count how many cards file you under someone else',
        outcome:
          'Forty-one cards. Sister, Crown, gate, court, oracle, and one that just says ‘household’. There is no card that says see CHARYBDIS. Char slides the drawer home with one finger, gently, the way you close a door on someone sleeping who you would very much like to shout at.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of Char’s black-lace-sleeved hand fanning through typed catalogue cards in a brass drawer, one card lifted to the lamplight showing a typed cross-reference',
      },
    ],
  },
  {
    id: 'WR-03',
    title: 'The Clean Copy Shelf',
    kind: 'treasure',
    speaker: 'Char and Scylla',
    opening:
      'One shelf on the third turn is gilt-edged and dusted: the court’s authorised account of the escape night, bound in pearl-white sharkskin, one volume per ruling. Its spine reads THE PRINCESSES WERE NEVER ABSENT, and in a later binding, THE PRINCESSES WERE BRIEFLY ABSENT, and in the latest, THE MATTER IS UNDER REVIEW. Tucked into the reading niche beside it, where some clerk once ate lunch, is a stoppered flask of lamp oil and a crust of kelp bread gone to stone.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, reaches into a small reading niche for a stoppered oil flask beside a gilt shelf of pearl-white bound volumes in a dark stairwell, Scylla with aquamarine scales and a pearl circlet raising the lamp to read their spines',
    choices: [
      {
        id: 'take-the-oil',
        label: 'Take the clerk’s flask and fill the lamp',
        outcome:
          'Scylla tops up the lamp with the concentration of someone defusing it. The flame climbs, and the Well gets three turns deeper all at once, now that they can see it. Somebody’s lunch oil. Char leaves the stone bread as a fair exchange and refuses to discuss it.',
        gain: { battery: 2 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet carefully pouring oil from a stoppered flask into a brass lamp, the flame brightening, Char in black lace watching with folded arms beside a reading niche',
      },
      {
        id: 'take-the-clean-copy',
        label:
          'Take the latest clean copy as proof of how often the court changed its mind',
        outcome:
          'THE MATTER IS UNDER REVIEW is heavier than it looks, mostly blank pages bound in a hurry. Char tucks it under her arm. If anyone asks what the court believes, she can now hand them the court, which will annoy everyone in exactly the right order.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace with dark violet scales pulling a pearl-white bound volume from a gilt shelf, its pages fluttering open to show mostly blank paper, lamplight across the spines',
      },
    ],
  },
  {
    id: 'WR-04',
    title: 'Lost Property, Lower Branch',
    kind: 'companion',
    speaker: 'Char and Conductor Ottoline Fitch',
    opening:
      'A brass ticket booth has wedged itself between two shelves on the fourth turn, and inside it is Conductor Ottoline Fitch, the elderly hermit crab who runs Pearl Station. ‘Drains,’ she says, before anyone asks. ‘The station floods, things wash down, things land here. The Well’s rule and my rule have got into the same booth. Ninety tides unclaimed and an item goes to the Crown.’ She taps a laminated sign that says exactly that. ‘Including people, apparently. I have objected in writing.’',
    artSubject:
      'Conductor Ottoline Fitch, an elderly hermit crab whose shell is a brass ticket booth, peers out of her booth wedged between shelves of labelled drawers in a dark well, as Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, leans on its counter and Scylla with aquamarine scales holds the lamp',
    echoes: [
      {
        flag: 'e11:7,1:keep-the-coat',
        text: 'Behind Fitch’s glass, on a hook, hangs a heavy pearl crown with her own tag still on it: UNCLAIMED, SAFE. ‘Came down with the last flood,’ she says. ‘I keep my promises in any building.’',
      },
      {
        flag: 'e11:1,1:archive-both-faces',
        text: 'Two stamped receipts are pinned inside the booth, copies of the ones she put under the platform mirror: WITNESS ONE, WITNESS TWO, NEITHER DISMISSED. ‘I file in duplicate,’ Fitch says. ‘Down here, it’s self-defence.’',
      },
    ],
    choices: [
      {
        id: 'ask-for-a-claim-ticket',
        label:
          'Ask Fitch for a blank claim ticket, in case you need to claim something',
        outcome:
          'Fitch tears one off the roll and stamps it LOWER BRANCH, CLAIMANT TO COMPLETE. ‘Fill in what you’re claiming and who you are,’ she says. ‘In that order, or the Well gets clever.’ Char tucks it into her lace cuff. It is the first form anyone has handed her that leaves the name blank for her.',
        gain: { trust: 1 },
        artSubject:
          'An elderly hermit crab with a brass booth shell stamping a paper claim ticket with a heavy claw, Char in black lace holding out her hand for it across the counter',
      },
      {
        id: 'ask-what-was-handed-in',
        label: 'Ask what has been handed in under your name',
        outcome:
          'Fitch consults a ledger. ‘One hairclip, skull-shaped, child’s. One slate, cracked. One second-best tail comb. And a folder of statements about you that I refused to log as property, because they aren’t yours, they’re about you.’ The Well, she adds, accepted them anyway.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'An elderly hermit crab in a brass booth running a claw down a long ledger column while Char with dark violet scales and black lace reads upside down across the counter',
      },
      {
        id: 'buy-a-wick',
        label: 'Trade a lace button for one of Fitch’s spare lamp wicks',
        outcome:
          'The button is jet, from Char’s best cuff. Fitch weighs it, approves, and hands over a wick still in its paper. Scylla fits it and the lamp steadies. Char’s cuff now flaps in the current, which she insists was the look she wanted.',
        gain: { battery: 1, trust: -1 },
        artSubject:
          'Char in black lace twisting a jet button off her cuff and passing it across a brass booth counter to a hermit crab, who holds out a paper-wrapped lamp wick in one claw',
      },
    ],
  },
  {
    id: 'WR-05',
    title: 'The Book-Lift Landing',
    kind: 'shortcut',
    speaker: 'Char and Scylla',
    opening:
      'On the fifth landing a record lift waits in its shaft: a brass cage on a chain, the kind the court uses to haul volumes up to the throne room for rulings. Its call button is a pearl worn flat by thumbs. Pressing it does nothing; the chain is jammed somewhere far below, and the cage hangs a hand’s width off its stop, ticking. Up the shaft comes warm air and a voice, very small and very patient, reading out names with owners attached.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, presses a worn pearl call button beside an empty brass book-lift cage hanging askew in a dark shaft off a coral landing, Scylla with aquamarine scales and a pearl circlet leaning to look down the shaft with her lamp',
    choices: [
      {
        id: 'chalk-a-skull',
        label:
          'Chalk one of your skulls on the cage so you know it if you see it again',
        outcome:
          'A small skull, slightly lopsided, grinning at the bars. Char has drawn them on everything she has ever meant to come back to. Scylla says the court will call it vandalism. Char says the court files everything; it can file this under art.',
        gain: { danger: -1, trust: 1 },
        artSubject:
          'Char in black lace drawing a small lopsided chalk skull on the brass bars of a book-lift cage, her aquamarine twin holding the lamp and fighting a smile',
      },
      {
        id: 'listen-down-the-shaft',
        label:
          'Hang your head into the shaft and listen to the voice reading names',
        outcome:
          '‘Dulse, merchild, in trust of the station. Teodor, diver, in trust of the night shift. Charybdis, princess, in trust of her sister, cross-reference pending.’ The voice pauses, as if it felt the lamp. ‘Is someone above my shelves?’ Char pulls her head back out very quickly.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char with dark violet scales and black lace hanging head-first into a dark lift shaft beside a brass cage, hair drifting upward in warm air, her aquamarine twin gripping her tail',
      },
    ],
  },
  {
    id: 'WR-06',
    title: 'The Portrait Niche',
    kind: 'choice',
    speaker: 'Char and Scylla',
    opening:
      'The stair widens around a niche where the court hangs the portrait it uses in evidence: the twins at fourteen, in the heavy pearl crowns, on the sitting bench. Char remembers that sitting. The crown itched, the painter hummed, and she kicked Scylla under the bench for an hour. But in this copy one sister’s place has been scraped to a pale outline, and the brass plates beneath disagree: one reads THE PRINCESSES, the other THE PRINCESS AND HER SISTER’S LIKENESS. The second plate sits in shadow.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, faces a large old portrait of two crowned mermaid girls on a bench in which one figure has been scraped to a pale outline, Scylla with aquamarine scales and a pearl circlet beside her holding a lamp toward two brass plates beneath it',
    echoes: [
      {
        flag: 'e11:7,3:add-the-lining',
        text: 'Oren’s card from the archive is still in her satchel: lining stitched by Char, age fourteen, angry, skulls deliberate. It was the same year as this sitting. She was angry about this, too.',
      },
    ],
    choices: [
      {
        id: 'tell-the-sitting',
        label: 'Tell the portrait what you remember of the sitting, out loud',
        outcome:
          '‘The crown itched. The painter hummed off-key. I kicked her under the bench for an hour and she never once kicked back, which was worse.’ Scylla snorts despite herself. The pale outline does not change, but the Well has heard an account in Char’s own voice and has nowhere to file it.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Char in black lace gesturing at an old portrait of two crowned mermaid girls as she speaks, her aquamarine twin beside her laughing with a hand over her mouth, lamplight on the scraped outline',
      },
      {
        id: 'read-the-shadow-plate',
        label:
          'Bring the lamp close and read the small print on the shadowed plate',
        outcome:
          'Under the main line, scratched in two different hands: Likeness retained for the grieving. Likeness retained for the rejoicing. Both lines dated the same tide. Scylla goes very still. Char reads it twice, copies both exactly, and does not let either one tell her what she is.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lamp oil to read in the shadow',
        artSubject:
          'Close view of a tarnished brass plate beneath an old portrait, two lines of scratched writing in different hands lit by a lamp held very near, a black-lace cuff at the edge of frame',
      },
      {
        id: 'turn-it-to-the-wall',
        label: 'Turn the portrait to face the wall',
        outcome:
          'It is heavier than it looks and swings on its cord with a long complaining creak. Now it shows only canvas back and a stamp: EVIDENCE, DO NOT TURN. Char has turned it anyway. The court will notice, but at least the outline isn’t watching her on the way down.',
        gain: { danger: -1, evidence: -1 },
        artSubject:
          'Char with dark violet scales and black lace heaving a large framed portrait around on its cord so its stamped canvas back faces outward, her aquamarine twin steadying the frame',
      },
    ],
  },
  {
    id: 'WR-07',
    title: 'The Lending Desk',
    kind: 'choice',
    speaker: 'Char and Scylla',
    opening:
      'Below the first spiral the Well opens into a lending floor, and at its centre a long desk of black coral keeps the court’s loan slips in a spiked file. Courtiers borrow versions of the escape night here to quote in rulings, and each borrowed volume is tied by a thread to a red paper lantern, so it can always be found. Char lifts the spike. The top slip reads THE NIGHT THEY STAYED, borrowed by the Chamberlain, eleventh time this season, due back yesterday.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, lifts a spike of paper loan slips from a long black coral desk in a vaulted underwater lending hall where red paper lanterns hang on threads over empty shelf gaps, Scylla with aquamarine scales and a pearl circlet holding a lamp beside the desk',
    choices: [
      {
        id: 'read-the-borrowers',
        label: 'Read every slip and learn who has been borrowing which night',
        outcome:
          'The Chamberlain borrows the night they stayed. Two admirals borrow the night they left. A clerk nobody has heard of has borrowed the night she was told, every single week, and never quoted it in anything. Char memorises the clerk’s name. Every slip she reads makes a small bell ring somewhere upstairs.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace with dark violet scales leafing through a fan of paper loan slips at a coral desk, a red lantern overhead swinging on its thread as if tugged',
      },
      {
        id: 'cross-check-the-slips',
        label:
          'Match the loan dates against the court logs you read at the lip',
        outcome:
          'Char knows these dates. Every loan of THE NIGHT THEY STAYED lands the day before a ruling against her, and every loan of THE NIGHT THEY LEFT the day before a ruling for. The court has not been consulting its history. It has been shopping in it. She writes the pattern on the back of a slip and keeps it.',
        gain: { evidence: 2 },
        requires: { entry: 'oracle-tested' },
        lockedHint: 'Only if you checked the court logs before descending',
        artSubject:
          'Char with dark violet scales and black lace writing a column of dates on the back of a loan slip, the coral desk spread with slips laid in two neat rows, her aquamarine twin leaning in with the lamp',
      },
      {
        id: 'recall-the-loans',
        label: 'Stamp every outstanding loan RECALLED BY THE SUBJECT',
        outcome:
          'The stamp is right there, and Char uses it forty times. Up and down the hall the lantern threads twitch and begin to reel in, slowly, dragging the borrowed nights home from the throne room. Somebody upstairs will be mid-speech when their history leaves. They will know exactly who did it.',
        gain: { trust: 1, danger: 2 },
        artSubject:
          'Char in black lace slamming a heavy stamp onto a row of loan slips while red paper lanterns overhead begin to drift backward on their threads toward the dark shelves',
      },
    ],
  },
  {
    id: 'WR-08',
    title: 'The Drain Current',
    kind: 'hazard',
    speaker: 'Char and Scylla',
    opening:
      'Where the lending floor meets the wall, the station’s storm drain has broken through: a round tiled pipe with a platform number still on it, pouring cold water into the Well in a long hard muscle of current. Everything Pearl Station loses comes through here: tickets, a single shoe, an umbrella turning slowly inside out. The current sweeps across the only path to the lower shelves, and the lamp flame leans sideways in it like a frightened animal.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, clings to a shelf edge as a tiled station drainpipe gushes a powerful current across a dark well floor, tickets, a shoe and an inside-out umbrella tumbling past, Scylla with aquamarine scales and a pearl circlet shielding a guttering lamp behind her',
    choices: [
      {
        id: 'brace-and-cross',
        label: 'Brace against the shelves and cross hand over hand',
        outcome:
          'Char goes first, fingers in the drawer handles, and the current tries to take her tail out from under her the whole way. Halfway, the lamp gutters to a bead and Scylla swears in a way the court never taught her. They make it, bruised, a little poorer in oil, and both pretending it was nothing.',
        gain: { danger: 1, battery: -1 },
        artSubject:
          'Char in black lace hauling herself along a wall of drawer handles through a churning current, her aquamarine twin following with a lamp reduced to a tiny bead of flame',
      },
      {
        id: 'haul-on-the-throne-line',
        label:
          'Clip onto the line you tied to the throne and let it hold you both',
        outcome:
          'The line is still there, running up through the dark to a throne leg a long way above. Char clips on, then Scylla, a stroke behind as promised. The current hits them and the throne holds. Somewhere above, a courtier will notice the throne creaking toward the Well.',
        gain: { danger: -2 },
        requires: { entry: 'by-choice' },
        lockedHint: 'Only if you tied a line to the throne on the way down',
        artSubject:
          'Two mermaid sisters, one dark violet in black lace and one aquamarine with a pearl circlet, clipped one behind the other to a taut rope rising into darkness as a current streams past them',
      },
      {
        id: 'ride-the-current',
        label:
          'Let the current carry you down and see where the station’s losses go',
        outcome:
          'Char lets go. The drain throws her two shelves down and sideways into a heap of soaked tickets, every one stamped with a passenger’s name and the word UNCLAIMED. Scylla arrives a moment later, furious and upside down. They have found where the station’s lost people are filed.',
        gain: { danger: 2, evidence: 1 },
        artSubject:
          'Char with dark violet scales tumbling headfirst into a drift of soaked paper tickets on a lower shelf, her aquamarine twin flailing after her with the lamp held high, current streaming above',
      },
    ],
  },
  {
    id: 'WR-09',
    title: 'The Lantern Roost',
    kind: 'puzzle',
    speaker: 'Char and Scylla',
    opening:
      'Spare lanterns roost in a side gallery like sleeping bats, red Hoshimori paper gone soft in the water but burning anyway. Each was made to follow one record wherever it goes, so nothing in the Well is ever lost. One has unhooked itself and come to hover at Char’s shoulder, patient and warm. Its tag reads CHARYBDIS, NURSERY ROLL. Wherever she goes, it will go, and anyone who wants to find her only has to look for it.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, turns to look at a red paper lantern hovering at her shoulder in a low gallery where dozens of lanterns hang folded from the ceiling like sleeping bats, Scylla with aquamarine scales and a pearl circlet watching it warily',
    choices: [
      {
        id: 'keep-the-lantern',
        label: 'Let the lantern come along and light the way',
        outcome:
          'It is a good light, steady and red, and Scylla can bank the lamp at last. It also bobs at exactly Char’s height, labelled with her name, a beacon anyone in the Well can follow. Char calls it Nosy. Nosy does not seem to mind.',
        gain: { battery: 2, danger: 1 },
        artSubject:
          'Char in black lace swimming on through a dark gallery with a red paper lantern bobbing at her shoulder, her aquamarine twin turning down a brass lamp behind her',
      },
      {
        id: 'cut-the-lantern-loose',
        label:
          'Cut the lantern’s thread so nobody can track you by your nursery roll',
        outcome:
          'Char saws the thread on a shelf edge. The lantern drifts up into the roost and folds itself among the others, no longer anyone’s. Nobody can follow her now. Nobody can find her nursery roll either, including Char, and the Well marks it UNTRACED.',
        gain: { danger: -1, evidence: -1 },
        artSubject:
          'Char with dark violet scales sawing a fine red thread against a coral shelf edge as a paper lantern floats free above her toward a ceiling crowded with folded lanterns',
      },
      {
        id: 'ask-who-tied-it',
        label: 'Ask the lantern who tied it to you',
        outcome:
          'Lanterns cannot talk, but this one turns its tag over. On the back, in the round hand of a nursery clerk: tied at hatching, for her safety, by order. Nobody asked the baby. Char says that is fair, babies are terrible at forms, and keeps the tag.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'Close view of Char’s fingers turning over a paper tag hanging from a red lantern, small round handwriting on its back lit by the lantern’s own glow',
      },
    ],
  },
  {
    id: 'WR-10',
    title: 'The Ninety-Tide Bins',
    kind: 'treasure',
    speaker: 'Char and Conductor Ottoline Fitch',
    opening:
      'Fitch has followed them down by the back drains, booth and all, to the bins where unclaimed things wait out their ninety tides. Each bin has a chalked count. The one marked ONE TIDE LEFT holds a skull-shaped hairclip cut from shark tooth, a bundle of letters in Scylla’s hand tied with Scylla’s own ribbon, and a tide-chart someone has marked with a child’s careful crosses. Tomorrow all of it becomes the Crown’s. ‘Claims close at the bell,’ Fitch says. ‘I don’t make the rules. I just enforce them, sulkily.’',
    artSubject:
      'Conductor Ottoline Fitch, an elderly hermit crab whose shell is a brass ticket booth, points a claw at a chalk-numbered bin holding a skull hairclip, a ribboned bundle of letters and a marked tide-chart, as Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, leans over it',
    echoes: [
      {
        flag: 'WR-04:ask-for-a-claim-ticket',
        text: 'The claim ticket is still in Char’s cuff, blank where her name goes. Fitch eyes it. ‘One ticket, one item,’ she says. ‘Choose as if I’m writing it down. I am.’',
      },
    ],
    choices: [
      {
        id: 'claim-the-hairclip',
        label: 'Claim the skull hairclip as yours',
        outcome:
          'Char knows this one. Her sixth birthday, a shark tooth from the kitchen boy, and her own small fist filing it into a skull for a week. She says so, and Fitch writes it down word for word. It goes in her hair at once, crooked, which is how she wore it then.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Char in black lace clipping a small carved skull hairclip crookedly into her dark hair while a hermit crab in a brass booth writes on a claim slip',
      },
      {
        id: 'give-scylla-the-letters',
        label:
          'Leave your own things and tell Scylla to claim her letters herself',
        outcome:
          'Scylla hesitates, then fills in the form in her neatest hand and takes back her letters. She does not say who they were written to. Char does not ask. The hairclip goes to the Crown at the bell, and Char watches it go with her chin up.',
        gain: { trust: 2, evidence: -1 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet clutching a ribboned bundle of letters to her chest beside a brass booth, Char in black lace standing back with her arms folded',
      },
      {
        id: 'take-the-tide-chart',
        label: 'Claim the child’s tide-chart, since nobody else has',
        outcome:
          'The crosses mark night-shift times and safe stretches of track, the way a careful child might plan a route for someone she loves. Fitch frowns. ‘That’ll be Dulse’s. She lost it in the flood.’ Char claims it for Dulse, in Dulse’s name, and Fitch allows it, grumbling.',
        gain: { evidence: 1, danger: -1 },
        artSubject:
          'Char with dark violet scales holding up a tide-chart marked with small careful crosses beside a brass ticket booth, a hermit crab peering at it through her spectacles',
      },
    ],
  },
  {
    id: 'WR-11',
    title: 'The Warm Carrel',
    kind: 'rest',
    speaker: 'Char and Scylla',
    opening:
      'A reading carrel is built over a crack in the Well floor where warm water seeps up from a vent, and some long-dead clerk padded its bench with kelp. The sisters fit on it shoulder to shoulder, just. Scylla sets the lamp between their tails and the light makes a small room inside the big dark one. For a while neither speaks. It is the first time today nobody, not a mirror or a conch or a card, has told Char who she is.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, sits shoulder to shoulder with Scylla, her identical twin with pale aquamarine scales and a pearl circlet, on a kelp-padded bench in a tiny coral reading carrel, a lamp glowing between their tails and warm shimmering water rising from a crack below',
    choices: [
      {
        id: 'trim-the-wick',
        label: 'Trim the lamp wick and let it burn steadier in the warm water',
        outcome:
          'Scylla does it the way their governess taught them, and Char critiques her technique the way their governess also taught them. The flame settles tall and clear. It is a small, stupid, perfect ordinary thing, and they both know it.',
        gain: { battery: 1, danger: -1 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet trimming a lamp wick with tiny scissors while Char in black lace leans in pointing critically, both lit by a tall steady flame',
      },
      {
        id: 'sit-in-silence',
        label: 'Say nothing and let Scylla say nothing too',
        outcome:
          'Scylla’s shoulder is warm and knobbly against hers, exactly as it was on the sitting bench at fourteen. Neither of them explains anything. When they get up again, Scylla touches her arm once, briefly, the way you check a rope is still tied.',
        gain: { trust: 1 },
        artSubject:
          'Two mermaid sisters, dark violet in black lace and aquamarine with a pearl circlet, sitting in silence on a tiny bench with their heads tipped together, a lamp burning low at their tails',
      },
      {
        id: 'ask-why-she-came',
        label: 'Ask Scylla why she really came down here',
        outcome:
          '‘Because most of what’s down here is about you, and I didn’t want you reading it alone,’ Scylla says. ‘And some of it is about me. I didn’t want you reading that alone either.’ She will not say which parts. Char has her answer and a new question, which is how Scylla answers everything.',
        gain: { evidence: 1, trust: -1 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet looking down at her own hands as she speaks, Char in black lace watching her sidelong from the other end of a small lamplit bench',
      },
    ],
  },
  {
    id: 'WR-12',
    title: 'Where the Stair Gives Out',
    kind: 'lore',
    speaker: 'Char',
    opening:
      'The spiral stair ends in splinters. Below it the Well wall has burst inward, and through the breach come roots: pale, enormous, bark-skinned, the roots of a forest house that has no business being under the sea. They have grown straight through the shelving. Where a root has wrapped a drawer, the drawer has turned to wood and its label has grown over with bark, the words still legible underneath, held as tight as a wolf holds a road.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, grips a massive pale bark-skinned root where a broken spiral stair ends above a dark drop, the roots bursting through a cracked well wall and wrapping around drawers that have turned to wood',
    echoes: [
      {
        flag: 'WR-09:keep-the-lantern',
        text: 'Nosy bobs down the breach ahead of her, lighting the roots red. Far above, another light has begun to move along the lending floor, following it.',
      },
      {
        flag: 'WR-07:recall-the-loans',
        text: 'Above her the recalled volumes are still reeling home on their threads, a slow procession of red lanterns climbing down the shaft behind them.',
      },
    ],
    autoChoiceId: 'climb-down-the-roots',
    choices: [
      {
        id: 'climb-down-the-roots',
        label: 'Climb down the roots into the lower stacks',
        outcome:
          'The bark is warm, as though the house it belongs to were still standing in sunlight somewhere. Char runs a hand over a wooden drawer on the way down and reads the label through its bark: HELD. Whatever the roots grip, the Well can no longer rewrite.',
        gain: { evidence: 1 },
        artSubject:
          'Char in black lace climbing hand over hand down a pale knotted root past a drawer swallowed in bark, her aquamarine twin following with a lamp from the broken stair above',
      },
    ],
  },
  {
    id: 'WR-13',
    title: 'The Rooted Shelf',
    kind: 'puzzle',
    speaker: 'Char and Scylla',
    opening:
      'One root has grown along an entire shelf of the escape night, and it is still growing, slowly, the way roots do when nobody is watching. Half the drawers are already wood: HELD. The root’s tip is curling toward the rest, toward THE NIGHT THEY LEFT and THE NIGHT SHE WAS TOLD and THE NIGHT THEY STAYED, and whichever it closes on will never be rewritten again. Scylla puts her hand on the bark. ‘If it holds one,’ she says, ‘nobody can take it from you.’',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, watches a pale root tip curling toward a row of labelled drawers along a shelf half swallowed in bark, Scylla with aquamarine scales and a pearl circlet resting her hand on the root beside her, lamplight on the wooden drawer fronts',
    echoes: [
      {
        flag: 'e11:4,2:pin-testimony-card',
        text: 'Char still has blank cards left over from the treasury, the kind she pinned beside every bitten roll. Char was here and wrote this herself. The root is reaching for paper; it might not mind which.',
      },
    ],
    choices: [
      {
        id: 'prune-the-root',
        label: 'Cut the root back before it holds any version fast',
        outcome:
          'Char saws at the tip with the edge of a broken drawer until it parts and weeps sap. Scylla takes her hand off the bark and does not speak to her for twenty strokes. Every night on the shelf stays loose, and loose things in this Well can still be rewritten by anyone.',
        gain: { danger: 1, trust: -1 },
        artSubject:
          'Char in black lace sawing through a pale root tip with a jagged piece of wood, sap clouding the water, her aquamarine twin turning away with her arms wrapped around herself',
      },
      {
        id: 'feed-it-a-card',
        label:
          'Write a card in your own hand and give the root that to hold instead',
        outcome:
          'She writes: Char read these labels and decided nothing yet. The root tip finds the card, wraps it and turns it to wood, and the label surfaces through the bark in her crooked letters. It is the only thing on the shelf that is unarguably true. Scylla reads it and lets out a long breath.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'A pale root tip curling around a small handwritten card held up by Char in black lace, bark spreading over the paper, her aquamarine twin leaning close with a lamp',
      },
      {
        id: 'let-the-root-choose',
        label: 'Leave the root to grow where it will and swim on',
        outcome:
          'Char does not watch which drawer it closes on. Scylla does, and says nothing about it, and Char decides that is Scylla’s to carry. Somewhere behind them one version of the night has become permanent, and nobody chose it, which is how most history gets made.',
        gain: { danger: -1, evidence: -1 },
        artSubject:
          'Char with dark violet scales swimming away down a dark root-choked aisle with her eyes fixed ahead, her aquamarine twin lingering to watch a root close over a drawer behind them',
      },
    ],
  },
  {
    id: 'WR-14',
    title: 'The Little Conch',
    kind: 'choice',
    speaker: 'Char and a fallen Tide Oracle',
    opening:
      'A small conch has fallen down the Well from some plinth above and lodged in the roots, cracked along one whorl, and it has been prophesying to the shelves for days with nobody to listen. Now it has an audience. ‘She will come out belonging to her sister,’ it announces, in a voice like a drain with ambitions. ‘Or to the court. Or to the hand that rewrote the tides. Probably the sister. Sisters are very likely.’ It seems pleased to have said so.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, regards a small cracked glowing conch wedged among pale roots and wooden drawers, bubbles rising from its mouth as it speaks, Scylla with aquamarine scales and a pearl circlet behind her raising one eyebrow',
    echoes: [
      {
        flag: 'e11:6,1:argue-the-premise',
        text: 'Char has already told one oracle in front of a whole queue that a forecast is not a deed. This one is smaller and has clearly heard about it.',
      },
      {
        flag: 'e11:6,1:refuse-to-pick',
        text: 'She walked away from the big conch on the platform without choosing an owner. This one has saved its list for her, in case she changed her mind.',
      },
      {
        flag: 'e11:6,3:rewrite-line-44',
        text: '‘The man with the axe has been struck out,’ it adds, sulkily. ‘So that leaves fewer owners. Which makes the sister likelier still.’',
      },
    ],
    choices: [
      {
        id: 'argue-with-it',
        label: 'Ask it what belonging means, and keep asking until it runs out',
        outcome:
          'Belonging means filed under, it says. Filed under means held in trust. Held in trust means looked after. Looked after means, and it stops, because it has walked itself into a definition that includes being asked. Char thanks it warmly. The conch sulks loudly enough to carry upward.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace with dark violet scales leaning on a root with her chin in her hand, interrogating a small cracked conch that has gone dim and sullen, her aquamarine twin hiding a smile',
      },
      {
        id: 'quote-the-tally',
        label:
          'Tell it the oracle above was wrong nine times in ten, and show your chalk',
        outcome:
          'Char still has chalk on her fingers from the lip. She draws the tally on the conch’s own shell, nine crosses and one tick. The little oracle reads itself, goes quiet, and finally says, ‘Then I would like to revise my forecast to: unclear.’ Char says that is the first honest prophecy she has heard all week.',
        gain: { trust: 1, danger: -1 },
        requires: { entry: 'oracle-tested' },
        lockedHint: 'Only if you tallied the oracle’s record before descending',
        artSubject:
          'Char with dark violet scales chalking a row of small crosses onto the curve of a cracked glowing conch wedged in roots, the conch’s light dimming in embarrassment',
      },
      {
        id: 'file-it-unowned',
        label: 'Put the conch in an empty drawer labelled PREDICTION, NOBODY’S',
        outcome:
          'It protests all the way into the drawer and keeps protesting through the wood. Char writes the label herself. The Well accepts it at once: a prediction is the one thing down here that has never belonged to anyone. The muffled forecasting follows them down the roots for a long time.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Char in black lace sliding a small protesting conch into an empty wooden drawer and pressing a handwritten label to its front, bubbles leaking from the drawer’s seams',
      },
    ],
  },
  {
    id: 'WR-15',
    title: 'Gorse in the Roots',
    kind: 'companion',
    speaker: 'Char, Scylla and Gorse',
    opening:
      'A whelk shell has rolled down the Well and jammed in a fork of roots, and from its mouth a Briar wolf’s grey muzzle is growling at the dark. It is Gorse, who swears he came down on purpose. In his teeth is an envelope he found in the roots, addressed in faded nursery ink To the one who answers for Charybdis. ‘Briar law,’ he says through it. ‘A letter goes to the one who answers. Not to the one who is told they’re the answer.’ Scylla’s hand is already half raised, out of habit.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, faces a large whelk shell jammed in pale roots from which a grey Briar wolf’s muzzle holds out an old envelope in its teeth, Scylla with aquamarine scales and a pearl circlet beside her with one hand half raised',
    echoes: [
      {
        flag: 'e11:3,1:escort-the-shell',
        text: 'The rope sling Char rigged for his shell on the platform is still knotted round it, frayed now. ‘You carried me once,’ Gorse says. ‘That’s not a debt. It is a fact. I keep facts.’',
      },
      {
        flag: 'e11:3,1:call-for-the-answer',
        text: '‘You read the board backwards for me once until the right hand went up,’ Gorse says. ‘Your turn to be asked.’',
      },
    ],
    choices: [
      {
        id: 'answer-for-yourself',
        label: 'Raise your own hand and answer for yourself',
        outcome:
          '‘I answer for me,’ Char says. Gorse sniffs her for a long moment, then drops the letter in her palm. It is from their old nurse, a list from when they were small: S. hums when frightened. C. hates the dark and won’t say. Leave her a light. Char did not know anyone knew. Scylla, very quietly, turns the lamp up.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Char in black lace holding an old unfolded letter in faded nursery ink, a grey wolf muzzle watching from a whelk shell, her aquamarine twin reaching to turn up a brass lamp',
      },
      {
        id: 'let-scylla-answer',
        label: 'Let Scylla answer for you, the way she always has',
        outcome:
          '‘I do,’ Scylla says, and then looks horrified at herself. Gorse gives her the letter, because that is the law. She reads it, folds it, and gives it to Char unopened again, saying it is a nursery list. Char reads it later alone. Neither of them mentions who it went to first.',
        gain: { evidence: 1, trust: -1 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet taking an envelope from a wolf’s teeth with a stricken face, Char in black lace beside her looking at the roots instead',
      },
      {
        id: 'free-gorse-first',
        label: 'Free Gorse from the roots first and let the letter wait',
        outcome:
          'It takes both sisters and most of their tempers to lever the shell out of the fork. Gorse rolls free, shakes himself inside the whelk, and keeps the letter. ‘When somebody answers,’ he says, and trundles ahead of them down the roots, a wolf on a road again.',
        gain: { trust: 2, evidence: -1 },
        artSubject:
          'Two mermaid sisters, dark violet and aquamarine, heaving together on a whelk shell wedged in pale roots as a grey wolf muzzle inside grins with an envelope in its teeth',
      },
    ],
  },
  {
    id: 'WR-16',
    title: 'The Fiche Reader',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'Someone’s research terminal has grown into a reading desk of coral: a grey Earth machine with a hooded screen, a tray of film cards and a lamp housing at the back where its bulb should be. Its label says MASTER INDEX, WELL OF RECORDS. Without light it shows only a faint green standby glow and one line, crawling: PLEASE SUPPLY ILLUMINATION. The film cards in the tray are labelled by owner, of course. Char finds hers in eleven different drawers.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, sits at a coral reading desk that has grown around a grey Earth microfiche reader with a hooded glowing green screen, holding a small film card up to its faint light, a tray of film cards at her elbow',
    choices: [
      {
        id: 'feed-it-oil',
        label: 'Pour lamp oil into its housing and read the full index',
        outcome:
          'The machine drinks the oil and blazes. Every version of the escape night scrolls past in rows: version, owner, witness, court ruling, subject’s own account. The last column is empty on every row. Not disputed. Not sealed. Empty. Nobody has ever asked her, in any version, in any drawer.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lamp oil to light the machine',
        artSubject:
          'A grey microfiche reader blazing with light inside a coral desk, its screen filled with rows of a table whose last column is blank, Char in black lace leaning close with the glow on her face',
      },
      {
        id: 'read-by-standby',
        label: 'Squint through the film cards one by one in the standby glow',
        outcome:
          'It takes an hour and gives her a headache. She gets owners and dates and very little else. The machine hums the whole time, a long Earth hum that carries a surprising way down through the roots, and somewhere below a patient voice stops reading names to listen.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char with dark violet scales rubbing her eyes beside a faintly green-lit screen, a scatter of small film cards across a coral desk, darkness pressing close around the glow',
      },
    ],
  },
  {
    id: 'WR-17',
    title: 'Where the Silt Breathes',
    kind: 'hazard',
    speaker: 'Char and Scylla',
    opening:
      'At the bottom of the roots the water turns cloudy and faintly bright. Silt is rising from the depths in slow breaths, each grain a splinter of history somebody left unfinished, and wherever it settles it writes. It has written on the roots in three hands. It is writing on Scylla’s lamp-glass now, a line of court script that was not there a moment ago. It settles on Char’s arm, cold, and begins a sentence.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, holds up her arm as faintly glowing silt settles on it and forms a line of small script on her skin, in a cloudy bright water among root ends, Scylla with aquamarine scales and a pearl circlet staring at writing appearing on her lamp glass',
    choices: [
      {
        id: 'read-what-it-writes',
        label: 'Hold still and read what the silt is writing on you',
        outcome:
          'In court hand, along her forearm: On the night of the gate, Charybdis, and there it stops, the splinter unfinished, waiting for someone to supply the rest. Scylla goes white. Char looks at the sentence for a long moment, then licks her thumb and rubs it out. ‘Not yours to finish,’ she tells the silt.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Close view of Char’s forearm in torn black lace with a half line of glowing court script on the skin, her thumb pressed to it smearing the letters, silt drifting past',
      },
      {
        id: 'shield-the-satchel',
        label:
          'Wrap yourself around your satchel so the silt can’t write on your papers',
        outcome:
          'Char curls over the satchel like a sea urchin. The silt writes all over her back instead, lines she will never read. Everything she has gathered stays in her own words. Scylla brushes her down afterwards and won’t tell her what any of it said.',
        gain: { danger: 1, trust: 1 },
        artSubject:
          'Char in black lace curled tightly around a leather satchel in cloudy glowing water, faint script spreading across her shoulders, her aquamarine twin reaching out to brush it away',
      },
      {
        id: 'dash-through',
        label: 'Turn the lamp up high and swim through fast before it settles',
        outcome:
          'The bright flame drives the silt back a stroke, enough to get through with only a few grains on their tails. The lamp burns greedily for it. On the far side Scylla checks her glass. It says only one word now, in a hand nobody owns: hurry.',
        gain: { danger: -1, battery: -1 },
        artSubject:
          'Two mermaid sisters racing through cloudy glowing water behind a lamp turned up high, a ring of clear water around the flame and silt swirling at its edges',
      },
    ],
  },
  {
    id: 'WR-18',
    title: 'The Bottom of the Book-Lift',
    kind: 'shortcut',
    speaker: 'Char and Scylla',
    opening:
      'The book-lift shaft comes down here, warm with vent water, and the reason the cage is stuck is plain: a Briar root has grown through the chain and wound it into the bark. Above, five landings up, the cage ticks on its stop. A grease-black lever on the wall reads RELEASE, and the root has nearly grown over that too. Free the chain and the shaft is a straight run back up to the stair. Leave it, and the root holds the lift forever.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, braces at the base of a narrow warm shaft where a pale root has grown through a heavy lift chain beside a grease-black release lever, Scylla with aquamarine scales and a pearl circlet lighting the chain with her lamp',
    echoes: [
      {
        flag: 'WR-05:chalk-a-skull',
        text: 'Far up the shaft, by lamplight, a tiny lopsided chalk skull grins down at her from the cage bars.',
      },
      {
        flag: 'WR-05:listen-down-the-shaft',
        text: 'Down here the patient voice is closer and clearer, coming from somewhere below the vent: names, owners, names, owners.',
      },
    ],
    choices: [
      {
        id: 'shortcut-back',
        label: 'Saw the chain free of the root and throw the release lever',
        outcome:
          'The root gives with a crack. Char hauls the lever, the chain shrieks, and the cage drops five landings to land at her tail with a bang that echoes up and down the Well. The shaft is open now, a straight way back up to the stair. Everyone in the Well heard it open, too.',
        gain: { danger: 1, trust: 1 },
        artSubject:
          'A brass book-lift cage slamming down at the bottom of a shaft in a burst of bubbles and root splinters, Char in black lace hanging on a lever, her aquamarine twin shielding her lamp',
      },
      {
        id: 'leave-it-held',
        label: 'Leave the lift rooted and keep the shaft quiet',
        outcome:
          'Char leaves the root to its work. The cage stays where it is, five landings up, and nobody will be hauling rulings up and down this shaft for a while. There is no quick way back now. That is the point of going down.',
        gain: { danger: -1 },
        artSubject:
          'Char with dark violet scales turning away from a root-wound lift chain at the base of a warm dark shaft, her aquamarine twin glancing up toward a distant cage',
      },
    ],
  },
  {
    id: 'WR-19',
    title: 'The Gallery of Likenesses',
    kind: 'hazard',
    speaker: 'Char and Scylla',
    opening:
      'The roots open into a long gallery hung with mirrors, all the court’s, all tagged as evidence, and every one holds a Char. One is lit by floodlights. One wears a crooked homemade crown and is very small. One wears the heavy pearl crown and a face Char has never once made. They follow her down the gallery, each a breath behind, and the glass has a pull to it, like a current: look too long into any one of them and the Well will file you as that likeness.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, swims down a long underwater gallery of tagged mirrors, each reflection a different Char, one small in a crooked homemade crown, one lit by harsh floodlight, one in a heavy pearl crown, Scylla with aquamarine scales and a pearl circlet behind her with her eyes on the floor',
    echoes: [
      {
        flag: 'e11:1,1:tell-dulse-yourself',
        text: 'She told a child on a platform she was the one standing there, annoyed, with a haircut she chose. Every mirror in the gallery has the haircut wrong.',
      },
    ],
    choices: [
      {
        id: 'name-yourself-aloud',
        label:
          'Stop in the middle of the gallery and tell the glass who is standing in front of it',
        outcome:
          '‘The one in front of you is Char. She chose the lace. She is not taking questions.’ The pull slackens. The reflections keep their own faces but stop following. A court tag on the nearest mirror curls at the edge, as if something had been entered against it, and Char hopes it was a complaint.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Char in black lace planted in the middle of a mirrored gallery with her fists on her hips, speaking to the glass, the many reflections around her falling still',
      },
      {
        id: 'look-into-each',
        label: 'Hold the lamp to each mirror in turn and study what it shows',
        outcome:
          'She does it fast, one breath per mirror, and Scylla counts her out of each. Every likeness is dressed by someone else: the court’s pearls, the gate’s floodlight, a nursemaid’s idea of a crown. None of them chose anything. Char writes that down and keeps her eyes moving, and the glass lets her go.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lamp oil to see into the glass',
        artSubject:
          'Char with dark violet scales holding a lamp up to a tall mirror for the space of one breath, her aquamarine twin beside her counting on her fingers, a row of different reflections stretching away',
      },
      {
        id: 'cover-the-mirrors',
        label:
          'Throw drowned coats and umbrellas over the mirrors and swim through blind',
        outcome:
          'The drain has left plenty of lost coats down here. The sisters drape mirror after mirror until the gallery is a row of humped shapes. Nothing pulls at them. Nothing shows them anything either, and Char is fairly sure she missed something worth seeing.',
        gain: { danger: -1, evidence: -1 },
        artSubject:
          'Two mermaid sisters draping a soaked coat and an inside-out umbrella over a tall mirror in a long gallery of covered, humped shapes',
      },
    ],
  },
  {
    id: 'WR-20',
    title: 'Scylla’s Shell',
    kind: 'companion',
    speaker: 'Scylla and Char',
    opening:
      'At the gallery’s end Scylla stops and takes a small speaking-whelk from her sleeve, the kind courtiers use to carry sworn testimony. It is sealed with her own wax. ‘I said everything I saw into this,’ she says. ‘Before we came down. In case the Well tried to tell you my version for me.’ She holds it out, not quite steady. ‘It’s mine. If you hear it, it’s still mine. You don’t have to hear it at all. You decide.’',
    artSubject:
      'Scylla, a sturdy mermaid with pale aquamarine scales and a pearl circlet, holds out a small wax-sealed whelk shell in an unsteady hand to Char, her identical twin with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, at the end of a dim mirrored gallery, lamp light between them',
    choices: [
      {
        id: 'hear-it-as-hers',
        label:
          'Break the seal and listen, as Scylla’s testimony and nobody else’s',
        outcome:
          'Scylla’s voice comes out of the whelk small and certain, telling a night at a tide gate the way only someone who was there could. Char listens to the end and gives the shell back. ‘That’s yours,’ she says. ‘I believe you were there. I haven’t decided what it makes me.’ Scylla nods as if she had been hit, gently.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'Char in black lace holding a small open whelk shell to her ear with her eyes closed, her aquamarine twin watching her face with both hands pressed together',
      },
      {
        id: 'ask-her-to-keep-it',
        label: 'Ask Scylla to keep it sealed until you ask for it yourself',
        outcome:
          '‘Not here,’ Char says. ‘Not where everything is listening. Keep it until I ask.’ Scylla puts the shell away against her ribs. She looks relieved and bereft at the same time, which on her face is the same expression. Char will go into every room below without it.',
        gain: { trust: 2, evidence: -1 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet tucking a sealed whelk shell back into her sleeve while Char in black lace closes her twin’s fingers over it',
      },
      {
        id: 'witness-not-guardian',
        label:
          'Ask her to label it as you agreed at the lip: witness, not guardian',
        outcome:
          'Scylla scratches the words into the wax with a fingernail: WITNESS, NOT GUARDIAN. It is the same promise she made at the throne, now in a form the Well has to read. ‘Then it’s testimony about you,’ Char says, ‘not custody of you.’ Scylla laughs, wetly, and says she has always hated how good Char is at paperwork.',
        gain: { evidence: 1, trust: 2 },
        requires: { entry: 'by-choice' },
        lockedHint:
          'Only if Scylla swore to come down as witness, not guardian',
        artSubject:
          'Close view of an aquamarine-scaled hand scratching words into the wax seal of a small whelk shell with a fingernail, a black-lace cuff resting beside it',
      },
    ],
  },
  {
    id: 'WR-21',
    title: 'Two Pigeonholes',
    kind: 'lore',
    speaker: 'Char',
    opening:
      'A wall of brass pigeonholes holds the court’s outgoing post, never sent. One column is addressed to Scylla: letters of condolence, black-bordered, from every family at court. The column beside it is addressed to Char: letters of welcome home, gilt-edged, from the very same families, in the very same hands, dated the very same tide. The court wrote both, in advance, so as to be ready. Neither column has been posted. Both are stamped HOLD PENDING RULING.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, stands before a wall of brass pigeonholes holding two columns of unsent letters, one black-bordered and one gilt-edged, both bundles tied with identical court ribbon, lamplight across the brass',
    choices: [
      {
        id: 'read-one-of-each',
        label: 'Open one letter from each column, from the same sender',
        outcome:
          'Lady Weatherfin, black border: We grieve with you. Lady Weatherfin, gilt edge: We rejoice with you. The second paragraph of each is word for word the same, about seating at the next banquet. Char reads both aloud to the pigeonholes. They did not write to anyone. They wrote to the ruling.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace holding a black-bordered letter in one hand and a gilt-edged letter in the other, reading from both, a wall of brass pigeonholes behind her',
      },
      {
        id: 'return-to-sender',
        label:
          'Stamp both columns RETURN TO SENDER and leave them for the post',
        outcome:
          'The stamp says NOT KNOWN AT THIS ADDRESS, which Char finds she likes very much. Every letter in both columns gets one. When they go up, the court will open its own condolences and welcomes and have to decide which it meant. Char will not be helping.',
        gain: { trust: 1, evidence: -1 },
        artSubject:
          'Char with dark violet scales stamping a pile of black-bordered and gilt-edged letters with a heavy rubber stamp, ink blots drifting off in the water',
      },
    ],
  },
  {
    id: 'WR-22',
    title: 'The Copyist’s Bench',
    kind: 'choice',
    speaker: 'Char and Scrivener Murex',
    opening:
      'At a sloped bench under a hanging lamp, a cuttlefish in sleeve garters is copying a record with four arms at once. This is Scrivener Murex, paid by the page to bring the Well’s versions into line with each new ruling, and his skin ripples with whatever he last wrote, so that he wears the court’s current opinion like a pattern. Right now it scrolls in tidy court hand across his mantle. He does not look up. ‘Corrections go in the tray,’ he says. ‘Complaints go in the drain.’',
    artSubject:
      'Scrivener Murex, a cuttlefish in sleeve garters copying documents with four arms at once at a sloped wooden bench under a hanging lamp, lines of court script rippling across his skin, Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, leaning on the end of the bench',
    echoes: [
      {
        flag: 'WR-03:take-the-clean-copy',
        text: 'Murex’s eye swivels to the white volume under her arm. ‘Mine,’ he says. ‘I bound that one in a hurry. Most of it is blank because they had not decided yet.’',
      },
    ],
    choices: [
      {
        id: 'read-his-skin',
        label:
          'Hold the lamp close and read the ruling scrolling across his skin',
        outcome:
          'He flushes, but the words show anyway: Pending: the princess Charybdis to be filed in the custody of her sister, for her protection, without further testimony. Murex has been copying it all morning onto every version. Scylla reads it over Char’s shoulder and says, very quietly, that nobody asked her either.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lamp oil to read his shifting skin',
        artSubject:
          'A cuttlefish’s mantle lit up close by a lamp, a line of court script clearly legible rippling across it, Char in black lace reading with narrowed eyes and her aquamarine twin pale behind her',
      },
      {
        id: 'dictate-to-murex',
        label: 'Ask Murex to copy one sentence in your own words, for once',
        outcome:
          'He tries. Her sentence is: I will say what I am. His arms write it in court hand, and his skin turns it into I will be told what I am, and he stares at it, appalled, and tries again. The third attempt holds. He has never copied a first-person sentence before. He asks to keep it.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'A flustered cuttlefish scribe in sleeve garters staring at a page with two crossed-out lines and one clean line, Char with dark violet scales leaning over the bench pointing at it',
      },
      {
        id: 'pay-him-to-pause',
        label: 'Pay Murex a silver pearl to stop copying for one tide',
        outcome:
          'He considers it, sets down all four pens, and accepts with dignity. For one tide nothing in the Well will be brought into line. Murex starts a crossword. It is a small mercy bought with Char’s purse, and the ruling on his skin goes on scrolling anyway.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'A cuttlefish scribe in sleeve garters laying down four pens at a sloped bench and taking a silver pearl from Char’s black-lace-cuffed hand',
      },
    ],
  },
  {
    id: 'WR-23',
    title: 'The Reading Room Stove',
    kind: 'rest',
    speaker: 'Char and Conductor Ottoline Fitch',
    opening:
      'Somebody has lit the reading room stove, a squat iron thing fed by a vent, and set a kettle on it out of sheer stubbornness. Fitch’s booth is parked beside it. She has come down by the drains again and is drinking something hot from a station mug, her legs tucked in. ‘Last warm room before the silt,’ she says. ‘I come here when I need to remember that a lost thing is a thing someone is looking for. Sit. There’s oil in the can by the coal.’',
    artSubject:
      'Conductor Ottoline Fitch, an elderly hermit crab whose shell is a brass ticket booth, sips from a station mug beside a squat iron stove with a kettle in a cosy coral reading room, while Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, warms her hands and Scylla with aquamarine scales fills a lamp from a can',
    choices: [
      {
        id: 'fill-the-lamp',
        label: 'Fill the lamp from Fitch’s can',
        outcome:
          'Scylla fills it to the brim and Fitch notes the amount in her ledger, because of course she does. ‘Charge it to the station,’ she says. ‘The station lost you first.’ The lamp burns bright enough to make the room feel like somewhere people live.',
        gain: { battery: 2 },
        artSubject:
          'Aquamarine-scaled Scylla filling a brass lamp to the brim from an oil can by a glowing iron stove while a hermit crab in a brass booth writes in a small ledger',
      },
      {
        id: 'ask-about-the-keeper',
        label: 'Ask Fitch about the voice reading names below',
        outcome:
          '‘Nerissa Holdfast. Keeper of the Well, sixty years,’ Fitch says. ‘Grew into the bottom shelves so the silt couldn’t take them. Never lost a record in her life. Never given one back either.’ She sips. ‘She isn’t cruel. She’s frightened of the current. So am I. It just takes us differently.’',
        gain: { evidence: 1, danger: -1 },
        artSubject:
          'An elderly hermit crab in a brass booth speaking over the rim of a station mug while Char in black lace listens with her chin on her knees beside a glowing stove',
      },
      {
        id: 'tell-fitch-everything',
        label:
          'Tell Fitch everything you’ve found so far, so someone outside the Well knows',
        outcome:
          'Char tells her: the catalogue, the loans, the empty column, the ruling on Murex’s skin. Fitch listens and writes none of it down, which is how Char knows she means it. ‘If you don’t come up,’ Fitch says, ‘I’ll tell it. In your words. I’ll get them right.’',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'Char with dark violet scales talking with open hands beside an iron stove as an elderly hermit crab listens with her ledger deliberately closed on the counter',
      },
    ],
  },
  {
    id: 'WR-24',
    title: 'The Discard Chute',
    kind: 'shortcut',
    speaker: 'Char and Scylla',
    opening:
      'Behind the reading room a brass chute mouth gapes in the floor, labelled SUPERSEDED. Every version the court stops needing is dropped down it, and a draught of cold water pulls past the lip, smelling of silt. Char drops a pebble. It falls a long way, past the silt shelves entirely, and lands with a soft sound on something alive. The chute’s flap is held shut by a spring and a sign: STAFF AND DISCARDS ONLY. The aisle beside it slopes on into the silt.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, kneels beside a brass chute mouth in a dark floor labelled with an engraved plate, holding its sprung flap open as cold water pulls past, Scylla with aquamarine scales and a pearl circlet holding the lamp over the drop',
    choices: [
      {
        id: 'shortcut-down',
        label:
          'Wedge the flap open with a drawer and ride the chute down to the bottom',
        outcome:
          'Char jams a drawer under the spring and goes first, as a discard, in a shower of superseded rulings. Scylla follows with the lamp held up like a torch in a storm. The chute is fast and dark and drops them straight to the Well’s roots, leaving a way open behind them for anyone else.',
        gain: { danger: 1, evidence: -1 },
        artSubject:
          'Char in black lace shooting down a dark brass chute amid a whirl of loose paper rulings, her aquamarine twin sliding after her with a lamp held high',
      },
      {
        id: 'read-the-discards',
        label:
          'Fish out the papers caught on the lip and read what was thrown away',
        outcome:
          'Superseded: The princess Charybdis shall speak for herself at a hearing to be arranged. Dated years ago, stamped and then struck. Somebody once meant to ask her. Char folds it into her satchel with the other papers and lets the flap spring shut.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'Char with dark violet scales pulling a torn, struck-through ruling from the lip of a brass chute and reading it by lamplight, the sprung flap snapping shut beside her',
      },
    ],
  },
  {
    id: 'WR-25',
    title: 'The Silt Line',
    kind: 'hazard',
    speaker: 'Char and Scylla',
    opening:
      'Past the mirrors the floor tilts and the shelves go under. Silt has pooled here waist-deep on a mermaid, pale and faintly lit from within, and the lowest drawers stand in it like gravestones in snow. Every grain is a splinter of something unfinished. Where it stirs, it writes. The aisle to the Well’s bottom runs straight through it, and somewhere at the end the patient voice is still reading names, closer now, close enough to hear it breathe between them.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, hovers at the edge of a deep drift of pale faintly glowing silt that half buries rows of low drawers like gravestones in snow, Scylla with aquamarine scales and a pearl circlet behind her holding the lamp out over it',
    echoes: [
      {
        flag: 'WR-15:free-gorse-first',
        text: 'Gorse’s whelk shell has already ploughed a furrow through the silt ahead, straight as a Briar road. ‘Follow the wolf,’ he calls back. ‘Wolves don’t get filed.’',
      },
      {
        flag: 'WR-17:read-what-it-writes',
        text: 'Char’s forearm still tingles where the silt began its sentence. She keeps that arm out of the drift.',
      },
    ],
    choices: [
      {
        id: 'wade-by-lamplight',
        label:
          'Turn the lamp up and wade through where the light keeps the silt settled',
        outcome:
          'The silt shrinks from bright flame and lies quiet where the lamp falls. The sisters move in its circle, slowly, and arrive on the far side unwritten. The lamp has burned hard for it, and the dark ahead of them is very dark indeed.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lamp oil to hold the silt down',
        artSubject:
          'Two mermaid sisters moving slowly through deep pale silt inside a circle of bright lamplight, the silt lying flat and still where the light falls and stirring at the edges',
      },
      {
        id: 'rope-together',
        label: 'Rope yourselves together and feel your way through the drift',
        outcome:
          'Char ties the knot, Scylla checks it, and Char reties it out of principle. They go through half blind with the silt writing on both of them. Each time one stumbles, the rope jerks the other. They arrive covered in other people’s sentences, still tied.',
        gain: { danger: 1, trust: 1 },
        artSubject:
          'Char in black lace and her aquamarine twin roped waist to waist, wading through glowing silt that leaves faint script trailing across their scales',
      },
    ],
  },
  {
    id: 'WR-26',
    title: 'The Drawers of the First Night',
    kind: 'lore',
    speaker: 'Char and Scylla',
    opening:
      'Here, half under the silt, the Well keeps its oldest argument: the sisters’ first escape night, every version of it, one drawer each. THE NIGHT THEY LEFT. THE NIGHT THEY STAYED. THE NIGHT SHE WAS TOLD. Some are bark, held by the roots. Some are loose and sliding. Each has an owner’s seal: the Crown, the court, the gate, the sister. Scylla stops a stroke back and does not touch any of them. Char reads every label. None of them has her seal on it.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, reads the labels on a row of old drawers half buried in pale glowing silt, some turned to bark and some loose and tilting, each with a wax owner’s seal, Scylla with aquamarine scales and a pearl circlet holding back a stroke behind',
    choices: [
      {
        id: 'open-one-drawer',
        label: 'Open one drawer and see what the Well keeps about you',
        outcome:
          'Inside THE NIGHT SHE WAS TOLD are statements: a guard, a nursemaid, a kitchen boy, two clerks. One says she chose. One says she was too young to choose. One says she was asleep. Every one is about her and not one is from her. Char closes the drawer. ‘They agree I was there,’ she says. ‘That’s the only part I’d sign.’',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Char in black lace holding a sheaf of old written statements pulled from a silt-buried drawer, frowning at them by lamplight, her aquamarine twin looking away',
      },
      {
        id: 'relabel-the-row',
        label: 'Add a card to every drawer: ABOUT CHAR. NOT BY CHAR.',
        outcome:
          'Char writes the same five words eleven times and tucks a card under every seal. The Well does not like it; the cards curl at the corners. But anyone who opens these drawers now will read her first. Scylla watches her do the whole row and offers to hold the cards.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Char with dark violet scales tucking small handwritten cards beneath the wax seals of a row of silted drawers, her aquamarine twin holding a stack of blank cards ready',
      },
    ],
  },
  {
    id: 'WR-27',
    title: 'The Dredge Wheel',
    kind: 'hazard',
    speaker: 'Char and Scylla',
    opening:
      'A station drainage pump has fallen this far and been put to work: its great iron wheel turns in the silt, slow and endless, dredging any drawer nobody has claimed and grinding it into more silt. This is how splinters are made. The wheel’s next bucket is closing on a drawer labelled MAINTENANCE CREW, TIDE-GATE CROSSING, STATEMENTS, UNCLAIMED, and inside, Char can hear paper rustle like breathing. It is not her record. It is somebody’s.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, braces in churning silt as a huge iron pump wheel with rusted buckets turns toward a labelled drawer, Scylla with aquamarine scales and a pearl circlet reaching for the drawer with her lamp swinging',
    echoes: [
      {
        flag: 'e11:8,1:find-the-omitted',
        text: 'Char knows these names. She woke four of them in a flooded cupboard at the end of the line, rostered to pay and never told. The Well has filed their own statements as nobody’s.',
      },
    ],
    choices: [
      {
        id: 'claim-it-for-them',
        label:
          'Shout the crew’s names at the wheel and claim the drawer in their name',
        outcome:
          'Char reads the names off the label at the top of her lungs, one by one, and adds: claimed on their behalf, to be returned to them. The bucket stops a hand’s width away, considers, and swings past. The noise carries all the way down the Well to the voice below, which stops reading.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Char in black lace shouting at a great iron dredge wheel with one hand flat on a labelled drawer, a rusted bucket halted just short of it in a swirl of silt',
      },
      {
        id: 'jam-the-wheel',
        label:
          'Jam a root into the wheel’s spokes and stop it dredging anything',
        outcome:
          'The root goes in, the wheel bucks, groans and stops dead. Nothing more will be ground to silt today, the crew’s statements included. The silence afterwards is enormous, and every loose drawer in the Well settles a little deeper, as though something below had noticed it.',
        gain: { danger: 2, evidence: 1 },
        artSubject:
          'Char with dark violet scales ramming a thick pale root between the spokes of an iron pump wheel as it shudders to a halt in a cloud of silt, her aquamarine twin pulling a drawer clear',
      },
      {
        id: 'send-it-up-the-line',
        label:
          'Clip the drawer to the throne line and send it up to court, out of the wheel’s reach',
        outcome:
          'The line from the throne still runs through the Well. Char clips the drawer on and Scylla hauls, hand over hand, until it rises out of the silt and away into the dark above. It will arrive in the throne room in the middle of something, labelled with names the court never meant to read aloud.',
        gain: { evidence: 1, trust: 1 },
        requires: { entry: 'by-choice' },
        lockedHint: 'Only if you tied a line to the throne on the way down',
        artSubject:
          'A labelled drawer rising on a taut rope out of churning silt into darkness, aquamarine-scaled Scylla hauling hand over hand while Char in black lace fends off a rusted dredge bucket',
      },
    ],
  },
  {
    id: 'WR-28',
    title: 'The Two Gate Drawers',
    kind: 'secret',
    speaker: 'Char and Scylla',
    opening:
      'At the end of the aisle two drawers stand apart from the rest, newer, brass-cornered, their seals still soft. The labels are in the same clerk’s hand. One reads CHARYBDIS, LOST AT THE TIDE GATE. The other reads CHARYBDIS, HOME FROM THE TIDE GATE. They are side by side as if they had been delivered together. Scylla stops a full length away and does not come closer, and her lamp hand is shaking. Char looks at the drawers. Neither has asked her anything either.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, floats before two newer brass-cornered drawers side by side in a silted aisle, each with its own label and soft wax seal, while Scylla with aquamarine scales and a pearl circlet hangs back in the dark with a trembling lamp',
    echoes: [
      {
        flag: 'WR-20:hear-it-as-hers',
        text: 'Scylla’s own testimony is still sounding in Char’s ears. It is not in either drawer. Scylla never gave it to the Well.',
      },
      {
        flag: 'WR-20:ask-her-to-keep-it',
        text: 'The sealed whelk is still against Scylla’s ribs. Char does not ask for it. Scylla does not offer.',
      },
      {
        flag: 'WR-26:open-one-drawer',
        text: 'Char already knows what drawers keep about her: other people, very sure, in their own handwriting.',
      },
    ],
    choices: [
      {
        id: 'open-neither',
        label: 'Lay a hand on each drawer and open neither',
        outcome:
          '‘I don’t need a drawer to tell me I’m here,’ Char says, and takes her hands away. Scylla lets out a breath that goes on for a long time. The drawers stay shut and filed, both of them. Whatever they hold, Char has decided it does not get to go first.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Char in black lace resting one palm flat on each of two closed brass-cornered drawers, eyes shut, her aquamarine twin in the background lowering her shaking lamp',
      },
      {
        id: 'check-the-filing',
        label:
          'Read the filing marks against what you learned of the oracle’s record',
        outcome:
          'Both drawers carry the same filing tide and the same seal: the Tide Oracle’s, entered on the strength of a forecast. The Well filed both on a prediction from a conch that is wrong nine times in ten. Char copies the marks exactly. Neither drawer is evidence of anything except the court’s haste.',
        gain: { evidence: 2 },
        requires: { entry: 'oracle-tested' },
        lockedHint: 'Only if you checked the oracle’s record before descending',
        artSubject:
          'Close view of two wax seals stamped with a conch emblem on brass-cornered drawer fronts, a black-lace-cuffed hand copying their marks onto a card by lamplight',
      },
      {
        id: 'file-them-together',
        label:
          'Put both labels on one drawer and add a third: NEITHER SIGNED BY ME',
        outcome:
          'Char peels both labels off, presses them onto a single drawer front, and writes her own beneath them. Two versions, one drawer, one signature missing. The Well shudders at the misfiling. Scylla comes close enough to read it, then closer, and stays.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Char with dark violet scales pressing two labels and a handwritten card onto one brass-cornered drawer front, her aquamarine twin drifting close behind to read over her shoulder',
      },
    ],
  },
  {
    id: 'WR-29',
    title: 'Where the Splinters Pool',
    kind: 'puzzle',
    speaker: 'Char and Scylla',
    opening:
      'The silt runs down into a basin and settles, and in the basin the splinters lie thick and bright, each one a decision somebody never finished making. They hum. They light the water from below like a bed of embers. Roots cross the basin here and there, held and dark, a slow safe path. Every splinter Char passes flickers with a scene for her: a door half open, a hand half raised, a word half said, all waiting for an ending.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, balances on a dark root crossing a basin full of brightly glowing splinters that light her from below, faint half-formed scenes flickering in the nearest shards, Scylla with aquamarine scales and a pearl circlet following on the root behind',
    choices: [
      {
        id: 'cross-on-the-roots',
        label:
          'Keep to the held roots and cross slowly without touching a splinter',
        outcome:
          'It is a long cross, tail curled tight, Scylla calling out every gap. Not one splinter is touched, and none of them are finished. The lamp has burned down by the far side, and both sisters are shaking from holding themselves so carefully.',
        gain: { danger: -1, battery: -1 },
        artSubject:
          'Two mermaid sisters inching along a dark root across a basin of glowing splinters, the aquamarine twin pointing ahead to a gap, Char in black lace with her tail curled tight',
      },
      {
        id: 'pick-up-a-splinter',
        label: 'Pick up one splinter and look at what it never finished',
        outcome:
          'It shows two small sisters in a nursery at night, one whispering tonight and the other not yet, and it stops there. Char cannot tell from the splinter which voice was whose. That is the cruelty of it. She sets it back exactly where it was. Some things are not hers to end.',
        gain: { evidence: 2, danger: 2 },
        artSubject:
          'Char in black lace holding a single glowing splinter up to her face, a tiny flickering scene of two small mermaid girls whispering in a nursery reflected in her eyes',
      },
      {
        id: 'carry-one-for-light',
        label: 'Pocket a splinter for its light and let it whisper',
        outcome:
          'It burns bright enough to read by, and it does not stop murmuring the beginning of a sentence it cannot end. Char wraps it in lace. It will light the way to the bottom, and she will hear it every time things go quiet.',
        gain: { battery: 2, danger: 1 },
        artSubject:
          'Char with dark violet scales wrapping a glowing splinter in a twist of black lace, its light spilling through the weave onto her face and hands',
      },
    ],
  },
  {
    id: 'WR-30',
    title: 'The Slate in the Silt',
    kind: 'choice',
    speaker: 'Char and Scylla',
    opening:
      'The aisle ends in a wall, and against the wall, half drowned in silt, lies a cracked nursery slate with two names chalked on it in two small hands. SCYLLA, neat, every letter the same height. CHAR, enormous, the R backwards, a skull for the dot of nothing in particular. Char remembers writing it: six years old, tongue between her teeth, furious that Scylla finished first. The Well never filed it. A child’s handwriting is not testimony, says the tag, and so it sank.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, kneels in pale silt at the dead end of an aisle lifting a cracked nursery slate with two childish chalked names, one neat and one enormous with a backwards letter and a small skull, Scylla with aquamarine scales and a pearl circlet behind her with a hand to her mouth',
    echoes: [
      {
        flag: 'WR-04:ask-what-was-handed-in',
        text: 'One slate, cracked, Fitch read from her ledger. Handed in under Char’s name. Here it is, after all, where the Well let it fall.',
      },
    ],
    choices: [
      {
        id: 'take-the-slate',
        label: 'Take the slate as your own first testimony',
        outcome:
          'Char tucks it into her satchel with the chalk side in. It is the only record in the whole Well written by her, and the Well threw it away for being written by a child. She intends to make them file it. Scylla says the R is still backwards. Char says that was a choice.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Char in black lace sliding a cracked slate into a leather satchel, her aquamarine twin laughing beside her and pointing at a backwards letter',
      },
      {
        id: 'sign-it-again',
        label:
          'Chalk your name again beside the child’s, the way you write it now',
        outcome:
          'CHAR, smaller than before, the R the right way round, the skull exactly the same. Two signatures, years apart, one hand. She leaves the slate standing against the wall where anyone who comes this far can read it. Nobody else has come this far in a long time.',
        gain: { danger: -1, trust: 1 },
        artSubject:
          'Close view of a cracked nursery slate with a large childish chalk name and a newer, smaller version beside it with the same small skull, a black-lace cuff holding the chalk',
      },
      {
        id: 'give-it-to-scylla',
        label: 'Hand the slate to Scylla, since her name is on it too',
        outcome:
          'Scylla takes it in both hands and looks at the two names for a long time. ‘You were so angry,’ she says. ‘You were always so angry first.’ She keeps it. Char finds she does not mind who carries it, as long as nobody files it.',
        gain: { trust: 2, evidence: -1 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet holding a cracked chalk slate in both hands and gazing at it, Char in black lace beside her looking away with a crooked smile',
      },
    ],
  },
  {
    id: 'WR-31',
    title: 'The Holdfast',
    kind: 'lore',
    speaker: 'Char and Scylla',
    opening:
      'At the very bottom of the Well the shelves stop being shelves. A kelp holdfast, vast as a ship’s keel, has grown over them and gripped them, coil on coil, every drawer clasped tight so the silt cannot get underneath. The coils lead inward to a single lamp and a voice, quite near now, reading from a ledger without hurry: names, and after each name, an owner. Scylla takes Char’s hand without seeming to notice she has done it.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, swims between immense brown kelp holdfast coils gripping rows of drawers at the bottom of a dark well, toward a single distant lamp, Scylla with aquamarine scales and a pearl circlet holding her hand',
    echoes: [
      {
        flag: 'WR-24:shortcut-down',
        text: 'They arrive in a shower of superseded rulings, sliding out of the chute onto the coils. The voice ahead pauses. ‘Discards,’ it says. ‘Arriving with opinions.’',
      },
      {
        flag: 'WR-27:jam-the-wheel',
        text: 'Above them the dredge wheel is silent. Down here that silence is a sound, and the coils have tightened against it.',
      },
      {
        flag: 'WR-09:keep-the-lantern',
        text: 'Nosy bobs ahead with Char’s name on its tag, red and obvious. Whoever is reading has seen them coming since the silt line.',
      },
    ],
    autoChoiceId: 'follow-the-voice',
    choices: [
      {
        id: 'follow-the-voice',
        label: 'Follow the coils in toward the lamp and the reading voice',
        outcome:
          'Every coil they pass grips a drawer, and every drawer has been checked recently: a fresh chalk tick on each, dated today. Someone down here touches every record in the Well, every day, to make sure it is still there. Char finds that more frightening than any wheel.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a thick kelp coil wrapped around a drawer front marked with a fresh small chalk tick and date, a black-lace-cuffed hand touching the mark',
      },
    ],
  },
  {
    id: 'WR-32',
    title: 'Keeper Nerissa Holdfast',
    kind: 'guardian',
    speaker: 'Keeper Nerissa Holdfast',
    opening:
      'The Keeper is ancient, in a clerk’s green eyeshade, a ledger across her lap, and from the waist down she is no longer a tail at all but the holdfast itself, rooted into every shelf. ‘Sixty years,’ she says, ‘and I have never lost a record. The silt takes what nobody owns. I have watched it take a whole family because nobody claimed them in time.’ She turns a page. ‘I filed you under your sister. A sister is a strong shelf. Tell me who you belong to, child, and I will let you through.’',
    artSubject:
      'Keeper Nerissa Holdfast, an ancient merwoman in a green clerk’s eyeshade with a ledger on her lap whose lower body has become a vast kelp holdfast rooted into shelves of drawers, looks up under a single lamp at Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, and Scylla with aquamarine scales and a pearl circlet',
    echoes: [
      {
        flag: 'entry:by-choice',
        text: '‘You came down on a line from the throne with your sister a stroke behind,’ the Keeper says. ‘The oracle had nothing filed for that. Nor have I.’',
      },
      {
        flag: 'entry:oracle-tested',
        text: '‘Someone chalked on my lip,’ the Keeper says, without looking up. ‘Nine crosses in ten. I felt every one.’',
      },
      {
        flag: 'WR-16:feed-it-oil',
        text: 'Her ledger is the master index Char read by the fiche machine, column for column. Her finger rests on the last, empty one.',
      },
      {
        flag: 'WR-27:claim-it-for-them',
        text: '‘You shouted a crew’s names at my wheel,’ she says. ‘It stopped. It has never stopped for anyone but me.’',
      },
      {
        flag: 'WR-22:dictate-to-murex',
        text: 'A loose page is pinned to her ledger in Murex’s copying hand, the only first-person sentence in the Well: I will say what I am.',
      },
    ],
    choices: [
      {
        id: 'belong-to-yourself',
        label:
          'Tell her to file you under your own name, and you will answer for it',
        outcome:
          '‘File me under me.’ The Keeper looks at her a long time. ‘Then nobody else will be answerable when the silt comes for you.’ ‘Good,’ Char says. ‘Then I am.’ The Keeper writes it, crosses nothing out, and unclasps one coil from the shelf behind her. ‘Go on, then, owner. Mind the current.’',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject:
          'An ancient merwoman in a green eyeshade writing a single line in a heavy ledger as one great kelp coil behind her lifts away from a shelf, Char in black lace standing very straight before her',
      },
      {
        id: 'scylla-as-witness',
        label:
          'Let Scylla tell her she came as witness, not guardian, and will sign no custody',
        outcome:
          'Scylla says it in her proper court voice, the one for oaths: she is witness to her sister, not owner, not keeper, and will sign no shelf. The Keeper’s pen stops. ‘A sister who refuses to be a shelf,’ she says. ‘I have not filed one of those.’ She lifts a coil for them both, carefully, as for something fragile and new.',
        gain: { trust: 2 },
        requires: { entry: 'by-choice' },
        lockedHint:
          'Only if Scylla swore at the throne to come as witness, not guardian',
        passesGuardian: true,
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet speaking with one hand raised as if taking an oath before an ancient merwoman in an eyeshade, Char in black lace beside her, a kelp coil lifting behind the Keeper',
      },
      {
        id: 'the-oracle-tally',
        label:
          'Show her the oracle’s record: wrong nine times in ten about who belongs to whom',
        outcome:
          'Char recites it from the court logs, case by case. The Keeper turns her own pages as she listens and goes grey: half her filings were made on the oracle’s word. ‘I filed by forecast,’ she whispers. ‘For sixty years.’ She unclasps the coil and does not look at them as they pass.',
        gain: { evidence: 1, danger: -1 },
        requires: { entry: 'oracle-tested' },
        lockedHint: 'Only if you tested the oracle against the court logs',
        passesGuardian: true,
        artSubject:
          'An ancient merwoman in a green eyeshade turning ledger pages with a stricken face as Char in black lace counts cases on her fingers, a coil of kelp slowly unwinding behind them',
      },
      {
        id: 'the-empty-column',
        label:
          'Lay out everything you found and show her the column nobody ever filled',
        outcome:
          'The catalogue, the loans, the ruling on Murex’s skin, the struck hearing, the slate tagged not testimony. Char sets the pieces on the Keeper’s ledger one by one and lets her read. ‘Every record in my Well is about someone,’ the Keeper says at last. ‘And I never once asked them.’ The coil lifts.',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 5 },
        lockedHint: 'Needs more gathered evidence (5)',
        passesGuardian: true,
        artSubject:
          'Papers, a cracked slate, loan slips and a film card spread across an open ledger on an ancient merwoman’s lap, Char in black lace pointing to a blank column, the Keeper bowing her eyeshaded head',
      },
    ],
  },
  {
    id: 'WR-33',
    title: 'The Lowest Shelf',
    kind: 'treasure',
    speaker: 'Keeper Nerissa Holdfast',
    opening:
      'Behind the Keeper the holdfast opens on the Well’s first shelf, older than the palace. On it lies the founding charter, its seal a conch. The Keeper reads it aloud because she knows it by heart: ‘The subject of a record shall never be its owner, lest the record be partial.’ That is the Well’s secret. It does not keep history. It keeps everyone’s history except their own, and the splinters in the silt are every decision that piled up unfinished because the person it belonged to was never allowed to speak.',
    artSubject:
      'An ancient shelf of dark stone behind parted kelp coils holding a crumbling charter with a conch seal, a jar of lamp oil and a folded deed, Keeper Nerissa Holdfast, an ancient merwoman in a green eyeshade, reading aloud from memory as Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, reaches toward the shelf',
    echoes: [
      {
        flag: 'WR-32:belong-to-yourself',
        text: 'Her own new line is in the Keeper’s ledger: Charybdis, filed under Charybdis. It is the first entry in sixty years that breaks the charter.',
      },
      {
        flag: 'WR-32:scylla-as-witness',
        text: 'Scylla stays exactly one stroke behind, as she promised at the throne, and does not reach for anything on the shelf.',
      },
      {
        flag: 'WR-32:the-oracle-tally',
        text: 'The Keeper keeps touching the conch seal on the charter, as if checking whether it, too, was only a forecast.',
      },
      {
        flag: 'WR-32:the-empty-column',
        text: 'Char’s evidence is still spread on the Keeper’s ledger. She has not moved it. She has written nothing over it.',
      },
    ],
    choices: [
      {
        id: 'take-the-charter',
        label:
          'Take the founding charter, so the court cannot say it never existed',
        outcome:
          'It crumbles at the edges but holds. The Keeper lets her take it and says, quite calmly, that the Well will be illegal by morning without it, which is to say, honest. Char wraps it in lace. The court has been ruling on this for centuries and has never once read it out.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Char in black lace lifting a crumbling charter with a conch seal from an ancient stone shelf in both hands, an eyeshaded merwoman watching calmly with folded hands',
      },
      {
        id: 'take-the-oil-jar',
        label: 'Take the Keeper’s jar of lamp oil for the climb ahead',
        outcome:
          'Sixty years of the Keeper’s careful rationing, a full jar of it. ‘Take it,’ she says. ‘I can see in the dark down here. I have had to.’ Scylla fills the lamp and the bottom of the Well is lit for the first time in living memory, all of it, every coil.',
        gain: { battery: 2 },
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet pouring oil from a heavy jar into a lamp as light floods across vast kelp coils and ancient shelves, Char in black lace looking up at it all',
      },
      {
        id: 'take-the-custody-deed',
        label:
          'Ask Scylla to hand you the custody deed that files you under her',
        outcome:
          'Scylla lifts the deed, reads it, and gives it over. It is signed by the Chamberlain on behalf of the sister, with two words written for her, grieving and rejoicing, one struck and the stroke smudged past reading. ‘On my behalf,’ Scylla says. ‘Nobody asked me either. Take it.’ Char tucks it away.',
        gain: { trust: 2, evidence: 1 },
        requires: { trust: 3 },
        lockedHint: 'Only if Scylla trusts you enough (3)',
        artSubject:
          'Aquamarine-scaled Scylla with a pearl circlet handing a folded deed with a smudged line across it to Char in black lace before an ancient stone shelf, both holding it a moment longer than needed',
      },
    ],
  },
  {
    id: 'WR-34',
    title: 'The Drawer With No Seal',
    kind: 'secret',
    speaker: 'Char',
    opening:
      'At the end of the first shelf, behind the charter, there is one drawer the Keeper has never ticked. Its label is in the court’s oldest hand: CHARYBDIS, OWN ACCOUNT, and below it, smaller, SEAL TO BE SUPPLIED BY SUBJECT. It has no owner’s wax. It has never been opened. Char pulls it out. It is empty and perfectly clean, not dusty at all, as though somebody had kept it ready every day of her life without ever expecting her to come.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, holds open a clean empty drawer with an old handwritten label at the end of an ancient stone shelf, kelp coils curving away behind her and lamplight falling into the bare drawer',
    echoes: [
      {
        flag: 'WR-30:take-the-slate',
        text: 'The cracked slate is in her satchel, chalk side in. It would fit the drawer exactly. That may not be an accident.',
      },
      {
        flag: 'WR-10:claim-the-hairclip',
        text: 'The skull hairclip is still crooked in her hair. Fitch wrote down her words for it. It is, Char realises, the only claim in the Well filed in her voice.',
      },
      {
        flag: 'WR-13:feed-it-a-card',
        text: 'Somewhere above, a root holds a wooden card in her crooked hand: Char read these labels and decided nothing yet. Yet is about to run out.',
      },
    ],
    choices: [
      {
        id: 'write-a-first-line',
        label: 'Write one first line and put it in the drawer',
        outcome:
          'She writes it on the back of Fitch’s ticket stock, the only paper she has that nobody else has written on: My name is Char. I chose the lace. Everything else in this Well is about me. She drops it in. It looks very small in there, and it is the only thing in the Well that is hers to sign.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Close view of a small handwritten ticket card lying alone in a clean empty drawer, Char’s black-lace-cuffed hand just withdrawing from it',
      },
      {
        id: 'seal-it-unwritten',
        label:
          'Press your own seal on it, empty, so it is yours whether or not you fill it',
        outcome:
          'Char has no wax, so she uses chalk and draws a skull on the front. The drawer accepts it as a seal. Now the account exists and belongs to her, and what goes in it is nobody’s business until she says so. The Keeper, watching, writes in her ledger: sealed, unwritten, by subject.',
        gain: { danger: -1, trust: 1 },
        artSubject:
          'Char in black lace drawing a small chalk skull on the front of a closed drawer as an eyeshaded merwoman in the background writes in a ledger',
      },
      {
        id: 'leave-it-open',
        label: 'Leave the drawer standing open and empty for now',
        outcome:
          'She leaves it pulled out, empty, so that anyone who comes here will see the one drawer in the Well nobody filled. It is an accusation and an invitation at once. Char has not decided which yet, and she is not going to let the Well hurry her.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'A single drawer standing pulled out and empty from an ancient stone shelf in lamplight, Char with dark violet scales floating back from it with her arms crossed',
      },
    ],
  },
  {
    id: 'WR-35',
    title: 'The Ruling Stone',
    kind: 'climax',
    speaker: 'Char',
    opening:
      'The Well’s floor is a single round stone, polished by centuries of files pressed flat upon it into rulings. Around it every version waits: drawers of the first night, the two gate drawers, the mirrors’ tags, the letters, the silt and its unfinished splinters. In the wall is the station’s great overflow sluice, a wheel that would send the whole Well out into the drains and the open sea. Scylla holds the lamp. The Keeper watches. Whatever Char sets on this stone, the court will have to rule by it.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, stands at the centre of a vast round polished stone surrounded by drawers, mirrors and drifting glowing silt, a huge iron sluice wheel set in the curved wall behind her, Scylla with aquamarine scales and a pearl circlet holding a lamp and an eyeshaded ancient merwoman rooted in kelp watching from the edge',
    echoes: [
      {
        flag: 'WR-34:write-a-first-line',
        text: 'Her first line lies in its drawer at the edge of the stone. My name is Char. I chose the lace. It is a small, stubborn beginning.',
      },
      {
        flag: 'WR-34:seal-it-unwritten',
        text: 'Her chalk skull grins from the front of her own drawer, sealed and empty, waiting on nobody but her.',
      },
      {
        flag: 'WR-28:open-neither',
        text: 'The two gate drawers stand shut on the edge of the stone where she left them, unopened, and still filed.',
      },
      {
        flag: 'WR-20:witness-not-guardian',
        text: 'Scylla’s whelk lies beside the lamp, its wax scratched WITNESS, NOT GUARDIAN. She has set it down where Char can see it and not touched it since.',
      },
    ],
    choices: [
      {
        id: 'her-own-account',
        label:
          'Seal your own account on the stone, and file every other version as about you, not yours',
        outcome:
          'She sets her drawer on the stone and writes only what she can vouch for: her name, her childhood, today. Every other version stays, retitled TESTIMONY ABOUT CHARYBDIS. The court must now hear her first, and hold her to every word. The gate drawers stay on the shelf, quotable. Scylla’s testimony stays hers, to carry by herself.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'Char in black lace pressing a single drawer onto a polished round stone as rows of drawers around her are retitled with new handwritten labels, her aquamarine twin watching with the lamp',
      },
      {
        id: 'open-the-sluice',
        label:
          'Turn the sluice and let the current carry every version out to sea',
        outcome:
          'The wheel groans, the overflow opens, and the Well empties: drawers, mirrors, seals, splinters, all of it, into the drains and the open sea. Nobody owns the first night now, not the court, not Scylla, not Char. The crew’s statements go too. The Keeper lets go of her shelves and drifts up, lost. The court will rule on rumour.',
        gain: { danger: 2, evidence: -2, trust: 1 },
        artSubject:
          'Char with dark violet scales hauling on a huge iron sluice wheel as a torrent sweeps drawers, mirrors and glowing silt out through a great opening, an ancient merwoman drifting upward free of her kelp',
      },
      {
        id: 'every-version-witnessed',
        label:
          'Keep every version, re-seal each in its witness’s name, and open the Well to all named in it',
        outcome:
          'No owners, only witnesses: the court’s, the mirrors’, Scylla’s, hers. The Well becomes a reading room for everyone in it, crews, families, Dulse. Char’s slate and stitches go on open shelves, and strangers will argue in front of them about which drawer she is. The Keeper stays rooted forever, to hold it.',
        gain: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Char in black lace pressing new wax seals onto drawer after drawer around a great round stone while doors in the well wall open and the first curious merfolk swim in, an eyeshaded Keeper rooted at the edge',
      },
    ],
  },
  {
    id: 'WR-36',
    title: 'The Overflow Stair',
    kind: 'exit',
    speaker: 'Char and Conductor Ottoline Fitch',
    opening:
      'The overflow stair climbs a long way through the drains and comes out, of all places, at the back of Fitch’s booth on the Pearl platform, among the lost umbrellas. Morning commuters are queuing at the cracked conch on its plinth, which turns as she passes, ready with its line: whoever descends will come out belonging to someone. Fitch hands Char a fresh claim ticket without a word. The board above the platform flickers, deciding what to call her this time.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, climbs out of a drain hatch behind a brass ticket booth among lost umbrellas onto a pearl-tiled underwater subway platform, an elderly hermit crab holding out a ticket, a cracked conch on a plinth and a flickering arrival board beyond, Scylla emerging behind her with the lamp',
    echoes: [
      {
        flag: 'WR-35:her-own-account',
        text: 'Down below, her drawer lies sealed on the stone, the only account in the Well written by its subject. By noon the court will have read it, and argued, and have to hear her.',
      },
      {
        flag: 'WR-35:open-the-sluice',
        text: 'Pages are already washing up along the tracks: a seal, a mirror tag, half a ruling. Commuters pick them up and read them aloud, all disagreeing. Nobody owns any of it now, including the people it was about.',
      },
      {
        flag: 'WR-35:every-version-witnessed',
        text: 'A hand-lettered sign already hangs on Fitch’s booth: WELL OF RECORDS, READING ROOM, OPEN TO ALL WHO ARE NAMED. A queue is forming. Char is in most of it, and will be for years.',
      },
    ],
    choices: [
      {
        id: 'answer-the-oracle',
        label:
          'Stop at the conch and tell it, in front of the queue, who you came out belonging to',
        outcome:
          '‘Me,’ Char says. ‘Ask again tomorrow. It may be someone I chose.’ The queue hears it. The conch has nothing filed for that and falls quiet. Scylla stands a stroke behind her, as witness, and Fitch stamps the ticket CLAIMANT: SELF. It will not settle anything at court. It is a start.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Char in black lace facing a cracked conch on a plinth before a listening queue of commuters, her aquamarine twin a stroke behind and a hermit crab stamping a ticket in a brass booth',
      },
      {
        id: 'walk-past-it',
        label: 'Walk past the conch without a word and take the next train',
        outcome:
          'Char tucks Fitch’s ticket into her cuff, blank, and boards without looking back. The conch shouts its line at her tail. It has been wrong before. Scylla catches the door just in time. Whatever Char decided down there, she does not owe the platform the telling of it.',
        gain: { danger: -1, evidence: -1 },
        artSubject:
          'Two mermaid sisters, dark violet in black lace and aquamarine with a pearl circlet, slipping through the closing doors of an underwater train as a cracked conch on a plinth bellows bubbles behind them',
      },
    ],
  },
]
