# JIRA BrightSign Player Attachment Downloader

This script can automatically searches for specific JIRA tickets and downloads BrightSign Player zip attachments or
search and download specific BrightSign builds.  If the script is used without arguements, it will search for the latest
approved build.  If the script is used with arguement (ie: 5.1.19), it will search for build containing 5.1.19.

## Features

- Searches JIRA for tickets matching specific criteria:
  - Project: ReflectView 8
  - Issue Type: Build
  - Status: Approved for Use
  - Component: BrightSign Player
- Selects the most recent ticket if multiple results are found
- Downloads attachments that match the pattern "BrightSign Player #.#.##.zip"
- Skips downloading files that already exist locally
- Logs all activities to both console and log file

## Setup

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. Create a configuration file:
   - Copy `jira_config.ini.template` to `jira_config.ini`
   - Edit `jira_config.ini` with your JIRA credentials:
     - JIRA URL
     - Username (email)
     - API token (generate from your Atlassian account)
     - Download directory path

## Getting a JIRA API Token

1. Log in to your Atlassian account
2. Go to Account Settings > Security > Create and manage API tokens
3. Create a new API token and copy it to your configuration file

## Running the Script

```
python jira_attachment_downloader.py
             or 
python jira_attachment_downloader.py 5.1.19
```

## Scheduling the Script

### Windows Task Scheduler

1. Open Task Scheduler
2. Create a new Basic Task
3. Set the trigger (daily, weekly, etc.)
4. Set the action to "Start a program"
5. Program/script: `python`
6. Add arguments: `path\to\jira_attachment_downloader.py`
7. Start in: `path\to\script\directory`

### Linux/Mac (Cron)

Add a cron job:

```
0 9 * * * cd /path/to/script/directory && python3 jira_attachment_downloader.py
```

## Logs

Logs are saved to `jira_downloader.log` in the script directory.