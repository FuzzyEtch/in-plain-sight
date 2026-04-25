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
  pickOneGroup: string;
  pickOneGroupBundle: string;
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

/** Ordered list of night events (use {@link sortNightEvents} before processing). */
export type NightEvents = NightEvent[];

export function isGlobalGameStateTarget(
  target: string,
): target is GlobalGameStateTarget {
  return target === GLOBAL_GAME_STATE_TARGET;
}

/** Returns a new array sorted by ascending `priority` (lowest first). */
export function sortNightEvents(events: NightEvents): NightEvents {
  return [...events].sort((a, b) => a.priority - b.priority);
}

type Bundle = {
  id: string; // `${pickOneGroup}|${pickOneGroupBundle}`
  pickOneGroup: string;
  pickOneGroupBundle: string;
  priority: number;
  events: NightEvent[];
};

type GroupWinner = {
  bundleId: string;
  priority: number;
};

/**
 * Single pass over `events` (`O(n)`):
 * - Non-pick-one events are always kept.
 * - Pick-one events are bucketed by `(pickOneGroup, pickOneGroupBundle)`.
 * - For each `pickOneGroup`, exactly one bundle wins (highest seen priority;
 *   equal priority uses random tie-break), and only that bundle's events remain.
 */
function resolvePickOneBundles(events: NightEvent[]): NightEvent[] {
  const nonPickOne: NightEvent[] = [];
  const bundlesById = new Map<string, Bundle>();
  const winnerByGroup = new Map<string, GroupWinner>();

  for (const e of events) {
    if (!e.pickOneGroup || !e.pickOneGroupBundle) {
      nonPickOne.push(e);
      continue;
    }

    const bundleId = `${e.pickOneGroup}\u0001${e.pickOneGroupBundle}`;
    const existing = bundlesById.get(bundleId);
    if (existing) {
      existing.events.push(e);
      if (e.priority > existing.priority) existing.priority = e.priority;
    } else {
      bundlesById.set(bundleId, {
        id: bundleId,
        pickOneGroup: e.pickOneGroup,
        pickOneGroupBundle: e.pickOneGroupBundle,
        priority: e.priority,
        events: [e],
      });
    }

    const bundle = bundlesById.get(bundleId)!;
    const prevWinner = winnerByGroup.get(e.pickOneGroup);
    if (prevWinner == null || bundle.priority > prevWinner.priority) {
      winnerByGroup.set(e.pickOneGroup, {
        bundleId: bundle.id,
        priority: bundle.priority,
      });
      continue;
    }
    if (
      bundle.priority === prevWinner.priority &&
      bundle.id !== prevWinner.bundleId
    ) {
      if (Math.random() < 0.5) {
        winnerByGroup.set(e.pickOneGroup, {
          bundleId: bundle.id,
          priority: bundle.priority,
        });
      }
    }
  }

  const out = [...nonPickOne];
  for (const winner of winnerByGroup.values()) {
    const bundle = bundlesById.get(winner.bundleId);
    if (bundle != null) {
      out.push(...bundle.events);
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
  if (key === "roleId" && typeof value === "string") {
    return { ...player, roleId: value };
  }
  if (key === "canUseNightAction" && typeof value === "boolean") {
    return { ...player, canUseNightAction: value };
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
 * Resolves queued night events: sorts, {@link resolvePickOneBundles}
 * (one surviving bundle per `pickOneGroup`), {@link flattenNightEvents} (one event per
 * `(target, key)` keeping highest priority), then applies the result in ascending
 * priority order. Player targets get `key` → `value` (e.g. `alive`, `roleId`,
 * `canUseNightAction`). Global targets merge into {@link GameState.global}.
 * Clears `nightEvents` when done.
 */
export function resolveNightEvents(state: GameState): GameState {
  const sorted = sortNightEvents(state.nightEvents);
  if (sorted.length === 0) {
    return { ...state, nightEvents: [], nightEventMessages: [] };
  }

  const bundled = resolvePickOneBundles(sorted);
  const flattened = flattenNightEvents(bundled);

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
