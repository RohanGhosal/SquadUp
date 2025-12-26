export type GameData = {
    [key: string]: {
        maps: string[];
        modes: string[];
        ranks: string[];
    };
};

export const GAMES: GameData = {
    "Valorant": {
        maps: [
            "Abyss", "Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", "Lotus", "Pearl", "Split", "Sunset"
        ],
        modes: [
            "Unrated", "Competitive", "Swiftplay", "Spike Rush", "Deathmatch", "Escalation", "Team Deathmatch", "Premier"
        ],
        ranks: [
            "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"
        ]
    },
    "Fortnite": {
        maps: [
            "Helios (Battle Royale)", "Zero Build", "Reload", "Lego Fortnite", "Rocket Racing", "Festival"
        ],
        modes: [
            "Battle Royale", "Zero Build", "Reload", "Ranked Battle Royale", "Ranked Zero Build", "Team Rumble", "Creative", "Save the World"
        ],
        ranks: [
            "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Champion", "Unreal"
        ]
    },
    "BGMI": {
        maps: [
            "Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Karakin", "Nusa"
        ],
        modes: [
            "Classic", "Ranked", "Arena (TDM)", "Arena Training", "Domination", "Assault", "Gun Game", "War", "Quick Match", "Sniper Training"
        ],
        ranks: [
            "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Ace Master", "Ace Dominator", "Conqueror"
        ]
    },
    "Free Fire": {
        maps: [
            "Bermuda", "Bermuda Remastered", "Purgatory", "Kalahari", "Alpine", "NeXTerra"
        ],
        modes: [
            "Battle Royale", "Clash Squad", "Lone Wolf", "Bomb Squad", "Team Deathmatch", "Big Head", "Zombie Hunt"
        ],
        ranks: [
            "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grandmaster"
        ]
    }
};

