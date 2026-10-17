// /utils/arcade/cableCrawler/mazesBios.ts
//
// The secret seventh component, the BIOS (conductor kr-arcade/t-067): three green-screen mazes
// and the Boot Loader's room. It opens once every one of the thirty golden bytes of the six main
// components is found. Its mazes are the CPU Core's lattices turned upside down and remixed with
// the clock and the interrupts, so every earlier mechanic comes round again. Legend in mazes.ts.
// The Boot Loader's three checksum sockets are the single-cell pin banks 1-3 of its room.

import type { MazeLayout } from './mazes'

export const BIOS_MAZES: readonly MazeLayout[] = [
  {
    id: 'bios-1',
    name: 'POST CHECK',
    clock: true,
    interrupts: 1,
    rows: [
      '#######################',
      '#. . . .  #P  #. . .  #',
      '# ##### ##### # ### # #',
      '#.#  . . S    #.#. .#.#',
      '# ### ### ##### # # # #',
      '#.#. .#. . .#  . .#. .#',
      '# # # # ### ### # # # #',
      '#.#.#.#.# #.#. . .#. .#',
      '# # # # # # # ##### # #',
      '#.#.#. .# #.#.#. .#  r#',
      '# # ### # # # # # # # #',
      '#. . .  # #  . .#.#. .#',
      '##### # # # # # # ### #',
      '#.   . S  #.#$ . . . S#',
      '# ####### # # ##### # #',
      '# #. .#   #.# #. .#.#.#',
      '# # # ##### ### # # # #',
      '#. .#. . . . . .#. . .#',
      '#######################',
    ],
  },
  {
    id: 'bios-2',
    name: 'MEMORY MAP',
    clock: true,
    interrupts: 2,
    rows: [
      '#######################',
      '#    .   .#P . .#     #',
      '##### # # # ### # #####',
      '#.   .#.#. . .#.#     #',
      '# # ### ### # # ##### #',
      '#.#$ .#.   . S#. . . .#',
      '# # # ####### ####### #',
      '#. S#  .#    .# #.   .#',
      '# # ### ##### # # #####',
      '#. . .#. . .#. . . . .#',
      '### # ### # ### # # # #',
      '#b . . . . . . S   . .#',
      '# # ### # ##### # ### #',
      '#.#. .#. .#. .# #. . r#',
      '# # # # ### # ### ### #',
      '#. .#.#   #.#. .#S . .#',
      '# ### ##### ### # # # #',
      '#   #.   . .  #. .#. .#',
      '#######################',
    ],
  },
  {
    id: 'bios-3',
    name: 'BOOT SECTOR',
    clock: true,
    interrupts: 3,
    rows: [
      '#######################',
      '#         #P . . .#. .#',
      '# ####### # # # # # # #',
      '#. . . .# #.# #. . m#.#',
      '# ##### ### ### # # # #',
      '#.#  .#. .#. .#.#  S .#',
      '# # # ### ### # # ### #',
      '# #.#.# #. . .#.#.#. .#',
      '# # # # ### # # # # ###',
      '#. .#. . . . .#.#. S  #',
      '####### # ### # # # # #',
      '# #. . S#. .#. .#.#. .#',
      '# # ### ### # ### ### #',
      '# #  .#. .#.   . . . .#',
      '# ### # # ### # ### # #',
      '#  .#.   $ r . S . .# #',
      '# # ##### ##### ##### #',
      '#. . . b r . . .#     #',
      '#######################',
    ],
  },
]

/**
 * The Boot Loader's room: an open board of text-mode pillars that it rewrites a line at a time,
 * with three checksum sockets (1-3) to find and surge.
 */
export const BOOT_ROOM: MazeLayout = {
  id: 'bios-boss',
  name: 'THE BOOT LOADER',
  open: true,
  clock: false,
  interrupts: 0,
  rows: [
    '#######################',
    '#. . . . . . . . . . .#',
    '#   #              #  #',
    '#. 1 . . . . . . . . .#',
    '#                     #',
    '#. . S . . . . S . . .#',
    '#     #         #     #',
    '#. . . . . . . . . . .#',
    '#                     #',
    '#. . . . . B . . . . .#',
    '#                     #',
    '#. . . . . . . . . . .#',
    '#     #         #     #',
    '#. . S . . . . S . . .#',
    '#                     #',
    '#. . . . . . . . 2 . .#',
    '#  #               3  #',
    '#. . . . . P . . . . .#',
    '#######################',
  ],
}
