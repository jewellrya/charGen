// apps/web/src/lib/image.ts
export function dataURLToBuffer(dataURL: string): Buffer {
  const [head, body] = dataURL.split(',');
  if (!head || !body) throw new Error('Invalid dataURL');
  return Buffer.from(body, 'base64');
}