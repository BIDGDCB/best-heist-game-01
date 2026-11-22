// render.js — everything the player sees, drawn on one canvas: the marble
// gallery, the velvet carpet, the glass cases, the thief, the guards with
// their yellow vision cones, the cameras with their red sweep cones, the
// loot, the smoke, and the exit. Cones are raycast against the cases, so a
// cone stops at the furniture instead of shining through it.

import { ROOM } from './levels.js';
import { raycastDistance } from './geometry.js';

const CONE_RAYS = 26;

function conePolygon(x, y, angle, halfAngle, range, covers) {
  const pts = [[x, y]];
  for (let i = 0; i <= CONE_RAYS; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
    const d = raycastDistance(x, y, a, range, covers, ROOM);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

function fillPolygon(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawRoom(ctx, level, time) {
  // Marble floor.
  ctx.fillStyle = '#232733';
  ctx.fillRect(0, 0, 960, 600);
  const tile = 48;
  for (let ty = 0; ty < 600 / tile; ty++) {
    for (let tx = 0; tx < 960 / tile; tx++) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = '#272c3b';
        ctx.fillRect(tx * tile, ty * tile, tile, tile);
      }
    }
  }
  // Velvet carpet down the middle.
  ctx.fillStyle = '#5a1f2b';
  ctx.fillRect(ROOM.x, 252, ROOM.w, 96);
  ctx.fillStyle = '#6d2534';
  ctx.fillRect(ROOM.x, 252, ROOM.w, 6);
  ctx.fillRect(ROOM.x, 342, ROOM.w, 6);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(ROOM.x, 296, ROOM.w, 2);
  ctx.fillRect(ROOM.x, 302, ROOM.w, 2);

  // Walls.
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, 0, 960, ROOM.y);
  ctx.fillRect(0, 600 - ROOM.y, 960, ROOM.y);
  ctx.fillRect(0, 0, ROOM.x, 600);
  ctx.fillRect(960 - ROOM.x, 0, ROOM.x, 600);
  ctx.strokeStyle = '#3a4152';
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);

  // Wall trim + room name.
  ctx.fillStyle = '#8b93a7';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— THE VELVET VAULT · GALLERY —', 480, 16);

  // Display cases, statues and duct blocks.
  for (const c of level.covers) {
    if (c.kind === 'statue') {
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8);
      ctx.fillStyle = '#6e6252';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a7d68';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 5, c.y + c.h / 2 - 6, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'duct') {
      ctx.fillStyle = '#1b1e26';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#4a5165';
      ctx.lineWidth = 1;
      for (let gx = c.x + 8; gx < c.x + c.w; gx += 14) {
        ctx.beginPath();
        ctx.moveTo(gx, c.y + 4);
        ctx.lineTo(gx, c.y + c.h - 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#5d6678';
      ctx.font = '600 9px system-ui, sans-serif';
      ctx.fillText('DUCT', c.x + c.w / 2, c.y + c.h / 2 + 3);
    } else {
      // Glass display case: dark base, pale glass, label.
      ctx.fillStyle = '#0e1016';
      ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
      ctx.fillStyle = '#2e3442';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(180, 210, 235, 0.16)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.strokeStyle = 'rgba(200, 220, 240, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x + 6, c.y + c.h - 6);
      ctx.lineTo(c.x + c.w * 0.4, c.y + 6);
      ctx.stroke();
      if (c.label) {
        ctx.fillStyle = '#c9a227';
        ctx.font = '600 9px system-ui, sans-serif';
        ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 3);
      }
    }
  }
}

export function drawLoot(ctx, level, sapphireTaken, time) {
  // Small artifacts.
  for (const a of level.artifacts) {
    if (a.taken) continue;
    const bob = Math.sin(time * 2 + a.x) * 2;
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(a.x, a.y + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath();
    ctx.arc(a.x - 2, a.y + bob - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e6df';
    ctx.font = '600 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(a.name.toUpperCase(), a.x, a.y + bob + 22);
  }

  // The sapphire: glowing gem in its glass case.
  if (!sapphireTaken) {
    const s = level.sapphire;
    const pulse = 0.6 + Math.sin(time * 3) * 0.25;
    const glow = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, 52);
    glow.addColorStop(0, `rgba(80, 200, 255, ${0.5 * pulse})`);
    glow.addColorStop(1, 'rgba(80, 200, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 52, 0, Math.PI * 2);
    ctx.fill();
    // Glass case.
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x - 22, s.y - 22, 44, 44);
    // Gem.
    ctx.fillStyle = '#37b6ff';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 13);
    ctx.lineTo(s.x + 11, s.y);
    ctx.lineTo(s.x, s.y + 13);
    ctx.lineTo(s.x - 11, s.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 13);
    ctx.lineTo(s.x + 11, s.y);
    ctx.lineTo(s.x, s.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7fd4ff';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ ' + s.name.toUpperCase() + ' ★', s.x, s.y - 32);
  }
}

export function drawExit(ctx, level, open) {
  const e = level.exit;
  ctx.fillStyle = open ? '#1d7a3a' : '#3a2b22';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#4ade80' : '#8a7a5a';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? '#bbf7d0' : '#d8cdb4';
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT · LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 3);
  if (open) {
    const glow = ctx.createRadialGradient(
      e.x + e.w / 2, e.y, 4, e.x + e.w / 2, e.y, 90,
    );
    glow.addColorStop(0, 'rgba(74, 222, 128, 0.35)');
    glow.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(e.x - 50, e.y - 90, e.w + 100, 100);
  }
}

