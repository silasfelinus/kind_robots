import type { Beat } from './firstBellStory'
import type { PersonalBeat } from './accidentArcs'

export const PSYCHIC_ARCS: Record<
  string,
  Record<'hero' | 'villain', Record<Beat, PersonalBeat>>
> = {
  'psychic-fire': {
    hero: {
      arrival: [
        'The extinguisher beside the bed',
        "The seal carries the label from my childhood treatment program. I want the records, but I won't make another home burn to get them.",
        "I'll keep a clear exit and tell you if I see the flame spreading. You don't have to guess alone.",
      ],
      alarm: [
        'A fire with somewhere to go',
        'I can draw the flames away from the students or hold them away from the treatment recorder.',
        "I'll guide the students without making you responsible for every spark.",
      ],
      reckoning: [
        'A frightened rival',
        'The fallen patrol member looks the way I did after the curtains burned. I can offer help or keep the others from the recorder.',
        "I'll ask what they need instead of assuming their fear is about you.",
      ],
      victory: [
        'A safer practice',
        "I'll take the treatment records to someone independent. I want a plan for control that my friends and I can understand.",
        "I'll practice with you, but we'll agree on boundaries and ask for professional help when we need it.",
      ],
      defeat: [
        'A flame left behind',
        "I couldn't move all the fire in time. Hiding that failure would make it harder to learn from.",
        "I'll help reconstruct where the fire spread, and we'll make the next drill safer.",
      ],
    },
    villain: {
      arrival: [
        "The city's fever",
        'The treatment program wanted a controllable weapon. The vault has its records, and I want its directors to feel the anger they tried to suppress.',
        'I came to expose what they did, not to make every student answer for it.',
      ],
      alarm: [
        'Heat or history',
        "I can clear the students' passage or protect the recorder that identifies the people behind the program.",
        "I'll keep the exit open even if the directors refuse to answer.",
      ],
      reckoning: [
        'A witness in the smoke',
        "The fallen rival recognizes the program's label. I can hear their account or keep the patrol away from the recorder.",
        "I'll protect the witness's right to speak without being threatened.",
      ],
      victory: [
        'Anger with an address',
        'The directors know their program did not erase my feelings. I still have to decide whether the city owes me its pain.',
        "I'll keep the evacuation record separate from your accusations.",
      ],
      defeat: [
        'The fire moves on',
        'The records escaped me and my anger did not give them back. I cannot make the people left behind into another target.',
        "I'll help with the aftermath without promising to share your revenge.",
      ],
    },
  },
  'psychic-air': {
    hero: {
      arrival: [
        'The stairwell secret',
        "The vault's gravity sensor looks like the one I broke learning to float in our stairwell. This time I need to tell people what I can do.",
        "I'll mark where you can land. We can plan for the people who can't fly.",
      ],
      alarm: [
        'Two loads in the air',
        'I can lift the students away from the broken rigging or stabilize the sensor while we copy its readings.',
        "I'll clear the landing space and keep the ordinary stairs available.",
      ],
      reckoning: [
        'Someone who fell',
        'The rival is down under the rigging. I can lift it off them or stop the patrol reaching the sensor.',
        "I'll ask before we lift them. Floating can be terrifying when it isn't your choice.",
      ],
      victory: [
        'Above the apartment roofs',
        "I'm going home to tell my parents the truth, then I'll fly where they can see me.",
        "I'll come along if you want company, not as proof that you have to impress them.",
      ],
      defeat: [
        'A load too heavy',
        'I lifted more than I could safely control. I need to learn what to put down and when.',
        "I'll help check the failed rigging before we try that maneuver again.",
      ],
    },
    villain: {
      arrival: [
        'Nothing holds them up',
        "The sensor's logs show who controls the city's elevated roads. I could make their owners discover what it feels like to lose their footing.",
        "I know what they did to you. I won't let the students become a demonstration.",
      ],
      alarm: [
        'A suspended bargain',
        'I can lower the students to safety or hold the sensor steady to recover the leverage its records give me.',
        "I'll keep a ground-level exit open, regardless of what you do with the sensor.",
      ],
      reckoning: [
        'An unsecured rival',
        'The fallen patrol member knows who approved the control system. I can hear them or keep the rest of the patrol away.',
        "I'll make sure the witness is on solid ground before asking anything.",
      ],
      victory: [
        'The city looks down',
        'The officials know how fragile their elevated world is. That does not mean the people beneath it deserve to fall.',
        "I'll keep a list of the places that need repairs, not the places that owe you money.",
      ],
      defeat: [
        'The weight returns',
        'I lost control of the rigging and the city did not change its mind. I can feel the cost of treating a rescue as a threat.',
        "I'll help stabilize what fell, not look for another load to drop.",
      ],
    },
  },
  'psychic-earth': {
    hero: {
      arrival: [
        'What the cornerstone heard',
        'The stage is built with stone from city hall. I can hear fragments of the crime that its founders buried.',
        "I'll write down your account and look for evidence that someone else can check.",
      ],
      alarm: [
        'The stones remember',
        'I can listen for the students under the rubble or keep the record of the cornerstone intact.',
        "I'll cross-check your directions against the actual damage. Memory and masonry both have gaps.",
      ],
      reckoning: [
        'The witness beside the wall',
        'The rival fell near a stone that remembers the old crime. I can hear their testimony or keep the patrol away.',
        "I'll ask what they saw themselves, not what the stone says they did.",
      ],
      victory: [
        'A foundation exposed',
        "I'll submit the record publicly, even if the city's founding story doesn't survive it.",
        "I'll help the investigators distinguish evidence from an inherited accusation.",
      ],
      defeat: [
        'A memory mistaken',
        'The stone recalled a different collapse. I followed it and missed someone in this one.',
        "I'll document both accounts so we don't confuse them again.",
      ],
    },
    villain: {
      arrival: [
        'Every stone has a secret',
        'The cornerstone has been speaking for years and the founding families have been pretending not to hear it. I want their secrets from this vault.',
        'I joined to uncover the crime, not to collect blackmail from everyone who lives here.',
      ],
      alarm: [
        'A foundation under pressure',
        'I can listen for the trapped students or preserve the record that gives me leverage over the founders.',
        "I'll keep the weak wall braced while you decide.",
      ],
      reckoning: [
        'A name beneath the mortar',
        'The fallen rival knows the family archive. I can hear their explanation or stop the patrol from reaching it.',
        "I'll take testimony without treating a surname as a conviction.",
      ],
      victory: [
        "The city's buried debt",
        'The founders know their secrets are no longer safe. I need to decide whether to expose them or become another keeper of the archive.',
        "I'll publish my account with the evidence separated from the threats.",
      ],
      defeat: [
        'The silence of rubble',
        "The cornerstone broke and I lost part of its memory. I can't make the past clearer by shaking down another building.",
        "I'll help stabilize the structure before we search for more records.",
      ],
    },
  },
  'psychic-water': {
    hero: {
      arrival: [
        "A tide I didn't choose",
        "The water in this hall is rising with everyone's fear. I need to find the students without trying to carry every feeling at once.",
        "I'll handle the dry route and tell you what I'm feeling in words, if you ask.",
      ],
      alarm: [
        'A boundary in the current',
        'I can steer the flood away from the students or hold it back while we preserve the recorder.',
        "I'll take the other duty. You can say when you need me to take over.",
      ],
      reckoning: [
        "Someone else's sorrow",
        'The fallen rival is frightened. I can offer aid or hold the patrol away from the flood controls.',
        "I'll ask whether they want someone to listen, without opening a mental link.",
      ],
      victory: [
        'The lighthouse stays lit',
        "I'll help my mother find care she chooses. I can love her without trying to be the sea wall for every sorrow.",
        "I'll help you keep a rescue schedule that leaves room for your own life.",
      ],
      defeat: [
        'A wave beyond me',
        "I tried to hold everybody's fear at once and lost track of the actual water. I need a team, not more guilt.",
        "I'll help write down which responsibilities were ours and which weren't.",
      ],
    },
    villain: {
      arrival: [
        'A storm with an audience',
        "The city has ignored too much grief. This vault's coolant system can make the hall feel what I feel.",
        "I want them to understand, but I won't make the students into an audience they cannot leave.",
      ],
      alarm: [
        'A rising tide of anger',
        'I can guide the students out or protect the recorder that shows how the city responds to my storm.',
        "I'll keep the dry route open without asking anyone to share your feelings.",
      ],
      reckoning: [
        'A rival who feels differently',
        "The fallen rival doesn't share my grief. I can hear their account or hold their patrol away from the controls.",
        "They don't have to agree with your feelings to deserve help.",
      ],
      victory: [
        'The sea answers',
        "The city knows how much grief I've been carrying. I still haven't asked whether forcing everyone to share it makes any of us less alone.",
        "I'll record the people who asked for distance, even if you'd rather not hear them.",
      ],
      defeat: [
        'A storm without a harbor',
        'The water escaped the route I intended and my grief did not become any smaller.',
        "I'll help the stranded people without asking them to comfort either of us.",
      ],
    },
  },
  'psychic-discipline': {
    hero: {
      arrival: [
        'A closed library wing',
        "The seal bears the symbol of the mental martial arts school that vanished from our library. Someone is keeping the graduates' records here.",
        "I'll check the catalog for the missing training volumes and keep the route open.",
      ],
      alarm: [
        'The quiet discipline',
        'I can read the movement of the collapsing rigging to reach the students or stay still long enough to recover the school records.',
        "I'll handle the part of the rescue you can't see from your stance.",
      ],
      reckoning: [
        'A surrender before a strike',
        'The rival has fallen and their next move is fear. I can offer sanctuary or hold the patrol away from the records.',
        "I'll ask for their answer out loud. We don't need to read a surrendered mind.",
      ],
      victory: [
        'Lessons in the open stacks',
        "I'll reopen the school as a public class, with rules that students can question and leave.",
        "I'll set out books and accessible practice options, not a secret entrance.",
      ],
      defeat: [
        'A page out of order',
        "I anticipated the fight but not the collapsing hall. The next lesson has to include the people who don't think like a fighter.",
        "I'll ask the librarians what the rescue plan overlooked.",
      ],
    },
    villain: {
      arrival: [
        'The forbidden stacks',
        "The academy's vault holds the school's stolen techniques. I want access to every secret its former masters kept from me.",
        'I want the graduates safe, not a catalogue of people whose minds you can enter.',
      ],
      alarm: [
        'A silent theft',
        'I can escort the students out or preserve the records that tell me which secrets the school taught.',
        "I'll guide the students along an ordinary route without demanding a secret in payment.",
      ],
      reckoning: [
        'A guard with a thought',
        'The fallen rival knows who closed the school. I can listen or keep the patrol from reaching the records.',
        "I'll take their spoken testimony. Their thoughts are not stolen library property.",
      ],
      victory: [
        'No locked doors',
        'The city has seen that its secret rooms cannot stop me. That does not make everything behind those doors mine.',
        "I'll keep a record of what I refused to take.",
      ],
      defeat: [
        'The book closes',
        'The vault is lost, and knowing how a fight begins did not tell me how it would end.',
        "I'll help the injured before looking for another secret to sell.",
      ],
    },
  },
  'psychic-genius': {
    hero: {
      arrival: [
        "An exam I didn't earn",
        "The vault's records include the entrance exams I passed by reading my professors' thoughts. I'm going to recover them without reading another person's answers.",
        "I'll check the records independently. You can earn my trust without knowing what I think.",
      ],
      alarm: [
        'A question with no shortcut',
        "I can coordinate the students' rescue or hold the corridor while we copy the exam records.",
        "I'll ask the students what they need and relay the answers aloud.",
      ],
      reckoning: [
        'A thought is not testimony',
        'The fallen rival knows something about the exam. I can ask them directly or keep the patrol away from the recorder.',
        "I'll witness their answer without letting either of us search their memory.",
      ],
      victory: [
        'A grade worth keeping',
        "I'll admit how I got into the academy and accept whatever honest assessment comes next.",
        "I'll help you study, not feed you the answers.",
      ],
      defeat: [
        'The wrong answer',
        "Knowing what somebody thought didn't tell me what they would do. I need to practice asking, not assuming.",
        "I'll help reconstruct the rescue from the answers people choose to give.",
      ],
    },
    villain: {
      arrival: [
        'The answer key to the city',
        "The vault's records contain more than exam results. I could turn them into a market for the secrets people think are safe.",
        "I joined to investigate the academy's hypocrisy, not to sell everybody's private thoughts.",
      ],
      alarm: [
        'A profitable answer',
        "I can guide the students away or protect the records that expose the people who write the city's rules.",
        "I'll keep the rescue free of any demand for a password or a confession.",
      ],
      reckoning: [
        'A secret that refuses',
        'The fallen rival has knowledge I could use. I can accept their spoken answer or keep the patrol away from the recorder.',
        "I'll protect their right to withhold an answer.",
      ],
      victory: [
        'The highest grade',
        "The academy knows I have the answers it wanted to keep private. It still hasn't agreed that knowing them gives me authority.",
        "I'll publish the account of my own decisions, not the contents of anybody's mind.",
      ],
      defeat: [
        'An incomplete memory',
        "The records are gone and all my remembered answers could not predict the fight. I'm left with the rules I thought I could ignore.",
        "I'll help the survivors without making them explain their private thoughts.",
      ],
    },
  },
  'psychic-birthright': {
    hero: {
      arrival: [
        'The first bell in the vision',
        "I've seen this cracked seal in my vision of prom night. It isn't proof by itself, but it gives us a place to begin.",
        "I'll compare your warning with the actual hall and act on what we can verify.",
      ],
      alarm: [
        'A minute we can change',
        'I can reach the students before the next collapse or preserve the recorder that may substantiate my vision.',
        "I'll take the duty you leave. We don't have to know the future to protect someone now.",
      ],
      reckoning: [
        'The rival not in the prophecy',
        "The fallen rival wasn't in my vision. I can hear their account or keep the patrol from the recorder.",
        "I'll make room for their testimony even if it changes the prediction.",
      ],
      victory: [
        'A future worth warning about',
        "I'll share the verified parts of the warning and keep working on the parts nobody believes yet.",
        "I'll help write an emergency plan that works even if a vision turns out to be wrong.",
      ],
      defeat: [
        'A prophecy incomplete',
        'I saw the disaster and still failed to stop every part of it. The next warning needs more people involved, not a more certain voice.',
        "I'll record what happened and what didn't so the next plan can improve.",
      ],
    },
    villain: {
      arrival: [
        'A warning with a price',
        'The seal matches the vision nobody would believe. Its recorder can prove my warning was real, and this time the city can pay for the next one.',
        "I know what it costs to be ignored, but I won't charge the students for an exit.",
      ],
      alarm: [
        'The future on deposit',
        'I can guide the students out or protect the recorder that makes my next prophecy valuable.',
        "I'll keep the warning channel open to people who can't afford it.",
      ],
      reckoning: [
        'A client outside the forecast',
        'The fallen rival knows something about the coming disaster. I can listen or protect our hold on the records.',
        "I'll take their warning seriously without making them buy a prediction.",
      ],
      victory: [
        'The prophecy market',
        'The city knows I can see dangers it cannot. I still have to decide what happens to a neighbor who cannot pay for the warning.',
        "I'll preserve a public copy of every emergency warning I helped verify.",
      ],
      defeat: [
        'An unpaid tomorrow',
        "The recorder is lost, and a disaster doesn't become less real because nobody paid me to predict it.",
        "I'll help get the warning out anyway.",
      ],
    },
  },
  'psychic-social': {
    hero: {
      arrival: [
        'The correction column',
        "The vault's logs might identify who leaked the secret that ended up in my column. I want to investigate without publishing another person's private life.",
        "I'll keep the sensitive records sealed until we know whose consent is needed.",
      ],
      alarm: [
        'A story without names',
        'I can help the students reach the exit or protect the recorder that could establish who leaked the secret.',
        "I'll count the students without putting their names in a headline.",
      ],
      reckoning: [
        'A private answer',
        'The fallen rival knows part of the story. I can hear what they choose to share or keep the patrol away from the records.',
        "I'll ask whether their account can be quoted before I write it down.",
      ],
      victory: [
        'A correction in my own name',
        "I'll publish the apology for the harm I caused, without repeating the secret. My mistake belongs in the column, not the person's private life.",
        "I'll read the draft for unintended disclosures before you publish it.",
      ],
      defeat: [
        "A rumor I couldn't correct",
        "I followed a thought that turned out to be wrong and missed the rescue route. The next story needs more than a good source in somebody's head.",
        "I'll help gather accounts with permission.",
      ],
    },
    villain: {
      arrival: [
        'The whisper network',
        "The vault's recorder can connect the academy's secrets to every newsroom in Comet City. I can make the city believe whichever story I choose.",
        'I came to investigate the leak, not help you become the next anonymous source of one.',
      ],
      alarm: [
        'A headline on hold',
        "I can guide the students to safety or preserve the records that make tomorrow's headline mine.",
        "I'll keep the exit free of cameras and questions.",
      ],
      reckoning: [
        'An inconvenient source',
        'The fallen rival knows who benefits from the rumor. I can hear their account or hold the patrol off the recorder.',
        "I'll keep their testimony separate from speculation about their thoughts.",
      ],
      victory: [
        'The morning whisper',
        'The city will hear my version before the other witnesses find a microphone. I cannot make it true simply by making it popular.',
        "I'll preserve an independent transcript even if it contradicts the headline.",
      ],
      defeat: [
        'A story without a source',
        'The recorder escaped and my version of events has no proof. I know exactly how much damage a rumor can do.',
        "I'll help the people affected by it, not manufacture a replacement story.",
      ],
    },
  },
}
