# Docker Deployment Guide for Jira Analytics Dashboard

## Overview
This guide provides instructions for containerizing and deploying the Jira Analytics Dashboard in an intranet environment using Docker.

## Security Features
✅ **No credentials in container** - All sensitive data stored in external volumes
✅ **Non-root user** - Container runs as unprivileged user
✅ **Health checks** - Built-in monitoring endpoint
✅ **Proper signal handling** - Clean shutdown with dumb-init
✅ **Multi-stage build** - Minimal production image size

## Quick Start

### 1. Build the Docker Image
```bash
npm run docker:build
# or manually:
docker build -t jira-analytics .
```

### 2. Run with Docker Compose (Recommended)
```bash
# Start the application
npm run docker:compose
# or:
docker-compose up -d

# Stop the application
npm run docker:down
# or:
docker-compose down
```

### 3. Run with Docker (Alternative)
```bash
npm run docker:run
# or manually with volume mount:
docker run -d \
  --name jira-analytics \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  jira-analytics
```

## Configuration

### Environment Variables
Create a `.env` file from the template:
```bash
cp .env.example .env
```

Key environment variables:
- `PORT` - Application port (default: 3001)
- `NODE_ENV` - Environment mode (production)
- `CORS_ORIGIN` - Allowed CORS origins for intranet
- `LOG_LEVEL` - Logging verbosity (info/debug/error)

### Data Persistence
The `/app/data` directory contains:
- `config.json` - Jira configuration and API credentials
- `tickets.json` - Cached ticket data
- `historical.json` - Historical analytics data

**Important**: This directory is mounted as a volume and excluded from the Docker image.

## Deployment Options

### Option 1: Docker Swarm (For Intranet)
```yaml
# docker-stack.yml
version: '3.8'
services:
  jira-analytics:
    image: jira-analytics:latest
    ports:
      - "3001:3001"
    volumes:
      - jira-data:/app/data
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
volumes:
  jira-data:
    driver: local
```

Deploy:
```bash
docker stack deploy -c docker-stack.yml jira-stack
```

### Option 2: Kubernetes (For Enterprise)
```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jira-analytics
spec:
  replicas: 2
  selector:
    matchLabels:
      app: jira-analytics
  template:
    metadata:
      labels:
        app: jira-analytics
    spec:
      containers:
      - name: jira-analytics
        image: your-registry/jira-analytics:latest
        ports:
        - containerPort: 3001
        volumeMounts:
        - name: data
          mountPath: /app/data
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: jira-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: jira-analytics-service
spec:
  selector:
    app: jira-analytics
  ports:
  - port: 3001
    targetPort: 3001
  type: LoadBalancer
```

### Option 3: Docker on VM (Simple Intranet)
For simple intranet deployments on a Linux VM:

```bash
# 1. Copy files to server
scp -r . user@intranet-server:/opt/jira-analytics

# 2. SSH to server and build
ssh user@intranet-server
cd /opt/jira-analytics
docker build -t jira-analytics .

# 3. Run with systemd service
sudo tee /etc/systemd/system/jira-analytics.service << EOF
[Unit]
Description=Jira Analytics Dashboard
After=docker.service
Requires=docker.service

[Service]
ExecStart=/usr/bin/docker run --rm --name jira-analytics \
  -p 3001:3001 \
  -v /opt/jira-analytics/data:/app/data \
  jira-analytics
ExecStop=/usr/bin/docker stop jira-analytics
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable jira-analytics
sudo systemctl start jira-analytics
```

## Hosting Platform Recommendations

### For Intranet Deployment:
1. **Docker Swarm** - Simple, built into Docker, good for small-medium deployments
2. **Kubernetes** - Enterprise-grade, better for large organizations
3. **Portainer** - Web UI for Docker management, good for teams
4. **Rancher** - Kubernetes management platform for enterprises

### Platform-Specific Guides:

#### AWS ECS (Private Subnet)
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker tag jira-analytics:latest $ECR_URI/jira-analytics:latest
docker push $ECR_URI/jira-analytics:latest

# Deploy with ECS CLI or Console
```

#### Azure Container Instances
```bash
# Push to Azure Container Registry
az acr build --registry $ACR_NAME --image jira-analytics .
az container create --resource-group $RG --name jira-analytics --image $ACR_NAME.azurecr.io/jira-analytics:latest
```

#### OpenShift (Red Hat)
```bash
# Build in OpenShift
oc new-build --binary --name=jira-analytics
oc start-build jira-analytics --from-dir=. --follow
oc new-app jira-analytics
oc expose service jira-analytics
```

## Security Considerations

### Network Security
- Deploy behind a reverse proxy (nginx/Apache)
- Use TLS/SSL certificates for HTTPS
- Implement network segmentation
- Configure firewall rules

### Data Security
- Store `/data` volume on encrypted filesystem
- Regular backups of data volume
- Rotate API tokens periodically
- Use secrets management for production

Example nginx reverse proxy:
```nginx
server {
    listen 443 ssl;
    server_name analytics.intranet.local;
    
    ssl_certificate /etc/ssl/certs/intranet.crt;
    ssl_certificate_key /etc/ssl/private/intranet.key;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Container Logs
```bash
docker logs jira-analytics
docker-compose logs -f
```

### Metrics with Prometheus
Add to `docker-compose.yml`:
```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

## Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker logs jira-analytics

# Verify data directory permissions
ls -la ./data

# Ensure port is available
netstat -tuln | grep 3001
```

### Issue: Can't connect to Jira
```bash
# Check network connectivity from container
docker exec jira-analytics ping your-jira-instance.atlassian.net

# Verify proxy settings if behind corporate proxy
docker run -e HTTP_PROXY=http://proxy:8080 jira-analytics
```

### Issue: Data not persisting
```bash
# Verify volume mount
docker inspect jira-analytics | grep Mounts -A 10

# Check data directory in container
docker exec jira-analytics ls -la /app/data
```

## Backup and Recovery

### Backup
```bash
# Backup data directory
tar -czf jira-analytics-backup-$(date +%Y%m%d).tar.gz ./data

# Or use Docker volume backup
docker run --rm -v jira-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

### Restore
```bash
# Restore from backup
tar -xzf jira-analytics-backup-20240115.tar.gz

# Or restore Docker volume
docker run --rm -v jira-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

## Updates and Maintenance

### Update Process
1. Backup data directory
2. Build new image
3. Stop current container
4. Start new container
5. Verify functionality

```bash
# Automated update script
#!/bin/bash
docker-compose down
docker build -t jira-analytics:new .
docker tag jira-analytics:new jira-analytics:backup
docker tag jira-analytics:new jira-analytics:latest
docker-compose up -d
```

## Support

For issues or questions:
1. Check application logs: `docker logs jira-analytics`
2. Review browser console for frontend errors
3. Verify Jira API connectivity
4. Check data directory permissions

## License
MIT