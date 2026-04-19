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
        id: "killer",
        name: "Killer",
        type: "evil",
        description: "Once per night, the serial killer can kill a player.",
    },
    {
        id: "corrupter",
        name: "Corrupter",
        type: "evil",
        description: "On the first night, turn a player into a killer. The killer does not know you are the corrupter.",
    },
    {
        id: "stalker",
        name: "Stalker",
        type: "evil",
        description: "",
    }
    // Good roles
    {
        id: "citizen",
        name: "Citizen",
        type: "good",
        description: "To Implement",
    },
    {
        id: "coroner",
        name: "Coroner",
        type: "good",
        description: "To Implement",
    },
    {
        id: "bitter-bloom",
        name: "Bitter Bloom",
        type: "good",
        description: "Once per game, the bitter bloom can bring back a dead player as a zombie. The zombie can vote, but cannot speak and has no powers at night.",
    },
    {
        id: "powder-keg",
        name: "Powder Keg",
        type: "good",
        description: "Once per game, the powder keg can set a trap. All players that interact with the powder keg that night are killed.",
    },
    {
        id: "witch-doctor",
        name: "Witch Doctor",
        type: "good",
        description: "Once per game, the witch docter can turn ANY player into a citizen.",
    },
    // Other roles
    {
        id: "martyr",
        name: "Martyr",
        type: "other",
        description: "At the end of the game, the martyr wins if they were killed at night.",
    },
    {
        id: "zombie",
        name: "Zombie",
        type: "other",
        description: "To Implement",
    }
];
