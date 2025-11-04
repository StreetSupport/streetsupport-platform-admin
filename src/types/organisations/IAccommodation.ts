// Discretionary Values: 0 = No, 1 = Yes, 2 = Don't Know/Ask
export enum DiscretionaryValue {
  No = 0,
  Yes = 1,
  DontKnowAsk = 2
}

// Discretionary Options for Dropdowns
export const DISCRETIONARY_OPTIONS = [
  { value: DiscretionaryValue.No, label: 'No' },
  { value: DiscretionaryValue.Yes, label: 'Yes' },
  { value: DiscretionaryValue.DontKnowAsk, label: "Don't Know / Ask" }
];

// Accommodation Type Enum
export enum AccommodationType {
  EMERGENCY = 'emergency',
  HOSTELS = 'hostel',
  HOSTED = 'hosted',
  RENTED = 'rented',
  SUPPORTED = 'supported',
  SOCIAL_HOUSING = 'social',
  NIGHT_SHELTER = 'shelter',
  LETTINGS_AGENCIES = 'lettings-agencies',
  BNBS = 'b-and-bs'
}

// Accommodation Type Options for Dropdown
export const ACCOMMODATION_TYPES = [
  { value: AccommodationType.EMERGENCY, label: 'Emergency' },
  { value: AccommodationType.HOSTELS, label: 'Hostels' },
  { value: AccommodationType.HOSTED, label: 'Hosted' },
  { value: AccommodationType.RENTED, label: 'Rented' },
  { value: AccommodationType.SUPPORTED, label: 'Supported' },
  { value: AccommodationType.SOCIAL_HOUSING, label: 'Social Housing' },
  { value: AccommodationType.NIGHT_SHELTER, label: 'Night shelter' },
  { value: AccommodationType.LETTINGS_AGENCIES, label: 'Lettings Agencies' },
  { value: AccommodationType.BNBS, label: 'B&Bs' }
] as const;

// Support Offered Enum
export enum SupportOfferedType {
  ALCOHOL = 'alcohol',
  DOMESTIC_VIOLENCE = 'domestic violence',
  MENTAL_HEALTH = 'mental health',
  PHYSICAL_HEALTH = 'physical health',
  DRUG_DEPENDENCY = 'substances'
}

// Support Offered Options
export const SUPPORT_OFFERED_OPTIONS = [
  { value: SupportOfferedType.ALCOHOL, label: 'Alcohol' },
  { value: SupportOfferedType.DOMESTIC_VIOLENCE, label: 'Domestic Violence' },
  { value: SupportOfferedType.MENTAL_HEALTH, label: 'Mental Health' },
  { value: SupportOfferedType.PHYSICAL_HEALTH, label: 'Physical Health' },
  { value: SupportOfferedType.DRUG_DEPENDENCY, label: 'Drug Dependency' }
] as const;

export interface IAccommodation {
  _id: string;
  DocumentCreationDate: Date;
  DocumentModifiedDate: Date;
  CreatedBy: string;
  GeneralInfo: {
    Name: string;
    Synopsis?: string;
    Description?: string;
    AccommodationType: AccommodationType;
    // We have this field in the DB but we use another field SupportProvidedInfo.SupportOffered on WEB.
    // SupportOffered: string[];
    ServiceProviderId: string;
    ServiceProviderName?: string;
    IsOpenAccess: boolean;
    IsPubliclyVisible?: boolean;
    IsPublished?: boolean;
    IsVerified?: boolean;
  };
  PricingAndRequirementsInfo: {
    ReferralIsRequired: boolean;
    ReferralNotes?: string;
    Price: string;
    FoodIsIncluded: DiscretionaryValue;
    AvailabilityOfMeals?: string;
  };
  ContactInformation: {
    Name: string;
    Email: string;
    Telephone?: string;
    AdditionalInfo?: string;
  };
  Address: {
    Street1: string;
    Street2?: string;
    Street3?: string;
    City: string;
    Postcode: string;
    Location?: {
      type: string;
      coordinates: [number, number];
    };
    AssociatedCityId: string;
    // We have these fields i nthe database but we don't need them
    // PublicTransportInfo: string;
    // NearestSupportProviderId: string;
    // IsPubliclyHidden: boolean;
  };
  FeaturesWithDiscretionary: {
    AcceptsHousingBenefit?: DiscretionaryValue;
    AcceptsPets?: DiscretionaryValue;
    AcceptsCouples?: DiscretionaryValue;
    HasDisabledAccess?: DiscretionaryValue;
    IsSuitableForWomen?: DiscretionaryValue;
    IsSuitableForYoungPeople?: DiscretionaryValue;
    HasSingleRooms?: DiscretionaryValue;
    HasSharedRooms?: DiscretionaryValue;
    HasShowerBathroomFacilities?: DiscretionaryValue;
    HasAccessToKitchen?: DiscretionaryValue;
    HasLaundryFacilities?: DiscretionaryValue;
    HasLounge?: DiscretionaryValue;
    AllowsVisitors?: DiscretionaryValue;
    HasOnSiteManager?: DiscretionaryValue;
    AdditionalFeatures?: string;
  };
  ResidentCriteriaInfo: {
    AcceptsMen?: boolean;
    AcceptsWomen?: boolean;
    AcceptsCouples?: boolean;
    AcceptsYoungPeople?: boolean;
    AcceptsFamilies?: boolean;
    AcceptsBenefitsClaimants?: boolean;
  };
  SupportProvidedInfo: {
    HasOnSiteManager?: DiscretionaryValue;
    SupportOffered?: SupportOfferedType[];
    SupportInfo?: string;
  };
}

// Form data interface for creating/editing accommodations
export interface IAccommodationFormData extends Omit<IAccommodation, '_id' | 'DocumentCreationDate' | 'DocumentModifiedDate' | 'CreatedBy'> {
}