import type { NightEvent, NightEvents } from "./NightEvents";
import { ALL_ROLES, type Role } from "./Roles";
import type { GamePhase, GameState, GlobalState, Player } from "./GameState";

const STORAGE_KEY = "in-plain-sight.game-state";

function parseRole(raw: unknown): Role | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string") return null;
  const catalog = ALL_ROLES.find((r) => r.id === o.id);
  return catalog ?? null;
}

function parsePlayer(raw: unknown): Player | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  if (typeof row.alive !== "boolean") return null;

  let roleId: string | null = null;
  if (typeof row.roleId === "string" && row.roleId.length > 0) {
    const catalog = ALL_ROLES.find((r) => r.id === row.roleId);
    if (catalog) roleId = catalog.id;
  }
  if (roleId == null) {
    const legacy = parseRole(row.role);
    if (legacy) roleId = legacy.id;
  }
  if (roleId == null) return null;
  const canUseNightAction =
    typeof row.canUseNightAction === "boolean"
      ? row.canUseNightAction
      : true;
  return { id: row.id, name: row.name, roleId, alive: row.alive, canUseNightAction };
}

function parseNightEventValue(
  raw: unknown,
): string | number | boolean | null {
  if (typeof raw === "string" || typeof raw === "boolean") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return null;
}

function parseGlobalStateValue(
  raw: unknown,
): string | number | boolean | null {
  if (typeof raw === "string" || typeof raw === "boolean") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return null;
}

function parseGlobalState(raw: unknown): GlobalState {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const global: GlobalState = {};
  for (const [k, v] of Object.entries(o)) {
    const parsed = parseGlobalStateValue(v);
    if (parsed !== null) global[k] = parsed;
  }
  return global;
}

function parseNightEvent(raw: unknown): NightEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.priority !== "number" || !Number.isFinite(o.priority)) return null;
  if (typeof o.target !== "string" || o.target.length === 0) return null;
  if (typeof o.key !== "string") return null;
  const value = parseNightEventValue(o.value);
  if (value === null) return null;
  const event: NightEvent = {
    priority: o.priority,
    target: o.target,
    key: o.key,
    value,
  };
  if (typeof o.message === "string") {
    event.message = o.message;
  }
  return event;
}

function parseNightEventMessages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") out.push(item);
  }
  return out;
}

function parseGameState(data: unknown): GameState | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.phase !== "night" && o.phase !== "day") return null;
  const phase = o.phase as GamePhase;

  if (!Array.isArray(o.players)) return null;
  const players: Player[] = [];
  for (const p of o.players) {
    const player = parsePlayer(p);
    if (!player) return null;
    players.push(player);
  }

  if (!Array.isArray(o.nightEvents)) return null;
  const nightEvents: NightEvents = [];
  for (const e of o.nightEvents) {
    const ev = parseNightEvent(e);
    if (!ev) return null;
    nightEvents.push(ev);
  }

  const global =
    "global" in o ? parseGlobalState(o.global) : ({} as GlobalState);

  const nightEventMessages =
    "nightEventMessages" in o
      ? parseNightEventMessages(o.nightEventMessages)
      : [];

  return { players, global, phase, nightEvents, nightEventMessages };
}

/** Returns `null` if nothing valid is stored or `localStorage` is unavailable. */
export function loadGameState(): GameState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return null;
    return parseGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota, private mode, or disabled storage
  }
}

export function clearGameStateStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
