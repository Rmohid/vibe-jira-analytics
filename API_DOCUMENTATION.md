# External API Documentation

## Overview
The Jira Analytics Dashboard now provides a comprehensive REST API that allows external systems like Grafana, custom dashboards, or other analytics tools to consume the Jira data. All endpoints are prefixed with `/api/external/`.

## Base URL
```
http://localhost:3001/api/external
```

## Authentication
Currently, the API does not require authentication as it's designed for internal/intranet use. For production deployments, consider implementing API key authentication.

## Endpoints

### Health Check
Check if the API is running and accessible.

**GET** `/api/external/health`

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T10:00:00.000Z"
}
```

---

### Metrics Endpoints

#### Prometheus-Format Metrics (for Grafana)
Returns metrics in Prometheus text format, perfect for Grafana's Prometheus data source.

**GET** `/api/external/metrics`

Response (text/plain):
```
jira_tickets_total 256
jira_tickets_by_priority{priority="high"} 12
jira_tickets_by_priority{priority="medium"} 87
jira_tickets_by_priority{priority="low"} 134
jira_tickets_by_priority{priority="unknown"} 23
jira_tickets_by_status{status="In Progress"} 45
jira_tickets_by_status{status="Open"} 89
jira_tickets_by_source{source="src-bug-fix"} 34
jira_avg_time_in_top7_days{category="overall"} 12.5
jira_avg_time_in_top7_days{category="high"} 3.2
jira_avg_time_in_top7_days{category="medium"} 8.7
jira_top7_current_count 42
jira_fixed_today_count 3
jira_incoming_today_count 5
```

#### JSON Metrics
Returns the same metrics in JSON format for easier consumption by custom applications.

**GET** `/api/external/metrics/json`

Response:
```json
{
  "total": 256,
  "byPriority": {
    "high": 12,
    "medium": 87,
    "low": 134,
    "unknown": 23
  },
  "byStatus": {
    "In Progress": 45,
    "Open": 89,
    "Done": 122
  },
  "bySource": {
    "src-bug-fix": 34,
    "src-feature": 67,
    "src-tech-debt": 23
  },
  "avgTimeInTop7": {
    "overall": 12.5,
    "high": 3.2,
    "medium": 8.7,
    "low": 15.4
  },
  "top7Count": 42,
  "fixedToday": 3,
  "incomingToday": 5
}
```

---

### Time Series Endpoints

#### Get Time Series Data
Retrieve time series data for various metrics.

**GET** `/api/external/timeseries/:metric`

Parameters:
- `metric` (path): One of `average-time`, `fixed-tickets`, `incoming-outgoing`
- `from` (query, optional): Start date (ISO 8601)
- `to` (query, optional): End date (ISO 8601)
- `interval` (query, optional): `daily`, `weekly`, `monthly` (default: `daily`)

Example:
```
GET /api/external/timeseries/average-time?from=2025-01-01&to=2025-01-31
```

Response:
```json
[
  {
    "time": 1704067200000,
    "high": 3.5,
    "medium": 8.2,
    "low": 14.7
  },
  {
    "time": 1704153600000,
    "high": 3.8,
    "medium": 8.5,
    "low": 15.1
  }
]
```

---

### Grafana-Specific Endpoints

#### Query Endpoint (Grafana JSON Datasource)
This endpoint is specifically designed for Grafana's JSON datasource plugin.

**POST** `/api/external/query`

Request Body:
```json
{
  "targets": [
    {
      "target": "top7_count",
      "type": "timeserie"
    }
  ],
  "range": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-01-31T23:59:59.999Z"
  }
}
```

Available targets:
- `top7_count`: Current Top 7 count over time
- `avg_time_high`: Average time for high priority tickets
- `avg_time_medium`: Average time for medium priority tickets
- `fixed_daily`: Fixed tickets per day

Response:
```json
[
  {
    "target": "top7_count",
    "datapoints": [
      [42, 1704067200000],
      [45, 1704153600000],
      [43, 1704240000000]
    ]
  }
]
```

#### Annotations Endpoint
Provides event annotations for Grafana charts.

**POST** `/api/external/annotations`

Request Body:
```json
{
  "range": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-01-31T23:59:59.999Z"
  },
  "annotation": {
    "name": "jira-events"
  }
}
```

Response:
```json
[
  {
    "time": 1704067200000,
    "title": "Entered Top 7",
    "tags": ["incoming", "high"],
    "text": "KSD-12345: Critical bug in payment system"
  },
  {
    "time": 1704153600000,
    "title": "Left Top 7",
    "tags": ["outgoing", "medium"],
    "text": "KSD-12346: Feature implementation completed"
  }
]
```

---

### Ticket Data Endpoints

#### List Tickets
Get a paginated list of tickets with optional filters.

**GET** `/api/external/tickets`

Query Parameters:
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 100): Items per page
- `priority` (string, optional): Filter by priority (`high`, `medium`, `low`, `unknown`)
- `status` (string, optional): Filter by status
- `inTop7` (boolean, optional): Filter for tickets in Top 7 (Priority Level < 100)

Example:
```
GET /api/external/tickets?page=1&limit=50&priority=high&inTop7=true
```

Response:
```json
{
  "tickets": [
    {
      "key": "KSD-12345",
      "summary": "Critical bug in payment system",
      "priorityLevel": 5,
      "priorityCategory": "high",
      "timeInTop7Days": 3,
      "status": "In Progress",
      "sourceLabels": ["src-bug-fix"],
      "incomingDate": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

#### Get Fixed Tickets by Date Range
Retrieve tickets that left the Top 7 prioritized backlog within a specific date range.

**GET** `/api/external/tickets/fixed`

Query Parameters:
- `from` (string, optional): Start date in ISO format (e.g., "2025-01-01")
- `to` (string, optional): End date in ISO format (e.g., "2025-01-31")
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 100): Number of tickets per page

Example:
```
GET /api/external/tickets/fixed?from=2025-01-01&to=2025-01-31&limit=20
```

Response:
```json
{
  "tickets": [
    {
      "key": "KSD-12345",
      "summary": "Critical bug in payment system",
      "outgoingDate": "2025-01-15T10:00:00.000Z",
      "timeInTop7Days": 7,
      "priorityLevel": 5,
      "priorityCategory": "high",
      "status": "Closed",
      "sourceLabels": ["src-bug-fix"],
      "incomingDate": "2025-01-08T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2,
  "dateRange": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  }
}
```

#### Get Source Label Analysis Over Time
Analyze ticket distribution and trends by source labels over time periods.

**GET** `/api/external/tickets/sources`

Query Parameters:
- `from` (string, optional): Start date in ISO format (e.g., "2025-01-01")
- `to` (string, optional): End date in ISO format (e.g., "2025-01-31")
- `interval` (string, default: "daily"): Time interval - "daily", "weekly", or "monthly"
- `source` (string, optional): Specific source label to analyze (e.g., "src-bug-fix"). If omitted, analyzes all source labels.

Example:
```
GET /api/external/tickets/sources?source=src-bug-fix&from=2025-01-01&to=2025-01-31&interval=weekly
```

Response:
```json
{
  "analysis": [
    {
      "date": "2025-01-01",
      "interval": "weekly",
      "sources": {
        "src-bug-fix": {
          "total": 15,
          "inTop7": 12,
          "avgTimeInTop7": 8.5,
          "incoming": 3,
          "outgoing": 2,
          "tickets": [
            {
              "key": "KSD-12345",
              "summary": "Critical bug in payment system",
              "timeInTop7Days": 7,
              "priorityLevel": 5,
              "status": "In Progress",
              "incomingDate": "2025-01-02T10:00:00.000Z",
              "outgoingDate": null
            }
          ]
        }
      }
    }
  ],
  "total": 4,
  "interval": "weekly",
  "sourcesAnalyzed": ["src-bug-fix"],
  "dateRange": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  }
}
```

#### Get Single Ticket
Retrieve details for a specific ticket.

**GET** `/api/external/tickets/:key`

Example:
```
GET /api/external/tickets/KSD-12345
```

Response:
```json
{
  "key": "KSD-12345",
  "summary": "Critical bug in payment system",
  "priorityLevel": 5,
  "priorityCategory": "high",
  "timeInTop7Days": 3,
  "ageInDays": 15,
  "status": "In Progress",
  "sourceLabels": ["src-bug-fix"],
  "incomingDate": "2025-01-15T10:00:00.000Z",
  "created": "2025-01-01T09:00:00.000Z",
  "transitions": [...]
}
```

---

### Statistics Endpoints

#### Get Aggregated Statistics
Returns comprehensive statistics about the current state of tickets.

**GET** `/api/external/stats`

Response:
```json
{
  "current": {
    "total": 256,
    "byPriority": {...},
    "byStatus": {...},
    "bySource": {...},
    "avgTimeInTop7": {...},
    "top7Count": 42,
    "fixedToday": 3,
    "incomingToday": 5
  },
  "topTicketsByTime": [
    {
      "key": "KSD-12345",
      "summary": "Long-running task",
      "timeInTop7Days": 45,
      "priorityLevel": 25,
      "status": "In Progress"
    }
  ],
  "recentlyFixed": [...],
  "recentlyAdded": [...]
}
```

#### Get Source Labels
Returns all unique source labels found in the tickets.

**GET** `/api/external/sources`

Response:
```json
[
  "src-bug-fix",
  "src-feature",
  "src-golive-critical",
  "src-tech-debt"
]
```

---

## Grafana Integration Guide

### Setting up Grafana with the API

#### Option 1: Using Prometheus Data Source
1. Add a new Prometheus data source in Grafana
2. Set URL to: `http://localhost:3001/api/external`
3. Under "Custom HTTP Headers", add:
   - Header: `Accept`
   - Value: `text/plain`
4. Save and test the connection

#### Option 2: Using JSON Data Source Plugin
1. Install the JSON datasource plugin:
   ```bash
   grafana-cli plugins install simpod-json-datasource
   ```
2. Add a new JSON data source
3. Set URL to: `http://localhost:3001/api/external`
4. Save and test

### Example Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Jira Analytics",
    "panels": [
      {
        "title": "Current Top 7 Count",
        "type": "graph",
        "targets": [
          {
            "target": "top7_count",
            "type": "timeserie"
          }
        ]
      },
      {
        "title": "Average Time in Top 7",
        "type": "graph",
        "targets": [
          {
            "target": "avg_time_high",
            "legendFormat": "High Priority"
          },
          {
            "target": "avg_time_medium",
            "legendFormat": "Medium Priority"
          }
        ]
      },
      {
        "title": "Fixed Tickets Per Day",
        "type": "graph",
        "targets": [
          {
            "target": "fixed_daily"
          }
        ]
      }
    ]
  }
}
```

---

## Rate Limiting
Currently, there is no rate limiting implemented. For production use, consider implementing rate limiting to prevent abuse.

## Error Responses
All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Description of the error"
}
```

