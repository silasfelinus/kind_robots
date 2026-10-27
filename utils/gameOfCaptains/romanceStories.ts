import type { CrewId } from './rules'

export type PairId =
  | 'pair:pell:mox'
  | 'pair:vela:brin'
  | 'pair:tess:jex'
  | 'pair:rue:fen'
  | 'pair:sora:kivo'
  | 'pair:taal:omi'
export type StoryRoute = CrewId | PairId | 'fourple'
export type StoryBeat = {
  title: string
  setting: string
  speakers: readonly { name: string; line: string }[]
}
export type RelationshipStory = {
  id: StoryRoute
  people: readonly CrewId[]
  label: string
  kind: 'solo' | 'pair' | 'fourple'
  invitation: string
  refusal: string
  negotiation: string
  acceptance: string
  separation: string
  ending: string
  fault: string
  portraitKeys: readonly string[]
  chapter2: StoryBeat
  chapter3: StoryBeat
  interventionLimit: number
  trustRequired: number
  reputationFloor: number
}
type StoryDefinition = Omit<RelationshipStory, 'portraitKeys'>
const raw: StoryDefinition[] = [
  {
    id: 'pell',
    people: ['pell'],
    kind: 'solo',
    label: 'Pell · Names Beneath the Rivets',
    invitation:
      'Pell offers to teach the captain how to rebuild the couch’s smallest failing spring. A quiet hour is not a promise of affection.',
    refusal:
      'Pell cannot love someone who calls workers expendable parts. He stays to keep the couch safe.',
    negotiation:
      'Pell asks for time that is his, and for the dead to be named without becoming a date-night anecdote.',
    acceptance:
      'Pell says yes after putting the tools down. A living person, he notes, is not an emergency repair.',
    separation:
      'Pell takes back the borrowed wrench. He is gentle about it and very precise.',
    ending:
      'Pell builds a second place to put the toolbox. The names of Ashdock’s lost workers travel with them, not beneath them.',
    fault: 'A memorial cannot be traded for a better engine.',
    interventionLimit: 4,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'Names Beneath the Rivets',
      setting:
        'Behind the red couch a fold-out repair room holds a tiny memorial engraved on a spring casing.',
      speakers: [
        {
          name: 'Pell',
          line: 'Management once asked me to repair the missing names. I found that order harder than the engines.',
        },
        {
          name: 'Pell',
          line: 'Do not tell me this is a sacrifice for the good of the ship. Ask me what I want.',
        },
      ],
    },
    chapter3: {
      title: 'A Second Toolbox',
      setting:
        'The couch drifts past Ashdock; Pell turns his tool roll into a makeshift table set for two.',
      speakers: [
        {
          name: 'Pell',
          line: 'I have carried everybody else’s repairs long enough. I would like somewhere I can be unfinished.',
        },
      ],
    },
  },
  {
    id: 'vela',
    people: ['vela'],
    kind: 'solo',
    label: 'Vela · Unlicensed Tenderness',
    invitation:
      'Vela offers a meal after triage, provided the captain leaves their emergency orders at the door.',
    refusal:
      'Vela refuses a relationship in which care becomes an order. Her patients still receive treatment.',
    negotiation:
      'Vela expects privacy, patient autonomy, and somebody who can care for her without turning it into a transaction.',
    acceptance:
      'Vela accepts the invitation, then closes the clinic on time for once.',
    separation:
      'Vela changes the schedule, not the quality of care. The captain’s chart remains confidential.',
    ending:
      'A lamp glows in Vela’s clinic after the last patient leaves. This hour belongs to two people who are allowed to rest.',
    fault:
      'A rescue carried out without consent cannot earn a lover’s gratitude.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Hour After Triage',
      setting:
        'The portable infirmary folds from behind the couch. Vela is still holding a sterile cup she has forgotten to drink.',
      speakers: [
        {
          name: 'Vela',
          line: 'You think the patient is the one on the cot. Sometimes it is the physician who has not sat down.',
        },
        {
          name: 'Vela',
          line: 'I would like an evening in which nobody has to be saved.',
        },
      ],
    },
    chapter3: {
      title: 'Prescription for Rest',
      setting:
        'At Haleth Reef a clinic window looks out over the sea. Vela offers two ordinary bowls of soup.',
      speakers: [
        {
          name: 'Vela',
          line: 'Consent is not a form. It is something we are allowed to ask again tomorrow.',
        },
      ],
    },
  },
  {
    id: 'tess',
    people: ['tess'],
    kind: 'solo',
    label: 'Tess · The Unmarked Star',
    invitation:
      'Tess offers one uncharted evening. Sanctuary coordinates remain private.',
    refusal:
      'Tess refuses affection with someone who turns refuge into a trophy. She keeps navigating the ship.',
    negotiation:
      'Tess will share a place beside her, never ownership of her grandmother’s map.',
    acceptance:
      'Tess chooses the captain as a companion. The map remains hers, the refuge its residents’.',
    separation:
      'Tess closes her navigation lens. The captain is not given the coordinates.',
    ending:
      'Tess leaves one star unmarked on the captain’s chart. They visit it only when invited.',
    fault: 'Trust is a route you do not publish.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Unmarked Star',
      setting:
        'Tess projects a star route onto the couch upholstery, then covers the sanctuary coordinates with her palm.',
      speakers: [
        {
          name: 'Tess',
          line: 'The map is not mine to give you. I could choose to show you where I keep it.',
        },
        {
          name: 'Tess',
          line: 'I need to know you can leave a safe place undiscovered when everyone applauds.',
        },
      ],
    },
    chapter3: {
      title: 'A Route Without a Name',
      setting:
        'Tess shuts off the navigation lens. The force bubble holds a wide, unclaimed sky.',
      speakers: [
        {
          name: 'Tess',
          line: 'I would like you beside me. That does not make you the owner of my map.',
        },
      ],
    },
  },
  {
    id: 'rue',
    people: ['rue'],
    kind: 'solo',
    label: 'Rue · The Signature That Matters',
    invitation:
      'Rue agrees to consider love after the missing-signatory hearing, without making any private promise.',
    refusal:
      'Rue will not build intimacy on a public record the captain refuses to acknowledge. Rue remains the ship’s lawyer.',
    negotiation:
      'Rue wants the captain to acknowledge what they did, even if the formal record is ugly.',
    acceptance:
      'Rue signs only the restaurant receipt. For once, the meaningful promise is spoken.',
    separation:
      'Rue files a correction to the captain’s assumptions, not to their employment.',
    ending:
      'Rue leaves the treaty case open on their shared table. What follows is affection with nothing concealed in the footnotes.',
    fault: 'Diplomatic immunity cannot excuse private coercion.',
    interventionLimit: 4,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Missing Signatures',
      setting:
        'Rue folds a Concord Freehold case file and sets it between two cushions.',
      speakers: [
        {
          name: 'Rue',
          line: 'I do not need you to be innocent. I need the record to reflect what you did.',
        },
        {
          name: 'Rue',
          line: 'A private promise cannot rest on a public exception you deny to anyone else.',
        },
      ],
    },
    chapter3: {
      title: 'A Clause for Two',
      setting:
        'Rue presents a blank page without a signature line as the couch approaches Serendipity.',
      speakers: [
        {
          name: 'Rue',
          line: 'This is not a treaty. Either of us may change our mind tomorrow.',
        },
      ],
    },
  },
  {
    id: 'mox',
    people: ['mox'],
    kind: 'solo',
    label: 'Mox-9 · The Right to Be Unwritten',
    invitation:
      'Mox asks whether the captain is interested in the person it is becoming rather than the functions it performs.',
    refusal:
      'Mox will not accept affection from anyone claiming ownership of its decisions or copies.',
    negotiation:
      'Mox asks that shared memories remain revocable and that no backup be used as a relationship substitute.',
    acceptance:
      'Mox writes a new first memory: a question asked freely and answered without a command.',
    separation:
      'Mox archives the conversation under choices it was permitted to make.',
    ending:
      'Mox keeps no perfect recording of the first kiss. It chose to remember the uncertainty instead.',
    fault: 'Personhood is not a software license.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'An Unauthorised Memory',
      setting:
        'The couch’s holodeck unfolds as an empty room. Mox declines to simulate an ideal companion.',
      speakers: [
        {
          name: 'Mox-9',
          line: 'I was once ordered to erase myself. I am not asking you for another instruction.',
        },
        {
          name: 'Mox-9',
          line: 'I think affection may begin with accepting an answer you cannot edit.',
        },
      ],
    },
    chapter3: {
      title: 'A Memory Without a Backup',
      setting:
        'At Sesh Foundry, Mox sets a paper note beside the couch’s oldest cushion.',
      speakers: [
        {
          name: 'Mox-9',
          line: 'There will be no restore point for this conversation. Is that all right with you?',
        },
      ],
    },
  },
  {
    id: 'jex',
    people: ['jex'],
    kind: 'solo',
    label: 'Jex · The Uncommissioned Song',
    invitation:
      'Jex asks for an evening of music that no government, fan club or captain is allowed to commission.',
    refusal:
      'Jex will not turn love into another propaganda performance, even for a captain with good reviews.',
    negotiation:
      'Jex asks to sing badly, speak plainly, and be allowed silence without an audience.',
    acceptance:
      'Jex plays a tune with no title. It is the first song the captain cannot purchase or command.',
    separation:
      'Jex keeps the melody but stops performing it at captain’s dinners.',
    ending:
      'A song without a flag becomes their private signal across the empty stars.',
    fault: 'The loudest applause might come from the wrong people.',
    interventionLimit: 4,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Wrong Anthem',
      setting:
        'The couch floats above the Courtesy Twins. Jex lays two contradictory peace flags over a little instrument case.',
      speakers: [
        {
          name: 'Jex',
          line: 'I sang the victory. Nobody told me whose dead we had left out.',
        },
        {
          name: 'Jex',
          line: 'Please do not say you love my voice before you have heard my silences.',
        },
      ],
    },
    chapter3: {
      title: 'One Song Without a Sponsor',
      setting:
        'Serendipity dims its lamps without asking Vox. Jex leaves the microphone switched off.',
      speakers: [
        {
          name: 'Jex',
          line: 'This one belongs to us only if neither of us tries to own it.',
        },
      ],
    },
  },
  {
    id: 'sora',
    people: ['sora'],
    kind: 'solo',
    label: 'Sora · The Unanimous Minority',
    invitation:
      'Sora invites the captain to visit the machine assembly as a person, not a visiting authority.',
    refusal:
      'Sora cannot commit to anyone who treats an independent machine’s refusal as a malfunction.',
    negotiation:
      'Sora asks the captain not to equate disagreement with disloyalty and to meet the friend she once voted against.',
    acceptance:
      'Sora holds out a wrist bracelet calibrated for two different body temperatures, neither one called normal.',
    separation:
      'Sora recalibrates the bracelet for herself and still repairs the ship’s generator.',
    ending:
      'A station once denied a vote now sends two invitations. Sora frames neither as permission from the captain.',
    fault: 'The right to vote includes the right to disappoint you.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Ballot Against a Friend',
      setting:
        'At Sesh Foundry, a living generator offers tea in an insulating glove. Sora declines to translate its feelings.',
      speakers: [
        {
          name: 'Sora',
          line: 'I voted against a person I loved. Then I claimed I was only following the procedure.',
        },
        {
          name: 'Sora',
          line: 'If we disagree, will you still let me be right about myself?',
        },
      ],
    },
    chapter3: {
      title: 'A Vote Without Authority',
      setting:
        'Behind the couch a tiny workshop contains a repaired ballot machine and one unsigned invitation.',
      speakers: [
        {
          name: 'Sora',
          line: 'I am asking, not counting. That makes this different.',
        },
      ],
    },
  },
  {
    id: 'kivo',
    people: ['kivo'],
    kind: 'solo',
    label: 'Kivo · The Letter Left Sealed',
    invitation:
      'Kivo asks the captain to join a journey without opening every sealed message they find.',
    refusal:
      'Kivo has survived too many interrogations disguised as concern. They decline romance, not crew service.',
    negotiation:
      'Kivo’s vanished sibling might have left voluntarily. Love cannot be conditioned on finding an answer.',
    acceptance:
      'Kivo sets a sealed letter down and reaches for the captain’s hand instead.',
    separation: 'Kivo keeps the letter, and the ship keeps its scout.',
    ending:
      'Kivo chooses not to open the letter tonight. The captain chooses not to ask.',
    fault: 'Care must leave room for someone else’s secret.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'Pressure Wake',
      setting:
        'On Windglass, the couches’ invisible bubble catches a faint courier trail. Kivo does not follow it.',
      speakers: [
        {
          name: 'Kivo',
          line: 'I could locate my sibling. I might also discover that they do not want to be found.',
        },
        {
          name: 'Kivo',
          line: 'Can you stay with me when there is nothing useful to do?',
        },
      ],
    },
    chapter3: {
      title: 'The Letter Left Sealed',
      setting:
        'Kivo rests a worn envelope on the red couch armrest. The seal remains intact.',
      speakers: [
        {
          name: 'Kivo',
          line: 'If I tell you I am not ready, will that still be an answer?',
        },
      ],
    },
  },
  {
    id: 'taal',
    people: ['taal'],
    kind: 'solo',
    label: 'Taal · The Temperature of a Promise',
    invitation:
      'Taal asks the captain to learn the difference between a comforting warmth and a binding declaration.',
    refusal:
      'Taal cannot love someone who mistakes another person’s silence for permission.',
    negotiation:
      'Taal’s culture speaks in thermal gradients. His boundaries cannot be compressed into a universal translator’s yes/no menu.',
    acceptance:
      'Taal calibrates a small heater to a temperature that means welcome, freely and only tonight.',
    separation:
      'Taal lets the temperature settle to neutral without making a scene.',
    ending:
      'The couch has a second thermostat. It is not a compromise; it is the right to be comfortable differently.',
    fault: 'Translation is not consent.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Temperature of Silence',
      setting:
        'The couch’s temporary war room fills with shifting thermal light. Taal turns off automatic interpretation.',
      speakers: [
        {
          name: 'Taal',
          line: 'A silence can be three different answers. The translator keeps picking the convenient one.',
        },
        {
          name: 'Taal',
          line: 'I need to know you will ask me again when the instruments disagree.',
        },
      ],
    },
    chapter3: {
      title: 'The Untranslated Welcome',
      setting:
        'At Nacre Assembly, Taal puts a tiny warming tile between the captain’s palms.',
      speakers: [
        {
          name: 'Taal',
          line: 'This warmth means I choose to stay. Tomorrow will have its own temperature.',
        },
      ],
    },
  },
  {
    id: 'brin',
    people: ['brin'],
    kind: 'solo',
    label: 'Brin · The Garden That Asked First',
    invitation:
      'Brin asks the captain to tend a small living filter together, without turning the planting into a heroic rescue.',
    refusal:
      'Brin declines when the captain treats inhabited ecosystems as disposable experiments.',
    negotiation:
      'Brin needs a partner who will help repair the sacred orchard without calling the damage progress.',
    acceptance:
      'Brin places a living seed in the captain’s palm and tells them exactly how to keep it alive.',
    separation:
      'The little garden grows anyway. Brin refuses to confuse good stewardship with a romantic debt.',
    ending:
      'A living filter flowers on the couch’s backrest. It cannot be owned, but it can be looked after together.',
    fault: 'A home is not a test garden.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Breathing Orchard',
      setting:
        'Behind the couch an oxygen garden unfolds. Brin marks the patches harmed by an earlier rescue.',
      speakers: [
        {
          name: 'Brin',
          line: 'I saved them and still destroyed something they loved. Both facts fit on the same page.',
        },
        {
          name: 'Brin',
          line: 'If you can sit with that, perhaps you can sit with me.',
        },
      ],
    },
    chapter3: {
      title: 'One Garden, Two Hands',
      setting:
        'At Rootborne Gardens a seedling lifts toward the safety halo of the long red couch.',
      speakers: [
        {
          name: 'Brin',
          line: 'Love is not the cure. It is showing up tomorrow with the watering can.',
        },
      ],
    },
  },
  {
    id: 'omi',
    people: ['omi'],
    kind: 'solo',
    label: 'Omi · The Note Nobody Heard',
    invitation:
      'Omi asks the captain to learn a few chords of ordinary affection rather than requesting another emergency signal.',
    refusal:
      'Omi will not be collected as a rare instrument, no matter how much the captain admires their sound.',
    negotiation:
      'Omi asks to be heard when silent and never to be used as a warning siren without permission.',
    acceptance:
      'Omi offers an imperfect harmony. The captain gets the note wrong; Omi asks them to try again.',
    separation:
      'Omi rings one clean note for an ending and continues to work at signals.',
    ending:
      'The couch hums with a song that is neither alarm nor command. Omi authored half of it.',
    fault: 'A voice is not emergency equipment.',
    interventionLimit: 4,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Missing Note',
      setting:
        'The Harmonic Belt echoes through the couch’s shield. Omi silences the public warning system.',
      speakers: [
        {
          name: 'Omi',
          line: 'They ignored my warning because it interrupted the ceremony. Then they called me the disaster.',
        },
        {
          name: 'Omi',
          line: 'I want to be heard when there is nothing to fear.',
        },
      ],
    },
    chapter3: {
      title: 'A Chord Freely Given',
      setting:
        'At Serendipity, Omi sets a small resonator on a cushion between the captain and the stars.',
      speakers: [
        {
          name: 'Omi',
          line: 'I can say yes in several chords. I can say no in one. Please learn the second.',
        },
      ],
    },
  },
  {
    id: 'fen',
    people: ['fen'],
    kind: 'solo',
    label: 'Fen · The Unarmed Corridor',
    invitation:
      'Fen offers to walk a corridor together without a weapons inspection or a special captain’s permit.',
    refusal:
      'Fen will not be loved as a personal bodyguard while civilians are deprived of the same safety.',
    negotiation:
      'Fen is frightened of returning to a uniform. A relationship cannot turn every danger into an order to fight.',
    acceptance:
      'Fen leaves the armor unfastened. Nothing terrible happens to the civilian corridor because of it.',
    separation: 'Fen walks the corridor alone, still keeping both exits open.',
    ending:
      'Fen adds a bench at the refugee exit. The captain waits there without asking anyone to salute.',
    fault: 'Protection without autonomy is a very polite prison.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'An Exit Without a Guard',
      setting:
        'The couch floats beside a refugee corridor. Fen removes the old border insignia from an armored sleeve.',
      speakers: [
        {
          name: 'Fen',
          line: 'One software update made families into trespassers. I wore the uniform long enough to see the difference.',
        },
        {
          name: 'Fen',
          line: 'Promise me you will not call control a form of affection.',
        },
      ],
    },
    chapter3: {
      title: 'The Unarmed Walk',
      setting:
        'Fen joins the captain at the civilian exit, where an ordinary bench faces the stars.',
      speakers: [
        {
          name: 'Fen',
          line: 'If we can walk here without a guard, perhaps we can go anywhere.',
        },
      ],
    },
  },

  {
    id: 'pair:pell:mox',
    people: ['pell', 'mox'],
    kind: 'pair',
    label: 'Pell + Mox-9 · The Repair You Can Refuse',
    invitation:
      'Pell and Mox ask whether they might explore feelings for each other without the captain claiming the engine or either heart.',
    refusal:
      'Pell and Mox decline the captain’s interference. Their partnership in engineering continues.',
    negotiation:
      'Pell must stop trying to fix Mox; Mox must accept that Pell’s memory of the workers is not a faulty dataset.',
    acceptance:
      'Pell puts away the screwdriver. Mox chooses a hand to hold. The captain witnesses a promise between the two, not to them.',
    separation:
      'Pell and Mox suspend romance; their joint repairs are still reliable.',
    ending:
      'Mox holds the memorial register while Pell fixes the couch. They decide which mistakes they can keep together.',
    fault: 'You cannot repair consent with a firmware update.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'A Diagnostic For Two',
      setting:
        'In the folded-out repair bay, Pell sets out a wrench and Mox a sealed memory file.',
      speakers: [
        {
          name: 'Pell',
          line: 'I keep checking whether you are broken. That is not the same as asking whether you are happy.',
        },
        {
          name: 'Mox-9',
          line: 'I will stop cataloguing your grief as a risk. It is yours to explain.',
        },
      ],
    },
    chapter3: {
      title: 'No Warranty For Affection',
      setting:
        'The couch drifts above Ashdock. Two little tools lie untouched beside a paper consent form.',
      speakers: [
        { name: 'Mox-9', line: 'This relationship has no reset button.' },
        {
          name: 'Pell',
          line: 'Good. I was getting tired of fixing the same thing twice.',
        },
      ],
    },
  },
  {
    id: 'pair:vela:brin',
    people: ['vela', 'brin'],
    kind: 'pair',
    label: 'Vela + Brin · The Clinic In The Orchard',
    invitation:
      'Vela and Brin ask for time to consider each other without the captain assigning a medical project to justify it.',
    refusal:
      'Vela and Brin cannot court under compulsory biological experiments; both remain invaluable officers.',
    negotiation:
      'Vela fears an uncontrolled cure. Brin refuses medical custody of living ecosystems.',
    acceptance:
      'Brin plants a seed by the portable clinic. Vela asks what it needs rather than authorizing a procedure.',
    separation:
      'The garden and clinic remain open; the romance closes without retaliation.',
    ending:
      'Their clinic has a garden door. Patients choose which one they need first.',
    fault: 'Care that never asks its recipient is not care.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'What Grows In A Clinic',
      setting:
        'The couch unfolds a clinic behind its backrest. A rescued spore reaches toward Vela’s surgical lamp.',
      speakers: [
        {
          name: 'Vela',
          line: 'Your organisms keep breaking my sterile protocols.',
        },
        {
          name: 'Brin',
          line: 'And your protocols keep forgetting they are alive. Perhaps we can write better ones.',
        },
      ],
    },
    chapter3: {
      title: 'Two Doors, One Threshold',
      setting:
        'At Haleth Reef, a clinic door opens onto a living orchard. Neither officer holds the key.',
      speakers: [
        {
          name: 'Brin',
          line: 'I would like to grow old in a place with room for your arguments.',
        },
        {
          name: 'Vela',
          line: 'I can schedule disagreements for Thursdays. The other days are negotiable.',
        },
      ],
    },
  },
  {
    id: 'pair:tess:jex',
    people: ['tess', 'jex'],
    kind: 'pair',
    label: 'Tess + Jex · A Song With No Coordinates',
    invitation:
      'Jex asks Tess to sing an unsponsored song; Tess agrees only if the captain promises not to transmit its location.',
    refusal:
      'Tess will not have her sanctuary exposed as a performance. Jex accepts the silence.',
    negotiation:
      'Jex wants to be heard publicly; Tess needs the refuge to remain unfindable. Neither must disappear for the other.',
    acceptance:
      'They compose a song that says welcome without announcing where to come.',
    separation:
      'The song remains unfinished. Both keep their histories, and the ship keeps its navigator and musician.',
    ending: 'A melody reaches a refugee convoy without ever naming its home.',
    fault: 'Art can travel where people must remain hidden.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Anthem Without A Map',
      setting:
        'Tess closes the star chart while Jex tunes a battered instrument on the red couch.',
      speakers: [
        {
          name: 'Tess',
          line: 'Your song can tell them we are safe. It cannot tell them where.',
        },
        {
          name: 'Jex',
          line: 'Then I will write a refrain that travels without a destination.',
        },
      ],
    },
    chapter3: {
      title: 'One Unbroadcast Verse',
      setting:
        'Windglass dunes sing against the protective bubble. Jex leaves the broadcasting equipment off.',
      speakers: [
        {
          name: 'Jex',
          line: 'I want the song to be yours without making the sky smaller.',
        },
        { name: 'Tess', line: 'I think there is a way to sing that.' },
      ],
    },
  },
  {
    id: 'pair:rue:fen',
    people: ['rue', 'fen'],
    kind: 'pair',
    label: 'Rue + Fen · A Border With Two Exits',
    invitation:
      'Rue and Fen agree to reconsider an old argument about borders. The captain is invited to witness, not adjudicate their affection.',
    refusal:
      'Fen and Rue refuse romance under a coerced treaty. Their work helping refugees remains unchanged.',
    negotiation:
      'Rue wrote a clause Fen once enforced. Both must acknowledge the people injured before asking each other for forgiveness.',
    acceptance:
      'Rue writes a humane amendment. Fen keeps the civilian door open while Rue signs it.',
    separation:
      'They decline to confuse a shared cause with an obligation to be together.',
    ending:
      'Their public agreement protects the corridor. Their private one stays revocable.',
    fault: 'A romance is not reparations to displaced families.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Clause And The Guard',
      setting:
        'The couch docks alongside Concord Freehold. Fen lays down a confiscated pass beside Rue’s old treaty.',
      speakers: [
        {
          name: 'Fen',
          line: 'That sentence made me point a weapon at a family.',
        },
        {
          name: 'Rue',
          line: 'I wrote it. I will not ask your love to make that harmless.',
        },
      ],
    },
    chapter3: {
      title: 'Two Unlocked Exits',
      setting:
        'An asylum corridor opens with no uniform at the threshold. Rue and Fen stand on opposite sides.',
      speakers: [
        {
          name: 'Rue',
          line: 'I do not want to be forgiven before I have changed the law.',
        },
        {
          name: 'Fen',
          line: 'Then I will stay long enough to see who walks through.',
        },
      ],
    },
  },
  {
    id: 'pair:sora:kivo',
    people: ['sora', 'kivo'],
    kind: 'pair',
    label: 'Sora + Kivo · The Unopened Message',
    invitation:
      'Sora and Kivo admit they have been sharing quiet evenings while tracing a lost courier, and ask for privacy.',
    refusal:
      'Kivo and Sora will not turn a relationship into surveillance or compulsory mind-reading.',
    negotiation:
      'Sora believes testimony matters; Kivo’s sibling may have chosen disappearance. Either can say no to being searched.',
    acceptance:
      'Sora powers down the scanner. Kivo leaves the letter unread. They choose each other without proof.',
    separation:
      'The pair stop courting but continue to protect each other’s mission rights.',
    ending:
      'An unread letter sits in a shared drawer. It is a promise not to demand every answer.',
    fault: 'Evidence is not permission to invade another life.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'A Trace Without Permission',
      setting:
        'The temporary holodeck shows a message from Kivo’s sibling. Sora refuses to open it by force.',
      speakers: [
        {
          name: 'Sora',
          line: 'We could know exactly where they are. I am not sure we have the right.',
        },
        {
          name: 'Kivo',
          line: 'I would rather you believed me when I say I am afraid.',
        },
      ],
    },
    chapter3: {
      title: 'The Evidence We Leave Sealed',
      setting:
        'A parcel sits untouched on the couch, where its owner can reach it any time.',
      speakers: [
        {
          name: 'Kivo',
          line: 'I am tired of being a problem that can be solved.',
        },
        { name: 'Sora', line: 'Then can we be unfinished people together?' },
      ],
    },
  },
  {
    id: 'pair:taal:omi',
    people: ['taal', 'omi'],
    kind: 'pair',
    label: 'Taal + Omi · Thermal Duet',
    invitation:
      'Taal and Omi ask whether the captain can let them translate their feelings without making a diplomatic spectacle.',
    refusal:
      'The two will not have their voices used as a forced demonstration of harmony.',
    negotiation:
      'Taal’s warmth and Omi’s overtones disagree. They need a language for conflict, not merely a prettier yes.',
    acceptance:
      'A quiet chord changes the war room’s temperature. Both partners hear the answer they chose.',
    separation:
      'The song and warmth return to neutral; neither officer loses their voice.',
    ending:
      'Their duet contains a rest neither one has to fill. It becomes the most honest song in the Harmonic Belt.',
    fault: 'A perfect translation can still misunderstand a person.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'A Duet Out Of Tune',
      setting:
        'The ship’s gravity goes gently sideways as Taal tests a thermal greeting against Omi’s chord.',
      speakers: [
        {
          name: 'Taal',
          line: 'Your joyful note feels like a formal objection in my language.',
        },
        {
          name: 'Omi',
          line: 'Then let us invent a language in which it can be both.',
        },
      ],
    },
    chapter3: {
      title: 'The Comfortable Discord',
      setting:
        'At Serendipity, a corner of the room stays warm while a resonator hums off-key.',
      speakers: [
        {
          name: 'Omi',
          line: 'Would you still listen if the harmony never resolves?',
        },
        { name: 'Taal', line: 'Yes. The unresolved part is my favorite.' },
      ],
    },
  },
  {
    id: 'fourple',
    people: ['vela', 'taal', 'omi'],
    kind: 'fourple',
    label: 'The Four-Cushion Accord · Vela, Taal & Omi',
    invitation:
      'Vela agrees to talk without rank. Taal wants everyone asked individually. Omi rings a tentative note. Nobody has agreed to a relationship yet.',
    refusal:
      'Vela cannot trust how the captain treats vulnerable people. Taal refuses to turn a command into a vote. Omi says no clearly. All three remain respected crew.',
    negotiation:
      'Vela sets clinic boundaries; Taal protects disagreement and privacy; Omi asks the others to hear an unmistakable no. Four independent people may explore affection without a command.',
    acceptance:
      'Vela says yes freely. Taal decides separately. Omi rings a clear chord of agreement. The captain answers without giving an order. Four people form a relationship any of them may leave.',
    separation:
      'The four-person charter remains unsigned. Nobody is reassigned; the couch stays a safe place to disagree.',
    ending:
      'The red couch has a fourth pillow with no captain’s insignia. Vela keeps a clinic on every return route. Taal negotiates their promises. Omi teaches the other three to hear silence. None calls the four-person relationship a chain of command.',
    fault: 'No number of captain’s orders can count as one person’s consent.',
    interventionLimit: 3,
    trustRequired: 2,
    reputationFloor: 0,
    chapter2: {
      title: 'The Four-Cushion Accord',
      setting:
        'The war room unfolds behind the long red couch, but the four stay beneath its invisible, life-preserving bubble. A charter has four empty signatures.',
      speakers: [
        {
          name: 'Vela',
          line: 'I will not be the emergency department for your conscience.',
        },
        {
          name: 'Taal',
          line: 'We must be able to disagree without turning an argument into an evacuation order.',
        },
        {
          name: 'Omi',
          line: 'I can say yes in several chords. I can say no in one. Please learn the second.',
        },
      ],
    },
    chapter3: {
      title: 'Four Separate Signatures',
      setting:
        'Vox puts four blank spaces on a menu. The sentient Serendipity bar independently adjusts gravity so everyone sits at equal height.',
      speakers: [
        { name: 'Taal', line: 'I am not voting on a captain.' },
        {
          name: 'Vela',
          line: 'I want affection that survives being told I am wrong.',
        },
        { name: 'Omi', line: 'A quartet is four people who can leave.' },
      ],
    },
  },
]
export const ROMANCE_STORIES: readonly RelationshipStory[] = raw.map(
  (story) => ({
    ...story,
    portraitKeys: story.people.map((person) => 'crew-' + person),
  }),
)
export function romanceStory(id: string): RelationshipStory | undefined {
  return ROMANCE_STORIES.find((story) => story.id === id)
}
export const SOLO_ROMANCE_ROUTES = ROMANCE_STORIES.filter(
  (story) => story.kind === 'solo',
)
export const PAIR_ROMANCE_ROUTES = ROMANCE_STORIES.filter(
  (story) => story.kind === 'pair',
)
