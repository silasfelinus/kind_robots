import type { PatrolZoneId } from './nightPatrols'
import { CAST_STORIES } from './octoberCast'

// The three commissioned patrol stories from kind_robots#4402. Each one takes
// over a district patrol once, inside its own window, with several real
// approaches, a refusal that is not a dead end, a secret that only appears
// when its prerequisite was earned earlier, a next-morning callback and a
// consequence that changes later nights.

export type StoryPower =
  'kinetic' | 'technopathy' | 'empathy' | 'elemental' | 'spatial' | 'biotech'
export type StoryGrade = 'success' | 'mixed' | 'failure' | 'refusal' | 'secret'
export type StoryOutcome = {
  text: string
  /** The next school morning's opening line. */
  morning: string
  influence: number
  danger: number
  /** Academy standing on academy roofs, city standing elsewhere. */
  standing: number
  /** A later-night effect: matching calls on later days gain or lose a step. */
  later?: {
    need?: StoryPower
    allegiance?: 'hero' | 'villain' | 'rogue' | 'shared'
    modifier: number
    note: string
  }
  /** The teammate sent elsewhere is hurt and benched for two school days. */
  injuresTeammate?: boolean
}
export type StoryChoice = {
  id: string
  label: string
  kind: 'act' | 'refuse' | 'secret'
  /** A matching power field adds two steps to the roll. */
  need?: StoryPower
  /** Who must be available: a teammate to send, or the known rival. */
  requires?: 'teammate' | 'rival'
  /** A first meeting about who you are, not dice: always the success text. */
  certain?: boolean
  /** Which kind of hero this choice makes you. */
  stance?: 'hero' | 'villain' | 'rogue'
  outcomes: Partial<Record<StoryGrade, StoryOutcome>>
}
export type PatrolStory = {
  id: string
  zone: PatrolZoneId
  window: { from: number; to: number }
  title: string
  scene: string
  /** Why the secret appears, phrased as a clue rather than a spoiler. */
  secretHint: string
  /** The Oct 29 cast member this first encounter introduces (octoberCast.ts). */
  cast?: string
  choices: StoryChoice[]
}

