export type RoleType = "evil" | "good" | "other";

export type Role = {
  id: string;
  name: string;
  type: RoleType;
  description: string;
};

/** Canonical catalog of every role in the game. Populated later. */
export const ALL_ROLES: Role[] = [
    // Evil roles
    {
        id: "serial-killer",
        name: "Serial Killer",
        type: "evil",
        description: "To Implement",
    },
    // Good roles
    {
        id: "citizen",
        name: "Citizen",
        type: "good",
        description: "To Implement",
    },
    // Other roles
];
