import type { Beat } from './firstBellStory'
import type { PersonalBeat } from './accidentArcs'

export const ALIEN_ARCS: Record<
  string,
  Record<'hero' | 'villain', Record<Beat, PersonalBeat>>
> = {
  'alien-fire': {
    hero: {
      arrival: [
        'Light from a lost colony',
        'That vault has the same solar cells as my escape pod. Somebody has been opening the pods without telling the people inside.',
        "I'll check the cells for distress signals. We don't have to guess whether they're occupied.",
      ],
      alarm: [
        'A small sun',
        'I can light the path to the students or keep the solar recorder charged until we copy its passenger manifest.',
        "I'll mark the way out while you're supplying light. Nobody needs a passport to use it.",
      ],
      reckoning: [
        'The officer at the gate',
        "The fallen rival wears the immigration bureau's insignia. I can hear their explanation or keep their patrol away from the manifest.",
        "I'll witness their answer without letting them demand your papers first.",
      ],
      victory: [
        'Citizenship in daylight',
        'The passenger manifest belongs in court. I want the other refugees to speak for themselves, not watch me fight on their behalf.',
        "I'll arrange a meeting with the families before we release their names.",
      ],
      defeat: [
        'An eclipsed rescue',
        'My light reached the hall, but not everyone reached the exit. My colony needs more than one person carrying a sun.',
        "I'll help check the passenger list against the people actually found.",
      ],
    },
    villain: {
      arrival: [
        'A fleet without a home',
        "The city impounded our escape pods and called us a security problem. The vault's manifest can tell my fleet which offices to challenge.",
        'I want our people released, not a city where only our people belong.',
      ],
      alarm: [
        'A solar ultimatum',
        "I can illuminate the students' evacuation or protect the manifest long enough to give the fleet its next demand.",
        "I'll keep the exit open even if the bureau won't negotiate.",
      ],
      reckoning: [
        'A surrendered border guard',
        'The rival knows which pods were held. I could hear them or keep the other officers away from the recorder.',
        'They can answer without becoming a prisoner of our fleet.',
      ],
      victory: [
        'A new flag',
        'The city has to acknowledge the fleet now. It has not yet agreed that the sky above it belongs to me.',
        "I'll ask the refugees what government they actually want.",
      ],
      defeat: [
        'The fleet in shadow',
        'The manifest slipped away and our demands changed nothing for the people still waiting. I cannot make them citizens by threatening another city.',
        "I'll help find them without raising a new ultimatum.",
      ],
    },
  },
  'alien-air': {
    hero: {
      arrival: [
        'A treaty on solid ground',
        'The pressure lock is built around the same rift that interrupted my embassy. I can investigate without invoking diplomatic immunity.',
        "I'll record the local safety rules. You get to follow them with the rest of us.",
      ],
      alarm: [
        'A cloud with a boundary',
        'I can condense into a shield for the students or stabilize the lock while we copy its coordinates.',
        "I'll keep the ground route marked. Some of us cannot become mist.",
      ],
      reckoning: [
        'A rival delegation',
        'The fallen patrol member has a rift access seal. I can offer a ceasefire or keep the rest from closing the lock.',
        "I'll ask what terms they accept, not assume your diplomatic rank settles it.",
      ],
      victory: [
        'A local address',
        'I will submit the report under local jurisdiction. If I stay here, my neighbors deserve the right to hold me accountable.',
        "I'll help fill out the ordinary forms, even the ridiculous ones.",
      ],
      defeat: [
        'A collapsed negotiation',
        'I treated a rescue like a treaty and missed the people who had no seat at the table.',
        "I'll take their statements before we try another negotiation.",
      ],
    },
    villain: {
      arrival: [
        "The armada's offer",
        "The pressure lock could become the embassy's gateway. My council would trade safe passage home for a foothold here.",
        'I joined to find your way home, not sell my own.',
      ],
      alarm: [
        'Terms of passage',
        'I can shield the students while they leave or protect the coordinates the armada wants.',
        "I'll keep the local exit open even if your council rejects the terms.",
      ],
      reckoning: [
        'A representative without credentials',
        'The fallen rival knows the gateway schedule. I can negotiate or hold their patrol outside the lock.',
        'They cannot sign away the city any more than you can.',
      ],
      victory: [
        'An embassy with strings',
        'The armada has proof that this city is within reach. My seat on its council would cost a great many people their own seat.',
        "I'll record the residents' objections in the treaty file.",
      ],
      defeat: [
        'A treaty unsigned',
        'The gateway failed and the council has withdrawn its offer. I am still here, among people I treated as a bargaining chip.',
        "I'll help them repair the lock without sending another offer.",
      ],
    },
  },
  'alien-earth': {
    hero: {
      arrival: [
        'Exhibit number seven',
        "That vault's mineral lining came from my meteorite. I remember six thousand years of darkness, not agreeing to a museum accession number.",
        "I'll check the accession ledger for other fragments. We can ask their occupants what they want.",
      ],
      alarm: [
        'A bridge of crystal',
        'I can grow a stable passage for the students or brace the vault while we copy the collection records.',
        "I'll test the bridge before anyone crosses. Being made of stone doesn't make you responsible for every load.",
      ],
      reckoning: [
        'An exhibit speaks',
        'The fallen rival has a museum badge. I can hear where the fragments went or keep the patrol off the ledger.',
        "I'll offer them help without treating their badge as proof of guilt.",
      ],
      victory: [
        'Returned to sender',
        'The collection records go to the people whose homes became exhibits. My own label belongs in their archive, not on my body.',
        "I'll help contact the owners before anything is moved.",
      ],
      defeat: [
        'A fracture in the display',
        'I thought the crystal could hold everything. I need to remember that some things break before they bend.',
        "I'll record which supports failed instead of polishing the cracks away.",
      ],
    },
    villain: {
      arrival: [
        "The collector's cabinet",
        'The vault holds a private collection of meteorite fragments. I want the board to experience what it means to be catalogued.',
        'I came to free the fragments, not fill the cases with different prisoners.',
      ],
      alarm: [
        'A permanent exhibition',
        'I can open a crystal passage for the students or secure the names of the collectors who bought my people.',
        "I'll make sure the evacuation route cannot become a display case.",
      ],
      reckoning: [
        'The curator in the case',
        'The fallen rival knows who acquired the meteorites. I can accept their account or keep the patrol away.',
        "I'll witness a surrender, but I won't help encase them for the catalogue.",
      ],
      victory: [
        'The museum of collectors',
        'The board knows what it is like to be observed without permission. I have to decide how long I intend to keep proving the point.',
        "I'll insist every exhibit has an exit.",
      ],
      defeat: [
        'A shattered cabinet',
        'The crystal broke and the collection ledger vanished. I have made another room full of people who fear being trapped.',
        "I'll help them leave, not find replacement specimens.",
      ],
    },
  },
  'alien-water': {
    hero: {
      arrival: [
        'A tide from another world',
        'The coolant sounds like the whirlpool that brought me here. The creatures in it are warning me about something behind the seal.',
        "I'll listen to your translation and keep the dry passage marked.",
      ],
      alarm: [
        'A call beneath the floor',
        'I can guide the students along the current or hold the water still long enough to read the whirlpool trace.',
        "I'll take the dry-side rescue line. We need a route for people who can't hear the current.",
      ],
      reckoning: [
        'A voice above the surf',
        'The fallen rival is afraid of the water. I can help them reach dry ground or keep their patrol from the valve.',
        "I'll wait for their signal before touching them.",
      ],
      victory: [
        'Two shores',
        "I may never hear my mother's tides again. I can still make this shore a place where neither species has to drown for the other.",
        "I'll arrange for the harbor crew to meet your marine allies.",
      ],
      defeat: [
        'The current went wrong',
        'I listened to the water but forgot how frightening it sounds to people trapped beneath it.',
        "I'll help design an evacuation signal everybody can understand.",
      ],
    },
    villain: {
      arrival: [
        'A coast reclaimed',
        "The vault's discharge trace points back to the polluters. I can make their harbor answer to the creatures it has poisoned.",
        'I want the poison stopped, not everyone on a ship treated as its owner.',
      ],
      alarm: [
        'A rising claim',
        'I can guide the students out or secure the valve record that will let the sea challenge the companies.',
        "I'll keep the dry route open regardless of which current you choose.",
      ],
      reckoning: [
        "A sailor's refusal",
        'The fallen rival knows where the discharge pipes run. I can hear them or drive their patrol from the valve.',
        'They can give us a route without agreeing that the coast belongs to you.',
      ],
      victory: [
        "The sea's demand",
        'The companies know the shore can resist them now. I need to decide whether I speak for its creatures or command them.',
        "I'll ask the dock workers and marine allies for their own terms.",
      ],
      defeat: [
        'A tide without direction',
        'The valve is lost and the water has carried our leverage away. I still owe the creatures a safer shore.',
        "I'll help contain the discharge, not plan another blockade.",
      ],
    },
  },
  'alien-discipline': {
    hero: {
      arrival: [
        'The unsigned warrant',
        "The registry behind that seal bears my guild's impossible signature. Somebody has been selling names that no court ever heard.",
        "I'll hold the list closed until the people named in it can speak for themselves.",
      ],
      alarm: [
        'A sword for the net',
        'I can cut the students free of the rigging or keep the warrant ledger intact while we trace its broker.',
        "I'll take the ordinary stairs. Your sword doesn't have to solve both problems.",
      ],
      reckoning: [
        'A contract refused',
        'That rival is down and their name is on the list. I can offer protection or keep the patrol away from the ledger.',
        "I'll witness your refusal to carry out the warrant, not ask you to replace it with another.",
      ],
      victory: [
        'No guild owns my blade',
        "The warrants go into the evidence file. I would rather stay in this strange city than return home on somebody else's death order.",
        "I'll help the fugitives find a place to speak without being registered again.",
      ],
      defeat: [
        'A blade too late',
        'I cut the wrong tether and lost the chance to protect someone. Refusing a contract is only the beginning of learning to rescue.',
        "I'll help reconstruct the route without blaming the person who needed help.",
      ],
    },
    villain: {
      arrival: [
        'The impossible book',
        "The guild's ledger is inside that vault. With its portal keys and my clockwork suit, I could make myself the only judge it recognizes.",
        'I agreed to recover the ledger, not give you authority over every name in it.',
      ],
      alarm: [
        "A warrant's cost",
        'I can use my portal step to free the students or protect the record that gives the guild its jurisdiction.',
        "I'll keep the service route open for anyone who refuses your portal.",
      ],
      reckoning: [
        'A witness outside time',
        'The fallen rival knows who sold the warrant. I can hear their testimony or keep the patrol away from the registry.',
        "A witness gets to leave after speaking. I won't sign a contract that says otherwise.",
      ],
      victory: [
        'The judge in the gear',
        'The guild recognizes my keys now. It has not given me a reason to believe every judgment in the book is just.',
        "I'll keep a separate list of the people who challenged your authority.",
      ],
      defeat: [
        'A broken oath',
        'The portal failed and my authority vanished with the ledger. I have the same blade and none of the answers I was promised.',
        "I'll help the people stranded here, even if the guild calls it desertion.",
      ],
    },
  },
  'alien-genius': {
    hero: {
      arrival: [
        'A technology with instructions',
        "The vault's controller uses a design from my home civilization. I was exiled for sharing it, and somebody has built it without the safety notes.",
        "I'll ask the local technicians which instructions they're missing.",
      ],
      alarm: [
        'A repairable path',
        'I can use the controller to guide the students out or preserve its transmission to find out who is watching me.',
        "I'll keep the manual controls available. The rescue should not depend on your permission.",
      ],
      reckoning: [
        "A technician's question",
        'The fallen rival may have installed the device. I can hear what went wrong or keep the patrol away from the transmitter.',
        "I'll ask them to explain their repair, not treat an unfamiliar method as ignorance.",
      ],
      victory: [
        'An open workshop',
        "I'll release the design with the safety notes and an invitation to improve it. My neighbors are not apprentices of my civilization.",
        "I'll organize a workshop where people can teach you something too.",
      ],
      defeat: [
        'A design without a user',
        'The technology worked exactly as I intended and still failed the rescue. I forgot to ask who would actually use it.',
        "I'll bring the users into the next design review.",
      ],
    },
    villain: {
      arrival: [
        'The supervised city',
        'My home civilization still watches me through this controller. I intend to demonstrate what happens when a city stops resisting improvement.',
        'I came to stop the surveillance, not help you install a better version of it.',
      ],
      alarm: [
        'An upgrade without a vote',
        "I can use the controller to evacuate the students or recover its network trace so I can direct the city's upgrades.",
        "I'll keep the manual release working for people who decline the upgrade.",
      ],
      reckoning: [
        'A local expert says no',
        "The fallen rival knows the old system. I can hear their objection or secure the patrol's access points.",
        'I will not replace their judgment with a firmware update.',
      ],
      victory: [
        'A laboratory called home',
        'The city can see what my technology can do. Whether it wants all of it is still a question I cannot answer on its behalf.',
        "I'll publish the independent opt-out instructions.",
      ],
      defeat: [
        'The failed demonstration',
        'The network rejected my commands and the people were left with a system they did not request. My education is incomplete.',
        "I'll help restore their old controls before we propose anything new.",
      ],
    },
  },
  'alien-birthright': {
    hero: {
      arrival: [
        "The mirror's missing frame",
        "The seal carries my kingdom's royal reflection. I want to learn who brought me through the mirror before anyone asks me to reclaim a throne.",
        "I'll protect the passage without asking the refugees to recognize your title.",
      ],
      alarm: [
        'A gateway for everyone',
        'I can open a route for the students or hold the mirror steady while we recover the record of my exile.',
        "I'll guide the evacuees regardless of which kingdom issued their papers.",
      ],
      reckoning: [
        'A subject without a crown',
        'The fallen rival bears a royal emblem. I can hear why they wear it or keep the patrol from the mirror.',
        'They may choose a different ruler and still deserve our help.',
      ],
      victory: [
        'Two worlds, two votes',
        "I'll put my claim before both communities and relinquish it. Being born to a throne isn't the same as being chosen to lead.",
        "I'll help arrange the meetings without placing your crest on the ballot.",
      ],
      defeat: [
        'A gateway closed',
        "I assumed the mirror would open for me and missed the people who needed it. Royal blood isn't an evacuation plan.",
        "I'll help chart an ordinary route between the two shores.",
      ],
    },
    villain: {
      arrival: [
        'The crown beyond the glass',
        "The vault holds the gateway record that proves my throne was stolen. Comet City sits on the other side of my family's claim.",
        'I want your exile investigated, not my home annexed.',
      ],
      alarm: [
        'A royal passage',
        'I can open the gateway for the students or secure the record that gives me leverage over both kingdoms.',
        "I'll keep the gateway free of loyalty tests.",
      ],
      reckoning: [
        'An unwilling subject',
        'The fallen rival recognizes my crest and refuses it. I can hear their reason or keep the patrol away from the mirror.',
        "A surrender doesn't transfer their allegiance to you.",
      ],
      victory: [
        'The reunited crown',
        'The two worlds now know what my title means. I still have to decide whether reunification requires their agreement.',
        "I'll deliver the objections from both sides, even if the court refuses to read them.",
      ],
      defeat: [
        'A crown in pieces',
        'The mirror broke before my claim could be proven. I cannot turn the people who helped me into subjects to make up for it.',
        "I'll help the refugees find shelter without asking them to swear an oath.",
      ],
    },
  },
  'alien-social': {
    hero: {
      arrival: [
        'A voice apart',
        "The vault's signal resembles my lost collective. I can hear the invitation to reconnect, but I have learned to ask before sharing my thoughts.",
        "I'll use our agreed signal for yes and keep a way to disconnect.",
      ],
      alarm: [
        'A temporary link',
        "I can help the students coordinate an exit through a voluntary link or preserve the receiver's signal to locate the crash site.",
        "I'll guide anyone who wants to stay outside the link.",
      ],
      reckoning: [
        'A mind of their own',
        'The fallen rival is frightened of being connected. I can offer ordinary aid or keep the patrol away from the receiver.',
        "I'll ask them aloud. No one has to let us inside their thoughts.",
      ],
      victory: [
        'A family with doors',
        'I can remain an individual and still belong somewhere. The collective is a choice, not the price of being rescued.',
        "I'll keep our disconnect signal even when everybody agrees.",
      ],
      defeat: [
        'A broken connection',
        'I assumed that sharing a thought meant sharing a plan. The people who needed help had their own ideas.',
        "I'll ask them separately what happened before we reconnect.",
      ],
    },
    villain: {
      arrival: [
        'A cure for loneliness',
        "The vault's receiver could rebuild the collective with people from this city. I remember how unbearable it was to hear only my own thoughts.",
        "I understand the loneliness. I didn't agree to let you solve mine without me.",
      ],
      alarm: [
        'An invitation or an order',
        "I can coordinate the students' escape or secure the signal that will extend our collective into the city.",
        "I'll keep an unlinked evacuation route open.",
      ],
      reckoning: [
        'A mind that resists',
        'The fallen rival has refused the connection. I can listen to their spoken answer or keep the patrol away from the receiver.',
        "I'll protect their refusal even if the collective considers it an error.",
      ],
      victory: [
        'An endless family',
        'The receiver can reach people who have never known what belonging feels like. I need to decide if belonging means they can leave.',
        "I'll keep the disconnect switch accessible, even to someone who disagrees with you.",
      ],
      defeat: [
        'The quiet after the hive',
        "The signal died and I am alone in my mind again. That is not a reason to take somebody else's solitude away.",
        "I'll stay nearby without connecting. You can ask me to leave too.",
      ],
    },
  },
}
