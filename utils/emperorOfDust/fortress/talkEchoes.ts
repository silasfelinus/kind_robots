import { type FlagGate, type FortressRun, gateHolds } from './types'

// Barracks echoes (conductor emperor-of-dust t-051): what a follower says in
// passing, in their own voice, once a talk has left a mark. Every flag a
// barracks answer sets is read here or somewhere later in the story, so no
// answer is only a different wording of another. The barracks shows the echo
// of the follower's newest decision; a follower who also has daily chatter
// alternates the two, so neither crowds out the other.
//
// Echoes name nobody but the speaker: another follower may be dead or gone by
// the time the line is shown. They are spoken lines; the barracks puts the
// quotation marks round them.

export type TalkEcho = FlagGate & { follower: string; text: string }

export const TALK_ECHOES: readonly TalkEcho[] = [
  // --- F001 Rook Bramble: clipped, road-minded, says less than they mean ----
  {
    follower: 'F001',
    flags: ['rook-scout-exiled'],
    text: 'Saltroad’s long. I count her days down it. She’ll be past the salt flats by now. Ruler’s answer. I’m still taking it.',
  },
  {
    follower: 'F001',
    flags: ['rook-scout-hanged'],
    text: 'I sleep fine. Ask anyone. I don’t go up on the roof now. That’s not the same thing as not sleeping.',
  },
  {
    follower: 'F001',
    flags: ['rook-stays-close'],
    text: 'Back to the north. That’s how I sit now. You asked. It’s easier than I said it would be. Most nights.',
  },
  {
    follower: 'F001',
    flags: ['rook-kept-from-road'],
    text: 'You said you’d lost one friend to that road. I heard the ‘one’. I’m not going to be the second.',
  },
  {
    follower: 'F001',
    flags: ['rook-asks-together'],
    text: 'Together, at the end, you said. I keep the question warm for both of us. It’s getting heavy. I don’t put it down.',
  },
  {
    follower: 'F001',
    flags: ['rook-sent-to-ask'],
    text: 'You sent me to ask him why. I’m still deciding whether I asked. Don’t look at the rope.',
  },
  {
    follower: 'F001',
    flags: ['rook-promise-heard'],
    text: 'You heard the promise first, then kept it. Eleven wagons in the dry wash. I ride the far ridge past them. They know I’m there.',
  },
  {
    follower: 'F001',
    flags: ['rook-crown-saddle'],
    text: 'Crown leather rides stiff. Posts wave me through now. The Pack scouts don’t wave at all. They just watch me go by.',
  },
  {
    follower: 'F001',
    flags: ['rook-old-saddle'],
    text: 'Searched twice this week. The Ford sergeant knows my girth stitching better than I do. Pack rode close yesterday. Worth it.',
  },
  {
    follower: 'F001',
    flags: ['rook-cistern-marked'],
    text: 'Queue at the ridge stone now. Watch, Freeholders, a peddler with three goats. Nobody owns the water. Somebody took the cup, though.',
  },
  {
    follower: 'F001',
    flags: ['rook-cistern-kept'],
    text: 'That rider came off the ridge with his tongue split. I knew where the water was. So did you. I ride past it every week.',
  },
  {
    follower: 'F001',
    flags: ['rook-sergeant-reported'],
    text: 'His stripes are still on the woodpile. Nobody burns them. Nobody touches them. The Ford bell rings on time now.',
  },
  {
    follower: 'F001',
    flags: ['rook-sergeant-moved'],
    text: 'New man at the Ford rings at every shadow. I ride through a lot of bells. Better than none. He’ll learn.',
  },
  {
    follower: 'F001',
    flags: ['rook-carried-knife'],
    text: 'She knew it by the handle. Didn’t say anything else. Didn’t need to. Tell the Watch I’m sorry about the wagon.',
  },
  {
    follower: 'F001',
    flags: ['rook-knife-sent'],
    text: 'Watched that wagon to the bend. That’s as far as a knife goes once you let it go. I don’t ask if it got there.',
  },
  {
    follower: 'F001',
    flags: ['rook-kept-route'],
    text: 'Komodo thanked me in front of everyone for keeping the ridge route. I’ve been thanked like that before. By a sergeant, right before a search.',
  },
  {
    follower: 'F001',
    flags: ['rook-postern-judged'],
    text: 'Walked him to the last cairn. He asked me which road. I pointed. I kept his coat. Didn’t know what else to do with it.',
  },
  {
    follower: 'F001',
    flags: ['rook-postern-spared'],
    text: 'Two Watchmen won’t sit at our fire now. One walked off for good. Maybe he was right. I’d still let the boy go.',
  },
  {
    follower: 'F001',
    flags: ['rook-shared-blame'],
    text: 'You told the fire you gave Komodo the ridge. Nobody’s said a word since. That’s the Watch forgiving you. It looks like nothing.',
  },

  // --- F002 Saffron Kett: machinist, talks in welds and seams, laughs late --
  {
    follower: 'F002',
    flags: ['saffron-badge-unasked'],
    text: 'Lid stays shut. You never asked what’s under it. I keep waiting for you to. Like a valve you know is going to stick.',
  },
  {
    follower: 'F002',
    flags: ['saffron-badge-kept'],
    text: 'Lid stays shut. You, me and the hinge. Hinge doesn’t talk. Neither do you. That’s good company.',
  },
  {
    follower: 'F002',
    flags: ['saffron-friendship'],
    text: 'Best company in the fortress. You said it. I scratched it inside my goggles where only I can read it. Don’t look.',
  },
  {
    follower: 'F002',
    flags: ['saffron-told-sabotage'],
    text: 'You told me the truth about the pin. I hate that. I’d hate a lie more. I’d have filed it in the same place. That’s the worst part.',
  },
  {
    follower: 'F002',
    flags: ['saffron-told-midnight'],
    text: 'You put the workshop in it. I told you not to. Then I lay awake glad you did. Don’t do it again. Probably.',
  },
  {
    follower: 'F002',
    flags: ['saffron-lied-to'],
    text: 'The canyon engine still whines at night. Pin’s in my apron. Some days I take it out and look at it. Then at you.',
  },
  {
    follower: 'F002',
    flags: ['saffron-unpicked-sabotage'],
    text: 'Canyon engine sips now. Nobody from the Bell has come with a crowbar yet. Yet. I keep a spare pin cut, in case.',
  },
  {
    follower: 'F002',
    flags: ['saffron-pass-unnamed'],
    text: 'Pass with no name on it. Funny thing to keep. It’s in the toolkit, under the badge. Two things nobody’s supposed to know.',
  },
  {
    follower: 'F002',
    flags: ['saffron-trusted'],
    text: 'You didn’t make me promise. So I came back early to prove I would have. Dirty trick. I fell for it. Do it again sometime.',
  },
  {
    follower: 'F002',
    flags: ['saffron-pass-named'],
    text: 'My name’s in the Watch book now. Pack camp, emperor’s machinist. Sergeants nod at me. Some of them nod harder than others.',
  },
  {
    follower: 'F002',
    flags: ['saffron-promised-return'],
    text: 'Promised twice. Kept it once. That’s how it works: the second promise holds the first in place. Lock nut.',
  },
  {
    follower: 'F002',
    flags: ['saffron-fire-hooded'],
    text: 'Next year, without the hood. You said yes. I’ve got a coat picked out for you. It’s awful. You’ll wear it.',
  },
  {
    follower: 'F002',
    flags: ['saffron-hoist-kept'],
    text: 'Hoist runs smooth. Porter on the stair still spits. I oil the wheel. He spits. We’re both very regular about it.',
  },
  {
    follower: 'F002',
    flags: ['saffron-hoist-down'],
    text: 'The hoist wheel’s on my bench. I spin it when I think. Never stops where I want. Best thing I ever unbuilt.',
  },
  {
    follower: 'F002',
    flags: ['saffron-mission-iron'],
    text: 'Bridge holds. A sister blessed it. I check the bolts every week anyway. Not because they’ll fail. Because of whose they are.',
  },
  {
    follower: 'F002',
    flags: ['saffron-refused-iron'],
    text: 'Wagon went over at the Ford. Two drowned. Our iron came in the week after. I keep doing the sums. They come out the same.',
  },
  {
    follower: 'F002',
    flags: ['saffron-drawings-given'],
    text: 'Three copies, and one went missing on the road. Somewhere out there somebody’s reading my red marks. I sleep with the lamp lit.',
  },
  {
    follower: 'F002',
    flags: ['saffron-drawings-burned'],
    text: 'Everything in those drawings lives in my head now. So don’t lose me. I mean that more every day.',
  },
  {
    follower: 'F002',
    flags: ['saffron-asked-pack'],
    text: 'Badge on the outside now. The Jaws ride for me, and I ride for you. Somebody sends the bill in spring. Probably me.',
  },
  {
    follower: 'F002',
    flags: ['saffron-pack-refused'],
    text: 'Half a cup of water. I gave you mine. You noticed. I wanted you to. That’s me and the Pack, start to finish.',
  },
  {
    follower: 'F002',
    flags: ['saffron-wrench-given'],
    text: 'Gave their captain back his wrench. Twenty years I carried it. My paw feels light. Worst apology you ever made. Best one I took.',
  },
  {
    follower: 'F002',
    flags: ['saffron-made-way'],
    text: 'You gave me a proper answer. I mended a saddle that wasn’t mine to mend. That’s all I’m saying about it. Pass the wrench.',
  },

  // --- F003 Kiyo: formal, careful, every sentence measured like a dose ------
  {
    follower: 'F003',
    flags: ['kiyo-tea-for-all'],
    text: 'The tea ran out on Thursday, Majesty. The crushed hand healed straight. I would pour it the same way again. I would like more tea.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-tea-rationed'],
    text: 'Willow bark for the Yard, tea for the roads. It is in the infirmary book. I read it back to myself sometimes, to be honest about it.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-pup-home'],
    text: 'The blanket came back washed, with a painted feather. I keep the feather in my needle case. My son wants it. He cannot have it.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-pup-questioned'],
    text: 'I stopped it twice, Majesty. Not the third time. I have washed my hands many times since. It does not take.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-pup-ward'],
    text: 'She sings every Yard song now, louder than the Yard. Her people send nothing. I listen for a word every day, so she does not have to.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-bell-muffled'],
    text: 'The midnight bell speaks through a sock. He sleeps through it. The Watch muffles it for their own children now. I did not ask them to.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-bell-rung'],
    text: 'The bell rings full and he wakes at the first stroke. I keep the lamp lit. We are both getting good at the dark.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-seedlings-asked'],
    text: 'You asked after the seedlings before you asked about him, Majesty. That was well done. Two still live. The thimble child waters them at dawn.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-told-truth'],
    text: 'He still shouts Komodo at the birds. He knows what the word means now. He shouts it anyway. I have stopped correcting him.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-kind-lie'],
    text: 'A long errand, I told him. He asks every night if it is finished. I say not yet. I have never lied to him so often.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-mended-condemned'],
    text: 'I sewed him neat. They hanged him neat. I boil my needles twice now, Majesty. It is not for the needles.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-refused-gallows'],
    text: 'The Watch surgeon sews the way a farmer mends a fence. I heard the crowd from here. My hands stayed clean. I am not sure they are.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-kept-apart'],
    text: 'My son cried two nights for the Yard boy. The Watch caught the boy in the Ledger stores after. I hear he is well. I hear it from other people.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-took-yard-boy'],
    text: 'Two cots under one table now. They fight over the blanket. They both sleep through the bell. You did that, Majesty.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-used-verge-cure'],
    text: 'The girl asks every day where the tall stranger in gloves went. I write it down each time. Someone should keep the count.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-poured-cure'],
    text: 'She lives. She will not run the wall again. Some mornings I think about that drain. Most mornings I do not let myself.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-worst-first'],
    text: 'A Watch corporal nods to me on the stair. A small nod. He waited all night on my floor. He has not forgotten whose rule it was.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-ours-first'],
    text: 'His name is on the wall by the door. I spelled it as best I could. Nobody has corrected it. I wish someone would.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-zuzu-runner'],
    text: 'He practises being quiet now, Majesty. He is already very good at it. I would like him to be worse.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-zuzu-kept'],
    text: 'He climbed to the roof to watch the road and nobody saw him go up. I could not scold him. He is learning quiet without permission.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-postern-reported'],
    text: 'The new man on the postern is very young and proud of it. I take him tea at the third bell. He drinks it like medicine.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-postern-asked'],
    text: 'He remembered the dew on the shoe, Majesty. Every detail right. Honest people get something wrong. I keep thinking about that.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-postern-let-lie'],
    text: 'My son’s cot stands in the middle of the room, away from every wall. He thinks it is a game. Let him.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-trusted'],
    text: 'You signed the report yourself. The Watch knows whose name that is. So do the people who carry wounded to my door at night.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-cup-stayed'],
    text: 'I make two cups now without deciding to. Then I remember the state of your banners and laugh at you, alone, at the table.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-cup-friends'],
    text: 'Friends when the doors are shut. I argued with you in front of the Watch today, Majesty. You noticed. Good.',
  },
  {
    follower: 'F003',
    flags: ['kiyo-cup-only-yourself'],
    text: 'He asks when you are coming back only yourself. I told him you have to practise. He thinks that is very funny.',
  },

  // --- F004 Duchess Flint: slow, formal, counts people, never threatens -----
  {
    follower: 'F004',
    flags: ['flint-vask-threatened'],
    text: 'Lady Vask no longer greets me in the hall, Majesty. I had not known I would miss it. One misses odd things, at my age.',
  },
  {
    follower: 'F004',
    flags: ['flint-vask-promise'],
    text: 'You promised me before I could ask. I am not used to that. I have told nobody. I will tell everyone, eventually. Slowly.',
  },
  {
    follower: 'F004',
    flags: ['flint-spoke-for-vask'],
    text: 'I spoke for her chair. The Old Houses applauded. I sat on the floor afterwards. It is a very honest floor.',
  },
  {
    follower: 'F004',
    flags: ['flint-apology-public'],
    text: 'They heard it. Every one. Lady Vask left before the end. I find I can sit in a chair now without it meaning anything.',
  },
  {
    follower: 'F004',
    flags: ['flint-grain-repaid'],
    text: 'The ledger is whole. Nobody stole and nobody was wronged. I turn my ring inward and outward and cannot decide which is honest.',
  },
  {
    follower: 'F004',
    flags: ['flint-acquittal-kept'],
    text: 'The Moles thanked the crown for its gift. It is true now. I watched it become true, Majesty, one thanks at a time.',
  },
  {
    follower: 'F004',
    flags: ['flint-acquittal-recorded'],
    text: 'It is in the court book in your hand. I read it again yesterday. It still says what happened. That is rarer than you would think.',
  },
  {
    follower: 'F004',
    flags: ['flint-names-in-reports'],
    text: 'Three names at supper, then five, then two. The clerks read them now without being asked. The barracks has learned how to be quiet.',
  },
  {
    follower: 'F004',
    flags: ['flint-numbers-only'],
    text: 'I keep the names in the back of my book. Every one. My hand is slow and the war is fast. I am eleven names behind.',
  },
  {
    follower: 'F004',
    flags: ['flint-forgers-admitted'],
    text: 'Three more families came with the same thumbprint. I will tell you when the fourth comes, Majesty. I expect it on Tuesday.',
  },
  {
    follower: 'F004',
    flags: ['flint-forgers-turned'],
    text: 'I gave the mother my shawl. I have another. It is not as warm. I wear it anyway. It seems the least I can do.',
  },
  {
    follower: 'F004',
    flags: ['flint-moved-moles'],
    text: 'The Moles sit near the head of the table and Lady Vask sits in the draught. Majesty, I have never been so comfortable at a dinner.',
  },
  {
    follower: 'F004',
    flags: ['flint-seating-kept'],
    text: 'I sat by the door with her. The draught is dreadful. We discussed it at length. She is better company than the Old Houses.',
  },
  {
    follower: 'F004',
    flags: ['flint-carried-threat'],
    text: 'I carried it. Nobody burned. I do not sit on the floor anymore, Majesty. I am not sure I have earned the floor.',
  },
  {
    follower: 'F004',
    flags: ['flint-threat-refused'],
    text: 'Smoke below the ridge on the new moon. I counted it. Someone should. I would rather it was me than nobody.',
  },
  {
    follower: 'F004',
    flags: ['flint-word-kept'],
    text: 'You kept your word to me when it cost you the camp. I will spend the rest of my life deciding whether to thank you. I have begun.',
  },
  {
    follower: 'F004',
    flags: ['flint-trials-one-by-one'],
    text: 'One by one. I have heard four. Three walked free. The fourth thanked me for my patience. I am still deciding what she meant.',
  },
  {
    follower: 'F004',
    flags: ['flint-abbey-scattered'],
    text: 'I kept the list. I read it in the evenings. Every village in the country has one of these names now. So does every road.',
  },

  // --- F005 Pip Thread: archival, exact, hides feeling in footnotes ---------
  {
    follower: 'F005',
    flags: ['pip-told-of-mother'],
    text: 'Sat down on the pump step. That is in the margin now. Margins are where the true parts go. Nobody reads them. I do.',
  },
  {
    follower: 'F005',
    flags: ['pip-record-sacred'],
    text: '‘Whoever asks.’ I have underlined it twice now. The second line is for the day someone important asks.',
  },
  {
    follower: 'F005',
    flags: ['pip-trusted-komodo'],
    text: 'The page is still in the chest. Uncopied, officially. Unofficially there are eleven. I file them where nobody looks. I look.',
  },
  {
    follower: 'F005',
    flags: ['pip-page-unsure'],
    text: '‘Not knowing.’ I filed that too. Under pending. It is my largest drawer.',
  },
  {
    follower: 'F005',
    flags: ['pip-ledger-acted'],
    text: 'The Yard ate full bread. The Ledger calls it a guess. My loaf is still on the shelf. It has gone hard. I do not eat records.',
  },
  {
    follower: 'F005',
    flags: ['pip-ledger-waited'],
    text: 'Seven nights short. I told you the number of loaves once. I will not tell you again. I still know it.',
  },
  {
    follower: 'F005',
    flags: ['pip-absolved'],
    text: '‘Nobody saw it.’ I have added a line underneath: nobody looked. My handwriting gets smaller when I am right.',
  },
  {
    follower: 'F005',
    flags: ['pip-well-repaid'],
    text: 'The Yard has a goat now. It is in no register. I keep meaning to enter it. I keep not.',
  },
  {
    follower: 'F005',
    flags: ['pip-well-corrected'],
    text: 'Three years, in the margin, smaller than the date. That is the correct size for it. I measured.',
  },
  {
    follower: 'F005',
    flags: ['pip-yard-census'],
    text: 'Four days counting. Then three families gone from the north side. A list is a door. I did not think about who else could use it.',
  },
  {
    follower: 'F005',
    flags: ['pip-no-census'],
    text: 'The north side runs out of bread first. Every week. I write down which side. The page is long now. It all says the same thing.',
  },
  {
    follower: 'F005',
    flags: ['pip-copy-archived'],
    text: 'The Archive receipt is in my shirt. Purple ink. Somebody else is responsible for the register now. I have never slept so badly.',
  },
  {
    follower: 'F005',
    flags: ['pip-copy-in-tower'],
    text: 'I wear the string round my wrist. It held the volumes together. Now it holds me. That was a joke. I am practising.',
  },
  {
    follower: 'F005',
    flags: ['pip-forged-roster'],
    text: 'One line. Perfect. I burned the scrap. My hand remembers the shape of her letters. I would like it to forget.',
  },
  {
    follower: 'F005',
    flags: ['pip-scrap-kept'],
    text: 'I kept the scrap, folded with your answer from the first week. Two documents. One cites the other. That is how I know I meant it.',
  },
  {
    follower: 'F005',
    flags: ['pip-refused-forgery'],
    text: 'He limps. I sit with him. I forged nothing, so the roster is still true. That is a footnote, not a comfort.',
  },
  {
    follower: 'F005',
    flags: ['pip-register-shared'],
    text: 'Their fire says the names every night. Then other names: the ones to find. I hear both lists. I only wrote one.',
  },
  {
    follower: 'F005',
    flags: ['pip-register-held'],
    text: 'The clerk does not sit with me now. The register is whole and checked. It is very quiet, being right.',
  },
  {
    follower: 'F005',
    flags: ['pip-copy-dug-up'],
    text: 'The oilcloth held. I folded it, so of course it held. I still write the register out. Copies are how you keep a thing, not how you finish it.',
  },

  // --- F006 Nera Gale: dry, weather-minded, insults the Heights fondly ------
  {
    follower: 'F006',
    flags: ['nera-forecast-burned'],
    text: 'You burned a dry season, Majesty. The reeves never knew it was coming. Good. Weather is better without an audience.',
  },
  {
    follower: 'F006',
    flags: ['nera-forecast-given'],
    text: 'The reeves dug deeper before the dry. Your factor still wants to know why anyone would give away rain. I have stopped explaining.',
  },
  {
    follower: 'F006',
    flags: ['nera-forecast-kept'],
    text: 'The forecast sold well, I hear. I draft for you again. I leave the prices off. You can add them. I will not watch you do it.',
  },
  {
    follower: 'F006',
    flags: ['nera-told-trust-komodo'],
    text: 'The glass still turns the wrong way at briefings. ‘Badly sourced.’ I write it down. I do not believe the glass. Much.',
  },
  {
    follower: 'F006',
    flags: ['nera-friendship'],
    text: 'You went in before the storm broke. You were right. I stayed out. I was also right. That is friendship, in the Heights.',
  },
  {
    follower: 'F006',
    flags: ['nera-opened-own-letter'],
    text: 'I opened it myself and you sat there and did not touch it. My paws remember that better than the letter.',
  },
  {
    follower: 'F006',
    flags: ['nera-heard-letter'],
    text: 'The letter is in my coat. Unanswered. ‘Courtesy between neighbours.’ I read it when the weather is fine, to spoil it.',
  },
  {
    follower: 'F006',
    flags: ['nera-writes-home'],
    text: 'I write home every week. Warm, evasive, excellent work. My teacher replies at length. You get the copies. I sleep worse than I lie.',
  },
  {
    follower: 'F006',
    flags: ['nera-warned-freeholds'],
    text: 'The black feather is on my sill. The Conclave knows. A third of the wheat is in the Freehold barns. I would earn the feather again.',
  },
  {
    follower: 'F006',
    flags: ['nera-kept-hail'],
    text: 'The hail lasted eleven minutes. I timed it. The wheat below the Ford took eleven minutes to lose. I am very accurate.',
  },

  // --- F007 Ash Quill: quick, nervous, runs on and then stops dead ----------
  {
    follower: 'F007',
    flags: ['ash-asked-abbey'],
    text: 'They gave me soup. She counted on her cord the whole time. I count now too. Letters, steps, days. It doesn’t help. Anyway.',
  },
  {
    follower: 'F007',
    flags: ['ash-wrote-honestly'],
    text: 'Two letters, nearly word for word, same sister’s hand. I know hands. I know when one is copying itself. Sorry. I’m fine.',
  },
  {
    follower: 'F007',
    flags: ['ash-hourglass-told'],
    text: 'Between us. I answer him warmly at briefings. I’m very good at warm. My ears give me away, so I keep my hood up.',
  },
  {
    follower: 'F007',
    flags: ['ash-hourglass-dismissed'],
    text: '‘Half the court.’ Right. I hold his letters a breath longer than the rest. Just a breath. Then I let them go. I always let them go.',
  },
  {
    follower: 'F007',
    flags: ['ash-papers-sealed'],
    text: 'The crown stamped my forgeries real. My ears were pink for a week. The families are inside the walls. So that’s fine. That’s good. Fine.',
  },
  {
    follower: 'F007',
    flags: ['ash-papers-shown'],
    text: 'My name’s in the Watch book in red. Red ink! Do you know how hard red is to forge? Very. I checked. Habit.',
  },
  {
    follower: 'F007',
    flags: ['ash-friendship'],
    text: '‘As a friend.’ I said that was a lot. It still is. I keep it in the satchel with the post. Weighs nothing. That’s the good part.',
  },
  {
    follower: 'F007',
    flags: ['ash-honest-answer'],
    text: '‘Everything a crown can.’ I read your letter again last night. Still true after the hard part. I check it like a seal.',
  },
  {
    follower: 'F007',
    flags: ['ash-opened-komodo-letter'],
    text: 'Grain prices. That’s all it was. I resealed it perfectly. I can still feel the hot knife. I haven’t opened another. I want to.',
  },
  {
    follower: 'F007',
    flags: ['ash-delivered-unopened'],
    text: 'He slit it with one claw and walked off. A courier who opens one letter opens them all. I keep saying it. Out loud, sometimes.',
  },

  // --- F008 Bram Coil: a quartermaster’s plain arithmetic -------------------
  {
    follower: 'F008',
    flags: ['bram-one-ration'],
    text: 'One ration. The slate says so. The outriders stopped grumbling on the ninth day. I counted. Dunmore brings the pipe on Thursdays.',
  },
  {
    follower: 'F008',
    flags: ['bram-levied-asked'],
    text: 'You asked about the stencil. Bread remembers. I stamp the barracks loaves now too. Same order. Same belly. Same thanks owed.',
  },
  {
    follower: 'F008',
    flags: ['bram-spared-tunnels'],
    text: 'Somebody props the larder door open when I’m inside. Nobody says why. I say thank you to the door. It’s easier.',
  },
  {
    follower: 'F008',
    flags: ['bram-sent-below'],
    text: 'Three days under the rail line. I came up. That’s the whole of it. I don’t go near the cellar stair, and nobody makes me.',
  },
  {
    follower: 'F008',
    flags: ['bram-held-ration'],
    text: 'Two thirds. I eat mine at the table where they can see. Three more sentries fell this week. The stores hold. So do I.',
  },
  {
    follower: 'F008',
    flags: ['bram-watch-fed'],
    text: 'I told the Yard myself, to their faces. They didn’t thank me. They weren’t meant to. The Watch stands its walls on full bellies.',
  },

  // --- F009 Keel Understone: a surveyor’s short measured lines --------------
  {
    follower: 'F009',
    flags: ['keel-talks-down'],
    text: '‘Crown’s mole.’ Split lip. They’re waiting, though. Down there, waiting is measured in feet of dirt. They’ve stopped digging.',
  },
  {
    follower: 'F009',
    flags: ['keel-houses-warned'],
    text: 'Cellars empty, servants in the stables. The cell keeps asking who told. I sit with them and wonder too. Out loud. It’s a skill.',
  },

  // --- F010 Lumen Shale: names, sashes, the work of keeping a people -------
  {
    follower: 'F010',
    flags: ['lumen-confessed'],
    text: 'I said it in the hall. Eleven, nine, two. Nobody told me it wasn’t my fault. The burrow folk touch my sash when they pass. It weighs more now.',
  },
  {
    follower: 'F010',
    flags: ['lumen-named-jars'],
    text: 'I named the jars. The Mothers’ envoy wrote nothing down. A person who writes nothing down is remembering. I sleep nearer the door.',
  },
  {
    follower: 'F010',
    flags: ['lumen-visits-families'],
    text: 'Two new names inside the hem, where only I see them. Nine families gave me bread. Two gave me the door. I stitched both.',
  },
  {
    follower: 'F010',
    flags: ['lumen-isolde-heard'],
    text: 'I named the healer, not the coven. Someone at the back kept her lantern dark the whole time. I leave a bunk empty for her. It stays empty.',
  },
  {
    follower: 'F010',
    flags: ['lumen-isolde-walked'],
    text: 'Nine days on foot beside someone who does not like me. She carried my pack the last mile. I stitched the mile into the sash. Not the name.',
  },
  {
    follower: 'F010',
    flags: ['lumen-honest-answer'],
    text: 'You didn’t know. Good. The crooked line under the tower stays crooked. Straight lines are for people who already know.',
  },
  {
    follower: 'F010',
    flags: ['lumen-absolved'],
    text: 'Everyone read him wrong, the crown worst. It helps less than it should. I’m still stitching. The needle doesn’t care whose fault.',
  },

  // --- F011 Tamsin Gutterwing: sharp, guarded, high up and ready to go ------
  {
    follower: 'F011',
    flags: ['tamsin-knots-cut'],
    text: 'No knots. I keep touching where they were. Bunk’s too soft. I sleep on it anyway. You signed. I’m holding you to that.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-read-forecast'],
    text: 'I read it. Rain on the ninth. The second messenger is still on the sill, waiting for me to carry again. He can wait.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-burned-forecast'],
    text: 'Watched the rain run off into the Ford with the cisterns shut. Mine as much as yours. I’d burn it again. Don’t like that I would.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-no-climbing'],
    text: 'Wall’s the wall. I brought them down. The small one’s bite healed. He doesn’t talk to me now. Fair.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-flue-bricked'],
    text: 'They bricked my flue. Boots on, every night. You don’t know you’ve got a back door till it’s mortar.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-flue-kept'],
    text: 'Boots off. First time since the Heights. Don’t make it a thing.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-kept-spy'],
    text: 'The girl’s on the wardrobe with me. She snores. Elder Corvane can remember all he likes. I’ve got a fledgling to feed.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-spy-returned'],
    text: 'Gave her a knife, hilt first. She’ll cut the knots or she won’t. I won’t be there either way. That’s the point.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-runs-again'],
    text: 'Chimes are still wrapped. I carried. Once. That was the deal. Don’t ask twice.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-carried-for-children'],
    text: 'Dirty way to ask. It worked. The two from the east wall sit on my beam now and time my runs. They’re slower than me. For now.',
  },
  {
    follower: 'F011',
    flags: ['tamsin-runs-for-none'],
    text: 'We brought their runner down in spring. The draught in the second cave. I could have told him. Nobody asked me. You made sure.',
  },

  // --- F012 Brother Teodor Lull: gentle, wry, counting beds and bowls -------
  {
    follower: 'F012',
    flags: ['teodor-hushed'],
    text: '‘My old troubles are my own.’ You said it kindly. I keep them in the pantry with the barley. They don’t keep as well.',
  },
  {
    follower: 'F012',
    flags: ['teodor-beds-shared'],
    text: 'Forty. I gave you the number and now I sleep better. That is a terrible thing to say. The goat joke has improved, though.',
  },
  {
    follower: 'F012',
    flags: ['teodor-needs-proof'],
    text: 'Proof means going and looking. I am still deciding whether I am brave enough to look. Soup is easier. Soup is always easier.',
  },
  {
    follower: 'F012',
    flags: ['teodor-letters-read'],
    text: 'You read every letter first and never cross anything out. Sometimes I wish you would. Then I would know which line worried you.',
  },
  {
    follower: 'F012',
    flags: ['teodor-coldbrooks-guarded'],
    text: 'The Coldbrook baby cries for breakfast like any baby. I listen for it every morning. The letters stopped. The listening hasn’t.',
  },
  {
    follower: 'F012',
    flags: ['teodor-invitation-burned'],
    text: '‘Always room for more.’ I watched the bell in the wax go soft. Then I made soup and hummed. I had not hummed in years.',
  },
  {
    follower: 'F012',
    flags: ['teodor-took-sister'],
    text: 'She asked how many beds the Yard has. I told the crown, not her. We peel potatoes side by side and count. She counts too.',
  },
  {
    follower: 'F012',
    flags: ['teodor-sister-questioned'],
    text: 'She has stopped talking. I bring soup to the bars and sit. The Abbey taught us both silence. She learned it better.',
  },
  {
    follower: 'F012',
    flags: ['teodor-sister-sent-on'],
    text: 'I don’t know which way she turned at the Ford. I pray at both roads now. It doubles the work. I don’t mind the work.',
  },
  {
    follower: 'F012',
    flags: ['teodor-fed-hosts'],
    text: 'The hosts’ children ate full. A Watchman had my bowl. Hunger is an argument. I lose it politely every night.',
  },
  {
    follower: 'F012',
    flags: ['teodor-fed-court'],
    text: 'There is a guard on the hosts’ well now. Hosts guarding against guests. I slip their children seconds when nobody is counting.',
  },

  // --- F013 Mags Ironhide: few words, all of them load-bearing -------------
  {
    follower: 'F013',
    flags: ['mags-read-truth'],
    text: 'Dunmark knew I’d show somebody. I showed you. Door slammed. Good door. Holds.',
  },
  {
    follower: 'F013',
    flags: ['mags-reports-to-watch'],
    text: 'Every week you read it out. Every week you change a word. Don’t know which. Know you do. Fine. Wall with a door.',
  },
  {
    follower: 'F013',
    flags: ['mags-stepped-aside'],
    text: 'Stood aside for the drivers. Floor’s still there where I stood. I stand on it at night. Nobody asks.',
  },
  {
    follower: 'F013',
    flags: ['mags-held-door'],
    text: 'Held the door. Factor glared at it all night. Saltroad’s cold to us now. Door’s fine.',
  },

  // --- F014 Pell Quickmarrow: rail-yard patter, rules, forty pockets --------
  {
    follower: 'F014',
    flags: ['pell-under-note'],
    text: 'Lower than the Bell, like something under it holding it up. You asked, so now I listen for it at night. Thanks for that. Really.',
  },
  {
    follower: 'F014',
    flags: ['pell-debt-paid'],
    text: 'Rule of the rail yards: owe nobody. Broke it. New lens on your desk every week. That’s interest. Don’t argue with interest.',
  },
  {
    follower: 'F014',
    flags: ['pell-stash-taken'],
    text: 'Thirty-nine pockets empty, one full. Lightest I’ve walked since I was small. Don’t recommend it. Don’t regret it.',
  },
  {
    follower: 'F014',
    flags: ['pell-debt-refused'],
    text: 'Salt’s a copper dearer at our gate. Only ours. I cover the difference. Don’t look at the books. It’s rude.',
  },
  {
    follower: 'F014',
    flags: ['pell-sold-handcar'],
    text: 'Sold the handcar, debt’s clear, slept like a stone. Woke up owning nothing. Highly recommended. Twice a lifetime, tops.',
  },
  {
    follower: 'F014',
    flags: ['pell-kept-handcar'],
    text: 'I oil it Thursdays, after dark. The Saltroad agent keeps calling. I keep my pockets buttoned. All forty. He hates that.',
  },

  // --- F015 Isolde Brack: lantern-quiet, fen-minded, never quite at ease ----
  {
    follower: 'F015',
    flags: ['isolde-vigil-room'],
    text: 'Eleven lanterns under the tack-room door. Twelve, last month. The sergeant lights one now. He won’t say for whom.',
  },
  {
    follower: 'F015',
    flags: ['isolde-vigil-open'],
    text: 'The Yard children stand at the edge of my light. They don’t ask. One leaves a pebble by every lantern. I don’t move them.',
  },
  {
    follower: 'F015',
    flags: ['isolde-forty-second'],
    text: 'A Mother walked behind, so nobody went the wrong way. I think about who walks behind me now. I check. Often.',
  },
  {
    follower: 'F015',
    flags: ['isolde-kept'],
    text: 'I go to the water at dusk. Back by midnight. The crown would rather know me, so I come back. Every time. That’s the bargain.',
  },
  {
    follower: 'F015',
    flags: ['isolde-told-to-cut'],
    text: '‘Cut,’ I said. You let it stand. My hems are wet in the morning. You don’t look at them. Thank you for not looking.',
  },
  {
    follower: 'F015',
    flags: ['isolde-hunts-jars'],
    text: 'Three villages, newest jars. I’ve visited two. The third had packed up and gone. Somebody warned them. Not me.',
  },
  {
    follower: 'F015',
    flags: ['isolde-forced-cure'],
    text: 'The child lives. The family left the Yard and my blanket behind. I washed it. I can’t give it to anyone else.',
  },
  {
    follower: 'F015',
    flags: ['isolde-respected-door'],
    text: 'The candle is on my sill, unlit. The mother brought it back. A curse or a thank-you. In the fen it is both.',
  },

  // --- F016 Sable Thorne: immaculate manners holding something down --------
  {
    follower: 'F016',
    flags: ['sable-key-emperor'],
    text: 'You keep the key, and you did not open the door when I knocked. I have never been so well looked after. I mean that. I always mean it.',
  },
  {
    follower: 'F016',
    flags: ['sable-key-watch'],
    text: 'The sergeant asked not to draw my door again. Quite right. I sent him an apology. Three drafts. The second was best.',
  },
  {
    follower: 'F016',
    flags: ['sable-key-self'],
    text: 'The key is at my throat. The door held from inside. My gloves did not. I have ordered new ones. One must keep up.',
  },
  {
    follower: 'F016',
    flags: ['sable-promise-broken'],
    text: 'The envoy’s riders wait at the gate. Polite. So am I. I owe you a broken promise, and I try to be worth it daily.',
  },
  {
    follower: 'F016',
    flags: ['sable-fever-shared'],
    text: 'The marks on your wrist have faded. I check, every morning. Forgive me. It is the only rudeness I allow myself.',
  },
  {
    follower: 'F016',
    flags: ['sable-fever-locked'],
    text: 'I said thank you through the door and you said you were there. I hear it when the humming starts. It helps. Shockingly.',
  },
  {
    follower: 'F016',
    flags: ['sable-kiyo-tea'],
    text: 'You held the cup, my paws over yours. The medic left without a word, which is the best manners I have seen outside the Verge.',
  },
  {
    follower: 'F016',
    flags: ['sable-chained'],
    text: 'The hosts’ children are afraid of me. They heard the chain. I bow to them very correctly. It does not help. I keep bowing.',
  },
  {
    follower: 'F016',
    flags: ['sable-watched'],
    text: 'The Watchman wears my gloves now. Three scratches. He says it was nothing. I disagree, beautifully, every time we pass.',
  },
  {
    follower: 'F016',
    flags: ['sable-made-way'],
    text: 'I asked whom I was staying for and you told me the truth. I stay for myself now. A novel arrangement. I enjoy it more than is seemly.',
  },

  // --- F017 Cobb Harrow: a farmer’s two-word sentences ----------------------
  {
    follower: 'F017',
    flags: ['cobb-barn-paid'],
    text: 'Four roofs up. Mine last. Brass went in the pot. Thistledown thanks you. Won’t say so. It’s Thistledown.',
  },
  {
    follower: 'F017',
    flags: ['cobb-no-brass'],
    text: 'No brass for barns. Fair. Signed the next posting. Hands like work better than waiting.',
  },
  {
    follower: 'F017',
    flags: ['cobb-nothing-owed'],
    text: 'Nothing owed. Barracks door doesn’t stick now. Don’t know who fixed it. Hinges get tired of sticking.',
  },
  {
    follower: 'F017',
    flags: ['cobb-given-reasons'],
    text: 'Reasons. I don’t ask. I work. You’ll notice I don’t ask.',
  },
  {
    follower: 'F017',
    flags: ['cobb-struck-defended'],
    text: 'Thistledown lives. Slept in the barn once since. Didn’t sleep. Told you I wouldn’t.',
  },
  {
    follower: 'F017',
    flags: ['cobb-struck-doubted'],
    text: 'Somebody ought not to be sure. You aren’t. Good. Supper on the gate post. Watch looks away. Fair trade.',
  },
  {
    follower: 'F017',
    flags: ['cobb-ordered-bench'],
    text: 'Sit at the far end. Eat. Go. Orders are orders. Table’s quieter for it. Not better. Quieter.',
  },
  {
    follower: 'F017',
    flags: ['cobb-eats-apart'],
    text: 'Somebody put a second stool by my block. Sawdust on it. I sit on the first one. Leave the second. Fair’s fair.',
  },
  {
    follower: 'F017',
    flags: ['cobb-heard-saffron'],
    text: 'Same bench. Far end. Nobody talks. First time. I keep coming back to see if it holds.',
  },
  {
    follower: 'F017',
    flags: ['cobb-salvage-banned'],
    text: 'Beam’s over my bunk. Bought it back with my pay. Rustline put prices up a copper. Worth a copper.',
  },
  {
    follower: 'F017',
    flags: ['cobb-salvage-allowed'],
    text: 'Walk past the stall every morning. Long way round. Never stop. Law’s law. Feet aren’t.',
  },
  {
    follower: 'F017',
    flags: ['cobb-went-home'],
    text: 'Raised the frame. Somebody else can roof it. Soot’s still in my hat. Leave it there.',
  },
  {
    follower: 'F017',
    flags: ['cobb-stayed'],
    text: 'Built the lean-to for the sick. Didn’t look north. Not once. Keep not looking. It’s work.',
  },

  // --- F018 Vesper Fanfare: a performer’s patter, bright over the dark -----
  {
    follower: 'F018',
    flags: ['vesper-fire-banned'],
    text: 'No fire in a drought. The kids booed me, boss. Best review all year. Somebody lit one behind the stables anyway. Not me. Mostly.',
  },
  {
    follower: 'F018',
    flags: ['vesper-friendship'],
    text: 'You said I was wonderful and left me the fire. That’s the whole job, boss. Applause, then privacy. Perfect audience.',
  },
  {
    follower: 'F018',
    flags: ['vesper-ballad-private'],
    text: 'Only here. I hum it in the Yard and stop. Stopping is the hardest trick I know.',
  },
  {
    follower: 'F018',
    flags: ['vesper-war-show'],
    text: 'Sandbar show. Nobody deserted. One fodder cart, flambé. Quartermaster won’t speak to me. Can’t please everyone. Shouldn’t try.',
  },
  {
    follower: 'F018',
    flags: ['vesper-no-show'],
    text: 'Juggled turnips. Two went over the ridge that night. Turnips don’t hold a crowd, boss. Fire does. You know that.',
  },
  {
    follower: 'F018',
    flags: ['vesper-made-way'],
    text: '‘Ink,’ you said. Course. Best show of my life, boss, to an empty step. Never playing that venue again.',
  },

  // --- F019 Hollin Moss: a mapmaker’s care for lines and what they cost -----
  {
    follower: 'F019',
    flags: ['hollin-road-archived'],
    text: 'The Archive keeps my red line in its lowest vault. The record should outlive the crown, you said. I hope it does not have to.',
  },
  {
    follower: 'F019',
    flags: ['hollin-told-burn'],
    text: 'I burned the notes. Not the page. You did not ask. It is folded along a line nobody would choose.',
  },
  {
    follower: 'F019',
    flags: ['hollin-notes-sealed'],
    text: 'Sealed, to be opened if the crown falls. The keeper wrote the date. I go and check the seal. Too often.',
  },
  {
    follower: 'F019',
    flags: ['hollin-nera-watching'],
    text: 'Two names and a date on the back of the page. Two of us watching. I sleep a little better. A very little.',
  },
  {
    follower: 'F019',
    flags: ['hollin-draws-was'],
    text: 'You keep it rolled in your coat. The roof. The bell. Your window. Unroll it someday, Majesty. I would like to check the lines.',
  },
  {
    follower: 'F019',
    flags: ['hollin-taught-girl'],
    text: 'She drew the north ridge alone. I searched an hour for something to correct. Nothing. The best hour of my year.',
  },
  {
    follower: 'F019',
    flags: ['hollin-waited-copyist'],
    text: 'Two wells wrong while we waited, and one rider. The copyist is very good. He has a cough. Rules have reasons. Reasons have costs.',
  },

  // --- F020 Juniper Slate: the cook’s ladle-first kindness ------------------
  {
    follower: 'F020',
    flags: ['juniper-nim-paid'],
    text: 'Nim scrubs every pot before I ask. His sister’s got flour. Nobody takes sacks now. Funny how a full bag fixes a light finger.',
  },
  {
    follower: 'F020',
    flags: ['juniper-nim-docked'],
    text: 'Same ladle for Nim. Same smile. Takes me a second longer to find it. I’m working on that second.',
  },
  {
    follower: 'F020',
    flags: ['juniper-gate-shut'],
    text: 'Back gate’s shut. You’ve got the name. I make breakfast. I don’t eat it. Some mornings go that way.',
  },
  {
    follower: 'F020',
    flags: ['juniper-oil-bought'],
    text: 'Bread all week. The talk about torches stopped. Not for good. For bread. I keep the ovens hot and my ears open.',
  },
  {
    follower: 'F020',
    flags: ['juniper-absolved'],
    text: 'He fooled the crown too. But the crown didn’t ladle his porridge. I did. I drank that cold bowl. Still drinking it.',
  },
  {
    follower: 'F020',
    flags: ['juniper-names-kept'],
    text: 'Three bowls, one extra potato each. They say it to the cook. Somebody should hear it. Might as well be me.',
  },
  {
    follower: 'F020',
    flags: ['juniper-baked-cake'],
    text: 'Watch and Yard danced in the mud. Tuesday the draughts went out bitter. I sat with the two who spat them up. Worth it. Ask me tomorrow.',
  },
  {
    follower: 'F020',
    flags: ['juniper-kept-sugar'],
    text: 'Turnip cake. Nobody ate it. Everybody said thank you. The sick kept their sweet draughts down. That was the cake, really.',
  },

  // --- F021–F025, the hidden wanderers ---------------------------------------
  {
    follower: 'F021',
    flags: ['nettle-beds-open'],
    text: 'Their names are on the wall, Majesty, even the ones who cannot read them. Six beds full. The seventh has a stool beside it.',
  },
  {
    follower: 'F021',
    flags: ['nettle-beds-levy'],
    text: 'The ledgers balance. Two beds stand empty. The families carried their sick home ahead of your collectors. I write down where they went, when I learn it.',
  },
  {
    follower: 'F021',
    flags: ['nettle-open-books'],
    text: 'Four names restored. Two families lost bread they leaned on. I keep the tally both ways. A record can wound and heal in the same line.',
  },
  {
    follower: 'F022',
    flags: ['tiller-sold-wire'],
    text: 'Copper’s gone. Traders paid fair. I tap the two spikes together at night. Nobody answers. Nobody was meant to.',
  },
  {
    follower: 'F022',
    flags: ['tiller-kept-signal'],
    text: 'Six knocks, and the name of a village whose rails were lifted. The relay still listens. So do I. Somebody out there is still sending.',
  },
  {
    follower: 'F023',
    flags: ['sera-names-witnessed'],
    text: 'Twenty-three statements under seal, twenty-three hands. You promised the seal can break someday. I wind the bell as if it will.',
  },
  {
    follower: 'F024',
    flags: ['tarn-families-map'],
    text: 'The families crossed. Two of the Watch came home. The third left his saddle on the false road. I mark that road on every map now.',
  },
  {
    follower: 'F024',
    flags: ['tarn-watch-map'],
    text: 'A guarded crossing, one night late. The eldest child’s fever broke on the far side. Nobody says whose delay. I draw that night as a gap.',
  },
  {
    follower: 'F025',
    flags: ['odo-held-bank'],
    text: 'The bank held. The planting will be small. I draw the weather backwards, harvest to seed. It comes out hungry. It comes out.',
  },
]

