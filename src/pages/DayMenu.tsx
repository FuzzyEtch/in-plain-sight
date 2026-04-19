import "./DayMenu.css";

export type DayMenuProps = {
  onContinue: () => void;
};

/** Placeholder until the day phase is built. */
export function DayMenu({ onContinue }: DayMenuProps) {
  return (
    <section className="day-menu-placeholder" aria-labelledby="day-menu-title">
      <h1 id="day-menu-title">Day</h1>
      <p>Day phase — coming soon.</p>
      <button type="button" onClick={onContinue}>
        Continue to night
      </button>
    </section>
  );
}
