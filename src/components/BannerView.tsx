import type { CombatState } from "../types";
import { getPhaseLabel, getPhaseGroup } from "../combat";

interface Props {
  state: CombatState;
}

export default function BannerView({ state }: Props) {
  if (!state.active) return null;

  const group = getPhaseGroup(state, state.currentPhase);
  const isDeclarations = state.currentPhase === "declarations";

  return (
    <div
      className={`banner${isDeclarations ? " banner-declarations" : ""} group-${group}`}
    >
      <div className="banner-header-row">
        <span className="banner-icon"></span>
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
    </div>
  );
}
