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
  value: string | number;
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
