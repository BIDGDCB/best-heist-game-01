// player.js — Wren, the thief. Moves with WASD or arrows, sneaks on Shift
// (slower, harder to spot, and the only way to stay low in the service duct),
// and carries three tools: coins to toss as a distraction, smoke pellets to
// blind a cone, and an EMP burst to knock the cameras out. The sapphire takes
// a steady hand: hold E beside its case to cut the glass.

import { dist, resolveCircleRect } from './geometry.js';
import { ROOM } from './levels.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.r = 13;
    this.walkSpeed = 175;
    this.sneakSpeed = 92;
    this.sneaking = false;
    this.moving = false;
    this.face = -Math.PI / 2;
    this.coins = 0;
    this.smoke = 0;
    this.emp = 0;
    this.loot = 0;
    this.grabbing = 0; // 0..1 progress cutting the sapphire glass
    this.hasSapphire = false;
    this.stepPhase = 0;
  }

  reset(start, tools) {
    this.x = start.x;
    this.y = start.y;
    this.coins = tools.coins;
    this.smoke = tools.smoke;
    this.emp = tools.emp;
    this.loot = 0;
    this.grabbing = 0;
    this.hasSapphire = false;
    this.sneaking = false;
  }

  update(dt, input, covers) {
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.sneaking = !!input.sneak;
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      const speed = this.sneaking ? this.sneakSpeed : this.walkSpeed;
      this.face = Math.atan2(my, mx);
      this.stepPhase += dt * (this.sneaking ? 7 : 11);
      // Move axis by axis so sliding along a case feels right.
      this.x += mx * speed * dt;
      this.x = Math.max(ROOM.x + this.r, Math.min(ROOM.x + ROOM.w - this.r, this.x));
      this.y += my * speed * dt;
      this.y = Math.max(ROOM.y + this.r, Math.min(ROOM.y + ROOM.h - this.r, this.y));
      for (const c of covers) {
        const fixed = resolveCircleRect(this.x, this.y, this.r, c);
        this.x = fixed.x;
        this.y = fixed.y;
      }
    }
  }

  // Hold E near the sapphire case: returns true the moment the glass is cut.
  grabSapphire(dt, sapphire, holdingE) {
    if (this.hasSapphire) return false;
    const near = dist(this.x, this.y, sapphire.x, sapphire.y) < 52;
    if (near && holdingE) {
      this.grabbing = Math.min(1, this.grabbing + dt / 1.2);
      if (this.grabbing >= 1) {
        this.hasSapphire = true;
        this.loot += sapphire.value;
        this.grabbing = 0;
        return true;
      }
    } else {
      this.grabbing = Math.max(0, this.grabbing - dt * 2);
    }
    return false;
  }

  // Toss a coin to (x, y): the nearest guard goes to look. Returns the
  // landing spot, or null when no coins are left.
  throwCoin(x, y) {
    if (this.coins <= 0) return null;
    this.coins -= 1;
    return { x, y };
  }

  // Drop a smoke pellet at the thief's feet. Returns the cloud, or null.
  dropSmoke() {
    if (this.smoke <= 0) return null;
    this.smoke -= 1;
    return { x: this.x, y: this.y, r: 62, ttl: 4.5 };
  }

  // Fire the EMP: every camera goes dark for a while. Returns true on use.
  fireEmp() {
    if (this.emp <= 0) return false;
    this.emp -= 1;
    return true;
  }
}
