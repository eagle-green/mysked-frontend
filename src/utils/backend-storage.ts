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

// ----------------------------------------------------------------------

interface UploadIncidentReportPdfParams {
  file: File;
  incidentReportId: string;
}

interface UploadIncidentReportPdfResult {
  url: string;
  path: string;
}

/**
 * Upload incident report PDF via backend API (Supabase bucket: incident-report)
 */
export const uploadIncidentReportPdfViaBackend = async ({
  file,
  incidentReportId,
}: UploadIncidentReportPdfParams): Promise<UploadIncidentReportPdfResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('incidentReportId', incidentReportId);

    const response = await axios.post('/api/upload/incident-report-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        url: response.data.data.url,
        path: response.data.data.path,
      };
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Error uploading incident report PDF via backend:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

/** Category folder names for attendance conduct report uploads (Supabase + Cloudinary). */
export const ATTENDANCE_CONDUCT_UPLOAD_CATEGORIES = [
  'unauthorized_driving',
  'driving_infractions',
  'verbal_warnings_write_up',
] as const;
export type AttendanceConductUploadCategory = (typeof ATTENDANCE_CONDUCT_UPLOAD_CATEGORIES)[number];

export interface UploadAttendanceConductReportParams {
  file: File;
  userId: string;
  category: AttendanceConductUploadCategory;
}

export interface UploadAttendanceConductReportResult {
  url: string;
  path: string;
  type: 'supabase' | 'cloudinary';
}

/**
 * Upload attendance conduct report file (image or PDF).
 * PDFs go to Supabase: users/{userId}/attendance_conduct_report/{category}/
 * Images go to Cloudinary: users/{userId}/{category}/
 */
export const uploadAttendanceConductReportViaBackend = async ({
  file,
  userId,
  category,
}: UploadAttendanceConductReportParams): Promise<UploadAttendanceConductReportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('category', category);

  const response = await axios.post('/api/upload/attendance-conduct-report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (response.data?.success && response.data?.data) {
    return {
      url: response.data.data.url,
      path: response.data.data.path,
      type: response.data.data.type || (file.type === 'application/pdf' ? 'supabase' : 'cloudinary'),
    };
  }
  throw new Error(response.data?.error || 'Upload failed');
};

// ----------------------------------------------------------------------

/**
 * Get signed URL for existing file via backend API
 */
export const getSignedUrlViaBackend = async (
  path: string,
  bucket: 'user-documents' | 'tmp-pdfs' | 'incident-report' = 'user-documents'
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
  bucket: 'user-documents' | 'tmp-pdfs' | 'incident-report' = 'user-documents'
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
