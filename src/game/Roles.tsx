export type Team = "evil" | "good" | "other";

export type Role = {
  id: string;
  name: string;
  type: Team;
  description: string;
};

/** Canonical catalog of every role in the game. Populated later. */
export const ALL_ROLES: Role[] = [
    // Evil roles
    {
        id: "killer",
        name: "Killer",
        type: "evil",
        description: "Once per night, the killer can kill a non-killer player. If there is more than one killer, each killer will be aware of the other killer's identity. If killers attempt to kill multiple players in the same night, a random victim will be selected.",
    },
    {
        id: "corruptor",
        name: "Corruptor",
        type: "evil",
        description: "Once per game at night, turn a player into a killer, they do not retain any elements from their previous role. The killer does not know you are the corruptor.",
    },
    {
        id: "skin-walker",
        name: "Skin Walker",
        type: "evil",
        description: "Once per night, the skin walker can kill a player. If another player interacts with the skin walker that night, the skin walker will swap roles with that player.",
    },
    // Good roles
    {
        id: "citizen",
        name: "Citizen",
        type: "good",
        description: "A Citizen do not have any special abilities or night actions.",
    },
    {
        id: "detective",
        name: "Detective",
        type: "good",
        description: "Once per night, the detective can reveal which team a player is on.",
    },
    {
        id: "coroner",
        name: "Coroner",
        type: "good",
        description: "Once per night, the coroner can reveal a dead player's role.",
    },
    {
        id: "protector",
        name: "Protector",
        type: "good",
        description: "Once per night, the protector can protect a player from being killed.",
    },
    {
        id: "bitter-bloom",
        name: "Bitter Bloom",
        type: "good",
        description: "Once per game, the bitter bloom can bring back a dead player as a lobotomite. A lobotomite can vote, but cannot speak and has no powers at night.",
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
    {
        id: "lobotomite",
        name: "Lobotomite",
        type: "good",
        description: "A lobotomite can vote, but cannot speak and has no powers at night.",
    },
    // Other roles
    {
        id: "martyr",
        name: "Martyr",
        type: "other",
        description: "At the end of the game, the martyr wins if they were killed at night.",
    },
];

export const ALL_ROLES_LOOKUP = ALL_ROLES.reduce((acc, role) => {
  acc[role.id] = role;
  return acc;
}, {} as Record<string, Role>);

export function getRoleById(roleId: string): Role | undefined {
  return ALL_ROLES_LOOKUP[roleId];
}
