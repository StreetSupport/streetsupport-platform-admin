# Sentry Setup and Dashboard Access

This document describes how Sentry is configured for error monitoring across the Street Support platform.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [General Sentry Concepts](#general-sentry-concepts)
3. [Admin Project Configuration](#admin-project-configuration)
4. [API Project Configuration](#api-project-configuration)
5. [Dashboard Access](#dashboard-access)
6. [Checking Errors](#checking-errors)
7. [Configuring Alerts](#configuring-alerts)
8. [Source Maps](#source-maps)
9. [Environment Variables](#environment-variables)
10. [Best Practices](#best-practices)

---

## Overview

**Sentry** is used for real-time error tracking and performance monitoring. It captures:
- JavaScript/TypeScript runtime errors
- Unhandled exceptions
- API errors and failures
- Performance metrics
- User session data (anonymised)

Both Admin and API projects have separate Sentry projects for isolated error tracking.

---

## General Sentry Concepts

### Projects
Each application has its own Sentry project:
- **Admin Project**: Tracks frontend errors (Next.js)
- **API Project**: Tracks backend errors (Express.js)
- **Public WEB Project**: Tracks frontend errors (Next.js)

### Environments
Errors are tagged by environment:
- `development` - Local development
- `staging` - Staging deployment
- `production` - Production deployment

### Releases
Each deployment creates a release in Sentry, allowing you to:
- Track which version introduced a bug
- See error trends across releases
- Link errors to specific commits

### Source Maps
Source maps are uploaded during CI/CD to provide:
- Readable stack traces (original TypeScript, not minified JS)
- Line numbers matching your source code
- File names instead of webpack chunks

---

## Admin Project Configuration

### Installation

```bash
npm install @sentry/nextjs
```

### Configuration Files

**`sentry.client.config.ts`** - Browser-side error tracking:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,  // 100% of transactions for performance
  replaysSessionSampleRate: 0.1,  // 10% of sessions recorded
  replaysOnErrorSampleRate: 1.0,  // 100% of sessions with errors recorded
});
```

**`sentry.server.config.ts`** - Server-side error tracking:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
});
```

**`sentry.edge.config.ts`** - Edge runtime error tracking:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
});
```

**`next.config.js`** - Sentry webpack plugin:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Your Next.js config
};

module.exports = withSentryConfig(nextConfig, {
  org: 'street-support',
  project: 'admin',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
});
```

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      page: 'banners',
      action: 'create'
    },
    extra: {
      bannerId: banner.id
    }
  });
}
```

---

## API Project Configuration

### Installation

```bash
npm install @sentry/node
```

### Configuration

**`src/config/sentry.ts`**:
```typescript
import * as Sentry from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'staging',
    tracesSampleRate: 1.0,
    integrations: [
      // Express integration
      new Sentry.Integrations.Express({ app }),
      // MongoDB integration
      new Sentry.Integrations.Mongo(),
    ],
  });
}
```

**Express Middleware Setup**:
```typescript
import * as Sentry from '@sentry/node';

const app = express();

// Must be first middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Your routes...

// Must be last error handler
app.use(Sentry.Handlers.errorHandler());
```

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/node';

export const createBanner = asyncHandler(async (req, res) => {
  try {
    // Your code
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/banners',
        method: 'POST'
      },
      user: {
        id: req.user?._id,
        username: req.user?.UserName
      }
    });
    throw error;
  }
});
```

---

## Dashboard Access

### Accessing Sentry Dashboard

