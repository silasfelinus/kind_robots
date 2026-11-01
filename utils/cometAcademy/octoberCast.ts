import type { PatrolStory, StoryOutcome } from './patrolStories'

// The Oct 29 larger-than-life cast (conductor
// projects/comet-city-academy/content/DAILY-CHARACTER-PITCHES-2026-10-29.json):
// four supporting NPCs and four henchman leaders, each with a SPECIES of their
// own. Names, roles, looks and lore are preserved from the pitch; voices,
// first encounters and consequences are authored here. Every adult in this
// file is an adult. Art prompts live in data only; nothing here queues art.

export type CastSpecies = {
  taxonomy: 'SPECIES'
  title: string
  slug: string
  description: string
}
export type OctoberCastMember = {
  /** Stable dedupe key from the source pitch. */
  key: string
  provenance: 'comet-city-academy'
  name: string
  /** The person under the name, for NPCs; henchman leaders have none. */
  realName: string | null
  kind: 'npc' | 'henchman_leader'
  species: CastSpecies | null
  role: string
  /** How they talk: the rule every line below follows. */
  voice: string
  lines: readonly [string, string]
  hook: string
  visual: string
  mechanic: string
  secret: string
  /** The patrol story where the player first meets them. */
  storyId: string
  /** Art keys the runtime asks promArt() for once renders ship. */
  artKeys: { portrait: string; splash: string; encounter: string }
  prompts: { portrait: string; splash: string; encounter: string }
}

const STYLE =
  'original saturated superhero comic illustration, inked silhouettes, colored night light, adults only, no words'
const art = (slug: string) => ({
  portrait: `cast/${slug}/portrait`,
  splash: `cast/${slug}/splash`,
  encounter: `cast/${slug}/encounter`,
})

