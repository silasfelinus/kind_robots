#!/usr/bin/env node
// Private, static clip comparison sheet for Conductor zuzu-lair/t-014.
// Usage: node utils/scripts/buildZuzuLairBakeoffSheet.mjs manifest.json sheet.html
import { readFileSync, writeFileSync } from 'node:fs'

const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  )

function localVideoPath(value) {
  const file = String(value || '').replaceAll('\\\\', '/')
  if (
    !file ||
    file.startsWith('/') ||
    /(^|\/)\.\.(\/|$)/.test(file) ||
    /^[a-z][a-z0-9+.-]*:/i.test(file)
  ) {
    throw new Error(
      'Clip paths must be relative local files, not URLs or parent paths.',
    )
  }
  return file.split('/').map(encodeURIComponent).join('/')
}

export function buildSheet(manifest) {
  const scenes = manifest.scenes
  const lanes = manifest.lanes
  const clips = manifest.clips ?? []
  if (
    !Array.isArray(scenes) ||
    scenes.length !== 4 ||
    !Array.isArray(lanes) ||
    lanes.length !== 4 ||
    !Array.isArray(clips)
  ) {
    throw new Error('Expected exactly four scenes, four lanes and a clips array.')
  }
  const sceneIds = new Set(scenes.map((scene) => scene.id))
  const laneIds = new Set(lanes.map((lane) => lane.id))
  if (
    sceneIds.size !== 4 ||
    laneIds.size !== 4 ||
    [...sceneIds, ...laneIds].some((id) => !id)
  ) {
    throw new Error('Scene and lane IDs must be non-empty and unique.')
  }
  const byCell = new Map()
  for (const clip of clips) {
    if (!sceneIds.has(clip.sceneId) || !laneIds.has(clip.laneId)) {
      throw new Error('A clip references an unknown scene or lane.')
    }
    const key = `${clip.sceneId}/${clip.laneId}`
    if (byCell.has(key)) throw new Error(`Duplicate clip cell: ${key}`)
    byCell.set(key, clip)
  }
  const headers = lanes
    .map(
      (lane) =>
        `<th scope="col">${escape(lane.label)}<small>${escape(lane.id)}</small></th>`,
    )
    .join('')
  const rows = scenes
    .map((scene) => {
      const cells = lanes
        .map((lane) => {
          const clip = byCell.get(`${scene.id}/${lane.id}`)
          if (!clip?.file)
            return '<td><p class="missing">Not rendered</p></td>'
          const meta = [
            clip.jobId ? `ArtJob ${clip.jobId}` : 'ArtJob not recorded',
            clip.model || lane.id,
            clip.seed == null ? 'seed not recorded' : `seed ${clip.seed}`,
          ].join(' | ')
          return `<td><video controls muted playsinline preload="metadata" src="${escape(localVideoPath(clip.file))}"></video><p>${escape(meta)}</p></td>`
        })
        .join('')
      return `<tr><th scope="row">${escape(scene.label)}<small>ArtImage ${escape(scene.artImageId ?? 'unverified')}</small><p>${escape(scene.prompt ?? '')}</p></th>${cells}</tr>`
    })
    .join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Zuzu Lair clip comparison</title>
<style>
body{background:#15131a;color:#eee;font:15px system-ui,sans-serif;margin:1.5rem}
h1{margin-bottom:.25rem}p{line-height:1.5}button{padding:.65rem 1rem;margin:.5rem .5rem 1rem 0}
.scroll{overflow-x:auto}table{border-collapse:separate;border-spacing:8px;width:100%;min-width:960px}
th,td{background:#282430;border-radius:8px;padding:12px;vertical-align:top;text-align:left}
th[scope=row]{width:190px}td{min-width:180px}video{width:100%;aspect-ratio:16/9;background:#050505}
small{display:block;color:#c5b6d5;margin-top:6px}td p{font-size:12px;color:#c5b6d5}
.missing{padding:3rem 0;text-align:center;color:#bbb}
</style></head><body><h1>Zuzu Lair: internal motion bake-off</h1>
<p>Fixed source art and motion prompt per row. Different model/preset per column. This sheet is not a public release.</p>
<button type="button" id="play">Play all</button><button type="button" id="pause">Pause all</button>
<div class="scroll"><table><thead><tr><th scope="col">Source</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div>
<p>Judge identity, temporal stability, action/acting clarity, camera discipline and overall quality (1-5 each). Keep render failures and timings in the manifest.</p>
<script>
const videos = [...document.querySelectorAll('video')];
document.getElementById('play').onclick = () => { videos.forEach(v => { v.currentTime = 0; v.play().catch(() => {}); }); };
document.getElementById('pause').onclick = () => { videos.forEach(v => v.pause()); };
</script></body></html>`
}

if (
  process.argv[1]?.endsWith('buildZuzuLairBakeoffSheet.mjs') &&
  process.argv.length > 2
) {
  const [source, destination] = process.argv.slice(2)
  if (!destination)
    throw new Error(
      'Usage: node buildZuzuLairBakeoffSheet.mjs manifest.json sheet.html',
    )
  const manifest = JSON.parse(readFileSync(source, 'utf8'))
  writeFileSync(destination, buildSheet(manifest), 'utf8')
  console.log(`Wrote private comparison sheet to ${destination}`)
}
