from pathlib import Path

path = Path('.github/scripts/apply-wonderlab-responsive-collection.py')
source = path.read_text(encoding='utf-8')
source = source.replace(
    "} from '@/utils/wonderlab/museumQuery' ''',",
    "} from '@/utils/wonderlab/museumQuery'\n''',",
)
path.write_text(source, encoding='utf-8')
