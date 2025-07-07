import { fetcher } from 'src/lib/axios';

export async function sendToVisionAPI(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  // Remove data:image/jpeg;base64, prefix
  const base64Data = base64.split(',')[1];
  
  const data = await fetcher([
    '/api/ocr/vision',
    {
      method: 'POST',
      data: { image: base64Data },
    },
  ]);
  
  return data.text;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 