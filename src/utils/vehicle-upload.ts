import type { VehicleSection } from 'src/sections/management/vehicle/components/vehicle-diagram';

import { fetcher, endpoints } from 'src/lib/axios';

interface UploadVehiclePictureParams {
  file: File;
  vehicleId: string;
  section: VehicleSection;
  note?: string;
}

/**
 * Upload a vehicle picture to Cloudinary with proper folder structure
 * @param params - Upload parameters
 * @returns Promise<string> - The secure URL of the uploaded picture
 */
export const uploadVehiclePicture = async ({
  file,
  vehicleId,
  section,
  note,
}: UploadVehiclePictureParams): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomId = Math.random().toString(36).substr(2, 9);
  const fileName = `${section}_${vehicleId}_${timestamp}_${randomId}`;
  const folder = `vehicles/${vehicleId}/${section}`;
  const public_id = fileName; // Just the filename, folder parameter handles the path

  const queryParams: Record<string, string> = {
    public_id,
    timestamp: timestamp.toString(),
    folder,
    action: 'upload',
  };

  // Add context parameter if note is provided
  if (note) {
    queryParams.context = `note=${note}`;
  }

  const query = new URLSearchParams(queryParams).toString();

  // Get signature from backend
  const { signature, api_key, cloud_name } = await fetcher([
    `${endpoints.cloudinary.upload}/signature?${query}`,
    { method: 'GET' },
  ]);

  // Upload file with signed params
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('public_id', public_id);
  formData.append('folder', folder);
  formData.append('overwrite', 'true');

  // Add note as metadata if provided
  if (note) {
    formData.append('context', `note=${note}`);
  }

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

  const uploadRes = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
  }

  // Save picture record to database
  try {
    await fetcher([
      endpoints.management.vehiclePictures,
      {
        method: 'POST',
        data: {
          vehicle_id: vehicleId,
          section,
          url: uploadData.secure_url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          note,
          cloudinary_public_id: uploadData.public_id, // Use the actual public_id from Cloudinary response
        },
      },
    ]);
  } catch (dbError) {
    console.error('❌ Failed to save picture to database:', dbError);
    // Don't throw error here as the file was uploaded successfully to Cloudinary
  }

  return uploadData.secure_url;
};

/**
 * Delete a vehicle picture from Cloudinary and database
 * @param pictureId - The picture ID in the database
 * @returns Promise<void>
 */
export const deleteVehiclePicture = async (pictureId: string): Promise<void> => {
  // Call the backend delete endpoint directly
  // The backend will handle getting the picture details and deleting from both Cloudinary and database
  const response = await fetcher([
    `${endpoints.management.vehiclePictures}/${pictureId}`,
    { method: 'DELETE' },
  ]);

  if (!response.success) {
    console.error('❌ Delete response:', response);
    throw new Error(response.error || 'Failed to delete picture');
  }
};
