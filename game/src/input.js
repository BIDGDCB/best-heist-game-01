// input.js — keyboard and mouse, kept in one place so the game loop reads a
// single plain object. WASD or arrows to move, Shift to sneak, E to cut the
// glass (hold), Q for smoke, F for EMP, click to toss a coin, P to pause,
// M to mute, Enter or R to start again.

export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.sneak = false;
    this.grab = false;
    this.clicks = []; // {x, y} canvas coords, consumed by the game loop
    this.pressed = new Set(); // edge-triggered keys, consumed by the game loop
    this.canvas = canvas;
    this.onKey = this.onKey.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onClick = this.onClick.bind(this);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousedown', this.onClick);
  }

  onKey(e) {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    switch (k) {
      case 'w': case 'arrowup': this.up = true; break;
      case 's': case 'arrowdown': this.down = true; break;
      case 'a': case 'arrowleft': this.left = true; break;
      case 'd': case 'arrowright': this.right = true; break;
      case 'shift': this.sneak = true; break;
      case 'e': this.grab = true; break;
      default: this.pressed.add(k); break;
    }
  }

  onKeyUp(e) {
    const k = e.key.toLowerCase();
    switch (k) {
      case 'w': case 'arrowup': this.up = false; break;
      case 's': case 'arrowdown': this.down = false; break;
      case 'a': case 'arrowleft': this.left = false; break;
      case 'd': case 'arrowright': this.right = false; break;
      case 'shift': this.sneak = false; break;
      case 'e': this.grab = false; break;
      default: break;
    }
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.clicks.push({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  }

  consumePress(key) {
    if (this.pressed.has(key)) {
      this.pressed.delete(key);
      return true;
    }
    return false;
  }

  consumeClick() {
    return this.clicks.shift() ?? null;
  }
}
