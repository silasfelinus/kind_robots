import type { RainbowSave } from './rainbowLoadouts'
import type { RainbowHangar } from './rainbowHangar'
import { RAINBOW_PILOTS } from './rainbowPilots'

export type RainbowFlightComms = {
  tag: string
  lilt: string
  pilot: string
  pilotSeat: number
  pilotLine: string
}

type Beat = 'first' | 'return' | 'route' | 'rescue' | 'motherland'

const PILOT_REACTIONS: Record<Beat, readonly string[]> = {
  first: [
    'I tuned the distress receiver myself. We answer what calls.',
    'I mapped the shortcuts. I have not mapped who needs us yet.',
    'Stay on my wing. We bring each other home.',
    'If the stars want a concert, we can start with the engines.',
  ],
  return: [
    'Same sea, new signal. Biscuit already knows the way.',
    'I kept the old coordinates. I am looking for what changed.',
    'A return is not a retreat. It is another chance to protect us.',
    'Glitch stole the flight log. At least someone kept a copy.',
  ],
  route: [
    'There is another passage here. We do not abandon it.',
    'That route is on the chart now. The next choice is ours.',
    'Remember which corridor kept the crew together.',
    'I recorded the fork. There is a chorus in the static.',
  ],
  rescue: [
    'Someone got home because we stopped to listen.',
    'A rescue is a real coordinate, not a victory statistic.',
    'Count the lives aboard before you count the medals.',
    'I kept their signal. It is better than any encore.',
  ],
  motherland: [
    'I will not turn this radio into an order to hurt civilians.',
    'We have the evidence. Now we have to choose what it means.',
    'No flag gets to make the choice for my crew.',
    'The Motherland does not own our voices. Never did.',
  ],
}

export function rainbowFlightComms(
  save: RainbowSave | null,
  hangar: RainbowHangar,
  selectedAct: number,
  fallbackPilot = 0,
): RainbowFlightComms {
  const seat = save?.pilots?.[0] ?? save?.pilot ?? fallbackPilot
  const pilotSeat =
    Number.isInteger(seat) && seat >= 0 && seat < RAINBOW_PILOTS.length
      ? seat
      : 0
  const pilot = RAINBOW_PILOTS[pilotSeat]!
  const c = save?.checkpoint
  let tag = 'FIRST LAUNCH'
  let beat: Beat = 'first'
  let lilt =
    'Lilt-7 here. Welcome to the Luminous Ocean. The rescue channel is open.'

  if (selectedAct === 1 && c?.rescuedStation) {
    tag = 'BEACON RECOVERED'
    beat = 'rescue'
    lilt =
      'The Estuary station beacon is still broadcasting. Someone made it out.'
  } else if (selectedAct === 2 && c?.rescuedNemi) {
    tag = 'NEMI RESCUED'
    beat = 'rescue'
    lilt = 'Nemi is aboard. The Moonjelly distress signal was a plea, not bait.'
  } else if (selectedAct === 3 && c?.routeSettled) {
    tag = 'TRENCH ROUTE FOUND'
    beat = 'route'
    lilt =
      c.trenchRoute === 'vault'
        ? 'The Chromatic Trench vault passage is in our recovered chart.'
        : 'The safe passage is marked. The Nursery beacon still glows below.'
  } else if (selectedAct === 4 && c?.rescuedCourier) {
    tag = 'COURIER RECOVERED'
    beat = 'rescue'
    lilt = 'The Rosefin courier survived. Their coordinates are ours to keep.'
  } else if (selectedAct === 5 && c?.wreckSettled) {
    tag = 'WRECKYARD ROUTE FOUND'
    beat = 'route'
    lilt =
      c.wreckRoute === 'depot'
        ? `The survivor depot is logged. ${c.podsSaved} pods reached our ships.`
        : 'The armory was reached. Its salvage came with a price.'
  } else if (selectedAct === 6 && c?.reefSettled) {
    tag = 'CROWN REEF ROUTE FOUND'
    beat = 'route'
    lilt =
      c.reefRoute === 'relay'
        ? 'The Crown relay route is marked. We remember what it transmitted.'
        : 'The shield-cache passage is marked. Not every defense is a weapon.'
  } else if (selectedAct === 7 && c?.rescuedNavigator) {
    tag = 'NAVIGATOR RECOVERED'
    beat = 'rescue'
    lilt = 'The Lost Navigator is aboard. Their testimony changes this map.'
  } else if (selectedAct >= 8 && c?.allegiance) {
    tag = 'MOTHERLAND CHOICE'
    beat = 'motherland'
    lilt =
      c.allegiance === 'rebel'
        ? 'Our flight log remembers the day we refused the Motherland.'
        : 'Our flight log remembers the day we stayed with the Motherland.'
  } else if (save || Object.keys(hangar.medals).length > 0) {
    tag = 'RETURN FLIGHT'
    beat = 'return'
    lilt =
      'I kept your flight log between launches. A cleared sea is not a forgotten sea.'
  }

  return {
    tag,
    lilt,
    pilot: pilot.name,
    pilotSeat,
    pilotLine: PILOT_REACTIONS[beat][pilotSeat]!,
  }
}
