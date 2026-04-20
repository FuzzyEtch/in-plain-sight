import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import type { Player } from "../game/GameState";
import "./DayMenu.css";

const DISCUSSION_INITIAL_SECONDS = 2 * 60;
const EXTEND_SECONDS = 60;

/** Per-target vote counts for the current day. */
export type DayVoteTally = Record<string, number>;

/**
 * Returns the player id with strictly the most votes, or `null` if there is a tie
 * or no votes.
 */
export function getEliminationTargetFromVoteTally(
  tally: DayVoteTally,
): string | null {
  const entries = Object.entries(tally);
  if (entries.length === 0) return null;

  let max = -1;
  const leaders: string[] = [];
  for (const [id, count] of entries) {
    if (count > max) {
      max = count;
      leaders.length = 0;
      leaders.push(id);
    } else if (count === max) {
      leaders.push(id);
    }
  }
  if (leaders.length !== 1) return null;
  return leaders[0]!;
}

export type DayMenuProps = {
  onContinue: () => void;
  /** Messages collected from resolved night events for the night that just ended. */
  nightEventMessages: string[];
  players: Player[];
  /** Apply day vote elimination once when resolution runs (`null` = no kill). */
  onApplyElimination: (playerId: string | null) => void;
};

type DayMenuNightSummaryProps = {
  nightEventMessages: string[];
};

