import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';
import { LocationCoordinatesSchema } from './organisationSchema';
import { AccommodationType, SupportOfferedType, DiscretionaryValue } from '@/types/organisations/IAccommodation';

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  const pathMap: Record<string, string> = {
    'GeneralInfo.Name': 'Accommodation Name',
    'GeneralInfo.AccommodationType': 'Accommodation Type',
    'ContactInformation.Name': 'Contact Name',
    'ContactInformation.Email': 'Email',
    'Address.Street1': 'Street',
    'Address.City': 'City',
    'Address.Postcode': 'Postcode',
    'Address.AssociatedCityId': 'Associated Location'
  };
  
  return pathMap[path] || path;
}

// Enum for discretionary values: Use nativeEnum for proper type checking
const DiscretionaryValueSchema = z.nativeEnum(DiscretionaryValue);

// Nested schemas for accommodation sections
const GeneralInfoSchema = z.object({
  Name: z.string().min(1, 'Accommodation Name is required'),
  Synopsis: z.string().optional(),
  Description: z.string().optional(),
  AccommodationType: z.nativeEnum(AccommodationType),
  ServiceProviderId: z.string().min(1, 'Service provider ID is required'),
  IsOpenAccess: z.boolean(),
  IsPubliclyVisible: z.boolean().optional(),
  IsPublished: z.boolean().optional(),
});

const PricingAndRequirementsInfoSchema = z.object({
  ReferralIsRequired: z.boolean().default(false),
  ReferralNotes: z.string().optional(),
  Price: z.string().min(1, 'Price is required'),
  FoodIsIncluded: DiscretionaryValueSchema,
  AvailabilityOfMeals: z.string().optional(),
});

const ContactInformationSchema = z.object({
  Name: z.string().min(1, 'Contact name is required'),
  Email: z.string().email('Invalid email address').min(1, 'Email is required'),
  Telephone: z.string().optional(),
  AdditionalInfo: z.string().optional(),
});

const AccommodationAddressSchema = z.object({
  Street1: z.string().min(1, 'Street is required'),
  Street2: z.string().optional(),
  Street3: z.string().optional(),
  City: z.string().min(1, 'City is required'),
  Postcode: z.string().min(1, 'Postcode is required'),
  Location: LocationCoordinatesSchema.optional(),
  AssociatedCityId: z.string().min(1, 'Associated city ID is required'),
});

const FeaturesWithDiscretionarySchema = z.object({
  AcceptsHousingBenefit: DiscretionaryValueSchema.optional(),
  AcceptsPets: DiscretionaryValueSchema.optional(),
  AcceptsCouples: DiscretionaryValueSchema.optional(),
  HasDisabledAccess: DiscretionaryValueSchema.optional(),
  IsSuitableForWomen: DiscretionaryValueSchema.optional(),
  IsSuitableForYoungPeople: DiscretionaryValueSchema.optional(),
  HasSingleRooms: DiscretionaryValueSchema.optional(),
  HasSharedRooms: DiscretionaryValueSchema.optional(),
  HasShowerBathroomFacilities: DiscretionaryValueSchema.optional(),
  HasAccessToKitchen: DiscretionaryValueSchema.optional(),
  HasLaundryFacilities: DiscretionaryValueSchema.optional(),
  HasLounge: DiscretionaryValueSchema.optional(),
  AllowsVisitors: DiscretionaryValueSchema.optional(),
  HasOnSiteManager: DiscretionaryValueSchema.optional(),
  AdditionalFeatures: z.string().optional(),
});

const ResidentCriteriaInfoSchema = z.object({
  AcceptsMen: z.boolean().optional(),
  AcceptsWomen: z.boolean().optional(),
  AcceptsCouples: z.boolean().optional(),
  AcceptsYoungPeople: z.boolean().optional(),
  AcceptsFamilies: z.boolean().optional(),
  AcceptsBenefitsClaimants: z.boolean().optional(),
});

const SupportProvidedInfoSchema = z.object({
  HasOnSiteManager: DiscretionaryValueSchema.optional(),
  SupportOffered: z.array(z.nativeEnum(SupportOfferedType)).optional(),
  SupportInfo: z.string().optional(),
});

// Accommodation schema (works for both create and update)
// Form should validate these requirements for create operations
export const AccommodationSchema = z.object({
  GeneralInfo: GeneralInfoSchema,
  PricingAndRequirementsInfo: PricingAndRequirementsInfoSchema,
  ContactInformation: ContactInformationSchema,
  Address: AccommodationAddressSchema,
  FeaturesWithDiscretionary: FeaturesWithDiscretionarySchema.optional(),
  ResidentCriteriaInfo: ResidentCriteriaInfoSchema.optional(),
  SupportProvidedInfo: SupportProvidedInfoSchema.optional(),
});

// Validation function
export function validateAccommodation(data: unknown): ValidationResult<z.infer<typeof AccommodationSchema>> {
  const result = AccommodationSchema.safeParse(data);
  return createValidationResult(result);
}
