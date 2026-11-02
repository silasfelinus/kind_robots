import { ACT_THREE_AFTERWARDS } from './actThree'
import type { Mood } from './castArt'
import type { EndingId } from './endings'
import { MOLES_RECONCILED } from './moles'
import { type FortressRun, type Standing, standingHeld } from './types'

// "Afterwards": the consequences epilogue after Day 50 (conductor GAME-BIBLE
// "Day 100 resolves an ending and a consequences epilogue"). Each subject is
// someone or something the emperor touched; its first variant whose condition
// holds is told, and a subject with no matching variant is left out. Variants
// read the flags the run left behind, so the wasteland remembers what was done.
// Voice (Silas, 2026-10-20): crisp and stark. A concrete image, a consequence,
// a cut. Never tell the player whether they were right.

export type EpilogueCondition = {
  /** All of these flags were set. */
  flags?: string[]
  /** At least one of these flags was set. */
  anyFlags?: string[]
  /** None of these flags were set. */
  notFlags?: string[]
  endings?: EndingId[]
  /** These followers joined and lived to the end. */
  alive?: string[]
  /** These followers died. */
  dead?: string[]
  /** These followers left with Young Komodo at the betrayal (t-028). */
  departed?: string[]
  /** At least this many of a track of flags, such as Mole concessions. */
  standing?: Standing
}

export type EpilogueVariant = {
  when?: EpilogueCondition
  text: string
  mood?: Mood
}

export type EpilogueSubject = {
  id: string
  name: string
  /** Major NPC slug, for illustrated art. */
  npc?: string
  /** A follower: told only if they ever joined this run. */
  follower?: string
  variants: EpilogueVariant[]
}

export type EpilogueEntry = {
  subject: EpilogueSubject
  variant: EpilogueVariant
}

const joined = (run: FortressRun, id: string) =>
  run.roster.some((state) => state.id === id)
const diedIn = (run: FortressRun, id: string) =>
  run.roster.some((state) => state.id === id && state.dead)
const leftIn = (run: FortressRun, id: string) =>
  run.roster.some((state) => state.id === id && !!state.departed)

export const conditionHolds = (
  run: FortressRun,
  ending: EndingId,
  when: EpilogueCondition | undefined,
): boolean => {
  if (!when) return true
  const has = (flag: string) => run.flags.includes(flag)
  return (
    (when.flags ?? []).every(has) &&
    (!when.anyFlags?.length || when.anyFlags.some(has)) &&
    !(when.notFlags ?? []).some(has) &&
    (!when.endings?.length || when.endings.includes(ending)) &&
    (when.alive ?? []).every(
      (id) => joined(run, id) && !diedIn(run, id) && !leftIn(run, id),
    ) &&
    (when.dead ?? []).every((id) => diedIn(run, id)) &&
    (when.departed ?? []).every((id) => leftIn(run, id)) &&
    standingHeld(run.flags, when.standing)
  )
}

/** Every ending but the Long Night: the kingdom stands and life goes on. */
const PEACE: EndingId[] = [
  'bell-restored',
  'open-roads',
  'iron-peace',
  'crows-bargain',
  'witchwater-throne',
  'tunnels-and-councils',
  'hundred-candles',
]

/**
 * Kingdom variants that name no ending describe a kingdom at peace; under
 * the Long Night only a subject's own Long Night variant is told.
 */
const afterTheWar = (subjects: EpilogueSubject[]): EpilogueSubject[] =>
  subjects.map((subject) => ({
    ...subject,
    variants: subject.variants.map((variant) =>
      variant.when?.endings
        ? variant
        : { ...variant, when: { ...variant.when, endings: PEACE } },
    ),
  }))

// --- the kingdom ------------------------------------------------------------

