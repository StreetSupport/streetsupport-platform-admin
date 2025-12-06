# Street Support Platform Documentation

This directory contains comprehensive documentation for the Street Support Admin and API systems.

## 📋 Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [**Permissions System**](./PERMISSIONS.md) | Role-based access control, user creation, and authentication flow |
| [**Sentry Setup**](./SENTRY.md) | Error monitoring, alerts configuration, and dashboard access |
| [**Collection Schemas**](./COLLECTION_SCHEMAS.md) | MongoDB collection structures and field definitions |
| [**Testing Guide**](./TESTING.md) | TDD methodology, test structure, and commands |
| [**Deployment Guide**](./DEPLOYMENT.md) | CI/CD pipelines, environments, and deployment procedures |
| [**Cron Jobs & SendGrid**](./CRON_JOBS_AND_SENDGRID.md) | Background jobs and email service configuration |
| [**Validation (Zod)**](./VALIDATION.md) | Schema validation system for forms and API requests |
| [**File Uploading**](./FILE_UPLOADING.md) | Azure Blob Storage integration and file handling |

---

## 🏗️ Project Architecture

### Three-Project Structure

```
street-support-new/
├── streetsupport-platform-admin/   # Admin CMS (Next.js 15)
├── streetsupport-platform-api/     # Backend API (Express.js)
└── streetsupport-platform-web/     # Public Website (Next.js 15)
```

### Technology Stack

#### Admin (This Project)
- **Framework**: Next.js 15.3.6
- **Language**: TypeScript 5
- **UI**: React 19.0.1, Tailwind CSS 4
- **Authentication**: NextAuth with Auth0
- **Deployment**: Vercel

#### API
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: Auth0 JWT
- **Deployment**: Azure Web Services

---

## 🔐 Authentication Overview

Both Admin and API use **Auth0** for authentication with a shared user database in MongoDB.

**Flow**:
1. User authenticates via Auth0 (Admin)
2. NextAuth creates session with JWT token
3. Token includes Auth0 access token
4. Admin proxies API requests with Bearer token
5. API validates token and checks user in MongoDB
6. RBAC middleware enforces role-based access

---

## 📂 Key Directories

### Admin Project
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Core utilities (auth, API)
├── schemas/       # Zod validation schemas
├── types/         # TypeScript interfaces
├── constants/     # Role definitions, etc.
└── tests/         # Jest test files
```

### API Project
```
src/
├── controllers/   # Request handlers
├── middleware/    # Auth, upload middleware
├── models/        # Mongoose models
├── routes/        # Express routes
├── schemas/       # Zod validation schemas
├── services/      # Business logic (email, Auth0)
├── jobs/          # Cron jobs
└── types/         # TypeScript interfaces
```

---

## 🔗 Related Resources

- **GitHub Wiki**: Project-specific workarounds and guides
- **Public Website Docs**: `streetsupport-platform-web/docs/`
- **Design System**: `.windsurf/rules/` (buttons, typography, colors)

---

## 📝 Documentation Standards

### Naming Convention
- MongoDB uses **PascalCase** for collections and properties
- Admin and API use **PascalCase** for TypeScript interfaces
- Web project uses **camelCase** for data transformation

### File Format
All documentation files use Markdown with:
- Clear section headings
- Code blocks with language identifiers
- Tables for structured information
- Emoji icons for visual navigation

---

## ✅ Quick Reference

### Common Commands

```bash
# Admin - Development
npm run dev

# Admin - Run tests
npm run test

# Admin - Run linting
npm run lint

# API - Development
npm run dev

# API - Run tests
npm run test

# API - Run linting
npm run lint
```

### Important Environment Variables

| Variable | Project | Description |
|----------|---------|-------------|
| `AUTH0_CLIENT_ID` | Admin | Auth0 application client ID |
| `AUTH0_DOMAIN` | API | Auth0 tenant domain |
| `AZURE_STORAGE_CONNECTION_STRING` | API | Azure Blob Storage connection |
| `SENDGRID_API_KEY` | API | SendGrid email service API key |

See individual documentation files for complete environment variable lists.
