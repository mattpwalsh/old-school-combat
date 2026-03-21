export type PhaseAction = 'morale' | 'movement' | 'missile' | 'magic' | 'melee';

// 'initiative' or 'party-{partyId}-{action}'
export type PhaseId = string;

export interface Party {
  id: string;
  name: string;
  initiative: number | null;
}

export interface CombatConfig {
  allowDefer: boolean;
  declarations: string[];
}

export interface CombatState {
  active: boolean;
  round: number;
  parties: Party[];
  /** Party IDs sorted highest-initiative-first after resolution. */
  orderedPartyIds: string[];
  currentPhase: PhaseId;
  winnerDeferred: boolean;
  config: CombatConfig;
}