const KINGDOM: EpilogueSubject[] = afterTheWar([
  {
    id: 'mara',
    name: 'Mara Reedbell',
    npc: 'mara-reedbell',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['d42-abbey-water-taken'] },
        mood: 'sad',
        text: 'The children who drank the Abbey’s water hum along with the singing at night. Mara Reedbell sits up with them in the cellar. She holds their hands so they do not walk.',
      },
      {
        when: { endings: ['long-night'] },
        mood: 'sad',
        text: 'Mara Reedbell opened Hollow Bell’s cellars to anyone who knocked and wrote each name in the ledger as they came down the stair. She is still writing. The ledger has run out of pages twice.',
      },
      {
        when: { endings: ['bell-restored'], flags: ['d48-mara-will-confess'] },
        mood: 'happy',
        text: 'The day the Bell rang, Mara Reedbell stood on a cart in the square and read the second book aloud. Every season. Every name. Then she took off the chain and set it on the cart. The town put it back on her. It took two votes.',
      },
      {
        when: { flags: ['d42-abbey-water-taken'] },
        mood: 'sad',
        text: 'The children who drank the Abbey’s water on the forty-second day grew up well and quiet. When a bell rings anywhere in town they stop whatever they are doing and wait. Then they go on. Mara Reedbell watches them do it.',
      },
      {
        when: { flags: ['d29-mara-confession'], notFlags: ['mara-exposed'] },
        text: 'Mara Reedbell’s confession sits in the Archive in her own hand, an hour of writing, blotted and signed. She rings the evening bell on time. Every spring she brings the Keeper the list of the town’s orphans herself, before anyone asks.',
      },
      {
        when: { flags: ['mara-exposed'] },
        text: 'Hollow Bell chose another mayor, as Mara said it should. She took a room over the chandler’s and taught him to read the water accounts. She never corrected him in public. In private she corrected everything.',
      },
      {
        when: { flags: ['d29-crown-took-blame'] },
        text: 'The taverns still say the emperor sold children for water. Mara Reedbell has never once said otherwise. The morning the crown came home, a jar of Hollow Bell water was waiting at the tower gate. No letter. It stands on the throne-room sill, full.',
      },
      {
        when: { anyFlags: ['mara-protected', 'mara-owes-crown'] },
        mood: 'sad',
        text: 'The page stayed where the crown put it. Mara Reedbell kept her chain and rang the evening bell on time, every night. She never once looked up the mission road while she rang it.',
      },
      {
        when: { flags: ['mara-millers-levy'] },
        text: 'The mill families never forgave the crown for the levy. They never worked out that it was Mara’s idea. On feast days she drinks the clean water with them and lets them curse the tower to her face.',
      },
      {
        when: { flags: ['chose:d01-aqueduct:levy'] },
        mood: 'sad',
        text: 'Hollow Bell paid, and remembered paying. Mara Reedbell’s ledger grew a second column she showed nobody. It is headed, in small letters: what the crown cost us.',
      },
      {
        when: { flags: ['clapper-recovered'], notFlags: ['bell-rung'] },
        text: 'The clapper came home out of the fen, black with mud, and never went up the tower. Mara Reedbell hung it on a chain over the chapel door. Children touch it for luck on the way in. Their mothers pull their hands away.',
      },
      {
        when: { flags: ['bell-promised'], notFlags: ['bell-rung'] },
        mood: 'sad',
        text: 'The crown promised Hollow Bell its bell would ring. It did not ring. Mara put the sock back on her hand-bell and carries it in her pocket. She has not asked again.',
      },
      {
        text: 'Mara Reedbell ran Hollow Bell the way she always had. One compromise at a time. Smiling until the ledger closed.',
      },
    ],
  },
  {
    id: 'millers',
    name: 'The mill families of Hollow Bell',
    variants: [
      {
        when: { flags: ['d42-millers-free'] },
        mood: 'sad',
        text: 'The mill families sold where they liked. Flour went up the mission road all that winter, and two of Aldous Hopper’s sons went with it. Hopper still grinds. He keeps two chairs at supper and will not let anyone move them.',
      },
      {
        when: { flags: ['d42-millers-repaid'] },
        text: 'The crown paid back the levy from a purse it barely had. Aldous Hopper nailed the receipt over the millstone. The flour dust has turned it white. He tells anyone who asks that it says “Late.”',
      },
      {
        when: { flags: ['d19-millers-levy-repealed'] },
        text: 'The levy was repealed for nine hands at the vote. Aldous Hopper has voted with the crown at every council since. He has never said thank you. He bows exactly as low as he did the first day.',
      },
      {
        when: { flags: ['d02-mill-names-posted'] },
        mood: 'angry',
        text: 'The posted names stayed on the fortress gate until the rain took them. Hopper’s was the last to go. He came every market day to watch it fade.',
      },
      {
        when: { flags: ['d05-millers-flour'] },
        text: 'The mill families stencilled LEVIED in red on every sack they sent the tower, long after the levy ended. The Yard calls it levied bread. Some of the children think that is what bread is called.',
      },
      {
        when: { flags: ['mara-millers-levy'] },
        text: 'The grinders worked longer for less and drank clean water after dark. The mill families have never let anyone forget who paid for Hollow Bell’s aqueduct. They bow to the crown. Not an inch lower than they must.',
      },
    ],
  },
  {
    id: 'fen-lanterns',
    name: 'Sister Reedlight and the fen lanterns',
    npc: 'sister-reedlight',
    variants: [
      {
        when: { endings: ['long-night'] },
        text: 'The Mirefen went dark the first week. Then, one by one, green lanterns came back on along the water’s edge, all facing the road. The Mothers have not said who they are for.',
      },
      {
        when: {
          endings: ['witchwater-throne'],
          flags: ['d27-name-in-fen-book'],
        },
        mood: 'happy',
        text: 'Sister Reedlight sits at the emperor’s left hand. Her lantern never flickers. The emperor’s name is in a green book in the fen, and at night every candle in the tower leans toward the throne. Nobody mentions it.',
      },
      {
        when: { endings: ['witchwater-throne'] },
        mood: 'happy',
        text: 'Sister Reedlight took the chair at the emperor’s left and has never raised her voice in it. The green lanterns burn on the tower all night. The Watch on the walls has learned not to look at them too long.',
      },
      {
        when: { flags: ['d44-dike-blown'] },
        mood: 'angry',
        text: 'The north reed beds are a lake. Thirty-one lantern-houses stand on it. Sister Reedlight rows out to the place where the other nine were and sets a lantern on the water for a girl called Fennet. The crown has never been asked to come.',
      },
      {
        when: { flags: ['d46-debt-personal'] },
        text: 'The Mothers came for the lantern’s favour in the second spring. They asked for the emperor and nobody else, as agreed. What was asked is not in the record. The emperor came back with wet hems and slept with a lamp lit for a month.',
      },
      {
        when: { flags: ['mire-road-closed', 'd46-mire-road-sworn'] },
        text: 'Forty-one lanterns turned back into the fen on the first night. On the forty-sixth day the emperor swore the road would never close again. It has not. The fen hung a dark lantern on the post where the barrier stood. It has never been lit.',
      },
      {
        when: {
          flags: ['mire-road-closed'],
          anyFlags: ['d03-mire-road-reopened', 'd12-road-apology'],
        },
        text: 'The crown opened the Mirefen road and said in public it had been wrong. The fen took the apology and gave nothing back. Some nights one gold light waits at the edge of the reeds below the tower. It does not come closer.',
      },
      {
        when: { flags: ['mire-road-closed'] },
        mood: 'angry',
        text: 'Forty-one lanterns turned back into the fen on the emperor’s first night. Sister Reedlight never mentioned them again. Not once. On the Mirefen causeway there are seven dark lanterns on poles. The Mothers will not say for whom.',
      },
      {
        when: { flags: ['d27-false-name-given'] },
        mood: 'excited',
        text: 'The name the emperor wrote in the fen’s green book was not the emperor’s. A Freeholder has that name. The reeds outside his door are full of small gold lights. He has not been told why.',
      },
      {
        when: { flags: ['d27-name-in-fen-book'] },
        text: 'The emperor’s name is in the fen’s green book, in ink that was warm. Nothing has come of it. Every candle in the tower leans a little toward the throne.',
      },
      {
        when: { flags: ['d07-count-returned'] },
        text: 'The Archive gave its only copy of the fen count back to the Mothers. The next morning a sprig of bog myrtle was tied to the fortress gate. It is still there, dry as paper.',
      },
      {
        when: { flags: ['mire-quiet-count'] },
        text: 'The quiet count of the fen road was filed under “travellers, Mirefen, uncertain.” Every keeper who has read it since has written a number in the margin. No two numbers agree.',
      },
      {
        when: { flags: ['chose:d01-mirefen:question'] },
        text: 'Every traveller on the Mirefen road went into the crown’s book that first night, name and lantern. The names are still there. The fen has never asked for them back.',
      },
      {
        when: { flags: ['reedlight-lantern'] },
        text: 'The green lantern from the fen sits on a shelf in the tower, lit, warm, burning nothing. The Mothers have not yet asked for their favour. Sister Reedlight can wait.',
      },
      {
        text: 'The lanterns reached the far side of the Mirefen road. Nobody at court learned what burned in them. After a while nobody asked.',
      },
    ],
  },
  {
    id: 'informant',
    name: 'The informant with the bandaged paw',
    variants: [
      {
        when: { flags: ['d42-informant-spared'] },
        text: 'The crown called the debt its own, and Vane tore the ration card in half. She walked out of the cage wagon at dawn. She still lives in the canyon. Nobody hums when she passes. She is allowed.',
      },
      {
        when: { flags: ['d42-informant-denied'] },
        mood: 'sad',
        text: 'The crown said it had never paid an informant in its life. The cage wagon rolled out before dawn with its curtains drawn and came back empty. Gristle Vane still carries the ration card. At the fire he takes it out and looks at it.',
      },
      {
        when: { flags: ['d42-informant-bought'] },
        text: 'She went east on a Saltroad cart with her paw in her lap. Past the salt flats the former informant runs a ferry and takes no passengers from the canyon. They say she draws a good map. She will not draw one for anyone.',
      },
      {
        when: { flags: ['d16-informant-spy'] },
        text: 'She went back into the Pack with brass sewn into her bandage. Her maps came every week, then every month. The last one was blank, folded once. The Watch pinned it above the fire with the others.',
      },
      {
        when: { flags: ['d16-informant-sheltered'] },
        mood: 'happy',
        text: 'She kept the new name the Yard gave her. She scrubs the big pots and will not go near the postern. Vane’s snapped feather is nailed over her bunk. She says it is the only letter she ever got.',
      },
      {
        when: { flags: ['d16-informant-sent-east'] },
        text: 'She took the crown’s brass east and never wrote. The Watch kept her ration card above their fire another year. One night somebody burned it. Nobody asked who.',
      },
      {
        when: { flags: ['d16-informant-returned'] },
        mood: 'sad',
        text: 'The crown sent her back to the canyon. The Pack does not say what it did. On the southern bridge road a pup’s bandage is tied to a post, gone grey. The Watch rides past it every day.',
      },
      {
        when: { flags: ['pack-camp-mapped'] },
        text: 'A young informant sold the crown a map of the Pack’s camp for ten brass on the first night. Nobody at court knows what became of her. The Watch still has the card.',
      },
    ],
  },
  {
    id: 'vane',
    name: 'Captain Gristle Vane and the Jackalwire Pack',
    npc: 'gristle-vane',
    variants: [
      {
        when: { endings: ['long-night'] },
        mood: 'excited',
        text: 'The Pack circled its wagons in the canyon, lit every lamp it owned and sang back. Loud. Badly. All night, every night. Gristle Vane says it works. So far he is right.',
      },
      {
        when: { endings: ['iron-peace'] },
        mood: 'sad',
        text: 'The Gate Watch took the southern bridge and the Pack stopped raiding. That winter Gristle Vane sold his best coat to a Saltroad factor. He told the Pack it had gone out of fashion. The Pack let him say it.',
      },
      {
        when: { flags: ['d42-pack-tolls-promised'] },
        mood: 'happy',
        text: 'The crown kept its word about the southern toll bridge. Gristle Vane collects there himself every morning, in the excellent coat. The promise is still painted on his wagon a foot high. He has the paint touched up whenever it flakes.',
      },
      {
        when: { flags: ['d10-camp-struck'] },
        mood: 'angry',
        text: 'The Watch struck the Pack’s home camp on the tenth day and came back quiet. Vane rebuilt it a mile further up the canyon. He has never asked who drew the map. He has never had to.',
      },
      {
        when: { flags: ['d21-pack-pups-guests'] },
        text: 'Six hyena pups grew up in the Yard as guests of the crown. Four went home to the canyon. Two joined the Gate Watch. Vane calls them traitors at every fire, and sends them new boots each winter.',
      },
      {
        when: {
          flags: ['pack-medicine'],
          notFlags: ['d03-pack-medicine-ended'],
        },
        text: 'The pups at the bridge camp stopped coughing black that first winter. Gristle Vane waves the crown’s carts across free. Only the crown’s. He is grateful, not stupid.',
      },
      {
        when: { anyFlags: ['pack-alliance', 'pack-truce'] },
        text: 'The Pack kept its alliance the way it keeps everything: loudly, and exactly as long as it paid. Vane spits in his palm before every council. He holds it out until someone takes it. It takes longer every year.',
      },
    ],
  },
  {
    id: 'crows',
    name: 'Elder Corvane and the Storm Crows',
    npc: 'elder-corvane',
    variants: [
      {
        when: { endings: ['crows-bargain'], flags: ['d11-no-runners-clause'] },
        text: 'The rain comes on time, every season, to the day. The covenant still carries the emperor’s margin note: no person of this court is ever payment. Corvane reads it aloud each spring before he names the price. He has never named a person. He has named everything else.',
      },
      {
        when: { endings: ['crows-bargain'] },
        text: 'The rain comes on time, every season. Elder Corvane names the price each spring and the kingdom pays without asking what becomes of it. His chimes have not rung in years. He says they no longer need to.',
      },
      {
        when: { flags: ['covenant-broken'] },
        mood: 'angry',
        text: 'For three years after the broken covenant, the clouds came over the Heights and stopped at the tower’s edge, like a line drawn with a rule. Then one spring they did not stop. Nobody knows what was paid.',
      },
      {
        when: { flags: ['d44-crows-confess'] },
        text: 'Elder Corvane answered every question at the coalition fire about eleven years of night carts to the Abbey. It is all in the record. He has not spoken in council since. The crows on the tower sills face away from the throne.',
      },
      {
        when: { flags: ['d44-crow-secret-kept'] },
        text: 'The Crows’ part in the Abbey’s night carts stayed between one fire and the record. Keeper Vellum’s line through that page is still there. Corvane bowed once, that night. He has never needed to bow again.',
      },
      {
        when: { flags: ['d11-rain-bought'] },
        text: 'The tower bought one season of rain outright and owed nothing for it. The rain came, and went. Corvane never once looked at the tower again. He made sure the tower saw him not looking.',
      },
      {
        when: { flags: ['no-rain'] },
        text: 'The tower refused the Conclave’s rain, and the Freeholds stayed dry. They dug deeper. Their wells are the deepest in the kingdom now. Every Freehold kitchen knows who kept the sky clear, and argues about it at supper.',
      },
      {
        when: { flags: ['rain-covenant'] },
        text: 'The covenant rain came soft and on time while the crown kept up its payments. Elder Corvane keeps the page of what the tower still owes in his own claw. It is a short page. He reads it slowly.',
      },
    ],
  },
  {
    id: 'runners',
    name: 'Wren and the bonded runners',
    variants: [
      {
        when: { flags: ['d02-wren-bond-bought'] },
        mood: 'happy',
        text: 'Wren came down from the Heights within the month. She did not want to come. She sat at her mother’s table for a year, at the place that had been set for her all along, and said almost nothing. Then one morning she asked for the salt. Her mother cried into the bread.',
      },
      {
        when: { flags: ['nera-runners-ransomed'] },
        text: 'The six runners the Yard sent up the Heights came home thinner and quieter, one limping. They carry the crown’s messages now, on wages, under their own names. None of them will run in the rain.',
      },
      {
        when: { flags: ['d34-runners-on-wages'] },
        text: 'The runners lent to the Heights went on wages, with their own names on every bag, home by first frost. Every bag came home. So did every runner.',
      },
      {
        when: { flags: ['d34-tamsin-swapped'] },
        text: 'Tamsin Gutterwing went back up the Heights in a Yard child’s sash and ran the far paths for the Conclave until the war was over, and after. Linnet came home and learned to read. She reads Tamsin’s letters aloud in the Yard. There are not many. They are all about weather.',
      },
      {
        when: { flags: ['d34-runner-left'] },
        mood: 'sad',
        text: 'Linnet went back up the Heights in the rain because the crown would not buy her down. She went off the high path in the first winter storm with someone else’s letters on her back. The Crows sang for her. They sent the letters on.',
      },
      {
        when: { flags: ['d34-runner-bought'] },
        text: 'Linnet came down off the Heights for sixty brass and never ran again. She walks everywhere now, slowly. The other two served their seasons out. One came home.',
      },
      {
        when: { flags: ['d42-runner-redeemed'] },
        text: 'The third runner’s bond was struck from Corvane’s slate with the crown’s last brass. She keeps the sash folded on a shelf. Her hands have found other work.',
      },
      {
        when: { flags: ['covenant-paid-in-runners', 'd20-runners-term-fixed'] },
        text: 'Three Yard volunteers climbed the Heights for one season by the tower’s calendar. Two came home on the right day, to the hour. The third stayed. The first autumn she sent her mother a grey feather. No letter. Her mother wears it in her hat.',
      },
      {
        when: { flags: ['d20-court-runners'] },
        text: 'Three of the court’s own climbed the Heights to pay for the rain. Lady Vask’s nephew came down years later, a grown bird who would not sit at her table.',
      },
      {
        when: { anyFlags: ['covenant-paid-in-runners', 'runners-lent'] },
        mood: 'sad',
        text: 'Children of the Yard climbed the Heights in borrowed boots, waving. The crown called it a loan. Their mothers still set places at supper. The Yard never says the word runner where the crown can hear.',
      },
    ],
  },
  {
    id: 'coldbrooks',
    name: 'Wenna Coldbrook and her children',
    variants: [
      {
        when: {
          flags: ['abbey-took-coldbrook-children'],
          endings: ['long-night'],
        },
        mood: 'sad',
        text: 'There are children’s voices in the singing. Wenna Coldbrook says she knows which one is the smallest. At dusk she stands at the edge of the mission road and hums along, so he will hear somebody he knows.',
      },
      {
        when: { endings: ['long-night'] },
        mood: 'sad',
        text: 'Wenna Coldbrook nailed her shutters closed and keeps her children inside after dark. She counts them at every meal. All there. She counts again.',
      },
      {
        when: { flags: ['abbey-took-coldbrook-children', 'abbess-unmasked'] },
        text: 'When the Abbess’s habit came out of the crypt, the party searched the lower house. Three beds, made very well. A drawing of a grey door. Wenna keeps the drawing. She has not said whether she has stopped looking.',
      },
      {
        when: {
          flags: ['abbey-took-coldbrook-children', 'd24-wenna-sheltered'],
        },
        mood: 'sad',
        text: 'Wenna stayed in the tower with the baby, behind the Watch, until the war was over. Her other three never came down the mission road. At supper she lays three spoons beside the baby’s. She washes all four.',
      },
      {
        when: { flags: ['abbey-took-coldbrook-children', 'wenna-turned-away'] },
        mood: 'sad',
        text: 'Wenna Coldbrook did not come to court again. Nobody saw her on the mission road after the second month. The Abbey writes, if asked, that she is with her children now. Nobody asks.',
      },
      {
        when: { flags: ['abbey-took-coldbrook-children'] },
        mood: 'sad',
        text: 'The Coldbrook children went through the Abbey’s grey door and never came out on a day the crown was watching. Wenna kept the bundle of their clothes. It is still tied with the same string.',
      },
      {
        when: { flags: ['coldbrooks-in-yard', 'd23-tam-visited'] },
        text: 'The Coldbrooks grew up in the Yard, all five of them. Tam carried soup to the top of the Abbey stair for one season and came home taller. He is a porter now. He will not eat honey-cake, and will not say why.',
      },
      {
        when: { flags: ['coldbrooks-in-yard'] },
        mood: 'happy',
        text: 'The Coldbrooks grew up in the Yard, all five of them. Tam is a porter now, loud and quick, and will not eat honey-cake. Wenna runs the bread ovens. She knows the face of every sister who ever came to the gate.',
      },
      {
        when: { flags: ['d08-coldbrooks-home'] },
        text: 'Wenna Coldbrook took the seed and the cart east, into the ash. Every harvest a basket of eggs arrives at the gate with no note. The crown counts them. There are always four.',
      },
      {
        when: { flags: ['chose:d08-family:escort'] },
        text: 'The Coldbrooks were walked to Hollow Bell, where someone keeps count. Mara Reedbell entered all five in the town ledger. It is the one page in it she has never been ashamed of.',
      },
    ],
  },
  {
    id: 'ledger',
    name: 'Factor Tallow and the Ledger',
    npc: 'marisol-tallow',
    variants: [
      {
        when: { flags: ['d38-named-in-court'] },
        text: 'Brass buttons, the young prisoner said, and Factor Tallow laid a hand over her waistcoat in front of the whole court. Nothing was ever proved. She sewed on horn buttons the next morning. She has worn horn ever since.',
      },
      {
        when: { flags: ['ledger-crisis'] },
        mood: 'happy',
        text: 'The crown borrowed from the Ledger until the loans had loans. Factor Tallow forgave a third of the debt the spring after the war, in writing, in a small, permanent hand. The other two thirds she did not.',
      },
      {
        when: { flags: ['ledger-closed'] },
        mood: 'angry',
        text: 'The crown would not be priced by merchants. Factor Tallow set up a market on the far bank of the river. Most of the kingdom shops there. The crown buys its salt from magpies and pretends to prefer it.',
      },
      {
        when: { flags: ['d37-crown-debts-read'] },
        text: 'Page six of the crown’s debts was lamp oil on credit, delivered up the mission road, a small dot before every number. Factor Tallow kept the page. She keeps it in the drawer with her good pen.',
      },
      {
        when: { flags: ['ledger-paid'] },
        text: 'The crown paid down its debt in brass. Factor Tallow sends the throne a statement on the first of every month. It says: nothing owed. She signs it.',
      },
    ],
  },
  {
    id: 'yard',
    name: 'Foreman Dunmore Ash and the Yard',
    npc: 'dunmore-ash',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['d47-cook-forgiven'] },
        text: 'The Yard cooks in a cave now, for whoever comes in from the road. The cook the camp forgave works the ovens. He presses a thumbprint into the bottom of every loaf. Dunmore Ash checks for it.',
      },
      {
        when: { flags: ['d47-cook-made-example'] },
        mood: 'sad',
        text: 'The cook who left a letter in the flour was made an example of at the edge of the trees. Dunmore Ash cooked breakfast for everyone that morning and ate none of it. The Yard sings at work again now. Never that song.',
      },
      {
        when: { flags: ['d47-cook-forgiven'] },
        text: 'The camp forgave the cook with family in the tower, out loud. Dunmore Ash put him back on the ovens. His bread is the best in the Yard. Every loaf has a thumbprint pressed into the bottom.',
      },
      {
        when: { flags: ['d41-stayers-listed'] },
        text: 'Vellum’s list of the sixty who stayed in the tower went back with the crown. Dunmore Ash asked to read it first. He crossed out four names: the dead. He handed back the rest and did not ask what the page was for.',
      },
      {
        when: { flags: ['d37-yard-silenced'] },
        mood: 'angry',
        text: 'The crown did not answer to the Yard for its paperwork. The Yard did not forget. Dunmore Ash bows to the throne exactly as deep as regulation asks. In the Yard that is a speech.',
      },
      {
        when: { flags: ['levy-yard'] },
        mood: 'sad',
        text: 'The war levy took the Yard’s brass and its able bodies. Not all of them came home. Dunmore Ash keeps their aprons on a row of nails by the ovens. Nothing else is hung there.',
      },
      {
        when: { flags: ['open-council'] },
        text: 'The Yard kept its chair beside the Old Houses. Dunmore Ash sits in it with his arms folded and says nothing for whole sessions. When he does speak, the Old Houses stop writing.',
      },
    ],
  },
  {
    id: 'old-houses',
    name: 'Lady Vask and the Old Houses',
    npc: 'ottoline-vask',
    variants: [
      {
        when: { flags: ['d41-ledger-published'] },
        mood: 'sad',
        text: 'Komodo’s payments were copied to every faction. Lady Vask’s name was on page four. She wrote that she had always been the crown’s friend, and her hand shook. She still comes to court. She sits by the door.',
      },
      {
        when: { flags: ['d41-seal-voided'] },
        mood: 'angry',
        text: 'Every grant under the old seal became paper overnight. Lady Ottoline Vask has spent the years since petitioning for her family’s land, one field at a time, in perfect handwriting. She has eleven fields back. Chairs are patient.',
      },
      {
        when: { flags: ['d39-vask-chairs'] },
        text: 'Lady Vask chaired the Congress, and every faction agreed to something nobody remembers agreeing to. Most of it is still in force. She keeps it bound in black ribbon and reads a clause aloud whenever the throne forgets.',
      },
      {
        when: { flags: ['d22-knife-returned'] },
        text: 'The knife went back to Lady Vask in private, and she has been the crown’s friend ever since. A perfect friend. She sends wine on the emperor’s birthday. The emperor does not drink it. She knows, and keeps sending it.',
      },
      {
        when: { flags: ['d22-knife-shown'] },
        text: 'The knife with the filed grip lies in the Archive under glass. Lady Vask walks past it on her way to council and has never once looked at it. Two Old House families closed their accounts and moved east that winter.',
      },
      {
        when: { flags: ['levy-houses'] },
        text: 'The Old Houses paid the war levy in brass, on time. Lady Vask framed the receipt and hung it beside her grandmother’s portrait. Visitors are invited to admire both.',
      },
    ],
  },
  {
    id: 'gate-watch',
    name: 'Captain Dunmark and the Gate Watch',
    npc: 'ferro-dunmark',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['watch-returned'] },
        text: 'The Gate Watch held the gate open for everyone running south. Dunmark stood in the gateway and counted each of them through, out loud. Twenty-two of the Watch who came down off the ridge stood behind him. None of them ran.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'The Gate Watch held the gate open for everyone running south. Dunmark stood in the gateway and counted each of them in, out loud. He did not close it.',
      },
      {
        when: { endings: ['hundred-candles'] },
        mood: 'sad',
        text: 'On the night the war ended, and on that night every year since, the Gate Watch carries a candle up the wall for each name it lost. Dunmark lights the last one himself and holds it until it burns down to his fingers. Then a while longer.',
      },
      {
        when: { endings: ['iron-peace'], flags: ['d43-dunmark-demoted'] },
        text: 'The Gate Watch stands on every road, and the officer who commands it is not Ferro Dunmark. Dunmark is a sergeant at the east gate. Every night at roll call he reads the names aloud in his orders voice. He has not been asked to in years.',
      },
      {
        when: { endings: ['iron-peace'] },
        text: 'The Gate Watch stands on every road. Nobody raids anybody. Captain Dunmark signs every posting himself, and has never once let the throne forget that a posting is a spending.',
      },
      {
        when: { flags: ['d43-dunmark-demoted'] },
        mood: 'sad',
        text: 'Ferro Dunmark kept his sergeant’s stripe and never asked for the captain’s knot back. The Watch calls him Captain when the crown is out of earshot. He corrects them every time. It never sounds like he means it.',
      },
      {
        when: { flags: ['d10-oath-of-reasons'] },
        text: 'Every order had its reason. Every name was read aloud after. Dunmark keeps the list. It runs to four pages. On the tenth day of every year he reads all four at the gate, and the Watch stands until he is done.',
      },
      {
        when: { flags: ['oath-of-care', 'd43-oath-renewed'] },
        mood: 'happy',
        text: 'Captain Dunmark had the words cut over the gatehouse door: I will never spend you cheaply. Every recruit touches them on the way in. The stone is wearing smooth.',
      },
      {
        when: { flags: ['oath-of-crown'] },
        text: 'The Watch belongs to the crown before all else, and says so, loud and correct. Captain Dunmark has never smiled on parade. When the crown asks how the Watch is, he says: present.',
      },
      {
        when: { flags: ['d41-two-hands'] },
        text: 'Every order from the tower carries two seals now. The second hand belongs to a clerk nobody can bribe, because nobody knows which clerk. Dunmark says it slows the Watch by a day. He has never asked to change it.',
      },
      {
        text: 'Captain Dunmark holds the throne to what it swore. Some mornings he stands in the hall until the emperor looks up. Then he nods, and goes back to the gate.',
      },
    ],
  },
  {
    id: 'archive',
    name: 'Keeper Vellum and the Lamplight Archive',
    npc: 'abelard-vellum',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['d49-record-names'] },
        text: 'Keeper Vellum carried the Archive into the hills in one crate. On top is the record of the reign: the names of the people at the last fire. He reads it to the camp when the singing is loud. It covers the singing for a while.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Keeper Vellum carried the Archive down into its cellars and went on writing by one lamp. Somebody has to remember it right.',
      },
      {
        when: { flags: ['d41-ledger-burned'] },
        text: 'Komodo’s ledger burned at the edge of the firelight, and Keeper Vellum let it. He has been writing it out again ever since, from memory. He will not say how much he remembers. He lets nobody read it.',
      },
      {
        when: { flags: ['d49-record-names'] },
        text: 'The record of the reign is a list of the people at the last fire. The emperor’s name is not on it. When one of them dies, Keeper Vellum draws a small lamp beside the name. There are seven lamps so far.',
      },
      {
        when: { flags: ['d49-record-promises'] },
        mood: 'happy',
        text: 'The record says: kept the crown’s promises, and said so when it could not. Keeper Vellum underlined it. He never underlines. Scholars still argue about the underline.',
      },
      {
        when: { endings: ['iron-peace'], flags: ['d49-record-order'] },
        text: 'The record says: kept the kingdom standing, whatever it cost. Under it Keeper Vellum left a page for the costs. He writes a line when a cost comes due. He has not yet turned the page.',
      },
      {
        when: { flags: ['d41-trust-kept'] },
        text: 'The record says the crown kept trusting people after the seal. It was wrong twice more that the record knows of. It went on trusting them. The record says that too.',
      },
    ],
  },
  {
    id: 'freeholds',
    name: 'Hester Plowright and Thistledown',
    npc: 'hester-plowright',
    variants: [
      {
        when: { endings: ['long-night'] },
        mood: 'sad',
        text: 'Hester Plowright burned her own fields so the road would have nothing to come for, and took the Freeholds up into the hills with the goats. Every night she counts them. Eggs, goats, people.',
      },
      {
        when: { flags: ['thistledown-abandoned', 'd42-thistledown-repaid'] },
        text: 'The crown’s last thirty brass paid a well-digger. Thistledown’s new well is the deepest in the Freeholds. Hester drinks from it first, every morning, and does not say why. She sent the crown no number that year.',
      },
      {
        when: { flags: ['thistledown-abandoned', 'd42-thistledown-justified'] },
        text: 'The emperor told Hester the truth, and she gave honest back. Thistledown was rebuilt without one crown carpenter. When the reeves voted to thank the throne, hers was the only hand that stayed down. She keeps the lamp the emperor left in her loft.',
      },
      {
        when: { flags: ['thistledown-abandoned'] },
        mood: 'angry',
        text: 'Thistledown burned at noon while the crown held the other road. Hester counted the barns and sent the number to the throne, as she said she would. She has sent the same number every year since. Same day. Same hand.',
      },
      {
        when: { flags: ['thistledown-burned', 'thistledown-defended'] },
        text: 'Thistledown burned once while the crown watched. The second time, the crown came before noon. Hester Plowright had the first barns’ ash mixed into the mortar of the new well. She says it holds water better.',
      },
      {
        when: { endings: ['open-roads'] },
        mood: 'happy',
        text: 'The Freeholds wrote their own charter, and Hester read it aloud from a hay cart, twice. It says strangers drink first on feast days. She argued against that clause for three nights. She lost. She signed it anyway.',
      },
      {
        // t-043: a tenth of every cup sold at the back gates, Day 18.
        when: { flags: ['d18-water-taxed'] },
        text: 'The crown’s clerk kept a table at the Freehold back gate until the war, a tenth of every cup. The road called it the crown’s well. When the clerk went home Hester left the table standing. Strangers still put a coin on it. Nobody collects.',
      },
      {
        when: { flags: ['wells-closed'] },
        text: 'The Freehold wells stayed the Freeholders’ own. On the road outside the gates there is a cairn, one stone for each stranger who died thirsty. Hester Plowright waters Freeholders first and isn’t ashamed of it. She has never taken the cairn down.',
      },
      {
        when: { flags: ['wells-shared'] },
        text: 'The Freehold wells stayed open to everyone, front gate and back. Hester keeps a painted bowl at every well for strangers. She counts the bowls at night. They are always there.',
      },
    ],
  },
  {
    id: 'rustline',
    name: 'Jinx Coupler and the Rustline',
    npc: 'jinx-coupler',
    variants: [
      {
        when: { flags: ['d42-engine-sold-grey'] },
        mood: 'sad',
        text: 'Jinx counted the grey buyer’s brass three times and spent it within the month. On still nights, far up the mission road, an engine that should not run is running. Jinx will not salvage north of the canyon now. Not at any price.',
      },
      {
        when: { flags: ['d42-engine-half-sold'] },
        mood: 'sad',
        text: 'Jinx sold half an engine to the grey buyer and kept the shiny half. Half was enough. On still nights, far up the mission road, something runs that should not. Jinx keeps that brass in a jar and has not spent a bit of it.',
      },
      {
        when: { flags: ['d42-engine-bought'] },
        text: 'The crown paid Jinx for an engine it wanted dead. It is still dead on the east siding, rusting in the right places. Children climb it. Jinx sends the crown a bill for the paint they wear off.',
      },
      {
        when: { flags: ['d42-engine-wrecked'] },
        mood: 'angry',
        text: 'The engine was broken where it stood, and Jinx Coupler never sold the crown another nail. The crown buys its nails from the Ledger at twice the price. Jinx frames the receipts and sends them back.',
      },
      {
        when: { flags: ['rustline-market'] },
        mood: 'excited',
        text: 'The magpies kept the stalls the Ledger closed. Their prices change while you watch. Jinx Coupler holds court at the centre stall in a coat of bottle caps and sells the crown its own lost spoons.',
      },
      {
        when: { flags: ['d23-lantern-under-seal'] },
        text: 'The blue lantern line runs under the crown’s seal: a fifth to the throne, and the crown never sees a thing. Every quarter a square of tin arrives at the tower. A lantern, a crown, a handshake. The crown has a drawer full.',
      },
      {
        when: { flags: ['rustline-barricades'] },
        text: 'The rusted boxcars the Rustline dragged across the Ford are still there, green with moss. Children play in them. Jinx sends the crown a bill for them at midsummer. The crown pays it.',
      },
    ],
  },
  {
    id: 'moles',
    name: 'Granny Umber and the Moles',
    npc: 'granny-umber',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['d50-moles-hold-stairs'] },
        text: 'The burrows held the stairs on the last night and kept holding them. Two hundred and forty-six Moles live under the badlands, and everyone they let in. The singing stops at the third landing. Granny Umber has not asked why.',
      },
      {
        when: { endings: ['long-night'], flags: ['d50-moles-dig'] },
        mood: 'sad',
        text: 'The burrows dug the crown a door under the Abbey wall, and the door let the singing into the tunnels. Granny Umber filled the stairs behind the last of them herself. Fourteen were on the wrong side.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'The Moles took in anyone who fit down a burrow and filled the stairs behind them. Granny Umber counts heads in the deep tunnels every night. The number goes up. She will not say from where.',
      },
      {
        when: {
          endings: ['tunnels-and-councils'],
          flags: ['d42-mole-charter-signed'],
        },
        mood: 'excited',
        text: 'The charter signed on a crate by lamplight hangs in the first assembly hall above ground. Every meeting opens with somebody reading it aloud. It takes eleven minutes. Granny Umber times it.',
      },
      {
        when: { endings: ['tunnels-and-councils'] },
        mood: 'happy',
        text: 'The Moles hold their assemblies in daylight now, in every village, about everything. Granny Umber chairs the ones about water. She bangs her cane three times when a motion carries. She has worn through two floors.',
      },
      {
        when: { flags: ['d50-moles-dig'] },
        mood: 'sad',
        text: 'The burrows dug the crown its door under the Abbey wall. Fourteen did not come back up it. The tunnel is bricked up now. On the near side Granny Umber had them cut the vote into the stone, two hundred and six to forty, and the fourteen names under it. Children put their paws in the numbers.',
      },
      {
        when: { flags: ['d50-moles-hold-stairs'] },
        mood: 'happy',
        text: 'Two hundred and forty-six Moles held the stairs on the last night. None went down. At dawn Granny Umber sat on the top step with her slate and ticked every one of them back in.',
      },
      {
        when: { endings: ['witchwater-throne'], flags: ['d44-dike-blown'] },
        mood: 'angry',
        text: 'The green lanterns burn on the tower. The north reed beds are still a lake. The Moles went underground the week the Mothers took their seat and filled the stairs behind them. Granny Umber wrote the crown one line. It is in the Archive. It is not read aloud.',
      },
      {
        when: { endings: ['witchwater-throne'] },
        mood: 'angry',
        text: 'The green lanterns burn on the tower now. The Moles went back underground the week the Mothers took their seat, and filled the stairs behind them. Granny Umber sent the crown one letter. The seal was mud. It is still sealed.',
      },
      {
        when: { endings: ['iron-peace'], notFlags: ['d32-reform-sedition'] },
        text: 'The Watch stands at every burrow mouth. Nobody digs without a permit. Some nights the Moles sing under the walls again, low, the old songs. The Watch has learned the words.',
      },
      {
        when: { standing: MOLES_RECONCILED },
        mood: 'happy',
        text: 'The Moles never got the throne gone. They got a seat beside it, a ledger on the gate and the right to sing. Granny Umber calls it a ceasefire. She comes to every council anyway, early, for the chair by the stove.',
      },
      {
        when: { flags: ['mole-messenger-arrested'] },
        text: 'Granny Umber walked out of the crown’s cells the way she walked in: slowly, smiling. She has never once mentioned the cell. She does not need to. Every child in the burrows tells the story, and does her squint.',
      },
      {
        when: { flags: ['moles-blamed'], notFlags: ['d26-ford-reparations'] },
        mood: 'angry',
        text: 'The cousins from the burrows arrested for the Ford came home in spring, pale from the crown’s cells. Nobody apologised. Granny Umber met them at the burrow mouth with a shovel each. Among Moles that is welcome home. It is also a reminder.',
      },
      {
        when: { flags: ['mole-truce'] },
        text: 'The burrows kept their water rights, cistern and all. Every morning Granny Umber walks to the sluice and puts her paw in the water. Up to the wrist. Not one hair more.',
      },
    ],
  },
  {
    id: 'coal-harrow',
    name: 'Coal Harrow and the sappers',
    variants: [
      {
        when: { endings: ['long-night'] },
        text: 'Coal Harrow blew every stair behind the last of the burrows and stayed on the wrong side to light the fuse. The Moles cut his name into the rock at the bottom. Nobody argues about him anymore.',
      },
      {
        when: { flags: ['d44-dike-blown'] },
        text: 'Coal Harrow got his flood. The reed beds are a lake, and the lake has his name, though nobody says it near the water. He drinks alone at the burrow mouth. The fen children row past and look at him.',
      },
      {
        when: { flags: ['d33-sappers-to-fen'] },
        mood: 'sad',
        text: 'The fen gave the three sappers back after one night, as Reedlight said. They are quiet now. They do not dig. Coal Harrow went to see them once, and never again.',
      },
      {
        when: { flags: ['d33-coal-disowned'] },
        text: 'Coal Harrow went east when the burrows disowned him. The Rustline pays sappers by the keg. He sends his aunt nothing. Granny Umber keeps a lamp lit at the east stair anyway.',
      },
      {
        when: { flags: ['d32-coal-seated'] },
        text: 'Coal Harrow took the council seat, and the powder came inside the tent with him. He votes no on everything. Twice he has been right. He reminds them.',
      },
      {
        when: { flags: ['d44-powder-seized'] },
        text: 'The crown kept Coal Harrow’s kegs until the war ended. One went missing the first night. Nobody has found where it went off. Nobody has stopped listening for it.',
      },
      {
        when: { flags: ['d21-weir-blown'] },
        text: 'Coal Harrow keeps the empty keg from the weir on a shelf in the sapper hall, the chalk crown still on it. He tells the young ones the crown lent him a match once.',
      },
      {
        text: 'Coal Harrow still has his powder. He has not decided what it is for.',
      },
    ],
  },
  {
    id: 'abbess',
    name: 'The Abbess and the Gentle Mission',
    npc: 'the-abbess',
    variants: [
      {
        when: { endings: ['long-night'] },
        mood: 'happy',
        text: 'The door under the Abbey stayed open. The Abbess was seen once more, walking the mission road ahead of the singing with a lantern and a basket of bread. She stopped at every house.',
      },
      {
        when: { flags: ['abbess-unmasked'] },
        mood: 'angry',
        text: 'The party carried the Abbess’s habit out of the crypt for everyone to see. That was all they carried out. A year later, far down the Saltroad, a house in grey opened its doors to orphans. The bread is very good.',
      },
      {
        when: { flags: ['abbess-shamed'] },
        text: 'The small shoe from the Abbey cellar stayed on the Congress table after everyone left. The cleaners went around it. The Abbess never came to court again. Somewhere the order still feeds children. The crown has stopped asking where.',
      },
      {
        when: { flags: ['d25-orphan-writ'], notFlags: ['d30-writ-torn'] },
        text: 'The writ the emperor signed is in a drawer at the Abbey, folded like a handkerchief. When a sister in grey comes to a village asking after orphans, she carries a copy. It has the emperor’s seal on it.',
      },
      {
        text: 'The crypt door is shut. The Abbess is gone, and the sisters will not say where. Bread still comes up the mission road on feast days, warm, in clean grey cloth. The Yard eats it. Nobody says grace.',
      },
    ],
  },
  {
    id: 'saltroad',
    name: 'Oriel Saltmarsh and the Saltroad',
    npc: 'oriel-saltmarsh',
    variants: [
      {
        when: { flags: ['d42-abbey-crates-opened'] },
        mood: 'angry',
        text: 'Oriel burned the six Abbey wagons on the salt flats, bed-frames and grey blankets and all. The Saltroad carries nothing for the mission now, at any price. The scorch is still on the flats. Caravans steer around it without being told.',
      },
      {
        when: { flags: ['d42-sergeant-sent'] },
        text: 'The sergeant who rode for Thistledown walked beside the third wagon across the salt and did not go back to the Watch. He drives that wagon now. The families let him hold the reins. They have not let him forget why.',
      },
      {
        when: { flags: ['d42-drivers-paid'] },
        text: 'The crown paid the waystation families a driver’s wage for a winter it could not afford. Oriel entered it in her book under debts owed to the Saltroad. Then she crossed it out and wrote it again under paid.',
      },
      {
        when: { endings: ['open-roads'] },
        text: 'The Saltroad writes its own charters on the backs of salt manifests. Oriel Saltmarsh signs every one out loud. She crossed the word emperor out of the first draft, then wrote it back in, smaller.',
      },
      {
        when: { flags: ['d42-faced-the-drivers'] },
        text: 'The driver’s mother who said the worst rode the box beside the emperor all the way across the salt. When the crown travels the Saltroad, she does it again. She has never said anything kinder. She has never moved away.',
      },
      {
        when: { flags: ['d42-drivers-silenced'] },
        mood: 'sad',
        text: 'The waystation families stayed quiet, as asked. Their wagon rolls at the back of every caravan, empty. Oriel will not sell it or load it. She says it is carrying something already.',
      },
      {
        // t-043: the crown rode for the waystation on the thirty-third day.
        when: { flags: ['waystation-defended'] },
        text: 'The waystation the crown held at noon on the thirty-third day still stands. The Saltroad painted the gatepost in the crown’s colours. Every driver slaps it going by. Oriel Saltmarsh has never once slapped it. She repaints it every spring.',
      },
      {
        when: { flags: ['waystation-abandoned'] },
        text: 'The salt-house burned while the crown held Thistledown. Forty families rebuilt it a day further down the road. Oriel never asked the crown for an answer. She counts its caravans out loud as they pass.',
      },
    ],
  },
  {
    id: 'verge',
    name: 'The Envoy of the Black Verge',
    npc: 'the-verge-envoy',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['verge-allied'] },
        mood: 'sad',
        text: 'The plum riders rode at the court’s flank to the Abbey and back. When the singing came down the roads they turned their horses home to their sick. The Envoy sent one line after. We do not forget. Either kind.',
      },
      {
        when: { flags: ['d45-envoy-knelt'] },
        text: 'The Envoy knelt until midnight and repeated back every burned thing the Freeholders named. The plum riders left the Ford that spring. The Envoy came back once more, alone, and asked to hear the list again. Somebody read it.',
      },
      {
        when: { flags: ['ford-returned'] },
        text: 'The plum riders left the Ford and the fields beside it. The Verge keeps its debts the way a hand keeps a glove. That winter a pair of white gloves arrived at the tower, unworn. No letter. They are in a drawer in the Archive, still folded.',
      },
      {
        when: { flags: ['chose:d45-envoy:refuse'] },
        mood: 'sad',
        text: 'The Verge sang. Nobody at court heard it end. Years later its envoy came to the tower gate with bare hands, asked for water, drank it standing, and left.',
      },
      {
        when: { flags: ['verge-cures-accepted'] },
        text: 'The Verge’s charms kept the Yard’s grain from rotting all that winter. The bread was good. Nobody could get warm. The old cooks wear mittens to the ovens and will not say why.',
      },
    ],
  },
  // t-039: Act V's verdicts, each remembered by the one it fell on.
  {
    id: 'sentry',
    name: 'The sentry from the midnight gate',
    variants: [
      {
        when: { flags: ['d41-sentry-reposted'] },
        text: 'The sentry from the midnight gate kept her post to the end of the war and after it. She lifts the bar halfway for everyone, the emperor too. The horses duck.',
      },
      {
        when: { flags: ['d41-sentry-stripped'] },
        mood: 'sad',
        text: 'The folded tabard from the midnight gate is still in the Watch chest. It has not been worn. It has not been thrown out. The sentry who folded it keeps an inn on the Saltroad and bars her own door at dusk.',
      },
      {
        when: { flags: ['d41-crown-owns-the-gate'] },
        text: 'The crown called the midnight gate its own fault, out loud, by the fire. The sentry split wood every morning for a year. Then she asked for the Watch back. She has the north gate. She has never been late to it.',
      },
      {
        when: { flags: ['d41-sentry-testified'] },
        text: 'The sentry told the camp what happened at the midnight gate, word for word, twice. The camp decided nothing. She tells it a third time to every recruit, the joke about the horses too. They stop laughing in the same place.',
      },
    ],
  },
  {
    id: 'holloway',
    name: 'Sergeant Holloway',
    variants: [
      {
        when: { flags: ['d43-holloway-tried'] },
        text: 'Holloway carried the camp’s water until the war ended, as sentenced. Then she kept carrying it. The Watch has stopped telling her she can stop.',
      },
      {
        when: { flags: ['d43-holloway-left'] },
        mood: 'sad',
        text: 'Sergeant Holloway walked off along the ridge toward nowhere. Her daughter in the Yard grew up and joined the Watch. She asked for the ridge post. She got it.',
      },
      {
        when: { flags: ['watch-inside-tower'] },
        text: 'Holloway went back into the tower first, as ordered, and lifted the bar from inside when the court needed a door. The Watch calls the inside of that gate Holloway’s side. She stands it.',
      },
      {
        when: { flags: ['chose:d43-defector:welcome'] },
        text: 'All twenty-two came down off the ridge, Holloway last. She salutes the crown at every parade. The crown returns it. Dunmark watches them both.',
      },
    ],
  },
  {
    id: 'cook',
    name: 'The cook who left a letter in the flour',
    variants: [
      {
        when: { flags: ['d47-false-letter'] },
        mood: 'sad',
        text: 'Three nights of lanterns searched an empty valley. The cook’s mother and sisters ate every one of those days. The cook does not know what the sisters did on the fourth. He bakes as if he does.',
      },
      {
        when: { flags: ['d47-cook-exiled'] },
        mood: 'sad',
        text: 'The cook who left a letter in the flour took the tower road without his apron, toward his mother. The court does not know if he reached her. Dunmore Ash still has the apron. It is clean.',
      },
    ],
  },
  {
    id: 'courier',
    name: 'Odo Umber',
    variants: [
      {
        when: { flags: ['d42-courier-kept'] },
        mood: 'happy',
        text: 'Odo Umber never carried another letter. He digs for the water assembly. Granny Umber says he is the slowest digger in the burrows. She says it like a medal.',
      },
      {
        when: { flags: ['d42-courier-sent'] },
        mood: 'sad',
        text: 'Odo Umber carried one more letter up the mission road and came back with the Abbey kitchens drawn on his arm. The soot washed off. He sleeps with a lamp lit. He has never said what he heard on the stair.',
      },
    ],
  },
])

