import { CONFIG } from 'src/global-config';

export async function sendToVisionAPI(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  // Remove data:image/jpeg;base64, prefix
  const base64Data = base64.split(',')[1];
  const response = await fetch(`${CONFIG.serverUrl}/api/ocr/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Data }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Vision OCR failed');
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