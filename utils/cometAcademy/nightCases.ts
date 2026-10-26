import type { Grade } from './rules'

type RealNightCase = {
  briefing: string
  consequences: Record<Grade, string>
}

export const REAL_NIGHT_CASES: Record<string, RealNightCase> = {
  monorail: {
    briefing:
      'The last monorail has lost its brakes with sixty-seven people aboard. A passenger on the roof insists the derailment is being remotely steered; shutting down its network may disable the hospital crossing ahead.',
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
}

export function realNightCase(id: string): RealNightCase | undefined {
  return REAL_NIGHT_CASES[id]
}
