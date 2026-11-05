import type { MorrowShiftSite } from '../morrowShift/types'

/**
 * e06 rows 7–8: the Servants' Jetty and the Hidden Landward Gate, warped.
 * Row 7 is the jetty under the impossible tide, where the workers are paid
 * to forget and 7,7 is Char's own decision for the second departure (its
 * three choices come from MEMORY_CHAR_AGENCY_CHOICES). Row 8 walks the old
 * escape passage toward the witness bells at 8,8, whose two choices and
 * campaign lines come from the game.
 */
export const UNDERTIDE_CROWN_ROWS_7_8: readonly MorrowShiftSite[] = [
  {
    key: '1,7',
    place: 'Net Loft',
    title: 'Every Coronet Is Hers',
    speaker: 'Tansy Dunlin',
    kind: 'treasure',
    instant: true,
    opening:
      'The net loft’s hooks hold coronets again, but tonight every one of them is Char’s: the same bent prong, dozens deep, each tagged in court hand CONFISCATED PENDING ACCOUNT. More hang each time Scylla looks away. Tansy Dunlin sits beneath them unpicking tags with a bone hook, steady as mending. ‘They can’t all be hers,’ she says. ‘One is. The rest are what the court would rather she’d been.’',
    artSubject:
      'A low underwater net loft where dozens of identical small silver coronets with the same bent prong hang on hooks among mending nets, each with a dangling paper tag, more of them crowding the edges of the frame; a weathered mer-woman net-mender unpicks a tag with a bone hook while Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, stares up at them; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'notice',
        label: 'Find the coronet with the gap where a pearl was sold',
        outcome:
          'Only one has the gap, and the scratches of a girl who wore it upside down to annoy a duke. Tansy snips its tag, drops it in Scylla’s satchel with a real pearl to fill the hole, and goes back to unpicking the rest. ‘Mending,’ she says, ‘is still my business.’',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'A net-mender’s scissors snipping a court tag from one small coronet with a missing pearl, a young mermaid’s hand waiting beneath it, a forest of identical tagged coronets blurred behind.',
      },
    ],
    echoes: [
      {
        flag: 'e05:1,7:notice',
        text: 'Last time Tansy gave her a pearl to hand back to Char. Scylla never did. Tansy notices, says nothing, and that is its own kind of mending.',
      },
    ],
  },
  {
    key: '2,7',
    place: 'Harbour Slate',
    title: 'Three Sprats',
    speaker: 'Tibby Dunlin',
    kind: 'puzzle',
    opening:
      'The harbour slate has started writing itself. Tibby Dunlin points: her da’s boat, the Sprat, is logged three times tonight, and two are lies. ‘Da logs in his own hand. He never writes SAFE, ’cause nothing is. And he won’t sail on bell eight. That’s the witness bell.’ The slate: SPRAT, ropes, bell four, crooked hand. SPRAT, ropes, bell five, SAFE, neat hand. SPRAT, lamp oil, bell eight, crooked hand.',
    artSubject:
      'A big chalked harbour slate on a barnacled post at a half-flooded underwater jetty, the same boat name chalked on it three times in two different hands, faint chalk lines crawling as if still being written; a gap-toothed little mer-girl points up at it beside Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Wait for the Sprat at bell four, the entry in Da’s own hand',
        outcome:
          'At bell four the Sprat noses in through the impossible tide, riding low with coiled rope and a family huddled on the coils, and a big hand waves. Tibby doesn’t wave back; she runs. Marl tells Scylla, low, which entries on the slate were changed tonight, and by whom.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'A small boat riding low into a jetty light, a stranded family huddled on coiled rope aboard, a big dockhand waving from the stern as a little mer-girl races down the planks toward him.',
      },
      {
        id: 'risk',
        label: 'Wait at bell five; the neat entry is the official one',
        outcome:
          'At bell five a court skiff glides in, empty and gleaming, a herald in the bow with a witness book open. ‘Names of the stranded, please, for their safety.’ Tibby hides behind Scylla’s tail. The Sprat, they learn later, came and went at four.',
        effects: { danger: 1, trust: -1 },
        artSubject:
          'An empty, gleaming court skiff gliding to the jetty with a herald in the bow holding an open black book, a little mer-girl hiding behind a young princess’s tail.',
      },
      {
        id: 'bell-eight',
        label: 'Wait at bell eight, for the lamp-oil entry',
        outcome:
          'Bell eight never comes as a boat. It comes as a toll, deep under the jetty, and every worker on the planks stops and turns toward the palace as if called by name. Tibby clamps her hands over her ears. Scylla gets her home; the Sprat is long gone.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'Jetty workers frozen mid-task and all turned the same way toward a distant palace, a little mer-girl with her hands clamped over her ears beside a young princess.',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,7:care',
        text: 'Last time Scylla pointed her at an empty boat. Tibby has been practising her letters since, and reads the slate along with her, lips moving.',
      },
      {
        flag: 'e05:2,7:risk',
        text: 'Last time Scylla found Da’s boat for her. Tibby holds her hand and doesn’t check, which is its own weight.',
      },
      {
        flag: 'e05:2,7:cockle',
        text: 'Last time Scylla picked the wrong boat. Tibby forgives her, conditionally, and reads every word of the slate aloud twice.',
      },
    ],
  },
  {
    key: '3,7',
    place: 'Jetty Keepsake Chest',
    title: 'Unregistered History',
    speaker: 'A jetty boy',
    kind: 'memory',
    instant: true,
    opening:
      'Under the jetty stairs the keepsake chest is shut with a court seal: UNREGISTERED HISTORY. Through a gap in the lid Scylla can see the bootlace and the pink comb, each tagged. The bus ticket is gone. ‘They said land is a story,’ a jetty boy tells her, carefully, as if reciting. ‘They said you made it up.’ Behind him, Tibby has her lips pressed tight around something.',
    artSubject:
      'Beneath wooden jetty stairs underwater, a battered sea chest bound shut with a heavy wax court seal and tags, a bootlace and a broken pink comb glimpsed through a gap in the lid; a solemn mer-boy reciting with his hands at his sides, a gap-toothed mer-girl behind him with puffed cheeks, facing Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'notice',
        label: 'Ask Tibby what she’s keeping in her cheek',
        outcome:
          'Tibby checks the stairs, then spits a soggy cardboard square into Scylla’s palm: the bus ticket, its numbers half dissolved. ‘A box on wheels. In the rain. With strangers.’ She takes it back at once. ‘Mine. I said.’ The court has a seal. Tibby has teeth.',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'A soggy little paper bus ticket in a young princess’s palm, a gap-toothed mer-girl already reaching to snatch it back, the sealed chest behind them.',
      },
    ],
    echoes: [
      {
        flag: 'e05:3,7:notice',
        text: 'Last time Scylla mimed the bus rail for them, and they shrieked with delight. Nobody under these stairs has shrieked at anything in a while.',
      },
    ],
  },
  {
    key: '4,7',
    place: 'Rope Locker',
    title: 'The Belled Eel',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'The rope locker is still the only way down to the undercroft, and the glimmer eel is still coiled in the hawsers, but someone has riveted a witness bell to its collar. Every time it shifts, the bell tolls, and every toll brings a guard’s lantern a little nearer along the harbour wall. The eel looks at Scylla with one pale, exhausted eye. It has not been allowed to sleep.',
    artSubject:
      'A cramped underwater rope locker of coiled hawsers, a huge pale eel looped through the coils with a small bronze bell riveted to an iron collar at its throat, one moon-coloured eye open and bloodshot with exhaustion; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, frozen in the hatchway; a guard’s lantern glow through a crack in the planks; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Hold perfectly still and let it settle, bell and all',
        outcome:
          'Scylla keeps so still her fins cramp. The eel settles in stages, wincing at each small toll, until the bell’s weight drags its chin to the boards. She slips past, lamp spent. Behind her she hears it begin to shift again.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A princess easing past a dim, exhausted eel whose belled chin rests on the boards of a dark rope locker, a guttered lamp in her hand.',
      },
      {
        id: 'risk',
        label: 'Work the rivet loose and take the bell off it',
        outcome:
          'The rivet gives with one toll that runs the whole length of the jetty, and lanterns swing her way. But the eel goes slack with relief and dims to nothing, and in the dark it lets her pass, nosing her tail like furniture. The bell she wraps in her shawl, still faintly humming.',
        effects: { danger: 1, trust: 1, evidence: 1 },
        artSubject:
          'A young princess prising a rivet from an iron collar on a huge drowsy eel, a freed bronze bell swinging in her other hand, lantern beams sweeping the planks above.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,7:care',
        text: 'Last time it rested its head across her tail. It knows her shape; its eye softens a little, and the bell trembles.',
      },
      {
        flag: 'e05:4,7:risk',
        text: 'Last time she hummed it the nursery lullaby. It remembers the tune and begins, helplessly, to glow, and the bell begins to swing.',
      },
    ],
  },
  {
    key: '5,7',
    place: 'Pay-Night Bench',
    title: 'Wages for One Line',
    speaker: 'The night crew',
    kind: 'memory',
    opening:
      'Pay night, and the crew’s wages sit on the bench in stacks beside a herald’s witness bell. Each worker may collect on signing one line: The princesses were never at the jetty. The bell tolls each time a pen touches paper. Some have signed. The cook with the burn-scarred hand has not, and her children are eating air. She looks at Scylla. Not for rescue. To see what she does.',
    artSubject:
      'A long wooden bench under swaying lamp-jellies on an underwater jetty, stacks of shell coins beside an open black ledger and a small bronze bell on a stand, a herald with a pen waiting; tired mer-workers half signing, half refusing, a cook with a scarred hand sitting with folded arms beside two thin children, looking at Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label:
          'Ask the crew what they want, and stand beside whatever they choose',
        outcome:
          'The cook folds her arms and won’t sign; half the bench folds theirs too. The others sign, ashamed, and Scylla thanks them for feeding their children, then empties her satchel’s rations onto the refusers’ plates. The bell tolls over each refusal like a tally. The herald writes Scylla’s name at the top of a page: PRESENT.',
        effects: { trust: 2, danger: 1, supplies: -1 },
        artSubject:
          'A young princess tipping rations from her satchel onto the plates of workers with folded arms, a herald writing her name at the head of a page beside a tolling bell.',
      },
      {
        id: 'risk',
        label: 'Pay their wages yourself, so nobody has to sign',
        outcome:
          'Pearls from her circlet, one per worker, pressed into hands. Nobody signs. The herald notes, pleasantly, that the princess paid the jetty for its silence, and the bell tolls once, long. The cook pockets her pearl. ‘You bought us out of choosing, Highness. Kind. Not the same thing.’',
        effects: { supplies: -2, trust: 1, danger: 1 },
        artSubject:
          'A young princess pressing pearls from her own circlet into workers’ palms along the bench while a herald smiles and writes, the scarred cook looking down at the pearl in her hand.',
      },
    ],
    echoes: [
      {
        flag: 'e05:5,7:care',
        text: 'Last time Scylla asked them what the petition ought to say and wrote it on her wrist. The cook glances at that wrist now, as if the ink might still be there.',
      },
      {
        flag: 'e05:5,7:risk',
        text: 'Last time Scylla promised them a line in the petition. The cook asks, without heat, whether it ever got written.',
      },
    ],
  },
  {
    key: '6,7',
    place: 'Fin-Mender’s Booth',
    title: 'Wax for the Ears',
    speaker: 'Agnes Tully',
    kind: 'merchant',
    opening:
      'Land goods are contraband now, so Agnes Tully sells something the court hasn’t thought to ban: plugs of boot wax, softened and rolled small. ‘For the ears. When the witness bells ring your name, you start telling their version. Wax helps. Your sister bought the tin.’ Two plugs to a pearl. On a hook behind her hang two pairs of grey wool socks, exactly where they hung before.',
    artSubject:
      'A cluttered underwater booth hung with patched fins like laundry, a shrewd older mer-woman fin-mender rolling small plugs of amber wax on her counter beside an open tin, two pairs of grey wool socks on a hook behind her; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, touching her own ear uneasily; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Buy wax for you and Char, and pay her to give the rest away',
        outcome:
          'Two pearls from the circlet: one for the sisters’ wax, one so the jetty children get theirs for nothing. Agnes bites both and approves. Scylla’s circlet now gaps like a mouth missing two teeth, and the court counts pearls.',
        effects: { supplies: 1, trust: 2, danger: 1 },
        artSubject:
          'A fin-mender handing little wax plugs to a queue of jetty children while a young princess with two gaps in her pearl circlet watches.',
      },
      {
        id: 'risk',
        label: 'Buy all her wax, to give to whoever you decide needs it',
        outcome:
          'Agnes sells it all, slowly. ‘Whoever you decide,’ she repeats, wrapping. ‘That’s how the court talks.’ Scylla leaves heavy with wax and lighter by a good deal of goodwill, and the jetty children, unplugged, flinch at every toll.',
        effects: { supplies: 2, trust: -1 },
        artSubject:
          'A young princess carrying a heavy kelp-paper parcel away from the booth past jetty children who flinch with their hands over their ears.',
      },
      {
        id: 'socks',
        label: 'Ask whether the socks are for sale',
        outcome:
          '‘Already paid for,’ says Agnes. ‘Somebody always buys them, on this night.’ She hands them over without taking a pearl, and her hand is cold. The socks are warm, and darned at the heels where nobody has worn them yet.',
        effects: { supplies: 1, trust: 1 },
        artSubject:
          'Two pairs of grey wool socks with neatly darned heels passing from a fin-mender’s cold hand to a young princess, who stares at the darning.',
      },
    ],
    echoes: [
      {
        flag: 'e05:6,7:care',
        text: 'Last time Scylla paid for socks with a pearl from her own circlet. Agnes looks at the gap, still there, and slides her one plug of wax for free.',
      },
      {
        flag: 'e05:6,7:risk',
        text: 'Last time Scylla haggled and said too much about up there. Agnes says nothing about up there now, very carefully, because the bell over the booth is listening.',
      },
      {
        flag: 'e05:6,7:one-pair',
        text: 'Last time Scylla bought one pair, for Char. Agnes has kept the second pair back ever since, folded small, just in case.',
      },
    ],
  },
  {
    key: '7,7',
    place: 'Jetty Undercroft',
    title: 'Char’s Course',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'The tide has risen inward, impossibly, and the Dunlins’ undercroft is half under: families on crates the rolls still call STORES. Oren holds his corridor open, ropes counted for one crossing. Past him, flooded rows hold survivors no map admits, and the bells are summoning them to give the court’s account. A herald offers everyone safety, doors locked. Every course leaves someone waiting. Scylla starts to speak. Char puts a hand over her mouth. ‘No. You had your gate. This one’s mine.’',
    artSubject:
      'A half-flooded family home among stacked crates beneath an underwater jetty, mer-families huddled on the highest crates, hooded Oren Pike, a very tall broad merman with an eel-grey tail and a rough brown cloth executioner hood, holding a coiled rope at the mouth of a dark corridor, a herald with a lantern at a locked palace door; Char, her identical twin with dark violet scales, black lace and a fierce, furious look, presses her hand over the mouth of Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [],
    echoes: [
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s oilcloth letter to Fenn is still in Scylla’s satchel. Tansy asks Char, not Scylla, whether it is still going anywhere.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'The Sprat’s channel is closed now, as Marl said it would be once a princess asked. He looks at Scylla, then at Char, and waits for Char.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla knows where one of this girl’s roads ended, at a sea gate, years from here. She keeps her mouth shut under her sister’s hand. That knowledge is not a vote.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Scylla once sealed a gate on people waiting below so her sister would live. She does not get to choose who waits this time, and she knows it.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Scylla once flooded a district a map called empty. She looks at the word STORES on the crates, and leaves the deciding where Char has put it.',
      },
    ],
  },
  {
    key: '8,7',
    place: 'Signal Mirror',
    title: 'The Reflection Rehearses',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'The signal mirror at the jetty’s end holds two reflections now. One is Scylla. The other has her face and circlet and stands a half-beat behind, mouthing words Scylla hasn’t said. She reads its lips: The elder princess decided. The younger princess followed. It is the court’s account, rehearsing in her face.',
    artSubject:
      'A large tide-worn mirror on a swivel at the end of an underwater jetty, its pitted silver showing two reflections of the same young princess, one a half-beat out of step and speaking; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, staring at the second; faint surface glimmer far above; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'notice',
        label: 'Tilt the mirror toward the surface',
        outcome:
          'She flashes once, the workers’ way. Far above, a pinprick of light flashes back, then again at the same count, and again, the same reply replayed like a stuck tide. The second reflection doesn’t turn to look. It only keeps rehearsing.',
        effects: { evidence: 1 },
        artSubject:
          'A young princess tilting a pitted mirror upward toward a tiny repeated point of light far above, her second reflection in the glass still mouthing words.',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'The second reflection has pink cheeks, as if it raced Char up the Pearl Stair honestly and lost by a fin. It is wearing her one good morning.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'The second reflection glances sideways, the way Char has watched Scylla since she stopped on the Pearl Stair to hint. Even her doubts have been copied.',
      },
    ],
  },
  {
    key: '1,8',
    place: 'Kelp Curtain',
    title: 'Keep Still',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'Behind the last piling the kelp curtain hangs where it did, and chalk still marks every twenty strokes, but someone has corrected it. Each of Char’s skulls is rubbed half out and redrawn in neat court chalk as a numbered crown. Her KEEP UP now reads KEEP STILL. Ahead, past the arch, a bell tolls once, and the kelp leans toward the sound as if to listen.',
    artSubject:
      'A dim rock passage glimpsed through a parted curtain of tall kelp all leaning the same way, a trail of half-erased chalk skulls overwritten by neat numbered chalk crowns receding into the dark; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, pushing through; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits, eerie and hushed.',
    choices: [
      {
        id: 'notice',
        label: 'Look for a skull the court missed',
        outcome:
          'Low on the rock, scratched rather than chalked, one skull still rolls its eyes. Under it, freshly gouged in Char’s spiky hand: NOT THEIRS. MINE. Scylla traces it with one finger and feels the kelp at her back go still, listening.',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'A young mermaid’s fingertip tracing a small eye-rolling skull scratched low on dark rock beneath two gouged words, kelp hanging motionless behind her.',
      },
    ],
    echoes: [
      {
        flag: 'e05:run-again',
        text: 'They ran through this curtain once already, and the sea has wound the night back to run it again. The chalk is fresh. Char drew these skulls tonight, for the second first time.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed. The curtain was nailed shut for the princesses’ safety, and someone has drawn the nails one by one; they lie on the rock in a neat, counted row.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Scylla told Char how it ends, and the court has spent days erasing that. Beneath its crowns, Char has scratched a second line: I KNOW. KEEP UP ANYWAY.',
      },
    ],
  },
  {
    key: '2,8',
    place: 'Old Customs Arch',
    title: 'One Account Is True',
    speaker: 'Scylla',
    kind: 'puzzle',
    opening:
      'The customs arch has been recast. Where Char’s shells were, three small bells hang under a court plaque: ONE ACCOUNT IS TRUE. RING IT. The crowned bell is engraved I AM THE TRUE ACCOUNT. The skull bell: THE CROWNED BELL LIES. The two-faced bell, crown on one side and skull on the other: THE SKULL BELL LIES. Beyond the bars, deep in the dark, something much larger hums at the same pitch.',
    artSubject:
      'An ancient barnacle-crusted stone arch with rusted bars across a sea passage, three small engraved bronze bells hanging from its keystone, one marked with a crown, one with a skull, one with a crown on one face and a skull on the other, a stern metal plaque above; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, reaching up; a vast dim bell shape in the darkness beyond the bars; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Ring the crowned bell, which claims to be the true account',
        outcome:
          'The crowned bell rings sweet and wrong. Deep in the dark the great bell answers, and Scylla hears her own voice say, calmly, ‘We were never here,’ before she can stop it. She bites her lip until the words stop. The arch stays shut; she climbs over it, scraped.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'A young princess with a hand clamped over her own mouth, eyes wide, beneath a ringing crowned bell, a great dark bell shape answering beyond the bars.',
      },
      {
        id: 'risk',
        label: 'Ring the skull bell, which says the crowned bell lies',
        outcome:
          'The skull bell gives one cracked, honest note, and the bars swing inward without a sound. Inside them, scratched where the court’s chalk can’t reach, is a skull in a tiny crown and two words: TOLD YOU. It is the only thing tonight that agrees with itself.',
        effects: { evidence: 2 },
        artSubject:
          'The barred arch swinging silently open into the dark, a small skull wearing a tiny crown scratched on the inner side of the bars beside a still skull-marked bell.',
      },
      {
        id: 'two-faced',
        label: 'Ring the two-faced bell, which says the skull bell lies',
        outcome:
          'The two-faced bell rings two notes at once, arguing, and the great bell in the dark answers both, louder. Lanterns bob beyond the kelp. Scylla flattens herself in the weed as the guards swim past, each one muttering the same sentence under his breath.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'A princess pressed flat in sea-weed at the foot of the arch while lantern-carrying guards swim past beyond the kelp, their lips all moving in unison.',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,8:care',
        text: 'Last time she pressed the proper crowned shell and the arch rang for the guards. Her hand remembers the mistake before she does.',
      },
      {
        flag: 'e05:2,8:risk',
        text: 'Last time the skull shell squirted ink in her face. She still flinches, a little, at the skull.',
      },
      {
        flag: 'e05:2,8:plain-shell',
        text: 'Last time the answer was the plain shell, neither hers nor Char’s. There is no plain bell now. The court has removed that option.',
      },
    ],
  },
  {
    key: '3,8',
    place: 'Headsman’s Crate',
    title: 'Rung For Twice',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Oren Pike sits on the same crate, hood on, axe across his knees, but the book in his lap is not his ledger. It is a court witness book bound in black, and the bells have rung his name twice tonight. ‘I am ordered to take the princesses’ account,’ he says. ‘One account. Signed.’ Its pages are blank. Poking from its lining, in his own printed hand, is a manifest: STRANDED. RESCUED. MISSING.',
    artSubject:
      'A narrow sea passage lit by one lantern, where Oren Pike, a very tall broad merman with an eel-grey tail, his whole head covered by a rough brown cloth executioner hood with two eyeholes, a heavy axe across his knees and a leather apron of pouches, sits on an upturned crate with a blank black-bound book open in his lap and a folded handwritten list tucked into its lining; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, hovers before him; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Give Oren your account for his manifest, not the court’s book',
        outcome:
          'He listens without moving, then licks his pencil and writes in the lining, not the book: SCYLLA. WITNESS. OWN WORDS. NOT FOR THE BELLS. The court’s pages stay blank on his knee. ‘They’ll ring for me a third time,’ he says. ‘I’ve been rung for before.’',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'The hooded headsman writing small in a hidden list tucked inside a blank black book while a young princess talks, hands knotted together.',
      },
      {
        id: 'risk',
        label: 'Take the witness book from him and feed it to the current',
        outcome:
          'The book goes into the dark water, pages flapping like a caught ray. Oren watches it go. ‘Now they’ll write it themselves,’ he says gently, ‘and say I lost it. I know you meant it kindly, Highness.’ Far off a bell tolls his name a third time, and he rises to answer it.',
        effects: { danger: 2, trust: 1 },
        artSubject:
          'A black book tumbling away into a dark current, pages fanning, while the hooded headsman rises slowly from his crate, axe in hand, head turned toward a distant toll.',
      },
    ],
    echoes: [
      {
        flag: 'e05:3,8:care',
        text: 'Last time she told him she had lived this road once already. In the manifest’s margin, very small: ROPE, EXTRA. STILL.',
      },
      {
        flag: 'e05:3,8:risk',
        text: 'Last time she asked him to hold Char back. The hood stays turned toward her a moment longer than it needs to.',
      },
      {
        flag: 'e05:4,4:care',
        text: 'Beside the crate sits a third pack, labelled OREN. It has been confiscated twice tonight, and recovered twice, by him.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'Char’s iron grapple hangs from his apron. He found it in the nail bin where Scylla left it, and has carried it for her since.',
      },
    ],
  },
  {
    key: '4,8',
    place: 'Tide-Clock Passage',
    title: 'Forty Strokes From Slack',
    speaker: 'Scylla',
    kind: 'challenge',
    opening:
      'The throat of rock is a loop now. Each time the bronze tide clock strikes, a hollow bell note, Scylla is back at its mouth, the hand forty strokes from slack. Beside the clock, Char has scratched tallies: eleven. Only one thing changes from loop to loop: a few more streamers of weed lie the other way, toward open water, as if the sea were keeping its own count and showing her.',
    artSubject:
      'A narrow throat of dark rock in the sea where most weed streamers drag one way but a few lie the opposite way toward open water, an old green-bronze tide clock set into the wall mid-strike; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, at the mouth of the passage with faint ghostly afterimages of herself at the same spot; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label:
          'Ignore the clock and swim where the weed points, between strikes',
        outcome:
          'She waits for a strike, then goes with the weed, not the bronze. The water slackens under her, real slack, and she is through before the next note; behind her the clock strikes for nobody. Her lamp is gone, snagged somewhere in an earlier loop.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A young princess gliding out of the far end of a rock throat along a few reversed weed streamers, the bronze clock striking behind her in an empty passage.',
      },
      {
        id: 'risk',
        label: 'Jam the clock’s hammer with your hand before it can strike',
        outcome:
          'The hammer strikes her knuckles instead of the bronze, and the loop snaps like a line. Through the clock’s glass she sees the hammer is a bell clapper stamped with the court seal and both princesses’ names. The clocks have not been keeping time. They have been keeping testimony.',
        effects: { danger: 1, evidence: 2 },
        artSubject:
          'A young princess with her bruised hand jammed under the hammer of a bronze tide clock, the clock’s face open to show a bell clapper stamped with a seal.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,8:care',
        text: 'Last time she trusted this clock and waited, and it ran late. She has stopped trusting bronze.',
      },
      {
        flag: 'e05:4,8:risk',
        text: 'Last time the current slammed her into this rock. The old bruise aches each time the clock strikes.',
      },
      {
        flag: 'e05:6,6:care',
        text: 'Wenna’s chalk is still by the clock, CHECK AGAINST WATER, NOT BRONZE. Someone has scrubbed at it. Someone else has written it back, each loop.',
      },
      {
        flag: 'e05:6,6:risk',
        text: 'Scylla once smoothed tomorrow’s dial flat with a brass screw. Each loop the clock’s face is a little smoother, as if it learned how from her.',
      },
    ],
  },
  {
    key: '5,8',
    place: 'Ancient Anchor',
    title: 'Evidence of Intent',
    speaker: 'Scylla',
    kind: 'treasure',
    opening:
      'The ancient anchor leans where it always has. Behind it lie the boots, two pairs in oilcloth, skull heel and crown heel, but each lace is now tied to a small witness bell, and a court tag hangs from every boot: HELD AS EVIDENCE OF INTENT. Lift one carelessly and the bells will tell the whole passage what the sisters meant to do.',
    artSubject:
      'A colossal ancient anchor furred with green weed leaning against cave rock in deep blue light; behind it two pairs of small leather boots, one heel stitched with a skull, one with a crown, every lace tied to a tiny bronze bell and every boot hung with a paper tag; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, kneeling very carefully; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Pinch each clapper still and lift the boots one at a time',
        outcome:
          'It takes forever: eight bells, eight clappers held between finger and thumb while she works each knot loose with her teeth. Not one rings. The boots come away clean, and the tags stay behind on the anchor, swinging, reporting nothing.',
        effects: { supplies: 1, danger: -1 },
        artSubject:
          'A young mermaid holding a tiny bell’s clapper still between finger and thumb while she unknots a boot lace with her teeth, empty tags swinging on the anchor fluke.',
      },
      {
        id: 'risk',
        label: 'Cut tags and bells away and pitch them into the current',
        outcome:
          'One quick cut each. The bells go tumbling into the dark, tolling all the way down, and from ahead a great bell answers every one. The boots are the sisters’ again. Now Scylla knows where the great bell hangs: at the gate. So, now, does the court know where she is.',
        effects: { supplies: 1, evidence: 1, danger: 1 },
        artSubject:
          'Tiny bronze bells tumbling away into dark water as a young princess clutches two pairs of boots, a far greater bell glimmering faintly in the blackness ahead.',
      },
    ],
    echoes: [
      {
        flag: 'e05:run-again',
        text: 'The wax is new. Char hid them tonight: the same knot, the same fold, as if the night had been wound back and played again.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed, and the boots were never worn. The tags are old, the wax gone hard, and the bells have tolled every tide since for an intent nobody acted on.',
      },
      {
        flag: 'e05:tell-char',
        text: 'In the left boot, where her old note was, Char has left a new one: You told me how it ends. I’m still bringing boots. C.',
      },
      {
        flag: 'e05:5,8:care',
        text: 'Last time Scylla wrapped her pair back exactly as Char left them. The laces are still crossed Char’s way, under the bells.',
      },
      {
        flag: 'e05:5,8:risk',
        text: 'Last time she read the note in Char’s left boot. The court has read it since: a clerk’s neat copy is pinned to the tag.',
      },
    ],
  },
  {
    key: '6,8',
    place: 'Chalk Grotto',
    title: 'The Corrected Plan',
    speaker: 'Char',
    kind: 'companion',
    opening:
      'Char is scrubbing the grotto wall with her bare palms. Her escape plan is still there, fixed by the court’s corrections desk, which signs nothing: every arrow reversed, ME relabelled THE YOUNGER PRINCESS, FOLLOWED, YOU, LATE now THE ELDER PRINCESS, WHO DECIDED. ‘They’ve written you choosing for me,’ Char says, not turning, ‘in your handwriting. Is that what you remember? Don’t answer. Help or don’t.’',
    artSubject:
      'A shadowy grotto wall covered in a chalk escape diagram half overwritten in neat, different chalk with reversed arrows and formal labels; Char, her identical twin with dark violet scales, black lace and a furious scowl, scrubbing at it with her bare palms; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, behind her with a stick of chalk; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Hand her fresh chalk and let her redraw it her own way',
        outcome:
          'Char snatches it and draws fast and furious: a new route, not the one Scylla remembers, with a stop at the jetty and a second gate Scylla never knew existed. Above it, huge: MINE. It is a riskier plan than the old one. It is unmistakably hers.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char slashing a bold new chalk route across a scrubbed wall with one huge word above it, her twin holding out the rest of the chalk and keeping quiet.',
      },
      {
        id: 'risk',
        label:
          'Correct the court’s version yourself, line by line, from memory',
        outcome:
          'Scylla restores every arrow exactly as it was, accurate to the stroke. Char watches, arms folded. ‘From your memory,’ she says at last. ‘That’s what they did too, Scyl. Only nicer.’ She leaves the wall to Scylla and swims off to sulk where the bells are loudest.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A young princess carefully redrawing chalk arrows on a grotto wall while her violet-scaled twin watches with folded arms, already turning away.',
      },
    ],
    echoes: [
      {
        flag: 'e05:6,8:care',
        text: 'Last time Scylla said only what Char asked, and the wrong gate time stayed on the wall. The court has kept that line exactly. It is the only one they didn’t correct.',
      },
      {
        flag: 'e05:6,8:risk',
        text: 'Last time Scylla told her the gate time was wrong. Char’s snapped-chalk fix is still there, and the court has initialled it: APPROVED.',
      },
    ],
  },
  {
    key: '7,8',
    place: 'Moonlit Seam',
    title: 'Two Bells, One Mould',
    speaker: 'Ennis Gannet',
    kind: 'memory',
    opening:
      'Starlight still comes down through the crack beside the gate, but the smell of land is gone. Only sound comes now: bells being tuned, one note at a time. Beneath the seam sits Ennis Gannet, the court bellwright, with two new bells in her lap from one mould, the same face twice, one crowned, one in lace. ‘They want them to ring one note,’ she says. ‘Bronze doesn’t lie. These two won’t agree.’',
    artSubject:
      'A narrow ribbon of pale starlight falling through a crack in cave rock into dark water, beneath it a stocky older mer-woman bellwright in a scorched leather apron with two identical small bronze bells in her lap, each cast with the same girl’s face, one crowned and one framed in lace, tuning files beside her; Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, listening; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [
      {
        id: 'care',
        label: 'Strike each bell once and listen to how they differ',
        outcome:
          'Two notes, close and stubborn, neither giving way. Ennis nods as if a patient had finally spoken. At the gate the whole hanging forest of bells shivers in answer, and Scylla understands: they are waiting for these two.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A young princess striking one of two small face-cast bells with a fingernail in a shaft of starlight, the bellwright listening with her eyes closed.',
      },
      {
        id: 'risk',
        label:
          'Ask Ennis to file them until they ring alike, so the court leaves her be',
        outcome:
          'Ennis files until her wrists ache and the two bells sing one note, clean and obedient. ‘There,’ she says. ‘Now neither of them is you.’ The gate’s bells settle, satisfied. Scylla is safer, and cannot remember, suddenly, which face was hers.',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'A bellwright filing the rim of a small bronze bell, bright filings drifting down through starlight, a young princess staring at two bells whose faces now look exactly alike.',
      },
    ],
    echoes: [
      {
        flag: 'e05:7,8:notice',
        text: 'Last time she held her hand in this starlight until her fingers ached. It is no colder tonight. It only sounds different.',
      },
      {
        flag: 'e05:5,5:care',
        text: 'Ennis hums the farewell song as she tunes, under her breath, and stops dead when the bells at the gate begin to pick up the melody.',
      },
      {
        flag: 'e05:5,5:risk',
        text: 'Somewhere a fiddle starts the farewell song and stops mid-phrase, the way Scylla once stopped it, and the bells hold the silence afterwards like a note.',
      },
    ],
  },
  {
    key: '8,8',
    place: 'Hidden Landward Gate',
    title: 'The Witness Bells',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Hundreds of witness bells hang on the landward gate, each cast with a name; all toll when the court reads its one history: one sister decided, one followed. On the bars are eleven tallies in Char’s hand, a twelfth in Scylla’s. Salter offers a blank ledger: both accounts, contradicting, public forever, grief and all. Oren holds a seal: nobody compels either sister again, and the court’s version stands until others disprove it. Char looks up. ‘Whatever we pick, nobody tells it for me.’',
    artSubject:
      'A massive weed-furred green-bronze sea gate hung from top to bottom with hundreds of small bronze bells, each cast with a face, all swinging in unison; a reform councilor holding out an open blank ledger, the hooded headsman Oren Pike holding a heavy lock and wax seal; Char, her identical twin with dark violet scales, black lace and a defiant, furious look, glaring up at the bells beside Scylla, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze; twelve tally marks scratched on one bronze bar, the ancient anchor looming behind; same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits.',
    choices: [],
    echoes: [
      {
        flag: 'e05:run-again',
        text: 'They ran from this gate once already. The night has been wound back and hung with bells, so that they may testify forever to having run.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed, and the court called it safety. The gate has been its shrine ever since, and the bells are its congregation.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Char knows how the first road ended, because Scylla told her. The court has spent days trying to toll it out of her. She is still here.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Somewhere among these bells hangs one for a Char who died at a sea gate years from now. The girl beside Scylla is alive and furious, and nobody’s evidence.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Scylla’s account has commuters in it, still waiting under a sealed gate. Whatever record she makes, they are in it.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Scylla’s account has a district in it that a map called empty. The court would very much like one history that keeps it that way.',
      },
    ],
  },
]
