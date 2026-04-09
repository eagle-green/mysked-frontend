import { fetcher, endpoints } from 'src/lib/axios';

/** Upload incident image to Cloudinary (folder: incidents/{incidentReportId}) */
export async function uploadIncidentImageToCloudinary(
  file: File,
  incidentFolderId: string
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const public_id = fileName;
  const folder = `incidents/${incidentFolderId}`;

  const query = new URLSearchParams({
    public_id,
    timestamp: timestamp.toString(),
    folder,
    action: 'upload',
  }).toString();

  const { signature, api_key, cloud_name } = await fetcher([
    `${endpoints.cloudinary.upload}/signature?${query}`,
    { method: 'GET' },
  ]);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('public_id', public_id);
  formData.append('overwrite', 'true');
  formData.append('folder', folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
  const uploadRes = await fetch(cloudinaryUrl, { method: 'POST', body: formData });
  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
  }
  return uploadData.secure_url;
}
