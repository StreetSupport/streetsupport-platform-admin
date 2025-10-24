export interface IAccommodation {
  _id: string;
  GeneralInfo: {
    Name: string;
    Synopsis?: string;
    Description?: string;
    AccommodationType: string;
    // We have this field in the DB but we use another field SupportProvidedInfo.SupportOffered on WEB.
    // SupportOffered: string[];
    ServiceProviderId: string;
    IsOpenAccess: boolean;
    IsPubliclyVisible?: boolean;
    IsPublished?: boolean;
  };
  PricingAndRequirementsInfo: {
    ReferralIsRequired: boolean;
    ReferralNotes?: string;
    Price: string;
    FoodIsIncluded: number;
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
    AcceptsHousingBenefit?: number;
    AcceptsPets?: number;
    AcceptsCouples?: number;
    HasDisabledAccess?: number;
    IsSuitableForWomen?: number;
    IsSuitableForYoungPeople?: number;
    HasSingleRooms?: number;
    HasSharedRooms?: number;
    HasShowerBathroomFacilities?: number;
    HasAccessToKitchen?: number;
    HasLaundryFacilities?: number;
    HasLounge?: number;
    AllowsVisitors?: number;
    HasOnSiteManager?: number;
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
    HasOnSiteManager?: number;
    SupportOffered?: string[];
    SupportInfo?: string;
  };
}