function DayMenuNightSummary({ nightEventMessages }: DayMenuNightSummaryProps) {
  return (
    <div
      className="day-menu-night-summary"
      aria-labelledby="day-menu-night-heading"
    >
      <h2 id="day-menu-night-heading" className="day-menu-subheading">
        Last night
      </h2>
      {nightEventMessages.length === 0 ? (
        <p className="day-menu-night-empty">Nothing interesting happened.</p>
      ) : (
        <ul className="day-menu-night-messages" role="list">
          {nightEventMessages.map((msg, i) => (
            <li key={i} className="day-menu-night-message">
              {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Reduces mobile layout jump when radios focus (browser scroll-into-view / zoom). */
function restoreScrollAfterVoteRadioFocus(
  _event: FocusEvent<HTMLInputElement>,
): void {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  const x = window.scrollX;
  const y = window.scrollY;
  requestAnimationFrame(() => {
    window.scrollTo(x, y);
  });
}

type DayMenuDiscussionProps = {
  onDiscussionEnd: () => void;
};

function DayMenuDiscussion({ onDiscussionEnd }: DayMenuDiscussionProps) {
  const [secondsLeft, setSecondsLeft] = useState(DISCUSSION_INITIAL_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft !== 0) return;
    onDiscussionEnd();
  }, [secondsLeft, onDiscussionEnd]);

  function handleExtend() {
    setSecondsLeft((s) => s + EXTEND_SECONDS);
  }

  function handleConcludeEarly() {
    onDiscussionEnd();
  }

  return (
    <div
      className="day-menu-discussion"
      aria-labelledby="day-menu-discussion-heading"
    >
      <h2
        id="day-menu-discussion-heading"
        className="day-menu-subheading day-menu-discussion-heading"
      >
        Discussion
      </h2>

      <div
        className="day-menu-timer"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Time remaining: ${formatCountdown(secondsLeft)}`}
      >
        {formatCountdown(secondsLeft)}
      </div>
      <div className="day-menu-discussion-actions">
        <button
          type="button"
          className="day-menu-btn day-menu-btn-secondary"
          onClick={handleExtend}
        >
          Add 1 minute
        </button>
        <button
          type="button"
          className="day-menu-btn day-menu-btn-secondary"
          onClick={handleConcludeEarly}
        >
          End discussion
        </button>
      </div>
    </div>
  );
}

type VoteStep = "identity1" | "identity2" | "votePanel";

function shouldSkipVoteTurn(player: Player): boolean {
  return player.alive === false;
}

type DayMenuVotingProps = {
  players: Player[];
  onRecordVote: (targetPlayerId: string) => void;
  onVotingComplete: () => void;
};

function DayMenuVoting({
  players,
  onRecordVote,
  onVotingComplete,
}: DayMenuVotingProps) {
  const groupId = useId();
  const voteRadiogroupLabelId = useId();
  const voteTurnPlayers = useMemo(
    () => players.filter((p) => !shouldSkipVoteTurn(p)),
    [players],
  );
  const eligibleVoteTargets = useMemo(
    () => players.filter((p) => p.alive),
    [players],
  );

  const [playerIndex, setPlayerIndex] = useState(0);
  const [step, setStep] = useState<VoteStep>("identity1");
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (voteTurnPlayers.length === 0) {
      onVotingComplete();
    }
  }, [voteTurnPlayers.length, onVotingComplete]);

  if (voteTurnPlayers.length === 0) {
    return null;
  }

  const player = voteTurnPlayers[playerIndex];
  if (player == null) {
    return null;
  }

  const isLastPlayer = playerIndex >= voteTurnPlayers.length - 1;

  function handleFirstConfirm() {
    setStep("identity2");
  }

  function handleSecondConfirm() {
    setStep("votePanel");
  }

  function handleSubmitVote() {
    if (selectedTargetId == null) return;
    onRecordVote(selectedTargetId);
    if (isLastPlayer) {
      onVotingComplete();
      return;
    }
    setPlayerIndex((i) => i + 1);
    setStep("identity1");
    setSelectedTargetId(null);
  }

  return (
    <div className="day-menu-voting" aria-labelledby="day-menu-voting-title">
      <h2
        id="day-menu-voting-title"
        className="day-menu-subheading day-menu-voting-title"
      >
        Vote
      </h2>
      <p className="day-menu-voting-progress">
        Player {playerIndex + 1} of {voteTurnPlayers.length}
      </p>

      {step === "votePanel" ? (
        <div className="day-menu-card day-menu-card--vote">
          <h3 className="day-menu-panel-name">{player.name}</h3>
          <p className="day-menu-vote-prompt">
            Cast your vote for elimination.
          </p>
          {eligibleVoteTargets.length === 0 ? (
            <p className="day-menu-placeholder-text">
              No eligible players to vote for.
            </p>
          ) : (
            <div
              className="day-menu-vote-group"
              role="radiogroup"
              aria-labelledby={voteRadiogroupLabelId}
            >
              <p id={voteRadiogroupLabelId} className="day-menu-vote-legend">
                Vote for
              </p>
              <ul className="day-menu-vote-list" role="list">
                {eligibleVoteTargets.map((p) => (
                  <li key={p.id}>
                    <label className="day-menu-vote-label">
                      <input
                        type="radio"
                        className="day-menu-vote-radio"
                        name={groupId}
                        value={p.id}
                        checked={selectedTargetId === p.id}
                        onChange={() => setSelectedTargetId(p.id)}
                        onFocus={restoreScrollAfterVoteRadioFocus}
                      />
                      <span className="day-menu-vote-name">{p.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="day-menu-vote-footer">
            <button
              type="button"
              className="day-menu-btn day-menu-btn-primary"
              disabled={
                selectedTargetId == null || eligibleVoteTargets.length === 0
              }
              onClick={handleSubmitVote}
            >
              Submit vote
            </button>
          </div>
        </div>
      ) : (
        <div className="day-menu-card">
          <p className="day-menu-prompt">
            {step === "identity1"
              ? "Confirm you are playing this device as:"
              : "Confirm again to continue."}
          </p>
          <p className="day-menu-name">{player.name}</p>

          {step === "identity1" ? (
            <button
              type="button"
              className="day-menu-btn day-menu-btn-primary"
              onClick={handleFirstConfirm}
            >
              Yes, I&apos;m {player.name}
            </button>
          ) : (
            <button
              type="button"
              className="day-menu-btn day-menu-btn-primary"
              onClick={handleSecondConfirm}
            >
              Confirm and continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type DayMenuVotingConclusionProps = {
  /** Who was eliminated by the vote, or that no one was (tie / no votes). */
  conclusionText: string;
};

function DayMenuVotingConclusion({ conclusionText }: DayMenuVotingConclusionProps) {
  return (
    <div className="day-menu-voting-conclusion">
      <p className="day-menu-voting-conclusion-text" role="status">
        {conclusionText}
      </p>
    </div>
  );
}

type DayMenuResolutionProps = {
  onContinue: () => void;
  voteTally: DayVoteTally;
  players: Player[];
  onApplyElimination: (playerId: string | null) => void;
};

function DayMenuResolution({
  onContinue,
  voteTally,
  players,
  onApplyElimination,
}: DayMenuResolutionProps) {
  const resolutionStartedRef = useRef(false);

  const pendingEliminationId = useMemo(
    () => getEliminationTargetFromVoteTally(voteTally),
    [voteTally],
  );

  useLayoutEffect(() => {
    if (resolutionStartedRef.current) return;
    resolutionStartedRef.current = true;

    let effectiveEliminationId: string | null = pendingEliminationId;

    // -------------------------------------------------------------------------
    // Day-phase role powers (not implemented): e.g. protection, redirect, or
    // judge abilities. Use `pendingEliminationId` (nil when vote tie / no votes)
    // and game state to decide whether to clear `effectiveEliminationId` before
    // applying death below.
    // -------------------------------------------------------------------------

    onApplyElimination(effectiveEliminationId);
  }, [pendingEliminationId, onApplyElimination]);

  const outcomeLine = useMemo(() => {
    if (pendingEliminationId == null) {
      return "No one is eliminated (tie or no votes).";
    }
    const name =
      players.find((p) => p.id === pendingEliminationId)?.name ??
      pendingEliminationId;
    return `${name} is eliminated.`;
  }, [pendingEliminationId, players]);

  return (
    <div
      className="day-menu-resolution"
      aria-labelledby="day-menu-resolution-heading"
    >
      <h2
        id="day-menu-resolution-heading"
        className="day-menu-subheading day-menu-resolution-heading"
      >
        Day resolution
      </h2>
      <DayMenuVotingConclusion conclusionText={outcomeLine} />
      <button type="button" className="day-menu-continue" onClick={onContinue}>
        Continue to night
      </button>
    </div>
  );
}

type DayPhase = "discussion" | "voting" | "resolution";

export function DayMenu({
  onContinue,
  nightEventMessages,
  players,
  onApplyElimination,
}: DayMenuProps) {
  const [dayPhase, setDayPhase] = useState<DayPhase>("discussion");
  const [voteTally, setVoteTally] = useState<DayVoteTally>({});

  const handleDiscussionEnd = useCallback(() => {
    setVoteTally({});
    setDayPhase("voting");
  }, []);

  const recordVote = useCallback((targetPlayerId: string) => {
    setVoteTally((prev) => ({
      ...prev,
      [targetPlayerId]: (prev[targetPlayerId] ?? 0) + 1,
    }));
  }, []);

  const handleVotingComplete = useCallback(() => {
    setDayPhase("resolution");
  }, []);

  const showNightSummary = dayPhase === "discussion" || dayPhase === "voting";

  return (
    <section className="day-menu" aria-labelledby="day-menu-title">
      <h1 id="day-menu-title">Day</h1>

      {showNightSummary ? (
        <DayMenuNightSummary nightEventMessages={nightEventMessages} />
      ) : null}

      {dayPhase === "discussion" ? (
        <DayMenuDiscussion onDiscussionEnd={handleDiscussionEnd} />
      ) : null}
      {dayPhase === "voting" ? (
        <DayMenuVoting
          players={players}
          onRecordVote={recordVote}
          onVotingComplete={handleVotingComplete}
        />
      ) : null}
      {dayPhase === "resolution" ? (
        <DayMenuResolution
          onContinue={onContinue}
          voteTally={voteTally}
          players={players}
          onApplyElimination={onApplyElimination}
        />
      ) : null}
    </section>
  );
}
