# srcom-data-generator
Uses the speedrun.com API to generate data for various graphs and tools.

## Installation

1. Install Node if you don't have it already.
2. Download or clone the repo.
    * **Clone** (preferred) by typing ```git clone https://github.com/mitchell-merry/srcom-data-generator``` in the terminal. This will clone to a new folder under the folder which your terminal is currently in. Note that Git must be installed to do this.
    * **Download** by pressing the green "Code" dropdown above the code and pressing "Download zip". Extract this to a folder on your computer.
3. Open your terminal and `cd` into the root folder for the project, `srcom-data-generator`.
4. Type `npm install`. 

### To use Google Sheets (currently only option):
Note: some details may be wrong as I am not experienced with google's API.
1. Create a .env file inside the project with the following fields:
   * `SHEET_ID`: Contains the ID of the sheet.
   * `SHEET_RANGE`: Contains the subsheet (? page) of the spreadsheet where the data will be dumped.
   * `GOOGLE_APPLICATION_CREDENTIALS=./secrets.json`: where secrets.json is your google sheets API key.
2. Add secrets.json to the root of the project - [Official Documentation](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-console).
   1. Go to the [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) page.
   2. Click `CREATE PROJECT` to make a new project, or use an existing one.
      * Fill out Project name however you wish, and Location can be left alone.
      * You'll need to [enable the Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com?) for your project.
   3. Click the email address of the service account that you want to create a key for.
   4. Go to the `Keys` tab.
   5. Add Key -> Create new key -> JSON -> Create.
   6. It will have saved the .json file to your computer. Copy and paste this into the project file (next to `.env`) and rename it to secrets.json.