/**
 * Every crew journey ends in one of three authored epilogues: the left-hand
 * path held all the way, the right-hand path held all the way, or a city that
 * kept a bit of both (slime-city/t-059 endings gallery).
 */
export type EpilogueKey = 'left' | 'right' | 'mixed'
export const EPILOGUE_KEYS: readonly EpilogueKey[] = ['left', 'right', 'mixed']
