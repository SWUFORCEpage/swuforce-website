import { randomUUID } from 'node:crypto';
export const ARTICLE_IMAGE_BUCKET = 'swuforce-article-images';
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const formats = Object.freeze({
  'image/jpeg': { ext:'jpg', test: b => b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255 },
  'image/png': { ext:'png', test: b => b.length > 8 && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  'image/webp': { ext:'webp', test: b => b.length > 12 && b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP' },
});
export function verifyImageBuffer(bytes, declaredType) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 12 || bytes.length > MAX_IMAGE_BYTES) return null;
  const format = formats[declaredType];
  if (!format || !format.test(bytes)) return null;
  return { ext: format.ext, contentType: declaredType };
}
export function newArticleImagePath(ext, now = new Date()) {
  return `articles/${now.getUTCFullYear()}/${randomUUID()}.${ext}`;
}
