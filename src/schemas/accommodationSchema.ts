import { z } from 'zod';
import { ValidationResult, createValidationResult, preprocessNullableString, preprocessNullableObject } from './validationHelpers';
import { LocationCoordinatesSchema } from './organisationSchema';
import { AccommodationType, SupportOfferedType, DiscretionaryValue } from '@/types/organisations/IAccommodation';
import { isValidPostcodeFormat } from '@/utils/postcodeValidation';
import { getTextLengthFromHtml } from '@/utils/htmlUtils';

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
    'Address.AssociatedCityId': 'Associated Location',
    'PricingAndRequirementsInfo.Price': 'Price',
  };
  
  return pathMap[path] || path;
}

// Enum for discretionary values: Use nativeEnum for proper type checking
const DiscretionaryValueSchema = z.nativeEnum(DiscretionaryValue);

// Nested schemas for accommodation sections
const GeneralInfoSchema = z.object({
  Name: z.string().min(1, 'Accommodation Name is required'),
  Synopsis: z.preprocess(preprocessNullableString, z.string().optional()),
  Description: z.preprocess(preprocessNullableString, z.string().optional().refine(
    (val) => !val || getTextLengthFromHtml(val) <= 1800,
    'Description must be 1,800 characters or fewer'
  )),
  AccommodationType: z.nativeEnum(AccommodationType),
  ServiceProviderId: z.string().min(1, 'Service provider ID is required'),
  ServiceProviderName: z.string().optional(),
  IsOpenAccess: z.boolean(),
  IsPubliclyVisible: z.boolean().optional(),
  IsPublished: z.boolean().optional(),
  IsVerified: z.boolean().optional(),
});

const PricingAndRequirementsInfoSchema = z.object({
  ReferralIsRequired: z.boolean().default(false),
  ReferralNotes: z.preprocess(preprocessNullableString, z.string().optional()),
  Price: z.string().min(1, 'Price is required'),
  FoodIsIncluded: DiscretionaryValueSchema,
  AvailabilityOfMeals: z.preprocess(preprocessNullableString, z.string().optional()),
});

const ContactInformationSchema = z.object({
  Name: z.string().min(1, 'Contact name is required'),
  Email: z.string().email('Invalid email address').min(1, 'Email is required'),
  Telephone: z.preprocess(preprocessNullableString, z.string().optional()),
  AdditionalInfo: z.preprocess(preprocessNullableString, z.string().optional()),
});

const AccommodationAddressSchema = z.object({
  Street1: z.string().min(1, 'Street is required'),
  Street2: z.preprocess(preprocessNullableString, z.string().optional()),
  Street3: z.preprocess(preprocessNullableString, z.string().optional()),
  City: z.string().min(1, 'City is required'),
  Postcode: z.string().min(1, 'Postcode is required').refine((postcode) => {
    return isValidPostcodeFormat(postcode);
  }, {
    message: 'Invalid postcode format'
  }),
  Location: LocationCoordinatesSchema.optional(),
  AssociatedCityId: z.string().min(1, 'Associated Location is required'),
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
  AdditionalFeatures: z.preprocess(preprocessNullableString, z.string().optional()),
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
  SupportOffered: z.array(z.nativeEnum(SupportOfferedType)).optional(),
  SupportInfo: z.preprocess(preprocessNullableString, z.string().optional()),
});

// Accommodation schema (works for both create and update)
// Form should validate these requirements for create operations
export const AccommodationSchema = z.object({
  GeneralInfo: GeneralInfoSchema,
  PricingAndRequirementsInfo: PricingAndRequirementsInfoSchema,
  ContactInformation: ContactInformationSchema,
  Address: AccommodationAddressSchema,
  FeaturesWithDiscretionary: z.preprocess(preprocessNullableObject, FeaturesWithDiscretionarySchema.optional()),
  ResidentCriteriaInfo: z.preprocess(preprocessNullableObject, ResidentCriteriaInfoSchema.optional()),
  SupportProvidedInfo: z.preprocess(preprocessNullableObject, SupportProvidedInfoSchema.optional()),
});

// Validation function
export function validateAccommodation(data: unknown): ValidationResult<z.infer<typeof AccommodationSchema>> {
  const result = AccommodationSchema.safeParse(data);
  return createValidationResult(result);
}
