import promptSync from 'prompt-sync';
const prompt = promptSync();

import { fetchAllFullGameCategories, fetchAllLevelCategories, fetchAllLevels } from "./api";

interface LeaderboardInfo {
    gameId: string;
    levelId?: string;
    categoryId: string;
    variables: [string, string][];
}

export function chooseFromList(list: { id: string; name: string; }[], itemName: string) {
    list.forEach((item, i) => {
        console.log(`${i+1}. ${item.name} (${item.id})`);
    });

    const index = Number(prompt(`Choose a(n) ${itemName} from the above list (index): `));
    console.log();
    if(isNaN(index) || index <= 0 || index > list.length) process.exit(1);

    return list[index-1].id;
}

export async function getLeaderboardFromUser(): Promise<LeaderboardInfo> {
    const gameId = prompt("Enter a game id or abbreviation: ");

    const type = prompt("Full-game or level leaderboard? [f/l] ");
    if(type != 'f' && type != 'l') process.exit(1);

    // get level if applicable
    let levelId: string | undefined = undefined;
    if(type == 'l') {
        const levels = (await fetchAllLevels(gameId));

        levelId = chooseFromList(levels, "level");
    }

    // get category
    const categories = (await (levelId ? fetchAllLevelCategories(levelId, { embed: "variables" }) : fetchAllFullGameCategories(gameId, { embed: "variables" })));
    const categoryId = chooseFromList(categories, "category");

    const v = categories.find(c => c.id === categoryId)?.variables?.data || [];
    const variables = v.filter(variable => variable['is-subcategory']).map((variable): [string, string] => {
        console.log(`For variable ${variable.name}:`);
        let valueId = chooseFromList(Object.entries(variable.values.values).map(([id, val]) => ({id, name: val.label})), "value");
        console.log();

        return [ variable.id, valueId ];
    });

    return { gameId, levelId, categoryId, variables };    
}