## CORS Configuration
The API supports CORS for cross-origin requests. All origins are currently allowed. For production, configure specific allowed origins.

## Data Freshness
The API serves data from cached JSON files that are updated when the main dashboard fetches new data from Jira. The data freshness depends on how often the dashboard is refreshed.

## Performance Considerations
- Large ticket datasets (>10,000 tickets) may cause slower response times
- Use pagination for ticket list endpoints
- Time series data is pre-calculated and cached for performance
- Consider implementing Redis caching for production deployments

## Curl Examples

Here are practical curl command examples for common API usage patterns:

### Basic Health Check
```bash
curl "http://localhost:3001/api/external/health"
```

### Get All Fixed Tickets (Recent)
```bash
curl "http://localhost:3001/api/external/tickets/fixed?limit=10"
```

### Get Fixed Tickets for Specific Date Range
```bash
# Fixed tickets in September 2025
curl "http://localhost:3001/api/external/tickets/fixed?from=2025-09-01&to=2025-09-30"

# Fixed tickets in the last 7 days
curl "http://localhost:3001/api/external/tickets/fixed?from=$(date -d '7 days ago' +%Y-%m-%d)&to=$(date +%Y-%m-%d)"
```

### Extract Ticket Keys Only
```bash
# Get just the ticket keys from fixed tickets
curl "http://localhost:3001/api/external/tickets/fixed?limit=20" | jq '.tickets[].key'

# Get ticket keys and summaries
curl "http://localhost:3001/api/external/tickets/fixed?limit=10" | jq '.tickets[] | {key, summary}'
```

