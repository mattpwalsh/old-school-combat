import { useState } from 'react';
import type { CombatState, Party } from '../types';
import {
  beginCombat,
  resolveInitiative,
  startCombat,
  advancePhase,
  endCombat,
  buildPhaseSequence,
  getPhaseLabel,
  getPhaseGroup,
} from '../combat';

interface Props {
  state: CombatState;
  onUpdate: (state: CombatState) => Promise<void>;
}

interface SubProps extends Props {
  adminBtn: React.ReactNode;
}

export default function GMPanel({ state, onUpdate }: Props) {
  const [showAdmin, setShowAdmin] = useState(false);

  const adminBtn = (
    <button className="btn-icon" onClick={() => setShowAdmin(true)} title="Settings">⚙</button>
  );

  if (showAdmin) {
    return <AdminPanel state={state} onUpdate={onUpdate} onClose={() => setShowAdmin(false)} />;
  }

  if (!state.active) {
    return <PreCombatSetup state={state} onUpdate={onUpdate} adminBtn={adminBtn} />;
  }

  if (state.currentPhase === 'declarations') {
    return <DeclarationsView state={state} onUpdate={onUpdate} adminBtn={adminBtn} />;
  }

  if (state.currentPhase === 'initiative' && state.orderedPartyIds.length === 0) {
    return <InitiativeEntry state={state} onUpdate={onUpdate} adminBtn={adminBtn} />;
  }

  if (state.currentPhase === 'initiative' && state.orderedPartyIds.length > 0) {
    return <InitiativeResult state={state} onUpdate={onUpdate} adminBtn={adminBtn} />;
  }

  return <PhaseControls state={state} onUpdate={onUpdate} adminBtn={adminBtn} />;
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

interface AdminProps extends Props {
  onClose: () => void;
}

function AdminPanel({ state, onUpdate, onClose }: AdminProps) {
  const [allowDefer, setAllowDefer] = useState(state.config.allowDefer);
  const [declarations, setDeclarations] = useState<string[]>(state.config.declarations);

  const addDeclaration = () => setDeclarations(prev => [...prev, '']);

  const updateDeclaration = (i: number, value: string) =>
    setDeclarations(prev => prev.map((d, j) => j === i ? value : d));

  const removeDeclaration = (i: number) =>
    setDeclarations(prev => prev.filter((_, j) => j !== i));

  const handleSave = () => {
    onUpdate({
      ...state,
      config: {
        allowDefer,
        declarations: declarations.filter(d => d.trim() !== ''),
      },
    });
    onClose();
  };

  return (
    <div className="gm-panel">
      <header className="panel-header">
        <h1 className="panel-title">Settings</h1>
      </header>

      <section className="section">
        <h2 className="section-title">Optional Rules</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={allowDefer}
            onChange={e => setAllowDefer(e.target.checked)}
          />
          Allow initiative winners to defer their action
        </label>
      </section>

      <section className="section">
        <h2 className="section-title">Declarations</h2>
        <div className="party-list">
          {declarations.map((item, i) => (
            <div key={i} className="party-row">
              <input
                className="party-name-input"
                value={item}
                onChange={e => updateDeclaration(i, e.target.value)}
                placeholder="Declaration item"
              />
              <button
                className="btn-icon danger"
                onClick={() => removeDeclaration(i)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="btn-text" onClick={addDeclaration}>+ Add Item</button>
      </section>

      <div className="panel-footer">
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

// ─── Pre-Combat Setup ─────────────────────────────────────────────────────────

function PreCombatSetup({ state, onUpdate, adminBtn }: SubProps) {
  const [parties, setParties] = useState<Party[]>(state.parties);

  const updatePartyName = (id: string, name: string) =>
    setParties(prev => prev.map(p => p.id === id ? { ...p, name } : p));

  const addParty = () => {
    const id = `party-${Date.now()}`;
    setParties(prev => [...prev, { id, name: 'New Party', initiative: null }]);
  };

  const removeParty = (id: string) => {
    if (parties.length <= 2) return;
    setParties(prev => prev.filter(p => p.id !== id));
  };

  const handleBegin = () => {
    const updated: CombatState = { ...state, parties };
    onUpdate(beginCombat(updated));
  };

  return (
    <div className="gm-panel">
      <header className="panel-header">
        <h1 className="panel-title">Old School Combat</h1>
        {adminBtn}
      </header>

      <section className="section">
        <h2 className="section-title">Parties</h2>
        <div className="party-list">
          {parties.map(party => (
            <div key={party.id} className="party-row">
              <input
                className="party-name-input"
                value={party.name}
                onChange={e => updatePartyName(party.id, e.target.value)}
                placeholder="Party name"
              />
              <button
                className="btn-icon danger"
                onClick={() => removeParty(party.id)}
                disabled={parties.length <= 2}
                title="Remove party"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="btn-text" onClick={addParty}>+ Add Party</button>
      </section>

      <div className="panel-footer">
        <button className="btn primary full-width" onClick={handleBegin}>
          Begin Combat
        </button>
      </div>
    </div>
  );
}

// ─── Declarations View ────────────────────────────────────────────────────────

function DeclarationsView({ state, onUpdate, adminBtn }: SubProps) {
  const handleNext = () => onUpdate(advancePhase(state));
  const handleEnd  = () => onUpdate(endCombat(state));

  return (
    <div className="gm-panel">
      <header className="panel-header">
        <h1 className="panel-title">Old School Combat</h1>
        <div className="header-right">
          <span className="round-badge">Round {state.round}</span>
          {adminBtn}
        </div>
      </header>

      <div className="current-phase-block">
        <div className="current-phase-label">Declarations</div>
      </div>

      <section className="section">
        <h2 className="section-title">Players Declare</h2>
        <div className="declarations-list">
          {state.config.declarations.map((item, i) => (
            <div key={i} className="declaration-item">
              <span className="declaration-bullet">◆</span>
              {item}
            </div>
          ))}
          {state.config.declarations.length === 0 && (
            <p className="no-declarations">No declarations configured.</p>
          )}
        </div>
      </section>

      <div className="panel-footer">
        <button className="btn danger" onClick={handleEnd}>End Combat</button>
        <button className="btn primary" onClick={handleNext}>Next Phase</button>
      </div>
    </div>
  );
}

// ─── Initiative Entry ─────────────────────────────────────────────────────────

function InitiativeEntry({ state, onUpdate, adminBtn }: SubProps) {
  const [parties, setParties] = useState<Party[]>(state.parties);

  const updatePartyInitiative = (id: string, value: string) => {
    const n = value === '' ? null : parseInt(value, 10);
    setParties(prev => prev.map(p => p.id === id ? { ...p, initiative: n !== null && isNaN(n) ? null : n } : p));
  };

  const canResolve = parties.filter(p => p.initiative !== null).length >= 2;

  const handleResolve = () => {
    const updated: CombatState = { ...state, parties };
    onUpdate(resolveInitiative(updated));
  };

  const handleEnd = () => onUpdate(endCombat(state));

  return (
    <div className="gm-panel">
      <header className="panel-header">
        <h1 className="panel-title">Old School Combat</h1>
        <div className="header-right">
          <span className="round-badge">Round {state.round}</span>
          {adminBtn}
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">Initiative</h2>
        <div className="party-list">
          {parties.map(party => (
            <div key={party.id} className="party-row">
              <span className="party-name-label">{party.name}</span>
              <input
                className="initiative-input"
                type="number"
                min={1}
                value={party.initiative ?? ''}
                onChange={e => updatePartyInitiative(party.id, e.target.value)}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="panel-footer">
        <button className="btn danger" onClick={handleEnd}>End Combat</button>
        <button
          className="btn primary"
          onClick={handleResolve}
          disabled={!canResolve}
        >
          Resolve Initiative
        </button>
      </div>
    </div>
  );
}

// ─── Initiative Result ────────────────────────────────────────────────────────

function InitiativeResult({ state, onUpdate, adminBtn }: SubProps) {
  const { orderedPartyIds, parties } = state;
  const winner = parties.find(p => p.id === orderedPartyIds[0])!;
  const loser  = parties.find(p => p.id === orderedPartyIds[orderedPartyIds.length - 1])!;
  const canDefer = state.config.allowDefer;

  const handleDefer = (deferred: boolean) =>
    onUpdate({ ...state, winnerDeferred: deferred });

  const handleStart  = () => onUpdate(startCombat(state));
  const handleEnd    = () => onUpdate(endCombat(state));

  const handleReroll = () =>
    onUpdate({
      ...state,
      orderedPartyIds: [],
      winnerDeferred: false,
      parties: state.parties.map(p => ({ ...p, initiative: null })),
    });

  return (
    <div className="gm-panel">
      <header className="panel-header">
        <h1 className="panel-title">Old School Combat</h1>
        <div className="header-right">
          <span className="round-badge">Round {state.round}</span>
          {adminBtn}
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">Initiative Result</h2>
        <div className="initiative-result">
          {orderedPartyIds.map((id, i) => {
            const party = parties.find(p => p.id === id)!;
            const isWinner = i === 0;
            const isLoser  = i === orderedPartyIds.length - 1;
            return (
              <div
                key={id}
                className={[
                  'result-row',
                  isWinner ? 'winner' : isLoser ? 'loser' : 'middle',
                ].join(' ')}
              >
                <span className="result-rank">#{i + 1}</span>
                <span className="result-name">{party.name}</span>
                <span className="result-roll">rolled {party.initiative}</span>
                {isWinner && <span className="result-label">WINNER</span>}
                {isLoser  && <span className="result-label">LOSER</span>}
              </div>
            );
          })}
        </div>

        {canDefer && (
          <label className="checkbox-row defer-row">
            <input
              type="checkbox"
              checked={state.winnerDeferred}
              onChange={e => handleDefer(e.target.checked)}
            />
            <strong>{winner.name}</strong>&nbsp;defer — act after {loser.name}
          </label>
        )}
      </section>

      <div className="panel-footer">
        <button className="btn danger" onClick={handleEnd}>End Combat</button>
        <button className="btn secondary" onClick={handleReroll}>Re-Roll</button>
        <button className="btn primary" onClick={handleStart}>Begin Combat</button>
      </div>
    </div>
  );
}

// ─── Phase Controls ───────────────────────────────────────────────────────────

function PhaseControls({ state, onUpdate, adminBtn }: SubProps) {
  const sequence = buildPhaseSequence(state);
  const currentIdx = sequence.indexOf(state.currentPhase);
  const isLastPhase = currentIdx === sequence.length - 1;

  const winner = state.parties.find(p => p.id === state.orderedPartyIds[0]);
  const loser  = state.parties.find(p => p.id === state.orderedPartyIds[state.orderedPartyIds.length - 1]);

  const handleNext = () => onUpdate(advancePhase(state));
  const handleEnd  = () => onUpdate(endCombat(state));

  return (
    <div className="gm-panel">
      <header className="panel-header">
        <h1 className="panel-title">Old School Combat</h1>
        <div className="header-right">
          <span className="round-badge">Round {state.round}</span>
          {adminBtn}
        </div>
      </header>

      <div className="current-phase-block">
        <div className="current-phase-label">{getPhaseLabel(state)}</div>
        <div className="phase-progress">{currentIdx + 1} / {sequence.length}</div>
      </div>

      <section className="section">
        <div className="combatants">
          <span className="combatant winner-tag">⚔ {winner?.name ?? '?'}</span>
          <span className="combatant-vs">vs</span>
          <span className="combatant loser-tag">🛡 {loser?.name ?? '?'}</span>
        </div>
      </section>

      <section className="section phase-sequence-section">
        <h2 className="section-title">Phase Sequence</h2>
        <ol className="phase-list">
          {sequence.map((phase, i) => {
            const group    = getPhaseGroup(state, phase);
            const isCurrent = phase === state.currentPhase;
            const isDone    = i < currentIdx;
            const mock      = { ...state, currentPhase: phase };
            return (
              <li
                key={phase}
                className={[
                  'phase-item',
                  `group-${group}`,
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
      </section>

      <div className="panel-footer">
        <button className="btn danger" onClick={handleEnd}>End Combat</button>
        <button className="btn primary" onClick={handleNext}>
          {isLastPhase ? 'Next Round' : 'Next Phase'}
        </button>
      </div>
    </div>
  );
}
