import type { Beat } from './firstBellStory'
import type { PersonalBeat } from './accidentArcs'

export const MUTANT_ARCS: Record<
  string,
  Record<'hero' | 'villain', Record<Beat, PersonalBeat>>
> = {
  'mutant-fire': {
    hero: {
      arrival: [
        'A name on the ledger',
        'The seal bears a registration-office mark. Every year they photograph me, and every year I forget a little more.',
        'I brought a notebook. You decide whose names I write in it.',
      ],
      alarm: [
        'Borrowed memories',
        'I can spend a flame on the trapped students or preserve the recorder that proves what they did to my file.',
        'I can take the evacuation route. You do not have to burn for everybody.',
      ],
      reckoning: [
        'One more face',
        'That fallen rival might have a name I will forget tomorrow. I can ask it now or keep the patrol away.',
        'If they consent, I will write their name down. Not for a registry.',
      ],
      victory: [
        'The unregistered rescue',
        'I want to remember the people, not their file numbers. Tomorrow I will ask who needs a witness.',
        'I will read the notebook to you whenever you ask.',
      ],
      defeat: [
        'The blank page',
        'There is a gap in tonight that I cannot fill. I will not pretend the flame saved everyone.',
        'I can tell you what I saw, without telling you what to feel.',
      ],
    },
    villain: {
      arrival: [
        'The archive burns',
        'That vault connects to the registry. I want the city to learn what it is like to have its history taken away.',
        'I came to erase the compulsory files, not the people recorded in them.',
      ],
      alarm: [
        'Paper or people',
        'I can get the students clear of the heat or hold the telemetry that identifies the next archive.',
        'I will keep an exit open even if the registry survives tonight.',
      ],
      reckoning: [
        'A clerk in uniform',
        'The fallen patrol member may have processed my file. I can hear why or press on toward the controls.',
        'I will not burn a witness for having a job.',
      ],
      victory: [
        'Unlisted',
        'The city has seen that its files cannot protect its authority forever. I still have to decide what deserves remembering.',
        'I am keeping my own memories. They are not yours to confiscate.',
      ],
      defeat: [
        'A surviving ledger',
        'The breach put the archive beyond my reach. I cannot set the past right by losing more of it.',
        'I will help the survivors, but I will not help you erase their testimony.',
      ],
    },
  },
  'mutant-air': {
    hero: {
      arrival: [
        'The coat comes off',
        'The air intake has a feather trap like the ones at the harbor. I want the students to see who came to help.',
        'I will watch the stairwell while you scout. You are not our only pair of eyes.',
      ],
      alarm: [
        'Signals from above',
        'The birds can mark a route to the students, or I can keep watch on the sensor recorder.',
        'I can follow your signals, but tell me what they mean before you fly.',
      ],
      reckoning: [
        'A grounded rival',
        'The fallen patrol member is looking up like I used to look at hunters. I could help them or pursue the others.',
        'They cannot follow you into the air. Give them a choice they can actually make.',
      ],
      victory: [
        'Without the coat',
        'I will give my account outside, where the cameras cannot crop out the feathers.',
        'I will stand next to you, not behind a curtain.',
      ],
      defeat: [
        'Blind corner',
        'I saw the roof and missed the floor. Next time we need observers at both heights.',
        'I will volunteer for the ground watch again if you listen.',
      ],
    },
    villain: {
      arrival: [
        'A city of windows',
        'The vault is linked to the fashion-house surveillance feed. My crows can learn more than its owners ever intended.',
        'I want the names of the trappers, not a dossier on every frightened student.',
      ],
      alarm: [
        'The price of a secret',
        'I can guide the students out under the catwalk or preserve the surveillance feed for sale.',
        'I am covering the exit. My neighbors are not inventory.',
      ],
      reckoning: [
        'The watcher watched',
        'The downed rival saw my birds. I can hear their complaint or keep the rest from reaching the feed.',
        'If they agree to talk, I will switch off our receiver first.',
      ],
      victory: [
        'Balcony market',
        'The city knows its windows are no longer private from me. That is leverage, not friendship.',
        'I will not sell the footage of the evacuation.',
      ],
      defeat: [
        'Empty perch',
        'The feed is out of my control and the crows are scattered. I cannot purchase loyalty with another secret.',
        'I will help find the missing crew, not their passwords.',
      ],
    },
  },
  'mutant-earth': {
    hero: {
      arrival: [
        'A tremor under the stage',
        'I recognize the seismic instruments that followed my footsteps through school. There are heartbeats beneath this floor.',
        'I will count the heartbeats with you and keep everyone off the weak span.',
      ],
      alarm: [
        'The weight of a roof',
        "I can lift the trapped students' debris or brace the access route long enough to recover the seismic trace.",
        'Tell me where to wedge the brace. You have carried enough alone.',
      ],
      reckoning: [
        'At eye level',
        'That rival is down and terrified of the floor moving. I can kneel beside them or block their reinforcements.',
        'I will move the debris so they can answer without looking up at you.',
      ],
      victory: [
        'Room in the photograph',
        'No photographer gets to crop me out of this report. The people who helped deserve room in it too.',
        'I will set the camera far enough back for the whole team.',
      ],
      defeat: [
        'The wrong foundation',
        'The stone told me where people were, not what to do. We have to rethink the supports together.',
        'I kept the load readings. We can learn from them without blaming your body.',
      ],
    },
    villain: {
      arrival: [
        'Seismic ownership',
        'The researchers measured my footsteps for years. Tonight their expensive building gets to feel mine.',
        'I agreed to make the researchers answer, not crack a room full of students.',
      ],
      alarm: [
        'The weak span',
        'I can open the rubble exit or keep the seismic record that gives me leverage over their program.',
        'I will mark occupied rooms before you shift another slab.',
      ],
      reckoning: [
        'An unsteady witness',
        'That rival wears a research badge. I could ask who ordered the tracking or drive the rest away.',
        'I will stand between them and the next falling beam if they surrender.',
      ],
      victory: [
        'A city that listens',
        'The board knows that ignoring me carries a cost. Whether they understand the cost to everyone else is another question.',
        'My account will name the residents, not just the research directors.',
      ],
      defeat: [
        'After the shock',
        'The structure failed to obey my calculations. I have made another place that people fear to enter.',
        'I will help shore it up, but not collect a protection fee.',
      ],
    },
  },
  'mutant-water': {
    hero: {
      arrival: [
        'A wet towel on duty',
        'The stage coolant smells like the runoff at our fishing docks. I need to keep my gills wet while we find the source.',
        'I brought a spray bottle and the rescue rope. Signal before you need either.',
      ],
      alarm: [
        'The slowest swimmer',
        'I can move the students through the flooded passage or hold the valve long enough to copy the discharge log.',
        'I will keep the rope taut for the person who cannot swim.',
      ],
      reckoning: [
        'A hand above water',
        'The fallen rival is choking on coolant mist. I can help them breathe or guard the valve from the patrol.',
        'I can get them fresh air while you decide where to move.',
      ],
      victory: [
        'A dockside hearing',
        'The fishers deserve a voice at city hall. I will speak in my own skin, even if I drip on their carpet.',
        "I will bring the crew's accounts, not ask you to represent everyone alone.",
      ],
      defeat: [
        'The ebb',
        'I know how to breathe under water, but I did not get everybody through. Our next plan has to work for dry lungs.',
        'I kept the rope; we can practice the route on the docks.',
      ],
    },
    villain: {
      arrival: [
        'Port closure',
        "The city has ignored the docks for decades. This vault's controls could give the harbor a bargaining position.",
        'Our fishers need clean water, not a blockade that starves their neighbors.',
      ],
      alarm: [
        'A cargo manifest',
        'I can take the students through the wet passage or secure the discharge records before the patrol does.',
        'I will count the evacuated people separately from the cargo.',
      ],
      reckoning: [
        'The customs officer',
        'The downed rival might know who signed the runoff permits. I can offer safe passage or press the patrol back.',
        'Safe passage means safe passage. I will escort them if you agree.',
      ],
      victory: [
        'Harbor terms',
        'The city cannot dismiss the docks as easily now. I need a negotiation that does not turn my neighbors into hostages.',
        'I will insist that the fishing crews choose their own delegates.',
      ],
      defeat: [
        'The broken blockade',
        'I lost control of the valve. The people who depend on the water cannot eat my promises.',
        'I will go back to the docks and help them, with or without you.',
      ],
    },
  },
  'mutant-discipline': {
    hero: {
      arrival: [
        'Four hands, one rhythm',
        "The academy's vault has the recruiter mark from my grandmother's dance school. I know four ways to catch a fall.",
        'I can count the beat for the rescue. You can let me set the pace.',
      ],
      alarm: [
        'The catch',
        "I can carry two students in my arms or hold the passage while we recover the recruiters' records.",
        'I will not ask you to carry all four burdens just because you have four hands.',
      ],
      reckoning: [
        'The step back',
        'The rival has fallen out of the pattern. I can offer a hand or stop the next attack.',
        'I will keep time for a pause, not a finishing blow.',
      ],
      victory: [
        'A dance without a patent',
        'My grandmother taught rescue before the academy offered a contract. I will teach what she taught without licensing it.',
        'I will ask the students what they want to learn first.',
      ],
      defeat: [
        'Lost tempo',
        'I moved fast enough to leave my partner behind. The next rehearsal begins with listening.',
        'I will count us in when we are both ready.',
      ],
    },
    villain: {
      arrival: [
        'Four sleeves of stock',
        "The academy hoarded equipment while calling my grandmother's art a weapon. I can make their vault supply my customers.",
        'I signed up to get stolen equipment back, not distribute it to anyone who pays.',
      ],
      alarm: [
        'An expensive rhythm',
        'I can carry the students away from the rigging or secure the telemetry that identifies the weapons shipment.',
        'I will not let your clients price the students into the shipment.',
      ],
      reckoning: [
        'A disarmed partner',
        'The fallen rival knows the supply chain. I can listen or clear the patrol off the route.',
        'I will handle a surrender without turning it into a sales demonstration.',
      ],
      victory: [
        'An unlicensed dealer',
        'The academy knows it cannot dictate the market alone. I have to live with what customers do with my skill.',
        'I will keep a record of where the weapons go, even if you dislike it.',
      ],
      defeat: [
        'A missed step',
        'The shipment slipped away while I tried to control every move. My grandmother would recognize the mistake.',
        'I will not turn another rehearsal into a raid.',
      ],
    },
  },
  'mutant-genius': {
    hero: {
      arrival: [
        'The unauthorized scan',
        'The vault access code matches the hospital scan invoices. I predicted a collapse, but not who would be standing there.',
        'I will tell you what I actually see, even if it contradicts your forecast.',
      ],
      alarm: [
        'A sixth move',
        'I can reposition the team to evacuate students or protect the recording of the medical deal. I have only one immediate window.',
        'I will take a position you did not calculate if the floor changes.',
      ],
      reckoning: [
        'The unplanned surrender',
        'That rival is down ahead of my schedule. I can accept a new possibility or execute the next move.',
        'Their choice is information, not a mistake in your plan.',
      ],
      victory: [
        'A future with witnesses',
        'I want the rescue plans to outlive me. I will teach how to revise a prediction, not just how to make one.',
        'I will add the things you missed to the training notes.',
      ],
      defeat: [
        'An incomplete forecast',
        'The last move was wrong. I have time to teach somebody why, even if I never get to make it again.',
        'I will help reconstruct it from the things we actually observed.',
      ],
    },
    villain: {
      arrival: [
        'The first domino',
        'The vault holds the trail to the researcher who bought my scans. I can make their entire network collapse on cue.',
        'I came to expose the sale, not make the students part of an experiment.',
      ],
      alarm: [
        'A useful exception',
        'I can remove the students from the chain reaction or capture the timing records that give me the next domino.',
        'I reserve the right to break your plan when a person is in the way.',
      ],
      reckoning: [
        'A variable says no',
        'The fallen rival has stopped playing their assigned part. I can hear the explanation or continue the sequence.',
        'I will not treat a refusal as a malfunction.',
      ],
      victory: [
        'A plan with my name',
        'The city will remember that I could arrange its disasters. I still have to decide what that remembrance is worth.',
        'I will publish my part of the sequence, including the places I refused.',
      ],
      defeat: [
        'Dominoes on the floor',
        'One assumption broke the whole chain. I arranged a disaster and lost my place in it.',
        "I am taking the survivors' observations rather than rewriting the forecast.",
      ],
    },
  },
  'mutant-birthright': {
    hero: {
      arrival: [
        "A shelter's seal",
        "My family's charity crest is on the vault. I need to know what its founders demanded from the guardians who refused.",
        'I will cover the doorway. You can fold your wings without asking permission.',
      ],
      alarm: [
        'A roof of feathers',
        "I can shield the evacuation or guard the record of the family's orders. The wings cannot cover both passages.",
        'I will take the other doorway. Do not make protection a condition of obedience.',
      ],
      reckoning: [
        "The guardian's choice",
        'That fallen rival looks like someone who was told they owe my family loyalty. I can release them or press the advantage.',
        'I will witness their decision, not ask for an oath.',
      ],
      victory: [
        'A new family oath',
        'I want a shelter that can say no to its protector. I will put that into the public report.',
        'I will invite the residents to rewrite the rules themselves.',
      ],
      defeat: [
        'A gap in the wings',
        'The wings were not wide enough. I cannot make every loss into proof that I should rule.',
        'I will help visit the people who were missed, if they want us there.',
      ],
    },
    villain: {
      arrival: [
        'Inheritance of shelter',
        'The family crest on that seal is a title deed to a network of shelters. I intend to make the city honor it.',
        'I accepted a place in your crew, not a hereditary oath.',
      ],
      alarm: [
        'An offer with conditions',
        'I can shield the students while they leave or recover the records that let me command the charity.',
        'I will help the students leave even if none of them pledge loyalty.',
      ],
      reckoning: [
        'A broken oath',
        "The fallen rival refuses my family's authority. I can hear why or drive the patrol away.",
        'A truce is not an oath. I will not pretend the two are the same.',
      ],
      victory: [
        'The inherited city',
        'The crest has weight again. The people beneath my wings still have their own reasons for standing there.',
        'My account will record who chose to stay and who chose to go.',
      ],
      defeat: [
        'An empty throne',
        "The seal is lost and my family's name did not save the squad. I cannot inherit their willingness.",
        'I will help the people in the shelters regardless of who signs the deed.',
      ],
    },
  },
  'mutant-social': {
    hero: {
      arrival: [
        'The patch stays on',
        "The vault's ventilation looks designed to distribute my pheromones. I want to prove I can help without borrowing anyone's trust.",
        'I will wear a filter and tell you my decision in plain words.',
      ],
      alarm: [
        'A negotiated exit',
        'I can guide the trapped students out without removing the patch or hold the corridor to recover the ventilation record.',
        'I will ask each person before guiding them. No automatic agreement.',
      ],
      reckoning: [
        'Trust after a fall',
        'The fallen rival can refuse my help. I can offer it or keep the remaining patrol away.',
        'I will ask them myself with my filter on, so their answer stays theirs.',
      ],
      victory: [
        'A friend by choice',
        'I am keeping the patch on for the interview. The city can decide what it thinks of me without chemistry.',
        'I will sit beside you because I chose to, not because you asked me to prove it.',
      ],
      defeat: [
        'The unanswered handshake',
        'I cannot make people trust a failed rescue. I can tell them what I did and accept the answer.',
        'I will help write the report without trying to make it charming.',
      ],
    },
    villain: {
      arrival: [
        'A room full of friends',
        'The ventilation controls could put my influence into every corridor. I want the city offices to stop questioning my requests.',
        'I agreed to work with you while wearing a filter. That agreement is not transferable.',
      ],
      alarm: [
        'An easy yes',
        'I can clear the students with an ordinary evacuation or preserve the ventilation trace that makes the city listen.',
        'I will take the ordinary exit whether or not your contacts approve.',
      ],
      reckoning: [
        'A friend who says no',
        'The fallen rival resisted the influence. I could hear their refusal or secure the room before the others follow it.',
        'I will protect their right to say no, even if it costs me a place in this crew.',
      ],
      victory: [
        'A borrowed majority',
        'The city knows how quickly people can agree with me. I cannot tell which of the cheers belong to me.',
        'My report will be written away from the ventilation system.',
      ],
      defeat: [
        'The filter holds',
        'The controls are lost and the friendly voices have gone quiet. I do not know who will answer my call.',
        'I will answer if you keep the patch on.',
      ],
    },
  },
}
