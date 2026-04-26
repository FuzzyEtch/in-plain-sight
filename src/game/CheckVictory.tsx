import { getRoleById, type Team } from "./Roles";
import type { GameState, Player } from "./GameState";

function getTeamCount(gameState: GameState, team: Team): number {
  return gameState.players.filter(
    (p) => p.alive && getRoleById(p.roleId)?.type === team,
  ).length;
}

function getEvilWinCapableCount(gameState: GameState): number {
  const corruptorCheck = (p: Player) => {
    if (p.roleId != "corruptor") {
      return true;
    }
    if (gameState.nightCounter === 1 && p.canUseNightAction) {
      return true;
    }
    return false;
  };

  return gameState.players.filter(
    (p: Player) =>
      p.alive && getRoleById(p.roleId)?.type === "evil" && corruptorCheck(p),
  ).length;
}

/** Returns the winning team, or `null` if the game continues. */
export function checkVictory(gameState: GameState): Team | null {
  const evilCount = getEvilWinCapableCount(gameState);
  const nonEvilCount =
    getTeamCount(gameState, "good") + getTeamCount(gameState, "other");

  if (nonEvilCount === 0) {
    return "evil";
  }

  if (evilCount === 0) {
    return "good";
  }

  return null;
}

export function checkAlternativeVictories(_gameState: GameState): string[] {
  return [];
}
