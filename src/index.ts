import 'dotenv/config';

import { fetchAllLevelRuns, fetchAllRuns } from './api';
import { RunsParams, Run, RunPlayer, Player, Data } from 'srcom-rest-api';
import { getLeaderboardFromUser } from './user';
import { formatRunsToTable, getSheets, loadDataIntoSheet, Table } from './sheets';

type Time = (number | undefined);

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

    let dates: string[] = runs.map(run => run.date).filter((d): d is string => !!d);
    dates = dates.filter((v, i) => v && dates.indexOf(v) === i) as string[];

    let playerRuns: Record<string, Record<string, Time>> = {}; 

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
        "MildGothDaddy": {
            "2022-02-04": 31.88,
            "2022-02-05": 26.73,
            "2022-02-20": 21.55
        },
        "PleasantlyGG": {
            "2022-02-04": 23.88,
            "2022-02-09": 21.19,
            "2022-02-10": 20.74,
            "2022-02-15": 19.35
        },
        "liq": {
            "2022-02-13": 21.22,
            "2022-02-20": 20.08,
            "2022-02-25": 19.26
        },
        "Zomb_Slays": {
            "2022-02-16": 21.65,
            "2022-02-24": 20.7
        }
    }
    */
    for(const run of runs) {
        if(run.date === null) continue;

        const n = playersToString(run.players);
        if(!playerRuns[n]) playerRuns[n] = {};
        
        playerRuns[n][run.date] = Math.floor(run.times.primary_t*100/60)/100;
    }

    let playerRunData: Record<string, Time[]> = Object.fromEntries(Object.entries(playerRuns)
        .map(([p, runs]) => {

            let pbs: Time[] = dates.map((date, i) => runs[date]);

            pbs.forEach((pb, i) => {
                // extend times
                if(!pb && i !== 0) pbs[i] = pbs[i-1];
            });

            return [p, pbs];
        }));

    if(top > 0) {
        dates.forEach((date, i) => {
            let boardOnDay: [string, Time][] = Object.entries(playerRunData)
                .map(([p, r]): [string, Time] => {
                    return [p, r[i]];
                });

            boardOnDay.sort((a, b) => {
                if(!a[1]) return 1;
                if(!b[1]) return -1;

                return a[1] - b[1];
            });

            boardOnDay = boardOnDay.map(([player, time], i) => {
                return [player, i >= top ? undefined : time];
            });

            boardOnDay.forEach(([player, time]) => {
                playerRunData[player][i] = time;
            });
        });
        
        // console.log(JSON.stringify(playerRunData, null, 2));
    }

    // filter out empties
    playerRunData = Object.fromEntries(Object.entries(playerRunData)
        .filter(([player, times]) => {
            return times.some(time => time);
        }
    ));

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