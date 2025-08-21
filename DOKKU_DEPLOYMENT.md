# Dokku Self-Contained Deployment Guide

**Application:** Vibe Jira Analytics Dashboard  
**Mode:** Complete Backend + Frontend on Dokku  
**Dependencies:** None on local machine

## Architecture Overview

This application runs completely on Dokku with zero local dependencies:

```
┌─────────────────────────────────────────────────────────┐
│                    Dokku Container                      │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Express.js    │    │     Built React App        │ │
│  │   Backend       │    │     (Static Files)         │ │
│  │                 │    │                             │ │
│  │ • API Routes    │◄──►│ • index.html                │ │
│  │ • File Serving  │    │ • CSS/JS bundles            │ │
│  │ • Health Check  │    │ • Documentation (*.md)      │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Data Persistence                       │ │
│  │  • /app/data/config.json                           │ │
│  │  • /app/data/tickets.json                          │ │
│  │  • /app/data/historical.json                       │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                    Nginx Proxy (Port 80)
                            │
                            ▼
                    External Access
```

## Current Deployment Status

✅ **Already Deployed and Working**
- Application is running at: http://10.10.49.112/
- Backend API available at: http://10.10.49.112/api/*
- Help documentation working: http://10.10.49.112/*.md
- Health check: http://10.10.49.112/api/health

## Deployment Process

### 1. Automated Git Deployment
```bash
cd /home/rmohid/code/vibe-jira-analytics
git push dokku main
```

**What happens during deployment:**
1. Dokku receives git push
2. Multi-stage Docker build:
   - Stage 1: Builds React frontend with Vite
   - Stage 2: Creates production container with Node.js + built frontend
3. Container includes:
   - Express.js server
   - Built React application (static files)
   - All documentation files
   - API endpoints
   - Health check endpoint
4. Zero-downtime deployment with health checks
5. Container starts and serves everything on port 3001
6. Nginx proxy routes external traffic (port 80 → 3001)

### 2. No Local Dependencies Required

**Everything runs in the container:**
- ✅ React frontend builds during Docker build
- ✅ Express.js backend serves API and static files
- ✅ Documentation files served directly
- ✅ Data persisted in container filesystem
- ✅ Health checks for zero-downtime deployments

**Local machine only needed for:**
- Git commits and pushes
- Code development (optional - can be done elsewhere)

## File Serving Architecture

### Static Files (React App)
```
GET http://10.10.49.112/          → /app/dist/index.html
GET http://10.10.49.112/assets/*  → /app/dist/assets/*
```

### API Endpoints
```
GET http://10.10.49.112/api/health          → Health check
POST http://10.10.49.112/api/jira/test-connection → Jira API test
POST http://10.10.49.112/api/jira/current-tickets → Fetch tickets
GET http://10.10.49.112/api/config          → Get configuration
```

### Documentation Files
```
GET http://10.10.49.112/TOP7_BUSINESS_LOGIC.md → /app/TOP7_BUSINESS_LOGIC.md
GET http://10.10.49.112/README.md              → /app/README.md
GET http://10.10.49.112/API_DOCUMENTATION.md   → /app/API_DOCUMENTATION.md
```

### React Router (SPA)
```
GET http://10.10.49.112/*         → /app/dist/index.html (React handles routing)
```

## Data Persistence

The application stores configuration and cached data in `/app/data/`:
- `config.json` - Jira connection settings
- `tickets.json` - Cached ticket data
- `historical.json` - Historical analysis data

**For production persistence across deployments:**
```bash
# Create persistent storage
dokku storage:create vibe-jira-analytics
dokku storage:mount vibe-jira-analytics /var/lib/dokku/data/storage/vibe-jira-analytics:/app/data
```