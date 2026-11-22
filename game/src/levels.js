// levels.js — the three nights of the Velvet Vault heist.
// Each level is one room that fits on a single 960x600 screen: the thief
// crosses it, guards patrol it, cameras sweep it, the loot sits in it and
// the exit waits at the far end. Cover rectangles block both movement and
// vision, so the same layout makes the routes: the open floor in the middle,
// the case-lined lanes on the sides, and a narrow service duct along the top
// that only a sneaking thief can slip through unseen.

export const ROOM = { x: 24, y: 24, w: 912, h: 552 };

export const LEVELS = [
  {
    name: 'Night 1 — The Velvet Vault',
    briefing:
      'The Star Sapphire sleeps in its case. Cross the gallery, cut the glass, and be gone before the alarm wakes the house.',
    parTime: 150,
    start: { x: 96, y: 516 },
    exit: { x: 60, y: 552, w: 84, h: 24, label: 'SERVICE EXIT' },
    sapphire: { x: 724, y: 268, value: 500, name: 'Star Sapphire' },
    artifacts: [
      { x: 168, y: 128, value: 100, name: 'Jade Vase', taken: false },
      { x: 492, y: 96, value: 100, name: 'Ivory Mask', taken: false },
      { x: 852, y: 476, value: 150, name: 'Gold Idol', taken: false },
    ],
    covers: [
      { x: 288, y: 132, w: 96, h: 64, kind: 'case', label: 'PORCELAIN' },
      { x: 288, y: 420, w: 96, h: 64, kind: 'case', label: 'SILVER' },
      { x: 576, y: 132, w: 96, h: 64, kind: 'case', label: 'CLOCKS' },
      { x: 576, y: 420, w: 96, h: 64, kind: 'case', label: 'COINS' },
      { x: 144, y: 252, w: 64, h: 96, kind: 'case', label: 'TAPESTRY' },
      { x: 816, y: 132, w: 64, h: 96, kind: 'statue', label: '' },
      { x: 432, y: 264, w: 96, h: 72, kind: 'case', label: 'GEMS' },
      // Service duct along the top wall: the gap between these two blocks is
      // the sneaking route — guards cannot see through the cases.
      { x: 620, y: 60, w: 150, h: 44, kind: 'duct', label: 'DUCT' },
      { x: 800, y: 60, w: 100, h: 44, kind: 'duct', label: 'DUCT' },
    ],
    guards: [
      {
        waypoints: [[240, 300], [660, 300]],
        speed: 62, pause: 1.4, range: 175, halfAngle: 0.61, name: 'Mara',
      },
      {
        waypoints: [[800, 150], [800, 500]],
        speed: 55, pause: 1.8, range: 165, halfAngle: 0.61, name: 'Odo',
      },
    ],
    cameras: [
      { x: 480, y: 30, base: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 215 },
      { x: 930, y: 300, base: Math.PI, sweep: 0.7, speed: 0.7, range: 200 },
    ],
    tools: { coins: 5, smoke: 3, emp: 1 },
  },
  {
    name: 'Night 2 — The Gilded Wing',
    briefing:
      'A second wing, a second sapphire. Three guards now, and the cameras watch the lanes. Use the duct, or spend a coin to pull a patrol away.',
    parTime: 170,
    start: { x: 96, y: 516 },
    exit: { x: 60, y: 552, w: 84, h: 24, label: 'SERVICE EXIT' },
    sapphire: { x: 760, y: 150, value: 600, name: 'Empress Sapphire' },
    artifacts: [
      { x: 168, y: 128, value: 120, name: 'Jade Vase', taken: false },
      { x: 480, y: 480, value: 120, name: 'Ivory Mask', taken: false },
      { x: 880, y: 320, value: 150, name: 'Gold Idol', taken: false },
      { x: 330, y: 300, value: 100, name: 'Ruby Brooch', taken: false },
    ],
    covers: [
      { x: 240, y: 120, w: 96, h: 64, kind: 'case', label: 'PORCELAIN' },
      { x: 240, y: 420, w: 96, h: 64, kind: 'case', label: 'SILVER' },
      { x: 528, y: 120, w: 96, h: 64, kind: 'case', label: 'CLOCKS' },
      { x: 528, y: 420, w: 96, h: 64, kind: 'case', label: 'COINS' },
      { x: 384, y: 264, w: 96, h: 72, kind: 'case', label: 'GEMS' },
      { x: 660, y: 264, w: 64, h: 96, kind: 'statue', label: '' },
      { x: 144, y: 252, w: 64, h: 96, kind: 'case', label: 'TAPESTRY' },
      { x: 816, y: 420, w: 64, h: 96, kind: 'statue', label: '' },
      { x: 620, y: 60, w: 150, h: 44, kind: 'duct', label: 'DUCT' },
      { x: 800, y: 60, w: 100, h: 44, kind: 'duct', label: 'DUCT' },
    ],
    guards: [
      {
        waypoints: [[220, 180], [620, 180], [620, 420], [220, 420]],
        speed: 68, pause: 1.0, range: 180, halfAngle: 0.61, name: 'Mara',
      },
      {
        waypoints: [[820, 140], [820, 500]],
        speed: 60, pause: 1.6, range: 170, halfAngle: 0.61, name: 'Odo',
      },
      {
        waypoints: [[150, 480], [480, 480]],
        speed: 58, pause: 1.8, range: 165, halfAngle: 0.61, name: 'Iris',
      },
    ],
    cameras: [
      { x: 400, y: 30, base: Math.PI / 2, sweep: 0.9, speed: 0.6, range: 220 },
      { x: 930, y: 180, base: Math.PI, sweep: 0.75, speed: 0.75, range: 205 },
      { x: 700, y: 570, base: -Math.PI / 2, sweep: 0.7, speed: 0.65, range: 200 },
    ],
    tools: { coins: 5, smoke: 3, emp: 2 },
  },
  {
    name: 'Night 3 — The Crown Vault',
    briefing:
      'The last sapphire, the tightest watch. Patrols overlap, cameras sweep the duct mouth. Slow is smooth, smooth is gone.',
    parTime: 190,
    start: { x: 96, y: 516 },
    exit: { x: 60, y: 552, w: 84, h: 24, label: 'SERVICE EXIT' },
    sapphire: { x: 700, y: 300, value: 800, name: 'Crown Sapphire' },
    artifacts: [
      { x: 168, y: 128, value: 150, name: 'Jade Vase', taken: false },
      { x: 880, y: 120, value: 150, name: 'Ivory Mask', taken: false },
      { x: 480, y: 96, value: 150, name: 'Gold Idol', taken: false },
      { x: 880, y: 500, value: 200, name: 'Ruby Brooch', taken: false },
      { x: 300, y: 480, value: 120, name: 'Pearl Tiara', taken: false },
    ],
    covers: [
      { x: 240, y: 132, w: 96, h: 64, kind: 'case', label: 'PORCELAIN' },
      { x: 240, y: 420, w: 96, h: 64, kind: 'case', label: 'SILVER' },
      { x: 528, y: 132, w: 96, h: 64, kind: 'case', label: 'CLOCKS' },
      { x: 528, y: 420, w: 96, h: 64, kind: 'case', label: 'COINS' },
      { x: 384, y: 264, w: 96, h: 72, kind: 'case', label: 'GEMS' },
      { x: 660, y: 264, w: 64, h: 96, kind: 'statue', label: '' },
      { x: 144, y: 252, w: 64, h: 96, kind: 'case', label: 'TAPESTRY' },
      { x: 816, y: 420, w: 64, h: 96, kind: 'statue', label: '' },
      { x: 620, y: 60, w: 150, h: 44, kind: 'duct', label: 'DUCT' },
      { x: 800, y: 60, w: 100, h: 44, kind: 'duct', label: 'DUCT' },
    ],
    guards: [
      {
        waypoints: [[220, 180], [700, 180], [700, 430], [220, 430]],
        speed: 78, pause: 0.8, range: 190, halfAngle: 0.58, name: 'Mara',
      },
      {
        waypoints: [[840, 140], [840, 500]],
        speed: 70, pause: 1.2, range: 180, halfAngle: 0.58, name: 'Odo',
      },
      {
        waypoints: [[150, 480], [500, 480], [500, 300]],
        speed: 66, pause: 1.2, range: 175, halfAngle: 0.58, name: 'Iris',
      },
    ],
    cameras: [
      { x: 360, y: 30, base: Math.PI / 2, sweep: 0.95, speed: 0.7, range: 225 },
      { x: 930, y: 180, base: Math.PI, sweep: 0.8, speed: 0.85, range: 210 },
      { x: 700, y: 570, base: -Math.PI / 2, sweep: 0.8, speed: 0.75, range: 205 },
      { x: 30, y: 300, base: 0, sweep: 0.7, speed: 0.8, range: 200 },
    ],
    tools: { coins: 6, smoke: 4, emp: 2 },
  },
];