// --- the barracks -----------------------------------------------------------

const BARRACKS: EpilogueSubject[] = [
  {
    id: 'rook',
    name: 'Rook Bramble',
    follower: 'F001',
    variants: [
      {
        when: { departed: ['F001'] },
        mood: 'sad',
        text: 'Rook Bramble rode out behind Young Komodo and never rode back. On the southern road there is an outrider who can follow wagon ruts across bare stone. They do not stop at painted wagons anymore.',
      },
      {
        when: { dead: ['F001'] },
        mood: 'sad',
        text: 'Rook Bramble is buried at the Eastern Ford, facing the southern road. Every spring someone leaves a painted feather on the stone. Nobody at court has seen who.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Rook rides ahead of the court in the hills, reading the ruts for roads that are still safe. Fewer every month. They come back each night and say the number.',
      },
      {
        when: { flags: ['romance-rook-sealed', 'rook-scout-spared'] },
        mood: 'happy',
        text: 'Rook keeps two cups on the barracks roof. Once a year an old raider rides past the southern gate and does not stop. Rook watches her out of sight. Then they pour the second cup.',
      },
      {
        when: { flags: ['rook-heartbroken'] },
        mood: 'sad',
        text: 'Rook Bramble never carried the second cup up to the roof again. They ride the southern road for the crown, on time, every day. They said they could sleep in a fortress that hanged her. They can.',
      },
      {
        when: { anyFlags: ['romance-rook-sealed', 'romance-rook'] },
        mood: 'happy',
        text: 'Rook keeps two cups on the barracks roof. They name the stars after roads they have ridden with the emperor and get most of them wrong on purpose. The emperor notices.',
      },
      {
        when: { flags: ['rook-hunts-komodo'] },
        text: 'Rook rode north after Komodo with two days’ bread and a rope. They came back. They never said whether they found him. The rope was gone.',
      },
      {
        when: { flags: ['rook-friendship'] },
        text: 'Every morning Rook brings tea up to the emperor’s window. One cup. Hot. They drink theirs on the stair.',
      },
      {
        when: { flags: ['rook-spare-scout'] },
        text: 'Rook never found the scout who pulled their family out of the Ford. Sometime in the second winter they stopped looking for her face on painted wagons, and started looking at the road.',
      },
      {
        text: 'Rook Bramble rode for the crown until the roads were quiet, and a while after, from habit.',
      },
    ],
  },
  {
    id: 'saffron',
    name: 'Saffron Kett',
    follower: 'F002',
    variants: [
      {
        when: { departed: ['F002'], flags: ['saffron-free'] },
        mood: 'sad',
        text: 'Saffron Kett went home to the canyon the night before the Abbey, and the Pack rode to the wall in her place. Forty went. Thirty-six came back. She built four new wagons that winter and painted no names on them. The wheels stay on.',
      },
      {
        when: { departed: ['F002'] },
        mood: 'sad',
        text: 'Saffron Kett went with Young Komodo. Past the mission road there is a bridge nobody paid for. It holds. Nobody crosses it.',
      },
      {
        when: { dead: ['F002'] },
        mood: 'sad',
        text: 'Saffron Kett is buried in the canyon by the Pack’s remembering fire, with her toolkit. The badge is still welded inside the lid. Every year Gristle Vane tells the goat story wrong at her stone, and waits for somebody to correct him.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Saffron dropped every bridge behind the court as it ran, one weld at a time. She knows where each one fell. She says she will build them all again. She has drawings.',
      },
      {
        when: { flags: ['romance-saffron-sealed', 'saffron-fire-openly'] },
        mood: 'happy',
        text: 'Every autumn Saffron goes to the remembering fire with the emperor beside her and no hood. Vane tells the goat story. She hides her face in the emperor’s shoulder for a full minute. She times it.',
      },
      {
        when: { flags: ['romance-saffron-sealed'] },
        mood: 'happy',
        text: 'The next year, as she said, they went without the hood. Saffron introduced the emperor to the Pack as “mine” and nothing else. Nobody in the canyon has needed more.',
      },
      {
        when: { flags: ['d47-saffron-commission'] },
        mood: 'excited',
        text: 'The new crown’s first building was Saffron’s to design. It is a bridge nobody wanted to pay for. It carries more than it should. Her name is welded inside the keystone, where only a bridge-builder would look.',
      },
      {
        when: { flags: ['saffron-keeps-sabotage'] },
        text: 'The filed pin is still on the shelf over Saffron’s bench, where she sees it every morning. The canyon engine sips. Hollow Bell keeps its stream. When Saffron laughs it still comes half a beat late.',
      },
      {
        when: { flags: ['saffron-free'] },
        text: 'Saffron stayed until the end. Then she chose the canyon. Every season a bridge appears somewhere on the southern roads that nobody ordered and nobody paid for. They all carry weight.',
      },
      {
        text: 'Saffron Kett builds bridges nobody wants to pay for. The crown pays for them now. She argues every invoice, with drawings.',
      },
    ],
  },
  {
    id: 'kiyo',
    name: 'Kiyo',
    follower: 'F003',
    variants: [
      {
        when: { departed: ['F003'], flags: ['kiyo-sent-home'] },
        mood: 'happy',
        text: 'Kiyo went home on the forty-seventh night, before the Abbey. Her boy met her at the straits with a beetle in a jar to show her. She let it go for him. The infirmary sews with her needles. Badly. Somebody wrote to ask how she held them. She wrote back: carefully.',
      },
      {
        when: { departed: ['F003'] },
        mood: 'sad',
        text: 'Kiyo left the night the tower fell and took Zuzu with her. Some winters a packet of bitter tea comes for the court’s wounded. No note. The string is tied the way she tied bandages.',
      },
      {
        when: { dead: ['F003'], flags: ['d47-letter-sworn'] },
        mood: 'sad',
        text: 'Kiyo is buried facing the straits, with her kettle. The emperor crossed the straits with the letter that spring, as sworn, and found a boy counting beetles on a wall. The emperor did not say brave. The emperor said careful.',
      },
      {
        when: { dead: ['F003'], flags: ['kiyo-letter-kept'] },
        mood: 'sad',
        text: 'Kiyo is buried facing the straits, with her kettle. The letter with a beetle on the envelope is in a vault again, unread. It waits for a boy who wants to be a hero and cannot finish a cup of tea. He is not old enough yet.',
      },
      {
        when: { dead: ['F003'] },
        mood: 'sad',
        text: 'Kiyo is buried facing the straits, with her kettle. At her wake somebody tore the bread small, the way her boy likes it. There were no bells.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'When the roads went wrong, Kiyo took her boy and her kettle to the coast and found a salt boat. He slept through the crossing in a basket. He never knew she was afraid. She made sure.',
      },
      {
        when: { flags: ['romance-kiyo-sealed'] },
        mood: 'happy',
        text: 'Kiyo keeps the infirmary keys. The emperor has never asked for a copy. Once a week they share bitter tea with the crown left outside. Zuzu brings breakfast and appoints himself the better ruler. Neither adult argues.',
      },
      {
        when: { flags: ['kiyo-clinic-neutral'] },
        mood: 'happy',
        text: 'The infirmary admits the wounded without asking whom they fought for. The Watch still sends complaints. Each bears the emperor’s signature at the bottom, never Kiyo’s. Zuzu grows tall enough to hold the lantern at the door.',
      },
      {
        when: { flags: ['kiyo-clinic-guarded'] },
        mood: 'sad',
        text: 'The Watch guards the infirmary. Its beds are safe and sometimes empty. Kiyo keeps a second roll of bandages by the outer steps for the wounded who will not pass the sentry. She does not tell Zuzu why.',
      },
      {
        when: { flags: ['kiyo-clinic-independent'] },
        mood: 'happy',
        text: 'Kiyo keeps the charter beside her lantern. The crown never signs a patient list. Some mornings she sends the Watch away. Others she asks for its help. She makes mistakes and owns them. The emperor still comes for tea.',
      },
      {
        when: { flags: ['kiyo-friendship-deep'] },
        mood: 'happy',
        text: 'Kiyo and the emperor meet once a week with the court locked outside. Zuzu still wins every game of spoons and crowns. They have never let him win on purpose.',
      },
      {
        when: { flags: ['kiyo-bell-lesson'] },
        mood: 'happy',
        text: 'Kiyo’s boy rang the fortress bell himself one evening and learned what it means here. Some nights he wakes at midnight, to listen. Kiyo pours two cups of bitter tea and they listen together.',
      },
      {
        when: { flags: ['kiyo-tea-garden'] },
        mood: 'happy',
        text: 'Two of the tea seedlings lived. The child with the thimble kept them going through the dry. There is a hedge along the infirmary wall now. The tea is too bitter to drink. Everyone drinks it.',
      },
      {
        when: { flags: ['kiyo-both-true'] },
        text: 'Kiyo’s boy still calls every bird Komodo. Kiyo has stopped correcting him. Komodo was kind to him, and that was true.',
      },
      {
        text: 'Kiyo mends the court’s wounded with a kettle, a needle and a bitter tea from home. She keeps one eye on the door, in case her boy has wandered off again. He usually has.',
      },
    ],
  },
  {
    id: 'flint',
    name: 'Duchess Flint',
    follower: 'F004',
    variants: [
      {
        when: { departed: ['F004'] },
        mood: 'sad',
        text: 'Duchess Flint walked out behind Young Komodo and gave every checkpoint her title. They let her through. They always did. Nobody at court has heard her ask a precise question since.',
      },
      {
        when: { dead: ['F004'] },
        mood: 'sad',
        text: 'Duchess Flint is buried under her real name, which was only Flint. The stone says Duchess too. The Yard paid for the extra letters, a copper each.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Duchess Flint walks ahead of the court to every village and asks, slowly, for one more night’s roof. Nobody has said no to her yet. She says that is because she does not hurry.',
      },
      {
        when: { flags: ['flint-censure-stands'] },
        text: 'The censure stayed in the court book. Flint kept serving, slowly and well. She never again sat on the floor while the emperor was in the room. Sent somewhere dangerous, she still stood between the danger and everyone else.',
      },
      {
        when: { flags: ['flint-confessed-grain'] },
        mood: 'happy',
        text: 'Flint took the censure she had been spared and read all thirty-one families aloud. The Moles named a well after her. She has never gone to see it. She says it is enough to know it is wet.',
      },
      {
        when: { flags: ['flint-title-confessed'] },
        mood: 'happy',
        text: 'Flint told the hall her name was only Flint. The Yard called her Duchess anyway, and it stuck. Her patent of nobility is a Yard child’s drawing of a crown. She keeps it under her shawl.',
      },
      {
        when: { flags: ['flint-made-duchess'] },
        text: 'The crown made the lie true. Duchess Flint has a patent, a seal and a seat she never uses. When Lady Vask says “Duchess” across the hall it is still nearly a hiss. Flint answers it every time. Slowly.',
      },
      {
        when: { flags: ['flint-cleared'] },
        text: 'The ledgers cleared Flint and named the Old House cousin who sold the grain at three times the price. Flint asked the court to fine him the difference and give it to the burrow. She carried the receipt to Lady Vask herself. It took all afternoon.',
      },
      {
        when: { flags: ['flint-doubted'] },
        mood: 'sad',
        text: 'The ledgers said what the Old Houses wanted, and the court let them. Flint never asked to see them again. When grain goes missing now, she is the first one counted. She counts herself.',
      },
      {
        when: { flags: ['flint-no-threats'] },
        text: 'The crown never sent Flint with a threat. Some rooms took longer because of it. She sat in all of them until the other side ran out of patience first. It was always the other side.',
      },
      {
        text: 'Duchess Flint asks precise questions, slowly, and never lets the court call the dead an abstraction. Lady Vask has stopped writing letters about her title. Flint misses them.',
      },
    ],
  },
  {
    id: 'pip',
    name: 'Pip Thread',
    follower: 'F005',
    variants: [
      {
        when: { departed: ['F005'] },
        mood: 'sad',
        text: 'Pip Thread went with Young Komodo and kept his books. They are very good books. Every page adds up. Pip finds that the worst part.',
      },
      {
        when: { dead: ['F005'] },
        mood: 'sad',
        text: 'Pip Thread’s registers are filed in the Lamplight Archive under their own name. The last page is half finished. The Archive will not let anyone finish it. The pen is still squared with the edge of the page.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Pip carries the registers of the reign in a satchel too heavy for Pip. By whatever fire there is, Pip copies one page a night. The record will outlast whatever this is.',
      },
      {
        when: { flags: ['pip-komodo-record'] },
        text: 'Pip’s eleven pages about Komodo are in the Archive behind the copy of page two hundred and eight. The last line still reads: he was kind to me on my first day, and I do not know what to do with that, so I am writing it down. Pip has not added a word.',
      },
      {
        when: { flags: ['pip-fold-kept'] },
        text: 'The page with the drawn fold went into the record beside Komodo’s name, as promised. Pip never looked at it again. Pip kept the empty sleeve.',
      },
      {
        when: { flags: ['pip-page-worth-it'] },
        text: 'On market days Pip stands at the fortress gate beside a boy’s page the rain has nearly taken, and ties a green thread to the nail. A new one every year. Pip does not say what the old ones were for.',
      },
      {
        when: { flags: ['pip-record-bent'] },
        text: 'Pip keeps two copies of every register. The second set is somewhere the crown does not know about. It has never been needed. Pip checks on it each spring, and comes back dusty.',
      },
      {
        text: 'Pip Thread can recite every page in the tower and still finds ordinary conversation exhausting. Lately Pip has started saying good morning. It is going slowly.',
      },
    ],
  },
  {
    id: 'nera',
    name: 'Nera Gale',
    follower: 'F006',
    variants: [
      {
        when: { departed: ['F006'] },
        mood: 'sad',
        text: 'Nera Gale went with Young Komodo and sold the weather to whoever asked. Twice a year the court gets a forecast it did not pay for. It is always right.',
      },
      {
        when: { dead: ['F006'] },
        mood: 'sad',
        text: 'Nera Gale’s ashes went into the wind off the tower on a morning with no weather in it. At the next briefing there was a grey feather on the arm of the throne. Nobody will say who put it there.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Nera Gale reads the wind for the court in hiding. Some mornings she says the weather is wrong, and they move before noon. She has not been wrong yet.',
      },
      {
        when: {
          endings: ['crows-bargain'],
          flags: ['romance-nera-sealed', 'nera-oath-sworn'],
        },
        text: 'The emperor swore that no person is payment, and then the peace went to the Crows. Every spring when Corvane names the price, Nera stands at the high window and checks it against the oath, line by line. So far it holds. She does not stop checking.',
      },
      {
        when: { flags: ['romance-nera-sealed', 'nera-oath-sworn'] },
        mood: 'happy',
        text: 'When the Crows come to court, Nera Gale stands beside the throne and says nothing. She does not need to. When it rains, the two of them go out and stand in it.',
      },
      {
        when: { flags: ['romance-nera-sealed', 'nera-oath-refused'] },
        text: 'Nera kept the door, as she said she would. Some nights she stands at the high window watching the Heights. The emperor has never asked what she sees. She has never offered.',
      },
      {
        when: { flags: ['nera-letter-softened'] },
        text: 'Nera believes her teacher forgave her. The emperor burned the half of the letter that said otherwise. Some mornings she reads her half aloud at breakfast. It is short.',
      },
      {
        when: { flags: ['romance-nera'] },
        mood: 'happy',
        text: 'Nera Gale goes out onto the wall when a storm comes in. She no longer stands there alone.',
      },
      {
        text: 'Nera Gale reads the wind and will not sell it. Some mornings there is a grey feather on the arm of the throne before the briefing. Somebody is still lying to the crown. Nera is still noticing.',
      },
    ],
  },
  {
    id: 'ash',
    name: 'Ash Quill',
    follower: 'F007',
    variants: [
      {
        when: { departed: ['F007'] },
        mood: 'sad',
        text: 'Ash Quill crossed every checkpoint in the wasteland on papers written at a kitchen table. The last pass the court saw carried Young Komodo’s seal. The hand was Ash’s.',
      },
      {
        when: { dead: ['F007'] },
        mood: 'sad',
        text: 'Ash Quill is buried by the side gate with their satchel. In it were thirty letters to a boy called Sorrel, unopened. The emperor has not opened them either. Every month the stack is one letter taller.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Ash Quill carries letters between the scattered factions: hills, fen, deep tunnels. Every letter arrives. Ash has stopped looking for faces at the crossroads. There are too many.',
      },
      {
        when: { flags: ['ash-goes-in'] },
        text: 'Ash went in at the Abbey’s side gate in grey, with a lantern and a loaf. They came back. They have never said what they found in the lower house. They write to Sorrel every week, and deliver each letter to the fire, unopened.',
      },
      {
        when: {
          anyFlags: ['ash-promise-renewed', 'ash-abbey-promise'],
          flags: ['abbess-unmasked'],
        },
        text: 'When the crypt door shut, the crown went into the Abbey’s lower house with banners, loudly, as promised. Ash went first. They came out carrying a pair of small shoes. Nobody asked whose.',
      },
      {
        when: { flags: ['ash-forbidden'] },
        text: 'The emperor forbade it, for love, and Ash stayed. They never went to the side gate. Some nights they stand at it with an unlit lantern. Then they come back to bed.',
      },
      {
        when: { anyFlags: ['romance-ash-sealed', 'romance-ash'] },
        mood: 'happy',
        text: 'Ash Quill delivers every letter unopened except the ones addressed to the emperor, which they read aloud, in voices, badly. By the second page their head is on the emperor’s shoulder.',
      },
      {
        when: { flags: ['ash-forged-sorrel'] },
        mood: 'sad',
        text: 'Once a season Ash writes to the Abbey in a round flour-barrel hand, asking after a dog the family never had. The answer always comes, warm and perfectly spelled. The dog is always well.',
      },
      {
        text: 'Ash Quill carries the crown’s letters on the fast roads, unopened. At every crossroads they stop and look at the faces. Then they ride on.',
      },
    ],
  },
  {
    id: 'bram',
    name: 'Bram Coil',
    follower: 'F008',
    variants: [
      {
        when: { departed: ['F008'] },
        mood: 'sad',
        text: 'Bram Coil keeps a storeroom for someone else now. Everyone eats before the speeches. The speeches are not about the emperor.',
      },
      {
        when: { dead: ['F008'] },
        mood: 'sad',
        text: 'Bram Coil is buried on the east wall, where he stood the night watch. On feast days nobody in the fortress speaks until everyone has eaten. Nobody remembers making the rule. Nobody breaks it.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Bram Coil rations what the court has left. One ration. Everyone eats first. Nobody has gone hungry in front of him yet.',
      },
      {
        when: { flags: ['bram-eat-first'] },
        mood: 'happy',
        text: 'EVERYONE EATS FIRST is still chalked on the larder slate a hand high. Bram renews it every morning. At every feast the bread is on the tables before the emperor stands, and Bram is at the back with his arms folded.',
      },
      {
        when: { flags: ['bram-emperor-above'] },
        text: 'When the work needs him underground, Bram goes. Every few hours a voice comes up the ladder. It doesn’t say anything. It is checking. Somebody always answers.',
      },
      {
        when: { flags: ['bram-on-walls'] },
        text: 'Bram Coil kept the east wall. The Watch brings him its arguments and he settles them by weight. From there he can see everyone. He can reach anyone.',
      },
      {
        when: { flags: ['bram-riders-ration'] },
        text: 'The riders’ ration is still posted on the larder board with its reason. Under it, in Bram’s hand: THE YARD EATS BEFORE ANY SPEECH. Nobody has taken that one down.',
      },
      {
        text: 'Bram Coil holds the larder like a line. Nobody steals from it. Nobody goes hungry in front of it. He insists on both.',
      },
    ],
  },
  {
    id: 'keel',
    name: 'Keel Understone',
    follower: 'F009',
    variants: [
      {
        when: { departed: ['F009'] },
        mood: 'sad',
        text: 'Keel Understone went down a drain the night the tower fell and never came up where the court could see. The new well maps of the badlands are very good. Nobody signed them.',
      },
      {
        when: { dead: ['F009'] },
        mood: 'sad',
        text: 'Keel Understone is buried in the burrows, above the old flood line, where the water never reached. The list of forty-one homes went into the grave with them, folded small.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Keel Understone digs the court a new room every week, a little deeper. They always know which way is up. They say that will matter.',
      },
      {
        when: { flags: ['keel-cell-taken'] },
        mood: 'sad',
        text: 'Six came up out of the burrows into the Watch’s lamplight, the youngest fifteen. None of them looked at Keel. Keel visits the youngest once a month. They sit on opposite sides of the table and do not speak.',
      },
      {
        when: { flags: ['keel-sluice-kept'] },
        text: 'The sluice decree stayed on the books. It was never used. Keel keeps the list of forty-one homes over their bunk, and every morning on the way to breakfast they put a claw on the sluice gate.',
      },
      {
        when: { flags: ['keel-third-channel'] },
        mood: 'happy',
        text: 'Keel dug the third channel. It took a month, then a year. It waters the mills and spares the burrows. Keel’s name is not on it. A small portrait of Keel is scratched into the first stone, upside down.',
      },
      {
        when: { flags: ['keel-sluice-repealed'] },
        text: 'Keel carries the repeal in a shell-pocket, in case anyone at the bottom of the stair asks to see the seal again. Someone always does.',
      },
      {
        text: 'Keel Understone argues against the throne, and against anyone who would drown poor homes to beat it. They sleep with the head-lamp on.',
      },
    ],
  },
  {
    id: 'lumen',
    name: 'Lumen Shale',
    follower: 'F010',
    variants: [
      {
        when: { departed: ['F010'] },
        mood: 'sad',
        text: 'Lumen Shale built her hospital with the brass Young Komodo paid her. She took it without thanks and without shame. There is no name over the door. She would not allow one.',
      },
      {
        when: { dead: ['F010'] },
        mood: 'sad',
        text: 'Lumen Shale’s sash, stitched with every name she ever carried, hangs in the first council hall. Somebody adds a stitch each time a vote is read aloud. The sash is getting heavy.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Lumen Shale keeps a council in a cave: burrow, Yard, Freehold, one seat each. They vote on where to run next. Every vote is read aloud. Quietly.',
      },
      {
        when: {
          flags: ['lumen-councils-promised'],
          endings: ['tunnels-and-councils', 'open-roads'],
        },
        mood: 'happy',
        text: 'COUNCILS, Lumen stitched under the tower’s name, and under that, READ ALOUD. Both happened. She sits in the burrow seat and holds the crown to every vote. She said she actually would. She actually does.',
      },
      {
        when: { flags: ['lumen-tower-promised'] },
        text: 'The tower stands, stronger, as the emperor said. Lumen kept the thread she unpicked from its name. She has stitched nothing in its place.',
      },
      {
        when: { flags: ['lumen-carried-jar'] },
        text: 'Lumen carried her village’s jar home on foot. Isolde was at the gate with the green lantern lit when she came back. They are not friends. They walk in together anyway, every time.',
      },
      {
        when: { flags: ['lumen-councils-promised'] },
        text: 'The crown promised councils. There are councils now, of a kind. Lumen calls them a start, out loud, at every one.',
      },
      {
        when: { flags: ['d32-reform-sedition'] },
        text: 'The sedition law burned in four pages on the day Lumen came to court. She kept the ash in a jar with a label. Singers come to see it. It is a small jar.',
      },
      {
        text: 'Lumen Shale wants a world where nobody begs a tower to build a hospital. The hospital in the burrows has no name over its door. She would not allow one.',
      },
    ],
  },
  {
    id: 'tamsin',
    name: 'Tamsin Gutterwing',
    follower: 'F011',
    variants: [
      {
        when: { flags: ['d34-tamsin-swapped'] },
        text: 'Tamsin Gutterwing wears a Conclave sash again. She chose it this time, and she says that is the whole difference. The Crows do not believe her. Neither does she.',
      },
      {
        when: { departed: ['F011'] },
        mood: 'sad',
        text: 'Tamsin Gutterwing owes nobody anything. She keeps a ledger to prove it. The crown is on the first page, struck through.',
      },
      {
        when: { dead: ['F011'] },
        mood: 'sad',
        text: 'Tamsin Gutterwing owed nothing when she died. She made sure of it. Her cut knots are at the bottom of the barracks well. The Conclave sent no letter. It would have been a long letter.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Tamsin Gutterwing runs between the hiding places by night. She knows every draught in the hills. She has not been caught. She does not intend to be.',
      },
      {
        when: { flags: ['tamsin-raid-blessed'] },
        mood: 'excited',
        text: 'Tamsin brought seven runners down the Heights cliff in one night. Two would not leave. Every year she climbs back up alone and asks those two again.',
      },
      {
        when: { flags: ['tamsin-bond-bought'] },
        text: 'One bond, bought lawfully. The receipt is still pinned over Tamsin’s bunk. Under it she wrote: eight left. Every year she crosses out a number. She is down to three.',
      },
      {
        when: { flags: ['tamsin-raid-forbidden'] },
        mood: 'sad',
        text: 'Tamsin wears the old sash again, with one new knot at the end. She has never said what it is for. The Conclave’s crows land on her sill and look at it.',
      },
      {
        when: { flags: ['tamsin-knots-kept'] },
        text: 'Tamsin never cut the knots. She sleeps on top of the wardrobe with the knife under her pillow. The crown said not yet. She is still waiting for yet.',
      },
      {
        text: 'Tamsin Gutterwing runs for the crown on wages, under her own name. She checks the name every time.',
      },
    ],
  },
  {
    id: 'teodor',
    name: 'Brother Teodor Lull',
    follower: 'F012',
    variants: [
      {
        when: { departed: ['F012'] },
        mood: 'sad',
        text: 'Brother Teodor went back to the soup kitchens under someone else’s banner. Every week he writes the emperor a letter. He tells himself it is harmless. He never sends it.',
      },
      {
        when: { dead: ['F012'] },
        mood: 'sad',
        text: 'Brother Teodor Lull is buried by the Yard ovens. His apron hangs on the kitchen door. On feast days somebody tells the goat joke over the soup pot, and gets the punchline wrong, the way he did.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Brother Teodor makes soup for the court in hiding out of whatever there is. He knows the Abbey’s songs. He hums something else over them, loudly, all day.',
      },
      {
        when: { flags: ['teodor-false-letter'] },
        text: 'Teodor’s last letter named a road the court never used, and lanterns waited on it two nights. He makes soup for everyone. He has not written a letter since. Not even a list.',
      },
      {
        when: { flags: ['teodor-offered-leave'] },
        text: 'Teodor was free to go home to the Abbey. He kept the invitation inside his robe, over his heart, and did not go. Every morning the emperor checks his blanket first. It is always there.',
      },
      {
        when: { anyFlags: ['teodor-turned', 'd25-teodor-turned'] },
        text: 'When the war ended, the dictated letters stopped. On the day he used to write, Teodor bakes. Bread for forty. Nobody tells him it is too much.',
      },
      {
        when: {
          anyFlags: ['teodor-letters-ended', 'd25-teodor-letters-stopped'],
        },
        text: 'The Abbess was kind about the letters stopping, as Teodor said she would be. A letter still comes for him every week, under grey wax. He hands each one to the crown unopened. There is a box of them now.',
      },
      {
        text: 'Brother Teodor Lull runs a soup kitchen and tells the goat joke, and gets the punchline right about half the time. Every night he counts the beds. They add up.',
      },
    ],
  },
  {
    id: 'mags',
    name: 'Mags Ironhide',
    follower: 'F013',
    variants: [
      {
        when: { departed: ['F013'] },
        mood: 'sad',
        text: 'Mags Ironhide stands at a gate that is not the crown’s. She reads poorly. She sings badly. She has stepped aside exactly once.',
      },
      {
        when: { dead: ['F013'] },
        mood: 'sad',
        text: 'Mags Ironhide is buried at the east gate, standing up, as she asked. The Watch reads her name at roll call every night, after Hob’s. Nobody has stepped aside for it.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Mags Ironhide stands in the cave mouth every night. Whatever comes up the road will have to move her. Nothing has.',
      },
      {
        when: { flags: ['mags-read-lie'] },
        text: 'Mags never mentioned the made-up rota. She stood outside the emperor’s door that night, and every night after. She still does. She will stop when she is moved.',
      },
      {
        when: { flags: ['mags-hob-pensioned'] },
        text: 'Every autumn Hob’s mother sends a jar of plum jam to the barracks. Mags puts it on the table. Nobody opens it. There are nine jars now.',
      },
      {
        when: { flags: ['mags-hob-deserter'] },
        mood: 'sad',
        text: 'The book still says deserter. Hob’s helmet hangs on Mags’s hook, under hers. Twice a year she carries part of her wages to his mother on foot, two days each way, and comes back and stands her shift without a word.',
      },
      {
        when: { flags: ['mags-hob-named'] },
        text: 'Hob’s name is read at roll call every night. Mags says it with the rest. Never louder.',
      },
      {
        text: 'Mags Ironhide reads poorly, sings badly and has never once stepped aside. She stands at the emperor’s door now. Most nights she sings.',
      },
    ],
  },
  {
    id: 'pell',
    name: 'Pell Quickmarrow',
    follower: 'F014',
    variants: [
      {
        when: { departed: ['F014'] },
        mood: 'sad',
        text: 'Pell Quickmarrow sold the crown’s strongbox in the rail yards for less than it was worth. He kept the lock. It hums.',
      },
      {
        when: { dead: ['F014'] },
        mood: 'sad',
        text: 'Pell Quickmarrow was buried in his coat, all forty pockets buttoned. The Archive offered to buy the coat first. The barracks would not sell.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'The rod in Pell’s fortieth pocket stopped humming the night the door opened. Pell thinks that is worse. He keeps it anyway.',
      },
      {
        when: { flags: ['pell-hummer-kept'] },
        text: 'Pell keeps the rod that hums in the fortieth pocket. It hums louder at night, and louder when the wind is from the north. He sleeps on that side of the coat. He has stopped sleeping well.',
      },
      {
        when: { flags: ['pell-hummer-archived'] },
        text: 'The rod that hums is in an iron box in the Archive’s lowest vault. It hums there too. Once a year Pell goes down and listens at the door. He writes down what he hears. Nobody tells him what it does.',
      },
      {
        when: { flags: ['pell-hummer-sold'] },
        mood: 'sad',
        text: 'Factor Tallow paid twenty for the rod that hummed and did not haggle. Pell never learned who she sold it to. That is the part he still does not like.',
      },
      {
        when: { flags: ['pell-confessed-wreck'] },
        text: 'Pell told the Saltroad agent about the people on the trestle himself. They halved the debt and kept the coat. He wears a plain one now with a single pocket. He says that is all he needs.',
      },
      {
        text: 'Pell Quickmarrow sells the relics he doesn’t understand and keeps the ones that hum. A different lens turns up on the emperor’s desk every week. The emperor has stopped asking where from.',
      },
    ],
  },
  {
    id: 'isolde',
    name: 'Isolde Brack',
    follower: 'F015',
    variants: [
      {
        when: { departed: ['F015'] },
        mood: 'sad',
        text: 'Isolde Brack went with Young Komodo, then home to the fen. The green candle she left on her bunk burned a full year. Nobody blew it out. Nobody could.',
      },
      {
        when: { dead: ['F015'] },
        mood: 'sad',
        text: 'Isolde Brack’s green lantern is still lit in the old tack room. It needs no tending. Once a month there are eleven more beside it. Nobody has seen who brings them.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Isolde Brack sets green lanterns around the court’s camp every night. Nothing has crossed them. She will not say what they cost her.',
      },
      {
        when: { endings: ['witchwater-throne'], flags: ['talk-isolde-coven'] },
        text: 'When the Mothers took their seat at the emperor’s left hand, Isolde Brack took the one behind it. She has outlasted two of the inner circle already. The fen is patient. She is more.',
      },
      {
        when: { flags: ['isolde-jars-burned'] },
        text: 'Isolde burned the jars one at a time in the Yard brazier. Her paws blistered to the wrist and the scars never went. She wears gloves now. The smoke was green. She says that was the brazier.',
      },
      {
        when: { flags: ['isolde-keeps-jars'] },
        text: 'The sack of jars is still under Isolde’s bunk. Some nights they clink when nobody has touched them. She says that is the cold. It is summer.',
      },
      {
        when: { flags: ['isolde-jars-returned'] },
        text: 'Every jar went home to its own village, wrapped in wool. Most were buried. One mother opened hers. Isolde visits her when the reeds are cut. Neither of them says what was inside.',
      },
      {
        when: { flags: ['isolde-crown-channel'] },
        text: 'Isolde carried the crown’s word to the good witches behind their leaders’ backs. The coven is still split. Now it says so out loud.',
      },
      {
        text: 'Once a month Isolde Brack lights her lanterns. Eleven. She pinches them out herself at dawn.',
      },
    ],
  },
  {
    id: 'sable',
    name: 'Sable Thorne',
    follower: 'F016',
    variants: [
      {
        when: { departed: ['F016'] },
        mood: 'sad',
        text: 'Sable Thorne went out bare-handed and has not been seen since. Not by the court. Not by the Verge. That was the point.',
      },
      {
        when: { dead: ['F016'] },
        mood: 'sad',
        text: 'Sable Thorne is buried in their gloves. The Verge sent a wreath of white lilies, very correct. The emperor burned it. The Envoy wrote to say they understood.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Sable Thorne’s fever comes every night now. They sit it out at the edge of camp, gloved, upright, back to the road. They say what they hear is only the fever.',
      },
      {
        when: { flags: ['romance-sable-sealed', 'sable-not-traded'] },
        mood: 'happy',
        text: 'The Verge never came for Sable again. Every year on the anniversary they dance the eleven steps in the hall, in daylight, doors open. The emperor misses the seventh.',
      },
      {
        when: { flags: ['romance-sable-sealed'] },
        mood: 'happy',
        text: 'Sable chose the emperor themself. Most evenings their gloves lie on the sill. The fever still comes some nights. Somebody sits on the inside of the door.',
      },
      {
        when: { flags: ['d45-sable-released'] },
        text: 'The Verge renounced every claim on Sable Thorne in writing, on the Archive’s paper. Sable keeps the page folded inside a glove. They have not read it since. They know where it is.',
      },
      {
        when: { flags: ['sable-promise-pending'] },
        text: 'The promise to hand Sable back still stands, in theory, until the crown finds a way out of it. Sable lives in that until. Courtiers do. They wear the key round their own neck.',
      },
      {
        when: { flags: ['sable-friendship'] },
        text: 'Sable Thorne serves the crown, precise and loyal. They never dance the eleven steps where the emperor can see. The emperor remembers every step.',
      },
      {
        text: 'Sable Thorne is still running, with impeccable manners. They have stopped looking over their shoulder at plum coats. Mostly.',
      },
    ],
  },
  {
    id: 'cobb',
    name: 'Cobb Harrow',
    follower: 'F017',
    variants: [
      {
        when: { departed: ['F017'] },
        mood: 'sad',
        text: 'Cobb Harrow built a barn for Young Komodo’s friends. Then another. He still has not said what happened at Thistledown. Not to the crown.',
      },
      {
        when: { dead: ['F017'] },
        mood: 'sad',
        text: 'Cobb Harrow is buried in Thistledown, beside the barn he built three times. It is still standing. It is the fourth one now. Somebody else built it.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Cobb Harrow builds the court a shelter wherever it stops. He has built eleven. He leaves each one standing when they move on, in case somebody needs it.',
      },
      {
        when: { flags: ['cobb-saffron-roof'] },
        mood: 'happy',
        text: 'Cobb’s barn has a roof, and a lightning bolt on the weathervane. Cobb says he hasn’t noticed it. Saffron says she didn’t put it there. When it squeaks, one of them oils it.',
      },
      {
        when: { flags: ['cobb-told-badge'] },
        mood: 'angry',
        text: 'Cobb never sat at the barracks table again. Neither did Saffron, once she heard who told. They eat at opposite ends of the Yard. Neither of them blames the other.',
      },
      {
        when: { flags: ['cobb-heard-it'] },
        text: 'The crown said it to his face: Thistledown paid. Cobb said now he could work. He has. He has never asked for anything. The burned hat is still on his head.',
      },
      {
        when: { flags: ['cobb-working-debt'] },
        text: 'Cobb’s tally on the workshop doorframe ran out of room and went round the corner. Nobody knows what number he is counting to. He is still counting.',
      },
      {
        text: 'Cobb Harrow rebuilds what burns. Some nights he leaves half his supper on the gate post, for nobody in particular.',
      },
    ],
  },
  {
    id: 'vesper',
    name: 'Vesper Fanfare',
    follower: 'F018',
    variants: [
      {
        when: { departed: ['F018'] },
        mood: 'sad',
        text: 'Vesper Fanfare works the fairs on the far side of the wasteland. When someone asks about the emperor, she drops a ball on purpose. The crowd laughs. She does not.',
      },
      {
        when: { dead: ['F018'] },
        mood: 'sad',
        text: 'Vesper Fanfare’s three clubs hang crossed over the Yard gate. On fair days the children she taught take them down, light them and throw them up as high as they go. They catch them. One, two, three.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'After dark Vesper Fanfare juggles fire at the edge of camp so the children have something to watch. Three clubs. One, two, three. Nobody has burned.',
      },
      {
        when: { flags: ['vesper-danced-openly'] },
        mood: 'excited',
        text: 'Vesper dances with the emperor in front of everyone at every feast. The emperor is bad at it. Fifty people dance along on broken crates. Lady Vask writes a letter. Nobody reads it.',
      },
      {
        when: { flags: ['vesper-danced-dark'] },
        mood: 'happy',
        text: 'Vesper dances alone at the fire for the crowd. Then again behind the kitchen in the dark, with the emperor, for nobody. She said she would learn the other thing. She is getting good at it.',
      },
      {
        when: { flags: ['vesper-ballad-sung'] },
        text: 'Vesper’s ballad went round the whole Saltroad. It rhymes crown with come down. The emperor has heard it sung in nine villages and has never once been recognised.',
      },
      {
        when: { flags: ['vesper-fire-school'] },
        text: 'Twenty children learned fire in the Yard corner and nobody burned. Some of them work the fairs now. Rule one, they tell their own students. You don’t lean in.',
      },
      {
        text: 'Vesper Fanfare works the caravan fairs, juggling fire and passing the hat. When she plays the tower, she leaves the hat at the gate.',
      },
    ],
  },
  {
    id: 'hollin',
    name: 'Hollin Moss',
    follower: 'F019',
    variants: [
      {
        when: { departed: ['F019'] },
        mood: 'sad',
        text: 'Hollin Moss drew the tower as it stood the night he left, one door circled. The map hangs where the court will never see it. He remembers roads that no longer exist. Now one more.',
      },
      {
        when: { dead: ['F019'] },
        mood: 'sad',
        text: 'Hollin Moss left the Archive four hundred maps. The last one is blank in the north. Owls never burn anything, he used to say. The Archive has burned nothing since.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Hollin Moss maps the roads that still exist. The map is smaller every month. He draws it anyway, in brick-red.',
      },
      {
        when: { flags: ['hollin-absolved'] },
        text: 'Hollin drew the tower as it was: the roof, the bell, the emperor’s window. The map hangs in the emperor’s chamber. Beside the door, a tiny figure carrying a map.',
      },
      {
        when: { flags: ['hollin-draws-is'] },
        text: 'Hollin drew the tower as the enemy held it, and circled the north drain twice. He circles it on every map of the tower he makes. He has not been asked to stop.',
      },
      {
        when: { flags: ['hollin-road-sealed'] },
        text: 'The red road to a door with a bell on it is on the crown’s map, under seal. Every night on his way to bed, Hollin checks the map chest is locked.',
      },
      {
        when: { flags: ['hollin-road-forgotten'] },
        text: 'Hollin left the north blank on the crown’s map. He did not burn his notes. Owls never burn anything. Some nights he does not sleep.',
      },
      {
        text: 'Hollin Moss flies slowly, reads everything and remembers roads that no longer exist. Since the war there are two more on the list.',
      },
    ],
  },
  {
    id: 'juniper',
    name: 'Juniper Slate',
    follower: 'F020',
    variants: [
      {
        when: { departed: ['F020'] },
        mood: 'sad',
        text: 'Juniper Slate runs a kitchen behind someone else’s walls. They still know everyone’s business by their stomach. They have never once said the emperor’s name.',
      },
      {
        when: { dead: ['F020'] },
        mood: 'sad',
        text: 'Juniper Slate’s ladle hangs over the Yard pot. The new cook brought her own. The broth is not as good. Everyone says so, kindly, every day.',
      },
      {
        when: { endings: ['long-night'] },
        text: 'Juniper Slate feeds the court in hiding from one pot. The broth is thin. Nobody complains. Juniper decides who gets the bottom of the pot. It is never Juniper.',
      },
      {
        when: { flags: ['juniper-notes-by-hand'] },
        text: 'Every morning Juniper hands the emperor a note, folded once, and stands there until it is read. No bowl. They have not set a bowl down for anyone since.',
      },
      {
        when: { flags: ['juniper-names-given'] },
        mood: 'sad',
        text: 'Juniper gave the crown three names from the Yard. The broth was thin that night. It has been good every night since. Juniper has not given a name again.',
      },
      {
        when: { flags: ['juniper-emperor-ate'] },
        mood: 'happy',
        text: 'Once a month the emperor eats with the Yard on a bench between a porter and a washerwoman, and answers what they ask. Juniper serves seconds without asking. The back gate stays shut.',
      },
      {
        when: { flags: ['juniper-nim-spared'] },
        text: 'Twice a week a half-sack of flour goes out the kitchen back door, so it isn’t stealing. Nim’s sister has a bakery of her own now. Juniper buys from it.',
      },
      {
        text: 'Juniper Slate knows everyone’s business through their stomach. The Yard eats. The gossip is good. Juniper decides what goes up to the throne.',
      },
    ],
  },
]

