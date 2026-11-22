// alarm.js — the house alarm, 0 to 100. It climbs while any guard or camera
// has eyes on the thief (faster up close, faster still under a camera, slower
// while the thief sneaks) and cools down while the thief stays hidden. Past 70
// the house is on edge and guards start hunting; at 100 the thief is caught.

export class Alarm {
  constructor() {
    this.value = 0;
    this.warned = false;
  }

  // observers: [{rate}] — each watcher currently seeing the thief, with its
  // own climb rate. dt in seconds. Returns nothing; read .value.
  update(dt, observers, sneaking) {
    if (observers.length > 0) {
      let rate = 0;
      for (const o of observers) rate += o.rate;
      if (sneaking) rate *= 0.55;
      this.value = Math.min(100, this.value + rate * dt);
    } else {
      this.value = Math.max(0, this.value - 6.5 * dt);
    }
    if (this.value >= 70 && !this.warned) this.warned = true;
    if (this.value < 60) this.warned = false;
  }

  get hunting() {
    return this.value > 55;
  }

  get caught() {
    return this.value >= 100;
  }

  get level() {
    if (this.value < 35) return 'calm';
    if (this.value < 70) return 'suspicious';
    return 'hunting';
  }
}
