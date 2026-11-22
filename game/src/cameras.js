// cameras.js — wall-mounted security cameras. Each one sits on a wall and
// sweeps a red cone back and forth. A camera spots the thief faster than a
// guard does, but it never moves and an EMP burst knocks it out for a while.

import { angleDiff, dist, lineOfSightClear } from './geometry.js';

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.base = def.base;
    this.sweep = def.sweep;
    this.speed = def.speed;
    this.range = def.range;
    this.halfAngle = 0.42;
    this.phase = Math.random() * Math.PI * 2;
    this.angle = def.base;
    this.disabled = 0; // seconds left knocked out
    this.seeing = false;
  }

  update(dt) {
    if (this.disabled > 0) {
      this.disabled = Math.max(0, this.disabled - dt);
      this.seeing = false;
      return;
    }
    this.phase += dt * this.speed;
    this.angle = this.base + Math.sin(this.phase) * this.sweep;
  }

  seesThief(thief, covers, smokeClouds) {
    if (this.disabled > 0) return false;
    const d = dist(this.x, this.y, thief.x, thief.y);
    if (d > this.range) return false;
    const ang = Math.atan2(thief.y - this.y, thief.x - this.x);
    if (Math.abs(angleDiff(ang, this.angle)) > this.halfAngle) return false;
    if (!lineOfSightClear(this.x, this.y, thief.x, thief.y, covers)) return false;
    for (const s of smokeClouds) {
      if (dist(s.x, s.y, thief.x, thief.y) < s.r) return false;
    }
    this.seeing = true;
    return true;
  }

  disable(seconds) {
    this.disabled = seconds;
  }
}
