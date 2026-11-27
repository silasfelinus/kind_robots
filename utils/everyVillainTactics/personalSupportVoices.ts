import type { SignaturePowerId } from '../cometAcademy/specialPowers'

export type PersonalSupportVoice = {
  preference: 'mark' | 'guard'
  mark: string
  guard: string
  refuse: string
}

export const PERSONAL_SUPPORT_VOICES: Record<SignaturePowerId, PersonalSupportVoice> = {
  'accident-fire': {
    preference: 'guard',
    mark: 'The heat shimmer gives the patrol away.',
    guard: 'I can stand between you and the next flame.',
    refuse: "Strangers saved me from a burning kitchen. I won't pursue someone who is down.",
  },
  'accident-air': {
    preference: 'mark',
    mark: 'From above, their route is obvious.',
    guard: 'I will watch your landing.',
    refuse: 'Nobody deserves to be dropped because they lost their footing.',
  },
  'accident-earth': {
    preference: 'guard',
    mark: 'Their boots are vibrating through the floor.',
    guard: 'Get behind me while I brace the passage.',
    refuse: 'I spent nine days buried. I will not put another person under the rubble.',
  },
  'accident-water': {
    preference: 'guard',
    mark: 'The current ripples when the patrol moves.',
    guard: 'I can hold the pressure back.',
    refuse: 'Water belongs to everyone, including a fallen rival.',
  },
  'accident-discipline': {
    preference: 'mark',
    mark: 'There is a gap between their steps. I can count it.',
    guard: 'I will keep time while you recover.',
    refuse: 'My extra second is for rescue, not revenge.',
  },
  'accident-genius': {
    preference: 'mark',
    mark: 'Their movement follows a predictable series.',
    guard: 'I calculated a safer angle for our squad.',
    refuse: 'An injured person is not an error term.',
  },
  'accident-birthright': {
    preference: 'guard',
    mark: "The old cape manuals show this formation's weakness.",
    guard: 'My family cape can shelter someone besides me.',
    refuse: "My grandfather's name is not permission to strike the beaten.",
  },
  'accident-social': {
    preference: 'guard',
    mark: 'I hear which voice is still directing the patrol.',
    guard: 'I will give you a steady rhythm to move behind.',
    refuse: "I can make a crowd angry. That doesn't mean I should.",
  },
  'mutant-fire': {
    preference: 'guard',
    mark: 'Their heat stands out against the concrete.',
    guard: 'My healing flame can shelter our crew.',
    refuse: 'Registration officers made me a target. I refuse to do that to someone helpless.',
  },
  'mutant-air': {
    preference: 'mark',
    mark: "The patrol can't hide its route from my wings.",
    guard: "I'll watch the exit while you move.",
    refuse: "I hid under a coat for years. I won't corner someone with nowhere to go.",
  },
  'mutant-earth': {
    preference: 'guard',
    mark: 'I feel their boots through the tiles.',
    guard: 'Someone has to hold the weight while you move.',
    refuse: 'I know what it is to be called a monster. I will not chase the fallen.',
  },
  'mutant-water': {
    preference: 'guard',
    mark: 'The pipes tell me where they crossed.',
    guard: 'Stay close while I keep the wet passage clear.',
    refuse: 'My harbor does not abandon people who are sinking.',
  },
  'mutant-discipline': {
    preference: 'guard',
    mark: 'Grandmother taught me to read their balance.',
    guard: 'Four arms can shelter two people at once.',
    refuse: 'The last step of a dance is a bow, not a kick at someone on the floor.',
  },
  'mutant-genius': {
    preference: 'mark',
    mark: 'I modeled their next three moves.',
    guard: 'I have a fallback plan for our fallback plan.',
    refuse: 'I know what it means to have a life measured in probabilities.',
  },
  'mutant-birthright': {
    preference: 'guard',
    mark: "A guardian's watch begins with the real threat.",
    guard: 'My wings are a shelter, not a badge.',
    refuse: 'My ancestors did not grant me the right to punish someone who surrendered.',
  },
  'mutant-social': {
    preference: 'guard',
    mark: "Their leader projects confidence the others don't share.",
    guard: 'I can steady our team without deciding for them.',
    refuse: 'Friendship that cannot be refused is not friendship.',
  },
  'tech-fire': {
    preference: 'guard',
    mark: 'My visor caught their exhaust heat.',
    guard: 'The scrap gauntlet can hold this lane.',
    refuse: "I built this to make exits work, not burn people who can't escape.",
  },
  'tech-air': {
    preference: 'mark',
    mark: 'My racing feed gives us a clear view of their position.',
    guard: "I'll watch the approach from my wingsuit.",
    refuse: "I lost a scholarship over safety concerns. I won't ground someone out of spite.",
  },
  'tech-earth': {
    preference: 'guard',
    mark: "My excavator mapped the patrol's movement.",
    guard: 'This rig dug a classroom out of rubble.',
    refuse: "I didn't build rescue machinery to turn someone into debris.",
  },
  'tech-water': {
    preference: 'guard',
    mark: 'My diving rig detected movement along that passage.',
    guard: 'The rescue suit can take the next impact.',
    refuse: "I know what happens when rescue budgets disappear. I won't withhold help.",
  },
  'tech-discipline': {
    preference: 'mark',
    mark: 'I can cross their line of sight and call the opening.',
    guard: 'My prosthetics give me a stable stance.',
    refuse: "I don't need to prove myself against someone who cannot stand.",
  },
  'tech-genius': {
    preference: 'mark',
    mark: 'My scanner can identify the active threat.',
    guard: 'The rescue harness has spare shielding.',
    refuse: 'I will not turn a surrendered person into a test subject.',
  },
  'tech-birthright': {
    preference: 'guard',
    mark: "My armor recognizes the patrol's power systems.",
    guard: 'The suit has reserve shielding, no invoice required.',
    refuse: "A company logo isn't a license to hurt someone who surrendered.",
  },
  'tech-social': {
    preference: 'mark',
    mark: "My glasses caught the patrol's movement.",
    guard: 'I can cover you without broadcasting private details.',
    refuse: 'I built these to document abuses, not turn the injured into content.',
  },
  'magic-fire': {
    preference: 'guard',
    mark: 'My salamander sees which flame the patrol disturbed.',
    guard: 'The wick will burn between us and the next attack.',
    refuse: "I traded my voice for this power. I won't take another person's last chance to speak.",
  },
  'magic-air': {
    preference: 'mark',
    mark: 'The storm song changes as they cross the doorway.',
    guard: "I'll hold a pocket of calm air.",
    refuse: 'A choir needs room to breathe, even after the song ends.',
  },
  'magic-earth': {
    preference: 'guard',
    mark: 'The pavement tells me where those boots are.',
    guard: 'Sixty years on demolition crews taught me to shore up corners.',
    refuse: 'Nobody gets left on my worksite, least of all a fallen worker.',
  },
  'magic-water': {
    preference: 'mark',
    mark: 'The silver bowl shows the active patrol.',
    guard: "I'll keep the water still while you move.",
    refuse: "I've seen what happens if we keep chasing. I refuse that future.",
  },
  'magic-discipline': {
    preference: 'guard',
    mark: 'My old order taught me to read that formation.',
    guard: "I'll hold the door as I did in the mountain passes.",
    refuse: "I left the order when it refused refugees. I won't abandon someone again.",
  },
  'magic-genius': {
    preference: 'mark',
    mark: 'Their positions resolve into a solvable pattern.',
    guard: 'I can close the equation around our position.',
    refuse: 'No equation is complete if it erases the people it describes.',
  },
  'magic-birthright': {
    preference: 'guard',
    mark: 'The grimoire recognizes a hostile presence.',
    guard: 'Mother taught me the houseward before any attack.',
    refuse: 'A hearth shelters a guest even if the guest was an enemy yesterday.',
  },
  'magic-social': {
    preference: 'mark',
    mark: "A good emcee knows who's leading the heckling.",
    guard: "I'll keep our crew focused on the exit.",
    refuse: "I owe a spirit for this charm. I won't make someone else pay.",
  },
  'alien-fire': {
    preference: 'guard',
    mark: "Sunlight catches the patrol's equipment.",
    guard: "My colony's sun can cover our crew.",
    refuse: "I arrived as a refugee. I won't make an injured stranger beg to leave.",
  },
  'alien-air': {
    preference: 'mark',
    mark: 'Their route is obvious from above.',
    guard: 'I will maintain a clear landing zone despite the solid ground.',
    refuse: 'Diplomatic immunity does not authorize attacking the surrendered.',
  },
  'alien-earth': {
    preference: 'guard',
    mark: 'Their footsteps are unusually loud to silicon ears.',
    guard: 'Six millennia of standing still prepared me to hold this passage.',
    refuse: 'I know what it is to be displayed as property. No cages.',
  },
  'alien-water': {
    preference: 'guard',
    mark: 'A fish in the drain tells me where the patrol crossed.',
    guard: "I'll keep the current gentle around you.",
    refuse: "My mother's tide never asked if a swimmer deserved shore.",
  },
  'alien-discipline': {
    preference: 'mark',
    mark: 'Their guard has the opening my guild taught me to find.',
    guard: 'My sword can hold this route without collecting a bounty.',
    refuse: 'I did not sign a warrant for someone who surrendered.',
  },
  'alien-genius': {
    preference: 'mark',
    mark: "I'll share the sensor reading without installing anything in your head.",
    guard: 'Use this shield. Here is how to switch it off.',
    refuse: "I was exiled for sharing knowledge, not for taking people's choices away.",
  },
  'alien-birthright': {
    preference: 'guard',
    mark: 'Palace guards used a similar formation.',
    guard: "I'll hold the passage as I wish someone held the mirror for me.",
    refuse: "A crown doesn't turn a surrendered citizen into property.",
  },
  'alien-social': {
    preference: 'guard',
    mark: "I hear their coordination. I'll report what I can confirm aloud.",
    guard: 'We can coordinate without linking anyone who declines.',
    refuse: 'Nobody should surrender their will to be safe.',
  },
  'psychic-fire': {
    preference: 'guard',
    mark: "Heat is pooling near the patrol's position.",
    guard: 'I know where the extinguisher is. Follow me.',
    refuse: "I've frightened enough people by accident. I won't do it for revenge.",
  },
  'psychic-air': {
    preference: 'mark',
    mark: 'I can levitate to see their open flank.',
    guard: "The stairwell taught me to catch myself. I'll help you steady.",
    refuse: "Falling is terrifying. I won't turn it into punishment.",
  },
  'psychic-earth': {
    preference: 'mark',
    mark: 'The stones remember their route.',
    guard: "I'll keep the foundation steady.",
    refuse: "City hall's cornerstone taught me buried crimes stay crimes.",
  },
  'psychic-water': {
    preference: 'guard',
    mark: 'Tension is rising around the patrol.',
    guard: "I'll keep the crew calm without taking their feelings away.",
    refuse: "I know the weight of other people's grief. I won't manufacture more.",
  },
  'psychic-discipline': {
    preference: 'mark',
    mark: 'Their next move is already visible in their stance.',
    guard: "I'll hold the line while you reposition.",
    refuse: 'The first lesson in the library was knowing when a fight is over.',
  },
  'psychic-genius': {
    preference: 'mark',
    mark: 'I can identify the threat without reading private memories.',
    guard: "I'll calculate the safe angle and explain my reasoning.",
    refuse: "Access to a person's mind doesn't make me their judge.",
  },
  'psychic-birthright': {
    preference: 'guard',
    mark: "I saw them cross that spot in a possible future. Let's verify.",
    guard: "I saw a version where we lost someone. I'll cover you.",
    refuse: 'A prediction is a warning, not a warrant.',
  },
  'psychic-social': {
    preference: 'mark',
    mark: "I can identify who's giving orders without repeating private thoughts.",
    guard: "I'll help you move without sharing your fears.",
    refuse: "I printed a secret I should have kept. I won't make another wounded person a headline.",
  },
}

export function personalSupportVoice(identity: string): PersonalSupportVoice | undefined {
  return Object.hasOwn(PERSONAL_SUPPORT_VOICES, identity)
    ? PERSONAL_SUPPORT_VOICES[identity as SignaturePowerId]
    : undefined
}
