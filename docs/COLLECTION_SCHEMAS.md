# MongoDB Collection Schemas

This document describes all MongoDB collections used in the Street Support platform, including field definitions, types, and indexes.

---

## 📋 Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Common Fields](#common-fields)
3. [Collections Overview](#collections-overview)
4. [Users Collection](#users-collection)
5. [ServiceProviders Collection](#serviceproviders-collection)
6. [Cities Collection](#cities-collection)
7. [Banners Collection](#banners-collection)
8. [Faqs Collection](#faqs-collection)
9. [GroupedServices Collection](#groupedservices-collection)
10. [TemporaryAccommodation Collection](#temporaryaccommodation-collection)
11. [SwepBanners Collection](#swepbanners-collection)
12. [LocationLogos Collection](#locationlogos-collection)
13. [Resources Collection](#resources-collection)
14. [ServiceCategories Collection](#servicecategories-collection)
15. [ArchivedUsers Collection](#archivedusers-collection)

---

## Naming Conventions

### Important Note

| Context | Convention | Example |
|---------|------------|---------|
| **MongoDB Collections** | PascalCase | `ServiceProviders`, `TemporaryAccommodation` |
| **MongoDB Properties** | PascalCase | `DocumentCreationDate`, `AssociatedLocationIds` |
| **Admin TypeScript** | PascalCase | `IOrganisation`, `IBanner` |
| **API TypeScript** | PascalCase | `IUser`, `ICity` |
| **Web (Public)** | camelCase | `serviceProvider`, `associatedLocationIds` |

The Web project transforms PascalCase to camelCase when fetching from the API.

---

## Common Fields

Most collections include these standard document metadata fields:

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  DocumentCreationDate: Date,       // When document was created (default: Date.now)
  DocumentModifiedDate: Date,       // When document was last modified (default: Date.now)
  CreatedBy: String,                // User ID who created the document
}
```

---

## Collections Overview

| Collection | Model Name | Description |
|------------|------------|-------------|
| `Users` | User | Admin panel users |
| `ServiceProviders` | Organisation | Organisations/charities |
| `Cities` | City | Geographic locations |
| `Banners` | Banner | Campaign banners |
| `Faqs` | Faq | Advice articles |
| `GroupedServices` | GroupedService | Services provided by organisations |
| `TemporaryAccommodation` | Accommodation | Accommodation listings |
| `SwepBanners` | SwepBanner | SWEP emergency banners |
| `LocationLogos` | LocationLogo | City/location logos |
| `Resources` | Resource | Downloadable resources |
| `ServiceCategories` | ServiceCategory | Service category taxonomy |
| `ArchivedUsers` | ArchivedUser | Soft-deleted users |

---

## Users Collection

**Collection Name**: `Users`  
**Model**: `userModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,               // Required
  UserName: String,                // Optional - display name
  AuthClaims: [String],            // Array of role claims
  Email: Buffer,                   // Encrypted email (AES)
  Auth0Id: String,                 // Unique - links to Auth0 user
  AssociatedProviderLocationIds: [String],  // Location IDs for access
  IsActive: Boolean                // Default: true
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UserName` | String | No | Display name for the user |
| `AuthClaims` | [String] | No | Role claims (e.g., `['SuperAdmin']`, `['CityAdmin', 'CityAdminFor:manchester']`) |
| `Email` | Buffer | Yes | AES-encrypted email address |
| `Auth0Id` | String | Yes | Auth0 user ID (without `auth0|` prefix), unique |
| `AssociatedProviderLocationIds` | [String] | No | Location slugs user has access to |
| `IsActive` | Boolean | No | Whether user can log in (default: true) |

### Indexes

- `Auth0Id`: Unique index (defined in schema)

---

## ServiceProviders Collection

**Collection Name**: `ServiceProviders`  
**Model**: `organisationModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  Key: String,                     // Unique - URL-friendly identifier
  AssociatedLocationIds: [String], // Required - at least one location
  Name: String,                    // Required
  ShortDescription: String,        // Required
  Description: String,             // Required
  IsVerified: Boolean,             // Required
  IsPublished: Boolean,            // Required
  Tags: String,                    // Comma-separated tags
  Email: String,
  Telephone: String,
  Website: String,
  Facebook: String,
  Twitter: String,
  Bluesky: String,
  Addresses: [AddressSchema],      // Physical locations
  Notes: [NoteSchema],             // Internal notes
  Administrators: [AdministratorSchema]  // Org admins
}
```

### Nested Schemas

**AddressSchema**:
```typescript
{
  Key: String,
  Name: String,
  Street1: String,
  Street2: String,
  Street3: String,
  City: String,
  Postcode: String,
  Location: {
    type: 'Point',
    coordinates: [Number, Number]  // [longitude, latitude]
  },
  IsOpen247: Boolean,
  IsAppointmentOnly: Boolean,
  OpeningTimes: [{
    Day: Number,        // 0-6 (Sunday-Saturday)
    StartTime: Number,  // HHMM format (e.g., 900 for 09:00)
    EndTime: Number     // HHMM format (e.g., 1700 for 17:00)
  }],
  Telephone: String,
  Email: String
}
```

**AdministratorSchema**:
```typescript
{
  Email: String,
  IsSelected: Boolean  // Primary admin for verification emails
}
```

### Indexes

| Index | Fields | Options |
|-------|--------|---------|
| Name | `{ Name: 1 }` | - |
| Published + Locations | `{ IsPublished: 1, AssociatedLocationIds: 1 }` | - |
| Key | `{ Key: 1 }` | Unique |
| Locations + Name | `{ AssociatedLocationIds: 1, Name: 1 }` | - |
| Published + Creation | `{ IsPublished: 1, DocumentCreationDate: -1 }` | - |
| City ID | `{ AssociatedCityId: 1 }` | - |

---

## Cities Collection

**Collection Name**: `Cities`  
**Model**: `cityModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,               // Required
  Name: String,                    // Required - display name
  Key: String,                     // Required - URL slug (e.g., 'manchester')
  PostcodeOfCentre: String,        // Required
  Longitude: Number,               // Required
  Latitude: Number,                // Required
  SwepIsAvailable: Boolean,        // Required
  IsOpenToRegistrations: Boolean,  // Required
  IsPublic: Boolean,               // Required
  Location: {                      // Required - GeoJSON
    type: 'Point',
    coordinates: [Number, Number]
  },
  ToolkitIsEnabled: Boolean,
  CharterIsEnabled: Boolean,
  BigChangeIsEnabled: Boolean,
  RealChangeIsEnabled: Boolean,
  RealChangeUrl: String,
  RealChangeTitle: String,
  AbenIsEnabled: Boolean,
  HomePageStats: [String]
}
```

### Indexes

| Index | Fields | Options |
|-------|--------|---------|
| Location | `{ Location: '2dsphere' }` | Geospatial index |

---

## Banners Collection

**Collection Name**: `Banners`  
**Model**: `bannerModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,               // Required
  
  // Core Content
  Title: String,                   // Required, max 50 chars
  Description: String,             // Optional, max 200 chars
  Subtitle: String,                // Optional, max 50 chars
  TemplateType: String,            // Required - enum: 'giving-campaign', 'partnership-charter', 'resource-project'
  
  // Media
  Logo: MediaAssetSchema,
  BackgroundImage: MediaAssetSchema,
  MainImage: MediaAssetSchema,     // For split layouts
  
  // Actions
  CtaButtons: [{
    Label: String,                 // Required, max 20 chars
    Url: String,                   // Required
    Variant: String,               // Enum: 'primary', 'secondary', 'tertiary'
    External: Boolean,
    AutomaticallyPopulatedUrl: Boolean
  }],
  
  // Styling
  Background: {
    Type: String,                  // Enum: 'solid', 'gradient', 'image'
    Value: String,                 // Required
    Overlay: {
      Colour: String,
      Opacity: Number              // 0-1
    }
  },
  TextColour: String,              // Enum: 'light', 'dark'
  LayoutStyle: String,             // Enum: 'full-width', 'split', 'centered'
  
  // Scheduling
  StartDate: Date,
  EndDate: Date,
  BadgeText: String,               // Max 50 chars
  
  // Template-specific (Giving Campaign)
  GivingCampaign: {
    UrgencyLevel: String,          // Enum: 'low', 'medium', 'high', 'critical'
    CampaignEndDate: Date,
    DonationGoal: {
      Target: Number,
      Current: Number,
      Currency: String             // 3-letter code (default: 'GBP')
    }
  },
  
  // Template-specific (Partnership Charter)
  PartnershipCharter: {
    PartnerLogos: [MediaAssetSchema],  // Max 5
    CharterType: String,               // Enum: 'mayors-charter', 'business-charter', 'community-charter'
    SignatoriesCount: Number
  },
  
  // Template-specific (Resource Project)
  ResourceProject: {
    ResourceFile: {
      FileUrl: String,             // Required
      FileName: String,            // Required
      ResourceType: String,        // Enum: 'guide', 'toolkit', 'report', 'template'
      LastUpdated: Date,
      FileSize: String,
      FileType: String
    }
  },
  
  // CMS Metadata
  IsActive: Boolean,               // Default: true
  LocationSlug: String,            // Required
  LocationName: String,
  Priority: Number,                // 1-10, default: 5
  TrackingContext: String,
  AnalyticsId: String
}
```

### MediaAssetSchema

```typescript
{
  Url: String,
  Alt: String,
  Width: Number,
  Height: Number,
  Filename: String,
  Size: Number,
  MimeType: String
}
```

### Indexes

| Index | Fields | Options |
|-------|--------|---------|
| Active + Priority | `{ IsActive: 1, Priority: -1, DocumentCreationDate: -1 }` | - |
| Location + Active | `{ LocationSlug: 1, IsActive: 1 }` | - |
| Template + Active | `{ TemplateType: 1, IsActive: 1 }` | - |
| Created By | `{ CreatedBy: 1 }` | - |

---

## Faqs Collection

**Collection Name**: `Faqs`  
**Model**: `faqsModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  Body: String,                    // HTML content
  LocationKey: String,             // Location slug or 'general'
  ParentScenario: String,          // Category/scenario
  SortPosition: Number,            // Display order
  Tags: [String],                  // Search tags
  Title: String                    // Required
}
```

---

## GroupedServices Collection

**Collection Name**: `GroupedServices`  
**Model**: `groupedServiceModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  CategoryId: String,              // Service category
  SubCategoryIds: [String],        // Service subcategories
  ClientGroupIds: [String],        // Target demographics
  ProviderId: String,              // Organisation Key
  Title: String,                   // Required
  Info: String,                    // Description
  LocationDescription: String,
  OpeningTimes: [{
    Day: Number,
    StartTime: Number,
    EndTime: Number
  }],
  Address: {
    Key: String,
    Name: String,
    Street1: String,
    Street2: String,
    Street3: String,
    City: String,
    Postcode: String,
    Location: {
      type: 'Point',
      coordinates: [Number, Number]
    },
    Telephone: String,
    Email: String
  },
  Telephone: String,
  Email: String,
  Website: String,
  ReferralUrl: String,
  Tags: [String],
  IsPublished: Boolean,
  IsVerified: Boolean
}
```

### Indexes

| Index | Fields | Options |
|-------|--------|---------|
| Provider | `{ ProviderId: 1 }` | - |
| Category | `{ CategoryId: 1 }` | - |
| Location | `{ 'Address.Location': '2dsphere' }` | Geospatial |
| Published + Provider | `{ IsPublished: 1, ProviderId: 1 }` | - |

---

## TemporaryAccommodation Collection

**Collection Name**: `TemporaryAccommodation`  
**Model**: `accommodationModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  
  GeneralInfo: {
    Name: String,                  // Required
    Synopsis: String,
    Description: String,
    AccommodationType: String,     // Required
    ServiceProviderId: String,     // Required - Organisation Key
    ServiceProviderName: String,
    IsOpenAccess: Boolean,         // Required
    IsPubliclyVisible: Boolean,
    IsPublished: Boolean,
    IsVerified: Boolean
  },
  
  PricingAndRequirementsInfo: {
    ReferralIsRequired: Boolean,   // Required
    ReferralNotes: String,
    Price: String,                 // Required
    FoodIsIncluded: Number,        // 0=No, 1=Yes, 2=Don't Know
    AvailabilityOfMeals: String
  },
  
  ContactInformation: {
    Name: String,
    Email: String,
    Telephone: String,
    AdditionalInfo: String
  },
  
  Address: {
    Street1: String,
    Street2: String,
    Street3: String,
    City: String,
    Postcode: String,
    Location: {
      type: 'Point',
      coordinates: [Number, Number]
    },
    AssociatedCityId: String       // Location slug
  },
  
  FeaturesWithDiscretionary: {
    // All use discretionary values: 0=No, 1=Yes, 2=Don't Know
    AcceptsHousingBenefit: Number,
    AcceptsPets: Number,
    AcceptsCouples: Number,
    HasDisabledAccess: Number,
    IsSuitableForWomen: Number,
    IsSuitableForYoungPeople: Number,
    HasSingleRooms: Number,
    HasSharedRooms: Number,
    HasShowerBathroomFacilities: Number,
    HasAccessToKitchen: Number,
    HasLaundryFacilities: Number,
    HasLounge: Number,
    AllowsVisitors: Number,
    HasOnSiteManager: Number,
    AdditionalFeatures: String
  },
  
  ResidentCriteriaInfo: {
    AcceptsMen: Boolean,
    AcceptsWomen: Boolean,
    AcceptsCouples: Boolean,
    AcceptsYoungPeople: Boolean,
    AcceptsFamilies: Boolean,
    AcceptsBenefitsClaimants: Boolean
  },
  
  SupportProvidedInfo: {
    SupportOffered: [String],
    SupportInfo: String
  }
}
```

### Indexes

| Index | Fields |
|-------|--------|
| Provider + Name | `{ 'GeneralInfo.ServiceProviderId': 1, 'GeneralInfo.Name': 1 }` |
| Provider + Visible + Name | `{ 'GeneralInfo.ServiceProviderId': 1, 'GeneralInfo.IsPubliclyVisible': 1, 'GeneralInfo.Name': 1 }` |
| City + Name | `{ 'Address.AssociatedCityId': 1, 'GeneralInfo.Name': 1 }` |
| Location | `{ 'Address.Location': '2dsphere' }` |
| Name (desc) | `{ 'GeneralInfo.Name': -1 }` |
| Visible + Name | `{ 'GeneralInfo.IsPubliclyVisible': 1, 'GeneralInfo.Name': -1 }` |

---

## SwepBanners Collection

**Collection Name**: `SwepBanners`  
**Model**: `swepModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  LocationSlug: String,            // Required - unique per location
  Title: String,                   // Required
  Body: String,                    // HTML content
  Image: {
    Url: String,
    Alt: String,
    Filename: String,
    Size: Number,
    MimeType: String
  },
  IsActive: Boolean,
  SwepActiveFrom: Date,            // When SWEP was last activated
  SwepActiveUntil: Date            // When SWEP was last deactivated
}
```

---

## LocationLogos Collection

**Collection Name**: `LocationLogos`  
**Model**: `locationLogosModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  LocationSlug: String,            // Required - unique per location
  LogoPath: String,                // Azure Blob URL
  IsActive: Boolean                // Default: true
}
```

---

## Resources Collection

**Collection Name**: `Resources`  
**Model**: `resourceModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  CreatedBy: String,
  Title: String,                   // Required
  Description: String,
  LocationSlug: String,            // Required
  Category: String,
  IsPublished: Boolean,
  LinkList: [{
    Title: String,
    List: [{
      Name: String,
      Url: String                  // Azure Blob URL for uploaded files
    }]
  }]
}
```

---

## ServiceCategories Collection

**Collection Name**: `ServiceCategories`  
**Model**: `serviceCategoryModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  Key: String,                     // Unique identifier
  Name: String,                    // Display name
  SortOrder: Number,               // Display order
  SubCategories: [{
    Key: String,
    Name: String,
    SortOrder: Number
  }]
}
```

---

## ArchivedUsers Collection

**Collection Name**: `ArchivedUsers`  
**Model**: `archivedUserModel.ts`

### Schema

```typescript
{
  _id: ObjectId,
  DocumentCreationDate: Date,
  DocumentModifiedDate: Date,
  OriginalUserId: String,          // Reference to original user
  UserName: String,
  Email: Buffer,                   // Encrypted
  Auth0Id: String,
  AuthClaims: [String],
  ArchivedDate: Date,              // When user was archived
  ArchivedBy: String               // Who archived the user
}
```

---

## Related Files

### API Side

| File | Description |
|------|-------------|
| `src/models/userModel.ts` | Users collection |
| `src/models/organisationModel.ts` | ServiceProviders collection |
| `src/models/cityModel.ts` | Cities collection |
| `src/models/bannerModel.ts` | Banners collection |
| `src/models/faqsModel.ts` | Faqs collection |
| `src/models/groupedServiceModel.ts` | GroupedServices collection |
| `src/models/accommodationModel.ts` | TemporaryAccommodation collection |
| `src/models/swepModel.ts` | SwepBanners collection |
| `src/models/locationLogosModel.ts` | LocationLogos collection |
| `src/models/resourceModel.ts` | Resources collection |
| `src/models/serviceCategoryModel.ts` | ServiceCategories collection |
| `src/models/archivedUserModel.ts` | ArchivedUsers collection |
| `src/types/` | TypeScript interfaces for all schemas |
