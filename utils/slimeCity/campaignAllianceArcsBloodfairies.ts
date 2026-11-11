import type { TeamId } from './prototypes'
import {
  arc,
  beat,
  end,
  type AllianceLaterArc,
} from './campaignAllianceArcTypes'

export const bloodfairyAllianceArcs = {
  catgirls: arc(
    [
      beat(
        'A recording engineer threatens to put the fugitive singers’ tracking codes in the liner notes.',
        'Replace the credits with stage names',
        'The catgirls choose pseudonyms that belong to them, not the lab that tagged them.',
        'Hide a legal confession in the mix',
        'The master tape plays the engineer admitting who paid for the surveillance.',
      ),
      beat(
        'A new verse from the singers triggers the old laboratory’s recall alarms.',
        'Rehearse it without broadcasting',
        'The melody stays alive in the room, and no hunter learns where its singers sleep.',
        'Jam the recall signal with the chorus',
        'The alarm turns into the loudest song on the pirate frequency.',
      ),
      beat(
        'The band’s final roadshow is stopped at a checkpoint that scans blood instead of tickets.',
        'Smuggle the singers in the equipment van',
        'The frightened singers arrive with their instruments and their freedom intact.',
        'Turn the scanners on the guards',
        'The checkpoint identifies its own officers as stolen laboratory inventory.',
      ),
      beat(
        'A promoter offers a worldwide stage if the catgirls will perform without masks.',
        'Let the singers choose their own reveal',
        'The first faces appear only when each singer gives the nod to the lighting booth.',
        'Turn the offer into a public exposure',
        'The promoter’s sponsorship documents fill the arena’s screens before the encore.',
      ),
    ],
    end(
      'THE VOICES THEY COULD NOT OWN',
      'The album is credited to the singers’ chosen names. No portrait or serial number is printed without permission, and the band keeps its promise.',
      'The song breaks the laboratory’s monopoly on its own broadcasts. Every arena hears the escapees’ version of the truth, not the owners’.',
    ),
  ),
  ironjaw: arc(
    [
      beat(
        'A furnace breakdown leaves the lizard road crew too cold to carry the amps onstage.',
        'Give the roadies the warm dressing rooms',
        'The musicians rehearse in coats while the workers recover their strength.',
        'Turn the broken furnace into a drum',
        'A foundry mechanic beats out the song on hot steel and the venue joins in.',
      ),
      beat(
        'The factory owner offers a festival permit in exchange for ending the workers’ strike.',
        'Play the strike line for free',
        'The factory gates become a stage and no worker has to buy a ticket to be heard.',
        'Broadcast the owners’ offer verbatim',
        'The entire city hears how cheaply the owner tried to buy a silence.',
      ),
      beat(
        'The only remaining amplifier is powered by a machine that charges workers for heat.',
        'Rewire it to warm the workers first',
        'The stage is quieter, but the lizard crew stays alive through the night.',
        'Overload the meter with a wall of sound',
        'The sound bill climbs until the factory owner’s account shorts out.',
      ),
      beat(
        'During the finale, security locks the foundry doors with the road crew still inside.',
        'Open the emergency doors before the chorus',
        'The band starts late; every roadie walks out beneath the first spotlight.',
        'Make the locked doors part of the rhythm',
        'The crowd pounds the beat until the hinges and the lockout both fail.',
      ),
    ],
    end(
      'A SETLIST FOR THE SHIFT',
      'The tour ends at a warm union hall where the roadies own the lighting rig. Nobody is billed for heat, and the band never plays without them.',
      'The owners lose their stage, their gates, and their audience. The factory whistle plays the band’s encore instead of the shift siren.',
    ),
  ),
  riot: arc(
    [
      beat(
        'Anarkiss wants to fire a cannon during the second verse, but the fan pit has no second exit.',
        'Build a real fire lane first',
        'The audience stays near the stage because the stewards show them how to leave safely.',
        'Fire an empty confetti cannon at the inspectors',
        'A rain of paper citations buries the permit officers while the band plays on.',
      ),
      beat(
        'A rival promoter books two acts on the same stage and plans to let the crowd fight.',
        'Share the stage and alternate songs',
        'The two front performers trade verses until the fans learn the refrain together.',
        'Broadcast the promoter’s rigged ticket sales',
        'The crowd boos the promoter offstage instead of fighting each other.',
      ),
      beat(
        'The pyrotechnician disappears, leaving a lit fuse connected to the stage supports.',
        'Cut power and search for the missing worker',
        'The show pauses; the crew finds the worker bound behind the fly tower.',
        'Redirect the fuse into the rival billboard',
        'The billboard erupts in harmless sparks and reveals the kidnappers’ hiding place.',
      ),
      beat(
        'At midnight the city orders a silent finale while the fans fill the square.',
        'Finish with an unplugged chorus',
        'Every voice carries the tune without a soundboard, and the police have nothing to unplug.',
        'Hijack the city’s official countdown',
        'The siren becomes an intro riff and the city counts down to its own defeat.',
      ),
    ],
    end(
      'TWO ACTS, ONE EXIT',
      'Anarkiss and Bloodfairies retire the dangerous prop cannon and keep the shared stage. The next audience inherits both a song and a safe way home.',
      'The city’s cancellation order becomes a platinum record sleeve. The midnight concert ends in a siren that the crowd sings back at dawn.',
    ),
  ),
  undertow: arc(
    [
      beat(
        'A hidden microphone in the bassist’s monitor is feeding the band’s private messages to police.',
        'Pull the monitor and protect the crew',
        'The musicians play by ear while the Oracle removes every compromised wire.',
        'Feed the microphone a fake rehearsal',
        'The police raid a studio full of empty instrument stands.',
      ),
      beat(
        'The new song contains a sonic code that opens an Undertow safehouse every time it is streamed.',
        'Change the bridge before release',
        'The safehouse stays hidden while the tune survives in a quieter arrangement.',
        'Turn the code into a decoy broadcast',
        'A thousand false doors appear on the police map while the real relay goes dark.',
      ),
      beat(
        'A whistleblower offers a secret list of jailed fans, but releasing it could endanger their families.',
        'Give the families private copies',
        'The families choose their own rescue routes, and no face becomes a publicity stunt.',
        'Hijack the arrest database live',
        'Every missing fan appears on the police system as already released.',
      ),
      beat(
        'The final show can break the city signal once, but doing so would disable the emergency alarms.',
        'Keep a channel open for emergencies',
        'The encore broadcasts around the warning system and preserves the neighborhood’s only lifeline.',
        'Replace the emergency siren with a public confession',
        'The authorities hear their own raid orders across the airwaves and abandon the stage.',
      ),
    ],
    end(
      'THE ENCORE BELOW THE STATIC',
      'The band protects the relay it once needed to hide from. Fans can call for help over the same frequencies that carried the banned songs.',
      'The city loses its monopoly on the airwaves. The band releases the final track with the names of the officials who ordered the raids.',
    ),
  ),
  exchange: arc(
    [
      beat(
        'The label begins paying the band in vouchers redeemable only for human tissue.',
        'Pay the roadies in real Meat instead',
        'The crew dumps the vouchers in a public shredder and shares a lawful dinner.',
        'Issue counterfeit vouchers to the collectors',
        'The debt collectors queue at their own window and discover the vouchers are worthless.',
      ),
      beat(
        'A vintage test pressing whispers the true name of the Exchange’s patron whenever the needle skips.',
        'Destroy the dangerous master',
        'The patron’s name survives only in the memory of the drummer who refused the bargain.',
        'Loop the skip through the auction hall',
        'The ancient patron’s name rattles the auction chandeliers until every bidder flees.',
      ),
      beat(
        'The drummer’s contract lists their heartbeat as collateral and the record company calls it standard practice.',
        'Strike the clause before the next set',
        'Every musician signs a new agreement that protects their own body.',
        'Read the clause aloud onstage',
        'The audience starts a bidding war for the publisher’s own heartbeat instead.',
      ),
      beat(
        'The Exchange presents a final gold record made from all the names of people who bought tickets.',
        'Melt the record without playing it',
        'The names return to their owners and the haunted record becomes harmless scrap.',
        'Play it backward at the final auction',
        'The collectors hear their own names called as the next lots and run for the exits.',
      ),
    ],
    end(
      'NO DEBT ON THE ENCORE',
      'The Bloodfairies own their masters and their heartbeats. The record company receives one last invoice for the salaries it withheld.',
      'The Exchange’s most lucrative record plays backward and cancels every debt it ever recorded. The band calls it a live album.',
    ),
  ),
} satisfies Partial<Record<TeamId, AllianceLaterArc>>
