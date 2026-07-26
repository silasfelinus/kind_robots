from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# Remove adjacent duplicate four-line project metadata blocks from image tags.
gallery_path = root / "components/pages/conductor-overview-gallery-page.vue"
lines = gallery_path.read_text().splitlines()
cleaned = []
i = 0
while i < len(lines):
    if lines[i].lstrip().startswith(':data-project-id=') and i + 7 < len(lines):
        first = lines[i : i + 4]
        second = lines[i + 4 : i + 8]
        if first == second:
            cleaned.extend(first)
            i += 8
            continue
    cleaned.append(lines[i])
    i += 1
gallery_path.write_text("\n".join(cleaned) + "\n")

# Append retries to the existing requests section instead of writing a second
# top-level `requests:` key when terminal history is present.
yaml_path = root / "server/utils/artRequestYaml.ts"
yaml_text = yaml_path.read_text()
append_function = r'''export function appendRequest(content: string, entry: ArtQueueEntry): string {
  const normalized = normalizeArtQueueEntry(entry)
  if (requestAlreadyQueued(content, normalized)) return content

  const serialized = renderRequestEntry(normalized)
  const trimmed = content.trimEnd()

  if (/^requests:\s*\[\]\s*$/m.test(trimmed)) {
    return `${trimmed.replace(/^requests:\s*\[\]\s*$/m, `requests:\n${serialized}`)}\n`
  }

  if (/^requests:\s*$/m.test(trimmed)) {
    const header = /^requests:\s*$/m.exec(trimmed)
    if (!header) return `${trimmed}\n${serialized}\n`

    const sectionStart = header.index + header[0].length
    const tail = trimmed.slice(sectionStart)
    const nextSection = tail.match(/\n(?=[A-Za-z_][\w-]*:\s*(?:\n|$))/)

    if (!nextSection || nextSection.index === undefined) {
      return `${trimmed}\n${serialized}\n`
    }

    const insertion = sectionStart + nextSection.index
    return `${trimmed.slice(0, insertion).trimEnd()}\n${serialized}\n\n${trimmed
      .slice(insertion)
      .trimStart()}\n`
  }

  return `${trimmed}\n\nrequests:\n${serialized}\n`
}
'''
yaml_text, count = re.subn(
    r"export function appendRequest\(content: string, entry: ArtQueueEntry\): string \{[\s\S]*?\n\}\s*$",
    lambda _match: append_function,
    yaml_text,
    count=1,
)
if count != 1:
    raise RuntimeError(f"Expected one appendRequest function, found {count}")
yaml_path.write_text(yaml_text)

# Extend the regression guard to reject duplicate top-level requests sections.
test_path = root / "utils/scripts/verifyArtRequestYaml.ts"
test_text = test_path.read_text()
anchor = """  check(
    'retry receives its own request block',
    retried.includes('retry-id-99999999'),
  )
"""
replacement = anchor + """  check(
    'retry stays inside one requests section',
    (retried.match(/^requests:/gm) ?? []).length === 1,
  )
"""
if anchor not in test_text:
    raise RuntimeError("Missing retry regression anchor")
test_path.write_text(test_text.replace(anchor, replacement, 1))

print("Cleaned duplicate image metadata and hardened retry insertion.")
