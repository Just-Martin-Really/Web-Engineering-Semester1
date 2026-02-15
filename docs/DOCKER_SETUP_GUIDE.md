# Docker Setup & Troubleshooting Guide

## Overview

This guide explains how to run the application using Docker and docker-compose.

---

## Files Involved

- **`dockerfile`** - Instructions to build the Docker image
- **`docker-compose.yml`** - Configuration for all services (app, MongoDB, Nginx)
- **`.env.docker`** - Environment variables for Docker (development)
- **`.env.production`** - Environment variables for production deployment
- **`.dockerignore`** - Files to exclude from Docker image (like .env)

---

## Quick Start

### 1. Prerequisites

Ensure you have Docker and docker-compose installed:

```bash
docker --version
docker-compose --version
```

### 2. Start the Application

```bash
docker-compose up --build
```

**What happens:**
1. MongoDB starts and becomes healthy
2. Node app builds and starts
3. Nginx starts (acts as reverse proxy)
4. App is accessible at `http://localhost`

### 3. Stop the Application

```bash
docker-compose down
```

To also remove volumes (MongoDB data):
```bash
docker-compose down -v
```

---

## How Docker Solves the Environment Variable Problem

### The Problem

Your server.js requires environment variables:
```javascript
require('dotenv').config(); // Loads from .env file
```

But `.env` is **NOT in the Docker image** because:
- It's in `.gitignore` (not in git)
- `.dockerignore` prevents it from copying into Docker
- Each environment has different secrets (dev vs prod)

### The Solution

**Three-layer approach:**

1. **`.env.docker`** (Git-tracked)
   - Contains Docker development secrets
   - Committed to repository
   - Safe placeholder values

2. **`docker-compose.yml`** (Git-tracked)
   - Explicitly sets all environment variables
   - Overrides `.env.docker` values
   - Clear and visible configuration

3. **`dockerfile`** (Git-tracked)
   - Copies `.env.docker` to `.env` inside container
   - Ensures app has required configuration
   - Creates logs directory

### Flow Inside Docker Container

```
1. Docker starts
2. dockerfile copies .env.docker → .env
3. app starts and runs: require('dotenv').config()
4. dotenv reads .env file
5. All environment variables loaded
6. App starts successfully ✅
```

---

## Environment Files Explained

### `.env` (Local Development - NOT in git)
```bash
# Your local secrets for development
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mongo-app
ACCESS_TOKEN_SECRET=my-local-dev-secret
# ... etc
```
**When used:** Running locally with `npm start`
**Where stored:** Your machine only (in .gitignore)

### `.env.docker` (Docker Development - IN git)
```bash
# Docker development secrets
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/mongo-app
ACCESS_TOKEN_SECRET=docker-dev-access-secret-change-in-production-12345
# ... etc
```
**When used:** Running with `docker-compose up`
**Where stored:** Git repository (tracked)
**Security:** Safe placeholder values marked as "change-in-production"

### `.env.production` (Production Deployment - IN git as template)
```bash
# Production secrets (user fills these in)
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri-here:27017/mongo-app
ACCESS_TOKEN_SECRET=your-production-access-token-secret-here
# ... etc
```
**When used:** Production deployment (outside Docker)
**Where stored:** Git repository (as template only)
**Security:** Empty placeholders - user must fill in real values

---

## Testing Docker Setup

### 1. Build the Image

```bash
docker-compose build
```

Output should show:
```
Successfully tagged web-engineering-semester1_app:latest
```

### 2. Check Running Containers

```bash
docker-compose ps
```

Should show:
```
NAME          STATUS
mongodb       Up (healthy)
app           Up (healthy)
nginx         Up
```

### 3. Test the API

```bash
# Health check
curl http://localhost/health

# Register user
curl -X POST http://localhost/api/registration \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Test",
    "lastname": "User",
    "username": "testuser",
    "password": "TestPass123",
    "course": "TIA"
  }'
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just MongoDB
docker-compose logs -f mongodb

# Just Nginx
docker-compose logs -f nginx
```

### 5. Access Container Shell

```bash
# App container
docker-compose exec app sh

# MongoDB container
docker-compose exec mongodb mongosh
```

---

