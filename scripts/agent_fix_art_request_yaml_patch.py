from pathlib import Path
import re

path = Path(__file__).resolve().parents[1] / "server/utils/artRequestYaml.ts"
text = path.read_text()
replacement = r'''function requestValue(block: string, key: string): string {
  const prefix = key === 'id' ? '^- id:' : `^\\s{2}${key}:`
  const match = block.match(new RegExp(`${prefix}\\s*(.+?)\\s*$`, 'm'))
  if (!match?.[1]) return ''
  const value = match[1].trim()
  if (value.startsWith('"')) {
    try {
      return String(JSON.parse(value))
    } catch {}
  }
  return value.replace(/^['\"]|['\"]$/g, '')
}

function requestBlocks(content: string): string[] {
  return content
    .split(/(?=^- id:)/m)
    .filter((block) => block.startsWith('- id:'))
}'''
text, count = re.subn(
    r"function requestValue\(block: string, key: string\): string \{.*?function requestBlocks\(content: string\): string\[\] \{.*?\n\}",
    lambda _match: replacement,
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError(f"Expected one YAML parser correction, found {count}")
path.write_text(text)
print("Corrected status-aware YAML request parser.")
