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

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return {
      url: urlData.publicUrl,
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
 * Get public URL for a file
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
      result.hiring_package = hiringPackageFiles
        .filter((file) => file.name !== '.emptyFolderPlaceholder')
        .map((file) => {
          const path = `users/${userId}/hiring_package/${file.name}`;
          return {
            id: path,
            url: getPublicUrl(path),
            name: file.name,
            uploadedAt: new Date(file.created_at || Date.now()),
            fileSize: file.metadata?.size,
          };
        });
    }

    // List files in other_documents folder
    const { data: otherDocsFiles, error: otherError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`users/${userId}/other_documents`);

    if (!otherError && otherDocsFiles) {
      result.other_documents = otherDocsFiles
        .filter((file) => file.name !== '.emptyFolderPlaceholder')
        .map((file) => {
          const path = `users/${userId}/other_documents/${file.name}`;
          
          // Parse document type from filename
          // Format: {timestamp}___{documentType}___{originalFileName}
          let documentType: string | undefined;
          const parts = file.name.split('___');
          if (parts.length === 3) {
            // Document type is encoded in filename
            documentType = parts[1].replace(/_/g, ' ');
          }
          
          return {
            id: path,
            url: getPublicUrl(path),
            name: file.name,
            uploadedAt: new Date(file.created_at || Date.now()),
            fileSize: file.metadata?.size,
            documentType,
          };
        });
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

