from pathlib import Path

path = Path('utils/scripts/verifyConductorProjectRegistry.ts')
text = path.read_text(encoding='utf-8')
old = "check('appended lifecycle is explicit', /slug: new-project\\n    status: paused\\n    priority: normal/.test(appended))"
new = "check(\n  'appended lifecycle is explicit',\n  appended.includes('slug: new-project\\n    status: paused\\n    priority: normal'),\n)"
if old not in text:
    raise SystemExit('registry assertion anchor drifted')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
