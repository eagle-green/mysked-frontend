export async function preprocessImageForOCR(input: Blob): Promise<Blob> {
  // Convert Blob to Image
  const imageUrl = URL.createObjectURL(input);
  const image = await loadImage(imageUrl);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Draw image
  ctx.drawImage(image, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Grayscale and contrast enhancement
  // Contrast factor: 1.5 (can be tweaked)
  const contrast = 1.5;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    // Contrast
    const v = contrast * avg + intercept;
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, v));
    // Alpha remains unchanged
  }
  ctx.putImageData(imageData, 0, 0);

  // Convert back to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else throw new Error('Failed to preprocess image');
    }, 'image/jpeg');
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
} 