export const PATROL_STORIES: readonly PatrolStory[] = [
  {
    id: 'story-clocktower',
    zone: 'academy',
    window: { from: 6, to: 11 },
    title: 'The Frog Under the Clocktower',
    scene:
      'Night-watch on the academy roofs. From inside the sealed chemistry bell comes a single, very polite ribbit. Dr. Frog is wedged in the bell housing, cheeks bulging: he is holding a leaking antidote in his throat sac because every flask in the lab cracked at once. Two floors down, the night janitor is coughing. Campus security has already called the dean, who wants the tower sealed until morning.',
    secretHint:
      'Dr. Frog trusts students who have spent a daytime lab beside him.',
    choices: [
      {
        id: 'clocktower-rescue',
        label: 'Rescue him openly and ring the infirmary',
        kind: 'act',
        need: 'kinetic',
        outcomes: {
          success: {
            text: 'You lever the bell rim up with one shoulder and Dr. Frog slides out in a puddle of dignity. The infirmary doses the janitor in time. Security writes you up for climbing a sealed tower, and the city paper prints a photo of a student carrying a frog the size of a sofa down the fire stairs.',
            morning:
              'The dean issues you a formal reprimand and, in the same envelope, a thank-you note from the night janitor.',
            influence: 2,
            danger: -1,
            standing: -1,
            later: {
              need: 'biotech',
              modifier: 1,
              note: 'Dr. Frog shares his antidote notes with the infirmary.',
            },
          },
          mixed: {
            text: 'The bell comes up, but so does half the roof gutter. Dr. Frog swallows the antidote by reflex and has to cough it into a mop bucket. The janitor is treated with what is left. Everyone survives; the bucket does not.',
            morning:
              'Facilities bills the student council for one bell housing and one mop bucket. Dr. Frog pays for the bucket.',
            influence: 1,
            danger: 0,
            standing: -1,
          },
          failure: {
            text: 'The bell rings while you are under it. Dr. Frog loses his grip on the antidote and it hisses across the roof. The janitor spends the night in the civic hospital and the dean seals the tower with you outside it.',
            morning:
              'The tower is chained shut. Somebody has taped a paper frog to the chain.',
            influence: -1,
            danger: 1,
            standing: -2,
          },
        },
      },
      {
        id: 'clocktower-smuggle',
        label: 'Help him smuggle the antidote to the patients',
        kind: 'act',
        need: 'spatial',
        outcomes: {
          success: {
            text: 'You and Dr. Frog take the gutters, the laundry chute and one very surprised pigeon. The antidote reaches the janitor and two coughing students in the dormitory before security reaches the bell. Nobody official knows it was you. The people who were coughing know exactly who it was.',
            morning:
              'A note under your door, in a careful round hand: the underground clinic is open to you whenever you need it.',
            influence: 1,
            danger: 0,
            standing: 1,
            later: {
              allegiance: 'rogue',
              modifier: 1,
              note: 'The underground clinic patches up anyone you send.',
            },
          },
          mixed: {
            text: 'The antidote reaches the janitor but not the dormitory, and a campus camera catches a green blur on the laundry chute. Dr. Frog is now a rumor with a reward attached.',
            morning:
              'Security posts a blurry photo of the laundry chute. Three different clubs claim the green blur is their mascot.',
            influence: 0,
            danger: 1,
            standing: 0,
          },
          failure: {
            text: 'The chute jams. Security finds a student, a frog and a cracked vial in the laundry room. The antidote is confiscated as evidence and the janitor waits until morning for a doctor.',
            morning:
              'Dr. Frog is suspended pending review. The confiscated antidote is listed as "unknown green substance".',
            influence: -1,
            danger: 1,
            standing: -1,
          },
        },
      },
      {
        id: 'clocktower-seal',
        label: 'Let the dean seal the tower and stand guard',
        kind: 'act',
        need: 'empathy',
        outcomes: {
          success: {
            text: 'You follow procedure and talk Dr. Frog calm through the bell until the hazard team arrives. They take him out properly. They also take him somewhere you are not cleared to know about. The janitor recovers. Dr. Frog does not come to class.',
            morning:
              "The faculty newsletter thanks you for your discretion. Dr. Frog's lab is empty and his name is gone from the door.",
            influence: 0,
            danger: -1,
            standing: 2,
            later: {
              need: 'biotech',
              modifier: -1,
              note: 'The lab that could have helped is gone.',
            },
          },
          mixed: {
            text: 'The tower is sealed and the hazard team is slow. By the time they open the bell, Dr. Frog is gone through a drain, and so is the antidote.',
            morning:
              'Campus rumor says Dr. Frog was seen in the harbor sewers wearing a tiny backpack.',
            influence: 0,
            danger: 0,
            standing: 1,
          },
          failure: {
            text: 'The seal holds; the janitor does not. He collapses on the stairs and you have to break the seal anyway, too late to keep it clean.',
            morning:
              'The janitor is in the civic hospital. The dean asks why you waited. You do not have a good answer.',
            influence: -1,
            danger: 1,
            standing: -1,
          },
        },
      },
      {
        id: 'clocktower-refuse',
        label: 'Leave it to the faculty and finish your rounds',
        kind: 'refuse',
        outcomes: {
          refusal: {
            text: 'You log the ribbit and walk on. Faculty handle it, eventually. The janitor is fine by dawn. Dr. Frog notices which student kept walking.',
            morning:
              'Dr. Frog is back in class with a bandaged throat. He grades your lab report exactly fairly, and not one point more.',
            influence: 0,
            danger: 1,
            standing: 0,
          },
        },
      },
      {
        id: 'clocktower-secret',
        label: 'Ask Dr. Frog to teach you the trick he keeps for emergencies',
        kind: 'secret',
        outcomes: {
          secret: {
            text: 'Dr. Frog trusts you from the lab. Between breaths, he walks you through a peculiar, completely nonviolent decontamination: salt, a bell harmonic and one patient hum. The leak neutralizes itself. The janitor breathes. Dr. Frog asks you to keep the method for people who cannot pay for it.',
            morning:
              'You wake with the hum still in your teeth. The civic clinic asks, very quietly, whether the student who knows the bell trick is free this week.',
            influence: 2,
            danger: -2,
            standing: 1,
            later: {
              need: 'biotech',
              modifier: 2,
              note: "Dr. Frog's bell-harmonic decontamination opens a clinic route.",
            },
          },
        },
      },
    ],
  },
  {
    id: 'story-last-stop',
    zone: 'transit',
    window: { from: 11, to: 20 },
    title: "Grandma's Last Stop",
    scene:
      'Granny Mayhem has commandeered the Narrows senior shuttle. She is evacuating a block of elders from a condemned tower before the demolition crew arrives early, and she is doing it at sixty miles an hour. Above the shuttle, hero-grade drones are stamping every passenger THREAT on the city feed. Her warrant is real. So is the demolition order. Nobody has checked whether the tower is empty.',
    secretHint:
      'The drivers listen to people who already kept a promise on these streets, or to a union organizer standing with someone who can hear fear.',
    choices: [
      {
        id: 'last-stop-stop',
        label: 'Stop the shuttle and arrest her',
        kind: 'act',
        need: 'kinetic',
        outcomes: {
          success: {
            text: 'You catch the shuttle and Granny comes quietly, which worries you. The drones log a clean arrest. The elders are processed as suspects and spend the night in a holding room while the tower comes down with a cat still inside. The city calls it a success.',
            morning:
              'The academy feed celebrates your arrest. The Narrows has painted your hero name on the shuttle stop with a question mark after it.',
            influence: 1,
            danger: 0,
            standing: -2,
            later: {
              allegiance: 'villain',
              modifier: 1,
              note: 'The drones treat you as one of theirs.',
            },
          },
          mixed: {
            text: 'You stop the shuttle on the bridge. Granny talks you into letting the elders walk the rest of the way before the drones land. She is arrested; they are not.',
            morning:
              'Granny Mayhem is out on bail by breakfast and has sent you a crocheted handcuff cozy.',
            influence: 0,
            danger: 0,
            standing: 0,
          },
          failure: {
            text: 'The shuttle swerves around you and clips a drone. It comes down on the shuttle roof. Two elders are hurt and Granny is now wanted for assaulting city property.',
            morning:
              'The Narrows clinic is full. The drone company invoices the elders for the drone.',
            influence: -2,
            danger: 2,
            standing: -2,
          },
        },
      },
      {
        id: 'last-stop-escort',
        label: 'Ride escort and get everyone to the shelter',
        kind: 'act',
        need: 'spatial',
        outcomes: {
          success: {
            text: 'You clear the lanes ahead of her and hold every light green. The shuttle reaches the shelter with all fourteen elders and a parrot. The drones still have her warrant. They now also have footage of you helping her.',
            morning:
              'The academy wants a word about "aiding a wanted person". The shelter wants to know your favorite cake.',
            influence: 2,
            danger: -1,
            standing: 2,
            later: {
              allegiance: 'shared',
              modifier: 1,
              note: 'The Narrows elders vouch for you on shared calls.',
            },
          },
          mixed: {
            text: 'Everyone arrives, mostly. One elder refuses to leave the tower and you have to go back for him while the shuttle waits. Granny is furious that you were right.',
            morning:
              'The elder you went back for is telling the whole shelter you are his grandchild now.',
            influence: 1,
            danger: 0,
            standing: 1,
          },
          failure: {
            text: 'The drones box the shuttle in at the Narrows bend. You get the elders out on foot; the shuttle is impounded with their medications inside.',
            morning:
              'The shelter spends the morning phoning pharmacies. Granny says next time she drives.',
            influence: 0,
            danger: 1,
            standing: 0,
          },
        },
      },
      {
        id: 'last-stop-expose',
        label: 'Expose the drone warrant on the city feed',
        kind: 'act',
        need: 'technopathy',
        outcomes: {
          success: {
            text: 'You crack the drone feed and find the warrant was filed by the demolition company. The THREAT tags flip to EVACUEE on every screen in the Narrows. The drones peel away. Granny honks twice, which may be thanks.',
            morning:
              'The demolition company has paused work "for review". A city councillor wants to know how a student read a sealed warrant.',
            influence: 2,
            danger: -1,
            standing: 2,
            later: {
              allegiance: 'hero',
              modifier: 1,
              note: 'The warrant scandal makes the city feed slower to tag your calls.',
            },
          },
          mixed: {
            text: 'You publish the warrant but not the filer. The tags stay up; the public starts arguing about them instead.',
            morning:
              'Half the city thinks Granny is a hero, half thinks she is a carjacker. Both halves are right.',
            influence: 1,
            danger: 0,
            standing: 0,
          },
          failure: {
            text: "The drone feed traces you back before you can publish. Your own student photo goes up beside Granny's under THREAT, and the shuttle has to take the long way round.",
            morning:
              'The academy pulls your night pass for a review. Granny sends a postcard: "Welcome to the club."',
            influence: -1,
            danger: 1,
            standing: -1,
          },
        },
      },
      {
        id: 'last-stop-refuse',
        label: 'Reject the job: this is not a fight for a student',
        kind: 'refuse',
        outcomes: {
          refusal: {
            text: 'You leave it to the drones. Granny gets the elders out anyway, the hard way, through the flooded underpass. She does not look up at you once.',
            morning:
              'Granny Mayhem has crossed your name off a list. You did not know you were on a list.',
            influence: -1,
            danger: 1,
            standing: -1,
          },
        },
      },
      {
        id: 'last-stop-secret',
        label: 'Call the drivers: run it as a union evacuation',
        kind: 'secret',
        outcomes: {
          secret: {
            text: "The drivers come out of the depot in every bus they have. A labor-led convoy surrounds Granny's shuttle, the drones cannot tag forty vehicles at once, and the whole tower is cleared, cat included. The union files the evacuation as a scheduled shift. Nobody is arrested.",
            morning:
              'The transit union paints a small comet on the depot door. Mara says it means you get a free ride for life, or at least until graduation.',
            influence: 3,
            danger: -2,
            standing: 3,
            later: {
              need: 'spatial',
              modifier: 2,
              note: 'The transit union clears lanes for your calls.',
            },
          },
        },
      },
    ],
  },
  {
    id: 'story-two-shadows',
    zone: 'transit',
    window: { from: 21, to: 28 },
    title: 'The Rooftop With Two Shadows',
    scene:
      'Two rescue calls arrive at the same second from two Narrows rooftops, a street apart. Both voices know your name. Both have the same quarter-second of static at the end. Somebody wants your circle split down the middle, and they have counted exactly how many friends you have left.',
    secretHint:
      'Someone who once betrayed you, and came back, knows where the third roof is.',
    choices: [
      {
        id: 'two-shadows-attend',
        label: 'Take the north roof yourself and leave the south roof',
        kind: 'act',
        need: 'spatial',
        outcomes: {
          success: {
            text: 'The north roof is real: a courier pinned under a fallen sign. You get her down. The south roof was a decoy with a recorder taped to an antenna. You saved the one person who was there.',
            morning:
              'The courier brings a box of pastries to the academy gate and asks for "the one who picked my roof".',
            influence: 1,
            danger: 0,
            standing: 1,
          },
          mixed: {
            text: 'The north roof was the decoy. By the time you cross, the south roof is empty except for blood on the gravel and a dropped transit pass.',
            morning:
              'The transit pass belongs to a night nurse who did not come to work. Her name is on the morning bulletin board.',
            influence: -1,
            danger: 1,
            standing: -1,
          },
          failure: {
            text: 'Both roofs were bait. While you were on one, someone used the other to watch exactly how you move.',
            morning:
              'Your patrol route is printed in the morning paper, anonymously, with times.',
            influence: -1,
            danger: 2,
            standing: -1,
            later: {
              allegiance: 'hero',
              modifier: -1,
              note: 'Your patrol pattern is public now.',
            },
          },
        },
      },
      {
        id: 'two-shadows-split',
        label: 'Send your most trusted teammate south and go north',
        kind: 'act',
        need: 'empathy',
        requires: 'teammate',
        outcomes: {
          success: {
            text: 'You both reach your roofs at once. The decoy recorder is unmasked on the south roof and the courier is freed on the north. Your teammate radios one word, "clear", and you have never liked a word more.',
            morning:
              'Your teammate is waiting at the school gate with two coffees and the decoy recorder, already taken apart.',
            influence: 2,
            danger: -1,
            standing: 1,
          },
          mixed: {
            text: 'The south roof was not empty. Your teammate gets the courier out but falls through a skylight doing it. Nothing broken that will not mend. They will not patrol for a couple of days.',
            morning:
              'Your teammate is in the infirmary, arm in a sling, and wants to know whether the courier is all right before they talk about anything else.',
            influence: 1,
            danger: 0,
            standing: 0,
            injuresTeammate: true,
          },
          failure: {
            text: 'The split is exactly what the trap wanted. Your teammate is ambushed on the south roof and you hear it over the radio from too far away.',
            morning:
              'Your teammate is in the infirmary. They say it is not your fault. Their eyes say they are still deciding.',
            influence: -1,
            danger: 1,
            standing: -1,
            injuresTeammate: true,
          },
        },
      },
      {
        id: 'two-shadows-rival',
        label: "Accept your rival's offer to cover one roof",
        kind: 'act',
        need: 'kinetic',
        requires: 'rival',
        outcomes: {
          success: {
            text: 'Your rival takes the south roof without a word and is done before you are. Whatever else they are, they are good at this. The trap fails twice.',
            morning:
              'Your rival leaves a note in your locker: "We are even. Do not get used to it."',
            influence: 2,
            danger: -1,
            standing: 1,
            later: {
              allegiance: 'villain',
              modifier: 1,
              note: 'You know how your rival fights now.',
            },
          },
          mixed: {
            text: 'Your rival covers the roof and takes the credit on the city feed. The courier is safe. Your reputation is a little less so.',
            morning:
              'The feed calls your rival "the one who saved the Narrows". Your name is in the small print.',
            influence: 0,
            danger: 0,
            standing: -1,
          },
          failure: {
            text: 'Your rival takes the south roof and simply leaves with what they found there. The courier on your roof is safe; the evidence on theirs is gone.',
            morning:
              "Whatever was on the south roof is now in your rival's hands. You do not know what it was.",
            influence: -1,
            danger: 1,
            standing: 0,
          },
        },
      },
      {
        id: 'two-shadows-evidence',
        label: 'Ignore both roofs and trace the signal',
        kind: 'act',
        need: 'technopathy',
        outcomes: {
          success: {
            text: "You leave both roofs to the night crews and follow the static instead. It leads to a van with a dish on the roof and a very startled technician. The calls were both staged. The van's logs name who paid for them.",
            morning:
              'The van logs reach the morning hearing. Someone at city hall is suddenly on vacation.',
            influence: 1,
            danger: -2,
            standing: 1,
          },
          mixed: {
            text: 'You find the van but not the logs. The night crews reach both roofs late; one of them held a real person.',
            morning:
              'A night crew chief asks, politely, why the hero who answered the call went the other way.',
            influence: 0,
            danger: 0,
            standing: -1,
          },
          failure: {
            text: 'The signal was a third decoy, bouncing off a dish on an empty roof. By the time you turn back, nobody has reached either call in time.',
            morning:
              'Two families are asking the academy why nobody came. You were the nobody.',
            influence: -2,
            danger: 2,
            standing: -2,
          },
        },
      },
      {
        id: 'two-shadows-refuse',
        label: 'Refuse the bait and call it in to the city',
        kind: 'refuse',
        outcomes: {
          refusal: {
            text: 'You report both calls as a likely trap and stay off the roofs. The city sends a crew an hour later. The courier is cold and frightened but alive. The trap goes unsprung, and whoever set it learns you can be patient.',
            morning:
              'The courier tells the paper the heroes came late. She is not wrong.',
            influence: 0,
            danger: 1,
            standing: -1,
          },
        },
      },
      {
        id: 'two-shadows-secret',
        label: 'Let {betrayer} show you the hidden third roof',
        kind: 'secret',
        outcomes: {
          secret: {
            text: '{betrayer} knows this trap: they helped build one like it. The real hostage is on a third roof, between the two calls, under a tarp. You go together. It is the first time since the gate that you have trusted them with your back, and they do not waste it.',
            morning:
              '{betrayer} sits at your lunch table without asking. Nobody at the table says anything about it, which is how you know it is all right.',
            influence: 3,
            danger: -2,
            standing: 2,
            later: {
              allegiance: 'villain',
              modifier: 2,
              note: 'A former accomplice tells you how the trap-makers think.',
            },
          },
        },
      },
    ],
  },
]

