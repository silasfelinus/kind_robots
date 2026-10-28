import type { Grade } from './rules'

type RealNightCase = {
  briefing: string
  refused: string
  consequences: Record<Grade, string>
}

export const REAL_NIGHT_CASES: Record<string, RealNightCase> = {
  monorail: {
    briefing:
      'The last monorail has lost its brakes with sixty-seven people aboard. A passenger on the roof insists the derailment is being remotely steered; shutting down its network may disable the hospital crossing ahead.',
    refused: 'You stay off the monorail. Transit workers improvise a brake, but the academy contractor\'s remote command survives the night. The conductor\'s family comes looking for the student who ignored the call.',
    consequences: {
      honors:
        'The team anchors the lead carriage and escorts every passenger down. They trace the remote signal to an academy contractor, but the city asks why a student had access to its transit controls.',
      pass: 'The passengers survive while a supply tram takes the impact. Transit workers demand repairs before the academy puts another caped recruit on their tracks.',
      partial:
        'The carriages stop, but four riders are hospitalized and the emergency bridge closes. A rescued witness refuses to praise a success that cost their neighbors their jobs.',
      failed:
        'The train cuts through a maintenance barricade before civilian engineers halt it. Nobody accepts a training-room excuse for the injuries; the contractor uses the chaos to destroy its command logs.',
    },
  },
  museum: {
    briefing:
      'An underworld buyer has arranged a midnight exchange of the city archive key. Security staff and schoolchildren are still in the building after a late gala. Taking the key would give your team leverage over the dean.',
    refused: 'You decline the museum job. The buyer takes the archive key while the conservator evacuates visitors alone. The next morning the school finds its own accreditation records altered.',
    consequences: {
      honors:
        'The team obtains a copy of the key without taking the original and escorts the visitors out. The buyer leaves behind a coded invoice naming a city official.',
      pass: 'The exchange is interrupted and the key secured, but a museum conservator sees which student broke into the vault. They ask for the artifacts back rather than a reward.',
      partial:
        'Your crew gets the key, yet the buyer escapes after triggering a security lockdown. A child is separated from their family until morning, and the academy hears about it first.',
      failed:
        'The buyer takes the key and supplies false evidence that implicates the class. The conservator threatens to publish the camera recordings unless the students admit why they came.',
    },
  },
  flood: {
    briefing:
      'A real tidal surge is swallowing the lower-market ramps. Some vendors refuse evacuation because their medicine and immigration papers are locked inside the stalls. The seawall operator wants to save the wealthy promenade first.',
    refused: 'You leave the lower market to the emergency crews. The promenade receives the first sandbags, the vendors lose their medicine, and a dockworker remembers which rooftop you watched from.',
    consequences: {
      honors:
        'The team shelters the market and transfers the medication before the water reaches the electrical cabinets. The vendors invite the rescuers back to explain why the seawall failed.',
      pass: 'Everyone reaches higher ground, but the lower market loses weeks of stock. A stall owner offers evidence of the promenade diversion instead of gratitude.',
      partial:
        'The team saves the trapped families while a neighboring block floods. Residents demand a repair fund and refuse the mayor’s attempt to call it an act of nature.',
      failed:
        'The water overtops the market steps. Civilians are injured and a community kitchen is destroyed; the seawall operator publishes a triumphal report blaming student rescuers for a failure it concealed.',
    },
  },
  garden: {
    briefing:
      'The university greenhouse has grown across a residential fire lane. Its roots hold a missing botanist alive, but the institute wants every specimen burned before the city learns who financed the experiment.',
    refused: 'You close the greenhouse file without going inside. The institute burns its logs and the missing botanist\'s sister pins a photograph to the academy gates, asking who signed the order.',
    consequences: {
      honors:
        'The botanist and rare seedlings are recovered without spreading spores into the neighborhood. Residents gain a say in whether the research garden should remain.',
      pass: 'The botanist survives and the fire lane reopens. The institute retrieves its samples, but your team keeps evidence that the trial lacked community consent.',
      partial:
        'Your crew frees the botanist, yet the cut roots crack a water main. Neighbors need emergency housing, and the botanist begs the class not to erase the species.',
      failed:
        'The greenhouse consumes the fire lane until municipal crews break through. The institute blames the team and begins quietly shipping the dangerous cuttings elsewhere.',
    },
  },
  broadcast: {
    briefing:
      'A black-market broadcaster offers to leak a verified but terrifying evacuation forecast. The alert would help people leave the city and might also incite a stampede. A villain faction offers to pay your crew to control the release.',
    refused: 'You decline to intervene in the warning. The broadcaster releases half the forecast, the other half goes on sale, and frightened families blame whichever authority stayed silent.',
    consequences: {
      honors:
        'The team releases an accurate alert with accessible routes and time for correction. The broadcaster loses a monopoly on fear, and the city begins evacuating the threatened districts.',
      pass: 'The warning goes out, but a few neighborhoods receive it late. Students work through the night with volunteer interpreters to repair the damage caused by the delay.',
      partial:
        'A partial leak sparks panic at the central station while the actual danger remains unresolved. The broadcaster sells the missing pages to the highest bidder.',
      failed:
        'The faction substitutes a false all-clear for the alert. People who trusted the academy stay behind, and your team must explain why it let someone else speak for them.',
    },
  },
  skybridge: {
    briefing:
      'The east-tower skybridge is collapsing during a night shift. Eight cleaners are inside; the academy has already issued a statement describing them as an empty maintenance crew.',
    refused: 'You watch the tower lights go out from campus. Municipal crews pull the cleaners free late; a forewoman speaks their names at dawn and names every hero who failed to arrive.',
    consequences: {
      honors:
        'Every cleaner reaches the landing and their names make the morning bulletin. The bridge’s structural reports reveal that somebody accelerated its demolition.',
      pass: 'All eight survive, but the bridge is lost and several workers are injured. Their supervisor demands long-term medical coverage instead of a ceremonial medal.',
      partial:
        'A rescuer pulls the final cleaner free as a stairwell caves in. The tower remains closed, and the students must tell the workers’ families which decisions made the crossing so dangerous.',
      failed:
        'A city emergency team extracts the cleaners after the student plan collapses. Serious injuries and a cover-up investigation follow; an administrator tries to delete their names from the incident record.',
    },
  },
  ferris: {
    briefing:
      'A squall has stalled the pier wheel with a wedding party in the top car, and the pier owner is shouting to restart the motor before the news crews leave. The maintenance chief says the gearbox will shear if anyone forces it.',
    refused: 'You pass on the pier rescue. The owner restarts the wheel, the gearbox fails, and the maintenance chief keeps your unanswered call on the official incident tape.',
    consequences: {
      honors:
        'The team lowers every car by hand and the wedding goes ahead on the pier at midnight, rain and all. The maintenance chief shows the students the deferred-repair logs the owner told her to shred.',
      pass: 'The riders come down soaked and furious but unhurt. The wheel is condemned, and the pier owner tells reporters the academy cost the harbor its summer season.',
      partial:
        'The top car is saved, but a lower car tears loose and a young ride operator breaks an arm. The bride asks, on camera, who decided the news crews could stay.',
      failed:
        'The owner restarts the motor before the team is in position. The gearbox shears, the harbor patrol pulls riders out of the water, and the owner files a complaint naming your class.',
    },
  },
  blackout: {
    briefing:
      'The civic hospital substation has failed, and the backup generator was sold for scrap last spring. Ventilators are running on batteries. A villain crew offers a stolen generator in exchange for one week of academy patrol schedules.',
    refused: 'You refuse the hospital\'s request. Nurses hand-ventilate patients until sunrise. The stolen generator disappears, and a night orderly starts organizing against both city hall and the academy.',
    consequences: {
      honors:
        'The team holds the ward on channeled lightning while union electricians rewire the substation. The scrap receipt for the old generator carries a city official’s signature, and the hospital gets its power back without buying it from anyone.',
      pass: 'Power returns before the batteries die. Your team accepted nothing, but the hospital board hears how close the offer came and asks for a nurse on the patrol planning council.',
      partial:
        'The lights come back late, and two patients are moved across the city in the dark. The villain crew installs its generator anyway and sends the academy a polite invoice.',
      failed:
        'The batteries run down before the substation is restored. Nurses keep patients breathing by hand until dawn, and the stolen generator arrives with a patrol schedule somebody else supplied.',
    },
  },
  quarry: {
    briefing:
      'A maintenance tunnel on the Old Quarry line has collapsed on a crew of four. The transit authority wants the shaft sealed by morning because it runs beneath a bank vault. The sandhogs who once dug a buried man out of this same line have already started digging by hand.',
    refused: 'You leave the quarry workers to municipal rescue. Their own tunnel map saves two people, but the sealed fourth shaft becomes the subject of a furious labor hearing.',
    consequences: {
      honors:
        'The team folds a safe passage through the rubble and all four workers walk out. The sandhogs find the private bank entrance the authority wanted buried, and the city has to explain who approved it.',
      pass: 'All four workers are freed, one with a crushed leg. The authority seals the shaft that night, but the sandhogs keep the survey photographs and a list of who gave the order.',
      partial:
        'Three workers are freed; the fourth is reached a day later and lives. The authority cites the delay as proof that tunnels should be left to professionals, meaning itself.',
      failed:
        'The shaft is sealed before the team can open a passage. The sandhogs break through the wall on day six and carry out the survivors themselves, and they stop answering academy calls.',
    },
  },
  rally: {
    briefing:
      'A celebrity hero’s landing has cracked the plaza at a city rally, and the crowd is surging toward a single exit. The hero’s publicist wants students to announce that the panic was started by protesters at the back.',
    refused: 'You avoid the protest. Private security closes the only safe exit and a street medic spends the morning collecting testimony from people who watched the academy look away.',
    consequences: {
      honors:
        'The team calms the crowd section by section and opens two side streets. Nobody is crushed, the protest marshals help guide families out, and the publicist’s statement is never read.',
      pass: 'The square empties with sprains and bruises. The hero thanks the academy on camera, and it is a week before anyone corrects his version of who panicked first.',
      partial:
        'Most people get out, but a dozen are hurt against the barricades. The publicist’s statement runs before the injuries are counted, and two protest marshals spend the night in a cell.',
      failed:
        'The crowd crushes against the only exit until firefighters cut the barriers. The hero blames the protesters, the academy says nothing, and the city remembers the silence.',
    },
  },
  refinery: {
    briefing:
      'A yellow cloud is rolling off the east side refinery, and the air-quality sensors read clean because someone has smothered them. Residents are coughing in their stairwells. The refinery’s security chief says the leak is a scheduled drill.',
    refused: 'You leave the refinery alert unanswered. Toxic smoke reaches the row houses; residents begin measuring the air themselves and reject the city\'s official drill report.',
    consequences: {
      honors:
        'The team filters the cloud, carries the worst-hit residents to clinics and wakes every sensor. The smothering devices are in an evidence bag by morning, and the east side gets a monitoring station of its own.',
      pass: 'The leak is capped and everyone is breathing again by dawn. The sensors are repaired, but the refinery calls the devices vandalism by outsiders and the story sticks for now.',
      partial:
        'The leak is capped late, and forty residents are treated for burned lungs. Neighbors start keeping their own air monitors and video, and stop asking the academy for help.',
      failed:
        'The cloud settles over the row houses until a fire crew forces the valve shut. The drill story holds for a week, long enough for the smothering devices to disappear from the masts.',
    },
  },
  vault: {
    briefing:
      'Three laid-off armor testers have taken the Harbor Trust Bank in decommissioned academy suits, demanding the injury files the bank’s insurer buried. The bank offers your crew a private reward to retrieve one safe-deposit box before the police arrive.',
    refused: 'You decline the armor-tester standoff. The bank hires a rival hero, the testers are arrested before anyone reads their injury files, and their families take the story to campus.',
    consequences: {
      honors:
        'The team powers the suits down gently and talks the testers out with the files in hand. Everyone leaves the lobby alive, and the safe-deposit box turns out to hold the insurer’s original denial memos.',
      pass: 'The testers surrender and the hostages walk free. The files go to the court, but the deposit box vanishes in the confusion and the bank sends the academy a thank-you basket.',
      partial:
        'A suit overloads and two hostages are cut by flying glass. The testers are arrested before they can hand over the files, and the insurer calls them violent extremists on the evening news.',
      failed:
        'The suits seize and lock with the testers inside. Police breach the lobby, a teller is hurt, and the bank pays a rival class the reward for the deposit box.',
    },
  },
}

export function realNightCase(id: string): RealNightCase | undefined {
  return REAL_NIGHT_CASES[id]
}
