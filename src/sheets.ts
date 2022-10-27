import { google, sheets_v4 } from 'googleapis';
import SRC from 'src-ts';

export type Table = (string | number | undefined | null)[][];

export async function getSheets () {
    const auth = new google.auth.GoogleAuth({ 
        keyFile: "secrets.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    });

    const client = await auth.getClient();
    google.options({auth: client});

    const sheets = google.sheets('v4');

    return sheets;
}

export async function loadDataIntoSheet(sheets: sheets_v4.Sheets, spreadsheetId: string, title: string, table: Table) {
    
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: title
    });

    // add headings
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: title,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: table
        }
    });
}

export function formatRunsToTable(data: SRC.Run<"players">[]): Table {
    if(data.length === 0) return [];

    return [[
        "Date (of submission)", "Time (of submission)", "Player", "Time (minutes)", "Link", "Datetime"
    ], ...data.map(run => {
        const datetime = run.submitted || "N/ATN/AZ";
        const [date, time] = datetime.split("Z")[0].split("T");

        const playerNames = run.players.data.map(p => {
            if('names' in p) return p.names.international;
            else return p.name;
        }).join(',');


        return [
            date, time, playerNames, `${(run.times.primary_t/60)}`, run.weblink, datetime
        ]
    })];
}