1. Navigate to [sentry.io](https://sentry.io)
2. Log in with your Street Support credentials
3. Select the appropriate project:
   - `street-support/admin` for Admin errors
   - `street-support/api` for API errors

### Dashboard Sections

| Section | Description |
|---------|-------------|
| **Issues** | List of all captured errors grouped by type |
| **Performance** | Transaction timing and bottlenecks |
| **Releases** | Errors by deployment version |
| **Alerts** | Configured alert rules and history |
| **Discover** | Custom queries and analytics |
| **Replays** | Session recordings (Admin only) |

---

## Checking Errors

### Finding Recent Errors

1. Go to **Issues** in the sidebar
2. Use filters:
   - **Environment**: `production`, `staging`
   - **Time**: Last 24 hours, 7 days, etc.
   - **Status**: Unresolved, Resolved, Ignored

### Understanding an Error

Each error shows:
- **Stack Trace**: Where the error occurred
- **Breadcrumbs**: Actions leading to the error
- **Tags**: Environment, browser, user info
- **User**: Who experienced the error (anonymised)
- **Device**: Browser, OS, screen size

### Error Details to Check

1. **Stack Trace**: Click to expand full trace
2. **Request Data**: For API errors, see request body and headers
3. **User Actions**: Breadcrumbs show what user did before error
4. **Frequency**: How often this error occurs
5. **First/Last Seen**: When error was introduced

### Resolving Errors

1. **Resolve**: Mark as fixed (will reopen if occurs again)
2. **Ignore**: Don't show this error anymore
3. **Archive**: Keep but don't track actively
4. **Assign**: Assign to team member

---

## Configuring Alerts

### Creating Alert Rules

1. Go to **Alerts** → **Create Alert Rule**
2. Choose alert type:
   - **Issue Alert**: Triggers on new errors
   - **Metric Alert**: Triggers on thresholds

### Issue Alert Configuration

**Example: Alert on new production errors**

```yaml
When: A new issue is created
Filter:
  Environment: production
  Level: error
Then:
  Send notification to: #sentry-alerts (Slack)
  Send email to: email
```

### Metric Alert Configuration

**Example: Alert on high error rate**

```yaml
When: Error count > 10 in 5 minutes
Filter:
  Environment: production
Then:
  Send notification to: #sentry-alerts (Slack)
  Trigger severity: critical
```

### Recommended Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| New Production Error | New issue in production | Slack + Email |
| High Error Rate | >10 errors in 5 min | Slack (urgent) |
| First User Impact | First occurrence of issue | Slack |
| Regression | Resolved issue recurs | Slack + Email |

### Notification Channels

Configure in **Settings** → **Integrations**:
- **Slack**: Real-time notifications
- **Email**: Daily/weekly digests
- **PagerDuty**: Critical alerts (optional)

---

## Source Maps

### Why Source Maps Matter

Without source maps, you see:
```
Error at chunk-abc123.js:1:12345
```

With source maps, you see:
```
Error at src/components/BannerEditor.tsx:156:8
```

### Uploading Source Maps

Source maps are uploaded during CI/CD deployment.

**GitHub Actions Configuration**:
```yaml
- name: Upload source maps to Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: street-support
    SENTRY_PROJECT: admin
  run: |
    npx @sentry/cli releases new ${{ github.sha }}
    npx @sentry/cli releases files ${{ github.sha }} upload-sourcemaps .next/static
    npx @sentry/cli releases finalize ${{ github.sha }}
```

### Required Secrets for Source Maps

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `SENTRY_AUTH_TOKEN` | API token for uploads | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Organisation slug | Sentry URL: sentry.io/organizations/{org}/ |
| `SENTRY_PROJECT` | Project slug | Sentry URL: sentry.io/.../projects/{project}/ |

---

## Environment Variables

### Admin Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SENTRY_DSN` | Public DSN for client-side | Yes |
| `SENTRY_DSN` | DSN for server-side | Yes |
| `SENTRY_AUTH_TOKEN` | For source map uploads | CI/CD only |
| `SENTRY_ORG` | Organisation slug | CI/CD only |
| `SENTRY_PROJECT` | Project slug | CI/CD only |

### API Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SENTRY_DSN` | DSN for error tracking | Yes |
| `SENTRY_AUTH_TOKEN` | For source map uploads | CI/CD only |
| `SENTRY_ORG` | Organisation slug | CI/CD only |
| `SENTRY_PROJECT` | Project slug | CI/CD only |

### Getting Your DSN

1. Go to Sentry Dashboard
2. Select your project
3. Go to **Settings** → **Client Keys (DSN)**
4. Copy the DSN value

---

## Best Practices

### Error Context

Always add context when capturing errors:
```typescript
Sentry.captureException(error, {
  tags: {
    feature: 'banner-creation',
    templateType: banner.TemplateType
  },
  extra: {
    formData: sanitisedFormData,
    userId: user.id
  }
});
```

### User Identification

Set user context for better tracking:
```typescript
Sentry.setUser({
  id: user._id,
  username: user.UserName,
  // Don't include email for privacy
});
```

### Sensitive Data

Never log sensitive data:
- ❌ Passwords
- ❌ API keys
- ❌ Personal information
- ❌ Financial data

### Performance Monitoring

Use transactions for key operations:
```typescript
const transaction = Sentry.startTransaction({
  name: 'Create Banner',
  op: 'banner.create'
});

try {
  // Your code
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

---

## Related Files

### Admin Side

| File | Description |
|------|-------------|
| `sentry.client.config.ts` | Browser-side Sentry configuration |
| `sentry.server.config.ts` | Server-side Sentry configuration |
| `sentry.edge.config.ts` | Edge runtime Sentry configuration |
| `next.config.js` | Sentry webpack plugin configuration |

### API Side

| File | Description |
|------|-------------|
| `src/config/sentry.ts` | Sentry initialisation |
| `src/app.ts` | Sentry middleware setup |

### CI/CD

| File | Description |
|------|-------------|
| `.github/workflows/*.yml` | Source map upload steps |