// --- the end of the war -----------------------------------------------------

const ENDGAME: EpilogueSubject[] = afterTheWar([
  {
    id: 'charter',
    name: 'The peace signed at the last fire',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['d49-crown-laid-down'] },
        text: 'The charter from the last fire went into the hills in Granny Umber’s vest, every name on it in the same ink, the emperor’s at the bottom. It is the only law the scattered court still keeps.',
      },
      {
        when: {
          endings: ['long-night'],
          anyFlags: [
            'peace-roads',
            'peace-iron',
            'peace-crows',
            'peace-witchwater',
            'peace-tunnels',
            'peace-bell',
          ],
        },
        mood: 'sad',
        text: 'Whatever was signed at the last fire went into the hills in somebody’s coat. It has not been read aloud since. It has not been thrown away.',
      },
      {
        when: { endings: ['hundred-candles'], flags: ['d49-crown-laid-down'] },
        mood: 'sad',
        text: 'The charter from the last fire has the emperor’s name at the bottom, with everyone else’s. Under it, in another hand, are the names the war took. The second list is longer.',
      },
      {
        when: { endings: ['hundred-candles'], flags: ['peace-iron'] },
        mood: 'sad',
        text: 'The last fire chose an iron peace. The Watch keeps it on every road with fewer hands than it had. Dunmark writes the posting rolls himself and leaves the dead in, struck through.',
      },
      {
        when: { endings: ['hundred-candles'], flags: ['peace-tunnels'] },
        mood: 'sad',
        text: 'The last fire chose the assemblies. Granny Umber’s charter hangs in the first hall under the list of names, and the candle wax has run onto it. The assemblies meet anyway. They open with the names now, not the charter.',
      },
      {
        when: { endings: ['hundred-candles'], flags: ['peace-crows'] },
        mood: 'sad',
        text: 'The last fire chose the Crows’ rain. It comes on time. The first spring, the court paid Corvane’s price the same morning it buried its last. Corvane took the brass without counting it.',
      },
      {
        when: { endings: ['hundred-candles'], flags: ['peace-witchwater'] },
        mood: 'sad',
        text: 'The last fire gave the Mothers a seat beside the crown. Sister Reedlight sits in it, between an empty chair for each name. She asked for the chairs herself.',
      },
      {
        when: {
          endings: ['hundred-candles'],
          flags: ['peace-bell', 'bell-rung'],
        },
        mood: 'sad',
        text: 'The last fire chose the Bell. Hollow Bell rings it every evening, once for the kingdom and once for each name. The ringing takes longer than it used to.',
      },
      {
        when: { endings: ['hundred-candles'], flags: ['peace-roads'] },
        mood: 'sad',
        text: 'The last fire chose open roads. The roads are open. The charter from that night is pinned under the list of names in the tower hall, and the wax has run onto it. It has not been scraped off.',
      },
      {
        when: { endings: ['hundred-candles'] },
        mood: 'sad',
        text: 'Something was signed at the last fire. The court remembers the names better than the clauses.',
      },
      {
        when: { flags: ['d49-crown-laid-down'] },
        text: 'The charter from the last fire hangs in the tower hall. The emperor’s name is at the bottom with everyone else’s, in the same ink. Visitors look for it. It takes a while.',
      },
    ],
  },
  {
    id: 'hideout',
    name: 'Where the court hid',
    variants: [
      {
        when: {
          endings: ['long-night'],
          flags: ['hideout:mole-tunnels', 'd42-faced-the-thirty'],
        },
        text: 'The thirty who would have sold the crown hold the burrow mouth now. They do not let the singing in. They do not let anyone out.',
      },
      {
        when: { endings: ['long-night'], flags: ['hideout:moving-caravan'] },
        mood: 'sad',
        text: 'The caravan never stopped. It carries the court still, an hour in each place: salt, blankets, a crown in the fifth wagon. Oriel counts it out loud at every halt. The count goes down.',
      },
      {
        when: {
          endings: ['long-night'],
          flags: ['hideout:nameless-cave', 'd42-deserter-pardoned'],
        },
        text: 'The deserter stands the cave mouth every night with a spear and his helmet on. He ran once. He says the singing will have to come in past him. It has not tried.',
      },
      {
        when: { endings: ['long-night'], flags: ['hideout:bell-cellars'] },
        mood: 'sad',
        text: 'The court never left Hollow Bell’s cellars. The cider is long gone. The town lowers bread down the stair in a basket and does not come down after it.',
      },
      {
        when: { endings: ['long-night'] },
        mood: 'sad',
        text: 'The court never came out of hiding. It moves every few weeks, by night, to wherever is still dry and quiet. Somewhere it is still alive. Most nights that is enough.',
      },
      {
        when: { flags: ['hideout:mole-tunnels', 'd42-faced-the-thirty'] },
        text: 'The court hid in the Mole tunnels among thirty who would have sold it. Two of the thirty walked the emperor back to bed that first night. They walk the emperor to the burrow mouth whenever the crown visits. Escort or guard. Nobody has decided.',
      },
      {
        when: { flags: ['hideout:mole-tunnels'] },
        text: 'The court hid in the Mole tunnels with a shovel each. The third prop still sulks. There is a crown scratched into it at shoulder height, where the emperor leaned at night. The Moles have left it.',
      },
      {
        when: { flags: ['hideout:crow-cave', 'd42-abbey-messenger-taken'] },
        text: 'The court hid at the draughty end of the Crows’ cave. The sister from the Abbey told the guards their mothers’ names before she was taken. Two of those guards still will not sleep in a room with a window.',
      },
      {
        when: { flags: ['hideout:crow-cave'] },
        text: 'The court hid in the Storm Crows’ cave and stood the watch with them. The stone basin where the Crows keep brass still holds one coin with the crown’s face on it. The Crows will not spend it. Neither will the crown.',
      },
      {
        when: { flags: ['hideout:bell-cellars', 'd42-bell-council-told'] },
        text: 'The court hid in Hollow Bell’s cellars, and the council voted eleven to four to keep it. Mara has never said which way she voted. Neither have the four. The town knows.',
      },
      {
        when: { flags: ['hideout:bell-cellars'] },
        text: 'The court hid in the cellars under Hollow Bell. The emperor slept in the vestry corner under the bell rope. There is a knot in the rope at the height of a sleeping head. Nobody unties it.',
      },
      {
        when: { flags: ['hideout:wagon-circle', 'd42-dared-the-pack'] },
        text: 'The court hid in the Pack’s wagon circle and dared it to sell. Nobody sold anybody. Both sides slept in shifts until the end of the war. The Pack still does, out of habit.',
      },
      {
        when: { flags: ['hideout:wagon-circle'] },
        mood: 'happy',
        text: 'The court hid in the Pack’s wagon circle with grease to the elbows. The Pack made up a song about a crown with grease on its hands. It has eleven verses. Nine are rude. The emperor knows all eleven.',
      },
      {
        when: { flags: ['hideout:moving-caravan'] },
        text: 'The court hid in a caravan that always left in twenty minutes, and never slept two nights in one place. Oriel keeps the crown’s bunk empty in the fifth wagon. She charges it rent.',
      },
      {
        when: { flags: ['hideout:freehold-barn', 'd42-decoy-barn'] },
        text: 'The court hid in a Freehold barn while the Watch burned an empty one on the far ridge to draw the riders. Hester told the emperor whose barn it was. By name. Twice. The crown paid for a new one. Hester still says the name.',
      },
      {
        when: { flags: ['hideout:freehold-barn'] },
        text: 'The court hid in a Freehold barn and brought in the field before dawn. The scythe Hester handed the emperor hangs on the barn wall. She calls it the sceptre. Nobody else may sharpen it.',
      },
      {
        when: { flags: ['hideout:rail-station'] },
        text: 'The court hid in a dead rail station among the Rustline’s shiny bolts. The emperor’s wrench is still on the wall there, painted gold. Jinx charges visitors a copper to hold it.',
      },
      {
        // t-043: he carried what he saw at the gate home, under oath.
        when: { flags: ['hideout:nameless-cave', 'd42-deserter-witness'] },
        text: 'The deserter from the cave said it under oath in the tower hall. The gate first, then the running, in that order. The Watch heard him to the end. Nobody struck him. Nobody sat with him at supper either. He eats by the gate. He says the view is good.',
      },
      {
        // t-043: the court walked out on its host with the debt unpaid.
        when: { flags: ['d46-host-left'] },
        text: 'The court walked out on its host on the forty-sixth night with twenty brass owing, and finished the war in a cave with no name. The crown paid the debt the first spring, with interest. The receipt came back torn in half.',
      },
      {
        when: { flags: ['hideout:nameless-cave', 'd42-deserter-pardoned'] },
        text: 'The court hid in a terrible cave with a deserter, a widow and four Moles who argued all night. The deserter was pardoned out loud. He carries firewood up to the tower. More than anyone needs. The woodpile is taller than the gate.',
      },
      {
        when: { flags: ['hideout:nameless-cave', 'd42-deserter-sent-away'] },
        text: 'The court hid in a cave with no name and sent the deserter out of it into the dark. The good blanket went with one of the Moles. Neither came back. The cave kept the horse on the ceiling.',
      },
      {
        when: { flags: ['hideout:nameless-cave'] },
        text: 'The court hid in a cave with no name. It still has none. Somebody carved a crown over the entrance, badly, with a spoon. Travellers on that road leave bread under it.',
      },
    ],
  },
  {
    id: 'silent-bell',
    name: 'The Silent Bell',
    variants: [
      {
        when: { endings: ['long-night'] },
        text: 'Hollow Bell barred its doors and rang the chapel bell every hour, all night, so the singing would have something to argue with. It is still ringing. Nobody in town will say who holds the rope.',
      },
      {
        when: { flags: ['bell-rung', 'd48-no-bell-ringer'] },
        text: 'The Silent Bell rang once on the last night. Nobody from Hollow Bell climbed the tower to ring it. The town knows whose people did. On the first night of spring the whole town stands in the square facing the Abbey road. Then it goes home.',
      },
      {
        when: { flags: ['bell-rung'] },
        mood: 'happy',
        text: 'The Silent Bell rang once. In Hollow Bell they took the sock off every hand-bell in town and hung them on the chapel door. They are still there. Nobody rings them. Nobody takes them down.',
      },
    ],
  },
  {
    id: 'komodo',
    name: 'Young Komodo',
    npc: 'young-komodo',
    variants: [
      {
        when: { endings: ['long-night'], flags: ['komodo-bargain-known'] },
        mood: 'sad',
        text: 'Young Komodo was last seen on the Abbey stair with no coat, losing an argument with the sisters. The singing came down the roads the next morning. Somewhere his ledger is still open at the page that says, underlined twice: cheaper than war.',
      },
      {
        when: { endings: ['long-night'] },
        mood: 'sad',
        text: 'Young Komodo was last seen on the Abbey stair with no coat, arguing with the sisters. They were smiling at him. He was losing. The door under the Abbey opened the next morning. Nobody has seen him since.',
      },
      {
        when: {
          flags: ['d50-komodo-message', 'd49-record-answers-komodo'],
        },
        text: 'The party found him on the Abbey stair and read him the message off their sleeves: it was not cheaper. Young Komodo did not argue. In the record, under his entry, in the same ink, is the emperor’s answer. He asked once to read it. Vellum said no.',
      },
      {
        when: { flags: ['d50-komodo-message'] },
        text: 'The party found him on the Abbey stair and read him the message off their sleeves: it was not cheaper. Young Komodo read it three times. He handed over the emperor’s seal, which he had carried the whole time, and went down the other stair. The seal has a scratch where his claw used to tap it.',
      },
      {
        when: { flags: ['d50-komodo-to-answer', 'd40-komodo-offered-mercy'] },
        text: 'Young Komodo was brought back alive. Before the court could ask him anything, he asked for the emperor. “From me,” he said, “as you wanted.” Then he told it all, in order, with the prices. At dawn they let him sit down.',
      },
      {
        when: { flags: ['d50-komodo-to-answer'] },
        text: 'Young Komodo was brought back alive and answered for the tower in front of everyone he sold, in the same precise voice he used for the price of grain. It took all night. Nobody shouted. At dawn they let him sit down. That is all anyone has decided.',
      },
      {
        when: { flags: ['d50-komodo-spared', 'd40-komodo-called-friend'] },
        mood: 'sad',
        text: 'The party let him fight. At dawn Young Komodo came down the Abbey stair alive and saw the emperor at the gate. He stopped. He bowed the way he bowed for forty days. Then he walked up the Saltroad and did not look back. In forty days he always had.',
      },
      {
        when: { flags: ['d50-komodo-spared'] },
        text: 'The party let him fight. Young Komodo came down the Abbey stair at dawn with the Abbess’s lantern in his claw, unlit. He set it on the ground in front of the court and walked up the Saltroad without his coat. Every harvest a ledger arrives at the tower with the price of grain in every village, correct to the copper.',
      },
      {
        when: { flags: ['d50-komodo-left'] },
        mood: 'angry',
        text: 'The crown left Young Komodo to the Abbess, as he had chosen. The party passed him on the stair and did not stop. In Vellum’s great book there is a page with his name at the top. Nothing under it. Nobody turns it.',
      },
      {
        text: 'Young Komodo kept careful accounts of everything for forty days, including the emperor. Nobody knows where he is. Some mornings a report is wrong in a careful way, and the court looks at the door.',
      },
    ],
  },
])

