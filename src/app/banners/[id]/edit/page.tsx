// TODO: refactor it later
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
// import { BannerPreview } from '@/components/banners/BannerPreview';
// import RoleGuard from '@/components/auth/RoleGuard';
// import { Button } from '@/components/ui/Button';
// import Link from 'next/link';
// import { IBanner, IMediaAsset } from '@/types';

// export default function EditBannerPage() {
//   const router = useRouter();
//   const params = useParams();
//   const bannerId = params.id as string;
  
//   const [bannerData, setBannerData] = useState<IBannerFormData | null>(null);
//   const [originalData, setOriginalData] = useState<IBannerFormData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!bannerId) return;
//     try {
//       const raw = sessionStorage.getItem('editBannerPrefill');
//       debugger
//       if (raw) {
//         const parsed = JSON.parse(raw) as IBanner;
//         if (parsed && parsed._id && String(parsed._id) === String(bannerId)) {
//           const formData = convertApiDataToFormData(parsed);
//           setBannerData(formData);
//           setOriginalData(formData);
//           try { sessionStorage.removeItem('editBannerPrefill'); } catch {}
//           setLoading(false);
//           return; // Skip fetch; we have prefilled data
//         }
//       }
//     } catch (e) {
//       // Ignore storage errors and fall back to fetch
//       console.log(e);
//     }
//     fetchBanner();
//   }, [bannerId]);

//   // Convert API banner data to form data format
//   const convertApiDataToFormData = (apiData: IBanner): IBannerFormData => {
//     return {
//       ...apiData,
//       // Convert IMediaAsset to MediaField (keep as IMediaAsset for existing files)
//       Logo: apiData.Logo || null,
//       BackgroundImage: apiData.BackgroundImage || null,
//       SplitImage: apiData.SplitImage || null,
//       PartnerLogos: apiData.PartnerLogos || [],
//     };
//   };

//   const fetchBanner = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/banners/${bannerId}`);
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch banner');
//       }
      
//       const result = await response.json();
//       if (result.success) {
//         const formData = convertApiDataToFormData(result.data);
//         setBannerData(formData);
//         setOriginalData(formData);
//       } else {
//         throw new Error(result.message || 'Failed to fetch banner');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch banner');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setBannerData(originalData);
//   };

//   const handleSave = async (data: IBannerFormData) => {
//     try {
//       setSaving(true);
//       setError(null);

//       const formData = new FormData();
      
//       // Add text fields
//       Object.keys(data).forEach(key => {
//         const typedKey = key as keyof IBannerFormData;
//         const value = data[typedKey];
        
//         if (key === 'Logo' || key === 'BackgroundImage' || key === 'SplitImage' || key === 'PartnerLogos') {
//           // Handle file uploads separately
//           if (value instanceof File) {
//             // Single new file
//             formData.append(`new_${key}`, value);
//           } else if (Array.isArray(value) && key === 'PartnerLogos') {
//             // Handle multiple files (PartnerLogos) - separate existing from new
//             const existingAssets: IMediaAsset[] = [];
//             let newFileIndex = 0;
            
//             (value as (File | IMediaAsset)[]).forEach((item) => {
//               if (item instanceof File) {
//                 formData.append(`new_${key}`, item);
//                 newFileIndex++;
//               } else if (item && 'Url' in item) {
//                 existingAssets.push(item as IMediaAsset);
//               }
//             });
            
//             // Send existing assets as JSON
//             if (existingAssets.length > 0) {
//               formData.append(`existing_${key}`, JSON.stringify(existingAssets));
//             }
//           } else if (value && typeof value === 'object' && 'Url' in value) {
//             // Single existing asset - keep reference
//             formData.append(`existing_${key}`, JSON.stringify(value));
//           }
//         } else if (typeof value === 'object' && value !== null) {
//           formData.append(key, JSON.stringify(value));
//         } else if (value !== undefined) {
//           formData.append(key, String(value));
//         }
//       });

//       const response = await fetch(`/api/banners/${bannerId}`, {
//         method: 'PUT',
//         body: formData
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to update banner');
//       }

//       const result = await response.json();
//       router.push(`/banners/${result.data._id}`);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An error occurred');
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
//         <div className="page-container section-spacing flex items-center justify-center min-h-screen">
//           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
//         </div>
//       </RoleGuard>
//     );
//   }

//   if (error && !bannerData) {
//     return (
//       <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
//         <div className="page-container section-spacing flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <h1 className="heading-2 mb-4">Error</h1>
//             <p className="text-body mb-4">{error}</p>
//             <Link href="/banners">
//               <Button>Back to Banners</Button>
//             </Link>
//           </div>
//         </div>
//       </RoleGuard>
//     );
//   }

//   return (
//     <RoleGuard requiredPage="/banners">
//       <div className="min-h-screen bg-brand-q">
//         <div className="nav-container">
//           <div className="page-container">
//             <div className="flex items-center justify-between h-16">
//               <div className="flex items-center space-x-4">
//                 <h1 className="heading-4">
//                   Edit Banner
//                 </h1>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="page-container section-spacing">
//           {error && (
//             <div className="mb-6 card card-compact border-brand-g bg-red-50">
//               <div className="flex">
//                 <div className="ml-3">
//                   <h3 className="text-small font-medium text-brand-g">Error</h3>
//                   <div className="mt-2 text-small text-brand-g">{error}</div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Full-width Preview at Top */}
//           <div className="mb-8">
//             <BannerPreview data={bannerData} />
//           </div>

//           <div className="space-y-6">
//             <BannerEditor
//               initialData={bannerData || {}}
//               onDataChange={setBannerData}
//               onSave={handleSave}
//               saving={saving}
//               onCancel={() => router.push(`/banners/${bannerId}`)}
//             />
//           </div>
//         </div>
//       </div>
//     </RoleGuard>
//   );
// }