/** Commissioned stories plus the Oct 29 cast's first encounters. Windows in
 * one district never overlap, so a district holds at most one story a night. */
export const ALL_PATROL_STORIES: readonly PatrolStory[] = [
  ...PATROL_STORIES,
  ...CAST_STORIES,
]

export function patrolStoryById(id: string): PatrolStory | undefined {
  return ALL_PATROL_STORIES.find((story) => story.id === id)
}

function storyHash(seed: number, text: string): number {
  let value = seed >>> 0
  for (const letter of text)
    value = Math.imul(value ^ letter.charCodeAt(0), 16777619) >>> 0
  return value
}

/** Deterministic grade for an acted choice. `bonus` carries the run's power
 * match, district standing and any hostile former teammate. */
export function storyGrade(
  seed: number,
  day: number,
  choice: StoryChoice,
  bonus: number,
): StoryGrade {
  if (choice.kind === 'refuse') return 'refusal'
  if (choice.kind === 'secret') return 'secret'
  if (choice.certain) return 'success'
  const score = (storyHash(seed, `${day}:${choice.id}`) % 6) + bonus
  return score >= 5 ? 'success' : score >= 3 ? 'mixed' : 'failure'
}

export function fillStoryText(
  text: string,
  names: { betrayer?: string },
): string {
  return text.split('{betrayer}').join(names.betrayer ?? 'Your old teammate')
}
