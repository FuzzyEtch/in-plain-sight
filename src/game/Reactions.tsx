import { ALL_ROLES, type Role } from "./Roles";
import type { GameState } from "./GameState";

/** Runtime enum-style map of all reaction triggers. */
export const ReactionTrigger = {
  ConcludeNight: "conclude-night",
  ConcludeDay: "conclude-day",
  VisitNight: "visit-night",
  VoteTargetDay: "vote-target-day",
} as const;

export type ReactionTrigger =
  (typeof ReactionTrigger)[keyof typeof ReactionTrigger];

/**
 * A single effect registered for a role, keyed by {@link Role.id}.
 * Each role may have at most one entry in {@link REACTIONS_BY_ROLE}.
 */
export type Reaction = {
  trigger: ReactionTrigger;
  /** Invoked when this trigger is processed; implement per role. */
  run: (gameState: GameState) => void;
};

/** `roleId` → one {@link Reaction} (if any). */
export const REACTIONS_BY_ROLE: Partial<Record<Role["id"], Reaction>> = {
  // Example (commented):
  // martyr: {
  //   trigger: ReactionTrigger.ConcludeNight,
  //   run: (_state) => {},
  // },
};

/**
 * Runs every registered role reaction whose {@link Reaction.trigger} matches
 * `trigger`, in {@link ALL_ROLES} order.
 */
export function runReactionsForTrigger(
  gameState: GameState,
  trigger: ReactionTrigger,
): void {
  for (const role of ALL_ROLES) {
    const reaction = REACTIONS_BY_ROLE[role.id];
    if (reaction == null) continue;
    if (reaction.trigger !== trigger) continue;
    reaction.run(gameState);
  }
}

/** `conclude-night` reactions. */
export function checkConcludeNightReactions(gameState: GameState): void {
  runReactionsForTrigger(gameState, ReactionTrigger.ConcludeNight);
}

/** `conclude-day` reactions. */
export function checkConcludeDayReactions(gameState: GameState): void {
  runReactionsForTrigger(gameState, ReactionTrigger.ConcludeDay);
}

/** `visit-night` reactions. */
export function checkVisitNightReactions(gameState: GameState): void {
  runReactionsForTrigger(gameState, ReactionTrigger.VisitNight);
}

/** `vote-target-day` reactions. */
export function checkVoteTargetDayReactions(gameState: GameState): void {
  runReactionsForTrigger(gameState, ReactionTrigger.VoteTargetDay);
}
