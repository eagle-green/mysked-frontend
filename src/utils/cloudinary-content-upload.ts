/**
 * Upload editor content images to Cloudinary and replace data URLs in HTML.
 * Used when deferring upload (e.g. announcement create): after create we have id,
 * upload each data:image to announcements/{id}, then update content.
 */

import { fetcher , endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

function dataURLToFile(dataUrl: string, filename = 'image.png'): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const ext = mime.split('/')[1] ?? 'png';
  const bstr = atob(base64);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i += 1) u8[i] = bstr.charCodeAt(i);
  return new File([u8], filename.replace(/\.[^.]+$/, `.${ext}`), { type: mime });
}

export async function uploadFileToCloudinaryFolder(file: File, folder: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const public_id = fileName;

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
  const res = await fetch(cloudinaryUrl, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Image upload failed');
  return data.secure_url;
}

export async function uploadDataUrlToCloudinaryFolder(
  dataUrl: string,
  folder: string,
  index: number
): Promise<string> {
  const file = dataURLToFile(dataUrl, `image-${index}.png`);
  return uploadFileToCloudinaryFolder(file, folder);
}

/**
 * Find all data:image src in HTML content, upload each to Cloudinary folder,
 * return new content with data URLs replaced by Cloudinary URLs.
 */
export async function replaceDataUrlsInContentWithCloudinary(
  content: string,
  folder: string
): Promise<string> {
  const dataUrlRegex = /src="(data:image\/[^"]+)"/g;
  const matches = [...content.matchAll(dataUrlRegex)];
  if (matches.length === 0) return content;

  const dataUrls = matches.map((m) => m[1]);
  const unique = [...new Set(dataUrls)];
  const urlByDataUrl: Record<string, string> = {};
  for (let i = 0; i < unique.length; i += 1) {
    urlByDataUrl[unique[i]] = await uploadDataUrlToCloudinaryFolder(unique[i], folder, i);
  }

  let newContent = content;
  for (const [dataUrl, url] of Object.entries(urlByDataUrl)) {
    newContent = newContent.split(dataUrl).join(url);
  }
  return newContent;
}
