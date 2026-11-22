// guards.js — the patrol guards. A guard walks a loop of waypoints, pauses to
// look around, and sweeps a yellow vision cone ahead of him. When he sees the
// thief he raises the alarm and gives chase to the last seen spot; when the
// alarm cools he goes back to his route. A tossed coin pulls the nearest
// guard to the clink instead — a thief's oldest trick.

import { angleDiff, dist, lineOfSightClear } from './geometry.js';

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints;
    this.speed = def.speed;
    this.pause = def.pause;
    this.range = def.range;
    this.halfAngle = def.halfAngle;
    this.x = def.waypoints[0][0];
    this.y = def.waypoints[0][1];
    this.wp = 1 % def.waypoints.length;
    this.wait = 0;
    this.angle = 0;
    this.state = 'patrol'; // patrol | investigate | return
    this.seeing = false;
    this.suspicion = 0; // 0..1, how sure the guard is right now
    this.target = null; // {x, y} when investigating
    this.lookTimer = 0;
    this.searchTime = 0;
    this.scanDir = 1;
  }

  // Can this guard see the thief right now? Needs the thief inside the cone,
  // a clear line of sight, and the thief outside any smoke.
  seesThief(thief, covers, smokeClouds) {
    const d = dist(this.x, this.y, thief.x, thief.y);
    if (d > this.range) return false;
    const ang = Math.atan2(thief.y - this.y, thief.x - this.x);
    if (Math.abs(angleDiff(ang, this.angle)) > this.halfAngle) return false;
    if (!lineOfSightClear(this.x, this.y, thief.x, thief.y, covers)) return false;
    for (const s of smokeClouds) {
      if (dist(s.x, s.y, thief.x, thief.y) < s.r) return false;
      if (segmentThroughSmoke(this.x, this.y, thief.x, thief.y, s)) return false;
    }
    return true;
  }

  update(dt, thief, covers, smokeClouds, alarmLevel) {
    const seen = this.seesThief(thief, covers, smokeClouds);
    this.seeing = seen;
    if (seen) {
      this.suspicion = Math.min(1, this.suspicion + dt * 1.6);
      this.target = { x: thief.x, y: thief.y };
      if (alarmLevel > 55) this.state = 'investigate';
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.8);
      if (this.state === 'investigate' && this.suspicion <= 0 && !this.target) {
        this.state = 'return';
      }
    }

    if (this.state === 'investigate' && this.target) {
      this.walkToward(this.target.x, this.target.y, this.speed * 1.35, dt);
      if (dist(this.x, this.y, this.target.x, this.target.y) < 14) {
        // Arrived: look around for a while, then give up.
        this.lookTimer += dt;
        this.searchTime += dt;
        this.angle += dt * 1.4 * this.scanDir;
        if (this.lookTimer > 0.9) { this.scanDir *= -1; this.lookTimer = 0; }
        if (this.searchTime > 3 && this.suspicion <= 0) {
          this.state = 'return';
          this.target = null;
          this.lookTimer = 0;
          this.searchTime = 0;
        }
      }
      return;
    }

    if (this.state === 'return') {
      const wp = this.waypoints[this.wp];
      this.walkToward(wp[0], wp[1], this.speed, dt);
      if (dist(this.x, this.y, wp[0], wp[1]) < 10) this.state = 'patrol';
      return;
    }

    // Patrol: walk the loop, pausing at each waypoint to scan.
    if (this.wait > 0) {
      this.wait -= dt;
      this.angle += dt * 0.9 * this.scanDir;
      if (this.wait <= 0) this.scanDir *= -1;
      return;
    }
    const wp = this.waypoints[this.wp];
    const arrived = this.walkToward(wp[0], wp[1], this.speed, dt);
    if (arrived) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.wait = this.pause;
    }
  }

  walkToward(tx, ty, speed, dt) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 8) return true;
    const step = Math.min(d, speed * dt);
    const nx = this.x + ((tx - this.x) / d) * step;
    const ny = this.y + ((ty - this.y) / d) * step;
    this.angle = Math.atan2(ny - this.y, nx - this.x);
    this.x = nx;
    this.y = ny;
    return d - step < 8;
  }

  // A coin clinked at (x, y): go look at it.
  distract(x, y) {
    this.target = { x, y };
    this.state = 'investigate';
    this.lookTimer = 0;
    this.searchTime = 0;
  }
}

function segmentThroughSmoke(x1, y1, x2, y2, s) {
  // Does the sight line pass through the smoke circle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return false;
  let t = ((s.x - x1) * dx + (s.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return dist(px, py, s.x, s.y) < s.r * 0.85;
}
