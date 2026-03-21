import type { CombatState } from '../types';
import { getPhaseLabel, getPhaseGroup, buildPhaseSequence } from '../combat';

interface Props {
  state: CombatState;
}

export default function PlayerView({ state }: Props) {
  if (!state.active) {
    return (
      <div className="player-view idle">
        <div className="idle-icon">⚔</div>
        <p className="idle-text">No combat in progress.</p>
      </div>
    );
  }

  const sequence   = buildPhaseSequence(state);
  const currentIdx = sequence.indexOf(state.currentPhase);
  const group      = getPhaseGroup(state, state.currentPhase);
  const hasOrder   = state.orderedPartyIds.length > 0;
  const winner     = hasOrder ? state.parties.find(p => p.id === state.orderedPartyIds[0]) : undefined;
  const loser      = hasOrder ? state.parties.find(p => p.id === state.orderedPartyIds[state.orderedPartyIds.length - 1]) : undefined;
  const isDeclarations = state.currentPhase === 'declarations';

  return (
    <div className="player-view active">
      <div className={`player-phase-block group-${group}`}>
        <div className="player-phase-label">{getPhaseLabel(state)}</div>
        <div className="player-round">Round {state.round} &nbsp;·&nbsp; Phase {currentIdx + 1}/{sequence.length}</div>
      </div>

      {isDeclarations && state.config.declarations.length > 0 && (
        <div className="declarations-list">
          {state.config.declarations.map((item, i) => (
            <div key={i} className="declaration-item">
              <span className="declaration-bullet">◆</span>
              {item}
            </div>
          ))}
        </div>
      )}

      {!isDeclarations && hasOrder && (
        <div className="player-combatants">
          <span className="combatant winner-tag">⚔ {winner?.name ?? '?'}</span>
          <span className="combatant-vs">vs</span>
          <span className="combatant loser-tag">🛡 {loser?.name ?? '?'}</span>
        </div>
      )}

      <ol className="phase-list player-phase-list">
        {sequence.map((phase, i) => {
          const phaseGroup = getPhaseGroup(state, phase);
          const isCurrent  = phase === state.currentPhase;
          const isDone     = i < currentIdx;
          const mock       = { ...state, currentPhase: phase };
          return (
            <li
              key={phase}
              className={[
                'phase-item',
                `group-${phaseGroup}`,
                isCurrent ? 'current' : '',
                isDone ? 'done' : '',
              ].join(' ')}
            >
              <span className="phase-item-marker">
                {isDone ? '✓' : isCurrent ? '▶' : '·'}
              </span>
              {getPhaseLabel(mock)}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
