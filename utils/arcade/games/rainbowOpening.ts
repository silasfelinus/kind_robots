// /utils/arcade/games/rainbowOpening.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-034. Silas, 2026-10-23 PT: "We can use a real animation
// at the beginning, maybe a 15 second high energy thrash metal music video." The track is an ACE-Step render queued
// by utils/scripts/enqueueRainbowScore.ts (--only opening); the picture is cut from WAN clips of approved stills
// (conductor projects/rainbow-bullet-hell-space-princess/art/OPENING-CLIPS-1.yaml) by conductor
// scripts/export_rainbow_opening.py, which publishes /rainbow-princess-video/opening.{webm,mp4} and rewrites
// RAINBOW_OPENING below. Until then RAINBOW_OPENING is null and the Fly tab offers no opening.

/** The opening's track: 16 seconds of instrumental thrash metal, cut down to the video. */
export const RAINBOW_OPENING_TRACK = {
  id: 'opening',
  seconds: 16,
  bpm: 176,
  prompt:
    'instrumental, no vocals, thrash metal, blistering fast palm-muted downpicked riffs, twin lead guitar harmonies, shredding guitar solo, double kick drum blast, galloping bass, pounding toms and crash cymbals, aggressive, triumphant, high energy anime opening, big unison ending hit, E minor, 176 bpm',
} as const

export type RainbowOpeningMedia = {
  webm: string
  mp4: string
  poster: string
  seconds: number
  /** How many of the shots are animated clips (the rest are stills with a punch-in until their clip renders). */
  clips: number
  shots: number
}

// Written by conductor scripts/export_rainbow_opening.py from what it shipped. Do not edit by hand.
export const RAINBOW_OPENING: RainbowOpeningMedia | null = null
