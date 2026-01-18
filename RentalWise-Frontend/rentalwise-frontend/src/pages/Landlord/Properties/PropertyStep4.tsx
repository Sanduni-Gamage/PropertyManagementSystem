import { useState, useEffect } from 'react';
import type { PropertyFormData } from './AddProperty';
import api from '../../../services/api';
import { toast } from 'react-toastify';

type MediaItem = { id: number; url: string; mediaType: 'image' | 'video' };

type Props = {
  data: PropertyFormData;
  updateForm: (
    fields: Partial<PropertyFormData> | ((prev: PropertyFormData) => Partial<PropertyFormData>)
  ) => void;

  onBack: () => void;
  onSubmit: () => void;
};

export default function PropertyStep4({ data, updateForm, onBack, onSubmit }: Props) {
  const [imageFiles, setImageFiles] = useState<File[]>([]); // New image files for upload
  const [videoFile, setVideoFile] = useState<File | null>(null); // New video file for upload
  const [uploading, setUploading] = useState(false);
  const [removedMediaIds, setRemovedMediaIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  // Existing images (media of type image)
  const existingImages = data.media?.filter((m) => m.mediaType === 'image') || [];

  // Cleanup object URLs when imageFiles change or component unmounts
  useEffect(() => {
    return () => {
      imageFiles.forEach((file) => URL.revokeObjectURL(file as any));
    };
  }, [imageFiles]);

  // Load existing video as a File object for preview if needed
  useEffect(() => {
    if (!videoFile && data.videoUrl) {
      fetch(data.videoUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'video.mp4', { type: blob.type });
          setVideoFile(file);
        });
    }
  }, [data.videoUrl, videoFile]);

  // Handle selection of new image files
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const total = imageFiles.length + newFiles.length + existingImages.length;

    if (total > 20) {
      setError('You can upload up to 20 images.');
      return;
    }

    setImageFiles((prev) => [...prev, ...newFiles]);
    setError('');
  };

  // Handle selection of new video file
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    updateForm({ video: file });
    setError('');
  };

  // Remove existing media (image or video) by id
  const handleRemoveExistingMedia = (media: MediaItem) => {
    setRemovedMediaIds((prev) => [...prev, media.id]);

    updateForm((prevData) => ({
      ...prevData,
      media: prevData.media?.filter((m) => m.id !== media.id),
      imageUrls: media.mediaType === 'image'
        ? prevData.imageUrls?.filter((url) => url !== media.url)
        : prevData.imageUrls,
      videoUrl: media.mediaType === 'video' && prevData.videoUrl === media.url ? '' : prevData.videoUrl,
    }));

    // If removing existing video, also clear local video preview
    if (media.mediaType === 'video') {
      setVideoFile(null);
      updateForm({ video: null });
    }
  };

  // Remove newly added image file by index
  const handleRemoveNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove newly added video file
  const handleRemoveNewVideo = () => {
    setVideoFile(null);
    updateForm({ video: null });
  };

  // Handle form submission (upload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();

      // Append all required fields matching backend DTO keys exactly
      formData.append('Name', data.name);
      formData.append('Address', data.address);
      formData.append('SuburbId', data.suburbId.toString());
      formData.append('RentAmount', data.rentAmount.toString());
      formData.append('Bedrooms', data.bedrooms.toString());
      formData.append('Bathrooms', data.bathrooms.toString());
      formData.append('ParkingSpaces', data.parkingSpaces.toString());
      formData.append('PropertyType', data.propertyType.toString());
      formData.append('Features', data.features.toString());
      formData.append('PetsAllowed', data.petsAllowed.toString());
      // Use date only (YYYY-MM-DD) format, adjust as needed for your backend
      formData.append('AvailableDate', new Date(data.availableDate).toISOString().split('T')[0]);
      formData.append('Furnishings', data.furnishings);
      formData.append('MaximumTenants', data.maximumTenants.toString());
      formData.append('Broadband', data.broadband.toString());
      formData.append('SmokeAlarm', data.smokeAlarm.toString());
      formData.append('Description', data.description); 
      // Add coordinates if present
  if (data.latitude !== undefined && data.longitude !== undefined) {
      formData.append('Latitude', data.latitude.toString());
      formData.append('Longitude', data.longitude.toString());
      }

      // Append new images
      imageFiles.forEach((file) => formData.append('Images', file));

      // Append video if present
      if (videoFile) {
        formData.append('Video', videoFile);
      }

      // Append removed media IDs so backend can delete
      if (data.id) {
        // Only on update
        removedMediaIds.forEach((id) => formData.append('RemovedMediaIds', id.toString()));
      }
      console.log("=== FormData Debug ===");
for (let [key, val] of formData.entries()) {
  console.log(key, val);
}
      let response;
      if (data.id) {
        response = await api.put(`/Properties/${data.id}`, formData);
      } else {
        response = await api.post('/Properties', formData);
      }

      if (response.status >= 200 && response.status < 300) {
        const result = response.data;

        // Update form with latest media URLs from backend
        updateForm({
          media: result.media,
          imageUrls: result.media?.filter((m: any) => m.mediaType === 'image').map((m: any) => m.url) || [],
          videoUrl: result.media?.find((m: any) => m.mediaType === 'video')?.url || '',
        });
        
        // Reset local file states
        setImageFiles([]);
        setVideoFile(null);
        setRemovedMediaIds([]);

        onSubmit();
        toast.success(data.id ? 'Property updated successfully!' : 'Property added successfully!');
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      <h3 className="text-xl font-semibold">Step 3: Media Upload</h3>

      {/* Image Upload Section */}
      <div>
        <label className="block font-medium mb-1">Upload Images (max 20)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border p-2 rounded"
          disabled={uploading}
        />

        {/* Preview newly selected images */}
        <div className="mt-2 grid grid-cols-4 gap-2 relative">
          {imageFiles.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index}`}
                className="w-full h-24 object-cover rounded"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                onClick={() => handleRemoveNewImage(index)}
                aria-label={`Remove new image ${index}`}
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Existing images preview with remove buttons */}
      {existingImages.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {existingImages.map((media) => (
            <div key={media.id} className="relative">
              <img
                src={media.url}
                alt="Existing image"
                className="w-full h-24 object-cover rounded"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                onClick={() => handleRemoveExistingMedia(media)}
                aria-label="Remove existing image"
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video Upload Section */}
      <div>
        <label className="block font-medium mb-1">Upload Video (optional)</label>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          className="w-full border p-2 rounded"
          disabled={uploading}
        />
        {videoFile && (
          <div className="relative mt-2 w-full max-h-64 rounded">
            <video controls src={URL.createObjectURL(videoFile)} className="w-full max-h-64 rounded" />
            <button
              type="button"
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
              onClick={handleRemoveNewVideo}
              aria-label="Remove video"
              disabled={uploading}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Existing video preview */}
      {data.videoUrl && !videoFile && (
        <div className="mt-4">
          <label className="block font-medium">Existing Video</label>
          <video controls className="w-full max-h-64 rounded" src={data.videoUrl} />
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-600">{error}</p>}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-100"
          disabled={uploading}
        >
          Back
        </button>
        
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : data.id ? 'Update Property' : 'Add Property'}
        </button>
      </div>
    </form>
  );
}
