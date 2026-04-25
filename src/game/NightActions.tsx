import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { NightEvent, NightVisitContext } from "./NightEvents";
import type { GameState } from "./GameState";
import { getRoleById, type Role, type Team } from "./Roles";
import { KILLER_KILL_PRIORITY } from "./ActionPriorities";
import "./NightActions.css";

function teamLabel(type: Team): string {
  switch (type) {
    case "evil":
      return "Evil";
    case "good":
      return "Good";
    case "other":
      return "Other";
  }
}

export type NightActionProps = {
  gameState: GameState;
  actingPlayerId: string;
  onAppendNightEvent: (event: NightEvent) => void;
  /**
   * Handles a visit and enqueues any resulting reaction events in one update.
   * Optional `followUpEvent` appends after reaction processing (e.g. killer kill).
   */
  onNightVisit: (visit: NightVisitContext, followUpEvent?: NightEvent) => void;
  /** Advance to the next player (or end the night round). */
  onContinueNightTurn: () => void;
};

/** Renders the night-action UI for a role. */
export type NightActionComponent = (props: NightActionProps) => ReactElement;

export type NightActionPlayerOption = { id: string; label: string };

export type NightActionPlayerRadioFormProps = {
  legend: string;
  options: NightActionPlayerOption[];
  submitLabel: string;
  onSubmit: (playerId: string) => void;
};

