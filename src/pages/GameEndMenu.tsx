import type { Team } from "../game/Roles";
import "./GameEndMenu.css";

const WINNER_HEADLINE: Record<Team, string> = {
  evil: "Evil wins",
  good: "Good wins",
  other: "Other wins",
};

export type GameEndMenuProps = {
  winnerTeam: Team;
  /** Clear in-progress game and return to the main menu; pre-game setup is kept. */
  onReturnHome: () => void;
};

export function GameEndMenu({ winnerTeam, onReturnHome }: GameEndMenuProps) {
  return (
    <section className="game-end-menu" aria-labelledby="game-end-menu-title">
      <h1 id="game-end-menu-title" className="game-end-menu-heading">
        Game over
      </h1>
      <p className="game-end-menu-winner">{WINNER_HEADLINE[winnerTeam]}</p>
      <p className="game-end-menu-placeholder">To be implemented.</p>
      <button
        type="button"
        className="game-end-menu-home"
        onClick={onReturnHome}
      >
        Return to home
      </button>
    </section>
  );
}
