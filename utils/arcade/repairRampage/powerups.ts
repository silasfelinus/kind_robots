export const REPAIR_TOOLS = [
  'super-wrench',
  'paint-roller',
  'hard-hat',
  'rubber-gloves',
  'umbrella',
  'rocket-boots',
] as const

export type RepairTool = (typeof REPAIR_TOOLS)[number]

export const REPAIR_TOOL_LABELS: Record<RepairTool, string> = {
  'super-wrench': 'SUPER WRENCH',
  'paint-roller': 'PAINT ROLLER',
  'hard-hat': 'HARD HAT',
  'rubber-gloves': 'RUBBER GLOVES',
  umbrella: 'UMBRELLA',
  'rocket-boots': 'ROCKET BOOTS',
}

export function toolboxTool(
  city: number,
  tower: number,
  index: number,
): RepairTool {
  const seed =
    Math.max(0, Math.floor(city)) +
    Math.max(0, Math.floor(tower)) * 3 +
    Math.max(0, Math.floor(index))
  return REPAIR_TOOLS[seed % REPAIR_TOOLS.length]!
}
