// server.js - Optional Express backend for Production mode
// Only needed if you want to connect to real Jira API
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const fssync = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files (the HTML app)
// In production, serve built files from dist/, otherwise serve from root for development compatibility
const staticPath = fssync.existsSync(path.join(__dirname, 'dist')) ? 'dist' : '.';
app.use(express.static(staticPath));
console.log(`📂 Serving static files from: ${staticPath}`);

// Data persistence paths
const DATA_DIR = path.join(__dirname, 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const HISTORICAL_FILE = path.join(DATA_DIR, 'historical.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }
};

// Enhanced data persistence with additive updates and data preservation
const loadSavedData = async (filename, defaultValue = null) => {
  try {
    const data = await fs.readFile(filename, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`Loaded existing data from ${filename}: ${parsed.tickets?.length || parsed.totalTickets || 'unknown count'} records, last updated ${parsed.fetchedAt}`);
    return parsed;
  } catch (error) {
    console.log(`No saved data found at ${filename}, will create new file`);
    return defaultValue;
  }
};

// Smart save that preserves existing data and only updates if newer
const saveDataSmart = async (filename, newData, dataType = 'tickets') => {
  try {
    await ensureDataDir();
    
    // Load existing data first
    const existingData = await loadSavedData(filename);
    
    if (existingData) {
      const existingDate = new Date(existingData.fetchedAt);
      const newDate = new Date(newData.fetchedAt);
      
      console.log(`Comparing dates for ${filename}:`);
      console.log(`  Existing: ${existingDate.toISOString()}`);
      console.log(`  New:      ${newDate.toISOString()}`);
      
      // Only save if new data is more recent
      if (newDate <= existingDate) {
        console.log(`Skipping save to ${filename} - existing data is newer or same age`);
        return { saved: false, reason: 'existing_data_newer', existingDate, newDate };
      }
      
      // Merge historical data if applicable
      if (dataType === 'tickets' && existingData.tickets && newData.tickets) {
        // Create a map of existing tickets by key for quick lookup
        const existingTicketsMap = new Map();
        existingData.tickets.forEach(ticket => {
          existingTicketsMap.set(ticket.key, ticket);
        });
        
        // Add new tickets and update existing ones
        const mergedTickets = [...newData.tickets];
        existingData.tickets.forEach(existingTicket => {
          if (!mergedTickets.find(t => t.key === existingTicket.key)) {
            // Add historical ticket that's not in new data
            mergedTickets.push({
              ...existingTicket,
              historical: true,
              lastSeen: existingData.fetchedAt
            });
          }
        });
        
        console.log(`Merged ticket data: ${newData.tickets.length} new + ${existingData.tickets.length} existing = ${mergedTickets.length} total`);
        
        // Update the data with merged tickets
        newData = {
          ...newData,
          tickets: mergedTickets,
          mergedInfo: {
            newTickets: newData.tickets.length,
            existingTickets: existingData.tickets.length,
            totalMerged: mergedTickets.length,
            mergedAt: new Date().toISOString()
          }
        };
      }
    }
    
    // Save the new (possibly merged) data
    await fs.writeFile(filename, JSON.stringify(newData, null, 2));
    console.log(`Data saved to ${filename} at ${newData.fetchedAt}`);
    return { saved: true, reason: 'updated', data: newData };
    
  } catch (error) {
    console.error(`Error saving data to ${filename}:`, error);
    return { saved: false, reason: 'error', error: error.message };
  }
};

// Save configuration (API key, settings, etc.)
const saveConfig = async (config) => {
  try {
    const existingConfig = await loadSavedData(CONFIG_FILE, {});
    
    // Merge with existing config, preserving any additional settings
    const mergedConfig = {
      ...existingConfig,
      ...config,
      lastUpdated: new Date().toISOString()
    };
    
    // Don't log the full config to avoid exposing API token in logs
    console.log(`Saving config: ${Object.keys(config).join(', ')}`);
    
    await fs.writeFile(CONFIG_FILE, JSON.stringify(mergedConfig, null, 2));
    return { saved: true, config: mergedConfig };
  } catch (error) {
    console.error('Error saving config:', error);
    return { saved: false, error: error.message };
  }
};

// Load configuration on startup
const loadConfig = async () => {
  const config = await loadSavedData(CONFIG_FILE, {});
  if (config && config.baseUrl) {
    console.log(`Loaded saved config: ${config.baseUrl}, ${config.email}, project: ${config.project}`);
  }
  return config;
};

// Initialize data directory and load config on startup
let savedConfig = {};
ensureDataDir().then(async () => {
  console.log('Data persistence initialized');
  savedConfig = await loadConfig();
});

// Helper function to create Jira API client
const createJiraClient = (config) => {
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  
  return axios.create({
    baseURL: `${config.baseUrl}/rest/api/3`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 second timeout
  });
};

// Helper functions
const getPriorityLevel = (issue) => {
  return issue.fields.customfield_11129 || null;
};

const categorizePriority = (priorityLevel) => {
  if (priorityLevel === null || priorityLevel === undefined) return 'unknown';
  if (priorityLevel < 10) return 'high';
  if (priorityLevel < 100) return 'medium';
  return 'low';
};

const calculateAge = (createdDate) => {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const extractSourceLabels = (labels) => {
  return labels?.filter(label => label.startsWith('src-')) || [];
};

// Helper function to extract history transitions from changelog
// Calculate incoming/outgoing flags based on priority level transitions
const calculatePriorityFlags = (priorityLevelTransitions, currentPriorityLevel, createdDate, ticketKey = 'Unknown') => {
  const flags = {
    incomingDate: null,
    outgoingDate: null,
    isIncoming: false,
    isOutgoing: false
  };

  console.log(`Calculating PL flags for ${ticketKey}: currentPL=${currentPriorityLevel}, transitions=${priorityLevelTransitions?.length || 0}`);

  if (priorityLevelTransitions && priorityLevelTransitions.length > 0) {
    // Sort transitions by timestamp to ensure correct order
    const sortedTransitions = [...priorityLevelTransitions].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Log all transitions for debugging
    console.log(`  Transitions for ${ticketKey}:`);
    sortedTransitions.forEach((t, i) => {
      console.log(`    ${i + 1}. ${t.timestamp}: ${t.fromValue} → ${t.toValue}`);
    });

    // INCOMING: First time PL gets assigned a value (transition TO a number)
    const firstPLAssignment = sortedTransitions.find(transition => 
      (transition.fromValue === null || transition.fromValue === undefined) && 
      transition.toValue !== null && transition.toValue !== undefined
    );
    
    if (firstPLAssignment) {
      flags.incomingDate = firstPLAssignment.timestamp;
      flags.isIncoming = true;
      console.log(`  → Incoming: ${firstPLAssignment.timestamp} (PL assigned: ${firstPLAssignment.toValue})`);
    } else if (sortedTransitions.length > 0 && sortedTransitions[0].fromValue !== null) {
      // If first transition is not from null, ticket was created with PL
      flags.incomingDate = createdDate;
      flags.isIncoming = true;
      console.log(`  → Incoming: ${createdDate} (created with PL, first transition from ${sortedTransitions[0].fromValue})`);
    }

    // OUTGOING: PL goes to null (completed/cleared) OR goes over 99 (deprioritized)
    const outgoingTransition = sortedTransitions.find(transition => {
      // Case 1: PL cleared (becomes null) - ticket completed
      if (transition.toValue === null || transition.toValue === undefined) {
        return true;
      }
      // Case 2: PL goes over 99 (deprioritized)
      if (transition.toValue > 99 && 
          (transition.fromValue === null || transition.fromValue === undefined || transition.fromValue <= 99)) {
        return true;
      }
      return false;
    });
    
    if (outgoingTransition) {
      flags.outgoingDate = outgoingTransition.timestamp;
      flags.isOutgoing = true;
      const reason = outgoingTransition.toValue === null ? 'PL cleared' : `PL set to ${outgoingTransition.toValue}`;
      console.log(`  → Outgoing: ${outgoingTransition.timestamp} (${reason})`);
    }
  } else if (currentPriorityLevel !== null && currentPriorityLevel !== undefined) {
    // No transitions but ticket has PL - assume it was set at creation
    flags.incomingDate = createdDate;
    flags.isIncoming = true;
    console.log(`  → Incoming: ${createdDate} (no transitions, PL=${currentPriorityLevel})`);
    
    // If current PL is > 99, also flag as outgoing at creation
    if (currentPriorityLevel > 99) {
      flags.outgoingDate = createdDate;
      flags.isOutgoing = true;
      console.log(`  → Outgoing: ${createdDate} (created with PL > 99: ${currentPriorityLevel})`);
    }
  } else {
    console.log(`  → No PL flags: no transitions and no current PL`);
  }

  return flags;
};

const extractTransitionHistory = (changelog) => {
  if (!changelog || !changelog.histories) {
    return {
      statusTransitions: [],
      priorityLevelTransitions: [],
      labelTransitions: []
    };
  }

  const statusTransitions = [];
  const priorityLevelTransitions = [];
  const labelTransitions = [];

  changelog.histories.forEach(history => {
    const timestamp = history.created;
    const author = history.author;

    history.items.forEach(item => {
      if (item.field === 'status') {
        statusTransitions.push({
          timestamp,
          author: author?.displayName || author?.name || 'Unknown',
          fromValue: item.fromString || null,
          toValue: item.toString || null,
          fromId: item.from || null,
          toId: item.to || null
        });
      }
      
      if (item.field === 'customfield_11129' || item.field === 'Priority Level') { // Priority Level field
        priorityLevelTransitions.push({
          timestamp,
          author: author?.displayName || author?.name || 'Unknown',
          fromValue: item.fromString ? parseInt(item.fromString) : null,
          toValue: item.toString ? parseInt(item.toString) : null
        });
      }
      
      if (item.field === 'labels') {
        labelTransitions.push({
          timestamp,
          author: author?.displayName || author?.name || 'Unknown',
          fromValue: item.fromString ? item.fromString.split(' ') : [],
          toValue: item.toString ? item.toString.split(' ') : [],
          added: item.toString ? item.toString.split(' ').filter(label => 
            !item.fromString || !item.fromString.split(' ').includes(label)
          ) : [],
          removed: item.fromString ? item.fromString.split(' ').filter(label => 
            !item.toString || !item.toString.split(' ').includes(label)
          ) : []
        });
      }
    });
  });

  // Sort transitions by timestamp (oldest first)
  statusTransitions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  priorityLevelTransitions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  labelTransitions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    statusTransitions,
    priorityLevelTransitions,
    labelTransitions
  };
};

// Helper functions for time-based aggregation
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

const getMonthStart = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

const aggregateByInterval = (tickets, interval) => {
  const aggregated = {};
  
  tickets.forEach(ticket => {
    let key;
    const date = ticket.created.split('T')[0];
    
    switch(interval) {
      case 'weekly':
        key = getWeekStart(date);
        break;
      case 'monthly':
        key = getMonthStart(date);
        break;
      case 'daily':
      default:
        key = date;
        break;
    }
    
    if (!aggregated[key]) {
      aggregated[key] = {
        date: key,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
        total: 0,
        tickets: []
      };
    }
    
    aggregated[key][ticket.priorityCategory]++;
    aggregated[key].total++;
    aggregated[key].tickets.push(ticket);
  });
  
  return Object.values(aggregated).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Test Jira connection
app.post('/api/jira/test-connection', async (req, res) => {
  try {
    const { baseUrl, email, apiToken } = req.body;
    
    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ error: 'Missing required configuration' });
    }

    const jira = createJiraClient({ baseUrl, email, apiToken });
    
    // Test connection by getting user info
    const response = await jira.get('/myself');
    
    res.json({
      success: true,
      user: {
        displayName: response.data.displayName,
        emailAddress: response.data.emailAddress,
        accountId: response.data.accountId
      }
    });
  } catch (error) {
    console.error('Jira connection test failed:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.errorMessages?.[0] || error.message || 'Connection failed'
    });
  }
});