export const OCTOBER_CAST: readonly OctoberCastMember[] = [
  {
    key: 'pod-20261029-01',
    provenance: 'comet-city-academy',
    name: 'Madame Afterparty',
    realName: 'Imani Calder',
    kind: 'npc',
    species: null,
    role: 'Unreliable ally / rival organizer',
    voice:
      'Speaks like a gossip column read aloud at a funeral: grand, wounded, always one confession away from a punchline.',
    lines: [
      'Darling, a secret is just weather that has not found its ballroom yet.',
      'I saved this city once by making the mayor ridiculous. Nobody has forgiven me for being right in public.',
    ],
    hook: 'She turns public embarrassment into literal weather: a whispered secret can spawn a ballroom-wide thunderhead. She once saved Comet City by making its mayor the laughingstock of the planet, then lost her license for it.',
    visual:
      'A colossal lilac ostrich-feather cape over scarred fireproof formalwear; floating mirrored disco moons; storm clouds shaped like flashbulbs; one mascara streak glitters silver.',
    mechanic:
      'Patrol choices bank or spend Exposure. High Exposure draws crowds and converts witnesses into backup but gives the mastermind a trail to follow.',
    secret:
      'Her legendary scandal was a staged evacuation that saved thousands, and her supposed blackmail files are rescue maps.',
    storyId: 'cast-afterparty',
    artKeys: art('madame-afterparty'),
    prompts: {
      portrait: `Full-body rooftop gala portrait of Madame Afterparty, an adult woman in a colossal lilac ostrich-feather cape over scarred fireproof formalwear, mirrored disco moons orbiting her, flashbulb-shaped storm clouds, one glittering silver mascara streak, furious lightning-lit expression, ${STYLE}.`,
      splash: `Madame Afterparty leading a rescue in the rain beneath a thunderhead shaped like flashbulbs, guests sheltering under her feather cape, ${STYLE}.`,
      encounter: `A ruined ballroom gala in Civic Heights at night, Madame Afterparty holding a microphone like a lightning rod while a crowd of witnesses turns to look, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-02',
    provenance: 'comet-city-academy',
    name: 'The Asterisk',
    realName: 'Clem Vega',
    kind: 'npc',
    species: null,
    role: 'Records keeper / legal antagonist / reluctant confidant',
    voice:
      'Talks in footnotes and amendments, then forgets to be formal when anyone mentions graduation. Uses they/them and corrects the record, never the person.',
    lines: [
      'Correction: that rescue happened. Second correction: it cost more than the form has room for.',
      'Everyone remembers both versions. That is the part they do not put in the brochure.',
    ],
    hook: 'Any properly filed correction rewrites the public record and reshuffles reality around it, but people remember both versions. Clem is trying to unmake one disastrous graduation and cannot admit which student died in the original.',
    visual:
      'Impossibly tall accordion filing cabinet worn as a backpack, iridescent correction-fluid gauntlets, a cape made of redacted diplomas, glowing pen suspended above a split eye.',
    mechanic:
      'The player can correct one mission outcome on a limited bureaucracy clock, sacrificing reputation or a remembered relationship to do it.',
    secret:
      'A scrapbook contradiction points to the mastermind as the person who filed the first false graduation record.',
    storyId: 'cast-asterisk',
    artKeys: art('the-asterisk'),
    prompts: {
      portrait: `Moral-choice portrait of The Asterisk, a nonbinary adult registrar with a towering accordion filing cabinet backpack, iridescent correction-fluid gauntlets, a cape of redacted diplomas and a glowing pen floating above a split eye, ${STYLE}.`,
      splash: `A reality-rewrite cinematic: The Asterisk files a correction and a city street folds into its alternate version, citizens remembering both, ${STYLE}.`,
      encounter: `The Asterisk's registrar fortress at night, inverted stacks of files hanging from the ceiling like stalactites, a student facing them across a counter, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-03',
    provenance: 'comet-city-academy',
    name: 'Coach Event Horizon',
    realName: 'Ren Park',
    kind: 'npc',
    species: null,
    role: 'Combat trainer / evacuation commander / adult mentor (not romanceable)',
    voice:
      'Short coaching barks with sports metaphors, then sudden quiet honesty about what winning burned down. Uses they/them.',
    lines: [
      'Again. Faster. Slower. Now do it without hurting anybody.',
      'I won the biggest race this city ever ran and set the finish line on fire. Victory is a hazardous material, kid.',
    ],
    hook: 'Every time Ren sprints, dawn begins early. Their greatest triumph incinerated the finish line and taught them to treat victory as a dangerous substance.',
    visual:
      'A broad-shouldered coach in a gold-thread track jacket, solar-flare carbon-fiber prosthesis, tinted goggles scored by tiny meteor trails, a whistle trapped inside a magnetic halo.',
    mechanic:
      'Training improves mobility and rescue odds; overclocking guarantees an escape at the price of major structural damage.',
    secret:
      "The miniature star in Ren's prosthetic leg was commissioned by one of the eight mastermind candidates as a hidden countdown.",
    storyId: 'cast-event-horizon',
    artKeys: art('coach-event-horizon'),
    prompts: {
      portrait: `Exhausted infirmary portrait of Coach Event Horizon, a broad-shouldered adult coach with a solar-flare carbon-fiber prosthetic lower leg glowing with a caged miniature sun, gold-thread track jacket, meteor-scored goggles, whistle in a magnetic halo, ${STYLE}.`,
      splash: `Stadium dawn training splash: Coach Event Horizon sprinting and the sky turning to sunrise behind them, students on the track, ${STYLE}.`,
      encounter: `A scorched evacuation tableau on the academy running track at night, Coach Event Horizon holding a firebreak of light while students lead civilians out, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-04',
    provenance: 'comet-city-academy',
    name: 'Choir of One',
    realName: 'Juno Bell',
    kind: 'npc',
    species: null,
    role: 'Night-patrol dispatcher / witness / optional recruit',
    voice:
      'Calm paramedic triage voice that slips into musical terms: callers are voices, crises are keys, the worst ones are always in a minor.',
    lines: [
      'Hold on. That one is a soprano, third floor, east stairwell. She is still singing, so she is still breathing.',
      'The loudest note is always the next one to fall. Change the song and you change who falls.',
    ],
    hook: 'Juno conducts invisible callers as a thousand-voice choir. Each harmony reveals where someone is trapped, but the loudest note belongs to the next victim unless the team changes the future.',
    visual:
      'Silver emergency-radio earrings, long cobalt rescue coat lined with glowing handwritten street names, a baton made from a bent ambulance antenna, orbiting translucent mouths.',
    mechanic:
      'Reveals one hidden mission consequence per night. Spending the signal can save an unseen civilian but makes another dispatch harder.',
    secret:
      'The ghostly calls come from a city-wide emergency simulation planted by the antagonist, with one real call hidden among them.',
    storyId: 'cast-choir',
    artKeys: art('choir-of-one'),
    prompts: {
      portrait: `Signal-storm portrait of Choir of One, an adult former paramedic in a long cobalt rescue coat lined with glowing handwritten street names, silver radio earrings, conducting with a bent ambulance antenna while translucent mouths orbit her, ${STYLE}.`,
      splash: `A rescue cinematic at Harbor Ward: Choir of One conducting a thousand invisible callers while heroes run toward the one real voice, ${STYLE}.`,
      encounter: `A crowded emergency exchange at night in the harbor, switchboards and ghostly voices, Choir of One turning to a student with hopeful and fearful expressions, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-05',
    provenance: 'comet-city-academy',
    name: 'Pledgebreaker',
    realName: null,
    kind: 'henchman_leader',
    species: {
      taxonomy: 'SPECIES',
      title: 'Thunder-Tux Stags',
      slug: 'thunder-tux-stags',
      description:
        "Semi-sentient storm stags born when formal invitations are shredded during lightning storms; each carries its inviter's last unspoken promise in its antlers.",
    },
    role: 'Ceremonial shock cavalry',
    voice:
      'Formal invitation language delivered like thunder: every sentence is an RSVP, a summons or a broken vow.',
    lines: [
      'You are cordially commanded to dance. Regrets are not accepted.',
      'Every promise you shredded, I carry. Shall I read them aloud?',
    ],
    hook: 'Pledgebreaker leads a stampede of wedding-black lightning stags across the football field, demanding a dance invitation before allowing evacuees across.',
    visual:
      'A six-legged deer the size of a bus, satin lapel pattern in its fur, chandelier antlers wrapped in blue arcs and hundreds of singed RSVP cards.',
    mechanic:
      'Electric charge scales with broken promises. Players can bargain, destroy the invitations, or ride the herd across the map.',
    secret:
      'One stag remembers a prom invitation issued to a mastermind years before the stags were born.',
    storyId: 'cast-pledgebreaker',
    artKeys: art('pledgebreaker'),
    prompts: {
      portrait: `Individual portrait of Pledgebreaker, a bus-sized six-legged storm stag with a satin lapel pattern in its fur and chandelier antlers wrapped in blue lightning and singed RSVP cards, ${STYLE}.`,
      splash: `A cinematic stampede of wedding-black Thunder-Tux Stags across the academy football field under a lightning storm, evacuees waiting at the edge, ${STYLE}.`,
      encounter: `Species silhouette sheet: three Thunder-Tux Stags in profile, chandelier antlers, satin-lapel fur, storm light, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-06',
    provenance: 'comet-city-academy',
    name: 'Miss Reflection',
    realName: null,
    kind: 'henchman_leader',
    species: {
      taxonomy: 'SPECIES',
      title: 'Glassjaw Gargoyles',
      slug: 'glassjaw-gargoyles',
      description:
        'Architectural predators grown in abandoned security cameras; they step out of reflective surfaces and build nests from stolen surveillance footage.',
    },
    role: "Spymaster's defensive swarm",
    voice:
      'Sweet as a television host, cold as a timestamp. Narrates what you are about to do in the past tense.',
    lines: [
      'Smile. You were already on camera before you decided to come here.',
      'I have the footage of the crime you commit next Tuesday. Would you like a copy?',
    ],
    hook: 'Miss Reflection is a marble-bodied gargoyle whose glass mouth displays the face of whoever fears her most. She offers the player a recording of a crime they have not yet committed.',
    visual:
      'Winged art-deco gargoyle with an enormous faceted television-glass jaw, polished mirror claws and a stolen graduation cap balanced on a horn.',
    mechanic:
      'Mirror rooms create false line-of-sight; revealing a secret disables one reflection and arms another.',
    secret:
      "Her original camera filmed the city's founding, where the first catastrophe was deliberately misreported.",
    storyId: 'cast-miss-reflection',
    artKeys: art('miss-reflection'),
    prompts: {
      portrait: `Close-up villain portrait of Miss Reflection, a winged art-deco marble gargoyle with an enormous faceted television-glass jaw showing a frightened face, mirror claws, a stolen graduation cap on one horn, ${STYLE}.`,
      splash: `A hallway of false reflections in the Civic Heights media spire at night, Glassjaw Gargoyles stepping out of the mirrors, ${STYLE}.`,
      encounter: `Shattered-glass defeat state: Miss Reflection cracked across her television jaw, recordings spilling out as light, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-07',
    provenance: 'comet-city-academy',
    name: 'Standing Ovation',
    realName: null,
    kind: 'henchman_leader',
    species: {
      taxonomy: 'SPECIES',
      title: 'Confetti Leeches',
      slug: 'confetti-leeches',
      description:
        'Balloon-lung parasites hatched from packed award-night confetti cannons; they feed on applause and inflate until the room itself becomes buoyant.',
    },
    role: 'Popularity predator / crowd boss',
    voice:
      'An award-show announcer who never stops: everything is a superlative, every silence is an insult.',
    lines: [
      'Ladies, gentlemen and everyone wonderful: let me hear it for YOU!',
      'Silence? In MY house? Somebody give that person a round of applause until they float.',
    ],
    hook: 'A stadium cheers for Standing Ovation, a skyscraper-high pink-and-gold leech that keeps a whole audience suspended beneath it like a glittering chandelier.',
    visual:
      'Translucent ribbon-organ body, golden brass mouth shaped like a megaphone, enormous swaying fringe, hundreds of stolen medals embedded in its skin.',
    mechanic:
      'The louder the praise, the stronger the creature. Players can win quietly, turn the audience against it, or weaponize applause at civilian risk.',
    secret:
      "The leech has swallowed a recording of the antagonist's first public speech.",
    storyId: 'cast-standing-ovation',
    artKeys: art('standing-ovation'),
    prompts: {
      portrait: `Stunned and enraged variants of Standing Ovation, a skyscraper-high translucent pink-and-gold leech with a brass megaphone mouth, swaying fringe and hundreds of stolen medals in its skin, ${STYLE}.`,
      splash: `High-impact waterfront stadium key art: Standing Ovation holding a cheering audience suspended beneath it like a glittering chandelier, ${STYLE}.`,
      encounter: `Species anatomical silhouette of the Confetti Leeches, balloon lungs and ribbon organs, award-night confetti, ${STYLE}.`,
    },
  },
  {
    key: 'pod-20261029-08',
    provenance: 'comet-city-academy',
    name: 'Lady Hemline',
    realName: null,
    kind: 'henchman_leader',
    species: {
      taxonomy: 'SPECIES',
      title: 'Velvet Widows',
      slug: 'velvet-widows',
      description:
        'Enormous theatrical spiders that weave wearable false memories into evening clothes. Their silk can heal trauma or erase accountability depending on the wearer.',
    },
    role: 'Memory tailor / infiltration boss',
    voice:
      'A couturier at a final fitting: soft, precise, flattering, and always taking your measurements for something you did not order.',
    lines: [
      'Hold still, dear. I am only letting out the parts of you that never fit.',
      'Everyone wants to be the person they wished they had been. Very few ask what it costs to stop being who you were.',
    ],
    hook: 'Lady Hemline crashes graduation fittings with a wardrobe of impossible dresses. Each lets a student become the person they wish they had been, until the wearer forgets who loved them before.',
    visual:
      'An eight-limbed spider in a cathedral-sized burgundy bustle, pearl-tipped legs, six dressing-room mirrors orbiting the abdomen, needle-fine blue eyes.',
    mechanic:
      'A temporary persona swap unlocks an alternate route while risking a lost bond or a scrambled mission memory.',
    secret:
      'A hidden lining contains one unaltered memory of the original city-destruction rehearsal.',
    storyId: 'cast-lady-hemline',
    artKeys: art('lady-hemline'),
    prompts: {
      portrait: `Grand dressing-room full-body splash of Lady Hemline, an enormous theatrical spider in a cathedral-sized burgundy bustle with pearl-tipped legs and six orbiting dressing-room mirrors, needle-fine blue eyes, ${STYLE}.`,
      splash: `A memory-swap effect: a graduation fitting room where adult students wear impossible dresses woven from glowing memories, Velvet Widows in the rafters, ${STYLE}.`,
      encounter: `Species silhouettes of the Velvet Widows, alternate rescued and villain-bound forms, velvet silk and pearl legs, ${STYLE}.`,
    },
  },
]

// --------------------------------------------------------------- encounters
// Certain choices: these first meetings are about who you are, not dice.

const o = (
  text: string,
  morning: string,
  influence: number,
  danger: number,
  standing: number,
  later?: StoryOutcome['later'],
): StoryOutcome => ({
  text,
  morning,
  influence,
  danger,
  standing,
  ...(later ? { later } : {}),
})

export const CAST_STORIES: readonly PatrolStory[] = [
  {
    id: 'cast-afterparty',
    zone: 'civic',
    window: { from: 9, to: 14 },
    title: 'Madame Afterparty Throws a Disaster',
    cast: 'pod-20261029-01',
    scene:
      "A gala at the Civic Heights spire is losing its roof to a storm made of flashbulbs. In the eye of it, Madame Afterparty, feather cape snapping, has the mayor's chief of staff by the lapels. \"Darling, a secret is just weather that has not found its ballroom yet.\" She offers you a deal: she will whisper the name of the mastermind's newest accomplice into the storm, and the whole city will hear it. The accomplice's children are at the gala.",
    secretHint:
      'Her old scandal was never what the papers said. Someone who has already chosen the hard, ruthless road might recognize what her files really are.',
    choices: [
      {
        id: 'afterparty-hero',
        label: 'Refuse the exposure and evacuate the gala yourself',
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            'You tell her no and start moving guests to the stairwell. The storm sulks into drizzle. Madame Afterparty watches you protect a family she was about to ruin and says, "How terribly decent of you. It will not last." The accomplice keeps their secret. So does the mastermind.',
            'The gala guests send flowers to the academy. Madame Afterparty sends a single black feather with a note: "Rain check."',
            1,
            1,
            2,
          ),
        },
      },
      {
        id: 'afterparty-villain',
        label: 'Take the deal and let her storm say the name',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            'She whispers. The thunder repeats it across every screen in Civic Heights. The accomplice is exposed in front of their children, and the mastermind loses a hand. Madame Afterparty bows to the crowd as if she had done it alone.',
            'The accomplice resigns at dawn. Their kids are not in school today, and everyone knows why.',
            2,
            -1,
            -2,
            {
              allegiance: 'villain',
              modifier: 1,
              note: "The mastermind's network is down an accomplice.",
            },
          ),
        },
      },
      {
        id: 'afterparty-rogue',
        label: 'Bank the secret: let her keep it for a price',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'You make her promise to hold the name until you ask for it. She laughs, delighted, and pins one of her disco moons to your jacket as collateral. The storm clears. Now two people in Comet City know the secret, and one of them is very bad at keeping quiet.',
            'The disco moon on your jacket hums when anyone lies nearby. It hummed twice at breakfast.',
            1,
            0,
            1,
            {
              allegiance: 'rogue',
              modifier: 1,
              note: "Madame Afterparty's banked secret buys you leverage.",
            },
          ),
        },
      },
      {
        id: 'afterparty-refuse',
        label: 'Walk away: this is her mess',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'You leave the gala to its weather. The roof holds, barely. Madame Afterparty tells the press a student hero "lacked the stomach for a party", which is fair and also not.',
            'Your name is in the society pages for the first time. It is not flattering.',
            -1,
            1,
            -1,
          ),
        },
      },
      {
        id: 'afterparty-secret',
        label: 'Ask to see her blackmail files, the real ones',
        kind: 'secret',
        outcomes: {
          secret: o(
            'She studies you for a long moment: someone else who knows that good people sometimes have to look like villains. Then she opens the files. They are not blackmail. They are evacuation maps for every district, drawn the night she humiliated the mayor so the city would look away while she moved forty thousand people out of a flood zone. "Use them," she says. "Nobody else ever did."',
            'Madame Afterparty is at the academy gate before first bell, in sunglasses, with a box of maps and no explanation for anyone.',
            3,
            -2,
            1,
            {
              allegiance: 'shared',
              modifier: 2,
              note: "Madame Afterparty's evacuation maps make shared rescues faster.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-asterisk',
    zone: 'civic',
    window: { from: 15, to: 20 },
    title: 'The Asterisk Files a Correction',
    cast: 'pod-20261029-02',
    scene:
      'Civic Heights flickers: a street is two streets at once. On the courthouse steps, The Asterisk is stamping a correction into the air with a glowing pen. "Correction: that rescue happened. Second correction: it cost more than the form has room for." Clem offers you one revision. They can rewrite a single outcome from your term, but somebody will remember the original and something you remember will go.',
    secretHint:
      "Clem keeps an old contradiction in the record. Someone who has already exposed one of the mastermind's people would know where to look.",
    choices: [
      {
        id: 'asterisk-hero',
        label: 'Refuse to rewrite anything that happened',
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            'You tell Clem the record should stay true, including the parts you hate. They look at you over the filing cabinet for a long time, then put the pen away. "Noted," they say, and it sounds almost like thanks.',
            "A clerk at the registry has stamped your file VERIFIED in green. Clem's handwriting is in the margin: Keep this one honest.",
            1,
            0,
            2,
          ),
        },
      },
      {
        id: 'asterisk-villain',
        label: 'File a correction that erases a failed night',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            'Clem stamps it. Your worst night is gone from the newspapers, the registry and the academy log. The family you failed still remembers it. They now also remember that the record says it never happened.',
            'A stranger stops you at the market and asks if you remember their brother. You do. The record does not.',
            2,
            1,
            -2,
            {
              allegiance: 'hero',
              modifier: -1,
              note: 'Families you erased do not call you first anymore.',
            },
          ),
        },
      },
      {
        id: 'asterisk-rogue',
        label: "Forge a transcript to save a sidekick's scholarship",
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'Clem bends the rules for a good reason, which is the most dangerous kind. A teammate keeps their scholarship. In exchange, the catastrophe warning for the harbor quietly disappears from the official map.',
            'Your teammate gets a letter of congratulations. The harbor flood map has a gap where a warning used to be.',
            1,
            1,
            1,
            {
              allegiance: 'rogue',
              modifier: 1,
              note: 'A forged transcript makes one more friend owe you.',
            },
          ),
        },
      },
      {
        id: 'asterisk-refuse',
        label: 'Leave the courthouse before Clem notices you',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'You slip away. Clem files the correction anyway, for someone else. A bakery on Seventh Street has always been a pharmacy now, and only you and the baker remember otherwise.',
            'The baker is on the pharmacy steps every morning, insisting the bread was real. You bring her coffee.',
            0,
            1,
            -1,
          ),
        },
      },
      {
        id: 'asterisk-secret',
        label: 'Show Clem the contradiction in your evidence',
        kind: 'secret',
        outcomes: {
          secret: o(
            "You lay your exposed accomplice beside the oldest graduation record in Clem's cabinet. The signatures match. The first false graduation record in Comet City was filed by the same hand that is planning the Prom of Doom. Clem sits down on the courthouse steps and, for the first time, says which student died in the original graduation.",
            'Clem is in the academy library at dawn, filing corrections to the yearbook with shaking hands. Every one of them restores a name.',
            3,
            -2,
            2,
            {
              allegiance: 'villain',
              modifier: 2,
              note: "The Asterisk's records show where the mastermind hides.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-event-horizon',
    zone: 'academy',
    window: { from: 12, to: 17 },
    title: 'Coach Event Horizon Runs Before Dawn',
    cast: 'pod-20261029-03',
    scene:
      'Midnight on the academy track and the sky is already turning gold. Coach Event Horizon is sprinting laps to keep the miniature sun in their prosthetic leg from overheating, and every lap drags dawn closer. A fire has started in the stadium bleachers where the night-shift cleaners sleep. "Again. Faster. Slower. Now do it without hurting anybody." Ren offers a firebreak plan: they overclock the leg and burn a clean line through the school\'s emergency runway.',
    secretHint:
      'The star in the leg is ticking. A medic who knows what a heartbeat should sound like might hear what it is counting down to.',
    choices: [
      {
        id: 'event-horizon-hero',
        label: 'Run the evacuation with Ren, no overclock',
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            'You and Ren carry the cleaners out one at a time while the bleachers burn down behind you. Nobody is hurt. The runway is intact. Ren sits on the grass afterward, leg steaming, and says, "That was the slow way. It was the right way."',
            'Coach Event Horizon has added you to the dawn training squad. Attendance is optional. Not showing up is not.',
            1,
            0,
            2,
            {
              need: 'spatial',
              modifier: 1,
              note: "Ren's dawn drills make your rescues faster.",
            },
          ),
        },
      },
      {
        id: 'event-horizon-villain',
        label: 'Tell Ren to overclock and burn the firebreak',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            'Ren hesitates, then runs. Sunrise detonates across the track. The fire is cut off instantly, and so is the school\'s emergency runway, melted into glass. Ren limps back with the leg glowing white. "You got your win," they say. "Now you carry what it cost."',
            'The academy runway is a strip of green glass. The prom evacuation plan has been rewritten, badly.',
            2,
            1,
            -1,
            {
              allegiance: 'shared',
              modifier: -1,
              note: 'Without the runway, shared evacuations are slower.',
            },
          ),
        },
      },
      {
        id: 'event-horizon-rogue',
        label: 'Make Ren rest and handle the fire your own way',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'You order a coach to sit down, which nobody has done in twenty years. Ren is so surprised that they do. You improvise: hoses, a borrowed ladder and two very awake cleaners. It is messy and it works.',
            'Ren is in the infirmary for a check-up you insisted on. They are complaining loudly, which Kit says is a good sign.',
            1,
            0,
            0,
          ),
        },
      },
      {
        id: 'event-horizon-refuse',
        label: 'Call the fire crew and stay off the track',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'The fire crew arrives in eleven minutes. The bleachers are gone and one cleaner has a burned hand. Ren does not overclock. They do not speak to you either.',
            'Coach Event Horizon runs laps alone at dawn. They do not wave.',
            -1,
            1,
            -1,
          ),
        },
      },
      {
        id: 'event-horizon-secret',
        label: 'Have your medic listen to the star in the leg',
        kind: 'secret',
        outcomes: {
          secret: o(
            'Your medic presses an ear to the prosthesis and goes pale: the star is not overheating, it is counting. Ren admits the leg was a gift from a sponsor who never gave a name. You count backward together. The countdown ends on prom night. Ren stops running and helps you evacuate the bleachers the slow, safe way.',
            'Ren has taped a schedule to the infirmary door: one lap per hour, never more, until somebody finds who built the countdown.',
            2,
            -2,
            1,
            {
              need: 'kinetic',
              modifier: 2,
              note: "You know when the mastermind's countdown ends.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-choir',
    zone: 'harbor',
    window: { from: 8, to: 14 },
    title: 'The Choir of One Takes a Call From Tomorrow',
    cast: 'pod-20261029-04',
    scene:
      'Harbor Ward is quiet except for a woman in a cobalt rescue coat, conducting nothing on the pier. Translucent mouths orbit her, singing in a thousand voices. "Hold on. That one is a soprano, third floor, east stairwell." Juno Bell can hear every emergency call nobody returned. Tonight one of them is from tomorrow, and it asks you, by name, to betray a friend.',
    secretHint:
      "Most of these calls are not real. Someone who has already pieced together the city's hidden cases could find the one that is.",
    choices: [
      {
        id: 'choir-hero',
        label: 'Spend the signal to save the unseen caller',
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            'Juno brings the whole choir to a single note and points. You find a man trapped behind a collapsed cold-storage door who was never on any dispatch board. He lives. The choir goes thin and hoarse for the rest of the night, and two other calls go unanswered.',
            'The man from the cold store is at the harbor clinic, telling everyone a student heard him through a wall.',
            1,
            1,
            2,
          ),
        },
      },
      {
        id: 'choir-villain',
        label: 'Do what the call from tomorrow asks',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            'You tell Juno to patch you through to the friend the voice named, and you say exactly what the voice told you to say. Something in the future is satisfied. Something in the present breaks. Juno lowers the baton and will not look at you.',
            'Your friend does not sit with you at lunch. They do not know why they are angry. You do.',
            2,
            0,
            -2,
            {
              allegiance: 'villain',
              modifier: 1,
              note: 'Whoever called from tomorrow owes you a favor.',
            },
          ),
        },
      },
      {
        id: 'choir-rogue',
        label: 'Recruit Juno as your private dispatcher',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            "You ask Juno to work your nights instead of the city's. She considers it the way a paramedic considers a pulse, and agrees, on one condition: when the loudest note sounds, you go, whatever it costs.",
            'Your radio picks up a quiet hum at breakfast: Juno, tuning in. She calls you "the alto".',
            1,
            0,
            1,
            {
              allegiance: 'rogue',
              modifier: 1,
              note: 'Juno warns you which call is worse than it looks.',
            },
          ),
        },
      },
      {
        id: 'choir-refuse',
        label: 'Tell her the dead do not get to give orders',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'You walk off the pier. The choir keeps singing behind you, a little out of tune. In the morning a building in the harbor is evacuated too late, and Juno is the only person who is not surprised.',
            'Juno has left a recording on your phone: a single soprano, third floor, east stairwell, stopping.',
            -1,
            1,
            -1,
          ),
        },
      },
      {
        id: 'choir-secret',
        label: 'Match the calls against the case secrets you found',
        kind: 'secret',
        outcomes: {
          secret: o(
            "You lay your recovered case secrets over Juno's choir and the pattern jumps out: almost every voice repeats on a loop, planted by a city-wide emergency simulation. Almost. One call is real, and it was never meant to be found. Juno weeps, then conducts the whole choir silent except that one voice, and you follow it home.",
            "The simulation servers under the harbor were switched off overnight by someone with a paramedic's key. The choir is quieter. The one real voice is safe.",
            3,
            -2,
            2,
            {
              allegiance: 'hero',
              modifier: 2,
              note: "Juno can tell the antagonist's fake calls from real ones.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-pledgebreaker',
    zone: 'academy',
    window: { from: 18, to: 24 },
    title: 'Pledgebreaker Demands a Dance',
    cast: 'pod-20261029-05',
    scene:
      'The football field is full of lightning. A herd of Thunder-Tux Stags, wedding-black and crackling, blocks the only evacuation route off the academy grounds, and at its head stands Pledgebreaker, bus-sized, six-legged, chandelier antlers hung with singed RSVP cards. "You are cordially commanded to dance. Regrets are not accepted." No evacuee crosses without an invitation.',
    secretHint:
      'One stag is carrying a very old prom invitation. Someone who has already asked a person to prom would know how to read it.',
    choices: [
      {
        id: 'pledgebreaker-hero',
        label: 'Free the herd: tear up the invitation contracts',
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            "You climb the antlers and pull the RSVP cards loose one by one. Each one releases a promise somebody never kept. The herd goes quiet, then simply leaves, trotting into the storm free of anyone's invitation. The evacuees cross in silence.",
            'The football field is scorched in the shape of a ballroom floor. A groundskeeper has decided to keep it.',
            1,
            -1,
            2,
            {
              allegiance: 'villain',
              modifier: 1,
              note: 'The mastermind has lost a herd of storm cavalry.',
            },
          ),
        },
      },
      {
        id: 'pledgebreaker-villain',
        label: 'Accept the dance and take command of the herd',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            'You bow, Pledgebreaker bows, and you dance in a ring of lightning while the evacuees watch. When the music stops, the herd is yours. So is the mark: a scorched RSVP card is burned onto the back of your hand, and everyone who sees it knows you are an oathbreaker now.',
            'Your hand has a scorch mark shaped like an invitation. It does not wash off. A teacher asks you to wear a glove in class.',
            2,
            1,
            -2,
            {
              need: 'kinetic',
              modifier: 1,
              note: 'The Thunder-Tux Stags answer when you call.',
            },
          ),
        },
      },
      {
        id: 'pledgebreaker-rogue',
        label: 'Ride the herd across the map with the evacuees',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'You bargain for one ride, not a dance. Pledgebreaker agrees, insulted and intrigued, and the herd carries every evacuee across campus on lightning-backed stags. It is the fastest evacuation in academy history and the most expensive in insurance claims.',
            'The academy has received forty-one complaints about scorch marks and three thank-you cards from evacuees who would like to ride again.',
            1,
            0,
            0,
          ),
        },
      },
      {
        id: 'pledgebreaker-refuse',
        label: 'Clear a different route and leave the herd alone',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'You lead the evacuees the long way round, through the dormitory tunnels. It takes three hours. The herd stays on the field all night, waiting for someone to answer.',
            'The stags are still on the football field. Nobody can hold practice. Pledgebreaker has started sending invitations to the faculty.',
            0,
            1,
            -1,
          ),
        },
      },
      {
        id: 'pledgebreaker-secret',
        label: 'Ask the oldest stag who its invitation was for',
        kind: 'secret',
        outcomes: {
          secret: o(
            'You know what a real invitation sounds like now, so you can read the oldest card. It is a prom invitation, years old, never answered, addressed to a student who would grow up to plan the Prom of Doom. The stag has been carrying their first heartbreak all this time. You give the card back, answered at last, and the whole herd lies down.',
            "The answered invitation is on your desk this morning, tied with a lightning-blue ribbon. You know the mastermind's first name now.",
            3,
            -2,
            2,
            {
              allegiance: 'villain',
              modifier: 2,
              note: "You carry the mastermind's oldest unanswered promise.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-miss-reflection',
    zone: 'civic',
    window: { from: 21, to: 27 },
    title: 'Miss Reflection Has the Footage',
    cast: 'pod-20261029-06',
    scene:
      'Every mirror in the media spire turns toward you at once. Glassjaw Gargoyles step out of the reflections, and Miss Reflection lands on the reception desk, wings folded, graduation cap tilted on one horn. Her television-glass jaw shows your own frightened face. "Smile. You were already on camera before you decided to come here." She offers two recordings: one that unmasks the mastermind, and one of a classmate\'s worst night, which would end their future.',
    secretHint:
      'Her camera is older than the city. Someone who has pulled apart enough of the conspiracy would know which footage she is hiding.',
    choices: [
      {
        id: 'reflection-hero',
        label: "Protect your classmate's future and conceal the tape",
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            "You take your classmate's recording and smash it on the desk. Miss Reflection's jaw flickers with something like respect. The mastermind's tape goes back into her nest. Your friend will never know how close it came.",
            'Your classmate is laughing in the hallway this morning, completely unaware. You decide that is what winning looks like.',
            1,
            1,
            2,
          ),
        },
      },
      {
        id: 'reflection-villain',
        label: 'Publish both recordings and let the city sort it out',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            "Both tapes hit every screen in Civic Heights. The mastermind's face is on the evening news. So is your classmate's worst night. Miss Reflection applauds with her mirror claws.",
            'The mastermind is in hiding. Your classmate has withdrawn from the academy. The city is talking about both.',
            2,
            -1,
            -2,
            {
              allegiance: 'villain',
              modifier: 1,
              note: "The mastermind's face is public now.",
            },
          ),
        },
      },
      {
        id: 'reflection-rogue',
        label: 'Publish only the mastermind tape and keep the other',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'You take both. You publish one. The other stays in your jacket, where it will sit for the rest of the term like a stone. Miss Reflection\'s jaw shows your face again, less frightened. "You learn quickly," she says.',
            'The mastermind tape is everywhere. The other is still in your jacket pocket. You checked twice before breakfast.',
            2,
            0,
            0,
            {
              allegiance: 'rogue',
              modifier: 1,
              note: 'You hold a recording that could end a future.',
            },
          ),
        },
      },
      {
        id: 'reflection-refuse',
        label: 'Break line of sight and get out of the spire',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'You shatter the nearest mirror and run through the gap. The gargoyles let you go; they already have what they wanted, which was a recording of you leaving.',
            'There is a clip of you running from the spire on three gossip channels. The caption is not kind.',
            -1,
            1,
            -1,
          ),
        },
      },
      {
        id: 'reflection-secret',
        label: 'Ask for the footage from her very first camera',
        kind: 'secret',
        outcomes: {
          secret: o(
            'You name the founding of Comet City, and Miss Reflection goes still. Her original camera filmed it: the first catastrophe was deliberately misreported, and the same family has profited from every disaster since. She plays it for you, and only you. Then she flies off with the cap still on her horn, a spymaster without a master.',
            'The founding footage is on a thumb drive in your locker with a note in mirror writing: "Now we both know."',
            3,
            -2,
            2,
            {
              allegiance: 'villain',
              modifier: 2,
              note: "You know the city's first lie.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-standing-ovation',
    zone: 'harbor',
    window: { from: 15, to: 21 },
    title: 'Standing Ovation Fills the Stadium',
    cast: 'pod-20261029-07',
    scene:
      'The waterfront stadium is floating. Standing Ovation, a skyscraper-high leech of pink and gold ribbon, hangs over the field with a whole audience suspended beneath it like a chandelier, and it grows with every cheer. "Ladies, gentlemen and everyone wonderful: let me hear it for YOU!" The crowd cannot stop applauding. A star student grabs your arm and begs you to give a victory speech so loud it bursts the creature, whatever it does to your standing.',
    secretHint:
      'The leech swallowed something it should not have. If the city already trusts you, the crowd might go quiet when you ask.',
    choices: [
      {
        id: 'ovation-hero',
        label: 'Win quietly: get the crowd down without a sound',
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            'You ask the crowd for silence, one section at a time, and lower them hand over hand on the fringe. Starved of applause, Standing Ovation shrinks to the size of a parade float and drifts off over the harbor, sulking. Nobody claps when you are done. It is the best compliment you have ever had.',
            'The stadium posts a sign at every gate: PLEASE HOLD APPLAUSE UNTIL FURTHER NOTICE.',
            1,
            -1,
            2,
          ),
        },
      },
      {
        id: 'ovation-villain',
        label: 'Weaponize the applause until it bursts',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            'You whip the crowd into a frenzy. The leech swells, strains and bursts in a storm of confetti and stolen medals. The audience falls. Most of them land on the field. Some land on each other.',
            'The harbor clinic treats forty-seven sprained ankles. The stadium medals, recovered from the confetti, are being returned to their owners one by one.',
            2,
            1,
            -2,
            {
              need: 'elemental',
              modifier: -1,
              note: 'Confetti leech spores are in the harbor air now.',
            },
          ),
        },
      },
      {
        id: 'ovation-rogue',
        label: 'Fake the victory speech the star student asked for',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'You give a speech for a win that has not happened yet, and the crowd roars for the wrong reason. The leech overfeeds, belches out the audience in a gentle shower and floats away bloated. The star student owes you. The academy saw you lie into a microphone.',
            'The academy has scheduled you for a conversation about "public honesty". The star student has scheduled you for lunch.',
            1,
            0,
            -1,
            {
              allegiance: 'shared',
              modifier: 1,
              note: 'The star student and their fans back you up.',
            },
          ),
        },
      },
      {
        id: 'ovation-refuse',
        label: 'Leave the stadium to the professionals',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'You back out of the stadium. A professional crowd-control team arrives and solves it with a fire hose and very little grace. Everyone is down by dawn, soaked and furious.',
            'The harbor paper runs a photo of a dripping audience under the headline: WHERE WERE THE STUDENTS?',
            -1,
            1,
            -1,
          ),
        },
      },
      {
        id: 'ovation-secret',
        label: 'Ask the crowd for one minute of silence and listen',
        kind: 'secret',
        outcomes: {
          secret: o(
            "The city trusts you, so the crowd goes quiet for you. In the silence, Standing Ovation hiccups up its oldest meal: a recording of your rival antagonist's first public speech, given years ago to an empty hall. You hear who they were before. The leech, emptied, drifts away. The audience comes down gently.",
            "You have listened to the recording four times. Your rival's first speech was about rescue. Someone taught them to stop believing it.",
            3,
            -2,
            2,
            {
              allegiance: 'villain',
              modifier: 2,
              note: "You know your rival's first, better speech.",
            },
          ),
        },
      },
    ],
  },
  {
    id: 'cast-lady-hemline',
    zone: 'academy',
    window: { from: 25, to: 28 },
    title: 'Lady Hemline Takes Your Measurements',
    cast: 'pod-20261029-08',
    scene:
      'The prom fitting room is full of silk that remembers. Lady Hemline hangs from the chandelier in a cathedral-sized burgundy bustle, pearl-tipped legs stitching, and every graduating student she dresses becomes the person they wish they had been and forgets who loved them before. "Hold still, dear. I am only letting out the parts of you that never fit." She offers you a velvet disguise that would walk you straight into the mastermind\'s prom-night operation.',
    secretHint:
      'Somewhere in her lining is a memory she never altered. Someone who has made a real commitment to another person would know which seam it is in.',
    choices: [
      {
        id: 'hemline-hero',
        label: "Recover a friend's stolen past from the silk",
        kind: 'act',
        certain: true,
        stance: 'hero',
        outcomes: {
          success: o(
            "You find your friend's dress and unpick it thread by thread while Lady Hemline watches, amused. Their memories come back in the wrong order and then the right one. They remember you. They remember everyone. The infiltration route is gone.",
            'Your friend hugs you at the gate and will not say why, because they are not sure. You are.',
            1,
            1,
            2,
          ),
        },
      },
      {
        id: 'hemline-villain',
        label: 'Wear the velvet disguise into the operation',
        kind: 'act',
        certain: true,
        stance: 'villain',
        outcomes: {
          success: o(
            "The velvet fits perfectly. You become someone the mastermind's people trust, walk their prom-night operation end to end and walk out with the plans. When you take the disguise off, one bond is gone: you cannot remember why a particular friend used to make you laugh.",
            'You have the prom-night plans. A friend waves at you in the hallway and you smile back politely, as if at a stranger.',
            2,
            -1,
            -1,
            {
              allegiance: 'villain',
              modifier: 2,
              note: "You walked the mastermind's prom-night operation in velvet.",
            },
          ),
        },
      },
      {
        id: 'hemline-rogue',
        label: 'Commission a disguise and refuse to pay in memories',
        kind: 'act',
        certain: true,
        stance: 'rogue',
        outcomes: {
          success: o(
            'You haggle with a spider, which goes about as well as you would expect. Lady Hemline sews you half a disguise for half a memory: you forget your first day at the academy, and you get a cloak that works for ten minutes at a time.',
            'You cannot remember your first day at the academy. Your yearbook says you cried at orientation. You will take its word for it.',
            1,
            0,
            0,
            {
              allegiance: 'rogue',
              modifier: 1,
              note: 'Ten minutes of velvet disguise, once per night.',
            },
          ),
        },
      },
      {
        id: 'hemline-refuse',
        label: 'Pull the fire alarm and clear the fitting room',
        kind: 'refuse',
        outcomes: {
          refusal: o(
            'The alarm sends everyone out half-dressed. The silk stays on its hangers. Lady Hemline climbs back into the rafters with a sigh: there will be other fittings, and graduation is very soon.',
            'Three students are missing a memory of their best friend this morning. None of them know it yet.',
            0,
            1,
            -1,
          ),
        },
      },
      {
        id: 'hemline-secret',
        label: 'Ask for the memory sewn into her own lining',
        kind: 'secret',
        outcomes: {
          secret: o(
            "You know what a promise between people feels like now, so you can feel which seam holds one. Lady Hemline lets you open it. Inside is a single unaltered memory: the original rehearsal for the city's destruction, with every face visible. She did not sew it into a dress. She kept it, for herself, for decades.",
            'You remember a rehearsal you never attended. Every face in it is clear. Two of them are still on the academy board.',
            3,
            -2,
            2,
            {
              allegiance: 'villain',
              modifier: 2,
              note: 'You remember the original rehearsal for the Prom of Doom.',
            },
          ),
        },
      },
    ],
  },
]

export function castMember(key: string): OctoberCastMember | undefined {
  return OCTOBER_CAST.find((member) => member.key === key)
}
