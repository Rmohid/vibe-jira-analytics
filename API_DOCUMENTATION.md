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

## Future Enhancements
- WebSocket support for real-time updates
- GraphQL endpoint for more flexible queries
- API key authentication
- Rate limiting
- Data refresh webhook triggers
- Custom metric definitions