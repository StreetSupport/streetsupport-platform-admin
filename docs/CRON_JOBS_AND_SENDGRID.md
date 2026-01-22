# Cron Jobs and SendGrid Configuration

This document describes the background jobs (cron tasks) and email service configuration using SendGrid.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Cron Jobs](#cron-jobs)
3. [SendGrid Email Service](#sendgrid-email-service)
4. [Email Templates](#email-templates)
5. [Environment Variables](#environment-variables)
6. [Related Files](#related-files)

---

## Overview

The API uses:
- **node-cron** for scheduling background jobs
- **SendGrid** for transactional email delivery

### Key Functions

| Job | Schedule | Purpose |
|-----|----------|---------|
| Verification Check | Daily 9 AM | Send reminders, unverify stale organisations |
| Banner Activation | Daily 00:05 AM | Activate/deactivate scheduled banners |
| SWEP Activation | Daily 00:00 AM | Track SWEP banner activation times |
| Organisation Disabling | Daily 00:10 AM  | Handle extended inactivity |

---

## Cron Jobs

### 1. Organisation Verification Job

**File**: `src/jobs/verificationOrganisationJob.ts`
**Schedule**: `0 9 * * *` (Daily at 9:00 AM)

**Purpose**: 
- Send reminder emails at 90 days of inactivity
- Mark organisations as unverified after 100 days

**Flow**:
```
1. Find organisations with selected administrators
2. Calculate days since DocumentModifiedDate
3. If 90 days → Send reminder email
4. If 100+ days & IsVerified → 
   - Set IsVerified = false
   - Update related services to unverified
   - Send expiration email
```

**Code**:
```typescript
export function startVerificationJob() {
  cron.schedule('0 9 * * *', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const organisations = await Organisation.find({
      'Administrators.IsSelected': true
    });

    for (const org of organisations) {
      const lastUpdate = new Date(org.DocumentModifiedDate);
      const daysSinceUpdate = Math.floor(
        (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const email = org.Administrators.find(a => a.IsSelected)?.Email || org.Email;
      
      // 90 days - send reminder
      if (daysSinceUpdate === 90) {
        await sendVerificationReminderEmail(email, org.Name, daysSinceUpdate);
      }
      
      // 100+ days - unverify
      if (daysSinceUpdate >= 100 && org.IsVerified) {
        org.IsVerified = false;
        await org.save();
        await updateRelatedServices(org.Key, { IsVerified: false });
        await sendVerificationExpiredEmail(email, org.Name);
      }
    }
  });
}
```

### 2. Banner Activation Job

**File**: `src/jobs/bannerActivationJob.ts`  
**Schedule**: `5 0 * * *` (Run daily at 00:05)

**Purpose**: 
- Activate banners when StartDate is reached
- Deactivate banners when EndDate is passed

**Flow**:
```
1. Find banners where IsActive differs from expected state
2. Based on StartDate and EndDate:
   - Activate if StartDate <= now and EndDate > now
   - Deactivate if EndDate <= now
3. Update IsActive accordingly
```

**Code**:
```typescript
export function startBannerActivationJob() {
  cron.schedule('5 0 * * *', async () => {
    const now = new Date();
    
    // Activate banners that should be active
    await Banner.updateMany(
      {
        IsActive: false,
        StartDate: { $lte: now },
        $or: [
          { EndDate: { $gt: now } },
          { EndDate: { $exists: false } }
        ]
      },
      { $set: { IsActive: true, DocumentModifiedDate: now } }
    );
    
    // Deactivate banners that should be inactive
    await Banner.updateMany(
      {
        IsActive: true,
        EndDate: { $lte: now }
      },
      { $set: { IsActive: false, DocumentModifiedDate: now } }
    );
  });
}
```

### 3. SWEP Activation Job

**File**: `src/jobs/swepActivationJob.ts`  
**Schedule**: `0 0 * * *` (Run daily at 00:00)

**Purpose**: 
- Track when SWEP banners are activated/deactivated
- Set `SwepActiveFrom` and `SwepActiveUntil` timestamps

**Flow**:
```
1. Check SWEP banner status changes
2. When activated: Set SwepActiveFrom = now
3. When deactivated: Set SwepActiveUntil = now
```

### 4. Organisation Disabling Job

**File**: `src/jobs/disablingOrganisationJob.ts`  
**Schedule**: `10 0 * * *` (Run daily at 00:10)

**Purpose**: 
- Handle organisations that have been unverified for extended periods
- May unpublish or disable after additional time

---

## SendGrid Email Service

**File**: `src/services/emailService.ts`

### Service Configuration

```typescript
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@streetsupport.net';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}
```

### Email Functions

#### 1. Verification Reminder Email

Sent at 90 days of organisation inactivity.

```typescript
export async function sendVerificationReminderEmail(
  toEmail: string,
  organisationName: string,
  daysInactive: number
): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    const msg = {
      to: toEmail,
      from: FROM_EMAIL,
      templateId: SENDGRID_ORG_UPDATE_NOTIFICATION_REMINDER_TEMPLATE_ID,
      dynamicTemplateData: {
        org_name: organisationName,
        days_inactive: daysInactive,
        login_url: LOGIN_URL
      }
    };
    
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending verification reminder:', error);
    return false;
  }
}
```

#### 2. Verification Expired Email

Sent when organisation becomes unverified (100+ days inactive).

```typescript
export async function sendVerificationExpiredEmail(
  toEmail: string,
  organisationName: string
): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    const msg = {
      to: toEmail,
      from: FROM_EMAIL,
      templateId: SENDGRID_ORG_VERIFICATION_EXPIRED_NOTIFICATION_TEMPLATE_ID,
      dynamicTemplateData: {
        org_name: organisationName,
        login_url: LOGIN_URL
      }
    };
    
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending verification expired email:', error);
    return false;
  }
}
```

---

## Email Templates

Email templates are managed in SendGrid Dashboard.

### Template Variables

Templates use dynamic data passed from the API:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{org_name}}` | Organisation name | "Shelter Manchester" |
| `{{days_inactive}}` | Days since last update | 90 |
| `{{login_url}}` | Admin panel URL | "https://admin.streetsupport.net" |

### Configuring Templates in SendGrid

1. Go to **SendGrid Dashboard** → **Email API** → **Dynamic Templates**
2. Create new template
3. Add design using drag-and-drop or code editor
4. Insert handlebars variables: `{{variable_name}}`
5. Save and copy Template ID
6. Add Template ID to environment variables

### Template IDs

| Template | Environment Variable |
|----------|---------------------|
| Reminder (90 days) | `SENDGRID_ORG_UPDATE_NOTIFICATION_REMINDER_TEMPLATE_ID` |
| Expired (100 days) | `SENDGRID_ORG_VERIFICATION_EXPIRED_NOTIFICATION_TEMPLATE_ID` |

---

## Environment Variables

### API Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SENDGRID_API_KEY` | SendGrid API key | SendGrid → Settings → API Keys |
| `FROM_EMAIL` | Sender email address | Your verified sender email |
| `SENDGRID_ORG_UPDATE_NOTIFICATION_REMINDER_TEMPLATE_ID` | Reminder template ID | SendGrid → Dynamic Templates |
| `SENDGRID_ORG_VERIFICATION_EXPIRED_NOTIFICATION_TEMPLATE_ID` | Expired template ID | SendGrid → Dynamic Templates |
| `ADMIN_URL` | Admin panel URL | Your deployment URL |

### Getting SendGrid API Key

1. Log in to [SendGrid](https://app.sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Select **Restricted Access**
5. Enable **Mail Send** permissions
6. Copy the key (shown only once!)

### Sender Verification

Before sending emails:
1. Go to **Settings** → **Sender Authentication**
2. Add and verify your sender email/domain
3. Use verified email in `FROM_EMAIL`

---

## Starting Jobs

Jobs are started when the API server initialises:

```typescript
// src/app.ts or src/index.ts
import { startVerificationJob } from './jobs/verificationOrganisationJob.js';
import { startBannerActivationJob } from './jobs/bannerActivationJob.js';
import { startSwepActivationJob } from './jobs/swepActivationJob.js';
import { startDisablingOrganisationJob } from './jobs/disablingOrganisationJob.js';

// Start background jobs
startVerificationJob();
startBannerActivationJob();
startSwepActivationJob();
startDisablingOrganisationJob();
```

### Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, Sunday=0 or 7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

**Common Patterns**:

| Pattern | Description |
|---------|-------------|
| `0 9 * * *` | Daily at 9:00 AM |
| `*/5 * * * *` | Every 5 minutes |
| `0 0 * * *` | Daily at midnight |
| `0 */6 * * *` | Every 6 hours |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |

---

## Testing Jobs

### Manual Test Execution

For testing, you can run jobs immediately:

```typescript
// verificationOrganisationJob.ts
export async function runVerificationCheckNow() {
  // Same logic as scheduled job
  // Returns statistics about the check
  const stats = {
    total: 0,
    needsReminder: 0,
    needsUnverify: 0,
    alreadyUnverified: 0
  };
  
  // ... job logic ...
  
  return stats;
}
```

### Testing Email Delivery

1. Set up a test email in SendGrid
2. Use test template with sandbox mode
3. Verify email appears in SendGrid Activity Feed
4. Check recipient receives email

---

## Monitoring

### Job Execution Logging

Jobs log their execution:

```typescript
console.log(`Verification check completed:
  - Organisations checked: ${organisations.length}
  - Reminders sent: ${remindersCount}
  - Organisations unverified: ${unverifiedCount}
  - Errors: ${errors.length}
`);
```

### SendGrid Activity

Monitor email delivery in:
- **SendGrid Dashboard** → **Activity** → **Activity Feed**
- Filter by date, status, recipient

### Error Handling

Jobs catch and log errors without crashing:

```typescript
try {
  // Job logic
} catch (error) {
  console.error('Fatal error in verification job:', error);
  // Job continues to run on schedule
}
```

---

## Related Files

### API Side

| File | Description |
|------|-------------|
| `src/jobs/verificationOrganisationJob.ts` | Organisation verification job |
| `src/jobs/bannerActivationJob.ts` | Banner activation job |
| `src/jobs/swepActivationJob.ts` | SWEP activation job |
| `src/jobs/disablingOrganisationJob.ts` | Organisation disabling job |
| `src/services/emailService.ts` | SendGrid email service |
| `src/app.ts` | Job initialisation |

### Configuration

| Location | Description |
|----------|-------------|
| Azure App Settings | Production environment variables |
| `.env` file | Local development variables |
| SendGrid Dashboard | Email templates |
