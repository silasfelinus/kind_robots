import type { Beat } from './firstBellStory'
import type { PersonalBeat } from './accidentArcs'

export const TECH_ARCS: Record<
  string,
  Record<'hero' | 'villain', Record<Beat, PersonalBeat>>
> = {
  'tech-fire': {
    hero: {
      arrival: [
        'The rusted ladder',
        'The escape ladder at my old apartment peeled off the wall. Whoever installed these auditorium shutters used the same inspection stamp.',
        'I brought a heat shield. Tell me where to hold it before you cut.',
      ],
      alarm: [
        'A weld that holds',
        'I can cut a passage to the students or hold the doorway while we copy the inspection records.',
        "I'll check the load before anyone crosses. A rescue shouldn't need another rescue.",
      ],
      reckoning: [
        'Gloves off',
        'That patrol member is down beside a hot brace. I can help them or turn my torch toward the next barricade.',
        'I will get their hands away from the metal if you give me room.',
      ],
      victory: [
        'An open design',
        'The city gets my gauntlet plans, without a licensing fee. Nobody should need my permission to build a fire escape.',
        'I will test the instructions with ordinary tools before we share them.',
      ],
      defeat: [
        'The seam failed',
        'I trusted a weld that had not cooled. I owe the trapped people a better design, not a speech about my intentions.',
        "I'll keep the broken part for the failure review.",
      ],
    },
    villain: {
      arrival: [
        'A safety monopoly',
        'The landlord called a missing fire escape an acceptable risk. With the vault records I can make every contractor buy my steel.',
        'I came to stop negligent owners, not collect rent from tenants.',
      ],
      alarm: [
        'A fireproof contract',
        'I can cut the students free or secure the records that give my company control of the district.',
        "I won't charge anyone for getting through my exit.",
      ],
      reckoning: [
        'The unlicensed welder',
        "The fallen rival has a contractor's badge. I can hear their account or secure the next barricade.",
        "I will protect a worker's testimony even if it hurts our bid.",
      ],
      victory: [
        'Under new management',
        'The district knows who can cut through its steel now. I need to decide what my protection costs the people inside.',
        'My own report will include the tenants who cannot pay.',
      ],
      defeat: [
        'A collapsed bid',
        'My armor survived the fight, but my claim to the district did not. Steel is not a substitute for consent.',
        "I'll help repair the doors; don't put my name on your invoices.",
      ],
    },
  },
  'tech-air': {
    hero: {
      arrival: [
        'Eleven minutes',
        "My wingsuit has eleven minutes of flight and the vault controller bears the board's serial number. We need a plan for when I land.",
        "I'll mark a landing zone and watch your battery.",
      ],
      alarm: [
        'The battery budget',
        "I can reach the students above the shutters or keep the receiver near the controller while it transmits the board's records.",
        "I'll take the stairs if your charge drops. You don't need to prove anything with an empty battery.",
      ],
      reckoning: [
        'A landing signal',
        'The rival is down in the flight path. I can bring them clear or keep the patrol off the roof.',
        "I'll wave you in once the path is clear.",
      ],
      victory: [
        'A flight worth licensing',
        'I will bring the flight log to the board and ask them to change their rules for the next student.',
        "I'll testify about the rescue, including the moments you chose not to fly.",
      ],
      defeat: [
        'Forced landing',
        'My battery gauge was accurate. My estimate of what I could do alone was not.',
        "We'll build a ground plan before we charge the suit again.",
      ],
    },
    villain: {
      arrival: [
        'Grounded by committee',
        'The board stole my wingsuit research and called it safety. Their controller will make an excellent demonstration of being grounded.',
        'I want the stolen research back, not stranded ambulances.',
      ],
      alarm: [
        'Flight clearance revoked',
        "I can extract the students before I lock the network down or preserve the trace that gives me the city's drone controls.",
        "I'm keeping an emergency channel open regardless of our objective.",
      ],
      reckoning: [
        'A rogue pilot',
        "The downed rival knows the controller's emergency codes. I can accept their help or deny the remaining patrol access.",
        'If we negotiate, I will keep their aircraft out of our blacklist.',
      ],
      victory: [
        'No departures',
        'The board cannot ignore a pilot who controls its network. But control is not the same thing as being invited back.',
        'I will restore medical flights even if the board refuses your terms.',
      ],
      defeat: [
        'Out of range',
        'The network is no longer mine. I have managed to ground myself along with everybody I wanted to impress.',
        "I'll get the emergency channel working before we argue about blame.",
      ],
    },
  },
  'tech-earth': {
    hero: {
      arrival: [
        'Missing reinforcement',
        "The stage pillars have the same faulty reinforcement as my old school. My father's signature may be on the plans.",
        "I'll photograph the exposed steel before we move it. You deserve evidence, not guesses.",
      ],
      alarm: [
        "The excavator's limit",
        "I can use the rig to uncover the students or brace the corridor while we recover the builder's records.",
        "I'll spot the bucket. No one crosses beneath it until I signal.",
      ],
      reckoning: [
        'A person under the plans',
        'That fallen rival may have inspected the work. I can pull them clear or stop their patrol reaching the plans.',
        'Let me treat their injuries before we ask about the signature.',
      ],
      victory: [
        'A public inspection',
        "I'll bring the plans to the hearing, even if the signatures cost my family its career.",
        "I'll give my own testimony. You won't have to speak for the whole crew.",
      ],
      defeat: [
        'The second collapse',
        'The rig moved a load I should have checked. I cannot rebuild trust by pouring another slab over the mistake.',
        "I'll preserve the original readings for the inquiry.",
      ],
    },
    villain: {
      arrival: [
        'Condemned by design',
        "The city made money from unsafe buildings. The vault's deed records can give me the district before another planner gets a vote.",
        'I want safe homes, not another eviction notice with a different logo.',
      ],
      alarm: [
        'A vacant parcel',
        'I can clear the students out or keep the deed records while our rig secures the corridor.',
        "I'll count occupants before I count lots.",
      ],
      reckoning: [
        'The planning clerk',
        'That rival may know who waived the reinforcement requirements. I can hear them out or secure the remaining corridor.',
        'I will witness their testimony without promising them a demolition contract.',
      ],
      victory: [
        'A district on paper',
        'The deeds will let me build whatever I want. The people who need homes have not agreed to my plans yet.',
        "I will organize a residents' meeting, not just distribute your floor plans.",
      ],
      defeat: [
        'A plan without ground',
        'The rig cannot enforce a deed I failed to secure. I have another unsafe building instead of a new district.',
        "I'll help stabilize it, but I won't declare anyone's home vacant.",
      ],
    },
  },
  'tech-water': {
    hero: {
      arrival: [
        'A volunteer line',
        "The coolant pump uses a fitting from a rescue boat sold to the yacht club. I recognize it from my uncle's missing service.",
        "I'll keep the buddy line attached. Neither of us dives without a partner.",
      ],
      alarm: [
        'Air for two',
        'I can take the suit into the coolant passage for the students or protect the pump recorder from the patrol.',
        "I'll monitor your air and keep the dry route open.",
      ],
      reckoning: [
        'The rescue is not selective',
        'The fallen rival is struggling near the flooded section. I can get them out or hold the pump controls.',
        'They get the same rescue procedure as anyone else.',
      ],
      victory: [
        'A public harbor',
        "The service needs volunteers and repairable gear, not another privately owned boat. I'll publish the suit design.",
        "I'll arrange a training drill with the dock crews.",
      ],
      defeat: [
        'An empty air gauge',
        'I counted on the suit and forgot to budget for the people who could not breathe down there.',
        "We'll review the buddy-line log together.",
      ],
    },
    villain: {
      arrival: [
        "The harbor's invoice",
        'They sold the rescue boats and let my uncle drown. This pump gives me the leverage they refused to fund.',
        'I want a rescue service too. I will not help you make new drowning victims.',
      ],
      alarm: [
        'A flooded balance sheet',
        "I can clear the trapped students or secure the pump records that let me demand the city's payment.",
        "I'll keep the emergency drain accessible while you decide.",
      ],
      reckoning: [
        "A diver's truce",
        'The downed rival knows the maintenance route. I could accept their help or drive the others away.',
        'If they agree to guide us, I will give them a spare air supply.',
      ],
      victory: [
        'The bill arrives',
        'The city has seen what happens when it neglects the harbor. Its payment still has to reach the people who actually do the rescuing.',
        "I'll ask the volunteer crew to decide how the money gets spent.",
      ],
      defeat: [
        'The unpaid rescue',
        'The pump is gone and nobody is paying. I cannot invoice the people stranded by my own plan.',
        "I'll go back for them without waiting for a contract.",
      ],
    },
  },
  'tech-discipline': {
    hero: {
      arrival: [
        'A rewritten report',
        "The vault's safety log has the same review-board stamp as the accident that cost me my legs. I want the original.",
        "I'll check the route with you. If the stairs are blocked, we find another way.",
      ],
      alarm: [
        'A route that works',
        'I can use my prosthetics to reach the students or secure the records before the patrol overwrites them.',
        "I'll keep the accessible exit open instead of assuming everybody can follow your jump.",
      ],
      reckoning: [
        'A different finish line',
        'The rival is down. I could help them find a way out or stop their reinforcements.',
        "I'll offer help without assuming they need to be carried.",
      ],
      victory: [
        'No pity required',
        'The review board gets the original record. My clinic gets the design improvements we learned tonight.',
        "I'll help document the route so it works for more than one kind of body.",
      ],
      defeat: [
        'A barrier we missed',
        'I got across the gap and still left people behind it. The route needs work, not a faster runner.',
        "We'll mark the barriers together before the next drill.",
      ],
    },
    villain: {
      arrival: [
        'The discarded regiment',
        "The board rewrote my accident report and discarded people like me. With these records I can recruit a force that won't answer to them.",
        'I signed up for justice, not another commanding officer who ignores our limits.',
      ],
      alarm: [
        'Recruitment or rescue',
        'I can reach the students or secure the record that proves what the board did to my recruits.',
        "I won't let a recruitment pitch become the price of an evacuation.",
      ],
      reckoning: [
        'A refusal to march',
        'The fallen rival has the look of someone ordered into a bad situation. I can hear them or press the squad forward.',
        "They don't owe you a uniform because you offered them a hand.",
      ],
      victory: [
        'A new command',
        'The board knows it cannot write our histories for us. I still have to earn the people who march beside me.',
        "I'll circulate the orders for everyone to read and challenge.",
      ],
      defeat: [
        'A formation breaks',
        'I drilled everybody to follow the same route, and the route failed. That is exactly the kind of command I hated.',
        "I'll help the crew get home, not put them through another punishment drill.",
      ],
    },
  },
  'tech-genius': {
    hero: {
      arrival: [
        'The human inventor',
        'Someone put my stolen F.R.O.G. schematics in the vault. The leap harness is ready; the serum has never passed a consent trial.',
        "I'll check the adhesive pads with you. We can do this without a single injection.",
      ],
      alarm: [
        'A spring-loaded rescue',
        'I can use my harness to bounce the students clear or hold the corridor while we recover the failed-trial records.',
        "I'll secure the landing pads and keep the sealed vials untouched.",
      ],
      reckoning: [
        "An engineer's restraint",
        'The fallen rival may know who stole the formula. I can help them or keep their patrol away from the laboratory controls.',
        "No experiments on a surrendered person. I'll ask for testimony, not a sample.",
      ],
      victory: [
        'A repairable invention',
        "I am still Lionel Marsh, still human, and still proud of that ridiculous frog logo. I'll publish the risks and the rescue rig plans.",
        "I'll test the repair guide with someone who didn't build the prototype.",
      ],
      defeat: [
        'A broken spring',
        'The harness failed to reach everyone. That is a reason to improve the gear, not to declare an untested serum safe.',
        "I'll preserve the failed trial records and help diagnose the harness.",
      ],
    },
    villain: {
      arrival: [
        'The experiment walks',
        "The serum changed me into the frog I used to paint on my harness. Now the academy's vault holds the rest of my stolen research.",
        'I accepted your changed body. I did not consent to having mine changed.',
      ],
      alarm: [
        'A choice about evolution',
        'I can pull the students free with my new reach or hold the telemetry that proves what this mutagen can accomplish.',
        'I will keep the students away from the vials, whichever objective you choose.',
      ],
      reckoning: [
        'A willing subject',
        'The fallen rival knows who stole the formula. I can ask them or clear the patrol off the controls.',
        'If they refuse a sample, I will honor it. That is not a variable you can remove.',
      ],
      victory: [
        "The laboratory's new owner",
        'The academy cannot pretend my transformation is reversible. I have won the right to study it, not the consent of everyone else.',
        'I will record my own objections alongside your findings.',
      ],
      defeat: [
        'The unrepeatable trial',
        'The breach ruined the experiment. I cannot undo my transformation, and I cannot learn from a result I refuse to admit.',
        "I'll preserve the raw data; I won't volunteer anyone for a replacement trial.",
      ],
    },
  },
  'tech-birthright': {
    hero: {
      arrival: [
        'The company serial number',
        'The shutter controller has a Sterling Dynamics serial number. It was sold to someone my family said we never supplied.',
        "I'll copy the number before you put the armor through it.",
      ],
      alarm: [
        'An expensive rescue',
        'I can shield the students with the suit or protect the evidence that ties the company to this breach.',
        "I'll handle the evacuation without asking your trust fund to approve it.",
      ],
      reckoning: [
        'A customer in uniform',
        'The fallen rival carries our equipment. I can ask where they bought it or shut down the remaining patrol.',
        "I'll secure the gear for an independent investigator, not your company warehouse.",
      ],
      victory: [
        'Without the trust fund',
        'The board can have its suit back if it wants. The weapons records go to the people who were put in danger.',
        "I'll help find a repair shop that doesn't require your family name.",
      ],
      defeat: [
        'A warranty denied',
        'The armor was not enough to win. Buying a replacement will not change what happened tonight.',
        "I'll help document the damage before anyone negotiates a settlement.",
      ],
    },
    villain: {
      arrival: [
        'A profitable emergency',
        "The company supplied the locks and half the equipment used against them. I want the vault's sales records before the board sees them.",
        'I came to expose the conflict of interest, not help you corner both sides.',
      ],
      alarm: [
        'Two orders on the books',
        'I can shield the students or recover the sales trace that forces the board to give me a seat.',
        "I won't count the rescue as a marketing expense.",
      ],
      reckoning: [
        'A dissatisfied customer',
        "The rival's equipment failed. I can hear why or press the remaining patrol off the records.",
        "I'll accept their complaint without making them sign a waiver.",
      ],
      victory: [
        'The board seat',
        "The directors understand that I can control their market now. What they don't understand is that protection should not need a sales pitch.",
        "I'll release the independent equipment audit even if you refuse to sign it.",
      ],
      defeat: [
        'A cancelled purchase',
        'The vault is lost and the board is calling me a liability. I have sold protection I could not deliver.',
        "I'll help the people whose equipment failed, not write the press release.",
      ],
    },
  },
  'tech-social': {
    hero: {
      arrival: [
        'The unedited frame',
        "The vault's camera filter matches the software that exposed protesters from my first stream. I need the original clip.",
        "I'll hold the camera away from faces until people agree to be filmed.",
      ],
      alarm: [
        'A rescue off camera',
        'I can lead the students out without recording them or protect the raw footage that identifies the control operator.',
        "I'll keep a private evacuation count so nobody has to appear on your feed.",
      ],
      reckoning: [
        'A witness, not a headline',
        'The fallen rival can tell us what happened. I can ask them or stop the others from reaching the recorder.',
        "I'll ask before recording; silence is also an answer.",
      ],
      victory: [
        'A name on the account',
        "I'll publish the evidence with consent and put my own real name on the report. Accountability starts with the camera operator.",
        "I'll check the edits for identifying details before it goes out.",
      ],
      defeat: [
        'The missing footage',
        "My camera caught the fight but missed people who needed help. I can't edit that into a better rescue.",
        "I'll help gather accounts from people who choose to share them.",
      ],
    },
    villain: {
      arrival: [
        "The morning's headline",
        "The vault stores a camera feed that could make the academy believe anything I cut together. I want tomorrow's story.",
        'I edit footage, but I will not invent a confession.',
      ],
      alarm: [
        'A profitable cut',
        'I can lead the students away or keep the recording that lets me dictate what viewers see.',
        "I will not use a student's panic as a reaction shot without permission.",
      ],
      reckoning: [
        'A clip that talks back',
        'The fallen rival knows what the cameras missed. I can hear their account or keep the patrol away from the feed.',
        "I'll preserve their answer in its original form, not trim it for the headline.",
      ],
      victory: [
        'The story belongs to me',
        'My edit will reach the city before its witnesses do. I cannot claim that the first version is the true one.',
        "I'm saving the original footage somewhere you cannot revise it.",
      ],
      defeat: [
        'An unsponsored silence',
        "The feed is gone and my audience is hearing other people's accounts. I cannot crop the city out of its own story.",
        "I'll publish my own correction without waiting for a sponsor.",
      ],
    },
  },
}
