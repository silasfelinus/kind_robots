import type { Beat } from './firstBellStory'
import type { PersonalBeat } from './accidentArcs'

export const MAGIC_ARCS: Record<
  string,
  Record<'hero' | 'villain', Record<Beat, PersonalBeat>>
> = {
  'magic-fire': {
    hero: {
      arrival: [
        'A borrowed voice',
        'The seal smells of old candle wax. My salamander recognizes the spell, but I want to hear what it knows before I bargain again.',
        "I'll carry the spare lantern. Neither of you has to burn just because we asked.",
      ],
      alarm: [
        'Two flames, one wick',
        'I can light a path out for the students or hold the ward open long enough to read its inscription.',
        "I'll take the darker passage if the spirit needs time to answer.",
      ],
      reckoning: [
        'A curse on the uniform',
        'The fallen rival is under a binding charm. I can offer to lift it or keep the patrol away from the seal.',
        "Ask before you touch the charm. They might need it for something we don't understand.",
      ],
      victory: [
        'A library card for two',
        "I'll rewrite our bargain as a partnership. The salamander gets a voice of its own, not another century inside a candle.",
        "I'll witness both signatures, even if one is a scorch mark.",
      ],
      defeat: [
        'The guttering candle',
        'The flame went out before everyone was clear. I need to know why the spirit hesitated, not demand that it obey next time.',
        "I'll help look for the missing students without asking either of you to break the bargain.",
      ],
    },
    villain: {
      arrival: [
        'A courthouse in miniature',
        'The ward on that vault is the kind of magic the courts confiscated from my shop. The salamander wants the institution to feel its own heat.',
        'I agreed to confront the judges, not to let a spirit decide who deserves burning.',
      ],
      alarm: [
        'The price of a wick',
        'I can lead the students away or keep the ward open to learn the name of whoever imprisoned my familiar.',
        "I'll keep water ready even if your partner says the fire is harmless.",
      ],
      reckoning: [
        'An old accusation',
        'The rival recognizes the salamander. I can hear their account or drive the patrol back before they renew the ward.',
        "I won't promise the spirit somebody else's voice in exchange for testimony.",
      ],
      victory: [
        'A shared conflagration',
        "The authorities know the candle is no longer theirs to extinguish. I'm still not sure where my anger ends and the salamander's begins.",
        "I'll record which of your decisions belonged to each of you.",
      ],
      defeat: [
        'Ash in the ledger',
        'The seal broke and the spirit is furious. Feeding it another institution will not change the result of this fight.',
        "I'm leaving the spare lantern here. You can relight it without making another bargain.",
      ],
    },
  },
  'magic-air': {
    hero: {
      arrival: [
        'An overdue book',
        'The alarm is singing a measure from the storm book. Someone at the library must know why that page was hidden.',
        "I'll mark the rhythm so you can stop singing if the wind gets away from you.",
      ],
      alarm: [
        "The storm's rest",
        'I can carry the students out on a controlled current or quiet the gust around the recorder so we can read it.',
        "I'll keep my feet on the ground and signal when the passage is clear.",
      ],
      reckoning: [
        "The rival's breath",
        "The fallen patrol member can't hear me over the wind. I can lower it to offer help or keep it between us and the others.",
        "I'll approach them after the air settles. Nobody should have to shout a surrender.",
      ],
      victory: [
        'Songs for everyone',
        'The book goes back to the library with a new safety appendix. The next singer should not have to steal it to learn.',
        "I'll help teach the pauses before we teach the storms.",
      ],
      defeat: [
        'A song interrupted',
        "I sang over somebody's warning and the wind took us by surprise. The book is not a substitute for listening.",
        "I'll write down the warning I heard before the gust.",
      ],
    },
    villain: {
      arrival: [
        'The forbidden shelf',
        "The library closed the stacks and the council called it public safety. I can make this vault's alarm louder than their excuses.",
        "I want the books released. I didn't agree to drown out the people who read them.",
      ],
      alarm: [
        'No quiet corner',
        'I can ease the wind long enough to evacuate the students or hold the current over the recorder to recover the forbidden verse.',
        "I'll protect the exit while you decide. Our demand is not their obligation.",
      ],
      reckoning: [
        'A dissenting note',
        'The fallen rival knows which shelves were sealed. I can listen to their explanation or keep the remaining patrol out with a gust.',
        "If they speak, I'll turn off the amplifier first.",
      ],
      victory: [
        'The council hears',
        'The council has heard the storm. It has not heard what the books mean to anyone other than me.',
        "I'll ask the librarians to speak without having to compete with your thunder.",
      ],
      defeat: [
        'The storm passes',
        'The gust scattered our evidence and our crew. Silence has never sounded so much like a verdict.',
        "I'll return the undamaged pages to the people who can preserve them.",
      ],
    },
  },
  'magic-earth': {
    hero: {
      arrival: [
        'Mavis and the missing deed',
        "That seal's rune looks like the one on the boarding house that wouldn't fall. Somebody stitched a tenant's name out of the property records.",
        "I'll bring the first-aid bag and check the deeds while you hold the floor, Granny.",
      ],
      alarm: [
        'Room in the school bus',
        'I can stitch a safe route to the students or pin the buckling corridor while we copy the deed register.',
        "I'll make sure nobody is still inside before we call the street clear.",
      ],
      reckoning: [
        'A neighbor in a mask',
        'That poor soul on the floor might be a renter as well as a rival. I can give them a hand or sew the next doorway shut.',
        "I'll ask what they need rather than assume they're part of the landlord's scheme.",
      ],
      victory: [
        'A vote on the needles',
        'The neighborhood council can borrow these needles. And if they vote against my idea, I had better listen, however foolish I think it is.',
        "I'll reserve a meeting room with enough chairs for every household.",
      ],
      defeat: [
        'A stitch came loose',
        "I hurried the ward and it failed. Sixty years of demolition doesn't make me too old to take instruction.",
        "I'll bring the broken thread to the tenants' meeting; they deserve the truth.",
      ],
    },
    villain: {
      arrival: [
        'Mother knows best',
        'These streets would behave better if somebody with sense stitched them together. The missing deeds are my chance to make that permanent.',
        'You taught me tenant law, Mavis. Those tenants have rights even if they disagree with you.',
      ],
      alarm: [
        'A tightly sewn ward',
        'I can open a seam to let the students out or secure the deed register that puts the whole block under my protection.',
        "I'll cut a separate exit if the ward starts treating residents as property.",
      ],
      reckoning: [
        "A child who won't obey",
        "The fallen rival refused my ward. I can ask why or stitch the patrol's route closed.",
        "Being older than them doesn't make their answer yours to give.",
      ],
      victory: [
        'The family quilt',
        "I've sewn the block into something the landlords cannot touch. I must decide whether the people I saved are still allowed to leave.",
        "I'll keep a pair of scissors by every exit, whether or not you approve.",
      ],
      defeat: [
        'Unraveled streets',
        'The ward came apart because I insisted everybody belong in the same pattern. I know a bad stitch when I see one.',
        "I'll help mend the roofs, not stitch anyone back into your family.",
      ],
    },
  },
  'magic-water': {
    hero: {
      arrival: [
        'A reflection out of place',
        'The bowl showed this hall before I arrived, but one face was missing. I want to learn what the previous owner saw here.',
        "I'll compare the reflection with the actual room. If they disagree, trust the living person.",
      ],
      alarm: [
        'A puddle with two destinations',
        "I can step through the coolant to guide the students out or keep the bowl steady over the recorder's reflection.",
        "I'll guard the real exit while you take the reflected one.",
      ],
      reckoning: [
        'A future not yet decided',
        'The rival fell exactly where the bowl predicted. I can change the next moment by helping them or hold the corridor.',
        "I'll wait for their real answer instead of asking what the bowl says they'll do.",
      ],
      victory: [
        'Tomorrow was not promised',
        'The bowl showed me dying tonight. It was wrong, and that is the best thing it has ever told me.',
        "I'll bring breakfast tomorrow, without asking the water whether you'll be there.",
      ],
      defeat: [
        'An unreliable vision',
        'I treated a possibility as a map and left someone outside it. Next time the bowl is a clue, not an order.',
        "I'll write down what actually happened beside what you saw.",
      ],
    },
    villain: {
      arrival: [
        'The futures market',
        "That vault's coolant can carry a reflection into every glass in the academy. I could sell what people haven't done yet.",
        'I came to investigate the drowned owner, not turn every private mistake into a product.',
      ],
      alarm: [
        'A preview for sale',
        "I can move the students through a reflected exit or preserve the recorder's image as evidence for our buyers.",
        "I'll keep a physical route open. Nobody has agreed to enter your predictions.",
      ],
      reckoning: [
        'The price of tomorrow',
        "The fallen rival knows something the bowl did not show. I can listen or use the remaining patrol's fear against them.",
        "I won't accept payment for a future they haven't chosen.",
      ],
      victory: [
        'An exclusive forecast',
        'The city knows how much its secrets are worth to me. I need to decide whether a prediction is a promise I can enforce.',
        "I'll keep my own account out of your catalogue.",
      ],
      defeat: [
        'A cracked mirror',
        'The reflected path broke and the future I sold disappeared. I have to live in the present with everyone else.',
        "I'll help the people who are still here, not refund an imaginary tomorrow.",
      ],
    },
  },
  'magic-discipline': {
    hero: {
      arrival: [
        'The closed monastery gate',
        "The order's symbol is on the seal. I remember the refugees waiting outside its doors and I will not repeat that lesson.",
        "I'll hold the doorway open. Nobody has to pass an initiation to shelter here.",
      ],
      alarm: [
        'A lesson in refuge',
        'I can guide the students out or protect the record of who paid the order to turn people away.',
        "I'll take whichever duty leaves the shelter route clear.",
      ],
      reckoning: [
        'The student who yields',
        'The rival has fallen. I can offer them sanctuary or hold the patrol away from our position.',
        'I will not call their surrender a vow to our order.',
      ],
      victory: [
        'An open dojo',
        "I'll bring the evidence to the abbot in public. The dojo stays open whether he approves or not.",
        "I'll put the shelter hours on the door where anyone can read them.",
      ],
      defeat: [
        'The threshold failed',
        'I spoke about refuge and could not keep the passage open. My students should be allowed to question that failure.',
        "I'll help ask them what our training missed.",
      ],
    },
    villain: {
      arrival: [
        'My own order',
        "The monastery refused refugees because its masters were weak and corrupt. I'll use this vault to prove my rules can command more loyalty.",
        "I left the old order because it forbade questions. I won't join another one like that.",
      ],
      alarm: [
        'The initiation test',
        "I can guide the students away or secure the record that gives me leverage over the abbot's patrons.",
        'I will not make a test of obedience out of an evacuation.',
      ],
      reckoning: [
        'The broken formation',
        'The fallen rival refuses to kneel. I can hear their reasons or drive the others away.',
        'They may surrender the fight without surrendering their judgment.',
      ],
      victory: [
        'A new authority',
        'The old masters know their authority can be challenged. I must decide whether mine can survive the same challenge.',
        "I'll post a copy of the rules with a blank space for objections.",
      ],
      defeat: [
        'An order divided',
        'The formation broke because I demanded obedience when people needed to improvise. I have heard that excuse from an abbot before.',
        "I'll help the students find shelter, not stand for another loyalty test.",
      ],
    },
  },
  'magic-genius': {
    hero: {
      arrival: [
        'The missing axiom',
        'The sigil on that seal is my proof with the final line removed. My professor published it without explaining what the door opens onto.',
        "I'll keep the chalk inside the marked boundary while you test the result.",
      ],
      alarm: [
        'A useful exception',
        'I can draw a stable path for the students or protect the transcription of the stolen proof.',
        "I'll check the path with actual footsteps. A correct equation can still describe the wrong room.",
      ],
      reckoning: [
        'A counterexample in uniform',
        'The fallen rival could be evidence against my assumptions. I can hear them out or keep the remaining patrol off the chalk circle.',
        "I'll record their words as a counterexample, not a rounding error.",
      ],
      victory: [
        'An open proof',
        'The proof goes into the public archive with its limitations. My professor will have to answer in the same language as everyone else.',
        "I'll invite an independent reader to check every dangerous step.",
      ],
      defeat: [
        'A theorem disproved',
        "My assumptions were wrong and people paid for it. I'll publish the failed proof as carefully as the successful one.",
        "I'll keep the original markings before anybody cleans up the floor.",
      ],
    },
    villain: {
      arrival: [
        'The city as a proof',
        'The stolen equation could open a door to a realm where nothing deviates from its definition. I want that precision here.',
        "I joined to expose plagiarism. I don't want my neighbors erased as inconvenient terms.",
      ],
      alarm: [
        'The perfect solution',
        'I can evacuate the students or protect the equation while I derive the next geometric servant.',
        "I'll keep the exit outside the diagram; people are not required to fit your solution.",
      ],
      reckoning: [
        'An unwelcome variable',
        "The fallen rival has contradicted my model. I can listen or remove the patrol's opportunity to interfere.",
        "I won't let a contradiction become an excuse to delete a person.",
      ],
      victory: [
        'A flawless diagram',
        'The city has seen my servants obey a proof without hesitation. That is not proof the city should do the same.',
        "I'll publish my objections in a form your servants cannot simplify.",
      ],
      defeat: [
        'An undefined result',
        "The door failed because my proof assumed the room was empty of free choices. It wasn't.",
        "I'll save the counterexample rather than erase it from our notes.",
      ],
    },
  },
  'magic-birthright': {
    hero: {
      arrival: [
        'The soup is still warm',
        "The vault ward is written in my mother's hand. She disappeared before she taught me why the final page was forbidden.",
        "I'll keep a seat for her, but I won't assume every spell in her book speaks for her.",
      ],
      alarm: [
        'A ward with a doorway',
        'I can open the protective charm to guide the students out or hold its boundary to read the recorder.',
        "I'll mark the exit with ordinary chalk in case the magic changes its mind.",
      ],
      reckoning: [
        'An inherited grudge',
        'The rival bears a mark my ancestors hated. I can offer to lift it or keep their patrol away from the ward.',
        "I'll ask who they are before asking which family they belong to.",
      ],
      victory: [
        'A hearth for the living',
        "I'll close the book on the old grudges. The protective spells belong with the people who are here now.",
        "I'll bring another pot of soup. Nobody has to prove their ancestry to have some.",
      ],
      defeat: [
        'A cold hearth',
        'I trusted a ward because my family had always used it. I need to understand why it failed the people inside.',
        "I'll help compare the old spell with the new damage.",
      ],
    },
    villain: {
      arrival: [
        'The ancestors convene',
        "That seal is written in my mother's hand, and the grimoire says the dead can answer for her. I'll let the whole family through.",
        "I want your mother found. I didn't vote to hand the city to people who died before it was built.",
      ],
      alarm: [
        'A debt of blood',
        'I can guide the students beyond the ward or protect the record that lets my ancestors claim this hall.',
        "I'll hold an exit the dead cannot close.",
      ],
      reckoning: [
        'A visitor without pedigree',
        'The fallen rival belongs to a family the ancestors condemned. I can hear them or hold the patrol away.',
        'I will not carry out a grudge I never agreed to inherit.',
      ],
      victory: [
        'The council of shadows',
        'The family has its seat at the table again. I must decide whether anyone alive gets to overrule it.',
        "I'll record the names of the living people who objected.",
      ],
      defeat: [
        'The last page closes',
        'The ancestors argued while the ward collapsed. I am no closer to finding my mother.',
        "I'll help the survivors first. We can ask the dead another question tomorrow.",
      ],
    },
  },
  'magic-social': {
    hero: {
      arrival: [
        'An unscheduled encore',
        "The seal has the crossroads spirit's signature, and I know a contract when I see one. Nobody in this room owes it applause.",
        "I'll work the stage lights so your illusion can cover a real evacuation.",
      ],
      alarm: [
        "The stagehand's exit",
        "I can distract the patrol while the students leave or protect the recording that identifies the spirit's agent.",
        "I'll keep the exit visible to the audience, even if it spoils your trick.",
      ],
      reckoning: [
        'A volunteer from the crowd',
        'The rival is down and the glamour has faded. I can offer them a way out or stop the next attack.',
        "I'll ask them what happened without putting them under a spotlight.",
      ],
      victory: [
        'The final bow',
        "I'll face the spirit over my own debt. The people who came to the show are not part of the payment.",
        "I'll stand with you at the crossroads, but I won't sign in your place.",
      ],
      defeat: [
        'A silent auditorium',
        "I missed the evacuation cue while I was trying to hold the audience. That's on the emcee, not the stagehands.",
        "I'll help reconstruct the cue sheet from the actual exits.",
      ],
    },
    villain: {
      arrival: [
        'Promises at the door',
        'The vault holds a contract the spirit would love to collect. I could turn this academy into my biggest venue.',
        'I came to find out what happened to the last debtor, not put the audience on the same bill.',
      ],
      alarm: [
        'The price of admission',
        'I can guide the students out under a glamour or protect the contract trace that gives me the venue.',
        "I'll keep the doors free of any condition or signature.",
      ],
      reckoning: [
        'A heckler with a point',
        'The fallen rival refuses the glamour. I can hear why or keep the remaining patrol from the contract.',
        "They don't owe us applause just because we offered them a way out.",
      ],
      victory: [
        'A house full of debts',
        'The spirit knows I can collect promises now. I need to decide whether I am the proprietor or the next thing on its ledger.',
        "I'll publish the contract terms without your music playing over them.",
      ],
      defeat: [
        'The empty box office',
        'The contract is gone and the spirit still wants payment. The audience was never mine to sell.',
        "I'll help the crew leave the venue before we negotiate another show.",
      ],
    },
  },
}