// Helper function to batch JQL queries for large result sets
const batchJQLQuery = async (jira, jql, fields, maxResults = 2000, expand = []) => {
  const batchSize = 100; // Jira's recommended batch size
  let allIssues = [];
  let startAt = 0;
  let totalIssues = 0;
  let batchCount = 0;

  console.log(`Starting batched JQL query with batch size ${batchSize}, max results ${maxResults}`);

  do {
    console.log(`Batch ${batchCount + 1}: Fetching issues ${startAt} to ${startAt + batchSize - 1}`);
    
    const requestBody = {
      jql: jql,
      fields: fields,
      maxResults: batchSize,
      startAt: startAt
    };
    
    if (expand.length > 0) {
      requestBody.expand = expand;
    }
    
    const response = await jira.post('/search', requestBody);

    const batchIssues = response.data.issues || [];
    allIssues = allIssues.concat(batchIssues);
    
    totalIssues = response.data.total;
    startAt += batchSize;
    batchCount++;

    console.log(`Batch ${batchCount} complete: ${batchIssues.length} issues fetched, ${allIssues.length} total so far`);

    // Safety breaks
    if (allIssues.length >= maxResults) {
      console.log(`Reached max results limit of ${maxResults}, stopping`);
      break;
    }
    
    if (batchCount >= 50) { // Safety limit: max 50 batches (5000 issues)
      console.log(`Reached safety limit of 50 batches, stopping`);
      break;
    }

    // Continue if there are more issues to fetch
  } while (startAt < totalIssues && allIssues.length < totalIssues);

  console.log(`Batched query complete: ${allIssues.length} issues fetched out of ${totalIssues} total`);

  return {
    issues: allIssues,
    total: totalIssues,
    fetchedCount: allIssues.length,
    batchCount: batchCount,
    truncated: allIssues.length < totalIssues
  };
};

