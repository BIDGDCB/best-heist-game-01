# best-heist-game-01

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/BIDGDCB/best-heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/BIDGDCB/best-heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Velvet Vault** — a top-down stealth heist game that runs offline in a desktop browser from static files. You are Wren, a thief with three nights to steal three sapphires from a guarded museum gallery. Guards patrol with sweeping yellow vision cones, cameras sweep red cones, and the house alarm climbs whenever you are seen — at 100% you are caught. Hide behind the display cases, slip through the service duct, toss coins to pull guards away, smoke a cone, EMP the cameras, cut the glass (hold E), and reach the green exit.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network requests. `game/` is plain static files; `main.ts` (Node 22) hands the game in by copying `game/` and `screenshots/` to the output directory and writing `dossier.json` with the vendored make.fun library.

## How it plays

- **Move** WASD / arrows · **Sneak** Shift (slower, harder to spot) · **Cut glass** hold E near the sapphire · **Toss a coin** click (nearest guard investigates the clink) · **Smoke** Q · **EMP** F (cameras dark 8s) · **Pause** P · **Mute** M
- Three nights, each a single-screen gallery with more guards, more cameras and tighter patrols. Several routes per room: the open floor, the case-lined lanes, and the sneaking duct along the top wall.
- Score: loot value + time bonus + quiet bonus. The alarm decays while you stay hidden — getting spotted is a setback, not a sentence, until it hits 100.

---

<sub>Entered on [make.fun](https://make.fun/?ref=6s2kbv28&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