### Source Label Analysis Examples
```bash
# Analyze bug-fix tickets over the last month (daily breakdown)
curl "http://localhost:3001/api/external/tickets/sources?source=src-bug-fix&from=2025-09-01&to=2025-09-30&interval=daily"

# Weekly analysis of all source labels
curl "http://localhost:3001/api/external/tickets/sources?from=2025-09-01&to=2025-09-30&interval=weekly"

# Get just the summary metrics for a specific source
curl "http://localhost:3001/api/external/tickets/sources?source=src-golive-critical&interval=weekly" | jq '.analysis[] | {date, sources.["src-golive-critical"] | {total, inTop7, avgTimeInTop7, incoming, outgoing}}'
```

### Current Statistics and Metrics
```bash
# Get current overall statistics
curl "http://localhost:3001/api/external/stats"

# Get just the recently fixed tickets
curl "http://localhost:3001/api/external/stats" | jq '.recentlyFixed'

# Get current Top 7 tickets by time
curl "http://localhost:3001/api/external/stats" | jq '.topTicketsByTime'
```

### Prometheus Metrics for Grafana
```bash
# Get metrics in Prometheus format
curl "http://localhost:3001/api/external/metrics"

# Get metrics in JSON format
curl "http://localhost:3001/api/external/metrics/json"
```

