import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

export type BackendAssetType = 'hiring_package' | 'other_documents';

// ----------------------------------------------------------------------

interface UploadPdfParams {
  file: File;
  userId: string;
  assetType: BackendAssetType;
  documentType?: string; // For other_documents
}

interface UploadPdfResult {
  url: string;
  path: string;
  publicId: string; // For consistency with existing interface
}

/**
 * Upload a PDF file via backend API
 */
export const uploadPdfViaBackend = async ({
  file,
  userId,
  assetType,
  documentType,
}: UploadPdfParams): Promise<UploadPdfResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('assetType', assetType);
    
    if (documentType) {
      formData.append('documentType', documentType);
    }

    const response = await axios.post('/api/upload/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        url: response.data.data.url,
        path: response.data.data.path,
        publicId: response.data.data.publicId,
      };
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading PDF via backend:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

interface UploadTmpPdfParams {
  file: File;
  tmpId: string;
}

interface UploadTmpPdfResult {
  url: string;
  path: string;
}

/**
 * Upload a TMP PDF file via backend API
 */
export const uploadTmpPdfViaBackend = async ({
  file,
  tmpId,
}: UploadTmpPdfParams): Promise<UploadTmpPdfResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tmpId', tmpId);

    const response = await axios.post('/api/upload/tmp-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        url: response.data.data.url,
        path: response.data.data.path,
      };
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading TMP PDF via backend:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

/**
 * Get signed URL for existing file via backend API
 */
export const getSignedUrlViaBackend = async (
  path: string,
  bucket: 'user-documents' | 'tmp-pdfs' = 'user-documents'
): Promise<string> => {
  try {
    const response = await axios.get('/api/upload/signed-url', {
      params: { path, bucket },
    });

    if (response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error('Failed to get signed URL');
    }
  } catch (error) {
    console.error('Error getting signed URL via backend:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

/**
 * Delete file via backend API
 */
export const deleteFileViaBackend = async (
  path: string,
  bucket: 'user-documents' | 'tmp-pdfs' = 'user-documents'
): Promise<void> => {
  try {
    const response = await axios.delete('/api/upload/file', {
      data: { path, bucket },
    });

    if (!response.data.success) {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.error('Error deleting file via backend:', error);
    throw error;
  }
};

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

export const listUserFilesViaBackend = async (userId: string): Promise<ListFilesResult> => {
  try {
    const response = await axios.get(`/api/upload/list/${userId}`);

    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to list files via backend');
  } catch (error) {
    console.error('Error listing files via backend:', error);
    throw error;
  }
};