// Get current ticket counts and details
app.post('/api/jira/current-tickets', async (req, res) => {
  try {
    const { baseUrl, email, apiToken, project, jqlQuery, timePeriod, timeInterval } = req.body;
    
    // Save configuration if provided
    if (baseUrl || email || project) {
      const configToSave = {};
      if (baseUrl) configToSave.baseUrl = baseUrl;
      if (email) configToSave.email = email;
      if (project) configToSave.project = project;
      if (apiToken && apiToken.length > 10) {
        // Only save API token if it looks valid (avoid saving empty/placeholder values)
        configToSave.apiToken = apiToken;
      }
      if (jqlQuery) configToSave.lastJqlQuery = jqlQuery;
      
      await saveConfig(configToSave);
    }
    
    // If no API token provided, try to load saved data
    if (!apiToken || apiToken === '') {
      console.log('No API token provided, attempting to load saved data...');
      const savedData = await loadSavedData(TICKETS_FILE);
      
      if (savedData) {
        console.log(`Loaded ${savedData.tickets?.length || 0} tickets from saved data`);
        return res.json({
          ...savedData,
          fromCache: true,
          cacheInfo: {
            savedAt: savedData.fetchedAt,
            ticketCount: savedData.tickets?.length || 0,
            source: 'local_cache'
          }
        });
      } else {
        return res.status(400).json({
          error: 'No API token provided and no saved data available. Either provide an API token or fetch data first.',
          suggestion: 'Enter your Jira API token to fetch live data, or switch to Demo mode.'
        });
      }
    }
    
    const jira = createJiraClient({ baseUrl, email, apiToken });
    
    // Use custom JQL query if provided, otherwise use default
    const searchJQL = jqlQuery || `project = ${project} AND cf[11129] > 0 AND created >= -30d ORDER BY created DESC`;
    
    console.log(`Executing JQL: ${searchJQL}`);
    
    const fields = [
      'summary',
      'status',
      'created',
      'updated',
      'priority',
      'labels',
      'customfield_11129' // Priority Level field
    ];
    
    // We'll need to fetch changelog data separately for each issue
    const expand = ['changelog'];

    // Use batched query for potentially large result sets
    const batchResult = await batchJQLQuery(jira, searchJQL, fields, 2000, expand);

    console.log(`Batched query results: ${batchResult.fetchedCount} issues from ${batchResult.batchCount} batches`);

    const tickets = batchResult.issues.map(issue => {
      const priorityLevel = getPriorityLevel(issue);
      const transitionHistory = extractTransitionHistory(issue.changelog);
      const priorityFlags = calculatePriorityFlags(
        transitionHistory.priorityLevelTransitions, 
        priorityLevel, 
        issue.fields.created,
        issue.key
      );
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        priorityLevel: priorityLevel,
        priorityCategory: categorizePriority(priorityLevel),
        ageInDays: calculateAge(issue.fields.created),
        labels: issue.fields.labels || [],
        sourceLabels: extractSourceLabels(issue.fields.labels || []),
        
        // New transition history fields
        statusTransitions: transitionHistory.statusTransitions,
        priorityLevelTransitions: transitionHistory.priorityLevelTransitions,
        labelTransitions: transitionHistory.labelTransitions,
        
        // Priority flow flags
        incomingDate: priorityFlags.incomingDate,
        outgoingDate: priorityFlags.outgoingDate,
        isIncoming: priorityFlags.isIncoming,
        isOutgoing: priorityFlags.isOutgoing,
        
        // Summary stats for quick access
        totalStatusTransitions: transitionHistory.statusTransitions.length,
        totalPriorityLevelTransitions: transitionHistory.priorityLevelTransitions.length,
        totalLabelTransitions: transitionHistory.labelTransitions.length,
        
        // Current values with creation info
        currentStatus: {
          value: issue.fields.status.name,
          id: issue.fields.status.id,
          lastChanged: transitionHistory.statusTransitions.length > 0 ? 
            transitionHistory.statusTransitions[transitionHistory.statusTransitions.length - 1].timestamp : 
            issue.fields.created,
          lastChangedBy: transitionHistory.statusTransitions.length > 0 ? 
            transitionHistory.statusTransitions[transitionHistory.statusTransitions.length - 1].author : 
            'System'
        },
        
        currentPriorityLevel: {
          value: priorityLevel,
          lastChanged: transitionHistory.priorityLevelTransitions.length > 0 ? 
            transitionHistory.priorityLevelTransitions[transitionHistory.priorityLevelTransitions.length - 1].timestamp : 
            issue.fields.created,
          lastChangedBy: transitionHistory.priorityLevelTransitions.length > 0 ? 
            transitionHistory.priorityLevelTransitions[transitionHistory.priorityLevelTransitions.length - 1].author : 
            'System'
        },
        
        currentLabels: {
          value: issue.fields.labels || [],
          lastChanged: transitionHistory.labelTransitions.length > 0 ? 
            transitionHistory.labelTransitions[transitionHistory.labelTransitions.length - 1].timestamp : 
            issue.fields.created,
          lastChangedBy: transitionHistory.labelTransitions.length > 0 ? 
            transitionHistory.labelTransitions[transitionHistory.labelTransitions.length - 1].author : 
            'System'
        }
      };
    });

    // Calculate counts by priority category
    const counts = {
      high: tickets.filter(t => t.priorityCategory === 'high').length,
      medium: tickets.filter(t => t.priorityCategory === 'medium').length,
      low: tickets.filter(t => t.priorityCategory === 'low').length,
      unknown: tickets.filter(t => t.priorityCategory === 'unknown').length,
      total: tickets.length
    };

    console.log('Priority counts:', counts);
    console.log('Available statuses:', [...new Set(tickets.map(t => t.status))]);
    console.log('Priority level range:', {
      min: Math.min(...tickets.map(t => t.priorityLevel || 999)),
      max: Math.max(...tickets.map(t => t.priorityLevel || 0))
    });

    const response = {
      counts,
      tickets,
      totalIssues: batchResult.total,
      fetchedIssues: batchResult.fetchedCount,
      batchInfo: {
        batchCount: batchResult.batchCount,
        truncated: batchResult.truncated,
        batchSize: 100
      },
      jqlUsed: searchJQL,
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };

    if (batchResult.truncated) {
      response.warning = `Large result set: Fetched ${batchResult.fetchedCount} out of ${batchResult.total} total issues. Consider refining your JQL query for complete results.`;
    }

    // Smart save the fresh data to cache (only if newer)
    console.log('Attempting to save fresh data to cache...');
    const saveResult = await saveDataSmart(TICKETS_FILE, response, 'tickets');
    
    if (saveResult.saved) {
      if (saveResult.data?.mergedInfo) {
        response.mergedInfo = saveResult.data.mergedInfo;
        console.log(`Data merged: ${saveResult.data.mergedInfo.newTickets} new + ${saveResult.data.mergedInfo.existingTickets} existing`);
      }
    } else {
      console.log(`Save skipped: ${saveResult.reason}`);
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching current tickets:', error.response?.data || error.message);
    
    // If Jira fetch fails, try to return cached data as fallback
    console.log('Jira fetch failed, attempting to load cached data as fallback...');
    const savedData = await loadSavedData(TICKETS_FILE);
    
    if (savedData) {
      console.log(`Returning cached data: ${savedData.tickets?.length || 0} tickets`);
      return res.json({
        ...savedData,
        fromCache: true,
        cacheInfo: {
          savedAt: savedData.fetchedAt,
          ticketCount: savedData.tickets?.length || 0,
          source: 'fallback_cache',
          reason: 'Jira API unavailable'
        },
        warning: `Using cached data from ${new Date(savedData.fetchedAt).toLocaleString()} - Jira API error: ${error.message}`
      });
    }
    
    // Enhanced error handling for JQL issues
    if (error.response?.data?.errorMessages) {
      const errorMsg = error.response.data.errorMessages[0];
      
      // Suggest fixes for common JQL errors
      let suggestion = '';
      if (errorMsg.includes('field')) {
        suggestion = ' Try using cf[11129] for Priority Level field, or check field names in your Jira instance.';
      } else if (errorMsg.includes('status')) {
        suggestion = ' Check available status names in your project.';
      } else if (errorMsg.includes('project')) {
        suggestion = ' Verify the project key is correct.';
      }
      
      res.status(500).json({
        error: errorMsg + suggestion,
        jqlUsed: req.body.jqlQuery || `project = ${req.body.project} AND cf[11129] > 0 AND created >= -30d ORDER BY created DESC`
      });
    } else {
      res.status(500).json({
        error: error.message || 'Failed to fetch tickets',
        jqlUsed: req.body.jqlQuery || 'default query'
      });
    }
  }
});

