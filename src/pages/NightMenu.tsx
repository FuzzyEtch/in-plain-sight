import { useEffect, useState } from "react";
import { getNightActionComponent } from "../game/NightActions";
import type { NightEvent, NightVisitContext } from "../game/NightEvents";
import type { GameState, Player } from "../game/GameState";
import { getRoleById, type Team } from "../game/Roles";
import "./NightMenu.css";

export type NightMenuProps = {
  gameState: GameState;
  onComplete: () => void;
  onAppendNightEvents: (events: readonly NightEvent[]) => void;
  onNightVisit: (visit: NightVisitContext, followUpEvent?: NightEvent) => void;
};

type NightStep = "identity1" | "identity2" | "rolePanel";

/** Players matching this are skipped for the night round (extend as rules grow). */
function shouldSkipNightTurn(player: Player): boolean {
  return player.alive === false;
}

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

export function NightMenu({
  gameState,
  onComplete,
  onAppendNightEvents,
  onNightVisit,
}: NightMenuProps) {
  const { players } = gameState;
  const nightTurnPlayers = players.filter((p) => !shouldSkipNightTurn(p));
  const [playerIndex, setPlayerIndex] = useState(0);
  const [step, setStep] = useState<NightStep>("identity1");

  useEffect(() => {
    if (nightTurnPlayers.length === 0) {
      onComplete();
    }
  }, [nightTurnPlayers.length, onComplete]);

  if (nightTurnPlayers.length === 0) {
    return null;
  }

  const player = nightTurnPlayers[playerIndex];
  if (player == null) {
    return null;
  }

  const isLastPlayer = playerIndex >= nightTurnPlayers.length - 1;

  function handleFirstConfirm() {
    setStep("identity2");
  }

  function handleSecondConfirm() {
    setStep("rolePanel");
  }

  function handleRolePanelContinue() {
    if (isLastPlayer) {
      onComplete();
      return;
    }
    setPlayerIndex((i) => i + 1);
    setStep("identity1");
  }

  const role = getRoleById(player.roleId);
  const roleDescription =
    role != null && role.description.trim() !== ""
      ? role.description
      : "No description yet.";
  const NightActionComponent = getNightActionComponent(player.roleId);

  return (
    <section className="night-menu" aria-labelledby="night-menu-title">
      <h1 id="night-menu-title" className="night-menu-heading">
        Night {gameState.nightCounter}
      </h1>
      <p className="night-menu-progress">
        Player {playerIndex + 1} of {nightTurnPlayers.length}
      </p>

      {step === "rolePanel" ? (
        <div className="night-menu-card night-menu-card--role-panel">
          <h2 className="night-menu-panel-name">{player.name}</h2>
          <p className="night-menu-role-team">
            <span className="night-menu-role-title">
              {role?.name ?? player.roleId}
            </span>
            <span className="night-menu-role-sep" aria-hidden="true">
              {" "}
              ·{" "}
            </span>
            <span className="night-menu-team">
              {role != null ? teamLabel(role.type) : "—"}
            </span>
          </p>
          <div className="night-menu-role-desc-block">
            {/* <h3 className="night-menu-subheading">Description</h3> */}
            <p className="night-menu-role-desc">{roleDescription}</p>
          </div>
          <div className="night-menu-info-block">
            <h3 className="night-menu-subheading">Information</h3>
            <p className="night-menu-placeholder-text">To be implemented.</p>
          </div>
          <div className="night-menu-action-block">
            <h3 className="night-menu-subheading">Tonight</h3>
            <div className="night-menu-night-action">
              <NightActionComponent
                gameState={gameState}
                actingPlayerId={player.id}
                onAppendNightEvents={onAppendNightEvents}
                onNightVisit={onNightVisit}
                onContinueNightTurn={handleRolePanelContinue}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="night-menu-card">
          <p className="night-menu-prompt">
            {step === "identity1"
              ? "Confirm you are playing this device as:"
              : "Confirm again to continue."}
          </p>
          <p className="night-menu-name">{player.name}</p>

          {step === "identity1" ? (
            <button
              type="button"
              className="night-menu-btn night-menu-btn-primary"
              onClick={handleFirstConfirm}
            >
              Yes, I'm {player.name}
            </button>
          ) : (
            <button
              type="button"
              className="night-menu-btn night-menu-btn-primary"
              onClick={handleSecondConfirm}
            >
              Confirm and continue
            </button>
          )}
        </div>
      )}
    </section>
  );
}