## Troubleshooting

### Issue: "MongoDB connection refused"

**Cause:** MongoDB not healthy yet

**Solution:**
```bash
# Check MongoDB status
docker-compose logs mongodb

# Wait for "Ready to accept connections" message
docker-compose logs -f mongodb
```

### Issue: "Port 3001 already in use"

**Cause:** Another service using port 3001

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
# ports:
#   - "3002:3001"
```

### Issue: "Nginx health check failing"

**Cause:** App not responding yet

**Solution:**
```bash
# Check app logs
docker-compose logs app

# Give app more time (health check has 30s startup period)
docker-compose logs -f app
```

### Issue: "Command not found: node"

**Cause:** Running commands outside the container

**Solution:**
```bash
# Wrong - runs on your machine
node -e "console.log('hi')"

# Correct - runs in container
docker-compose exec app node -e "console.log('hi')"
```

### Issue: "Cannot find module 'dotenv'"

**Cause:** Dependencies not installed

**Solution:**
```bash
# Rebuild without cache
docker-compose build --no-cache

# Then start
docker-compose up
```

---

## Production Deployment

### Preparation

1. **Edit `.env.production`:**
   ```bash
   # Fill in all values
   ACCESS_TOKEN_SECRET=<generate strong random value>
   REFRESH_TOKEN_SECRET=<generate strong random value>
   SESSION_SECRET=<generate strong random value>
   MONGODB_URI=<your production database>
   ALLOWED_ORIGINS=https://yourdomain.com
   ENFORCE_HTTPS=true
   ```

2. **Generate Strong Secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run this 3 times to get 3 random secrets.

3. **Update docker-compose.yml:**
   ```yaml
   environment:
     # ... replace placeholder values with production values
     - ACCESS_TOKEN_SECRET=<your actual production secret>
   ```

### Deployment

```bash
# Build for production
docker-compose build

# Start services
docker-compose up -d

# Monitor
docker-compose logs -f app
```

---

## Environment Variable Override

### docker-compose.yml Overrides .env.docker

If `.env.docker` has:
```bash
ACCESS_TOKEN_SECRET=docker-dev-secret
```

And `docker-compose.yml` has:
```yaml
- ACCESS_TOKEN_SECRET=override-value
```

**Result:** `override-value` is used (docker-compose takes precedence)

---

## Cleanup

### Remove All Containers

```bash
docker-compose down
```

### Remove All Data (including MongoDB)

```bash
docker-compose down -v
```

### Remove Unused Images

```bash
docker system prune
```

### Full Reset

```bash
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up
```

---

## Useful Docker Commands

```bash
# Build image
docker-compose build

# Start services (attached - see logs)
docker-compose up

# Start services (detached - background)
docker-compose up -d

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Run command in container
docker-compose exec <service> <command>

# Enter container shell
docker-compose exec <service> sh

# View container stats
docker stats

# Restart service
docker-compose restart app
```

---

## Security Best Practices

✅ **Do:**
- ✅ Keep `.env` file in `.gitignore` (not committed)
- ✅ Use `.env.docker` for Docker development secrets
- ✅ Use `.env.production` template (fill in real values only at deployment)
- ✅ Generate strong random secrets before production
- ✅ Change default Docker secrets before using in production
- ✅ Don't commit real production secrets to git

❌ **Don't:**
- ❌ Commit `.env` to git
- ❌ Use same secrets in dev and production
- ❌ Leave "change-in-production" placeholder values in production
- ❌ Put secrets in docker-compose.yml (use .env files)
- ❌ Use weak secrets like "password123"

---

## Summary

| Scenario | File Used | Storage | Purpose |
|----------|-----------|---------|---------|
| Local development | `.env` | Your machine | Dev secrets (not in git) |
| Docker development | `.env.docker` | Git | Docker dev secrets |
| Docker production | docker-compose.yml + env vars | Deployment | Production secrets |
| Production deployment | `.env.production` | Git as template | Production template |

---

## Next Steps

1. ✅ Run `docker-compose up --build`
2. ✅ Test with `curl http://localhost/health`
3. ✅ Review logs with `docker-compose logs -f app`
4. ✅ For production, edit `.env.production` with real values


