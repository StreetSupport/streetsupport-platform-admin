# Deployment Documentation

This document describes the deployment procedures, CI/CD pipelines, and environment configurations for the Street Support Admin and API projects.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [Admin Deployment (Vercel)](#admin-deployment-vercel)
4. [API Deployment (Azure)](#api-deployment-azure)
5. [GitHub Actions Pipelines](#github-actions-pipelines)
6. [Environment Variables](#environment-variables)
7. [Branch Strategy](#branch-strategy)
8. [Monitoring Deployments](#monitoring-deployments)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Platform Deployment Summary

| Project | Platform | Staging URL | Production URL |
|---------|----------|-------------|----------------|
| Admin | Vercel | Preview deployments | admin.streetsupport.net |
| API | Azure Web Services | Separate staging service | Separate production service |

### Deployment Flow

```
Feature Branch → PR → Tests/Lint → Merge to staging → Deploy → Merge to main → Deploy
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │   Admin   │   │    API    │   │    Web    │
        │  (Vercel) │   │  (Azure)  │   │  (Vercel) │
        └───────────┘   └───────────┘   └───────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ MongoDB Atlas │
                        │   (Database)  │
                        └───────────────┘
```

---

## Admin Deployment (Vercel)

### Deployment Triggers

| Event | Action |
|-------|--------|
| Push to `staging` | Preview Staging deployment generated |
| PR merged to `staging` | Staging deployment |
| Push to `main` | Preview Staging deployment generated |
| PR merged to `main` | Production deployment |

### Vercel Configuration

**Project Settings**:
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`

### Deployment Process

#### 1. Preview Deployments (staging branch)

When pushing to `staging`:
1. Vercel automatically detects the push
2. Runs `npm ci` to install dependencies
3. Runs `npm run build`
4. Creates a preview deployment
5. Generates unique preview URL

#### 2. Production Deployments (main branch)

When merging to `main`:
1. Vercel triggers production deployment
2. Same build process as preview
3. Deploys to production domain
4. Updates `admin.streetsupport.net`

### Vercel Environment Variables

Configure in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Environment | Description |
|----------|-------------|-------------|
| `AUTH0_CLIENT_ID` | All | Auth0 application ID |
| `AUTH0_CLIENT_SECRET` | All | Auth0 secret (sensitive) |
| `AUTH0_SECRET` | All | NextAuth encryption secret |
| `AUTH0_ISSUER_BASE_URL` | All | Auth0 domain URL |
| `AUTH0_AUDIENCE` | All | API audience |
| `NEXTAUTH_URL` | Production | `https://admin.streetsupport.net` |
| `NEXTAUTH_URL` | Preview | `https://[preview-url].vercel.app` |
| `API_URL` | All | Backend API URL |
| `BLOB_STORAGE_HOSTNAME` | All | Azure Blob hostname for images |
| `NEXT_PUBLIC_SENTRY_DSN` | All | Sentry DSN for error tracking |

### Checking Admin Deployment Status

1. **Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Select Street Support project
   - View all deployments in Deployments tab
   - Click deployment for logs and status

2. **GitHub**:
   - View PR checks for deployment status
   - Click "Details" on Vercel check for deployment URL

---

## API Deployment (Azure)

### Deployment Triggers

| Event | Action |
|-------|--------|
| Merge to `staging` | Deploy to staging Azure Web Service |
| Merge to `main` | Deploy to production Azure Web Service |

### Azure Web Services

| Environment | Service Name | URL |
|-------------|--------------|-----|
| Staging | `streetsupport-api-staging` | staging-api.streetsupport.net |
| Production | `streetsupport-api` | api.streetsupport.net |

### Deployment Process

When merging to `staging` or `main`:

1. GitHub Actions workflow triggered
2. Build TypeScript project
3. Run tests and linting
4. Create deployment package
5. Deploy to appropriate Azure Web Service
6. Upload source maps to Sentry

### Azure Environment Variables

Configure in **Azure Portal → App Service → Configuration → Application Settings**:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` or `staging` |
| `PORT` | `8080` (default for Azure) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | API identifier |
| `AUTH0_MANAGEMENT_CLIENT_ID` | Management API client |
| `AUTH0_MANAGEMENT_CLIENT_SECRET` | Management API secret |
| `AUTH0_MANAGEMENT_AUDIENCE` | Management API audience |
| `AUTH0_USER_DB_CONNECTION` | Database connection name |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob storage connection |
| `AZURE_BANNERS_CONTAINER_NAME` | `banners` |
| `AZURE_SWEPS_CONTAINER_NAME` | `sweps` |
| `AZURE_RESOURCES_CONTAINER_NAME` | `resources` |
| `AZURE_LOCATION_LOGOS_CONTAINER_NAME` | `location-logos` |
| `SENDGRID_API_KEY` | SendGrid API key |
| `FROM_EMAIL` | Sender email address |
| `ADMIN_URL` | Admin panel URL |
| `SENTRY_DSN` | Sentry DSN |

### Azure Blob Storage Configuration

**Separate containers for staging and production**:

| Container | Purpose | Access Level |
|-----------|---------|--------------|
| `banners` | Banner images | Public (blob) |
| `sweps` | SWEP banner images | Public (blob) |
| `resources` | Downloadable resources | Public (blob) |
| `location-logos` | City/location logos | Public (blob) |

**Getting Connection String**:
1. Azure Portal → Storage Account
2. Access keys → Connection string
3. Copy and add to App Service configuration

---

## GitHub Actions Pipelines

### Admin Pipeline Jobs

```yaml
# Workflow runs on PR and push to staging/main

jobs:
  lint:
    name: ESLint Check
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run npm run lint

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run npm run test

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run npm run build
```

### API Pipeline Jobs

```yaml
# Workflow runs on PR and push to staging/main

jobs:
  lint:
    name: ESLint Check
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run npm run lint

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run npm run test

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/staging'
    steps:
      - Checkout code
      - Setup Node.js
      - Build project
      - Deploy to Azure staging

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - Checkout code
      - Setup Node.js
      - Build project
      - Deploy to Azure production
      - Upload source maps to Sentry
```

### GitHub Secrets Configuration

**Repository Secrets** (Settings → Secrets and variables → Actions):

#### Admin Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organisation ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SENTRY_AUTH_TOKEN` | Sentry source map upload |

#### API Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` | Azure staging publish profile |
| `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION` | Azure production publish profile |
| `SENTRY_AUTH_TOKEN` | Sentry source map upload |
| `SENTRY_ORG` | Sentry organisation slug |
| `SENTRY_PROJECT` | Sentry project slug |

---

## Environment Variables

### Where to Configure

| Variable Type | Admin | API |
|---------------|-------|-----|
| Build-time | Vercel Dashboard | GitHub Secrets |
| Runtime | Vercel Dashboard | Azure App Settings |
| Secrets | Vercel + GitHub | Azure + GitHub |

### Getting Variable Values

#### Auth0 Variables
- **Location**: Auth0 Dashboard → Applications / APIs
- **CLIENT_ID**: Application → Settings → Client ID
- **CLIENT_SECRET**: Application → Settings → Client Secret
- **DOMAIN**: Settings → Domain

#### Azure Variables
- **Location**: Azure Portal → Storage Account / App Service
- **STORAGE_CONNECTION_STRING**: Storage Account → Access keys
- **WEBAPP_PUBLISH_PROFILE**: App Service → Get publish profile

#### MongoDB Variables
- **Location**: MongoDB Atlas → Clusters
- **MONGODB_URI**: Cluster → Connect → Connection string

#### SendGrid Variables
- **Location**: SendGrid Dashboard → Settings → API Keys
- **SENDGRID_API_KEY**: Create new API key

---

## Branch Strategy

### Git Flow

```
main (production)
  ↑
staging (pre-production)
  ↑
feature/* (development)
```

### Workflow

1. **Create Feature Branch**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/my-feature
   ```

2. **Develop and Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Create Pull Request**
   - Target: `staging`
   - Wait for CI checks to pass
   - Request review

4. **Merge to Staging**
   - After approval and passing checks
   - Creates preview deployment (Admin)
   - Deploys to staging (API)

5. **Promote to Production**
   - Create PR: `staging` → `main`
   - After verification on staging
   - Deploys to production

### Branch Protection Rules

| Rule | staging | main |
|------|---------|------|
| Require PR | ✅ | ✅ |
| Require reviews | 1 | 1 |
| Require status checks | ✅ | ✅ |
| Required checks | lint, test, build | lint, test, build |
| Dismiss stale reviews | ✅ | ✅ |

---

## Monitoring Deployments

### Admin (Vercel)

1. **Vercel Dashboard**:
   - Real-time build logs
   - Deployment history
   - Preview URLs
   - Error logs

2. **GitHub Actions**:
   - PR status checks
   - Workflow run history
   - Job logs

### API (Azure)

1. **GitHub Actions**:
   - View Actions tab in repository
   - Click on workflow run
   - View job logs and status

2. **Azure Portal**:
   - App Service → Deployment Center
   - View deployment history
   - Application Insights (if configured)
   - Logs in real time (Log stream) or for last 365 days (or 100MB)

### Deployment Notifications

Configure notifications for:
- Deployment success/failure
- Build errors
- Test failures

**Channels**:
- GitHub email notifications
- Slack integration (optional)
- Azure alerts (optional)

---

## Troubleshooting

### Common Issues

#### Build Failures

**Symptom**: Build fails in CI/CD
**Solutions**:
1. Check build logs for specific error
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set
4. Run `npm run build` locally to reproduce

#### Test Failures

**Symptom**: Tests fail, blocking merge
**Solutions**:
1. Run tests locally: `npm run test`
2. Check for environment-specific issues
3. Verify mock data is up to date
4. Fix failing tests before merging

#### Deployment Not Triggering

**Symptom**: Merge completed but no deployment
**Solutions**:
1. Check GitHub Actions workflow status
2. Verify branch protection rules
3. Check Vercel/Azure connection
4. Review workflow trigger conditions

#### Environment Variable Issues

**Symptom**: App crashes with missing variable error
**Solutions**:
1. Verify variable is set in correct environment
2. Check variable name spelling
3. Redeploy after adding variable
4. Check for staging vs production differences

### Rollback Procedures

#### Admin (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback

#### API (Azure)

1. Go to Azure Portal → App Service
2. Deployment Center → Deployment history
3. Select previous deployment
4. Click "Redeploy"

---

## Related Files

### Admin Side

| File | Description |
|------|-------------|
| `vercel.json` | Vercel configuration (if exists) |
| `next.config.js` | Next.js build configuration |
| `.github/workflows/*.yml` | GitHub Actions workflows |

### API Side

| File | Description |
|------|-------------|
| `package.json` | Build and start scripts |
| `tsconfig.json` | TypeScript configuration |
| `.github/workflows/*.yml` | GitHub Actions workflows |

### CI/CD

| Location | Description |
|----------|-------------|
| GitHub → Settings → Secrets | Repository secrets |
| GitHub → Settings → Branches | Branch protection rules |
| Vercel Dashboard | Admin deployment settings |
| Azure Portal | API deployment settings |
