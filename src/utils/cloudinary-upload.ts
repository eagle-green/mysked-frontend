import { fetcher, endpoints } from 'src/lib/axios';

export type AssetType = 'profile' | 'tcp_certification' | 'driver_license' | 'other_documents';

interface UploadAssetParams {
  file: File;
  userId: string;
  assetType: AssetType;
  customFileName?: string;
}

/**
 * Upload a user asset to Cloudinary with proper folder structure
 * @param params - Upload parameters
 * @returns Promise<string> - The secure URL of the uploaded asset
 */
export const uploadUserAsset = async ({
  file,
  userId,
  assetType,
  customFileName,
}: UploadAssetParams): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = customFileName || `${assetType}_${userId}`;
  const public_id = fileName;
  const folder = `users/${userId}`;
  


  const query = new URLSearchParams({
    public_id,
    timestamp: timestamp.toString(),
    folder,
    action: 'upload',
  }).toString();

  // Add resource_type for PDF uploads
  const isPdf = file.type === 'application/pdf';
  const queryWithResourceType = isPdf 
    ? query + '&resource_type=raw'
    : query;
  


  const { signature, api_key, cloud_name } = await fetcher([
    `${endpoints.cloudinary.upload}/signature?${queryWithResourceType}`,
    { method: 'GET' },
  ]);

  // Upload file with signed params
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('public_id', public_id);
  formData.append('overwrite', 'true');
  formData.append('folder', folder);

  // Add resource_type for PDF uploads to match the signature
  if (isPdf) {
    formData.append('resource_type', 'raw');
  }

  // Debug: Log FormData contents


  // Try raw upload for PDFs, fall back to image upload if it fails
  let uploadEndpoint = isPdf ? 'raw' : 'image';
  let cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${uploadEndpoint}/upload`;



  let uploadRes = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  let uploadData = await uploadRes.json();

  // If raw upload fails with 401, try image upload as fallback
  if (!uploadRes.ok && isPdf && uploadRes.status === 401) {

    
    // Get new signature for image upload (without resource_type=raw)
    const { signature: imageSignature } = await fetcher([
      `${endpoints.cloudinary.upload}/signature?${query}`,
      { method: 'GET' },
    ]);

    // Create new FormData without resource_type=raw
    const imageFormData = new FormData();
    imageFormData.append('file', file);
    imageFormData.append('api_key', api_key);
    imageFormData.append('timestamp', timestamp.toString());
    imageFormData.append('signature', imageSignature);
    imageFormData.append('public_id', public_id);
    imageFormData.append('overwrite', 'true');
    imageFormData.append('folder', folder);

    uploadEndpoint = 'image';
    cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${uploadEndpoint}/upload`;

    

    uploadRes = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: imageFormData,
    });

    uploadData = await uploadRes.json();
  }

  if (!uploadRes.ok) {
    console.error('Cloudinary upload failed:', uploadData);
    throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
  }



  return uploadData.secure_url;
};

/**
 * Delete a user asset from Cloudinary
 * @param userId - The user ID
 * @param assetType - The type of asset to delete
 * @param customFileName - Optional custom file name
 * @returns Promise<void>
 */
export const deleteUserAsset = async (
  userId: string,
  assetType: AssetType,
  customFileName?: string
): Promise<void> => {
  const fileName = customFileName || `${assetType}_${userId}`;
  const publicId = `users/${userId}/${fileName}`;



  const timestamp = Math.floor(Date.now() / 1000);

  const query = new URLSearchParams({
    public_id: publicId,
    timestamp: timestamp.toString(),
    action: 'destroy',
  }).toString();



  const { signature, api_key, cloud_name } = await fetcher([
    `${endpoints.cloudinary.upload}/signature?${query}`,
    { method: 'GET' },
  ]);



  const deleteUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`;

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);



  const res = await fetch(deleteUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();


  if (data.result !== 'ok') {
    throw new Error(data.result || 'Failed to delete from Cloudinary');
  }
};

/**
 * Get the public ID for a user asset
 * @param userId - The user ID
 * @param assetType - The type of asset
 * @param customFileName - Optional custom file name
 * @returns string - The public ID
 */
export const getUserAssetPublicId = (
  userId: string,
  assetType: AssetType,
  customFileName?: string
): string => {
  const fileName = customFileName || `${assetType}_${userId}`;
  return `users/${userId}/${fileName}`;
};

/**
 * Check if a URL is a valid Cloudinary URL
 * @param url - The URL to check
 * @returns boolean - True if it's a valid Cloudinary URL
 */
export const isCloudinaryUrl = (url: string | null | undefined): boolean =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

/**
 * Delete all assets for a user from Cloudinary
 * @param userId - The user ID
 * @returns Promise<{deletedAssets: string[], failedAssets: string[], totalDeleted: number, totalFailed: number}>
 */
export const deleteAllUserAssets = async (userId: string) => {
  const response = await fetcher([
    `${endpoints.cloudinary.deleteUserAssets}/${userId}`,
    { method: 'DELETE' },
  ]);
  
  return response;
};

/**
 * Clean up placeholder files for a user
 * @param userId - The user ID
 * @returns Promise<{message: string, deletedFile: string}>
 */
export const cleanupPlaceholderFiles = async (userId: string) => {
  const response = await fetcher([
    `${endpoints.cloudinary.cleanupPlaceholder}/${userId}`,
    { method: 'DELETE' },
  ]);
  
  return response;
};

/**
 * Create client folder structure in Cloudinary
 * @param clientId - The client ID
 * @returns Promise<{message: string, folder: string}>
 */
export const createClientFolder = async (clientId: string) => {
  const response = await fetcher([
    `${endpoints.cloudinary}/create-client-folder/${clientId}`,
    { method: 'POST' },
  ]);
  
  return response;
}; 