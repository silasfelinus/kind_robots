# Ecotone first-play experience and Settings (October 22, 2026)

Response to the first-player screenshot and notes. The initial stage was a full-screen background with a narrow choice rail and tiny narrative text, and the seven-choice second beat presented unfamiliar drug aliases as if players had to pick a drug to join a kinetic art festival.

## Now implemented

- Opening run setup separates **name**, **one of 12 expressive avatar portraits (emoji placeholders)**, **one of six personality descriptions**, and **one of seven existing skill backgrounds**. These are ordinary fictional character-creation options; age, presentation, race and mobility are not linked to stats, eligibility or moral fate. No generated portrait art is claimed. Version-4 saves retain existing skills, ending IDs and mechanics and gain default identity values on load.
- A click on any chapter/fork/encounter/relationship choice **previews the selected action** with **Make this choice / Change my mind**. No stat change or die roll happens on the first click. A confirmed choice saves one reversible pre-choice state in browser storage; **Undo last decision** restores it before advancing the story, and every die result repeats for the same seed and state. Progress to the next decision clears that checkpoint, so this is not a free unlimited reload-to-win.
- Text and choice typography are enlarged, the desktop choice column is proportionally wider, the story begins near its top and the scrolling story container does not crop when text is enlarged.
- The second beat of each opening shows normal **action-oriented options**, not a seven-substance interrogation. A sober path always remains valid. At the kinetic warehouse this means helping document sculptures, sharing a beer with racers, or stepping outside to smoke and then watching the rehearsal. Later optional 2-item invitations are tied to specific opportunities instead of repeating the same seven offerings everywhere. Original lens IDs are preserved internally for legacy saves and completion catalog.
- **Settings** is a full in-game tab with four reading sizes, text appearing instantly or at two optional speeds, a skip-reveal control, and reduced-motion preference support. Preferences persist on the device independent of saves.
- Save section: automatic save after each action; **three manual slots** with save/load/delete and timestamps; JSON import/export of one validated journey. Import and slot load require confirmation if an active run would be overwritten. Imported snapshots go through the same `restoreRun` exclusion and integrity checks as normal saves. Existing endings persist across saves.

## Design boundaries and follow-up

The 12 avatar choices currently use the platform's emoji art, not finished portraits. They are intentionally varied but do **not** purport to be human likeness generators. Continue with actual commissioned/generated character illustrations only after art-worker coordination.

Body copy for the initial pre-race party, fair and quiet bench has been revised to emphasize local art, people, curiosity and plans over a drug buffet. Later original-alias paths remain in source for save compatibility and editorial follow-ups. This pass does not redesign substance effects, reauthor later drug-specific stories, or change the existing seven lenses as collectible dimensions.

Targeted gameplay contract checks exercise three opening menus, legacy restored saves, nonstat identities, sparse temptations, and UI settings/save integration. Production mobile + XL browser visual verification is a recommended next step, not claimed complete.