// Get historical data for time series analysis
app.post('/api/jira/historical-data', async (req, res) => {
  try {
    const { baseUrl, email, apiToken, project, jqlQuery, timePeriod, timeInterval } = req.body;
    
    // If no API token provided, try to load saved historical data
    if (!apiToken || apiToken === '') {
      console.log('No API token provided, attempting to load saved historical data...');
      const savedData = await loadSavedData(HISTORICAL_FILE);
      
      if (savedData) {
        console.log(`Loaded historical data with ${savedData.totalTickets || 0} tickets`);
        return res.json({
          ...savedData,
          fromCache: true,
          cacheInfo: {
            savedAt: savedData.fetchedAt,
            ticketCount: savedData.totalTickets || 0,
            source: 'local_cache'
          }
        });
      } else {
        return res.status(400).json({
          error: 'No API token provided and no saved historical data available.',
          suggestion: 'Enter your Jira API token to fetch live data, or switch to Demo mode.'
        });
      }
    }
    
    const jira = createJiraClient({ baseUrl, email, apiToken });
    
    // Use custom JQL for historical data, or create a historical version of the query
    let historicalJQL;
    if (jqlQuery) {
      // Modify the query to get historical data (extend date range for trends)
      // Fix JQL date syntax - use startOfDay() function and handle various spacing patterns
      historicalJQL = jqlQuery.replace(/created\s*>=\s*-\d+d/g, 'created >= startOfDay(-90d)');
      historicalJQL = historicalJQL.replace(/updated\s*>=\s*-\d+d/g, 'updated >= startOfDay(-90d)');
      if (!historicalJQL.includes('created >=') && !historicalJQL.includes('updated >=')) {
        // Insert the date filter before any ORDER BY clause to avoid syntax errors
        const orderByIndex = historicalJQL.toUpperCase().indexOf('ORDER BY');
        if (orderByIndex !== -1) {
          historicalJQL = historicalJQL.substring(0, orderByIndex).trim() + 
                         ' AND created >= startOfDay(-90d) ' + 
                         historicalJQL.substring(orderByIndex);
        } else {
          historicalJQL += ' AND created >= startOfDay(-90d)';
        }
      }
    } else {
      // Default historical query
      historicalJQL = `project = ${project} AND cf[11129] > 0 AND created >= startOfDay(-90d) ORDER BY created ASC`;
    }
    
    console.log(`Executing historical JQL: ${historicalJQL}`);
    
    const fields = [
      'summary',
      'status',
      'created',
      'updated',
      'priority',
      'labels',
      'customfield_11129'
    ];
    
    const expand = ['changelog'];

    // Use batched query for historical data (can be large)
    const batchResult = await batchJQLQuery(jira, historicalJQL, fields, 3000, expand);

    console.log(`Historical batched query results: ${batchResult.fetchedCount} issues from ${batchResult.batchCount} batches`);

    const tickets = batchResult.issues.map(issue => {
      const priorityLevel = getPriorityLevel(issue);
      const transitionHistory = extractTransitionHistory(issue.changelog);
      const priorityFlags = calculatePriorityFlags(
        transitionHistory.priorityLevelTransitions, 
        priorityLevel, 
        issue.fields.created,
        issue.key
      );
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        created: issue.fields.created,
        priorityLevel: priorityLevel,
        priorityCategory: categorizePriority(priorityLevel),
        labels: issue.fields.labels || [],
        sourceLabels: extractSourceLabels(issue.fields.labels || []),
        
        // Transition history
        statusTransitions: transitionHistory.statusTransitions,
        priorityLevelTransitions: transitionHistory.priorityLevelTransitions,
        labelTransitions: transitionHistory.labelTransitions,
        
        // Priority flow flags
        incomingDate: priorityFlags.incomingDate,
        outgoingDate: priorityFlags.outgoingDate,
        isIncoming: priorityFlags.isIncoming,
        isOutgoing: priorityFlags.isOutgoing,
        
        // Summary stats
        totalStatusTransitions: transitionHistory.statusTransitions.length,
        totalPriorityLevelTransitions: transitionHistory.priorityLevelTransitions.length,
        totalLabelTransitions: transitionHistory.labelTransitions.length
      };
    });

    // Use the aggregation helper based on the selected interval
    const timeSeries = aggregateByInterval(tickets, timeInterval || 'daily');

    // First, collect all unique source labels from ALL tickets (not just current period tickets)
    const allSourceLabels = new Set();
    tickets.forEach(ticket => {
      ticket.sourceLabels.forEach(label => {
        allSourceLabels.add(label);
      });
    });
    
    console.log(`Found ${allSourceLabels.size} unique source labels:`, Array.from(allSourceLabels));
    
    // Generate source labels time series based on actual labels found
    const sourceLabelsTimeSeries = timeSeries.map(period => {
      const periodTickets = period.tickets || [];
      const sourceCounts = {};
      const sourceTickets = {};
      
      // Initialize all labels with 0 and empty arrays
      allSourceLabels.forEach(label => {
        sourceCounts[label] = 0;
        sourceTickets[label] = [];
      });
      
      // Count actual source labels for this period and collect ticket keys
      periodTickets.forEach(ticket => {
        ticket.sourceLabels.forEach(label => {
          sourceCounts[label] = (sourceCounts[label] || 0) + 1;
          sourceTickets[label].push(ticket.key);
        });
      });
      
      // Create the result object with all found source labels and their ticket keys
      const result = { date: period.date };
      allSourceLabels.forEach(label => {
        result[label] = sourceCounts[label];
        result[`${label}_tickets`] = sourceTickets[label];
      });
      
      return result;
    });

    // Generate average age time series based on actual data
    const averageAgeTimeSeries = timeSeries.map(period => {
      const periodTickets = period.tickets || [];
      
      const calculateAvgAge = (category) => {
        const categoryTickets = periodTickets.filter(t => t.priorityCategory === category);
        if (categoryTickets.length === 0) return 0;
        
        const totalAge = categoryTickets.reduce((sum, ticket) => {
          return sum + calculateAge(ticket.created);
        }, 0);
        
        return Math.round(totalAge / categoryTickets.length);
      };
      
      return {
        date: period.date,
        highAvgAge: calculateAvgAge('high'),
        mediumAvgAge: calculateAvgAge('medium'),
        lowAvgAge: calculateAvgAge('low')
      };
    });

    // Calculate source label distribution from all tickets
    const sourceLabelsMap = {};
    const colors = {
      'src-bug-fix': '#22c55e',
      'src-new-feature': '#3b82f6', 
      'src-tech-debt': '#f59e0b',
      'src-maintenance': '#06b6d4',
      'src-enhancement': '#ec4899',
      'src-research': '#84cc16',
      'src-critical': '#dc2626',
      'src-golive-critical': '#ef4444', // Red - very distinct
      'src-integration': '#a855f7',
      'src-unknown': '#6b7280'
    };
    
    // Generate a color palette for any additional labels
    const additionalColors = [
      '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899', 
      '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'
    ];
    let colorIndex = 0;
    
    tickets.forEach(ticket => {
      ticket.sourceLabels.forEach(label => {
        if (!sourceLabelsMap[label]) {
          sourceLabelsMap[label] = {
            name: label.replace('src-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            label: label,
            count: 0,
            color: colors[label] || additionalColors[colorIndex % additionalColors.length]
          };
          if (!colors[label]) {
            colorIndex++;
          }
        }
        sourceLabelsMap[label].count++;
      });
    });

    const sourceLabels = Object.values(sourceLabelsMap)
      .map(source => ({
        ...source,
        percentage: tickets.length > 0 ? Math.round((source.count / tickets.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    console.log('Historical analysis complete:', {
      timeSeriesPoints: timeSeries.length,
      sourceLabelsFound: sourceLabels.length,
      totalTickets: tickets.length,
      dateRange: timeSeries.length > 0 ? `${timeSeries[0].date} to ${timeSeries[timeSeries.length - 1].date}` : 'none'
    });

    const response = {
      timeSeries,
      sourceLabelsTimeSeries,
      averageAgeTimeSeries,
      sourceLabels,
      allSourceLabels: Array.from(allSourceLabels), // List of all source label keys
      totalTickets: tickets.length,
      timeInterval: timeInterval || 'daily',
      timePeriod: timePeriod || '30d',
      batchInfo: {
        totalFound: batchResult.total,
        fetchedCount: batchResult.fetchedCount,
        batchCount: batchResult.batchCount,
        truncated: batchResult.truncated
      },
      jqlUsed: historicalJQL,
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };

    if (batchResult.truncated) {
      response.warning = `Large historical dataset: Analyzed ${batchResult.fetchedCount} out of ${batchResult.total} total issues for trends.`;
    }

    // Smart save the fresh historical data to cache (only if newer)
    console.log('Attempting to save fresh historical data to cache...');
    const saveResult = await saveDataSmart(HISTORICAL_FILE, response, 'historical');
    
    if (saveResult.saved) {
      console.log('Historical data saved successfully');
    } else {
      console.log(`Historical save skipped: ${saveResult.reason}`);
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching historical data:', error.response?.data || error.message);
    
    // If Jira fetch fails, try to return cached historical data as fallback
    console.log('Historical data fetch failed, attempting to load cached data as fallback...');
    const savedData = await loadSavedData(HISTORICAL_FILE);
    
    if (savedData) {
      console.log(`Returning cached historical data: ${savedData.totalTickets || 0} tickets`);
      return res.json({
        ...savedData,
        fromCache: true,
        cacheInfo: {
          savedAt: savedData.fetchedAt,
          ticketCount: savedData.totalTickets || 0,
          source: 'fallback_cache',
          reason: 'Jira API unavailable'
        },
        warning: `Using cached historical data from ${new Date(savedData.fetchedAt).toLocaleString()} - Jira API error: ${error.message}`
      });
    }
    
    res.status(500).json({
      error: error.response?.data?.errorMessages?.[0] || error.message || 'Failed to fetch historical data',
      jqlUsed: req.body.jqlQuery || 'default historical query'
    });
  }
});

// Get configuration endpoint
app.get('/api/config', async (req, res) => {
  try {
    const config = await loadSavedData(CONFIG_FILE, {});
    
    // Don't send the API token in the response for security
    const safeConfig = { ...config };
    if (safeConfig.apiToken) {
      safeConfig.hasApiToken = true;
      safeConfig.apiTokenMasked = safeConfig.apiToken.substring(0, 4) + '••••••••';
      delete safeConfig.apiToken;
    }
    
    res.json({
      config: safeConfig,
      available: Object.keys(config).length > 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

// Get cache status and manage cached data
app.get('/api/cache/status', async (req, res) => {
  try {
    const ticketsData = await loadSavedData(TICKETS_FILE);
    const historicalData = await loadSavedData(HISTORICAL_FILE);
    const configData = await loadSavedData(CONFIG_FILE, {});
    
    res.json({
      tickets: {
        available: !!ticketsData,
        count: ticketsData?.tickets?.length || 0,
        lastUpdated: ticketsData?.fetchedAt || null,
        jqlUsed: ticketsData?.jqlUsed || null,
        merged: !!ticketsData?.mergedInfo,
        mergedInfo: ticketsData?.mergedInfo || null
      },
      historical: {
        available: !!historicalData,
        count: historicalData?.totalTickets || 0,
        lastUpdated: historicalData?.fetchedAt || null,
        jqlUsed: historicalData?.jqlUsed || null
      },
      config: {
        available: Object.keys(configData).length > 0,
        hasApiToken: !!configData.apiToken,
        lastUpdated: configData.lastUpdated || null,
        baseUrl: configData.baseUrl || null,
        project: configData.project || null
      },
      cacheDirectory: DATA_DIR
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check cache status' });
  }
});

// Clear cached data
app.post('/api/cache/clear', async (req, res) => {
  try {
    const { type } = req.body; // 'tickets', 'historical', or 'all'
    
    if (type === 'tickets' || type === 'all') {
      try {
        await fs.unlink(TICKETS_FILE);
        console.log('Cleared tickets cache');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    
    if (type === 'historical' || type === 'all') {
      try {
        await fs.unlink(HISTORICAL_FILE);
        console.log('Cleared historical cache');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Cleared ${type} cache`,
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mode: 'production'
  });
});

// Serve the HTML app for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Jira Analytics server running on http://localhost:${PORT}`);
  console.log(`📊 Open http://localhost:${PORT} to view the dashboard`);
  console.log(`💾 Data persistence: ${DATA_DIR}`);
  console.log(`💡 Configure your Jira API token to connect to your Jira instance`);
});

module.exports = app;