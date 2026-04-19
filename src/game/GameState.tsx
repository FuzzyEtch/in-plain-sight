import { ALL_ROLES, type Role } from "./Roles";
import type { PreGameState } from "./PreGameState";

export type Player = {
  id: string;
  name: string;
  role: Role;
};

export type GameState = {
  players: Player[];
};

export type InitializeGameStateResult =
  | { ok: true; gameState: GameState }
  | { ok: false; error: string };

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function totalRoleSlots(preGame: PreGameState): number {
  let n = 0;
  for (const r of ALL_ROLES) {
    n += preGame.roleCounts[r.id] ?? 0;
  }
  return n;
}

function buildRolePool(preGame: PreGameState): Role[] {
  const pool: Role[] = [];
  for (const r of ALL_ROLES) {
    const count = preGame.roleCounts[r.id] ?? 0;
    for (let i = 0; i < count; i++) {
      pool.push(r);
    }
  }
  return pool;
}

export function initializeGameState(
  preGameState: PreGameState,
): InitializeGameStateResult {
  const playerCount = preGameState.players.length;
  const roleSlots = totalRoleSlots(preGameState);

  if (roleSlots !== playerCount) {
    return {
      ok: false,
      error: `Players (${playerCount}) must match total roles (${roleSlots}). Adjust role counts or players.`,
    };
  }

  const pool = buildRolePool(preGameState);
  shuffleInPlace(pool);

  const players: Player[] = preGameState.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    role: pool[i]!,
  }));

  return { ok: true, gameState: { players } };
}
