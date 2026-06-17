/**
 * JIRA Attachment Downloader for BrightSign Player builds
 * Node.js port of jira_attachment_downloader.py
 * 
 * Searches for specific JIRA tickets and downloads BrightSign Player zip attachments.
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ini = require('ini');
const { pipeline } = require('stream/promises');

class JiraAttachmentDownloader {
  /**
   * @param {string} configFile - Path to jira_config.ini
   * @param {string} [downloadDir] - Override download directory (optional)
   */
  constructor(configFile = 'jira_config.ini', downloadDir = null) {
    this.configFile = configFile;
    this.jiraUrl = null;
    this.jiraUsername = null;
    this.jiraApiToken = null;
    this.downloadDir = downloadDir;
    this.axiosInstance = null;

    this._loadConfig();
    this._createClient();
  }

  _loadConfig() {
    if (!fs.existsSync(this.configFile)) {
      throw new Error(`Config file ${this.configFile} not found.`);
    }

    const config = ini.parse(fs.readFileSync(this.configFile, 'utf-8'));

    this.jiraUrl = config.JIRA.url;
    this.jiraUsername = config.JIRA.username;
    this.jiraApiToken = config.JIRA.api_token;

    if (!this.downloadDir) {
      this.downloadDir = config.Settings?.download_directory || './downloads';
    }

    fs.ensureDirSync(this.downloadDir);
  }

  _createClient() {
    const auth = Buffer.from(`${this.jiraUsername}:${this.jiraApiToken}`).toString('base64');

    this.axiosInstance = axios.create({
      baseURL: this.jiraUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Execute a JQL search and return matching issues.
   * Uses the newer POST /rest/api/3/search/jql endpoint
   * (the old GET /rest/api/3/search was removed by Atlassian — returns 410).
   * @param {string} jql - JQL query string
   * @param {number} maxResults - Max results to return
   * @returns {Promise<Array>} Array of issue objects
   */
  async _searchIssues(jql, maxResults = 20) {
    const response = await this.axiosInstance.post('/rest/api/3/search/jql', {
      jql,
      maxResults,
      fields: ['summary', 'attachment', 'status'],
    });
    return response.data.issues || [];
  }

  /**
   * Search for tickets matching a search argument.
   * Equivalent to Python's search_specific_tickets(argument).
   * @param {string} argument - Search term
   * @returns {Promise<object|null>} The matching JIRA issue or null
   */
  async searchSpecificTickets(argument) {
    const jql = `project = "ReflectView 8" AND issuetype = Build AND text ~ "${argument}" AND component = "BrightSign Player" ORDER BY created DESC`;

    const issues = await this._searchIssues(jql);

    if (!issues.length) {
      return null;
    }

    const pattern = /^BrightSign Player \d+\.\d+\.\d+.*$/;
    for (const issue of issues) {
      if (pattern.test(issue.fields.summary)) {
        return issue;
      }
    }

    return null;
  }

  /**
   * List zip archive attachments for matching tickets.
   * Equivalent to Python's list_issue_archives(argument).
   * @param {string} argument - Search term
   * @returns {Promise<Array<{key: string, filename: string, status: string}>>} Array of archive objects with issue key, filename, and status
   */
  async listIssueArchives(argument) {
    const jql = `project = "RV8" AND type = Build AND status IN ("Approved for Use", Beta) AND component = "BrightSign Player" AND textfields ~ "${argument}" ORDER BY created DESC`;

    const issues = await this._searchIssues(jql);

    if (!issues.length) {
      throw new Error('No matching JIRA tickets found in Approved or Beta status');
    }

    const summaryPattern = /^BrightSign Player \d+\.\d+\.\d+.*$/;
    const zipPattern = /^BrightSign Player .*\.zip$/;
    const results = [];

    for (const issue of issues) {
      if (summaryPattern.test(issue.fields.summary)) {
        const status = issue.fields.status ? issue.fields.status.name : 'Unknown';
        const attachments = issue.fields.attachment || [];
        for (const attachment of attachments) {
          if (zipPattern.test(attachment.filename)) {
            results.push({ key: issue.key, filename: attachment.filename, status });
          }
        }
        // Return after first matching issue (matches Python behavior)
        if (results.length > 0) {
          return results;
        }
      }
    }

    throw new Error(`No ticket (in Approved or Beta status) found for ${argument}`);
  }

  /**
   * Search for approved BrightSign Player build tickets.
   * Equivalent to Python's search_tickets().
   * @returns {Promise<object|null>} The matching JIRA issue or null
   */
  async searchTickets() {
    const jql = `project = "ReflectView 8" AND issuetype = Build AND status IN ("Approved for Use") AND component = "BrightSign Player" ORDER BY created DESC`;

    const issues = await this._searchIssues(jql);

    if (!issues.length) {
      return null;
    }

    const pattern = /^BrightSign Player \d+\.\d+\.\d+.*$/;
    for (const issue of issues) {
      if (pattern.test(issue.fields.summary)) {
        return issue;
      }
    }

    return null;
  }

  /**
   * Download all BrightSign Player zip attachments from an issue.
   * Equivalent to Python's download_attachments(issue).
   * @param {object} issue - JIRA issue object
   * @returns {Promise<{downloaded: number, skipped: number}>}
   */
  async downloadAttachments(issue) {
    if (!issue) {
      return { downloaded: 0, skipped: 0 };
    }

    const attachments = issue.fields.attachment || [];
    if (!attachments.length) {
      console.log(`No attachments found in ticket ${issue.key}`);
      return { downloaded: 0, skipped: 0 };
    }

    const zipPattern = /^BrightSign Player .*\.zip$/;
    let downloaded = 0;
    let skipped = 0;

    for (const attachment of attachments) {
      if (zipPattern.test(attachment.filename)) {
        const filePath = path.join(this.downloadDir, attachment.filename);

        if (fs.existsSync(filePath)) {
          console.log(`File ${attachment.filename} already exists, skipping`);
          skipped++;
          continue;
        }

        console.log(`Downloading ${attachment.filename}...`);
        await this._downloadFile(attachment.content, filePath);
        console.log(`Successfully downloaded ${attachment.filename}`);
        downloaded++;
      }
    }

    return { downloaded, skipped };
  }

  /**
   * Download a specific attachment by issue key and filename.
   * Equivalent to Python's download_specific_attachment(key, filename).
   * @param {string} issueKey - JIRA issue key (e.g. "RV8-1234")
   * @param {string} filename - Exact attachment filename
   * @returns {Promise<string>} Success message
   */
  async downloadSpecificAttachment(issueKey, filename) {
    const jql = `key = "${issueKey}"`;
    const issues = await this._searchIssues(jql, 1);

    if (!issues.length) {
      throw new Error(`No matching JIRA ticket found for ${issueKey}`);
    }

    const issue = issues[0];
    const attachments = issue.fields.attachment || [];

    if (!attachments.length) {
      throw new Error(`No attachments found in ticket ${issue.key}`);
    }

    for (const attachment of attachments) {
      if (attachment.filename === filename) {
        const filePath = path.join(this.downloadDir, attachment.filename);

        if (fs.existsSync(filePath)) {
          console.log(`File ${attachment.filename} already exists, skipping`);
          return `File already exists: ${issueKey}:${filename}`;
        }

        console.log(`Downloading ${attachment.filename}...`);
        await this._downloadFile(attachment.content, filePath);
        return `Successfully downloaded ${issueKey}:${filename}`;
      }
    }

    throw new Error(`Attachment ${filename} not found in ticket ${issueKey}`);
  }

  /**
   * Download a file from a URL to a local path using streaming.
   * @param {string} url - Download URL
   * @param {string} destPath - Destination file path
   */
  async _downloadFile(url, destPath) {
    const response = await this.axiosInstance.get(url, {
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(destPath);

    try {
      await pipeline(response.data, writer);
    } catch (err) {
      // Clean up incomplete file on error
      if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
      }
      throw err;
    }
  }
}

module.exports = JiraAttachmentDownloader;