/** Where the newest of an echo's flags sits in the run's flag list. */
const recency = (flags: readonly string[], echo: TalkEcho): number =>
  Math.max(
    -1,
    ...[...(echo.flags ?? []), ...(echo.anyFlags ?? [])].map((f) =>
      flags.lastIndexOf(f),
    ),
  )

/**
 * The echo a follower speaks now: of every echo whose gate holds, the one
 * keyed by the most recent decision; the more specific breaks a tie.
 */
export const talkEcho = (
  flags: readonly string[],
  followerId: string,
): TalkEcho | undefined =>
  TALK_ECHOES.map((echo, i) => ({ echo, i }))
    .filter(
      ({ echo }) => echo.follower === followerId && gateHolds(flags, echo),
    )
    .map((entry) => ({ ...entry, at: recency(flags, entry.echo) }))
    .sort(
      (a, b) =>
        b.at - a.at ||
        (b.echo.flags?.length ?? 0) - (a.echo.flags?.length ?? 0) ||
        a.i - b.i,
    )[0]?.echo

/**
 * The one line a follower says in the barracks today: their newest echo, or
 * their daily chatter. A follower with both alternates them by day, so a
 * remembered answer never silences the chatter for good.
 */
export const barracksLine = (
  run: Pick<FortressRun, 'day' | 'flags'>,
  followerId: string,
  chatter: readonly string[] = [],
): string => {
  const echo = talkEcho(run.flags, followerId)
  const daily = chatter.length ? chatter[run.day % chatter.length]! : ''
  if (!echo) return daily
  return daily && run.day % 2 === 1 ? daily : echo.text
}
