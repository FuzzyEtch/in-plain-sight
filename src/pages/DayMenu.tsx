import "./DayMenu.css";

export type DayMenuProps = {
  onContinue: () => void;
  /** Messages collected from resolved night events for the night that just ended. */
  nightEventMessages: string[];
};

export function DayMenu({ onContinue, nightEventMessages }: DayMenuProps) {
  return (
    <section className="day-menu" aria-labelledby="day-menu-title">
      <h1 id="day-menu-title">Day</h1>

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

      <p className="day-menu-coming-soon">Day phase — coming soon.</p>

      <button type="button" className="day-menu-continue" onClick={onContinue}>
        Continue to night
      </button>
    </section>
  );
}
