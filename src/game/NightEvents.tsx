import type { GameState, GlobalState, Player } from "./GameState";

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

/** Visitation during the night: acting player and chosen target. */
export type NightVisitContext = {
  visitorId: string;
  targetId: string;
};

/**
 * Priority for the canonical "visit" record. Kept low so role-specific
 * night actions (higher priority) can override the same target/key if needed.
 */
export const NIGHT_VISIT_EVENT_PRIORITY = 1;

/**
 * A player-targeted event recording that `visitorId` selected `targetId` for
 * a night action. `applyNightEventToPlayer` ignores unknown keys, so this does
 * not change player state until {@link resolveNightEvents}.
 */
export function createNightVisitEvent(visit: NightVisitContext): NightEvent {
  return {
    priority: NIGHT_VISIT_EVENT_PRIORITY,
    target: visit.targetId,
    key: "nightVisitor",
    value: visit.visitorId,
  };
}

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

/**
 * Assumes `events` is already sorted ascending by {@link NightEvent.priority}.
 * For each group of equal priority, keeps one event (chosen with
 * {@link pickRandom}) and discards the rest.
 *
 * Returns a new array, still sorted ascending by priority.
 */
export function dedupNightEvents(events: NightEvents): NightEvents {
  if (events.length === 0) return [];
  const out: NightEvent[] = [];
  let runStart = 0;
  for (let i = 1; i <= events.length; i++) {
    const atEnd = i === events.length;
    const priorityChanged =
      !atEnd && events[i]!.priority !== events[runStart]!.priority;
    if (atEnd || priorityChanged) {
      const run = events.slice(runStart, i);
      out.push(pickRandom(run));
      runStart = i;
    }
  }
  return out;
}

function nightEventSlotKey(event: NightEvent): string {
  return `${event.target}\u0001${event.key}`;
}

/**
 * One pass over `events`: for each distinct `(target, key)` slot, keeps a single
 * event — the one with the **highest** `priority`. If several share that max
 * priority, the **last** occurrence in input order wins.
 *
 * Returns a new list sorted ascending by `priority` (same order as
 * {@link sortNightEvents}), suitable to apply in sequence without redundant
 * writes to the same slot.
 */
export function flattenNightEvents(events: NightEvents): NightEvents {
  const winners = new Map<string, NightEvent>();
  for (const e of events) {
    const slot = nightEventSlotKey(e);
    const prev = winners.get(slot);
    if (prev == null || e.priority >= prev.priority) {
      winners.set(slot, e);
    }
  }
  return sortNightEvents([...winners.values()]);
}

function applyNightEventToPlayer(player: Player, event: NightEvent): Player {
  const { key, value } = event;
  if (key === "alive") {
    return { ...player, alive: Boolean(value) };
  }
  return player;
}

function applyNightEventToGlobal(
  global: GlobalState,
  event: NightEvent,
): GlobalState {
  return { ...global, [event.key]: event.value };
}

function applyNightEventToPlayers(
  players: Player[],
  event: NightEvent,
): Player[] {
  const i = players.findIndex((p) => p.id === event.target);
  if (i === -1) return players;
  const next = players.slice();
  next[i] = applyNightEventToPlayer(next[i]!, event);
  return next;
}

/**
 * Resolves queued night events: sorts, {@link dedupNightEvents} (one random
 * survivor per priority), {@link flattenNightEvents} (one event per
 * `(target, key)` keeping highest priority), then applies the result in ascending
 * priority order. Player targets get `key` → `value` (e.g. `alive`). Global
 * targets merge into {@link GameState.global}. Clears `nightEvents` when done.
 */
export function resolveNightEvents(state: GameState): GameState {
  const sorted = sortNightEvents(state.nightEvents);
  if (sorted.length === 0) {
    return { ...state, nightEvents: [], nightEventMessages: [] };
  }

  const deduped = dedupNightEvents(sorted);
  const flattened = flattenNightEvents(deduped);

  let players = state.players.map((p) => ({ ...p }));
  let global: GlobalState = { ...(state.global ?? {}) };
  let nightEventMessages: string[] = [];

  for (const event of flattened) {
    if (isGlobalGameStateTarget(event.target)) {
      global = applyNightEventToGlobal(global, event);
    } else {
      players = applyNightEventToPlayers(players, event);
    }
    if (event.message != null) {
      nightEventMessages.push(event.message);
    }
  }

  return { ...state, players, global, nightEvents: [], nightEventMessages };
}
