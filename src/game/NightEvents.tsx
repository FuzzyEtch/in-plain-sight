import type { GameState, Player } from "./GameState";

/** Reserved target for events that apply to global game state (not a specific player). */
export const GLOBAL_GAME_STATE_TARGET = "global-game-state" as const;

export type GlobalGameStateTarget = typeof GLOBAL_GAME_STATE_TARGET;

/**
 * Where the event applies: {@link GLOBAL_GAME_STATE_TARGET}, or a player id string.
 */
export type NightEventTarget = GlobalGameStateTarget | string;

export type NightEvent = {
  priority: number;
  target: NightEventTarget;
  key: string;
  value: string | number | boolean;
  message?: string;
};

/** Ordered list of night events (use {@link sortNightEvents} before processing). */
export type NightEvents = NightEvent[];

export function isGlobalGameStateTarget(
  target: string
): target is GlobalGameStateTarget {
  return target === GLOBAL_GAME_STATE_TARGET;
}

/** Returns a new array sorted by ascending `priority` (lowest first). */
export function sortNightEvents(events: NightEvents): NightEvents {
  return [...events].sort((a, b) => a.priority - b.priority);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function applyNightEventToPlayer(player: Player, event: NightEvent): Player {
  const { key, value } = event;
  if (key === "alive") {
    return { ...player, alive: Boolean(value) };
  }
  return player;
}

function applyNightEventToPlayers(
  players: Player[],
  event: NightEvent,
): Player[] {
  if (isGlobalGameStateTarget(event.target)) {
    return players;
  }
  const i = players.findIndex((p) => p.id === event.target);
  if (i === -1) return players;
  const next = players.slice();
  next[i] = applyNightEventToPlayer(next[i]!, event);
  return next;
}

/**
 * Applies queued night events to {@link GameState} in ascending priority order.
 * For each distinct priority, exactly one event is chosen uniformly at random;
 * the rest at that priority are discarded. Player targets get `key` updated to
 * `value` (e.g. `alive`). Global targets are skipped until global state exists.
 * Clears `nightEvents` when done.
 */
export function resolveNightEvents(state: GameState): GameState {
  const sorted = sortNightEvents(state.nightEvents);
  if (sorted.length === 0) {
    return { ...state, nightEvents: [] };
  }

  const byPriority = new Map<number, NightEvent[]>();
  for (const e of sorted) {
    const list = byPriority.get(e.priority) ?? [];
    list.push(e);
    byPriority.set(e.priority, list);
  }

  const priorities = [...byPriority.keys()].sort((a, b) => a - b);
  let players = state.players.map((p) => ({ ...p }));

  for (const pr of priorities) {
    const group = byPriority.get(pr);
    if (group == null || group.length === 0) continue;
    const winner = pickRandom(group);
    players = applyNightEventToPlayers(players, winner);
  }

  return { ...state, players, nightEvents: [] };
}