### Time Series Data
```bash
# Get fixed tickets time series
curl "http://localhost:3001/api/external/timeseries/fixed-tickets?interval=weekly"

# Get average time trends
curl "http://localhost:3001/api/external/timeseries/average-time?from=2025-09-01&to=2025-09-30"
```

### Filtering and Pagination
```bash
# Get tickets in Top 7 only
curl "http://localhost:3001/api/external/tickets?inTop7=true&limit=50"

# Get high priority tickets
curl "http://localhost:3001/api/external/tickets?priority=high"

# Paginate through large result sets
curl "http://localhost:3001/api/external/tickets/fixed?page=2&limit=50"
```

### Complex Analysis with jq
```bash
# Count fixed tickets by source label
curl "http://localhost:3001/api/external/tickets/fixed" | jq '[.tickets[].sourceLabels[]] | group_by(.) | map({source: .[0], count: length})'

# Average time in Top 7 for fixed tickets by priority
curl "http://localhost:3001/api/external/tickets/fixed" | jq 'group_by(.priorityCategory) | map({priority: .[0].priorityCategory, avgTime: (map(.timeInTop7Days) | add / length)})'

# Daily fixed ticket counts
curl "http://localhost:3001/api/external/tickets/fixed?from=2025-09-01&to=2025-09-30" | jq '[.tickets[].outgoingDate | split("T")[0]] | group_by(.) | map({date: .[0], count: length})'
```

### Monitoring and Alerting
```bash
# Check if any tickets have been in Top 7 > 30 days
curl "http://localhost:3001/api/external/tickets?inTop7=true" | jq '.tickets[] | select(.timeInTop7Days > 30) | {key, summary, timeInTop7Days}'

# Get count of tickets by priority in Top 7
curl "http://localhost:3001/api/external/stats" | jq '.current.byPriority'

# Check recent incoming vs outgoing flow
curl "http://localhost:3001/api/external/stats" | jq '{fixedToday, incomingToday}'
```

## Future Enhancements
- WebSocket support for real-time updates
- GraphQL endpoint for more flexible queries
- API key authentication
- Rate limiting
- Data refresh webhook triggers
- Custom metric definitions