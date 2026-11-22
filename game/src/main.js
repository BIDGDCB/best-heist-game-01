// main.js — The Velvet Vault: boot, game loop and state machine.
// States: title → playing → caught | nightClear → playing … → win.
// The whole room fits on one screen, so one frame always shows the thief,
// the guards and their cones, the cameras, the loot and the alarm meter.
// A ?shot= preset freezes a chosen moment for screenshots; it only sets
// state the game itself can reach, and the render is the game's own code.

import { LEVELS, ROOM } from './levels.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Player } from './player.js';
import { Alarm } from './alarm.js';
import { Input } from './input.js';
import { SoundFX } from './audio.js';
import { dist } from './geometry.js';
import {
  drawRoom, drawLoot, drawExit, drawCones, drawActors, drawVignette,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const $ = (id) => document.getElementById(id);
const hud = {
  alarmFill: $('alarm-fill'),
  alarmText: $('alarm-text'),
  loot: $('loot'),
  timer: $('timer'),
  night: $('night'),
  tools: $('tool-counts'),
  objective: $('objective'),
  toast: $('toast'),
  overlay: $('overlay'),
  overlayTitle: $('overlay-title'),
  overlayBody: $('overlay-body'),
  overlayHint: $('overlay-hint'),
};

class Game {
  constructor() {
    this.input = new Input(canvas);
    this.sfx = new SoundFX();
    this.state = 'title'; // title | playing | paused | caught | nightClear | win
    this.levelIndex = 0;
    this.totalLoot = 0;
    this.totalTime = 0;
    this.timeLeft = 0;
    this.smokeClouds = [];
    this.coinsOnFloor = [];
    this.toastTimer = 0;
    this.alarmTickTimer = 0;
    this.frozen = false;
    this.loadLevel(0);
    this.showTitle();
  }

  loadLevel(i) {
    this.levelIndex = i;
    // Deep-copy the level so replaying resets artifacts and patrols.
    this.level = JSON.parse(JSON.stringify(LEVELS[i]));
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.cameras = this.level.cameras.map((c) => new Camera(c));
    this.player = new Player(this.level.start);
    this.player.reset(this.level.start, this.level.tools);
    this.alarm = new Alarm();
    this.timeLeft = this.level.parTime;
    this.smokeClouds = [];
    this.coinsOnFloor = [];
    hud.night.textContent = `NIGHT ${i + 1} / ${LEVELS.length}`;
    hud.objective.textContent = this.level.briefing;
  }

  showTitle() {
    this.state = 'title';
    hud.overlay.classList.remove('hidden');
    hud.overlayTitle.textContent = 'THE VELVET VAULT';
    hud.overlayTitle.className = 'title';
    hud.overlayBody.innerHTML =
      'One thief. Three nights. Three sapphires.<br>' +
      'Cross each gallery unseen — guards sweep yellow cones, cameras sweep red. ' +
      'Hide behind the cases, slip through the duct, toss a coin to pull a guard away, ' +
      'smoke a cone, EMP the cameras. Cut the glass (hold E), grab what you can, ' +
      'and reach the green exit before the alarm hits 100.';
    hud.overlayHint.innerHTML =
      '<b>WASD / arrows</b> move &nbsp;·&nbsp; <b>Shift</b> sneak &nbsp;·&nbsp; <b>E</b> cut glass (hold) &nbsp;·&nbsp; ' +
      '<b>Click</b> toss coin &nbsp;·&nbsp; <b>Q</b> smoke &nbsp;·&nbsp; <b>F</b> EMP &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute<br>' +
      'Press <b>Enter</b> to begin the heist';
  }

  startNight() {
    hud.overlay.classList.add('hidden');
    this.state = 'playing';
    this.sfx.ensure();
    this.toast('Night ' + (this.levelIndex + 1) + ': ' + this.level.name, 3);
  }

  toast(msg, seconds = 2.5) {
    hud.toast.textContent = msg;
    hud.toast.classList.remove('hidden');
    this.toastTimer = seconds;
  }

  update(dt) {
    if (this.state === 'title') {
      // Attract mode: patrols walk behind the title.
      for (const g of this.guards) g.update(dt, this.player, this.level.covers, [], 0);
      for (const c of this.cameras) c.update(dt);
      return;
    }
    if (this.state !== 'playing') return;

    this.totalTime += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.getCaught('The night ran out — dawn caught you in the gallery.');
      return;
    }

    const p = this.player;
    p.update(dt, this.input, this.level.covers);
    if (p.moving) this.sfx.step(p.sneaking);

    // Tools: smoke (Q), EMP (F), coin toss (click).
    if (this.input.consumePress('q')) {
      const cloud = p.dropSmoke();
      if (cloud) {
        this.smokeClouds.push(cloud);
        this.sfx.smoke();
        this.toast('Smoke out — the cones cannot see through it.');
      } else this.toast('No smoke pellets left.');
    }
    if (this.input.consumePress('f')) {
      if (p.fireEmp()) {
        for (const c of this.cameras) c.disable(8);
        this.sfx.emp();
        this.toast('EMP burst — cameras dark for 8 seconds.');
      } else this.toast('No EMP charges left.');
    }
    const click = this.input.consumeClick();
    if (click) {
      const spot = p.throwCoin(click.x, click.y);
      if (spot) {
        this.coinsOnFloor.push({ ...spot, ttl: 1.2 });
        this.sfx.coin();
        let nearest = null;
        let best = Infinity;
        for (const g of this.guards) {
          const d = dist(g.x, g.y, spot.x, spot.y);
          if (d < best) { best = d; nearest = g; }
        }
        if (nearest) nearest.distract(spot.x, spot.y);
        this.toast('Coin tossed — a guard goes to look.');
      } else this.toast('No coins left.');
    }

    // Smoke ages out.
    for (const s of this.smokeClouds) s.ttl -= dt;
    this.smokeClouds = this.smokeClouds.filter((s) => s.ttl > 0);
    for (const c of this.coinsOnFloor) c.ttl -= dt;
    this.coinsOnFloor = this.coinsOnFloor.filter((c) => c.ttl > 0);

    // Who sees the thief?
    const observers = [];
    for (const g of this.guards) {
      g.update(dt, p, this.level.covers, this.smokeClouds, this.alarm.value);
      if (g.seeing) {
        const d = dist(g.x, g.y, p.x, p.y);
        observers.push({ rate: 26 * (1.6 - d / g.range) });
      }
    }
    for (const c of this.cameras) {
      c.update(dt);
      if (c.seesThief(p, this.level.covers, this.smokeClouds)) {
        const d = dist(c.x, c.y, p.x, p.y);
        observers.push({ rate: 34 * (1.6 - d / c.range) });
      }
    }

    const before = this.alarm.value;
    this.alarm.update(dt, observers, p.sneaking);
    if (this.alarm.value >= 70 && before < 70) {
      this.sfx.alarmTick();
      this.toast('They are hunting you — break line of sight!');
    }
    if (observers.length > 0) {
      this.alarmTickTimer -= dt;
      if (this.alarmTickTimer <= 0) {
        this.sfx.alarmTick();
        this.alarmTickTimer = 0.7;
      }
    }

    // Loot: small artifacts on touch, sapphire by cutting the glass.
    for (const a of this.level.artifacts) {
      if (!a.taken && dist(p.x, p.y, a.x, a.y) < 26) {
        a.taken = true;
        p.loot += a.value;
        this.sfx.pickup();
        this.toast(`${a.name} pocketed — +$${a.value}.`);
      }
    }
    if (p.grabSapphire(dt, this.level.sapphire, this.input.grab)) {
      this.sfx.sapphire();
      this.alarm.value = Math.min(100, this.alarm.value + 8);
      this.toast(`${this.level.sapphire.name} is yours — reach the green exit!`, 3.5);
    }

    // Exit opens once the sapphire is taken.
    const e = this.level.exit;
    if (p.hasSapphire &&
        p.x > e.x - 6 && p.x < e.x + e.w + 6 &&
        p.y > e.y - 30 && p.y < e.y + e.h + 6) {
      this.nightClear();
      return;
    }

    if (this.alarm.caught) {
      this.getCaught('Spotted. The house alarm hit 100 and the doors locked.');
    }
  }

  getCaught(reason) {
    this.state = 'caught';
    this.sfx.caught();
    hud.overlay.classList.remove('hidden');
    hud.overlayTitle.textContent = 'CAUGHT';
    hud.overlayTitle.className = 'caught';
    hud.overlayBody.innerHTML =
      `${reason}<br>Loot kept: <b>$${this.player.loot}</b> · Alarm peaked at <b>100</b>.`;
    hud.overlayHint.innerHTML = 'Press <b>R</b> to try the night again';
  }

  nightClear() {
    const timeBonus = Math.max(0, Math.round(this.timeLeft)) * 2;
    const alarmBonus = Math.max(0, Math.round(100 - this.alarm.value));
    const nightScore = this.player.loot + timeBonus + alarmBonus;
    this.totalLoot += nightScore;
    this.sfx.win();
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.state = 'win';
      hud.overlay.classList.remove('hidden');
      hud.overlayTitle.textContent = 'CLEAN GETAWAY';
      hud.overlayTitle.className = 'win';
      hud.overlayBody.innerHTML =
        `Three nights, three sapphires, no trace.<br>` +
        `Final take: <b>$${this.totalLoot}</b> · Time in the field: <b>${Math.round(this.totalTime)}s</b>.<br>` +
        `Wren melts into the night. The Velvet Vault never knew what hit it.`;
      hud.overlayHint.innerHTML = 'Press <b>R</b> to run it all again';
      return;
    }
    this.state = 'nightClear';
    hud.overlay.classList.remove('hidden');
    hud.overlayTitle.textContent = 'NIGHT CLEAR';
    hud.overlayTitle.className = 'win';
    hud.overlayBody.innerHTML =
      `Sapphire secured. Night take <b>$${nightScore}</b> ` +
      `(loot $${this.player.loot} + time $${timeBonus} + quiet $${alarmBonus}).<br>` +
      `Total so far: <b>$${this.totalLoot}</b>.`;
    hud.overlayHint.innerHTML = 'Press <b>Enter</b> for the next night';
  }

  handleKeys() {
    if (this.input.consumePress('m')) {
      this.sfx.muted = !this.sfx.muted;
      this.toast(this.sfx.muted ? 'Sound off.' : 'Sound on.');
    }
    if (this.state === 'title' && this.input.consumePress('enter')) {
      this.startNight();
      return;
    }
    if (this.state === 'playing' && this.input.consumePress('p')) {
      this.state = 'paused';
      hud.overlay.classList.remove('hidden');
      hud.overlayTitle.textContent = 'PAUSED';
      hud.overlayTitle.className = 'title';
      hud.overlayBody.textContent = 'The gallery holds its breath.';
      hud.overlayHint.innerHTML = 'Press <b>P</b> to keep moving';
      return;
    }
    if (this.state === 'paused' && this.input.consumePress('p')) {
      hud.overlay.classList.add('hidden');
      this.state = 'playing';
      return;
    }
    if (this.state === 'nightClear' && this.input.consumePress('enter')) {
      hud.overlay.classList.add('hidden');
      this.loadLevel(this.levelIndex + 1);
      this.state = 'playing';
      this.toast('Night ' + (this.levelIndex + 1) + ': ' + this.level.name, 3);
      return;
    }
    if ((this.state === 'caught' || this.state === 'win') && this.input.consumePress('r')) {
      hud.overlay.classList.add('hidden');
      if (this.state === 'win') {
        this.totalLoot = 0;
        this.totalTime = 0;
        this.loadLevel(0);
      } else {
        this.loadLevel(this.levelIndex);
      }
      this.state = 'playing';
      return;
    }
    if (this.state === 'caught' && this.input.consumePress('enter')) {
      hud.overlay.classList.add('hidden');
      this.loadLevel(this.levelIndex);
      this.state = 'playing';
    }
  }

  render(time) {
    drawRoom(ctx, this.level, time);
    drawExit(ctx, this.level, this.player.hasSapphire);
    drawLoot(ctx, this.level, this.player.hasSapphire, time);
    if (this.state !== 'title') {
      drawCones(ctx, this.guards, this.cameras, this.level.covers);
    } else {
      // On the title screen the cones still sweep, dimmed, behind the panel.
      ctx.save();
      ctx.globalAlpha = 0.55;
      drawCones(ctx, this.guards, this.cameras, this.level.covers);
      ctx.restore();
    }
    drawActors(ctx, this.guards, this.cameras, this.player, this.smokeClouds, time);
    // Tossed coins glint on the floor.
    for (const c of this.coinsOnFloor) {
      ctx.fillStyle = '#f4d35e';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    drawVignette(ctx, this.state === 'playing' ? this.alarm.value : 0);
  }

  updateHud() {
    const a = this.alarm.value;
    hud.alarmFill.style.width = a.toFixed(0) + '%';
    hud.alarmFill.className = a < 35 ? 'calm' : a < 70 ? 'warm' : 'hot';
    hud.alarmText.textContent = `ALARM ${a.toFixed(0)}%`;
    hud.loot.textContent = `$${this.player.loot + this.totalLoot}`;
    const t = Math.max(0, Math.ceil(this.timeLeft));
    hud.timer.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    hud.timer.className = t < 30 ? 'danger' : '';
    hud.tools.innerHTML =
      `🪙 ${this.player.coins} &nbsp; 💨 ${this.player.smoke} &nbsp; ⚡ ${this.player.emp}` +
      (this.player.hasSapphire ? ' &nbsp; 💎 SAPPHIRE SECURED' : '');
    if (this.toastTimer > 0) {
      this.toastTimer -= 1 / 60;
      if (this.toastTimer <= 0) hud.toast.classList.add('hidden');
    }
  }

  // Deterministic scene setups for screenshots. Each one is a state the game
  // itself reaches in play; the render is the game's own code, frozen so the
  // frame is stable.
  applyShot(shot) {
    this.frozen = true;
    if (shot === 'title') {
      this.loadLevel(0);
      this.showTitle();
      return;
    }
    this.loadLevel(shot === 'getaway' ? 2 : 0);
    if (shot === 'heist') {
      this.state = 'playing';
      hud.overlay.classList.add('hidden');
      const p = this.player;
      p.x = 600; p.y = 300; p.face = Math.PI / 4;
      p.loot = 100;
      this.level.artifacts[0].taken = true;
      this.alarm.value = 34;
      this.guards[0].x = 420; this.guards[0].y = 300;
      this.guards[0].angle = 0; this.guards[0].state = 'patrol';
      this.guards[1].x = 800; this.guards[1].y = 430;
      this.guards[1].angle = -Math.PI / 2;
      this.cameras[0].angle = Math.PI / 2 + 0.5;
      this.cameras[1].angle = Math.PI - 0.3;
      this.smokeClouds.push({ x: 520, y: 380, r: 62, ttl: 4.5 });
    } else if (shot === 'alarm') {
      this.state = 'playing';
      hud.overlay.classList.add('hidden');
      const p = this.player;
      p.x = 470; p.y = 300; p.face = Math.PI;
      p.loot = 250;
      this.level.artifacts[0].taken = true;
      this.level.artifacts[1].taken = true;
      this.alarm.value = 76;
      this.guards[0].x = 330; this.guards[0].y = 300;
      this.guards[0].angle = 0; this.guards[0].seeing = true;
      this.guards[0].state = 'investigate';
      this.guards[1].x = 800; this.guards[1].y = 200;
      this.guards[1].angle = Math.PI / 2;
      this.cameras[0].angle = Math.PI / 2 + 0.4;
      this.cameras[0].seeing = true;
    } else if (shot === 'caught') {
      this.state = 'caught';
      this.alarm.value = 100;
      const p = this.player;
      p.x = 470; p.y = 300;
      p.loot = 250;
      this.guards[0].x = 330; this.guards[0].y = 300;
      this.guards[0].angle = 0; this.guards[0].seeing = true;
      this.guards[1].x = 800; this.guards[1].y = 430;
      this.guards[1].angle = -Math.PI / 2;
      hud.overlay.classList.remove('hidden');
      hud.overlayTitle.textContent = 'CAUGHT';
      hud.overlayTitle.className = 'caught';
      hud.overlayBody.innerHTML =
        'Spotted. The house alarm hit 100 and the doors locked.<br>' +
        'Loot kept: <b>$250</b> · Alarm peaked at <b>100</b>.';
      hud.overlayHint.innerHTML = 'Press <b>R</b> to try the night again';
    } else if (shot === 'getaway') {
      this.totalLoot = 1840;
      this.totalTime = 412;
      this.state = 'win';
      this.player.hasSapphire = true;
      this.player.x = 100; this.player.y = 540;
      this.player.loot = 0;
      this.guards[0].x = 300; this.guards[0].y = 180;
      this.guards[0].angle = Math.PI / 2;
      this.guards[1].x = 820; this.guards[1].y = 430;
      this.guards[1].angle = -Math.PI / 2;
      hud.overlay.classList.remove('hidden');
      hud.overlayTitle.textContent = 'CLEAN GETAWAY';
      hud.overlayTitle.className = 'win';
      hud.overlayBody.innerHTML =
        'Three nights, three sapphires, no trace.<br>' +
        'Final take: <b>$1840</b> · Time in the field: <b>412s</b>.<br>' +
        'Wren melts into the night. The Velvet Vault never knew what hit it.';
      hud.overlayHint.innerHTML = 'Press <b>R</b> to run it all again';
    }
    this.updateHud();
  }
}

const game = new Game();
window.__game = game;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) game.applyShot(shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) {
    game.handleKeys();
    game.update(dt);
  }
  game.render(now / 1000);
  if (!game.frozen) game.updateHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
