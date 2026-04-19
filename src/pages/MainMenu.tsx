import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  addPlayer,
  createInitialPreGameState,
  removePlayer,
} from "../game/PreGameState";
import {
  loadPreGameState,
  savePreGameState,
} from "../game/PreGameStateStorage";
import { initializeGameState, type GameState } from "../game/GameState";
import { ALL_ROLES, type RoleType } from "../game/Roles";
import "./MainMenu.css";

export type MainMenuProps = {
  onGameInitialized: (gameState: GameState) => void;
};

const ROLE_TYPE_ORDER: RoleType[] = ["evil", "good", "other"];

const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  evil: "Evil",
  good: "Good",
  other: "Other",
};

export function MainMenu({ onGameInitialized }: MainMenuProps) {
  const [preGameState, setPreGameState] = useState(() => {
    return loadPreGameState() ?? createInitialPreGameState();
  });

  useEffect(() => {
    savePreGameState(preGameState);
  }, [preGameState]);

  const [nameInput, setNameInput] = useState("");
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast == null) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (openRoleId == null) return;
    const role = ALL_ROLES.find((r) => r.id === openRoleId);
    if (!role) {
      setOpenRoleId(null);
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenRoleId(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [openRoleId]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPreGameState((s) => addPlayer(s, nameInput));
    setNameInput("");
  }

  function adjustRoleCount(roleId: string, delta: number) {
    setPreGameState((s) => {
      const current = s.roleCounts[roleId] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === current) return s;
      return {
        ...s,
        roleCounts: { ...s.roleCounts, [roleId]: next },
      };
    });
  }

  function openRoleModal(roleId: string) {
    setOpenRoleId((id) => (id === roleId ? null : roleId));
  }

  function handleStartGame() {
    const result = initializeGameState(preGameState);
    if (result.ok === false) {
      setToast(result.error);
      return;
    }
    setToast(null);
    onGameInitialized(result.gameState);
  }

  const openRole =
    openRoleId != null ? ALL_ROLES.find((r) => r.id === openRoleId) : undefined;

  return (
    <>
      <section className="main-menu" aria-labelledby="main-menu-title">
        <h1 id="main-menu-title">In plain sight</h1>
        <div className="main-menu-start">
          <button
            type="button"
            className="start-game-btn"
            onClick={handleStartGame}
          >
            Start game
          </button>
        </div>
        <p className="subtitle">Add players before starting a game.</p>

        <form className="player-form" onSubmit={handleSubmit}>
          <label htmlFor="player-name">Player name</label>
          <input
            id="player-name"
            type="text"
            name="playerName"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name"
            autoComplete="off"
            maxLength={64}
          />
          <button type="submit">Add player</button>
        </form>

        {preGameState.players.length === 0 ? (
          <p className="empty">No players yet.</p>
        ) : (
          <ul className="player-list">
            {preGameState.players.map((p) => (
              <li key={p.id}>
                <span className="name">{p.name}</span>
                <button
                  type="button"
                  className="remove"
                  onClick={() => setPreGameState((s) => removePlayer(s, p.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <section
          className="role-composition"
          aria-labelledby="role-composition-title"
        >
          <h2 id="role-composition-title" className="role-composition-title">
            Roles
          </h2>
          {ROLE_TYPE_ORDER.map((type) => {
            const roles = ALL_ROLES.filter((r) => r.type === type);
            if (roles.length === 0) return null;
            return (
              <div key={type} className="role-type-group">
                <h3 className="role-type-heading">{ROLE_TYPE_LABELS[type]}</h3>
                <ul className="role-list">
                  {roles.map((role) => {
                    const count = preGameState.roleCounts[role.id] ?? 0;
                    const isOpen = openRoleId === role.id;
                    return (
                      <li key={role.id} className="role-row">
                        <button
                          type="button"
                          className="role-name"
                          aria-expanded={isOpen}
                          aria-haspopup="dialog"
                          onClick={() => openRoleModal(role.id)}
                        >
                          {role.name}
                        </button>
                        <div className="role-counter">
                          <button
                            type="button"
                            className="role-counter-btn"
                            disabled={count === 0}
                            onClick={() => adjustRoleCount(role.id, -1)}
                            aria-label={`Decrease ${role.name} count`}
                          >
                            −
                          </button>
                          <span className="role-count" aria-live="polite">
                            {count}
                          </span>
                          <button
                            type="button"
                            className="role-counter-btn"
                            onClick={() => adjustRoleCount(role.id, 1)}
                            aria-label={`Increase ${role.name} count`}
                          >
                            +
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      </section>

      {openRole != null &&
        createPortal(
          <div
            className="role-modal-backdrop"
            role="presentation"
            onClick={() => setOpenRoleId(null)}
          >
            <div
              className="role-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="role-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="role-modal-close"
                aria-label="Close"
                onClick={() => setOpenRoleId(null)}
              >
                ×
              </button>
              <h2 id="role-modal-title" className="role-modal-title">
                {openRole.name}
              </h2>
              <p className="role-modal-body">
                {openRole.description.trim() !== ""
                  ? openRole.description
                  : "No description yet."}
              </p>
            </div>
          </div>,
          document.body,
        )}

      {toast != null ? (
        <div
          className="main-menu-toast"
          role="alert"
          aria-live="assertive"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
