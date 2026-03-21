import type { CombatState, PhaseAction, PhaseId } from './types';

export const METADATA_KEY = 'old-school-combat/state';
export const BANNER_POPOVER_ID = 'old-school-combat-banner';

export const DEFAULT_STATE: CombatState = {
  active: false,
  round: 1,
  parties: [
    { id: 'players', name: 'Players', initiative: null },
    { id: 'monsters', name: 'Monsters', initiative: null },
  ],
  orderedPartyIds: [],
  currentPhase: 'initiative',
  winnerDeferred: false,
  config: {
    allowDefer: false,
    declarations: ['Melee Movement', 'Spell Casting'],
  },
};

const PHASE_ACTIONS: PhaseAction[] = [
  'morale', 'movement', 'missile', 'magic', 'melee',
];

// ─── Phase ID helpers ─────────────────────────────────────────────────────────

export function makePhaseId(partyId: string, action: PhaseAction): PhaseId {
  return `party-${partyId}-${action}`;
}

export function parsePhaseId(phase: PhaseId): { partyId: string; action: PhaseAction } | null {
  if (phase === 'initiative' || phase === 'declarations') return null;
  const match = phase.match(/^party-(.+)-(morale|movement|missile|magic|melee)$/);
  if (!match) return null;
  return { partyId: match[1], action: match[2] as PhaseAction };
}

// ─── Sequence building ────────────────────────────────────────────────────────

export function buildPhaseSequence(state: CombatState): PhaseId[] {
  const ordered = state.winnerDeferred
    ? [...state.orderedPartyIds.slice(1), state.orderedPartyIds[0]]
    : state.orderedPartyIds;

  const sequence: PhaseId[] = ['declarations', 'initiative'];

  for (const partyId of ordered) {
    const party = state.parties.find(p => p.id === partyId);
    if (!party) continue;
    const isPlayers = party.name === 'Players';
    for (const action of PHASE_ACTIONS) {
      if (action === 'morale' && isPlayers) continue;
      sequence.push(makePhaseId(partyId, action));
    }
  }

  return sequence;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function getPhaseLabel(state: CombatState): string {
  if (state.currentPhase === 'declarations') return 'Declarations';
  if (state.currentPhase === 'initiative') return 'Initiative';
  const parsed = parsePhaseId(state.currentPhase);
  if (!parsed) return state.currentPhase;
  const party = state.parties.find(p => p.id === parsed.partyId);
  const name = party?.name ?? 'Unknown';
  const action = parsed.action.charAt(0).toUpperCase() + parsed.action.slice(1);
  return `${name}: ${action}`;
}

/** Returns 'initiative', 'winner', 'middle', or 'loser' for CSS grouping. */
export function getPhaseGroup(
  state: CombatState,
  phase: PhaseId,
): 'initiative' | 'winner' | 'middle' | 'loser' {
  if (phase === 'declarations' || phase === 'initiative') return 'initiative';
  const parsed = parsePhaseId(phase);
  if (!parsed) return 'middle';
  // Use the un-deferred order for group colouring (winner = highest initiative)
  const idx = state.orderedPartyIds.indexOf(parsed.partyId);
  if (idx === 0) return 'winner';
  if (idx === state.orderedPartyIds.length - 1) return 'loser';
  return 'middle';
}

// ─── State transitions ────────────────────────────────────────────────────────

/** Transitions from pre-combat setup to active combat, starting at declarations. */
export function beginCombat(state: CombatState): CombatState {
  return {
    ...state,
    active: true,
    round: 1,
    currentPhase: 'declarations',
    orderedPartyIds: [],
    winnerDeferred: false,
  };
}

/** Sorts parties by initiative and sets orderedPartyIds; stays on initiative phase. */
export function resolveInitiative(state: CombatState): CombatState {
  const sorted = [...state.parties]
    .filter(p => p.initiative !== null)
    .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));

  if (sorted.length < 2) return state;

  return {
    ...state,
    orderedPartyIds: sorted.map(p => p.id),
    winnerDeferred: false,
  };
}

/** Advances from initiative to the first action phase. */
export function startCombat(state: CombatState): CombatState {
  const sequence = buildPhaseSequence(state);
  const initiativeIdx = sequence.indexOf('initiative');
  return {
    ...state,
    active: true,
    currentPhase: sequence[initiativeIdx + 1] ?? makePhaseId(state.orderedPartyIds[0], 'movement'),
  };
}

/** Moves to the next phase; wraps to a new declarations round at the end. */
export function advancePhase(state: CombatState): CombatState {
  const sequence = buildPhaseSequence(state);
  const idx = sequence.indexOf(state.currentPhase);

  if (idx === -1 || idx === sequence.length - 1) {
    return {
      ...state,
      round: state.round + 1,
      currentPhase: 'declarations',
      orderedPartyIds: [],
      winnerDeferred: false,
      parties: state.parties.map(p => ({ ...p, initiative: null })),
    };
  }

  return { ...state, currentPhase: sequence[idx + 1] };
}

export function endCombat(state: CombatState): CombatState {
  return {
    ...DEFAULT_STATE,
    parties: state.parties.map(p => ({ ...p, initiative: null })),
    config: state.config,
  };
}
