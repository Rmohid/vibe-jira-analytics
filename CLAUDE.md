# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Jira Analytics Dashboard - A minimal 3-file local web application that provides analytics and visualizations for Jira tickets. The project uses Express.js backend with a React-based frontend served from a single HTML file.

## Common Development Commands

### Development
- `npm run dev` - Run server with auto-restart (nodemon)
- `npm start` - Run server in production mode
- `npm run demo` - Run demo mode without connecting to Jira API

### Testing & Validation
This project doesn't have a test suite or linting configuration. When making changes:
- Manually test the API endpoints using the frontend UI
- Check browser console for JavaScript errors
- Verify data persistence by checking files in `/data` directory
- Test both demo mode and production mode

## Architecture & Code Patterns

### Backend (server.js)
The Express server implements several key patterns:

1. **Smart Data Caching**: Always check existing data timestamps before saving new data to avoid overwriting newer information
2. **Data Merging**: When fetching tickets, preserve historical tickets not in current results by merging datasets
3. **Error Handling**: All API endpoints should fallback to cached data when Jira API is unavailable
4. **Batch Processing**: Use the existing batched JQL query pattern (100 tickets per request) for large datasets

### Frontend (index.html)
Single-file React application using CDN libraries:

1. **State Management**: Uses React hooks (useState, useEffect) for all state
2. **Data Fetching**: All API calls go through the `/api` prefix to the Express backend
3. **Visualization**: Uses Recharts library for all charts - maintain consistent styling
4. **Demo Mode**: Demo data is embedded in the HTML file - update it when adding new features

### API Endpoints
When adding new endpoints, follow these patterns:
- POST endpoints for Jira operations that require credentials
- GET endpoints for cached data retrieval
- Always return appropriate error messages and status codes
- Save configuration changes using the `saveConfig` helper

### Data Persistence
- All data stored in JSON files under `/data` directory
- Use `loadSavedData` and `saveDataSmart` helpers for file operations
- Never expose full API tokens in responses or logs

## Important Configuration

### Jira Integration
- Base URL: `https://komutel.atlassian.net` (configurable)
- API Version: REST API v3
- Custom Fields: `customfield_11129` for Priority Level
- Authentication: Basic auth with email + API token

### Priority Categorization
- High: Priority Level < 10
- Medium: Priority Level < 100
- Low: Priority Level >= 100
- Unknown: No Priority Level set

### Source Labels
Only labels prefixed with "src-" are considered source labels for analytics.

## Working with This Codebase

1. **Adding New Features**: Implement in both demo mode (hardcoded data) and production mode (API calls)
2. **Modifying API**: Update both server.js endpoint and corresponding frontend fetch call
3. **Changing Visualizations**: Maintain consistent color scheme and use existing Recharts patterns
4. **Error States**: Always provide user-friendly error messages and fallback to cached data

## Security Considerations
- API tokens stored locally in `data/config.json` - never commit this file
- Frontend masks tokens in UI display
- No tokens in server logs or error messages