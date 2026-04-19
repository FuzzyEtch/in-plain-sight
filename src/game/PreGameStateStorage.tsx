import { ALL_ROLES } from "./Roles";
import {
  emptyRoleCounts,
  type PreGamePlayer,
  type PreGameState,
} from "./PreGameState";

const STORAGE_KEY = "in-plain-sight.pre-game-state";

function parsePreGameState(data: unknown): PreGameState | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.players)) return null;
  const players: PreGamePlayer[] = [];
  for (const p of o.players) {
    if (!p || typeof p !== "object") return null;
    const row = p as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") return null;
    players.push({ id: row.id, name: row.name });
  }
  const roleCounts = emptyRoleCounts();
  if (o.roleCounts && typeof o.roleCounts === "object" && !Array.isArray(o.roleCounts)) {
    const stored = o.roleCounts as Record<string, unknown>;
    for (const role of ALL_ROLES) {
      const v = stored[role.id];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        roleCounts[role.id] = v;
      }
    }
  }
  return { players, roleCounts };
}

/** Returns `null` if nothing valid is stored or `localStorage` is unavailable. */
export function loadPreGameState(): PreGameState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return null;
    return parsePreGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function savePreGameState(state: PreGameState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota, private mode, or disabled storage
  }
}

export function clearPreGameStateStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
