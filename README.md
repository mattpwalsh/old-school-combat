# Old School Combat

An [Owlbear Rodeo](https://www.owlbear.rodeo/) extension for tracking old-school D&D combat phases.

## Features

- **Declarations** — Players declare intentions (spells, movement) before initiative is rolled. The declaration list is configurable.
- **Initiative** — GM enters rolled values for each party and resolves order.
- **Combat phases** — Morale (monsters only), Movement, Missile, Magic, and Melee are run in initiative order for each party.
- **Persistent banner** — All players see a popover banner showing the current phase throughout the session.
- **Multi-party support** — Add any number of parties beyond the default Players and Monsters.
- **Optional defer rule** — Initiative winners may choose to act after the losers instead of first.

## Combat Flow

```
Begin Combat
    │
    ▼
Declarations  ←─────────────────────────────┐
    │                                        │
    ▼                                        │
Initiative (enter rolls → resolve order)     │
    │                                        │
    ▼                                        │
Winner: [Morale*] → Movement → Missile → Magic → Melee
    │                                        │
    ▼                                        │
Loser:  [Morale*] → Movement → Missile → Magic → Melee
    │                                        │
    └──────────── Next Round ────────────────┘

* Morale is skipped for the Players party
```

## Setup

```bash
npm install
npm run dev
```

Then install the extension in Owlbear Rodeo using the local dev URL (e.g. `https://localhost:5173/manifest.json`). The extension name will display as **Old School Combat (dev)** when running locally.

## Usage

### GM

1. Open the extension panel and set party names (defaults: Players, Monsters).
2. Click **Begin Combat** to start the first round.
3. The **Declarations** screen prompts players to declare their intentions. Click **Next Phase** when done.
4. Enter the rolled initiative values and click **Resolve Initiative**.
5. Optionally enable the defer rule, then click **Begin Combat** to start the phase sequence.
6. Click **Next Phase** to advance through each phase, or **Next Round** at the end to return to Declarations.
7. Click **End Combat** at any time to reset.

### Settings (⚙)

Accessible from any GM screen:

- **Allow initiative winners to defer** — Winners may choose to act after losers.
- **Declarations list** — Configure what players must declare before initiative. Defaults to *Melee Movement* and *Spell Casting*.

### Players

Players see a read-only view of the current phase. During the Declarations phase, the list of required declarations is shown. A persistent banner popover displays the current phase at all times during active combat.

## Development

Built with React, TypeScript, and Vite.

| File | Purpose |
|---|---|
| `public/manifest.json` | OBR extension manifest |
| `src/types.ts` | Core types |
| `src/combat.ts` | Phase logic and state transitions |
| `src/components/GMPanel.tsx` | GM control panel |
| `src/components/PlayerView.tsx` | Player read-only view |
| `src/components/BannerView.tsx` | Persistent phase banner |
