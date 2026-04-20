import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { NightEvent } from "./NightEvents";
import type { GameState } from "./GameState";
import { type Role } from "./Roles";
import "./NightActions.css";

export type NightActionProps = {
  gameState: GameState;
  actingPlayerId: string;
  onAppendNightEvent: (event: NightEvent) => void;
  /** Advance to the next player (or end the night round). */
  onContinueNightTurn: () => void;
};

/** Renders the night-action UI for a role. */
export type NightActionComponent = (props: NightActionProps) => ReactElement;

function NightActionDefault({
  onContinueNightTurn,
}: NightActionProps): ReactElement {
  return (
    <div className="night-action-default">
      <p className="night-action-default-placeholder">No actions.</p>
      <button
        type="button"
        className="night-menu-btn night-menu-btn-primary"
        onClick={onContinueNightTurn}
      >
        Continue
      </button>
    </div>
  );
}

const KILLER_KILL_PRIORITY = 100;

function NightActionKiller({
  gameState,
  onAppendNightEvent,
  onContinueNightTurn,
}: NightActionProps): ReactElement {
  const groupId = useId();
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const eligibleVictims = useMemo(
    () => gameState.players.filter((p) => p.alive && p.roleId !== "killer"),
    [gameState.players],
  );

  function handleConfirm() {
    if (selectedVictimId == null || submitted) return;
    const victimName = gameState.players.find(
      (p) => p.id === selectedVictimId,
    )?.name;
    onAppendNightEvent({
      priority: KILLER_KILL_PRIORITY,
      target: selectedVictimId,
      key: "alive",
      value: false,
      message: `Player ${victimName} was found dead this moring. ${victimName} cannot speak or vote for the rest of the game.`,
    });
    setSubmitted(true);
  }

  if (eligibleVictims.length === 0) {
    return (
      <div className="night-action-killer">
        <p className="night-action-killer-empty">
          No eligible players to target tonight.
        </p>
        <button
          type="button"
          className="night-menu-btn night-menu-btn-primary"
          onClick={onContinueNightTurn}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="night-action-killer">
      {!submitted ? (
        <fieldset className="night-action-killer-fieldset">
          <legend className="night-action-killer-legend">
            Choose a victim
          </legend>
          <ul className="night-action-killer-list">
            {eligibleVictims.map((p) => (
              <li key={p.id}>
                <label className="night-action-killer-label">
                  <input
                    type="radio"
                    className="night-action-killer-radio"
                    name={groupId}
                    value={p.id}
                    checked={selectedVictimId === p.id}
                    onChange={() => setSelectedVictimId(p.id)}
                  />
                  <span className="night-action-killer-name">{p.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      {!submitted ? (
        <button
          type="button"
          className="night-menu-btn night-menu-btn-primary"
          disabled={selectedVictimId == null}
          onClick={handleConfirm}
        >
          Confirm kill
        </button>
      ) : null}
      {submitted ? (
        <button
          type="button"
          className="night-menu-btn night-menu-btn-primary"
          onClick={onContinueNightTurn}
        >
          Continue
        </button>
      ) : null}
    </div>
  );
}

/**
 * Maps {@link Role.id} values from the roles catalog to night-action components.
 * Missing ids fall back to {@link getNightActionComponent}.
 */
export const NIGHT_ACTION_COMPONENTS: Partial<
  Record<Role["id"], NightActionComponent>
> = {
  killer: NightActionKiller,
};

export function getNightActionComponent(roleId: string): NightActionComponent {
  const resolved = NIGHT_ACTION_COMPONENTS[roleId];
  return resolved ?? NightActionDefault;
}
