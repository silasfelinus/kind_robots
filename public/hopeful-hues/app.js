;(function () {
  'use strict'

  const E = window.HopefulHuesEngine
  const L = window.HopefulHuesLevels
  const M = window.HopefulHuesMeta
  const A = window.HopefulHuesArt
  const audio = window.HopefulHuesAudio.createAudio()
  const W = window.HopefulHuesWorlds

  const KINDNESS = [
    'You are allowed to take up space. In every color.',
    'Rest is part of the rainbow too.',
    'Somebody is really glad you exist today.',
    'Small kind things are still big kind things.',
    'Your mistakes do not make you less lovable. That is what the Back button is for.',
    'Hope is a muscle. You are doing reps right now.',
    'You belong exactly as you are.',
    'It is okay to start over as many times as you need.',
    'The world is softer because you are in it.',
    'Drink some water. Your future self says thanks.',
    'Being gentle with yourself counts as progress.',
    'Every color is welcome here.',
    'You have survived every hard day so far. That is a perfect record.',
    'Tell someone you love their hair today.',
    'Joy is not frivolous. Joy is fuel.',
    'Kindness is the strongest robot upgrade.',
    'You can be a work in progress and a masterpiece at the same time.',
    'The grey always passes. The colors always come back.',
    'Asking for help is a superpower.',
    'You make the people around you braver.',
  ]

  const PAINTED_ROOT = '/images/hopeful-hues/'

  function painted(path, fallback, cls) {
    return `<span class="painted ${cls || ''}"><img src="${PAINTED_ROOT}${path}" alt="" decoding="async"><span class="painted-fallback">${fallback}</span></span>`
  }

  function heroArt(id, size, cls) {
    return painted('heroes/' + id + '.webp', A.portraitSvg(id, size), cls)
  }

  function regionArt(regionId, cls) {
    const region = L.REGIONS[regionId]
    return painted(
      'regions/' + regionId + '.webp',
      `<span class="motif-fallback" style="background:linear-gradient(135deg, ${region.sky[0]}, ${region.sky[1]})">${A.motifSvg(region.motif, region.palette[0])}</span>`,
      cls,
    )
  }

  function beatArt(regionId, at, cls) {
    if (at === 1) return regionArt(regionId, cls)
    const region = L.REGIONS[regionId]
    return painted(
      'story/' + regionId + '-' + at + '.webp',
      `<span class="motif-fallback" style="background:linear-gradient(135deg, ${region.sky[0]}, ${region.sky[1]})">${A.motifSvg(region.motif, region.palette[1])}</span>`,
      cls,
    )
  }

  function endingArt(endingId, cls) {
    const ending = L.ENDINGS[endingId]
    const region = ending && ending.region ? L.REGIONS[ending.region] : null
    return painted(
      'endings/' + endingId + '.webp',
      `<span class="motif-fallback" style="background:var(--rainbow)">${region ? A.motifSvg(region.motif, '#fff') : A.rainbowSvg()}</span>`,
      cls,
    )
  }

  document.addEventListener(
    'error',
    (event) => {
      const img = event.target
      if (
        img &&
        img.tagName === 'IMG' &&
        img.parentNode &&
        img.parentNode.classList &&
        img.parentNode.classList.contains('painted')
      ) {
        img.parentNode.classList.add('missing')
      }
    },
    true,
  )

  const embedded = new URLSearchParams(location.search).get('embedded') === '1'
  const storage = (() => {
    try {
      localStorage.setItem('hh-probe', '1')
      localStorage.removeItem('hh-probe')
      return localStorage
    } catch (error) {
      const memory = {}
      return {
        getItem: (k) => memory[k] || null,
        setItem: (k, v) => (memory[k] = String(v)),
        removeItem: (k) => delete memory[k],
      }
    }
  })()

  let data = M.load(storage)
  const stack = []
  let game = null
  let resizeHandler = null
  const appEl = document.getElementById('app')
  const modalRoot = document.getElementById('modal-root')
  const toastsEl = document.getElementById('toasts')

  function slot() {
    return data.activeSlot !== null ? data.slots[data.activeSlot] : null
  }

  function persist() {
    M.save(storage, data)
  }

  function esc(text) {
    return String(text).replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[ch],
    )
  }

  function character(id) {
    return L.CHARACTERS.find((c) => c.id === id) || L.CHARACTERS[0]
  }

  function worldById(id) {
    return W.get(id) || W.list()[0]
  }

  function regionWorld(regionId) {
    const region = L.REGIONS[regionId]
    return worldById(region ? region.world : null)
  }

  function levelWorld(levelId) {
    return regionWorld(L.parseLevelId(levelId).region)
  }

  function slotWorld(s) {
    return worldById(L.lineKey(s || slot()))
  }

  function activeWorld() {
    return game ? levelWorld(game.id) : slotWorld()
  }

  function themeStyle(world) {
    const u = world.ui
    return `--ink:${u.ink};--ink-soft:${u.inkSoft};--card:${u.card};--accent:${u.accent};--accent2:${u.accent2};--cell:${u.cell};--gloom1:${world.blockers.gloom.color};--gloom2:${world.blockers.gloom.color2};--world-bg:linear-gradient(180deg, ${u.bg[0]}, ${u.bg[1]} 55%, ${u.bg[2]});color:${u.ink}`
  }

  function worldKeyArt(world, cls) {
    return painted(
      'worlds/' + world.id + '-key.webp',
      `<span class="motif-fallback" style="background:linear-gradient(135deg, ${world.ui.bg[0]}, ${world.ui.bg[2]})">${A.motifSvg(world.regions[0].motif, world.ui.accent)}</span>`,
      cls,
    )
  }

  function worldProgress(s, world) {
    let won = 0
    let total = 0
    for (const id of L.routeLevels(world.id)) {
      total++
      if (s && s.levels[id] && s.levels[id].stars) won++
    }
    return { won, total }
  }

  function wait(ms) {
    const scale = data.settings.reducedMotion ? 0.15 : 1
    return new Promise((resolve) => setTimeout(resolve, ms * scale))
  }

  function applySettings() {
    const s = data.settings
    document.body.classList.toggle('reduced-motion', !!s.reducedMotion)
    document.body.classList.toggle('high-contrast', !!s.highContrast)
    document.body.classList.toggle('large-text', !!s.largeText)
    audio.setLevels(s.music, s.sfx)
  }

  function kindnessOfDay() {
    const key = M.dayKey(new Date())
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
    return KINDNESS[h % KINDNESS.length]
  }

  function sky() {
    const el = document.getElementById('sky')
    const glyphs = ['♥', '★', '✿', '☁', '✦', '♡', '☆']
    const colors = [
      '#ff5fa2',
      '#ff9f43',
      '#ffd93b',
      '#3ddc97',
      '#4cc9f0',
      '#a66cff',
    ]
    let html = ''
    for (let i = 0; i < 18; i++) {
      html += `<span style="left:${(i * 53) % 100}%;color:${colors[i % 6]};animation-delay:${-(i * 1.7)}s;animation-duration:${12 + (i % 5) * 3}s;font-size:${14 + (i % 4) * 7}px">${glyphs[i % glyphs.length]}</span>`
    }
    el.innerHTML = html
  }

  const toastQueue = []

  function toast(icon, text) {
    toastQueue.push([icon, text])
    pumpToasts()
  }

  function pumpToasts() {
    while (toastQueue.length && toastsEl.children.length < 3) {
      const [icon, text] = toastQueue.shift()
      const el = document.createElement('div')
      el.className = 'toast'
      el.innerHTML = `<span aria-hidden="true">${icon}</span><span>${esc(text)}</span>`
      toastsEl.appendChild(el)
      setTimeout(() => {
        el.remove()
        pumpToasts()
      }, 3500)
    }
  }

  /* Navigation */

  function go(name, params, replace) {
    if (replace) stack.pop()
    stack.push({ name, params: params || {} })
    render()
  }

  function back() {
    if (modalRoot.lastElementChild) {
      closeModal()
      return
    }
    const top = stack[stack.length - 1]
    if (top && top.name === 'game') {
      confirmLeaveLevel()
      return
    }
    if (stack.length > 1) {
      stack.pop()
      render()
    }
  }

  function render() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
    const top = stack[stack.length - 1]
    const screens = {
      title: renderTitle,
      slots: renderSlots,
      characters: renderCharacters,
      map: renderMap,
      game: renderGame,
    }
    screens[top.name](top.params)
    if (
      top.name === 'title' ||
      top.name === 'slots' ||
      top.name === 'characters'
    )
      audio.startMusic({ root: 60, mode: 'major', tempo: 92, tag: 'title' })
  }

  function backButton(label) {
    return `<button class="btn back small" data-action="back" aria-label="Back">← <span class="label-text">${esc(label || 'Back')}</span></button>`
  }

  function bind(root, handlers) {
    root.querySelectorAll('[data-action]').forEach((el) => {
      const action = el.getAttribute('data-action')
      el.addEventListener('click', (event) => {
        audio.unlock()
        audio.play('tap')
        if (action === 'back') return back()
        const fn = handlers[action]
        if (fn) fn(el, event)
      })
    })
  }

  /* Modals */

  function openModal({
    title,
    body,
    foot,
    wide,
    onClose,
    dismissable = true,
    icon,
  }) {
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop'
    backdrop.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head">${icon || ''}<h2>${esc(title)}</h2>${dismissable ? '<button class="btn icon small back" data-close aria-label="Close">✕</button>' : ''}</div><div class="modal-body scroll">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`
    backdrop._onClose = onClose
    backdrop._dismissable = dismissable
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop && dismissable) closeModal()
    })
    const close = backdrop.querySelector('[data-close]')
    if (close) close.addEventListener('click', () => closeModal())
    modalRoot.appendChild(backdrop)
    const focusable = backdrop.querySelector(
      '.modal-foot .btn, .modal-body .btn, [data-close]',
    )
    if (focusable) setTimeout(() => focusable.focus(), 30)
    return backdrop
  }

  function closeModal(force) {
    const top = modalRoot.lastElementChild
    if (!top) return
    if (!top._dismissable && !force) return
    top.remove()
    if (top._onClose) top._onClose()
  }

  function closeAllModals() {
    while (modalRoot.lastElementChild) modalRoot.lastElementChild.remove()
  }

  function modalActions(modal, handlers) {
    modal.querySelectorAll('[data-m]').forEach((el) => {
      el.addEventListener('click', () => {
        audio.play('tap')
        const fn = handlers[el.getAttribute('data-m')]
        if (fn) fn(el)
      })
    })
  }

  /* Title */

  function renderTitle() {
    const s = slot()
    const cast = L.CHARACTERS.map(
      (c) => `<div>${heroArt(c.id, 84, 'cast-portrait')}</div>`,
    ).join('')
    appEl.innerHTML = `<section class="screen title-screen scroll">
      ${A.logoSvg()}
      <p class="title-sub">Superkate &amp; the Kind Robots paint the world back, one match at a time.</p>
      <div class="title-cast">${cast}</div>
      <div class="title-menu">
        ${s ? `<button class="btn rainbow wide" data-action="continue">▶ Continue · ${esc(slotWorld(s).name)}</button>` : `<button class="btn rainbow wide" data-action="play">▶ Start the rainbow</button>`}
        <button class="btn" data-action="play">💾 Save slots</button>
        <button class="btn" data-action="scrapbook">📔 Scrapbook</button>
        <button class="btn" data-action="quests">🌈 Quests</button>
        <button class="btn" data-action="trophies">🏆 Achievements</button>
        <button class="btn" data-action="settings">⚙️ Settings</button>
        <button class="btn" data-action="guide">❓ How to play</button>
      </div>
      <div class="card kindness"><b>Today's kindness:</b> ${esc(kindnessOfDay())}</div>
    </section>`
    bind(appEl, {
      continue: () => go('map'),
      play: () => go('slots'),
      scrapbook: () => withSlot(openScrapbook),
      quests: () => withSlot(openQuests),
      trophies: () => withSlot(openAchievements),
      settings: openSettings,
      guide: openGuide,
    })
  }

  function withSlot(fn) {
    if (slot()) return fn()
    toast('💾', 'Pick or start a save slot first.')
    go('slots')
  }

  /* Slots */

  function renderSlots() {
    const cards = data.slots
      .map((s, i) => {
        if (!s) {
          return `<div class="card slot-card"><div style="width:96px;height:96px;border-radius:50%;background:var(--rainbow);display:grid;place-items:center;font-size:2.4rem;color:#fff">+</div><h3>Slot ${i + 1}</h3><div class="meta">An empty page, ready for color.</div><div class="row"><button class="btn primary" data-action="new" data-slot="${i}">New adventure</button><button class="btn small" data-action="import" data-slot="${i}">Import code</button></div></div>`
        }
        const c = character(slotWorld(s).hero.id)
        const won = M.countWon(s)
        const stars = M.countStars(s)
        const when = new Date(s.updated).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
        return `<div class="card slot-card">${heroArt(c.id, 96, 'slot-portrait')}<h3>Slot ${i + 1} · ${esc(c.name)}</h3><div class="meta">⭐ ${stars} · ${won} levels · ${s.endings.length} endings · ✨ ${s.sparkles}<br>Last played ${esc(when)}</div><div class="row"><button class="btn primary" data-action="load" data-slot="${i}">Play</button><button class="btn small" data-action="export" data-slot="${i}">Export</button><button class="btn small" data-action="delete" data-slot="${i}">Delete</button></div></div>`
      })
      .join('')
    appEl.innerHTML = `<section class="screen"><div class="topbar">${backButton('Title')}<h2>Save slots</h2></div><div class="scroll" style="flex:1"><div class="grid-cards">${cards}</div><p class="center muted" style="padding:0 16px 20px">Progress saves automatically on this device. Export a slot to keep a backup code or move it to another browser.</p></div></section>`
    bind(appEl, {
      new: (el) => go('characters', { slot: Number(el.dataset.slot) }),
      load: (el) => {
        data.activeSlot = Number(el.dataset.slot)
        persist()
        go('map')
      },
      export: (el) => {
        const code = M.exportSlot(data.slots[Number(el.dataset.slot)])
        const modal = openModal({
          title: 'Export save code',
          body: `<p>Copy this code somewhere safe. Paste it into any empty slot with Import.</p><textarea class="code" readonly>${esc(code)}</textarea>`,
          foot: '<button class="btn primary" data-m="copy">Copy</button>',
        })
        modal.querySelector('textarea').select()
        modalActions(modal, {
          copy: () => {
            const area = modal.querySelector('textarea')
            area.select()
            if (navigator.clipboard)
              navigator.clipboard
                .writeText(code)
                .catch(() => document.execCommand('copy'))
            else document.execCommand('copy')
            toast('📋', 'Save code copied!')
          },
        })
      },
      import: (el) => {
        const index = Number(el.dataset.slot)
        const modal = openModal({
          title: 'Import save code',
          body: '<p>Paste a Hopeful Hues save code (it starts with HH1.)</p><textarea class="code" placeholder="HH1...."></textarea><p class="muted" data-error></p>',
          foot: '<button class="btn primary" data-m="go">Import</button>',
        })
        modalActions(modal, {
          go: () => {
            const imported = M.importSlot(modal.querySelector('textarea').value)
            if (!imported) {
              modal.querySelector('[data-error]').textContent =
                'That code did not work. Check that it was copied completely.'
              audio.play('invalid')
              return
            }
            data.slots[index] = imported
            persist()
            closeModal(true)
            toast('💾', 'Save imported into slot ' + (index + 1))
            render()
          },
        })
      },
      delete: (el) => {
        const index = Number(el.dataset.slot)
        const modal = openModal({
          title: 'Delete this save?',
          body: `<p class="center">Slot ${index + 1} will be erased from this device. This cannot be undone, so export it first if you might want it back.</p>`,
          foot: '<button class="btn" data-m="no">Keep it</button><button class="btn primary" data-m="yes">Delete</button>',
        })
        modalActions(modal, {
          no: () => closeModal(true),
          yes: () => {
            data.slots[index] = null
            if (data.activeSlot === index) data.activeSlot = null
            persist()
            closeModal(true)
            render()
          },
        })
      },
    })
  }

  /* Character select */

  function renderCharacters(params) {
    const changing = params.change
    const current = slot()
    const currentWorld = current ? slotWorld(current) : null
    const cards = W.list()
      .map((w) => {
        const hero = w.hero
        const progress = worldProgress(current, w)
        const done = current && current.endings.includes(w.ending.id)
        const here = currentWorld && currentWorld.id === w.id
        return `<article class="card world-card ${w.ui.dark ? 'dark' : ''} ${here ? 'here' : ''}" style="${themeStyle(w)};background:linear-gradient(160deg, ${w.ui.bg[0]}, ${w.ui.bg[2]})">
          ${worldKeyArt(w, 'world-key')}
          <div class="world-card-body">
            <div class="world-hero-row">${heroArt(hero.id, 84, 'world-hero')}<div><h3>${esc(w.name)}</h3><div class="world-tag">${esc(w.tagline)}</div></div></div>
            <p>${esc(w.blurb)}</p>
            <div class="jewel-row" aria-label="${esc(w.name)} jewels">${w.jewels.map((j, i) => `<span title="${esc(j.name)}">${A.gemSvg(i, null, false, w.id)}</span>`).join('')}</div>
            <div class="perk"><b>${esc(hero.name)} · ${esc(hero.perkName)}:</b> ${esc(hero.perkText)}</div>
            <div class="region-chips">${w.regions.map((r) => `<span>${esc(r.name)}</span>`).join('<span aria-hidden="true">→</span>')}</div>
            ${current ? `<div class="world-progress"><div class="bar"><div style="width:${Math.round((progress.won / progress.total) * 100)}%"></div></div><small>${progress.won}/${progress.total} levels${done ? ' · ✨ ending found' : ''}</small></div>` : ''}
            <button class="btn primary" data-action="pick" data-id="${w.id}">${here && changing ? 'Keep playing' : progress.won ? 'Continue ' : 'Begin '}${here && changing ? '' : esc(w.name)}</button>
          </div>
        </article>`
      })
      .join('')
    appEl.innerHTML = `<section class="screen"><div class="topbar">${backButton()}<h2>${changing ? 'Choose a world' : 'Choose your adventure'}</h2></div><div class="scroll" style="flex:1"><p class="center muted" style="padding:0 16px">${W.list().length} worlds, each with its own hero, jewels, story and ending. Switch worlds any time; your stars are kept everywhere. Bring color back to every world to find a secret ending.</p><div class="world-grid">${cards}</div></div></section>`
    bind(appEl, {
      pick: (el) => {
        const world = worldById(el.dataset.id)
        if (changing && current) {
          const firstVisit = !worldProgress(current, world).won
          M.switchWorld(current, L, world.id)
          M.refreshQuests(current, new Date())
          persist()
          toast('🌈', 'Welcome to ' + world.name + '!')
          stack.length = 1
          go('map')
          if (
            firstVisit &&
            !current.seenBeats.includes('beat:' + world.regions[0].id + ':1')
          )
            showRegionIntro(world.regions[0].id)
          return
        }
        const s = M.createSlot(world.hero.id)
        M.switchWorld(s, L, world.id)
        M.refreshQuests(s, new Date())
        data.slots[params.slot] = s
        data.activeSlot = params.slot
        persist()
        stack.length = 1
        go('map')
        showRegionIntro(world.regions[0].id)
      },
    })
  }

  /* Map */

  function mapLayout(s) {
    const regions = L.routeRegions(s)
    const items = []
    const spacing = 92
    let y = 120
    const fork = null
    const nodes = []
    const bands = []
    for (const regionId of regions) {
      const region = L.REGIONS[regionId]
      const count = L.regionLevelCount(regionId)
      const bandStart = y - 70
      items.push({ type: 'banner', regionId, y })
      y += 90
      for (let n = 1; n <= count; n++) {
        const id = L.levelId(regionId, n)
        const def = L.buildLevel(regionId, n)
        nodes.push({ id, regionId, n, y, def })
        y += spacing
      }
      bands.push({ regionId, start: bandStart, end: y })
      if (region.ending) {
        items.push({ type: 'ending', regionId, y: y + 10 })
        y += 140
      }
    }
    if (fork) {
      items.push({ type: 'fork', regionId: fork, y: y + 40 })
      y += 220
    } else if (!regions.some((r) => L.REGIONS[r].ending)) {
      const last = regions[regions.length - 1]
      items.push({ type: 'ahead', regionId: last, y: y + 30 })
      y += 160
    }
    const height = y + 60
    const flip = (v) => height - v
    for (const n of nodes) {
      n.top = flip(n.y)
      n.x = 50 + Math.sin(n.y / 140) * 30
    }
    for (const it of items) it.top = flip(it.y)
    for (const b of bands) {
      b.top = flip(b.end)
      b.height = b.end - b.start
    }
    return { nodes, items, bands, height }
  }

  function renderMap() {
    const s = slot()
    if (!s) {
      go('slots', {}, true)
      return
    }
    M.refreshQuests(s, new Date())
    persist()
    const world = slotWorld(s)
    const c = character(world.hero.id)
    const layout = mapLayout(s)
    const current = M.currentLevel(s, L)
    const claimable = [...s.quests.daily, ...s.quests.weekly].filter(
      (q) =>
        !q.claimed &&
        q.progress >= (M.questDef(q.id) || { target: 1e9 }).target,
    ).length
    const stars = M.countStars(s)
    let path = ''
    layout.nodes.forEach((n, i) => {
      path += (i === 0 ? 'M' : ' L') + ` ${n.x} ${n.top}`
    })
    const bandsHtml = layout.bands
      .map((b) => {
        const region = L.REGIONS[b.regionId]
        let motifs = ''
        for (let i = 0; i < Math.floor(b.height / 160); i++) {
          const left =
            i % 2 ? 50 + 18 + ((i * 7) % 12) : 50 - 32 - ((i * 5) % 12)
          motifs += `<div class="motif" style="top:${i * 160 + 40}px;left:calc(${left}% );transform:rotate(${((i * 37) % 40) - 20}deg)">${A.motifSvg(region.motif, region.palette[i % 3])}</div>`
        }
        return `<div class="map-band" style="top:${b.top}px;height:${b.height}px;background:linear-gradient(180deg, ${region.sky[1]}cc, ${region.sky[0]}cc)">${motifs}</div>`
      })
      .join('')
    const nodesHtml = layout.nodes
      .map((n) => {
        const region = L.REGIONS[n.regionId]
        const record = s.levels[n.id]
        const unlocked = M.levelUnlocked(s, L, n.id)
        const isCurrent =
          n.id === current && unlocked && !(record && record.stars)
        const color = region.palette[n.n % 3]
        const starsHtml =
          record && record.stars
            ? `<span class="stars">${[0, 1, 2].map((k) => A.starSvg(k < record.stars)).join('')}</span>`
            : ''
        const label = n.def.finale ? '★' : n.n
        const cls = [
          'node',
          'shape-' + world.map.node,
          record && record.stars ? 'done' : '',
          unlocked ? '' : 'locked',
          isCurrent ? 'current' : '',
          n.def.finale ? 'finale' : '',
        ].join(' ')
        return `<button class="${cls}" style="left:${n.x}%;top:${n.top}px;background:${n.def.finale ? 'var(--rainbow)' : color}" data-level="${n.id}" ${unlocked ? '' : 'aria-disabled="true"'} aria-label="${esc(region.name)} level ${n.n}${record && record.stars ? ', ' + record.stars + ' stars' : unlocked ? '' : ', locked'}">${label}${starsHtml}</button>${isCurrent ? `<div class="avatar-pin" style="left:${n.x}%;top:${n.top}px">${A.portraitSvg(c.id, 54)}</div>` : ''}`
      })
      .join('')
    const itemsHtml = layout.items
      .map((it) => {
        const region = L.REGIONS[it.regionId]
        if (it.type === 'banner') {
          return `<div class="map-banner" style="top:${it.top - 20}px;border-color:${region.palette[0]}">${esc(region.name)}</div>`
        }
        if (it.type === 'ending') {
          const ending = L.ENDINGS[region.ending]
          const got = s.endings.includes(ending.id)
          return `<button class="signpost ${got ? '' : 'dim'}" style="left:50%;top:${it.top}px" data-ending="${ending.id}" ${got ? '' : 'disabled'}>${A.motifSvg(region.motif, region.palette[0])}<span>${got ? '✨ ' + esc(ending.title) : 'An ending waits here'}</span></button>`
        }
        if (it.type === 'fork') {
          const choices = L.REGIONS[it.regionId].next
          return choices
            .map((id, i) => {
              const r = L.REGIONS[id]
              return `<button class="signpost" style="left:${i ? 74 : 26}%;top:${it.top}px;background:linear-gradient(135deg, ${r.sky[0]}, ${r.sky[1]})" data-fork="${it.regionId}">${A.motifSvg(r.motif, r.palette[0])}<span>${esc(r.name)}</span><small>Choose a path</small></button>`
            })
            .join('')
        }
        if (it.type === 'ahead') {
          const next = L.REGIONS[it.regionId].next || []
          return `<div class="signpost dim" style="left:50%;top:${it.top}px">${A.motifSvg('letter', '#a66cff')}<span>Finish ${esc(region.name)} to choose: ${next.map((id) => esc(L.REGIONS[id].name)).join(' or ')}</span></div>`
        }
        return ''
      })
      .join('')
    appEl.innerHTML = `<section class="screen map-screen ${world.ui.dark ? 'dark' : ''}" style="${themeStyle(world)}">
      <div class="topbar">
        ${backButton('Title')}
        <button class="btn small" data-action="hero" aria-label="Choose a world">${A.portraitSvg(c.id, 28)}<span class="label-text">${esc(world.name)}</span></button>
        <span class="chip" title="Stars">⭐ ${stars}</span>
        <span class="chip" title="Sparkles">✨ ${s.sparkles}</span>
        <span class="spacer"></span>
        <button class="btn small" data-action="quests">🌈<span class="label-text"> Quests</span>${claimable ? `<span class="badge">${claimable}</span>` : ''}</button>
        <button class="btn small" data-action="hero">🗺️<span class="label-text"> Worlds</span></button>
        <button class="btn small icon" data-action="scrapbook" aria-label="Scrapbook">📔</button>
        <button class="btn small icon" data-action="trophies" aria-label="Achievements">🏆</button>
        <button class="btn small icon" data-action="settings" aria-label="Settings">⚙️</button>
      </div>
      <div class="map-scroll scroll" data-map style="background:url('/images/hopeful-hues/maps/${world.id}.webp') center top / cover, var(--world-bg)">
        <div class="map-world" style="height:${layout.height}px">
          ${bandsHtml}
          <svg class="map-path" viewBox="0 0 100 ${layout.height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="${world.map.path}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".9"/><path d="${path}" fill="none" stroke="${world.map.dash}" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
          ${itemsHtml}
          ${nodesHtml}
        </div>
      </div>
    </section>`
    const scroller = appEl.querySelector('[data-map]')
    const target = layout.nodes.find((n) => n.id === current)
    if (target)
      scroller.scrollTop = Math.max(0, target.top - scroller.clientHeight * 0.6)
    else scroller.scrollTop = 0
    const regionNow = L.parseLevelId(current).region
    audio.startMusic(L.REGIONS[regionNow].music)
    bind(appEl, {
      hero: () => go('characters', { change: true }),
      quests: openQuests,
      scrapbook: openScrapbook,
      trophies: openAchievements,
      settings: openSettings,
    })
    appEl.querySelectorAll('[data-level]').forEach((el) =>
      el.addEventListener('click', () => {
        audio.unlock()
        const id = el.dataset.level
        if (!M.levelUnlocked(s, L, id)) {
          audio.play('invalid')
          toast('🔒', 'Finish the level before this one first.')
          return
        }
        audio.play('tap')
        openLevelIntro(id)
      }),
    )
    appEl
      .querySelectorAll('[data-ending]')
      .forEach((el) =>
        el.addEventListener('click', () => showEnding(el.dataset.ending)),
      )
  }

  function showRegionIntro(regionId, then) {
    const region = L.REGIONS[regionId]
    const s = slot()
    const beat = (L.STORY_BEATS[regionId] || []).find((b) => b.at === 1)
    if (beat) M.markBeat(s, regionId, 1)
    persist()
    const modal = openModal({
      title: region.name,
      body: `<div class="story-card">${regionArt(regionId, 'scene')}<p>${esc(region.blurb)}</p>${beat ? `<p class="muted"><b>${esc(beat.title)}.</b> ${esc(beat.text)}</p>` : ''}<p class="muted">📔 Added to your scrapbook.</p></div>`,
      foot: '<button class="btn rainbow" data-m="ok">Let\'s go!</button>',
      onClose: then,
    })
    modalActions(modal, { ok: () => closeModal() })
  }

  /* Level intro */

  function goalText(goal, worldArg) {
    const world = worldArg || activeWorld()
    if (goal.type === 'score')
      return `Score ${goal.target.toLocaleString()} points`
    if (goal.type === 'collect')
      return `Collect ${goal.target} ${world.jewels[goal.color].name}`
    if (goal.type === 'gloom')
      return `Clear ${goal.target} ${world.blockers.gloom.name}`
    if (goal.type === 'tangle')
      return `Untie ${goal.target} ${world.blockers.tangle.name}`
    if (goal.type === 'special')
      return `Create ${goal.target} ${world.specials[goal.special].name}`
    if (goal.type === 'combo')
      return `Combine two specials ${goal.target} time(s)`
    if (goal.type === 'buddy')
      return `Rescue ${goal.target} ${world.blockers.buddy.name} (bring them to the bottom)`
    return ''
  }

  function openLevelIntro(id) {
    const s = slot()
    const parsed = L.parseLevelId(id)
    const def = L.buildLevel(parsed.region, parsed.n)
    const region = L.REGIONS[def.region]
    const record = s.levels[id]
    const c = character(s.character)
    const goals = def.goals
      .map(
        (g) =>
          `<div class="goal" style="justify-content:flex-start">${A.goalIconSvg(g, levelWorld(id).id)}<span>${esc(goalText(g, levelWorld(id)))}</span></div>`,
      )
      .join('')
    const startBoosts = ['bomb', 'rainbow'].map((key) => {
      const label = levelWorld(id).specials[key].name
      return `<option value="${key}" ${s.boosters[key] ? '' : 'disabled'}>${esc(label)} (${s.boosters[key]})</option>`
    }).join('')
    const modal = openModal({
      title: `${region.name} · ${def.finale ? 'Finale' : 'Level ' + def.n}`,
      body: `<div class="center result-stars">${[0, 1, 2].map((k) => `<span class="s">${A.starSvg(record && k < record.stars)}</span>`).join('')}</div><div class="list">${goals}</div><p class="center"><b>${def.moves}${c.perk === 'extra-moves' ? ' + 2' : ''}</b> moves · ⭐⭐ at ${def.stars[1].toLocaleString()} · ⭐⭐⭐ at ${def.stars[2].toLocaleString()}</p>${record ? `<p class="center muted">Best score: ${record.best.toLocaleString()}</p>` : ''}<p class="center muted">${esc(c.name)}'s perk: ${esc(c.perkText)}</p>`,
      foot: `<label>Starting gift <select data-start-boost><option value="">None</option>${startBoosts}</select></label><button class="btn rainbow" data-m="play">Play!</button>`,
    })
    modalActions(modal, {
      play: () => {
        const startBoost = modal.querySelector('[data-start-boost]').value
        closeModal(true)
        const beat = def.beat
        const beatId = beat ? 'beat:' + def.region + ':' + beat.at : null
        if (beat && beat.at !== 1 && !s.seenBeats.includes(beatId)) {
          showBeat(def.region, beat, () => go('game', { id, startBoost }))
        } else if (
          def.n === 1 &&
          !s.seenBeats.includes('beat:' + def.region + ':1')
        ) {
          showRegionIntro(def.region, () => go('game', { id, startBoost }))
        } else {
          go('game', { id, startBoost })
        }
      },
    })
  }

  function showBeat(regionId, beat, then) {
    const s = slot()
    M.markBeat(s, regionId, beat.at)
    persist()
    const region = L.REGIONS[regionId]
    const modal = openModal({
      title: beat.title,
      body: `<div class="story-card">${beatArt(regionId, beat.at, 'scene')}<p>${esc(beat.text)}</p><p class="muted">📔 Added to your scrapbook.</p></div>`,
      foot: '<button class="btn rainbow" data-m="ok">Continue</button>',
      onClose: then,
    })
    modalActions(modal, { ok: () => closeModal() })
  }

  /* Game */

  function newGame(id, startBoost) {
    const s = slot()
    const parsed = L.parseLevelId(id)
    const def = L.buildLevel(parsed.region, parsed.n)
    const c = character(regionWorld(parsed.region).hero.id)
    const startSpecial = ['bomb', 'rainbow'].includes(startBoost) && s.boosters[startBoost] > 0 ? startBoost : null
    const state = E.createLevelState(def, {
      startSpecial,
      perk: c.perk,
      bonusMoves: c.perk === 'extra-moves' ? 2 : 0,
    })
    if (startSpecial && state.stats.toolsUsed) {
      s.boosters[startSpecial]--
      persist()
    }
    return {
      id,
      def,
      state,
      history: [],
      tool: null,
      toolFrom: null,
      undosUsed: 0,
      boostsUsed: 0,
      busy: false,
      selected: null,
      cursor: [0, 0],
      hintTimer: null,
      cheerTimer: null,
      committed: false,
      tutorial: null,
      tutorialStarted: false,
      coachOpen: false,
    }
  }

  function renderGame(params) {
    if (!game || game.id !== params.id) game = newGame(params.id, params.startBoost)
    if (game.tutorial) {
      game.tutorial = null
      game.tutorialStarted = game.history.length > 0
    }
    if (game.coachOpen) {
      game.coachOpen = false
      game.busy = false
    }
    const s = slot()
    const world = levelWorld(game.id)
    const c = character(world.hero.id)
    const region = L.REGIONS[game.def.region]
    audio.startMusic({
      ...region.music,
      tempo: region.music.tempo + 6,
      tag: 'level',
    })
    appEl.innerHTML = `<section class="screen game-screen ${world.ui.dark ? 'dark' : ''}" data-world="${world.id}" style="${themeStyle(world)};background:url('/images/hopeful-hues/regions/${region.id}.webp') center / cover, linear-gradient(180deg, ${region.sky[0]}, ${region.sky[1]})">
      <div class="topbar">
        ${backButton('Map')}
        <h2>${esc(region.name)} · ${game.def.finale ? 'Finale' : 'Level ' + game.def.n}</h2>
        <button class="btn small icon" data-action="guide" aria-label="How to play">❓</button>
        <button class="btn small icon" data-action="settings" aria-label="Settings">⚙️</button>
      </div>
      <div class="hud">
        <div class="card hud-box moves" data-moves-box><span class="label">Moves</span><span class="value" data-moves></span></div>
        <div class="card hud-box" style="min-width:140px"><span class="label">Score</span><span class="value" data-score></span><div class="star-meter"><div class="fill" data-meter></div>${[1, 2].map((k) => `<span class="tick" style="left:${Math.round((game.def.stars[k] / (game.def.stars[2] * 1.1)) * 100)}%">${A.starSvg(true)}</span>`).join('')}</div></div>
        <div class="card hud-box" data-goals-box><span class="label">Goals</span><div class="goals" data-goals></div></div>
      </div>
      <div class="board-wrap" data-wrap>
        <div class="board" data-board role="grid" aria-label="Game board" tabindex="0">
          <div class="cells"></div><div class="gloom-layer"></div><div class="tiles"></div><div class="fx"></div><div class="cursor" hidden></div>
        </div>
      </div>
      <div class="controls">
        <div class="buddy-cheer">${A.portraitSvg(c.id, 46)}<div class="bubble quiet" data-bubble>Let's make it bright!</div></div>
        <button class="btn undo" data-action="undo" aria-label="Back one move">↶ Back a move</button>
        <button class="btn small" data-action="hint">💡 Hint</button>
        <button class="btn small" data-action="tools">✨ Tools</button>
        <button class="btn small" data-action="shuffle">🔀 Shuffle <span class="badge" data-shuffle-count></span></button>
      </div>
    </section>`
    bind(appEl, {
      undo: undoMove,
      hint: () => showHint(true),
      tools: openTools,
      shuffle: useShuffle,
      settings: openSettings,
      guide: openGuide,
    })
    const board = appEl.querySelector('[data-board]')
    game.els = {
      board,
      cells: board.querySelector('.cells'),
      gloom: board.querySelector('.gloom-layer'),
      tiles: board.querySelector('.tiles'),
      fx: board.querySelector('.fx'),
      cursorEl: board.querySelector('.cursor'),
      tileMap: new Map(),
    }
    sizeBoard()
    resizeHandler = () => {
      sizeBoard()
      drawBoard(game.state.board, true)
    }
    window.addEventListener('resize', resizeHandler)
    drawStatic()
    drawBoard(game.state.board, true)
    updateHud()
    setupInput(board)
    scheduleHint()
    startGuidance()
  }

  function tipFor(key) {
    const world = activeWorld()
    const b = world.blockers
    const sp = world.specials
    const tips = {
      collect: {
        title: 'Collect ' + world.name.replace(/^.*'s /, ''),
        text: 'This level asks for a kind of jewel. Every one you clear counts toward the goal up top.',
      },
      gloom: { title: b.gloom.name, text: b.gloom.text },
      tangle: { title: b.tangle.name, text: b.tangle.text },
      buddy: { title: b.buddy.name, text: b.buddy.text },
      comb: { title: sp.comb.name + '!', text: sp.comb.text },
      bomb: { title: sp.bomb.name + '!', text: sp.bomb.text },
      rainbow: {
        title: sp.rainbow.name + '!',
        text:
          sp.rainbow.text +
          ' Swap two specials together for an even bigger burst.',
      },
    }
    return tips[key]
  }

  function coach({ title, text, button, focus, skip, place }) {
    closeCoach()
    const screen = appEl.querySelector('.game-screen')
    if (!screen || !game) return Promise.resolve('gone')
    const el = document.createElement('div')
    el.className = 'coach ' + (place || 'bottom')
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', title)
    el.innerHTML = `${heroArt(activeWorld().hero.id, 56, 'coach-portrait')}<div class="coach-body"><b>${esc(title)}</b><p>${esc(text)}</p><div class="coach-actions">${skip ? '<button class="btn small" data-coach="skip">Skip tutorial</button>' : ''}${button ? `<button class="btn small rainbow" data-coach="next">${esc(button)}</button>` : ''}</div></div>`
    screen.appendChild(el)
    if (focus) {
      const target = appEl.querySelector(focus)
      if (target) target.classList.add('tut-focus')
    }
    const next = el.querySelector('[data-coach="next"]')
    if (next) setTimeout(() => next.focus(), 30)
    return new Promise((resolve) => {
      el.querySelectorAll('[data-coach]').forEach((btn) =>
        btn.addEventListener('click', () => {
          audio.play('tap')
          closeCoach()
          resolve(btn.dataset.coach)
        }),
      )
    })
  }

  function closeCoach() {
    appEl.querySelectorAll('.coach').forEach((el) => el.remove())
    appEl
      .querySelectorAll('.tut-focus')
      .forEach((el) => el.classList.remove('tut-focus'))
  }

  function showHand(move) {
    hideHand()
    const [a, b] = move
    const hand = document.createElement('div')
    hand.className = 'tut-hand'
    hand.textContent = '👆'
    hand.style.left = (a[1] + 0.5) * game.cell + 'px'
    hand.style.top = (a[0] + 0.5) * game.cell + 'px'
    hand.style.setProperty('--dx', (b[1] - a[1]) * game.cell + 'px')
    hand.style.setProperty('--dy', (b[0] - a[0]) * game.cell + 'px')
    game.els.fx.appendChild(hand)
    for (const p of move) {
      const el = elAt(p[0], p[1])
      if (el) el.classList.add('hint')
    }
  }

  function hideHand() {
    appEl.querySelectorAll('.tut-hand').forEach((el) => el.remove())
    clearHint()
  }

  function startGuidance() {
    const s = slot()
    if (!s || !game || game.state.over) return
    if (
      !s.tutorialDone &&
      game.def.n === 1 &&
      L.REGIONS[game.def.region].tier === 0 &&
      !game.tutorialStarted &&
      !game.history.length
    ) {
      game.tutorialStarted = true
      runTutorial()
      return
    }
    levelTips()
  }

  async function runTutorial() {
    const move = E.findMove(game.state)
    if (!move) return finishTutorial()
    clearTimeout(game.hintTimer)
    const swapped = new Promise((resolve) => {
      game.tutorial = { move, done: resolve }
    })
    showHand(move)
    const lowerHalf = move[0][0] >= game.state.rows / 2
    const first = await Promise.race([
      coach({
        title: 'Welcome to ' + activeWorld().name + '!',
        text: 'Swap the two wiggling tiles to line up three of a color. Drag one onto the other, or tap one and then the other.',
        skip: true,
        place: lowerHalf ? 'top' : 'bottom',
      }),
      swapped,
    ])
    hideHand()
    closeCoach()
    if (first === 'skip' || first === 'gone') return finishTutorial()
    while (game && game.busy) await wait(120)
    if (!game || game.state.over) return finishTutorial()
    const goals = game.state.goals.map((goal) => goalText(goal)).join(', ')
    const step2 = await coach({
      title: 'Your goal',
      text: `Every level has a goal up here and a number of moves to reach it. This one: ${goals}.`,
      button: 'Next',
      focus: '[data-goals-box]',
      skip: true,
      place: 'bottom',
    })
    if (step2 !== 'next') return finishTutorial()
    const step3 = await coach({
      title: 'The Back button',
      text: 'Oops? Back a move undoes your last swap, exactly as it was. Use it as often as you like. No penalty, ever.',
      button: 'Next',
      focus: '[data-action="undo"]',
      skip: true,
      place: 'top',
    })
    if (step3 !== 'next') return finishTutorial()
    await coach({
      title: "You've got this!",
      text: 'Match 4 in a line, make an L or T shape, or line up 5 to make specials. I will pop in the first time something new shows up.',
      button: "Let's play!",
      place: 'top',
    })
    finishTutorial()
  }

  function finishTutorial() {
    const s = slot()
    if (game) game.tutorial = null
    hideHand()
    closeCoach()
    if (s) {
      s.tutorialDone = true
      persist()
    }
    scheduleHint()
  }

  async function showTip(key) {
    const s = slot()
    const tip = tipFor(key)
    if (!s || !tip || !game || s.tips.includes(key)) return
    s.tips.push(key)
    persist()
    game.busy = true
    game.coachOpen = true
    updateHud()
    await coach({
      title: tip.title,
      text: tip.text,
      button: 'Got it',
      place: 'top',
    })
    if (!game) return
    game.coachOpen = false
    game.busy = false
    updateHud()
    scheduleHint()
  }

  async function levelTips() {
    const kinds = new Set(game.def.goals.map((goal) => goal.type))
    for (const key of ['collect', 'gloom', 'tangle', 'buddy']) {
      if (kinds.has(key)) await showTip(key)
    }
    const hasRainbow = game.state.board.some((row) =>
      row.some((tile) => tile && tile.special === 'rainbow'),
    )
    if (hasRainbow) await showTip('rainbow')
  }

  async function specialTips(phases) {
    const made = new Set()
    for (const phase of phases)
      for (const c of phase.created || [])
        made.add(c.special === 'h' || c.special === 'v' ? 'comb' : c.special)
    for (const key of ['comb', 'bomb', 'rainbow'])
      if (made.has(key)) await showTip(key)
  }

  function sizeBoard() {
    const wrap = appEl.querySelector('[data-wrap]')
    if (!wrap || !game) return
    const rect = wrap.getBoundingClientRect()
    const st = game.state
    const cell = Math.max(
      26,
      Math.floor(
        Math.min((rect.width - 16) / st.cols, (rect.height - 12) / st.rows, 76),
      ),
    )
    game.cell = cell
    game.els.board.style.width = cell * st.cols + 'px'
    game.els.board.style.height = cell * st.rows + 'px'
    drawStatic()
  }

  function pos(r, c) {
    return `translate(${c * game.cell}px, ${r * game.cell}px)`
  }

  function drawStatic() {
    const st = game.state
    const cell = game.cell
    let cells = ''
    for (let r = 0; r < st.rows; r++)
      for (let c = 0; c < st.cols; c++) {
        if (!E.isCell(st, r, c)) continue
        cells += `<div class="cell-bg ${(r + c) % 2 ? 'alt' : ''}" style="left:${c * cell + 2}px;top:${r * cell + 2}px;width:${cell - 4}px;height:${cell - 4}px"></div>`
      }
    game.els.cells.innerHTML = cells
    drawGloom()
  }

  function drawGloom() {
    const st = game.state
    const cell = game.cell
    let html = ''
    for (let r = 0; r < st.rows; r++)
      for (let c = 0; c < st.cols; c++) {
        const layers = st.gloom[r][c]
        if (!layers || !E.isCell(st, r, c)) continue
        html += `<div class="gloom ${layers > 1 ? 'l2' : ''}" style="left:${c * cell + 2}px;top:${r * cell + 2}px;width:${cell - 4}px;height:${cell - 4}px"></div>`
      }
    game.els.gloom.innerHTML = html
  }

  function tileSvg(tile) {
    const worldId = levelWorld(game.id).id
    if (tile.kind === 'buddy') return A.buddySvg(worldId)
    if (tile.kind === 'tangle') return A.tangleSvg(tile.hp, worldId)
    return A.gemSvg(tile.color, tile.special, data.settings.symbols, worldId)
  }

  function tileLabel(tile) {
    const world = levelWorld(game.id)
    if (tile.kind === 'buddy') return world.blockers.buddy.name
    if (tile.kind === 'tangle') return world.blockers.tangle.name
    if (tile.special === 'rainbow') return world.specials.rainbow.name
    const name = world.jewels[tile.color].name
    if (tile.special === 'h')
      return name + ' ' + world.specials.comb.name + ' (row)'
    if (tile.special === 'v')
      return name + ' ' + world.specials.comb.name + ' (column)'
    if (tile.special === 'bomb') return name + ' ' + world.specials.bomb.name
    return name
  }

  function drawBoard(board, instant, spawnFrom) {
    const map = game.els.tileMap
    const seen = new Set()
    const cell = game.cell
    for (let r = 0; r < board.length; r++)
      for (let c = 0; c < board[r].length; c++) {
        const tile = board[r][c]
        if (!tile) continue
        seen.add(tile.id)
        let el = map.get(tile.id)
        const sig =
          tile.kind + ':' + tile.color + ':' + tile.special + ':' + tile.hp
        if (!el) {
          el = document.createElement('div')
          el.className = 'tile' + (tile.kind === 'tangle' ? ' fixed' : '')
          el.style.width = cell + 'px'
          el.style.height = cell + 'px'
          el.dataset.id = tile.id
          const from = spawnFrom && spawnFrom.get(tile.id)
          el.style.transition = 'none'
          el.style.transform = pos(from !== undefined ? from : r, c)
          game.els.tiles.appendChild(el)
          map.set(tile.id, el)
          el.offsetWidth
          el.style.transition = ''
        }
        if (el._sig !== sig) {
          if (el._sig && tile.special) {
            el.classList.remove('created')
            el.offsetWidth
            el.classList.add('created')
          }
          el.innerHTML = tileSvg(tile)
          el._sig = sig
        }
        el.style.width = cell + 'px'
        el.style.height = cell + 'px'
        el.style.padding = Math.round(cell * 0.05) + 'px'
        el.dataset.r = r
        el.dataset.c = c
        el.setAttribute('aria-label', tileLabel(tile))
        if (instant) {
          el.style.transition = 'none'
          el.style.transform = pos(r, c)
          el.offsetWidth
          el.style.transition = ''
        } else {
          el.style.transform = pos(r, c)
        }
      }
    for (const [id, el] of map) {
      if (!seen.has(id)) {
        el.remove()
        map.delete(id)
      }
    }
    updateCursor()
  }

  function updateHud() {
    if (!game || !appEl.querySelector('[data-moves]')) return
    const st = game.state
    appEl.querySelector('[data-moves]').textContent = Math.max(0, st.movesLeft)
    appEl
      .querySelector('[data-moves-box]')
      .classList.toggle('low', st.movesLeft <= 3 && !st.over)
    appEl.querySelector('[data-score]').textContent = st.score.toLocaleString()
    appEl.querySelector('[data-meter]').style.width =
      Math.min(100, (st.score / (game.def.stars[2] * 1.1)) * 100) + '%'
    appEl.querySelector('[data-goals]').innerHTML = st.goals
      .map((g) => {
        const remaining =
          g.type === 'score'
            ? Math.max(0, g.target - st.score)
            : g.target - g.progress
        const done = remaining <= 0
        return `<span class="goal ${done ? 'done' : ''}" title="${esc(goalText(g))}">${A.goalIconSvg(g, levelWorld(game.id).id)}${done ? '✓' : g.type === 'score' ? remaining.toLocaleString() : remaining}</span>`
      })
      .join('')
    const undo = appEl.querySelector('[data-action="undo"]')
    const limit =
      data.settings.backLimit === 'unlimited'
        ? Infinity
        : Number(data.settings.backLimit)
    undo.disabled = !game.history.length || game.busy || game.undosUsed >= limit
    undo.innerHTML =
      '↶ Back a move' +
      (limit !== Infinity
        ? ` <span class="badge">${Math.max(0, limit - game.undosUsed)}</span>`
        : '')
    const s = slot()
    appEl.querySelector('[data-shuffle-count]').textContent = s.boosters.shuffle
    appEl.querySelector('[data-action="shuffle"]').disabled =
      game.busy || s.boosters.shuffle <= 0 || st.over
    appEl.querySelector('[data-action="tools"]').disabled = game.busy || st.over || !!game.tutorial?.move
  }

  function cheer(text) {
    const bubble = appEl.querySelector('[data-bubble]')
    if (!bubble) return
    bubble.textContent = text
    bubble.classList.remove('quiet')
    clearTimeout(game.cheerTimer)
    game.cheerTimer = setTimeout(() => bubble.classList.add('quiet'), 1800)
  }

  function setupInput(board) {
    let start = null
    board.addEventListener('pointerdown', (event) => {
      audio.unlock()
      const cellPos = cellFromEvent(event)
      if (!cellPos || game.busy || game.state.over) return
      start = { pos: cellPos, x: event.clientX, y: event.clientY, moved: false }
      board.setPointerCapture && board.setPointerCapture(event.pointerId)
    })
    board.addEventListener('pointermove', (event) => {
      if (!start || start.moved || game.tool) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < game.cell * 0.35) return
      start.moved = true
      const dir =
        Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0]
      const target = [start.pos[0] + dir[0], start.pos[1] + dir[1]]
      clearSelection()
      attemptSwap(start.pos, target)
    })
    const end = () => {
      if (start && !start.moved) tapCell(start.pos)
      start = null
    }
    board.addEventListener('pointerup', end)
    board.addEventListener('pointercancel', () => (start = null))
    board.addEventListener('keydown', (event) => {
      const keys = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      if (keys[event.key]) {
        event.preventDefault()
        const d = keys[event.key]
        if (game.selected && !game.tool) {
          const target = [game.selected[0] + d[0], game.selected[1] + d[1]]
          const from = game.selected
          clearSelection()
          attemptSwap(from, target)
          return
        }
        game.cursor = [
          Math.max(0, Math.min(game.state.rows - 1, game.cursor[0] + d[0])),
          Math.max(0, Math.min(game.state.cols - 1, game.cursor[1] + d[1])),
        ]
        game.els.cursorEl.hidden = false
        updateCursor()
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        game.els.cursorEl.hidden = false
        tapCell(game.cursor)
      }
      if (event.key === 'z' || event.key === 'Backspace') {
        event.preventDefault()
        undoMove()
      }
      if (event.key === 'h') showHint(true)
    })
  }

  function updateCursor() {
    if (!game || !game.els) return
    const el = game.els.cursorEl
    el.style.width = game.cell + 'px'
    el.style.height = game.cell + 'px'
    el.style.transform = pos(game.cursor[0], game.cursor[1])
  }

  function cellFromEvent(event) {
    const rect = game.els.board.getBoundingClientRect()
    const c = Math.floor((event.clientX - rect.left) / game.cell)
    const r = Math.floor((event.clientY - rect.top) / game.cell)
    if (!E.isCell(game.state, r, c)) return null
    return [r, c]
  }

  function elAt(r, c) {
    const tile = E.tileAt(game.state, r, c)
    return tile ? game.els.tileMap.get(tile.id) : null
  }

  function clearSelection() {
    if (game.selected) {
      const el = elAt(game.selected[0], game.selected[1])
      if (el) el.classList.remove('selected')
    }
    game.selected = null
  }

  function tapCell(p) {
    if (game.busy || game.state.over) return
    game.cursor = p
    updateCursor()
    if (game.tool) return toolCell(p)
    const tile = E.tileAt(game.state, p[0], p[1])
    if (!tile || tile.kind === 'tangle') return
    if (game.selected) {
      const from = game.selected
      clearSelection()
      if (from[0] === p[0] && from[1] === p[1]) return
      if (Math.abs(from[0] - p[0]) + Math.abs(from[1] - p[1]) === 1) {
        attemptSwap(from, p)
        return
      }
    }
    game.selected = p
    const el = elAt(p[0], p[1])
    if (el) el.classList.add('selected')
    audio.play('tap')
  }

  async function attemptSwap(a, b) {
    if (game.busy || game.state.over) return
    if (!E.isCell(game.state, b[0], b[1])) return
    if (game.tutorial && game.tutorial.move) {
      const [m0, m1] = game.tutorial.move
      const same = (p, q) => p[0] === q[0] && p[1] === q[1]
      if (!((same(a, m0) && same(b, m1)) || (same(a, m1) && same(b, m0)))) {
        audio.play('invalid')
        cheer('Try the two wiggling tiles first 💖')
        return
      }
      const done = game.tutorial.done
      game.tutorial.move = null
      hideHand()
      if (done) done('swapped')
    }
    clearHint()
    if (!E.canSwap(game.state, a, b)) {
      const ea = elAt(a[0], a[1])
      const eb = elAt(b[0], b[1])
      if (ea && eb && E.tileAt(game.state, b[0], b[1]).kind !== 'tangle') {
        game.busy = true
        audio.play('invalid')
        ea.style.transform = pos(b[0], b[1])
        eb.style.transform = pos(a[0], a[1])
        await wait(180)
        ea.style.transform = pos(a[0], a[1])
        eb.style.transform = pos(b[0], b[1])
        await wait(180)
        game.busy = false
      }
      scheduleHint()
      return
    }
    rememberMove()
    game.busy = true
    updateHud()
    const result = E.trySwap(game.state, a, b)
    await playPhases(result.phases, a, b)
    game.busy = false
    updateHud()
    if (result.outcome === 'win') return onWin()
    if (result.outcome === 'fail') return onFail()
    if (!game.tutorial) await specialTips(result.phases)
    scheduleHint()
  }

  function burst(cleared, cell) {
    if (data.settings.reducedMotion || !game) return
    const world = levelWorld(game.id)
    const fx = game.els.fx
    const sample = cleared.slice(0, 12)
    sample.forEach((item, i) => {
      for (let k = 0; k < 2; k++) {
        const p = document.createElement('span')
        p.className = 'particle'
        p.textContent =
          world.effects.glyphs[(i + k) % world.effects.glyphs.length]
        const angle = ((i * 7 + k * 3) % 12) * (Math.PI / 6)
        const dist = cell * (0.8 + ((i + k) % 3) * 0.35)
        p.style.left = (item.c + 0.5) * cell + 'px'
        p.style.top = (item.r + 0.5) * cell + 'px'
        p.style.color =
          world.effects.colors[(i + k) % world.effects.colors.length]
        p.style.fontSize = Math.max(12, cell * 0.36) + 'px'
        p.style.setProperty('--px', Math.cos(angle) * dist + 'px')
        p.style.setProperty('--py', Math.sin(angle) * dist + 'px')
        fx.appendChild(p)
        setTimeout(() => p.remove(), 750)
      }
    })
  }

  async function playPhases(phases, a, b) {
    const cell = game.cell
    const fx = game.els.fx
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]
      if (phase.swap) {
        const ea = game.els.tileMap.get(phase.swap.ids[0])
        const eb = game.els.tileMap.get(phase.swap.ids[1])
        audio.play('swap')
        if (ea) ea.style.transform = pos(b[0], b[1])
        if (eb) eb.style.transform = pos(a[0], a[1])
        await wait(190)
      }
      if (phase.shuffle) {
        toast('🔀', 'No moves left, so the board got a fresh shuffle.')
        drawBoard(phase.board, false)
        await wait(300)
        continue
      }
      if (phase.perk === 'bloom') {
        cheer('Bloom! +1 move 🌸')
        audio.play('chime')
        continue
      }
      for (const f of phase.fired) {
        if (
          f.special === 'h' ||
          f.special === 'cross' ||
          f.special === 'mega-cross'
        ) {
          const line = document.createElement('div')
          line.className = 'fx-line'
          line.style.cssText = `left:0;right:0;top:${f.r * cell + cell * 0.35}px;height:${cell * 0.3}px`
          fx.appendChild(line)
          setTimeout(() => line.remove(), 500)
        }
        if (
          f.special === 'v' ||
          f.special === 'cross' ||
          f.special === 'mega-cross'
        ) {
          const line = document.createElement('div')
          line.className = 'fx-line'
          line.style.cssText = `top:0;bottom:0;left:${f.c * cell + cell * 0.35}px;width:${cell * 0.3}px;background:linear-gradient(180deg,#fff0,#fff,#fff0)`
          fx.appendChild(line)
          setTimeout(() => line.remove(), 500)
        }
        if (f.special === 'bomb' || f.special === 'mega-bomb') {
          const ring = document.createElement('div')
          ring.className = 'fx-ring'
          const size = cell * (f.special === 'mega-bomb' ? 5 : 3)
          ring.style.cssText = `left:${(f.c + 0.5) * cell - size / 2}px;top:${(f.r + 0.5) * cell - size / 2}px;width:${size}px;height:${size}px`
          fx.appendChild(ring)
          setTimeout(() => ring.remove(), 550)
        }
        if (f.special === 'rainbow' || f.special === 'double-rainbow') {
          const glow = document.createElement('div')
          glow.className = 'fx-rainbow'
          fx.appendChild(glow)
          setTimeout(() => glow.remove(), 700)
        }
        audio.play(
          f.special === 'bomb' || f.special === 'mega-bomb'
            ? 'bomb'
            : f.special.includes('rainbow')
              ? 'rainbow'
              : 'comb',
        )
      }
      const cleared = phase.cleared
      if (cleared.length) {
        burst(cleared, cell)
        audio.play('match', phase.cascade)
        for (const item of cleared) {
          const el = game.els.tileMap.get(item.id)
          if (el && !phase.created.some((cr) => cr.id === item.id))
            el.classList.add('pop')
        }
        if (phase.gloom.length) {
          audio.play('gloom')
          drawGloom()
        }
        for (const hurt of phase.hurt) {
          const el = game.els.tileMap.get(hurt.id)
          if (el) {
            el.innerHTML = A.tangleSvg(hurt.hp, levelWorld(game.id).id)
            el._sig = 'tangle:undefined:undefined:' + hurt.hp
          }
        }
        if (phase.score) {
          const mid = cleared[Math.floor(cleared.length / 2)]
          const pop = document.createElement('div')
          pop.className = 'fx-score'
          pop.textContent = '+' + phase.score
          pop.style.left = (mid.c + 0.5) * cell + 'px'
          pop.style.top = (mid.r + 0.5) * cell + 'px'
          fx.appendChild(pop)
          setTimeout(() => pop.remove(), 850)
        }
        if (phase.created.length) audio.play('special')
        if (phase.cascade >= 2)
          cheer(
            character(slot().character).cheer[Math.min(phase.cascade - 2, 4)],
          )
        updateHud()
        await wait(260)
      }
      if (phase.rescued.length) {
        audio.play('rescue')
        cheer('Buddy rescued! 🤖💖')
        for (const item of phase.rescued) {
          const el = game.els.tileMap.get(item.id)
          if (el) el.classList.add('pop')
          const pop = document.createElement('div')
          pop.className = 'fx-score'
          pop.textContent = '💖 Saved!'
          pop.style.left = (item.c + 0.5) * cell + 'px'
          pop.style.top = (item.r + 0.5) * cell + 'px'
          fx.appendChild(pop)
          setTimeout(() => pop.remove(), 850)
        }
        updateHud()
        await wait(320)
      }
      if (phase.board) {
        const spawnFrom = new Map()
        for (const f of phase.falls || [])
          if (f.spawn) spawnFrom.set(f.id, f.from)
        drawBoard(phase.board, false, spawnFrom)
        updateHud()
        await wait(phase.falls && phase.falls.length ? 240 : 60)
      }
    }
  }

  function undoMove() {
    if (!game || game.busy || !game.history.length) return
    const limit =
      data.settings.backLimit === 'unlimited'
        ? Infinity
        : Number(data.settings.backLimit)
    if (game.undosUsed >= limit) {
      toast(
        '↶',
        'No Back moves left this level. You can change the limit in Settings.',
      )
      return
    }
    const undosSoFar = game.state.stats.undos
    const saved = game.history.pop()
    game.state = saved.state
    slot().boosters = saved.boosters
    slot().sparkles = saved.sparkles
    game.boostsUsed = saved.boostsUsed
    game.tool = null
    game.toolFrom = null
    persist()
    game.state.stats.undos = undosSoFar + 1
    game.undosUsed++
    clearSelection()
    clearHint()
    audio.play('undo')
    cheer(
      [
        'Take two! 💕',
        'No harm done!',
        'Rewinding the rainbow…',
        'Every try counts!',
      ][game.undosUsed % 4],
    )
    drawGloom()
    drawBoard(game.state.board, false)
    updateHud()
    if (game.state.over && !game.state.won) return onFail()
    scheduleHint()
  }

  function rememberMove() {
    game.history.push({
      state: E.clone(game.state),
      boosters: { ...slot().boosters },
      sparkles: slot().sparkles,
      boostsUsed: game.boostsUsed,
    })
  }

  function openTools() {
    const s = slot()
    if (game.busy || game.state.over || game.tutorial?.move) return
    const tools = [
      ['wand', 'Sparkle Wand', 'Clear a tile'],
      ['swap', 'Free Swap', 'Swap any two jewels'],
      ['brush', 'Comb Brush', 'Paint a jewel into a comb'],
    ]
    const modal = openModal({
      title: 'Helper tools',
      body: `<div class="list">${tools.map(([key, label, description]) => `<button class="btn" data-m="tool" data-tool="${key}" ${s.boosters[key] ? '' : 'disabled'}>${label} · ${s.boosters[key]}<small>${description}</small></button>`).join('')}</div><p>Daily gifts, quests and achievements earn tools. Back restores a spent tool.</p>`,
      foot: '<button class="btn" data-m="cancel">Cancel tool</button>',
    })
    modalActions(modal, {
      tool: (el) => {
        clearSelection()
        clearHint()
        game.tool = el.dataset.tool
        game.toolFrom = null
        closeModal(true)
        cheer(game.tool === 'swap' ? 'Choose two jewels' : 'Choose a tile')
        game.els.board.focus()
      },
      cancel: () => {
        game.tool = null
        game.toolFrom = null
        clearSelection()
        closeModal(true)
      },
    })
  }

  async function toolCell(p) {
    const key = game.tool
    const s = slot()
    if (!s.boosters[key]) return
    const tile = E.tileAt(game.state, p[0], p[1])
    if (!tile || (key !== 'wand' && tile.kind !== 'gem')) return
    if (key === 'swap' && !game.toolFrom) {
      game.toolFrom = p
      game.selected = p
      elAt(p[0], p[1])?.classList.add('selected')
      cheer('Choose the second jewel')
      return
    }
    const from = game.toolFrom || p
    const trial = E.clone(game.state)
    const result = E.useTool(trial, key, from, p)
    if (!result.ok) {
      audio.play('invalid')
      return
    }
    rememberMove()
    game.state = trial
    s.boosters[key]--
    persist()
    game.tool = null
    game.toolFrom = null
    clearSelection()
    game.busy = true
    updateHud()
    await playPhases(result.phases, from, p)
    game.busy = false
    drawGloom()
    updateHud()
    if (result.outcome === 'win') return onWin()
    scheduleHint()
  }

  function useShuffle() {
    const s = slot()
    if (!game || game.busy || s.boosters.shuffle <= 0) return
    rememberMove()
    s.boosters.shuffle--
    game.state.stats.toolsUsed++
    persist()
    const st = game.state
    const gems = []
    for (let r = 0; r < st.rows; r++)
      for (let c = 0; c < st.cols; c++)
        if (E.tileAt(st, r, c) && E.tileAt(st, r, c).kind === 'gem')
          gems.push([r, c])
    let guard = 0
    do {
      for (let i = gems.length - 1; i > 0; i--) {
        const j = E.randInt(st.rng, i + 1)
        const [r1, c1] = gems[i]
        const [r2, c2] = gems[j]
        const t = st.board[r1][c1]
        st.board[r1][c1] = st.board[r2][c2]
        st.board[r2][c2] = t
      }
    } while ((E.findRuns(st).length || !E.findMove(st)) && guard++ < 40)
    audio.play('special')
    drawBoard(st.board, false)
    updateHud()
    toast('🔀', 'Shuffle Spritz! A fresh look for the board.')
  }

  function clearHint() {
    clearTimeout(game && game.hintTimer)
    document
      .querySelectorAll('.tile.hint')
      .forEach((el) => el.classList.remove('hint'))
  }

  function scheduleHint() {
    if (!game || !data.settings.hints) return
    clearTimeout(game.hintTimer)
    game.hintTimer = setTimeout(() => showHint(false), 9000)
  }

  function showHint(manual) {
    if (!game || game.busy || game.state.over) return
    clearHint()
    const move = E.findMove(game.state)
    if (!move) return
    if (manual) game.state.stats.hints++
    for (const p of move) {
      const el = elAt(p[0], p[1])
      if (el) el.classList.add('hint')
    }
  }

  function confirmLeaveLevel() {
    if (!game || game.state.over) {
      leaveLevel()
      return
    }
    const modal = openModal({
      title: 'Head back to the map?',
      body: '<p class="center">This level will reset. Progress toward quests from this attempt still counts.</p>',
      foot: '<button class="btn" data-m="stay">Keep playing</button><button class="btn primary" data-m="leave">Back to map</button>',
    })
    modalActions(modal, {
      stay: () => closeModal(true),
      leave: () => {
        closeModal(true)
        commitResult(false)
        leaveLevel()
      },
    })
  }

  function leaveLevel() {
    clearHint()
    game = null
    stack.pop()
    render()
  }

  function commitResult(won, stars) {
    if (!game || game.committed) return null
    game.committed = true
    const s = slot()
    const report = M.commitLevel(
      s,
      {
        levelId: game.id,
        won,
        stars: stars || 0,
        score: game.state.score,
        stats: game.state.stats,
      },
      L,
    )
    persist()
    if (report.questsReady.length > 1)
      toast(
        '🌈',
        report.questsReady.length + ' quests complete! Claim them on the map.',
      )
    else
      for (const q of report.questsReady)
        toast('🌈', 'Quest complete: ' + q.text + '. Claim it on the map!')
    if (report.achievements.length > 2)
      toast(
        '🏆',
        report.achievements.length +
          ' achievements unlocked, including ' +
          report.achievements[0].name +
          '!',
      )
    else
      for (const a of report.achievements) toast('🏆', 'Achievement: ' + a.name)
    if (report.achievements.length) audio.play('chime')
    return report
  }

  async function onWin() {
    const st = game.state
    clearHint()
    cheer('WE DID IT! 🌈')
    const { movesConverted, bonus, phases } = E.finishBonus(st)
    if (movesConverted) {
      const pop = document.createElement('div')
      pop.className = 'fx-score'
      pop.style.left = '50%'
      pop.style.top = '50%'
      pop.style.fontSize = '1.6rem'
      pop.textContent = `Kindness Overflow! ${movesConverted} moves → +${bonus}`
      game.els.fx.appendChild(pop)
      await playPhases(phases)
      updateHud()
      await wait(500)
      pop.remove()
    }
    audio.play('win')
    const stars = E.starsFor(st, game.def.stars)
    const report = commitResult(true, stars)
    const s = slot()
    const isFinale = game.def.finale
    const regionDone = game.def.regionFinale
    const doneRegionId = game.def.region
    const nextId = nextLevelId()
    const sparkleLine = report.sparklesEarned
      ? `<p class="center">✨ +${report.sparklesEarned} sparkles</p>`
      : ''
    const unlocked = report.scrapbookUnlocked.filter(
      (id) => !id.startsWith('sticker:'),
    ).length
    const modal = openModal({
      title: isFinale ? 'Finale complete!' : 'Level complete!',
      dismissable: false,
      body: `<div class="result-stars">${[0, 1, 2].map((k) => `<span class="s">${A.starSvg(k < stars)}</span>`).join('')}</div><p class="center" style="font-size:1.4rem;font-weight:900">${st.score.toLocaleString()} points</p>${sparkleLine}${unlocked ? `<p class="center">📔 ${unlocked} new scrapbook page${unlocked > 1 ? 's' : ''}</p>` : ''}<p class="center muted">${esc(character(levelWorld(game.id).hero.id).cheer[stars % 5])}</p>`,
      foot: `<button class="btn" data-m="map">Map</button><button class="btn" data-m="replay">Replay</button>${nextId && !isFinale && !regionDone ? '<button class="btn rainbow" data-m="next">Next level →</button>' : ''}${isFinale ? '<button class="btn rainbow" data-m="ending">See the ending ✨</button>' : ''}${regionDone && !isFinale ? '<button class="btn rainbow" data-m="map">Onward →</button>' : ''}`,
    })
    ;[0, 1, 2].forEach(
      (k) =>
        k < stars && setTimeout(() => audio.play('star', k), 300 + k * 250),
    )
    modalActions(modal, {
      map: () => {
        closeModal(true)
        leaveLevel()
        if (regionDone && !isFinale) {
          const nextRegion = L.nextOf(doneRegionId)
          if (nextRegion) setTimeout(() => showRegionIntro(nextRegion), 250)
        }
      },
      replay: () => {
        closeModal(true)
        game = newGame(game.id)
        render()
      },
      next: () => {
        closeModal(true)
        game = null
        stack.pop()
        render()
        openLevelIntro(nextId)
      },
      ending: () => {
        closeModal(true)
        const endingId = report.ending
        leaveLevel()
        showEnding(
          endingId,
          report.secretEnding ? () => showEnding('everyone') : null,
        )
      },
    })
  }

  function nextLevelId() {
    const s = slot()
    const list = L.routeLevels(levelWorld(game.id).id)
    const index = list.indexOf(game.id)
    return index >= 0 && index < list.length - 1 ? list[index + 1] : null
  }

  function onFail() {
    audio.play('fail')
    clearHint()
    const s = slot()
    const st = game.state
    const remaining = st.goals
      .filter((g) =>
        g.type === 'score' ? st.score < g.target : g.progress < g.target,
      )
      .map((g) =>
        goalText({
          ...g,
          target:
            g.type === 'score' ? g.target - st.score : g.target - g.progress,
        }),
      )
    const limit =
      data.settings.backLimit === 'unlimited'
        ? Infinity
        : Number(data.settings.backLimit)
    const canUndo = game.history.length && game.undosUsed < limit
    const boostCost = 30 + game.boostsUsed * 20
    const modal = openModal({
      title: 'So close!',
      dismissable: false,
      body: `<div class="story-card">${heroArt(s.character, 110, 'fail-portrait')}<p>The colors are still in there. Still to go: <b>${esc(remaining.join(', '))}</b>.</p><p class="muted">No lives, no timers. Try as many times as you like.</p></div>`,
      foot: `${canUndo ? '<button class="btn undo" data-m="undo" style="background:linear-gradient(135deg,#4cc9f0,#3ddc97);color:#fff">↶ Back a move</button>' : ''}<button class="btn" data-m="boost" ${s.sparkles < boostCost && !s.boosters.moves ? 'disabled' : ''}>💖 +5 moves (${s.boosters.moves ? 'free gift' : boostCost + ' ✨'})</button><button class="btn" data-m="retry">Retry</button><button class="btn primary" data-m="map">Map</button>`,
    })
    modalActions(modal, {
      undo: () => {
        closeModal(true)
        st.over = false
        undoMove()
      },
      boost: () => {
        if (!s.boosters.moves && s.sparkles < boostCost) return
        rememberMove()
        if (s.boosters.moves) s.boosters.moves--
        else if (s.sparkles >= boostCost) s.sparkles -= boostCost
        else return
        game.boostsUsed++
        st.stats.toolsUsed++
        persist()
        closeModal(true)
        st.over = false
        st.movesLeft += 5
        audio.play('chime')
        cheer('Five more! You got this 💖')
        updateHud()
        scheduleHint()
      },
      retry: () => {
        closeModal(true)
        commitResult(false)
        game = newGame(game.id)
        render()
      },
      map: () => {
        closeModal(true)
        commitResult(false)
        leaveLevel()
      },
    })
  }

  /* Ending */

  function showEnding(endingId, then) {
    const ending = L.ENDINGS[endingId]
    if (!ending) return
    const s = slot()
    const region = ending.region ? L.REGIONS[ending.region] : null
    const world = region ? regionWorld(region.id) : slotWorld(s)
    const c = character(world.hero.id)
    const cast = ending.secret ? L.CHARACTERS : [c]
    audio.play('win')
    audio.startMusic({
      ...world.music,
      tempo: Math.max(70, world.music.tempo - 12),
      tag: 'ending-' + endingId,
    })
    const el = document.createElement('div')
    el.className = 'ending'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', ending.title)
    const others = Object.values(L.ENDINGS).filter(
      (e) => !s.endings.includes(e.id),
    ).length
    el.setAttribute(
      'style',
      themeStyle(world) +
        (ending.secret
          ? ''
          : `;background:linear-gradient(135deg, ${world.ui.bg.join(', ')}, ${world.ui.accent})`),
    )
    el.innerHTML = `<div class="cast">${cast.map((ch) => heroArt(ch.id, 70, 'ending-portrait')).join('')}</div><h1>${esc(ending.title)}</h1><div class="panel">${endingArt(endingId, 'scene')}${region ? `<p class="muted">${esc(world.name)} · ${esc(region.name)}</p>` : '<p class="muted">Secret ending</p>'}<p style="font-size:1.08rem">${esc(ending.text)}</p><p><b>${esc(c.name)}:</b> ${esc(c.epilogue)}</p><p class="credits">${others ? `${others} more ending${others > 1 ? 's are' : ' is'} still out there. Visit another world from the map.` : 'You found every ending. Thank you for bringing color to everyone.'}</p><p class="credits">Hopeful Hues · a Kind Robots game · starring ${L.CHARACTERS.map((h) => esc(h.name)).join(', ')} · made with love and a back button.</p><button class="btn rainbow" data-done>${then ? 'Wait… there is more ✨' : 'Back to the map'}</button></div>`
    document.body.appendChild(el)
    el.querySelector('[data-done]').focus()
    el.querySelector('[data-done]').addEventListener('click', () => {
      audio.play('tap')
      el.remove()
      if (then) then()
      else render()
    })
  }

  /* Panels */

  function openQuests() {
    const s = slot()
    M.refreshQuests(s, new Date())
    persist()
    const now = new Date()
    const left = (d) => {
      const ms = d - now
      const h = Math.floor(ms / 3600000)
      return h >= 24
        ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h'
        : h + 'h ' + Math.floor((ms % 3600000) / 60000) + 'm'
    }
    const row = (list, entry, index) => {
      const def = M.questDef(entry.id)
      const pct = Math.round((entry.progress / def.target) * 100)
      const ready = entry.progress >= def.target
      return `<div class="quest"><div><b>${esc(def.text)}</b><div class="muted">${entry.progress} / ${def.target} · ✨ ${def.reward}</div></div>${entry.claimed ? '<span class="chip">✓ Claimed</span>' : `<button class="btn small ${ready ? 'rainbow' : ''}" data-m="claim" data-list="${list}" data-index="${index}" ${ready ? '' : 'disabled'}>Claim</button>`}<div class="bar"><div style="width:${pct}%"></div></div></div>`
    }
    const modal = openModal({
      title: 'Daily & weekly quests',
      body: `<div class="section-title">Daily quests <small>new in ${left(M.nextReset(now, false))}</small></div><div class="list">${s.quests.daily.map((q, i) => row('daily', q, i)).join('')}</div><div class="section-title">Weekly quests <small>new in ${left(M.nextReset(now, true))}</small></div><div class="list">${s.quests.weekly.map((q, i) => row('weekly', q, i)).join('')}</div><p class="muted center">Quest progress counts when a level ends, win or not. Sparkles buy +5 move gifts. Today's kindness: ${esc(kindnessOfDay())}</p>`,
      onClose: () => stack[stack.length - 1].name === 'map' && render(),
    })
    modalActions(modal, {
      claim: (el) => {
        const reward = M.claimQuest(
          s,
          el.dataset.list,
          Number(el.dataset.index),
        )
        if (reward) {
          audio.play('chime')
          toast('✨', `+${reward} sparkles!`)
          const unlocked = checkMetaAchievements()
          persist()
          closeModal(true)
          openQuests()
          unlocked.forEach((a) => toast('🏆', 'Achievement: ' + a.name))
        }
      },
    })
  }

  function checkMetaAchievements() {
    const s = slot()
    const total = M.scrapbookCatalog(L).length
    const unlocked = []
    for (const a of M.ACHIEVEMENTS) {
      if (s.achievements[a.id]) continue
      if (a.check(s, total)) {
        s.achievements[a.id] = Date.now()
        if (!s.scrapbook.includes('sticker:' + a.id))
          s.scrapbook.push('sticker:' + a.id)
        unlocked.push(a)
      }
    }
    return unlocked
  }

  const MEDALS = [
    '🌟',
    '💖',
    '🌈',
    '🦋',
    '🤖',
    '🌸',
    '🍭',
    '🎀',
    '✨',
    '🧁',
    '🌻',
    '🪩',
  ]

  function openAchievements() {
    const s = slot()
    const got = Object.keys(s.achievements).length
    const card = (a, i) => {
      const when = s.achievements[a.id]
      return `<div class="ach ${when ? '' : 'locked'}"><div class="medal">${MEDALS[i % MEDALS.length]}</div><b>${esc(a.name)}</b><div class="muted">${esc(a.text)}</div>${when ? `<div class="muted">✓ ${new Date(when).toLocaleDateString()}</div>` : ''}</div>`
    }
    const general = M.ACHIEVEMENTS.filter((a) => !a.world)
    let body = `<div class="section-title">Everywhere <small>${general.filter((a) => s.achievements[a.id]).length}/${general.length}</small></div><div class="ach-grid">${general.map(card).join('')}</div>`
    for (const w of W.list()) {
      const list = M.ACHIEVEMENTS.filter((a) => a.world === w.id)
      body += `<div class="section-title">${esc(w.name)} <small>${list.filter((a) => s.achievements[a.id]).length}/${list.length}</small></div><div class="ach-grid">${list.map((a, i) => card(a, i + w.order)).join('')}</div>`
    }
    openModal({
      title: `Achievements · ${got}/${M.ACHIEVEMENTS.length}`,
      wide: true,
      body,
    })
  }

  function openScrapbook(tab) {
    const s = slot()
    const catalog = M.scrapbookCatalog(L)
    const groups = [
      ['story', 'Story'],
      ['postcards', 'Postcards'],
      ['friends', 'Friends'],
      ['endings', 'Endings'],
      ['stickers', 'Stickers'],
    ]
    const active = typeof tab === 'string' ? tab : 'story'
    const items = catalog.filter((e) => e.group === active)
    const cards = items
      .map((e, i) => {
        const have = s.scrapbook.includes(e.id)
        const tilt = ((i * 37) % 7) - 3
        let pic = ''
        let bg = '#ffe3f1'
        if (e.region) {
          const r = L.REGIONS[e.region]
          bg = `linear-gradient(135deg, ${r.sky[0]}, ${r.sky[1]})`
          const at = e.id.startsWith('beat:') ? Number(e.id.split(':')[2]) : 1
          pic = beatArt(e.region, at, 'fill')
        } else if (e.character) {
          pic = heroArt(e.character, 120, 'fill')
          bg = '#fff6fb'
        } else if (e.ending) {
          bg = 'var(--rainbow)'
          pic = endingArt(e.ending, 'fill')
        } else if (e.achievement) {
          const idx = M.ACHIEVEMENTS.findIndex((a) => a.id === e.achievement)
          pic = `<span style="font-size:3.4rem">${MEDALS[idx % MEDALS.length]}</span>`
          bg = 'linear-gradient(135deg,#fff3c4,#ffe3f1)'
        }
        return `<div class="polaroid ${have ? '' : 'locked'}" style="--tilt:${tilt}deg"><div class="pic" style="background:${bg}">${have ? pic : '?'}</div><h4>${have ? esc(e.title) : '???'}</h4><p>${have ? esc(e.text) : 'Keep playing to fill this page.'}</p></div>`
      })
      .join('')
    const total = catalog.length
    const have = catalog.filter((e) => s.scrapbook.includes(e.id)).length
    const modal = openModal({
      title: `Scrapbook · ${have}/${total} pages`,
      wide: true,
      body: `<div class="tabs" role="tablist">${groups.map(([id, label]) => `<button class="btn small" role="tab" aria-selected="${id === active}" data-m="tab" data-tab="${id}">${label} ${catalog.filter((e) => e.group === id && s.scrapbook.includes(e.id)).length}/${catalog.filter((e) => e.group === id).length}</button>`).join('')}</div><div class="polaroids">${cards}</div>`,
    })
    modalActions(modal, {
      tab: (el) => {
        closeModal(true)
        openScrapbook(el.dataset.tab)
      },
    })
  }

  function openSettings() {
    const s = data.settings
    const toggle = (key, label, note) =>
      `<div class="settings-row"><div><b>${label}</b>${note ? `<div class="muted">${note}</div>` : ''}</div><button class="toggle" role="switch" aria-checked="${!!s[key]}" aria-label="${label}" data-m="toggle" data-key="${key}"></button></div>`
    const modal = openModal({
      title: 'Settings',
      body: `<div class="settings-row"><b>Music</b><input type="range" min="0" max="1" step="0.05" value="${s.music}" data-range="music" aria-label="Music volume"></div>
        <div class="settings-row"><b>Sound effects</b><input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-range="sfx" aria-label="Sound effects volume"></div>
        ${toggle('reducedMotion', 'Reduced motion', 'Calmer animations and faster cascades.')}
        ${toggle('highContrast', 'High contrast', 'Stronger text and outlines.')}
        ${toggle('symbols', 'Color symbols on tiles', 'Each color also has its own shape symbol.')}
        ${toggle('largeText', 'Larger text')}
        ${toggle('hints', 'Gentle hints', 'A possible move wiggles after a quiet pause.')}
        <div class="settings-row"><div><b>Back button</b><div class="muted">How many moves you can take back per level.</div></div><select data-select="backLimit" aria-label="Back button limit" class="btn small">${['unlimited', '5', '3', '1'].map((v) => `<option value="${v}" ${s.backLimit === v ? 'selected' : ''}>${v === 'unlimited' ? 'Unlimited' : v + ' per level'}</option>`).join('')}</select></div>
        <div class="settings-row"><div><b>Save data</b><div class="muted">Saves automatically to this device after every level.</div></div><button class="btn small" data-m="slots">Manage slots</button></div>
        <div class="settings-row"><div><b>Tutorial</b><div class="muted">Replay the guided first level and the first-time tips.</div></div><button class="btn small" data-m="replay">Replay tutorial</button></div>`,
    })
    modal.querySelectorAll('[data-range]').forEach((input) =>
      input.addEventListener('input', () => {
        data.settings[input.dataset.range] = Number(input.value)
        applySettings()
        persist()
        if (input.dataset.range === 'sfx') audio.play('tap')
      }),
    )
    modal.querySelector('[data-select]').addEventListener('change', (event) => {
      data.settings.backLimit = event.target.value
      persist()
      if (game) updateHud()
    })
    modalActions(modal, {
      toggle: (el) => {
        const key = el.dataset.key
        data.settings[key] = !data.settings[key]
        el.setAttribute('aria-checked', String(data.settings[key]))
        applySettings()
        persist()
        if (key === 'symbols' && game) {
          game.els.tileMap.forEach((tileEl) => (tileEl._sig = ''))
          drawBoard(game.state.board, true)
        }
      },
      replay: () => {
        const s = slot()
        if (!s) {
          toast('💾', 'Pick a save slot first.')
          return
        }
        s.tutorialDone = false
        s.tips = []
        persist()
        toast(
          '🌈',
          'The tutorial will play on the first level of any world, and tips will show again.',
        )
      },
      slots: () => {
        closeAllModals()
        if (game) confirmLeaveLevel()
        else {
          stack.length = 1
          go('slots')
        }
      },
    })
  }

  function openGuide() {
    const world = activeWorld()
    const wid = world.id
    const icon = (svg) =>
      `<span style="display:inline-block;width:34px;height:34px;vertical-align:middle">${svg}</span>`
    const sp = world.specials
    const b = world.blockers
    openModal({
      title: 'How to play',
      wide: true,
      body: `<p><b>Swap two neighboring jewels</b> to line up 3 or more of the same kind. Drag, or tap one and then its neighbor. Keyboard: arrows move, Enter selects, arrows swap.</p>
        <p><b>↶ Back a move</b> undoes your last swap, exactly as it was. Use it as often as you like (or set a limit in Settings). Even on the "So close" screen you can step back.</p>
        <p>${icon(A.gemSvg(0, 'h', true, wid))} <b>${esc(sp.comb.name)}</b>: ${esc(sp.comb.text)}</p>
        <p>${icon(A.gemSvg(4, 'bomb', true, wid))} <b>${esc(sp.bomb.name)}</b>: ${esc(sp.bomb.text)}</p>
        <p>${icon(A.gemSvg(0, 'rainbow', true, wid))} <b>${esc(sp.rainbow.name)}</b>: ${esc(sp.rainbow.text)}</p>
        <p><b>Swap two specials together</b> for giant combos: two sweepers make a cross, a sweeper and a blast clear three rows and columns, two blasts make a huge burst, and two color-clearers clear the whole board.</p>
        <p>${icon(A.goalIconSvg({ type: 'gloom' }, wid))} <b>${esc(b.gloom.name)}</b>: ${esc(b.gloom.text)}</p>
        <p>${icon(A.tangleSvg(1, wid))} <b>${esc(b.tangle.name)}</b>: ${esc(b.tangle.text)}</p>
        <p>${icon(A.buddySvg(wid))} <b>${esc(b.buddy.name)}</b>: ${esc(b.buddy.text)}</p>
        <p><b>Worlds</b>: ${W.list().length} worlds, each with its own hero, jewels, story, quests, achievements and ending. Each world is a long road through three regions. Switch worlds from the map at any time; finish them all for a secret ending.</p>
        <p><b>Quests</b> refresh every day and every week, with one quest themed to your current world. Claim them for sparkles, which buy +5 move gifts when you need a hand.</p>
        <p class="muted">There are no lives, timers or purchases. Saves stay on this device, and you can export a save code.</p>`,
    })
  }

  /* Boot */

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      back()
    }
  })

  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return
    const msg = event.data || {}
    if (msg.type === 'hopeful-hues:open' && msg.panel === 'guide') openGuide()
  })

  document.addEventListener(
    'pointerdown',
    () => {
      audio.unlock()
    },
    { once: true },
  )

  if (embedded) document.documentElement.classList.add('embedded')
  applySettings()
  sky()
  stack.push({ name: 'title', params: {} })
  render()

  window.__hopefulHues = {
    get data() {
      return data
    },
    get game() {
      return game
    },
    go,
    back,
  }
})()
