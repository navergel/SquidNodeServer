# SquidNodeServer

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create your JIRA config from the template and fill in the values:

   ```
   cp jira_config.example.ini jira_config.ini
   ```

   Edit `jira_config.ini` and set your JIRA `url`, `username`, and `api_token`.
   Generate an API token at https://id.atlassian.com/manage-profile/security/api-tokens.

   `jira_config.ini` is git-ignored, so your credentials are never committed.

## Running

Open a bash window within the project and run:

```
npm start
```

Then open http://localhost:3000 in your web browser.
