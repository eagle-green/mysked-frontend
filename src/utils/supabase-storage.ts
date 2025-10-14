import { CONFIG } from 'src/global-config';
import { supabase } from 'src/lib/supabase-client';

// ----------------------------------------------------------------------

const BUCKET_NAME = 'user-documents';

export type SupabaseAssetType = 'hiring_package' | 'other_documents';

// ----------------------------------------------------------------------

interface UploadPdfParams {
  file: File;
  userId: string;
  assetType: SupabaseAssetType;
  documentType?: string; // For other_documents
}

interface UploadPdfResult {
  url: string;
  path: string;
  publicId: string; // For consistency with Cloudinary interface
}

/**
 * Upload a PDF file to Supabase Storage
 */
export const uploadPdfToSupabase = async ({
  file,
  userId,
  assetType,
  documentType,
}: UploadPdfParams): Promise<UploadPdfResult> => {
  try {
    // Generate file path with document type encoded
    // Format: users/{userId}/{assetType}/{timestamp}___{documentType}___{originalFileName}
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    
    let finalFileName: string;
    if (documentType && assetType === 'other_documents') {
      // Encode document type in filename using triple underscore as separator
      const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9-]/g, '_');
      finalFileName = `${timestamp}___${sanitizedDocType}___${fileName}`;
    } else {
      finalFileName = `${timestamp}_${fileName}`;
    }
    
    const filePath = `users/${userId}/${assetType}/${finalFileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get SIGNED URL for private bucket (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL:', signedUrlError);
      throw new Error('Failed to create signed URL');
    }

    return {
      url: signedUrlData.signedUrl,
      path: data.path,
      publicId: data.path, // Use path as publicId for consistency
    };
  } catch (error) {
    console.error('Error uploading PDF to Supabase:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

interface DeletePdfParams {
  path: string;
}

/**
 * Delete a PDF file from Supabase Storage
 */
export const deletePdfFromSupabase = async ({ path }: DeletePdfParams): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting PDF from Supabase:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

/**
 * Get signed URL for a file (valid for 1 hour) - for private buckets
 */
export const getSignedUrl = async (path: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error);
      throw new Error('Failed to get signed URL');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

/**
 * Get public URL for a file (DEPRECATED - use getSignedUrl for private buckets)
 * @deprecated Use getSignedUrl instead for private buckets
 */
export const getPublicUrl = (path: string): string => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
};

// ----------------------------------------------------------------------

/**
 * Check if Supabase storage is configured
 */
export const isSupabaseConfigured = (): boolean => {
  const { url, key } = CONFIG.supabase;
  return Boolean(url && key && url !== '' && key !== '');
};

// ----------------------------------------------------------------------

interface ListFilesResult {
  hiring_package: Array<{
    id: string;
    url: string;
    name: string;
    uploadedAt: Date;
    fileSize?: number;
  }>;
  other_documents: Array<{
    id: string;
    url: string;
    name: string;
    uploadedAt: Date;
    fileSize?: number;
    documentType?: string;
  }>;
}

/**
 * List all PDF files for a user from Supabase Storage
 */
export const listUserPdfsFromSupabase = async (userId: string): Promise<ListFilesResult> => {
  try {
    const result: ListFilesResult = {
      hiring_package: [],
      other_documents: [],
    };

    // List files in hiring_package folder
    const { data: hiringPackageFiles, error: hiringError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`users/${userId}/hiring_package`);

    if (!hiringError && hiringPackageFiles) {
      // Get signed URLs for all files (async)
      const filePromises = hiringPackageFiles
        .filter((file) => file.name !== '.emptyFolderPlaceholder')
        .map(async (file) => {
          const path = `users/${userId}/hiring_package/${file.name}`;
          try {
            const signedUrl = await getSignedUrl(path);
            return {
              id: path,
              url: signedUrl,
              name: file.name,
              uploadedAt: new Date(file.created_at || Date.now()),
              fileSize: file.metadata?.size,
            };
          } catch (error) {
            console.error(`Failed to get signed URL for ${path}:`, error);
            return null;
          }
        });
      
      const files = await Promise.all(filePromises);
      result.hiring_package = files.filter((f) => f !== null) as typeof result.hiring_package;
    }

    // List files in other_documents folder
    const { data: otherDocsFiles, error: otherError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`users/${userId}/other_documents`);

    if (!otherError && otherDocsFiles) {
      // Get signed URLs for all files (async)
      const filePromises = otherDocsFiles
        .filter((file) => file.name !== '.emptyFolderPlaceholder')
        .map(async (file) => {
          const path = `users/${userId}/other_documents/${file.name}`;
          
          // Parse document type from filename
          // Format: {timestamp}___{documentType}___{originalFileName}
          let documentType: string | undefined;
          const parts = file.name.split('___');
          if (parts.length === 3) {
            // Document type is encoded in filename
            documentType = parts[1].replace(/_/g, ' ');
          }
          
          try {
            const signedUrl = await getSignedUrl(path);
            return {
              id: path,
              url: signedUrl,
              name: file.name,
              uploadedAt: new Date(file.created_at || Date.now()),
              fileSize: file.metadata?.size,
              documentType,
            };
          } catch (error) {
            console.error(`Failed to get signed URL for ${path}:`, error);
            return null;
          }
        });
      
      const files = await Promise.all(filePromises);
      result.other_documents = files.filter((f) => f !== null) as typeof result.other_documents;
    }

    return result;
  } catch (error) {
    console.error('Error listing PDFs from Supabase:', error);
    return {
      hiring_package: [],
      other_documents: [],
    };
  }
};

