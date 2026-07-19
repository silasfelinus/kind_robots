from pathlib import Path

path = Path('components/wonderlab/lab-interact.vue')
source = path.read_text(encoding='utf-8')
old = '''      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >'''
new = '''      <aside
        :class="[
          'min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100',
          selectedComponent ? 'hidden xl:flex' : 'flex',
        ]"
      >'''
if source.count(old) != 1:
    raise RuntimeError(f'Expected one WonderLab collection aside, found {source.count(old)}.')
path.write_text(source.replace(old, new, 1), encoding='utf-8')
