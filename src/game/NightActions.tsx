import type { ReactElement } from "react";
import type { Role } from "./Roles";

/** Renders the night-action UI for a role (no props; parent supplies layout). */
export type NightActionComponent = () => ReactElement;

function NightActionDefault(): ReactElement {
  return <>To be implemented.</>;
}

function NightActionKiller(): ReactElement {
  return <>actively being worked on</>;
}

/**
 * Maps {@link Role.id} values from the roles catalog to night-action components.
 * Missing ids fall back to {@link getNightActionComponent}.
 */
export const NIGHT_ACTION_COMPONENTS: Partial<
  Record<Role["id"], NightActionComponent>
> = {
  killer: NightActionKiller,
};

export function getNightActionComponent(roleId: string): NightActionComponent {
  const resolved = NIGHT_ACTION_COMPONENTS[roleId];
  return resolved ?? NightActionDefault;
}
