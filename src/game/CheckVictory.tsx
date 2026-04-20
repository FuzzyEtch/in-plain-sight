import { getRoleById, type Team } from "./Roles";
import type { GameState } from "./GameState";

function getTeamCount(gameState: GameState, team: Team): number {
  return gameState.players.filter(
    (p) =>
      p.alive && getRoleById(p.roleId)?.type === team,
  ).length;
}

/** Returns the winning team, or `null` if the game continues. */
export function checkVictory(gameState: GameState): Team | null {
  const evilCount = getTeamCount(gameState, "evil");
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
