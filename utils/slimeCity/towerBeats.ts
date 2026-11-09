// Each Alliance floor has two authored approaches. Hazard rules are applied
// separately by allianceTower.ts, so this prose never promises a free reward.
export interface TowerBeat {
  setting: string
  routes: readonly [
    { title: string; scene: string },
    { title: string; scene: string },
  ]
}

export const TOWER_BEATS = [
  {
    setting: 'The entry desk has sold the same ticket to six crews. The clerk refuses to refund any of them.',
    routes: [
      {
        title: 'THE COUNTERFEIT STAMP',
        scene: 'Slip past the ticket booth with a stamp made from a bottle cap. The clerk recognizes it but waves you through anyway.',
      },
      {
        title: 'THE PUBLIC COMPLAINT',
        scene: 'Get the other crews to demand a hearing. The clerk opens the service door just to escape the shouting.',
      },
    ],
  },
  {
    setting: 'A freight lift creaks above a line of Ironjaw workers whose shifts ended years ago.',
    routes: [
      {
        title: 'THE UNION LIFT',
        scene: 'Help the workers jam the supervisor button. They send your team upstairs before the foreman can reset it.',
      },
      {
        title: 'THE MAINTENANCE SHAFT',
        scene: 'Climb the counterweight ladder. A worker below silently keeps the lift from crushing your fingers.',
      },
    ],
  },
  {
    setting: 'The trophy gallery displays victories from matches nobody can remember playing.',
    routes: [
      {
        title: 'THE MISSING WINNER',
        scene: 'Follow a scratched-out champion name to a locked records room. Somebody wants that old match forgotten.',
      },
      {
        title: 'THE LOSERS WALL',
        scene: 'Ask the defeated captains what they saw. One points out a door hidden behind the largest trophy.',
      },
    ],
  },
  {
    setting: 'Undertow microphones dangle over a flooded courtroom where every verdict is broadcast live.',
    routes: [
      {
        title: 'THE OPEN HEARING',
        scene: 'Testify about the tower in front of its own cameras. The judge calls a recess before the audience can ask questions.',
      },
      {
        title: 'THE SILENT CHANNEL',
        scene: 'Borrow a technician badge and cross beneath the witness stand while the speakers replay yesterday’s trial.',
      },
    ],
  },
  {
    setting: 'Punk Bloodfairies rehearse on the roof. Half the chorus has been hired to drown out the other half.',
    routes: [
      {
        title: 'THE SECOND VERSE',
        scene: 'Offer both choirs the same microphone. They sing different words, but neither will let the other be cut off.',
      },
      {
        title: 'THE BACKSTAGE LADDER',
        scene: 'Carry a broken amplifier up the service stairs. The stage manager offers directions instead of payment.',
      },
    ],
  },
  {
    setting: 'A Gene Riot clinic has opened inside a shuttered souvenir factory. Its patients are still wearing price tags.',
    routes: [
      {
        title: 'THE NAME REGISTER',
        scene: 'Help the patients replace their product numbers with names. The clinic director quietly hands over a stairwell key.',
      },
      {
        title: 'THE ASSEMBLY EXIT',
        scene: 'Escort the night shift out past the factory sensors. One technician shows you a route the guards never inspect.',
      },
    ],
  },
  {
    setting: 'The next floor is a bazaar of cards that promise wins but leave their owners owing interest.',
    routes: [
      {
        title: 'THE SMALL PRINT',
        scene: 'Read the contracts aloud until the dealers stop smiling. A creditor offers a shortcut to make you leave.',
      },
      {
        title: 'THE BROKEN AUCTION',
        scene: 'Join the bidders and offer a worthless trophy. The auctioneer accepts it with suspicious enthusiasm.',
      },
    ],
  },
  {
    setting: 'The foundry level shakes whenever the tower announces another match. Rivets fall like hail.',
    routes: [
      {
        title: 'THE COOLING WALKWAY',
        scene: 'Cross beside the emergency water pipes. The workers call out which plates are safe to put weight on.',
      },
      {
        title: 'THE FURNACE BALCONY',
        scene: 'Follow the narrow catwalk above the molten scrap. An apprentice points to the old champion’s entrance.',
      },
    ],
  },
  {
    setting: 'A pirate radio station is broadcasting live commentary about your team, including things you never said.',
    routes: [
      {
        title: 'THE LIVE CORRECTION',
        scene: 'Walk into the studio and correct the announcer on air. The producer leaves the door unlocked for the next argument.',
      },
      {
        title: 'THE TRANSMITTER ROOM',
        scene: 'Trace the fake interview back to its switchboard. A bored engineer tells you which wire carries the real feed.',
      },
    ],
  },
  {
    setting: 'Two rival crews are arguing over the only bridge between the upper stands. Neither claims to own it.',
    routes: [
      {
        title: 'THE SHARED CROSSING',
        scene: 'Offer to escort both parties across together. They agree, then spend the entire walk denying they needed help.',
      },
      {
        title: 'THE SERVICE TRUSS',
        scene: 'Find a maintenance crossing under the bridge. Its builder left handholds sized for ogres and fairies alike.',
      },
    ],
  },
  {
    setting: 'The judges have gathered to decide who is allowed into the Grand Pit. Their votes are for sale.',
    routes: [
      {
        title: 'THE RECORDED VOTE',
        scene: 'Make the panel announce each ruling by name. One judge changes their vote when the microphones turn on.',
      },
      {
        title: 'THE JURY EXIT',
        scene: 'Follow the custodians through a side door. They know which judges have already left by the back way.',
      },
    ],
  },
  {
    setting: 'The Grand Pit opens above the city. Every crew you passed has a seat, and nobody agrees who deserves the crown.',
    routes: [
      {
        title: 'THE OPEN CHALLENGE',
        scene: 'Step into the light and name your opponent. The crowd stops arguing long enough to hear the answer.',
      },
      {
        title: 'THE UNINVITED FINALIST',
        scene: 'Enter through the fighters’ gate without an introduction. The announcer checks the ledger twice and starts the match.',
      },
    ],
  },
] as const satisfies readonly TowerBeat[]
