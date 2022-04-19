import 'dotenv/config';

import { fetchAllLevelRuns, fetchAllRuns } from './api';
import { RunsParams, Run, RunPlayer, Player, Data } from 'srcom-rest-api';
import { getLeaderboardFromUser } from './user';
import { formatRunsToTable, getSheets, loadDataIntoSheet, Table } from './sheets';

type Time = (number | undefined);
type Date = string;
type PlayerName = string;

async function getRunsFromLeaderboard() {
    const { gameId, levelId, categoryId, variables } = await getLeaderboardFromUser();

    const options: RunsParams = {
        orderby: "submitted",
        status: "verified",
        embed: "players",
        direction: "asc"
    }

    let runs = levelId 
        ? await fetchAllLevelRuns(gameId, categoryId, levelId, options, variables)
        : await fetchAllRuns(gameId, categoryId, options, variables);
    
    return runs;
}

function playersToString (players: RunPlayer[] | Data<Player[]>): string {
    if(!('data' in players)) throw new Error("Name does not exist.");
    
    return players.data.map(player => {
        if('name' in player) return player.name;
        else return player.names.international;
    }).join(", ");
}

function formatRunsToFlourish(runs: Run[], top = -1): Table {
    
    let dates: Date[] = runs.map(run => run.date).filter((d): d is string => !!d);
    dates = dates.filter((v, i) => v && dates.indexOf(v) === i) as Date[];

    let playerRuns: Record<PlayerName, Record<Date, Time>> = {}; 

    /*
    {
        "Skejven": {
            "2019-10-19": 22.99
        },
        "diggity": {
            "2022-02-03": 22.21,
            "2022-04-11": 18.1,
            "2022-04-14": 17.58
        },
        ...
    }
    */
    for(const run of runs) {
        if(run.date === null) continue;

        const n = playersToString(run.players);
        if(!playerRuns[n]) playerRuns[n] = {};
        
        playerRuns[n][run.date] = Math.floor(run.times.primary_t*100/60)/100;
    }

    /*  
    {
        "Skejven": [
            22.99, 22.99, 22.99, 22.99, 22.99, ...
        ],
        "diggity": [
            undefined, 22.21, 22.21, 22.21, ..., 18.1, 17.58
        ],
        ...
    }
     */
    let playerRunData: Record<PlayerName, Time[]> = Object.fromEntries(Object.entries(playerRuns)
        .map(([p, runs]) => {

            let pbs: Time[] = dates.map((date, i) => runs[date]);

            pbs.forEach((pb, i) => {
                // extend times
                if(!pb && i !== 0) pbs[i] = pbs[i-1];
            });

            return [p, pbs];
        }));

    // set times in above structure to undefined it was not in the top x places for the day
    if(top > 0) {
        dates.forEach((date, dateIndex) => {
            /*
            [
                ["Skejven", 22.99],
                ["diggity", 17.58],
                ...
            ]
            */
            let boardOnDay: [PlayerName, Time][] = Object.entries(playerRunData)
                .map(([p, r]): [PlayerName, Time] => {
                    return [p, r[dateIndex]];
                });

            // sort board
            boardOnDay.sort((a, b) => {
                if(!a[1]) return 1;
                if(!b[1]) return -1;

                return a[1] - b[1];
            });

            // set time to undefined for those outside the top x
            boardOnDay.forEach(([player, time], playerPlace) => {
                playerRunData[player][dateIndex] = playerPlace >= top ? undefined : time;
            });
        });
    }

    // filter out empties (players that were never in the top x runs)
    playerRunData = Object.fromEntries(Object.entries(playerRunData)
        .filter(([player, times]) => {
            return times.some(time => time);
        }
    ));

    // format data to table
    return [
        [ "Player", ...dates ],
        ...Object.entries(playerRunData).map(([k, v]) => [k, ...v])
    ]
}

/* Environment checks */
if(process.env.SHEET_ID === undefined) {
    console.log("You must define a SHEET_ID in a .env file in the root of this project.");
    process.exit(1);
}

if(process.env.SHEET_RANGE === undefined || process.env.SHEET_RANGE === "") {
    console.log("You must define a SHEET_RANGE in a .env file in the root of this project.");
    process.exit(1);
}

console.log("Setting up sheets...");
const sheets = await getSheets();

console.log("Getting runs...");
const rawRuns = await getRunsFromLeaderboard();
console.log(`Fetched ${rawRuns.length} runs.`);

console.log("Loading data...");
loadDataIntoSheet(sheets, process.env.SHEET_ID, process.env.SHEET_RANGE, formatRunsToFlourish(rawRuns, 10));
// formatRunsToFlourish(rawRuns);