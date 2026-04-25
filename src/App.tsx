import { useCallback, useEffect, useState, type ReactNode } from "react";
import { checkVisitNightReactions } from "./game/Reactions";
import {
  resolveNightEvents,
  type NightEvent,
  type NightVisitContext,
} from "./game/NightEvents";
import {
  clearGameStateStorage,
  loadGameState,
  saveGameState,
} from "./game/GameStateStorage";
import { clearPreGameStateStorage } from "./game/PreGameStateStorage";
import { checkVictory } from "./game/CheckVictory";
import { setGamePhase, type GameState } from "./game/GameState";
import { DayMenu } from "./pages/DayMenu";
import { GameEndMenu } from "./pages/GameEndMenu";
import { MainMenu } from "./pages/MainMenu";
import { NightMenu } from "./pages/NightMenu";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    return loadGameState();
  });
  const [mainMenuKey, setMainMenuKey] = useState(0);
  const [restartModalOpen, setRestartModalOpen] = useState(false);

  useEffect(() => {
    if (gameState == null) {
      clearGameStateStorage();
    } else {
      saveGameState(gameState);
    }
  }, [gameState]);

  useEffect(() => {
    if (!restartModalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setRestartModalOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [restartModalOpen]);

  const handleGameInitialized = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleNightComplete = useCallback(() => {
    setGameState((s) => {
      if (s == null) return s;
      const resolved = resolveNightEvents(s);
      return setGamePhase(resolved, "day");
    });
  }, []);

  const handleDayContinue = useCallback(() => {
    setGameState((s) => (s == null ? s : setGamePhase(s, "night")));
  }, []);

  const handleApplyDayElimination = useCallback((playerId: string | null) => {
    setGameState((s) => {
      if (s == null || playerId == null) return s;
      const target = s.players.find((p) => p.id === playerId);
      if (target == null || !target.alive) return s;
      return {
        ...s,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, alive: false } : p,
        ),
      };
    });
  }, []);

  const handleAppendNightEvent = useCallback((event: NightEvent) => {
    setGameState((s) => {
      if (s == null) return s;
      return { ...s, nightEvents: [...s.nightEvents, event] };
    });
  }, []);

  /** Night visit reaction processing plus optional follow-up event in one update. */
  const handleNightVisit = useCallback(
    (visit: NightVisitContext, followUpEvent?: NightEvent) => {
      setGameState((s) => {
        if (s == null) return s;
        let next = checkVisitNightReactions(s, visit);
        if (followUpEvent != null) {
          next = {
            ...next,
            nightEvents: [...next.nightEvents, followUpEvent],
          };
        }
        return next;
      });
    },
    [],
  );

  const handleRestartConfirm = useCallback(() => {
    clearGameStateStorage();
    clearPreGameStateStorage();
    setGameState(null);
    setMainMenuKey((k) => k + 1);
    setRestartModalOpen(false);
  }, []);

  const handleGameEndReturnHome = useCallback(() => {
    clearGameStateStorage();
    setGameState(null);
    setMainMenuKey((k) => k + 1);
  }, []);

  let main: ReactNode;
  if (gameState != null) {
    const victoryTeam = checkVictory(gameState);
    if (victoryTeam != null) {
      main = (
        <GameEndMenu
          winnerTeam={victoryTeam}
          onReturnHome={handleGameEndReturnHome}
        />
      );
    } else if (gameState.phase === "night") {
      main = (
      <NightMenu
        gameState={gameState}
        onComplete={handleNightComplete}
        onAppendNightEvent={handleAppendNightEvent}
        onNightVisit={handleNightVisit}
      />
      );
    } else if (gameState.phase === "day") {
      main = (
        <DayMenu
          onContinue={handleDayContinue}
          nightEventMessages={gameState.nightEventMessages}
          players={gameState.players}
          onApplyElimination={handleApplyDayElimination}
        />
      );
    }
  } else {
    main = (
      <MainMenu key={mainMenuKey} onGameInitialized={handleGameInitialized} />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-main">{main}</div>
      <footer className="app-restart-bar">
        <button
          type="button"
          className="app-restart-btn"
          onClick={() => setRestartModalOpen(true)}
        >
          Restart game
        </button>
      </footer>

      {restartModalOpen ? (
        <div
          className="restart-modal-backdrop"
          role="presentation"
          onClick={() => setRestartModalOpen(false)}
        >
          <div
            className="restart-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restart-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="restart-modal-close"
              aria-label="Close"
              onClick={() => setRestartModalOpen(false)}
            >
              ×
            </button>
            <h2 id="restart-modal-title" className="restart-modal-title">
              Restart game?
            </h2>
            <p className="restart-modal-body">
              All saved game data and setup (players, roles, and progress) will
              be permanently deleted. This cannot be undone.
            </p>
            <div className="restart-modal-actions">
              <button
                type="button"
                className="restart-modal-cancel"
                onClick={() => setRestartModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="restart-modal-confirm"
                onClick={handleRestartConfirm}
              >
                Delete all and return to menu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
