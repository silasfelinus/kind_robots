// /utils/oracle/spreads.ts
//
// Spread definitions: positions, labels and the frame phrase wrapping a card's text.

import type { OraclePositionId, OracleSpread, OracleSpreadId } from './types'

export const ORACLE_SPREADS: Record<OracleSpreadId, OracleSpread> = {
  one: {
    id: 'one',
    label: 'One card',
    positions: [
      {
        id: 'today',
        label: "Today's Companion",
        frame: 'Your companion today is {card}.',
      },
    ],
  },
  three: {
    id: 'three',
    label: 'Three cards',
    positions: [
      {
        id: 'past',
        label: 'What Brought You Here',
        frame: 'What brought you here: {card}.',
      },
      {
        id: 'present',
        label: 'What Is Here',
        frame: 'What is here now: {card}.',
      },
      {
        id: 'future',
        label: 'What Is Ready to Open',
        frame: 'What is ready to open: {card}.',
      },
    ],
  },
  five: {
    id: 'five',
    label: 'Five cards',
    positions: [
      {
        id: 'heart',
        label: 'The Heart of It',
        frame: 'At the heart of it: {card}.',
      },
      { id: 'help', label: 'What Helps', frame: 'What helps: {card}.' },
      {
        id: 'hinder',
        label: 'What Gets in the Way',
        frame: 'What gets in the way: {card}.',
      },
      {
        id: 'ground',
        label: 'What Is Underneath',
        frame: 'Underneath it all: {card}.',
      },
      { id: 'next', label: 'A Next Step', frame: 'A next step: {card}.' },
    ],
  },
}

export const ORACLE_SPREAD_IDS = Object.keys(ORACLE_SPREADS) as OracleSpreadId[]

export const spreadPositionIds = (id: OracleSpreadId): OraclePositionId[] =>
  ORACLE_SPREADS[id].positions.map((p) => p.id)
