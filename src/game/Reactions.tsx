import { createNightVisitEvent, type NightVisitContext } from "./NightEvents";
import { ALL_ROLES, type Role } from "./Roles";
import type { GameState } from "./GameState";

export type { NightVisitContext };

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
 * For `visit-night`, `visit` is set; for other triggers it is `undefined`.
 */
export type Reaction = {
  trigger: ReactionTrigger;
  run: (gameState: GameState, visit?: NightVisitContext) => GameState;
};

/** `roleId` → one {@link Reaction} (if any). */
export const REACTIONS_BY_ROLE: Partial<Record<Role["id"], Reaction>> = {
  // Example (commented):
  // martyr: {
  //   trigger: ReactionTrigger.ConcludeNight,
  //   run: (s) => s,
  // },
};

/**
 * Runs every registered role reaction whose {@link Reaction.trigger} matches
 * `trigger`, in {@link ALL_ROLES} order. Pass `visit` only for
 * {@link ReactionTrigger.VisitNight}.
 */
export function runReactionsForTrigger(
  gameState: GameState,
  trigger: ReactionTrigger,
  visit?: NightVisitContext,
): GameState {
  if (trigger === ReactionTrigger.VisitNight && visit == null) {
    return gameState;
  }
  return ALL_ROLES.reduce((state, role) => {
    const reaction = REACTIONS_BY_ROLE[role.id];
    if (reaction == null) return state;
    if (reaction.trigger !== trigger) return state;
    return reaction.run(
      state,
      trigger === ReactionTrigger.VisitNight ? visit : undefined,
    );
  }, gameState);
}

/**
 * Appends a {@link createNightVisitEvent} for `visit`, then runs all
 * `visit-night` reactions.
 */
export function checkVisitNightReactions(
  gameState: GameState,
  visit: NightVisitContext,
): GameState {
  const withVisit: GameState = {
    ...gameState,
    nightEvents: [...gameState.nightEvents, createNightVisitEvent(visit)],
  };
  return runReactionsForTrigger(
    withVisit,
    ReactionTrigger.VisitNight,
    visit,
  );
}

/** `conclude-night` reactions. */
export function checkConcludeNightReactions(gameState: GameState): GameState {
  return runReactionsForTrigger(
    gameState,
    ReactionTrigger.ConcludeNight,
  );
}

/** `conclude-day` reactions. */
export function checkConcludeDayReactions(gameState: GameState): GameState {
  return runReactionsForTrigger(
    gameState,
    ReactionTrigger.ConcludeDay,
  );
}

/** `vote-target-day` reactions. */
export function checkVoteTargetDayReactions(
  gameState: GameState,
): GameState {
  return runReactionsForTrigger(
    gameState,
    ReactionTrigger.VoteTargetDay,
  );
}
