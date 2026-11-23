;(function (root) {
  'use strict'

  const worlds = []

  function register(world) {
    if (!world || !world.id) throw new Error('world needs an id')
    if (worlds.some((w) => w.id === world.id)) return
    worlds.push(world)
    worlds.sort((a, b) => a.order - b.order)
  }

  function list() {
    return worlds.slice()
  }

  function get(id) {
    return worlds.find((w) => w.id === id) || null
  }

  root.HopefulHuesWorlds = { register, list, get }
})(typeof globalThis !== 'undefined' ? globalThis : this)
