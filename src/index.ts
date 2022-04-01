import 'dotenv/config';

import { fetchAllRuns } from './api';
import { RunsParams } from 'srcom-rest-api';
import { getLeaderboardFromUser } from './user';
import { formatRunsToTable, getSheets, loadDataIntoSheet } from './sheets';

async function getRunsFromLeaderboard() {
    const { gameId, levelId, categoryId, variables } = await getLeaderboardFromUser();

    console.log(gameId, levelId, categoryId, variables);

    const options: RunsParams = {
        orderby: "submitted",
        status: "verified",
        embed: "players",
        direction: "asc"
    }

    let runs = await fetchAllRuns(gameId, categoryId, options)
    console.log("INITIAL: " + runs.length);

    runs = runs.filter(run => {
        return !variables.some(([variableId, valueId]) => run.values[variableId] !== valueId);
    });
    
    return runs;
}


/* Environment checks */
if(process.env.SHEET_ID === undefined) {
    console.log("You must define a SHEET_ID in a .env file in the root of this project.");
    process.exit(1);
}

console.log("Setting up sheets...");
const sheets = await getSheets();

console.log("Getting runs...");
const rawRuns = await getRunsFromLeaderboard();
console.log(`Fetched ${rawRuns.length} runs.`);

console.log("Loading data...");
loadDataIntoSheet(sheets, process.env.SHEET_ID, "raw", formatRunsToTable(rawRuns));