/** Radio list of players + primary submit (shared by killer, detective, etc.). */
export function NightActionPlayerRadioForm({
  legend,
  options,
  submitLabel,
  onSubmit,
}: NightActionPlayerRadioFormProps): ReactElement {
  const groupId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <fieldset className="night-action-killer-fieldset">
        <legend className="night-action-killer-legend">{legend}</legend>
        <ul className="night-action-killer-list">
          {options.map((opt) => (
            <li key={opt.id}>
              <label className="night-action-killer-label">
                <input
                  type="radio"
                  className="night-action-killer-radio"
                  name={groupId}
                  value={opt.id}
                  checked={selectedId === opt.id}
                  onChange={() => setSelectedId(opt.id)}
                />
                <span className="night-action-killer-name">{opt.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <button
        type="button"
        className="night-menu-btn night-menu-btn-primary"
        disabled={selectedId == null}
        onClick={() => {
          if (selectedId == null) return;
          onSubmit(selectedId);
        }}
      >
        {submitLabel}
      </button>
    </>
  );
}

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

function NightActionKiller({
  gameState,
  actingPlayerId,
  onContinueNightTurn,
  onNightVisit,
}: NightActionProps): ReactElement {
  const [submitted, setSubmitted] = useState(false);

  const eligibleVictims = useMemo(
    () => gameState.players.filter((p) => p.alive && p.roleId !== "killer"),
    [gameState.players],
  );

  const victimOptions = useMemo(
    () => eligibleVictims.map((p) => ({ id: p.id, label: p.name })),
    [eligibleVictims],
  );

  function handleVictimPicked(victimId: string) {
    if (submitted) return;
    const victimName = gameState.players.find((p) => p.id === victimId)?.name;
    onNightVisit(
      { visitorId: actingPlayerId, targetId: victimId },
      {
        priority: KILLER_KILL_PRIORITY,
        pickOneGroup: `${KILLER_KILL_PRIORITY.toString()}`,
        pickOneGroupBundle: `${KILLER_KILL_PRIORITY.toString()}`,
        target: victimId,
        key: "alive",
        value: false,
        message: `Player ${victimName} was found dead this moring. ${victimName} cannot speak or vote for the rest of the game.`,
      },
    );
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
        <NightActionPlayerRadioForm
          legend="Choose a victim"
          options={victimOptions}
          submitLabel="Confirm kill"
          onSubmit={handleVictimPicked}
        />
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

function NightActionDetective({
  gameState,
  actingPlayerId,
  onNightVisit,
  onContinueNightTurn,
}: NightActionProps): ReactElement {
  const [investigatedId, setInvestigatedId] = useState<string | null>(null);

  const eligibleTargets = useMemo(
    () => gameState.players.filter((p) => p.alive && p.id !== actingPlayerId),
    [gameState.players, actingPlayerId],
  );

  const targetOptions = useMemo(
    () => eligibleTargets.map((p) => ({ id: p.id, label: p.name })),
    [eligibleTargets],
  );

  const selectedPlayer = useMemo(
    () =>
      investigatedId == null
        ? null
        : (gameState.players.find((p) => p.id === investigatedId) ?? null),
    [gameState.players, investigatedId],
  );

  const selectedTeamLabel = useMemo(() => {
    if (selectedPlayer == null) return null;
    const role = getRoleById(selectedPlayer.roleId);
    return role != null ? teamLabel(role.type) : "—";
  }, [selectedPlayer]);

  if (eligibleTargets.length === 0) {
    return (
      <div className="night-action-killer">
        <p className="night-action-killer-empty">
          No other players to investigate tonight.
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

  function handleInvestigatePicked(id: string) {
    onNightVisit({ visitorId: actingPlayerId, targetId: id });
    setInvestigatedId(id);
  }

  return (
    <div className="night-action-killer">
      {investigatedId == null ? (
        <NightActionPlayerRadioForm
          legend="Investigate"
          options={targetOptions}
          submitLabel="Submit"
          onSubmit={handleInvestigatePicked}
        />
      ) : null}
      {investigatedId != null && selectedPlayer && selectedTeamLabel != null ? (
        <>
          <p className="night-action-detective-reveal" role="status">
            <span className="night-action-detective-name">
              {selectedPlayer.name}
            </span>{" "}
            is on the{" "}
            <span className="night-action-detective-team">
              {selectedTeamLabel}
            </span>{" "}
            team.
          </p>
          <button
            type="button"
            className="night-menu-btn night-menu-btn-primary"
            onClick={onContinueNightTurn}
          >
            Continue
          </button>
        </>
      ) : null}
    </div>
  );
}

function NightActionCoroner({
  gameState,
  actingPlayerId,
  onNightVisit,
  onContinueNightTurn,
}: NightActionProps): ReactElement {
  const [examinedId, setExaminedId] = useState<string | null>(null);

  const deadPlayers = useMemo(
    () => gameState.players.filter((p) => !p.alive),
    [gameState.players],
  );

  const deadOptions = useMemo(
    () => deadPlayers.map((p) => ({ id: p.id, label: p.name })),
    [deadPlayers],
  );

  const selectedPlayer = useMemo(
    () =>
      examinedId == null
        ? null
        : (gameState.players.find((p) => p.id === examinedId) ?? null),
    [gameState.players, examinedId],
  );

  const revealedRoleName = useMemo(() => {
    if (selectedPlayer == null) return null;
    const role = getRoleById(selectedPlayer.roleId);
    return role != null ? role.name : selectedPlayer.roleId;
  }, [selectedPlayer]);

  if (deadPlayers.length === 0) {
    return (
      <div className="night-action-killer">
        <p className="night-action-killer-empty">
          No dead players to examine tonight.
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

  function handleExaminePicked(id: string) {
    onNightVisit({ visitorId: actingPlayerId, targetId: id });
    setExaminedId(id);
  }

  return (
    <div className="night-action-killer">
      {examinedId == null ? (
        <NightActionPlayerRadioForm
          legend="Examine"
          options={deadOptions}
          submitLabel="Reveal role"
          onSubmit={handleExaminePicked}
        />
      ) : null}
      {examinedId != null && selectedPlayer && revealedRoleName != null ? (
        <>
          <p className="night-action-coroner-reveal" role="status">
            <span className="night-action-coroner-name">
              {selectedPlayer.name}
            </span>{" "}
            was the{" "}
            <span className="night-action-coroner-role">
              {revealedRoleName}
            </span>
            .
          </p>
          <button
            type="button"
            className="night-menu-btn night-menu-btn-primary"
            onClick={onContinueNightTurn}
          >
            Continue
          </button>
        </>
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
  detective: NightActionDetective,
  coroner: NightActionCoroner,
};

export function getNightActionComponent(roleId: string): NightActionComponent {
  const resolved = NIGHT_ACTION_COMPONENTS[roleId];
  return resolved ?? NightActionDefault;
}
