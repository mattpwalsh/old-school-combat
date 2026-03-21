# Old School Combat

An [Owlbear Rodeo](https://www.owlbear.rodeo/) extension for tracking old-school D&D combat phases. Built with React + TypeScript + Vite.

## What It Does

Guides the GM and players through the classic initiative-based combat sequence:

1. **Initiative** — GM enters rolled values for each party, resolves order
2. **Winner phases** — Morale (skipped for Players), Movement, Missile, Magic, Melee
3. **Loser phases** — Same sub-phases repeated for the losing party
4. Optionally, more parties in between (winner → middle parties → loser)

Combat state is shared in real-time via OBR scene metadata. Players see a persistent banner popover showing the current phase; the GM controls advancement.

## Key Files

| File | Purpose |
|---|---|
| `public/manifest.json` | OBR extension manifest (`action.popover` must be a plain string URL) |
| `public/favicon.svg` | Black-and-white sword-and-shield icon (outline only, transparent fill) |
| `vite.config.ts` | Dev CORS headers + plugin that appends "(dev)" to the manifest name in serve mode |
| `src/types.ts` | Core types: `Party`, `CombatState`, `CombatConfig`, `PhaseId` |
| `src/combat.ts` | All phase logic: building sequences, state transitions, display helpers |
| `src/main.tsx` | OBR entry point; renders `BannerView` when `?view=banner` is in the URL |
| `src/App.tsx` | Role detection, scene metadata subscription, banner popover management |
| `src/components/GMPanel.tsx` | GM control panel (three sub-views: entry, result, phase controls) |
| `src/components/PlayerView.tsx` | Read-only phase display for players |
| `src/components/BannerView.tsx` | Compact banner shown via `OBR.popover.open()` |
| `src/App.css` | Old-school parchment theme with CSS variables |

## Architecture Notes

**Shared state** is stored in OBR scene metadata under the key `old-school-combat/state`. All connected clients subscribe via `OBR.scene.onMetadataChange()`. There is no background script — the banner popover is triggered by the metadata listener in `App.tsx`.

**Phase IDs** are dynamic strings: `'initiative'` or `'party-{partyId}-{action}'`. This supports arbitrary numbers of parties beyond the default Players/Monsters.

**State migration**: When loading stored metadata, always merge with `DEFAULT_STATE` (`{ ...DEFAULT_STATE, ...stored }`) to handle stale state from earlier schema versions.

**Role-based rendering**: `OBR.player.getRole()` determines whether to show `GMPanel` or `PlayerView`. The banner URL (`?view=banner`) bypasses role detection entirely.

## Optional Rules

- **Allow Defer** — When enabled, the initiative winner may choose to act after the loser instead of first. Controlled via `CombatConfig.allowDefer` and `CombatState.winnerDeferred`.

## OBR SDK Gotchas

- `OBR.scene.isReady` is a **method**, not a property — call it as `await OBR.scene.isReady()`
- `action.popover` in the manifest must be a **plain string URL**, not an object
- `OBR.popover.open()` height/width are top-level under `action` in the manifest, not inside `popover`

## Dev vs Prod

In dev mode (`vite serve`), the manifest plugin intercepts `/manifest.json` and appends `" (dev)"` to the extension name so it's distinguishable in OBR's extension list.