// Hidden followers earn named consequences rather than generic victory blurbs.
const SECRET_BARRACKS: readonly EpilogueSubject[] = [
  {
    id: 'f021',
    name: 'Nettle Purl',
    follower: 'F021',
    variants: [
      {
        when: { departed: ['F021'] },
        mood: 'sad',
        text: 'Nettle left her red thread tied to the gate. Every spring a bundle of herbs turns up on the sill, and nobody has seen who brings it.',
      },
      {
        when: { dead: ['F021'] },
        mood: 'sad',
        text: "Nettle's red threads are still knotted around the infirmary bedposts. The new healer can read the knots but not the handwriting on the medicine jars.",
      },
      {
        when: { flags: ['nettle-crossed-border'] },
        text: "Nettle's carts carried medicine through the old gate even after the tower fell. The soldiers let her pass when they saw the red thread. Nobody knows who gave that order.",
      },
      {
        when: { flags: ['nettle-saved-hideout'] },
        text: 'The exiles keep their wounded alive through winter. Nettle checks every pulse twice. She no longer lets anyone call the empty beds a victory.',
      },
      {
        when: { flags: ['nettle-four-names'] },
        text: 'Four names reappear in the Yard census, and then twenty. Nettle makes every registrar read them aloud before anyone collects the food.',
      },
      {
        text: 'Nettle opens an infirmary for the people nobody counts in the census. The patients bring their own blankets. She asks their names, every one.',
      },
    ],
  },
  {
    id: 'f022',
    name: 'Tiller Brassfin',
    follower: 'F022',
    variants: [
      {
        when: { departed: ['F022'] },
        mood: 'sad',
        text: "Tiller's signal station stands empty. A whistle comes out of the pipes on some nights. Nobody answers it.",
      },
      {
        when: { dead: ['F022'] },
        mood: 'sad',
        text: "A railway spike marks Tiller's grave. When the wind crosses the dead line, the pipes in the signal tower answer with three knocks.",
      },
      {
        when: { flags: ['tiller-wire-answered'] },
        text: 'The wire from the ridge to the tower district stays strung. Tiller reads its taps like a letter and answers every one. The Archive keeps the chalk wall as a map.',
      },
      {
        when: { flags: ['tiller-wire-cut'] },
        text: 'Tiller keeps the cut wire coiled and oiled. When the road opens he lays it between two towns that never had a line, and for a year it carries only greetings.',
      },
      {
        when: { flags: ['tiller-river-saved'] },
        text: 'The river settlement stands. One passenger is missing from the ruined train, and the bell at the crossing rings once a month. Tiller keeps a spool of wire in the Archive with the name burned into it.',
      },
      {
        when: { flags: ['tiller-wagon-rescued'] },
        text: 'The passengers of the tunnel train build a plaque for the crew. Tiller never mentions the flooded houses on the river, but he sends copper to repair their roofs each spring.',
      },
      {
        text: 'Tiller repairs an old semaphore that has not moved in a century. When the first signal swings across the desert, three caravans find their way home.',
      },
    ],
  },
  {
    id: 'f023',
    name: 'Sera Vell',
    follower: 'F023',
    variants: [
      {
        when: { departed: ['F023'] },
        mood: 'sad',
        text: 'Sera takes her bronze clapper into the hills. Its sound is heard for one winter, then never again.',
      },
      {
        when: { dead: ['F023'] },
        mood: 'sad',
        text: 'They buried Sera beside the silent chapel. Someone put the bronze clapper in her hands. The bell on the tower tolled without it.',
      },
      {
        when: { flags: ['sera-buried-bell'] },
        text: 'Sera opens the buried chapel. Names are carved inside the bell where no chisel could reach. Each year the living read those names in daylight, and the families above are given new homes.',
      },
      {
        when: { flags: ['sera-twelve-strokes'] },
        text: 'The square in Hollow Bell remains a place to sleep. Sera rings twelve strokes for the living and writes the thirteenth on paper. There is a thick book of these strokes now.',
      },
      {
        when: { flags: ['sera-bell-muffled'] },
        text: 'Sera keeps the hand bell wrapped in wool for years. She rings it unmuffled only once, on the day the road opens, and the whole valley hears the hour.',
      },
      {
        when: { flags: ['sera-bell-rung-on'] },
        text: 'Lamps still appear in the shuttered windows under the tower at the hour Sera rings. Nobody says who lights them. The bell has stopped needing an answer.',
      },
      {
        when: { flags: ['sera-names-public'] },
        text: "Sera's register hangs in the market. Descendants who bought silence have to pass the names every morning. Some add fresh flowers. Some walk another road.",
      },
      {
        text: 'Sera writes a second register for Hollow Bell. The forgotten names fill three books. At last the old bell tolls for every one.',
      },
    ],
  },
  {
    id: 'f024',
    name: 'Tarn Daggerstep',
    follower: 'F024',
    variants: [
      {
        when: { departed: ['F024'] },
        mood: 'sad',
        text: 'Tarn crossed the south road alone. Raiders report finding a map with all the tolls erased, and no rider.',
      },
      {
        when: { dead: ['F024'] },
        mood: 'sad',
        text: "Tarn's map ends at the place they died. The Gate Watch draws a line through it and writes a warning to those who follow.",
      },
      {
        when: { flags: ['tarn-oil-funded'] },
        text: 'The lamps at the pass burn every night, and the crossing is never blind. Tarn draws a small flame beside each guard post and teaches the children what it means.',
      },
      {
        when: { flags: ['tarn-toll-written'] },
        text: 'The Archive keeps a ledger of the pass tolls, kept in plain ink. Tarn reads it each season, and every year the page gets shorter.',
      },
      {
        when: { flags: ['tarn-families-sheltered'] },
        text: 'Tarn draws safe roads on the schoolroom floor so the children can learn them as a game. When they grow old enough to leave the hideout, each carries three stones in a pocket.',
      },
      {
        when: { flags: ['tarn-medicine-delivered'] },
        text: "The watch's wounded recover and return to the road. Tarn marks the abandoned family cart on every route map for years. Nobody can agree what the mark should mean.",
      },
      {
        text: 'Tarn marks the safe roads with three stones at every fork. Refugees learn the pattern before the soldiers do.',
      },
    ],
  },
  {
    id: 'f025',
    name: 'Odo Rainglass',
    follower: 'F025',
    variants: [
      {
        when: { departed: ['F025'] },
        mood: 'sad',
        text: "Odo leaves before the storm. A week later the rain arrives and a blue piece of glass appears on the emperor's windowsill.",
      },
      {
        when: { dead: ['F025'] },
        mood: 'sad',
        text: "Odo's glass gauge is empty at the graveside, although rain falls all day. It has never read the weather correctly since.",
      },
      {
        when: { flags: ['odo-broke-forecast'] },
        text: 'Odo sets the broken rain gauge beside the first good harvest. The shards no longer show tomorrow. Three merchants come to the feast, and one empty chair stays set.',
      },
      {
        when: { flags: ['odo-kept-forecast'] },
        text: "The court's stores are full of salt, bought at the exact price Odo predicted. Once a year three market stalls stand empty. Odo writes their owners' names inside the glass.",
      },
      {
        when: { flags: ['odo-planted-early'] },
        text: 'The first early planting survives, a green stripe beyond the hideout wall. Odo marks the day twice on the calendar: once for the crops and once for the storm.',
      },
      {
        text: 'Odo plants the glass gauge on the highest point of the hideout. Every storm is measured, including the ones that have yet to come.',
      },
    ],
  },
]

export const EPILOGUE: readonly EpilogueSubject[] = [
  ...KINGDOM,
  ...afterTheWar([...ACT_THREE_AFTERWARDS]),
  ...BARRACKS,
  ...SECRET_BARRACKS,
  ...ENDGAME,
]

/** The epilogue for a finished run, in authored order. */
export const epilogueFor = (
  run: FortressRun,
  ending: EndingId,
): EpilogueEntry[] =>
  EPILOGUE.flatMap((subject) => {
    if (subject.follower && !joined(run, subject.follower)) return []
    const variant = subject.variants.find((entry) =>
      conditionHolds(run, ending, entry.when),
    )
    return variant ? [{ subject, variant }] : []
  })
