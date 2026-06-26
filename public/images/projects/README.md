# Project Images

Three image types per project, all stored here as `{slug}-{variant}.webp`.

| Variant | Ratio | Min size | Use |
|---------|-------|----------|-----|
| `icon`  | 1:1   | 256×256  | Card header, nav, favicons |
| `card`  | 2:3   | 512×768  | Project card portrait |
| `hero`  | 16:9  | 1280×720 | Project banner / header |

## Easiest way: upload from the workspace

```
python scripts/serve_workspace.py
```

Open http://localhost:8000/, then **click any placeholder image** to pick a replacement file.
The server saves it to the correct path, rebuilds `workspace.html`, and the page reloads.

## Manual way

1. Open `projects/art-prompts.yaml` — find the prompt for your project + variant.
2. Generate using ChatGPT (image generation) or the OpenAI Images API (`gpt-image-1`) at the correct aspect ratio (1:1 / 2:3 / 16:9).
3. Export as `.webp` at the minimum size above.
4. Save here as `{slug}-{variant}.webp` (e.g. `approval-portal-card.webp`).
5. Run `python scripts/build_workspace.py` from repo root.

## Files

| File | Purpose |
|------|---------|
| `coming-soon-icon.svg` | 1:1 placeholder — do not delete |
| `coming-soon-card.svg` | 2:3 placeholder — do not delete |
| `coming-soon-hero.svg` | 16:9 placeholder — do not delete |
| `{slug}-icon.webp` | Real icon, replaces the icon placeholder |
| `{slug}-card.webp` | Real card art, replaces the card placeholder |
| `{slug}-hero.webp` | Real hero art, replaces the hero placeholder |
