/**
 * Client-side resize + compress, so a phone-camera photo (often 3-8 MB) fits
 * comfortably inside a single Firestore document (1 MiB cap, ~33% base64
 * overhead) instead of needing Firebase Storage.
 */
const MAX_DIMENSION = 1280
const TARGET_BYTES = 700_000
const MIN_QUALITY = 0.35

export async function compressImageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Браузърът не поддържа обработка на изображения.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  let quality = 0.8
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > TARGET_BYTES && quality > MIN_QUALITY) {
    quality -= 0.1
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  if (dataUrl.length > TARGET_BYTES) {
    throw new Error('Снимката е твърде голяма дори след компресиране. Опитайте с друга снимка.')
  }
  return dataUrl
}
