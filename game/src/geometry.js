// geometry.js — small 2D helpers for vision, line of sight and movement.
// No dependencies; pure functions so guards, cameras and the player share one
// definition of "can X see Y".

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// True when the segment (x1,y1)-(x2,y2) touches or crosses rect {x,y,w,h}.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  // Slab test on x.
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  // Slab test on y.
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// True when nothing in `covers` blocks the view from (x1,y1) to (x2,y2).
export function lineOfSightClear(x1, y1, x2, y2, covers) {
  for (const c of covers) {
    if (segmentHitsRect(x1, y1, x2, y2, c)) return false;
  }
  return true;
}

// Distance from (x,y) along angle `a` until the ray hits a cover rect or
// the room bounds; returns the travel distance (never more than maxDist).
// The ray starts inside `bounds`, so the bounds contribute their exit
// distance, while a cover rect contributes its entry distance.
export function raycastDistance(x, y, a, maxDist, covers, bounds) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = maxDist;

  // Exit distance from the room rect (the ray starts inside it).
  const exit = rayRectExit(x, y, dx, dy, bounds);
  if (exit !== null) best = Math.min(best, exit);

  for (const r of covers) {
    const entry = rayRectEntry(x, y, dx, dy, r, best);
    if (entry !== null) best = entry;
  }
  return best;
}

// Distance along the ray to where it leaves the rect (null when the ray
// never leaves it, e.g. it starts outside and points away).
function rayRectExit(x, y, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (x < r.x || x > r.x + r.w) return null;
  } else {
    let t1 = (r.x - x) / dx;
    let t2 = (r.x + r.w - x) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y < r.y || y > r.y + r.h) return null;
  } else {
    let t1 = (r.y - y) / dy;
    let t2 = (r.y + r.h - y) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmax === Infinity ? null : tmax;
}

// Distance along the ray to where it enters the rect (null when it never
// enters within `limit`).
function rayRectEntry(x, y, dx, dy, r, limit) {
  let tmin = 0;
  let tmax = limit;
  if (Math.abs(dx) < 1e-9) {
    if (x < r.x || x > r.x + r.w) return null;
  } else {
    let t1 = (r.x - x) / dx;
    let t2 = (r.x + r.w - x) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y < r.y || y > r.y + r.h) return null;
  } else {
    let t1 = (r.y - y) / dy;
    let t2 = (r.y + r.h - y) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

// Circle (cx,cy,r) pushed out of rect; returns corrected {x, y}.
export function resolveCircleRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const ddx = cx - nx;
  const ddy = cy - ny;
  const d2 = ddx * ddx + ddy * ddy;
  if (d2 >= r * r) return { x: cx, y: cy };
  if (d2 < 1e-9) {
    // Centre inside the rect: push out along the smallest penetration.
    const left = cx - rect.x;
    const right = rect.x + rect.w - cx;
    const top = cy - rect.y;
    const bottom = rect.y + rect.h - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: rect.x - r, y: cy };
    if (m === right) return { x: rect.x + rect.w + r, y: cy };
    if (m === top) return { x: cx, y: rect.y - r };
    return { x: cx, y: rect.y + rect.h + r };
  }
  const d = Math.sqrt(d2);
  return { x: nx + (ddx / d) * r, y: ny + (ddy / d) * r };
}
