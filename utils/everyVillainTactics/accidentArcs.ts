import type { Beat } from './firstBellStory'

export type PersonalBeat = readonly [
  title: string,
  lead: string,
  support: string,
]

type PersonalArc = Record<Beat, PersonalBeat>

export const ACCIDENT_ARCS: Record<
  string,
  Record<'hero' | 'villain', PersonalArc>
> = {
  "accident-fire": {
    "hero": {
      "arrival": [
        "Inspection stamp",
        "That seal uses the same contractor stamp as the kitchen that blew up under me.",
        "My scanner can copy it, but I will not let you leave the people underneath it."
      ],
      "alarm": [
        "A cook's triage",
        "I know how quickly a closed room becomes an oven. I can carry two out or keep the contractor's recorder intact.",
        "I can cover either route, but the people inside are not evidence bags."
      ],
      "reckoning": [
        "The extinguisher",
        "That rival could be a hired cook with a uniform. I know what a paycheck can make you do.",
        "If you offer a hand, I will treat them. If we push, I will keep the exit clear."
      ],
      "victory": [
        "Open kitchen",
        "The gas company cannot hide behind a school uniform anymore. I am signing my own name to the report.",
        "I will testify about the rescue, not just the fight."
      ],
      "defeat": [
        "Cold stove",
        "I could stand in the heat but I could not save the room. No more pretending that being fireproof is enough.",
        "I am writing down what went wrong before anyone sells us a better story."
      ]
    },
    "villain": {
      "arrival": [
        "Insurance inspection",
        "The seal protects a prototype worth more than every kitchen on Neon Row. I want the contractor's leverage.",
        "You promised protection, not a monopoly. I am keeping a copy of the inspection stamp."
      ],
      "alarm": [
        "The premium comes due",
        "I can get the students out or take the telemetry that makes every policy mine.",
        "A paid claim is not a life returned. I will not falsify the evacuation count."
      ],
      "reckoning": [
        "A rival's receipt",
        "That patrol member has the contractor's badge. They could give us names, or we could silence their unit.",
        "I will negotiate only if they can leave freely."
      ],
      "victory": [
        "Underwritten",
        "The seal holds. Whether the city pays me or investigates me, it knows I control the risk now.",
        "The report gets my account too; your signature is not the only one."
      ],
      "defeat": [
        "Policy void",
        "The vault is open and my threat has lost its value. The contractor will not be buying my silence.",
        "I am leaving with the records, not the contract."
      ]
    }
  },
  "accident-air": {
    "hero": {
      "arrival": [
        "Feet above the floor",
        "The airfield switched off its lightning rods. These alarm controls have the same service mark. I need to land long enough to prove it.",
        "I will stand beneath the catwalk if you need a steady place to land."
      ],
      "alarm": [
        "Two breaths left",
        "The pressure is dropping under the stage. I can carry students up or hold the sensor feed open.",
        "I can watch the ground route. Do not turn this into another solo jump."
      ],
      "reckoning": [
        "A landing offered",
        "The rival is down. I can set them on their feet or keep the rest from reaching the switchboard.",
        "They need air before they need answers."
      ],
      "victory": [
        "Ground witness",
        "I am staying on the ground for the interview. No more letting the airfield write my testimony.",
        "I will wait beside you until the last question."
      ],
      "defeat": [
        "The long descent",
        "I ran the sky and missed the ground. The next rescue starts with listening to the people below.",
        "I am not leaving you alone on that ledge."
      ]
    },
    "villain": {
      "arrival": [
        "Quiet at a price",
        "The refinery learned to silence its monitors. I can make this entire hall forget what an alarm sounds like.",
        "I joined to expose the refinery, not to steal the students' breath."
      ],
      "alarm": [
        "The silent contract",
        "The vault's record can buy a refinery's loyalty. The students can still get out if I open the pressure path.",
        "I will not sign a report that calls a silent room empty."
      ],
      "reckoning": [
        "Unmuted witness",
        "The fallen rival heard the alarm before I smothered it. Let them talk, or keep the rest quiet.",
        "If we take the testimony I will protect the witness from our clients."
      ],
      "victory": [
        "No applause",
        "I own the silence the city used to sell me. Now the refinery knows what its own bargain sounds like.",
        "I will publish the evacuation count independently."
      ],
      "defeat": [
        "Pressure loss",
        "The air is rushing back and my clients have vanished. I cannot charge the wind for loyalty.",
        "I will make sure the people who breathed through this are heard."
      ]
    }
  },
  "accident-earth": {
    "hero": {
      "arrival": [
        "Day seven",
        "The transit authority stopped digging on day six. I recognize their tunnel plan under this stage.",
        "I will carry a share of the load; you do not get buried alone again."
      ],
      "alarm": [
        "Load-bearing choice",
        "Two students are pinned near the braces. I can lift the span or hold the corridor while we copy the plan.",
        "Tell me which brace to take. I am not standing around watching you crack."
      ],
      "reckoning": [
        "A worker's hands",
        "That patrol member has a quarry badge. Someone told them the ground was safe too.",
        "I can pull them clear or reinforce our position, but I will not call them rubble."
      ],
      "victory": [
        "Above ground",
        "I am showing my face at the transit hearing. They can ask why the foundation has a name.",
        "I will bring the names of the workers who got us out."
      ],
      "defeat": [
        "The missing brace",
        "I held the wrong span. Somebody else will have to help me understand where we failed.",
        "The next plan will have two signatures and two load checks."
      ]
    },
    "villain": {
      "arrival": [
        "Rent below street level",
        "The private vault sits on my tunnels. The bankers will pay to keep their floors where they are.",
        "The workers did not sign up to become collateral for a rent dispute."
      ],
      "alarm": [
        "A foundation invoice",
        "I could pull the students through the service shafts, or secure the vault plan that gives me the district.",
        "I will mark every occupied room before you move another wall."
      ],
      "reckoning": [
        "The quarry badge",
        "The fallen patrol member knows who ordered the rescue to stop. I can hear them or send the others running.",
        "I want their testimony too. Nobody gets buried to settle my grievance."
      ],
      "victory": [
        "Subsurface title",
        "The bankers will never again pretend the ground beneath them is free. I have the city's foundations on my ledger.",
        "I am keeping a separate ledger of the people we owed a safe exit."
      ],
      "defeat": [
        "Foreclosure",
        "The vault is breached and my tunnels are no longer a secret. The city will not pay a debt just because I can collect it.",
        "The crew needs an exit, not another invoice."
      ]
    }
  },
  "accident-water": {
    "hero": {
      "arrival": [
        "Cooling-pond sample",
        "The seal's coolant smells like the pond I fell into. I want a sample that is not my own body.",
        "I brought a sterile bottle and a rescue line. Both belong to you to use."
      ],
      "alarm": [
        "The tide splits",
        "I can draw the flood away from the trapped students or protect the coolant readings from the company's lawyers.",
        "I will keep the line tethered either way. You are not a sample."
      ],
      "reckoning": [
        "A dry mouth",
        "The patrol member is coughing. I can clear their lungs or hold the rivals away from the coolant valve.",
        "I can keep them breathing while you make the call."
      ],
      "victory": [
        "Public water",
        "The sample goes to an independent lab. I am going to speak at the hearing as a rescuer, not an exhibit.",
        "I will take the witness stand if they try to put you back in a specimen jar."
      ],
      "defeat": [
        "A leak remains",
        "I could breathe in the flood and they could not. We need a better plan than trusting my lungs.",
        "I saved the sample and will help you trace the leak."
      ]
    },
    "villain": {
      "arrival": [
        "Reservoir key",
        "The power company spent years owning the water and my story. That seal is a key to both.",
        "The dock crew wants fair water rates, not another person owning the taps."
      ],
      "alarm": [
        "Who gets a glass",
        "I can divert water from the students or copy the control telemetry and make the company negotiate.",
        "I refuse to count the students as a bargaining chip."
      ],
      "reckoning": [
        "Hydrant truce",
        "The rival knows which valve was closed. I could ask them or shut down their squad.",
        "If they speak, I will make sure the neighborhood hears the answer."
      ],
      "victory": [
        "The rate is mine",
        "The company has to negotiate with someone it used to call a liability. Its valves are no longer its private business.",
        "I want the residents at that table, not just the two owners."
      ],
      "defeat": [
        "Empty reservoir",
        "I lost the valve and the company will say the shortage was my fault. I need a witness more than a lever.",
        "The dock crew will help the stranded people, not defend a false report."
      ]
    }
  },
  "accident-discipline": {
    "hero": {
      "arrival": [
        "A borrowed second",
        "The vault timer has the defense contractor's frequency. I can catch it between ticks, but my skill should count without their fragment.",
        "I can watch the ordinary clock while you watch the impossible one."
      ],
      "alarm": [
        "Ninety seconds",
        "I can reach the trapped students before the next pulse, or catch the timing trace. I cannot spend the same second twice.",
        "I will take the slower route if it means someone else gets a chance."
      ],
      "reckoning": [
        "A clean bout",
        "The rival is down. I can let them recover or use the timing gap to press the others.",
        "A sparring partner deserves a chance to get up."
      ],
      "victory": [
        "My own clock",
        "The contractor gets its fragment back, not my silence. Tomorrow I will train at ordinary speed.",
        "I will set the practice timer and leave the result blank."
      ],
      "defeat": [
        "Missed beat",
        "I saw every second and still chose badly. The next lesson will not be a stopwatch contest.",
        "We can review the sequence together instead of punishing you with another drill."
      ]
    },
    "villain": {
      "arrival": [
        "Time for sale",
        "The contractor needs a demonstration that my fragment can make a breach predictable. The sealed hall is a perfect clock.",
        "My fee buys my time, not the students' lives."
      ],
      "alarm": [
        "A second invoice",
        "I can spend the timing window on evacuation or record a sequence worth a fortune to a client.",
        "I will keep the casualty ledger separate from the invoice."
      ],
      "reckoning": [
        "Outside the schedule",
        "The fallen rival is a variable my plan did not account for. I can hear their warning or run the next timed maneuver.",
        "I will not execute a schedule that orders me to ignore a surrendered person."
      ],
      "victory": [
        "The clock broker",
        "The contractor will bid for the timing trace. I have sold it proof that the city can run to my clock.",
        "I am taking my own account of what the clock left out."
      ],
      "defeat": [
        "Late payment",
        "The breach beat my schedule. The client can buy a watch, but it cannot buy a second chance.",
        "I will not backdate this report for anyone."
      ]
    }
  },
  "accident-genius": {
    "hero": {
      "arrival": [
        "A label on a bottle",
        "The vault log has the same batch number as the sludge I drank. I built a rescue rig from the discarded parts.",
        "I wrote down the students' names in case you forget them under pressure."
      ],
      "alarm": [
        "The human variable",
        "I can use the rig to move two people or salvage the lab record. Neither calculation makes the other cost disappear.",
        "Let me keep track of the people while you do the math."
      ],
      "reckoning": [
        "An unexpected result",
        "The patrol member is down and still holding a tool. I could ask how it works or remove the threat.",
        "A failed experiment is not a failed person."
      ],
      "victory": [
        "Open notebook",
        "I am releasing the rescue design without a patent. The batch number goes in the public archive.",
        "I will check the notebook for names before we publish it."
      ],
      "defeat": [
        "Bad model",
        "My calculation left out a person. I am going to write down the mistake rather than optimize it away.",
        "I kept the names. We can start the next design there."
      ]
    },
    "villain": {
      "arrival": [
        "A smaller equation",
        "The vault prototype can automate a district's rescue budget. I want a city that fits on one page.",
        "I joined to build drones, not to let a spreadsheet decide who exists."
      ],
      "alarm": [
        "The subtraction",
        "Evacuation costs us a timing window. Telemetry buys a whole new drone swarm. The numbers disagree with the faces.",
        "If you choose the numbers, I will still list the names."
      ],
      "reckoning": [
        "A failed test subject",
        "The rival's surrender changes the model. I can inspect their testimony or finish the optimization.",
        "I will disable my own drone before it attacks a surrendered person."
      ],
      "victory": [
        "Balanced books",
        "The city has seen what my machines can do. Its budget board will need me to finish the equation.",
        "My report will include the assumptions you did not publish."
      ],
      "defeat": [
        "Unsolvable",
        "The vault was not a controlled experiment. The people did not behave like variables and the model broke.",
        "I am saving the raw data, not deleting the outliers."
      ]
    }
  },
  "accident-birthright": {
    "hero": {
      "arrival": [
        "The family crest",
        "The contractor's seal has my grandfather's crest on the hinge. The cape remembers this place even if the family denies it.",
        "I am following Gus, not the crest. We can put that seal in the report."
      ],
      "alarm": [
        "A public cost",
        "I can wrap two students in the cape or hold the corridor while we capture the family record.",
        "I will take the other end of the cape. You do not have to reenact the newsreel alone."
      ],
      "reckoning": [
        "A second name",
        "The patrol member is down. The family would demand a clean photograph. I would rather hear who sent them.",
        "I can keep the cameras away from the wounded if you offer a truce."
      ],
      "victory": [
        "A revised oath",
        "The crest goes on the evidence table, not over the report. I will wear the cape without hiding what my family did.",
        "I will sign beside you, without a family logo."
      ],
      "defeat": [
        "No newsreel",
        "The cape stopped the wrong blow. This is going into the family archive without a heroic edit.",
        "I will preserve the raw footage."
      ]
    },
    "villain": {
      "arrival": [
        "A franchise opening",
        "That seal belongs to the family trust. The academy has been licensing its emergencies without consulting me.",
        "I signed on to protect people, not sell them branded rescue."
      ],
      "alarm": [
        "Terms of rescue",
        "I can open the student exit as a goodwill gesture or secure the footage that makes the academy sell its license.",
        "I am not turning evacuation into an advertisement."
      ],
      "reckoning": [
        "A rival franchise",
        "The fallen patrol member wears a rival logo. I can offer a contract-free truce or secure the territory.",
        "I will witness a truce only if there is no signature requirement."
      ],
      "victory": [
        "The trust takes over",
        "The academy will remember who owns the crest. My family can no longer pretend its old methods were charity.",
        "I am publishing the unbranded evacuation record."
      ],
      "defeat": [
        "Trademark disputed",
        "The academy has its footage and the trust has lost its bargaining chip. The cape never made a board seat legitimate.",
        "I will walk out under my own name."
      ]
    }
  },
  "accident-social": {
    "hero": {
      "arrival": [
        "A broken amplifier",
        "The alarm's pitch is the same one that changed my voice at the broadcasting tower. I can help people without making them agree with me.",
        "I have ear protection and a written signal for stop. I expect you to use it."
      ],
      "alarm": [
        "A voluntary chorus",
        "I can guide two students toward the exit or keep the transmitter trace intact. I will ask before I sing.",
        "I can guide them by hand signals if they decline."
      ],
      "reckoning": [
        "A voice off mic",
        "The fallen rival can speak without my accompaniment. I can listen or keep the others from reaching the switchboard.",
        "I will turn off the monitor so their answer is their own."
      ],
      "victory": [
        "No forced encore",
        "The report goes out in print. Nobody has to hear my voice to know what happened.",
        "I will distribute it with a silent version for anyone who wants one."
      ],
      "defeat": [
        "A missed harmony",
        "I could hear the panic and still could not reach everyone. Next time I will ask for help before the first note.",
        "I will be there with a written plan and no microphone."
      ]
    },
    "villain": {
      "arrival": [
        "The sponsor's frequency",
        "The broadcaster's seal can carry my voice across every speaker in the academy. The sponsors will pay for a captive audience.",
        "I can run the equipment, but I will not call a captive audience a fan club."
      ],
      "alarm": [
        "A commercial break",
        "I can clear the students through a quiet exit or record the signal proof that sells the sponsorship.",
        "I will keep the exit quiet, even if that ruins the broadcast."
      ],
      "reckoning": [
        "An unscripted answer",
        "The fallen rival heard my signal and resisted. I can let them answer off mic or drown the remaining patrol in noise.",
        "If they speak, I will record it without your backing track."
      ],
      "victory": [
        "The sold-out hall",
        "The sponsors know I can reach a room without a ticket sale. The city will have to negotiate for the silence.",
        "I am releasing an account with the audio stripped out."
      ],
      "defeat": [
        "Dead air",
        "The signal is gone and the sponsors are not answering. I do not know who would stay if I stopped singing.",
        "I will answer in writing, without a contract."
      ]
    }
  }
}
