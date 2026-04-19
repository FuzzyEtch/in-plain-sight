import { useCallback, useState } from "react";
import { setGamePhase, type GameState } from "./game/GameState";
import { DayMenu } from "./pages/DayMenu";
import { MainMenu } from "./pages/MainMenu";
import { NightMenu } from "./pages/NightMenu";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleGameInitialized = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleNightComplete = useCallback(() => {
    setGameState((s) => (s == null ? s : setGamePhase(s, "day")));
  }, []);

  const handleDayContinue = useCallback(() => {
    setGameState((s) => (s == null ? s : setGamePhase(s, "night")));
  }, []);

  if (gameState != null && gameState.phase === "night") {
    return (
      <NightMenu gameState={gameState} onComplete={handleNightComplete} />
    );
  }

  if (gameState != null && gameState.phase === "day") {
    return <DayMenu onContinue={handleDayContinue} />;
  }

  return <MainMenu onGameInitialized={handleGameInitialized} />;
}

export default App;
