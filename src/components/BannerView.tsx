import type { CombatState } from "../types";
import { getPhaseLabel, getPhaseGroup } from "../combat";

interface Props {
  state: CombatState;
}

export default function BannerView({ state }: Props) {
  if (!state.active) return null;

  const group = getPhaseGroup(state, state.currentPhase);
  const isDeclarations = state.currentPhase === "declarations";
  const isInitiativeResolved =
    state.currentPhase === "initiative" && state.orderedPartyIds.length > 0;

  return (
    <div className={`banner group-${group}`}>
      <div className="banner-header-row">
        <div className="banner-icon" />
        <div className="banner-content">
          <span className="banner-phase">{getPhaseLabel(state)}</span>
          <span className="banner-round">Round {state.round}</span>
        </div>
      </div>

      {isDeclarations && state.config.declarations.length > 0 && (
        <div className="banner-declarations-list">
          <ul>
            {state.config.declarations.map((item, i) => (
              <li key={i} className="banner-declaration-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isInitiativeResolved && (
        <div className="banner-initiative-results">
          {state.orderedPartyIds.map((id, i) => {
            const party = state.parties.find((p) => p.id === id);
            const isWinner = i === 0;
            const isLoser = i === state.orderedPartyIds.length - 1;
            return (
              <div
                key={id}
                className={`banner-initiative-row ${isWinner ? "winner" : isLoser ? "loser" : ""}`}
              >
                <span className="banner-initiative-rank">#{i + 1}</span>
                <span className="banner-initiative-name">{party?.name}</span>
                <span className="banner-initiative-roll">
                  rolled {party?.initiative}
                </span>
                {isWinner && (
                  <span className="banner-initiative-label">WINNER</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
