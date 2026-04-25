import {
  type NightEvent,
  type NightVisitContext,
} from "./NightEvents";
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

export type VisitNightReaction = (
  gameState: GameState,
  visit: NightVisitContext,
) => GameState;

export type SimpleNightReaction = (gameState: GameState) => GameState;

const SKIN_WALKER_ROLE_SWAP_PRIORITY = 200;

function createSkinWalkerRoleSwapNightEvents(
  visit: NightVisitContext,
  visitorRoleId: string,
  targetRoleId: string,
): NightEvent[] {
  const pickOneGroup = `${SKIN_WALKER_ROLE_SWAP_PRIORITY.toString()}|${visit.targetId}`;
  const pickOneGroupBundle = visit.visitorId;
  return [
    {
      priority: SKIN_WALKER_ROLE_SWAP_PRIORITY,
      pickOneGroup,
      pickOneGroupBundle,
      target: visit.targetId,
      key: "roleId",
      value: visitorRoleId,
    },
    {
      priority: SKIN_WALKER_ROLE_SWAP_PRIORITY,
      pickOneGroup,
      pickOneGroupBundle,
      target: visit.visitorId,
      key: "roleId",
      value: targetRoleId,
    },
    {
      priority: SKIN_WALKER_ROLE_SWAP_PRIORITY,
      pickOneGroup,
      pickOneGroupBundle,
      target: visit.targetId,
      key: "canUseNightAction",
      value: true,
    },
    {
      priority: SKIN_WALKER_ROLE_SWAP_PRIORITY,
      pickOneGroup,
      pickOneGroupBundle,
      target: visit.visitorId,
      key: "canUseNightAction",
      value: true,
    },
  ];
}

/**
 * `visit-night` reactions keyed by {@link Role.id} (same pattern as night-action
 * components in `NightActions.tsx`). Each handler runs in catalog order; only
 * entries present are invoked. The skin-walker entry queues a swap when the
 * **visit target** is the skin-walker.
 */
export const VISIT_NIGHT_REACTIONS_BY_ROLE: Partial<
  Record<Role["id"], VisitNightReaction>
> = {
  "skin-walker": (gameState, visit) => {
    const target = gameState.players.find((p) => p.id === visit.targetId);
    if (target == null || target.roleId !== "skin-walker") {
      return gameState;
    }
    const visitor = gameState.players.find((p) => p.id === visit.visitorId);
    if (visitor == null) return gameState;
    return {
      ...gameState,
      nightEvents: [
        ...gameState.nightEvents,
        ...createSkinWalkerRoleSwapNightEvents(
          visit,
          visitor.roleId,
          target.roleId,
        ),
      ],
    };
  },
};

/** `conclude-night` reactions (role id → run). */
export const CONCLUDE_NIGHT_REACTIONS_BY_ROLE: Partial<
  Record<Role["id"], SimpleNightReaction>
> = {};

/** `conclude-day` reactions. */
export const CONCLUDE_DAY_REACTIONS_BY_ROLE: Partial<
  Record<Role["id"], SimpleNightReaction>
> = {};

/** `vote-target-day` reactions. */
export const VOTE_TARGET_DAY_REACTIONS_BY_ROLE: Partial<
  Record<Role["id"], SimpleNightReaction>
> = {};

/**
 * Runs every registered role reaction for `trigger`, in {@link ALL_ROLES} order.
 * For {@link ReactionTrigger.VisitNight}, `visit` must be set.
 */
export function runReactionsForTrigger(
  gameState: GameState,
  trigger: ReactionTrigger,
  visit?: NightVisitContext,
): GameState {
  if (trigger === ReactionTrigger.VisitNight) {
    if (visit == null) return gameState;
    return ALL_ROLES.reduce((state, role) => {
      const run = VISIT_NIGHT_REACTIONS_BY_ROLE[role.id];
      if (run == null) return state;
      return run(state, visit);
    }, gameState);
  }
  if (trigger === ReactionTrigger.ConcludeNight) {
    return ALL_ROLES.reduce((state, role) => {
      const run = CONCLUDE_NIGHT_REACTIONS_BY_ROLE[role.id];
      if (run == null) return state;
      return run(state);
    }, gameState);
  }
  if (trigger === ReactionTrigger.ConcludeDay) {
    return ALL_ROLES.reduce((state, role) => {
      const run = CONCLUDE_DAY_REACTIONS_BY_ROLE[role.id];
      if (run == null) return state;
      return run(state);
    }, gameState);
  }
  if (trigger === ReactionTrigger.VoteTargetDay) {
    return ALL_ROLES.reduce((state, role) => {
      const run = VOTE_TARGET_DAY_REACTIONS_BY_ROLE[role.id];
      if (run == null) return state;
      return run(state);
    }, gameState);
  }
  return gameState;
}

/** Runs all `visit-night` reactions for `visit`. */
export function checkVisitNightReactions(
  gameState: GameState,
  visit: NightVisitContext,
): GameState {
  return runReactionsForTrigger(
    gameState,
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
