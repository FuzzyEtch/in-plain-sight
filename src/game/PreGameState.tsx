import { ALL_ROLES, type Role } from "./Roles";

export type PreGamePlayer = {
  id: string;
  name: string;
};

export type PreGameState = {
  players: PreGamePlayer[];
  roleCounts: Record<Role["id"], number>;
};

export function playerIdFromName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Resolves slug collisions when two names normalize to the same id. */
export function uniquePlayerId(name: string, existingIds: Set<string>): string {
  let base = playerIdFromName(name);
  if (!base) base = "player";
  let id = base;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

export function emptyRoleCounts(): Record<Role["id"], number> {
  return Object.fromEntries(ALL_ROLES.map((r) => [r.id, 0])) as Record<
    Role["id"],
    number
  >;
}

export function createInitialPreGameState(): PreGameState {
  return {
    players: [],
    roleCounts: emptyRoleCounts(),
  };
}

export function addPlayer(state: PreGameState, rawName: string): PreGameState {
  const name = rawName.trim();
  if (!name) return state;
  const existingIds = new Set(state.players.map((p) => p.id));
  const id = uniquePlayerId(name, existingIds);
  return {
    ...state,
    players: [...state.players, { id, name }],
  };
}

export function removePlayer(state: PreGameState, playerId: string): PreGameState {
  return {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
  };
}
