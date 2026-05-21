export type ProcessedProofImage = {
  dataUrl: string;
  width: number;
  height: number;
};

export const DEFAULT_PROOF_IMAGE_OPTIONS = {
  maxDimension: 1200,
  quality: 0.7,
  maxFileSizeBytes: 20 * 1024 * 1024,
};

export function validateProofImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'กรุณาเลือกไฟล์รูปภาพ';
  if (file.size > DEFAULT_PROOF_IMAGE_OPTIONS.maxFileSizeBytes) return 'ไฟล์รูปภาพใหญ่เกินไป (สูงสุด 20MB)';
  return null;
}

function scaleDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) return { width, height };
  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function canvasToJpegDataUrl(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options = DEFAULT_PROOF_IMAGE_OPTIONS,
): ProcessedProofImage {
  const { width, height } = scaleDimensions(sourceWidth, sourceHeight, options.maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
  ctx.drawImage(source, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', options.quality),
    width,
    height,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้ กรุณาเลือกไฟล์อื่น'));
    img.onload = () => resolve(img);
    img.src = src;
  });
}

export async function processProofImageFile(file: File): Promise<ProcessedProofImage> {
  const validationError = validateProofImageFile(file);
  if (validationError) throw new Error(validationError);

  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        return canvasToJpegDataUrl(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    } catch {
      // Fall back to FileReader + Image for browsers with partial createImageBitmap support.
    }
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  return canvasToJpegDataUrl(image, image.naturalWidth || image.width, image.naturalHeight || image.height);
}

