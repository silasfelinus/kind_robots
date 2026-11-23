;(function (root) {
  'use strict'

  const TILE_COLORS = [
    { main: '#ff5fa2', light: '#ffc2dc', dark: '#d93a7f', name: 'Rose' },
    { main: '#ff9f43', light: '#ffd8ae', dark: '#e2781a', name: 'Tangerine' },
    { main: '#ffd93b', light: '#fff2a8', dark: '#e0b400', name: 'Lemon' },
    { main: '#3ddc97', light: '#b5f5d9', dark: '#1fae70', name: 'Mint' },
    { main: '#4cc9f0', light: '#bdeeff', dark: '#1f9fcb', name: 'Sky' },
    { main: '#a66cff', light: '#dcc6ff', dark: '#7d42e0', name: 'Violet' },
  ]

  const SHAPES = [
    'M50 82 C20 62 10 44 18 30 C26 16 44 18 50 32 C56 18 74 16 82 30 C90 44 80 62 50 82 Z',
    'M50 12 L60 38 L88 40 L66 58 L74 86 L50 70 L26 86 L34 58 L12 40 L40 38 Z',
    'M50 24 A26 26 0 1 1 49.9 24 Z',
    'M50 14 C74 26 80 52 62 76 C56 84 44 84 38 76 C20 52 26 26 50 14 Z',
    'M50 12 C64 34 76 48 76 62 A26 26 0 0 1 24 62 C24 48 36 34 50 12 Z',
    'M58 14 A36 36 0 1 0 86 62 A28 28 0 1 1 58 14 Z',
  ]

  const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
      const r = (a * Math.PI) / 180
      return `<line x1="${50 + Math.cos(r) * 30}" y1="${50 + Math.sin(r) * 30}" x2="${50 + Math.cos(r) * 40}" y2="${50 + Math.sin(r) * 40}" />`
    })
    .join('')

  function gemSvg(color, special, symbols) {
    const c = TILE_COLORS[color] || TILE_COLORS[0]
    if (special === 'rainbow') return rainbowSvg()
    const gid = 'g' + color
    const shape = SHAPES[color]
    let extra = ''
    if (color === 2)
      extra = `<g stroke="${c.dark}" stroke-width="5" stroke-linecap="round">${SUN_RAYS}</g>`
    if (color === 3)
      extra = `<path d="M50 22 L50 80" stroke="${c.dark}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`
    let overlay = ''
    if (special === 'h' || special === 'v') {
      const lines = [30, 42, 54, 66]
        .map((p) =>
          special === 'h'
            ? `<rect x="10" y="${p - 3}" width="80" height="6" rx="3"/>`
            : `<rect x="${p - 3}" y="10" width="6" height="80" rx="3"/>`,
        )
        .join('')
      overlay = `<g fill="#fff" opacity=".85">${lines}</g><g fill="none" stroke="#fff" stroke-width="3" opacity=".9">${special === 'h' ? '<path d="M6 50 L16 42 M6 50 L16 58 M94 50 L84 42 M94 50 L84 58"/>' : '<path d="M50 6 L42 16 M50 6 L58 16 M50 94 L42 84 M50 94 L58 84"/>'}</g>`
    }
    if (special === 'bomb') {
      overlay = `<circle cx="50" cy="52" r="40" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="4 7" opacity=".95"/><g fill="#fff">${[
        0, 1, 2, 3, 4, 5,
      ]
        .map((i) => {
          const a = (i * 60 * Math.PI) / 180
          return `<path transform="translate(${50 + Math.cos(a) * 30} ${52 + Math.sin(a) * 30}) scale(.5)" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z"/>`
        })
        .join('')}</g>`
    }
    const symbol = symbols
      ? `<text x="50" y="60" text-anchor="middle" font-size="22" font-weight="900" fill="${c.dark}" opacity=".55">${'♥★☀♣●☾'[color]}</text>`
      : ''
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${gid}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient></defs>${extra}<path d="${shape}" fill="url(#${gid})" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>${symbol}<ellipse cx="38" cy="34" rx="10" ry="6" fill="#fff" opacity=".7" transform="rotate(-25 38 34)"/>${overlay}</svg>`
  }

  function rainbowSvg() {
    const bands = TILE_COLORS.map(
      (c, i) => `<circle cx="50" cy="50" r="${40 - i * 6}" fill="${c.main}"/>`,
    ).join('')
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="hh-spin">${bands}<circle cx="50" cy="50" r="7" fill="#fff"/></g><path d="M50 14 L54 44 L84 50 L54 56 L50 86 L46 56 L16 50 L46 44 Z" fill="#fff" opacity=".85"/></svg>`
  }

  function buddySvg() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><line x1="50" y1="10" x2="50" y2="24" stroke="#7a86a8" stroke-width="4"/><circle cx="50" cy="10" r="6" fill="#ff5fa2"/><rect x="20" y="24" width="60" height="50" rx="18" fill="#dff3ff" stroke="#5a6b94" stroke-width="4"/><rect x="28" y="34" width="44" height="26" rx="12" fill="#2b3557"/><circle cx="40" cy="47" r="5" fill="#6ff7ff"/><circle cx="60" cy="47" r="5" fill="#6ff7ff"/><path d="M42 54 Q50 60 58 54" stroke="#6ff7ff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="30" cy="64" r="4" fill="#ffb3d1"/><circle cx="70" cy="64" r="4" fill="#ffb3d1"/><rect x="32" y="74" width="12" height="12" rx="4" fill="#5a6b94"/><rect x="56" y="74" width="12" height="12" rx="4" fill="#5a6b94"/><path d="M50 66 l3 3 -3 3 -3 -3z" fill="#ff5fa2"/></svg>`
  }

  function tangleSvg(hp) {
    const strands = hp > 1 ? 7 : 4
    let paths = ''
    for (let i = 0; i < strands; i++) {
      const a = 10 + i * (80 / strands)
      paths += `<path d="M10 ${a} C 40 ${100 - a}, 60 ${a}, 90 ${100 - a}" />`
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="20" fill="#b9b3c9"/><g fill="none" stroke="#857d9c" stroke-width="7" stroke-linecap="round">${paths}</g><g fill="none" stroke="#e7e2f2" stroke-width="2.5" stroke-linecap="round" opacity=".8">${paths}</g>${hp > 1 ? '<circle cx="80" cy="20" r="11" fill="#6c6486"/><text x="80" y="25" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">2</text>' : ''}</svg>`
  }

  function goalIconSvg(goal) {
    if (goal.type === 'collect') return gemSvg(goal.color, null, false)
    if (goal.type === 'buddy') return buddySvg()
    if (goal.type === 'tangle') return tangleSvg(1)
    if (goal.type === 'gloom')
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M26 70 a18 18 0 0 1 4 -35 a22 22 0 0 1 40 -4 a16 16 0 0 1 6 39 z" fill="#9c97ad" stroke="#77718a" stroke-width="4"/><path d="M36 82 l-4 8 M52 82 l-4 8 M68 82 l-4 8" stroke="#77718a" stroke-width="4" stroke-linecap="round"/></svg>`
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SHAPES[1]}" fill="#ffd93b" stroke="#e0a000" stroke-width="4"/></svg>`
  }

  function portraitSvg(id, size) {
    const s = size || 120
    if (id === 'kate') {
      return `<svg viewBox="0 0 120 120" width="${s}" height="${s}" aria-hidden="true"><defs><linearGradient id="kateHair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fa2"/><stop offset=".25" stop-color="#ff9f43"/><stop offset=".45" stop-color="#ffd93b"/><stop offset=".65" stop-color="#3ddc97"/><stop offset=".82" stop-color="#4cc9f0"/><stop offset="1" stop-color="#a66cff"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="#fff0f7"/><path d="M18 104 C14 54 30 18 60 18 C92 18 108 54 102 104 Z" fill="url(#kateHair)"/><ellipse cx="60" cy="62" rx="27" ry="31" fill="#f7c9a8"/><path d="M33 52 C38 30 82 26 88 54 C76 40 52 36 33 52 Z" fill="url(#kateHair)"/><circle cx="49" cy="64" r="4" fill="#3a2a46"/><circle cx="71" cy="64" r="4" fill="#3a2a46"/><circle cx="50" cy="62.5" r="1.4" fill="#fff"/><circle cx="72" cy="62.5" r="1.4" fill="#fff"/><path d="M50 78 Q60 86 70 78" stroke="#c2456f" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="41" cy="74" r="5" fill="#ff9ec4" opacity=".7"/><circle cx="79" cy="74" r="5" fill="#ff9ec4" opacity=".7"/><path d="M84 20 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#ffd93b"/><rect x="88" y="78" width="22" height="6" rx="3" fill="#a66cff" transform="rotate(-30 99 81)"/><circle cx="92" cy="90" r="5" fill="none" stroke="#7d42e0" stroke-width="3"/><circle cx="104" cy="84" r="5" fill="none" stroke="#7d42e0" stroke-width="3"/></svg>`
    }
    if (id === 'sprocket') {
      return `<svg viewBox="0 0 120 120" width="${s}" height="${s}" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#e8f9ff"/><line x1="60" y1="14" x2="60" y2="30" stroke="#5a6b94" stroke-width="5"/><circle cx="60" cy="12" r="8" fill="#ffd93b"/><rect x="24" y="30" width="72" height="62" rx="24" fill="#bfeaff" stroke="#5a6b94" stroke-width="5"/><rect x="34" y="42" width="52" height="32" rx="14" fill="#2b3557"/><circle cx="48" cy="57" r="7" fill="#6ff7ff"/><circle cx="72" cy="57" r="7" fill="#6ff7ff"/><path d="M50 66 Q60 73 70 66" stroke="#6ff7ff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="34" cy="82" r="5" fill="#ffb3d1"/><circle cx="86" cy="82" r="5" fill="#ffb3d1"/><path d="M60 80 l5 5 -5 5 -5 -5z" fill="#ff5fa2"/><circle cx="18" cy="60" r="8" fill="#ffc75f" stroke="#5a6b94" stroke-width="4"/><circle cx="102" cy="60" r="8" fill="#ffc75f" stroke="#5a6b94" stroke-width="4"/></svg>`
    }
    if (id === 'juniper') {
      return `<svg viewBox="0 0 120 120" width="${s}" height="${s}" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#fffbe0"/><path d="M26 70 C22 30 46 18 62 18 C86 18 100 36 96 70 C90 56 80 48 60 48 C42 48 32 58 26 70 Z" fill="#6b3f2a"/><ellipse cx="60" cy="66" rx="26" ry="29" fill="#c98b62"/><path d="M34 56 C40 40 80 38 86 56 C74 48 48 46 34 56 Z" fill="#6b3f2a"/><circle cx="49" cy="66" r="7" fill="none" stroke="#ff9bd6" stroke-width="3"/><circle cx="71" cy="66" r="7" fill="none" stroke="#ff9bd6" stroke-width="3"/><line x1="56" y1="66" x2="64" y2="66" stroke="#ff9bd6" stroke-width="3"/><circle cx="49" cy="66" r="3" fill="#2d1d14"/><circle cx="71" cy="66" r="3" fill="#2d1d14"/><path d="M51 80 Q60 88 69 80" stroke="#8a3a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="74" y="88" width="34" height="24" rx="3" fill="#7be0a6" transform="rotate(-12 91 100)"/><path d="M80 96 l20 -4 M81 102 l16 -3" stroke="#fff" stroke-width="2.5" transform="rotate(-12 91 100)"/><path d="M20 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ff9bd6"/><path d="M98 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffe066"/></svg>`
    }
    return `<svg viewBox="0 0 120 120" width="${s}" height="${s}" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#fff3e6"/><path d="M28 80 C20 40 40 20 60 20 C82 20 100 40 92 80 Z" fill="#2f2440"/><ellipse cx="60" cy="64" rx="26" ry="29" fill="#8d5a3b"/><path d="M34 50 C44 34 78 32 88 52 C76 44 50 42 34 50 Z" fill="#2f2440"/>${[
      0, 1, 2, 3, 4,
    ]
      .map((i) => {
        const x = 30 + i * 15
        const col = ['#ff9f43', '#ff5fa2', '#ffd93b', '#c59bff', '#3ddc97'][i]
        return `<circle cx="${x}" cy="${30 - Math.abs(2 - i) * -2}" r="7" fill="${col}"/><circle cx="${x}" cy="${30 - Math.abs(2 - i) * -2}" r="2.5" fill="#fff6c9"/>`
      })
      .join(
        '',
      )}<path d="M48 64 Q50 61 52 64" stroke="#1e1426" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M68 64 Q70 61 72 64" stroke="#1e1426" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50 77 Q60 85 70 77" stroke="#5a2430" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="42" cy="73" r="5" fill="#ff8f6b" opacity=".55"/><circle cx="78" cy="73" r="5" fill="#ff8f6b" opacity=".55"/><path d="M90 96 C92 84 100 80 106 82 C104 90 98 96 90 96 Z" fill="#7be0a6"/><line x1="90" y1="96" x2="86" y2="108" stroke="#3a9a66" stroke-width="3"/></svg>`
  }

  function motifSvg(motif, color) {
    const c = color || '#fff'
    const m = {
      scissors: `<g fill="none" stroke="${c}" stroke-width="5"><circle cx="30" cy="70" r="12"/><circle cx="70" cy="70" r="12"/><path d="M38 61 L72 20 M62 61 L28 20"/></g>`,
      butterfly: `<g fill="${c}"><path d="M50 50 C30 20 10 30 18 50 C10 70 30 80 50 56 Z"/><path d="M50 50 C70 20 90 30 82 50 C90 70 70 80 50 56 Z"/><rect x="47" y="36" width="6" height="34" rx="3" fill="#fff"/></g>`,
      gear: `<g fill="${c}"><circle cx="50" cy="50" r="24"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="44" y="12" width="12" height="16" rx="3" transform="rotate(${a} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="10" fill="#fff"/></g>`,
      moon: `<g fill="${c}"><path d="${SHAPES[5]}"/><circle cx="24" cy="26" r="3" fill="#fff"/><circle cx="80" cy="20" r="2" fill="#fff"/></g>`,
      wave: `<g fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"><path d="M10 40 Q25 25 40 40 T70 40 T100 40"/><path d="M0 62 Q15 47 30 62 T60 62 T90 62"/></g>`,
      cloud: `<g fill="${c}"><path d="M26 70 a18 18 0 0 1 4 -35 a22 22 0 0 1 40 -4 a16 16 0 0 1 6 39 z"/></g>`,
      letter: `<g fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"><rect x="16" y="28" width="68" height="46" rx="6"/><path d="M16 32 L50 56 L84 32"/></g><path d="M50 50 C44 42 36 46 40 52 L50 60 L60 52 C64 46 56 42 50 50 Z" fill="${c}"/>`,
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${m[motif] || m.scissors}</svg>`
  }

  function logoSvg() {
    const letters = 'Hopeful Hues'.split('')
    let x = 0
    const text = letters
      .map((ch, i) => {
        const color = TILE_COLORS[i % TILE_COLORS.length].main
        const el = `<tspan fill="${color}">${ch === ' ' ? ' ' : ch}</tspan>`
        x++
        return el
      })
      .join('')
    return `<svg viewBox="0 0 600 150" class="hh-logo" role="img" aria-label="Hopeful Hues"><defs><filter id="logoShadow" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="0" flood-color="#7d42e0" flood-opacity=".35"/></filter></defs><text x="300" y="104" text-anchor="middle" font-size="92" font-weight="900" font-family="'Baloo 2','Fredoka','Nunito',ui-rounded,system-ui,sans-serif" stroke="#fff" stroke-width="14" stroke-linejoin="round" paint-order="stroke" filter="url(#logoShadow)">${text}</text><path d="M548 22 l6 15 15 6 -15 6 -6 15 -6 -15 -15 -6 15 -6z" fill="#ffd93b"/><path d="M48 112 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#ff5fa2"/></svg>`
  }

  function starSvg(filled) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SHAPES[1]}" fill="${filled ? '#ffd93b' : '#ffffff55'}" stroke="${filled ? '#e0a000' : '#ffffff88'}" stroke-width="6" stroke-linejoin="round"/></svg>`
  }

  root.HopefulHuesArt = {
    TILE_COLORS,
    gemSvg,
    rainbowSvg,
    buddySvg,
    tangleSvg,
    goalIconSvg,
    portraitSvg,
    motifSvg,
    logoSvg,
    starSvg,
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