export function drawCones(ctx, guards, cameras, covers) {
  // Camera cones first (red, under guard cones).
  for (const cam of cameras) {
    if (cam.disabled > 0) continue;
    const pts = conePolygon(cam.x, cam.y, cam.angle, cam.halfAngle, cam.range, covers);
    fillPolygon(ctx, pts, cam.seeing ? 'rgba(255, 60, 60, 0.34)' : 'rgba(255, 60, 60, 0.20)');
  }
  for (const g of guards) {
    const pts = conePolygon(g.x, g.y, g.angle, g.halfAngle, g.range, covers);
    const col = g.seeing
      ? 'rgba(255, 190, 40, 0.42)'
      : g.state === 'investigate'
        ? 'rgba(255, 190, 40, 0.32)'
        : 'rgba(255, 210, 90, 0.20)';
    fillPolygon(ctx, pts, col);
  }
}

export function drawActors(ctx, guards, cameras, thief, smokeClouds, time) {
  // Smoke clouds.
  for (const s of smokeClouds) {
    const alpha = Math.min(0.75, (s.ttl / 4.5) * 0.75);
    const grad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
    grad.addColorStop(0, `rgba(200, 200, 210, ${alpha})`);
    grad.addColorStop(1, 'rgba(200, 200, 210, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cameras: small wall boxes with a lens.
  for (const cam of cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.disabled > 0 ? '#555a66' : '#2b2f3a';
    ctx.fillRect(-4, -8, 16, 16);
    ctx.fillStyle = cam.disabled > 0 ? '#333' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(12, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (cam.disabled > 0) {
      ctx.fillStyle = '#9aa0ae';
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF ' + Math.ceil(cam.disabled) + 's', cam.x, cam.y + 26);
    }
  }

  // Guards: navy uniforms, brass buttons, a torch in hand.
  for (const g of guards) {
    const bob = g.moving ? Math.sin(time * 10) * 1.5 : 0;
    ctx.save();
    ctx.translate(g.x, g.y + bob * 0.4);
    // Body.
    ctx.fillStyle = '#1f2a44';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(0, 0, 13, -0.6, 0.6);
    ctx.lineTo(0, 0);
    ctx.fill();
    // Head.
    ctx.fillStyle = '#d9a066';
    ctx.beginPath();
    ctx.arc(Math.cos(g.angle) * 3, Math.sin(g.angle) * 3, 6, 0, Math.PI * 2);
    ctx.fill();
    // Cap.
    ctx.fillStyle = '#16203a';
    ctx.beginPath();
    ctx.arc(Math.cos(g.angle) * 3, Math.sin(g.angle) * 3 - 2, 6, Math.PI, 0);
    ctx.fill();
    // Torch dot at the cone's origin.
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(Math.cos(g.angle) * 14, Math.sin(g.angle) * 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Name + alert mark.
    ctx.fillStyle = '#cdd3e0';
    ctx.font = '600 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - 20);
    if (g.seeing) {
      ctx.fillStyle = '#ff3b30';
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillText('!', g.x, g.y - 30);
    } else if (g.state === 'investigate') {
      ctx.fillStyle = '#ffd25a';
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText('?', g.x, g.y - 30);
    }
  }

  // The thief: a hooded figure in deep violet, low and quick.
  const t = thief;
  const crouch = t.sneaking ? 2 : 0;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4c2a85';
  ctx.beginPath();
  ctx.arc(0, crouch, 12, 0, Math.PI * 2);
  ctx.fill();
  // Hood point.
  ctx.beginPath();
  ctx.moveTo(Math.cos(t.face) * 12, Math.sin(t.face) * 12 + crouch);
  ctx.lineTo(Math.cos(t.face + 2.4) * 9, Math.sin(t.face + 2.4) * 9 + crouch);
  ctx.lineTo(Math.cos(t.face - 2.4) * 9, Math.sin(t.face - 2.4) * 9 + crouch);
  ctx.closePath();
  ctx.fillStyle = '#5b349e';
  ctx.fill();
  // Masked face.
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath();
  ctx.arc(Math.cos(t.face) * 5, Math.sin(t.face) * 5 + crouch, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(Math.cos(t.face) * 5 - 4, Math.sin(t.face) * 5 + crouch - 1, 8, 3);
  if (t.hasSapphire) {
    ctx.fillStyle = '#37b6ff';
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(16, -2);
    ctx.lineTo(10, 4);
    ctx.lineTo(4, -2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Glass-cutting progress ring.
  if (t.grabbing > 0) {
    ctx.strokeStyle = '#7fd4ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t.grabbing);
    ctx.stroke();
    ctx.fillStyle = '#bfe9ff';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CUTTING GLASS…', t.x, t.y - 26);
  }
}

export function drawVignette(ctx, alarmValue) {
  if (alarmValue < 55) return;
  const a = Math.min(0.45, (alarmValue - 55) / 100);
  const grad = ctx.createRadialGradient(480, 300, 220, 480, 300, 560);
  grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
  grad.addColorStop(1, `rgba(255, 30, 30, ${a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 600);
}
