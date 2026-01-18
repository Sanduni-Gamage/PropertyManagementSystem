import type { Property } from '../types/Property';
import type { PropertyFormData } from '../pages/Landlord/Properties/AddProperty';

export function convertToFormFormat(property: Property): PropertyFormData {
  const media = property.media?.map((m) => ({
    id: m.id,
    url: m.url,
    // Ensure mediaType is either "image" or "video"
    mediaType: (m.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
  })) ?? [];



  return {
    id: property.id, 
    address: property.address || '',
    suburbId: property.suburb?.id ?? 0,
    propertyType: property.propertyType ?? 0,
    availableDate: property.availableDate
      ? new Date(property.availableDate).toISOString().split('T')[0]
      : '',

    name: property.name || '',
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    parkingSpaces: property.parkingSpaces ?? 0,
    features: property.features ?? 0,
    petsAllowed: property.petsAllowed ?? false,
    rentAmount: property.rentAmount ?? 0,

    latitude: property.latitude ?? 0,          
    longitude: property.longitude ?? 0,        

    furnishings: property.furnishings || '',
    maximumTenants: property.maximumTenants ?? 0,
    broadband: property.broadband ?? 0,
    smokeAlarm: property.smokeAlarm ?? false,
    description: property.description || '', 

    images: [],
    video: null,

    media: media,
    imageUrls: property.media?.filter(m => m.mediaType === 'image').map(m => m.url) ?? [],
    videoUrl: property.media?.find(m => m.mediaType === 'video')?.url ?? '',
  };
}
