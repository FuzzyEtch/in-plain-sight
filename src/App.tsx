import { useCallback, useEffect, useState } from "react";
import { resolveNightEvents, type NightEvent } from "./game/NightEvents";
import {
  clearGameStateStorage,
  loadGameState,
  saveGameState,
} from "./game/GameStateStorage";
import { setGamePhase, type GameState } from "./game/GameState";
import { DayMenu } from "./pages/DayMenu";
import { MainMenu } from "./pages/MainMenu";
import { NightMenu } from "./pages/NightMenu";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    return loadGameState();
  });

  useEffect(() => {
    if (gameState == null) {
      clearGameStateStorage();
    } else {
      saveGameState(gameState);
    }
  }, [gameState]);

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

  const handleAppendNightEvent = useCallback((event: NightEvent) => {
    setGameState((s) => {
      if (s == null) return s;
      return { ...s, nightEvents: [...s.nightEvents, event] };
    });
  }, []);

  if (gameState != null && gameState.phase === "night") {
    return (
      <NightMenu
        gameState={gameState}
        onComplete={handleNightComplete}
        onAppendNightEvent={handleAppendNightEvent}
      />
    );
  }

  if (gameState != null && gameState.phase === "day") {
    return <DayMenu onContinue={handleDayContinue} />;
  }

  return <MainMenu onGameInitialized={handleGameInitialized} />;
}

export default App;
